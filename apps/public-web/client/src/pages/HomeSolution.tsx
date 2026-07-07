import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import {
  ArrowRight,
  BatteryCharging,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Home,
  MapPinned,
  PlugZap,
  ShieldCheck,
  Sun,
  Wrench,
} from "lucide-react";

const ASSET_DIR = "/assets/home-solution";
const RESPONSIVE_WIDTHS = [640, 960, 1280] as const;

function imageSrc(name: string, width: number, extension: "avif" | "jpg") {
  return `${ASSET_DIR}/${name}-${width}.${extension}`;
}

function imageSrcSet(name: string, extension: "avif" | "jpg") {
  return RESPONSIVE_WIDTHS.map(
    width => `${imageSrc(name, width, extension)} ${width}w`
  ).join(", ");
}

const HERO_IMAGE_NAME = "home-solution-drone-hero";
const HERO_IMAGE = `${ASSET_DIR}/${HERO_IMAGE_NAME}.jpg`;
const HERO_IMAGE_SIZES = "(max-width: 767px) 80vw, 100vw";
const HERO_IMAGE_RESPONSIVE = {
  fallback: imageSrc(HERO_IMAGE_NAME, 1280, "jpg"),
  avifSrcSet: imageSrcSet(HERO_IMAGE_NAME, "avif"),
  jpgSrcSet: imageSrcSet(HERO_IMAGE_NAME, "jpg"),
};

const GALLERY_IMAGES = [
  {
    name: "home-solution-village-oblique",
    alt: "มุมโดรนโครงการบ้านจัดสรรระดับพรีเมียมพร้อม rooftop solar หลายหลัง",
    label: "Village-scale solar planning",
  },
  {
    name: "home-solution-rooftop-detail",
    alt: "มุมสูงหลังคาบ้านใหญ่พร้อมแผงโซลาร์ carport EV charger และ battery cabinet",
    label: "Rooftop + carport detail",
  },
  {
    name: "home-solution-estate-topdown",
    alt: "มุม top-down โครงการหมู่บ้านจัดสรรพร้อมบ้านหลายหลังติดตั้งโซลาร์",
    label: "Estate rollout view",
  },
];

const highLoadSignals = [
  "ค่าไฟบ้านใหญ่หรือโฮมออฟฟิศระดับ 35,000-250,000+ บาทต่อเดือน",
  "แอร์หลายโซน, ห้องประชุม, server/network, CCTV, pool pump, kitchen load",
  "มี EV หรือเตรียมติดตั้ง EV Charger หลายจุด",
  "ต้องการ backup บางโหลดสำคัญด้วย Hybrid Inverter + BESS",
];

const solutionStack = [
  {
    icon: Sun,
    title: "Rooftop Solar",
    body: "ออกแบบกำลังผลิตตามหลังคาจริง ทิศแดด เงาบัง และ load profile ไม่ใช่ขายจากขนาดแผงอย่างเดียว",
  },
  {
    icon: Home,
    title: "Solar Carport",
    body: "เปลี่ยนพื้นที่จอดรถของบ้านใหญ่หรือ home office เป็นหลังคาผลิตไฟ พร้อมเพิ่มร่มเงาและภาพลักษณ์พรีเมียม",
  },
  {
    icon: BatteryCharging,
    title: "Hybrid + BESS",
    body: "วางระบบแบตเตอรี่สำหรับโหลดสำคัญ ช่วง peak หรือ backup เฉพาะส่วน โดยแยกสิ่งที่ควรสำรองกับสิ่งที่ไม่ควรสำรอง",
  },
  {
    icon: PlugZap,
    title: "EV Charging",
    body: "รองรับ EV Charger พร้อม logic การใช้ไฟจาก solar ก่อน ลดการดึงไฟจาก grid ในช่วงที่ไม่จำเป็น",
  },
  {
    icon: Gauge,
    title: "AI Energy Monitor",
    body: "ติดตาม production, consumption, import/export, alarm และ performance เพื่อให้เจ้าของบ้านเห็นระบบทำงานจริง",
  },
  {
    icon: Wrench,
    title: "O&M หลังติดตั้ง",
    body: "มี checklist commissioning, monitoring, cleaning plan, alarm response และเอกสารส่งมอบที่ตรวจสอบย้อนกลับได้",
  },
];

