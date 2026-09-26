import { createHash } from "node:crypto";

const workflowStates = [
  "INTAKE",
  "CONTEXT_LOCKED",
  "PLANNED",
  "DRAFTED",
  "CHANNEL_ADAPTED",
  "QA1_REVIEW",
  "QA2_REVIEW",
  "WAITING_APPROVAL",
  "READY_TO_APPLY",
  "APPLIED",
  "MONITORING",
  "REPORTED",
  "ARCHIVED",
  "REJECTED",
  "BLOCKED",
  "FAILED"
];

const workflowTypes = ["catalog", "content", "insight", "report", "schedule"];
const externalApplyEvents = new Set(["apply", "publish", "price_write", "stock_write", "order_write"]);

const transitions = Object.freeze({
  INTAKE: { lock_context: "CONTEXT_LOCKED", reject: "REJECTED" },
  CONTEXT_LOCKED: { plan: "PLANNED", reject: "REJECTED" },
  PLANNED: { draft: "DRAFTED", reject: "REJECTED" },
  DRAFTED: { adapt_channel: "CHANNEL_ADAPTED", reject: "REJECTED" },
  CHANNEL_ADAPTED: { submit_qa1: "QA1_REVIEW", rework: "DRAFTED", reject: "REJECTED" },
  QA1_REVIEW: { qa1_pass: "QA2_REVIEW", qa1_rework: "DRAFTED", reject: "REJECTED" },
  QA2_REVIEW: { qa2_pass: "WAITING_APPROVAL", qa2_rework: "DRAFTED", reject: "REJECTED" },
  WAITING_APPROVAL: { approve: "READY_TO_APPLY", reject: "REJECTED", request_info: "CONTEXT_LOCKED" },
  READY_TO_APPLY: { archive: "ARCHIVED" },
  APPLIED: { monitor: "MONITORING" },
  MONITORING: { report: "REPORTED" },
  REPORTED: { archive: "ARCHIVED" }
});

const kCapabilities = Object.freeze([
  ["K01", "Brand and Commerce Context Registry", "draft"],
  ["K02", "Project Isolation and Own-Store Scope", "local_setup"],
  ["K03", "Omnichannel Repurposing", "draft"],
  ["K04", "AI Draft Studio", "draft"],
  ["K05", "Insight Hub", "read_only_pending_contract"],
  ["K06", "Stakeholder Reporting", "draft_only"],
  ["K07", "Plan Before Production", "draft"],
  ["K08", "Scheduled Operations", "read_or_draft_only"],
  ["K09", "Secure Connector Registry", "disabled_pending_contract"],
  ["K10", "Two-Pass Quality Gate", "local_check"],
  ["K11", "Human Authority and Decision Ledger", "human_required"],
  ["K12", "Repetitive Work Templates", "draft_only"],
  ["K13", "Evidence Learning Loop", "local_analysis"],
  ["K14", "Channel-Native Adaptation", "draft_only"],
  ["K15", "Unified Lifecycle Orchestration", "local_tracking"]
].map(([id, title, mode]) => Object.freeze({ id, title, mode })));

const blockedActions = Object.freeze([
  "seller_center_login_automation",
  "session_or_cookie_access",
  "api_or_webhook_call",
  "catalog_write",
  "price_write",
  "stock_write",
  "order_write",
  "customer_chat",
  "self_publish",
  "scheduled_external_run"
]);

function nowIso(options = {}) {
  const now = options.now || (() => new Date());
  return now().toISOString();
}

function asNonEmptyString(value, fieldName) {
  const normalized = String(value || "").trim();
  if (!normalized) throw new Error(`${fieldName}_required`);
  return normalized;
}

function sourceDataValue(value, key) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
    throw new Error("workflow_source_snapshot_invalid");
  }
  return descriptor.value;
}

function canonicalSource(value, depth = 0) {
  if (depth > 6) throw new Error("workflow_source_snapshot_invalid");
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    if (value.length > 100 || Object.getOwnPropertyNames(value).length !== value.length + 1 ||
        Object.getOwnPropertySymbols(value).length) throw new Error("workflow_source_snapshot_invalid");
    return Object.freeze(Array.from({ length: value.length }, (_, index) =>
      canonicalSource(sourceDataValue(value, String(index)), depth + 1)
    ));
  }
  if (!value || typeof value !== "object" ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
      Object.getOwnPropertyNames(value).length > 100 || Object.getOwnPropertySymbols(value).length) {
    throw new Error("workflow_source_snapshot_invalid");
  }
  return Object.freeze(Object.fromEntries(Object.getOwnPropertyNames(value).sort().map(
    key => [key, canonicalSource(sourceDataValue(value, key), depth + 1)]
  )));
}

