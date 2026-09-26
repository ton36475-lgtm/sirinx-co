import { describe, expect, it } from "vitest";
import {
  advanceThaiMartWorkflowDryRun,
  createThaiMartWorkflowDryRun,
  getThaiMartWorkflowStatus
} from "./thaimart-k-workflow-engine.mjs";

const fixedNow = () => new Date("2026-08-21T00:00:00.000Z");

describe("ThaiMart K01-K15 workflow adapter", () => {
  it("reports an unknown ThaiMart connector contract as disabled", () => {
    const status = getThaiMartWorkflowStatus({ now: fixedNow });

    expect(status.status).toBe("disabled_pending_contract");
    expect(status.integrationContract).toMatchObject({
      officialApi: "unknown",
      authMode: "unknown",
      webhookBehavior: "unknown"
    });
    expect(status.externalWrites).toBe(false);
    expect(status.canWriteThaiMart).toBe(false);
  });

  it("creates only an own-store local workflow draft", () => {
    const result = createThaiMartWorkflowDryRun(
      { id: "SRX-TM-001", type: "catalog", contextVersion: "catalog-v1" },
      { now: fixedNow }
    );

    expect(result.workflow).toMatchObject({
      id: "SRX-TM-001",
      type: "catalog",
      state: "INTAKE",
      storeScope: "own-store"
    });
    expect(result.externalWrites).toBe(false);
  });

  it("moves through local review states without enabling ThaiMart", () => {
    const intake = createThaiMartWorkflowDryRun(
      { id: "SRX-TM-002", type: "content" },
      { now: fixedNow }
    ).workflow;
    const locked = advanceThaiMartWorkflowDryRun(
      { workflow: intake, event: "lock_context" },
      { now: fixedNow }
    );

    expect(locked.workflow.state).toBe("CONTEXT_LOCKED");
    expect(locked.canExecuteExternally).toBe(false);
  });

  it("blocks every external apply event even from a ready workflow", () => {
    const blocked = advanceThaiMartWorkflowDryRun(
      {
        workflow: {
          id: "SRX-TM-003",
          type: "catalog",
          state: "READY_TO_APPLY",
          storeScope: "own-store"
        },
        event: "price_write"
      },
      { now: fixedNow }
    );

    expect(blocked.status).toBe("thaimart_external_apply_blocked");
    expect(blocked.workflow.state).toBe("BLOCKED");
    expect(blocked.productionWrites).toBe(false);
  });

  it("rejects a workflow that tries to broaden store scope", () => {
    expect(() =>
      createThaiMartWorkflowDryRun({
        id: "SRX-TM-004",
        type: "catalog",
        storeScope: "third-party-store"
      })
    ).toThrow("own_store_scope_required");
  });
});

const reviewEvents = ["lock_context", "plan", "draft", "adapt_channel", "submit_qa1", "qa1_pass", "qa2_pass"];
const syntheticSource = () => ({
  "productId": "SYNTHETIC-001",
  "evidence": "DECLARED_SYNTHETIC_PRODUCT_FACTS",
  "title": "ข้อมูลจำลอง: กล่องจัดระเบียบสีขาว ขนาด 20 × 15 × 10 ซม. จำนวน 1 ใบ",
  "descriptionTh": "ร่างประกาศสำหรับทดสอบขั้นตอนภายในเท่านั้น กล่องจัดระเบียบสีขาว ขนาดกว้าง 20 ซม. ลึก 15 ซม. สูง 10 ซม. บรรจุ 1 ใบต่อชุด ไม่มีสินค้าหรือภาพสินค้าจริงในตัวอย่างนี้",
  "facts": {
    "nameTh": "กล่องจัดระเบียบ",
    "colorTh": "สีขาว",
    "widthCm": 20,
    "depthCm": 15,
    "heightCm": 10,
    "quantity": 1,
    "synthetic": true
  },
  "assetRefs": [
    {
      "id": "synthetic-storage-box-front-v1",
      "referenceHash": "a4ecb31b2be05e7f28bca7352bfaa7fc768da5fa5545c194e55ddb49a0e91504",
      "referenceHashKind": "synthetic-label-sha256",
      "assetBytesAvailable": false
    },
    {
      "id": "synthetic-storage-box-side-v1",
      "referenceHash": "bad6707e8809d7a8656e64a01fccd9222d7430f194bc246f065ca19316b0deb3",
      "referenceHashKind": "synthetic-label-sha256",
      "assetBytesAvailable": false
    }
  ],
  "claims": [
    "สีขาว",
    "กว้าง 20 ซม.",
    "ลึก 15 ซม.",
    "สูง 10 ซม.",
    "1 ใบต่อชุด"
  ]
});
const startDraft = (overrides = {}) => createThaiMartWorkflowDryRun({
  id: "SRX-TM-SOURCE", type: "catalog", contextVersion: "fixture-v1",
  sourceSnapshot: syntheticSource(), ...overrides
}, { now: fixedNow }).workflow;
const advance = (workflow, event) => advanceThaiMartWorkflowDryRun(
  { workflow, event }, { now: fixedNow }
);
const reach = (workflow, events = reviewEvents) => events.reduce(
  (current, event) => advance(current, event).workflow, workflow
);

