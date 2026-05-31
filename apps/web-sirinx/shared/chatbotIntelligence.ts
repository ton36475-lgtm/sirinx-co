export type ChatbotRole = "user" | "assistant" | "system";

export type ChatbotMessage = {
  role: ChatbotRole;
  content: string;
};

export type ChatbotIntent =
  | "pricing_roi"
  | "solar_carport"
  | "rooftop"
  | "bess"
  | "ev_charging"
  | "tax_boi"
  | "maintenance"
  | "lead_ready"
  | "assessment"
  | "general";

export type LeadField =
  | "solution"
  | "monthlyBill"
  | "siteType"
  | "location"
  | "area"
  | "timeline"
  | "contact";

export type LeadQualification = {
  intent: ChatbotIntent;
  latestUserMessage: string;
  knownFields: LeadField[];
  missingFields: LeadField[];
  suggestedQuestions: string[];
  fieldCount: number;
};

export const CHATBOT_QUICK_REPLIES = [
  {
    label: "ขอใบเสนอราคา Solar Carport",
    message: "ต้องการขอใบเสนอราคา Solar Carport สำหรับองค์กร",
  },
  {
    label: "คำนวณลดค่าไฟเบื้องต้น",
    message: "ช่วยประเมินเบื้องต้นว่าระบบโซลาร์จะลดค่าไฟได้อย่างไร",
  },
  {
    label: "Rooftop หรือ Carport ดี",
    message: "ควรเลือก Rooftop Solar หรือ Solar Carport สำหรับพื้นที่ของเรา",
  },
  {
    label: "BESS / EV Charger",
    message: "อยากทราบการใช้ BESS และ EV Charger ร่วมกับระบบโซลาร์",
  },
  {
    label: "นัดสำรวจหน้างาน",
    message: "ต้องการนัดทีมวิศวกรมาสำรวจหน้างาน",
  },
] as const;

const CONTACT_CTA =
  "เมื่อพร้อมประเมินจริง ส่งบิลค่าไฟ 3-12 เดือน รูปพื้นที่ และโลเคชันให้ทีม SIRINX ทาง LINE @sirinx เพื่อคัดขนาดระบบและนัดสำรวจ";

const FIELD_ORDER: LeadField[] = [
  "solution",
  "monthlyBill",
  "siteType",
  "location",
  "area",
  "timeline",
  "contact",
];

const FIELD_QUESTIONS: Record<LeadField, string> = {
  solution: "สนใจ Solar Carport, Rooftop, BESS หรือ EV Charger เป็นหลักครับ?",
  monthlyBill: "ค่าไฟเฉลี่ยต่อเดือนประมาณกี่บาท หรือมีบิลค่าไฟย้อนหลังไหมครับ?",
  siteType:
    "พื้นที่เป็นโรงงาน โรงแรม ห้าง อาคารสำนักงาน สถานศึกษา หรือหน่วยงานประเภทใดครับ?",
  location: "ไซต์งานอยู่จังหวัดหรือโซนไหนครับ?",
  area: "มีพื้นที่จอดรถ หลังคา หรือพื้นที่ว่างประมาณกี่ตารางเมตร/กี่ช่องจอดครับ?",
  timeline: "ต้องการเริ่มสำรวจหรือติดตั้งช่วงเดือนไหนครับ?",
  contact: "สะดวกให้ทีมติดต่อกลับผ่าน LINE, เบอร์โทร หรืออีเมลช่องทางใดครับ?",
};

const PROVINCE_KEYWORDS = [
  "กรุงเทพ",
  "นนทบุรี",
  "ปทุมธานี",
  "สมุทรปราการ",
  "นครปฐม",
  "ชลบุรี",
  "ระยอง",
  "ฉะเชิงเทรา",
  "อยุธยา",
  "สระบุรี",
  "นครราชสีมา",
  "เชียงใหม่",
  "เชียงราย",
  "ขอนแก่น",
  "ภูเก็ต",
  "สุราษฎร์",
  "สงขลา",
  "หาดใหญ่",
  "ระยอง",
  "อีอีซี",
  "eec",
];

