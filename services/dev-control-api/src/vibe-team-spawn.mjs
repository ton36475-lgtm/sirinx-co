import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const VIBE_TEAM_PLAN_VERSION = "1.0";
export const VIBE_TEAM_PLAN_URL = new URL(
  "../../../config/agent-runtime/vibe-team.spawn.v1.json",
  import.meta.url
);

const ROOT_KEYS = Object.freeze([
  "authority",
  "generatedAt",
  "lanes",
  "limits",
  "modelRouting",
  "references",
  "schemaVersion",
  "status",
  "stopRules",
  "teamShapes"
]);
const AUTHORITY_KEYS = Object.freeze([
  "cloneReferenceRepos",
  "installReferenceRepos",
  "liveSend",
  "providerCall",
  "queueMutation",
  "runtimeSpawn"
]);
const REFERENCE_KEYS = Object.freeze([
  "adoptedPattern",
  "architecture",
  "license",
  "notAdopted",
  "publisher",
  "referenceId",
  "runtimeState",
  "sourceUrl",
  "status"
]);
const LANE_KEYS = Object.freeze([
  "activation",
  "agentProfiles",
  "authHeader",
  "baseUrl",
  "endpoints",
  "entrypoint",
  "kind",
  "laneId",
  "liveCallsAllowed",
  "notes",
  "requiredTickets"
]);
const LANE_OPTIONAL_KEYS = Object.freeze(["headlessFlag", "versionFloor"]);
const SHAPE_KEYS = Object.freeze(["archetype", "maxWorkers", "roles", "shapeId"]);
const ROLE_KEYS = Object.freeze(["duty", "lane", "roleId"]);
const MODEL_ROUTING_KEYS = Object.freeze([
  "accessVerified",
  "appliesToLanes",
  "catalogSource",
  "catalogVerified",
  "displayName",
  "liveCallsAllowed",
  "modelId",
  "notes",
  "provider"
]);
const LIMIT_KEYS = Object.freeze([
  "maxCostMicroUsd",
  "maxPacketsPerWave",
  "maxSteps",
  "maxTokens",
  "maxWorkers",
  "timeoutSeconds"
]);

const REFERENCE_IDS = Object.freeze(["openbot", "openmanus", "opendots"]);
const LANE_IDS = Object.freeze(["cline", "manus", "cue"]);
const LANE_KINDS = Object.freeze({
  cline: "local-cli",
  manus: "hosted-api",
  cue: "app-only"
});
const ARCHETYPES = new Set([
  "openbot-coworker",
  "openmanus-planner-executor",
  "opendots-persistent-dot"
]);
const SHAPE_IDS = new Set(["research", "implementation", "persistent-ops"]);
const TICKETS = new Set(["PROVIDER_CALL", "LIVE_SEND", "QUEUE_MUTATION", "INSTALL"]);
const ROLE_ID = /^(L[1-5]-\d{2}|Kai)$/;
const MANUS_PROFILES = new Set([
  "standard",
  "lite",
  "max",
  "max-medium",
  "max-high",
  "max-extra",
  "max-ultra"
]);
const ACTION_CLASS = "PROPOSAL_ONLY";

function fail(message) {
  throw new Error(`invalid_vibe_team_plan:${message}`);
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

function closedKeys(value, required, optional, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(`${label}_must_be_object`);
  }
  const allowed = new Set([...required, ...optional]);
  const actual = Object.keys(value);
  if (actual.some((key) => !allowed.has(key))) fail(`${label}_must_be_closed`);
  if (required.some((key) => !actual.includes(key))) fail(`${label}_must_be_closed`);
}

function nonEmptyString(value, label, maxLength = 512) {
  if (typeof value !== "string" || value.trim() === "" || value.length > maxLength) {
    fail(`${label}_must_be_nonempty_string`);
  }
}

function stringArray(value, label, { nonEmpty = false, maxItemLength = 256 } = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0)) fail(`${label}_must_be_array`);
  if (value.some((item) => typeof item !== "string" || item.trim() === "" || item.length > maxItemLength)) {
    fail(`${label}_must_contain_nonempty_strings`);
  }
  if (new Set(value).size !== value.length) fail(`${label}_must_be_unique`);
}

