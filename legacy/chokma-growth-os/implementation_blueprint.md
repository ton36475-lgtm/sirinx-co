# Chokma Growth OS: Implementation Blueprint

เอกสารฉบับนี้กำหนดกรอบการพัฒนาระบบ **Full-Stack Marketing & CRM Platform** สำหรับ **โชคมา.net** โดยยึดหลักว่าแต่ละโมดูลต้องสามารถเปิดใช้งานและสร้างมูลค่าได้ทันทีที่พัฒนาเสร็จ ไม่รอให้สถาปัตยกรรมทั้งหมดครบก่อนจึงเริ่มใช้งานจริง

## เป้าหมายเชิงระบบ

ระบบนี้จะเชื่อม 4 แกนหลักเข้าด้วยกัน ได้แก่ **Landing Page และ Lead Intake**, **Campaign Attribution และ Analytics**, **CRM สำหรับลูกค้าศักยภาพสูง**, และ **Operations Layer สำหรับ Actual vs Result กับ Broadcast Migration** เพื่อให้การหาลูกค้า การติดตามคุณภาพลีด การดูผลรายแคมเปญ และการต่อยอดไปสู่การติดตามลูกค้าปลาวาฬอยู่ในระบบเดียว

| แกนระบบ | ผลลัพธ์ที่ต้องได้ทันที | ผู้ใช้หลัก |
| --- | --- | --- |
| Landing + Lead Intake | รับลีดจริงพร้อม UTM และแหล่งที่มา | ทีม acquisition |
| Analytics + Dashboard | เห็นผลรายวันของ lead, deposit, CPA, ROI | เจ้าของกิจการและทีมซื้อสื่อ |
| CRM + Whale Segmentation | จัดลำดับลีด/ลูกค้ามูลค่าสูงและติดตามต่อ | ทีมเซลส์และ CRM |
| Broadcast + Automation Layer | วางทางย้ายจากงาน manual ไปสู่ automation | ทีมปฏิบัติการ |

## หลักการออกแบบ

ระบบจะถูกสร้างแบบ **modular release** โดยปล่อยใช้งานเป็น 3 คลื่นหลัก เริ่มจากการเก็บลีดและ attribution ให้ครบก่อน จากนั้นจึงขยายสู่ dashboard กับ CRM และสุดท้ายค่อยเชื่อม automation, actual-vs-result และ broadcast migration เพื่อไม่ให้การพัฒนาช่วงต้นติดคอขวดกับโมดูลที่ยังไม่จำเป็นต่อรายได้ทันที

| ระยะ | สิ่งที่ต้องเปิดใช้ได้จริง | คุณค่าทางธุรกิจ |
| --- | --- | --- |
| Wave 1 | Landing Page + Lead Form + UTM Capture | รับลีดและวัดผลแคมเปญได้ทันที |
| Wave 2 | Dashboard + CRM + Whale Scoring | คัดคุณภาพลูกค้าและเห็นผลเชิงรายได้ |
| Wave 3 | Actual vs Result + Broadcast Migration Layer | เพิ่มประสิทธิภาพการ follow-up และการ scale |

## โมดูลที่ต้องมีในระบบ

### 1. Public Conversion Surface

ส่วนนี้เป็นหน้า Landing Page หลักของแคมเปญ โดยจะเน้นกลุ่มลูกค้าที่ต้องการเว็บหวยอัตราจ่ายสูงและมีกำลังทางการเงิน พร้อมองค์ประกอบที่ช่วย conversion เช่น hero section, CTA หลัก, trust elements, social proof, FAQ, SEO/AEO content block และ structured data ระดับหน้าเพจ

### 2. Lead Intake and Attribution

