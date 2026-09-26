import { describe, expect, it } from "vitest";
import {
  assertSiteContentRegistryIntegrity,
  getStaticProvinceCanaryRecord,
  getStaticProvinceCanaryRoutes,
  projectRegistry,
  staticProvinceCanaryFlag,
} from "./siteContentRegistry";
import { projectEvidenceStates } from "./publicProjectContent";

describe("site content registry", () => {
  it("keeps the approved project mapping privacy-safe", () => {
    expect(() => assertSiteContentRegistryIntegrity()).not.toThrow();

    const privateResidence = projectRegistry.find(
      project => project.id === "supalai-private-residential"
    );

    expect(privateResidence?.location).toEqual({ precision: "withheld" });
    expect(privateResidence?.publicationState).toBe("WITHHELD");
    expect(privateResidence?.evidenceState).toBe("PENDING_EVIDENCE");

    const holatel = projectRegistry.find(record => record.id === "holatel-rim-nan");
    expect(holatel?.publicationState).toBe("PUBLISHED");
    expect(holatel?.consent.status).toBe("CLEARED");
  });

  it("uses only the four evidence states in the locked project vocabulary", () => {
    expect(projectEvidenceStates).toEqual([
      "VERIFIED_LIVE",
      "UNDER_CONSTRUCTION",
      "CONCEPT / SIMULATION",
      "PENDING_EVIDENCE",
    ]);
    expect(
      projectRegistry.every(project => projectEvidenceStates.includes(project.evidenceState)),
    ).toBe(true);
    expect(
      projectRegistry.find(project => project.id === "holatel-rim-nan")?.evidenceState,
    ).toBe("VERIFIED_LIVE");
  });

  it("keeps the static province canary disabled unless explicitly enabled", () => {
    expect(getStaticProvinceCanaryRoutes({})).toEqual([]);
    expect(
      getStaticProvinceCanaryRoutes({ [staticProvinceCanaryFlag]: "1" })
    ).toEqual([
      "/solar-carport/bangkok",
      "/solar-carport/chiang-mai",
      "/solar-carport/chonburi",
      "/solar-carport/khon-kaen",
      "/solar-carport/phuket",
    ]);
  });

  it("only resolves explicitly allowlisted province routes", () => {
    expect(getStaticProvinceCanaryRecord("/solar-carport/chiang-mai")).toMatchObject({
      slug: "chiang-mai",
      canonicalPath: "/solar-carport/chiang-mai",
      contentStatus: "DRAFT_CANARY",
    });
    expect(getStaticProvinceCanaryRecord("/solar-carport/nan")).toBeNull();
  });
});
