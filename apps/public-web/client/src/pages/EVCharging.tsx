import { motion } from "framer-motion";
import { Link } from "wouter";
import { Zap, Battery, Car, Shield, ArrowRight, Plug } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }) };

export default function EVCharging() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[50vh] flex items-center overflow-hidden bg-background">
        <div className="container relative z-10 pt-20 pb-12">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-3xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">EV Charging</span>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">EV Charging สำหรับธุรกิจ</h1>
            <p className="text-text-secondary text-lg mb-6">ระบบชาร์จรถ EV สำหรับธุรกิจ รองรับ AC/DC fast charging  integrate กับ Solar Carport และ BESS เพื่อลดต้นทุนไฟฟ้าและเพิ่มรายได้</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/assessment" className="inline-flex items-center gap-2 px-4 py-2 font-display font-medium btn-accent rounded-lg text-sm">ประเมินไซต์ฟรี <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/contact?interest=ev-charging" className="inline-flex items-center gap-2 px-4 py-2 font-display font-medium btn-accent-outline rounded-lg text-sm">ติดต่อทีมวิศวกร</Link>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="py-16 lg:py-24">
        <div className="container max-w-5xl">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-6">ทำไมธุรกิจต้องมี EV Charging</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: <Plug className="w-6 h-6" />, title: "รองรับลูกค้าและพนักงาน", desc: "EV Charging เป็น amenity ที่ดึงดูดลูกค้าและพนักงานที่ใช้รถ EV" },
              { icon: <Zap className="w-6 h-6" />, title: "ลดต้นทุนไฟฟ้า", desc: "ชาร์จจาก Solar Carport ลดต้นทุนไฟฟ้าสำหรับ EV charging" },
              { icon: <Battery className="w-6 h-6" />, title: " integrate BESS", desc: "กักเก็บพลังงานส่วนเกิน จ่ายในช่วง peak ลด demand charge" },
              { icon: <Car className="w-6 h-6" />, title: "เพิ่มรายได้", desc: "EV charging สามารถเป็น revenue stream สำหรับธุรกิจ" },
              { icon: <Shield className="w-6 h-6" />, title: "รองรับ Fleet", desc: "รองรับ fleet รถ EV ของธุรกิจ (รถยก, รถส่งของ)" },
              { icon: <ArrowRight className="w-6 h-6" />, title: "ROI ที่ดี", desc: "Payback period 4-6 ปี ขึ้นอยู่กับ utilization" },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
                <div className="h-12 w-12 rounded-lg bg-accent-primary/20 flex items-center justify-center mb-4 text-accent-primary">{item.icon}</div>
                <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 lg:py-24">
        <div className="container max-w-5xl text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold mb-4">พร้อมเริ่มต้น?</h2>
          <p className="text-text-secondary mb-8 max-w-2xl mx-auto">นัด site survey ฟรี และรับการประเมินเบื้องต้นที่ตรงกับธุรกิจของคุณ</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/assessment" className="inline-flex items-center gap-2 px-6 py-3 font-display font-medium btn-accent rounded-lg">ประเมินไซต์ฟรี <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/contact?interest=ev-charging" className="inline-flex items-center gap-2 px-6 py-3 font-display font-medium btn-accent-outline rounded-lg">ติดต่อทีมวิศวกร</Link>
          </div>
        </div>
      </section>
    </div>
  );
}