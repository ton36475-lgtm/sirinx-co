import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chart = readFileSync(
  new URL("./ProvinceYieldChart3D.tsx", import.meta.url),
  "utf8",
);
const solar = readFileSync(
  new URL("./ProvinceSolarScene.tsx", import.meta.url),
  "utf8",
);

describe("province WebGL scenes", () => {
  it("renders only one chart frame when reduced motion is requested", () => {
    expect(chart).toMatch(/window\.matchMedia\([\s\S]*prefers-reduced-motion: reduce[\s\S]*\)\.matches/);
    expect(chart).toMatch(/if \(reduceMotion\) \{[^}]*renderer\.render/s);
    expect(chart).toMatch(
      /if \(!reduceMotion && !contextLost && visible && !documentHidden\)\s*\n\s*raf = requestAnimationFrame\(tick\)/,
    );
  });

  it.each([
    ["yield chart", chart],
    ["solar scene", solar],
  ])(
    "handles WebGL loss/restoration and failure fallback for %s",
    (_name, source) => {
      expect(source).toContain(
        'addEventListener("webglcontextlost", onContextLost)',
      );
      expect(source).toMatch(/addEventListener\([\s\S]*webglcontextrestored[\s\S]*onContextRestored/);
      expect(source).toContain("e.preventDefault()");
      expect(source).toContain("setGraphicsError(true)");
      expect(source).toContain('role="status"');
    },
  );

  it("exposes sourced chart yield and rank in a described text alternative", () => {
    expect(chart).toContain("aria-describedby={`yield-description-${slug}`}");
    expect(chart).toContain("summary?.specificYield.toLocaleString()");
    expect(chart).toContain("summary?.rank");
    expect(chart).toContain("provinceEnergyData");
  });

  it("describes the solar visualization using its actual coordinates and sun calculation", () => {
    expect(solar).toContain("aria-describedby={`solar-description-");
    expect(solar).toContain("props.latitude");
    expect(solar).toContain("props.longitude");
    expect(solar).toContain("@shared/sunMath");
    expect(solar).toContain(
      "solarPosition(props.latitude, props.longitude, utc)",
    );
  });

  // Regression guard, added 2026-09-28 (Lane B, R30).
  //
  // Both scenes called setPixelRatio exactly once, at renderer construction, and their
  // onResize handler updated the camera and setSize but never the pixel ratio. Moving a
  // window to a different-DPI display, or changing browser zoom, changes
  // window.devicePixelRatio, so the framebuffer kept the ratio it was born with.
  // CarportExplodedDiagram3D re-caps on resize; these two did not.
  //
  // This is a SOURCE-level guard, matching the style of the tests above, not a
  // behavioural one. It proves the line is inside the onResize handler body; it does not
  // prove a browser re-renders correctly. The behavioural check is still unverified and
  // is called out as such in reports/SIRINX_CO_R30_PROVINCE_DPR_FIX_20260928.md.
  it.each([
    ["yield chart", chart],
    ["solar scene", solar],
  ])("re-caps device pixel ratio inside the resize handler for %s", (_name, source) => {
    const handler = source.match(
      /const onResize = \(\) => \{[\s\S]*?\n {6}\};/,
    )?.[0];
    expect(handler, "onResize handler body not found").toBeDefined();
    expect(handler).toMatch(/setPixelRatio\(/);
    expect(handler).toMatch(/Math\.min\(window\.devicePixelRatio, 2\)/);
    // The cap must be re-applied on every resize, not read once at construction only.
    expect(
      source.match(/setPixelRatio\(/g)?.length ?? 0,
      "expected setPixelRatio at construction AND in onResize",
    ).toBeGreaterThanOrEqual(2);
  });

  // P1 (2026-10-10): RAF must STOP (not just skip renders) when the tab is
  // hidden or the canvas is offscreen, and the visibilitychange listener must
  // be removed on cleanup. Source-level guards in the same style as above.
  it.each([
    ["yield chart", chart],
    ["solar scene", solar],
  ])("stops the RAF loop when hidden and restores it on visible for %s", (_name, source) => {
    expect(source).toContain('document.addEventListener("visibilitychange", onVisibilityChange)');
    expect(source).toContain('document.removeEventListener("visibilitychange", onVisibilityChange)');
    // cancelAnimationFrame on hidden — inside the visibility handler
    const handler = source.match(
      /const onVisibilityChange = \(\) => \{[\s\S]*?\n {6}\};/,
    )?.[0];
    expect(handler, "onVisibilityChange handler body not found").toBeDefined();
    expect(handler).toMatch(/if \(documentHidden\) \{\s*\n\s*cancelAnimationFrame\(raf\);/);
    // loop continues only when visible and the tab is not hidden
    expect(source).toMatch(
      /if \(!reduceMotion && !contextLost && visible && !documentHidden\)/,
    );
  });

  it("gates province scene mounts behind LazyViewport3D on the province page", () => {
    const page = readFileSync(
      new URL("../../pages/SolarCarport.tsx", import.meta.url),
      "utf8",
    );
    expect(page).toContain('import LazyViewport3D from "@/components/three/LazyViewport3D"');
    expect(page).toMatch(/<LazyViewport3D[^>]*>[\s\S]*?<ProvinceYieldChart3D/);
    expect(page).toMatch(/<LazyViewport3D[^>]*>[\s\S]*?<ProvinceSolarScene/);
    expect(page).toMatch(/<LazyViewport3D[^>]*>\s*<CarportExplodedDiagram3D/);
  });
});
