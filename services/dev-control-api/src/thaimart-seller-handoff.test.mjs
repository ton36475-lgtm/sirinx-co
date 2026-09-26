import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { createThaiMartWorkflowDryRun } from "./thaimart-k-workflow-engine.mjs";

const extensionRoot = new URL("../../../apps/thaimart-seller-guard/", import.meta.url);
const workerSource = readFileSync(new URL("service-worker.js", extensionRoot), "utf8");
const popupSource = readFileSync(new URL("popup.js", extensionRoot), "utf8");
const capturedAt = "2026-09-06T15:00:00.000Z";
const now = () => new Date(capturedAt);
const clone = value => JSON.parse(JSON.stringify(value));
const input = { id: "SRX-TM-001", type: "catalog" };
const tab = { id: 17, url: "https://seller.thaimart.com/products/SYNTHETIC_ONLY" };
const makeSnapshot = (changes = {}) => ({
  kind: "thaimart_seller_page_snapshot_v1", host: "seller.thaimart.com",
  route: "/products/SYNTHETIC_ONLY", pageKind: "product-list", visibleProductRows: 12,
  hasProductTable: true, writeControlsVisible: true, capturedAt,
  collectionPolicy: "metadata-only-no-cookies-no-form-values-no-product-details",
  ...changes
});
const context = {
  schemaVersion: "seller-page-structure-v1", sourceHost: "seller.thaimart.com",
  pageKind: "product-list", observedTableRowCount: 12, hasTable: true,
  productControlsPresent: true, capturedAt
};
const falseFlags = ["externalWrites", "productionWrites", "customerVisible", "canReadThaiMart", "canWriteThaiMart", "canExecuteExternally", "canReadSecrets"];
class FixedDate extends Date {
  constructor(value = capturedAt) { super(value); }
  static now() { return Date.parse(capturedAt); }
}

function evaluate(source, globals) {
  vm.runInNewContext(source, { ...globals, Date: FixedDate, URL }, {
    timeout: 1000, contextCodeGeneration: { strings: false, wasm: false }
  });
}

function background(options = {}) {
  let listener;
  let stored = {};
  let requests = [];
  let tabQueries = 0;
  let captures = [];
  const chrome = {
    runtime: { onMessage: { addListener(value) { listener = value; } } },
    storage: { session: {
      async get(key) { return key in stored ? { [key]: clone(stored[key]) } : {}; },
      async set(value) { stored = { ...stored, ...clone(value) }; }
    } },
    tabs: {
      async query() {
        tabQueries += 1;
        return options.tabSequence ? options.tabSequence[Math.min(tabQueries - 1, options.tabSequence.length - 1)] : options.tabs ?? [tab];
      },
      async sendMessage(id, message) {
        captures = [...captures, { id, message: clone(message) }];
        if (options.captureError) throw new Error("SYNTHETIC_CAPTURE_UNAVAILABLE");
        return "captureResponse" in options ? options.captureResponse : { ok: true, snapshot: options.snapshot ?? makeSnapshot() };
      }
    }
  };
  const fetch = async (url, request) => {
    requests = [...requests, { url, ...clone(request), payload: JSON.parse(request.body) }];
    if (options.unavailable) throw new Error("SYNTHETIC_FETCH_UNAVAILABLE");
    if ("httpResponse" in options) return options.httpResponse;
    const receipt = createThaiMartWorkflowDryRun(JSON.parse(request.body), { now });
    return { ok: true, async json() { return options.transform ? options.transform(clone(receipt)) : receipt; } };
  };
  evaluate(workerSource, { chrome, fetch });
  const dispatch = message => new Promise((resolve, reject) => {
    try {
      expect(listener(clone(message), {}, value => resolve(clone(value)))).toBe(true);
    } catch (error) { reject(error); }
  });
  return {
    dispatch,
    start: (workflow = input) => dispatch({ type: "thaimart_start_local_dry_run", workflow }),
    requests: () => clone(requests), captures: () => clone(captures),
    session: () => clone(stored), tabQueries: () => tabQueries
  };
}

