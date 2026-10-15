/**
 * motionTokens.ts — Shared Motion & Transition Design Tokens for SIRINX.
 *
 * Single source of truth for all animation timing, cubic bezier easings,
 * and spring dynamics across www.sirinx.co.
 *
 * Enforces strict web performance & accessibility boundaries:
 * - Micro-interactions: 150ms - 250ms
 * - Structural transitions: 300ms - 500ms
 * - Hero/Parallax ease: 600ms - 1200ms
 * - LCP safety: durations > 1200ms are prohibited on entry paths
 */

export const MOTION_DURATIONS = {
  instant: 0,
  microFast: 0.15,
  micro: 0.2,
  microSlow: 0.25,
  standard: 0.35,
  expressive: 0.5,
  heroEnter: 0.8,
  heroCrossfade: 1.2,
  // Top scroll-progress bar in components/Layout.tsx. Was a bare `duration-300`
  // Tailwind class; named here on 2026-09-28 (R30-P2) so Layout has no hardcoded
  // timings left. Value is unchanged — this refactor names what already ships, it
  // does not retune it.
  scrollProgress: 0.3,
} as const;

export const MOTION_EASINGS = {
  // Linear for continuous flows (e.g. ambient 3D rotation, energy particles)
  linear: [0, 0, 1, 1] as const,

  // Standard clean-tech entry: crisp acceleration, soft deceleration
  easeOutCubic: [0.33, 1, 0.68, 1] as const,

  // Expressive entry for dialogs and modals
  easeOutQuart: [0.25, 1, 0.5, 1] as const,

  // Elegant luxury easing for hero slides and editorial content
  editorial: [0.16, 1, 0.3, 1] as const,

  // Symmetrical ease for crossfades
  easeInOutCubic: [0.65, 0, 0.35, 1] as const,
} as const;

export const MOTION_SPRINGS = {
  // Snappy responsive hover & buttons
  snappy: {
    stiffness: 400,
    damping: 30,
    mass: 1,
  },
  // Smooth card expansion & layout morph
  smooth: {
    stiffness: 260,
    damping: 24,
    mass: 1,
  },
  // Gentle floating UI widgets & toast notifications
  gentle: {
    stiffness: 170,
    damping: 22,
    mass: 1,
  },
  // Mobile navigation overlay in components/Layout.tsx. Was an inline
  // `{ type: "spring", damping: 28, stiffness: 300 }`. Named on 2026-09-28 (R30-P2);
  // values unchanged.
  overlay: {
    stiffness: 300,
    damping: 28,
    mass: 1,
  },
} as const;

export const MOTION_STAGGERS = {
  tight: 0.04,
  standard: 0.08,
  loose: 0.12,
} as const;

export type MotionDurationKey = keyof typeof MOTION_DURATIONS;
export type MotionEasingKey = keyof typeof MOTION_EASINGS;
export type MotionSpringKey = keyof typeof MOTION_SPRINGS;
export type MotionStaggerKey = keyof typeof MOTION_STAGGERS;
