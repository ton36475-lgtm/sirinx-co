# SIRINX — บันทึกตรวจเว็บจริงและ source ก่อนต่อยอดต้นแบบ

ตรวจแบบ read-only เมื่อ 8 ตุลาคม 2026 (เวลาไทย) เพื่อใช้เป็นฐานของ static prototype เท่านั้น ไม่มีการแก้เว็บไซต์จริง, repository, DNS, Cloudflare account settings หรือ production

## เว็บจริงที่เปิดดู

### `https://sirinx.org/`

- หน้าเว็บจริงใช้ชื่อ **SIRINX Knowledge** และหัวเรื่อง “คลังความรู้ Solar Carport, EV Charger และ BESS ของ SIRINX”.
- Summary บนหน้าเว็บระบุว่าเป็น knowledge layer (AEO/GEO) มีคำตอบสั้น ตาราง ROI ต่อจังหวัด และข้อมูลวิศวกรรมพลังงานสะอาดสำหรับไทย; งานติดตั้งจริงและใบเสนอราคาอยู่ที่ `www.sirinx.co`.
- โครงสร้างหลักที่เผยแพร่จริงคือรายการจังหวัดแบบลิงก์ แบ่ง 6 ภูมิภาค: Central, East, North, Northeast, West และ South รวมลิงก์จังหวัด 77 รายการ.
- หน้าแรกมี header สีเขียวเข้มบนพื้นขาว, brand link “SIRINX Knowledge”, summary callout และลิงก์ไป `.co`; เป็นหน้า directory ที่เรียบง่าย ไม่ใช่ dashboard/3D application.
- หน้า `https://sirinx.org/policy/` คืนเนื้อหาเดียวกับหน้าแรกในการตรวจครั้งนี้ จึงยังไม่มี policy hub เฉพาะที่ยืนยันได้จาก URL นี้.
- Source line สำหรับการต่อยอด `.org`: คง header/summary/ภูมิภาค/ลิงก์จังหวัด/footer CTA เดิมไว้ และเพิ่มโมดูล evidence หรือ status แยกเป็นส่วนขยายที่ติดป้ายว่าเป็นแนวคิด ห้ามแทนที่ directory เดิม.

### `https://sirinx.co/`

- หน้าเว็บจริงมี header/navigation สำหรับ หน้าหลัก, Solar Carport, โซลูชัน, อุตสาหกรรม, แพ็คเกจราคา, ผลงาน, การลงทุน, เกี่ยวกับเรา; มีการเลือกภาษา, theme toggle, ปุ่มประเมินโซลาร์ และขอใบเสนอราคา.
- Hero เป็น carousel 5 สไลด์ โดยสไลด์ที่เปิดเห็นระหว่างตรวจเปลี่ยนได้: ตัวอย่างที่ตรวจพบคือ Solar Carport โรงแรมเรือนแพ รอยัลปาร์ค, ภาพติดตั้งโรงแรมโฮลาเทล และสไลด์ภาพระบบจริงที่ไม่กล่าวตัวเลขผลลัพธ์ที่ยังไม่ผ่านการตรวจ.
- ลำดับเนื้อหาหลักจริง: Solar Carport flagship/เหตุผลและประโยชน์ → ecosystem (Carport/BESS/AI Energy Management/EV Charging) → solution cards → ขั้นตอน 4 ขั้น (สำรวจ/ออกแบบ/ติดตั้ง/O&M) → industries → track record → O&M → financing → CEO quote → FAQ → final CTA.
- ภาพจากโครงการถูกอ้างในหน้าเว็บจาก asset path ของโดเมนเดียวกัน เช่น `/assets/optimized/hero-carport-aerial-1280.jpg`, `/assets/optimized/solar-carport-ev.jpg`, `/assets/projects/ruenphae/20260924/1000076001.jpg` และ `/assets/projects/holatel/20260924/1000075878.jpg`.
- รูปลักษณ์ที่เห็นเป็นธีมเข้ม navy/ดำ มี accent cyan/teal และ gold, โลโก้ SIRINX, navigation ด้านบน และ hero ภาพเต็ม; จึงไม่ควรแทนด้วย brand/layout ใหม่.