const trustChecks = [
  "สำรวจหน้างานก่อนเสนอแบบ ไม่ใช้ template เดียวกับทุกบ้าน",
  "ทำ single-line diagram, BOQ, equipment spec และ payment milestone ให้ตรวจได้",
  "มี commissioning record และภาพถ่ายงานติดตั้งก่อนส่งมอบ",
  "ติดตามผลผลิตไฟและ alarm หลังเปิดระบบ ไม่จบแค่ติดตั้งเสร็จ",
  "ใช้ reference จากระบบที่ใช้งานจริงในโรงแรมและธุรกิจในเครือเป็นหลักฐานประกอบการออกแบบ",
  "ตัวเลขประหยัดและคืนทุนแสดงเป็น scenario ตามข้อมูลหน้างาน ไม่ใช้เป็นคำรับประกันแบบเหมารวม",
];

const processSteps = [
  {
    title: "1. เก็บข้อมูลโหลดจริง",
    body: "ดูบิลไฟ, TOU, load ช่วงกลางวัน, EV plan, backup need และข้อจำกัดของบ้านหรือโฮมออฟฟิศ",
  },
  {
    title: "2. Drone / Roof / Electrical Survey",
    body: "สำรวจหลังคา, carport, MDB, inverter location, cable route, safety disconnect และจุดติดตั้ง battery",
  },
  {
    title: "3. Engineering Proposal",
    body: "ส่งแบบระบบ, ขนาด kWp, inverter/BESS, EV Charger, monitoring plan และสมมติฐานประหยัดไฟ",
  },
  {
    title: "4. Install + Commissioning",
    body: "ติดตั้ง, ทดสอบ, ส่งมอบ evidence และเปิด dashboard ให้ตรวจ production จริงหลังเริ่มใช้งาน",
  },
];

const faqs = [
  {
    q: "Home Solution ของ SIRINX เหมาะกับบ้านแบบไหน?",
    a: "เหมาะกับบ้านขนาดใหญ่ โฮมออฟฟิศ บ้านพักผู้บริหาร บ้านที่มี EV หลายคัน หรือบ้านที่มีโหลดไฟสูง เช่น แอร์หลายโซน ห้องทำงาน server ห้องประชุม สระว่ายน้ำ และระบบรักษาความปลอดภัย",
  },
  {
    q: "ทำไมไม่ควรซื้อระบบจากราคาต่อกิโลวัตต์อย่างเดียว?",
    a: "เพราะบ้านใหญ่มีข้อจำกัดเฉพาะ เช่น เงาบัง ทิศหลังคา MDB เดิม backup load และ EV charging behavior ระบบที่คุ้มจริงต้องออกแบบจากข้อมูลโหลดและหน้างาน ไม่ใช่ใช้ราคาแผงเป็นตัวตัดสินอย่างเดียว",
  },
  {
    q: "SIRINX ช่วยลดความเสี่ยงเรื่องงานติดตั้งไม่ได้มาตรฐานอย่างไร?",
    a: "ใช้กระบวนการสำรวจ ออกแบบเอกสารวิศวกรรม BOQ ชัดเจน payment milestone commissioning record และ monitoring หลังส่งมอบ เพื่อให้ลูกค้าตรวจสอบได้ทุกช่วง ไม่ใช่รอเชื่อคำขายอย่างเดียว",
  },
  {
    q: "สามารถใช้ร่วมกับ EV Charger และ Battery ได้หรือไม่?",
    a: "ได้ โดยออกแบบเป็นระบบเดียวกันตั้งแต่ต้นเพื่อจัดลำดับการใช้ไฟจาก solar, grid, battery และ EV charger ตามพฤติกรรมของบ้านและข้อจำกัดของอุปกรณ์",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": "https://www.sirinx.co/home-solution#service",
      name: "SIRINX Home Solar Solution",
      serviceType:
        "Solar rooftop, solar carport, BESS, EV Charger, and AI energy monitoring for large homes and home offices",
      provider: {
        "@type": "Organization",
        name: "SIRINX",
        url: "https://www.sirinx.co",
      },
      areaServed: {
        "@type": "Country",
        name: "Thailand",
      },
      audience: {
        "@type": "Audience",
        audienceType:
          "Large private residences, home offices, executive homes, premium housing estates",
      },
      description:
        "Home solar solution for large homes and home offices with high electricity demand, combining rooftop solar, solar carport, EV Charger, BESS, AI monitoring, and commissioning evidence.",
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map(faq => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "หน้าแรก",
          item: "https://www.sirinx.co",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Home Solar Solution",
          item: "https://www.sirinx.co/home-solution",
        },
      ],
    },
  ],
};

