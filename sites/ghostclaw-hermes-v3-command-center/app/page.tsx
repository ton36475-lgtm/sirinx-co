const WORK_LANE_STATUS = {
  en: "Verified locally",
  th: "ตรวจสอบในเครื่องแล้ว",
};

const EVIDENCE_SNAPSHOT = "18 JUL 2026 · SOURCE VERIFICATION";

const roninStages = [
  {
    layer: "L1",
    count: "01–16",
    title: "Perception",
    titleTh: "รับรู้",
    detail: "Observe bounded signals. No writes.",
    detailTh: "รับสัญญาณตามขอบเขต โดยไม่เขียนข้อมูล",
  },
  {
    layer: "L2",
    count: "17–25",
    title: "Analysis",
    titleTh: "วิเคราะห์",
    detail: "Score, compare, and explain.",
    detailTh: "ให้คะแนน เปรียบเทียบ และอธิบาย",
  },
  {
    layer: "L3",
    count: "26–35",
    title: "Decision",
    titleTh: "ตัดสินใจ",
    detail: "Prepare plans and bounded proposals.",
    detailTh: "จัดทำแผนและข้อเสนอในขอบเขต",
  },
  {
    layer: "L4",
    count: "36–43",
    title: "Coordination",
    titleTh: "ประสานงาน",
    detail: "Implement locally, verify, then stop at the gate.",
    detailTh: "ลงมือในเครื่อง ตรวจสอบ แล้วหยุดที่เกต",
  },
];

const heldGates = [
  ["Production deployment", "การนำขึ้นระบบจริง"],
  ["Infrastructure changes", "การเปลี่ยนโครงสร้างระบบ"],
  ["Outbound messaging", "การส่งข้อความออก"],
  ["Customer communication", "การสื่อสารกับลูกค้า"],
  ["Adaptive synchronization", "การซิงก์แบบปรับตัว"],
];

const evidenceSteps = [
  {
    number: "01",
    title: "Source",
    titleTh: "ที่มา",
    detail: "Use only bounded, attributable input.",
    detailTh: "ใช้ข้อมูลที่มีขอบเขตและระบุที่มาได้",
  },
  {
    number: "02",
    title: "Check",
    titleTh: "ตรวจ",
    detail: "Validate locally against the stated rule.",
    detailTh: "ตรวจในเครื่องตามกติกาที่ระบุไว้",
  },
  {
    number: "03",
    title: "Receipt",
    titleTh: "หลักฐาน",
    detail: "Record the exact result, including failure.",
    detailTh: "บันทึกผลจริง รวมถึงผลที่ไม่ผ่าน",
  },
  {
    number: "04",
    title: "Decision",
    titleTh: "ตัดสิน",
    detail: "The owner decides whether a held gate moves.",
    detailTh: "เจ้าของเป็นผู้ตัดสินใจว่าจะขยับเกตหรือไม่",
  },
];