### หน้าย่อย `.co`

- `https://sirinx.co/projects/` ระบุภาพผลงานโรงแรมเรือนแพ รอยัลปาร์คและโรงแรมโฮลาเทล พร้อมแนวคิดโครงการที่ยังไม่มีหลักฐานส่งมอบ; รายละเอียดรุ่นอุปกรณ์/สเปก/การรับประกันรอตรวจ Evidence Record และสิทธิ์ใช้ข้อมูล.
- `https://sirinx.co/assessment/` อธิบายเครื่องมือ Solar PV + BESS ที่มีประมาณการ 25 ปี, IRR, LCOE และเตือนว่าผลเป็นการประเมินเบื้องต้น ไม่ใช่ข้อเสนอ/การรับประกัน; ข้อมูลอ้างอิงต้องตรวจที่มาและเวอร์ชันก่อนตัดสินใจ.
- Prototype จะยืมลำดับ input จาก assessment แต่ไม่รัน calculation, ไม่แสดงผลตอบแทนจำลองเป็นผลจริง และไม่ส่งข้อมูลออกจาก browser.

## Repository และ source code

### `ton36475-lgtm/sirinx-co`

- Repository สาธารณะ; default branch `main`; branch/commit ที่อ่านได้ ณ การตรวจ: `main` head `6002430bd419c6043846b45434e34963c2396716` (repo metadata ระบุอัปเดต 27 ก.ย. 2026).
- `main` มี source ของหน้า `.co` เช่น `apps/public-web/client/src/pages/Home.tsx`, `components/HeroSlideshow.tsx`, `pages/Projects.tsx`, `pages/SolarAssessment.tsx` และ `src/index.css`. โครงและเนื้อหาหลักสอดคล้องกับ section order และ assets ที่เห็นบน `.co`; ใช้เป็นฐานของ static adaptation.
- `feat/sirinx-org-clay-anime` head `3c979032ba42bbbff544a71da04e8c2bc50f56d5` มีอยู่จริง แต่เป็น branch feature ที่มี prototype files (`docs/prototypes/sirinx-org-clay-anime.html`, `docs/prototypes/sirinx-org-solar-intelligence-v2.html`) และไม่ถือว่าเป็น live/production.
- ไฟล์ `.org` prototype เก่ามีแนวคิด Evidence Registry และ Energy Lab แต่มี animation dependency และตัวเลขตัวอย่าง จึงใช้ได้เฉพาะโครงแนวคิด/การต่อยอดที่ผ่านการลด motion และติดป้าย scenario; ไม่ใช้ตัวเลขเดิมเป็น fact.

### `ton36475-lgtm/sirinx`

- Repository สาธารณะ `main` head `9d2e081fc037fad0b0153c2ad33751a36a54f3cf`; metadata ระบุอัปเดต 26 มิ.ย. 2026.
- มี `client/src/pages/Home.tsx` และ theme CSS ที่เกี่ยวข้องกับ Solar Carport แต่ source ที่เห็นไม่ตรงกับหน้า live `.org` ปัจจุบันซึ่งเป็น directory จังหวัด. ไม่พบหลักฐาน deployment mapping ระหว่าง repo นี้กับ live `.org`; จึงไม่อ้างว่า code ใน repo นี้เป็น source ที่ production ใช้อยู่.
- ตรวจ `ton36475-lgtm/sirinx-org` แล้วไม่พบ repository สาธารณะชื่อนี้ (HTTP 404).

## กติกาการนำไปใช้

