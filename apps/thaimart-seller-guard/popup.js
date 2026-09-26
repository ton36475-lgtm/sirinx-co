const pageStatus = document.querySelector("#page-status");
const pageDetail = document.querySelector("#page-detail");
const snapshotPage = document.querySelector("#snapshot-page");
const snapshotRows = document.querySelector("#snapshot-rows");
const snapshotWrites = document.querySelector("#snapshot-writes");
const resultPanel = document.querySelector("#workflow-result");
const refreshButton = document.querySelector("#refresh-snapshot");
const startButton = document.querySelector("#start-workflow");
const workflowId = document.querySelector("#workflow-id");
const workflowType = document.querySelector("#workflow-type");

function sendMessage(message) {
  return chrome.runtime.sendMessage(message);
}

function setResult(message, state = "") {
  resultPanel.textContent = message;
  resultPanel.dataset.state = state;
}

function renderSnapshot(snapshot) {
  if (!snapshot) {
    pageStatus.textContent = "ยังไม่มี snapshot";
    pageDetail.textContent = "เปิดหน้า Seller Center แล้วกด Refresh เพื่อส่ง metadata ที่ไม่ละเอียดอ่อนไปยัง extension session";
    snapshotPage.textContent = "—";
    snapshotRows.textContent = "—";
    snapshotWrites.textContent = "—";
    return;
  }

  const capturedAt = new Date(snapshot.capturedAt).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit"
  });
  pageStatus.textContent = snapshot.pageKind === "product-list" ? "ตรวจพบหน้ารายการสินค้า" : "ตรวจพบหน้า Seller Center";
  pageDetail.textContent = `เก็บเฉพาะ metadata เวลา ${capturedAt}; ไม่มี cookie, session, ค่าในฟอร์ม หรือชื่อสินค้า`;
  snapshotPage.textContent = snapshot.pageKind === "product-list" ? "PRODUCTS" : "SELLER";
  snapshotRows.textContent = String(snapshot.visibleProductRows);
  snapshotWrites.textContent = snapshot.writeControlsVisible ? "LOCKED" : "NONE";
}

async function refreshSnapshot() {
  refreshButton.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith("https://seller.thaimart.com/")) {
      throw new Error("open_thaimart_seller_center_first");
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: "thaimart_capture_snapshot" });
    if (!response?.ok) throw new Error("seller_page_snapshot_unavailable");

    const stored = await sendMessage({ type: "thaimart_page_snapshot", snapshot: response.snapshot });
    if (!stored?.ok) throw new Error("seller_page_snapshot_rejected");

    renderSnapshot(stored.snapshot);
    setResult("อัปเดต metadata แบบ read-only แล้ว ไม่มีการกดปุ่มใน Seller Center", "success");
  } catch (error) {
    setResult(
      error.message === "open_thaimart_seller_center_first"
        ? "เปิดหน้า https://seller.thaimart.com ก่อน แล้วลองใหม่"
        : "ไม่สามารถอ่านหน้าได้ โดยไม่มีการทำงานใดกับ Seller Center",
      "error"
    );
  } finally {
    refreshButton.disabled = false;
  }
}

async function startLocalWorkflow() {
  startButton.disabled = true;
  try {
    const requestedWorkflow = { id: workflowId.value.trim(), type: workflowType.value };
    const response = await sendMessage({
      type: "thaimart_start_local_dry_run",
      workflow: requestedWorkflow
    });

    if (!response?.ok) throw new Error(response?.safeDetail || "control_api_unavailable_or_rejected");

    const receipt = response.workflow;
    const workflow = receipt?.workflow;
    const falseFlags = ["externalWrites", "productionWrites", "customerVisible", "canReadThaiMart", "canWriteThaiMart", "canExecuteExternally", "canReadSecrets"];
    if (receipt?.status !== "thaimart_workflow_dry_run_ready" || receipt.mode !== "local-only-dry-run" ||
        workflow?.id !== requestedWorkflow.id || workflow.type !== requestedWorkflow.type ||
        workflow.state !== "INTAKE" || workflow.sellerPageContext?.schemaVersion !== "seller-page-structure-v1" ||
        !falseFlags.every(flag => receipt[flag] === false) || receipt.requiresHumanApproval !== true ||
        receipt.adapterStatus !== "disabled_pending_contract") {
      throw new Error("ไม่สามารถยืนยันผลจากบริการ local ได้ กรุณาลองใหม่");
    }
    setResult(`สร้าง local dry-run ${workflow.id} ที่สถานะ ${workflow.state} พร้อมข้อมูลโครงสร้างหน้า; ThaiMart write ยังถูกบล็อก`, "success");
  } catch (error) {
    setResult(error.message || "Control API ไม่พร้อมรับ dry-run", "error");
  } finally {
    startButton.disabled = false;
  }
}

refreshButton.addEventListener("click", refreshSnapshot);
startButton.addEventListener("click", startLocalWorkflow);

sendMessage({ type: "thaimart_get_snapshot" })
  .then((response) => renderSnapshot(response?.snapshot || null))
  .catch(() => renderSnapshot(null));
