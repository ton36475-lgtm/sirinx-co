export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryKey: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
  author: string;
  tags: string[];
  localized?: Partial<Record<BlogLanguage, BlogPostLocalizedFields>>;
}

export type BlogLanguage = "th" | "en" | "cn";
export type BlogPostLocalizedFields = Pick<
  BlogPostMeta,
  "title" | "excerpt" | "category" | "date" | "readTime" | "author" | "tags"
>;

export const blogPosts: BlogPostMeta[] = [
  {
    slug: "rooftop-solar-roi-2025",
    title: "Rooftop Solar ROI ปี 2025: คุ้มค่าแค่ไหนสำหรับโรงงานไทย?",
    excerpt: "วิเคราะห์ผลตอบแทนการลงทุน Rooftop Solar สำหรับโรงงานในประเทศไทย พร้อมปัจจัยที่ส่งผลต่อ ROI ตัวเลขจริงจากโครงการที่ติดตั้ง และแนวโน้มราคาแผงโซลาร์ปี 2025-2026",
    category: "Investment & Tax",
    categoryKey: "investment",
    date: "10 เม.ย. 2025",
    readTime: "8 นาที",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop",
    featured: true,
    author: "ทีมวิศวกรรม SIRINX",
    tags: ["ROI", "Rooftop Solar", "โรงงาน", "การลงทุน"],
    localized: {
      en: {
        title: "Rooftop Solar ROI in 2025: Is It Worth It for Thai Factories?",
        excerpt:
          "A practical ROI guide for rooftop solar in Thai factories, including the variables that move payback, installed-project benchmarks, and solar panel cost trends for 2025-2026.",
        category: "Investment & Tax",
        date: "Apr 10, 2025",
        readTime: "8 min read",
        author: "SIRINX Engineering Team",
        tags: ["ROI", "Rooftop Solar", "Factory", "Investment"],
      },
      cn: {
        title: "2025 年屋顶太阳能 ROI：泰国工厂是否值得投资？",
        excerpt:
          "面向泰国工厂的屋顶太阳能投资回报分析，涵盖影响回本周期的因素、项目参考数据与 2025-2026 年组件价格趋势。",
        category: "投资与税务",
        date: "2025年4月10日",
        readTime: "8 分钟阅读",
        author: "SIRINX 工程团队",
        tags: ["ROI", "屋顶太阳能", "工厂", "投资"],
      },
    },
  },
  {
    slug: "ai-energy-management-guide",
    title: "AI Energy Management คืออะไร? ทำไมธุรกิจยุคใหม่ต้องมี",
    excerpt: "ทำความรู้จักกับระบบบริหารจัดการพลังงานด้วย AI ที่ช่วยลดค่าไฟเพิ่มอีก 10-20% จากโซลาร์เพียงอย่างเดียว เพิ่มประสิทธิภาพ และสร้างข้อมูลเชิงลึกสำหรับธุรกิจ",
    category: "Energy Management",
    categoryKey: "energy-mgmt",
    date: "5 เม.ย. 2025",
    readTime: "6 นาที",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop",
    featured: true,
    author: "ทีม AI & Data SIRINX",
    tags: ["AI", "Energy Management", "Smart Building", "IoT"],
    localized: {
      en: {
        title: "What Is AI Energy Management and Why Modern Businesses Need It",
        excerpt:
          "An introduction to AI-powered energy management systems that can improve savings beyond solar alone, raise operational efficiency, and turn energy data into business insight.",
        category: "Energy Management",
        date: "Apr 5, 2025",
        readTime: "6 min read",
        author: "SIRINX AI & Data Team",
        tags: ["AI", "Energy Management", "Smart Building", "IoT"],
      },
      cn: {
        title: "什么是 AI 能源管理？为什么现代企业需要它",
        excerpt:
          "介绍 AI 能源管理系统如何在太阳能之外进一步提升节能效果、优化运营效率，并将能源数据转化为业务洞察。",
        category: "能源管理",
        date: "2025年4月5日",
        readTime: "6 分钟阅读",
        author: "SIRINX AI 与数据团队",
        tags: ["AI", "能源管理", "智能建筑", "IoT"],
      },
    },
  },
  {
    slug: "floating-solar-thailand",
    title: "Floating Solar ในประเทศไทย: โอกาสและความท้าทาย",
    excerpt: "สำรวจศักยภาพของ Floating Solar ในประเทศไทย ตั้งแต่อ่างเก็บน้ำชลประทานไปจนถึงบ่อน้ำอุตสาหกรรม พร้อมเปรียบเทียบต้นทุนกับ Rooftop Solar",
    category: "Solar Technology",
    categoryKey: "solar-tech",
    date: "28 มี.ค. 2025",
    readTime: "7 นาที",
    image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop",
    author: "ทีมวิศวกรรม SIRINX",
    tags: ["Floating Solar", "เทคโนโลยี", "อ่างเก็บน้ำ"],
    localized: {
      en: {
        title: "Floating Solar in Thailand: Opportunities and Constraints",
        excerpt:
          "A review of Thailand's floating solar potential, from irrigation reservoirs to industrial ponds, with a cost comparison against rooftop solar.",
        category: "Solar Technology",
        date: "Mar 28, 2025",
        readTime: "7 min read",
        author: "SIRINX Engineering Team",
        tags: ["Floating Solar", "Technology", "Reservoir"],
      },
      cn: {
        title: "泰国漂浮式太阳能：机会与挑战",
        excerpt:
          "梳理泰国漂浮式太阳能的潜力，从灌溉水库到工业水池，并与屋顶太阳能进行成本对比。",
        category: "太阳能技术",
        date: "2025年3月28日",
        readTime: "7 分钟阅读",
        author: "SIRINX 工程团队",
        tags: ["漂浮式太阳能", "技术", "水库"],
      },
    },
  },
  {
    slug: "solar-tax-benefits-thailand",
    title: "สิทธิประโยชน์ทางภาษีจากการลงทุนโซลาร์ ปี 2025",
    excerpt: "สรุปสิทธิประโยชน์ทางภาษีที่เป็นไปได้จากการลงทุนพลังงานแสงอาทิตย์ ตั้งแต่ค่าเสื่อมราคาเร่ง BOI ไปจนถึง Carbon Credit ที่อาจได้รับ",
    category: "Investment & Tax",
    categoryKey: "investment",
    date: "20 มี.ค. 2025",
    readTime: "5 นาที",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    author: "ทีมที่ปรึกษาการลงทุน SIRINX",
    tags: ["ภาษี", "BOI", "ค่าเสื่อมราคา", "Carbon Credit"],
    localized: {
      en: {
        title: "Solar Investment Tax Benefits in Thailand for 2025",
        excerpt:
          "A practical summary of potential solar-related tax benefits, including accelerated depreciation, BOI promotion, and carbon credit opportunities.",
        category: "Investment & Tax",
        date: "Mar 20, 2025",
        readTime: "5 min read",
        author: "SIRINX Investment Advisory Team",
        tags: ["Tax", "BOI", "Depreciation", "Carbon Credit"],
      },
      cn: {
        title: "2025 年泰国太阳能投资税务优惠",
        excerpt:
          "概述太阳能投资可能涉及的税务优惠，包括加速折旧、BOI 促进政策与碳信用机会。",
        category: "投资与税务",
        date: "2025年3月20日",
        readTime: "5 分钟阅读",
        author: "SIRINX 投资顾问团队",
        tags: ["税务", "BOI", "折旧", "碳信用"],
      },
    },
  },
  {
    slug: "bess-peak-shaving",
    title: "BESS กับ Peak Shaving: ลดค่า Demand Charge อย่างไร",
    excerpt: "เข้าใจหลักการ Peak Shaving ด้วย Battery Energy Storage System วิธีคำนวณความคุ้มค่า และกรณีศึกษาจากโรงงานที่ลดค่า demand charge ได้ 30%",
    category: "Solar Technology",
    categoryKey: "solar-tech",
    date: "15 มี.ค. 2025",
    readTime: "6 นาที",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop",
    author: "ทีมวิศวกรรม SIRINX",
    tags: ["BESS", "Peak Shaving", "Demand Charge", "แบตเตอรี่"],
    localized: {
      en: {
        title: "BESS and Peak Shaving: How Battery Storage Reduces Demand Charge",
        excerpt:
          "A practical guide to peak shaving with Battery Energy Storage Systems, including sizing logic, payback factors, and demand-charge reduction use cases.",
        category: "Solar Technology",
        date: "Mar 15, 2025",
        readTime: "6 min read",
        author: "SIRINX Engineering Team",
        tags: ["BESS", "Peak Shaving", "Demand Charge", "Battery"],
      },
      cn: {
        title: "BESS 与削峰：电池储能如何降低需量电费",
        excerpt:
          "介绍利用电池储能系统进行削峰的原理、容量评估方式、回本因素与降低需量电费的应用场景。",
        category: "太阳能技术",
        date: "2025年3月15日",
        readTime: "6 分钟阅读",
        author: "SIRINX 工程团队",
        tags: ["BESS", "削峰", "需量电费", "电池"],
      },
    },
  },
  {
    slug: "esg-solar-reporting",
    title: "ESG Reporting กับพลังงานโซลาร์: สิ่งที่ธุรกิจต้องรู้",
    excerpt: "แนวทางการรายงาน ESG สำหรับธุรกิจที่ใช้พลังงานโซลาร์ ตั้งแต่การคำนวณ Carbon Footprint ไปจนถึง Scope 2 Emissions ตามมาตรฐาน GRI",
    category: "ESG & Sustainability",
    categoryKey: "esg",
    date: "8 มี.ค. 2025",
    readTime: "7 นาที",
    image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=600&h=400&fit=crop",
    author: "ทีม ESG SIRINX",
    tags: ["ESG", "Carbon Footprint", "Scope 2", "GRI"],
    localized: {
      en: {
        title: "ESG Reporting and Solar Energy: What Businesses Need to Know",
        excerpt:
          "How solar energy supports ESG reporting, from carbon footprint calculations to Scope 2 emissions disclosure under frameworks such as GRI.",
        category: "ESG & Sustainability",
        date: "Mar 8, 2025",
        readTime: "7 min read",
        author: "SIRINX ESG Team",
        tags: ["ESG", "Carbon Footprint", "Scope 2", "GRI"],
      },
      cn: {
        title: "ESG 报告与太阳能：企业需要了解什么",
        excerpt:
          "说明太阳能如何支持 ESG 报告，从碳足迹计算到 Scope 2 排放披露，以及 GRI 等标准下的数据应用。",
        category: "ESG 与可持续发展",
        date: "2025年3月8日",
        readTime: "7 分钟阅读",
        author: "SIRINX ESG 团队",
        tags: ["ESG", "碳足迹", "Scope 2", "GRI"],
      },
    },
  },
  {
    slug: "solar-panel-comparison-2025",
    title: "เปรียบเทียบแผงโซลาร์ 2025: Mono PERC vs TOPCon vs HJT",
    excerpt: "เปรียบเทียบเทคโนโลยีแผงโซลาร์ 3 ประเภทหลักในปี 2025 ทั้งประสิทธิภาพ ราคา อายุการใช้งาน และความเหมาะสมกับสภาพอากาศไทย",
    category: "Solar Technology",
    categoryKey: "solar-tech",
    date: "1 มี.ค. 2025",
    readTime: "9 นาที",
    image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=600&h=400&fit=crop",
    author: "ทีมวิศวกรรม SIRINX",
    tags: ["แผงโซลาร์", "TOPCon", "HJT", "Mono PERC"],
    localized: {
      en: {
        title: "Solar Panel Comparison 2025: Mono PERC vs TOPCon vs HJT",
        excerpt:
          "A comparison of leading solar panel technologies in 2025, including efficiency, price, lifespan, and suitability for Thailand's climate.",
        category: "Solar Technology",
        date: "Mar 1, 2025",
        readTime: "9 min read",
        author: "SIRINX Engineering Team",
        tags: ["Solar Panel", "TOPCon", "HJT", "Mono PERC"],
      },
      cn: {
        title: "2025 太阳能组件对比：Mono PERC、TOPCon 与 HJT",
        excerpt:
          "比较 2025 年主要太阳能组件技术的效率、价格、寿命，以及在泰国高温气候下的适用性。",
        category: "太阳能技术",
        date: "2025年3月1日",
        readTime: "9 分钟阅读",
        author: "SIRINX 工程团队",
        tags: ["太阳能组件", "TOPCon", "HJT", "Mono PERC"],
      },
    },
  },
  {
    slug: "net-metering-thailand-guide",
    title: "Net Metering ในไทย: ขายไฟคืนกริดได้จริงหรือ?",
    excerpt: "อัพเดตสถานะ Net Metering ในประเทศไทย ข้อกำหนดของ กกพ. ขั้นตอนการขอ และการคำนวณรายได้จากการขายไฟคืน",
    category: "Industry Insights",
    categoryKey: "industry",
    date: "22 ก.พ. 2025",
    readTime: "6 นาที",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=400&fit=crop",
    author: "ทีมกฎหมายและนโยบาย SIRINX",
    tags: ["Net Metering", "กกพ.", "ขายไฟคืน", "นโยบาย"],
    localized: {
      en: {
        title: "Net Metering in Thailand: Can You Really Sell Power Back?",
        excerpt:
          "An update on Thailand's net metering landscape, regulator requirements, application steps, and the business logic behind grid-export revenue.",
        category: "Industry Insights",
        date: "Feb 22, 2025",
        readTime: "6 min read",
        author: "SIRINX Legal & Policy Team",
        tags: ["Net Metering", "ERC", "Grid Export", "Policy"],
      },
      cn: {
        title: "泰国 Net Metering：真的可以卖电回电网吗？",
        excerpt:
          "更新泰国 Net Metering 现状、监管要求、申请步骤，以及售电回网收益的商业逻辑。",
        category: "行业洞察",
        date: "2025年2月22日",
        readTime: "6 分钟阅读",
        author: "SIRINX 法务与政策团队",
        tags: ["Net Metering", "ERC", "售电回网", "政策"],
      },
    },
  },
  {
    slug: "solar-carport-ev-charging",
    title: "Solar Carport + EV Charging: อนาคตที่จอดรถอัจฉริยะ",
    excerpt: "แนวคิด Solar Carport ที่รวม EV Charging Station ไว้ในที่เดียว เหมาะกับห้างสรรพสินค้า โรงแรม และอาคารสำนักงาน พร้อมตัวอย่างการคำนวณ",
    category: "Solar Technology",
    categoryKey: "solar-tech",
    date: "15 ก.พ. 2025",
    readTime: "5 นาที",
    image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&h=400&fit=crop",
    author: "ทีมวิศวกรรม SIRINX",
    tags: ["Solar Carport", "EV Charging", "ที่จอดรถ", "อาคารพาณิชย์"],
    localized: {
      en: {
        title: "Solar Carport + EV Charging: The Future of Smart Parking",
        excerpt:
          "How solar carports and EV charging can work together for malls, hotels, offices, and commercial car parks, with a practical sizing example.",
        category: "Solar Technology",
        date: "Feb 15, 2025",
        readTime: "5 min read",
        author: "SIRINX Engineering Team",
        tags: ["Solar Carport", "EV Charging", "Parking", "Commercial Building"],
      },
      cn: {
        title: "太阳能车棚 + EV 充电：智慧停车的未来",
        excerpt:
          "介绍太阳能车棚与 EV 充电如何结合，适用于商场、酒店、办公楼和商业停车场，并附容量估算示例。",
        category: "太阳能技术",
        date: "2025年2月15日",
        readTime: "5 分钟阅读",
        author: "SIRINX 工程团队",
        tags: ["太阳能车棚", "EV 充电", "停车场", "商业建筑"],
      },
    },
  },
];

export function getLocalizedBlogPosts(lang: BlogLanguage): BlogPostMeta[] {
  if (lang === "th") return blogPosts;
  return blogPosts.map(post => ({
    ...post,
    ...(post.localized?.[lang] ?? {}),
  }));
}

export function getLocalizedBlogPost(
  slug: string,
  lang: BlogLanguage
): BlogPostMeta | undefined {
  return getLocalizedBlogPosts(lang).find(post => post.slug === slug);
}
