# SirinX BESS Growth Engine — implementation package

**สถานะ ณ 15 ตุลาคม 2026:** ทำส่วนที่อยู่ในขอบเขต local-only เสร็จแล้วใน static prototype; **ยังไม่แก้ live site, repository จริง, DNS, CRM, database หรือ production**. หน้าใหม่ตั้ง `noindex,nofollow` ไว้เพื่อป้องกันการเผยแพร่โดยไม่ตั้งใจ.

## สิ่งที่ดำเนินการแล้ว

| งาน | ผลที่ทำในแพ็กเกจนี้ | ขอบเขต |
|---|---|---|
| BESS hero offer สำหรับ `.co` | เพิ่ม featured BESS panel ในหน้า `.co` prototype และหน้า `/bess.html` แยกสำหรับ service/assessment intent | ไม่แทน hero Solar Carport เดิม; ไม่มีราคา/ROI/ผลประหยัด/การรับรอง compatibility |
| BESS knowledge สำหรับ `.org` | เพิ่มทางเข้า `/bess-knowledge.html` หลัง directory เดิม; อธิบาย BESS, kW/kWh, losses และสถานะหลักฐาน | directory 6 ภูมิภาค/77 ลิงก์และ CTA เดิมยังอยู่ |
| Product/knowledge master | เพิ่ม `public/data/bess-master.json` เป็นชุดระเบียนเดียวสำหรับหน้าใหม่และ mock API | แยก DOE general education, manufacturer-reported specs, website claims และ pending items |
| Assessment flow | เพิ่มแบบ brief แบบไม่เก็บข้อมูลติดต่อ; local mock API รองรับ goal, load profile, Solar status และ site-data status | ไม่มี calculation, persistence, lead creation, CRM, email หรือ production API |
| API / Postman | ขยาย OpenAPI schema และเพิ่ม BESS-specific request ใน Postman collection | loopback-only; ใช้ข้อมูลสังเคราะห์/ไม่ระบุบุคคลเท่านั้น |
| SEO/AEO/GEO | แยก intent: `.org` = ความรู้/หลักฐาน; `.co` = บริการ/assessment; มีคำถาม-คำตอบ, แหล่งอ้างอิง, status และ internal links | หน้าต้นแบบเป็น noindex; ยังไม่ตั้ง canonical, schema, sitemap หรือ production metadata |
| Content/evidence pipeline | ระเบียน source URL, publisher, review date, status, conflict, owner-gap และ publish blockers | ชื่อ owner/สิทธิ์ใช้ข้อมูล/เอกสารภายในยังไม่ทราบ |
| 90-day execution plan | กำหนด gate, workstream, KPI definition และเกณฑ์ go-live ไว้ด้านล่าง | ตัวเลข traffic/lead target ต้องตั้งหลังเก็บ baseline และยืนยัน capacity |

## Live-site / source observation

ตรวจแบบ read-only วันที่ **15 ตุลาคม 2026**:

- `https://sirinx.org/` ยังคงมี knowledge directory แยก 6 ภูมิภาคและลิงก์จังหวัดครบ 77 รายการในเนื้อหาที่อ่านได้; CTA ชี้ไปยังบริการที่ `sirinx.co`.
- `https://www.sirinx.co/` ยังนำเสนอ Solar Carport เป็น hero/flagship และแสดง BESS เป็นหนึ่งใน ecosystem; หน้า assessment ระบุการประมาณ 25 ปี, IRR และ LCOE พร้อมคำเตือนว่าผลเป็นการประเมินเบื้องต้น.
- การตรวจนี้ไม่ยืนยันว่า public repository ใดเป็น deployment source ของ `.org` หรือ `.co`; จึงทำเฉพาะไฟล์ในแพ็กเกจ prototype.

## Product/evidence master: สถานะที่ใช้ในหน้า

### GSL051314A-B-GBP2

หน้า manufacturer ที่ตรวจวันที่ 15 ต.ค. 2026 แสดงในตาราง: 51.2 V, 314 Ah, 16.07 kWh nominal, recommended discharge energy 14.47 kWh ที่ 90% DoD, 150 A recommended charge/discharge, 200 A max, peak 300 A ระยะ 2 นาทีที่ 25°C, 16 หน่วย parallel และ IP65. **ทั้งหมดเป็น manufacturer-reported claims ไม่ใช่การตรวจสอบอิสระ.**

