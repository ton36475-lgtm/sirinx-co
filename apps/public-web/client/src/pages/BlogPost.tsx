/**
 * SIRINX Blog Post — Individual article page
 * SEO-friendly structure with full placeholder content per slug
 * Dual-theme: semantic CSS vars
 */
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Tag,
  Share2,
  BookOpen,
  User,
} from "lucide-react";
import { blogPosts } from "./Blog";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

/* Full article content keyed by slug */
const articleContent: Record<
  string,
  { sections: { heading: string; body: string }[]; keyTakeaways: string[] }
> = {
  "rooftop-solar-roi-2025": {
    sections: [
      {
        heading: "ทำไม Rooftop Solar ถึงคุ้มค่าในปี 2025",
        body: "ความคุ้มค่าของ Rooftop Solar ขึ้นอยู่กับค่าไฟ รูปแบบการใช้ไฟ พื้นที่ติดตั้ง อุปกรณ์ และเงื่อนไขการลงทุนของแต่ละโครงการ ระยะคืนทุนจริงต้องประเมินจาก load profile, tariff, โครงสร้างหลังคา และข้อกำหนดการเชื่อมต่อระบบ\n\nการตัดสินใจควรใช้ข้อมูลหน้างานและข้อเสนอที่ตรวจสอบได้ ไม่ควรใช้ตัวเลขทั่วไปแทนการออกแบบระบบจริง",
      },
      {
        heading: "ปัจจัยที่ส่งผลต่อ ROI",
        body: "1. ค่าไฟฟ้าปัจจุบันและโครงสร้าง tariff — ใช้บิลและข้อมูลการใช้ไฟจริง\n\n2. ขนาดระบบที่เหมาะสม — ออกแบบให้สอดคล้องกับ self-consumption และข้อจำกัดพื้นที่\n\n3. ทิศทาง มุมเอียง และเงาบัง — ต้องตรวจสอบจากสภาพหลังคาและพื้นที่จริง\n\n4. คุณภาพอุปกรณ์และการรับประกัน — ตรวจรุ่นอุปกรณ์ แหล่งที่มา และขอบเขตบริการก่อนเสนอราคา",
      },
      {
        heading: "ตัวอย่างการคำนวณ ROI",
        body: "ตัวอย่างการคำนวณต้องเริ่มจากบิลค่าไฟ load profile พื้นที่ติดตั้ง เงาบัง รุ่นอุปกรณ์ ต้นทุนที่อนุมัติ และเงื่อนไขการเงินของโครงการ จากนั้นจึงคำนวณผลผลิต ค่าใช้จ่าย และระยะคืนทุนด้วยสมมติฐานที่เปิดเผยได้\n\n*ตัวเลขในบทความนี้ไม่ใช่ตัวเลขยืนยันของโครงการใด และไม่ควรใช้แทนใบเสนอราคาหรือการสำรวจหน้างาน*",
      },
      {
        heading: "ขั้นตอนถัดไป",
        body: "หากสนใจประเมิน ROI สำหรับธุรกิจของคุณ สามารถใช้เครื่องมือคำนวณขั้นสูงของ SIRINX ที่หน้า Solar Assessment ซึ่งจะคำนวณผลตอบแทนแบบละเอียดตาม load profile จริงของคุณ หรือติดต่อทีมวิศวกรเพื่อนัดสำรวจหน้างานฟรี",
      },
    ],
    keyTakeaways: [
      "Rooftop Solar คุ้มค่าแค่ไหนสำหรับโรงงานในไทย",
      "โรงงานที่มีข้อมูลการใช้ไฟชัดเจนจะประเมินระบบได้แม่นยำขึ้น",
      "รุ่นอุปกรณ์และการรับประกันต้องตรวจสอบจากเอกสารผู้ผลิต",
      "การออกแบบระบบที่เหมาะสมสำคัญกว่าขนาดระบบที่ใหญ่ที่สุด",
    ],
  },
  "ai-energy-management-guide": {
    sections: [
      {
        heading: "AI Energy Management คืออะไร",
        body: "AI Energy Management System (AI-EMS) คือระบบที่ใช้ปัญญาประดิษฐ์ในการวิเคราะห์ ทำนาย และปรับปรุงการใช้พลังงานของอาคารหรือโรงงานแบบอัตโนมัติ ระบบจะเรียนรู้จากข้อมูลการใช้พลังงานย้อนหลัง สภาพอากาศ ตารางการผลิต และปัจจัยอื่น ๆ เพื่อสร้างแผนการใช้พลังงานที่เหมาะสมที่สุด",
      },
      {
        heading: "ทำไมต้องใช้ AI ร่วมกับโซลาร์",
        body: "AI-EMS ช่วยให้ทีมงานมองเห็นรูปแบบการใช้พลังงานและวางแผนการปรับปรุงได้เป็นระบบ ผลลัพธ์ต้องประเมินจากข้อมูลจริงของแต่ละไซต์ ไม่ควรยืนยันเป็นเปอร์เซ็นต์ล่วงหน้า\n\n- Load Shifting — จัดช่วงเวลาการใช้ไฟของโหลดที่ยืดหยุ่น\n- Peak Demand Management — ติดตามและวิเคราะห์ช่วงใช้ไฟสูง\n- Predictive Maintenance — ตรวจจับสัญญาณผิดปกติตามข้อมูลที่มี\n- Weather-Aware Scheduling — ใช้ข้อมูลสภาพอากาศประกอบการวางแผน",
      },
      {
        heading: "องค์ประกอบของ AI-EMS",
        body: "1. IoT Sensors — เซ็นเซอร์วัดพลังงาน อุณหภูมิ ความชื้น ติดตั้งตามจุดสำคัญ\n2. Data Platform — ระบบรวบรวมและจัดเก็บข้อมูลแบบ real-time\n3. AI Engine — โมเดล Machine Learning ที่วิเคราะห์และทำนายรูปแบบการใช้พลังงาน\n4. Control System — ระบบสั่งการอัตโนมัติที่ปรับอุปกรณ์ตามคำแนะนำของ AI\n5. Dashboard — แสดงผลข้อมูลและ insights สำหรับผู้บริหาร",
      },
    ],
    keyTakeaways: [
      "AI-EMS ช่วยจัดข้อมูลพลังงานเพื่อวางแผนปรับปรุงเฉพาะไซต์",
      "ผลของ Load Shifting และ Peak Demand Management ต้องตรวจสอบจาก load profile",
      "ระบบเรียนรู้และปรับปรุงตัวเองอย่างต่อเนื่อง",
      "เหมาะกับโรงงานและอาคารที่มีค่าไฟเกิน 200,000 บาท/เดือน",
    ],
  },
  "floating-solar-thailand": {
    sections: [
      {
        heading: "ศักยภาพ Floating Solar ในไทย",
        body: "Floating Solar เหมาะกับบางพื้นที่ที่มีผิวน้ำและเงื่อนไขโครงสร้างรองรับ การประเมินต้องตรวจสอบสิทธิ์การใช้พื้นที่ ระดับน้ำ ระบบยึด ความปลอดภัย การเดินสาย และผลกระทบต่อการใช้น้ำจริง ไม่ควรใช้ตัวเลขทั่วไปแทนผลสำรวจไซต์",
      },
      {
        heading: "เปรียบเทียบกับ Rooftop Solar",
        body: "Floating Solar มีต้นทุนและข้อกำหนดเฉพาะจากทุ่นลอย ระบบยึด การเดินสาย และการเข้าถึงเพื่อบำรุงรักษา ข้อดีที่อาจเกิดขึ้น ได้แก่การใช้พื้นที่ผิวน้ำและการลดการใช้พื้นที่บนบก แต่ผลผลิต การระเหยของน้ำ อายุระบบ และต้นทุนต้องยืนยันจากการออกแบบและเอกสารโครงการ",
      },
    ],
    keyTakeaways: [
      "Floating Solar ต้องเริ่มจากการตรวจสอบพื้นที่และสิทธิ์การใช้ผิวน้ำ",
      "ผลผลิตและผลกระทบต่อการระเหยของน้ำต้องประเมินเฉพาะไซต์",
      "ต้นทุนและการบำรุงรักษาต้องออกแบบตามสภาพน้ำและระบบยึด",
      "เหมาะกับอ่างเก็บน้ำชลประทานและบ่อน้ำอุตสาหกรรม",
    ],
  },
  "solar-tax-benefits-thailand": {
    sections: [
      {
        heading: "สิทธิประโยชน์ทางภาษีที่อาจเกี่ยวข้อง",
        body: "การลงทุนในพลังงานแสงอาทิตย์ในประเทศไทยอาจได้รับสิทธิประโยชน์ทางภาษีหลายรูปแบบ ขึ้นอยู่กับเงื่อนไขและนโยบายที่บังคับใช้ ณ ขณะนั้น:\n\n- ค่าเสื่อมราคาเร่ง — อุปกรณ์พลังงานแสงอาทิตย์อาจหักค่าเสื่อมราคาได้ภายใน 5 ปี\n- BOI — กิจการผลิตไฟฟ้าจากพลังงานแสงอาทิตย์อาจได้รับการส่งเสริมจาก BOI\n- Carbon Credit — การลด CO₂ อาจสร้างรายได้เพิ่มจากตลาด Carbon Credit\n\n*ข้อมูลนี้เป็นข้อมูลทั่วไปเท่านั้น ไม่ใช่คำแนะนำทางภาษีหรือกฎหมาย กรุณาปรึกษาผู้เชี่ยวชาญด้านภาษีก่อนตัดสินใจ*",
      },
    ],
    keyTakeaways: [
      "อาจหักค่าเสื่อมราคาเร่งได้ภายใน 5 ปี",
      "อาจได้รับการส่งเสริมจาก BOI สำหรับกิจการผลิตไฟฟ้า",
      "Carbon Credit อาจสร้างรายได้เพิ่มเติม",
      "ควรปรึกษาผู้เชี่ยวชาญด้านภาษีก่อนตัดสินใจลงทุน",
    ],
  },
  "bess-peak-shaving": {
    sections: [
      {
        heading: "Peak Shaving คืออะไร",
        body: "Peak Shaving คือการใช้แบตเตอรี่ (BESS) เพื่อจัดการช่วง peak demand โดยชาร์จในช่วงที่เหมาะสมและจ่ายไฟในช่วงที่กำหนด การคำนวณต้องใช้ tariff และ load profile ของไซต์จริง รวมถึงข้อจำกัดด้านความปลอดภัยและการเชื่อมต่อระบบ",
      },
      {
        heading: "วิธีคำนวณความคุ้มค่า",
        body: "1. วิเคราะห์ load profile เพื่อหา peak demand และช่วงเวลาที่เกิด\n2. คำนวณ demand charge ตาม tariff ปัจจุบัน\n3. กำหนดเป้าหมาย peak shaving ที่ตรวจสอบได้\n4. คำนวณขนาด BESS และข้อกำหนดความปลอดภัย\n5. เปรียบเทียบต้นทุนกับผลที่ประเมินจากข้อมูลจริง\n\nผลตอบแทนและระยะคืนทุนต้องคำนวณเฉพาะโครงการ ไม่ควรใช้ช่วงเวลาทั่วไปแทนการวิเคราะห์ไซต์",
      },
    ],
    keyTakeaways: [
      "Peak Shaving ช่วยให้เห็นทางเลือกในการจัดการ demand charge",
      "BESS ชาร์จช่วง off-peak จ่ายช่วง peak",
      "ระยะคืนทุนต้องคำนวณจาก tariff, load profile และต้นทุนจริง",
      "เหมาะกับธุรกิจที่มี peak demand สูงและไม่สม่ำเสมอ",
    ],
  },
  "esg-solar-reporting": {
    sections: [
      {
        heading: "ESG Reporting กับพลังงานโซลาร์",
        body: "การติดตั้งโซลาร์ช่วยให้ธุรกิจรายงาน ESG ได้ดีขึ้นในหลายมิติ โดยเฉพาะ Scope 2 Emissions ซึ่งเป็นการปล่อยก๊าซเรือนกระจกจากการใช้ไฟฟ้า การใช้พลังงานโซลาร์ทดแทนไฟฟ้าจากกริดจะลด Scope 2 Emissions โดยตรง",
      },
      {
        heading: "การคำนวณ Carbon Footprint",
        body: "การคำนวณ Carbon Footprint ต้องใช้ emission factor และข้อมูลการผลิตไฟฟ้าที่เป็นเวอร์ชันล่าสุด รวมถึงขอบเขตการรายงานขององค์กร จึงจะนำไปจัดทำรายงานตามมาตรฐาน GRI, CDP หรือ TCFD ได้อย่างเหมาะสม\n\nตัวเลขผลกระทบต้องอ้างอิงจากข้อมูลโครงการและเอกสารแหล่งที่มา ไม่ใช้ค่าตัวอย่างทั่วไปแทนผลลัพธ์จริง",
      },
    ],
    keyTakeaways: [
      "โซลาร์ลด Scope 2 Emissions โดยตรง",
      "ผลลด CO₂ ต้องคำนวณจากข้อมูลผลิตไฟฟ้าและ emission factor ที่อ้างอิงได้",
      "รายงานได้ตามมาตรฐาน GRI, CDP, TCFD",
      "เสริมภาพลักษณ์ ESG ดึงดูดนักลงทุน",
    ],
  },
  "solar-panel-comparison-2025": {
    sections: [
      {
        heading: "เทคโนโลยีแผงโซลาร์ 3 ประเภทหลัก",
        body: "Mono PERC — เทคโนโลยีมาตรฐานที่ใช้กันแพร่หลาย ประสิทธิภาพ 20-21% ราคาถูกที่สุด เหมาะกับงบประมาณจำกัด\n\nTOPCon — เทคโนโลยีใหม่ที่กำลังเป็นที่นิยม ประสิทธิภาพ 21-22.5% ราคาสูงกว่า PERC 5-10% แต่ให้ผลผลิตต่อพื้นที่สูงกว่า\n\nHJT (Heterojunction) — เทคโนโลยีระดับพรีเมียม ประสิทธิภาพ 22-24% ทนความร้อนได้ดี temperature coefficient ต่ำ เหมาะกับสภาพอากาศร้อนของไทย แต่ราคาสูงกว่า PERC 15-25%",
      },
      {
        heading: "แนะนำสำหรับสภาพอากาศไทย",
        body: "สำหรับประเทศไทยที่มีอุณหภูมิสูง TOPCon เป็นตัวเลือกที่ให้ความคุ้มค่าดีที่สุดในปี 2025 เนื่องจากราคาเริ่มใกล้เคียง PERC แต่ให้ผลผลิตสูงกว่า ส่วน HJT เหมาะกับโครงการที่ต้องการประสิทธิภาพสูงสุดและมีงบประมาณเพียงพอ",
      },
    ],
    keyTakeaways: [
      "TOPCon เป็นตัวเลือกที่คุ้มค่าที่สุดในปี 2025",
      "HJT ทนความร้อนดีที่สุด เหมาะกับอากาศไทย",
      "Mono PERC ยังเป็นตัวเลือกที่ดีสำหรับงบจำกัด",
      "ประสิทธิภาพแผงสำคัญน้อยกว่าการออกแบบระบบที่ดี",
    ],
  },
  "net-metering-thailand-guide": {
    sections: [
      {
        heading: "สถานะ Net Metering ในไทย",
        body: "ระบบ Net Metering ในประเทศไทยยังอยู่ในช่วงพัฒนา โดย กกพ. ได้เปิดให้ผู้ผลิตไฟฟ้าขนาดเล็กสามารถขายไฟคืนกริดได้ในบางรูปแบบ อัตรารับซื้อไฟคืนจะต่ำกว่าอัตราค่าไฟที่ซื้อจากกริด ดังนั้นการออกแบบระบบให้ self-consumption สูงสุดจึงยังเป็นกลยุทธ์ที่ดีที่สุด",
      },
      {
        heading: "ขั้นตอนการขอขายไฟคืน",
        body: "1. ติดต่อการไฟฟ้าในพื้นที่เพื่อสอบถามเงื่อนไข\n2. ยื่นคำขอพร้อมเอกสารการติดตั้งระบบ\n3. การไฟฟ้าตรวจสอบระบบและติดตั้งมิเตอร์\n4. เริ่มขายไฟคืนตามอัตราที่กำหนด\n\n*ข้อมูลอาจมีการเปลี่ยนแปลง กรุณาตรวจสอบกับการไฟฟ้าในพื้นที่*",
      },
    ],
    keyTakeaways: [
      "Net Metering ในไทยยังอยู่ในช่วงพัฒนา",
      "อัตรารับซื้อไฟคืนต่ำกว่าอัตราค่าไฟที่ซื้อ",
      "Self-consumption สูงสุดยังเป็นกลยุทธ์ที่ดีที่สุด",
      "ต้องติดต่อการไฟฟ้าในพื้นที่เพื่อสอบถามเงื่อนไข",
    ],
  },
  "solar-carport-ev-charging": {
    sections: [
      {
        heading: "Solar Carport + EV Charging",
        body: "Solar Carport คือโครงสร้างที่จอดรถที่ติดตั้งแผงโซลาร์ด้านบน ให้ทั้งร่มเงาและผลิตไฟฟ้า เมื่อรวมกับ EV Charging Station จะกลายเป็นจุดชาร์จรถไฟฟ้าที่ใช้พลังงานสะอาด 100%\n\nเหมาะกับห้างสรรพสินค้า โรงแรม อาคารสำนักงาน และสถานที่ที่มีที่จอดรถจำนวนมาก",
      },
      {
        heading: "ตัวอย่างการคำนวณ",
        body: "ที่จอดรถ 50 คัน ติดตั้ง Solar Carport ได้ประมาณ 100-150 kWp:\n\n- ผลิตไฟฟ้าได้ประมาณ 150-225 MWh/ปี\n- ชาร์จ EV ได้ประมาณ 10-15 คัน/วัน (7 kW charger)\n- ประหยัดค่าไฟ + รายได้จากค่าชาร์จ\n- คืนทุนประมาณ 5-7 ปี\n\n*ตัวเลขเป็นการประมาณเบื้องต้น*",
      },
    ],
    keyTakeaways: [
      "Solar Carport ให้ทั้งร่มเงาและผลิตไฟฟ้า",
      "รวม EV Charging ได้ทันที",
      "ที่จอดรถ 50 คัน ≈ 100-150 kWp",
      "คืนทุนประมาณ 5-7 ปี",
    ],
  },
};

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const post = blogPosts.find(p => p.slug === slug);
  const content = articleContent[slug];

  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            ไม่พบบทความ
          </h1>
          <p className="text-text-secondary mb-6">
            บทความที่คุณค้นหาอาจถูกย้ายหรือลบแล้ว
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 btn-accent rounded-lg font-display font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> กลับไปหน้าบทความ
          </Link>
        </div>
      </div>
    );
  }

  const related = blogPosts
    .filter(p => p.categoryKey === post.categoryKey && p.slug !== slug)
    .slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-accent-primary hover:underline mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> กลับไปหน้าบทความ
            </Link>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="flex items-center gap-3 mb-4"
          >
            <span className="px-2.5 py-1 text-xs font-medium bg-accent-glow text-accent-primary rounded-md border border-border-accent">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock className="w-3 h-3" /> {post.readTime}
            </span>
            <span className="text-xs text-text-muted">{post.date}</span>
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="font-display text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground leading-tight mb-6"
          >
            {post.title}
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="text-lg text-text-secondary leading-relaxed mb-6"
          >
            {post.excerpt}
          </motion.p>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={4}
            className="flex items-center justify-between border-t border-b border-border-subtle py-4"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-secondary">{post.author}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success("คัดลอกลิงก์แล้ว");
              }}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-primary transition-colors"
            >
              <Share2 className="w-4 h-4" /> แชร์
            </button>
          </motion.div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="pb-12 bg-background">
        <div className="container max-w-4xl">
          <motion.img
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            src={post.image}
            alt={post.title}
            className="w-full h-64 lg:h-96 object-cover rounded-2xl border border-border-subtle"
            loading="lazy"
          />
        </div>
      </section>

      {/* Article Content */}
      <section className="pb-20 bg-background">
        <div className="container max-w-4xl">
          <div className="grid lg:grid-cols-[1fr_280px] gap-10">
            {/* Main Content */}
            <article>
              {content ? (
                content.sections.map((section, i) => (
                  <motion.div
                    key={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={0}
                    className="mb-10"
                  >
                    <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-4">
                      {section.heading}
                    </h2>
                    {section.body.split("\n\n").map((para, j) => (
                      <p
                        key={j}
                        className="text-text-secondary leading-relaxed mb-4 whitespace-pre-line"
                      >
                        {para}
                      </p>
                    ))}
                  </motion.div>
                ))
              ) : (
                <div className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
                  <p className="text-text-secondary">
                    เนื้อหาบทความนี้กำลังอยู่ระหว่างการจัดทำ
                    กรุณากลับมาอ่านอีกครั้งในเร็ว ๆ นี้
                  </p>
                </div>
              )}

              {/* CTA in article */}
              <div className="mt-12 p-6 rounded-xl glass-card">
                <h3 className="font-display font-semibold text-foreground mb-2">
                  สนใจระบบโซลาร์สำหรับธุรกิจ?
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  ใช้เครื่องมือคำนวณของ SIRINX
                  เพื่อประเมินขนาดระบบและผลตอบแทนเบื้องต้น ฟรี
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/assessment"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent rounded-lg text-sm font-display font-semibold"
                  >
                    คำนวณระบบโซลาร์ <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent-outline rounded-lg text-sm font-display font-semibold"
                  >
                    นัดสำรวจหน้างานฟรี
                  </Link>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-8 flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-text-muted" />
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs rounded-full border border-border-subtle text-text-muted hover:border-border-accent hover:text-accent-primary transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              {content?.keyTakeaways && (
                <div className="sticky top-24 p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                  <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-accent-primary" />{" "}
                    สรุปประเด็นสำคัญ
                  </h3>
                  <ul className="space-y-3">
                    {content.keyTakeaways.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-text-secondary"
                      >
                        <span className="w-5 h-5 rounded-full bg-accent-glow text-accent-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="py-16 lg:py-20 section-alt">
          <div className="container">
            <h2 className="font-display text-xl font-bold text-foreground mb-8">
              บทความที่เกี่ยวข้อง
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((rp, i) => (
                <motion.div
                  key={rp.slug}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                >
                  <Link
                    href={`/blog/${rp.slug}`}
                    className="group block rounded-xl border border-border-subtle bg-surface-elevated overflow-hidden hover:border-border-accent transition-all h-full"
                  >
                    <div className="h-40 overflow-hidden">
                      <img
                        src={rp.image}
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-xs text-accent-secondary">
                        {rp.category}
                      </span>
                      <h3 className="font-display font-semibold text-foreground mt-1 mb-2 group-hover:text-accent-primary transition-colors text-sm">
                        {rp.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rp.readTime}
                        </span>
                        <span>{rp.date}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
            พร้อมเริ่มต้นลดค่าพลังงาน?
          </h2>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto">
            นัดสำรวจหน้างานฟรี ไม่มีข้อผูกมัด
            รับข้อเสนอที่ออกแบบเฉพาะสำหรับธุรกิจของคุณ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-accent rounded-lg font-display font-semibold"
            >
              นัดสำรวจหน้างานฟรี <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/assessment"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-accent-outline rounded-lg font-display font-semibold"
            >
              ประเมินความคุ้มค่าเบื้องต้น
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
