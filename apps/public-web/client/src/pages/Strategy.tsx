/*
 * Strategy / Digital Marketing Toolkit Page
 * Design: Kinetic Infrastructure 2.0 — Dark-first, Diagonal energy flow
 * Features: Carousel for 7 prompt templates, Lightbox, SWOT visual, CTA
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, X, ChevronLeft, ChevronRight,
  Lightbulb, FileText, Instagram, LayoutGrid,
  PenTool, Video, MessageCircle, Zap, Target,
  TrendingUp, Shield, AlertTriangle, ChevronDown, ChevronUp
} from "lucide-react";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const toolkitItems = [
  {
    id: 1,
    title: "Digital Product Idea Generator",
    titleTh: "เครื่องมือสร้างไอเดียผลิตภัณฑ์ดิจิทัล",
    desc: "สร้าง 5 ไอเดียผลิตภัณฑ์ดิจิทัลที่ทำกำไรสูงสุด จัดอันดับตามความง่ายในการสร้างและศักยภาพรายได้",
    icon: Lightbulb,
    color: "from-amber-500 to-orange-600",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/FB_IMG_1775885863875_30475f7b.jpg",
  },
  {
    id: 2,
    title: "Product Outline Builder",
    titleTh: "เครื่องมือสร้างโครงร่างผลิตภัณฑ์",
    desc: "สร้างโครงร่างผลิตภัณฑ์ดิจิทัลครบถ้วน ตั้งแต่ชื่อ สารบัญ ไปจนถึง Quick Win สำหรับผู้ซื้อ",
    icon: FileText,
    color: "from-cyan-500 to-teal-600",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/FB_IMG_1775885869355_b57fba4c.jpg",
  },
  {
    id: 3,
    title: "Instagram Bio Converter",
    titleTh: "เครื่องมือสร้าง Bio Instagram",
    desc: "เขียน Bio Instagram 5 แบบที่ขายได้โดยไม่ดูขายของ อบอุ่น จริงใจ ไม่เป็นทางการเกินไป",
    icon: Instagram,
    color: "from-pink-500 to-rose-600",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/FB_IMG_1775885874696_f25f52ab.jpg",
  },
  {
    id: 4,
    title: "Carousel Content Machine",
    titleTh: "เครื่องมือสร้าง Carousel 9 สไลด์",
    desc: "สร้าง Instagram Carousel 9 สไลด์ที่ขายได้โดยไม่รู้สึกเหมือนโฆษณา มี Hook, Value, Social Proof, CTA",
    icon: LayoutGrid,
    color: "from-violet-500 to-purple-600",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/FB_IMG_1775885880725_0a14128b.jpg",
  },
  {
    id: 5,
    title: "Sales Caption Writer",
    titleTh: "เครื่องมือเขียน Caption ขาย",
    desc: "เขียน Caption Instagram ที่ขายได้โดยไม่ดูขายของ เริ่มจาก Hook, เรื่องราว, ประโยชน์, Social Proof, CTA",
    icon: PenTool,
    color: "from-emerald-500 to-green-600",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/FB_IMG_1775885884784_d66afe94.jpg",
  },
  {
    id: 6,
    title: "Story Selling Script",
    titleTh: "สคริปต์ Reel 60 วินาที",
    desc: "เขียนสคริปต์ Instagram Reel 60 วินาทีที่ขายผ่านการเล่าเรื่อง ไม่ Hard Sell ไม่ Fake Hype",
    icon: Video,
    color: "from-blue-500 to-indigo-600",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/FB_IMG_1775885889652_bae78f66.jpg",
  },
  {
    id: 7,
    title: "DM Automation Sequence",
    titleTh: "ระบบ DM อัตโนมัติ 3 ข้อความ",
    desc: "สร้างลำดับ DM 3 ข้อความ ส่ง Freebie, แชร์เรื่องราว, ชวนซื้อ อบอุ่นเหมือนเพื่อนที่อยากช่วย",
    icon: MessageCircle,
    color: "from-orange-500 to-red-600",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/FB_IMG_1775885893958_021d4da7.jpg",
  },
];

const swotData = {
  strengths: [
    "โครงสร้างพื้นฐาน Solar ครบวงจร",
    "ทีมวิศวกรเฉพาะทาง + AI Integration",
    "รูปแบบการลงทุนที่ยืดหยุ่น",
    "Digital Strategy Toolkit 7 เครื่องมือ",
    "ระบบ Monitoring แบบ Real-time",
  ],
  weaknesses: [
    "แบรนด์ยังใหม่ในตลาด",
    "ต้องการ Case Study เพิ่มเติม",
    "ขอบเขตภูมิศาสตร์ยังจำกัด",
  ],
  opportunities: [
    "ตลาดโซลาร์ไทยเติบโต 20%+ ต่อปี",
    "นโยบาย Net Zero ของรัฐบาล",
    "BOI สนับสนุนพลังงานสะอาด",
    "AI + IoT เปลี่ยนเกมการจัดการพลังงาน",
    "Community Energy Model",
  ],
  threats: [
    "คู่แข่งรายใหญ่มีงบการตลาดสูง",
    "ราคาแผงโซลาร์ผันผวน",
    "กฎระเบียบที่เปลี่ยนแปลง",
  ],
};

function Lightbox({ images, currentIndex, onClose, onPrev, onNext }: {
  images: typeof toolkitItems;
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = images[currentIndex];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" aria-label="ปิดรูป Toolkit">
        <X className="w-6 h-6" />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" aria-label="รูป Toolkit ก่อนหน้า">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors" aria-label="รูป Toolkit ถัดไป">
        <ChevronRight className="w-6 h-6" />
      </button>
      <motion.div
        key={currentIndex}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={cfImage(item.image, 1400, { quality: 82 })}
          alt={item.title}
          className="w-full rounded-2xl shadow-2xl"
          decoding="async"
        />
        <div className="mt-4 text-center">
          <h3 className="text-white font-display text-xl font-bold">{item.title}</h3>
          <p className="text-white/70 text-sm mt-1">{item.titleTh}</p>
          <p className="text-white/50 text-xs mt-2">{currentIndex + 1} / {images.length}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SwotCard({ title, items, icon: Icon, gradient, delay }: {
  title: string; items: string[]; icon: React.ElementType; gradient: string; delay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? items : items.slice(0, 3);

  return (
    <motion.div
      initial="hidden" whileInView="visible" viewport={{ once: true }}
      variants={fadeUp} custom={delay}
      className="rounded-2xl border border-border-subtle bg-surface-elevated p-6 hover:border-border-accent transition-all group"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-display font-bold text-foreground text-lg mb-3">{title}</h3>
      <ul className="space-y-2">
        {displayItems.map((item, i) => (
          <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      {items.length > 3 && (
	        <button
	          onClick={() => setExpanded(!expanded)}
	          aria-expanded={expanded}
	          aria-label={expanded ? `ย่อรายการ ${title}` : `ขยายรายการ ${title}`}
	          className="mt-3 text-xs text-accent-primary flex items-center gap-1 hover:underline"
	        >
          {expanded ? "แสดงน้อยลง" : `ดูเพิ่มอีก ${items.length - 3} รายการ`}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}
    </motion.div>
  );
}

export default function Strategy() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeToolkit, setActiveToolkit] = useState(0);

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + toolkitItems.length) % toolkitItems.length : null));
  }, []);
  const nextImage = useCallback(() => {
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % toolkitItems.length : null));
  }, []);

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
	          <img
	            src={cfImage("https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/sirinx-smart-energy-JXCSVMQTKJHxRxSagYajgy.webp", 1280, { quality: 76 })}
	            srcSet={cfImageSrcSet("https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/sirinx-smart-energy-JXCSVMQTKJHxRxSagYajgy.webp", [640, 960, 1280, 1600], { quality: 76 })}
	            sizes="100vw"
	            alt="Smart Energy Strategy"
	            className="w-full h-full object-cover"
	            loading="eager"
	            decoding="async"
	            fetchPriority="high"
	          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
        <div className="container relative z-10 pt-28 pb-16">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-2xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-4 block">
              Digital Strategy & Insights
            </span>
            <h1 className="font-display text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              กลยุทธ์ดิจิทัล<br />
              <span className="text-gradient-accent">สำหรับธุรกิจพลังงาน</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-xl">
              ผสานองค์ความรู้ด้าน Solar Infrastructure เข้ากับ Digital Marketing Strategy
              เพื่อสร้างการเติบโตที่ยั่งยืนและวัดผลได้จริง
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#toolkit" className="inline-flex items-center gap-2 px-6 py-3 font-display font-semibold btn-accent rounded-lg">
                ดู Toolkit ทั้งหมด <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#swot" className="inline-flex items-center gap-2 px-6 py-3 font-display font-semibold btn-accent-outline rounded-lg">
                SWOT Analysis
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== DIGITAL MARKETING TOOLKIT ===== */}
      <section id="toolkit" className="py-20 lg:py-28 bg-background">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="max-w-2xl mb-14">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              Digital Marketing Toolkit
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              7 เครื่องมือ Prompt Template<br />สำหรับ Digital Product Strategy
            </h2>
            <p className="text-text-secondary leading-relaxed">
              ชุดเครื่องมือ AI Prompt ที่ออกแบบมาเพื่อช่วยสร้าง Digital Product, Content Strategy,
              และ Sales Funnel อย่างเป็นระบบ คลิกที่การ์ดเพื่อดูรายละเอียดเต็ม
            </p>
          </motion.div>

          {/* Toolkit Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {toolkitItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i % 4}
                className="group cursor-pointer"
                onClick={() => openLightbox(i)}
              >
                <div className="rounded-2xl border border-border-subtle bg-surface-elevated overflow-hidden hover:border-border-accent hover:shadow-lg hover:shadow-accent-glow transition-all">
                  {/* Image Preview */}
                  <div className="relative aspect-square overflow-hidden">
	                    <img
	                      src={cfImage(item.image, 420)}
	                      srcSet={cfImageSrcSet(item.image, [220, 320, 420, 640])}
	                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
	                      alt={item.title}
	                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
	                      loading="lazy"
	                      decoding="async"
	                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-white/80 text-xs font-medium">คลิกเพื่อดูเต็ม</span>
                    </div>
                    {/* Number badge */}
                    <div className={`absolute top-3 left-3 w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-sm font-bold">{item.id}</span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-4 h-4 text-accent-primary" />
                      <h3 className="font-display font-semibold text-foreground text-sm leading-tight">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TOOLKIT DETAIL CAROUSEL ===== */}
      <section className="py-16 lg:py-24 section-alt relative">
        <div className="divider-accent absolute top-0 left-0 right-0" />
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">
              เจาะลึกแต่ละเครื่องมือ
            </h2>
            <p className="text-text-secondary text-sm">เลือกเครื่องมือเพื่อดูรายละเอียดและตัวอย่างการใช้งาน</p>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-8">
            {toolkitItems.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setActiveToolkit(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeToolkit === i
                    ? "bg-accent-primary text-text-inverse shadow-lg shadow-accent-glow"
                    : "border border-border-subtle text-text-secondary hover:text-foreground hover:border-border-accent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.title}</span>
                <span className="sm:hidden">{item.id}</span>
              </button>
            ))}
          </div>

          {/* Detail Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeToolkit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-2 gap-8 items-center"
            >
              {/* Image */}
              <div
                className="relative rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(activeToolkit)}
              >
	                <img
	                  src={cfImage(toolkitItems[activeToolkit].image, 960)}
	                  srcSet={cfImageSrcSet(toolkitItems[activeToolkit].image, [480, 720, 960, 1280])}
	                  sizes="(min-width: 1024px) 50vw, 100vw"
	                  alt={toolkitItems[activeToolkit].title}
	                  className="w-full rounded-2xl group-hover:scale-[1.02] transition-transform duration-500"
	                  loading="lazy"
	                  decoding="async"
	                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium text-sm bg-black/50 px-4 py-2 rounded-lg">
                    คลิกเพื่อดูขนาดเต็ม
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${toolkitItems[activeToolkit].color} flex items-center justify-center shadow-lg`}>
                  {(() => { const Icon = toolkitItems[activeToolkit].icon; return <Icon className="w-6 h-6 text-white" />; })()}
                </div>
                <div>
                  <span className="text-xs text-accent-secondary font-medium tracking-wider uppercase">
                    เครื่องมือที่ {toolkitItems[activeToolkit].id}
                  </span>
                  <h3 className="font-display text-2xl lg:text-3xl font-bold text-foreground mt-1">
                    {toolkitItems[activeToolkit].title}
                  </h3>
                  <p className="text-text-muted text-sm mt-1">{toolkitItems[activeToolkit].titleTh}</p>
                </div>
                <p className="text-text-secondary leading-relaxed">
                  {toolkitItems[activeToolkit].desc}
                </p>
                <div className="flex gap-3">
	                  <button
	                    onClick={() => setActiveToolkit((activeToolkit - 1 + toolkitItems.length) % toolkitItems.length)}
	                    className="p-2 rounded-lg border border-border-subtle hover:border-border-accent hover:bg-accent-glow transition-colors"
	                    aria-label="เครื่องมือก่อนหน้า"
	                  >
                    <ChevronLeft className="w-5 h-5 text-text-secondary" />
                  </button>
	                  <button
	                    onClick={() => setActiveToolkit((activeToolkit + 1) % toolkitItems.length)}
	                    className="p-2 rounded-lg border border-border-subtle hover:border-border-accent hover:bg-accent-glow transition-colors"
	                    aria-label="เครื่องมือถัดไป"
	                  >
                    <ChevronRight className="w-5 h-5 text-text-secondary" />
                  </button>
                  <span className="flex items-center text-xs text-text-muted ml-2">
                    {activeToolkit + 1} / {toolkitItems.length}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ===== SWOT ANALYSIS ===== */}
      <section id="swot" className="py-20 lg:py-28 bg-background">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              Strategic Analysis
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              SWOT Analysis
            </h2>
            <p className="text-text-secondary">
              วิเคราะห์จุดแข็ง จุดอ่อน โอกาส และภัยคุกคามของ SIRINX
              จากการศึกษาคู่แข่ง Top 100 แบรนด์โซลาร์เซลล์ไทยและระดับโลก
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            <SwotCard
              title="Strengths — จุดแข็ง"
              items={swotData.strengths}
              icon={Zap}
              gradient="from-emerald-500 to-green-600"
              delay={0}
            />
            <SwotCard
              title="Weaknesses — จุดอ่อน"
              items={swotData.weaknesses}
              icon={Target}
              gradient="from-amber-500 to-orange-600"
              delay={1}
            />
            <SwotCard
              title="Opportunities — โอกาส"
              items={swotData.opportunities}
              icon={TrendingUp}
              gradient="from-cyan-500 to-blue-600"
              delay={2}
            />
            <SwotCard
              title="Threats — ภัยคุกคาม"
              items={swotData.threats}
              icon={AlertTriangle}
              gradient="from-red-500 to-rose-600"
              delay={3}
            />
          </div>
        </div>
      </section>

      {/* ===== COMPETITIVE INSIGHTS ===== */}
      <section className="py-16 lg:py-24 section-alt relative">
        <div className="divider-accent absolute top-0 left-0 right-0" />
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">
              Competitive Intelligence
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Insights จากคู่แข่งระดับโลก
            </h2>
            <p className="text-text-secondary">
              สิ่งที่เราเรียนรู้จากการวิเคราะห์แบรนด์โซลาร์ชั้นนำ เพื่อนำมาพัฒนา SIRINX ให้ดียิ่งขึ้น
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Interactive Solar Calculator", desc: "SunPower & Tesla ใช้ calculator เป็น lead magnet หลัก — ลูกค้าได้ข้อมูลทันที", icon: "🧮" },
              { title: "Video Storytelling", desc: "Enphase & SolarEdge ใช้ video เล่าเรื่อง brand ได้ดี — สร้าง emotional connection", icon: "🎬" },
              { title: "Progressive Disclosure", desc: "แสดงข้อมูลซับซ้อนทีละชั้น — ไม่ overwhelm ผู้ใช้", icon: "📊" },
              { title: "Community Energy", desc: "Smart Microgrid & Community Resilience เป็น differentiator ที่แข็งแกร่ง", icon: "🏘️" },
              { title: "ESG Integration", desc: "First Solar & Banpu NEXT ผสาน ESG เข้ากับ brand narrative อย่างเป็นธรรมชาติ", icon: "🌱" },
              { title: "AI-Powered O&M", desc: "ระบบ Predictive Maintenance ด้วย AI ลดต้นทุนและเพิ่ม uptime", icon: "🤖" },
            ].map((insight, i) => (
              <motion.div
                key={insight.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i % 3}
                className="p-6 rounded-2xl border border-border-subtle bg-surface-elevated hover:border-border-accent transition-all"
              >
                <span className="text-3xl mb-4 block">{insight.icon}</span>
                <h3 className="font-display font-semibold text-foreground mb-2">{insight.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{insight.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 lg:py-28 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow to-transparent" />
        <div className="container relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl lg:text-5xl font-bold text-foreground mb-4">
              พร้อมนำกลยุทธ์ไปใช้จริง?
            </h2>
            <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto">
              ปรึกษาทีม SIRINX เพื่อวางแผน Solar + Digital Strategy ที่เหมาะกับธุรกิจของคุณ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 font-display font-semibold btn-accent rounded-lg text-lg">
                ปรึกษาฟรี <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/assessment" className="inline-flex items-center justify-center gap-2 px-8 py-4 font-display font-semibold btn-accent-outline rounded-lg text-lg">
                ประเมินความคุ้มค่า
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={toolkitItems}
            currentIndex={lightboxIndex}
            onClose={closeLightbox}
            onPrev={prevImage}
            onNext={nextImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
