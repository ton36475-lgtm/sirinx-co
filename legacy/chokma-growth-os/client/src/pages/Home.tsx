import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BadgePercent, Crown, Gift, Landmark, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const registrationUrl = "https://xn--42cl4e4cwd.net/auth/registration?af=u2vZe3xLLiJ7";
const heroVisualUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663577937161/UPS7b47Kjq2aW47iS7LQXC/chokma-hero-poster-XsmNSXNMpQZEnQfEdjKbGS.webp";
const lotteryVisualUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663577937161/UPS7b47Kjq2aW47iS7LQXC/chokma-lottery-strip-LdrAKnifFc43xoUZ9rS3Dr.webp";
const affiliateVisualUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663577937161/UPS7b47Kjq2aW47iS7LQXC/chokma-affiliate-offer-cCNyExkL4DdC9UwREw8YAa.webp";

const highlightCards = [
  {
    title: "หวย 4 ตัว 7,000 บาท",
    description: "ใช้ข้อเสนอที่จำง่ายและเห็นแล้วตัดสินใจได้เร็ว เพื่อพาผู้เล่นเข้าสู่ขั้นตอนสมัครโดยไม่ต้องอ่านเยอะ",
  },
  {
    title: "หวย 3 ตัว 1,200 บาท",
    description: "สื่อสารข้อเสนอหลักให้ตรงประเด็น พร้อมคงโทนแบรนด์ CHOKMA แบบน้ำเงิน-ทองอย่างสม่ำเสมอ",
  },
  {
    title: "แนะนำเพื่อนรับ 1% ถึง 3%",
    description: "เปิดแรงจูงใจแบบขั้นบันไดเพื่อดึงทั้งผู้เล่นตรงและผู้ที่มีศักยภาพต่อยอด referral ในอนาคต",
  },
];

const trustRows = [
  "สมัครง่าย เริ่มจากกรอกเบอร์มือถือในหน้าสมัครจริงของ CHOKMA โดยตรง",
  "หน้า Landing นี้เก็บ UTM, referrer และสัญญาณทราฟฟิกเพื่อต่อเข้า CRM กับ Dashboard อัตโนมัติ",
  "ทีมงานสามารถติดตามลูกค้าคุณภาพสูงต่อใน CRM พร้อมดู deposit history และ actual versus result ได้",
];

const extraOffers = [
  {
    title: "รางวัลหวยรัฐบาลและเลขจ่ายหนัก",
    description: "เสริมข้อเสนอหลักด้วยมุมสื่อสารที่ตอบคนชอบอัตราจ่ายสูงและรางวัลที่เห็นภาพได้ทันที",
    icon: Landmark,
  },
  {
    title: "เครดิตฟรี พร้อมข้อเสนอสล็อตและคาสิโน",
    description: "ใช้เป็นแรงดึงดูดเสริมสำหรับกลุ่มที่สนใจความคุ้มค่าและมองหาประสบการณ์เล่นที่หลากหลาย",
    icon: Gift,
  },
  {
    title: "ระบบแนะนำเพื่อนต่อยอดได้ถึง 3%",
    description: "ชู referral เป็น hook ทางธุรกิจที่ต่อยอดได้ทั้ง acquisition และ affiliate-style dashboard ในเฟสถัดไป",
    icon: BadgePercent,
  },
  {
    title: "ฝากถอนสะดวกผ่านช่องทางที่คุ้นเคย",
    description: "ลดแรงเสียดทานของ conversion ด้วยข้อความที่ทำให้ผู้ใช้เข้าใจว่าการทำรายการหลังสมัครไม่ซับซ้อน",
    icon: Sparkles,
  },
];

