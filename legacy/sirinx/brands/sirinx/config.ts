/**
 * SIRINX Brand Configuration
 * 
 * This file defines all brand-specific content, theming, and metadata
 * for the SIRINX Solar Digital Agentic Company brand.
 * 
 * To create a new brand, copy this file to brands/<brand-name>/config.ts
 * and modify the values accordingly.
 */

export interface BrandConfig {
  // ── Identity ──
  id: string;
  name: string;
  tagline: string;
  legalName: string;
  description: string;
  foundedYear: number;

  // ── Assets ──
  logo: string;
  favicon: string;
  heroImage: string;
  ogImage: string;

  // ── Contact ──
  contact: {
    phone: string;
    email: string;
    lineId: string;
    lineUrl: string;
    address: string;
    mapUrl: string;
  };

  // ── Social Media ──
  social: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    tiktok?: string;
    twitter?: string;
  };

  // ── Trust Badges ──
  trustBadges: {
    name: string;
    imageUrl: string;
    link?: string;
  }[];

  // ── Theme ──
  theme: {
    mode: "dark" | "light";
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      foreground: string;
    };
    fonts: {
      display: string;
      body: string;
    };
  };

  // ── Solutions / Products ──
  solutions: {
    id: string;
    icon: string;
    titleTH: string;
    titleEN: string;
    titleCN: string;
    descTH: string;
    descEN: string;
    descCN: string;
    href: string;
    featured: boolean;
  }[];

  // ── Industries ──
  industries: {
    id: string;
    icon: string;
    titleTH: string;
    titleEN: string;
    titleCN: string;
    descTH: string;
    descEN: string;
    descCN: string;
    href: string;
  }[];

  // ── SEO ──
  seo: {
    titleTemplate: string;
    defaultTitle: string;
    defaultDescription: string;
    keywords: string[];
  };

  // ── Domain Lock (Anti-Copy) ──
  allowedDomains: string[];
}

