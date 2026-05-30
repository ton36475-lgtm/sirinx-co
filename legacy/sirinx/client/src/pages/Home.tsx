/**
 * SIRINX Home Page — Solar Carpark Flagship
 * Fully i18n-enabled via usePageTranslation("home")
 */
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "@/lib/static-motion";
import { Link } from "wouter";
import {
  Car,
  Sun,
  Battery,
  Brain,
  Wrench,
  Waves,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
  BarChart3,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Factory,
  Hotel,
  Building2,
  GraduationCap,
  BatteryCharging,
  Cpu,
  Plug,
} from "lucide-react";
import HeroSlideshow from "@/components/HeroSlideshow";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/home";

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

const HERO_CARPARK = "/assets/optimized/solar-carport-hero.jpg";
const IMG_EV = "/assets/optimized/solar-carport-ev.jpg";
const IMG_OM = `${CDN}/install-team-2_23aa9cdf.jpeg`;
const IMG_AI = `${CDN}/solar-ai-dashboard-CDhHz7V3K98CLU6eGvW8PP.webp`;
const IMG_INVESTMENT = `${CDN}/hero-investment-fRtcNVseiLRqovGxudgo83.webp`;
const LOGO_URL = "/assets/optimized/sirinx-logo.jpg";
// Real photos from Royal Park Solar Carport installation
const IMG_NODE1 = `${CDN}/carport-wide-1_30e3af4c.jpeg`;
const IMG_NODE2 = `${CDN}/bess-cabinet-2_54c824b8.jpeg`;
const IMG_CARPORT_TEAM = `${CDN}/install-team-1_91970553.jpeg`;
const IMG_CARPORT_UNDER = `${CDN}/carport-underside-2_e70e97e1.jpeg`;

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { t } = usePageTranslation("home");

  /* ── FAQ Data (translated) ── */
  const faqs = [
    { q: t("home.faq.q1"), a: t("home.faq.a1") },
    { q: t("home.faq.q2"), a: t("home.faq.a2") },
    { q: t("home.faq.q3"), a: t("home.faq.a3") },
    { q: t("home.faq.q4"), a: t("home.faq.a4") },
    { q: t("home.faq.q5"), a: t("home.faq.a5") },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <div>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      {/* ══════════════════════════════════════════════
          1. HERO — Multi-Product Slideshow with Personalization
      ══════════════════════════════════════════════ */}
      <HeroSlideshow />

      {/* ══════════════════════════════════════════════
          2. SOCIAL PROOF STRIP — Above the fold metrics
      ══════════════════════════════════════════════ */}
      <section className="py-10 lg:py-12 section-alt relative">
        <div className="divider-accent absolute top-0 left-0 right-0" />
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                value: "30-100%",
                label: t("home.stat.reduceBill"),
                icon: TrendingUp,
              },
              {
                value: t("home.stat.paybackVal"),
                label: t("home.stat.payback"),
                icon: Clock,
              },
              {
                value: t("home.stat.lifespanVal"),
                label: t("home.stat.lifespan"),
                icon: Shield,
              },
              { value: "99.5%", label: "System Uptime", icon: BarChart3 },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <item.icon className="w-5 h-5 text-accent-primary mx-auto mb-2" />
                <div className="font-display text-2xl lg:text-3xl font-bold text-gradient-accent mb-0.5">
                  {item.value}
                </div>
                <div className="text-xs text-text-muted">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          3. SOLAR CARPORT SPOTLIGHT — Why it's the flagship
      ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
                {t("home.flagship.tag")}
              </span>
              <h2 className="font-display text-2xl lg:text-4xl font-bold text-foreground mb-4 whitespace-pre-line">
                {t("home.flagship.title")}
              </h2>
              <p className="text-text-secondary leading-relaxed mb-6">
                {t("home.flagship.desc")}
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  t("home.flagship.benefit1"),
                  t("home.flagship.benefit2"),
                  t("home.flagship.benefit3"),
                  t("home.flagship.benefit4"),
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-text-secondary"
                  >
                    <CheckCircle2 className="w-4 h-4 text-accent-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/solar-carport"
                className="inline-flex items-center gap-2 px-5 py-2.5 font-display font-semibold btn-accent rounded-lg text-sm"
              >
                {t("home.flagship.cta")} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="relative"
            >
              <img
                src={IMG_EV}
                alt="Solar Carport + EV Charging Station"
                width={900}
                height={502}
                className="rounded-2xl w-full aspect-[16/10] object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 rounded-2xl border border-border-accent" />
              {/* Floating stat card */}
              <div className="absolute -bottom-4 -right-2 lg:-right-6 bg-surface-elevated border border-border-accent rounded-xl p-4 shadow-lg">
                <div className="font-display text-xl font-bold text-gradient-accent">
                  {t("home.stat.paybackVal")}
                </div>
                <div className="text-xs text-text-muted">
                  {t("home.flagship.payback")}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          4. INTEGRATION ECOSYSTEM — Carport + BESS + AI + EV
      ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 section-alt">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("home.integration.tag")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("home.integration.title")}
            </h2>
            <p className="text-text-secondary text-sm">
              {t("home.integration.desc")}
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Car,
                title: "Solar Carport",
                desc: t("home.integration.carport.desc"),
                color: "text-accent-primary",
              },
              {
                icon: BatteryCharging,
                title: "BESS / ESS",
                desc: t("home.integration.bess.desc"),
                color: "text-accent-secondary",
              },
              {
                icon: Cpu,
                title: "AI Energy Management",
                desc: t("home.integration.ai.desc"),
                color: "text-accent-primary",
              },
              {
                icon: Plug,
                title: "EV Charging",
                desc: t("home.integration.ev.desc"),
                color: "text-accent-secondary",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-5 rounded-xl border border-border-subtle bg-surface-elevated hover:border-border-accent transition-colors"
              >
                <item.icon className={`w-8 h-8 ${item.color} mb-3`} />
                <h3 className="font-display font-semibold text-foreground mb-1.5 text-sm">
                  {item.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          5. MID-PAGE CTA — Solar Carport specific
      ══════════════════════════════════════════════ */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="glass-card rounded-2xl p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-10"
          >
            <div className="flex-1">
              <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-2">
                {t("home.midCta.title")}
              </h3>
              <p className="text-text-secondary text-sm">
                {t("home.midCta.desc")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 font-display font-semibold btn-accent rounded-lg text-sm whitespace-nowrap"
              >
                {t("home.midCta.survey")} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 font-display font-semibold btn-accent-outline rounded-lg text-sm whitespace-nowrap"
              >
                {t("home.midCta.assess")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          6. ALL SOLUTIONS — Solar Carport first
      ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 section-alt">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-2xl mb-12"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("home.solutions.tag")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("home.solutions.title")}
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              {t("home.solutions.desc")}
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Car,
                title: "Solar Carport",
                desc: t("home.sol.carport.desc"),
                href: "/solar-carport",
                featured: true,
              },
              {
                icon: Sun,
                title: "Rooftop Solar",
                desc: t("home.sol.rooftop.desc"),
                href: "/solutions#rooftop",
                featured: false,
              },
              {
                icon: Waves,
                title: "Floating Solar",
                desc: t("home.sol.floating.desc"),
                href: "/solutions#floating",
                featured: false,
              },
              {
                icon: Battery,
                title: "BESS / ESS",
                desc: t("home.sol.bess.desc"),
                href: "/solutions#bess",
                featured: false,
              },
              {
                icon: Brain,
                title: "AI Energy Management",
                desc: t("home.sol.ai.desc"),
                href: "/solutions#ai-energy",
                featured: false,
              },
              {
                icon: Wrench,
                title: t("home.sol.om.title"),
                desc: t("home.sol.om.desc"),
                href: "/solutions#ai-om",
                featured: false,
              },
            ].map((sol, i) => (
              <motion.div
                key={sol.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Link
                  href={sol.href}
                  className={`group block p-5 rounded-xl transition-all duration-300 h-full ${
                    sol.featured
                      ? "glass-card border-accent-primary/40 ring-1 ring-accent-primary/20"
                      : "glass-card hover:border-accent-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        sol.featured ? "bg-accent-primary/20" : "bg-accent-glow"
                      }`}
                    >
                      <sol.icon
                        className={`w-4.5 h-4.5 ${sol.featured ? "text-accent-primary" : "text-accent-primary"}`}
                      />
                    </div>
                    {sol.featured && (
                      <span className="px-2 py-0.5 text-[10px] font-medium text-accent-primary bg-accent-glow rounded-full">
                        Flagship
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1.5 text-sm group-hover:text-accent-primary transition-colors">
                    {sol.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {sol.desc}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          7. PROCESS — How we work
      ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("home.process.tag")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("home.process.title")}
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: "01",
                title: t("home.process.step1.title"),
                desc: t("home.process.step1.desc"),
              },
              {
                step: "02",
                title: t("home.process.step2.title"),
                desc: t("home.process.step2.desc"),
              },
              {
                step: "03",
                title: t("home.process.step3.title"),
                desc: t("home.process.step3.desc"),
              },
              {
                step: "04",
                title: t("home.process.step4.title"),
                desc: t("home.process.step4.desc"),
              },
            ].map((step, i) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative p-5 rounded-xl border border-border-subtle hover:border-border-accent transition-colors bg-surface-elevated"
              >
                <span className="font-display text-4xl font-bold text-accent-primary/10 absolute top-3 right-4">
                  {step.step}
                </span>
                <div className="relative">
                  <h3 className="font-display font-semibold text-foreground mb-1.5 text-sm">
                    {step.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          8. INDUSTRIES — Who benefits from Solar Carport
      ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 section-alt">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-2xl mb-12"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("home.industries.tag")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("home.industries.title")}
            </h2>
            <p className="text-text-secondary text-sm">
              {t("home.industries.desc")}
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Factory,
                title: t("home.ind.factory.title"),
                desc: t("home.ind.factory.desc"),
              },
              {
                icon: Hotel,
                title: t("home.ind.hotel.title"),
                desc: t("home.ind.hotel.desc"),
              },
              {
                icon: Building2,
                title: t("home.ind.commercial.title"),
                desc: t("home.ind.commercial.desc"),
              },
              {
                icon: GraduationCap,
                title: t("home.ind.education.title"),
                desc: t("home.ind.education.desc"),
              },
            ].map((ind, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Link
                  href="/industries"
                  className="group block p-5 rounded-xl border border-border-subtle hover:border-border-accent hover:bg-accent-glow/50 transition-all h-full"
                >
                  <ind.icon className="w-7 h-7 text-accent-secondary mb-3" />
                  <h3 className="font-display font-semibold text-foreground mb-1 text-sm group-hover:text-accent-primary transition-colors">
                    {ind.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {ind.desc}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/industries"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline"
            >
              {t("home.industries.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          9. REAL PROJECTS — Proof of execution
      ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-10"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("home.projects.tag")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              {t("home.projects.title")}
            </h2>
            <p className="text-text-secondary mt-2 max-w-xl mx-auto text-sm">
              {t("home.projects.desc")}
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Node 1 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="group rounded-2xl overflow-hidden border border-border-subtle hover:border-border-accent transition-all"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={IMG_NODE1}
                  alt="Solar Farm Node 1 — Rueanpae Royal Park"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-accent-primary text-text-inverse rounded-md">
                    Node 1
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-800 text-white rounded-md">
                    {t("home.projects.completed")}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display text-base font-bold text-white">
                    {t("home.projects.node1.name")}
                  </h3>
                  <p className="text-xs text-white/80">
                    {t("home.projects.node1.location")}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-surface-elevated">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs font-bold text-gradient-accent">
                      Solar + BESS
                    </div>
                    <div className="text-[9px] text-text-muted">
                      {t("home.projects.node1.system")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gradient-accent">
                      ตามไซต์
                    </div>
                    <div className="text-[9px] text-text-muted">
                      {t("home.projects.node1.reduceBill")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gradient-accent">
                      AI EMS
                    </div>
                    <div className="text-[9px] text-text-muted">
                      {t("home.projects.node1.energyMgmt")}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Node 2 */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="group rounded-2xl overflow-hidden border border-border-subtle hover:border-border-accent transition-all"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={IMG_NODE2}
                  alt="Solar Farm Node 2 — Holatel Rim Nan"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-accent-primary text-text-inverse rounded-md">
                    Node 2
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-300 text-slate-950 rounded-md">
                    {t("home.projects.underConstruction")}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display text-base font-bold text-white">
                    {t("home.projects.node2.name")}
                  </h3>
                  <p className="text-xs text-white/80">
                    {t("home.projects.node2.location")}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-surface-elevated">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs font-bold text-gradient-accent">
                      Smart Hotel
                    </div>
                    <div className="text-[9px] text-text-muted">
                      {t("home.projects.node2.smartHotel")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gradient-accent">
                      Net Zero
                    </div>
                    <div className="text-[9px] text-text-muted">
                      {t("home.projects.node2.target")}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gradient-accent">
                      2026
                    </div>
                    <div className="text-[9px] text-text-muted">
                      {t("home.projects.node2.opening")}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline"
            >
              {t("home.projects.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          10. O&M + AI MONITORING — Visual proof
      ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 section-alt">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="order-2 lg:order-1"
            >
              <img
                src={IMG_OM}
                alt="SIRINX O&M — AI Monitoring"
                className="rounded-2xl w-full aspect-[16/10] object-cover"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="order-1 lg:order-2"
            >
              <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
                {t("home.om.tag")}
              </span>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4 whitespace-pre-line">
                {t("home.om.title")}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-5">
                {t("home.om.desc")}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: t("home.om.monitoring"), value: "24/7" },
                  {
                    label: t("home.om.response"),
                    value: t("home.om.responseVal"),
                  },
                  { label: t("home.om.drone"), value: t("home.om.droneVal") },
                  { label: t("home.om.report"), value: t("home.om.reportVal") },
                ].map(item => (
                  <div
                    key={item.label}
                    className="p-3 rounded-lg border border-border-subtle bg-surface-elevated"
                  >
                    <div className="text-sm font-bold text-gradient-accent">
                      {item.value}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/solutions#ai-om"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline"
              >
                {t("home.om.viewAll")} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          11. INVESTMENT TEASER — Financing options
      ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
                {t("home.invest.tag")}
              </span>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4 whitespace-pre-line">
                {t("home.invest.title")}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-5">
                {t("home.invest.desc")}
              </p>
              <ul className="space-y-2.5 mb-6">
                {[
                  t("home.invest.option1"),
                  t("home.invest.option2"),
                  t("home.invest.option3"),
                  t("home.invest.option4"),
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2.5 text-sm text-text-secondary"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/investment"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline"
              >
                {t("home.invest.viewMore")} <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="relative"
            >
              <img
                src={IMG_INVESTMENT}
                alt="Solar Carport Investment — ROI Analysis"
                className="rounded-2xl w-full aspect-[16/10] object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 rounded-2xl border border-border-accent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          12. CEO TESTIMONIAL — Trust
      ══════════════════════════════════════════════ */}
      <section className="py-12 lg:py-16 section-alt relative">
        <div className="divider-accent absolute top-0 left-0 right-0" />
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-3xl mx-auto glass-card rounded-2xl p-8 lg:p-10 text-center"
          >
            <div className="flex justify-center mb-5">
              <img
                src={LOGO_URL}
                alt="SIRINX"
                width={56}
                height={56}
                className="w-14 h-14 rounded-full ring-2 ring-brand/30"
                loading="lazy"
                decoding="async"
              />
            </div>
            <p className="text-base lg:text-lg text-text-secondary italic leading-relaxed mb-5">
              "{t("home.ceo.quote")}"
            </p>
            <div>
              <div className="font-display font-semibold text-foreground text-sm">
                Pitoon Yingyosruangrong
              </div>
              <div className="text-xs text-text-muted">
                CEO & Founder — SIRINX Co., Ltd.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          13. FAQ / AEO — Solar Carport specific
      ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-10"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("home.faq.tag")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              {t("home.faq.title")}
            </h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-border-subtle bg-surface-elevated overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 lg:p-5 text-left"
                >
                  <span className="font-display font-semibold text-foreground text-sm pr-4">
                    {faq.q}
                  </span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-accent-primary shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 lg:px-5 pb-4 lg:pb-5">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          14. FINAL CTA — Solar Carport specific
      ══════════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 section-alt relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow to-transparent" />
        <div className="divider-accent absolute top-0 left-0 right-0" />
        <div className="container relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-2xl lg:text-4xl font-bold text-foreground mb-3">
              {t("home.finalCta.title")}
            </h2>
            <p className="text-sm lg:text-base text-text-secondary mb-7 max-w-lg mx-auto">
              {t("home.finalCta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-display font-semibold btn-accent rounded-lg"
              >
                {t("home.finalCta.quote")} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-display font-semibold btn-accent-outline rounded-lg"
              >
                {t("home.finalCta.assess")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