const SITE_TYPE_KEYWORDS = [
  "โรงงาน",
  "factory",
  "warehouse",
  "คลัง",
  "ห้าง",
  "mall",
  "โรงแรม",
  "hotel",
  "รีสอร์ท",
  "สำนักงาน",
  "office",
  "โรงเรียน",
  "มหาวิทยาลัย",
  "สถานศึกษา",
  "ราชการ",
  "โรงพยาบาล",
  "hospital",
  "คอนโด",
  "หมู่บ้าน",
  "อาคาร",
];

const SOLUTION_KEYWORDS = [
  "solar",
  "โซลาร์",
  "โซล่า",
  "แผง",
  "carport",
  "ที่จอด",
  "rooftop",
  "หลังคา",
  "bess",
  "battery",
  "แบต",
  "ev",
  "charger",
  "ชาร์จ",
];

const normalize = (value: string) => value.trim().toLowerCase();

const includesAny = (value: string, keywords: string[]) =>
  keywords.some(keyword => value.includes(keyword));

const getUserMessages = (messages: ChatbotMessage[]) =>
  messages.filter(message => message.role === "user");

const getLatestUserMessage = (messages: ChatbotMessage[]) =>
  getUserMessages(messages).at(-1)?.content.trim() ?? "";

const getConversationText = (messages: ChatbotMessage[]) =>
  getUserMessages(messages)
    .map(message => message.content)
    .join("\n")
    .toLowerCase();

export const detectChatbotIntent = (message: string): ChatbotIntent => {
  const normalized = normalize(message);

  if (
    includesAny(normalized, [
      "นัด",
      "สำรวจ",
      "ใบเสนอราคา",
      "เสนอราคา",
      "ติดต่อกลับ",
      "คุยกับทีม",
      "พร้อม",
    ])
  ) {
    return "lead_ready";
  }

  if (includesAny(normalized, ["ภาษี", "boi", "ลดหย่อน", "สิทธิประโยชน์"])) {
    return "tax_boi";
  }

  if (
    includesAny(normalized, [
      "ราคา",
      "ค่าไฟ",
      "คืนทุน",
      "roi",
      "payback",
      "lcoe",
      "คำนวณ",
      "ประเมิน",
      "ประหยัด",
    ])
  ) {
    return "pricing_roi";
  }

  if (
    includesAny(normalized, ["bess", "battery", "แบต", "demand", "peak", "พีก"])
  ) {
    return "bess";
  }

  if (includesAny(normalized, ["ev", "charger", "ชาร์จ", "รถไฟฟ้า"])) {
    return "ev_charging";
  }

  if (includesAny(normalized, ["carport", "ที่จอด", "ลานจอด", "โรงจอด"])) {
    return "solar_carport";
  }

  if (includesAny(normalized, ["หลังคา", "rooftop", "roof", "ดาดฟ้า"])) {
    return "rooftop";
  }

  if (
    includesAny(normalized, [
      "o&m",
      "om",
      "maintenance",
      "ล้างแผง",
      "ซ่อม",
      "ดูแล",
    ])
  ) {
    return "maintenance";
  }

  if (includesAny(normalized, ["assessment", "ประเมินไซต์", "แบบฟอร์ม"])) {
    return "assessment";
  }

  return "general";
};

