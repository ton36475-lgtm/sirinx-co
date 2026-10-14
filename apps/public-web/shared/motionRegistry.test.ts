/**
 * motionRegistry.test.ts — P1 pipeline S5 gate as local tests (council verdict 2026-10-13).
 *
 * Three layers:
 *  1. every registry entry is well-formed and its `reduced` fallback is non-empty;
 *  2. every token ref resolves to a real motionTokens export (tokens are the only
 *     legal home for timing values);
 *  3. baseline scan: files with hardcoded timings must be on the frozen baseline.
 *     NEW hardcoded files fail here today, and the same list moves verbatim into CI
 *     once push unblocks (github.com/settings/emails).
 *
 * motionTokens.ts is consumed read-only — it is a teammate's file; this test must
 * never drive edits to it.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_SPRINGS,
} from "./motionTokens";
import {
  motionRegistry,
  MOTION_REGISTRY_BASELINE_HARDCODED_FILES,
} from "./motionRegistry";

const APP_ROOT = join(__dirname, "..");

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      collectSourceFiles(full, out);
    } else if (/\.(tsx?|css)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const HARDCODED_TIMING = /[0-9]+ms\b|cubic-bezier\(|duration-[0-9]+/;

describe("motionRegistry integrity", () => {
  it("registers at least the four committed behaviors", () => {
    expect(motionRegistry.length).toBeGreaterThanOrEqual(4);
  });

  it("every entry has a non-empty reduced-motion fallback (mandatory)", () => {
    for (const entry of motionRegistry) {
      expect(entry.reduced.trim().length, `entry ${entry.id}`).toBeGreaterThan(10);
    }
  });

  it("every entry points at a real committed file", () => {
    for (const entry of motionRegistry) {
      const path = join(APP_ROOT, entry.file);
      expect(statSync(path).isFile(), `entry ${entry.id} -> ${entry.file}`).toBe(
        true,
      );
    }
  });

  it("every token ref resolves to a motionTokens export", () => {
    for (const entry of motionRegistry) {
      if (entry.tokens.duration) {
        expect(MOTION_DURATIONS[entry.tokens.duration]).toBeDefined();
      }
      if (entry.tokens.easing) {
        expect(MOTION_EASINGS[entry.tokens.easing]).toBeDefined();
      }
      if (entry.tokens.spring) {
        expect(MOTION_SPRINGS[entry.tokens.spring]).toBeDefined();
      }
    }
  });

  it("entries never name a numeric duration or easing curve inline", () => {
    for (const entry of motionRegistry) {
      expect(entry.recipe).not.toMatch(/[0-9]+ms\b/);
      expect(entry.recipe).not.toMatch(/cubic-bezier\(/);
    }
  });
});

describe("hardcoded timing baseline (S5 gate, local until CI unblocks)", () => {
  const offenders: string[] = [];
  const sources = collectSourceFiles(join(APP_ROOT, "client", "src"))
    .concat(collectSourceFiles(join(APP_ROOT, "shared")));

  for (const full of sources) {
    const rel = relative(APP_ROOT, full).split("\\").join("/");
    if (MOTION_REGISTRY_BASELINE_HARDCODED_FILES.includes(rel as never)) continue;
    const text = readFileSync(full, "utf8");
    if (HARDCODED_TIMING.test(text)) offenders.push(rel);
  }

  it("no NEW file hardcodes timings outside motionTokens (baseline frozen)", () => {
    expect(
      offenders,
      "add the file to MOTION_REGISTRY_BASELINE_HARDCODED_FILES only if the timing is justified — otherwise route durations/easings through motionTokens.ts (teammate-owned) or registry tokens",
    ).toEqual([]);
  });
});
