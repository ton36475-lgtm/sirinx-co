/**
 * SIRINX Partner & Investor Inquiry Page
 * Dual-theme: semantic CSS vars
 * Features: Market opportunity data, lead qualification, success state
 */
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import {
  Handshake, TrendingUp, Building2, Send, CheckCircle2, ArrowRight,
  Globe, BarChart3, Shield, Users, Zap, Target, Leaf
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { TrpcProvider } from "@/lib/trpc-provider";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const marketStats = [
  { value: "30 GW", label: "เป้าหมายพลังงานหมุนเวียน 2580", icon: Target },
  { value: "15%+", label: "อัตราเติบโตตลาด Solar ไทย/ปี", icon: TrendingUp },
  { value: "฿200B+", label: "มูลค่าตลาดพลังงานสะอาดไทย", icon: BarChart3 },
  { value: "8-15%", label: "ผลตอบแทน IRR เฉลี่ยโครงการ", icon: Leaf },
];

const partnerTypes = [
  {
    icon: TrendingUp, title: "นักลงทุน",
    desc: "ร่วมลงทุนในโครงการพลังงานสะอาดที่ให้ผลตอบแทนมั่นคงและยั่งยืน",
    benefits: ["ผลตอบแทน IRR 8-15% ต่อปี", "สัญญา PPA ระยะยาว 20-25 ปี", "รายงานผลตอบแทนรายเดือน", "ทีมบริหารโครงการมืออาชีพ", "ความเสี่ยงต่ำจาก revenue certainty"],
    ideal: "กองทุน, Family Office, นักลงทุนสถาบัน",
  },
  {
    icon: Building2, title: "พันธมิตรธุรกิจ",
    desc: "ร่วมเป็นพันธมิตรในการขยายตลาดพลังงานสะอาดทั่วประเทศ",
    benefits: ["ส่วนแบ่งรายได้ที่ยุติธรรม", "การสนับสนุนทางเทคนิคเต็มรูปแบบ", "การฝึกอบรมทีมงาน", "แบรนด์ร่วมและการตลาด", "เข้าถึงเทคโนโลยี AI Energy"],
    ideal: "ผู้พัฒนาอสังหาฯ, นิคมอุตสาหกรรม, ตัวแทนจำหน่าย",
  },
  {
    icon: Handshake, title: "EPC Partner",
    desc: "ร่วมงานในฐานะผู้รับเหมาติดตั้งหรือซัพพลายเออร์อุปกรณ์",
    benefits: ["โครงการต่อเนื่องตลอดปี", "มาตรฐานการทำงานชัดเจน", "การชำระเงินตรงเวลา", "โอกาสเติบโตร่วมกัน", "Training & Certification"],
    ideal: "ผู้รับเหมาไฟฟ้า, ซัพพลายเออร์แผงโซลาร์, ผู้ผลิต BESS",
  },
];

function PartnerInner() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "", company: "", email: "", phone: "", type: "",
    investmentRange: "", message: "",
  });

  const leadMutation = trpc.lead.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("ส่งข้อมูลเรียบร้อยแล้ว ทีมพัฒนาธุรกิจจะติดต่อกลับภายใน 48 ชั่วโมง");
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    leadMutation.mutate({
      name: formData.name,
      company: formData.company || undefined,
      email: formData.email || "",
      phone: formData.phone || undefined,
      interest: `พันธมิตร: ${formData.type}`,
      source: "partner",
      message: `${formData.type ? `ประเภท: ${formData.type}` : ""}${formData.investmentRange ? ` | งบลงทุน: ${formData.investmentRange}` : ""}${formData.message ? ` | ${formData.message}` : ""}`,
    });
  };

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const inputCls = "w-full px-4 py-2.5 rounded-lg border border-border-subtle bg-background text-foreground text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors";

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">ขอบคุณสำหรับความสนใจ</h2>
          <p className="text-text-secondary mb-6">
            ทีมพัฒนาธุรกิจของ SIRINX จะตรวจสอบข้อมูลและติดต่อกลับภายใน 48 ชั่วโมงทำการ
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent rounded-lg text-sm font-display font-semibold">
              กลับหน้าหลัก
            </Link>
            <Link href="/investment" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-accent-outline rounded-lg text-sm font-display font-semibold">
              ศึกษาข้อมูลการลงทุน
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-2xl">
            <span className="text-xs font-medium text-accent-secondary tracking-widest uppercase mb-3 block">Partners & Investors</span>
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground mb-4">
              เติบโตไปด้วยกัน<br /><span className="text-gradient-accent">ในตลาดพลังงานสะอาด</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              ร่วมเป็นส่วนหนึ่งของการเปลี่ยนผ่านพลังงานของประเทศไทย ไม่ว่าจะเป็นนักลงทุน พันธมิตรธุรกิจ หรือ EPC Partner
            </p>
          </motion.div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-12 bg-background">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {marketStats.map((stat, i) => (
              <motion.div key={stat.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="p-5 rounded-xl border border-border-subtle bg-surface-elevated text-center">
                <stat.icon className="w-5 h-5 text-accent-primary mx-auto mb-2" />
                <div className="font-display text-2xl lg:text-3xl font-bold text-gradient-accent mb-1">{stat.value}</div>
                <div className="text-xs text-text-muted">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-16 lg:py-24 section-alt">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">รูปแบบความร่วมมือ</h2>
            <p className="text-text-secondary">เลือกรูปแบบที่เหมาะกับองค์กรของคุณ</p>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-6">
            {partnerTypes.map((pt, i) => (
              <motion.div key={pt.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="p-6 rounded-xl border border-border-subtle bg-surface-elevated hover:border-border-accent transition-colors">
                <pt.icon className="w-8 h-8 text-accent-primary mb-4" />
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{pt.title}</h3>
                <p className="text-sm text-text-secondary mb-4">{pt.desc}</p>
                <ul className="space-y-2 mb-4">
                  {pt.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-text-muted">
                      <CheckCircle2 className="w-4 h-4 text-accent-secondary shrink-0 mt-0.5" /> {b}
                    </li>
                  ))}
                </ul>
                <div className="pt-3 border-t border-border-subtle">
                  <span className="text-xs text-text-muted">เหมาะสำหรับ: </span>
                  <span className="text-xs text-accent-primary">{pt.ideal}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Form */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-[1fr_360px] gap-10 max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <div className="p-6 lg:p-8 rounded-2xl border border-border-subtle bg-surface-elevated">
                <h2 className="font-display text-xl font-bold text-foreground mb-1">แบบฟอร์มสอบถามความร่วมมือ</h2>
                <p className="text-sm text-text-muted mb-6">ทีมพัฒนาธุรกิจจะติดต่อกลับภายใน 48 ชั่วโมงทำการ</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">ชื่อ-นามสกุล *</label>
                      <input type="text" required value={formData.name} onChange={(e) => update("name", e.target.value)} className={inputCls} placeholder="ชื่อของคุณ" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">บริษัท/องค์กร *</label>
                      <input type="text" required value={formData.company} onChange={(e) => update("company", e.target.value)} className={inputCls} placeholder="ชื่อบริษัท" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">อีเมล *</label>
                      <input type="email" required value={formData.email} onChange={(e) => update("email", e.target.value)} className={inputCls} placeholder="email@company.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">เบอร์โทร</label>
                      <input type="tel" value={formData.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls} placeholder="0XX-XXX-XXXX" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">ประเภทความร่วมมือ *</label>
                      <select required value={formData.type} onChange={(e) => update("type", e.target.value)} className={inputCls}>
                        <option value="">เลือกประเภท</option>
                        <option value="investor">นักลงทุน</option>
                        <option value="partner">พันธมิตรธุรกิจ</option>
                        <option value="epc">EPC Partner</option>
                        <option value="other">อื่น ๆ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">ขนาดการลงทุน/ร่วมมือ</label>
                      <select value={formData.investmentRange} onChange={(e) => update("investmentRange", e.target.value)} className={inputCls}>
                        <option value="">เลือกขนาด</option>
                        <option value="small">ต่ำกว่า 10 ล้านบาท</option>
                        <option value="medium">10-50 ล้านบาท</option>
                        <option value="large">50-200 ล้านบาท</option>
                        <option value="xlarge">มากกว่า 200 ล้านบาท</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">ข้อความ</label>
                    <textarea rows={4} value={formData.message} onChange={(e) => update("message", e.target.value)}
                      className={`${inputCls} resize-none`} placeholder="รายละเอียดเกี่ยวกับความร่วมมือที่สนใจ" />
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 btn-accent rounded-lg font-display font-semibold text-base">
                    <Send className="w-4 h-4" /> ส่งข้อมูล
                  </button>
                  <p className="text-xs text-text-muted text-center">ข้อมูลของคุณจะถูกเก็บเป็นความลับ ใช้เพื่อการติดต่อกลับเท่านั้น</p>
                </form>
              </div>
            </motion.div>

            {/* Sidebar */}
            <div className="space-y-6">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
                className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
                <h3 className="font-display font-semibold text-foreground mb-4">ทำไมร่วมงานกับ SIRINX</h3>
                <div className="space-y-3">
                  {[
                    { icon: Shield, text: "ผลงาน 150+ โครงการทั่วประเทศ" },
                    { icon: Globe, text: "เทคโนโลยี AI Energy ล้ำสมัย" },
                    { icon: Users, text: "ทีมวิศวกรมืออาชีพ 50+ คน" },
                    { icon: Zap, text: "ดูแลระบบตลอดอายุ 25 ปี" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4 text-accent-primary shrink-0" />
                      <span className="text-sm text-text-secondary">{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
                className="p-6 rounded-xl border border-border-subtle bg-surface-elevated">
                <h3 className="font-display font-semibold text-foreground mb-4">ขั้นตอนการพิจารณา</h3>
                <div className="space-y-4">
                  {[
                    { step: "1", title: "ส่งข้อมูลเบื้องต้น", time: "วันนี้" },
                    { step: "2", title: "ทีม BD ติดต่อกลับ", time: "ภายใน 48 ชม." },
                    { step: "3", title: "ประชุมนำเสนอโอกาส", time: "ภายใน 1 สัปดาห์" },
                    { step: "4", title: "Due Diligence & MOU", time: "ตามข้อตกลง" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-accent-glow text-accent-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</span>
                      <div>
                        <div className="text-sm font-medium text-foreground">{s.title}</div>
                        <div className="text-xs text-text-muted">{s.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
                className="p-5 rounded-xl border border-border-accent bg-accent-glow">
                <p className="text-xs text-text-muted leading-relaxed">
                  <strong className="text-foreground">Disclaimer:</strong> ตัวเลขผลตอบแทนที่แสดงเป็นค่าประมาณการจากโครงการในอดีต ผลตอบแทนจริงอาจแตกต่างขึ้นอยู่กับเงื่อนไขเฉพาะของแต่ละโครงการ การลงทุนมีความเสี่ยง ผู้ลงทุนควรศึกษาข้อมูลก่อนตัดสินใจ
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 section-alt">
        <div className="container text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">ต้องการข้อมูลเพิ่มเติม?</h2>
          <p className="text-text-secondary mb-6 max-w-lg mx-auto">ศึกษารูปแบบการลงทุนและผลงานของเราเพิ่มเติม</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/investment" className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-accent-outline rounded-lg font-display font-semibold">
              ข้อมูลการลงทุน <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/projects" className="inline-flex items-center justify-center gap-2 px-6 py-3 btn-accent-outline rounded-lg font-display font-semibold">
              ดูผลงาน <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Partner() {
  return (
    <TrpcProvider>
      <PartnerInner />
    </TrpcProvider>
  );
}
