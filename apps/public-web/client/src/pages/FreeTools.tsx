import { motion } from "framer-motion";
import { Link } from "wouter";
import { Calculator, Zap, Battery, Sun, ArrowRight, DollarSign } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }) };

const tools = [
  { icon: <Sun className="w-6 h-6" />, title: "คำนวณค่าไฟที่ประหยัดได้", desc: "กรอกค่าไฟรายเดือน รับผลประเมินเบื้องต้น — คำนวณ ROI ระยะเวลาคืนทุน และขนาดระบบ Solar", href: "/assessment", cta: "เริ่มคำนวณ" },
  { icon: <Battery className="w-6 h-6" />, title: "คำนวณขนาด BESS", desc: "วิเคราะห์ load profile 24 ชม. เพื่อคำนวณ kWh/kW ที่เหมาะสมกับงบประมาณ", href: "/bess/sizing", cta: "คำนวณขนาด" },
  { icon: <Zap className="w-6 h-6" />, title: "คำนวณ Peak Shaving", desc: "ประเมินการลด demand charge ด้วย BESS — ประหยัดได้ 20,000-80,000 บาท/เดือน", href: "/bess/peak-shaving", cta: "ประเมิน" },
  { icon: <DollarSign className="w-6 h-6" />, title: "คำนวณ ROI Solar Carport", desc: "เปรียบเทียบ CAPEX vs OPEX สำหรับ Solar Carport + BESS + EV Charger", href: "/pricing", cta: "ดูราคา" },
  { icon: <Calculator className="w-6 h-6" />, title: "เปรียบเทียบ Solar vs Grid", desc: "เปรียบเทียบค่าไฟจากการซื้อโครงข่าย vs ผลิตเองจาก Solar", href: "/investment", cta: "เปรียบเทียบ" },
];

export default function FreeTools() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[40vh] flex items-center overflow-hidden bg-background">
        <div className="container relative z-10 pt-20 pb-12">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-3xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">Free Solar Tools & Calculators</span>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">เครื่องมือและเครื่องคำนวณโซลาร์ฟรี</h1>
            <p className="text-text-secondary text-lg mb-6">
              เครื่องมือฟรีสำหรับประเมินความคุ้มค่าของระบบโซลาร์ — คำนวณค่าไฟที่ประหยัดได้, ขนาด BESS, Peak Shaving, ROI และอื่นๆ ไม่ต้องสมัครสมาชิก
            </p>
          </motion.div>
        </div>
      </section>
      <section className="py-16 lg:py-24">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors">
                <div className="h-12 w-12 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-4 text-accent-primary">{tool.icon}</div>
                <h3 className="font-display font-semibold text-foreground mb-2">{tool.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{tool.desc}</p>
                <Link href={tool.href} className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline">
                  {tool.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 lg:py-24 bg-surface-elevated/30">
        <div className="container max-w-5xl text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">พร้อมเริ่มต้น?</h2>
          <p className="text-text-secondary mb-8 max-w-2xl mx-auto">นัด site survey ฟรี และรับการประเมินเบื้องต้นที่ตรงกับธุรกิจของคุณ</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/assessment" className="inline-flex items-center gap-2 px-6 py-3 font-display font-medium btn-accent rounded-lg">ประเมินไซต์ฟรี <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 font-display font-medium btn-accent-outline rounded-lg">ติดต่อทีมวิศวกร</Link>
          </div>
        </div>
      </section>
    </div>
  );
}