const extractKnownLeadFields = (
  messages: ChatbotMessage[],
  intent: ChatbotIntent
) => {
  const conversation = getConversationText(messages);
  const known = new Set<LeadField>();

  if (intent !== "general" || includesAny(conversation, SOLUTION_KEYWORDS)) {
    known.add("solution");
  }

  if (
    /(?:ค่าไฟ|บิล|bill|kwh|หน่วย)[^\n]{0,24}(?:\d[\d,]*(?:\.\d+)?)/i.test(
      conversation
    ) ||
    /(?:\d[\d,]*(?:\.\d+)?)[^\n]{0,16}(?:บาท|฿|thb|kwh|หน่วย|หมื่น|แสน)/i.test(
      conversation
    )
  ) {
    known.add("monthlyBill");
  }

  if (includesAny(conversation, SITE_TYPE_KEYWORDS)) {
    known.add("siteType");
  }

  if (includesAny(conversation, PROVINCE_KEYWORDS)) {
    known.add("location");
  }

  if (
    /(?:\d[\d,]*(?:\.\d+)?)[^\n]{0,16}(?:ตร\.?ม\.?|ตารางเมตร|sqm|m2|ไร่|ช่องจอด|คัน|หลังคา)/i.test(
      conversation
    )
  ) {
    known.add("area");
  }

  if (
    includesAny(conversation, [
      "ด่วน",
      "เดือนนี้",
      "เดือนหน้า",
      "ไตรมาส",
      "q1",
      "q2",
      "q3",
      "q4",
      "ปีนี้",
      "ปีหน้า",
    ]) ||
    /(?:ภายใน|ช่วง)\s*[^\n]{0,24}(?:วัน|สัปดาห์|เดือน|ไตรมาส|ปี|q[1-4])/i.test(
      conversation
    )
  ) {
    known.add("timeline");
  }

  if (
    /(?:\+?66|0)\d{8,9}/.test(conversation) ||
    /[^\s@]+@[^\s@]+\.[^\s@]+/.test(conversation) ||
    includesAny(conversation, [
      "line",
      "ไลน์",
      "@sirinx",
      "โทร",
      "email",
      "อีเมล",
    ])
  ) {
    known.add("contact");
  }

  return FIELD_ORDER.filter(field => known.has(field));
};

export const analyzeChatbotConversation = (
  messages: ChatbotMessage[]
): LeadQualification => {
  const latestUserMessage = getLatestUserMessage(messages);
  const intent = detectChatbotIntent(latestUserMessage);
  const knownFields = extractKnownLeadFields(messages, intent);
  const missingFields = FIELD_ORDER.filter(
    field => !knownFields.includes(field)
  );

  return {
    intent,
    latestUserMessage,
    knownFields,
    missingFields,
    suggestedQuestions: missingFields
      .slice(0, 2)
      .map(field => FIELD_QUESTIONS[field]),
    fieldCount: FIELD_ORDER.length,
  };
};

