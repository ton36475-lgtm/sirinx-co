import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const appPath = join(root, "client/src/App.tsx");
const goalPagePath = join(root, "client/src/pages/GoalDependencyLayout.tsx");

describe("internal goal dependency layout readiness view", () => {
  it("registers /goal only in the internal route gate", () => {
    const source = readFileSync(appPath, "utf8");
    const routeIndex = source.indexOf(
      '<Route path="/goal" component={GoalDependencyLayout} />'
    );
    const publicFallbackIndex = source.indexOf("<Route component={PublicRouter} />");

    expect(source).toContain('lazy(() => import("./pages/GoalDependencyLayout"))');
    expect(routeIndex).toBeGreaterThan(-1);
    expect(publicFallbackIndex).toBeGreaterThan(-1);
    expect(routeIndex).toBeLessThan(publicFallbackIndex);
    expect(source).toContain("internalRoutesEnabled");
  });

  it("keeps the /goal surface static, local, and gate-focused", () => {
    expect(existsSync(goalPagePath)).toBe(true);

    const source = existsSync(goalPagePath)
      ? readFileSync(goalPagePath, "utf8")
      : "";

    expect(source).toContain("Dependency layout repair");
    expect(source).toContain("Local validation status");
    expect(source).toContain("Push blocked by GitHub credential");
    expect(source).toContain("Competitor SWOT/AEO backlog");
    expect(source).toContain(
      "No deploy, webhook, production analytics, CRM, or customer data storage"
    );

    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/\buseMutation\b/);
    expect(source).not.toMatch(/\/api\//);
    expect(source).not.toMatch(/navigator\.sendBeacon/);
    expect(source).not.toMatch(/localStorage|sessionStorage/);
  });
});
