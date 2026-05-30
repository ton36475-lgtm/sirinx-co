# Broadpung to Chokma Growth OS Migration Path

เอกสารฉบับนี้อธิบายเส้นทางการย้ายงานจากกระบวนการ **Manual Broadcast / Broadpung** ไปสู่ระบบ **Chokma Growth OS** แบบค่อยเป็นค่อยไป โดยยังคงสร้างมูลค่าทางธุรกิจได้ระหว่างพัฒนา ไม่จำเป็นต้องรอให้ระบบอัตโนมัติครบทุกชั้นก่อนจึงเริ่มใช้งานจริง

| ระยะ | สภาพการทำงาน | สิ่งที่ทีมยังทำแบบเดิม | สิ่งที่ระบบใหม่เริ่มรับช่วง | ผลลัพธ์ที่ควรได้ |
| --- | --- | --- | --- | --- |
| Phase 0 | Manual-first | Broadcast ส่งมือทั้งหมด | เก็บ lead, UTM, campaign และ CRM notes | เริ่มมีฐานข้อมูลเดียวสำหรับติดตามผล |
| Phase 1 | Assisted broadcast | ทีมเลือกกลุ่มและส่งเอง | ระบบจัด segment whale, แสดง deposit history, แสดง actual vs result | ตัดสินใจส่งแม่นขึ้น |
| Phase 2 | Queue-based broadcast | ทีมอนุมัติข้อความก่อนส่ง | ระบบสร้าง broadcast queue, จัดลำดับกลุ่มเป้าหมาย, บันทึก planned vs actual | วัดผลการ broadcast ได้ชัด |
| Phase 3 | Automation-ready | ทีมตรวจเฉพาะเคสสำคัญ | ระบบเรียก workflow อัตโนมัติตาม trigger เช่น ฝากครั้งแรก, เงียบเกินกำหนด, VIP follow-up | ลดงาน manual และตอบสนองเร็วขึ้น |

## 1. ข้อมูลขั้นต่ำที่ต้องย้ายจาก Broadpung

ระบบใหม่ไม่จำเป็นต้องย้ายทุกอย่างในวันแรก ควรเริ่มจากข้อมูลที่สร้างผลต่อรายได้ทันที ได้แก่

1. **รายชื่อผู้ติดต่อหลัก** เช่น ชื่อเล่น, เบอร์โทร, LINE ID, Telegram
2. **segment ปัจจุบัน** เช่น ลูกค้าใหม่, ลูกค้าฝากซ้ำ, กลุ่ม VIP, กลุ่มเสี่ยงหาย
3. **ประวัติการติดตามล่าสุด** เช่น คุยครั้งล่าสุดเมื่อไร, ข้อเสนอที่เคยใช้, ผลตอบรับ
4. **แหล่งที่มาเดิม** หากพอทราบว่า lead มาจากแอด, organic, affiliate หรือ broadcast เดิม
5. **ยอดฝากเชิงสรุป** อย่างน้อยยอดฝากสะสมหรือสถานะ first deposit / repeat deposit

| ฟิลด์เดิมจากงาน manual | ฟิลด์ปลายทางใน Chokma Growth OS |
| --- | --- |
| ชื่อ / ชื่อเล่น | `leads.fullName` |
| เบอร์โทร | `leads.phone` |
| LINE / Telegram | `leads.lineId`, `leads.telegramHandle` |
| แหล่งที่มา | `leads.sourceType`, `utm*`, `campaignId` |
| สถานะลูกค้า | `leads.leadStatus`, `customerProfiles.followUpStatus` |
| ระดับ VIP | `customerProfiles.vipLevel`, `affordabilityBand` |
| ยอดฝากสะสม | `customerProfiles.cumulativeDeposit` |
| หมายเหตุทีมขาย | `vipNotes.content` |

## 2. รูปแบบการทำงานระหว่างช่วงเปลี่ยนผ่าน

ในช่วงแรก ทีม broadcast ยังสามารถทำงานผ่านเครื่องมือเดิมได้ แต่ทุก action สำคัญควรถูกบันทึกกลับเข้าระบบใหม่ เพื่อไม่ให้ข้อมูลแยกเป็นหลายกอง

> หลักคิดคือ “ส่งจากที่เดิมได้ แต่ต้องบันทึกผลเข้าที่เดียว”

### ขั้นตอนแนะนำ

| ขั้นตอน | ผู้รับผิดชอบ | เครื่องมือหลัก | สิ่งที่ต้องบันทึกกลับเข้าระบบ |
| --- | --- | --- | --- |
| ดึงรายชื่อเป้าหมาย | ทีม CRM | Dashboard + CRM | segment, lead status, whale priority |
| เตรียมข้อความ | ทีมปฏิบัติการ | Broadpung / manual tool | queue name, channel, objective |
| ส่งข้อความ | ทีมปฏิบัติการ | Broadpung | จำนวนที่ส่ง, เวลาส่ง, กลุ่มที่ใช้ |
| ตรวจผลตอบกลับ | ทีม CRM | CRM page | note, follow-up status, deposit outcome |
| สรุป planned vs actual | ทีมมาร์เก็ตติ้ง | Dashboard | expected result, actual result, action count |

