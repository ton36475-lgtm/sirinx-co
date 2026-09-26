/** Public presentation facts only; keep source references and consent records private. */
export const projectEvidenceStates = [
  "VERIFIED_LIVE",
  "UNDER_CONSTRUCTION",
  "CONCEPT / SIMULATION",
  "PENDING_EVIDENCE",
] as const;

export type PublicProjectEvidenceState = (typeof projectEvidenceStates)[number];

export const publicProjectEvidence = Object.freeze({
  "ruenphae-royal-park": "VERIFIED_LIVE",
  "holatel-rim-nan": "VERIFIED_LIVE",
} as const satisfies Record<string, PublicProjectEvidenceState>);

export function getProjectEvidenceBadgeKey(
  projectId?: string,
  explicitState?: PublicProjectEvidenceState
) {
  const state = explicitState ?? (projectId
    ? publicProjectEvidence[projectId as keyof typeof publicProjectEvidence]
    : undefined);

  if (state === "VERIFIED_LIVE") return "badgeVerifiedLive";
  if (state === "UNDER_CONSTRUCTION") return "badgeUnderConstruction";
  if (state === "CONCEPT / SIMULATION") return "badgeConceptSimulation";
  return "badgePendingEvidence";
}

export const projectsPageMeta = Object.freeze({
  path: "/projects",
  title: "ผลงานติดตั้งจริง Solar Carport และโซลาร์เซลล์ | SIRINX",
  description:
    "ภาพผลงานติดตั้งจริงจากโรงแรมเรือนแพ รอยัลปาร์คและโรงแรมโฮลาเทล พร้อมแนวคิดโซลูชันอื่นที่ระบุสถานะและไม่เผยแพร่ตัวเลขที่ยังไม่ผ่านการตรวจหลักฐาน",
});

export type ProjectDetailPublicationState = "REVIEW_REQUIRED" | "PUBLISHED";

export type ProjectDetailNumericClaimState =
  | "NOT_FOR_PUBLIC_CLAIM"
  | "VERIFIED_FOR_PUBLIC_CLAIM";

export type ProjectDetailSection = Readonly<{
  id: string;
  title: string;
  body: string;
}>;

export type PublicProjectDetail = Readonly<{
  slug: string;
  projectId: string;
  name: string;
  evidenceState: PublicProjectEvidenceState;
  publicationState: ProjectDetailPublicationState;
  province: string;
  industry: string;
  systemSummary: string;
  seoTitle: string;
  seoDescription: string;
  media: Readonly<{
    approved: boolean;
    note: string;
  }>;
  claims: Readonly<{
    numericStatus: ProjectDetailNumericClaimState;
    note: string;
  }>;
  sections: readonly ProjectDetailSection[];
}>;

const approvedInstallationMedia = Object.freeze({
  approved: true,
  note:
    "ภาพติดตั้งจริงที่ผ่านการคัดเลือกด้านสิทธิ์ใช้งานและข้อมูลส่วนบุคคลแล้ว โดยไม่เผยแพร่ตัวเลขหรือผลลัพธ์ที่ยังไม่ผ่านการตรวจหลักฐาน",
});

const withheldNumericClaims = Object.freeze({
  numericStatus: "NOT_FOR_PUBLIC_CLAIM" as const,
  note:
    "ยังไม่เผยแพร่ตัวเลขขนาดระบบ ค่าไฟ ผลประหยัด หรือระยะคืนทุน จนกว่าหลักฐานและผู้อนุมัติจะครบ",
});

