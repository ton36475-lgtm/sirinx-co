import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const viewer = readFileSync(
  new URL("./SolarCarportViewer.tsx", import.meta.url),
  "utf8",
);

describe("SolarCarportViewer WebGL budget", () => {
  // Regression guard, added 2026-09-28 (Lane B, R30). Same defect class as the two
  // province scenes, found by a repo-wide sweep after those were fixed:
  // setPixelRatio was called once at construction and never again on resize, so a
  // canvas moved to a display with a different scale factor kept the ratio it was born
  // with. The handler is named `resize`, not `onResize`, here.
  //
  // SOURCE-level guard, matching ProvinceScenes.test.ts. It proves the cap is inside the
  // handler; it does not prove browser re-render behaviour, which is unverified.
  it("re-caps its own device pixel ratio inside the resize handler", () => {
    const handler = viewer.match(/const resize = \(\) => \{[\s\S]*?\n {6}\};/)?.[0];
    expect(handler, "resize handler body not found").toBeDefined();
    expect(handler).toMatch(/setPixelRatio\(/);
    // This scene caps at 1.75, not 2 — it carries the BESS enclosure and shadow
    // casting. The guard must not be satisfied by the province scenes' 2.
    expect(handler).toMatch(/Math\.min\(window\.devicePixelRatio \|\| 1, 1\.75\)/);
    expect(
      viewer.match(/setPixelRatio\(/g)?.length ?? 0,
      "expected setPixelRatio at construction AND in resize",
    ).toBeGreaterThanOrEqual(2);
  });

  it("caps the ratio before setSize, since setSize multiplies by the current ratio", () => {
    const handler = viewer.match(/const resize = \(\) => \{[\s\S]*?\n {6}\};/)?.[0] ?? "";
    expect(handler.indexOf("setPixelRatio(")).toBeGreaterThanOrEqual(0);
    expect(handler.indexOf("setPixelRatio(")).toBeLessThan(handler.indexOf("setSize("));
  });
});
