import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }) };

const rows = [
  { feature: "Solar CRM", sirinx: true, solset: true },
  { feature: "3D Design Studio", sirinx: false, solset: true },
  { feature: "BESS (Battery Storage)", sirinx: true, solset: false },
  { feature: "EV Charging", sirinx: true, solset: false },
  { feature: "AI Energy Management", sirinx: true, solset: false },
  { feature: "Solar EPC Service (ติดตั้ง)", sirinx: true, solset: false },
  { feature: "Free plan", sirinx: false, solset: true },
  { feature: "Pay-per-design", sirinx: false, solset: true },
  { feature: "Thai language", sirinx: true, solset: false },
  { feature: "Global market", sirinx: false, solset: true },
];

export default function CompareSolset() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[40vh] flex items-center overflow-hidden bg-background">
        <div className="container relative z-10 pt-20 pb-12">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-3xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">Comparison</span>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">SIRINX vs Solset</h1>
            <p className="text-text-secondary text-lg mb-6">เปรียบเทียบ Solar EPC + AI Energy (SIRINX) กับ Solar CRM + 3D Design Software (Solset)</p>
          </motion.div>
        </div>
      </section>
      <section className="py-16 lg:py-24">
        <div className="container max-w-4xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left py-3 px-4 font-display font-semibold">ฟีเจอร์</th>
                  <th className="text-center py-3 px-4 font-display font-semibold text-accent-primary">SIRINX</th>
                  <th className="text-center py-3 px-4 font-display font-semibold">Solset</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border-subtle/50">
                    <td className="py-3 px-4 text-sm">{row.feature}</td>
                    <td className="py-3 px-4 text-center">{row.sirinx ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-400 mx-auto" />}</td>
                    <td className="py-3 px-4 text-center">{row.solset ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-400 mx-auto" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 p-6 rounded-xl border border-border-subtle bg-surface-elevated">
            <h3 className="font-display font-semibold text-foreground mb-2">สรุป</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Solset เน้น Solar CRM + 3D design software (SaaS) สำหรับ EPCs ทั่วโลก ขณะที่ SIRINX เน้น Solar EPC + AI Energy Management + BESS สำหรับธุรกิจไทย
              SIRINX มี BESS และ AI Energy ที่แข็งแกร่งกว่า Solset แต่ Solset มี 3D design studio และ CRM ที่ mature กว่า
            </p>
          </div>
          <div className="mt-8 text-center">
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 font-display font-medium btn-accent rounded-lg">ติดต่อทีมวิศวกร <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}