หน้าเดียวกันมีข้อความอีกส่วนระบุ 16.38 kWh สำหรับรุ่น 314Ah จึงบันทึก conflict `16.07 vs 16.38 kWh`; ค่า 16.07 kWh แสดงใน prototype เฉพาะเพราะเป็นค่าจากตาราง โดยไม่ใช้เป็นข้อสรุปสำหรับเสนอราคา/ออกแบบ. ต้องได้ datasheet ปัจจุบันพร้อม revision และยืนยันโดยเจ้าของผลิตภัณฑ์ก่อนใช้จริง.

### GSL 5000U / 10000U และ inverter

ยังไม่เผยแพร่ค่า IP เป็น fact แบบแยก SKU: brief เดิมอ้าง IP50 ขณะที่แหล่ง family-level มีข้อความ IP65 แต่ไม่มีเอกสารเฉพาะรุ่นที่ยืนยันในชุดตรวจนี้. inverter compatibility/PEA listing ก็ยังไม่ยืนยันกับรุ่น/firmware/protocol ที่ระบุ. รายการเหล่านี้ถูกเก็บเป็น `pending`.

**ห้ามใช้ master นี้เพื่อ** final sizing, inverter compatibility, engineering recommendation, ROI/IRR/LCOE, savings forecast, price/quote, lead creation, telemetry หรือ device control.

## เส้นทางผู้ใช้และการวาง intent

1. `.org` ให้คำตอบทั่วไป, glossary, source citations, วันที่ตรวจ, product evidence state และรายการสิ่งที่ยังไม่ยืนยัน.
2. ผู้สนใจบริการไป `.co` BESS offer/assessment.
3. assessment รับเพียง business type, จังหวัดแบบไม่ระบุที่อยู่, เป้าหมาย, รูปแบบโหลด, Solar status และสถานะเอกสารโหลด/ค่าไฟ.
4. ใน local preview ข้อมูลอยู่ใน browser หรือส่งเฉพาะ `127.0.0.1:8766/api/v1/assessments`; ไม่สร้าง record และ server ไม่บันทึก body.
5. หลัง go-live ในอนาคต ให้ส่งต่อ lead ได้ต่อเมื่อระบบจริง, privacy notice/consent, owner, schema, access control, retention, security, CRM connector และผู้รับผิดชอบ follow-up ผ่านการยืนยันและอนุมัติแยกต่างหาก.

### CRM funnel ที่เสนอ (ยัง OFFLINE)

`Organic/Referral visit → BESS service page → assessment start → consented lead → triage/qualification → engineering review → site survey → approved proposal → won/lost/nurture`

สถานะปัจจุบันในแพ็กเกจจบที่ **anonymous assessment brief** เท่านั้น. ไม่มี contact capture, lead, CRM sync, email, booking หรือการจองทีมสำรวจ. Owner ของ marketing, sales/qualification, engineering, privacy/security และ CRM ยังเป็น `TBD`.

## 90-day roadmap (เริ่มนับเมื่อมี source, owner และ deployment access ที่ได้รับอนุญาต)

