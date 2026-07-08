import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/homeSolution";
import {
  ArrowRight,
  BatteryCharging,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Home,
  MapPinned,
  PlugZap,
  ShieldCheck,
  Sun,
  Wrench,
} from "lucide-react";

const ASSET_DIR = "/assets/home-solution";
const RESPONSIVE_WIDTHS = [640, 960, 1280] as const;

function imageSrc(name: string, width: number, extension: "avif" | "jpg") {
  return `${ASSET_DIR}/${name}-${width}.${extension}`;
}

function imageSrcSet(name: string, extension: "avif" | "jpg") {
  return RESPONSIVE_WIDTHS.map(
    width => `${imageSrc(name, width, extension)} ${width}w`
  ).join(", ");
}

const HERO_IMAGE_NAME = "home-solution-drone-hero";
const HERO_IMAGE = `${ASSET_DIR}/${HERO_IMAGE_NAME}.jpg`;
const HERO_IMAGE_SIZES = "(max-width: 767px) 80vw, 100vw";
const HERO_IMAGE_RESPONSIVE = {
  fallback: imageSrc(HERO_IMAGE_NAME, 1280, "jpg"),
  avifSrcSet: imageSrcSet(HERO_IMAGE_NAME, "avif"),
  jpgSrcSet: imageSrcSet(HERO_IMAGE_NAME, "jpg"),
};

const GALLERY_IMAGES = [
  {
    name: "home-solution-village-oblique",
    altKey: "hs.gallery.village.alt",
    labelKey: "hs.gallery.village.label",
  },
  {
    name: "home-solution-rooftop-detail",
    altKey: "hs.gallery.detail.alt",
    labelKey: "hs.gallery.detail.label",
  },
  {
    name: "home-solution-estate-topdown",
    altKey: "hs.gallery.estate.alt",
    labelKey: "hs.gallery.estate.label",
  },
];

const highLoadSignals = [
  "hs.signal.bill",
  "hs.signal.loads",
  "hs.signal.ev",
  "hs.signal.backup",
];

const solutionStack = [
  {
    icon: Sun,
    titleKey: "hs.stack.rooftop.title",
    bodyKey: "hs.stack.rooftop.body",
  },
  {
    icon: Home,
    titleKey: "hs.stack.carport.title",
    bodyKey: "hs.stack.carport.body",
  },
  {
    icon: BatteryCharging,
    titleKey: "hs.stack.bess.title",
    bodyKey: "hs.stack.bess.body",
  },
  {
    icon: PlugZap,
    titleKey: "hs.stack.ev.title",
    bodyKey: "hs.stack.ev.body",
  },
  {
    icon: Gauge,
    titleKey: "hs.stack.monitor.title",
    bodyKey: "hs.stack.monitor.body",
  },
  {
    icon: Wrench,
    titleKey: "hs.stack.om.title",
    bodyKey: "hs.stack.om.body",
  },
];

const trustChecks = [
  "hs.trust.survey",
  "hs.trust.docs",
  "hs.trust.commissioning",
  "hs.trust.monitor",
  "hs.trust.reference",
  "hs.trust.scenario",
];

const processSteps = [
  {
    titleKey: "hs.step.load.title",
    bodyKey: "hs.step.load.body",
  },
  {
    titleKey: "hs.step.survey.title",
    bodyKey: "hs.step.survey.body",
  },
  {
    titleKey: "hs.step.proposal.title",
    bodyKey: "hs.step.proposal.body",
  },
  {
    titleKey: "hs.step.install.title",
    bodyKey: "hs.step.install.body",
  },
];

const faqs = [
  {
    qKey: "hs.faq.fit.q",
    aKey: "hs.faq.fit.a",
  },
  {
    qKey: "hs.faq.price.q",
    aKey: "hs.faq.price.a",
  },
  {
    qKey: "hs.faq.risk.q",
    aKey: "hs.faq.risk.a",
  },
  {
    qKey: "hs.faq.ev.q",
    aKey: "hs.faq.ev.a",
  },
];

