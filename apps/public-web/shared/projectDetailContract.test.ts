import { describe, expect, it } from "vitest";
import {
  getProjectDetailPath,
  getPublicProjectDetail,
  isProjectDetailIndexable,
} from "./publicProjectContent";

describe("public project detail contract", () => {
  it("exposes only the two approved public project candidates", () => {
    expect(getPublicProjectDetail("ruenphae-royal-park")?.evidenceState).toBe(
      "VERIFIED_LIVE",
    );
    expect(getPublicProjectDetail("holatel-rim-nan")?.evidenceState).toBe(
      "VERIFIED_LIVE",
    );
    expect(getPublicProjectDetail("supalai-private-residential")).toBeNull();
    expect(getPublicProjectDetail("unknown-project")).toBeNull();
  });

  it("publishes completed project media but keeps unverified numeric claims out of indexable claims", () => {
    const ruenphae = getPublicProjectDetail("ruenphae-royal-park");
    const holatel = getPublicProjectDetail("holatel-rim-nan");

    expect(ruenphae?.publicationState).toBe("REVIEW_REQUIRED");
    expect(holatel?.publicationState).toBe("PUBLISHED");
    expect(holatel?.media.approved).toBe(true);
    expect(isProjectDetailIndexable(ruenphae!)).toBe(false);
    expect(isProjectDetailIndexable(holatel!)).toBe(false);
  });

  it("uses stable detail paths and exposes no unsupported numeric claims", () => {
    const detail = getPublicProjectDetail("ruenphae-royal-park");
    const holatel = getPublicProjectDetail("holatel-rim-nan");

    expect(getProjectDetailPath("ruenphae-royal-park")).toBe(
      "/projects/ruenphae-royal-park",
    );
    expect(detail?.media.approved).toBe(true);
    expect(holatel?.media.approved).toBe(true);
    expect(holatel?.systemSummary).not.toMatch(/BESS|Smart Hotel/i);
    expect(JSON.stringify(holatel)).toContain("ติดตั้งเรียบร้อยแล้ว");
    expect(JSON.stringify(holatel)).not.toMatch(/ริมน่าน/);
    expect(detail?.claims.numericStatus).toBe("NOT_FOR_PUBLIC_CLAIM");
    expect(holatel?.claims.numericStatus).toBe("NOT_FOR_PUBLIC_CLAIM");
    expect(detail?.sections.length).toBeGreaterThanOrEqual(4);
    expect(JSON.stringify(detail)).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:kWp|kWh|%|ปี)\b/i);
  });
});
