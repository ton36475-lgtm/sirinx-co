# Browser Test Notes

## Landing Page

- หน้า Landing Page แสดง CTA หลักไปยังหน้าสมัครจริงของ CHOKMA
- ส่วน Trust elements และ USP ใหม่แสดงครบ เช่น referral, หวยรัฐบาล, เครดิตฟรี/สล็อต/คาสิโน, ฝากถอน
- ฟอร์ม lead สามารถกรอกข้อมูลทดสอบได้ครบ

## Dashboard

- หลังทดสอบ flow พบหน้า Dashboard แสดง `Recent leads = 1`
- มี lead ชื่อ `Whale QA` ปรากฏในส่วน Lead ล่าสุด
- ค่าแสดงผลที่พบจาก UI:
  - Source: `manual`
  - Campaign: `unassigned`
  - Value score: `84.00`
  - Traffic label: `high intent`
- ส่วน Actual vs Result แสดง summary ใหม่ ได้แก่ planned actions, actual actions, completion rate และ review required
- Dashboard แสดง card สำหรับ lead คุณภาพสูงและ lead สาย referral / affiliate แล้ว

## Dashboard follow-up verification

จากการตรวจหน้า Dashboard หลังอัปเดตล่าสุด พบว่า UI แสดงบล็อก `Referral / Affiliate Tracking` และ `Operational Alerts` แล้ว โดยค่าปัจจุบันเป็นศูนย์ตามข้อมูลทดสอบที่มีอยู่ในระบบ และ lead ทดสอบ `Whale QA` ยังคงปรากฏในส่วน lead ล่าสุดพร้อมค่า `Value score 84.00` และ `Traffic label high intent`
