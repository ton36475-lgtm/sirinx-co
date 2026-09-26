import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "@/lib/static-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/heroSlideshow";

// ─── Solution categories & slide data ───────────────────────────────
export type SolutionCategory =
  | "solar-carport"
  | "rooftop-solar"
  | "floating-solar"
  | "bess"
  | "hospitality"
  | "ai-energy";

interface HeroSlide {
  id: string;
  category: SolutionCategory;
  image: string;
  alt: string;
  width: number;
  height: number;
  imageSet?: {
    avifSrcSet: string;
    fallback: string;
    height: number;
    jpgSrcSet: string;
    sizes: string;
    width: number;
  };
  badge: string;
  headline: string;
  highlightLine: string;
  description: string;
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

const ALL_SLIDES: HeroSlide[] = [
  {
    id: "carport-aerial",
    category: "solar-carport",
    image: "/assets/projects/ruenphae/20260924/1000076004.jpg",
    alt: "ภาพมุมสูงของ Solar Carport และพื้นที่จอดรถ โรงแรมเรือนแพ รอยัลปาร์ค",
    width: 721,
    height: 1280,
    badge: "ผลงานติดตั้งจริง",
    headline: "Solar Carport",
    highlightLine: "โรงแรมเรือนแพ รอยัลปาร์ค",
    description: "ภาพมุมสูงจาก Solar Carport และพื้นที่จอดรถที่ติดตั้งจริง",
    cta: { label: "ดูผลงานติดตั้งจริง", href: "/projects/ruenphae-royal-park" },
    secondaryCta: { label: "ประเมินโครงการของคุณ", href: "/contact?interest=solar-carport" },
  },
  {
    id: "rooftop-factory",
    category: "rooftop-solar",
    image: "/assets/projects/ruenphae/20260924/1000076003.jpg",
    alt: "ภาพรวมแผงโซลาร์รอบสระว่ายน้ำ โรงแรมเรือนแพ รอยัลปาร์ค",
    width: 1280,
    height: 721,
    badge: "ผลงานติดตั้งจริง",
    headline: "Rooftop Solar",
    highlightLine: "ระบบพลังงานบนอาคารจริง",
    description: "แผงโซลาร์บริเวณสระว่ายน้ำและหลังคาอาคารของโรงแรมเรือนแพ รอยัลปาร์ค",
    cta: { label: "ดูภาพผลงาน", href: "/projects/ruenphae-royal-park" },
    secondaryCta: { label: "ขอใบเสนอราคา", href: "/contact?interest=rooftop-solar" },
  },
  {
    id: "hotel-resort",
    category: "hospitality",
    image: "/assets/projects/holatel/20260924/1000075878.jpg",
    alt: "ภาพแผงโซลาร์บนหลังคาโรงแรมโฮลาเทล",
    width: 1280,
    height: 721,
    badge: "ผลงานติดตั้งจริง",
    headline: "Solar Rooftop",
    highlightLine: "โรงแรมโฮลาเทล",
    description: "ภาพแผงโซลาร์บนหลังคาที่ติดตั้งแล้ว โดยไม่แสดงตัวเลขหรือผลประหยัดที่ยังไม่ผ่านการตรวจหลักฐาน",
    cta: { label: "ดูผลงานโรงแรม", href: "/projects/holatel-rim-nan" },
    secondaryCta: { label: "ปรึกษาโซลูชันโรงแรม", href: "/contact?interest=hospitality" },
  },
  {
    id: "carport-realistic",
    category: "solar-carport",
    image: "/assets/projects/ruenphae/20260924/1000075999.jpg",
    alt: "Solar Carport บริเวณทางเข้าโรงแรมเรือนแพ รอยัลปาร์ค",
    width: 721,
    height: 1280,
    badge: "ผลงานติดตั้งจริง",
    headline: "Solar Carport",
    highlightLine: "ทางเข้าและพื้นที่จอดรถจริง",
    description: "ภาพ Solar Carport บริเวณทางเข้าโรงแรมเรือนแพ รอยัลปาร์ค ใช้แสดงรูปแบบระบบจริงโดยไม่อ้างค่ากำลังหรือผลลัพธ์ที่ยังไม่ยืนยัน",
    cta: { label: "เปิดชุดภาพโรงแรม", href: "/projects/ruenphae-royal-park" },
    secondaryCta: { label: "นัดสำรวจหน้างาน", href: "/contact?interest=solar-carport" },
  },
  {
    id: "bess-realistic",
    category: "bess",
    image: "/assets/projects/holatel/20260924/1000075879.jpg",
    alt: "ภาพระยะใกล้ของแผงโซลาร์บนหลังคาโรงแรมโฮลาเทล",
    width: 1280,
    height: 721,
    badge: "ภาพระบบจริง",
    headline: "ระบบพลังงาน",
    highlightLine: "รายละเอียดงานติดตั้ง",
    description: "ภาพระยะใกล้ของระบบพลังงานจริง พร้อม fallback และไม่แสดงข้อมูลอุปกรณ์ที่ยังไม่ผ่านการอนุมัติ",
    cta: { label: "ดูรายละเอียดโครงการ", href: "/projects/holatel-rim-nan" },
    secondaryCta: { label: "ปรึกษาระบบพลังงาน", href: "/contact?interest=bess" },
  },
];

// ─── localStorage preference helpers ────────────────────────────────
const PREF_KEY = "sirinx_solution_prefs";

interface SolutionPrefs {
  [category: string]: number; // visit count
}

export function trackSolutionVisit(category: SolutionCategory) {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    const prefs: SolutionPrefs = raw ? JSON.parse(raw) : {};
    prefs[category] = (prefs[category] || 0) + 1;
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage unavailable — silent fail
  }
}