const getIntentGuidance = (intent: ChatbotIntent) => {
  switch (intent) {
    case "pricing_roi":
      return "ประเมินค่าไฟและ ROI ได้ครับ แต่ต้องอิงบิลค่าไฟ, tariff, load profile, พื้นที่ติดตั้ง และรูปแบบลงทุนจริงก่อน จึงจะสรุปขนาดระบบ, LCOE และ payback ได้โดยไม่ฟันธงเกินข้อมูล";
    case "solar_carport":
      return "Solar Carport เป็นตัวเลือกหลักของ SIRINX สำหรับองค์กรที่มีลานจอดรถ เพราะผลิตไฟฟ้าได้, ให้ร่มเงา, รองรับ EV Charger และต่อยอด BESS/AI Energy Management ได้ในระบบเดียว";
    case "rooftop":
      return "Rooftop Solar เหมาะเมื่อหลังคาแข็งแรง พื้นที่รับแดดดี และโหลดไฟกลางวันสูง ควรเทียบกับ Solar Carport หากมีพื้นที่จอดรถ เพราะ Carport เพิ่มประโยชน์ด้านโครงสร้างและ EV ได้มากกว่า";
    case "bess":
      return "BESS เหมาะกับไซต์ที่มี demand charge สูง, โหลดพีกชัด, ต้องการสำรองไฟ หรืออยากใช้พลังงานโซลาร์ให้ยืดหยุ่นขึ้น ขนาดแบตต้องออกแบบจากกราฟโหลดและ tariff จริง";
    case "ev_charging":
      return "EV Charger ควรวางร่วมกับ Solar Carport และระบบจัดการพลังงาน เพื่อคุมโหลดชาร์จ, ลดพีก และเตรียมต่อ BESS ในอนาคต โดยต้องดูจำนวนหัวชาร์จและพฤติกรรมรถเข้าออกจริง";
    case "tax_boi":
      return "เรื่องภาษีหรือ BOI ต้องตรวจตามเงื่อนไขล่าสุดกับผู้เชี่ยวชาญหรือหน่วยงานที่เกี่ยวข้องก่อนใช้ในข้อเสนอจริง SIRINX ช่วยเตรียมข้อมูลพลังงานและสมมติฐานทางการเงินให้ตรวจต่อได้";
    case "maintenance":
      return "งาน O&M ควรวางรอบตรวจ, ล้างแผง, drone inspection, inverter monitoring และ performance ratio review เพื่อรักษาผลิตไฟจริง ไม่ใช่ดูแค่กำลังติดตั้งบนกระดาษ";
    case "lead_ready":
      return "รับโจทย์ได้ครับ ขั้นต่อไปคือรวบรวมข้อมูลให้ทีมวิศวกรประเมินขนาดระบบและนัดสำรวจหน้างาน โดยยังไม่ควรสรุปราคาแน่นอนก่อนเห็นข้อมูลไซต์จริง";
    case "assessment":
      return "การประเมินไซต์ควรเริ่มจากบิลค่าไฟ, รูปพื้นที่, โลเคชัน, ประเภทอาคาร และเป้าหมายการลงทุน จากนั้นค่อยเลือก Solar Carport, Rooftop, BESS หรือ EV Charger ที่เหมาะที่สุด";
    default:
      return "SIRINX ช่วยองค์กรวางแผน Solar Carport, Rooftop Solar, BESS, EV Charger, AI Energy Management และ O&M โดยเน้นประเมินจากข้อมูลจริงก่อนสรุปตัวเลขทางการเงิน";
  }
};

export const createSmartChatbotReply = (messages: ChatbotMessage[]) => {
  const analysis = analyzeChatbotConversation(messages);
  const progress = `ข้อมูลประเมินตอนนี้ ${analysis.knownFields.length}/${analysis.fieldCount} ส่วน`;
  const questions = analysis.suggestedQuestions.length
    ? `\n\nเพื่อประเมินต่อ ขอข้อมูลเพิ่ม ${analysis.suggestedQuestions.length} ข้อ:\n${analysis.suggestedQuestions
        .map(question => `- ${question}`)
        .join("\n")}`
    : "\n\nข้อมูลเบื้องต้นค่อนข้างครบแล้ว ทีมวิศวกรสามารถใช้ต่อยอดเป็น sizing และนัดสำรวจได้";

  return `${getIntentGuidance(analysis.intent)}\n\n${progress}.${questions}\n\n${CONTACT_CTA}`;
};

const UNSAFE_CLAIM_PATTERNS = [
  /ลดค่าไฟ[^\n.]{0,60}100\s*%/i,
  /คืนทุน[^\n.]{0,30}3\s*[-–]\s*5\s*ปี/i,
  /รับประกัน[^\n.]{0,60}(?:ลดค่าไฟ|คืนทุน|roi|payback)/i,
  /การันตี[^\n.]{0,60}(?:ลดค่าไฟ|คืนทุน|roi|payback)/i,
  /guarantee[^\n.]{0,60}(?:saving|payback|roi)/i,
];

export const sanitizeChatbotReply = (
  reply: string | undefined,
  messages: ChatbotMessage[]
) => {
  const trimmed = reply?.trim() ?? "";

  if (!trimmed) {
    return createSmartChatbotReply(messages);
  }

  if (UNSAFE_CLAIM_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return createSmartChatbotReply(messages);
  }

  return trimmed;
};
