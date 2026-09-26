/**
 * The committed tree must be able to build the site.
 *
 * This app was fully untracked in git for months: server/staticSeoBuild.ts
 * imported ../shared/siteContentRegistry, provinceEnergyData and the rest,
 * and client/src was missing too, so a fresh clone could not run `pnpm build`
 * at all. Nothing in the test suite caught it, because the suite always ran
 * against the working tree.
 *
 * This walks the import graph from the build entry points and fails if any
 * reachable module is not tracked by git. It needs git but no network and no
 * build, so it is cheap enough to run on every change.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const APP_DIR = fileURLToPath(new URL("../", import.meta.url));
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const EXT = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"];
const ENTRY_POINTS = [
  "server/staticSeoBuild.ts",
  "server/ogTags.ts",
  "client/src/main.tsx",
  "client/src/App.tsx",
];

function trackedFiles(): Set<string> {
  let out = "";
  try {
    out = execFileSync("git", ["ls-files", "apps/public-web"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    // No git (tarball export, CI without a checkout): skip rather than fail.
    return new Set();
  }
  return new Set(
    out
      .split("\n")
      .filter(Boolean)
      .map((path) => path.replace(/^apps\/public-web\//, "")),
  );
}

function resolveSpecifier(fromFile: string, spec: string): string | null {
  let base: string | null = null;
  if (spec.startsWith(".")) {
    base = resolve(dirname(fromFile), spec);
  } else if (spec.startsWith("@shared/") || spec.startsWith("@/")) {
    base = resolve(APP_DIR, spec.replace(/^@shared\//, "").replace(/^@\//, ""));
  }
  if (!base) return null;
  for (const candidate of [
    base,
    ...EXT.map((ext) => base + ext),
    ...EXT.map((ext) => `${base}/index${ext}`),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

describe("build reproducibility", () => {
  const tracked = trackedFiles();

  it("tracks every module the build entry points import", () => {
    if (tracked.size === 0) return; // no git available; nothing to assert

    const seen = new Set<string>();
    const missing: string[] = [];

    const walk = (file: string) => {
      if (seen.has(file) || !existsSync(file)) return;
      seen.add(file);
      if (!/\.(ts|tsx|mjs|js|jsx)$/.test(file)) return;

      const rel = file.startsWith(APP_DIR) ? file.slice(APP_DIR.length) : file;
      if (!tracked.has(rel)) {
        missing.push(rel);
        return; // do not descend into something git does not know about
      }

      const source = readFileSync(file, "utf8");
      const specs = [
        ...[...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]),
        ...[...source.matchAll(/import\s+["']([^"']+)["']/g)].map((m) => m[1]),
        ...[...source.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]),
      ];
      for (const spec of specs) {
        const target = resolveSpecifier(file, spec);
        if (target && !seen.has(target)) walk(target);
      }
    };

    for (const entry of ENTRY_POINTS) walk(resolve(APP_DIR, entry));

    expect(
      missing,
      `imported by the build but not committed — a fresh clone cannot build: ${missing.join(", ")}`,
    ).toEqual([]);
    expect(seen.size).toBeGreaterThan(20);
  });

  it("tracks the static assets the deploy surface depends on", () => {
    if (tracked.size === 0) return;
    // 404.html is what makes unknown URLs answer with a real 404 instead of
    // the SPA shell; losing it silently restores the soft-404 behaviour.
    for (const asset of ["client/public/404.html", "client/public/_redirects"]) {
      expect(tracked.has(asset), `${asset} is not committed`).toBe(true);
    }
  });
});