1. `.org`: รักษาหน้า directory, headings, 6 regions, 77 ลิงก์ และ CTA เดิม; เพิ่ม evidence/policy status เป็นส่วนขยายที่ระบุสถานะและที่มา.
2. `.co`: รักษา hero/nav, ภาพจาก repo/site, ลำดับ solution/process/project/O&M/financing/FAQ และชื่อโครงการตามของเดิม; เพิ่ม provenance, assessment preview แบบ local-only และแยก website claim จากการตรวจอิสระ.
3. ใช้รูปที่ public source ของ SIRINX อ้างอยู่ โดยเก็บเป็น local assets ใน prototype; ไม่ใช้ asset จาก design-reference ภายนอก.
4. ไม่แก้ source repo หรือ live site; งานปัจจุบันสร้าง static prototype ใน workspace เท่านั้นและยังไม่ได้ deploy สู่สาธารณะ.


## Cross-check สถานะโครงการที่ตรวจเพิ่ม

- `https://www.sirinx.co/projects/` ระบุโรงแรมเรือนแพ รอยัลปาร์คและโรงแรมโฮลาเทลเป็นภาพงานติดตั้งจริง; รายละเอียดเชิงเทคนิคและตัวเลขผลลัพธ์ถูกจำกัดไว้จนกว่าจะผ่าน Evidence Record.
- `https://www.sirinx.co/projects/holatel-rim-nan/` ระบุว่าโครงการ Solar Rooftop ที่โรงแรมโฮลาเทลติดตั้งเรียบร้อยแล้ว พร้อมย้ำว่าไม่เผยกำลังผลิต รุ่นอุปกรณ์ ผลประหยัด หรือวันส่งมอบที่ยังไม่มีเอกสารยืนยัน.
- ความไม่ตรงกัน: live homepage ขณะเปิดอ่านแสดง Node 2 ว่า “ติดตั้งแล้ว”, ขณะที่ translation key ใน `main` ของ repo สำหรับสถานะ homepage ระบุ “รอตรวจสถานะ”. Project detail ของ live site รายงานว่าติดตั้งเสร็จ. Prototype จึงใช้ป้าย “LIVE DETAIL CLAIM” และแสดงความไม่ตรงกันกับ source; ไม่ยกระดับเป็นผลตรวจอิสระ.

## BESS recheck and additive prototype record — 15 October 2026

- Read-only recheck: `https://sirinx.org/` still exposes the 6-region/77-province knowledge directory; `https://www.sirinx.co/` still presents Solar Carport as its leading hero/flagship and BESS as an ecosystem component; `https://www.sirinx.co/assessment/` retains preliminary-assessment and source-version disclaimers.
- Added only local prototype routes `/bess-knowledge.html` and `/bess.html`; both set `noindex,nofollow`. Existing production routes, the `.org` directory, and Solar Carport section order remain unmodified.
- The GSL ENERGY listing for `GSL051314A-B-GBP2` has a same-page conflict: its model table states 16.07 kWh while another feature paragraph states 16.38 kWh for 314Ah. Prototype shows the table value with a visible conflict warning; it is not approved for engineering or quoting.
- `GSL 5000U / 10000U` ingress protection remains pending model-specific documentation: the brief cites IP50 while family-level marketing says IP65. No exact inverter model/firmware or verified PEA match was established.
- Sources fetched on this date: [DOE Storage Basics](https://www.energy.gov/cmei/systems/solar-integration-solar-energy-and-storage-basics), [DOE Solar-Plus-Storage 101](https://www.energy.gov/cmei/systems/articles/solar-plus-storage-101), [GSL product listing](https://www.gsl-energy.com/gsl-energy-solar-lifepo4-battery-home-power-storage-wall-10kwh-51-2v-lithium-ion-batteries-for-house.html), and [GSL Home Wall Battery](https://www.gsl-energy.com/home-wall-battery.html). These sources inform this package only; no manufacturer/search image was embedded.
- No live site, repository, DNS, CRM, database or production service was changed.
