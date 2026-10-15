import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_SPRINGS,
  MOTION_STAGGERS,
} from "./motionTokens";

const layoutSource = readFileSync(
  new URL("../client/src/components/Layout.tsx", import.meta.url),
  "utf8",
);

describe("motionTokens design invariants", () => {
  describe("MOTION_DURATIONS", () => {
    it("preserves instant duration as zero", () => {
      expect(MOTION_DURATIONS.instant).toBe(0);
    });

    it("keeps all micro interaction durations within the 100ms - 300ms perceptual budget", () => {
      expect(MOTION_DURATIONS.microFast).toBeGreaterThanOrEqual(0.1);
      expect(MOTION_DURATIONS.microFast).toBeLessThanOrEqual(0.3);

      expect(MOTION_DURATIONS.micro).toBeGreaterThanOrEqual(0.1);
      expect(MOTION_DURATIONS.micro).toBeLessThanOrEqual(0.3);

      expect(MOTION_DURATIONS.microSlow).toBeGreaterThanOrEqual(0.1);
      expect(MOTION_DURATIONS.microSlow).toBeLessThanOrEqual(0.3);
    });

    it("ensures hero durations do not exceed LCP threshold limit (<= 1.5s)", () => {
      expect(MOTION_DURATIONS.heroEnter).toBeLessThanOrEqual(1.5);
      expect(MOTION_DURATIONS.heroCrossfade).toBeLessThanOrEqual(1.5);
      expect(MOTION_DURATIONS.heroCrossfade).toBeGreaterThan(MOTION_DURATIONS.heroEnter);
    });

    it("maintains strict monotonic ordering from microFast to heroCrossfade", () => {
      expect(MOTION_DURATIONS.microFast).toBeLessThan(MOTION_DURATIONS.micro);
      expect(MOTION_DURATIONS.micro).toBeLessThan(MOTION_DURATIONS.microSlow);
      expect(MOTION_DURATIONS.microSlow).toBeLessThan(MOTION_DURATIONS.standard);
      expect(MOTION_DURATIONS.standard).toBeLessThan(MOTION_DURATIONS.expressive);
      expect(MOTION_DURATIONS.expressive).toBeLessThan(MOTION_DURATIONS.heroEnter);
      expect(MOTION_DURATIONS.heroEnter).toBeLessThan(MOTION_DURATIONS.heroCrossfade);
    });
  });

  describe("MOTION_EASINGS", () => {
    it("defines valid cubic bezier coordinates with 4 control points each", () => {
      Object.entries(MOTION_EASINGS).forEach(([key, bezier]) => {
        expect(bezier).toHaveLength(4);
        const [x1, y1, x2, y2] = bezier;
        // x values in cubic-bezier must be within [0, 1] range per CSS specification
        expect(x1, `${key} x1`).toBeGreaterThanOrEqual(0);
        expect(x1, `${key} x1`).toBeLessThanOrEqual(1);
        expect(x2, `${key} x2`).toBeGreaterThanOrEqual(0);
        expect(x2, `${key} x2`).toBeLessThanOrEqual(1);
        expect(typeof y1).toBe("number");
        expect(typeof y2).toBe("number");
      });
    });
  });

  describe("MOTION_SPRINGS", () => {
    it("ensures snappy spring has higher stiffness and damping than gentle spring", () => {
      expect(MOTION_SPRINGS.snappy.stiffness).toBeGreaterThan(MOTION_SPRINGS.smooth.stiffness);
      expect(MOTION_SPRINGS.smooth.stiffness).toBeGreaterThan(MOTION_SPRINGS.gentle.stiffness);
      expect(MOTION_SPRINGS.snappy.damping).toBeGreaterThan(MOTION_SPRINGS.gentle.damping);
    });

    it("keeps all spring mass strictly at 1 to prevent unstable oscillations", () => {
      Object.values(MOTION_SPRINGS).forEach((spring) => {
        expect(spring.mass).toBe(1);
      });
    });
  });

  describe("MOTION_STAGGERS", () => {
    it("keeps staggers tight to prevent delayed rendering", () => {
      expect(MOTION_STAGGERS.tight).toBeLessThan(MOTION_STAGGERS.standard);
      expect(MOTION_STAGGERS.standard).toBeLessThan(MOTION_STAGGERS.loose);
      expect(MOTION_STAGGERS.loose).toBeLessThanOrEqual(0.2);
    });
  });

  // Added 2026-09-28, R30-P2. Layout.tsx had four hardcoded motion values and no tokens.
  // They were named, not retuned, so these assertions pin the exact values that shipped —
  // if someone later "improves" a number, this fails and the change becomes a decision
  // rather than a silent edit.
  describe("Layout motion contract", () => {
    it("preserves the exact values Layout.tsx shipped before tokenisation", () => {
      // was: className="... duration-300"
      expect(MOTION_DURATIONS.scrollProgress).toBe(0.3);
      // was: className="... duration-200" and transition={{ duration: 0.2 }}
      expect(MOTION_DURATIONS.micro).toBe(0.2);
      // was: transition={{ type: "spring", damping: 28, stiffness: 300 }}
      expect(MOTION_SPRINGS.overlay).toEqual({
        stiffness: 300,
        damping: 28,
        mass: 1,
      });
    });

    it("keeps every duration inside a sane band, including ones added later", () => {
      // The tests above name individual keys, so a token added tomorrow would escape
      // them. This one iterates, so it cannot.
      Object.entries(MOTION_DURATIONS).forEach(([key, seconds]) => {
        expect(seconds, `${key} must be >= 0`).toBeGreaterThanOrEqual(0);
        expect(seconds, `${key} must stay under the 1.5s LCP ceiling`).toBeLessThanOrEqual(1.5);
      });
    });

    it("gives every spring a positive stiffness and damping", () => {
      Object.entries(MOTION_SPRINGS).forEach(([key, spring]) => {
        expect(spring.stiffness, `${key} stiffness`).toBeGreaterThan(0);
        expect(spring.damping, `${key} damping`).toBeGreaterThan(0);
      });
    });

    // The regression this whole block exists for. SOURCE-level, like the WebGL guards
    // in this round: it proves the magic numbers are gone from the file, not that the
    // rendered animation is identical. Behaviour preservation is argued by the pinned
    // values above, and the visual check is still owed.
    it("leaves no hardcoded motion values in Layout.tsx", () => {
      expect(layoutSource).toContain("from \"@shared/motionTokens\"");
      expect(layoutSource).toMatch(/MOTION_DURATIONS\.scrollProgress/);
      expect(layoutSource).toMatch(/\.\.\.MOTION_SPRINGS\.overlay/);
      expect(layoutSource).toMatch(/duration:\s*MOTION_DURATIONS\./);

      // Strip comments first. The explanatory comment above the <nav> literally contains
      // the string "duration-300", and a comment is not a hardcoded value — the first
      // version of this test failed on its own documentation.
      const code = layoutSource
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");

      // No Tailwind duration utility left — every one of these was a hardcoded timing.
      expect(code.match(/duration-\d+/g) ?? []).toEqual([]);

      // No inline numeric duration or spring numbers in a framer transition.
      expect(code).not.toMatch(/transition=\{\{[^}]*duration:\s*[\d.]/);
      expect(code).not.toMatch(/transition=\{\{[^}]*(damping|stiffness):\s*\d/);
    });
  });
});