| ช่วง | งาน | Gate / ผลส่งมอบ |
|---|---|---|
| Days 1–14 · Verify | ยืนยัน repo/deployment mapping ของทั้งสองโดเมน; ระบุ product owner; ขอ datasheet รุ่น/revision, inverter/PEA evidence, project measurement/permission; ตั้ง GSC/GA4 baseline และ lead qualification criteria | **ไม่ผ่าน = ห้าม publish/ต่อ CRM**; claim ledger มี owner, source, status, review date ครบ |
| Days 15–30 · Stage | port เฉพาะ module ที่อนุมัติเข้าสู่ branch/preview ที่ถูกต้อง; คง route/heading/canonical เดิม; เพิ่ม internal links, FAQs, metadata/schema draft และ instrumentation plan; QA มือถือ/keyboard/technical SEO | owner sign-off บน staging; zero broken routes; 100% public claims มี provenance; privacy/security review ผ่าน |
| Days 31–60 · Controlled pilot | เปิด BESS product/knowledge pages หลัง go-live approval; ทดลอง CTA/assessment โดยใช้ข้อความไม่สัญญาผล; เริ่ม lead capture/CRM เฉพาะหลังยืนยัน consent, schema, API auth, retention และผู้รับผิดชอบ follow-up | pilot มี rollback; analytics event ถูกทดสอบ; lead routing ทำงานเฉพาะเมื่อผ่านอนุมัติ; ตรวจ evidence/claims รายสัปดาห์ |
| Days 61–90 · Learn & expand | วิเคราะห์ query และ conversion; ปรับ FAQs/links/CTA ตามข้อมูลจริง; พิจารณา content cluster จังหวัดหรือ use case ทีละกลุ่ม; ทบทวน qualified lead quality, response time และ claim freshness | ขยายเฉพาะเมื่อมีหลักฐาน demand, engineering/sales capacity และ owner approval; สรุปผล 90 วันเทียบ baseline |

> หากยังไม่มีผู้รับผิดชอบ production access และ source verification ให้ใช้เวลาใน roadmap กับการเตรียมหลักฐาน/ทดสอบ prototype แทนการ deploy.

## KPI definitions และเป้าหมาย

ค่า baseline ยังไม่อยู่ในข้อมูลที่เข้าถึงได้ จึง **ไม่สร้างตัวเลข traffic, conversion หรือ lead ที่คาดว่าจะได้**. วัด baseline ช่วง Days 1–14 หลังเชื่อม analytics ที่ได้รับอนุญาต แล้วกำหนด targets กับ owner.

| KPI | สูตร / แหล่งข้อมูล | เกณฑ์เริ่มต้น |
|---|---|---|
| BESS organic visibility | non-brand BESS impressions/clicks/CTR ใน Search Console แยก `.org` knowledge และ `.co` service | baseline 14 วัน; ตั้ง target หลังดู query, geography และ indexation |
| Intent handoff | clicks `.org → .co` / eligible `.org` sessions; event ผ่าน analytics ที่อนุมัติ | baseline ก่อน A/B test; ไม่รวม prototype events เป็น production |
| Assessment completion | valid completions / assessment starts; event เฉพาะ consent/privacy-approved | hypothesis +15% relative by Day 90 ได้เฉพาะเมื่อมี ≥30 starts และไม่มีคุณภาพข้อมูล/consent ลดลง; เป็นเป้าทดลอง ไม่ใช่ forecast |
| Qualified lead rate | leads ผ่าน qualification criteria / consented leads ใน CRM | criteria และ baseline ต้องอนุมัติโดย sales owner; ไม่กำหนดจำนวน leads จนทราบ capacity |
| First-response time | median เวลาจาก consented submission ถึง first human response ใน CRM | ตั้ง SLA หลัง service owner ยืนยัน capacity; prototype ไม่มี timestamps/CRM |
| Evidence coverage | factual public claims ที่มี source + status + review date / factual claims ทั้งหมด | 100% ก่อน publish; 0 unsupported savings/compatibility/ROI claims |
| Source freshness | จำนวน claims ที่เกิน review date / claims ที่เผยแพร่ | เจ้าของเนื้อหากำหนด review cadence; resolve product conflict ก่อนเผยแพร่ |
| Technical quality | broken internal routes, console errors, unintended external calls, mobile overflow | 0 broken routes / 0 runtime errors / 0 unintended external requests ก่อน release; ทดสอบบน staging |

## Go-live checklist ที่ยัง BLOCKED

- [ ] เจ้าของยืนยัน repo/branch/commit และระบบที่ serve production สำหรับ `sirinx.co` และ `sirinx.org`.
- [ ] สิทธิ์เข้าถึง source/private repositories/Drive ที่เกี่ยวข้องและ permission scope.
- [ ] Product owner ส่ง datasheet รุ่น/revision และยืนยันตัวเลข GSL 16.07/16.38 kWh; ยืนยัน GSL 5000U/10000U IP level เป็นราย SKU.
- [ ] วิศวกรตรวจ inverter exact model/firmware/protocol, utility/PEA evidence, protection, installation and local safety requirements.
- [ ] ยืนยันหลักฐานโครงการ, measurement methods, claim approval และ photo/brand rights ก่อนทำ case study.
- [ ] เลือก CRM/endpoint ที่อนุมัติ; ระบุ data controller/processor, consent wording, privacy notice, retention/deletion, security, RLS/authorization, rate limit, audit และ idempotency.
- [ ] Product, SEO/content, engineering, sales, privacy/security owners อนุมัติ copy, metadata, schema, analytics events, rollback และ release window.
- [ ] มี staging test, backup/rollback proof และ explicit authorization ก่อนเปลี่ยน live site/production.

