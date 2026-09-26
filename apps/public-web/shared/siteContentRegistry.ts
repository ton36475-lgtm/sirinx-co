import { z } from "zod";
import {
  projectEvidenceStates,
  publicProjectEvidence,
} from "./publicProjectContent";
import { getProvinceBySlug, thaiProvinces } from "./thaiProvinces";

export const publicationStates = [
  "DRAFT",
  "REVIEW_REQUIRED",
  "APPROVED_FOR_RELEASE",
  "PUBLISHED",
  "WITHHELD",
] as const;

export const ProjectEvidenceStateSchema = z.enum(projectEvidenceStates);
export const PublicationStateSchema = z.enum(publicationStates);

export const EvidenceRefSchema = z
  .object({
    id: z.string().min(1).max(120),
    sourceKind: z.enum(["drive_folder_name", "project_record"]),
    sourceReference: z
      .string()
      .min(1)
      .max(160)
      .refine(value => !/^https?:\/\//i.test(value), {
        message: "Keep private source URLs out of public content contracts.",
      }),
    verificationState: z.enum(["RECORDED", "VERIFIED", "PENDING_REVIEW"]),
  })
  .strict();

export const MediaAssetSchema = z
  .object({
    id: z.string().min(1).max(120),
    sourceEvidenceId: z.string().min(1).max(120),
    lifecycleState: z.enum([
      "REGISTERED",
      "HASHED",
      "VISUALLY_REVIEWED",
      "PROJECT_MAPPED",
      "RIGHTS_CLEARED",
      "SELECTED",
      "EDITED",
      "QA_APPROVED",
      "RELEASE_APPROVED",
      "PUBLISHED",
    ]),
    originalImmutable: z.literal(true),
    derivativeStorage: z.enum(["pending", "r2_versioned"]),
  })
  .strict();

export const ConsentSchema = z
  .object({
    status: z.enum(["NOT_RECORDED", "PENDING_REVIEW", "CLEARED", "NOT_REQUIRED"]),
    publicationScope: z.enum([
      "NONE",
      "ANONYMOUS_CASE_STUDY",
      "PROJECT_NAME_AND_PROVINCE",
    ]),
    locationPrecision: z.enum(["withheld", "province"]),
  })
  .strict();

export const ProjectRecordSchema = z
  .object({
    id: z.string().min(1).max(120),
    displayNameTh: z.string().min(1).max(160),
    evidenceState: ProjectEvidenceStateSchema,
    publicationState: PublicationStateSchema,
    location: z
      .object({
        precision: z.enum(["withheld", "province"]),
        provinceSlug: z.string().min(1).max(80).optional(),
      })
      .strict(),
    evidence: EvidenceRefSchema,
    consent: ConsentSchema,
    publicNotes: z.array(z.string().min(1).max(240)).max(4),
  })
  .strict();

export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;
export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type Consent = z.infer<typeof ConsentSchema>;
export type ProjectRecord = z.infer<typeof ProjectRecordSchema>;

/**
 * This is a source-controlled mapping only. It deliberately contains no Drive
 * URLs, addresses, customer identities, assets, or completion claims.
 */
