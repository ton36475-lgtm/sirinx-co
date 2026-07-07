/**
 * SIRINX Industries — Full i18n Integration
 * Solar Carport callout per industry, tighter layout, mid-page CTA
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { trackSolutionVisit } from "@/components/HeroSlideshow";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/industries";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import {
  ArrowRight, Factory, Wheat, Hotel, GraduationCap, Building2, Landmark,
  CheckCircle2, Car
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv";
const HERO = `${CDN}/sirinx-agrivoltaic-b6XSpaadLj5vpaTu52tenb.webp`;

type IndustryDef = {
  id: string;
  icon: typeof Factory;
  titleKey: string;
  challengeKey: string;
  useCaseKeys: string[];
  outcomeKey: string;
  carportKey: string | null;
};

const industries: IndustryDef[] = [
  {
    id: "manufacturing", icon: Factory, titleKey: "ind.manufacturing.title",
    challengeKey: "ind.manufacturing.challenge",
    useCaseKeys: ["ind.manufacturing.uc1", "ind.manufacturing.uc2", "ind.manufacturing.uc3", "ind.manufacturing.uc4"],
    outcomeKey: "ind.manufacturing.outcome",
    carportKey: "ind.manufacturing.carport",
  },
  {
    id: "agriculture", icon: Wheat, titleKey: "ind.agriculture.title",
    challengeKey: "ind.agriculture.challenge",
    useCaseKeys: ["ind.agriculture.uc1", "ind.agriculture.uc2", "ind.agriculture.uc3", "ind.agriculture.uc4"],
    outcomeKey: "ind.agriculture.outcome",
    carportKey: null,
  },
  {
    id: "hospitality", icon: Hotel, titleKey: "ind.hospitality.title",
    challengeKey: "ind.hospitality.challenge",
    useCaseKeys: ["ind.hospitality.uc1", "ind.hospitality.uc2", "ind.hospitality.uc3", "ind.hospitality.uc4"],
    outcomeKey: "ind.hospitality.outcome",
    carportKey: "ind.hospitality.carport",
  },
  {
    id: "education", icon: GraduationCap, titleKey: "ind.education.title",
    challengeKey: "ind.education.challenge",
    useCaseKeys: ["ind.education.uc1", "ind.education.uc2", "ind.education.uc3", "ind.education.uc4"],
    outcomeKey: "ind.education.outcome",
    carportKey: "ind.education.carport",
  },
  {
    id: "commercial", icon: Building2, titleKey: "ind.commercial.title",
    challengeKey: "ind.commercial.challenge",
    useCaseKeys: ["ind.commercial.uc1", "ind.commercial.uc2", "ind.commercial.uc3", "ind.commercial.uc4"],
    outcomeKey: "ind.commercial.outcome",
    carportKey: "ind.commercial.carport",
  },
  {
    id: "government", icon: Landmark, titleKey: "ind.government.title",
    challengeKey: "ind.government.challenge",
    useCaseKeys: ["ind.government.uc1", "ind.government.uc2", "ind.government.uc3", "ind.government.uc4"],
    outcomeKey: "ind.government.outcome",
    carportKey: "ind.government.carport",
  },
];

export default function Industries() {
  const { t } = usePageTranslation("industries");

  useEffect(() => {
    trackSolutionVisit("solar-carport");
    const hash = window.location.hash.replace("#", "");
    if (hash === "hospitality") trackSolutionVisit("hospitality");
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
            alt="SIRINX Industries"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        </div>
        <div className="container relative z-10 pt-20">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-2xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">{t("ind.hero.tag")}</span>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-3">
              {t("ind.hero.title1")}<br /><span className="text-gradient-accent">{t("ind.hero.title2")}</span>
            </h1>
            <p className="text-text-secondary">{t("ind.hero.desc")}</p>
          </motion.div>
        </div>
      </section>

      {/* ===== INDUSTRY SECTIONS ===== */}
      {industries.map((ind, idx) => (
        <section key={ind.id} id={ind.id} className={`py-14 lg:py-20 ${idx % 2 === 0 ? "bg-background" : "section-alt"}`}>
          <div className="container">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Left: Info */}
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-accent-glow flex items-center justify-center">
                      <ind.icon className="w-5 h-5 text-accent-primary" />
                    </div>
                    <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground">{t(ind.titleKey)}</h2>
                  </div>
                  <div className="mb-5">
                    <h3 className="text-xs font-medium text-accent-secondary uppercase tracking-wider mb-1.5">{t("ind.label.challenge")}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{t(ind.challengeKey)}</p>
                  </div>
                  <div className="mb-5">
                    <h3 className="text-xs font-medium text-accent-primary uppercase tracking-wider mb-2">{t("ind.label.useCases")}</h3>
                    <ul className="space-y-2">
                      {ind.useCaseKeys.map((ucKey) => (
                        <li key={ucKey} className="flex items-start gap-2 text-xs text-text-secondary">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0 mt-0.5" />
                          {t(ucKey)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Solar Carport callout */}
                  {ind.carportKey && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-accent-glow border border-border-accent">
                      <Car className="w-4 h-4 text-accent-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-accent-primary">Solar Carport:</span>
                        <span className="text-xs text-text-secondary ml-1">{t(ind.carportKey)}</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Right: Outcome card */}
                <div className="lg:col-span-2 flex items-start">
                  <div className="w-full p-5 rounded-xl glass-card">
                    <h3 className="font-display font-semibold text-foreground text-sm mb-2">{t("ind.label.expectedOutcome")}</h3>
                    <p className="text-base font-medium text-gradient-accent mb-4">{t(ind.outcomeKey)}</p>
                    <div className="space-y-2">
                      <Link href="/contact" className="inline-flex items-center gap-2 text-xs font-medium text-accent-primary hover:underline">
                        {t("ind.label.consult")} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <br />
                      <Link href="/solar-carport" className="inline-flex items-center gap-2 text-xs font-medium text-text-muted hover:text-accent-primary">
                        <Car className="w-3.5 h-3.5" /> {t("ind.label.viewCarport")}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      ))}

      {/* ===== MID-PAGE CTA ===== */}
      <section className="py-10 bg-background">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="glass-card rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-5"
          >
            <div className="flex-1">
              <h3 className="font-display text-base lg:text-lg font-bold text-foreground mb-1">
                {t("ind.midCta.title")}
              </h3>
              <p className="text-text-secondary text-xs">{t("ind.midCta.desc")}</p>
            </div>
            <Link href="/solar-carport" className="inline-flex items-center gap-2 px-5 py-2.5 font-display font-semibold btn-accent rounded-lg text-sm whitespace-nowrap shrink-0">
              <Car className="w-4 h-4" /> {t("ind.midCta.btn")} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="py-16 lg:py-24 section-alt relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow to-transparent" />
        <div className="container relative text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">{t("ind.bottomCta.title")}</h2>
            <p className="text-text-secondary text-sm mb-7 max-w-lg mx-auto">{t("ind.bottomCta.desc")}</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg">
              {t("ind.bottomCta.btn")} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