describe("ThaiMart local source-bound QA and approval", () => {
  it("binds both QA passes and local approval to the supplied snapshot", () => {
    const initial = startDraft();
    const waiting = reach(initial);
    const result = advance(waiting, "approve");
    expect(initial.sourceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(initial.sourceVerification).toBe("DECLARED_LOCAL_SNAPSHOT");
    expect(waiting.reviewSource).toEqual({
      contextVersion: "fixture-v1", sourceHash: initial.sourceHash
    });
    expect(result.workflow.approvalSource).toEqual(waiting.reviewSource);
    expect(result.workflow.state).toBe("READY_TO_APPLY");
    expect(result.canExecuteExternally).toBe(false);
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.workflow.sourceSnapshot.assetRefs).toEqual(syntheticSource().assetRefs);
    expect(result.workflow.sourceSnapshot.claims).toEqual(syntheticSource().claims);
    expect(result.workflow.sourceSnapshot).toEqual(syntheticSource());
  });

  it.each([
    [5, "qa1_pass"], [6, "qa2_pass"], [7, "approve"], [8, "archive"]
  ])("invalidates changed source after %i local review steps", (count, event) => {
    const workflow = reach(startDraft(), [...reviewEvents, "approve"].slice(0, count));
    const changed = { ...workflow, sourceSnapshot: { ...workflow.sourceSnapshot, title: "Changed synthetic title" } };
    const result = advance(changed, event);
    expect(result.status).toBe("thaimart_workflow_review_invalidated");
    expect(result.workflow.state).toBe("CONTEXT_LOCKED");
    expect(result.workflow.reviewSource).toBeNull();
    expect(result.workflow.approvalSource).toBeNull();
    expect(result.workflow.sourceHash).not.toBe(workflow.sourceHash);
    expect(result.nextAllowedEvents).toEqual(["plan", "reject"]);
    expect(workflow.state).not.toBe("CONTEXT_LOCKED");
  });

  it("invalidates approval when only the context version changes", () => {
    const approved = reach(startDraft(), [...reviewEvents, "approve"]);
    const result = advance({ ...approved, contextVersion: "fixture-v2" }, "archive");
    expect(result.workflow.state).toBe("CONTEXT_LOCKED");
    expect(result.workflow.approvalSource).toBeNull();
    expect(result.workflow.sourceHash).toBe(approved.sourceHash);
  });

  it("requires a fresh draft and both QA passes after invalidation", () => {
    const waiting = reach(startDraft());
    const changed = advance({ ...waiting, sourceSnapshot: { ...waiting.sourceSnapshot, claims: [] } }, "approve").workflow;
    expect(() => advance(changed, "approve")).toThrow("workflow_transition_not_allowed");
    const reviewed = reach(changed, reviewEvents.slice(1));
    expect(advance(reviewed, "approve").workflow.approvalSource.sourceHash).toBe(changed.sourceHash);
  });

  it("canonicalizes object order while preserving meaningful asset order", () => {
    const waiting = reach(startDraft());
    const source = waiting.sourceSnapshot;
    const reordered = Object.fromEntries(Object.entries(source).reverse());
    expect(advance({ ...waiting, sourceSnapshot: reordered }, "approve").workflow.state).toBe("READY_TO_APPLY");
    const reversed = { ...source, assetRefs: [...source.assetRefs].reverse() };
    expect(advance({ ...waiting, sourceSnapshot: reversed }, "approve").workflow.state).toBe("CONTEXT_LOCKED");
  });

  it("invalidates approval when a synthetic asset reference hash changes", () => {
    const waiting = reach(startDraft());
    const assetRefs = waiting.sourceSnapshot.assetRefs.map((asset, index) =>
      index === 0 ? { ...asset, referenceHash: "f".repeat(64) } : asset
    );
    const result = advance({ ...waiting, sourceSnapshot: { ...waiting.sourceSnapshot, assetRefs } }, "approve");
    expect(result.workflow.state).toBe("CONTEXT_LOCKED");
    expect(result.workflow.reviewSource).toBeNull();
  });

  it("computes the digest from source and ignores an arbitrary supplied digest", () => {
    const first = startDraft({ sourceHash: "0".repeat(64) });
    const second = startDraft({ sourceHash: "1".repeat(64) });
    expect(first.sourceHash).toBe(second.sourceHash);
    expect(first.sourceHash).not.toBe("0".repeat(64));
  });

  it("cannot substitute a hash declaration for an actual source snapshot", () => {
    const legacy = startDraft({ sourceSnapshot: undefined, sourceHash: "a".repeat(64) });
    const adapted = reach(legacy, reviewEvents.slice(0, 4));
    expect(legacy.sourceHash).toBeNull();
    expect(() => advance(adapted, "submit_qa1")).toThrow("workflow_source_snapshot_required");
  });

  it("requires a bound context version before submitting QA", () => {
    const adapted = reach(startDraft({ contextVersion: "unbound" }), reviewEvents.slice(0, 4));
    expect(() => advance(adapted, "submit_qa1")).toThrow("workflow_context_version_required");
  });

  it.each(["qa1_pass", "qa2_pass", "approve"])("rejects %s without a review binding", event => {
    const states = { qa1_pass: "QA1_REVIEW", qa2_pass: "QA2_REVIEW", approve: "WAITING_APPROVAL" };
    expect(() => advance({ ...startDraft(), state: states[event], approved: true }, event))
      .toThrow("workflow_review_source_required");
  });

  it.each([[5, "qa1_rework"], [6, "qa2_rework"], [7, "request_info"]])(
    "clears source review when reworking after %i steps", (count, event) => {
      const result = advance(reach(startDraft(), reviewEvents.slice(0, count)), event);
      expect(result.workflow.reviewSource).toBeNull();
      expect(result.workflow.approvalSource).toBeNull();
    }
  );

  it("detaches and deeply freezes source and bindings without changing the request", () => {
    const source = syntheticSource();
    const initial = startDraft({ sourceSnapshot: source });
    expect(Object.isFrozen(source)).toBe(false);
    source.assetRefs.push("fixture-later-edit");
    expect(initial.sourceSnapshot.assetRefs).toEqual(syntheticSource().assetRefs);
    expect(Object.isFrozen(initial.sourceSnapshot)).toBe(true);
    expect(Object.isFrozen(initial.sourceSnapshot.assetRefs)).toBe(true);
    const approved = advance(reach(initial), "approve").workflow;
    expect(Object.isFrozen(approved.reviewSource)).toBe(true);
    expect(Object.isFrozen(approved.approvalSource)).toBe(true);
    expect(() => { approved.approvalSource.contextVersion = "changed"; }).toThrow(TypeError);
  });

  it("allows an explicit rejection to close a stale reviewed draft", () => {
    const waiting = reach(startDraft());
    const result = advance({ ...waiting, contextVersion: "changed" }, "reject");
    expect(result.workflow.state).toBe("REJECTED");
    expect(result.workflow.reviewSource).toBeNull();
    expect(result.workflow.approvalSource).toBeNull();
  });

  it("still blocks external apply before considering stale local review", () => {
    const approved = advance(reach(startDraft()), "approve").workflow;
    const result = advance({ ...approved, contextVersion: "changed" }, "publish");
    expect(result.status).toBe("thaimart_external_apply_blocked");
    expect(result.workflow.state).toBe("BLOCKED");
    expect(result.canWriteThaiMart).toBe(false);
  });

  it.each([
    ["null", null], ["array", []], ["empty", {}], ["sparse array", { items: Array(2) }], ["undefined field", { x: undefined }],
    ["nonfinite", { x: Infinity }], ["date", { x: new Date(0) }],
    ["function", { x: () => true }], ["symbol", { x: Symbol("fixture") }],
    ["oversized", { x: "a".repeat(8193) }],
    ["too deep", { a: { b: { c: { d: { e: { f: { g: "deep" } } } } } } }]
  ])("rejects a %s source snapshot", (_name, sourceSnapshot) => {
    expect(() => startDraft({ sourceSnapshot })).toThrow("workflow_source_snapshot_invalid");
  });

  it("rejects a supplied serialization hook without invoking it", () => {
    let calls = 0;
    const snapshot = { value: "synthetic", toJSON() { calls += 1; return { value: "changed" }; } };
    expect(() => startDraft({ sourceSnapshot: snapshot })).toThrow("workflow_source_snapshot_invalid");
    expect(calls).toBe(0);
  });

  it.each(["object", "array"])("rejects a %s accessor without invoking it", kind => {
    let calls = 0;
    const value = Object.defineProperty(kind === "array" ? [] : {}, kind === "array" ? "0" : "title", {
      enumerable: true, get() { calls += 1; return "synthetic"; }
    });
    expect(() => startDraft({ sourceSnapshot: { value } })).toThrow("workflow_source_snapshot_invalid");
    expect(calls).toBe(0);
  });

  it("rejects extra array serialization fields without invoking them", () => {
    let calls = 0;
    const values = Object.assign(["synthetic"], { toJSON() { calls += 1; return []; } });
    expect(() => startDraft({ sourceSnapshot: { values } })).toThrow("workflow_source_snapshot_invalid");
    expect(calls).toBe(0);
  });

  it("rejects cyclic local source without serializing it into a workflow", () => {
    const cyclic = {};
    Object.defineProperty(cyclic, "self", { value: cyclic, enumerable: true });
    expect(() => startDraft({ sourceSnapshot: cyclic })).toThrow("workflow_source_snapshot_invalid");
  });
});