## 3. Trigger ที่ควรทำ automation ก่อน

เพื่อให้แต่ละโมดูลสร้างมูลค่าได้ทันที ควรเริ่มจาก trigger ที่สัมพันธ์กับรายได้โดยตรงมากที่สุด

| ลำดับ | Trigger | เหตุผลเชิงธุรกิจ | Action ที่ระบบควรทำ |
| --- | --- | --- | --- |
| 1 | Lead ใหม่มูลค่าสูง | โอกาสปิดการขายสูง | ติด tag whale prospect, แจ้งทีม, สร้าง follow-up task |
| 2 | First deposit สำเร็จ | เป็นจุดเริ่ม retention | ย้าย segment, เพิ่ม VIP note, ตั้ง next follow-up |
| 3 | เงียบเกิน 3-7 วัน | ลดการหลุดของลูกค้า | สร้าง broadcast queue สำหรับ reactivation |
| 4 | ฝากซ้ำถึง threshold | ใช้ระบุ VIP / whale | อัปเดต vipLevel และ affordability band |
| 5 | Campaign ทำ CPA สูงผิดปกติ | ป้องกันต้นทุนบาน | แจ้ง dashboard และส่งให้ทีมปรับแคมเปญ |

## 4. โครงสร้าง queue ที่ควรใช้ในระบบใหม่

แม้วันนี้จะยังไม่ยิงออกอัตโนมัติทั้งหมด แต่ควรใช้โครงสร้าง queue เดียวกันตั้งแต่ต้นเพื่อรองรับการ automate ภายหลัง

| Queue type | กลุ่มเป้าหมาย | ตัวอย่างเงื่อนไข | KPI หลัก |
| --- | --- | --- | --- |
| New lead follow-up | lead ใหม่จากแอด | submit ภายใน 24 ชม. | contact rate |
| Whale nurture | whale / vvip | predicted value สูง หรือมียอดฝากสะสมสูง | repeat deposit |
| Reactivation | ลูกค้าเงียบ | ไม่มี activity ตามช่วงเวลา | reactivation rate |
| Promo announcement | segment ตามข้อเสนอ | สนใจหวยรัฐบาล / โปรเครดิตฟรี / referral | CTR / deposit lift |

## 5. แนวทางใช้งานร่วมกับ Google Workspace

หากทีมยังพึ่งพา Google Sheets หรือ Docs อยู่ สามารถใช้เป็นชั้น approval หรือ archive ได้ในช่วงเปลี่ยนผ่าน โดยไม่ทำให้ระบบหลักแตกออกจากกัน

- ใช้ **Google Sheets** เป็นที่ review รายชื่อ queue ก่อนส่งจริง
- ใช้ **Google Docs** เป็นแม่แบบข้อความ broadcast ที่ต้องมีคนอนุมัติ
- ให้ระบบ Chokma Growth OS เป็น **source of truth** สำหรับ lead, profile, deposit, และผลลัพธ์จริง
- ใช้ Workspace เป็นชั้นเสริมสำหรับงานทีม ไม่ใช่ฐานข้อมูลหลักระยะยาว

## 6. Definition of Done สำหรับ migration รอบแรก

ถือว่าการย้ายงานระยะที่หนึ่งสำเร็จเมื่อครบเงื่อนไขต่อไปนี้

- Lead ใหม่ทุกคนเข้าระบบพร้อม UTM/source attribution
- Whale/VIP profiles ถูกดูและใน CRM พร้อม note timeline
- มี deposit history แสดงใน CRM สำหรับ lead ที่เกี่ยวข้อง
- Dashboard แสดง snapshot และ per-campaign CPA/ROI ได้จาก backend จริง
- Broadcast queue ใหม่ถูกนิยามในระบบ แม้ทีมจะยังใช้ manual send อยู่ก็ตาม
- ทีมสามารถอธิบายได้ว่าผลลัพธ์ใดมาจากแคมเปญไหน และ action ใดมาจาก automation หรือ manual

## 7. งานต่อจากนี้

งานลำดับถัดไปที่ควรพัฒนาต่อทันทีมีดังนี้

1. เพิ่มหน้า operations หรือ queue manager สำหรับ broadcast queues
2. เพิ่ม mutation สำหรับสร้าง/อัปเดต queue จาก CRM segment
3. เพิ่ม logging ของผลส่งจริง เช่น sent, replied, deposited
4. เพิ่ม success/error path tests สำหรับ dashboard, CRM, และ queue workflows
5. เตรียม import script สำหรับย้ายข้อมูลจากไฟล์ CSV/Google Sheets เข้าระบบอย่างปลอดภัย