function integer(value, label, { min, max }) {
  if (!Number.isInteger(value) || value < min || value > max) fail(`${label}_out_of_range`);
}

function rfc3339(value, label) {
  const pattern = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
  if (typeof value !== "string" || !pattern.test(value)) fail(`${label}_must_be_rfc3339`);
}

function httpsUrl(value, label) {
  if (typeof value !== "string" || !/^https:\/\/[A-Za-z0-9.-]+(?:\/[A-Za-z0-9._~\/-]*)?$/.test(value)) {
    fail(`${label}_must_be_https_url`);
  }
  if (/[?#]/.test(value) || value.includes("@")) fail(`${label}_must_not_carry_auth_or_query`);
}

export function validateVibeTeamPlan(plan) {
  exactKeys(plan, ROOT_KEYS, "root");
  if (plan.schemaVersion !== VIBE_TEAM_PLAN_VERSION) fail("schema_version");
  rfc3339(plan.generatedAt, "generatedAt");
  if (plan.status !== "PLAN_ONLY / LIVE_ADAPTERS_NOT_ACTIVATED") fail("status");

  exactKeys(plan.authority, AUTHORITY_KEYS, "authority");
  for (const key of AUTHORITY_KEYS) {
    if (plan.authority[key] !== false) fail(`authority_${key}`);
  }

  exactKeys(plan.modelRouting, MODEL_ROUTING_KEYS, "model_routing");
  if (plan.modelRouting.provider !== "freebuff") fail("model_provider");
  if (!/^[a-z0-9][a-z0-9.-]{1,63}$/.test(plan.modelRouting.modelId)) fail("model_id");
  nonEmptyString(plan.modelRouting.displayName, "model_display_name", 64);
  if (plan.modelRouting.catalogSource !== "infra/9router/model-catalog.json") fail("model_catalog_source");
  if (plan.modelRouting.catalogVerified !== true) fail("model_catalog_verified");
  if (plan.modelRouting.accessVerified !== false) fail("model_access_verified");
  if (plan.modelRouting.liveCallsAllowed !== false) fail("model_live_calls");
  stringArray(plan.modelRouting.appliesToLanes, "model_lanes", { nonEmpty: true, maxItemLength: 8 });
  for (const laneId of plan.modelRouting.appliesToLanes) {
    if (!LANE_IDS.includes(laneId)) fail("model_lane_id");
  }
  nonEmptyString(plan.modelRouting.notes, "model_notes", 512);

  if (!Array.isArray(plan.references) || plan.references.length !== 3) fail("references_length");
  const seenReferences = new Set();
  for (const reference of plan.references) {
    exactKeys(reference, REFERENCE_KEYS, "reference");
    if (!REFERENCE_IDS.includes(reference.referenceId)) fail("reference_id");
    if (seenReferences.has(reference.referenceId)) fail("reference_duplicate");
    seenReferences.add(reference.referenceId);
    nonEmptyString(reference.publisher, "reference_publisher", 80);
    httpsUrl(reference.sourceUrl, "reference_source");
    if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(reference.sourceUrl)) {
      fail("reference_source_host");
    }
    if (reference.license !== "MIT") fail("reference_license");
    nonEmptyString(reference.status, "reference_status", 40);
    nonEmptyString(reference.architecture, "reference_architecture", 512);
    nonEmptyString(reference.adoptedPattern, "reference_adopted", 256);
    stringArray(reference.notAdopted, "reference_not_adopted", { nonEmpty: true, maxItemLength: 256 });
    if (reference.runtimeState !== "DOCS_READ_ONLY_NOT_CLONED") fail("reference_runtime_state");
  }

  if (!Array.isArray(plan.lanes) || plan.lanes.length !== 3) fail("lanes_length");
  const seenLanes = new Set();
  for (const lane of plan.lanes) {
    closedKeys(lane, LANE_KEYS, LANE_OPTIONAL_KEYS, "lane");
    if (!LANE_IDS.includes(lane.laneId)) fail("lane_id");
    if (seenLanes.has(lane.laneId)) fail("lane_duplicate");
    seenLanes.add(lane.laneId);
    if (lane.kind !== LANE_KINDS[lane.laneId]) fail("lane_kind");
    if (lane.liveCallsAllowed !== false) fail("lane_live_calls");
    nonEmptyString(lane.activation, "lane_activation", 64);
    nonEmptyString(lane.notes, "lane_notes", 512);
    stringArray(lane.requiredTickets, "lane_tickets", { nonEmpty: true });
    for (const ticket of lane.requiredTickets) {
      if (!TICKETS.has(ticket)) fail("lane_ticket_kind");
    }
    stringArray(lane.agentProfiles, "lane_profiles", { maxItemLength: 32 });
    for (const profile of lane.agentProfiles) {
      if (!MANUS_PROFILES.has(profile)) fail("lane_profile");
    }
    if (!Array.isArray(lane.endpoints) || lane.endpoints.length > 4) fail("lane_endpoints");
    for (const endpoint of lane.endpoints) {
      if (!/^\/v\d+\/[A-Za-z0-9._-]+$/.test(endpoint)) fail("lane_endpoint_shape");
    }
    if (lane.baseUrl !== null) httpsUrl(lane.baseUrl, "lane_base_url");
    if (lane.authHeader !== null && !/^x-[a-z-]{2,32}$/.test(lane.authHeader)) fail("lane_auth_header");
    if (lane.entrypoint !== null) nonEmptyString(lane.entrypoint, "lane_entrypoint", 64);
    if ("versionFloor" in lane && !/^\d+\.\d+\.\d+$/.test(lane.versionFloor)) fail("lane_version_floor");
    if ("headlessFlag" in lane && !/^--[a-z-]+$/.test(lane.headlessFlag)) fail("lane_headless_flag");

    if (lane.laneId === "cline") {
      if (lane.entrypoint !== "cline" || lane.headlessFlag !== "--json") fail("cline_entrypoint");
      if (!lane.requiredTickets.includes("PROVIDER_CALL")) fail("cline_ticket");
    }
    if (lane.laneId === "manus") {
      if (lane.baseUrl !== "https://api.manus.ai") fail("manus_base_url");
      if (lane.endpoints.length !== 1 || lane.endpoints[0] !== "/v2/task.create") fail("manus_endpoint");
      if (lane.authHeader !== "x-manus-api-key") fail("manus_auth_header");
      if (!lane.agentProfiles.includes("standard")) fail("manus_profiles");
    }
    if (lane.laneId === "cue") {
      if (lane.baseUrl !== null || lane.endpoints.length !== 0 || lane.agentProfiles.length !== 0) {
        fail("cue_not_api");
      }
      if (!lane.requiredTickets.includes("LIVE_SEND")) fail("cue_ticket");
    }
  }

  if (!Array.isArray(plan.teamShapes) || plan.teamShapes.length === 0) fail("team_shapes");
  const seenShapes = new Set();
  for (const shape of plan.teamShapes) {
    exactKeys(shape, SHAPE_KEYS, "shape");
    if (!SHAPE_IDS.has(shape.shapeId)) fail("shape_id");
    if (seenShapes.has(shape.shapeId)) fail("shape_duplicate");
    seenShapes.add(shape.shapeId);
    if (!ARCHETYPES.has(shape.archetype)) fail("shape_archetype");
    integer(shape.maxWorkers, "shape_max_workers", { min: 1, max: 3 });
    if (!Array.isArray(shape.roles) || shape.roles.length === 0 || shape.roles.length > 4) {
      fail("shape_roles");
    }
    const roleIds = new Set();
    for (const role of shape.roles) {
      exactKeys(role, ROLE_KEYS, "role");
      if (typeof role.roleId !== "string" || !ROLE_ID.test(role.roleId)) fail("role_id");
      if (roleIds.has(role.roleId)) fail("role_duplicate");
      roleIds.add(role.roleId);
      nonEmptyString(role.duty, "role_duty", 64);
      if (!LANE_IDS.includes(role.lane)) fail("role_lane");
    }
    const workers = shape.roles.filter((role) => role.duty !== "coordinator");
    if (workers.length > shape.maxWorkers) fail("shape_worker_cap");
    if (!shape.roles.some((role) => role.duty === "coordinator")) fail("shape_coordinator");
  }

  exactKeys(plan.limits, LIMIT_KEYS, "limits");
  integer(plan.limits.maxWorkers, "limit_max_workers", { min: 1, max: 3 });
  integer(plan.limits.maxPacketsPerWave, "limit_packets", { min: 1, max: 4 });
  integer(plan.limits.maxSteps, "limit_steps", { min: 1, max: 200 });
  integer(plan.limits.maxTokens, "limit_tokens", { min: 1, max: 200000 });
  integer(plan.limits.maxCostMicroUsd, "limit_cost", { min: 0, max: 0 });
  integer(plan.limits.timeoutSeconds, "limit_timeout", { min: 60, max: 3600 });

  stringArray(plan.stopRules, "stop_rules", { nonEmpty: true });
  if (plan.stopRules.length < 3) fail("stop_rules_too_short");

  return plan;
}

export async function getVibeTeamPlan(options = {}) {
  const readFileImpl = options.readFileImpl || readFile;
  const raw = await readFileImpl(options.planUrl || VIBE_TEAM_PLAN_URL, "utf8");
  let plan;
  try {
    plan = JSON.parse(raw);
  } catch {
    fail("json_parse");
  }
  validateVibeTeamPlan(plan);
  return plan;
}

function digest(value, length) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}

