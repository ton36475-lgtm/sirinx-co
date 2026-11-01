export type BessLongformBlock = { heading: string; paragraphs: string[] };

export const bessLongformByRoute: Record<string, BessLongformBlock[]> = {
  "/bess": [
    {
      heading: "BESS คืออะไร และทำไมธุรกิจต้องมี",
      paragraphs: [
        "ระบบกักเก็บพลังงานแบตเตอรี่ หรือ Battery Energy Storage System (BESS) เป็นหัวใจสำคัญของการเปลี่ยนผ่านสู่พลังงานสะอาดสำหรับองค์กรและธุรกิจในปัจจุบัน ไม่ใช่เพียงแค่อุปกรณ์เสริม แต่เป็นโครงสร้างพื้นฐานที่ช่วยให้ธุรกิจสามารถควบคุมค่าไฟ ลดความเสี่ยงด้านพลังงาน และเพิ่มความยืดหยุ่นในการใช้ไฟฟ้าได้อย่างแท้จริง เมื่อธุรกิจติดตั้งระบบโซลาร์เซลล์เพียงอย่างเดียว พลังงานที่ผลิตได้จะถูกใช้ทันทีหรือส่งคืนโครงข่าย ซึ่งหมายความว่าในช่วงที่ไม่มีแสงแดด ธุรกิจยังต้องซื้อไฟจากโครงข่ายในราคาที่อาจสูงขึ้นเรื่อย ๆ BESS มาเติมเต็มช่องว่างนี้ด้วยการกักเก็บพลังงานส่วนเกินในช่วงที่ผลิตมากกว่าใช้ และจ่ายคืนในช่วงที่ต้องการ ทำให้ธุรกิจใช้พลังงานของตัวเองได้มากขึ้น ลดการพึ่งพาโครงข่าย และควบคุมค่าไฟได้ตามเป้าหมาย",
        "สำหรับธุรกิจที่ใช้ไฟมากกว่า 500 kW ขึ้นไป ค่า demand charge หรือค่าไฟฟ้าสูงสุดในรอบบิล มักเป็นส่วนสำคัญของค่าไฟรวม BESS ช่วยลด peak demand โดยการจ่ายไฟจากแบตเตอรี่ในช่วงที่การใช้ไฟพุ่งสูง ทำให้ค่า demand charge ลดลงได้ 15-40% ขึ้นอยู่กับรูปแบบการใช้ไฟและขนาดระบบ นอกจากนี้ BESS ยังช่วยให้ธุรกิจสามารถทำ peak shaving, load shifting และ frequency regulation ได้ ซึ่งเป็นบริการที่โครงข่ายไฟฟ้ากำลังให้ความสำคัญมากขึ้น",
        "การเลือก BESS ที่ถูกต้องไม่ใช่แค่การเลือกขนาดแบตเตอรี่ แต่ต้องพิจารณา chemistry, lifecycle, efficiency, safety, และ total cost of ownership (TCO) รวมถึงการ integrate กับระบบเดิม ทีมวิศวกรของ SIRINX จะวิเคราะห์ load profile 24 ชั่วโมงของธุรกิจ คำนวณขนาดที่เหมาะสม และออกแบบระบบให้ตรงกับความต้องการจริง ไม่ใช่แค่ขายอุปกรณ์",
      ],
    },
    {
      heading: "ประโยชน์หลักของ BESS สำหรับธุรกิจ",
      paragraphs: [
        "ประโยชน์แรกคือการลดค่า demand charge ซึ่งเป็นต้นทุนที่ธุรกิจหลายแห่งมองข้าม BESS จะชาร์จในช่วงที่ค่าไฟต่ำ (เช่น กลางคืนหรือช่วงที่โซลาร์ผลิตมาก) และจ่ายในช่วง peak ทำให้ peak demand ลดลง ประโยชน์ที่สองคือการสำรองไฟ (backup power) สำหรับโหลดสำคัญ เช่น ระบบ IT, ห้องเย็น, หรือสายการผลิต ซึ่งช่วยลดความเสี่ยงจากไฟดับ ประโยชน์ที่สามคือการเพิ่มการใช้พลังงานหมุนเวียน (renewable self-consumption) ทำให้ ROI ของระบบโซลาร์ดีขึ้น",
        "นอกจากนี้ BESS ยังช่วยให้ธุรกิจสามารถเข้าร่วมโปรแกรม demand response หรือ grid services ได้ในอนาคต ซึ่งอาจกลายเป็นรายได้เสริม แต่ต้องออกแบบระบบให้รองรับตั้งแต่แรก ไม่ใช่ติดตั้งภายหลัง",
        "สำหรับธุรกิจที่มีเป้าหมายด้าน ESG หรือ Net Zero, BESS ช่วยลดการปล่อยคาร์บอน (Scope 2) โดยการใช้พลังงานหมุนเวียนที่กักเก็บไว้แทนการซื้อไฟจากโครงข่าย ซึ่งมักมี carbon intensity สูงกว่า",
      ],
    },
    {
      heading: "การเลือก BESS สำหรับธุรกิจไทย",
      paragraphs: [
        "สำหรับธุรกิจไทย, ปัจจัยสำคัญ: ค่าไฟ (TOU tariff), demand charge, และ incentives (BOI, tax)",
        "TOU tariff: ชาร์จใน off-peak จ่ายใน on-peak ช่วยประหยัดได้มาก",
        "Demand charge: ลด peak demand ช่วยประหยัดค่า demand charge ซึ่งเป็นส่วนสำคัญของค่าไฟ",
        "Incentives: BOI อาจให้สิทธิประโยชน์สำหรับ BESS ในบางกรณี",
      ],
    },
    {
      heading: "ขั้นตอนต่อไป",
      paragraphs: [
        "ติดต่อทีม SIRINX เพื่อนัด site survey ฟรี",
        "ทีมวิศวกรจะวิเคราะห์ load profile และ navrh BESS ที่เหมาะสม",
        "รับรายงาน economic model (ROI, payback, NPV) ที่โปร่งใส",
        "ตัดสินใจลงทุนด้วยข้อมูลจริง ไม่ใช่แค่ spec sheet",
      ],
    },
  ],
  "/bess/factory": [
    {
      heading: "BESS สำหรับโรงงานอุตสาหกรรม",
      paragraphs: [
        "โรงงานอุตสาหกรรมเป็นกลุ่มผู้ใช้ไฟฟ้ารายใหญ่ที่สุดในประเทศไทย และมักมีรูปแบบการใช้ไฟที่มี peak สูงในช่วงเวลาทำงาน ค่า demand charge มักเป็น 30-50% ของค่าไฟรวม BESS สำหรับโรงงานจึงเป็นการลงทุนที่คุ้มค่ามาก โดยเฉพาะโรงงานที่ใช้ไฟมากกว่า 1 MW ขึ้นไป",
        "BESS สำหรับโรงงานมักมีขนาด 1-10 MWh ขึ้นอยู่กับ load profile และเป้าหมายการลด peak การออกแบบต้องพิจารณา: รูปแบบการใช้ไฟ (continuous vs. batch), ความสำคัญของโหลด, ข้อจำกัดพื้นที่, และการ integrate กับระบบโซลาร์ที่มีอยู่",
        "โรงงานที่มีระบบโซลาร์อยู่แล้วจะได้ประโยชน์มากขึ้น เพราะ BESS ช่วยเพิ่ม self-consumption จาก ~60-70% เป็น ~80-90% ทำให้ ROI ของระบบโซลาร์ดีขึ้น",
        "การเลือก chemistry สำหรับโรงงาน: LFP เป็นมาตรฐาน เพราะความปลอดภัยสูง อายุการใช้งานยาว (10-15 ปี) และต้นทุนต่ำกว่า NMC สำหรับ BESS เชิงพาณิชย์ ขนาดใหญ่ (>1 MWh) LFP เป็นตัวเลือกที่ดีที่สุด",
        "ข้อกำหนดทางกฎหมาย: โรงงานที่ใช้ไฟ > 1 MW ต้องปฏิบัติตามข้อกำหนดของกรมโรงงานอุตสาหกรรม และ กฟผ./กฟน./กฟภ. เกี่ยวกับการเชื่อมต่อ BESS กับโครงข่าย",
      ],
    },
    {
      heading: "กลยุทธ์ Peak Shaving สำหรับโรงงาน",
      paragraphs: [
        "โรงงานมักมี peak ชัดเจนในช่วง 9:00-16:00 BESS จะชาร์จในช่วงกลางคืน (ค่าไฟต่ำ) และจ่ายในช่วง peak ทำให้ peak demand ลดลง 20-40%",
        "นอกจาก peak shaving, BESS ยังช่วย smooth load (ลดความผันผวน) ซึ่งสำคัญสำหรับโรงงานที่มีเครื่องจักรขนาดใหญ่",
        "การคำนวณขนาด BESS สำหรับโรงงานต้องใช้ load profile อย่างน้อย 1-3 เดือน พร้อมข้อมูล sub-meter ของโหลดสำคัญ",
        "กลยุทธ์ขั้นสูง: predictive peak shaving ใช้ ML ทำนาย peak และ optimize charge/discharge schedule ล่วงหน้า 24 ชั่วโมง ทำให้มีประสิทธิภาพมากขึ้น 10-15%",
      ],
    },
    {
      heading: "ROI และ Payback สำหรับโรงงาน",
      paragraphs: [
        "ROI ของ BESS สำหรับโรงงานมักอยู่ที่ 5-7 ปี ขึ้นอยู่กับค่า demand charge ที่ลดลง, ค่าไฟที่ประหยัด, และอายุการใช้งาน",
        "BESS ยังช่วยลดความเสี่ยงจากไฟดับ (downtime cost) ซึ่งสำหรับโรงงานอาจมีมูลค่าสูง",
        "ตัวอย่าง: โรงงาน peak 500 kW, demand charge 300 บาท/kW → 150,000 บาท/เดือน หากลด peak 100 kW → ประหยัด 30,000 บาท/เดือน = 360,000 บาท/ปี",
        "Payback period สำหรับโรงงานที่มี peak สูง (>2 MW) อาจสั้นถึง 4-5 ปี",
      ],
    },
    {
      heading: "การ integrate กับระบบโซลาร์ในโรงงาน",
      paragraphs: [
        "โรงงานที่มีระบบโซลาร์อยู่แล้วจะได้ประโยชน์จาก BESS มากขึ้น: เพิ่ม self-consumption, ลด curtailment, และเพิ่ม ROI ของระบบโซลาร์",
        "การออกแบบต้องพิจารณา: ขนาดโซลาร์ vs. BESS, inverter capacity, และการเชื่อมต่อ (AC-coupled vs. DC-coupled)",
        "AC-coupled: ง่ายกว่าในการ retrofit, แต่มี conversion loss มากกว่า",
        "DC-coupled: ประสิทธิภาพสูงกว่า, แต่ซับซ้อนกว่าในการ retrofit",
      ],
    },
  ],
  "/bess/hotel": [
    {
      heading: "BESS สำหรับโรงแรมและรีสอร์ท",
      paragraphs: [
        "โรงแรมและรีสอร์ทมีรูปแบบการใช้ไฟที่เป็นเอกลักษณ์: peak ในช่วงเย็น (18:00-22:00) เมื่อ AC ทำงานหนัก และ valley ในช่วงกลางคืน BESS สำหรับโรงแรมจึงเน้นการลด AC peak และให้ไฟฟ้าสำรองห้องพัก",
        "ขนาด BESS สำหรับโรงแรมมักอยู่ที่ 100-500 kWh ขึ้นอยู่กับจำนวนห้องและสิ่งอำนวยความสะดวก",
        "ประโยชน์หลัก: ลดค่า AC peak (15-25%), ให้ไฟฟ้าสำรองห้องพักในช่วงไฟดับ, และเพิ่ม renewable self-consumption",
      ],
    },
    {
      heading: "กลยุทธ์การใช้ BESS ในโรงแรม",
      paragraphs: [
        "กลยุทธ์ที่ 1: Peak Shaving — ชาร์จในช่วงกลางคืน จ่ายในช่วง peak เย็น",
        "กลยุทธ์ที่ 2: Load Shifting — ย้ายโหลดที่ไม่เร่งด่วนไปช่วงที่ค่าไฟต่ำ",
        "กลยุทธ์ที่ 3: Backup Power — ให้ไฟฟ้าสำรองห้องพัก, ลิฟต์, ระบบ IT ในช่วงไฟดับ",
        "กลยุทธ์ที่ 4: Renewable Integration — ถ้ามีโซลาร์, BESS ช่วยเพิ่ม self-consumption จาก ~50% เป็น ~80%",
      ],
    },
  ],
  "/bess/peak-shaving": [
    {
      heading: "BESS Peak Shaving คืออะไร",
      paragraphs: [
        "Peak shaving คือการลด peak demand โดยการใช้ BESS จ่ายไฟในช่วงที่การใช้ไฟพุ่งสูง แทนที่จะซื้อจากโครงข่าย ในประเทศไทย ค่า demand charge มักเป็น 200-400 บาท/kW ต่อเดือน ดังนั้นการลด peak 100 kW = ประหยัด 20,000-40,000 บาท/เดือน",
        "BESS สำหรับ peak shaving ต้องมี power (kW) สูงพอที่จะจ่าย peak และ energy (kWh) พอที่จะครอบคลุมช่วง peak (มัก 2-4 ชั่วโมง)",
      ],
    },
    {
      heading: "กลยุทธ์ Peak Shaving ที่มีประสิทธิภาพ",
      paragraphs: [
        "กลยุทธ์ที่ 1: Threshold-based — ตั้ง threshold ที่ peak demand",
        "กลยุทธ์ที่ 2: Predictive — ใช้ ML/AI ทำนาย peak และชาร์จ/จ่ายล่วงหน้า",
        "กลยุทธ์ที่ 3: Time-of-Use — ชาร์จในช่วง off-peak จ่ายในช่วง on-peak",
        "ผลลัพธ์ที่คาดหวัง: ลด peak demand 30-40%, ประหยัดค่า demand charge 20,000-80,000 บาท/เดือน",
      ],
    },
    {
      heading: "ข้อควรระวังในการทำ Peak Shaving",
      paragraphs: [
        "ข้อควรระวังที่ 1: BESS ต้องมี SOC (State of Charge) เพียงพอในช่วง peak",
        "ข้อควรระวังที่ 2: Degradation — การทำ peak shaving บ่อยอาจทำให้แบตเตอรี่เสื่อมเร็วขึ้น",
        "ข้อควรระวังที่ 3: Grid code — ต้องปฏิบัติตามข้อกำหนดของ กฟผ./กฟน./กฟภ.",
        "ข้อควรระวังที่ 4: BESS ต้องมี power (kW) สูงพอ ไม่ใช่แค่ energy (kWh) มากพอ",
      ],
    },
    {
      heading: "ตัวอย่างการคำนวณ Peak Shaving",
      paragraphs: [
        "ตัวอย่าง: โรงงาน peak 500 kW, demand charge 300 บาท/kW → 150,000 บาท/เดือน",
        "หากใช้ BESS 100 kW / 200 kWh ลด peak 100 kW → ประหยัด 30,000 บาท/เดือน = 360,000 บาท/ปี",
        "CAPEX: 100 kW / 200 kWh BESS ~2-3 ล้านบาท → payback ~6-8 ปี",
        "หากใช้ predictive peak shaving อาจลด peak ได้มากขึ้น 10-15% → payback สั้นลง",
      ],
    },
  ],
  "/bess/sizing": [
    {
      heading: "การคำนวณขนาด BESS ที่ถูกต้อง",
      paragraphs: [
        "การเลือกขนาด BESS ที่ถูกต้อง (right-sizing) เป็นหัวใจสำคัญของ ROI หากเล็กเกินไปจะไม่สามารถลด peak ได้ตามเป้า; หากใหญ่เกินไปจะไม่คุ้มค่า",
        "ข้อมูลที่ต้องใช้: load profile 24 ชั่วโมง (อย่างน้อย 1-3 เดือน), peak demand, valley demand, รูปแบบการใช้ไฟ, เป้าหมายการลด peak, และข้อจำกัด",
      ],
    },
    {
      heading: "สูตรการคำนวณขนาด BESS",
      paragraphs: [
        "Power (kW): ต้อง ≥ peak demand reduction target",
        "Energy (kWh): ต้อง ≥ peak duration × power บวก margin 20-30%",
        "ตัวอย่าง: โรงงาน peak 500 kW, ต้องการลด 100 kW, peak duration 3 ชั่วโมง → BESS = 100 kW / 360 kWh",
        "C-rate: ต้องไม่เกิน spec (มัก 0.5C-1C)",
      ],
    },
    {
      heading: "ข้อผิดพลาดที่พบบ่อยในการ Sizing",
      paragraphs: [
        "ข้อผิดพลาดที่ 1: ใช้ average load แทน peak load",
        "ข้อผิดพลาดที่ 2: ไม่พิจารณา degradation",
        "ข้อผิดพลาดที่ 3: ไม่พิจารณา future growth",
        "ข้อผิดพลาดที่ 4: เลือกขนาดจาก spec sheet ไม่ใช่ข้อมูลจริง",
      ],
    },
    {
      heading: "เครื่องมือและวิธีการของ SIRINX",
      paragraphs: [
        "SIRINX ใช้: (1) Power meter ติดตั้ง 1-3 เดือน, (2) Software modeling เพื่อจำลอง peak shaving, (3) Economic model (ROI, payback, NPV)",
        "ผลลัพธ์: รายงาน sizing ที่โปร่งใส พร้อม sensitivity analysis",
        "การพิจารณา future expansion: ออกแบบให้รองรับการเพิ่ม capacity ในอนาคต (modular design)",
        "การเลือก inverter/PCS: ต้องสอดคล้องกับ power rating ของ BESS",
      ],
    },
    {
      heading: "Case Study: การ Sizing สำหรับโรงงาน 500 kW",
      paragraphs: [
        "โรงงาน peak 500 kW, ต้องการลด peak 150 kW (30%)",
        "Load profile: peak 3 ชั่วโมง (10:00-13:00), valley 8 ชั่วโมง (22:00-06:00)",
        "BESS sizing: 150 kW / 450 kWh (3 ชั่วโมง) + 20% margin = 150 kW / 540 kWh",
        "CAPEX: ~4-5 ล้านบาท, payback ~5-6 ปี",
      ],
    },
  ],
  "/bess/safety-cost": [
    {
      heading: "ความปลอดภัยของ BESS",
      paragraphs: [
        "ความปลอดภัยเป็นสิ่งสำคัญที่สุด มาตรฐาน IEC 62619 และ IEC 62443 เป็นพื้นฐาน ระบบต้องมี BMS, thermal management, fire suppression, และ ventilation",
        "การเลือก chemistry LFP ช่วยลดความเสี่ยง thermal runaway ได้มาก แต่ไม่ได้หมายความว่าปลอดภัย 100%",
      ],
    },
    {
      heading: "TCO (Total Cost of Ownership) ของ BESS",
      paragraphs: [
        "TCO ประกอบด้วย: CAPEX (แบตเตอรี่ 60-70%, inverter/PCS 15-20%, BMS 5-10%, installation 10-15%, soft costs 5-10%), OPEX (maintenance 1-2%/ปี), และ replacement (หลัง 10-15 ปี)",
        "ต้นทุนต่อ kWh ลดลงอย่างต่อเนื่อง (จาก ~$1,000/kWh ใน 2010 เป็น ~$150-300/kWh ใน 2024 สำหรับ LFP)",
      ],
    },
    {
      heading: "Warranty และ Lifecycle Management",
      paragraphs: [
        "Warranty มักเป็น 10 ปี (battery) และ 5 ปี (inverter/PCS) แต่ต้องอ่านเงื่อนไข: throughput, cycles, และ degradation",
        "Lifecycle management: monitoring, predictive maintenance, และ end-of-life planning",
        "SIRINX ให้บริการ lifecycle management ครบวงจร",
      ],
    },
    {
      heading: "มาตรฐานความปลอดภัยที่ต้องปฏิบัติตาม",
      paragraphs: [
        "IEC 62619: safety requirements for secondary lithium cells and batteries",
        "IEC 62443: industrial communication networks security",
        "NFPA 855: standard for the installation of stationary energy storage systems",
        "UL 9540: standard for energy storage systems and equipment",
        "กรมโรงงานอุตสาหกรรม: ข้อกำหนดสำหรับโรงงานที่ใช้ไฟ > 1 MW",
      ],
    },
    {
      heading: "Fire Safety และ Emergency Response",
      paragraphs: [
        "Fire suppression: gas-based (Novec 1230, FM-200) หรือ water mist",
        "Thermal runaway detection: smoke, heat, gas sensors",
        "Emergency shutdown: manual และ automatic",
        "Evacuation plan และ training สำหรับพนักงาน",
        "Insurance: ต้องมีประกันภัยสำหรับ BESS (fire, liability)",
      ],
    },
    {
      heading: "End-of-Life และ Recycling",
      paragraphs: [
        "อายุการใช้งาน: 10-15 ปี (LFP), หลังจากนั้น capacity ลดลง ~20%",
        "Second-life: แบตเตอรี่ที่เสื่อมแล้วสามารถใช้สำหรับ stationary storage (lower power applications)",
        "Recycling: LFP มี lithium, iron, phosphate ที่ recycle ได้ แต่ต้นทุนสูง",
        "SIRINX วางแผน end-of-life ตั้งแต่แรก: monitoring, maintenance, และ disposal",
      ],
    },
  ],
};