function popup(sendMessage) {
  const ids = ["page-status", "page-detail", "snapshot-page", "snapshot-rows", "snapshot-writes", "workflow-result", "refresh-snapshot", "start-workflow", "workflow-id", "workflow-type"];
  const handlers = new Map();
  const elements = Object.fromEntries(ids.map(id => [id, {
    textContent: "", dataset: {}, disabled: false,
    value: id === "workflow-id" ? input.id : id === "workflow-type" ? input.type : "",
    addEventListener(event, fn) { handlers.set(`${id}:${event}`, fn); }
  }]));
  evaluate(popupSource, {
    chrome: { runtime: { sendMessage } },
    document: { querySelector(selector) { return elements[selector.slice(1)]; } }
  });
  return {
    async start() { await handlers.get("start-workflow:click")(); },
    result: () => elements["workflow-result"],
    disabled: () => elements["start-workflow"].disabled
  };
}

describe("Seller Guard actual local handoff handlers", () => {
  it("freshly captures the active tab, round-trips exact structural context through the real engine, and displays success", async () => {
    const app = background({ snapshot: makeSnapshot({ productDetails: "SYNTHETIC_PRIVATE", formValues: "SYNTHETIC_PRIVATE", tokens: "SYNTHETIC_PRIVATE" }) });
    await app.dispatch({ type: "thaimart_page_snapshot", snapshot: makeSnapshot({ visibleProductRows: 3 }) });
    const ui = popup(app.dispatch);
    await ui.start();
    const [request] = app.requests();
    expect(app.requests()).toHaveLength(1);
    expect(app.captures()).toEqual([{ id: 17, message: { type: "thaimart_capture_snapshot" } }]);
    expect(app.tabQueries()).toBe(2);
    expect(request.url).toBe("http://127.0.0.1:8790/api/thaimart/workflow/dry-run");
    expect(request.method).toBe("POST");
    expect(request.credentials).toBe("omit");
    expect(request.payload).toEqual({ ...input, storeScope: "own-store", contextVersion: "seller-page-structure-v1", requestId: "extension-SRX-TM-001", sellerPageContext: context });
    expect(request.body).not.toContain("SYNTHETIC_");
    expect(app.session().thaimartLastPageSnapshot.route).toBe("/products/SYNTHETIC_ONLY");
    expect(ui.result().dataset.state).toBe("success");
    expect(ui.result().textContent).toContain(input.id);
    expect(ui.result().textContent).toContain("INTAKE");
    expect(ui.disabled()).toBe(false);
  });

  it.each([
    ["missing tab", { tabs: [] }],
    ["wrong host", { tabs: [{ ...tab, url: "https://invalid.example/" }] }],
    ["lookalike host", { tabs: [{ ...tab, url: "https://seller.thaimart.com.invalid.example/" }] }],
    ["invalid tab id", { tabs: [{ ...tab, id: -1 }] }],
    ["changed tab", { tabSequence: [[tab], [{ ...tab, id: 18 }]] }],
    ["changed route", { tabSequence: [[tab], [{ ...tab, url: "https://seller.thaimart.com/orders" }]] }],
    ["missing response", { captureResponse: null }],
    ["missing snapshot", { captureResponse: { ok: true } }],
    ["capture rejection", { captureResponse: { ok: false } }],
    ["capture unavailable", { captureError: true }],
    ["snapshot wrong host", { snapshot: makeSnapshot({ host: "invalid.example" }) }],
    ["stale snapshot", { snapshot: makeSnapshot({ capturedAt: "2026-09-06T14:57:59.999Z" }) }],
    ["future snapshot", { snapshot: makeSnapshot({ capturedAt: "2026-09-06T15:00:05.001Z" }) }],
    ["invalid timestamp", { snapshot: makeSnapshot({ capturedAt: "today" }) }],
    ["noncanonical timestamp", { snapshot: makeSnapshot({ capturedAt: "2026-09-06T15:00:00Z" }) }],
    ["invalid page kind", { snapshot: makeSnapshot({ pageKind: "checkout" }) }],
    ["string row count", { snapshot: makeSnapshot({ visibleProductRows: "12" }) }],
    ["negative row count", { snapshot: makeSnapshot({ visibleProductRows: -1 }) }],
    ["excessive row count", { snapshot: makeSnapshot({ visibleProductRows: 10000 }) }],
    ["string boolean", { snapshot: makeSnapshot({ hasProductTable: "true" }) }]
  ])("rejects %s without a fake fetch", async (_name, options) => {
    const app = background(options);
    await app.dispatch({ type: "thaimart_page_snapshot", snapshot: makeSnapshot() });
    const response = await app.start();
    expect(response.ok).toBe(false);
    expect(app.requests()).toHaveLength(0);
  });

  it.each([{ id: "!", type: "catalog" }, { id: "SRX-TM-001", type: "publish" }])("rejects invalid intent before capture or fetch: %j", async workflow => {
    const app = background();
    expect((await app.start(workflow)).ok).toBe(false);
    expect(app.requests()).toHaveLength(0);
    expect(app.captures()).toHaveLength(0);
  });

  it.each(["2026-09-06T14:58:00.000Z", "2026-09-06T15:00:05.000Z"])("accepts the inclusive freshness boundary %s", async capturedAt => {
    const app = background({ snapshot: makeSnapshot({ capturedAt }) });
    expect((await app.start()).ok).toBe(true);
  });

  it.each([
    ["unavailable", { unavailable: true }],
    ["HTTP rejection", { httpResponse: { ok: false, async json() { return { error: "SYNTHETIC_REJECTION" }; } } }],
    ["invalid JSON", { httpResponse: { ok: true, async json() { throw new Error("SYNTHETIC_BAD_JSON"); } } }],
    ["empty object", { transform: () => ({}) }],
    ["null", { transform: () => null }],
    ["mismatched request", { transform: receipt => ({ ...receipt, requestId: "other" }) }],
    ["mismatched identity", { transform: receipt => ({ ...receipt, workflow: { ...receipt.workflow, id: "SRX-TM-OTHER" } }) }],
    ["mismatched type", { transform: receipt => ({ ...receipt, workflow: { ...receipt.workflow, type: "content" } }) }],
    ["non-intake state", { transform: receipt => ({ ...receipt, workflow: { ...receipt.workflow, state: "APPLIED" } }) }],
    ["missing context", { transform: receipt => ({ ...receipt, workflow: { ...receipt.workflow, sellerPageContext: null } }) }],
    ["changed context", { transform: receipt => ({ ...receipt, workflow: { ...receipt.workflow, sellerPageContext: { ...context, observedTableRowCount: 7 } } }) }],
    ["extra context field", { transform: receipt => ({ ...receipt, workflow: { ...receipt.workflow, sellerPageContext: { ...context, route: "/SYNTHETIC_ONLY" } } }) }],
    ...falseFlags.map(flag => [flag, { transform: receipt => ({ ...receipt, [flag]: true }) }])
  ])("shows an error for %s and restores the button", async (_name, options) => {
    const app = background(options);
    const ui = popup(app.dispatch);
    await ui.start();
    expect(app.requests()).toHaveLength(1);
    expect(ui.result().dataset.state).toBe("error");
    expect(ui.result().textContent).not.toContain("SYNTHETIC_");
    expect(ui.disabled()).toBe(false);
  });

  it.each([{}, null, { workflow: {} }, { workflow: { id: input.id, type: input.type, state: "INTAKE" } }])("popup independently rejects malformed successful worker data %j", async workflow => {
    const ui = popup(async message => message.type === "thaimart_get_snapshot" ? { ok: true, snapshot: null } : { ok: true, workflow });
    await ui.start();
    expect(ui.result().dataset.state).toBe("error");
    expect(ui.result().textContent).not.toContain("INTAKE");
    expect(ui.disabled()).toBe(false);
  });

  it.each(["canWriteThaiMart", "requiresHumanApproval", "adapterStatus"])("popup rejects a contradictory worker receipt: %s", async field => {
    const receipt = createThaiMartWorkflowDryRun({ ...input, contextVersion: "seller-page-structure-v1", sellerPageContext: context }, { now });
    const workflow = { ...receipt, [field]: field === "adapterStatus" ? "active" : field === "requiresHumanApproval" ? false : true };
    const ui = popup(async message => message.type === "thaimart_get_snapshot" ? { ok: true, snapshot: null } : { ok: true, workflow });
    await ui.start();
    expect(ui.result().dataset.state).toBe("error");
    expect(ui.disabled()).toBe(false);
  });

  it("uses a controlled default string for a benign inherited error-map key", async () => {
    const app = background({ httpResponse: { ok: false, async json() { return { error: "toString" }; } } });
    const response = await app.start();
    expect(response.ok).toBe(false);
    expect(response.error).toBe("control_api_unavailable_or_rejected");
    expect(typeof response.safeDetail).toBe("string");
    expect(response.safeDetail).not.toContain("toString");
  });
});
