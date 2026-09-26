import { ArrowRight, MessageCircle, QrCode } from "lucide-react";
import { Link } from "wouter";
import { lineOfficialConfig } from "@shared/lineOfficial";
import { useLanguage } from "@/contexts/LanguageContext";

const copy = {
  th: {
    badge: "LINE Official",
    title: "ติดต่อ SIRINX ผ่าน LINE Official",
    description:
      "ส่งบิลค่าไฟ รูปพื้นที่ หรือคำถามเกี่ยวกับ Solar Carport, Rooftop Solar, BESS และ EV Charger ให้ทีมประเมินเบื้องต้น",
    add: "เพิ่มเพื่อน LINE Official",
    chat: "เริ่มแชทผ่าน LINE",
    id: "LINE ID",
    scan: "สแกน QR หรือกดปุ่มเพื่อเริ่มคุยกับทีม SIRINX",
    nextTitle: "ส่งข้อมูลอะไรให้ทีมประเมินได้บ้าง",
    nextItems: [
      "บิลค่าไฟย้อนหลังหรือค่าไฟเฉลี่ยรายเดือน",
      "รูปพื้นที่ลานจอดรถ หลังคา MDB หรือจุดติดตั้ง",
      "ประเภทธุรกิจ จำนวนรถ EV และแผนใช้ BESS",
    ],
    quote: "ขอใบเสนอราคา",
    projects: "ดูผลงาน",
  },
  en: {
    badge: "LINE Official",
    title: "Contact SIRINX on LINE Official",
    description:
      "Send electricity bills, site photos, or questions about Solar Carport, Rooftop Solar, BESS, and EV Charger for an initial review.",
    add: "Add LINE Official",
    chat: "Start LINE chat",
    id: "LINE ID",
    scan: "Scan the QR code or use a button to start with the SIRINX team.",
    nextTitle: "What to send for a faster assessment",
    nextItems: [
      "A recent electricity bill or average monthly cost.",
      "Parking, roof, MDB, or installation-point photos.",
      "Business type, EV plans, and possible BESS requirements.",
    ],
    quote: "Request a quote",
    projects: "View projects",
  },
  cn: {
    badge: "LINE 官方账号",
    title: "通过 LINE Official 联系 SIRINX",
    description:
      "发送电费账单、现场照片，或咨询 Solar Carport、Rooftop Solar、BESS 与 EV Charger 的初步评估。",
    add: "添加 LINE Official",
    chat: "开始 LINE 聊天",
    id: "LINE ID",
    scan: "扫描二维码或点击按钮开始联系 SIRINX 团队。",
    nextTitle: "为了更快评估可以发送什么",
    nextItems: [
      "近期电费账单或每月平均电费。",
      "停车场、屋顶、MDB 或安装位置照片。",
      "业务类型、EV 计划以及 BESS 需求。",
    ],
    quote: "获取报价",
    projects: "查看项目",
  },
} as const;

export default function Line() {
  const { lang } = useLanguage();
  const content = copy[lang];

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b border-border-subtle py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-glow via-background to-background" />
        <div className="container relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-accent bg-accent-glow px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
              <MessageCircle className="h-3.5 w-3.5" /> {content.badge}
            </span>
            <h1 className="mb-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-foreground lg:text-6xl">
              {content.title}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-text-secondary lg:text-lg">
              {content.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={lineOfficialConfig.addFriendUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00C300] px-6 py-3.5 font-display font-semibold text-white transition-colors hover:bg-[#00B300]"
              >
                {content.add} <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={lineOfficialConfig.chatUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-accent px-6 py-3.5 font-display font-semibold text-accent-primary transition-colors hover:bg-accent-glow"
              >
                {content.chat}
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-border-accent bg-surface-elevated p-7 shadow-2xl shadow-cyan-950/20">
            <div className="mb-5 flex items-center gap-3 text-accent-primary">
              <QrCode className="h-6 w-6" />
              <span className="font-display font-semibold">{content.badge}</span>
            </div>
            <p className="mb-5 text-sm leading-7 text-text-secondary">{content.scan}</p>
            <div className="mb-5 rounded-xl border border-border-subtle bg-background p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-text-muted">{content.id}</div>
              <div className="mt-2 font-display text-2xl font-bold text-foreground">{lineOfficialConfig.basicId}</div>
            </div>
            <a
              href={lineOfficialConfig.shortLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-lg bg-accent-primary px-5 py-3 font-display font-semibold text-text-inverse transition-opacity hover:opacity-90"
            >
              {content.add}
            </a>
          </div>
        </div>
      </section>

      <section className="container py-16 lg:py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold text-foreground lg:text-3xl">{content.nextTitle}</h2>
          <ul className="mt-6 space-y-3 text-text-secondary">
            {content.nextItems.map(item => (
              <li key={item} className="rounded-lg border border-border-subtle bg-surface-elevated px-5 py-4">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="inline-flex items-center rounded-lg bg-accent-primary px-5 py-3 font-display font-semibold text-text-inverse">
              {content.quote}
            </Link>
            <Link href="/projects" className="inline-flex items-center rounded-lg border border-border-accent px-5 py-3 font-display font-semibold text-accent-primary">
              {content.projects}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
