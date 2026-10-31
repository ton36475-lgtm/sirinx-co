/** 
 * SIRINX BESS Safety & Cost Cluster Page — /bess/safety-cost
 * Dedicated BESS safety standards and total cost of ownership
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
  Shield,
  Battery,
  Ruler,
  Zap,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function BSSESSafetyCost() {
  const { t } = usePageTranslation("solutions");
  const faq: BessFaqItem = {
    question: "มาตรฐานความปลอดภัยของ BESS มีอะไรบ้าง?",
    answer:
      "การเลือกเซลล์ LFP ที่ผ่านมาตร IEC 62619 เป็นขั้นตอนสำคัญเพื่อความปลอดภัย ติดตั้งครบตามมาตร BS EN 62933 และมี BMS จัดการระบบโดยอัตโนมัติ 24/7 ทำให้สามารถติดตามสภาพแบตเตอรี่ได้ตลอดเวลา รวมถึงป้องกันการ Overcharge/Over-discharge และคำนวณ TCO อย่างครบถ้วนทั้งค่าใช้จ่ายการลงทุนเริ่มต้น ค่าใช้จ่ายในการดูแลรักษา และผลประโยชน์ที่ได้รับตลอดอายุการใช้งาน",
  };

  useEffect(() => {
    console.log("BESS Safety & Cost page loaded");
  }, []);

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[40vh] flex items-center overflow-hidden bg-background">
        <div className="absolute inset-0">
          <img
            src={cfImage("/assets/optimized/hero-bess-safety-1280.jpg", 1280, {
              quality: 76,
            })}
            srcSet={cfImageSrcSet(
              "/assets/optimized/hero-bess-safety-1280.jpg",
              [640, 960, 1280, 1600],
              { quality: 76 }
            )}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt="SIRINX BESS ความปลอดภัยและค่าใช้จ่าย"
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
              {t("sol.bess.safety-cost.title")}
            </span>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              {t("sol.bess.safety-cost.title")}
            </h1>
            <p className="text-text-secondary text-lg mb-6">
              {t("sol.bess.safety-cost.solution")}
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

      {/* ===== SAFETY & COST-SPECIFIC CONTENT ===== */}
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
              {t("sol.bess.safety-cost.title")}
            </h2>
            <p className="text-text-secondary text-lg mb-8">
              ความปลอดภัยและการคำนวณค่าใช้จ่ายที่ถูกต้องเป็นรากฐานสำคัญของโครงการ BESS ที่ประสบความสำเร็จ
            </p>

            {/* Problem */}
            <div className="mb-8">
              <h3 className="font-display font-semibold text-accent-primary mb-3">
                {t("sol.bess.safety-cost.problem")}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                BESS ต้องการการออกแบบตามมาตรฐานความปลอดภัยและการจัดการความเสี่ยง หากไม่ปฏิบัติตามมาตรฐานที่เกี่ยวข้อง อาจนำไปสู่ความเสี่ยงจากการ Overcharge/Over-discharge อุบัติเหตุจากการติดตั้งที่ไม่ถูกต้อง และค่าใช้จ่ายที่ไม่สามารถคาดการณ์ได้จากการเปลี่ยนชิ้นส่วนหรือการบำรุงรักษาที่ไม่เพียงพอ
              </p>
            </div>

            {/* Solution */}
            <div className="mb-8">
              <h3 className="font-display font-semibold text-accent-primary mb-3">
                {t("sol.bess.safety-cost.solution")}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                เลือกเซลล์ LFP ผ่านมาตร IEC 62619 ติดตั้งครบตามมาตร BS EN 62933 และมี BMS จัดการระบบโดยอัตโนมัติ ทำให้สามารถติดตามสภาพแบตเตอรี่ได้ตลอดเวลา ป้องกันการ Overcharge/Over-discharge และคำนวณ TCO อย่างครบถ้วนทั้งค่าใช้จ่ายการลงทุนเริ่มต้น ค่าใช้จ่ายในการดูแลรักษา และผลประโยชน์ที่ได้รับตลอดอายุการใช้งาน
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">🛡️</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  ความปลอดภัยตามสากล
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.safety-cost.benefit1")}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">📉</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  ลดความเสี่ยงจากการติดตั้งที่ไม่ถูกต้อง
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.safety-cost.benefit2")}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">⚡</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  ระบบ Monitoring 24/7
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.safety-cost.benefit3")}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">💵</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  TCO ครบถ้วน
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.safety-cost.benefit4")}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="text-accent-primary text-2xl mb-3">⛽</div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  ป้องกัน Overcharge/Over-discharge
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("sol.bess.safety-cost.benefit5")}
                </p>
              </div>
            </div>

            {/* Suitable For */}
            <div className="mb-8">
              <h3 className="font-display font-semibold text-foreground mb-3">
                {t("sol.bess.safety-cost.suitable1")}
              </h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span>ผู้ที่ให้ความสำคัญกับความปลอดภัยเป็นอันดับแรก</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span>บริษัทที่ต้องการตรวจสอบมาตรฐานการติดตั้ง</span>
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
                href="/contact?interest=bess-safety-cost"
                className="inline-flex items-center gap-2 px^6 py-3.5 font-display font-semibold btn-accent rounded-lg"
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
      <section id="bess-safety-cost-faq" className="py-16 lg:py-20 bg-background">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
              คำถามที่พบบ่อยเกี่ยวกับความปลอดภัยและค่าใช้จ่าย BESS
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
                href="/bess/factory"
                className="group p-4 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors cursor-pointer"
              >
                <div className="h-10 w-10 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-3">
                  <Factory className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">
                  {t("sol.bess.factory.title")}
                </h3>
                <p className="text-xs text-accent-primary font-medium">
                  โรงงานอุตสาหกรรม
                </p>
              </Link>

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
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}