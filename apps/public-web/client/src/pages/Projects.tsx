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
  getProjectEvidenceBadgeKey,
  type PublicProjectEvidenceState,
} from "@shared/publicProjectContent";
import { holatelProjectMedia } from "@shared/holatelProjectMedia";
import { ruenphaeProjectMedia } from "@shared/ruenphaeProjectMedia";
import ProjectImage from "@/components/ProjectImage";
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

/* Curated gallery: only privacy-reviewed real installation photos. */
const galleryPhotos = [
  ...ruenphaeProjectMedia.map(photo => photo.src),
  ...holatelProjectMedia.map(photo => photo.src),
];

const filterOptions = [
  { value: "all", key: "filterAll" },
  { value: "rooftop", label: "Rooftop Solar" },
  { value: "floating", label: "Floating Solar" },
  { value: "carport", label: "Solar Carport" },
  { value: "bess", label: "BESS / ESS" },
];

function ProjectEvidenceBadge({ projectId, projectStatus, t }: {
  projectId?: string;
  projectStatus?: PublicProjectEvidenceState;
  t: (key: string) => string;
}) {
  const labelKey = getProjectEvidenceBadgeKey(projectId, projectStatus);
  const colorByStatus: Record<string, string> = {
    badgeVerifiedLive: "bg-emerald-500/90",
    badgeUnderConstruction: "bg-sky-500/90",
    badgeConceptSimulation: "bg-slate-500/90",
    badgePendingEvidence: "bg-amber-500/90",
  };
  const color = colorByStatus[labelKey] ?? "bg-amber-500/90";
  return (
    <span aria-label={t(labelKey)} className={`px-2 py-0.5 text-[10px] font-medium ${color} text-white rounded-md`}>
      {t(labelKey)}
    </span>
  );
}

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
    image: "/assets/projects/ruenphae/20260924/1000076001.jpg",
    highlights: [t("featuredHighlight1"), t("featuredHighlight2"), t("featuredHighlight3"), t("featuredHighlight4")],
  };

  const projects = [
    {
      projectId: "holatel-rim-nan",
      title: t("proj1Title"), location: t("proj1Location"), type: "Solar Rooftop",
      capacity: "Installed system", saving: t("proj1Saving"), year: t("installationComplete"),
      desc: t("proj1Desc"),
      image: "/assets/projects/holatel/20260924/1000075878.jpg",
      tag: "rooftop",
      projectStatus: "VERIFIED_LIVE" as const,
    },
    {
      title: t("proj2Title"), location: t("proj2Location"), type: "Floating Solar",
      capacity: "Proposed system", saving: t("proj2Saving"), year: t("conceptYear"),
      desc: t("proj2Desc"),
      image: `${CDN}/floating-solar-reservoir-BHro9zmCAKLtycFVXgfe9G.webp`,
      tag: "floating", projectStatus: "CONCEPT / SIMULATION" as const,
    },
    {
      projectId: "ruenphae-royal-park",
      title: t("proj3Title"), location: t("proj3Location"), type: "Solar Carport + BESS",
      capacity: "Solar Carport", saving: t("proj3Saving"), year: t("yearUnderReview"),
      desc: t("proj3Desc"),
      image: "/assets/projects/ruenphae/20260924/1000076001.jpg",
      tag: "carport",
      projectStatus: "VERIFIED_LIVE" as const,
    },
    {
      title: t("proj4Title"), location: t("proj4Location"), type: "Rooftop + BESS",
      capacity: "Proposed system", saving: t("proj4Saving"), year: t("conceptYear"),
      desc: t("proj4Desc"),
      image: `${CDN}/resort-rooftop-solar-Q4vG7VqDnaYmRWdsyKtp7H.webp`,
      tag: "bess", projectStatus: "CONCEPT / SIMULATION" as const,
    },
    {
      title: t("proj5Title"), location: t("proj5Location"), type: "Rooftop Solar",
      capacity: "Proposed system", saving: t("proj5Saving"), year: t("conceptYear"),
      desc: t("proj5Desc"),
      image: `${CDN}/warehouse-rooftop-solar-eGvaQedufCt28G4VBAahMs.webp`,
      tag: "rooftop", projectStatus: "CONCEPT / SIMULATION" as const,
    },
    {
      title: t("proj6Title"), location: t("proj6Location"), type: "Solar + BESS",
      capacity: "Proposed system", saving: t("proj6Saving"), year: t("conceptYear"),
      desc: t("proj6Desc"),
      image: `${CDN}/farm-solar-bess-VwUa48BekdDzTkGLwkeJJX.webp`,
      tag: "bess", projectStatus: "CONCEPT / SIMULATION" as const,
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
	                <ProjectImage
	                  fallbackLabel={t("imageUnavailable")}
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
                  <div className="mt-2">
                    <ProjectEvidenceBadge
                      projectId="ruenphae-royal-park"
                      t={t}
                    />
                  </div>
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
                <Link
                  href="/projects/ruenphae-royal-park"
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg border border-border-accent px-4 py-2 text-xs font-semibold text-accent-primary transition-colors hover:bg-accent-glow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
                >
                  ดูรายละเอียดโครงการ <ArrowRight className="h-3.5 w-3.5" />
                </Link>
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
	                      <ProjectImage
	                        fallbackLabel={t("imageUnavailable")}
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
                        <ProjectEvidenceBadge projectId={project.projectId} projectStatus={project.projectStatus} t={t} />
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
                      {project.projectId ? (
                        <Link
                          href={`/projects/${project.projectId}`}
                          className="mt-4 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-accent-primary transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
                        >
                          ดูรายละเอียด <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
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
              <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-text-muted border border-border-subtle rounded-lg">
                <Download className="w-3.5 h-3.5" /> {t("equipDatasheet")}
              </div>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-text-muted border border-border-subtle rounded-lg">
                <Download className="w-3.5 h-3.5" /> {t("equipDatasheet")}
              </div>
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