const publicProjectDetails = Object.freeze({
  "ruenphae-royal-park": Object.freeze({
    slug: "ruenphae-royal-park",
    projectId: "ruenphae-royal-park",
    name: "โรงแรมเรือนแพ รอยัลปาร์ค",
    evidenceState: "VERIFIED_LIVE" as const,
    publicationState: "REVIEW_REQUIRED" as const,
    province: "พิษณุโลก",
    industry: "โรงแรม",
    systemSummary:
      "Solar Carport, BESS, Cable Tray, ระบบไฟฟ้า และแนวทาง AI Monitoring",
    seoTitle: "โรงแรมเรือนแพ รอยัลปาร์ค | Project Detail | SIRINX",
    seoDescription:
      "ข้อมูลเบื้องต้นของโครงการโรงแรมเรือนแพ รอยัลปาร์ค จังหวัดพิษณุโลก โดยระบุสถานะผลงานและข้อจำกัดของหลักฐานก่อนเผยแพร่เป็นกรณีศึกษา",
    media: approvedInstallationMedia,
    claims: withheldNumericClaims,
    sections: [
      {
        id: "overview",
        title: "ภาพรวมโครงการ",
        body:
          "โครงการโรงแรมในจังหวัดพิษณุโลกที่มีข้อมูลเบื้องต้นเกี่ยวกับงาน Solar Carport และระบบกักเก็บพลังงาน โดยรายละเอียดสาธารณะจะเปิดเผยตามหลักฐานที่ตรวจแล้วเท่านั้น",
      },
      {
        id: "site-problem",
        title: "โจทย์หน้างาน",
        body:
          "การออกแบบต้องพิจารณาพื้นที่จอดรถ รูปแบบการใช้ไฟของโรงแรม งานเดินสาย และข้อกำหนดด้านความปลอดภัยร่วมกัน ข้อมูลภาระโหลดและค่าใช้ไฟยังอยู่ระหว่างการตรวจเอกสาร",
      },
      {
        id: "proposed-solution",
        title: "แนวทางระบบ",
        body:
          "แนวทางเบื้องต้นประกอบด้วย Solar Carport, BESS, Cable Tray และการจัดการระบบไฟฟ้า โดยยังไม่ถือเป็นแบบก่อสร้างหรือข้อเสนอราคา",
      },
      {
        id: "evidence-gate",
        title: "สถานะหลักฐาน",
        body:
          "สถานะโครงการเป็นผลงานติดตั้งจริงตามข้อมูลตั้งต้น แต่หน้า detail นี้ยังอยู่ในขั้น REVIEW_REQUIRED จึงไม่แสดงตัวเลขผลลัพธ์และยังไม่ใช้ภาพเป็นสื่อ production",
      },
      {
        id: "next-step",
        title: "ขั้นตอนถัดไป",
        body:
          "ทีมงานต้องตรวจสิทธิ์ใช้สื่อ consent การปกปิดข้อมูลส่วนบุคคล และเอกสารผลลัพธ์ก่อนอนุมัติเป็น Case Study สาธารณะ",
      },
    ] as const,
  }),
  "holatel-rim-nan": Object.freeze({
    slug: "holatel-rim-nan",
    projectId: "holatel-rim-nan",
    name: "โรงแรมโฮลาเทล",
    evidenceState: "VERIFIED_LIVE" as const,
    publicationState: "PUBLISHED" as const,
    province: "ไม่เปิดเผย",
    industry: "โรงแรม",
    systemSummary: "Solar Rooftop และบริบทอาคารจริง",
    seoTitle: "โรงแรมโฮลาเทล | ผลงานติดตั้ง Solar Rooftop | SIRINX",
    seoDescription:
      "ผลงานติดตั้ง Solar Rooftop ที่โรงแรมโฮลาเทล พร้อมภาพงานจริงที่คัดเลือกแล้ว โดยยังไม่เผยแพร่ตัวเลขกำลัง ผลประหยัด หรือวันส่งมอบที่ยังไม่ผ่านการตรวจหลักฐาน",
    media: approvedInstallationMedia,
    claims: withheldNumericClaims,
    sections: [
      {
        id: "overview",
        title: "ภาพรวมโครงการ",
        body:
          "โรงแรมโฮลาเทลมีภาพงานติดตั้ง Solar Rooftop จริง และโครงการติดตั้งเรียบร้อยแล้ว หน้านี้จัดทำขึ้นเพื่อแสดงภาพผลงานโดยไม่เปิดเผยจังหวัดหรือรายละเอียดส่วนบุคคลที่ยังไม่ผ่านการตรวจ",
      },
      {
        id: "installation-status",
        title: "สถานะการติดตั้ง",
        body:
          "สถานะผู้ใช้ยืนยันว่าเป็นงานติดตั้งที่แก้ไขเรียบร้อยแล้ว ภาพในหน้านี้เลือกจากภาพงานจริงที่คัดข้อมูลบุคคล เลขทะเบียน และภาพบิลล์บอร์ดแล้ว",
      },
      {
        id: "installed-system",
        title: "ระบบที่ติดตั้ง",
        body:
          "ภาพรองรับการติดตั้งแผงโซลาร์บนหลังคาและบริบทอาคารจริง ส่วนกำลังผลิต รุ่นอุปกรณ์ ผลประหยัด และวันส่งมอบยังไม่แสดงจนกว่าจะมีเอกสารยืนยัน",
      },
      {
        id: "evidence-gate",
        title: "ขอบเขตหลักฐาน",
        body:
          "หน้านี้เผยแพร่สถานะการติดตั้งและภาพผลงานจริงเท่านั้น ไม่ใช้ภาพเพื่อยืนยันตัวเลขกำลัง ผลประหยัดไฟ อุปกรณ์ หรือผลการทำงานที่ยังไม่ผ่านการตรวจเอกสาร",
      },
      {
        id: "next-step",
        title: "การดูแลระบบ",
        body:
          "สามารถติดตามผลการผลิตและการดูแลระบบได้ภายหลังเมื่อมีข้อมูล meter และเอกสารส่งมอบที่ตรวจสอบแล้ว โดยไม่นำตัวเลขที่ยังไม่ยืนยันมาแสดงก่อนหน้านี้",
      },
    ] as const,
  }),
} satisfies Record<string, PublicProjectDetail>);

export function getProjectDetailPath(slug: string) {
  return "/projects/" + slug;
}

export function getPublicProjectDetail(
  slug?: string,
): PublicProjectDetail | null {
  if (!slug) return null;
  return (
    publicProjectDetails[slug as keyof typeof publicProjectDetails] ?? null
  );
}

export function isProjectDetailIndexable(detail: PublicProjectDetail) {
  return (
    detail.publicationState === "PUBLISHED" &&
    detail.media.approved &&
    detail.claims.numericStatus === "VERIFIED_FOR_PUBLIC_CLAIM"
  );
}

/**
 * Public project slugs that are allowed to be indexed and discovered.
 *
 * Today this returns an empty list on purpose: both published records still carry
 * `NOT_FOR_PUBLIC_CLAIM` numeric claims, and one of them is not published yet. The
 * helper exists so that a project enters the sitemap automatically the moment its
 * evidence gate passes, instead of needing a separate code change.
 */
export function getIndexableProjectSlugs(): string[] {
  return Object.values(publicProjectDetails)
    .filter(isProjectDetailIndexable)
    .map(detail => detail.slug);
}

/**
 * All project detail slugs that have a public record, regardless of the
 * evidence gate. These pages are prerendered even while noindex so deep links
 * work without an SPA-shell fallback; the sitemap picks them up separately
 * once isProjectDetailIndexable passes.
 */
export function getAllProjectDetailSlugs(): string[] {
  return Object.values(publicProjectDetails).map(detail => detail.slug);
}
