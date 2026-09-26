const SNAPSHOT_TYPE = "thaimart_page_snapshot";

function visibleProductRowCount(table) {
  if (!table) return 0;

  return Array.from(table.querySelectorAll("tbody tr")).filter((row) => {
    const cells = row.querySelectorAll("td");
    return cells.length > 1;
  }).length;
}

function buildSnapshot() {
  const table = document.querySelector("table");
  const buttons = Array.from(document.querySelectorAll("button"));
  const buttonLabels = buttons.map((button) => (button.textContent || "").trim());
  const productControlsVisible = buttonLabels.some((label) =>
    /เพิ่มสินค้าใหม่|อัปโหลดสินค้า|เผยแพร่สินค้า|ปิดไม่ขาย/.test(label)
  );

  return {
    kind: "thaimart_seller_page_snapshot_v1",
    host: location.hostname,
    route: location.pathname,
    pageKind: productControlsVisible ? "product-list" : "unclassified",
    visibleProductRows: visibleProductRowCount(table),
    hasProductTable: Boolean(table),
    writeControlsVisible: productControlsVisible,
    capturedAt: new Date().toISOString(),
    collectionPolicy: "metadata-only-no-cookies-no-form-values-no-product-details"
  };
}

function sendSnapshot() {
  const snapshot = buildSnapshot();
  chrome.runtime.sendMessage({ type: SNAPSHOT_TYPE, snapshot }).catch(() => undefined);
  return snapshot;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "thaimart_capture_snapshot") return;
  sendResponse({ ok: true, snapshot: sendSnapshot() });
});

sendSnapshot();
