/**
 * SIRINX About — trust-first company profile.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { trackSolutionVisit } from "@/components/HeroSlideshow";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/about";
import { lineOfficialConfig } from "@shared/lineOfficial";
import {
  ArrowRight,
  Target,
  Eye,
  Cpu,
  Users,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Car,
  MessageCircle,
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
const LOGO_URL = `${CDN}/photo_2026-03-24_06-45-58_293d121c.jpg`;
const HERO = `${CDN}/hero-about-3Trik9L6DrdCwCcjCt2KVz.webp`;

const valueItems = [
  { icon: Cpu, title: "about.value.engineering.title", desc: "about.value.engineering.desc" },
  { icon: ShieldCheck, title: "about.value.trust.title", desc: "about.value.trust.desc" },
  { icon: Target, title: "about.value.result.title", desc: "about.value.result.desc" },
  { icon: Users, title: "about.value.partner.title", desc: "about.value.partner.desc" },
] as const;

const milestoneItems = [
  { year: "2023", event: "about.milestone.2023" },
  { year: "2024", event: "about.milestone.2024" },
  { year: "2025", event: "about.milestone.2025a" },
  { year: "2025", event: "about.milestone.2025b" },
  { year: "2026", event: "about.milestone.2026" },
] as const;

const processSteps = [
  "about.process.step1",
  "about.process.step2",
  "about.process.step3",
  "about.process.step4",
  "about.process.step5",
  "about.process.step6",
] as const;

export default function About() {
  const { t } = usePageTranslation("about");

  useEffect(() => {
    trackSolutionVisit("solar-carport");
  }, []);

  return (
    <div>
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={cfImage(HERO, 1280, { quality: 76 })}
            srcSet={cfImageSrcSet(HERO, [640, 960, 1280, 1600], {
              quality: 76,
            })}
            sizes="100vw"
            alt={t("about.hero.imageAlt")}
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
              {t("about.hero.eyebrow")}
            </span>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-3">
              {t("about.hero.title")}
              <br />
              <span className="text-gradient-accent">{t("about.hero.accent")}</span>
            </h1>
            <p className="text-text-secondary leading-relaxed">
              {t("about.hero.desc")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-14 lg:py-20 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <div className="flex items-center gap-3 mb-3">
                <Eye className="w-5 h-5 text-accent-primary" />
                <h2 className="font-display text-xl font-bold text-foreground">
                  {t("about.vision.title")}
                </h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t("about.vision.desc")}
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-accent-secondary" />
                <h2 className="font-display text-xl font-bold text-foreground">
                  {t("about.mission.title")}
                </h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t("about.mission.desc")}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

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
              {t("about.values.eyebrow")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              {t("about.values.title")}
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {valueItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-5 rounded-xl border border-border-subtle hover:border-border-accent transition-colors bg-surface-elevated"
              >
                <item.icon className="w-6 h-6 text-accent-primary mb-3" />
                <h3 className="font-display font-semibold text-foreground text-sm mb-1.5">
                  {t(item.title)}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {t(item.desc)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-2xl mx-auto text-center mb-8"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("about.process.eyebrow")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("about.process.title")}
            </h2>
            <p className="text-sm text-text-secondary">
              {t("about.process.desc")}
            </p>
          </motion.div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {processSteps.map((step, i) => (
              <motion.div
                key={step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center p-3 rounded-xl bg-accent-glow border border-border-accent"
              >
                <div className="font-display text-xl font-bold text-accent-primary/30 mb-0.5">
                  0{i + 1}
                </div>
                <div className="text-xs font-medium text-foreground">
                  {t(step)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
              {t("about.milestones.eyebrow")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              {t("about.milestones.title")}
            </h2>
          </motion.div>
          <div className="relative">
            <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent-primary/50 via-accent-primary/20 to-transparent" />
            <div className="space-y-6">
              {milestoneItems.map((item, i) => (
                <motion.div
                  key={`${item.year}-${i}`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className={`relative flex items-start gap-6 ${
                    i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  <div className="hidden lg:block lg:w-1/2" />
                  <div className="absolute left-4 lg:left-1/2 w-3 h-3 rounded-full bg-accent-primary -translate-x-1.5 mt-2 ring-4 ring-background" />
                  <div className="ml-10 lg:ml-0 lg:w-1/2 p-4 rounded-xl border border-border-subtle bg-surface-elevated">
                    <span className="font-display font-bold text-accent-primary text-xs">
                      {item.year}
                    </span>
                    <p className="text-sm text-text-secondary mt-1">
                      {t(item.event)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="flex flex-col items-center text-center lg:text-left lg:items-start"
            >
              <img
                src={cfImage(LOGO_URL, 240)}
                srcSet={cfImageSrcSet(LOGO_URL, [160, 240, 320])}
                sizes="112px"
                alt={t("about.ceo.imageAlt")}
                className="w-28 h-28 rounded-full ring-4 ring-brand/30 shadow-2xl mb-5 object-cover"
                loading="lazy"
                decoding="async"
              />
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                Pitoon Yingyosruangrong
              </h2>
              <p className="text-accent-primary font-medium text-sm mb-3">
                CEO & Founder - SIRINX Co., Ltd.
              </p>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                {t("about.ceo.desc")}
              </p>
              <div className="space-y-1.5 text-xs text-text-muted">
                <a
                  href="tel:+66819723969"
                  className="flex items-center gap-2 hover:text-accent-primary transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> +66 81 972 3969
                </a>
                <a
                  href="mailto:pitoon.sirinx@gmail.com"
                  className="flex items-center gap-2 hover:text-accent-primary transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> pitoon.sirinx@gmail.com
                </a>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5" />
                  <span>600/99 Midtrapab Rd., Mueang Phitsanulok 65000</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="space-y-4"
            >
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">
                  Solar Farm Node 1
                </h3>
                <p className="text-accent-primary text-xs font-medium mb-1">
                  {t("about.project.node1.name")}
                </p>
                <p className="text-xs text-text-muted">
                  {t("about.project.node1.desc")}
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border-accent bg-accent-glow">
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">
                  Solar Farm Node 2
                </h3>
                <p className="text-accent-primary text-xs font-medium mb-1">
                  {t("about.project.node2.name")}
                </p>
                <p className="text-xs text-text-muted">
                  {t("about.project.node2.desc")}
                </p>
              </div>
              <div className="p-5 rounded-xl glass-card">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-accent-primary" />
                  <h3 className="font-display font-semibold text-foreground text-sm">
                    Solar Carport - Flagship 2025
                  </h3>
                </div>
                <p className="text-xs text-text-muted">
                  {t("about.project.carport.desc")}
                </p>
                <Link
                  href="/solar-carport"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-accent-primary hover:underline"
                >
                  {t("about.project.carport.cta")} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
              {t("about.cta.title")}
            </h2>
            <p className="text-text-secondary text-sm mb-7 max-w-lg mx-auto">
              {t("about.cta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg"
              >
                {t("about.cta.contact")} <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={lineOfficialConfig.addFriendUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold rounded-lg bg-[#00C300] text-white hover:bg-[#00B300] transition-colors"
                aria-label={t("about.cta.lineAria")}
              >
                <MessageCircle className="w-4 h-4" /> {t("about.cta.line")}
              </a>
              <a
                href="tel:+66819723969"
                className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent-outline rounded-lg"
              >
                <Phone className="w-4 h-4" /> {t("about.cta.phone")}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