function laneFor(plan, laneId) {
  return plan.lanes.find((lane) => lane.laneId === laneId);
}

export function buildVibeTeamPackets(goal, options = {}) {
  const plan = options.plan;
  if (!plan) fail("plan_required");
  validateVibeTeamPlan(plan);

  if (typeof goal !== "string" || goal.trim() === "" || goal.length > 4000) fail("goal");
  const shapeId = options.shapeId || "research";
  const shape = plan.teamShapes.find((candidate) => candidate.shapeId === shapeId);
  if (!shape) fail("shape_missing");

  const workers = shape.roles.filter((role) => role.duty !== "coordinator");
  if (workers.length > plan.limits.maxWorkers) fail("worker_cap");

  const packets = shape.roles.map((role, index) => {
    const seed = `${goal.trim()}|${shape.shapeId}|${role.roleId}`;
    const taskId = `task_${digest(seed, 16)}`;
    const runId = `run_${digest(`${seed}|${index}`, 16)}`;
    const lane = laneFor(plan, role.lane);
    return {
      task_id: taskId,
      run_id: runId,
      role_id: role.roleId,
      card_id: role.roleId,
      duty: role.duty,
      shape_id: shape.shapeId,
      archetype: shape.archetype,
      lane: role.lane,
      goal: goal.trim(),
      non_goals: [
        "no reference-repo clone or install",
        "no provider call without PROVIDER_CALL ticket",
        "no push, deploy, cloud mutation, or customer message"
      ],
      allowed_inputs: ["repository read-only", "plan document", "public documentation"],
      paths: [],
      action_class: ACTION_CLASS,
      model: {
        provider: plan.modelRouting.provider,
        model_id: plan.modelRouting.modelId,
        display_name: plan.modelRouting.displayName,
        catalog_source: plan.modelRouting.catalogSource,
        access_verified: plan.modelRouting.accessVerified,
        live_calls_allowed: plan.modelRouting.liveCallsAllowed
      },
      budgets: {
        max_steps: plan.limits.maxSteps,
        max_tokens: plan.limits.maxTokens,
        max_cost_micro_usd: plan.limits.maxCostMicroUsd,
        timeout_seconds: plan.limits.timeoutSeconds
      },
      required_tickets: lane.requiredTickets,
      prior_receipt_digests: [],
      required_outputs: ["candidate result", "evidence references", "blocked-effect statement"],
      stop_conditions: plan.stopRules,
      escalation_target: "L4-36",
      effects: {
        provider_call: false,
        queue_mutation: false,
        live_send: false,
        spawn: false
      }
    };
  });

  if (packets.length > plan.limits.maxPacketsPerWave) fail("packet_cap");

  return {
    mode: "local-static-plan",
    shape_id: shape.shapeId,
    archetype: shape.archetype,
    coordinator: packets.find((packet) => packet.duty === "coordinator").task_id,
    worker_count: workers.length,
    packets,
    provider_called: false,
    runtime_spawned: false,
    queue_mutated: false,
    stop_point: "SPAWN PLAN BUILT - ZERO LANES ACTIVATED"
  };
}