export default function Home() {
  return (
    <main className="command-center">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <div className="shell">
        <header className="masthead">
          <div className="brand-lockup" aria-label="SIRINX internal command center">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <strong>SIRINX</strong>
              <small>GHOSTCLAW · HERMES V3</small>
            </span>
          </div>

          <div className="access-posture">
            <span className="live-dot" aria-hidden="true" />
            <span>
              <strong>OWNER VIEW · READ ONLY</strong>
              <small>มุมมองเจ้าของ · อ่านอย่างเดียว</small>
            </span>
          </div>
        </header>

        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">47 RONIN · CONTROL BRIEF / สรุปการควบคุม</p>
            <h1 id="page-title">
              Command Center
              <span>ภาพรวมศูนย์บัญชาการ</span>
            </h1>
            <p className="hero-lede">
              A calm, evidence-led overview of the GHOSTCLAW and Hermes V3 work lane.
              This is a curated planning snapshot—not live telemetry and not an operator console.
            </p>
            <p className="hero-lede hero-lede-th" lang="th">
              ภาพรวมงาน GHOSTCLAW และ Hermes V3 ที่ยึดหลักฐานเป็นศูนย์กลาง
              เนื้อหานี้เป็นสรุปเพื่อการวางแผน ไม่ใช่สถานะสดและไม่ใช่หน้าสั่งการ
            </p>
          </div>

          <aside className="boundary-card" aria-labelledby="boundary-card-title">
            <div className="boundary-card-head">
              <span className="panel-code">BOUNDARY 00</span>
              <span className="held-label">HELD / ระงับ</span>
            </div>
            <h2 id="boundary-card-title">No production writes</h2>
            <p lang="th">ไม่มีการเขียนไปยังระบบจริง</p>
            <dl>
              <div>
                <dt>Surface</dt>
                <dd>Briefing only</dd>
              </div>
              <div>
                <dt>Commands</dt>
                <dd>None exposed</dd>
              </div>
              <div>
                <dt>Final authority</dt>
                <dd>Human owner</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="snapshot-grid" aria-label="Command center posture">
          <article className="snapshot-card">
            <span className="snapshot-index">01</span>
            <p>Presentation / การแสดงผล</p>
            <strong>Curated snapshot</strong>
            <small>Static briefing · not live telemetry</small>
          </article>
          <article className="snapshot-card">
            <span className="snapshot-index">02</span>
            <p>Control state / สถานะควบคุม</p>
            <strong className="green-text">All gates held</strong>
            <small>Default posture remains fail-closed</small>
          </article>
          <article className="snapshot-card">
            <span className="snapshot-index">03</span>
            <p>Work lane / ช่องทางงาน</p>
            <strong>B1 + B2 verified</strong>
            <small>{WORK_LANE_STATUS.en} · {WORK_LANE_STATUS.th}</small>
          </article>
        </section>

        <section className="panel ronin-panel" aria-labelledby="ronin-title">
          <header className="panel-heading">
            <div>
              <p className="eyebrow">OPERATING FLOW / ลำดับการทำงาน</p>
              <h2 id="ronin-title">47 Ronin, one gated path</h2>
            </div>
            <p className="panel-note">
              Observe → analyze → decide → coordinate
              <span lang="th">รับรู้ → วิเคราะห์ → ตัดสินใจ → ประสานงาน</span>
            </p>
          </header>

          <div className="ronin-layout">
            <ol className="ronin-flow">
              {roninStages.map((stage) => (
                <li key={stage.layer} className="ronin-stage">
                  <div className="stage-topline">
                    <span className="stage-layer">{stage.layer}</span>
                    <span className="stage-count">RONIN {stage.count}</span>
                  </div>
                  <h3>
                    {stage.title}
                    <span lang="th">{stage.titleTh}</span>
                  </h3>
                  <p>{stage.detail}</p>
                  <p lang="th">{stage.detailTh}</p>
                </li>
              ))}
            </ol>

            <aside className="research-rail" aria-label="L5 research advisory lane">
              <span className="stage-layer">L5</span>
              <span className="stage-count">RONIN 44–47</span>
              <h3>
                Research advisory
                <span lang="th">ฝ่ายวิจัยให้คำแนะนำ</span>
              </h3>
              <p>Advises every layer. It does not bypass the ordered flow or the held gates.</p>
              <p lang="th">ให้คำแนะนำได้ทุกชั้น แต่ไม่ข้ามลำดับงานหรือเกตที่ระงับไว้</p>
              <div className="human-decision">
                <span aria-hidden="true">◆</span>
                <p>
                  Human decides last
                  <small lang="th">มนุษย์ตัดสินใจขั้นสุดท้าย</small>
                </p>
              </div>
            </aside>
          </div>
        </section>

        <div className="two-column">
          <section className="panel gates-panel" aria-labelledby="gates-title">
            <header className="panel-heading compact-heading">
              <div>
                <p className="eyebrow">SAFETY POSTURE / แนวทางความปลอดภัย</p>
                <h2 id="gates-title">Held safety gates</h2>
              </div>
              <span className="held-label">5 HELD</span>
            </header>

            <ul className="gate-list">
              {heldGates.map(([label, labelTh], index) => (
                <li key={label}>
                  <span className="gate-number">0{index + 1}</span>
                  <span className="gate-name">
                    <strong>{label}</strong>
                    <small lang="th">{labelTh}</small>
                  </span>
                  <span className="gate-state">
                    HELD
                    <small>ระงับ</small>
                  </span>
                </li>
              ))}
            </ul>

            <p className="panel-footnote">
              A gate moves only after an exact approval ticket and a reviewable evidence packet.
              <span lang="th">เกตจะขยับเมื่อมีรายการอนุมัติที่ชัดเจนและชุดหลักฐานที่ตรวจสอบได้เท่านั้น</span>
            </p>
          </section>

          <section className="panel work-panel" aria-labelledby="work-title">
            <header className="panel-heading compact-heading">
              <div>
                <p className="eyebrow">CURRENT LANE / ช่องทางงานปัจจุบัน</p>
                <h2 id="work-title">B1 / B2 completed</h2>
              </div>
              <span className="progress-label">VERIFIED</span>
            </header>

            <div className="work-stack">
              <article className="work-card">
                <div className="work-card-head">
                  <span>B1</span>
                  <span>{WORK_LANE_STATUS.en}</span>
                </div>
                <h3>Gate persistence</h3>
                <p>Store-backed reload and fail-closed write-through behavior passed local tests.</p>
                <p lang="th">การโหลดสถานะจากที่เก็บและการเขียนแบบปิดเมื่อผิดพลาด ผ่านการทดสอบในเครื่องแล้ว</p>
              </article>

              <article className="work-card">
                <div className="work-card-head">
                  <span>B2</span>
                  <span>{WORK_LANE_STATUS.en}</span>
                </div>
                <h3>Recovery learning loop</h3>
                <p>Failure → lesson → bounded retry passed local tests without a production side effect.</p>
                <p lang="th">ล้มเหลว → บทเรียน → ลองใหม่แบบจำกัด ผ่านการทดสอบโดยไม่กระทบระบบจริง</p>
              </article>
            </div>

            <p className="work-disclaimer">
              Verified means the source checks passed; live runtime activation remains a separate gate.
              <span lang="th">ตรวจสอบแล้วหมายถึงซอร์สผ่านชุดตรวจ ส่วนการเปิดใช้งานจริงยังเป็นอีกเกตหนึ่ง</span>
              <small>{EVIDENCE_SNAPSHOT}</small>
            </p>
          </section>
        </div>

        <section className="panel evidence-panel" aria-labelledby="evidence-title">
          <header className="panel-heading">
            <div>
              <p className="eyebrow">TRUTH PROTOCOL / กติกาความจริง</p>
              <h2 id="evidence-title">Evidence before status</h2>
            </div>
            <p className="panel-note">
              Production-looking is not production-proven.
              <span lang="th">ดูเหมือนพร้อม ไม่เท่ากับพิสูจน์แล้ว</span>
            </p>
          </header>

          <ol className="evidence-flow">
            {evidenceSteps.map((step) => (
              <li key={step.number}>
                <span className="evidence-number">{step.number}</span>
                <h3>
                  {step.title}
                  <span lang="th">{step.titleTh}</span>
                </h3>
                <p>{step.detail}</p>
                <p lang="th">{step.detailTh}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="final-boundary" aria-labelledby="final-boundary-title">
          <div className="boundary-sigil" aria-hidden="true">
            <span>0</span>
            <small>WRITE</small>
          </div>
          <div>
            <p className="eyebrow">OWNER-ONLY BRIEF / สรุปสำหรับเจ้าของ</p>
            <h2 id="final-boundary-title">A view into the work—not a way into production.</h2>
            <p>
              This surface does not accept commands, change runtime state, activate deployments,
              send outbound messages, or expose sensitive operational material.
            </p>
            <p lang="th">
              หน้านี้ไม่รับคำสั่ง ไม่เปลี่ยนสถานะระบบ ไม่เปิดการนำขึ้นระบบจริง
              ไม่ส่งข้อความออก และไม่เปิดเผยข้อมูลปฏิบัติการที่ละเอียดอ่อน
            </p>
          </div>
        </section>

        <footer className="footer">
          <p>SIRINX · GHOSTCLAW · HERMES V3</p>
          <p>READ ONLY · EVIDENCE FIRST · HUMAN FINAL</p>
        </footer>
      </div>
    </main>
  );
}
