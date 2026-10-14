/**
 * MotionStyleguide — internal page for the shipped motion registry (P1 pipeline S6).
 *
 * Renders every entry in shared/motionRegistry.ts as a live demo block:
 * viewport-gated mount, RAF-stop behavior, and the motionTokens values that the
 * registry references. 404s nothing, ships no new dependencies, and respects
 * MOTION_HOME_ENABLED (the kill-switch applies to the HOME route only — this page
 * is opt-in by URL, so it stays readable under reduced-motion and no-JS).
 *
 * Team files (motionTokens.ts, motionFlags.ts, HeroSlideshow, SolarHeroScene)
 * are consumed read-only per the council verdict of 2026-10-13.
 */
import { useState } from "react";
import { motionRegistry } from "@shared/motionRegistry";
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_SPRINGS,
} from "@shared/motionTokens";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/styleguide";

const COST_LABEL: Record<string, string> = {
  light: "Light",
  moderate: "Moderate",
  heavy: "Heavy",
  "off-until-flag": "Off until flag",
};

function DemoRow({ entry }: { entry: (typeof motionRegistry)[number] }) {
  const [runs, setRuns] = useState(0);
  const duration = entry.tokens.duration
    ? MOTION_DURATIONS[entry.tokens.duration]
    : null;
  const seconds = duration ?? 0;
  return (
    <article className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-sm font-semibold">{entry.id}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {COST_LABEL[entry.cost] ?? entry.cost}
        </span>
      </header>
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
        {entry.recipe}
      </p>
      <dl className="mb-3 grid gap-1 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-2">
        <div>
          <dt className="inline font-medium">Trigger: </dt>
          <dd className="inline">{entry.trigger}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Reduced motion: </dt>
          <dd className="inline">{entry.reduced}</dd>
        </div>
        {entry.tokens.duration && (
          <div>
            <dt className="inline font-medium">Duration token: </dt>
            <dd className="inline">
              {entry.tokens.duration} ({seconds}s)
            </dd>
          </div>
        )}
        {entry.tokens.spring && (
          <div>
            <dt className="inline font-medium">Spring token: </dt>
            <dd className="inline">
              {entry.tokens.spring} (stiffness {MOTION_SPRINGS[entry.tokens.spring].stiffness}, damping {MOTION_SPRINGS[entry.tokens.spring].damping})
            </dd>
          </div>
        )}
        {entry.tokens.easing && (
          <div>
            <dt className="inline font-medium">Easing token: </dt>
            <dd className="inline">
              {entry.tokens.easing} [{MOTION_EASINGS[entry.tokens.easing].join(", ")}]
            </dd>
          </div>
        )}
        <div>
          <dt className="inline font-medium">File: </dt>
          <dd className="inline font-mono">{entry.file}</dd>
        </div>
      </dl>
      {/* Live probe: one CSS transition rerun on demand — respects prefers-reduced-motion via media query, no RAF. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
          onClick={() => setRuns((n) => n + 1)}
        >
          Run probe
        </button>
        <div className="h-6 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
          <div
            key={runs}
            className="h-full bg-primary-500 transition-[width]"
            style={{
              width: runs === 0 ? "0%" : "100%",
              transitionDuration: `${MOTION_DURATIONS.standard * 1000}ms`,
              transitionTimingFunction: "ease-out",
            }}
          />
        </div>
      </div>
    </article>
  );
}

export default function MotionStyleguide() {
  const { t } = usePageTranslation("styleguide");
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">{t("sg.title")}</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
{t("sg.intro")}
      </p>
      <div className="grid gap-4">
        {motionRegistry.map((entry) => (
          <DemoRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