function sourceSnapshot(value) {
  if (value === undefined) return null;
  try {
    if (!value || typeof value !== "object" || Array.isArray(value) || !Object.keys(value).length) {
      throw new Error("workflow_source_snapshot_invalid");
    }
    const snapshot = canonicalSource(value);
    if (Buffer.byteLength(JSON.stringify(snapshot), "utf8") > 8192) {
      throw new Error("workflow_source_snapshot_invalid");
    }
    return snapshot;
  } catch {
    throw new Error("workflow_source_snapshot_invalid");
  }
}

function reviewBinding(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || Array.isArray(value) ||
      typeof value.contextVersion !== "string" || !value.contextVersion.trim() ||
      typeof value.sourceHash !== "string" || !/^[a-f0-9]{64}$/.test(value.sourceHash)) {
    throw new Error("workflow_review_source_invalid");
  }
  return Object.freeze({ contextVersion: value.contextVersion, sourceHash: value.sourceHash });
}

function currentSource(workflow) {
  return Object.freeze({ contextVersion: workflow.contextVersion, sourceHash: workflow.sourceHash });
}

function sourceMatches(workflow, binding) {
  return binding.contextVersion === workflow.contextVersion && binding.sourceHash === workflow.sourceHash;
}

const sellerContextFields = Object.freeze([
  "schemaVersion", "sourceHost", "pageKind", "observedTableRowCount",
  "hasTable", "productControlsPresent", "capturedAt"
]);

function validSellerContext(context) {
  return context && typeof context === "object" && !Array.isArray(context) &&
    Object.keys(context).length === sellerContextFields.length &&
    Object.keys(context).every(key => sellerContextFields.includes(key)) &&
    context.schemaVersion === "seller-page-structure-v1" &&
    context.sourceHost === "seller.thaimart.com" &&
    ["product-list", "unclassified"].includes(context.pageKind) &&
    Number.isInteger(context.observedTableRowCount) && context.observedTableRowCount >= 0 &&
    context.observedTableRowCount <= 9999 && typeof context.hasTable === "boolean" &&
    typeof context.productControlsPresent === "boolean" && typeof context.capturedAt === "string";
}

function normalizeSellerContext(value, options, fresh) {
  if (value === undefined || (value === null && !fresh)) return null;
  const context = (() => {
    try { return canonicalSource(value); }
    catch { throw new Error("seller_page_context_invalid"); }
  })();
  if (!validSellerContext(context)) throw new Error("seller_page_context_invalid");
  const capturedMs = Date.parse(context.capturedAt);
  if (!Number.isFinite(capturedMs) || new Date(capturedMs).toISOString() !== context.capturedAt) {
    throw new Error("seller_page_context_invalid");
  }
  const age = new Date(nowIso(options)).getTime() - capturedMs;
  if (fresh && (age > 120000 || age < -5000)) throw new Error("seller_page_context_stale");
  return context;
}

function normalizeWorkflow(input = {}, options = {}, freshContext = false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("workflow_object_required");
  }

  const id = asNonEmptyString(input.id, "workflow_id");
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,80}$/.test(id)) {
    throw new Error("workflow_id_invalid");
  }

  const type = asNonEmptyString(input.type, "workflow_type");
  if (!workflowTypes.includes(type)) throw new Error("workflow_type_invalid");

  const state = asNonEmptyString(input.state || "INTAKE", "workflow_state");
  if (!workflowStates.includes(state)) throw new Error("workflow_state_invalid");

  const storeScope = String(input.storeScope || "own-store").trim();
  if (storeScope !== "own-store") throw new Error("own_store_scope_required");

  const snapshot = sourceSnapshot(input.sourceSnapshot === null && input.sourceVerification === "UNBOUND"
    ? undefined : input.sourceSnapshot);
  const sourceHash = snapshot === null ? null : createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  return Object.freeze({
    id, type, state, storeScope,
    contextVersion: String(input.contextVersion || "unbound").trim() || "unbound",
    sourceSnapshot: snapshot,
    sourceHash,
    sourceVerification: snapshot === null ? "UNBOUND" : "DECLARED_LOCAL_SNAPSHOT",
    reviewSource: reviewBinding(input.reviewSource),
    approvalSource: reviewBinding(input.approvalSource),
    sellerPageContext: normalizeSellerContext(input.sellerPageContext, options, freshContext)
  });
}

function localSafetyEnvelope() {
  return {
    externalWrites: false,
    productionWrites: false,
    customerVisible: false,
    canReadThaiMart: false,
    canWriteThaiMart: false,
    canExecuteExternally: false,
    canReadSecrets: false,
    requiresHumanApproval: true,
    adapterStatus: "disabled_pending_contract"
  };
}

