import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const packageJsonPath = resolve(import.meta.dirname, "../package.json");
const viteServerPath = resolve(import.meta.dirname, "_core/vite.ts");
const serverPreflightPath = resolve(
  import.meta.dirname,
  "../infra/scripts/server-preflight.sh",
);
const receiverInstallPath = resolve(
  import.meta.dirname,
  "../infra/scripts/server-receiver-install.sh",
);
const sourceSyncPath = resolve(
  import.meta.dirname,
  "../infra/scripts/server-source-sync.sh",
);
const renderConfigPath = resolve(
  import.meta.dirname,
  "../infra/scripts/render-public-site-config.sh",
);
const hermesBrainBootstrapPath = resolve(
  import.meta.dirname,
  "../infra/scripts/hermes-brain-bootstrap.sh",
);
const dbOpsPreflightPath = resolve(
  import.meta.dirname,
  "../infra/scripts/db-ops-preflight.sh",
);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  scripts?: Record<string, string>;
};

describe("package runtime scripts", () => {
  it("uses cross-platform env assignment for development startup", () => {
    expect(packageJson.scripts?.dev).toMatch(/^cross-env NODE_ENV=development /);
  });

  it("uses cross-platform env assignment for production startup", () => {
    expect(packageJson.scripts?.start).toMatch(/^cross-env NODE_ENV=production /);
  });

  it("does not statically import Vite into the production server bundle", () => {
    const viteServerSource = readFileSync(viteServerPath, "utf8");

    expect(viteServerSource).not.toMatch(/from\s+["']vite["']/);
    expect(viteServerSource).not.toMatch(/from\s+["']\.\.\/\.\.\/vite\.config["']/);
    expect(viteServerSource).not.toContain('import("../../vite.config")');
    expect(viteServerSource).toContain("const viteModuleName");
    expect(viteServerSource).toContain("const viteConfigModule");
  });

  it("supports snapshot-backed server preflight instead of requiring git metadata", () => {
    const serverPreflightSource = readFileSync(serverPreflightPath, "utf8");

    expect(serverPreflightSource).not.toContain("need_cmd git");
    expect(serverPreflightSource).toContain("snapshot-backed source detected; git status skipped");
    expect(serverPreflightSource).toContain("docs/migration/HERMES_AGENT_SERVER_CONTINUATION_PACKET.md");
  });

  it("ships governed receiver and source-sync scripts for server continuation", () => {
    const receiverInstallSource = readFileSync(receiverInstallPath, "utf8");
    const sourceSyncSource = readFileSync(sourceSyncPath, "utf8");
    const renderConfigSource = readFileSync(renderConfigPath, "utf8");
    const hermesBrainBootstrapSource = readFileSync(hermesBrainBootstrapPath, "utf8");
    const dbOpsPreflightSource = readFileSync(dbOpsPreflightPath, "utf8");

    expect(receiverInstallSource).toContain("SIRINX server receiver install");
    expect(receiverInstallSource).toContain("SIRINX_STAGE_PUBLIC");
    expect(receiverInstallSource).toContain("bootstrapping Hermes brain skill runtime");
    expect(receiverInstallSource).toContain("infra/scripts/hermes-brain-bootstrap.sh");
    expect(sourceSyncSource).toContain("SIRINX server source sync");
    expect(sourceSyncSource).toContain("REPO_URL");
    expect(sourceSyncSource).toContain(
      "existing non-git APP_DIR detected",
    );
    expect(sourceSyncSource).not.toContain('rm -rf "$APP_DIR"');
    expect(renderConfigSource).toContain("PUBLIC_PRIMARY_HOST");
    expect(hermesBrainBootstrapSource).toContain("SIRINX Hermes brain bootstrap");
    expect(hermesBrainBootstrapSource).toContain("DATABASE_STEWARD_STARTER.json");
    expect(dbOpsPreflightSource).toContain("SIRINX database operations preflight");
    expect(dbOpsPreflightSource).toContain("pgvector/pgvector:pg16");
  });
});
