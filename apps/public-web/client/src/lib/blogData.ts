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
}

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
  },
];