const sellerPageContext = (changes = {}) => ({
  schemaVersion: "seller-page-structure-v1", sourceHost: "seller.thaimart.com",
  pageKind: "product-list", observedTableRowCount: 12, hasTable: true,
  productControlsPresent: true, capturedAt: fixedNow().toISOString(), ...changes
});

describe("ThaiMart structural seller-page context", () => {
  it("retains exact structural metadata without granting any external capability", () => {
    const context = sellerPageContext();
    const result = createThaiMartWorkflowDryRun({
      id: "SRX-TM-METADATA", type: "catalog", sellerPageContext: context
    }, { now: fixedNow });
    expect(result.workflow.sellerPageContext).toEqual(context);
    expect(result.workflow.sellerPageContext).not.toBe(context);
    expect(Object.isFrozen(result.workflow.sellerPageContext)).toBe(true);
    expect(Object.isFrozen(context)).toBe(false);
    expect(result).toMatchObject({
      externalWrites: false, productionWrites: false, customerVisible: false,
      canReadThaiMart: false, canWriteThaiMart: false, canExecuteExternally: false,
      canReadSecrets: false, requiresHumanApproval: true, adapterStatus: "disabled_pending_contract"
    });
  });

  it("preserves accepted context through later local review without inventing a fresh capture", () => {
    const workflow = startDraft({ sellerPageContext: sellerPageContext() });
    const later = () => new Date(fixedNow().getTime() + 600000);
    const locked = advanceThaiMartWorkflowDryRun({ workflow, event: "lock_context" }, { now: later }).workflow;
    expect(locked.sellerPageContext).toEqual(workflow.sellerPageContext);
    expect(reach(locked, reviewEvents.slice(1)).sellerPageContext).toEqual(sellerPageContext());
  });

  it("marks missing legacy context absent and preserves that state", () => {
    const workflow = startDraft();
    expect(workflow.sellerPageContext).toBeNull();
    expect(advance(workflow, "lock_context").workflow.sellerPageContext).toBeNull();
  });

  it.each([
    ["wrong schema", { schemaVersion: "other" }], ["wrong host", { sourceHost: "example.invalid" }],
    ["unknown page kind", { pageKind: "orders" }], ["negative row count", { observedTableRowCount: -1 }],
    ["oversized row count", { observedTableRowCount: 10000 }], ["fractional row count", { observedTableRowCount: 1.5 }],
    ["string boolean", { hasTable: "true" }], ["numeric boolean", { productControlsPresent: 1 }],
    ["invalid timestamp", { capturedAt: "invalid" }], ["noncanonical timestamp", { capturedAt: "2026-08-21T00:00:00+00:00" }],
    ["raw route", { route: "/product/SYNTHETIC" }], ["extra value", { productTitle: "synthetic" }]
  ])("rejects %s instead of carrying it into a workflow", (_name, changes) => {
    expect(() => startDraft({ sellerPageContext: sellerPageContext(changes) })).toThrow("seller_page_context_invalid");
  });

  it.each([null, [], {}, "snapshot"])("rejects an invalid context container %j", value => {
    expect(() => startDraft({ sellerPageContext: value })).toThrow("seller_page_context_invalid");
  });

  it.each([[-120000, true], [-120001, false], [5000, true], [5001, false]])(
    "enforces the intake freshness boundary at %i milliseconds", (offset, valid) => {
      const context = sellerPageContext({ capturedAt: new Date(fixedNow().getTime() + offset).toISOString() });
      if (valid) expect(startDraft({ sellerPageContext: context }).sellerPageContext).toEqual(context);
      else expect(() => startDraft({ sellerPageContext: context })).toThrow("seller_page_context_stale");
    }
  );

  it("rejects metadata accessors without invoking them", () => {
    let reads = 0;
    const context = Object.defineProperty(sellerPageContext(), "sourceHost", {
      enumerable: true, get() { reads += 1; return "seller.thaimart.com"; }
    });
    expect(() => startDraft({ sellerPageContext: context })).toThrow("seller_page_context_invalid");
    expect(reads).toBe(0);
  });
});
