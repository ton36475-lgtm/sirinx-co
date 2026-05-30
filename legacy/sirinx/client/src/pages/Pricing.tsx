/**
 * SIRINX Pricing Page — Solar Carport Package Pricing
 * Start / Pro / Enterprise tiers
 * Highlights: EV readiness, government incentives, ROI, tax benefits
 * Full i18n support via usePageTranslation
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import {
  Car, Zap, Sun, TrendingUp, Clock,
  CheckCircle2, ArrowRight, Calculator,
  Leaf, BatteryCharging, BadgePercent,
  ChevronDown, ChevronUp, Sparkles,
  Download, Play, FileImage, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePageTranslation } from "@/i18n";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import "@/i18n/pages/pricing";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

/* ─── Package Static Config (non-translatable parts) ─── */
const packageConfigs = [
  {
    id: "start",
    name: "Start",
    capacity: "10 – 30 kWp",
    color: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
    accentColor: "text-emerald-500",
    bgAccent: "bg-emerald-500/10",
    popular: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/pricing-size-s-LaJSUDczcaLtK7isYYPrbR.webp",
  },
  {
    id: "pro",
    name: "Pro",
    capacity: "30 – 100 kWp",
    color: "from-accent-primary/20 to-accent-primary/5",
    borderColor: "border-accent-primary/40 hover:border-accent-primary/70",
    accentColor: "text-accent-primary",
    bgAccent: "bg-accent-primary/10",
    popular: true,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/pricing-size-m-96bdqV2qHeFRvREkQ3Suqg.webp",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    capacity: "100 – 500+ kWp",
    color: "from-amber-500/20 to-amber-600/5",
    borderColor: "border-amber-500/30 hover:border-amber-500/60",
    accentColor: "text-amber-500",
    bgAccent: "bg-amber-500/10",
    popular: false,
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/pricing-size-l-GYVfyzmEzDPhxpNp3PPD6K.webp",
  },
];

const govPolicyIcons = [BadgePercent, Car, TrendingUp, Leaf];
const advantageIcons = [Car, Sun, TrendingUp, BadgePercent, Leaf, BatteryCharging];

