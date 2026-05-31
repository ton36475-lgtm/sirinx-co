/**
 * Solar Carport — Flagship Product Page
 * Deep-dive: benefits, specs, integration, proof, financing, FAQ, CTA
 * Full i18n support via usePageTranslation
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "wouter";
import { Helmet } from "react-helmet-async";
import { trackSolutionVisit } from "@/components/HeroSlideshow";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/solarCarport";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import { getProvinceBySlug } from "@shared/thaiProvinces";
import {
  Car,
  Sun,
  Battery,
  Brain,
  Plug,
  Shield,
  Clock,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  BarChart3,
  Wrench,
  Leaf,
  Building2,
  Factory,
  Hotel,
  GraduationCap,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
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
const HERO_CARPARK = `${CDN}/carport-wide-1_30e3af4c.jpeg`;
const IMG_EV = `${CDN}/carport-structure-1_c0c17293.jpeg`;
const IMG_AI = `${CDN}/bess-cabinet-2_54c824b8.jpeg`;
const IMG_OM = `${CDN}/install-team-2_23aa9cdf.jpeg`;
const IMG_CARPORT_GALLERY = [
  `${CDN}/carport-wide-1_30e3af4c.jpeg`,
  `${CDN}/carport-structure-1_c0c17293.jpeg`,
  `${CDN}/carport-structure-2_f0ab2f56.jpeg`,
  `${CDN}/carport-underside-1_51e3d09a.jpeg`,
  `${CDN}/carport-underside-2_e70e97e1.jpeg`,
  `${CDN}/install-team-1_91970553.jpeg`,
  `${CDN}/bess-cabinet-1_f027743f.jpeg`,
  `${CDN}/bess-cabinet-2_54c824b8.jpeg`,
  `${CDN}/carport-pillar-1_b7680b5f.jpeg`,
  `${CDN}/carport-detail-1_34c7c42f.jpeg`,
  `${CDN}/cable-tray-detail_1ddf9610.jpeg`,
  `${CDN}/carport-structure-4_cc6ef3f6.jpeg`,
];

const benefitIcons = [Sun, Car, Plug, Battery, Brain, Leaf];
const benefitKeys = ["sc.b1", "sc.b2", "sc.b3", "sc.b4", "sc.b5", "sc.b6"];

const specKeys = [
  { key: "sc.spec.capacity", value: "50-500+ kWp" },
  { key: "sc.spec.structure" },
  { key: "sc.spec.panel", value: "Tier-1 Mono PERC" },
  { key: "sc.spec.inverter", value: "String / Micro" },
  { key: "sc.spec.height" },
  { key: "sc.spec.install" },
];

const faqKeys = [
  "sc.faq1",
  "sc.faq2",
  "sc.faq3",
  "sc.faq4",
  "sc.faq5",
  "sc.faq6",
];

export default function SolarCarport() {
  const { t } = usePageTranslation("solarCarport");
  const params = useParams<{ province?: string }>();
  const province = params.province ? getProvinceBySlug(params.province) : undefined;
  const contactHref = province
    ? `/contact?interest=solar-carport&province=${province.slug}`
    : "/contact";
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    trackSolutionVisit("solar-carport");
    const onScroll = () => setShowStickyCta(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const faqs = faqKeys.map(k => ({ q: t(`${k}.q`), a: t(`${k}.a`) }));

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

      {/* ===== HERO ===== */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={cfImage(HERO_CARPARK, 1280, { quality: 76 })}
            srcSet={cfImageSrcSet(HERO_CARPARK, [640, 960, 1280, 1600], { quality: 76 })}
            sizes="100vw"
            alt="Solar Carport by SIRINX"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        <div className="container relative z-10 pt-24 pb-12">
          <div className="max-w-3xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-accent-primary bg-accent-glow border border-border-accent rounded-full mb-5">
                <Car className="w-3.5 h-3.5" /> {t("sc.badge")}
              </span>
            </motion.div>
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-[1.12] mb-5"
            >
              {province ? `Solar Carport ${province.nameTh}` : t("sc.hero.title1")}
              <br />
              <span className="text-gradient-accent">
                {province ? "ที่จอดรถผลิตไฟฟ้าสำหรับธุรกิจ" : t("sc.hero.title2")}
              </span>
            </motion.h1>
            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="text-base sm:text-lg text-text-secondary leading-relaxed mb-7 max-w-xl"
            >
              {t("sc.hero.desc")}
            </motion.p>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row gap-3 mb-8"
            >
              <Link
                href={contactHref}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg"
              >
                {t("sc.hero.cta1")} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent-outline rounded-lg"
              >
                {t("sc.hero.cta2")}
              </Link>
            </motion.div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
              className="flex flex-wrap gap-6"
            >
              {[
                { value: "30-100%", labelKey: "sc.hero.stat.bill" },
                { value: "3-5 ปี", labelKey: "sc.hero.stat.roi" },
                { value: "25+", labelKey: "sc.hero.stat.life" },
                { value: "24/7", labelKey: "sc.hero.stat.bill" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="font-display text-lg font-bold text-gradient-accent">
                    {item.value}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {i === 3 ? "AI Monitor" : t(item.labelKey)}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {province && (
        <section className="py-10 lg:py-14 section-alt">
          <div className="container">
            <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] items-start">
              <div className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 lg:p-8">
                <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
                  Local Solar Carport Planning
                </span>
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
                  ออกแบบ Solar Carport สำหรับพื้นที่{province.nameTh}
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  SIRINX วางแผนระบบ Solar Carport สำหรับโรงงาน โรงแรม อาคารพาณิชย์
                  ศูนย์กระจายสินค้า สถานศึกษา และองค์กรใน{province.nameTh}
                  โดยประเมินจากพื้นที่จอดรถ ค่าไฟจริง load profile โครงสร้างหน้างาน
                  EV Charger, BESS และรูปแบบการลงทุน ก่อนสรุปแบบวิศวกรรมและใบเสนอราคา
                </p>
              </div>
              <div className="rounded-2xl border border-border-accent bg-accent-glow p-6 lg:p-8">
                <h3 className="font-display text-lg font-bold text-foreground mb-4">
                  สิ่งที่ประเมินให้ก่อนติดตั้ง
                </h3>
                <ul className="space-y-3 text-sm text-text-secondary">
                  {[
                    `ศักยภาพพื้นที่จอดรถใน${province.nameTh}`,
                    "ขนาดระบบ kWp ที่เหมาะกับค่าไฟและ load profile",
                    "EV Charger, BESS และ AI Energy Management ที่ควรใช้",
                    "กรอบผลประหยัด 30-100% และคืนทุนเฉลี่ย 3-5 ปีตามข้อมูลไซต์จริง",
                  ].map(item => (
                    <li key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== BENEFITS GRID ===== */}
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
              {t("sc.benefits.label")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("sc.benefits.title")}
            </h2>
            <p className="text-text-secondary text-sm">
              {t("sc.benefits.desc")}
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefitKeys.map((bk, i) => {
              const Icon = benefitIcons[i];
              return (
                <motion.div
                  key={bk}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="p-5 rounded-xl border border-border-subtle bg-surface-elevated hover:border-border-accent transition-colors"
                >
                  <Icon className="w-8 h-8 text-accent-primary mb-3" />
                  <h3 className="font-display font-semibold text-foreground mb-1.5 text-sm">
                    {t(`${bk}.title`)}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {t(`${bk}.desc`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== INTEGRATION VISUAL ===== */}
      <section className="py-16 lg:py-24 section-alt">
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
                {t("sc.integration.label")}
              </span>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">
                {t("sc.integration.title")}
                <br />
                {t("sc.integration.title2")}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-5">
                {t("sc.integration.desc")}
              </p>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-accent-primary">
                        {n}
                      </span>
                    </div>
                    <span className="text-sm text-text-secondary">
                      {t(`sc.integration.step${n}`)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              <img
                src={cfImage(IMG_AI, 960)}
                srcSet={cfImageSrcSet(IMG_AI, [480, 720, 960, 1280])}
                sizes="(min-width: 1024px) 50vw, 100vw"
                alt="AI Energy Management Dashboard"
                className="rounded-2xl w-full aspect-[16/10] object-cover"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MID-PAGE CTA ===== */}
      <section className="py-10 lg:py-14 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="glass-card rounded-2xl p-7 lg:p-9 flex flex-col lg:flex-row items-center gap-6 lg:gap-10"
          >
            <div className="flex-1">
              <h3 className="font-display text-lg lg:text-xl font-bold text-foreground mb-2">
                {t("sc.midCta.title")}
              </h3>
              <p className="text-text-secondary text-sm">
                {t("sc.midCta.desc")}
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 font-display font-semibold btn-accent rounded-lg text-sm whitespace-nowrap shrink-0"
            >
              {t("sc.midCta.btn")} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== SPECS TABLE ===== */}
      <section className="py-16 lg:py-24 section-alt">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-10"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("sc.specs.label")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              {t("sc.specs.title")}
            </h2>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="rounded-xl border border-border-subtle overflow-hidden"
          >
            <div className="divide-y divide-border-subtle">
              {specKeys.map(spec => (
                <div
                  key={spec.key}
                  className="flex items-center justify-between p-4 bg-surface-elevated hover:bg-accent-glow/30 transition-colors"
                >
                  <div className="font-medium text-foreground text-sm">
                    {t(`${spec.key}.label`)}
                  </div>
                  <div className="text-right">
                    <div className="font-display font-semibold text-accent-primary text-sm">
                      {spec.value || t(`${spec.key}.value`)}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {t(`${spec.key}.note`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== INDUSTRIES ===== */}
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
              {t("sc.ind.label")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("sc.ind.title")}
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Factory, key: "sc.ind.factory" },
              { icon: Hotel, key: "sc.ind.hotel" },
              { icon: Building2, key: "sc.ind.commercial" },
              { icon: GraduationCap, key: "sc.ind.edu" },
            ].map((ind, i) => (
              <motion.div
                key={ind.key}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-5 rounded-xl border border-border-subtle bg-surface-elevated hover:border-border-accent transition-colors"
              >
                <ind.icon className="w-7 h-7 text-accent-secondary mb-3" />
                <h3 className="font-display font-semibold text-foreground mb-1 text-sm">
                  {t(`${ind.key}.title`)}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed mb-2">
                  {t(`${ind.key}.desc`)}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-accent-primary">
                  <Car className="w-3 h-3" /> {t(`${ind.key}.parking`)}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== O&M VISUAL ===== */}
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
                src={cfImage(IMG_OM, 960)}
                srcSet={cfImageSrcSet(IMG_OM, [480, 720, 960, 1280])}
                sizes="(min-width: 1024px) 50vw, 100vw"
                alt="SIRINX O&M Service"
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
                {t("sc.om.label")}
              </span>
              <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">
                {t("sc.om.title1")}
                <br />
                {t("sc.om.title2")}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-5">
                {t("sc.om.desc")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    icon: BarChart3,
                    labelKey: "sc.om.monitoring",
                    value: "24/7",
                  },
                  {
                    icon: Wrench,
                    labelKey: "sc.om.response",
                    valueKey: "sc.om.response.value",
                  },
                  {
                    icon: Shield,
                    labelKey: "sc.om.warranty",
                    valueKey: "sc.om.warranty.value",
                  },
                  { icon: Zap, labelKey: "sc.om.monitoring", value: "99.5%" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle bg-surface-elevated"
                  >
                    <item.icon className="w-5 h-5 text-accent-primary shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-gradient-accent">
                        {item.value || t(item.valueKey!)}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {t(item.labelKey)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FINANCING ===== */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-10"
          >
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              {t("sc.fin.label")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("sc.fin.title")}
            </h2>
            <p className="text-text-secondary text-sm">{t("sc.fin.desc")}</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                key: "sc.fin.buy",
                features: ["sc.fin.buy.f1", "sc.fin.buy.f2", "sc.fin.buy.f3"],
              },
              {
                key: "sc.fin.installment",
                features: [
                  "sc.fin.installment.f1",
                  "sc.fin.installment.f2",
                  "sc.fin.installment.f3",
                ],
              },
              {
                key: "sc.fin.coinvest",
                features: [
                  "sc.fin.coinvest.f1",
                  "sc.fin.coinvest.f2",
                  "sc.fin.coinvest.f3",
                ],
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.key}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-5 rounded-xl border border-border-subtle bg-surface-elevated hover:border-border-accent transition-colors"
              >
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {t(`${plan.key}.title`)}
                </h3>
                <div className="text-sm font-bold text-gradient-accent mb-2">
                  {t(`${plan.key}.highlight`)}
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  {t(`${plan.key}.desc`)}
                </p>
                <ul className="space-y-1.5">
                  {plan.features.map(f => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-xs text-text-secondary"
                    >
                      <CheckCircle2 className="w-3 h-3 text-accent-primary shrink-0" />
                      {t(f)}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/investment"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline"
            >
              {t("sc.fin.moreInfo")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== REAL PHOTO GALLERY ===== */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center max-w-2xl mx-auto mb-10"
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3">
              <Camera className="w-3.5 h-3.5" /> {t("sc.gallery.label")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              {t("sc.gallery.title")}
            </h2>
            <p className="text-text-secondary text-sm">
              {t("sc.gallery.desc")}
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {IMG_CARPORT_GALLERY.map((src, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i % 4}
                className="cursor-pointer group"
                onClick={() => setLightboxIdx(i)}
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden border border-border-subtle hover:border-accent-primary/40 transition-all">
	                  <img
	                    src={cfImage(src, 480)}
	                    srcSet={cfImageSrcSet(src, [240, 360, 480, 640])}
	                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
	                    alt={`${t("sc.gallery.imgAlt")} ${i + 1}`}
	                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
	                    loading="lazy"
	                    decoding="async"
	                  />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline"
            >
              {t("sc.gallery.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIdx(null)}
        >
	          <button
	            className="absolute top-4 right-4 text-white/70 hover:text-white z-50"
	            onClick={() => setLightboxIdx(null)}
	            aria-label="ปิดแกลเลอรี Solar Carport"
	          >
            <X className="w-8 h-8" />
          </button>
	          <button
	            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-50"
	            aria-label="รูปก่อนหน้า"
	            onClick={e => {
              e.stopPropagation();
              setLightboxIdx(
                (lightboxIdx - 1 + IMG_CARPORT_GALLERY.length) %
                  IMG_CARPORT_GALLERY.length
              );
            }}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
	          <button
	            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-50"
	            aria-label="รูปถัดไป"
	            onClick={e => {
              e.stopPropagation();
              setLightboxIdx((lightboxIdx + 1) % IMG_CARPORT_GALLERY.length);
            }}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
	          <img
	            src={cfImage(IMG_CARPORT_GALLERY[lightboxIdx], 1600, { quality: 82 })}
	            alt={`Solar Carport ${lightboxIdx + 1}`}
	            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
	            decoding="async"
	            onClick={e => e.stopPropagation()}
	          />
          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIdx + 1} / {IMG_CARPORT_GALLERY.length}
          </div>
        </div>
      )}

      {/* ===== FAQ ===== */}
      <section className="py-16 lg:py-24 section-alt">
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
              {t("sc.faq.label")}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">
              {t("sc.faq.title")}
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

      {/* ===== STICKY MOBILE CTA ===== */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ${
          showStickyCta
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }`}
      >
        <div className="bg-background/95 backdrop-blur-md border-t border-border-subtle px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-display font-semibold text-foreground text-xs truncate">
              Solar Carport
            </div>
            <div className="text-[10px] text-text-muted">
              {t("sc.sticky.label")}
            </div>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 font-display font-semibold btn-accent rounded-lg text-xs whitespace-nowrap shrink-0"
          >
            {t("sc.sticky.btn")} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ===== FINAL CTA ===== */}
      <section className="py-16 lg:py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow to-transparent" />
        <div className="container relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="font-display text-2xl lg:text-4xl font-bold text-foreground mb-3">
              {t("sc.finalCta.title")}
            </h2>
            <p className="text-sm lg:text-base text-text-secondary mb-7 max-w-lg mx-auto">
              {t("sc.finalCta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-display font-semibold btn-accent rounded-lg"
              >
                {t("sc.finalCta.btn1")} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 font-display font-semibold btn-accent-outline rounded-lg"
              >
                {t("sc.finalCta.btn2")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