export function getThaiMartWorkflowStatus(options = {}) {
  return {
    title: "ThaiMart K01-K15 Workflow Adapter",
    status: "disabled_pending_contract",
    mode: "local-workflow-and-dry-run-only",
    ownStoreOnly: true,
    integrationContract: {
      officialApi: "unknown",
      authMode: "unknown",
      webhookBehavior: "unknown",
      rateLimit: "unknown",
      reconciliation: "unknown",
      rollback: "unknown"
    },
    capabilities: kCapabilities,
    workflowStates,
    blockedActions,
    nextExactStep: "Obtain official ThaiMart API, auth, webhook, rate-limit, reconciliation, and rollback evidence before any connector activation.",
    ...localSafetyEnvelope(),
    updatedAt: nowIso(options)
  };
}

export function createThaiMartWorkflowDryRun(body = {}, options = {}) {
  const workflow = normalizeWorkflow({ ...body, state: "INTAKE", reviewSource: null, approvalSource: null }, options, true);

  return {
    title: "ThaiMart Workflow Dry-Run",
    status: "thaimart_workflow_dry_run_ready",
    mode: "local-only-dry-run",
    requestId: String(body.requestId || `thaimart-${workflow.id}`).trim(),
    workflow,
    nextAllowedEvents: Object.keys(transitions[workflow.state]),
    nextActions: [
      "Lock the product, content, or insight context without reading ThaiMart.",
      "Draft and quality-check locally before requesting human approval.",
      "Stop before any seller-center, API, webhook, price, stock, order, chat, or publish action."
    ],
    ...localSafetyEnvelope(),
    updatedAt: nowIso(options)
  };
}

function blockedExternalApply(workflow, event, options) {
  return {
    title: "ThaiMart Workflow External Apply Blocked",
    status: "thaimart_external_apply_blocked",
    mode: "local-only-dry-run",
    workflow: { ...workflow, state: "BLOCKED", blockedFromState: workflow.state },
    event,
    blockReason: "thaimart_connector_contract_unknown",
    nextActions: [
      "Keep the workflow local and collect the official connector contract.",
      "Do not automate Seller Center login or browser/session access.",
      "Request a separate approval packet only after read/write boundaries and rollback are evidenced."
    ],
    ...localSafetyEnvelope(),
    updatedAt: nowIso(options)
  };
}

function transitionResult(workflow, event, options, invalidated = false) {
  return {
    title: "ThaiMart Workflow Transition Dry-Run",
    status: invalidated ? "thaimart_workflow_review_invalidated" : "thaimart_workflow_transitioned",
    mode: "local-only-dry-run",
    workflow,
    event,
    nextAllowedEvents: Object.keys(transitions[workflow.state] || {}),
    ...localSafetyEnvelope(),
    updatedAt: nowIso(options)
  };
}

function reviewedTransition(workflow, event, nextState) {
  if (event === "submit_qa1") {
    if (!workflow.sourceSnapshot) throw new Error("workflow_source_snapshot_required");
    if (workflow.contextVersion === "unbound") throw new Error("workflow_context_version_required");
  }
  if (["qa1_pass", "qa2_pass", "approve"].includes(event) && !workflow.reviewSource) {
    throw new Error("workflow_review_source_required");
  }
  const clearReview = ["rework", "qa1_rework", "qa2_rework", "request_info", "reject"].includes(event);
  return Object.freeze({
    ...workflow,
    state: nextState,
    reviewSource: clearReview ? null : event === "submit_qa1" ? currentSource(workflow) : workflow.reviewSource,
    approvalSource: clearReview ? null : event === "approve" ? currentSource(workflow) : workflow.approvalSource
  });
}

export function advanceThaiMartWorkflowDryRun(body = {}, options = {}) {
  const workflow = normalizeWorkflow(body.workflow, options);
  const event = asNonEmptyString(body.event, "workflow_event");
  if (externalApplyEvents.has(event)) return blockedExternalApply(workflow, event, options);
  const nextState = transitions[workflow.state]?.[event];
  if (!nextState) throw new Error("workflow_transition_not_allowed");
  const bindings = [workflow.reviewSource, workflow.approvalSource].filter(Boolean);
  if (event !== "reject" && bindings.some(binding => !sourceMatches(workflow, binding))) {
    const invalidated = Object.freeze({
      ...workflow, state: "CONTEXT_LOCKED", reviewSource: null, approvalSource: null
    });
    return transitionResult(invalidated, event, options, true);
  }
  return transitionResult(reviewedTransition(workflow, event, nextState), event, options);
}