function getPreferredOrder(): SolutionCategory[] {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return [];
    const prefs: SolutionPrefs = JSON.parse(raw);
    return Object.entries(prefs)
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat as SolutionCategory);
  } catch {
    return [];
  }
}

function getPersonalizedSlides(): HeroSlide[] {
  const preferred = getPreferredOrder();
  if (preferred.length === 0) return ALL_SLIDES;

  // Sort: slides matching top preferred categories come first,
  // then remaining slides in default order
  const prioritized: HeroSlide[] = [];
  const remaining: HeroSlide[] = [];

  // Group slides by category
  const byCategory = new Map<SolutionCategory, HeroSlide[]>();
  for (const slide of ALL_SLIDES) {
    const arr = byCategory.get(slide.category) || [];
    arr.push(slide);
    byCategory.set(slide.category, arr);
  }

  // Add preferred categories first (max 2 slides per category to avoid repetition)
  const added = new Set<string>();
  for (const cat of preferred) {
    const catSlides = byCategory.get(cat) || [];
    let count = 0;
    for (const s of catSlides) {
      if (!added.has(s.id) && count < 2) {
        prioritized.push(s);
        added.add(s.id);
        count++;
      }
    }
  }

  // Add remaining slides
  for (const slide of ALL_SLIDES) {
    if (!added.has(slide.id)) {
      remaining.push(slide);
    }
  }

  return [...prioritized, ...remaining];
}

// ─── Slideshow interval (ms) ────────────────────────────────────────
const INTERVAL = 6000;
const FIRST_ROTATION_DELAY = 12000;

