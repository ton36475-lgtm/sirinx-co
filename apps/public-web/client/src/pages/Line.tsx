import {
  ArrowRight,
  BatteryCharging,
  CalendarCheck,
  CheckCircle2,
  FileText,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { lineOfficialConfig } from "@shared/lineOfficial";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

type LinePageCopy = {
  heroTitle: string;
  heroDesc: string;
  badge: string;
  addLine: string;
  chat: string;
  lineIdLabel: string;
  shortLinkLabel: string;
  scanCaption: string;
  instructionTitle: string;
  instructionItems: string[];
  quickActionsTitle: string;
  quickActions: Array<{ title: string; desc: string }>;
  trustTitle: string;
  trustItems: Array<{ title: string; desc: string }>;
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  ctaTitle: string;
  ctaDesc: string;
  quoteCta: string;
  projectsCta: string;
};

const linePageCopy: Record<Language, LinePageCopy> = {
  th: {
    badge: "LINE Official",
    heroTitle: "ติดต่อ SIRINX ผ่าน LINE Official",
    heroDesc:
      "ส่งบิลค่าไฟ รูปพื้นที่ หรือคำถามเกี่ยวกับ Solar Carport, Rooftop Solar, BESS และ EV Charger ให้ทีมประเมินเบื้องต้น",
    addLine: "เพิ่มเพื่อน LINE Official",
    chat: "เริ่มแชทผ่าน LINE",
    lineIdLabel: "LINE ID",
    shortLinkLabel: "ลิงก์สั้น",
    scanCaption: "สแกน QR เพื่อเพิ่มเพื่อน LINE Official ของ SIRINX",
    instructionTitle: "ส่งข้อมูลอะไรให้ทีมประเมินได้บ้าง",
    instructionItems: [
      "บิลค่าไฟย้อนหลังหรือค่าไฟเฉลี่ยรายเดือน",
      "รูปพื้นที่ลานจอดรถ หลังคา MDB หรือจุดติดตั้งที่ต้องการ",
      "ประเภทธุรกิจ จำนวนรถ EV หรือแผนใช้ BESS ในอนาคต",
    ],
    quickActionsTitle: "Quick Actions",
    quickActions: [
      {
        title: "ส่งบิลค่าไฟ",
        desc: "ให้ทีมประเมินขนาดระบบและผลประหยัดเบื้องต้น",
      },
      {
        title: "ขอประเมิน Solar Carport",
        desc: "เหมาะกับลานจอดรถ โรงงาน โรงแรม และอาคารองค์กร",
      },
      {
        title: "ขอประเมิน Rooftop Solar",
        desc: "ส่งรูปหลังคาและ load profile เพื่อประเมินหน้างาน",
      },
      {
        title: "ขอ EV Charger / BESS",
        desc: "วางระบบชาร์จ EV และกักเก็บพลังงานร่วมกับโซลาร์",
      },
      {
        title: "นัดสำรวจหน้างาน",
        desc: "คุยขอบเขตโครงการและนัดหมายทีมวิศวกร",
      },
    ],
    trustTitle: "ทำไมควรคุยกับ SIRINX ผ่าน LINE",
    trustItems: [
      {
        title: "เว็บไซต์บริษัท",
        desc: "ช่องทางติดต่อผูกกับ sirinx.co และข้อมูลบริษัทจริง",
      },
      {
        title: "ผลงานโครงการ",
        desc: "ส่งรูปหรือโจทย์ไซต์เพื่อเทียบกับรูปแบบงานที่ทำจริง",
      },
      {
        title: "บริการหลักครบ",
        desc: "Solar Carport, Rooftop Solar, BESS, EV Charger และ AI Energy",
      },
      {
        title: "ทีมประเมินระบบ",
        desc: "ใช้ข้อมูลไซต์จริงก่อนเสนอแนวทางและงบประมาณ",
      },
    ],
    faqTitle: "คำถามที่พบบ่อย",
    faq: [
      {
        q: "ต้องเตรียมข้อมูลอะไรบ้าง",
        a: "บิลค่าไฟ รูปพื้นที่ และเป้าหมายโครงการ เช่น ลดค่าไฟ เพิ่ม EV Charger หรือใช้ BESS",
      },
      {
        q: "ประเมินเบื้องต้นฟรีไหม",
        a: "การคุยเบื้องต้นและประเมินทิศทางจากข้อมูลที่ส่งทาง LINE ไม่มีข้อผูกมัด",
      },
      {
        q: "ใช้เวลาประเมินกี่วัน",
        a: "ขึ้นกับความครบถ้วนของข้อมูล โดยทีมจะเริ่มจากกรอบขนาดระบบและคำถามสำคัญก่อน",
      },
      {
        q: "ถ้าไม่มีบิลค่าไฟทำได้ไหม",
        a: "ทำได้ สามารถเริ่มจากรูปพื้นที่ ประเภทธุรกิจ และค่าไฟประมาณการก่อน",
      },
      {
        q: "ส่งรูปพื้นที่แทนได้ไหม",
        a: "ได้ รูปลานจอดรถ หลังคา ห้องไฟ และจุดติดตั้งช่วยให้ทีมประเมินหน้างานได้เร็วขึ้น",
      },
    ],
    ctaTitle: "พร้อมส่งข้อมูลให้ทีม SIRINX ประเมินแล้วหรือยัง",
    ctaDesc:
      "เพิ่มเพื่อน LINE Official แล้วส่งบิลค่าไฟหรือรูปพื้นที่ ทีมจะช่วยจัดลำดับข้อมูลที่ต้องใช้ต่อ",
    quoteCta: "ขอใบเสนอราคา",
    projectsCta: "ดูผลงาน",
  },
  en: {
    badge: "LINE Official",
    heroTitle: "Contact SIRINX on LINE Official",
    heroDesc:
      "Send electricity bills, site photos, or questions about Solar Carport, Rooftop Solar, BESS, and EV Charger for an initial review.",
    addLine: "Add LINE Official",
    chat: "Start LINE chat",
    lineIdLabel: "LINE ID",
    shortLinkLabel: "Short link",
    scanCaption: "Scan the QR code to add SIRINX LINE Official",
    instructionTitle: "What to send for a faster assessment",
    instructionItems: [
      "Recent electricity bill or average monthly energy cost.",
      "Photos of parking area, roof, MDB, or installation location.",
      "Business type, EV plans, and possible BESS requirements.",
    ],
    quickActionsTitle: "Quick Actions",
    quickActions: [
      {
        title: "Send electricity bill",
        desc: "Let the team estimate system size and savings direction.",
      },
      {
        title: "Assess Solar Carport",
        desc: "For factories, hotels, office buildings, and parking areas.",
      },
      {
        title: "Assess Rooftop Solar",
        desc: "Send roof photos and load profile for initial feasibility.",
      },
      {
        title: "Request EV Charger / BESS",
        desc: "Plan EV charging and storage with the solar system.",
      },
      {
        title: "Book site survey",
        desc: "Discuss project scope and schedule engineering review.",
      },
    ],
    trustTitle: "Why contact SIRINX through LINE",
    trustItems: [
      {
        title: "Company website",
        desc: "Connected to sirinx.co and verified company contact details.",
      },
      {
        title: "Project proof",
        desc: "Share site context and compare with real project patterns.",
      },
      {
        title: "Core services",
        desc: "Solar Carport, Rooftop Solar, BESS, EV Charger, and AI Energy.",
      },
      {
        title: "Assessment team",
        desc: "Recommendations start from actual site and energy data.",
      },
    ],
    faqTitle: "FAQ",
    faq: [
      {
        q: "What information should I prepare?",
        a: "Electricity bills, site photos, and the project goal such as bill reduction, EV charging, or BESS.",
      },
      {
        q: "Is the initial assessment free?",
        a: "Initial discussion and directional assessment through LINE are available without obligation.",
      },
      {
        q: "How long does assessment take?",
        a: "It depends on data completeness. The team starts with system sizing and key questions first.",
      },
      {
        q: "Can I start without an electricity bill?",
        a: "Yes. Site photos, business type, and approximate monthly cost can start the discussion.",
      },
      {
        q: "Can I send site photos instead?",
        a: "Yes. Parking, roof, electrical room, and installation-point photos help the team assess faster.",
      },
    ],
    ctaTitle: "Ready to send project details to SIRINX?",
    ctaDesc:
      "Add LINE Official and send your electricity bill or site photos. The team will guide the next information needed.",
    quoteCta: "Request quote",
    projectsCta: "View projects",
  },
  cn: {
    badge: "LINE 官方账号",
    heroTitle: "通过 LINE Official 联系 SIRINX",
    heroDesc:
      "发送电费账单、现场照片，或咨询 Solar Carport、Rooftop Solar、BESS 与 EV Charger 的初步评估。",
    addLine: "添加 LINE Official",
    chat: "开始 LINE 聊天",
    lineIdLabel: "LINE ID",
    shortLinkLabel: "短链接",
    scanCaption: "扫描二维码添加 SIRINX LINE 官方账号",
    instructionTitle: "为了更快评估，可发送这些资料",
    instructionItems: [
      "近期电费账单或平均每月电费。",
      "停车场、屋顶、MDB 或安装位置照片。",
      "业务类型、EV 计划以及未来 BESS 需求。",
    ],
    quickActionsTitle: "快速操作",
    quickActions: [
      {
        title: "发送电费账单",
        desc: "让团队初步估算系统规模与节省方向。",
      },
      {
        title: "评估 Solar Carport",
        desc: "适合工厂、酒店、办公楼和停车场。",
      },
      {
        title: "评估 Rooftop Solar",
        desc: "发送屋顶照片和负载资料进行初步可行性判断。",
      },
      {
        title: "咨询 EV Charger / BESS",
        desc: "规划 EV 充电和储能与太阳能系统结合。",
      },
      {
        title: "预约现场勘查",
        desc: "讨论项目范围并安排工程团队评估。",
      },
    ],
    trustTitle: "为什么通过 LINE 联系 SIRINX",
    trustItems: [
      {
        title: "公司网站",
        desc: "与 sirinx.co 和真实公司联系方式相连接。",
      },
      {
        title: "项目案例",
        desc: "发送现场资料，与真实项目类型进行比较。",
      },
      {
        title: "核心服务",
        desc: "Solar Carport、Rooftop Solar、BESS、EV Charger 与 AI Energy。",
      },
      {
        title: "评估团队",
        desc: "从真实现场和能源数据开始提出建议。",
      },
    ],
    faqTitle: "常见问题",
    faq: [
      {
        q: "需要准备哪些资料？",
        a: "电费账单、现场照片，以及项目目标，例如降低电费、增加 EV 充电或使用 BESS。",
      },
      {
        q: "初步评估免费吗？",
        a: "通过 LINE 进行初步沟通和方向性评估没有义务约束。",
      },
      {
        q: "评估需要多久？",
        a: "取决于资料完整度。团队会先确认系统规模和关键问题。",
      },
      {
        q: "没有电费账单可以开始吗？",
        a: "可以。现场照片、业务类型和大约月电费也可以作为起点。",
      },
      {
        q: "可以先发送现场照片吗？",
        a: "可以。停车场、屋顶、配电室和安装点照片能帮助团队更快判断。",
      },
    ],
    ctaTitle: "准备好把项目资料发送给 SIRINX 了吗？",
    ctaDesc:
      "添加 LINE Official 后发送电费账单或现场照片，团队会协助整理下一步需要的资料。",
    quoteCta: "索取报价",
    projectsCta: "查看项目",
  },
};

const quickActionIcons = [
  FileText,
  Zap,
  QrCode,
  BatteryCharging,
  CalendarCheck,
];

export default function Line() {
  const { lang } = useLanguage();
  const copy = linePageCopy[lang];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border-subtle pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,199,85,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(6,182,212,0.16),transparent_32%)]" />
        <div className="container relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#06C755]/30 bg-[#06C755]/10 px-4 py-2 text-sm font-semibold text-[#06C755]">
              <MessageCircle className="h-4 w-4" />
              {copy.badge}
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary">
              {copy.heroDesc}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={lineOfficialConfig.shortLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#047A35] px-6 py-3 font-display font-semibold text-white transition-colors hover:bg-[#03662c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06C755] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={copy.addLine}
              >
                {copy.addLine}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={lineOfficialConfig.chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border-subtle px-6 py-3 font-display font-semibold text-foreground transition-colors hover:border-[#06C755]/50 hover:text-[#06C755]"
                aria-label={copy.chat}
              >
                {copy.chat}
              </a>
            </div>
          </div>

          <aside className="rounded-2xl border border-[#06C755]/30 bg-slate-950/70 p-6 shadow-2xl shadow-[#06C755]/10 backdrop-blur-xl">
            <img
              src={lineOfficialConfig.qrImageUrl}
              alt={lineOfficialConfig.qrAltText}
              width={280}
              height={280}
              className="mx-auto aspect-square w-full max-w-[280px] rounded-xl bg-white p-3"
              decoding="async"
            />
            <p className="mt-4 text-center text-sm text-text-muted">
              {copy.scanCaption}
            </p>
            <dl className="mt-6 grid gap-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <dt className="text-text-muted">{copy.lineIdLabel}</dt>
                <dd className="mt-1 font-semibold text-foreground">
                  {lineOfficialConfig.basicId}
                </dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <dt className="text-text-muted">{copy.shortLinkLabel}</dt>
                <dd className="mt-1 break-all font-semibold text-foreground">
                  {lineOfficialConfig.shortLink}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="container py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {copy.instructionTitle}
            </h2>
            <ul className="mt-6 space-y-4">
              {copy.instructionItems.map(item => (
                <li key={item} className="flex gap-3 text-text-secondary">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#06C755]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {copy.quickActionsTitle}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {copy.quickActions.map((action, index) => {
                const Icon = quickActionIcons[index] ?? FileText;
                return (
                  <article
                    key={action.title}
                    className="rounded-xl border border-border-subtle bg-surface-elevated p-5"
                  >
                    <Icon className="h-5 w-5 text-accent-primary" />
                    <h3 className="mt-4 font-display text-lg font-semibold">
                      {action.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                      {action.desc}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border-subtle bg-surface-muted py-16 lg:py-20">
        <div className="container">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {copy.trustTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {copy.trustItems.map(item => (
              <article
                key={item.title}
                className="rounded-xl border border-border-subtle bg-background p-5"
              >
                <ShieldCheck className="h-5 w-5 text-accent-primary" />
                <h3 className="mt-4 font-display font-semibold">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {item.desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16 lg:py-20">
        <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          {copy.faqTitle}
        </h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {copy.faq.map(item => (
            <article
              key={item.q}
              className="rounded-xl border border-border-subtle bg-surface-elevated p-5"
            >
              <h3 className="font-display font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                {item.a}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="rounded-2xl border border-[#06C755]/30 bg-[#04151f] p-8 text-center lg:p-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            {copy.ctaTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
            {copy.ctaDesc}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={lineOfficialConfig.shortLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#047A35] px-6 py-3 font-display font-semibold text-white hover:bg-[#03662c]"
            >
              {copy.addLine}
            </a>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border-subtle px-6 py-3 font-display font-semibold text-foreground hover:border-[#06C755]/50 hover:text-[#06C755]"
            >
              {copy.quoteCta}
            </Link>
            <Link
              href="/projects"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border-subtle px-6 py-3 font-display font-semibold text-foreground hover:border-[#06C755]/50 hover:text-[#06C755]"
            >
              {copy.projectsCta}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
