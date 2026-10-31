/** 
 * SIRINX BESS Factory Cluster Page — /bess/factory
 * Dedicated BESS for industrial factories with SEO-AEO-GEO content,
 * FAQ schema, and cross-links back to the /bess pillar page.
 */
import { useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/solutions";
import { BessFaqItem } from "@shared/bessFaq";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import {
  ArrowRight,
  CheckCircle2,
  Factory,
  Hotel,
  Battery,
  Zap,
  Ruler,
  Shield,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function BESSFactory() {
  const { t } = usePageTranslation("solutions");
  const faq: BessFaqItem = {
    question: "BESS สำหรับโรงงานมีขั้นตอนการออกแบบอย่างไร?",
    answer:
      "เริ่มจากการรวบรวม load profile 24 ชม. เพื่อวิเคราะห์ peak demand และรูปแบบการใช้ไฟ จึงใช้ข้อมูลนี้คำนวณขนาด BESS ที่เหมาะสม ทั้ง kWh สำหรับพลังงานและ kW สำหรับกำลังสูงสุด ต่อมาต้องตรวจสอบข้อจำกัดด้านความปลอดภัย มาตรฐาน IEC 62619 สำหรับเซลล์ และระการติดตั้งตาม BS EN 62933 พร้อมระบบจัดการแบตเตอรี่ (BMS) ที่ตรวจสอบสภาพโดยอัตโนมัติ โครงการจึงจะได้ตัวเลขผลประหยัดและระยะคืนทุนที่เป็นกรณีศึกษาจากข้อมูลจริงโคร่งานนั้นๆ",
  };

  useEffect(() => {
    console.log("BESS Factory page loaded");
  }, []);

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden bg-background">
        <div className="absolute inset-0">
          <img
            src={cfImage("/assets/optimized/hero-bess-factory-1280.jpg", 1280, {
              quality: 76,
            })}
            srcSet={cfImageSrcSet(
              "/assets/optimized/hero-bess-factory-1280.jpg",
              [640, 960, 1280, 1600],
              { quality: 76 }
            )}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt="SIRINX BESS สำหรับโรงงานอุตสาหกรรม"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-transparent" />
        </div>
        <div className="container relative z-10 pt-12 pb-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="max-w-3xl"
          >
            <span
              className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block"
            >
              {t("sol.bess.factory.title")}
            </span>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t("sol.bess.factory.title")}
            </h1>
            <p className="text-text-secondary text-lg mb-6">
              {t("sol.bess.factory.solution")}
            </p>
            <Link
              href="/bess"
              className="inline-flex items-center gap-2 px-4 py-2 font-display font-medium btn-accent rounded-lg text-sm"
            >
              {t("sol.cta.back")} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== FACTORY-SPECIFIC CONTENT ===== */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">
              {t("sol.bess.factory.title")}
            </h2>
            <p className="text-text-secondary text-lg mb-8">
              สำหรับโรงงานและอาคารอุตสาหกรรมที่มีค่า demand charge สูง การติดตั้ง BESS จะช่วยลดต้นทุนพลังงานได้อย่างมีนัยสำคัญ เราออกแบบระบบให้ตรงกับรูปแบบการใช้ไฟจริงของแต่ละโครงการ
            </p>

            {/* Problem */}
            <div className="mb-8">
              <h3 className="font-display font-semibold text-accent-primary mb-3">
                {t("sol.bess.factory.problem")}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                โรงงานหลายแห่งเผชิญกับปัญหาค่าใช้จ่ายด้าน demand charge ที่สูงในช่วงเวลากำหนดทุกวัน รวมถึงความเสี่ยงจากการไฟดับที่อาจส่งผลต่อโหลดสำคัญได้ และความยากลำบากในการใช้พลังงานโซลาร์ที่ผลิตได้ในช่วงกลางวันในช่วงเวลากลางคืนหรือค่าไฟสูง
              </p>
            </div>

            {/* Solution */}
            <div className="mb-8">
              <h3 className="font-display font-semibold text-accent-primary mb-3">
                {t("sol.bess.factory.solution")}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                BESS ขนาดกลางถึงใหญ่ช่วยลด peak และ smooth load สำหรับโรงงานที่ใช้ไฟมากกว่า 1 MW โดยการเก็บพลังงานโซลาร์ที่ผลิตได้ในช่วงกลางวันเพื่อใช้ในช่วงค่าไฟสูงและเป็นไฟฟ้าสำรองเมื่อระบบไฟหลักขัดข้อง
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">10-20%</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  ลด demand charge
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.factory.benefit1")}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">🔋</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  พลังงานสำรอง
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.factory.benefit2")}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">⚡</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  ปรับใช้ตามเวลาค่าไฟ
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.factory.benefit3")}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">🛡️</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  ความน่าเชื่อถือ
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.factory.benefit4")}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">3-5 ปี</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  ROI
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.factory.benefit5")}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">🌱</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  คาร์บอนฟุตพรINT
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.factory.benefit6")}
                </p>
              </div>
            </div>

            {/* Suitable For */}
            <div className="mb-8">
              <h3 className="font-display font-semibold text-foreground mb-3">
                {t("sol.bess.factory.suitable1")}
              </h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span>โรงงานอุตสาหกรรม</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span>อุตสาหกรรมอาหารและเครื่องจักร</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span>อุตสาหกรรมเคมีและโลหะ</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="pt-8 border-t border-border-subtle bg-surface-elevated">
              <h3 className="font-display font-semibold text-foreground mb-4">
                {t("sol.bottomCta.title")}
              </h3>
              <p className="text-text-secondary text-sm mb-6">
                {t("sol.bottomCta.desc")}
              </p>
              <Link
                href="/contact?interest=bess-factory"
                className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg"
              >
                {t("sol.bottomCta.btn1")}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent-outline rounded-lg"
              >
                {t("sol.bottomCta.btn2")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== BESS FAQ ===== */}
      <section id="bess-factory-faq" className="py-16 lg:py-20 bg-background">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
              คำถามที่พบบ่อยเกี่ยวกับ BESS สำหรับโรงงาน
            </h2>
            <p className="text-sm text-text-secondary mb-8">
              คำตอบจากงานออกแบบระบบกักเก็บพลังงานจริง — ตัวเลขผลประหยัดต้องประเมินจากข้อมูลหน้างานของแต่ละโครงการ
            </p>
            <div className="space-y-3">
              {faq.question ? (
                <details key={faq.question} className="rounded-xl border border-border-subtle bg-surface-elevated p-5">
                  <summary className="cursor-pointer list-none font-display text-sm font-semibold text-foreground">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {faq.answer}
                  </p>
                </details>
              ) : null}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CROSS-LINKS ===== */}
      <section className="py-24 lg:py-32 section-alt bg-background">
        <div className="container max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-8">
              โซลูชน BESS อื่นๆ ที่เกี่ยวข้อง
            </h2>
            <p className="text-text-secondary text-sm mb-8">
              เรียนรู้เกี่ยวกับโซลูชน BESS ที่ปรับแต่งสำหรับกรณีใช้งานอื่นๆ
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <Link
                href="/bess/hotel"
                className="group p-4 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors cursor-pointer"
              >
                <div className="h-10 w-10 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-3">
                  <Hotel className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">
                  {t("sol.bess.hotel.title")}
                </h3>
                <p className="text-xs text-accent-primary font-medium">
                  โรงแรมและรีสอร์ท
                </p>
              </Link>

              <Link
                href="/bess/peak-shaving"
                className="group p-4 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors cursor-pointer"
              >
                <div className="h-10 w-10 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">
                  {t("sol.bess.peak-shaving.title")}
                </h3>
                <p className="text-xs text-accent-primary font-medium">
                  Peak Shaving
                </p>
              </Link>

              <Link
                href="/bess/sizing"
                className="group p-4 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors cursor-pointer"
              >
                <div className="h-10 w-10 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-3">
                  <Ruler className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">
                  {t("sol.bess.sizing.title")}
                </h3>
                <p className="text-xs text-accent-primary font-medium">
                  ขนาด BESS
                </p>
              </Link>

              <Link
                href="/bess/safety-cost"
                className="group p-4 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors cursor-pointer"
              >
                <div className="h-10 w-10 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">
                  {t("sol.bess.safety-cost.title")}
                </h3>
                <p className="text-xs text-accent-primary font-medium">
                  ความปลอดภัยและค่าใช้จ่าย
                </p>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}