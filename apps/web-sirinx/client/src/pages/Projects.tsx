/**
 * SIRINX Projects / Portfolio — i18n Integrated
 * Premium proof-first storytelling: featured hero project, clean cards, curated gallery
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { trackSolutionVisit } from "@/components/HeroSlideshow";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/projects";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import {
  ArrowRight, MapPin, Zap, Calendar, TrendingUp, Filter,
  X, ChevronLeft, ChevronRight, CheckCircle2, Car,
  Sun, Battery, Download, Award, Shield, Gauge
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv";

/* ── Curated gallery — real photos from Royal Park installation ── */
const galleryPhotos = [
  // Original carport photos
  `${CDN}/carport-wide-1_30e3af4c.jpeg`,
  `${CDN}/carport-structure-1_c0c17293.jpeg`,
  `${CDN}/carport-structure-2_f0ab2f56.jpeg`,
  `${CDN}/carport-underside-1_51e3d09a.jpeg`,
  `${CDN}/carport-underside-2_e70e97e1.jpeg`,
  `${CDN}/carport-pillar-1_b7680b5f.jpeg`,
  `${CDN}/bess-cabinet-1_f027743f.jpeg`,
  `${CDN}/bess-cabinet-2_54c824b8.jpeg`,
  `${CDN}/install-team-1_91970553.jpeg`,
  `${CDN}/install-team-2_23aa9cdf.jpeg`,
  `${CDN}/carport-detail-1_34c7c42f.jpeg`,
  `${CDN}/cable-tray-detail_1ddf9610.jpeg`,
  `${CDN}/carport-structure-3_dc2bbd1c.jpeg`,
  `${CDN}/carport-structure-4_cc6ef3f6.jpeg`,
  `${CDN}/carport-underside-3_b58d5713.jpeg`,
  `${CDN}/carport-underside-4_297c327b.jpeg`,
  // New album photos
  `${CDN}/received_788849360726061_ca92b1c0.jpeg`,
  `${CDN}/received_838004412130021_0bff9074.jpeg`,
  `${CDN}/received_860608253106107_74bef87c.jpeg`,
  `${CDN}/received_953338167167889_69f1f0d1.jpeg`,
  `${CDN}/received_1275473157247530_e858ce4f.jpeg`,
  `${CDN}/received_1307276091455018_bfd822e2.jpeg`,
  `${CDN}/received_1671730360935692_4383b8b5.jpeg`,
  `${CDN}/received_4483667365251479_64c29bcb.jpeg`,
  `${CDN}/received_1744928873539515_fbc26c2d.jpeg`,
  `${CDN}/received_24191309453900004_8591d0d3.jpeg`,
  `${CDN}/received_968971135787180_c9ab3134.jpeg`,
  `${CDN}/received_1282589370476708_97781ff2.jpeg`,
  `${CDN}/received_2009519266306215_3caf5665.jpeg`,
  `${CDN}/received_1308771534448072_67348e79.jpeg`,
  `${CDN}/received_1370916548413599_b473b929.jpeg`,
  `${CDN}/received_1917926608836989_c1380667.jpeg`,
  // Rendering photos
  `${CDN}/floating-solar-reservoir-BHro9zmCAKLtycFVXgfe9G.webp`,
  `${CDN}/resort-rooftop-solar-Q4vG7VqDnaYmRWdsyKtp7H.webp`,
  `${CDN}/warehouse-rooftop-solar-eGvaQedufCt28G4VBAahMs.webp`,
  `${CDN}/farm-solar-bess-VwUa48BekdDzTkGLwkeJJX.webp`,
];

const DATASHEET_PANEL = `${CDN}/Neostar_1U_Plus_AIKO_A_MAH78Dw_655W_680W_2465x1134_260418_205454_73a93b47.pdf`;
const DATASHEET_BESS = `${CDN}/GSL_ENERGY_512V_314AH_16kwh_IP65_Ground%26Outdoor_P_260418_205515_847d9d21.pdf`;

const filterOptions = [
  { value: "all", key: "filterAll" },
  { value: "rooftop", label: "Rooftop Solar" },
  { value: "floating", label: "Floating Solar" },
  { value: "carport", label: "Solar Carport" },
  { value: "bess", label: "BESS / ESS" },
];

