import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const configUrl = new URL("../../../opencode.jsonc", import.meta.url);
const agentUrl = new URL("../../../.opencode/agents/projectread.md", import.meta.url);

async function readConfig() {
  return JSON.parse(await readFile(configUrl, "utf8"));
}

describe("OpenCode LINE Official MCP project-read contract", () => {
  it("stages the official server disabled with an environment placeholder and pinned package", async () => {
    const config = await readConfig();
    const server = config.mcp.line_official;

    expect(server).toMatchObject({
      type: "local",
      enabled: false,
      timeout: 5000,
      command: ["npx", "--yes", "@line/line-bot-mcp-server@0.5.0"],
      environment: {
        NPM_CONFIG_IGNORE_SCRIPTS: "true",
        CHANNEL_ACCESS_TOKEN: "{env:LINE_CHANNEL_ACCESS_TOKEN}"
      }
    });
    expect(JSON.stringify(config)).not.toMatch(/Bearer\s|[A-Za-z0-9_-]{32,}\.[A-Za-z0-9_-]{16,}/);
  });

  it("denies every LINE tool globally and exposes only two approval-gated metadata reads to projectread", async () => {
    const config = await readConfig();
    const permission = config.agent.projectread.permission;

    expect(config.permission["line_official_*"]).toBe("deny");
    expect(permission).toMatchObject({
      read: "allow",
      glob: "allow",
      grep: "allow",
      list: "allow",
      edit: "deny",
      bash: "deny",
      task: "deny",
      external_directory: "deny",
      "line_official_*": "deny",
      line_official_get_message_quota: "ask",
      line_official_get_rich_menu_list: "ask"
    });
    for (const tool of [
      "push_text_message",
      "push_flex_message",
      "broadcast_text_message",
      "broadcast_flex_message",
      "get_profile",
      "get_follower_ids",
      "delete_rich_menu",
      "set_rich_menu_default",
      "cancel_rich_menu_default",
      "create_rich_menu"
    ]) {
      expect(permission[`line_official_${tool}`] ?? permission["line_official_*"]).toBe("deny");
    }
  });

  it("documents the same no-write and no-sensitive-read boundary in the project agent card", async () => {
    const agent = await readFile(agentUrl, "utf8");

    expect(agent).toContain("edit: deny");
    expect(agent).toContain("bash: deny");
    expect(agent).toContain("line_official_get_message_quota: ask");
    expect(agent).toContain("line_official_get_rich_menu_list: ask");
    expect(agent).toContain("Never call profile/follower tools");
    expect(agent).toContain("Do not edit files");
  });
});