const organicBlocks = [
  {
    title: "เว็บหวยจ่ายสูง",
    description:
      "สำหรับคนที่ค้นหาเว็บหวยจ่ายสูง หน้าแรกควรตอบทันทีว่าได้อะไร สมัครอย่างไร และต้องกดตรงไหนต่อ โดยไม่ทำให้หลุดจากเส้นทาง conversion หลัก",
  },
  {
    title: "สมัครเว็บหวย",
    description:
      "ผู้ใช้ที่พร้อมสมัครไม่ต้องการโครงสร้างซับซ้อน หน้าใหม่จึงพาไปยังลิงก์สมัครจริงได้เร็ว และยังมีฟอร์ม lead สำรองไว้ให้ทีมติดตามต่อ",
  },
  {
    title: "เลขเด็ดและแนวทางหวย",
    description:
      "ผู้ใช้สาย organic ที่เข้ามาด้วย intent เชิงข้อมูลยังต้องเห็นข้อเสนอหลักและ trust element อย่างชัดเจน เพื่อเปลี่ยนจากผู้อ่านให้กลายเป็นผู้สมัครได้ง่ายขึ้น",
  },
];

const faqItems = [
  {
    q: "ทำไมหน้าใหม่ต้องเรียบง่ายกว่าก่อนหน้า",
    a: "เพราะผู้ใช้กลุ่มนี้ตัดสินใจจากข้อเสนอหลักและความเร็วในการเข้าสู่ขั้นตอนสมัคร การลดทางเลือกที่ไม่จำเป็นช่วยให้ conversion path สั้นลงและชัดขึ้น",
  },
  {
    q: "ลิงก์สมัครชี้ไปที่ไหน",
    a: "ทุก CTA หลักของหน้าเชื่อมไปยังหน้าสมัครจริงของ CHOKMA โดยตรง เพื่อให้ประสบการณ์ตั้งแต่คลิกโฆษณาจนถึงเริ่มสมัครมีความต่อเนื่องมากที่สุด",
  },
  {
    q: "ฟอร์ม lead ยังจำเป็นอยู่หรือไม่",
    a: "ยังจำเป็น เพราะช่วยเก็บข้อมูลแหล่งที่มาแคมเปญและเปิดทางให้ทีม CRM ติดตามผู้ใช้ที่ยังไม่สมัครทันที แต่มี intent สูงหรือมีศักยภาพเป็นลูกค้ามูลค่าสูง",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const submitLead = trpc.leads.submit.useMutation({
    onSuccess: (result) => {
      toast.success(`บันทึกข้อมูลเรียบร้อยแล้ว • คะแนนคุณภาพ ${result.qualityScore}/100 • สถานะ ${result.trafficStatus}`);
      setForm((prev) => ({ ...prev, fullName: "", phone: "", lineId: "", notes: "" }));
    },
    onError: (error) => {
      toast.error(error.message || "เกิดข้อผิดพลาดระหว่างบันทึก lead");
    },
  });

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    lineId: "",
    notes: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
    referrer: "",
    landingPage: "",
    deviceType: "unknown" as "mobile" | "desktop" | "tablet" | "unknown",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const width = window.innerWidth;
    const nextDeviceType = width < 768 ? "mobile" : width < 1024 ? "tablet" : "desktop";

    setForm((prev) => ({
      ...prev,
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmContent: params.get("utm_content") || "",
      utmTerm: params.get("utm_term") || "",
      referrer: document.referrer || "direct",
      landingPage: window.location.pathname + window.location.search,
      deviceType: nextDeviceType,
    }));
  }, []);

  useEffect(() => {
    const title = "CHOKMA | สมัครง่าย หวยจ่ายสูง 4 ตัว 7,000 บาท 3 ตัว 1,200 บาท";
    const description =
      "หน้า Landing Page ของ CHOKMA ที่ออกแบบให้เรียบง่าย ตรงประเด็น กดสมัครได้ทันที พร้อมเก็บ lead, UTM tracking และเชื่อม CRM กับ Dashboard หลังบ้าน";
    const canonical = `${window.location.origin}${window.location.pathname}`;

    const ensureMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
      let element = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    const ensureLink = (rel: string, href: string) => {
      let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    document.title = title;
    ensureMeta('meta[name="description"]', "name", "description", description);
    ensureMeta('meta[property="og:title"]', "property", "og:title", title);
    ensureMeta('meta[property="og:description"]', "property", "og:description", description);
    ensureMeta('meta[property="og:type"]', "property", "og:type", "website");
    ensureMeta('meta[property="og:url"]', "property", "og:url", canonical);
    ensureMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    ensureMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    ensureMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    ensureLink("canonical", canonical);
  }, []);

  const structuredData = useMemo(() => {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://xn--42cl4e4cwd.net";
    const pageUrl = typeof window !== "undefined" ? window.location.href : "https://xn--42cl4e4cwd.net";

    return [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "CHOKMA",
        url: "https://xn--42cl4e4cwd.net",
        logo: `${siteUrl}/favicon.ico`,
        sameAs: [registrationUrl],
        description: "CHOKMA เป็นระบบหน้า Landing และโครงสร้างติดตามผลสำหรับแคมเปญสมัครสมาชิกที่เชื่อมกับ CRM และ Dashboard หลังบ้าน",
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "CHOKMA",
        url: siteUrl,
        inLanguage: "th-TH",
        publisher: {
          "@type": "Organization",
          name: "CHOKMA",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "CHOKMA Landing Page",
        description:
          "หน้า Landing Page ของ CHOKMA ที่ออกแบบเพื่อ conversion สูง พร้อมเก็บ lead, UTM tracking, CRM integration และ organic intent content สำหรับกลุ่มเว็บหวยจ่ายสูง",
        url: pageUrl,
        isPartOf: {
          "@type": "WebSite",
          name: "CHOKMA",
          url: siteUrl,
        },
      },
    ];
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitLead.mutate({
      fullName: form.fullName || undefined,
      phone: form.phone || undefined,
      lineId: form.lineId || undefined,
      notes: form.notes || undefined,
      utmSource: form.utmSource || undefined,
      utmMedium: form.utmMedium || undefined,
      utmCampaign: form.utmCampaign || undefined,
      utmContent: form.utmContent || undefined,
      utmTerm: form.utmTerm || undefined,
      landingPage: form.landingPage || undefined,
      referrer: form.referrer || undefined,
      deviceType: form.deviceType,
      primaryIntent: "high-value lottery prospect",
      sourceType: form.utmSource ? "ad" : "manual",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">CHOKMA</p>
            <p className="text-sm font-semibold sm:text-base">สมัครง่าย จบไว และวัดผลได้จริง</p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button asChild variant="outline" className="border-primary/20 bg-background text-foreground">
                <a href="/dashboard">เปิด Dashboard</a>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="hidden border-primary/20 bg-background text-foreground sm:inline-flex"
                onClick={() => {
                  window.location.href = getLoginUrl();
                }}
              >
                เข้าสู่ระบบทีมงาน
              </Button>
            )}
            <Button asChild className="shadow-lg shadow-primary/20">
              <a href={registrationUrl} target="_blank" rel="noreferrer">
                สมัครทันที
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.18),_transparent_24%),linear-gradient(180deg,rgba(11,37,84,1)_0%,rgba(6,18,44,1)_100%)] text-white">
          <div className="container grid gap-8 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-white/80">
                หน้าเดียวสำหรับโฆษณา สมัคร และส่งข้อมูลเข้า CRM
              </div>
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.26em] text-amber-300">Simple, direct, conversion-first</p>
                <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                  สมัคร <span className="text-amber-300">CHOKMA</span> ง่ายกว่าเดิม
                  <br />
                  เห็นข้อเสนอแล้วกดต่อได้ทันที
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/74 sm:text-lg">
                  หน้า Landing ใหม่นี้ถูกปรับให้เรียบง่ายและจบไวตามแนวทางที่ผู้ใช้ชอบ โดยยกข้อเสนอหลักขึ้นมาเป็นตัวตัดสินใจทันที แล้วพาผู้ใช้ไปยังหน้าสมัครจริงของ CHOKMA โดยตรง พร้อมเก็บ lead และข้อมูลแคมเปญเพื่อให้ทีมติดตามผลต่อได้ในระบบเดียว
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {highlightCards.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                    <p className="text-lg font-semibold text-amber-300">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/72">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 rounded-full bg-amber-400 px-7 text-slate-950 hover:bg-amber-300">
                  <a href={registrationUrl} target="_blank" rel="noreferrer">
                    ไปยังหน้าสมัครหลัก <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/20 bg-white/5 px-7 text-white hover:bg-white/10 hover:text-white">
                  <a href="#lead-form">ให้ทีมงานติดต่อกลับ</a>
                </Button>
              </div>

              <div className="grid gap-3 text-sm text-white/78 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">สมัครต่อได้ทันทีจากปุ่มหลักทุกจุดของหน้า</div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">โทนแบรนด์ CHOKMA แบบน้ำเงิน-ทองต่อเนื่องถึงหน้าสมัครจริง</div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/20 p-4">เก็บ UTM และ lead เพื่อเชื่อม Dashboard กับ CRM หลังบ้าน</div>
              </div>
            </div>

            <Card className="overflow-hidden border-white/10 bg-white/8 text-white shadow-2xl backdrop-blur">
              <div className="border-b border-white/10 bg-slate-950/20 p-3">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30">
                  <img
                    src={heroVisualUrl}
                    alt="ภาพประกอบหลักของแคมเปญ CHOKMA โทนน้ำเงิน-ทอง"
                    className="h-56 w-full object-cover"
                    loading="eager"
                  />
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">สมัครเร็ว ตัดสินใจง่าย</CardTitle>
                <CardDescription className="text-white/70">
                  โครงหน้านี้ถูกออกแบบให้เหมือนหน้าแคมเปญที่เน้นเป้าหมายเดียว คือพาผู้ใช้ไปเริ่มสมัคร หรือส่งข้อมูลให้ทีมงานติดตามต่อทันที
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-white/76">
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="font-semibold text-amber-300">Step 1</p>
                  <p className="mt-1">เห็นข้อเสนอหลัก เช่น 4 ตัว 7,000 บาท และ 3 ตัว 1,200 บาท ได้ทันทีตั้งแต่ส่วนบนสุดของหน้า</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="font-semibold text-amber-300">Step 2</p>
                  <p className="mt-1">กด CTA แล้วไปยังหน้าสมัครจริงของ CHOKMA ที่เริ่มจากการกรอกเบอร์มือถือ ทำให้ flow ต่อเนื่องและจบไว</p>
                </div>
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-emerald-50">
                  สำหรับผู้ใช้ที่ยังไม่พร้อมสมัครทันที หน้าเดียวกันนี้ยังมีฟอร์ม lead เพื่อส่งข้อมูลเข้า CRM และให้ทีมดูแลต่อโดยไม่ทำให้ทราฟฟิกสูญหาย
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container py-8 lg:py-10">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
              <div className="aspect-[4/3] overflow-hidden border-b border-border/70 bg-slate-950/10">
                <img src={lotteryVisualUrl} alt="ภาพประกอบข้อเสนอหวยของ CHOKMA" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">ข้อเสนอหวยที่มองแล้วเข้าใจทันที</CardTitle>
                <CardDescription>ภาพชุดนี้ถูกใช้เพื่อทำให้ข้อความ 4 ตัว 7,000 บาท และ 3 ตัว 1,200 บาท มีแรงดึงดูดขึ้นโดยไม่ทำให้หน้าเว็บรกเกินไป</CardDescription>
              </CardHeader>
            </Card>
            <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
              <div className="aspect-[4/3] overflow-hidden border-b border-border/70 bg-slate-950/10">
                <img src={affiliateVisualUrl} alt="ภาพประกอบระบบแนะนำเพื่อนของ CHOKMA" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">ภาพรองรับ hook สำหรับ referral และ affiliate</CardTitle>
                <CardDescription>โทนน้ำเงิน-ทองเดียวกันช่วยให้ข้อเสนอแนะนำเพื่อนสูงสุด 3% อ่านเป็นแพ็กเดียวกับข้อเสนอหลักและพร้อมต่อยอดทำ A/B blocks ได้ในภายหลัง</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="container py-12 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Trust elements</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">หน้าเรียบ แต่ยังวัดผลและต่อยอดหลังบ้านได้ครบ</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              แม้หน้าใหม่จะลดความซับซ้อนของเนื้อหา แต่โครงสร้างข้อมูลยังครบสำหรับระบบ Marketing และ CRM ทำให้ทีมยังเห็นทั้ง lead ใหม่ คุณภาพทราฟฟิก แคมเปญที่มาจริง และผลลัพธ์ที่ตามมาจริงในระดับปฏิบัติการ
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="border-primary/10 bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg"><ShieldCheck className="h-5 w-5 text-primary" /> สมัครตรงกับแบรนด์จริง</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                ทุก CTA หลักพาไปยังหน้าสมัครจริงของ CHOKMA โดยใช้โดเมนเดียวกับแบรนด์ จึงทำให้เส้นทางตั้งแต่โฆษณาจนถึงเริ่มสมัครมีความต่อเนื่องมากขึ้น
              </CardContent>
            </Card>
            <Card className="border-primary/10 bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg"><BadgePercent className="h-5 w-5 text-primary" /> Referral พร้อมต่อยอด</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                ข้อเสนอแนะนำเพื่อน 1% ถึง 3% ถูกยกขึ้นเป็น hook หลักที่อ่านจบได้เร็ว และยังเชื่อมต่อกับการวัดแคมเปญและ referral traffic ในระบบหลังบ้าน
              </CardContent>
            </Card>
            <Card className="border-primary/10 bg-primary/5 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg"><Crown className="h-5 w-5 text-primary" /> CRM สำหรับลูกค้าคุณภาพสูง</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                ลีดที่เข้ามาจากหน้าเดียวกันนี้ยังสามารถถูกคัดกลุ่มและติดตามต่อใน CRM พร้อม notes, deposit history และ workflow ของทีมปฏิบัติการได้ทันที
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {trustRows.map((item) => (
              <Card key={item} className="border-border/70 bg-card/90">
                <CardContent className="p-5 text-sm leading-7 text-muted-foreground">{item}</CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {extraOffers.map((offer) => {
              const Icon = offer.icon;
              return (
                <Card key={offer.title} className="border-border/70 bg-card/90">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg"><Icon className="h-5 w-5 text-primary" /> {offer.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-muted-foreground">{offer.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border/60 bg-muted/35">
          <div className="container py-12 lg:py-16">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Organic intent</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">รองรับทั้งคนที่กดจากแอด และคนที่เข้ามาจากการค้นหา</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                หน้า CHOKMA ใหม่ยังคงรองรับ SEO และ AEO ด้วย content block ที่ตอบคำค้นหลักอย่างกระชับ เพื่อไม่ให้ organic traffic เจอเพียงหน้าขายอย่างเดียว แต่ได้คำอธิบายที่พาไปสู่การสมัครอย่างเป็นธรรมชาติ
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {organicBlocks.map((item) => (
                <Card key={item.title} className="border-border/70 bg-card/90">
                  <CardHeader>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-7 text-muted-foreground">{item.description}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="lead-form" className="container grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Lead capture</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">หากยังไม่สมัครทันที ให้ทีมงานรับเรื่องและติดตามต่อได้เลย</h2>
            <p className="text-base leading-7 text-muted-foreground">
              ฟอร์มนี้ทำหน้าที่เป็นชั้นรับลีดสำรองสำหรับผู้ที่สนใจแต่ยังไม่กดสมัครทันที ข้อมูลที่ส่งเข้ามาจะถูกเก็บพร้อม UTM, referrer และบริบทเบื้องต้น เพื่อให้ทีมงานรู้ว่าควรตามต่ออย่างไรและควรจัดลำดับความสำคัญแบบไหนใน CRM
            </p>
            <div className="space-y-3 rounded-3xl border border-primary/10 bg-primary/5 p-6">
              <div className="flex items-start gap-3">
                <Wallet className="mt-1 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">ช่วยรักษาทราฟฟิกที่ยังไม่พร้อมสมัครทันทีไม่ให้หลุดหายจากระบบ</p>
              </div>
              <div className="flex items-start gap-3">
                <Crown className="mt-1 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">เปิดทางให้ทีมคัดกลุ่มผู้เล่นมูลค่าสูงและติดตามต่อด้วยโน้ตหรือ workflow เฉพาะทาง</p>
              </div>
            </div>
          </div>

          <Card className="border-border/70 bg-card shadow-lg">
            <CardHeader>
              <CardTitle>แบบฟอร์มรับลีดพร้อมติดตามแคมเปญ</CardTitle>
              <CardDescription>กรอกข้อมูลสั้น ๆ เพื่อให้ระบบบันทึก lead และบริบทของแคมเปญโดยอัตโนมัติ</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">ชื่อที่ใช้ติดต่อ</Label>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="ชื่อหรือนามแฝง"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">เบอร์โทรหรือช่องทางหลัก</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="เบอร์โทรศัพท์"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lineId">LINE ID</Label>
                  <Input
                    id="lineId"
                    value={form.lineId}
                    onChange={(e) => setForm((prev) => ({ ...prev, lineId: e.target.value }))}
                    placeholder="Line ID สำหรับติดต่อกลับ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">ความสนใจหรือความต้องการ</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="เช่น สนใจหวยจ่ายสูง โปรโมชั่น หรือระบบแนะนำเพื่อน"
                    className="min-h-28"
                  />
                </div>

                <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                  ระบบจะบันทึกข้อมูลแคมเปญอัตโนมัติ เช่น <span className="font-medium text-foreground">utm_source</span>, <span className="font-medium text-foreground">utm_medium</span>, referrer และชนิดอุปกรณ์ พร้อมประเมินคะแนนคุณภาพทราฟฟิกแบบโปร่งใสจากข้อมูลที่ส่งเข้าจริง เพื่อให้ทีมดูผลต่อใน Dashboard และ CRM ได้ทันที
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" className="h-11 flex-1" disabled={submitLead.isPending}>
                    {submitLead.isPending ? "กำลังบันทึก lead..." : "ส่งข้อมูลให้ทีมงาน"}
                  </Button>
                  <Button asChild type="button" variant="outline" className="h-11 flex-1 border-primary/20">
                    <a href={registrationUrl} target="_blank" rel="noreferrer">
                      ไปหน้าสมัครหลักทันที
                    </a>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="container py-4 pb-28 lg:pb-16">
          <div className="grid gap-4 lg:grid-cols-3">
            {faqItems.map((item) => (
              <Card key={item.q} className="h-full border-border/70 bg-card/90">
                <CardHeader>
                  <CardTitle className="text-lg">{item.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground">{item.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/95 p-3 shadow-2xl backdrop-blur lg:hidden">
        <div className="container flex items-center gap-3">
          <Button asChild className="h-11 flex-1 rounded-full shadow-lg shadow-primary/20">
            <a href={registrationUrl} target="_blank" rel="noreferrer">
              สมัครทันที
            </a>
          </Button>
          <Button asChild variant="outline" className="h-11 flex-1 rounded-full border-primary/20 bg-background">
            <a href="#lead-form">ให้ทีมงานติดต่อ</a>
          </Button>
        </div>
      </div>

      {user ? (
        <div className="fixed bottom-20 right-4 hidden rounded-full border border-primary/15 bg-card px-4 py-2 text-sm text-muted-foreground shadow-lg lg:block">
          เข้าสู่ระบบแล้วในชื่อ <span className="font-medium text-foreground">{user.name || "ทีมงาน"}</span>
        </div>
      ) : null}
    </div>
  );
}
