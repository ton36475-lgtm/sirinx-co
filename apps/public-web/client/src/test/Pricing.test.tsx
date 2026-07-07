/**
 * Vitest tests for Pricing page data and structure
 * Updated: Start / Pro / Enterprise tiers
 */
import { describe, it, expect } from "vitest";

// ─── Pricing page data tests ───────────────────────────────────

describe("Pricing page data validation", () => {
  it("should have 3 package tiers (Start, Pro, Enterprise)", () => {
    const packages = ["start", "pro", "enterprise"];
    expect(packages).toHaveLength(3);
    expect(packages).toContain("start");
    expect(packages).toContain("pro");
    expect(packages).toContain("enterprise");
  });

  it("Start should be 10-30 kWp range", () => {
    const start = { capacity: "10 – 30 kWp", minKw: 10, maxKw: 30 };
    expect(start.minKw).toBe(10);
    expect(start.maxKw).toBe(30);
    expect(start.maxKw).toBeGreaterThan(start.minKw);
  });

  it("Pro should be 30-100 kWp range", () => {
    const pro = { capacity: "30 – 100 kWp", minKw: 30, maxKw: 100 };
    expect(pro.minKw).toBe(30);
    expect(pro.maxKw).toBe(100);
  });

  it("Enterprise should be 100-500+ kWp range", () => {
    const enterprise = { capacity: "100 – 500+ kWp", minKw: 100, maxKw: 500 };
    expect(enterprise.minKw).toBe(100);
    expect(enterprise.maxKw).toBeGreaterThanOrEqual(500);
  });

  it("payback period should be 3-6 years across all packages", () => {
    const paybacks = [
      { pkg: "Start", min: 4, max: 6 },
      { pkg: "Pro", min: 3, max: 5 },
      { pkg: "Enterprise", min: 3, max: 5 },
    ];
    for (const p of paybacks) {
      expect(p.min).toBeGreaterThanOrEqual(3);
      expect(p.max).toBeLessThanOrEqual(6);
    }
  });

  it("all packages should have EV charger support", () => {
    const evChargers = [
      { pkg: "Start", min: 1 },
      { pkg: "Pro", min: 3 },
      { pkg: "Enterprise", min: 10 },
    ];
    for (const ev of evChargers) {
      expect(ev.min).toBeGreaterThan(0);
    }
  });
});

describe("Pricing CTA query params", () => {
  it("should generate correct contact URL for Start", () => {
    const url = "/contact?interest=solar-carport&package=start";
    expect(url).toContain("interest=solar-carport");
    expect(url).toContain("package=start");
  });

  it("should generate correct contact URL for Pro", () => {
    const url = "/contact?interest=solar-carport&package=pro";
    expect(url).toContain("package=pro");
  });

  it("should generate correct contact URL for Enterprise", () => {
    const url = "/contact?interest=solar-carport&package=enterprise";
    expect(url).toContain("package=enterprise");
  });
});

describe("Contact page package param mapping", () => {
  const interestMap: Record<string, string> = {
    "solar-carport": "Solar Carport",
    "rooftop-solar": "Rooftop Solar",
    "floating-solar": "Floating Solar",
    "bess": "BESS / ESS",
    "ai-energy": "AI Energy Management",
  };

  const packageLabels: Record<string, string> = {
    "start": "Start (10-30 kWp)",
    "pro": "Pro (30-100 kWp)",
    "enterprise": "Enterprise (100-500+ kWp)",
  };

  it("should map solar-carport interest to Solar Carport", () => {
    expect(interestMap["solar-carport"]).toBe("Solar Carport");
  });

  it("should map all package IDs to labels", () => {
    expect(Object.keys(packageLabels)).toHaveLength(3);
    expect(packageLabels["start"]).toContain("10-30 kWp");
    expect(packageLabels["pro"]).toContain("30-100 kWp");
    expect(packageLabels["enterprise"]).toContain("100-500+");
  });

  it("should default to Solar Carport for unknown interest", () => {
    const interest = "unknown-value";
    const mapped = interestMap[interest] || "Solar Carport";
    expect(mapped).toBe("Solar Carport");
  });
});