## Source list

- [SIRINX.CO live](https://www.sirinx.co/) — page structure/company copy, reviewed 2026-10-15.
- [SIRINX.CO assessment](https://www.sirinx.co/assessment/) — assessment copy/disclaimers, reviewed 2026-10-15.
- [SIRINX.ORG live](https://sirinx.org/) — knowledge directory, reviewed 2026-10-15.
- [GSL product listing — GSL051314A-B-GBP2](https://www.gsl-energy.com/gsl-energy-solar-lifepo4-battery-home-power-storage-wall-10kwh-51-2v-lithium-ion-batteries-for-house.html) — manufacturer claim, internally conflicting nominal energy, reviewed 2026-10-15.
- [GSL Home Wall Battery](https://www.gsl-energy.com/home-wall-battery.html) — general manufacturer page; not SKU-level proof for disputed 5000U/10000U rating, reviewed 2026-10-15.
- [U.S. DOE: Solar Integration and Storage Basics](https://www.energy.gov/cmei/systems/solar-integration-solar-energy-and-storage-basics) — general education on storage, power and energy capacity; not Thai project advice, reviewed 2026-10-15.
- [U.S. DOE: Solar-Plus-Storage 101](https://www.energy.gov/cmei/systems/articles/solar-plus-storage-101) — general education; historical U.S. pricing/statistics are intentionally not reused.

## Reproducible local preview and QA

```bash
cd /home/ubuntu/sirinx-bess-implementation
python3 mock_api_server.py --port 8766
# open http://127.0.0.1:8766/prototypes/
python3 tests/test_bess_prototype.py
```

Server listens on loopback only. `public/bess.html`, `public/bess-knowledge.html` and `/data/bess-master.json` are prototype artifacts; no web deployment occurred.


## Content/evidence pipeline and initial backlog

**Proposed workflow:** source collection → claim-by-claim record in `public/data/bess-master.json` → publisher/date/status/conflict check → engineering/product owner review → editorial/SEO review → owner approval → only then publish. Recheck or withdraw a stale/contradicted claim before refreshing page copy. Every public numeric value must cite its exact SKU/document revision, not a family marketing page. The prototype has no CMS workflow; the JSON is a versioned local master, not a production database.

| Priority | Content unit | Search intent / placement | Readiness |
|---|---|---|---|
| 1 | BESS คืออะไร? | Informational · `.org` | Draft implemented; cite DOE general education |
| 2 | kW vs kWh and why both matter | Informational · `.org` | Draft implemented; example explicitly not a sizing recommendation |
| 3 | What data to prepare before a BESS assessment | Commercial investigation · `.co` assessment | Implemented as non-calculating brief; engineering owner review still needed |
| 4 | Solar + storage operating goals | Informational · `.org` to `.co` handoff | General DOE source; Thailand-specific operating/pricing claims excluded |
| 5 | GSL product evidence card | Product comparison · `.co` / evidence · `.org` | Pending resolution of 16.07 vs 16.38 kWh and datasheet revision |
| 6 | 5000U/10000U protection/IP and inverter match | Product compatibility | Blocked on exact SKU datasheet and inverter/utility evidence |
| 7 | BESS economics / tariff / demand charge | Commercial / regional | Blocked on current Thai tariff, approved pricing model and verified inputs; no figures published |
| 8 | SIRINX BESS project case study | Proof / conversion | Blocked on commissioning, measurement/baseline, signed scope, customer permission and image rights |

Avoid generating provincial ROI tables from assumed tariffs or irradiance. Province pages can contextualize sources and regional conditions only after data sources, dates, method and reviewer are approved.
