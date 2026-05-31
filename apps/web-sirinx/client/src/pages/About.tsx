/**
 * SIRINX About — Second Pass Refinement
 * Tighter spacing, Solar Carport in milestones, trust-first CEO section
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { trackSolutionVisit } from "@/components/HeroSlideshow";
import { cfImage, cfImageSrcSet } from "@/lib/cfImage";
import {
  ArrowRight, Target, Eye, Cpu, Users, ShieldCheck, Phone, Mail, MapPin,
  Car, Zap
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv";
const LOGO_URL = `${CDN}/photo_2026-03-24_06-45-58_293d121c.jpg`;
const HERO = `${CDN}/hero-about-3Trik9L6DrdCwCcjCt2KVz.webp`;

const values = [
  { icon: Cpu, title: "Engineering-First", desc: "ทุกโซลูชันเริ่มจากวิศวกรรมที่แม่นยำ ไม่ใช่การขาย" },
  { icon: ShieldCheck, title: "ความน่าเชื่อถือ", desc: "โปร่งใส ตรงไปตรงมา ไม่สัญญาสิ่งที่ทำไม่ได้" },
  { icon: Target, title: "ผลลัพธ์ที่วัดได้", desc: "ทุกโครงการมี KPI ชัดเจน ติดตามผลได้ตลอดอายุระบบ" },
  { icon: Users, title: "พันธมิตรระยะยาว", desc: "ดูแลตลอดอายุการใช้งาน 25+ ปี ไม่ใช่แค่ขายและติดตั้ง" },
];

const milestones = [
  { year: "2023", event: "ก่อตั้ง SIRINX โดยคุณ Pitoon Yingyosruangrong ด้วยวิสัยทัศน์ Solar Digital Agentic Company" },
  { year: "2024", event: "Solar Farm Node 1 — โรงแรมเรือนแพ รอยัลปาร์ค พิษณุโลก ติดตั้งและเปิดใช้งาน" },
  { year: "2025", event: "Solar Farm Node 2 — โรงแรมโฮลาเทลริมน่าน เริ่มก่อสร้าง" },
  { year: "2025", event: "เปิดตัว Solar Carport เป็น Flagship Solution พร้อม AI Energy Management Platform" },
  { year: "2026", event: "ขยายสู่ Full Automation Corporation System ระดับ World-Wide Enterprise" },
];

export default function About() {
  useEffect(() => { trackSolutionVisit("solar-carport"); }, []);

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={cfImage(HERO, 1280, { quality: 76 })}
            srcSet={cfImageSrcSet(HERO, [640, 960, 1280, 1600], { quality: 76 })}
            sizes="100vw"
            alt="SIRINX Team"
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/50" />
        </div>
        <div className="container relative z-10 pt-20">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-2xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">About Us</span>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-3">
              วิศวกรรมพลังงาน<br />
              <span className="text-gradient-accent">ที่ขับเคลื่อนด้วยข้อมูล</span>
            </h1>
            <p className="text-text-secondary leading-relaxed">
              SIRINX ก่อตั้งขึ้นด้วยความเชื่อว่าพลังงานสะอาดต้องมาพร้อมกับความฉลาดทางดิจิทัล เราสร้างโครงสร้างพื้นฐานพลังงานอัจฉริยะที่เติบโตไปกับธุรกิจของคุณ
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== VISION & MISSION ===== */}
      <section className="py-14 lg:py-20 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <div className="flex items-center gap-3 mb-3">
                <Eye className="w-5 h-5 text-accent-primary" />
                <h2 className="font-display text-xl font-bold text-foreground">วิสัยทัศน์</h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                เป็นผู้นำด้าน Smart Energy Infrastructure ของประเทศไทย ที่ผสานพลังงานสะอาด เทคโนโลยี AI และระบบอัตโนมัติ เพื่อสร้างอนาคตพลังงานที่ยั่งยืนและคุ้มค่าสำหรับทุกธุรกิจ
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-accent-secondary" />
                <h2 className="font-display text-xl font-bold text-foreground">พันธกิจ</h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                ออกแบบ ติดตั้ง และบริหารระบบพลังงานครบวงจรด้วยมาตรฐานวิศวกรรมระดับสูง พร้อมข้อมูลเชิงลึกที่ช่วยให้ธุรกิจตัดสินใจได้อย่างมั่นใจ ตั้งแต่วันแรกจนตลอดอายุการใช้งาน
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CORE VALUES ===== */}
      <section className="py-14 lg:py-20 section-alt">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-8">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">Core Values</span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">หลักการที่เราไม่ประนีประนอม</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <motion.div key={v.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="p-5 rounded-xl border border-border-subtle hover:border-border-accent transition-colors bg-surface-elevated">
                <v.icon className="w-6 h-6 text-accent-primary mb-3" />
                <h3 className="font-display font-semibold text-foreground text-sm mb-1.5">{v.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== END-TO-END APPROACH ===== */}
      <section className="py-14 lg:py-20 bg-background">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="max-w-2xl mx-auto text-center mb-8">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">End-to-End</span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">ครบวงจรตั้งแต่ต้นจนจบ</h2>
            <p className="text-sm text-text-secondary">
              เราเป็นพันธมิตรด้านพลังงานที่ดูแลทุกขั้นตอน ตั้งแต่การวิเคราะห์ความคุ้มค่า ออกแบบระบบ ติดตั้ง ไปจนถึงการดูแลรักษาตลอดอายุการใช้งาน
            </p>
          </motion.div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {["วิเคราะห์", "ออกแบบ", "จัดหา", "ติดตั้ง", "ดูแล", "เพิ่มประสิทธิภาพ"].map((step, i) => (
              <motion.div key={step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="text-center p-3 rounded-xl bg-accent-glow border border-border-accent">
                <div className="font-display text-xl font-bold text-accent-primary/30 mb-0.5">0{i + 1}</div>
                <div className="text-xs font-medium text-foreground">{step}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TIMELINE ===== */}
      <section className="py-14 lg:py-20 section-alt">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="mb-8">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">Milestones</span>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground">เส้นทางการเติบโต</h2>
          </motion.div>
          <div className="relative">
            <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent-primary/50 via-accent-primary/20 to-transparent" />
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <motion.div key={`${m.year}-${i}`} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  className={`relative flex items-start gap-6 ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}>
                  <div className="hidden lg:block lg:w-1/2" />
                  <div className="absolute left-4 lg:left-1/2 w-3 h-3 rounded-full bg-accent-primary -translate-x-1.5 mt-2 ring-4 ring-background" />
                  <div className="ml-10 lg:ml-0 lg:w-1/2 p-4 rounded-xl border border-border-subtle bg-surface-elevated">
                    <span className="font-display font-bold text-accent-primary text-xs">{m.year}</span>
                    <p className="text-sm text-text-secondary mt-1">{m.event}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CEO SECTION ===== */}
      <section className="py-14 lg:py-20 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="flex flex-col items-center text-center lg:text-left lg:items-start">
              <img
                src={cfImage(LOGO_URL, 240)}
                srcSet={cfImageSrcSet(LOGO_URL, [160, 240, 320])}
                sizes="112px"
                alt="Pitoon Yingyosruangrong"
                className="w-28 h-28 rounded-full ring-4 ring-brand/30 shadow-2xl mb-5 object-cover"
                loading="lazy"
                decoding="async"
              />
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">Pitoon Yingyosruangrong</h2>
              <p className="text-accent-primary font-medium text-sm mb-3">CEO & Founder — SIRINX Co., Ltd.</p>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                ผู้ก่อตั้งและเจ้าของ SIRINX ผู้มีวิสัยทัศน์ในการปฏิวัติพลังงานอัจฉริยะเพื่ออนาคตที่ยั่งยืน เป็นเจ้าของโรงแรมเรือนแพ รอยัลปาร์ค พิษณุโลก และโรงแรมโฮลาเทลริมน่าน โดยมี Solar Farm 2 Node ที่ดำเนินการอยู่
              </p>
              <div className="space-y-1.5 text-xs text-text-muted">
                <a href="tel:+66819723969" className="flex items-center gap-2 hover:text-accent-primary transition-colors">
                  <Phone className="w-3.5 h-3.5" /> +66 81 972 3969
                </a>
                <a href="mailto:pitoon.sirinx@gmail.com" className="flex items-center gap-2 hover:text-accent-primary transition-colors">
                  <Mail className="w-3.5 h-3.5" /> pitoon.sirinx@gmail.com
                </a>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 mt-0.5" />
                  <span>600/99 Midtrapab Rd., Mueang Phitsanulok 65000</span>
                </div>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="space-y-4">
              <div className="p-5 rounded-xl border border-border-subtle bg-surface-elevated">
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">Solar Farm Node 1</h3>
                <p className="text-accent-primary text-xs font-medium mb-1">โรงแรมเรือนแพ รอยัลปาร์ค พิษณุโลก</p>
                <p className="text-xs text-text-muted">ติดตั้งและเปิดใช้งานแล้ว — ลดค่าพลังงานให้โรงแรมอย่างมีประสิทธิภาพ</p>
              </div>
              <div className="p-5 rounded-xl border border-border-accent bg-accent-glow">
                <h3 className="font-display font-semibold text-foreground text-sm mb-1">Solar Farm Node 2</h3>
                <p className="text-accent-primary text-xs font-medium mb-1">โรงแรมโฮลาเทลริมน่าน</p>
                <p className="text-xs text-text-muted">กำลังดำเนินการก่อสร้าง พร้อมปรับปรุงโรงแรมใหม่</p>
              </div>
              <div className="p-5 rounded-xl glass-card">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-accent-primary" />
                  <h3 className="font-display font-semibold text-foreground text-sm">Solar Carport — Flagship 2025</h3>
                </div>
                <p className="text-xs text-text-muted">โซลูชันที่เราเชื่อมั่นว่าจะเปลี่ยนวงการพลังงานไทย — ลานจอดรถทุกแห่งคือโรงไฟฟ้า</p>
                <Link href="/solar-carport" className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-accent-primary hover:underline">
                  ดูรายละเอียด <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 lg:py-24 section-alt relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow to-transparent" />
        <div className="container relative text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">พร้อมเป็นพันธมิตรด้านพลังงาน?</h2>
            <p className="text-text-secondary text-sm mb-7 max-w-lg mx-auto">
              พูดคุยกับคุณ Pitoon และทีมวิศวกรของเราเพื่อหาโซลูชันที่เหมาะกับธุรกิจของคุณ
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent rounded-lg">
                ติดต่อเรา <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="tel:+66819723969" className="inline-flex items-center gap-2 px-6 py-3.5 font-display font-semibold btn-accent-outline rounded-lg">
                <Phone className="w-4 h-4" /> โทรหาเราเลย
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
