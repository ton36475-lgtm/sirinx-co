import { readFile } from "node:fs/promises";

export const MCP_CONNECTION_PLAN_VERSION = "1.0";
export const MCP_CONNECTION_PLAN_URL = new URL(
  "../../../config/agent-runtime/mcp-connections.plan-only.v1.json",
  import.meta.url
);
export const MCP_CONNECTION_SCHEMA_URL = new URL(
  "../../../schemas/agent-runtime/mcp-connection-registry.v1.schema.json",
  import.meta.url
);

const ROOT_KEYS = Object.freeze([
  "authority",
  "connections",
  "generatedAt",
  "schemaVersion",
  "status",
  "stopRules"
]);
const AUTHORITY_KEYS = Object.freeze([
  "approvalAuthority",
  "runtimeProof",
  "secretPolicy",
  "transitionAuthority"
]);
const CONNECTION_KEYS = Object.freeze([
  "authMode",
  "blockers",
  "capabilities",
  "connectionId",
  "connectionState",
  "dataClassCeiling",
  "effectKinds",
  "enabled",
  "endpoint",
  "notes",
  "officialSources",
  "requiredTicketKinds",
  "role",
  "runtimeEvidence",
  "service",
  "toolPolicy",
  "transport"
]);
const ROLES = new Set([
  "REMOTE_MCP_SERVER",
  "MCP_PORTAL",
  "MCP_CLIENT",
  "LOCAL_MCP_SERVER",
  "MESSAGING_TRANSPORT",
  "A2A_PEER"
]);
const TRANSPORTS = new Set([
  "streamable-http",
  "cloud-connector",
  "stdio",
  "telegram-bot-api",
  "line-webhook",
  "a2a-https",
  "none"
]);
const CONNECTION_STATES = new Set([
  "candidate-not-configured",
  "portal-not-created",
  "client-capability-observed-not-configured",
  "installed-version-mcp-unverified",
  "protected-config-unread-not-configured",
  "disabled-existing-config",
  "transport-not-mcp-not-connected",
  "peer-card-missing-not-connected"
]);
const AUTH_MODES = new Set([
  "public-read-only",
  "oauth-human-required",
  "cloudflare-access-plus-server-oauth",
  "host-secret-reference-required",
  "protected-config-unread",
  "agent-card-auth-required",
  "not-applicable"
]);
const TICKET_KINDS = new Set([
  "INSTALL",
  "CONNECTOR_ACTIVATION",
  "PROVIDER_CALL",
  "QUEUE_MUTATION",
  "A2A_EGRESS",
  "LIVE_SEND",
  "CLOUDFLARE_MUTATION",
  "DEPLOY"
]);

function fail(message) {
  throw new Error(`invalid_mcp_connection_plan:${message}`);
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label}_must_be_object`);
  }
  const actual = Object.keys(value).sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    fail(`${label}_must_be_closed`);
  }
}

function stringArray(value, label, { nonEmpty = false, maxItemLength = Number.POSITIVE_INFINITY } = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0)) fail(`${label}_must_be_array`);
  if (value.some((item) =>
    typeof item !== "string" || item.trim() === "" || item.length > maxItemLength
  )) {
    fail(`${label}_must_contain_nonempty_strings`);
  }
  if (new Set(value).size !== value.length) fail(`${label}_must_be_unique`);
}

function validRfc3339DateTime(value, label) {
  if (typeof value !== "string") fail(`${label}_must_be_rfc3339`);
  const match = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!match) fail(`${label}_must_be_rfc3339`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    fail(`${label}_must_be_rfc3339`);
  }
}

function validHttpsUrl(value, label, options = {}) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${label}_must_be_url`);
  }
  if (parsed.protocol !== "https:") fail(`${label}_must_use_https`);
  if (parsed.username || parsed.password) fail(`${label}_must_not_contain_userinfo`);
  if (options.endpoint === true && (parsed.search || parsed.hash)) {
    fail(`${label}_must_not_contain_query_or_fragment`);
  }
}

