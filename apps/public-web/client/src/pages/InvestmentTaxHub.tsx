/**
 * SIRINX Investment & Tax Hub — Second Pass Refinement
 * Tighter spacing, Solar Carport ROI example, more helpful tone
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { trackSolutionVisit } from "@/components/HeroSlideshow";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import {
  ArrowRight,
  TrendingUp,
  PiggyBank,
  FileText,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Car,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

const CDN =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv";
const HERO = `${CDN}/hero-investment-fRtcNVseiLRqovGxudgo83.webp`;

const investmentModels = [
  {
    title: "ซื้อขาด (Outright Purchase)",
    desc: "ลงทุนเต็มจำนวน เป็นเจ้าของระบบทันที ได้ผลตอบแทนสูงสุดในระยะยาว",
    pros: [
      "ผลตอบแทนสูงสุด (IRR 15-25%)",
      "เป็นเจ้าของระบบ 100%",
      "ใช้สิทธิ์ลดหย่อนภาษีได้เต็มที่",
      "ไม่มีค่าใช้จ่ายรายเดือน",
    ],
    suitable: "ธุรกิจที่มีงบลงทุนพร้อม ต้องการ ROI สูงสุด",
    highlight: false,
  },
  {
    title: "ผ่อนชำระ (Installment)",
    desc: "แบ่งจ่ายเป็นงวด ลดภาระเงินก้อน เริ่มประหยัดค่าไฟตั้งแต่เดือนแรก",
    pros: [
      "ไม่ต้องจ่ายเงินก้อนใหญ่",
      "ค่างวดต่ำกว่าค่าไฟที่ประหยัดได้",
      "เป็นเจ้าของระบบหลังผ่อนหมด",
      "ยืดหยุ่นเรื่องระยะเวลาผ่อน",
    ],
    suitable: "ธุรกิจที่ต้องการรักษา cash flow แต่ยังต้องการเป็นเจ้าของ",
    highlight: false,
  },
  {
    title: "PPA (Power Purchase Agreement)",
    desc: "ไม่ต้องลงทุนเลย จ่ายเฉพาะค่าไฟที่ผลิตได้ในราคาถูกกว่าการไฟฟ้า",
    pros: [
      "ไม่ต้องลงทุนเลย",
      "จ่ายเฉพาะค่าไฟที่ใช้จริง",
      "ราคาถูกกว่าการไฟฟ้า",
      "SIRINX ดูแลระบบทั้งหมด",
    ],
    suitable: "ธุรกิจที่ไม่ต้องการลงทุน แต่ต้องการลดค่าไฟทันที",
    highlight: true,
  },
  {
    title: "Co-investment",
    desc: "ลงทุนร่วมกับ SIRINX แบ่งปันผลตอบแทนตามสัดส่วน ลดความเสี่ยง",
    pros: [
      "ลดเงินลงทุนเริ่มต้น",
      "แบ่งปันความเสี่ยง",
      "ได้รับคำปรึกษาจากผู้เชี่ยวชาญ",
      "ยืดหยุ่นในการปรับสัดส่วน",
    ],
    suitable: "ธุรกิจที่ต้องการลงทุนแต่ต้องการลดความเสี่ยง",
    highlight: false,
  },
];

const taxBenefits = [
  {
    title: "หักค่าเสื่อมราคาเร่ง",
    desc: "อุปกรณ์พลังงานแสงอาทิตย์สามารถหักค่าเสื่อมราคาเร่งได้ตามประกาศกรมสรรพากร",
    icon: Calculator,
  },
  {
    title: "ยกเว้นภาษีนำเข้า",
    desc: "อุปกรณ์พลังงานทดแทนบางประเภทได้รับการยกเว้นอากรขาเข้า",
    icon: FileText,
  },
  {
    title: "สิทธิ์ BOI",
    desc: "โครงการพลังงานทดแทนอาจได้รับสิทธิประโยชน์จาก BOI ตามเงื่อนไขที่กำหนด",
    icon: Shield,
  },
  {
    title: "Carbon Credit",
    desc: "โครงการโซลาร์สามารถขึ้นทะเบียนเพื่อรับ Carbon Credit ได้ตามเกณฑ์ที่กำหนด",
    icon: TrendingUp,
  },
];

export default function InvestmentTaxHub() {
  useEffect(() => {
    trackSolutionVisit("solar-carport");
  }, []);

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[45vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={cfImage(HERO, 1280, { quality: 76 })}
            srcSet={cfImageSrcSet(HERO, [640, 960, 1280, 1600], { quality: 76 })}
            sizes="100vw"
            alt="Investment"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        </div>
        <div className="container relative z-10 pt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="max-w-2xl"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              Investment & Tax Hub
            </span>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-3">
              การลงทุนพลังงานสะอาด
              <br />
              <span className="text-gradient-accent">ผลตอบแทนที่วัดได้</span>
            </h1>
            <p className="text-text-secondary">
              เลือกรูปแบบการลงทุนที่เหมาะกับธุรกิจของคุณ
              พร้อมข้อมูลสิทธิประโยชน์ทางภาษีที่เป็นไปได้
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== DISCLAIMER BANNER ===== */}
      <section className="py-3 bg-accent-secondary/10 border-y border-accent-secondary/20">
        <div className="container">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-secondary shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted">
              <strong className="text-foreground">ข้อมูลสำคัญ:</strong>{" "}
              ข้อมูลในหน้านี้เป็นข้อมูลทั่วไปเพื่อประกอบการพิจารณาเท่านั้น
              ไม่ถือเป็นคำแนะนำด้านการลงทุนหรือภาษี
              ผลตอบแทนที่แสดงเป็นการประมาณการ
              กรุณาปรึกษาที่ปรึกษาทางการเงินก่อนตัดสินใจ
            </p>
          </div>
        </div>
      </section>

      {/* ===== INVESTMENT MODELS ===== */}
      <section className="py-14 lg:py-20 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-8"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              Investment Models
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
              รูปแบบการลงทุน
            </h2>
            <p className="text-sm text-text-secondary max-w-2xl">
              เลือกรูปแบบที่เหมาะกับสถานะทางการเงินและเป้าหมายของธุรกิจคุณ
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-5">
            {investmentModels.map((model, i) => (
              <motion.div
                key={model.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className={`p-5 lg:p-6 rounded-xl border ${model.highlight ? "border-accent-primary/40 bg-accent-glow" : "border-border-subtle bg-surface-elevated"} hover:border-border-accent transition-colors`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="w-5 h-5 text-accent-primary" />
                  <h3 className="font-display text-base font-bold text-foreground">
                    {model.title}
                  </h3>
                  {model.highlight && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-accent-primary text-text-inverse rounded-md ml-auto">
                      แนะนำ
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary mb-3">{model.desc}</p>
                <ul className="space-y-1.5 mb-3">
                  {model.pros.map(p => (
                    <li
                      key={p}
                      className="flex items-start gap-2 text-xs text-text-secondary"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="pt-3 border-t border-border-subtle">
                  <p className="text-[10px] text-text-muted">
                    <strong className="text-foreground">เหมาะกับ:</strong>{" "}
                    {model.suitable}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SOLAR CARPORT ROI EXAMPLE ===== */}
      <section className="py-14 lg:py-20 section-alt">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-5 h-5 text-accent-primary" />
              <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase">
                Solar Carport ROI Example
              </span>
            </div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-5">
              ตัวอย่าง ROI: Solar Carport 100 คัน
            </h2>
            <div className="p-5 lg:p-6 rounded-xl border border-border-accent bg-surface-elevated">
              <h3 className="font-display font-semibold text-foreground text-sm mb-4">
                ห้างสรรพสินค้า / อาคารพาณิชย์ — ลานจอดรถ 100 คัน
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "กำลังผลิตโดยประมาณ", value: "200-300 kW" },
                  { label: "เงินลงทุนโดยประมาณ", value: "8-12 ล้านบาท" },
                  { label: "ประหยัดค่าไฟต่อปี", value: "2-3.5 ล้านบาท" },
                  { label: "คืนทุนโดยประมาณ", value: "3-5 ปี", accent: true },
                  {
                    label: "ผลตอบแทนตลอดอายุ 25 ปี",
                    value: "40-70 ล้านบาท",
                    accent: true,
                  },
                  { label: "รายได้เสริม EV Charging", value: "มีโอกาส" },
                ].map(item => (
                  <div
                    key={item.label}
                    className="p-3 rounded-lg bg-accent-glow"
                  >
                    <div className="text-[10px] text-text-muted mb-0.5">
                      {item.label}
                    </div>
                    <div
                      className={`font-display text-sm font-bold ${item.accent ? "text-accent-primary" : "text-foreground"}`}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-secondary/10 border border-accent-secondary/20 mb-4">
                <AlertTriangle className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                <p className="text-[10px] text-text-muted">
                  ตัวเลขข้างต้นเป็นการประมาณการเบื้องต้น
                  ผลลัพธ์จริงขึ้นอยู่กับทำเลที่ตั้ง ปริมาณการใช้ไฟฟ้า อัตราค่าไฟ
                  และขนาดระบบ
                </p>
              </div>
              <Link
                href="/solar-carport"
                className="inline-flex items-center gap-2 text-xs font-medium text-accent-primary hover:underline"
              >
                ดูรายละเอียด Solar Carport{" "}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== GENERAL ROI EXAMPLE ===== */}
      <section className="py-14 lg:py-20 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-3xl mx-auto"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              ROI Estimation
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-5">
              ตัวอย่าง ROI: Rooftop Solar 500 kW
            </h2>
            <div className="p-5 lg:p-6 rounded-xl border border-border-subtle bg-surface-elevated">
              <h3 className="font-display font-semibold text-foreground text-sm mb-4">
                โรงงานขนาดกลาง (ตัวอย่าง)
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "เงินลงทุนโดยประมาณ", value: "12-15 ล้านบาท" },
                  { label: "ประหยัดค่าไฟต่อปี", value: "3-4 ล้านบาท" },
                  { label: "คืนทุนโดยประมาณ", value: "3-5 ปี", accent: true },
                  {
                    label: "ผลตอบแทนตลอดอายุ 25 ปี",
                    value: "60-80 ล้านบาท",
                    accent: true,
                  },
                ].map(item => (
                  <div
                    key={item.label}
                    className="p-3 rounded-lg bg-accent-glow"
                  >
                    <div className="text-[10px] text-text-muted mb-0.5">
                      {item.label}
                    </div>
                    <div
                      className={`font-display text-sm font-bold ${item.accent ? "text-accent-primary" : "text-foreground"}`}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-secondary/10 border border-accent-secondary/20">
                <AlertTriangle className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                <p className="text-[10px] text-text-muted">
                  ตัวเลขข้างต้นเป็นการประมาณการเบื้องต้น
                  ผลลัพธ์จริงขึ้นอยู่กับหลายปัจจัย
                  กรุณาติดต่อเราเพื่อรับการประเมินเฉพาะสำหรับธุรกิจของคุณ
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== TAX BENEFITS ===== */}
      <section className="py-14 lg:py-20 section-alt">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-8"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              Tax Benefits
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
              สิทธิประโยชน์ทางภาษีที่เป็นไปได้
            </h2>
            <p className="text-sm text-text-secondary max-w-2xl">
              การลงทุนพลังงานสะอาดอาจได้รับสิทธิประโยชน์ทางภาษีหลายรูปแบบ
              ขึ้นอยู่กับเงื่อนไขของแต่ละโครงการ
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {taxBenefits.map((tb, i) => (
              <motion.div
                key={tb.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-4 rounded-xl border border-border-subtle bg-surface-elevated"
              >
                <tb.icon className="w-6 h-6 text-accent-secondary mb-3" />
                <h3 className="font-display font-semibold text-foreground text-sm mb-1.5">
                  {tb.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {tb.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FULL DISCLAIMER ===== */}
      <section className="py-8 bg-background border-t border-border-subtle">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h3 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-accent-secondary" />
              ข้อจำกัดความรับผิดชอบ (Disclaimer)
            </h3>
            <div className="space-y-1.5 text-[10px] text-text-muted leading-relaxed">
              <p>
                1.
                ข้อมูลทั้งหมดในหน้านี้จัดทำขึ้นเพื่อเป็นข้อมูลประกอบการพิจารณาเท่านั้น
                ไม่ถือเป็นคำแนะนำด้านการลงทุน การเงิน หรือภาษี
              </p>
              <p>
                2.
                ตัวเลขผลตอบแทนและการประหยัดที่แสดงเป็นการประมาณการจากโครงการที่ผ่านมา
                ผลลัพธ์จริงอาจแตกต่างกันอย่างมีนัยสำคัญ
              </p>
              <p>
                3. สิทธิประโยชน์ทางภาษีอาจเปลี่ยนแปลงได้ตามนโยบายของรัฐบาล
                กรุณาตรวจสอบข้อมูลล่าสุดจากกรมสรรพากร
              </p>
              <p>
                4. SIRINX ไม่ได้เป็นที่ปรึกษาทางการเงินหรือภาษี
                การตัดสินใจลงทุนควรปรึกษาผู้เชี่ยวชาญที่เกี่ยวข้อง
              </p>
              <p>5. ผลการดำเนินงานในอดีตไม่ได้เป็นการรับประกันผลลัพธ์ในอนาคต</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 lg:py-24 section-alt relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow to-transparent" />
        <div className="container relative text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              ต้องการประเมิน ROI เฉพาะธุรกิจคุณ?
            </h2>
            <p className="text-text-secondary text-sm mb-7 max-w-lg mx-auto">
              ทีมที่ปรึกษาของเราพร้อมวิเคราะห์ความคุ้มค่าเฉพาะสำหรับธุรกิจของคุณ
              ฟรี ไม่มีข้อผูกมัด
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg"
              >
                ขอรับการประเมิน ROI <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent-outline rounded-lg"
              >
                ประเมินเบื้องต้นด้วยตัวเอง
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
