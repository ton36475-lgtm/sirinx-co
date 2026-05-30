type DeviceType = "mobile" | "desktop" | "tablet" | "unknown";
type SourceType = "ad" | "organic" | "direct" | "affiliate" | "broadcast" | "manual";

type VipTier = "standard" | "vip" | "vvip" | "whale";
type VipLevel = "prospect" | "vip" | "vvip" | "whale";
type AffordabilityBand = "unknown" | "mid" | "high" | "whale";
type TrafficStatus = "trusted" | "review" | "suspicious";

export type LeadQualityInput = {
  fullName?: string;
  phone?: string;
  lineId?: string;
  telegramHandle?: string;
  landingPage?: string;
  referrer?: string;
  deviceType: DeviceType;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  primaryIntent?: string;
  notes?: string;
  sourceType: SourceType;
};

export type LeadQualityAssessment = {
  score: number;
  vipTier: VipTier;
  vipLevel: VipLevel;
  affordabilityBand: AffordabilityBand;
  trafficStatus: TrafficStatus;
  segmentLabel: string;
  reasons: string[];
  riskFlags: string[];
  expectedResult: string;
  actualResult: string;
  reviewNotes?: string;
  notificationTitle: string;
  notificationContent: string;
};

const suspiciousPattern = /(bot|crawler|spider|headless|selenium|playwright|preview|localhost|127\.0\.0\.1|dummy|sample|testing|test lead)/i;
const highIntentPattern = /(vip|vvip|whale|high-value|high value|หวยจ่ายสูง|lottery|casino|slot)/i;
const knownPaidSources = new Set(["meta", "facebook", "google", "tiktok", "line", "telegram", "affiliate"]);