export function validateMcpConnectionPlan(plan) {
  exactKeys(plan, ROOT_KEYS, "root");
  if (plan.schemaVersion !== MCP_CONNECTION_PLAN_VERSION) fail("schema_version");
  if (plan.status !== "PLAN_ONLY / ALL_CONNECTIONS_DISABLED") fail("status");
  validRfc3339DateTime(plan.generatedAt, "generated_at");

  exactKeys(plan.authority, AUTHORITY_KEYS, "authority");
  if (plan.authority.transitionAuthority !== "target-managed-postgres-plus-sirinx-control-not-yet-wired") {
    fail("transition_authority");
  }
  if (plan.authority.approvalAuthority !== "attested-human-operator-only") fail("approval_authority");
  if (plan.authority.runtimeProof !== "authenticated-endpoint-plus-fresh-heartbeat-plus-task-bound-receipt") {
    fail("runtime_proof");
  }
  if (plan.authority.secretPolicy !== "opaque-host-secret-reference-only") fail("secret_policy");

  if (!Array.isArray(plan.connections) || plan.connections.length === 0) fail("connections");
  const ids = new Set();
  for (const [index, connection] of plan.connections.entries()) {
    const label = `connections_${index}`;
    exactKeys(connection, CONNECTION_KEYS, label);
    if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(connection.connectionId)) fail(`${label}_id`);
    if (ids.has(connection.connectionId)) fail(`${label}_duplicate_id`);
    ids.add(connection.connectionId);
    if (typeof connection.service !== "string" || connection.service.trim() === "" || connection.service.length > 128) {
      fail(`${label}_service`);
    }
    if (!ROLES.has(connection.role)) fail(`${label}_role`);
    if (!TRANSPORTS.has(connection.transport)) fail(`${label}_transport`);
    if (!CONNECTION_STATES.has(connection.connectionState)) fail(`${label}_connection_state`);
    if (!AUTH_MODES.has(connection.authMode)) fail(`${label}_auth_mode`);
    if (connection.endpoint !== null) validHttpsUrl(connection.endpoint, `${label}_endpoint`, { endpoint: true });
    if (connection.role === "REMOTE_MCP_SERVER" && connection.endpoint === null) {
      fail(`${label}_remote_endpoint_required`);
    }
    if (connection.enabled !== false) fail(`${label}_must_remain_disabled`);
    if (connection.runtimeEvidence !== "UNVERIFIED") fail(`${label}_runtime_evidence`);
    if (connection.toolPolicy !== "deny-all") fail(`${label}_tool_policy`);
    if (!["PUBLIC", "INTERNAL"].includes(connection.dataClassCeiling)) fail(`${label}_data_class`);
    stringArray(connection.capabilities, `${label}_capabilities`, { maxItemLength: 128 });
    stringArray(connection.effectKinds, `${label}_effectKinds`);
    stringArray(connection.requiredTicketKinds, `${label}_requiredTicketKinds`);
    stringArray(connection.blockers, `${label}_blockers`, { nonEmpty: true, maxItemLength: 256 });
    stringArray(connection.officialSources, `${label}_officialSources`);
    for (const kind of [...connection.effectKinds, ...connection.requiredTicketKinds]) {
      if (!TICKET_KINDS.has(kind)) fail(`${label}_ticket_kind`);
    }
    if (connection.effectKinds.some((kind) => !connection.requiredTicketKinds.includes(kind))) {
      fail(`${label}_effect_without_ticket`);
    }
    for (const source of connection.officialSources) validHttpsUrl(source, `${label}_official_source`);
    if (typeof connection.notes !== "string" || connection.notes.trim() === "" || connection.notes.length > 1024) {
      fail(`${label}_notes`);
    }
    if (["REMOTE_MCP_SERVER", "MCP_PORTAL"].includes(connection.role) && connection.endpoint !== null && connection.transport !== "streamable-http") {
      fail(`${label}_remote_transport`);
    }
    if (connection.role === "A2A_PEER" && connection.transport !== "a2a-https") fail(`${label}_a2a_transport`);
  }

  stringArray(plan.stopRules, "stop_rules", { nonEmpty: true });
  return plan;
}

export async function getMcpConnectionPlan(options = {}) {
  const readFileImpl = options.readFileImpl || readFile;
  const raw = await readFileImpl(options.planUrl || MCP_CONNECTION_PLAN_URL, "utf8");
  let plan;
  try {
    plan = JSON.parse(raw);
  } catch {
    fail("json_parse");
  }
  validateMcpConnectionPlan(plan);

  const count = (role) => plan.connections.filter((connection) => connection.role === role).length;
  return {
    ...plan,
    mode: "local-static-plan",
    canConnect: false,
    canRunMcp: false,
    canEmitA2a: false,
    canSendMessages: false,
    externalWrites: false,
    commandExecuted: false,
    summary: {
      connections: plan.connections.length,
      enabled: 0,
      runtimeVerified: 0,
      remoteMcpServers: count("REMOTE_MCP_SERVER"),
      mcpPortals: count("MCP_PORTAL"),
      mcpClients: count("MCP_CLIENT"),
      localMcpServers: count("LOCAL_MCP_SERVER"),
      messagingTransports: count("MESSAGING_TRANSPORT"),
      a2aPeers: count("A2A_PEER")
    },
    stopPoint: "MCP/A2A CONNECTION PLAN VALIDATED - ZERO CONNECTIONS ENABLED OR CALLED"
  };
}
