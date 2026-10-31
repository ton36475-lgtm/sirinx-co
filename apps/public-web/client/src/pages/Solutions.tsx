/**
 * SIRINX Solutions — Full i18n Integration
 * Solar Carport as first/featured solution, visual images, tighter layout
 */
import { useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { trackSolutionVisit, type SolutionCategory } from "@/components/HeroSlideshow";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/solutions";
import { bessFaq } from "@shared/bessFaq";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import {
  ArrowRight, Sun, Waves, Car, Battery, Brain, Wrench, Handshake,
  CheckCircle2, Zap, Factory, Hotel, Ruler, Shield
} from "lucide-react";

const BESSContainerProduct3D = lazy(
  () => import("@/components/three/BESSContainerProduct3D"),
);

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const HERO = media("hero-solutions-AG25WEja6TRJEEzvpx3wZU.webp");
const IMG_CARPARK = media("solar-carpark-hero-HkuPbSXRuEJEzybRN8Xb7W.webp");
const IMG_EV = media("solar-carpark-ev-charging-niYjh6gCmDqQNQiCE6oq8M.webp");
const IMG_AI = media("solar-ai-dashboard-CDhHz7V3K98CLU6eGvW8PP.webp");
const IMG_OM = media("solar-om-maintenance-7BKbWXXHKbZ3Adwwdk9XvZ.webp");

type SolutionDef = {
  id: string;
  icon: typeof Car;
  titleKey: string;
  featured?: boolean;
  image: string | null;
  taglineKey?: string;
  problemKey: string;
  solutionKey: string;
  suitableKeys: string[];
  benefitKeys: string[];
  link?: string;
};

const solutions: SolutionDef[] = [
  {
    id: "carport", icon: Car, titleKey: "sol.carport.title", featured: true,
    image: IMG_CARPARK, taglineKey: "sol.carport.tagline",
    problemKey: "sol.carport.problem", solutionKey: "sol.carport.solution",
    suitableKeys: ["sol.carport.suitable1", "sol.carport.suitable2", "sol.carport.suitable3", "sol.carport.suitable4"],
    benefitKeys: ["sol.carport.benefit1", "sol.carport.benefit2", "sol.carport.benefit3", "sol.carport.benefit4"],
    link: "/solar-carport",
  },
  {
    id: "rooftop", icon: Sun, titleKey: "sol.rooftop.title",
    image: null,
    problemKey: "sol.rooftop.problem", solutionKey: "sol.rooftop.solution",
    suitableKeys: ["sol.rooftop.suitable1", "sol.rooftop.suitable2", "sol.rooftop.suitable3", "sol.rooftop.suitable4"],
    benefitKeys: ["sol.rooftop.benefit1", "sol.rooftop.benefit2", "sol.rooftop.benefit3", "sol.rooftop.benefit4"],
  },
  {
    id: "floating", icon: Waves, titleKey: "sol.floating.title",
    image: null,
    problemKey: "sol.floating.problem", solutionKey: "sol.floating.solution",
    suitableKeys: ["sol.floating.suitable1", "sol.floating.suitable2", "sol.floating.suitable3", "sol.floating.suitable4"],
    benefitKeys: ["sol.floating.benefit1", "sol.floating.benefit2", "sol.floating.benefit3", "sol.floating.benefit4"],
  },
  {
    id: "bess", icon: Battery, titleKey: "sol.bess.title",
    image: IMG_EV,
    problemKey: "sol.bess.problem", solutionKey: "sol.bess.solution",
    suitableKeys: ["sol.bess.suitable1", "sol.bess.suitable2", "sol.bess.suitable3", "sol.bess.suitable4"],
    benefitKeys: ["sol.bess.benefit1", "sol.bess.benefit2", "sol.bess.benefit3", "sol.bess.benefit4"],
    link: "/bess",
  },
  {
    id: "bess-factory", icon: Factory, titleKey: "sol.bess.factory.title",
    image: null,
    problemKey: "sol.bess.factory.problem", solutionKey: "sol.bess.factory.solution",
    suitableKeys: ["sol.bess.factory.suitable1", "sol.bess.factory.suitable2", "sol.bess.factory.suitable3"],
    benefitKeys: ["sol.bess.factory.benefit1", "sol.bess.factory.benefit2", "sol.bess.factory.benefit3", "sol.bess.factory.benefit4", "sol.bess.factory.benefit5", "sol.bess.factory.benefit6"],
    link: "/bess/factory",
  },
  {
    id: "bess-hotel", icon: Hotel, titleKey: "sol.bess.hotel.title",
    image: null,
    problemKey: "sol.bess.hotel.problem", solutionKey: "sol.bess.hotel.solution",
    suitableKeys: ["sol.bess.hotel.suitable1", "sol.bess.hotel.suitable2", "sol.bess.hotel.suitable3"],
    benefitKeys: ["sol.bess.hotel.benefit1", "sol.bess.hotel.benefit2", "sol.bess.hotel.benefit3", "sol.bess.hotel.benefit4", "sol.bess.hotel.benefit5"],
    link: "/bess/hotel",
  },
  {
    id: "bess-peak-shaving", icon: Zap, titleKey: "sol.bess.peak-shaving.title",
    image: null,
    problemKey: "sol.bess.peak-shaving.problem", solutionKey: "sol.bess.peak-shaving.solution",
    suitableKeys: ["sol.bess.peak-shaving.suitable1", "sol.bess.peak-shaving.suitable2", "sol.bess.peak-shaving.suitable3"],
    benefitKeys: ["sol.bess.peak-shaving.benefit1", "sol.bess.peak-shaving.benefit2", "sol.bess.peak-shaving.benefit3", "sol.bess.peak-shaving.benefit4"],
    link: "/bess/peak-shaving",
  },
  {
    id: "bess-sizing", icon: Ruler, titleKey: "sol.bess.sizing.title",
    image: null,
    problemKey: "sol.bess.sizing.problem", solutionKey: "sol.bess.sizing.solution",
    suitableKeys: ["sol.bess.sizing.suitable1", "sol.bess.sizing.suitable2", "sol.bess.sizing.suitable3"],
    benefitKeys: ["sol.bess.sizing.benefit1", "sol.bess.sizing.benefit2", "sol.bess.sizing.benefit3", "sol.bess.sizing.benefit4"],
    link: "/bess/sizing",
  },
  {
    id: "bess-safety-cost", icon: Shield, titleKey: "sol.bess.safety-cost.title",
    image: null,
    problemKey: "sol.bess.safety-cost.problem", solutionKey: "sol.bess.safety-cost.solution",
    suitableKeys: ["sol.bess.safety-cost.suitable1", "sol.bess.safety-cost.suitable2"],
    benefitKeys: ["sol.bess.safety-cost.benefit1", "sol.bess.safety-cost.benefit2", "sol.bess.safety-cost.benefit3", "sol.bess.safety-cost.benefit4", "sol.bess.safety-cost.benefit5"],
    link: "/bess/safety-cost",
  },
  {
    id: "ai-energy", icon: Brain, titleKey: "sol.ai.title",
    image: IMG_AI,
    problemKey: "sol.ai.problem", solutionKey: "sol.ai.solution",
    suitableKeys: ["sol.ai.suitable1", "sol.ai.suitable2", "sol.ai.suitable3", "sol.ai.suitable4"],
    benefitKeys: ["sol.ai.benefit1", "sol.ai.benefit2", "sol.ai.benefit3", "sol.ai.benefit4"],
  },
  {
    id: "ai-om", icon: Wrench, titleKey: "sol.om.title",
    image: IMG_OM,
    problemKey: "sol.om.problem", solutionKey: "sol.om.solution",
    suitableKeys: ["sol.om.suitable1", "sol.om.suitable2", "sol.om.suitable3", "sol.om.suitable4"],
    benefitKeys: ["sol.om.benefit1", "sol.om.benefit2", "sol.om.benefit3", "sol.om.benefit4"],
  },
  {
    id: "financing", icon: Handshake, titleKey: "sol.financing.title",
    image: null,
    problemKey: "sol.financing.problem", solutionKey: "sol.financing.solution",
    suitableKeys: ["sol.financing.suitable1", "sol.financing.suitable2", "sol.financing.suitable3", "sol.financing.suitable4"],
    benefitKeys: ["sol.financing.benefit1", "sol.financing.benefit2", "sol.financing.benefit3", "sol.financing.benefit4"],
  },
];
import { media } from "@/lib/media";

export default function Solutions() {
  const { t } = usePageTranslation("solutions");

  useEffect(() => {
    trackSolutionVisit("solar-carport");
    const hash = window.location.hash.replace("#", "");
    const categoryMap: Record<string, string> = {
      carport: "solar-carport", rooftop: "rooftop-solar", floating: "floating-solar",
      bess: "bess", "bess-factory": "bess/factory", "bess-hotel": "bess/hotel",
      "bess-peak-shaving": "bess/peak-shaving", "bess-sizing": "bess/sizing",
      "bess-safety-cost": "bess/safety-cost", "ai-energy": "ai-energy",
    };
    if (hash && categoryMap[hash]) {
      trackSolutionVisit(categoryMap[hash] as SolutionCategory);
    }
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
            alt="SIRINX Solutions"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        </div>
        <div className="container relative z-10 pt-20">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-2xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">{t("sol.hero.tag")}</span>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-3">
              {t("sol.hero.title1")}<span className="text-gradient-accent">{t("sol.hero.title2")}</span>
            </h1>
            <p className="text-text-secondary">{t("sol.hero.desc")}</p>
          </motion.div>
        </div>
      </section>

      {/* ===== SOLUTION SECTIONS ===== */}
      {solutions.map((sol, idx) => (
        <section
          key={sol.id}
          id={sol.id}
          className={`py-16 lg:py-20 ${idx % 2 === 0 ? "bg-background" : "section-alt"} ${sol.featured ? "border-t-2 border-accent-primary/30" : ""}`}
        >
          <div className="container">
            {sol.featured && sol.taglineKey && (
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-accent-primary bg-accent-glow border border-border-accent rounded-full">
                  <Zap className="w-3 h-3" /> {t(sol.taglineKey)}
                </span>
              </motion.div>
            )}

            <div className={`grid ${sol.image ? "lg:grid-cols-2" : "lg:grid-cols-[1fr_400px]"} gap-10 lg:gap-14 items-start`}>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-lg ${sol.featured ? "bg-accent-primary/20" : "bg-accent-glow"} flex items-center justify-center`}>
                    <sol.icon className="w-5 h-5 text-accent-primary" />
                  </div>
                  <h2 className={`font-display ${sol.featured ? "text-2xl lg:text-3xl" : "text-xl lg:text-2xl"} font-bold text-foreground`}>
                    {t(sol.titleKey)}
                  </h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-xs font-medium text-accent-secondary uppercase tracking-wider mb-1.5">{t("sol.label.problem")}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{t(sol.problemKey)}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-accent-primary uppercase tracking-wider mb-1.5">{t("sol.label.solution")}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{t(sol.solutionKey)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {sol.benefitKeys.map((bk) => (
                    <div key={bk} className="flex items-start gap-2 text-xs text-text-secondary">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0 mt-0.5" />
                      {t(bk)}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  {sol.link ? (
                    <Link href={sol.link} className="inline-flex items-center gap-2 px-5 py-2.5 font-display font-semibold btn-accent rounded-lg text-sm">
                      {t("sol.cta.details")} {t(sol.titleKey)} <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 font-display font-semibold btn-accent rounded-lg text-sm">
                      {t("sol.cta.consult")} {t(sol.titleKey)} <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
                {sol.id === "bess" ? (
                  <Suspense
                    fallback={
                      <div
                        className="mb-5 h-[420px] rounded-2xl border border-border-subtle bg-surface-elevated animate-pulse"
                        aria-hidden="true"
                      />
                    }
                  >
                    <div className="mb-5">
                      <BESSContainerProduct3D labelTh={t(sol.titleKey)} />
                    </div>
                  </Suspense>
                ) : sol.id.startsWith("bess-") ? (
                  <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                    <h3 className="font-display font-semibold text-foreground text-sm mb-3">{t(sol.titleKey)}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{t(sol.problemKey)}</p>
                    <ul className="space-y-2">
                      {sol.suitableKeys.map((sk) => (
                        <li key={sk} className="flex items-start gap-2 text-xs text-text-secondary">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                          {t(sk)}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      <Link href={sol.link ?? "/bess"} className="inline-flex items-center gap-2 px-4 py-2 font-display font-medium btn-accent rounded-lg text-sm">
                        {t("sol.cta.details")} <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : sol.image ? (
                  <img
                    src={cfImage(sol.image, 960)}
                    srcSet={cfImageSrcSet(sol.image, [480, 720, 960, 1280])}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    alt={t(sol.titleKey)}
                    className="rounded-xl w-full aspect-[16/10] object-cover mb-5"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                  <h3 className="font-display font-semibold text-foreground text-sm mb-3">{t("sol.label.suitable")}</h3>
                  <ul className="space-y-2">
                    {sol.suitableKeys.map((sk) => (
                      <li key={sk} className="flex items-start gap-2 text-xs text-text-secondary">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-secondary shrink-0 mt-0.5" />
                        {t(sk)}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* ===== BESS FAQ — the same strings feed the route FAQPage schema ===== */}
      <section id="bess-faq" className="py-16 lg:py-20 bg-background">
        <div className="container max-w-3xl">
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

      {/* ===== BOTTOM CTA ===== */}
      <section className="py-16 lg:py-24 section-alt relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow to-transparent" />
        <div className="container relative text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">{t("sol.bottomCta.title")}</h2>
            <p className="text-text-secondary text-sm mb-7 max-w-lg mx-auto">{t("sol.bottomCta.desc")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg">
                {t("sol.bottomCta.btn1")} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/assessment" className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent-outline rounded-lg">
                {t("sol.bottomCta.btn2")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
