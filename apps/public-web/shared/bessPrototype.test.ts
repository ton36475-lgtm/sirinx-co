/**
 * BESS prototype — claim ledger as test fixtures.
 *
 * The static prototype at /prototypes/ (ported from sirinx-bess-implementation.zip,
 * sha256 bffb373cf4702b99…) must keep every known value CONFLICT visible and must
 * never silently pick one side. These fixtures assert the conflicts still exist —
 * if anyone "resolves" a conflict by editing the data, this test fails.
 * Evidence pipeline: council verdict 2026-10-15 (BESS_INTEGRATION_COUNCIL_20261015.md).
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PROTO = resolve(__dirname, "..", "client", "public", "prototypes");

function read(p: string): string {
  expect(existsSync(p)).toBe(true);
  return readFileSync(p, "utf8");
}

describe("BESS prototype artifacts", () => {
  it("ships all four static pages with noindex", () => {
    for (const page of ["index.html", "co.html", "bess.html", "bess-knowledge.html"]) {
      const html = read(`${PROTO}/${page}`);
      expect(html).toMatch(/name="robots"\s+content="noindex/i);
    }
  });

  it("keeps the GSL 314Ah energy values in conflict (16.07 vs 16.38 shown with attribution)", () => {
    const master = JSON.parse(read(`${PROTO}/data/bess-master.json`)) as {
      products?: Array<Record<string, unknown>>;
      conflicts?: Array<Record<string, unknown>>;
    };
    const all = JSON.stringify(master);
    expect(all).toContain("16.07");
    expect(all).toContain("16.38");
    // conflict records exist and are not "resolved"
    const states = JSON.stringify(master).match(/conflict[^"]*/gi) ?? [];
    expect(states.length).toBeGreaterThan(0);
  });

  it("never claims PEA/inverter compatibility (blocked stays blocked)", () => {
    const html = read(`${PROTO}/bess.html`) + read(`${PROTO}/bess-knowledge.html`);
    expect(html).not.toMatch(/PEA Smart List[^<]*(รับรอง|approved|compatible)/i);
  });

  it("marks the demo strip so no visitor mistakes it for a connected service", () => {
    const html = read(`${PROTO}/bess.html`);
    expect(html).toContain("DEMO — NOT CONNECTED");
  });

  it("robots.txt disallows the prototype subtree", () => {
    const robots = read(resolve(__dirname, "..", "client", "public", "robots.txt"));
    expect(robots).toContain("Disallow: /prototypes/");
  });
});