ทุกการกรอกฟอร์มจะต้องเก็บข้อมูลแหล่งที่มาอย่างน้อย ได้แก่ `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `referrer`, `landing_page`, `device_type`, และเวลาที่ส่งฟอร์ม เพื่อให้ dashboard สามารถเชื่อมต้นทุนกับคุณภาพลีดได้ตั้งแต่วันแรก

### 3. CRM and Whale Qualification

CRM จะไม่เป็นเพียงสมุดจดรายชื่อลูกค้า แต่ต้องมีการแยกสถานะลีด ระดับ VIP ยอดฝากสะสม ความถี่การฝาก เจ้าของที่ดูแล และบันทึก follow-up note เพื่อให้ทีมสามารถคัดกลุ่มลูกค้าปลาวาฬและจัดลำดับการติดตามได้อย่างมีเหตุผล

### 4. Performance and Revenue Analytics

แดชบอร์ดต้องแสดงทั้งภาพรวมและส่วนเปรียบเทียบ เช่น จำนวนลีดใหม่, ลีดที่ติดต่อแล้ว, ลีดที่เปลี่ยนเป็นผู้ฝาก, ยอดฝากรวม, CPA, ROI และมุมมอง **Actual vs Result** เพื่อเปรียบเทียบสิ่งที่ระบบหรือ AI ได้ดำเนินการกับผลจริงที่เกิดขึ้นภายหลัง

### 5. Broadcast Migration Layer

ชั้นนี้จะถูกออกแบบให้รองรับการย้ายจากกระบวนการ **Manual Broadcast** ที่ใช้อยู่ในปัจจุบันไปสู่ workflow ที่จัดคิว ติดต่อ และติดตามผลได้อัตโนมัติมากขึ้น โดยในเฟสแรกจะเริ่มจากการทำ data model และ queue status ให้พร้อมก่อน แล้วค่อยเชื่อมช่องทางส่งจริงในระยะถัดไป

## เส้นทางใช้งานหลักของระบบ

| เส้นทาง | ลำดับการทำงาน | ผลลัพธ์ |
| --- | --- | --- |
| Prospect to Lead | เข้า Landing Page → กรอกฟอร์ม → เก็บ UTM → บันทึก lead | ได้ lead พร้อม attribution |
| Lead to Qualified | ทีมเปิด CRM → เพิ่ม note → ให้คะแนน VIP → เปลี่ยนสถานะ | รู้ว่าควร follow-up ใครก่อน |
| Qualified to Revenue | บันทึกยอดฝาก/มูลค่า → dashboard อัปเดต | เห็นผลเชิงรายได้จริง |
| Campaign to Decision | แคมเปญรัน → dashboard สรุป CPA/ROI → เทียบ Actual vs Result | ตัดสินใจเพิ่มหรือลดงบได้ |

## ขอบเขตทางเทคนิคของรอบพัฒนาแรก

ในรอบพัฒนาแรก ระบบจะโฟกัสที่โครงสร้างซึ่งพร้อมใช้งานจริงทันที ได้แก่หน้า Landing Page แบบ public, หน้า Dashboard แบบ authenticated, หน้า CRM แบบ authenticated, ตารางฐานข้อมูลสำหรับ leads และ customer intelligence, และชุด backend procedure สำหรับ lead intake, notes, segmentation และ analytics summary

| พื้นที่ | สิ่งที่จะทำในรอบแรก |
| --- | --- |
| Frontend | Landing Page, Dashboard shell, CRM workspace, Lead form |
| Backend | tRPC procedures สำหรับ lead intake, CRM update, analytics summary |
| Database | ตาราง leads, lead_events, customer_profiles, vip_notes, campaign_metrics |
| Tracking | UTM capture, referrer capture, actual action logging |
| QA | vitest สำหรับ attribution, segmentation, analytics calculation |

## ข้อกำหนดด้านความปลอดภัยและการดำเนินงาน

ข้อมูลลับหรือ recovery asset ที่ไม่เกี่ยวกับระบบนี้จะไม่ถูกนำเข้าไปใช้ในงานพัฒนา ส่วนการเผยแพร่จริง การเปิดแคมเปญ และการส่ง broadcast ออกภายนอกจะต้องมีจุดตรวจทานโดยมนุษย์ก่อนเสมอ แม้ระบบจะเตรียมความพร้อมให้ครบก็ตาม

## ขั้นต่อไป

ขั้นถัดไปของงานคือการแปลง blueprint นี้ไปสู่ **data model**, **route map**, และ **backend contract** ที่ลงมือพัฒนาได้ทันที โดยเริ่มจากฐานข้อมูลและ procedure ของ lead, campaign attribution, CRM, และ dashboard metrics ก่อน แล้วจึงประกอบหน้า UI เข้ากับข้อมูลจริงในลำดับถัดไป
