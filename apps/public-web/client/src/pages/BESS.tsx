/** 
 * SIRINX BESS Pillar Page — /bess
 * Dedicated BESS/Battery Energy Storage System page with SEO-AEO-GEO content,
 * FAQ schema, and cross-links to cluster pages (/bess/factory, /bess/hotel, etc.)
 * 
 * Word count target: ~3,500 words across the pillar + clusters = 13k-15k total
 */
import { useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/solutions";
import { bessFaq } from "@shared/bessFaq";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import {
  ArrowRight,
  Battery,
  CheckCircle2,
  Factory,
  Hotel,
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

export default function BESS() {
  const { t } = usePageTranslation("solutions");

  useEffect(() => {
    const track = (category: string) => {
      // Track BESS category visits
      console.log("BESS category visited:", category);
    };
    const hash = window.location.hash.replace("#", "");
    const categoryMap: Record<string, string> = {
      factory: "bess/factory",
      hotel: "bess/hotel",
      "peak-shaving": "bess/peak-shaving",
      sizing: "bess/sizing",
      "safety-cost": "bess/safety-cost",
    };
    if (hash && categoryMap[hash]) {
      track(categoryMap[hash]);
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden bg-background">
        <div className="absolute inset-0">
          <img
            src={cfImage("/assets/optimized/hero-bess-realistic-1280.jpg", 1280, {
              quality: 76,
            })}
            srcSet={cfImageSrcSet(
              "/assets/optimized/hero-bess-realistic-1280.jpg",
              [640, 960, 1280, 1600],
              { quality: 76 }
            )}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt="SIRINX BESS Battery Energy Storage System"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-transparent to-transparent" />
        </div>
        <div className="container relative z-10 pt-20 pb-12">
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
              {t("sol.bess.title")}
            </span>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {t("sol.bess.title")}
            </h1>
            <p className="text-text-secondary text-lg mb-6">
              {t("sol.bess.solution")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/solutions#bess"
                className="inline-flex items-center gap-2 px-4 py-2 font-display font-medium btn-accent rounded-lg text-sm"
              >
                {t("sol.cta.details")} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 px-4 py-2 font-display font-medium btn-accent-outline rounded-lg text-sm"
              >
                {t("sol.bottomCta.btn2")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== BESS OVERVIEW ===== */}
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
              ความรู้พื้นฐานเกี่ยวกับ BESS
            </h2>
            <p className="text-sm text-text-secondary mb-8">
              ระบบกักเก็บพลังงาน (Battery Energy Storage System) เป็นโซลูชันที่ช่วยให้ธุรกิจสามารถจัดการการใช้พลังงานได้อย่างมี יעילותมากขึ้น โดยการเก็บพลังงานจากแสงอาทิตย์ในช่วงกลางวันและใช้งานในช่วงที่ค่าไฟสูง หรือเมื่อมีการไฟดับ
            </p>
          </motion.div>

          {/* BESS Key Benefits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
              <div className="text-accent-primary text-3xl mb-3">💰</div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {t("sol.bess.benefit1")}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                การลดค่าใช้จ่ายด้าน demand charge จากการวิเคราะห์ load profile จริง
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
              <div className="text-accent-primary text-3xl mb-3">⚡</div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {t("sol.bess.benefit2")}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                การสำรองไฟฟ้าสำรองสำคัญในช่วงที่ไฟดับหรือระบบไม่เสถียร
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
              <div className="text-accent-primary text-3xl mb-3">📅</div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {t("sol.bess.benefit3")}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                การวางแผนการใช้พลังงานตามช่วงเวลาค่าไฟและข้อจำกัดด้านความปลอดภัย
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
              <div className="text-accent-primary text-3xl mb-3">🛡️</div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {t("sol.bess.benefit4")}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                เพิ่มความเสถียรของระบบพลังงานสำหรับการใช้งานระยะยาว
              </p>
            </div>
          </div>

          {/* Suitable For section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <div>
              <h3 className="font-display font-semibold text-foreground mb-3">
                {t("sol.bess.suitable1")}
              </h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span>โรงงานที่มีค่า demand charge สูง</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span>ธุรกิจที่ต้องการ backup power</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span>อาคารที่ต้องการ peak shaving</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground mb-3">
                {t("sol.bess.suitable2")}
              </h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span>พื้นที่ที่ไฟฟ้าไม่เสถียร</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                  <span>อาคารที่มี EV Charger</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 pt-8 border-t border-border-subtle bg-surface-elevated">
            <h3 className="font-display font-semibold text-foreground mb-4">
              {t("sol.bottomCta.title")}
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              {t("sol.bottomCta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact?interest=bess"
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
          </div>
        </div>
      </section>

      {/* ===== BESS FAQ SECTION ===== */}
      <section id="bess-faq" className="py-16 lg:py-20 bg-background">
        <div className="container max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
              คำถามที่พบบ่อยเกี่ยวกับ BESS
            </h2>
            <p className="text-sm text-text-secondary mb-8">
              คำตอบจากงานออกแบบระบบกักเก็บพลังงานจริง — ตัวเลขผลประหยัดต้องประเมินจากข้อมูลหน้างานของแต่ละโครงการ
            </p>
            <div className="space-y-3">
              {bessFaq.map((item) => (
                <details
                  key={item.question}
                  className="rounded-xl border border-border-subtle bg-surface-elevated p-5"
                >
                  <summary className="cursor-pointer list-none font-display text-sm font-semibold text-foreground">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CROSS-LINKED CLUSTER PREVIEWS ===== */}
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
              โซลูชน BESS ที่เหมาะกับธุรกิจของคุณ
            </h2>
            <p className="text-text-secondary text-sm mb-8">
              แต่ละโครงการมีข้อจำกัดและเป้าหมายที่แตกต่างกัน เรามีโซลูชน BESS ที่ปรับแต่งสำหรับกรณีใช้งานเฉพาะเหล่านี้
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Factory Cluster */}
              <div
                className="group p-6 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors cursor-pointer"
                onClick={() => window.location.href="/bess/factory"}
              >
                <div className="h-12 w-12 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-4">
                  <Factory className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {t("sol.bess.factory.title")}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  โรงงานอุตสาหกรรมที่มีค่า demand charge สูง
                </p>
                <p className="text-xs text-accent-primary font-medium mt-2">
                  ลดได้ 10-20% ของ demand charge
                </p>
              </div>

              {/* Hotel Cluster */}
              <div
                className="group p-6 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors cursor-pointer"
                onClick={() => window.location.href="/bess/hotel"}
              >
                <div className="h-12 w-12 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-4">
                  <Hotel className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {t("sol.bess.hotel.title")}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  โรงแรมและรีสอร์ทที่ต้องการลดค่า AC peak
                </p>
                <p className="text-xs text-accent-primary font-medium mt-2">
                  ลดได้ 15-25% ของ AC peak
                </p>
              </div>

              {/* Peak Shaving Cluster */}
              <div
                className="group p-6 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors cursor-pointer"
                onClick={() => window.location.href="/bess/peak-shaving"}
              >
                <div className="h-12 w-12 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {t("sol.bess.peak-shaving.title")}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  การตัด Peak Shaving สำหรับธุรกิจที่มีช่วง peak ชัดเจน
                </p>
                <p className="text-xs text-accent-primary font-medium mt-2">
                  ลดได้ 30-40% ของ demand charge
                </p>
              </div>

              {/* Sizing Cluster */}
              <div
                className="group p-6 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors cursor-pointer"
                onClick={() => window.location.href="/bess/sizing"}
              >
                <div className="h-12 w-12 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-4">
                  <Ruler className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {t("sol.bess.sizing.title")}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  การคำนวณขนาด BESS ที่ถูกต้องครั้งแรก
                </p>
                <p className="text-xs text-accent-primary font-medium mt-2">
                  หลีกเลี่ยงการจ่ายเงินเกินจริง
                </p>
              </div>

              {/* Safety & Cost Cluster */}
              <div
                className="group p-6 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors cursor-pointer"
                onClick={() => window.location.href="/bess/safety-cost"}
              >
                <div className="h-12 w-12 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {t("sol.bess.safety-cost.title")}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  ความปลอดภัยและการคำนวณ TCO อย่างครบถ้วน
                </p>
                <p className="text-xs text-accent-primary font-medium mt-2">
                  มั่นใจในมาตร IEC 62619
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}