/**
 * motionRegistry.ts — Single registry of shipped motion behaviors (P1 pipeline S4).
 *
 * Council verdict 2026-10-13 (Skeptic/Pragmatist/Critic all AMEND, Architect synthesized):
 * - Small schema (7 fields), seeded ONLY from behaviors that exist in committed code.
 * - motionTokens.ts / motionFlags.ts are a teammate's untracked files: consumed
 *   read-only, never edited from this lane. Missing tokens are requested, not added.
 * - S5 hardcoded-timing gate is a baseline snapshot test (motionRegistry.test.ts):
 *   NEW files may not hardcode timings; the existing 24 files are the explicit baseline.
 * - Styleguide page (S6) is deferred until push unblocks and MOTION_HOME_ENABLED flips.
 */
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_SPRINGS,
} from "./motionTokens";

export type MotionTokenRefs = Readonly<{
  duration?: keyof typeof MOTION_DURATIONS;
  easing?: keyof typeof MOTION_EASINGS;
  spring?: keyof typeof MOTION_SPRINGS;
}>;

export type MotionCost = "light" | "moderate" | "heavy" | "off-until-flag";

export type MotionRegistryEntry = Readonly<{
  /** Stable id, also used by tests and the future styleguide. */
  id: string;
  /** File (repo-relative to apps/public-web) that implements the behavior. */
  file: string;
  /** What starts the motion (scroll, mount, state change, press...). */
  trigger: string;
  /** Which motionTokens entries the behavior uses — registry fails if unresolved. */
  tokens: MotionTokenRefs;
  /** Keyframe/timing formula in words (inspired-by, never copied from references). */
  recipe: string;
  /** MANDATORY: what happens under prefers-reduced-motion. Empty string fails tests. */
  reduced: string;
  cost: MotionCost;
}>;

export const motionRegistry: readonly MotionRegistryEntry[] = Object.freeze([
  Object.freeze({
    id: "viewport-gated-3d-mount",
    file: "client/src/components/three/LazyViewport3D.tsx",
    trigger: "IntersectionObserver within 200px of viewport",
    tokens: {},
    recipe:
      "no animation frames at all before proximity: placeholder keeps minHeight so CLS/SSR unchanged; children mount once on approach",
    reduced:
      "unchanged — gating is load optimization, not visual motion; reduced-motion static frame handled inside each scene",
    cost: "light",
  }),
  Object.freeze({
    id: "province-scene-raf-stop",
    file: "client/src/components/three/ProvinceSolarScene.tsx",
    trigger: "rAF loop scheduling per frame",
    tokens: {},
    recipe:
      "tick scheduled only when !reduceMotion && !contextLost && visible && !documentHidden; RAF cancelled on visibilitychange; listener removed on unmount",
    reduced:
      "single static frame — loop guard blocks all scheduling when reduceMotion is true",
    cost: "moderate",
  }),
  Object.freeze({
    id: "province-yield-chart-raf-stop",
    file: "client/src/components/three/ProvinceYieldChart3D.tsx",
    trigger: "rAF loop scheduling per frame",
    tokens: {},
    recipe:
      "same guard set as province-scene-raf-stop; double-schedule prevented on IO resume",
    reduced:
      "single static frame — loop guard blocks all scheduling when reduceMotion is true",
    cost: "moderate",
  }),
  Object.freeze({
    id: "home-motion-kill-switch",
    file: "client/src/lib/static-motion.tsx",
    trigger: "module import (every framer-motion surface)",
    tokens: { spring: "snappy", duration: "micro" } as const,
    recipe:
      "MOTION_HOME_ENABLED=false strips all framer-motion props at the wrapper layer until real LCP measurements exist; springs/durations kept only as token refs for the flip",
    reduced:
      "fully static output regardless of the flag — props are stripped, not animated",
    cost: "off-until-flag",
  }),
]);

export function getMotionEntry(id: string): MotionRegistryEntry | undefined {
  return motionRegistry.find((entry) => entry.id === id);
}

export const MOTION_REGISTRY_BASELINE_HARDCODED_FILES = Object.freeze([
  "client/src/hero-solar-core/solar-core.css",
  "client/src/index.css",
  "client/src/components/ui/alert-dialog.tsx",
  "client/src/components/ui/input-otp.tsx",
  "client/src/components/ui/sheet.tsx",
  "client/src/components/ui/navigation-menu.tsx",
  "client/src/components/ui/accordion.tsx",
  "client/src/components/ui/item.tsx",
  "client/src/components/ui/dialog.tsx",
  "client/src/components/ui/sidebar.tsx",
  "client/src/components/HeroSlideshow.tsx",
  "client/src/components/ProjectPhotoGallery.tsx",
  "client/src/components/FloatingChatWidget.tsx",
  "client/src/components/Layout.tsx",
  "client/src/pages/Projects.tsx",
  "client/src/pages/Pricing.tsx",
  "client/src/pages/Home.tsx",
  "client/src/pages/admin/Analytics.tsx",
  "client/src/pages/Strategy.tsx",
  "client/src/pages/BlogPost.tsx",
  "client/src/pages/SolarCarport.tsx",
  "client/src/pages/Blog.tsx",
  "shared/motionTokens.ts",
  "shared/motionTokens.test.ts",
] as const);