export default function HomeSolution() {
  const { t } = usePageTranslation("homeSolution");
  const localizedFaqs = faqs.map(faq => ({
    q: t(faq.qKey),
    a: t(faq.aKey),
  }));
  const statCards = [
    [t("hs.stat.highLoad.value"), t("hs.stat.highLoad.label")],
    [t("hs.stat.commissioning.value"), t("hs.stat.commissioning.label")],
    [t("hs.stat.monitoring.value"), t("hs.stat.monitoring.label")],
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": "https://www.sirinx.co/home-solution#service",
        name: "SIRINX Home Solar Solution",
        serviceType:
          "Solar rooftop, solar carport, BESS, EV Charger, and AI energy monitoring for large homes and home offices",
        provider: {
          "@type": "Organization",
          name: "SIRINX",
          url: "https://www.sirinx.co",
        },
        areaServed: {
          "@type": "Country",
          name: "Thailand",
        },
        audience: {
          "@type": "Audience",
          audienceType:
            "Large private residences, home offices, executive homes, premium housing estates",
        },
        description: t("hs.meta.desc"),
      },
      {
        "@type": "FAQPage",
        mainEntity: localizedFaqs.map(faq => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("hs.breadcrumb.home"),
            item: "https://www.sirinx.co",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Home Solar Solution",
            item: "https://www.sirinx.co/home-solution",
          },
        ],
      },
    ],
  };

  return (
    <div className="bg-background text-foreground">
      <Helmet>
        <title>{t("hs.meta.title")}</title>
        <meta
          name="description"
          content={t("hs.meta.desc")}
        />
        <link rel="canonical" href="https://www.sirinx.co/home-solution/" />
        <meta
          property="og:title"
          content={t("hs.meta.title")}
        />
        <meta
          property="og:description"
          content={t("hs.meta.ogDesc")}
        />
        <meta
          property="og:image"
          content={`https://www.sirinx.co${HERO_IMAGE}`}
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <section className="relative min-h-[92vh] overflow-hidden">
        <picture className="absolute inset-0 block h-full w-full">
          <source
            type="image/avif"
            srcSet={HERO_IMAGE_RESPONSIVE.avifSrcSet}
            sizes={HERO_IMAGE_SIZES}
          />
          <img
            src={HERO_IMAGE_RESPONSIVE.fallback}
            srcSet={HERO_IMAGE_RESPONSIVE.jpgSrcSet}
            sizes={HERO_IMAGE_SIZES}
            alt={t("hs.hero.imageAlt")}
            className="h-full w-full object-cover"
            width={1280}
            height={720}
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/78 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="container relative z-10 flex min-h-[92vh] items-center pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-accent bg-accent-glow px-3 py-1.5 text-xs font-semibold text-accent-primary">
              <MapPinned className="h-3.5 w-3.5" />
              {t("hs.hero.eyebrow")}
            </div>
            <h1 className="mb-6 font-display text-3xl font-bold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
              {t("hs.hero.title1")}
              <span className="block text-gradient-accent">
                {t("hs.hero.title2")}
              </span>
            </h1>
            <p className="mb-8 max-w-2xl text-sm leading-7 text-text-secondary sm:text-lg sm:leading-relaxed">
              <span className="block sm:hidden">
                <span className="block">{t("hs.hero.mobile1")}</span>
                <span className="block">{t("hs.hero.mobile2")}</span>
                <span className="block">{t("hs.hero.mobile3")}</span>
                <span className="block">{t("hs.hero.mobile4")}</span>
                <span className="mt-1 block">{t("hs.hero.mobile5")}</span>
                <span className="block">{t("hs.hero.mobile6")}</span>
                <span className="block">{t("hs.hero.mobile7")}</span>
              </span>
              <span className="hidden sm:block">
                {t("hs.hero.desc1")}
              </span>
              <span className="mt-1 hidden sm:block">
                {t("hs.hero.desc2")}
              </span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact?interest=home-solution"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent"
              >
                {t("hs.hero.ctaPrimary")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline"
              >
                <Calculator className="h-4 w-4" />
                {t("hs.hero.ctaSecondary")}
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {statCards.map(([value, label]) => (
                <div
                  key={value}
                  className="rounded-lg border border-border-subtle bg-surface-overlay p-4 backdrop-blur"
                >
                  <div className="font-display text-lg font-bold text-accent-primary">
                    {value}
                  </div>
                  <div className="mt-1 text-xs text-text-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <span className="mb-3 inline-flex text-sm font-semibold text-accent-primary">
                {t("hs.fit.eyebrow")}
              </span>
              <h2 className="mb-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
                {t("hs.fit.title")}
              </h2>
              <p className="text-text-secondary leading-relaxed">
                {t("hs.fit.desc")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {highLoadSignals.map(item => (
                <div
                  key={item}
                  className="rounded-xl border border-border-subtle bg-surface-elevated p-5"
                >
                  <CheckCircle2 className="mb-4 h-5 w-5 text-accent-primary" />
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {t(item)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-alt py-16 lg:py-24">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <span className="mb-3 inline-flex text-sm font-semibold text-accent-primary">
              {t("hs.stack.eyebrow")}
            </span>
            <h2 className="mb-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
              {t("hs.stack.title")}
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {t("hs.stack.desc")}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {solutionStack.map(item => {
              const Icon = item.icon;
              return (
                <article
                  key={item.titleKey}
                  className="rounded-xl border border-border-subtle bg-surface-elevated p-6"
                >
                  <Icon className="mb-5 h-7 w-7 text-accent-primary" />
                  <h3 className="mb-3 font-display text-lg font-bold">
                    {t(item.titleKey)}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {t(item.bodyKey)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="grid gap-4">
              {GALLERY_IMAGES.map((image, index) => (
                <figure
                  key={image.name}
                  className={`overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated ${index === 0 ? "" : "lg:ml-12"}`}
                >
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={imageSrcSet(image.name, "avif")}
                      sizes="(min-width: 1024px) 54vw, 100vw"
                    />
                    <img
                      src={imageSrc(image.name, 960, "jpg")}
                      srcSet={imageSrcSet(image.name, "jpg")}
                      sizes="(min-width: 1024px) 54vw, 100vw"
                      alt={t(image.altKey)}
                      width={1280}
                      height={720}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </picture>
                  <figcaption className="px-4 py-3 text-xs text-text-muted">
                    {t(image.labelKey)}
                  </figcaption>
                </figure>
              ))}
            </div>
            <div>
              <span className="mb-3 inline-flex text-sm font-semibold text-accent-primary">
                {t("hs.proof.eyebrow")}
              </span>
              <h2 className="mb-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
                {t("hs.proof.title")}
              </h2>
              <p className="mb-6 text-text-secondary leading-relaxed">
                {t("hs.proof.desc")}
              </p>
              <div className="grid gap-3">
                {trustChecks.map(item => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-lg border border-border-subtle bg-surface-elevated p-4"
                  >
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-primary" />
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {t(item)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-lg border border-border-accent bg-accent-glow p-4 text-xs leading-relaxed text-text-secondary">
                {t("hs.proof.note")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-alt py-16 lg:py-24">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <span className="mb-3 inline-flex text-sm font-semibold text-accent-primary">
              {t("hs.process.eyebrow")}
            </span>
            <h2 className="mb-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
              {t("hs.process.title")}
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {processSteps.map(step => (
              <article
                key={step.titleKey}
                className="rounded-xl border border-border-subtle bg-surface-elevated p-6"
              >
                <ClipboardCheck className="mb-5 h-6 w-6 text-accent-primary" />
                <h3 className="mb-3 font-display text-base font-bold">
                  {t(step.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {t(step.bodyKey)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <span className="mb-3 inline-flex text-sm font-semibold text-accent-primary">
                {t("hs.faq.eyebrow")}
              </span>
              <h2 className="mb-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
                {t("hs.faq.title")}
              </h2>
              <p className="text-text-secondary leading-relaxed">
                {t("hs.faq.desc")}
              </p>
            </div>
            <div className="grid gap-4">
              {localizedFaqs.map(faq => (
                <article
                  key={faq.q}
                  className="rounded-xl border border-border-subtle bg-surface-elevated p-6"
                >
                  <h3 className="mb-3 font-display text-lg font-bold">
                    {faq.q}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {faq.a}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-elevated py-16 lg:py-24">
        <div className="container">
          <div className="grid gap-8 rounded-2xl border border-border-accent bg-accent-glow p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-accent-primary">
                <Building2 className="h-4 w-4" />
                {t("hs.final.eyebrow")}
              </div>
              <h2 className="mb-3 font-display text-2xl font-bold leading-tight sm:text-4xl">
                {t("hs.final.title")}
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
                {t("hs.final.desc")}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/contact?interest=home-solution"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent"
              >
                {t("hs.final.primary")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline"
              >
                {t("hs.final.projects")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