export default function Projects() {
  const { t } = usePageTranslation("projects");
  useEffect(() => { trackSolutionVisit("solar-carport"); }, []);
  const [filter, setFilter] = useState("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const featured = {
    title: t("featuredTitle"),
    location: t("featuredLocation"),
    type: t("featuredType"),
    capacity: t("featuredCapacity"),
    saving: t("featuredSaving"),
    year: t("featuredYear"),
    owner: t("featuredOwner"),
    desc: t("featuredDesc"),
    image: `${CDN}/carport-wide-1_30e3af4c.jpeg`,
    highlights: [t("featuredHighlight1"), t("featuredHighlight2"), t("featuredHighlight3"), t("featuredHighlight4")],
  };

  const projects = [
    {
      title: t("proj1Title"), location: t("proj1Location"), type: "Rooftop Solar",
      capacity: "Solar Farm", saving: t("proj1Saving"), year: "2025",
      desc: t("proj1Desc"),
      image: `${CDN}/solar-farm-nan-construction-QGr9YXP2AW2qpMnWCVJjj3.webp`,
      tag: "rooftop", isRendering: true,
    },
    {
      title: t("proj2Title"), location: t("proj2Location"), type: "Floating Solar",
      capacity: "2.5 MW", saving: t("proj2Saving"), year: "2024",
      desc: t("proj2Desc"),
      image: `${CDN}/floating-solar-reservoir-BHro9zmCAKLtycFVXgfe9G.webp`,
      tag: "floating", isRendering: true,
    },
    {
      title: t("proj3Title"), location: t("proj3Location"), type: "Solar Carport + BESS",
      capacity: "Solar Carport", saving: t("proj3Saving"), year: "2024",
      desc: t("proj3Desc"),
      image: `${CDN}/carport-structure-2_f0ab2f56.jpeg`,
      tag: "carport",
    },
    {
      title: t("proj4Title"), location: t("proj4Location"), type: "Rooftop + BESS",
      capacity: "500 kW", saving: t("proj4Saving"), year: "2023",
      desc: t("proj4Desc"),
      image: `${CDN}/resort-rooftop-solar-Q4vG7VqDnaYmRWdsyKtp7H.webp`,
      tag: "bess", isRendering: true,
    },
    {
      title: t("proj5Title"), location: t("proj5Location"), type: "Rooftop Solar",
      capacity: "3 MW", saving: t("proj5Saving"), year: "2025",
      desc: t("proj5Desc"),
      image: `${CDN}/warehouse-rooftop-solar-eGvaQedufCt28G4VBAahMs.webp`,
      tag: "rooftop", isRendering: true,
    },
    {
      title: t("proj6Title"), location: t("proj6Location"), type: "Solar + BESS",
      capacity: "350 kW", saving: t("proj6Saving"), year: "2024",
      desc: t("proj6Desc"),
      image: `${CDN}/farm-solar-bess-VwUa48BekdDzTkGLwkeJJX.webp`,
      tag: "bess", isRendering: true,
    },
  ];

  const filtered = filter === "all" ? projects : projects.filter((p) => p.tag === filter);

  const stats = [
    { value: t("stat1Value"), label: t("stat1Label") },
    { value: t("stat2Value"), label: t("stat2Label") },
    { value: t("stat3Value"), label: t("stat3Label") },
    { value: t("stat4Value"), label: t("stat4Label") },
  ];

  return (
    <div>
      {/* ===== FEATURED PROJECT HERO ===== */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-10">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">{t("sectionLabel")}</span>
            <h1 className="font-display text-3xl lg:text-5xl font-bold text-foreground mb-3">
              {t("pageTitle")}<span className="text-gradient-accent">{t("pageTitleAccent")}</span>
            </h1>
            <p className="text-text-secondary max-w-xl">{t("pageDesc")}</p>
          </motion.div>

          {/* Featured Card */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="rounded-2xl border border-border-accent overflow-hidden bg-surface-elevated"
          >
            <div className="grid lg:grid-cols-2">
              <div className="relative aspect-[4/3] lg:aspect-auto overflow-hidden">
	                <img
	                  src={cfImage(featured.image, 960, { quality: 76 })}
	                  srcSet={cfImageSrcSet(featured.image, [480, 720, 960, 1280], { quality: 76 })}
	                  sizes="(min-width: 1024px) 50vw, 100vw"
	                  alt={featured.title}
	                  className="w-full h-full object-cover"
	                  loading="eager"
	                  decoding="async"
	                  fetchPriority="high"
	                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 text-xs font-bold bg-accent-primary text-text-inverse rounded-lg">
                    {t("featuredBadge")}
                  </span>
                </div>
              </div>
              <div className="p-6 lg:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
                  <MapPin className="w-3 h-3" /> {featured.location}
                  <span className="mx-1">·</span>
                  <Calendar className="w-3 h-3" /> {featured.year}
                </div>
                <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-3">{featured.title}</h2>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{featured.desc}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {featured.highlights.map((h) => (
                    <span key={h} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-accent-primary bg-accent-glow rounded-full border border-border-accent">
                      <CheckCircle2 className="w-3 h-3" /> {h}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="font-medium text-foreground">{featured.type}</span>
                  <span>·</span>
                  <span>{featured.capacity}</span>
                  <span>·</span>
                  <span className="text-accent-primary font-medium">{featured.saving}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== STATS STRIP ===== */}
      <section className="py-10 section-alt border-y border-border-subtle">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="text-center">
                <div className="font-display text-xl lg:text-2xl font-bold text-gradient-accent">{stat.value}</div>
                <div className="text-xs text-text-muted">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FILTER + PROJECTS GRID ===== */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          {/* Filter */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <Filter className="w-4 h-4 text-text-muted" />
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3.5 py-1.5 text-xs rounded-lg border transition-colors ${
                  filter === opt.value
                    ? "border-accent-primary bg-accent-glow text-accent-primary font-medium"
                    : "border-border-subtle text-text-muted hover:text-foreground hover:border-border-accent"
                }`}
              >
                {opt.key ? t(opt.key) : opt.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((project, i) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className="group rounded-xl border border-border-subtle bg-surface-elevated overflow-hidden hover:border-border-accent transition-colors"
                >
                  <div className="grid sm:grid-cols-[240px_1fr]">
                    <div className="relative h-48 sm:h-full overflow-hidden">
	                      <img
	                        src={cfImage(project.image, 640)}
	                        srcSet={cfImageSrcSet(project.image, [320, 480, 640, 960])}
	                        sizes="(min-width: 768px) 240px, 100vw"
	                        alt={project.title}
	                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
	                        loading="lazy"
	                        decoding="async"
	                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-accent-primary/90 text-text-inverse rounded-md">
                          {project.type}
                        </span>
                        {project.isRendering ? (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/90 text-white rounded-md">
                            {t("badgeRendering")}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/90 text-white rounded-md">
                            {t("badgeReal")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col justify-center">
                      <h3 className="font-display font-semibold text-foreground text-sm mb-1.5 group-hover:text-accent-primary transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs text-text-muted mb-3 leading-relaxed line-clamp-2">{project.desc}</p>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-text-muted">
                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {project.location}</div>
                        <div className="flex items-center gap-1"><Zap className="w-3 h-3 shrink-0" /> {project.capacity}</div>
                        <div className="flex items-center gap-1"><TrendingUp className="w-3 h-3 shrink-0" /> {project.saving}</div>
                        <div className="flex items-center gap-1"><Calendar className="w-3 h-3 shrink-0" /> {project.year}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ===== MID-PAGE CTA ===== */}
      <section className="py-10 bg-background">
        <div className="container">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={0}
            className="glass-card rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-5"
          >
            <div className="flex-1">
              <h3 className="font-display text-base lg:text-lg font-bold text-foreground mb-1">{t("ctaMidTitle")}</h3>
              <p className="text-text-secondary text-xs">{t("ctaMidDesc")}</p>
            </div>
            <Link href="/solar-carport" className="inline-flex items-center gap-2 px-5 py-2.5 font-display font-semibold btn-accent rounded-lg text-sm whitespace-nowrap shrink-0">
              <Car className="w-4 h-4" /> {t("ctaMidBtn")} <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== EQUIPMENT SECTION ===== */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="max-w-2xl mb-12">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">{t("equipLabel")}</span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">{t("equipTitle")}</h2>
            <p className="text-text-secondary text-sm leading-relaxed">{t("equipDesc")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Solar Panel Card */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={0}
              className="rounded-xl border border-border-subtle bg-surface-elevated p-6 hover:border-border-accent transition-colors"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-lg bg-accent-glow flex items-center justify-center">
                  <Sun className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{t("equipPanel")}</h3>
                  <p className="text-xs text-text-muted">{t("equipPanelModel")}</p>
                </div>
              </div>
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2.5 text-sm">
                  <Zap className="w-4 h-4 text-accent-primary shrink-0" />
                  <span className="text-foreground font-medium">{t("equipPanelPower")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Gauge className="w-4 h-4 text-accent-primary shrink-0" />
                  <span className="text-text-secondary">{t("equipPanelEff")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Shield className="w-4 h-4 text-accent-primary shrink-0" />
                  <span className="text-text-secondary">{t("equipPanelType")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="w-4 h-4 text-accent-primary shrink-0" />
                  <span className="text-text-secondary">{t("equipPanelWarranty")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-text-secondary">{t("equipPanelAward")}</span>
                </div>
              </div>
              <a
                href={DATASHEET_PANEL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-accent-primary border border-border-accent rounded-lg hover:bg-accent-glow transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> {t("equipDatasheet")} — AIKO Neostar
              </a>
            </motion.div>

            {/* BESS Card */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={1}
              className="rounded-xl border border-border-subtle bg-surface-elevated p-6 hover:border-border-accent transition-colors"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-lg bg-accent-glow flex items-center justify-center">
                  <Battery className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground">{t("equipBess")}</h3>
                  <p className="text-xs text-text-muted">{t("equipBessModel")}</p>
                </div>
              </div>
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2.5 text-sm">
                  <Shield className="w-4 h-4 text-accent-primary shrink-0" />
                  <span className="text-foreground font-medium">{t("equipBessChem")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <TrendingUp className="w-4 h-4 text-accent-primary shrink-0" />
                  <span className="text-text-secondary">{t("equipBessCycle")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Zap className="w-4 h-4 text-accent-primary shrink-0" />
                  <span className="text-text-secondary">{t("equipBessIp")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="w-4 h-4 text-accent-primary shrink-0" />
                  <span className="text-text-secondary">{t("equipBessWarranty")}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Gauge className="w-4 h-4 text-accent-primary shrink-0" />
                  <span className="text-text-secondary">{t("equipBessScale")}</span>
                </div>
              </div>
              <a
                href={DATASHEET_BESS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-accent-primary border border-border-accent rounded-lg hover:bg-accent-glow transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> {t("equipDatasheet")} — GSL Energy
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== PHOTO GALLERY ===== */}
      <section className="py-16 lg:py-24 section-alt">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-3">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">{t("galleryLabel")}</span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">{t("galleryTitle")}</h2>
          </motion.div>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center text-text-secondary text-sm mb-8">
            {t("gallerySubtitle")}
          </motion.p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {galleryPhotos.map((src, i) => (
              <motion.button
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i % 4}
	                onClick={() => setLightboxIdx(i)}
	                aria-label={`เปิดรูปผลงาน SIRINX ลำดับที่ ${i + 1}`}
	                className={`rounded-lg overflow-hidden border border-border-subtle hover:border-border-accent transition-all hover:scale-[1.02] ${
	                  i % 3 === 0 ? "aspect-[4/3]" : "aspect-square"
	                }`}
	              >
	                <img
	                  src={cfImage(src, 420)}
	                  srcSet={cfImageSrcSet(src, [220, 320, 420, 640])}
	                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
	                  alt={`SIRINX project photo ${i + 1}`}
	                  className="w-full h-full object-cover"
	                  loading="lazy"
	                  decoding="async"
	                />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LIGHTBOX ===== */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxIdx(null)}
          >
	            <button onClick={() => setLightboxIdx(null)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10" aria-label="ปิดรูปผลงาน">
	              <X className="w-8 h-8" />
	            </button>
	            <button
	              onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + galleryPhotos.length) % galleryPhotos.length); }}
	              className="absolute left-4 text-white/80 hover:text-white z-10"
	              aria-label="รูปผลงานก่อนหน้า"
	            >
	              <ChevronLeft className="w-10 h-10" />
	            </button>
	            <button
	              onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % galleryPhotos.length); }}
	              className="absolute right-4 text-white/80 hover:text-white z-10"
	              aria-label="รูปผลงานถัดไป"
	            >
              <ChevronRight className="w-10 h-10" />
            </button>
            <motion.img
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
	              src={cfImage(galleryPhotos[lightboxIdx], 1600, { quality: 82 })}
	              alt={`SIRINX project photo ${lightboxIdx + 1}`}
	              className="max-w-full max-h-[85vh] object-contain rounded-lg"
	              decoding="async"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 text-white/60 text-sm">
              {lightboxIdx + 1} / {galleryPhotos.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== FINAL CTA ===== */}
      <section className="py-16 lg:py-24 bg-background relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow to-transparent" />
        <div className="container relative text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">{t("ctaFinalTitle")}</h2>
            <p className="text-text-secondary text-sm mb-7 max-w-lg mx-auto">{t("ctaFinalDesc")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg">
                {t("ctaFinalBtn1")} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/assessment" className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent-outline rounded-lg">
                {t("ctaFinalBtn2")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
