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
import {
  getLocalizedBlogPost,
  getLocalizedBlogPosts,
} from "@/lib/blogData";
import {
  getLocalizedArticleContent,
  type BlogArticleContent,
} from "@/lib/blogArticleContent";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/blogPost";
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
const articleContent: Record<string, BlogArticleContent> = {
  "rooftop-solar-roi-2025": {
    sections: [
      {
        heading: "ทำไม Rooftop Solar ถึงคุ้มค่าในปี 2025",
        body: "ราคาแผงโซลาร์ลดลงกว่า 90% ในช่วง 15 ปีที่ผ่านมา ขณะที่ค่าไฟฟ้าในประเทศไทยปรับตัวสูงขึ้นอย่างต่อเนื่อง ทำให้ Rooftop Solar มีโอกาสคุ้มค่ามากขึ้นสำหรับโรงงานที่มีค่าไฟเกิน 100,000 บาทต่อเดือน โดยระยะคืนทุนจริงต้องประเมินจาก load profile, tariff, พื้นที่ติดตั้ง และรูปแบบการลงทุน\n\nปัจจัยสำคัญที่ทำให้ ROI ดีขึ้นในปี 2025 ได้แก่ ประสิทธิภาพแผง TOPCon ที่สูงถึง 22% ต้นทุน inverter ที่ลดลง และนโยบายสนับสนุนจากภาครัฐ เช่น การหักค่าเสื่อมราคาเร่ง",
      },
      {
        heading: "ปัจจัยที่ส่งผลต่อ ROI",
        body: "1. ค่าไฟฟ้าปัจจุบัน — ยิ่งค่าไฟสูง ยิ่งคุ้มค่า โรงงานที่จ่ายค่าไฟ 4-5 บาท/kWh จะคืนทุนเร็วกว่า\n\n2. ขนาดระบบที่เหมาะสม — ระบบที่ออกแบบให้ self-consumption สูงสุดจะให้ ROI ดีกว่าระบบที่ผลิตเกินความต้องการ\n\n3. ทิศทางและมุมเอียงหลังคา — หลังคาหันทิศใต้ มุมเอียง 10-15 องศา จะได้ผลผลิตสูงสุดในประเทศไทย\n\n4. คุณภาพอุปกรณ์ — แผง Tier 1 และ inverter คุณภาพสูงจะให้ performance ratio 80-85% ตลอดอายุ 25 ปี",
      },
      {
        heading: "ตัวอย่างการคำนวณ ROI",
        body: "สมมติโรงงานขนาดกลางที่มีค่าไฟ 300,000 บาท/เดือน ติดตั้งระบบ Rooftop Solar ขนาด 500 kWp:\n\n- ต้นทุนติดตั้ง: ประมาณ 12-15 ล้านบาท\n- ผลิตไฟฟ้าได้: ประมาณ 750 MWh/ปี\n- ประหยัดค่าไฟ: ประมาณ 3-3.75 ล้านบาท/ปี\n- ระยะเวลาคืนทุน: ประมาณ 3.5-4.5 ปี\n- ผลตอบแทนตลอดอายุ 25 ปี: ประมาณ 60-75 ล้านบาท\n\n*ตัวเลขเป็นการประมาณเบื้องต้น ผลลัพธ์จริงขึ้นอยู่กับเงื่อนไขเฉพาะของแต่ละโครงการ*",
      },
      {
        heading: "ขั้นตอนถัดไป",
        body: "หากสนใจประเมิน ROI สำหรับธุรกิจของคุณ สามารถใช้เครื่องมือคำนวณขั้นสูงของ SIRINX ที่หน้า Solar Assessment ซึ่งจะคำนวณผลตอบแทนแบบละเอียดตาม load profile จริงของคุณ หรือติดต่อทีมวิศวกรเพื่อนัดสำรวจหน้างานฟรี",
      },
    ],
    keyTakeaways: [
      "Rooftop Solar คุ้มค่าแค่ไหนสำหรับโรงงานในไทย",
      "ค่าไฟยิ่งสูง ROI ยิ่งดี — โรงงานที่จ่ายเกิน 100K/เดือนได้ประโยชน์สูงสุด",
      "แผง TOPCon ปี 2025 มีประสิทธิภาพสูงถึง 22%",
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
        body: "โซลาร์เพียงอย่างเดียวช่วยลดค่าไฟได้ 30-50% แต่เมื่อรวมกับ AI-EMS สามารถลดได้เพิ่มอีก 10-20% เนื่องจาก:\n\n- Load Shifting — เลื่อนการใช้ไฟของเครื่องจักรที่ไม่เร่งด่วนไปช่วงที่โซลาร์ผลิตได้มาก\n- Peak Demand Management — ลด demand charge โดยกระจายการใช้ไฟให้สม่ำเสมอ\n- Predictive Maintenance — ตรวจจับความผิดปกติของระบบก่อนเกิดปัญหา\n- Weather-Aware Scheduling — ปรับแผนการใช้พลังงานตามพยากรณ์อากาศ",
      },
      {
        heading: "องค์ประกอบของ AI-EMS",
        body: "1. IoT Sensors — เซ็นเซอร์วัดพลังงาน อุณหภูมิ ความชื้น ติดตั้งตามจุดสำคัญ\n2. Data Platform — ระบบรวบรวมและจัดเก็บข้อมูลแบบ real-time\n3. AI Engine — โมเดล Machine Learning ที่วิเคราะห์และทำนายรูปแบบการใช้พลังงาน\n4. Control System — ระบบสั่งการอัตโนมัติที่ปรับอุปกรณ์ตามคำแนะนำของ AI\n5. Dashboard — แสดงผลข้อมูลและ insights สำหรับผู้บริหาร",
      },
    ],
    keyTakeaways: [
      "AI-EMS ช่วยลดค่าไฟเพิ่มอีก 10-20% จากโซลาร์เพียงอย่างเดียว",
      "Load Shifting และ Peak Demand Management เป็นฟีเจอร์ที่ให้ผลตอบแทนสูงสุด",
      "ระบบเรียนรู้และปรับปรุงตัวเองอย่างต่อเนื่อง",
      "เหมาะกับโรงงานและอาคารที่มีค่าไฟเกิน 200,000 บาท/เดือน",
    ],
  },
  "floating-solar-thailand": {
    sections: [
      {
        heading: "ศักยภาพ Floating Solar ในไทย",
        body: "ประเทศไทยมีพื้นที่ผิวน้ำที่เหมาะสมสำหรับ Floating Solar มากกว่า 10,000 ตร.กม. ทั้งอ่างเก็บน้ำชลประทาน บ่อน้ำอุตสาหกรรม และทะเลสาบ ข้อดีของ Floating Solar คือไม่ต้องใช้พื้นที่บนบก น้ำช่วยระบายความร้อนทำให้แผงมีประสิทธิภาพสูงขึ้น 5-10% และลดการระเหยของน้ำ",
      },
      {
        heading: "เปรียบเทียบกับ Rooftop Solar",
        body: "Floating Solar มีต้นทุนสูงกว่า Rooftop Solar ประมาณ 15-25% เนื่องจากต้องใช้ทุ่นลอยน้ำและระบบยึดพิเศษ แต่ข้อดีคือ:\n\n- ผลผลิตสูงกว่า 5-10% จากการระบายความร้อนด้วยน้ำ\n- ไม่กินพื้นที่บนบก เหมาะกับธุรกิจที่มีพื้นที่จำกัด\n- ลดการระเหยของน้ำ 30-50% ประหยัดทรัพยากรน้ำ\n- อายุการใช้งานเทียบเท่า Rooftop Solar ที่ 25+ ปี",
      },
    ],
    keyTakeaways: [
      "ไทยมีศักยภาพ Floating Solar สูงมากจากพื้นที่ผิวน้ำกว่า 10,000 ตร.กม.",
      "ผลผลิตสูงกว่า Rooftop 5-10% จากการระบายความร้อนด้วยน้ำ",
      "ต้นทุนสูงกว่า Rooftop 15-25% แต่ไม่ใช้พื้นที่บนบก",
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
        body: "Peak Shaving คือการใช้แบตเตอรี่ (BESS) เพื่อลดค่า peak demand ของระบบไฟฟ้า โดยชาร์จแบตเตอรี่ในช่วงที่ใช้ไฟน้อย (off-peak) และจ่ายไฟจากแบตเตอรี่ในช่วงที่ใช้ไฟสูงสุด (peak) ทำให้ค่า demand charge ลดลง\n\nค่า demand charge คิดจาก peak demand สูงสุดในรอบเดือน (kW) x อัตราค่า demand ซึ่งอาจสูงถึง 200-300 บาท/kW สำหรับธุรกิจขนาดใหญ่",
      },
      {
        heading: "วิธีคำนวณความคุ้มค่า",
        body: "1. วิเคราะห์ load profile เพื่อหา peak demand และช่วงเวลาที่เกิด\n2. คำนวณ demand charge ปัจจุบัน\n3. กำหนดเป้าหมาย peak shaving (เช่น ลด 20-30%)\n4. คำนวณขนาด BESS ที่ต้องการ\n5. เปรียบเทียบต้นทุน BESS กับค่า demand charge ที่ประหยัดได้\n\nโดยทั่วไป BESS สำหรับ peak shaving จะคืนทุนใน 5-8 ปี ขึ้นอยู่กับขนาดและรูปแบบการใช้ไฟ",
      },
    ],
    keyTakeaways: [
      "Peak Shaving ลดค่า demand charge ได้ 20-30%",
      "BESS ชาร์จช่วง off-peak จ่ายช่วง peak",
      "คืนทุนเฉลี่ย 5-8 ปี สำหรับ peak shaving",
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
        body: "ไฟฟ้า 1 kWh จากกริดไทยปล่อย CO₂ ประมาณ 0.5 กก. (emission factor ของ กฟผ.) ดังนั้นระบบโซลาร์ 1 MWp ที่ผลิตไฟฟ้าได้ 1,500 MWh/ปี จะลด CO₂ ได้ประมาณ 750 ตัน/ปี\n\nข้อมูลนี้สามารถนำไปรายงานตามมาตรฐาน GRI, CDP, หรือ TCFD ได้",
      },
    ],
    keyTakeaways: [
      "โซลาร์ลด Scope 2 Emissions โดยตรง",
      "1 MWp ลด CO₂ ได้ประมาณ 750 ตัน/ปี",
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
  const { lang, t } = usePageTranslation("blogPost");
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const post = getLocalizedBlogPost(slug, lang);
  const content = getLocalizedArticleContent(slug, lang, articleContent[slug]);
  const localizedPosts = getLocalizedBlogPosts(lang);

  if (!post) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            {t("blogPost.notFound.title")}
          </h1>
          <p className="text-text-secondary mb-6">
            {t("blogPost.notFound.desc")}
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 btn-accent rounded-lg font-display font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> {t("blogPost.back")}
          </Link>
        </div>
      </div>
    );
  }

  const related = localizedPosts
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
              <ArrowLeft className="w-4 h-4" /> {t("blogPost.back")}
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
                toast.success(t("blogPost.shareCopied"));
              }}
              aria-label={t("blogPost.shareAria")}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-primary transition-colors"
            >
              <Share2 className="w-4 h-4" /> {t("blogPost.share")}
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
                    {t("blogPost.draft")}
                  </p>
                </div>
              )}

              {/* CTA in article */}
              <div className="mt-12 p-6 rounded-xl glass-card">
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {t("blogPost.articleCta.title")}
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  {t("blogPost.articleCta.desc")}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/assessment"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent rounded-lg text-sm font-display font-semibold"
                  >
                    {t("blogPost.articleCta.calculate")}{" "}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent-outline rounded-lg text-sm font-display font-semibold"
                  >
                    {t("blogPost.articleCta.survey")}
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
                    {t("blogPost.takeaways")}
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
              {t("blogPost.related")}
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
            {t("blogPost.final.title")}
          </h2>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto">
            {t("blogPost.final.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-accent rounded-lg font-display font-semibold"
            >
              {t("blogPost.final.survey")} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/assessment"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-accent-outline rounded-lg font-display font-semibold"
            >
              {t("blogPost.final.assessment")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