export const projectRegistry: readonly ProjectRecord[] = Object.freeze([
  {
    id: "ruenphae-royal-park",
    displayNameTh: "โรงแรมเรือนแพ รอยัลปาร์ค",
    evidenceState: publicProjectEvidence["ruenphae-royal-park"],
    publicationState: "REVIEW_REQUIRED",
    location: { precision: "province", provinceSlug: "phitsanulok" },
    evidence: {
      id: "drive-folder-ruenphae-royal-park",
      sourceKind: "drive_folder_name",
      sourceReference: "เรือนแพรอยัลปาร์ค",
      verificationState: "VERIFIED",
    },
    consent: {
      status: "PENDING_REVIEW",
      publicationScope: "PROJECT_NAME_AND_PROVINCE",
      locationPrecision: "province",
    },
    publicNotes: [
      "Public release requires rights, privacy, and visual QA.",
    ],
  },
  {
    id: "holatel-rim-nan",
    displayNameTh: "โรงแรมโฮลาเทล",
    evidenceState: publicProjectEvidence["holatel-rim-nan"],
    publicationState: "PUBLISHED",
    location: { precision: "withheld" },
    evidence: {
      id: "owner-confirmed-holatel-completion-20260925",
      sourceKind: "project_record",
      sourceReference: "owner-confirmed completed installation on 2026-09-25",
      verificationState: "VERIFIED",
    },
    consent: {
      status: "CLEARED",
      publicationScope: "ANONYMOUS_CASE_STUDY",
      locationPrecision: "withheld",
    },
    publicNotes: [
      "Publish only the privacy-reviewed Holatel photo subset selected in publicProjectMedia.",
      "Do not publish unverified capacity, savings, equipment, or commissioning-date claims.",
    ],
  },
  {
    id: "supalai-private-residential",
    displayNameTh: "โครงการบ้านพักอาศัย (ไม่เปิดเผยตัวตน)",
    evidenceState: "PENDING_EVIDENCE",
    publicationState: "WITHHELD",
    location: { precision: "withheld" },
    evidence: {
      id: "drive-folder-supalai-private-residential",
      sourceKind: "drive_folder_name",
      sourceReference: "หมู่บ้านศุภาลัย",
      verificationState: "RECORDED",
    },
    consent: {
      status: "NOT_RECORDED",
      publicationScope: "NONE",
      locationPrecision: "withheld",
    },
    publicNotes: [
      "Do not infer or disclose a province, address, home number, people, vehicles, or precise location.",
    ],
  },
]);

export const staticProvinceCanaryFlag = "SIRINX_STATIC_PROVINCE_CANARY";
export const staticProvinceCanarySlugs = [
  "bangkok",
  "chiang-mai",
  "chonburi",
  "khon-kaen",
  "phuket",
] as const;

export type StaticProvinceCanarySlug =
  (typeof staticProvinceCanarySlugs)[number];

export function isStaticProvinceCanaryEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env
) {
  return environment[staticProvinceCanaryFlag] === "1";
}

export function getStaticProvinceCanaryRoutes(
  environment: Readonly<Record<string, string | undefined>> = process.env
) {
  if (!isStaticProvinceCanaryEnabled(environment)) return [];

  return staticProvinceCanarySlugs.map(slug => `/solar-carport/${slug}`);
}

export function getStaticProvinceCanaryRecord(route: string) {
  const prefix = "/solar-carport/";
  if (!route.startsWith(prefix)) return null;

  const slug = route.slice(prefix.length).replace(/\/$/, "");
  if (!staticProvinceCanarySlugs.includes(slug as StaticProvinceCanarySlug)) {
    return null;
  }

  const province = getProvinceBySlug(slug);
  if (!province) return null;

  return {
    ...province,
    canonicalPath: `${prefix}${province.slug}`,
    contentStatus: "DRAFT_CANARY" as const,
  };
}

/**
 * A build-time assertion used before any static province body is generated.
 * It does not write data or enable the canary flag.
 */
export function assertSiteContentRegistryIntegrity() {
  const provinceSlugs = thaiProvinces.map(province => province.slug);
  if (
    thaiProvinces.length !== 77 ||
    new Set(provinceSlugs).size !== 77
  ) {
    throw new Error("Province registry must contain exactly 77 unique slugs.");
  }

  const unknownCanarySlug = staticProvinceCanarySlugs.find(
    slug => !provinceSlugs.includes(slug)
  );
  if (unknownCanarySlug) {
    throw new Error(`Unknown static province canary slug: ${unknownCanarySlug}`);
  }

  const projectIds = projectRegistry.map(project => project.id);
  if (new Set(projectIds).size !== projectRegistry.length) {
    throw new Error("Project registry contains duplicate IDs.");
  }

  for (const project of projectRegistry) {
    ProjectRecordSchema.parse(project);

    if (project.evidenceState === "PENDING_EVIDENCE" && project.publicationState === "PUBLISHED") {
      throw new Error("Projects pending evidence cannot be published.");
    }

    if (
      project.id === "supalai-private-residential" &&
      (project.evidenceState !== "PENDING_EVIDENCE" ||
        project.location.precision !== "withheld" ||
        project.location.provinceSlug ||
        project.publicationState !== "WITHHELD")
    ) {
      throw new Error("Private residential evidence must remain pending and withheld.");
    }

    if (
      project.publicationState === "PUBLISHED" &&
      project.consent.status !== "CLEARED"
    ) {
      throw new Error("Published project records require cleared consent.");
    }
  }
}
