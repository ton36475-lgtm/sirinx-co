# รายงานตรวจสอบ Prototype ในเครื่อง

**วันที่:** 9 ตุลาคม 2026  
**ขอบเขต:** static prototype + mock API ที่ `127.0.0.1:8766` เท่านั้น  
**สถานะ:** ผ่านการตรวจตามขอบเขต local-only ที่อนุมัติ

## การแก้ไขที่พบจากการทดสอบ

- Contact routing สำหรับ Assessment เคยชี้ไปที่ `/co.html#site-assessment` แต่หน้า `.co` มี anchor จริงเป็น `#assessment`.
- ปรับเส้นทางใน browser UI และ mock API ให้เป็น `/co.html#assessment` และเพิ่ม Postman assertion ป้องกันการย้อนกลับของ bug นี้.
- ปรับข้อความผลลัพธ์ Assessment ของ `.co` ให้แจ้งชัดว่าเป็น brief ตัวอย่างและ **ไม่บันทึก / ไม่ส่งข้อมูล**; ไม่คำนวณผลตอบแทน.

## ผลการทดสอบ

- **Postman/Newman:** 12 requests, 13 assertions — ผ่านทั้งหมด.
- **Direct API boundary checks:** GET fixtures ทั้ง 4, เส้นทาง Assessment, การปฏิเสธ field อ่อนไหว, และ unknown route — ผ่าน.
- **Browser UI:** 18 checks ผ่านด้วย Chromium ที่ติดตั้งในเครื่อง.
  - route filter และ reset
  - policy provenance fields
  - Contact → Assessment route
  - UI → same-origin loopback mock API
  - rights-register filter และ withdrawal/update preview
  - `.org` ค้นหา/คืนค่ารายการ 77 จังหวัด
  - `.co` local assessment brief
  - responsive viewport 390px ไม่มี horizontal overflow
  - โหลด Three.js/Anime.js จาก local files หลังผู้ใช้เลือก, motion controls, กลับ 2D fallback
  - `prefers-reduced-motion` ปิด animation
- **Browser network/runtime:** 37 requests ทั้งหมดอยู่ที่ loopback, 0 external requests, 0 JavaScript runtime errors.
- **Internal fragment audit:** 0 missing fragments ระหว่างสามหน้า static.
- **Server binding:** mock API ฟังเฉพาะ `127.0.0.1:8766`; หยุด static server เก่าที่ bind `0.0.0.0:8876` แล้ว.

## BESS addendum — 15 ตุลาคม 2026

- `python3 tests/test_bess_prototype.py`: ผ่าน static checks และ API checks; ยืนยัน directory 77 จังหวัด, BESS routes, noindex, source conflict, GET knowledge fixture และการปฏิเสธ PII/unknown fields.
- Chromium: หน้า `/bess.html` และ `/bess-knowledge.html` render product record จาก `bess-master.json`; BESS assessment ส่งเฉพาะข้อมูลไม่ระบุตัวตนไปยัง loopback `/api/v1/assessments`; response แสดง `persisted=false`, `leadCreated=false`, `calculationPerformed=false`.
- Browser: 390px ไม่มี horizontal overflow บนหน้า BESS, `.org` และ `.co`; ไม่มี localStorage; หน้า BESS มี 6 requests ทั้งหมดที่ `127.0.0.1:8766`, 0 external requests, 0 HTTP 4xx/5xx และ 0 JavaScript console/runtime errors.
- Screenshot QA: `qa/bess-preview-desktop.png` และ `qa/bess-preview-mobile.png`.
- Syntax/schema: Python compile, `node --check`, JSON parse, OpenAPI YAML parse และตรวจ `$ref` ไปยัง `AssessmentInput` ซึ่งมี BESS fields 4 รายการ — ผ่าน.
- Postman collection JSON มี 13 requests และมี BESS assertion; **Newman/Postman collection ยังไม่ได้รันซ้ำ** เพราะไม่มี Newman ใน environment นี้; direct mock API assertions ผ่านแล้ว.

## ขอบเขตและข้อจำกัด

ไม่มีการเชื่อมต่อ API จริง, CRM, email, LLM, cloud/GPU provider, meter, inverter, BESS หรือ production database; ไม่มีข้อมูลคงอยู่, migrations, DNS/Cloudflare/site deployment หรือการแก้ repository จริง. การทดสอบ Browser บล็อกทุก URL ที่ไม่ใช่ `127.0.0.1:8766`.

ตรวจ source สาธารณะของ GitHub แบบ metadata/path inventory และ manifest ตามที่บันทึกใน `SOURCE_AUDIT.md`; ไม่ได้อ่านเนื้อหา source ทุกไฟล์. Google Drive ที่ผู้ใช้ระบุยังไม่ได้อ่านเพราะยังไม่มีการอนุญาตบัญชีที่เข้าถึงได้. ดังนั้น inventory/stack/migration/prompt notes เป็น bounded public audit ไม่ใช่การรับรองว่าครอบคลุม private repositories หรือ Drive.
