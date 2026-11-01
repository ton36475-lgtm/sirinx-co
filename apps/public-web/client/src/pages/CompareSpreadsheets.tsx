import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }) };

export default function CompareSpreadsheets() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[40vh] flex items-center overflow-hidden bg-background">
        <div className="container relative z-10 pt-20 pb-12">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-3xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">Comparison</span>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">SIRINX vs Spreadsheets</h1>
            <p className="text-text-secondary text-lg mb-6">เปรียบเทียบการจัดการโครงการโซลาร์ด้วย spreadsheet กับระบบ integrated (SIRINX)</p>
          </motion.div>
        </div>
      </section>
      <section className="py-16 lg:py-24">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><XCircle className="w-5 h-5 text-red-400" /> Spreadsheets</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• ข้อมูลกระจัดกระจาย ไม่มี single source of truth</li>
                <li>• ไม่มี automation (follow-up, reminders)</li>
                <li>• ไม่มี 3D design หรือ shade study</li>
                <li>• ไม่มี BESS/EV integration</li>
                <li>• ไม่มี real-time monitoring</li>
                <li>• Error-prone (manual data entry)</li>
                <li>• ไม่ scale ได้ง่าย</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl border border-accent-primary/30 bg-surface-elevated">
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> SIRINX</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Single record สำหรับทุกขั้นตอน (design → quote → install → service)</li>
                <li>• AI Energy Management + monitoring แบบ real-time</li>
                <li>• BESS + EV Charging integration</li>
                <li>• Solar Carport 3D viewer</li>
                <li>• Load profile analysis + sizing</li>
                <li>• Peak shaving + demand charge reduction</li>
                <li>• ทีมวิศวกร + site survey + EPC service</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 font-display font-medium btn-accent rounded-lg">ติดต่อทีมวิศวกร <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}