const sirinxConfig: BrandConfig = {
  id: "sirinx",
  name: "SIRINX",
  tagline: "Solar Digital Agentic Company",
  legalName: "บริษัท ศิรินทร์ จำกัด",
  description: "ออกแบบ ติดตั้ง และบริหารระบบพลังงานครบวงจร ตั้งแต่ Solar และ BESS ไปจนถึง AI Energy Management",
  foundedYear: 2024,

  logo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/photo_2026-03-24_06-45-58_293d121c.jpg",
  favicon: "/favicon.ico",
  heroImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/hero-main-bCzCTCeaup46mVvtEbpjnr.webp",
  ogImage: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/hero-main-bCzCTCeaup46mVvtEbpjnr.webp",

  contact: {
    phone: "082-7963-265",
    email: "sirinxcompany@gmail.com",
    lineId: "@sirinx",
    lineUrl: "https://line.me/ti/p/~@sirinx",
    address: "จ.พิษณุโลก, ประเทศไทย",
    mapUrl: "https://maps.google.com/?q=พิษณุโลก",
  },

  social: {
    facebook: "https://www.facebook.com/profile.php?id=61574509075262",
    tiktok: "https://www.tiktok.com/@sirinx_solar",
    youtube: "https://www.youtube.com/@sirinx_solar",
  },

  trustBadges: [
    {
      name: "DBD Registered",
      imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/dbd-registered-bCzCTCeaup46mVvtEbpjnr.png",
    },
    {
      name: "Thailand Trust Mark",
      imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/ttm-logo-bCzCTCeaup46mVvtEbpjnr.png",
    },
  ],

  theme: {
    mode: "dark",
    colors: {
      primary: "#2dd4bf",     // Teal/Cyan accent
      secondary: "#f59e0b",   // Amber/Gold
      accent: "#06b6d4",      // Cyan
      background: "#0a1628",  // Deep navy
      foreground: "#f1f5f9",  // Light slate
    },
    fonts: {
      display: "IBM Plex Sans Thai, Inter, sans-serif",
      body: "IBM Plex Sans Thai, Inter, sans-serif",
    },
  },

  solutions: [
    {
      id: "rooftop",
      icon: "Sun",
      titleTH: "Rooftop Solar",
      titleEN: "Rooftop Solar",
      titleCN: "屋顶太阳能",
      descTH: "ลดค่าไฟ 30-100% ด้วยระบบโซลาร์+แบตเตอรี่ (BESS) ที่ออกแบบเฉพาะอาคาร",
      descEN: "Reduce electricity costs 30-100% with custom-designed solar + BESS systems",
      descCN: "通过定制设计的太阳能+储能系统降低30-100%的电费",
      href: "/solutions#rooftop",
      featured: true,
    },
    {
      id: "floating",
      icon: "Waves",
      titleTH: "Floating Solar",
      titleEN: "Floating Solar",
      titleCN: "水上太阳能",
      descTH: "ใช้พื้นที่ผิวน้ำให้เกิดประโยชน์สูงสุด เหมาะกับอ่างเก็บน้ำและบ่อน้ำอุตสาหกรรม",
      descEN: "Maximize water surface utilization for reservoirs and industrial ponds",
      descCN: "最大化水面利用率，适用于水库和工业池塘",
      href: "/solutions#floating",
      featured: true,
    },
    {
      id: "carport",
      icon: "Car",
      titleTH: "Solar Carport",
      titleEN: "Solar Carport",
      titleCN: "太阳能车棚",
      descTH: "เปลี่ยนที่จอดรถเป็นโรงไฟฟ้า รองรับ EV Charging ในอนาคต",
      descEN: "Transform parking areas into power plants with future EV Charging support",
      descCN: "将停车场变成发电站，支持未来EV充电",
      href: "/solutions#carport",
      featured: true,
    },
    {
      id: "bess",
      icon: "Battery",
      titleTH: "BESS / ESS",
      titleEN: "BESS / ESS",
      titleCN: "储能系统",
      descTH: "กักเก็บพลังงานเพื่อใช้ในช่วง peak หรือยามไฟดับ ลดค่า demand charge",
      descEN: "Store energy for peak hours or blackouts, reduce demand charges",
      descCN: "储存能量用于高峰时段或停电，降低需求费用",
      href: "/solutions#bess",
      featured: true,
    },
    {
      id: "ai-energy",
      icon: "Brain",
      titleTH: "AI Energy Management",
      titleEN: "AI Energy Management",
      titleCN: "AI能源管理",
      descTH: "ระบบ AI วิเคราะห์และเพิ่มประสิทธิภาพการใช้พลังงานแบบ real-time",
      descEN: "AI-powered real-time energy analysis and optimization",
      descCN: "AI驱动的实时能源分析和优化",
      href: "/solutions#ai-energy",
      featured: true,
    },
    {
      id: "ai-om",
      icon: "Wrench",
      titleTH: "Physical AI O&M",
      titleEN: "Physical AI O&M",
      titleCN: "AI运维",
      descTH: "ดูแลรักษาระบบด้วย predictive maintenance ลดความเสี่ยงเสียหาย",
      descEN: "Predictive maintenance to minimize system downtime and damage risk",
      descCN: "预测性维护，最大限度减少系统停机和损坏风险",
      href: "/solutions#ai-om",
      featured: true,
    },
  ],

  industries: [
    {
      id: "manufacturing",
      icon: "Factory",
      titleTH: "โรงงาน",
      titleEN: "Manufacturing",
      titleCN: "制造业",
      descTH: "ลดต้นทุนพลังงานการผลิต เพิ่มขีดความสามารถในการแข่งขัน",
      descEN: "Reduce manufacturing energy costs, increase competitiveness",
      descCN: "降低制造能源成本，提高竞争力",
      href: "/industries#manufacturing",
    },
    {
      id: "agriculture",
      icon: "Wheat",
      titleTH: "เกษตรกรรม",
      titleEN: "Agriculture",
      titleCN: "农业",
      descTH: "Floating Solar + Smart Farming ใช้พื้นที่น้ำให้เกิดประโยชน์คู่",
      descEN: "Floating Solar + Smart Farming for dual-use water areas",
      descCN: "水上太阳能+智慧农业，水面双重利用",
      href: "/industries#agriculture",
    },
    {
      id: "hospitality",
      icon: "Hotel",
      titleTH: "โรงแรม",
      titleEN: "Hospitality",
      titleCN: "酒店业",
      descTH: "ลดค่าพลังงาน เสริมภาพลักษณ์ Green Hotel ดึงดูดนักท่องเที่ยว",
      descEN: "Reduce energy costs, enhance Green Hotel image to attract tourists",
      descCN: "降低能源成本，提升绿色酒店形象吸引游客",
      href: "/industries#hospitality",
    },
    {
      id: "education",
      icon: "GraduationCap",
      titleTH: "สถานศึกษา",
      titleEN: "Education",
      titleCN: "教育",
      descTH: "ลดงบค่าไฟ สร้าง Living Lab ด้านพลังงานสะอาดให้นักเรียน",
      descEN: "Reduce electricity budgets, create clean energy Living Labs for students",
      descCN: "减少电费预算，为学生创建清洁能源实验室",
      href: "/industries#education",
    },
    {
      id: "commercial",
      icon: "Building2",
      titleTH: "อาคารพาณิชย์",
      titleEN: "Commercial Buildings",
      titleCN: "商业建筑",
      descTH: "เพิ่มมูลค่าอาคาร ลดค่าใช้จ่ายส่วนกลาง ตอบโจทย์ ESG",
      descEN: "Increase property value, reduce common charges, meet ESG goals",
      descCN: "提升物业价值，降低公共费用，满足ESG目标",
      href: "/industries#commercial",
    },
    {
      id: "government",
      icon: "Landmark",
      titleTH: "ภาครัฐ",
      titleEN: "Government",
      titleCN: "政府",
      descTH: "ลดงบประมาณค่าพลังงาน สนับสนุนเป้าหมาย Carbon Neutrality",
      descEN: "Reduce energy budgets, support Carbon Neutrality goals",
      descCN: "减少能源预算，支持碳中和目标",
      href: "/industries#government",
    },
  ],

  seo: {
    titleTemplate: "%s | SIRINX Solar",
    defaultTitle: "SIRINX — Solar Digital Agentic Company",
    defaultDescription: "ออกแบบ ติดตั้ง และบริหารระบบพลังงานครบวงจร Solar, BESS, AI Energy Management สำหรับธุรกิจไทย",
    keywords: ["Solar Carport", "โซลาร์เซลล์", "BESS", "AI Energy", "EV Charger", "ลดค่าไฟ", "SIRINX"],
  },

  allowedDomains: [
    "sirinxsolar-dfabnh7l.manus.space",
    "localhost",
    "127.0.0.1",
  ],
};

export default sirinxConfig;
