const SNAPSHOT_TYPE = "thaimart_page_snapshot";
const SESSION_SNAPSHOT_KEY = "thaimartLastPageSnapshot";
const CONTROL_API_ORIGIN = "http://127.0.0.1:8790";
const WORKFLOW_TYPES = new Set(["catalog", "content", "insight", "report", "schedule"]);
const CONTEXT_VERSION = "seller-page-structure-v1";
const FALSE_CAPABILITIES = Object.freeze([
  "externalWrites", "productionWrites", "customerVisible", "canReadThaiMart",
  "canWriteThaiMart", "canExecuteExternally", "canReadSecrets"
]);
const SAFE_ERRORS = Object.freeze({
  seller_page_unavailable: "Open the current Seller Center page and try again. No workflow request was sent.",
  seller_page_changed: "The active page changed during inspection. Refresh it and try again. No workflow request was sent.",
  seller_page_context_invalid: "The page inspection was incomplete or invalid. Refresh it and try again. No workflow request was sent.",
  seller_page_context_stale: "The page inspection is out of date. Refresh the Seller Center page and try again. No workflow request was sent.",
  control_api_receipt_invalid: "The local service returned an incomplete or mismatched result. Workflow creation could not be confirmed."
});

function normalizeSnapshot(value) {
  if (!value || typeof value !== "object") return null;
  if (value.host !== "seller.thaimart.com") return null;

  return {
    kind: "thaimart_seller_page_snapshot_v1",
    host: value.host,
    route: typeof value.route === "string" ? value.route.slice(0, 160) : "/",
    pageKind: value.pageKind === "product-list" ? "product-list" : "unclassified",
    visibleProductRows: Number.isInteger(value.visibleProductRows)
      ? Math.max(0, Math.min(value.visibleProductRows, 9999))
      : 0,
    hasProductTable: value.hasProductTable === true,
    writeControlsVisible: value.writeControlsVisible === true,
    capturedAt: typeof value.capturedAt === "string" ? value.capturedAt : new Date().toISOString(),
    collectionPolicy: "metadata-only-no-cookies-no-form-values-no-product-details"
  };
}

function normalizeWorkflowRequest(value) {
  const id = String(value?.id || "").trim();
  const type = String(value?.type || "").trim();

  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,80}$/.test(id)) {
    throw new Error("workflow_id_invalid");
  }
  if (!WORKFLOW_TYPES.has(type)) throw new Error("workflow_type_invalid");

  return { id, type };
}

async function storeSnapshot(snapshot) {
  await chrome.storage.session.set({ [SESSION_SNAPSHOT_KEY]: snapshot });
  return snapshot;
}

function activeSellerTab(tabs) {
  const tab = tabs?.[0];
  if (!Number.isSafeInteger(tab?.id) || tab.id <= 0 ||
      typeof tab.url !== "string" || !tab.url.startsWith("https://seller.thaimart.com/")) {
    throw new Error("seller_page_unavailable");
  }
  return tab;
}

function projectSellerPageContext(snapshot, tab) {
  if (!snapshot || snapshot.host !== "seller.thaimart.com" ||
      snapshot.route !== new URL(tab.url).pathname ||
      !["product-list", "unclassified"].includes(snapshot.pageKind) ||
      !Number.isInteger(snapshot.visibleProductRows) || snapshot.visibleProductRows < 0 || snapshot.visibleProductRows > 9999 ||
      typeof snapshot.hasProductTable !== "boolean" || typeof snapshot.writeControlsVisible !== "boolean" ||
      typeof snapshot.capturedAt !== "string") {
    throw new Error("seller_page_context_invalid");
  }
  const capturedMs = Date.parse(snapshot.capturedAt);
  if (!Number.isFinite(capturedMs) || new Date(capturedMs).toISOString() !== snapshot.capturedAt) {
    throw new Error("seller_page_context_invalid");
  }
  const ageMs = Date.now() - capturedMs;
  if (ageMs > 120000 || ageMs < -5000) throw new Error("seller_page_context_stale");
  return {
    schemaVersion: CONTEXT_VERSION,
    sourceHost: snapshot.host,
    pageKind: snapshot.pageKind,
    observedTableRowCount: snapshot.visibleProductRows,
    hasTable: snapshot.hasProductTable,
    productControlsPresent: snapshot.writeControlsVisible,
    capturedAt: snapshot.capturedAt
  };
}