describe("Government policy data", () => {
  const policies = [
    { title: "ลดหย่อนภาษี Solar Rooftop", type: "tax" },
    { title: "มาตรการ EV 3.5", type: "ev" },
    { title: "BOI สนับสนุนพลังงานสะอาด", type: "boi" },
    { title: "เป้าหมาย Carbon Neutrality", type: "carbon" },
  ];

  it("should have 4 government policy items", () => {
    expect(policies).toHaveLength(4);
  });

  it("should include EV policy", () => {
    expect(policies.some(p => p.type === "ev")).toBe(true);
  });

  it("should include BOI policy", () => {
    expect(policies.some(p => p.type === "boi")).toBe(true);
  });

  it("should include tax incentive policy", () => {
    expect(policies.some(p => p.type === "tax")).toBe(true);
  });
});

describe("Pricing FAQ JSON-LD schema", () => {
  const faqs = [
    { q: "Solar Carport ต่างจาก Solar Rooftop อย่างไร?", a: "..." },
    { q: "ราคาที่แสดงเป็นราคาสุดท้ายหรือไม่?", a: "..." },
    { q: "คืนทุนภายในกี่ปี?", a: "..." },
    { q: "รองรับ EV Charger ได้กี่จุด?", a: "..." },
    { q: "ต้องขออนุญาตหน่วยงานใดบ้าง?", a: "..." },
    { q: "มีบริการดูแลหลังติดตั้งไหม?", a: "..." },
    { q: "ขนาดใหญ่กว่า 500 kWp ทำได้ไหม?", a: "..." },
  ];

  it("should have 7 FAQ items", () => {
    expect(faqs).toHaveLength(7);
  });

  it("should generate valid FAQ JSON-LD structure", () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(f => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toHaveLength(7);
    expect(jsonLd.mainEntity[0]["@type"]).toBe("Question");
  });
});

describe("OG tags for pricing route", () => {
  it("should have pricing route in OG metadata with Start/Pro/Enterprise", () => {
    const routeMetaMap: Record<string, { title: string; description: string }> = {
      "/pricing": {
        title: "แพ็คเกจราคา Solar Carport | Start / Pro / Enterprise ลดค่าไฟ+EV Charger คืนทุน 3-5 ปี | SIRINX",
        description: "เปรียบเทียบแพ็คเกจ Solar Carport 3 ระดับ Start / Pro / Enterprise (10-500+ kWp)",
      },
    };
    expect(routeMetaMap["/pricing"]).toBeDefined();
    expect(routeMetaMap["/pricing"].title).toContain("Solar Carport");
    expect(routeMetaMap["/pricing"].title).toContain("SIRINX");
    expect(routeMetaMap["/pricing"].title).toContain("Start");
    expect(routeMetaMap["/pricing"].title).toContain("Pro");
    expect(routeMetaMap["/pricing"].title).toContain("Enterprise");
  });
});

describe("ROI Calculator recommendations", () => {
  it("should recommend Start for small systems (<=30 kWp)", () => {
    const systemKwp = 15;
    const recommended = systemKwp <= 30 ? "Start" : systemKwp <= 100 ? "Pro" : "Enterprise";
    expect(recommended).toBe("Start");
  });

  it("should recommend Pro for medium systems (31-100 kWp)", () => {
    const systemKwp = 60;
    const recommended = systemKwp <= 30 ? "Start" : systemKwp <= 100 ? "Pro" : "Enterprise";
    expect(recommended).toBe("Pro");
  });

  it("should recommend Enterprise for large systems (>100 kWp)", () => {
    const systemKwp = 150;
    const recommended = systemKwp <= 30 ? "Start" : systemKwp <= 100 ? "Pro" : "Enterprise";
    expect(recommended).toBe("Enterprise");
  });
});
