import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }) };

const comparisons = [
  { slug: "solset", title: "SIRINX vs Solset", desc: "เปรียบเทียบ Solar CRM + 3D design software (Solset) กับ Solar EPC + AI Energy (SIRINX)", href: "/compare/solset" },
  { slug: "spreadsheets", title: "SIRINX vs Spreadsheets", desc: "เปรียบเทียบการจัดการโครงการโซลาร์ด้วย spreadsheet กับระบบ integrated", href: "/compare/spreadsheets" },
  { slug: "diy", title: "SIRINX vs DIY", desc: "เปรียบเทียบการติดตั้งโซลาร์ด้วยตัวเอง vs ใช้บริการ EPC", href: "/compare/diy" },
];

export default function Compare() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[40vh] flex items-center overflow-hidden bg-background">
        <div className="container relative z-10 pt-20 pb-12">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-3xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">Compare & Choose</span>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">เปรียบเทียบโซลูชันโซลาร์</h1>
            <p className="text-text-secondary text-lg mb-6">เปรียบเทียบ SIRINX กับทางเลือกอื่น — Solar CRM, spreadsheet, DIY — เพื่อเลือกโซลูชันที่เหมาะกับธุรกิจของคุณ</p>
          </motion.div>
        </div>
      </section>
      <section className="py-16 lg:py-24">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparisons.map((c, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border-subtle bg-surface-elevated hover:border-accent-primary/30 transition-colors">
                <h3 className="font-display font-semibold text-foreground mb-2">{c.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{c.desc}</p>
                <Link href={c.href} className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary hover:underline">
                  อ่านเปรียบเทียบ <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}