import { describe, expect, it } from "vitest";
import {
  buildLeadFallbackMailto,
  buildLeadFallbackSummary,
  isLeadTransportFallbackError,
} from "../lib/leadFallback";

const sampleLead = {
  name: "Internal Test",
  company: "SIRINX",
  email: "test@sirinx.co",
  phone: "0800000000",
  interest: "Solar Carport",
  budget: "5-15 ล้านบาท",
  timeline: "1-3 เดือน",
  monthlyBill: "300000",
  roofArea: "5000",
  message: "Need ROI assessment",
};

describe("lead fallback", () => {
  it("builds a readable fallback summary without raw logs", () => {
    const summary = buildLeadFallbackSummary(
      sampleLead,
      new Date("2026-05-16T18:00:00.000Z")
    );

    expect(summary).toContain("SIRINX quote request fallback");
    expect(summary).toContain("Source: www.sirinx.co/contact");
    expect(summary).toContain("Phone: 0800000000");
    expect(summary).toContain("Monthly bill: 300000 THB");
    expect(summary).not.toContain(".env");
  });

  it("encodes the fallback mailto link for direct owner delivery", () => {
    const href = buildLeadFallbackMailto(
      sampleLead,
      new Date("2026-05-16T18:00:00.000Z")
    );

    expect(href).toMatch(/^mailto:pitoon\.sirinx@gmail\.com\?/);
    expect(decodeURIComponent(href)).toContain(
      "SIRINX quote request - Internal Test"
    );
    expect(decodeURIComponent(href)).toContain("Interest: Solar Carport");
  });

  it("detects static Cloudflare Pages API transport failures", () => {
    expect(
      isLeadTransportFallbackError(new Error("Unexpected end of JSON input"))
    ).toBe(true);
    expect(
      isLeadTransportFallbackError(new Error("Method Not Allowed 405"))
    ).toBe(true);
    expect(
      isLeadTransportFallbackError(
        new Error("Lead database binding is not configured")
      )
    ).toBe(true);
    expect(isLeadTransportFallbackError(new Error("validation failed"))).toBe(
      false
    );
  });
});