async function captureCurrentPageContext() {
  const tab = activeSellerTab(await chrome.tabs.query({ active: true, currentWindow: true }));
  let capture;
  try {
    capture = await chrome.tabs.sendMessage(tab.id, { type: "thaimart_capture_snapshot" });
  } catch {
    throw new Error("seller_page_unavailable");
  }
  if (capture?.ok !== true) throw new Error("seller_page_context_invalid");
  const currentTab = activeSellerTab(await chrome.tabs.query({ active: true, currentWindow: true }));
  if (currentTab.id !== tab.id || currentTab.url !== tab.url) throw new Error("seller_page_changed");
  const context = projectSellerPageContext(capture.snapshot, tab);
  await storeSnapshot(normalizeSnapshot(capture.snapshot));
  return context;
}

function validateWorkflowReceipt(body, request) {
  const workflow = body?.workflow;
  const actualContext = workflow?.sellerPageContext;
  const expectedKeys = Object.keys(request.sellerPageContext);
  const validContext = actualContext && !Array.isArray(actualContext) &&
    Object.keys(actualContext).length === expectedKeys.length &&
    expectedKeys.every(key => actualContext[key] === request.sellerPageContext[key]);
  if (body?.status !== "thaimart_workflow_dry_run_ready" || body.mode !== "local-only-dry-run" ||
      body.requestId !== request.requestId || workflow?.id !== request.id || workflow.type !== request.type ||
      workflow.state !== "INTAKE" || workflow.storeScope !== "own-store" ||
      workflow.contextVersion !== CONTEXT_VERSION || !validContext ||
      !FALSE_CAPABILITIES.every(flag => body[flag] === false) ||
      body.requiresHumanApproval !== true || body.adapterStatus !== "disabled_pending_contract") {
    throw new Error("control_api_receipt_invalid");
  }
  return body;
}

async function startLocalWorkflowDryRun(input) {
  const workflow = normalizeWorkflowRequest(input);
  const sellerPageContext = await captureCurrentPageContext();
  const request = {
    ...workflow,
    storeScope: "own-store",
    contextVersion: CONTEXT_VERSION,
    requestId: `extension-${workflow.id}`,
    sellerPageContext
  };
  const response = await fetch(`${CONTROL_API_ORIGIN}/api/thaimart/workflow/dry-run`, {
    method: "POST",
    credentials: "omit",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request)
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || "control_api_rejected_request");
  return validateWorkflowReceipt(body, request);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    if (message?.type === SNAPSHOT_TYPE) {
      const snapshot = normalizeSnapshot(message.snapshot);
      if (!snapshot) return { ok: false, error: "snapshot_rejected" };
      await storeSnapshot(snapshot);
      return { ok: true, snapshot };
    }

    if (message?.type === "thaimart_get_snapshot") {
      const stored = await chrome.storage.session.get(SESSION_SNAPSHOT_KEY);
      return { ok: true, snapshot: stored[SESSION_SNAPSHOT_KEY] || null };
    }

    if (message?.type === "thaimart_start_local_dry_run") {
      try {
        const workflow = await startLocalWorkflowDryRun(message.workflow);
        return { ok: true, workflow };
      } catch (error) {
        const safeDetail = Object.hasOwn(SAFE_ERRORS, error?.message) ? SAFE_ERRORS[error.message] : null;
        return {
          ok: false,
          error: safeDetail ? error.message : "control_api_unavailable_or_rejected",
          safeDetail: safeDetail || "No Seller Center action was attempted. Start the local Control API or correct the dry-run request."
        };
      }
    }

    return { ok: false, error: "unknown_extension_message" };
  })().then(sendResponse, () =>
    sendResponse({ ok: false, error: "extension_message_failed" })
  );

  return true;
});