function normalizeText(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function assessLeadQuality(input: LeadQualityInput): LeadQualityAssessment {
  let score = 35;
  const reasons: string[] = ["เริ่มต้นจากคะแนนฐานสำหรับ lead ใหม่ที่ยังไม่ผ่านการยืนยันคุณภาพเพิ่มเติม"];
  const riskFlags: string[] = [];

  const normalizedName = normalizeText(input.fullName);
  const normalizedReferrer = normalizeText(input.referrer);
  const normalizedLandingPage = normalizeText(input.landingPage);
  const normalizedSource = normalizeText(input.utmSource);
  const normalizedCampaign = normalizeText(input.utmCampaign);
  const normalizedNotes = normalizeText(input.notes);
  const normalizedIntent = normalizeText(input.primaryIntent);

  if (input.phone) {
    score += 18;
    reasons.push("มีเบอร์โทรศัพท์สำหรับติดตามต่อโดยตรง");
  }

  if (input.lineId || input.telegramHandle) {
    score += 10;
    reasons.push("มีช่องทางแชตเพิ่มเติมสำหรับ CRM follow-up");
  }

  if (normalizedSource) {
    score += 8;
    reasons.push("มี UTM source ทำให้ระบุแหล่งที่มาของทราฟฟิกได้ชัดเจน");
  }

  if (normalizedCampaign) {
    score += 10;
    reasons.push("มี UTM campaign ทำให้ผูกผลลัพธ์กับแคมเปญได้โปร่งใส");
  }

  if (knownPaidSources.has(normalizedSource) || input.sourceType === "affiliate" || input.sourceType === "ad") {
    score += 7;
    reasons.push("แหล่งที่มาของ lead อยู่ในกลุ่มที่ติดตาม attribution ได้");
  }

  if (highIntentPattern.test(normalizedIntent) || highIntentPattern.test(normalizedNotes)) {
    score += 12;
    reasons.push("intent หรือข้อความประกอบสะท้อนความสนใจเชิงพาณิชย์ค่อนข้างชัด");
  }

  if (input.deviceType === "mobile" || input.deviceType === "desktop") {
    score += 5;
    reasons.push("ระบบตรวจอุปกรณ์ของผู้ใช้ได้ชัดเจน");
  }

  if (normalizedReferrer && normalizedReferrer !== "direct") {
    score += 5;
    reasons.push("มี referrer ช่วยยืนยันที่มาของทราฟฟิก");
  }

  if (normalizedNotes.length >= 20) {
    score += 4;
    reasons.push("มีข้อมูลเชิงพฤติกรรมเพิ่มเติมจากข้อความประกอบ");
  }

  if (!input.phone && !input.lineId && !input.telegramHandle) {
    score -= 25;
    riskFlags.push("missing_contact_channel");
    reasons.push("ไม่มีช่องทางติดต่อที่ชัดเจนจึงติดตามต่อได้ยาก");
  }

  if (input.deviceType === "unknown") {
    score -= 6;
    riskFlags.push("unknown_device_type");
    reasons.push("ไม่สามารถระบุประเภทอุปกรณ์ได้ชัดเจน");
  }

  const suspiciousSignals = [normalizedName, normalizedReferrer, normalizedLandingPage, normalizedCampaign, normalizedNotes].filter(Boolean);
  if (suspiciousSignals.some((value) => suspiciousPattern.test(value))) {
    score -= 35;
    riskFlags.push("suspicious_pattern_detected");
    reasons.push("พบรูปแบบคำที่มักเกี่ยวข้องกับ bot, traffic ทดสอบ หรือ preview environment");
  }

  const finalScore = clampScore(score);
  const trafficStatus: TrafficStatus =
    riskFlags.includes("suspicious_pattern_detected") || finalScore < 35
      ? "suspicious"
      : finalScore < 60
        ? "review"
        : "trusted";

  const vipTier: VipTier = finalScore >= 85 ? "whale" : finalScore >= 70 ? "vvip" : finalScore >= 55 ? "vip" : "standard";
  const vipLevel: VipLevel = vipTier === "standard" ? "prospect" : vipTier;
  const affordabilityBand: AffordabilityBand = vipTier === "whale" ? "whale" : vipTier === "vvip" ? "high" : vipTier === "vip" ? "mid" : "unknown";

  const segmentLabel =
    vipTier === "whale"
      ? "High Intent Whale Prospect"
      : trafficStatus === "suspicious"
        ? "Traffic Review Required"
        : finalScore >= 60
          ? "Qualified Paid Traffic Lead"
          : "New Lead";

  const summaryLine = `คะแนนคุณภาพ ${finalScore}/100 • สถานะทราฟฟิก ${trafficStatus} • VIP tier ${vipTier}`;
  const expectedResult = "ประเมินคุณภาพ lead ใหม่แบบโปร่งใสและแจ้งทีมงานเมื่อพบ lead ที่ควรติดตามทันที";
  const actualResult = `${summaryLine} • เหตุผลหลัก: ${reasons.slice(0, 3).join(" | ")}`;
  const reviewNotes = riskFlags.length > 0 ? `สัญญาณที่ต้องทบทวน: ${riskFlags.join(", ")}` : undefined;

  const leadLabel = input.fullName || input.phone || input.lineId || "Lead ใหม่";
  const notificationTitle = vipTier === "whale" || vipTier === "vvip"
    ? `CHOKMA พบ lead คุณภาพสูง: ${leadLabel}`
    : `CHOKMA มี lead ใหม่เข้าสู่ระบบ: ${leadLabel}`;

  const notificationContent = [
    `Lead: ${leadLabel}`,
    `คะแนนคุณภาพ: ${finalScore}/100`,
    `สถานะทราฟฟิก: ${trafficStatus}`,
    `แหล่งที่มา: ${input.utmSource || input.sourceType || "unknown"}`,
    `แคมเปญ: ${input.utmCampaign || "unassigned"}`,
    `อุปกรณ์: ${input.deviceType}`,
    `เหตุผลสำคัญ: ${reasons.slice(0, 4).join(" | ")}`,
    riskFlags.length > 0 ? `ต้องทบทวนเพิ่ม: ${riskFlags.join(", ")}` : "ไม่มีสัญญาณเสี่ยงสำคัญจากกฎโปร่งใสที่ตั้งไว้",
  ].join("\n");

  return {
    score: finalScore,
    vipTier,
    vipLevel,
    affordabilityBand,
    trafficStatus,
    segmentLabel,
    reasons,
    riskFlags,
    expectedResult,
    actualResult,
    reviewNotes,
    notificationTitle,
    notificationContent,
  };
}