export default function HomeSolution() {
  return (
    <div className="bg-background text-foreground">
      <Helmet>
        <title>Home Solar Solution บ้านใหญ่และโฮมออฟฟิศ | SIRINX</title>
        <meta
          name="description"
          content="SIRINX Home Solar Solution สำหรับบ้านขนาดใหญ่ โฮมออฟฟิศ และโครงการหมู่บ้านพรีเมียมที่ใช้ไฟสูง พร้อม Rooftop Solar, Solar Carport, BESS, EV Charger และ AI Energy Monitoring"
        />
        <link rel="canonical" href="https://www.sirinx.co/home-solution/" />
        <meta
          property="og:title"
          content="Home Solar Solution บ้านใหญ่และโฮมออฟฟิศ | SIRINX"
        />
        <meta
          property="og:description"
          content="ระบบโซลาร์สำหรับบ้านใหญ่ โฮมออฟฟิศ และโครงการพรีเมียมที่ใช้ไฟสูง พร้อมหลักฐาน commissioning, monitoring และ reference site จริง"
        />
        <meta
          property="og:image"
          content={`https://www.sirinx.co${HERO_IMAGE}`}
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <section className="relative min-h-[92vh] overflow-hidden">
        <picture className="absolute inset-0 block h-full w-full">
          <source
            type="image/avif"
            srcSet={HERO_IMAGE_RESPONSIVE.avifSrcSet}
            sizes={HERO_IMAGE_SIZES}
          />
          <img
            src={HERO_IMAGE_RESPONSIVE.fallback}
            srcSet={HERO_IMAGE_RESPONSIVE.jpgSrcSet}
            sizes={HERO_IMAGE_SIZES}
            alt="มุมโดรนโครงการบ้านขนาดใหญ่และโฮมออฟฟิศพร้อมระบบโซลาร์ SIRINX"
            className="h-full w-full object-cover"
            width={1280}
            height={720}
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/78 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="container relative z-10 flex min-h-[92vh] items-center pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-accent bg-accent-glow px-3 py-1.5 text-xs font-semibold text-accent-primary">
              <MapPinned className="h-3.5 w-3.5" />
              Home Solution for high-load residences
            </div>
            <h1 className="mb-6 font-display text-3xl font-bold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl">
              Solar สำหรับบ้านใหญ่
              <span className="block text-gradient-accent">
                และโฮมออฟฟิศที่ใช้ไฟสูง
              </span>
            </h1>
            <p className="mb-8 max-w-2xl text-sm leading-7 text-text-secondary sm:text-lg sm:leading-relaxed">
              <span className="block sm:hidden">
                <span className="block">SIRINX ออกแบบโซลาร์บ้านใหญ่</span>
                <span className="block">ครอบคลุมหลังคา คาร์พอร์ต</span>
                <span className="block">จุดชาร์จ EV แบตเตอรี่</span>
                <span className="block">และระบบติดตามพลังงาน</span>
                <span className="mt-1 block">สำหรับบ้านพรีเมียม โฮมออฟฟิศ</span>
                <span className="block">และหมู่บ้านจัดสรรที่ต้องการ</span>
                <span className="block">ระบบที่ตรวจสอบได้จริง</span>
              </span>
              <span className="hidden sm:block">
                SIRINX ออกแบบระบบโซลาร์บ้านใหญ่แบบครบวงจร ครอบคลุมหลังคา
                คาร์พอร์ต จุดชาร์จ EV แบตเตอรี่ และระบบติดตามพลังงาน
              </span>
              <span className="mt-1 hidden sm:block">
                เหมาะกับบ้านพักระดับพรีเมียม โฮมออฟฟิศ
                และโครงการหมู่บ้านจัดสรรที่ต้องการระบบที่ตรวจสอบได้จริง
                ตั้งแต่แบบวิศวกรรมจนถึงหลังส่งมอบ
              </span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact?interest=home-solution"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent"
              >
                นัดประเมินบ้าน / โฮมออฟฟิศ <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline"
              >
                <Calculator className="h-4 w-4" />
                ประเมินค่าไฟเบื้องต้น
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["High Load", "ออกแบบจากการใช้ไฟจริง"],
                ["Commissioning", "มีหลักฐานส่งมอบระบบ"],
                ["Monitoring", "เห็น production และ alarm"],
              ].map(([value, label]) => (
                <div
                  key={value}
                  className="rounded-lg border border-border-subtle bg-surface-overlay p-4 backdrop-blur"
                >
                  <div className="font-display text-lg font-bold text-accent-primary">
                    {value}
                  </div>
                  <div className="mt-1 text-xs text-text-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <span className="mb-3 inline-flex text-sm font-semibold text-accent-primary">
                เหมาะกับใคร
              </span>
              <h2 className="mb-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
                บ้านที่ค่าไฟสูงต้องการระบบที่ออกแบบเหมือนงาน commercial
              </h2>
              <p className="text-text-secondary leading-relaxed">
                บ้านใหญ่และโฮมออฟฟิศจำนวนมากมีโหลดไฟซับซ้อนกว่าอาคารขนาดเล็ก:
                มีทั้งแอร์หลายโซน EV ห้องทำงาน server ระบบน้ำ สระว่ายน้ำ
                และอุปกรณ์รักษาความปลอดภัย การติดโซลาร์ให้คุ้มจึงต้องเริ่มจาก
                load profile และแบบไฟฟ้า ไม่ใช่เริ่มจากราคาแผง
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {highLoadSignals.map(item => (
                <div
                  key={item}
                  className="rounded-xl border border-border-subtle bg-surface-elevated p-5"
                >
                  <CheckCircle2 className="mb-4 h-5 w-5 text-accent-primary" />
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-alt py-16 lg:py-24">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <span className="mb-3 inline-flex text-sm font-semibold text-accent-primary">
              System stack
            </span>
            <h2 className="mb-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
              หนึ่งหน้าเดียวครบ: rooftop, carport, battery, EV และ AI monitoring
            </h2>
            <p className="text-text-secondary leading-relaxed">
              หน้า Home Solution นี้ออกแบบเพื่อให้ลูกค้า AEO/search
              เห็นคำตอบชัดเจนว่า SIRINX ไม่ได้ขายแค่แผงโซลาร์
              แต่ทำระบบพลังงานสำหรับบ้านที่มี consumption
              สูงและต้องการความน่าเชื่อถือแบบโครงการจริง
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {solutionStack.map(item => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="rounded-xl border border-border-subtle bg-surface-elevated p-6"
                >
                  <Icon className="mb-5 h-7 w-7 text-accent-primary" />
                  <h3 className="mb-3 font-display text-lg font-bold">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {item.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="grid gap-4">
              {GALLERY_IMAGES.map((image, index) => (
                <figure
                  key={image.name}
                  className={`overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated ${index === 0 ? "" : "lg:ml-12"}`}
                >
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={imageSrcSet(image.name, "avif")}
                      sizes="(min-width: 1024px) 54vw, 100vw"
                    />
                    <img
                      src={imageSrc(image.name, 960, "jpg")}
                      srcSet={imageSrcSet(image.name, "jpg")}
                      sizes="(min-width: 1024px) 54vw, 100vw"
                      alt={image.alt}
                      width={1280}
                      height={720}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </picture>
                  <figcaption className="px-4 py-3 text-xs text-text-muted">
                    {image.label}
                  </figcaption>
                </figure>
              ))}
            </div>
            <div>
              <span className="mb-3 inline-flex text-sm font-semibold text-accent-primary">
                Proof over promise
              </span>
              <h2 className="mb-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
                ลดความเสี่ยงงานหลอกลวงด้วยหลักฐานที่ตรวจสอบได้
              </h2>
              <p className="mb-6 text-text-secondary leading-relaxed">
                สำหรับบ้านราคาสูงและโฮมออฟฟิศ
                ลูกค้าไม่ควรต้องวัดใจจากคำพูดขายอย่างเดียว SIRINX
                วางระบบให้ตรวจสอบได้ตั้งแต่ก่อนติดตั้ง ระหว่างติดตั้ง
                และหลังเปิดระบบ โดยใช้ reference
                จากระบบที่ใช้งานจริงในโรงแรมและธุรกิจในเครือเป็นข้อมูลประกอบการออกแบบ
              </p>
              <div className="grid gap-3">
                {trustChecks.map(item => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-lg border border-border-subtle bg-surface-elevated p-4"
                  >
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-primary" />
                    <p className="text-sm leading-relaxed text-text-secondary">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 rounded-lg border border-border-accent bg-accent-glow p-4 text-xs leading-relaxed text-text-secondary">
                หมายเหตุ: ตัวเลขผลประหยัดและระยะคืนทุนต้องประเมินจากบิลไฟ
                พฤติกรรมโหลด พื้นที่ติดตั้ง และเงื่อนไขหน้างานจริง
                ไม่ใช้เป็นคำรับประกันแบบเดียวกันทุกบ้าน
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-alt py-16 lg:py-24">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <span className="mb-3 inline-flex text-sm font-semibold text-accent-primary">
              Implementation process
            </span>
            <h2 className="mb-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
              ขั้นตอนที่ทำให้ระบบบ้านใหญ่ใช้งานได้จริง
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {processSteps.map(step => (
              <article
                key={step.title}
                className="rounded-xl border border-border-subtle bg-surface-elevated p-6"
              >
                <ClipboardCheck className="mb-5 h-6 w-6 text-accent-primary" />
                <h3 className="mb-3 font-display text-base font-bold">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <span className="mb-3 inline-flex text-sm font-semibold text-accent-primary">
                AEO answers
              </span>
              <h2 className="mb-4 font-display text-2xl font-bold leading-tight sm:text-4xl">
                คำตอบที่เจ้าของบ้านและผู้บริหารมักถามก่อนตัดสินใจ
              </h2>
              <p className="text-text-secondary leading-relaxed">
                เนื้อหาส่วนนี้ออกแบบให้ตอบคำถาม search และ AI answer engine
                ได้ตรงเจตนา: ใครเหมาะกับระบบนี้ ทำไมต้องสำรวจจริง
                ลดความเสี่ยงอย่างไร และต่อยอด EV/BESS ได้แค่ไหน
              </p>
            </div>
            <div className="grid gap-4">
              {faqs.map(faq => (
                <article
                  key={faq.q}
                  className="rounded-xl border border-border-subtle bg-surface-elevated p-6"
                >
                  <h3 className="mb-3 font-display text-lg font-bold">
                    {faq.q}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {faq.a}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-elevated py-16 lg:py-24">
        <div className="container">
          <div className="grid gap-8 rounded-2xl border border-border-accent bg-accent-glow p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-accent-primary">
                <Building2 className="h-4 w-4" />
                Home Office / Private Estate / Premium Village
              </div>
              <h2 className="mb-3 font-display text-2xl font-bold leading-tight sm:text-4xl">
                ส่งบิลไฟและภาพหลังคาให้ทีม SIRINX ประเมินระบบเบื้องต้น
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
                เริ่มจากข้อมูลจริง: ค่าไฟ 6-12 เดือน, พื้นที่หลังคา, จำนวน EV,
                โหลดที่อยากสำรอง, และเป้าหมายของบ้านหรือโฮมออฟฟิศ
                ทีมจะช่วยประเมินว่าควรเริ่มจาก rooftop, carport, battery หรือ EV
                ก่อน
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/contact?interest=home-solution"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent"
              >
                ขอทีมประเมิน <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline"
              >
                ดูผลงานจริง
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