// ─── Component ──────────────────────────────────────────────────────
export default function HeroSlideshow() {
  const [slides] = useState<HeroSlide[]>(() => getPersonalizedSlides());
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialRotationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t } = usePageTranslation("heroSlideshow");

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  // Auto-rotation
  useEffect(() => {
    if (isPaused) return;
    if (typeof window !== "undefined") {
      const lowMotionMobile = window.matchMedia(
        "(max-width: 767px), (prefers-reduced-motion: reduce)"
      );
      if (lowMotionMobile.matches) return;
    }

    initialRotationRef.current = setTimeout(() => {
      next();
      timerRef.current = setInterval(next, INTERVAL);
    }, FIRST_ROTATION_DELAY);
    return () => {
      if (initialRotationRef.current) clearTimeout(initialRotationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, next]);

  const slide = slides[current];
  const slideAltKey = `hero.${slide.id}.alt`;
  const slideAlt = t(slideAltKey) !== slideAltKey ? t(slideAltKey) : slide.alt;

  return (
    <section
      className="relative min-h-[92vh] flex items-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background images with crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {slide.imageSet ? (
            <picture className="block h-full w-full">
              <source
                type="image/avif"
                srcSet={slide.imageSet.avifSrcSet}
                sizes={slide.imageSet.sizes}
              />
              <img
                src={slide.imageSet.fallback}
                srcSet={slide.imageSet.jpgSrcSet}
                sizes={slide.imageSet.sizes}
                alt={slideAlt}
                width={slide.imageSet.width}
                height={slide.imageSet.height}
                className="h-full w-full object-cover"
                loading={current === 0 ? "eager" : "lazy"}
                fetchPriority={current === 0 ? "high" : "low"}
                decoding={current === 0 ? "sync" : "async"}
              />
            </picture>
          ) : (
            <img
              src={slide.image}
              alt={slideAlt}
              width={slide.width}
              height={slide.height}
              className="w-full h-full object-cover"
              loading={current === 0 ? "eager" : "lazy"}
              fetchPriority={current === 0 ? "high" : "low"}
              decoding={current === 0 ? "sync" : "async"}
            />
          )}
          {/* Gradient overlays for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/75 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container relative z-10 pt-20">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id + "-content"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Badge */}
              <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-accent-primary bg-accent-glow border border-border-accent rounded-full mb-6">
                {t(`hero.${slide.id}.badge`) !== `hero.${slide.id}.badge`
                  ? t(`hero.${slide.id}.badge`)
                  : slide.badge}
              </span>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-[1.1] mb-2">
                {t(`hero.${slide.id}.headline`) !== `hero.${slide.id}.headline`
                  ? t(`hero.${slide.id}.headline`)
                  : slide.headline}
              </h1>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gradient-accent leading-[1.1] mb-6">
                {t(`hero.${slide.id}.highlight`) !==
                `hero.${slide.id}.highlight`
                  ? t(`hero.${slide.id}.highlight`)
                  : slide.highlightLine}
              </h2>

              {/* Description */}
              <p className="text-lg sm:text-xl text-text-secondary leading-relaxed mb-8 max-w-xl">
                {t(`hero.${slide.id}.desc`) !== `hero.${slide.id}.desc`
                  ? t(`hero.${slide.id}.desc`)
                  : slide.description}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={slide.cta.href}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg"
                >
                  {t(`hero.${slide.id}.cta`) !== `hero.${slide.id}.cta`
                    ? t(`hero.${slide.id}.cta`)
                    : slide.cta.label}{" "}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {slide.secondaryCta && (
                  <Link
                    href={slide.secondaryCta.href}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent-outline rounded-lg"
                  >
                    {t(`hero.${slide.id}.cta2`) !== `hero.${slide.id}.cta2`
                      ? t(`hero.${slide.id}.cta2`)
                      : slide.secondaryCta.label}
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/40 backdrop-blur-sm border border-border-subtle hover:bg-background/60 transition-colors hidden sm:flex items-center justify-center"
        aria-label={t("hero.prev")}
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background/40 backdrop-blur-sm border border-border-subtle hover:bg-background/60 transition-colors hidden sm:flex items-center justify-center"
        aria-label={t("hero.next")}
      >
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
            aria-label={`${t("hero.goToSlide")} ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === current
                  ? "h-2.5 w-5 bg-accent-primary"
                  : "h-2.5 w-2.5 bg-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-8 right-6 z-20 text-xs text-text-muted font-mono hidden sm:block">
        {String(current + 1).padStart(2, "0")} /{" "}
        {String(slides.length).padStart(2, "0")}
      </div>
    </section>
  );
}