/* ─── Component ────────────────────────────────────────────────── */
export default function Pricing() {
  const { t } = usePageTranslation("pricing");
  const [expandedPkg, setExpandedPkg] = useState<string | null>("pro");

  /* ─── ROI Calculator State ─── */
  const [monthlyBill, setMonthlyBill] = useState<number>(30000);
  const [parkingSpaces, setParkingSpaces] = useState<number>(20);

  const roiCalc = useMemo(() => {
    const systemKwp = parkingSpaces * 3;
    const totalCost = systemKwp * 28000;
    const monthlyKwh = systemKwp * 120;
    const monthlySavings = Math.min(monthlyKwh * 4.5, monthlyBill * 0.85);
    const paybackYears = totalCost / (monthlySavings * 12);
    const totalSavings25yr = monthlySavings * 12 * 25 - totalCost;
    const co2ReductionTons = (monthlyKwh * 12 * 0.5) / 1000;
    const recommendedPkg = systemKwp <= 30 ? "Start" : systemKwp <= 100 ? "Pro" : "Enterprise";
    return {
      systemKwp,
      totalCost,
      monthlySavings,
      paybackYears: Math.max(paybackYears, 2.5),
      totalSavings25yr,
      co2ReductionTons,
      recommendedPkg,
      savingsPercent: Math.min(Math.round((monthlySavings / monthlyBill) * 100), 100),
    };
  }, [monthlyBill, parkingSpaces]);

  /* Build FAQ JSON-LD */
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: Array.from({ length: 7 }, (_, i) => ({
      "@type": "Question",
      name: t(`faq.${i}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.${i}.a`) },
    })),
  };

  return (
    <div>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      {/* ===== HERO ===== */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow via-background to-background" />
        <div className="container relative z-10">
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="max-w-3xl"
          >
            <Badge variant="outline" className="mb-4 border-accent-primary/40 text-accent-primary">
              <Calculator className="w-3.5 h-3.5 mr-1.5" /> {t("hero.badge")}
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
              {t("hero.title")}{" "}
              <span className="text-gradient-accent">{t("hero.title.accent")}</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed mb-6 max-w-2xl">
              {t("hero.desc")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact?interest=solar-carport">
                <Button size="lg" className="btn-accent font-display">
                  {t("hero.cta.quote")} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href="/assessment">
                <Button size="lg" variant="outline" className="border-border-accent font-display">
                  <Calculator className="w-4 h-4 mr-1" /> {t("hero.cta.assess")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== WHY SOLAR CARPORT NOW — Government Policy ===== */}
      <section className="py-16 lg:py-20 section-alt">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              Government Support
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("gov.title")} <span className="text-gradient-accent">{t("gov.title.accent")}</span>
            </h2>
            <p className="text-text-secondary">{t("gov.desc")}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {govPolicyIcons.map((Icon, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="p-5 rounded-xl border border-border-subtle bg-surface-elevated hover:border-border-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-glow flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-sm mb-2">{t(`gov.${i}.title`)}</h3>
                <p className="text-xs text-text-muted leading-relaxed mb-2">{t(`gov.${i}.desc`)}</p>
                <span className="inline-block text-[10px] font-medium text-accent-secondary bg-accent-secondary/10 px-2 py-0.5 rounded-full">
                  {t(`gov.${i}.period`)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PACKAGE CARDS ===== */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              Packages
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("pkg.title")} <span className="text-gradient-accent">{t("pkg.title.accent")}</span>
            </h2>
            <p className="text-text-secondary">{t("pkg.desc")}</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-10">
            {packageConfigs.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`relative rounded-2xl border-2 ${pkg.borderColor} bg-gradient-to-b ${pkg.color} p-6 lg:p-8 transition-all duration-300 ${
                  pkg.popular ? "lg:scale-105 lg:-my-2 shadow-lg" : ""
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent-primary text-white font-display shadow-md">
                      <Sparkles className="w-3 h-3 mr-1" /> {t("pkg.recommended")}
                    </Badge>
                  </div>
                )}

                {/* Package Image */}
                <div className="-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 mb-6 rounded-t-2xl overflow-hidden">
	                  <img
	                    src={cfImage(pkg.image, 640)}
	                    srcSet={cfImageSrcSet(pkg.image, [320, 480, 640, 960])}
	                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
	                    alt={`Solar Carport ${pkg.name}`}
	                    className="w-full h-40 lg:h-48 object-cover"
	                    loading="lazy"
	                    decoding="async"
	                  />
                </div>

                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-display text-2xl font-bold ${pkg.accentColor}`}>{pkg.name}</span>
                    <span className="text-sm text-text-muted">— {t(`pkg.${pkg.id}.subtitle`)}</span>
                  </div>
                  <div className="font-display text-lg font-semibold text-foreground mb-1">
                    {pkg.capacity}
                  </div>
                  <div className={`text-xl font-bold ${pkg.accentColor} mb-1`}>{t(`pkg.${pkg.id}.price`)}</div>
                  <p className="text-xs text-text-muted">{t(`pkg.${pkg.id}.priceNote`)}</p>
                </div>

                {/* Ideal For */}
                <div className="mb-5">
	                  <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{t("pkg.idealFor")}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {t(`pkg.${pkg.id}.idealFor`).split("|").map((item) => (
                      <span key={item} className={`text-xs px-2 py-1 rounded-md ${pkg.bgAccent} ${pkg.accentColor}`}>
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Key Specs */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{t("pkg.spec.parking")}</span>
                    <span className="font-medium text-foreground">{t(`pkg.${pkg.id}.specs.parking`)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">EV Charger</span>
                    <span className="font-medium text-foreground">{t(`pkg.${pkg.id}.specs.evCharger`)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{t("pkg.spec.savings")}</span>
                    <span className={`font-semibold ${pkg.accentColor}`}>{t(`pkg.${pkg.id}.specs.savings`)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{t("pkg.spec.payback")}</span>
                    <span className="font-semibold text-foreground">{t(`pkg.${pkg.id}.specs.payback`)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{t("pkg.spec.lifespan")}</span>
                    <span className="font-medium text-foreground">{t(`pkg.${pkg.id}.specs.lifespan`)}</span>
                  </div>
                </div>

                {/* EV Ready Badge */}
                <div className={`p-3 rounded-lg ${pkg.bgAccent} mb-5`}>
                  <div className="flex items-start gap-2">
                    <Car className={`w-4 h-4 mt-0.5 ${pkg.accentColor} shrink-0`} />
                    <div>
                      <span className={`text-xs font-semibold ${pkg.accentColor}`}>EV Ready</span>
                      <p className="text-xs text-text-muted mt-0.5">{t(`pkg.${pkg.id}.evReady`)}</p>
                    </div>
                  </div>
                </div>

                {/* Expandable Includes */}
                <button
                  onClick={() => setExpandedPkg(expandedPkg === pkg.id ? null : pkg.id)}
                  className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-foreground transition-colors mb-3"
                >
                  {expandedPkg === pkg.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {expandedPkg === pkg.id ? t("pkg.hideDetails") : t("pkg.showDetails")}
                </button>
                {expandedPkg === pkg.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5 mb-5"
                  >
                    {t(`pkg.${pkg.id}.includes`).split("|").map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 ${pkg.accentColor} shrink-0`} />
                        <span className="text-text-secondary">{item.trim()}</span>
                      </div>
                    ))}
                    <div className="pt-2 text-xs text-text-muted">
                      <strong>{t("pkg.warranty")}:</strong> {t(`pkg.${pkg.id}.specs.warranty`)}
                    </div>
                  </motion.div>
                )}

                {/* CTA */}
                <Link href={`/contact?interest=solar-carport&package=${pkg.id}`}>
                  <Button
                    className={`w-full font-display ${pkg.popular ? "btn-accent" : ""}`}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    {t("pkg.cta")} {pkg.name} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ADVANTAGES — Why Solar Carport ===== */}
      <section className="py-16 lg:py-20 section-alt">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              Advantages
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("adv.title")} <span className="text-gradient-accent">{t("adv.title.accent")}</span>
            </h2>
            <p className="text-text-secondary">{t("adv.desc")}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {advantageIcons.map((Icon, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="p-5 rounded-xl border border-border-subtle bg-surface-elevated hover:border-border-accent transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-glow flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{t(`adv.${i}.title`)}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{t(`adv.${i}.desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPARISON TABLE ===== */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("compare.title")}
            </h2>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-3 px-4 font-display font-semibold text-text-secondary">{t("compare.header.item")}</th>
                  <th className="text-center py-3 px-4 font-display font-semibold text-emerald-500">Start</th>
                  <th className="text-center py-3 px-4 font-display font-semibold text-accent-primary">
                    Pro <Badge className="ml-1 bg-accent-primary/20 text-accent-primary text-[10px]">{t("pkg.recommended")}</Badge>
                  </th>
                  <th className="text-center py-3 px-4 font-display font-semibold text-amber-500">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {Array.from({ length: 11 }, (_, i) => (
                  <tr key={i} className="hover:bg-accent-glow transition-colors">
                    <td className="py-2.5 px-4 font-medium text-foreground">{t(`compare.row.${i}.label`)}</td>
                    <td className="py-2.5 px-4 text-center text-text-secondary">{t(`compare.row.${i}.s`)}</td>
                    <td className="py-2.5 px-4 text-center text-text-secondary font-medium">{t(`compare.row.${i}.m`)}</td>
                    <td className="py-2.5 px-4 text-center text-text-secondary">{t(`compare.row.${i}.l`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-muted text-center mt-4">{t("compare.note")}</p>
        </div>
      </section>

      {/* ===== SOLAR CARPORT vs TRADITIONAL PARKING ===== */}
      <section className="py-16 lg:py-20 section-alt">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              Comparison
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              Solar Carport vs <span className="text-gradient-accent">{t("vs.title.accent")}</span>
            </h2>
            <p className="text-text-secondary">{t("vs.desc")}</p>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-3 px-4 font-display font-semibold text-text-secondary">{t("compare.header.item")}</th>
                  <th className="text-center py-3 px-4 font-display font-semibold text-text-muted">{t("vs.header.old")}</th>
                  <th className="text-center py-3 px-4 font-display font-semibold text-accent-primary">Solar Carport</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} className={`hover:bg-accent-glow transition-colors ${i % 2 === 0 ? "bg-accent-primary/5" : ""}`}>
                    <td className="py-2.5 px-4 font-medium text-foreground">{t(`vs.row.${i}.label`)}</td>
                    <td className="py-2.5 px-4 text-center text-text-muted">{t(`vs.row.${i}.old`)}</td>
                    <td className="py-2.5 px-4 text-center text-accent-primary font-medium">{t(`vs.row.${i}.carport`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== ROI CALCULATOR ===== */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-12"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("roi.label")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("roi.title")} <span className="text-gradient-accent">{t("roi.title.accent")}</span>
            </h2>
            <p className="text-text-secondary">{t("roi.desc")}</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="rounded-2xl border-2 border-border-accent p-6 lg:p-8 bg-surface-elevated"
          >
            {/* Input Fields */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  {t("roi.label.bill")}
                </label>
	                <input
	                  type="range"
	                  min={5000}
	                  max={500000}
	                  step={5000}
	                  value={monthlyBill}
	                  onChange={(e) => setMonthlyBill(Number(e.target.value))}
	                  aria-label={t("roi.label.bill")}
	                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-accent-primary bg-border-subtle"
	                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-text-muted">5,000</span>
                  <span className="text-lg font-bold text-accent-primary font-display">
                    {monthlyBill.toLocaleString()} {t("roi.unit.bahtMonth")}
                  </span>
                  <span className="text-xs text-text-muted">500,000</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  {t("roi.label.parking")}
                </label>
	                <input
	                  type="range"
	                  min={5}
	                  max={200}
	                  step={5}
	                  value={parkingSpaces}
	                  onChange={(e) => setParkingSpaces(Number(e.target.value))}
	                  aria-label={t("roi.label.parking")}
	                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-accent-primary bg-border-subtle"
	                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-text-muted">5 {t("roi.unit.vehicles")}</span>
                  <span className="text-lg font-bold text-accent-primary font-display">
                    {parkingSpaces} {t("roi.unit.vehicles")}
                  </span>
                  <span className="text-xs text-text-muted">200 {t("roi.unit.vehicles")}</span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-accent-glow text-center">
                <TrendingUp className="w-5 h-5 text-accent-primary mx-auto mb-2" />
                <div className="font-display text-xl lg:text-2xl font-bold text-accent-primary">
                  {Math.round(roiCalc.monthlySavings).toLocaleString()}
                </div>
                <div className="text-xs text-text-muted mt-1">{t("roi.result.savingsMonth")}</div>
              </div>
              <div className="p-4 rounded-xl bg-accent-glow text-center">
                <Clock className="w-5 h-5 text-accent-primary mx-auto mb-2" />
                <div className="font-display text-xl lg:text-2xl font-bold text-accent-primary">
                  {roiCalc.paybackYears.toFixed(1)}
                </div>
                <div className="text-xs text-text-muted mt-1">{t("roi.result.paybackYears")}</div>
              </div>
              <div className="p-4 rounded-xl bg-accent-glow text-center">
                <Zap className="w-5 h-5 text-accent-primary mx-auto mb-2" />
                <div className="font-display text-xl lg:text-2xl font-bold text-accent-primary">
                  {(roiCalc.totalSavings25yr / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-text-muted mt-1">{t("roi.result.totalSavings")}</div>
              </div>
              <div className="p-4 rounded-xl bg-accent-glow text-center">
                <Leaf className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                <div className="font-display text-xl lg:text-2xl font-bold text-emerald-500">
                  {roiCalc.co2ReductionTons.toFixed(0)}
                </div>
                <div className="text-xs text-text-muted mt-1">{t("roi.result.co2")}</div>
              </div>
            </div>

            {/* Savings Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-secondary">{t("roi.savingsPercent")}</span>
                <span className="font-bold text-accent-primary">{roiCalc.savingsPercent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-border-subtle overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent-primary to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${roiCalc.savingsPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Recommendation + CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-accent-primary/10 border border-accent-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <span className="text-sm text-text-secondary">{t("roi.recommend")}</span>
                  <span className="ml-2 font-display font-bold text-accent-primary">
                    {roiCalc.recommendedPkg}
                  </span>
                  <span className="ml-2 text-sm text-text-muted">({roiCalc.systemKwp} kWp)</span>
                </div>
              </div>
              <Link href={`/contact?interest=solar-carport&package=${roiCalc.recommendedPkg.toLowerCase()}`}>
                <Button className="btn-accent font-display whitespace-nowrap">
                  {t("roi.cta")} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-text-muted text-center mt-4">{t("roi.note")}</p>
          </motion.div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center mb-10"
          >
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("faq.title")}
            </h2>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-3">
            {Array.from({ length: 7 }, (_, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border-subtle rounded-xl px-5 bg-surface-elevated"
              >
                <AccordionTrigger className="font-display font-semibold text-foreground text-left text-sm hover:no-underline">
                  {t(`faq.${i}.q`)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-text-secondary leading-relaxed pb-4">
                  {t(`faq.${i}.a`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ===== BROCHURE DOWNLOADS ===== */}
      <section className="py-16 lg:py-24 section-alt relative">
        <div className="divider-accent absolute top-0 left-0 right-0" />
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("brochure.badge")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-2">
              {t("brochure.title")}{" "}
              <span className="text-gradient-accent">{t("brochure.title.accent")}</span>
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">{t("brochure.desc")}</p>
          </motion.div>

          {/* Brochure Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {[
              {
                title: t("brochure.start.title"),
                subtitle: t("brochure.start.price"),
                image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/brochure_start_package-3f4EjcQuJe7s8BYr5T3brk.webp",
                color: "border-emerald-500/40",
                original: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/brochure_start_package-evoXYNCfQwhWaSZyHPgDSb.png",
              },
              {
                title: t("brochure.pro.title"),
                subtitle: t("brochure.pro.price"),
                image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/brochure_pro_package-Wy2JPi6yf6sqwADpAUtKzr.webp",
                color: "border-accent-primary/40",
                original: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/brochure_pro_package-VLKFGWCkZQEXt3fzvvi2PV.png",
              },
              {
                title: t("brochure.bilingual.title"),
                subtitle: "TH / EN",
                image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/brochure_combined_bilingual-bu2rBkmpzHntAciawzpmZ3.webp",
                color: "border-blue-500/40",
                original: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/brochure_combined_bilingual-4mcPMzsmtPmDxwAtcJzqS6.png",
              },
              {
                title: t("brochure.engineer.title"),
                subtitle: "AI Avatar",
                image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/brochure_engineer_thai-kKFdvftXshwp9QRRmQ9s4M.webp",
                color: "border-amber-500/40",
                original: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/brochure_engineer_thai-ZNfCkYGqHB7q3D8z6xwNtS.png",
              },
              {
                title: t("brochure.english.title"),
                subtitle: "International",
                image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/brochure_english_version-iNBTHtSfLWnbLiftPVRDN7.webp",
                color: "border-purple-500/40",
                original: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/brochure_english_version-3nsCg2Ym6nRdrHBkHKgAr3.png",
              },
            ].map((brochure, i) => (
              <motion.div
                key={brochure.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className={`group relative rounded-xl border ${brochure.color} bg-surface-elevated overflow-hidden hover:shadow-lg transition-all duration-300`}
              >
                <div className="aspect-[9/16] overflow-hidden">
	                  <img
	                    src={cfImage(brochure.image, 360)}
	                    srcSet={cfImageSrcSet(brochure.image, [220, 300, 360, 480])}
	                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
	                    alt={brochure.title}
	                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
	                    loading="lazy"
	                    decoding="async"
	                  />
                </div>
                <div className="p-3">
	                  <div className="font-display font-semibold text-foreground text-xs mb-0.5">{brochure.title}</div>
                  <p className="text-[10px] text-text-muted mb-2">{brochure.subtitle}</p>
                  <a
                    href={brochure.original}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-accent-primary hover:underline"
                  >
                    <Download className="w-3 h-3" /> {t("brochure.download")}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Video Section */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={5}
            className="max-w-3xl mx-auto"
          >
            <div className="rounded-xl border border-border-accent bg-surface-elevated overflow-hidden">
              <div className="aspect-video relative">
                <video
                  controls
                  preload="metadata"
	                  poster={cfImage("https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/video_ref_house-WHrscP32nbpwfKEtkXxgSY.webp", 960)}
                  className="w-full h-full object-cover"
                >
                  <source src="https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/sirinx_marketing_video_f99c477e.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
	                  <div className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
	                    <Video className="w-4 h-4 text-accent-primary" />
	                    {t("brochure.video.title")}
	                  </div>
                  <p className="text-xs text-text-muted mt-0.5">{t("brochure.video.desc")}</p>
                </div>
                <a
                  href="https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/sirinx_marketing_video_f99c477e.mp4"
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline" className="border-border-accent text-xs gap-1">
                    <Download className="w-3 h-3" /> {t("brochure.download")}
                  </Button>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-16 lg:py-20 bg-background">
        <div className="container text-center max-w-2xl">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
          >
            <Zap className="w-10 h-10 text-accent-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("cta.title")}
            </h2>
            <p className="text-text-secondary mb-6">{t("cta.desc")}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/contact?interest=solar-carport">
                <Button size="lg" className="btn-accent font-display">
                  {t("cta.survey")} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href="/solar-carport">
                <Button size="lg" variant="outline" className="border-border-accent font-display">
                  {t("cta.details")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
