#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
const root = resolve(scriptDir, "..");
const cardsDir = join(root, "docs/agents/ronin/cards");
const schemaDir = join(root, "schemas/agent-runtime");
const schedulePath = join(root, "config/agent-runtime/background-tasks.plan-only.v1.json");

const CARD_SECTIONS = Object.freeze([
  "Identity",
  "Mission",
  "Responsibilities",
  "Allowed inputs",
  "Outputs",
  "Required evidence",
  "Prohibited actions",
  "Escalation",
  "Background cadence",
  "Source references",
  "Authority boundary"
]);

const ROLE_CARD_FIELDS = Object.freeze({
  "Role ID": "roleId",
  "Card ID": "cardId",
  "Functional role ID": "functionalRoleId",
  Department: "department",
  Codename: "codename",
  "Department head role ID": "headRoleId",
  "Reports to": "reportsTo",
  "Runtime principal": "runtimePrincipalId",
  "Runtime principal boundary": "runtimePrincipalBoundary",
  "Action classes": "actionClasses"
});

const PLAN_KEYS = Object.freeze([
  "enabled",
  "maxConcurrentTasks",
  "schemaVersion",
  "status",
  "tasks"
]);
const TASK_KEYS = Object.freeze([
  "activationGate",
  "cadence",
  "enabled",
  "id",
  "maxRuntimeSeconds",
  "maxSteps",
  "mode",
  "outputs",
  "prohibitedActions",
  "purpose",
  "roleAssignments",
  "stopConditions"
]);
const ASSIGNMENT_KEYS = Object.freeze([
  "cadence",
  "cardId",
  "contributionOutputs",
  "functionalRoleId",
  "roleId"
]);

export const EXPECTED_BACKGROUND_TASKS = Object.freeze({
  "runtime-admission-observation": Object.freeze({
    mode: "READ_ONLY",
    roleIds: Object.freeze([13]),
    cadence: "Every 60 seconds while an approved mission is active.",
    output: "RuntimeAdmissionObservationV1",
    activationGate: "APPROVE_BACKGROUND_TASK runtime-admission-observation <plan-hash>"
  }),
  "runtime-route-drift": Object.freeze({
    mode: "READ_ONLY",
    roleIds: Object.freeze([6, 13]),
    cadence: "On router or API contract change; runtime observation only while an approved mission is active.",
    output: "RuntimeRouteDriftObservationV1",
    activationGate: "APPROVE_BACKGROUND_TASK runtime-route-drift <plan-hash>"
  }),
  "gate-evidence-index": Object.freeze({
    mode: "PROPOSAL_ONLY",
    roleIds: Object.freeze([43]),
    cadence: "At every promotion, external transition, rollback, and daily receipt audit.",
    output: "GateEvidenceIndexProposalV1",
    activationGate: "APPROVE_BACKGROUND_TASK gate-evidence-index <plan-hash>"
  }),
  "a2a-telegram-readiness": Object.freeze({
    mode: "PROPOSAL_ONLY",
    roleIds: Object.freeze([34]),
    cadence: "On protocol, card, bot, route, or gate change.",
    output: "A2ATelegramReadinessProposalV1",
    activationGate: "APPROVE_BACKGROUND_TASK a2a-telegram-readiness <plan-hash>"
  }),
  "candidate-smoke-proposal": Object.freeze({
    mode: "PROPOSAL_ONLY",
    roleIds: Object.freeze([22]),
    cadence: "For every proposed implementation or release candidate.",
    output: "CandidateSmokeProposalV1",
    activationGate: "APPROVE_BACKGROUND_TASK candidate-smoke-proposal <candidate-sha> <plan-hash>"
  }),
  "oss-license-refresh": Object.freeze({
    mode: "READ_ONLY",
    roleIds: Object.freeze([14, 47]),
    cadence: "On each new external-repository request and in a separately approved weekly drift review.",
    output: "OSSLicenseProvenanceRefreshV1",
    activationGate: "APPROVE_BACKGROUND_TASK oss-license-refresh <source-allowlist-hash>"
  }),
  "model-route-plan-refresh": Object.freeze({
    mode: "PROPOSAL_ONLY",
    roleIds: Object.freeze([29]),
    cadence: "Before every inference stage and on catalog drift.",
    output: "ModelRouteRefreshProposalV1",
    activationGate: "APPROVE_BACKGROUND_TASK model-route-plan-refresh <verified-catalog-hash> <plan-hash>"
  })
});

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameValues(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function exactKeys(value, expected) {
  return isRecord(value) && sameValues(Object.keys(value).sort(), [...expected].sort());
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function nonEmptyUniqueStringArray(value) {
  return Array.isArray(value)
    && value.length > 0
    && value.every(nonEmptyString)
    && new Set(value).size === value.length;
}

function sectionBody(markdown, heading) {
  const sections = [...markdown.matchAll(/^## ([^\n]+)$/gm)];
  const matchIndex = sections.findIndex((match) => match[1] === heading);
  if (matchIndex === -1) return null;
  const start = sections[matchIndex].index + sections[matchIndex][0].length;
  const end = matchIndex + 1 < sections.length ? sections[matchIndex + 1].index : markdown.length;
  return markdown.slice(start, end).trim();
}

function paragraph(body) {
  if (body === null) return null;
  return body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join(" ");
}

function bulletList(body, failures, label) {
  if (body === null) {
    failures.push(`${label} section is missing`);
    return [];
  }
  const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const values = [];
  for (const line of lines) {
    if (!line.startsWith("- ")) failures.push(`${label} contains non-list content: ${line}`);
    else values.push(line.slice(2));
  }
  return values;
}

function identityFields(body, failures) {
  const values = {};
  for (const item of bulletList(body, failures, "Identity")) {
    const separator = item.indexOf(": ");
    if (separator === -1) {
      failures.push(`Identity item is not key/value: ${item}`);
      continue;
    }
    const key = item.slice(0, separator);
    const value = item.slice(separator + 2);
    if (!(key in ROLE_CARD_FIELDS)) failures.push(`Identity contains unknown field: ${key}`);
    else if (key in values) failures.push(`Identity contains duplicate field: ${key}`);
    else values[key] = value;
  }
  for (const key of Object.keys(ROLE_CARD_FIELDS)) {
    if (!(key in values)) failures.push(`Identity field is missing: ${key}`);
  }
  return values;
}

export function parsePassiveCard(markdown) {
  const failures = [];
  const sectionNames = [...markdown.matchAll(/^## ([^\n]+)$/gm)].map((match) => match[1]);
  if (!sameValues(sectionNames, CARD_SECTIONS)) {
    failures.push(`section set/order drifted: ${sectionNames.join(", ")}`);
  }
  const identity = identityFields(sectionBody(markdown, "Identity"), failures);
  const header = markdown.match(/^# ([^\n]+)$/m)?.[1] ?? null;
  const status = markdown.match(/^Status: \*\*([^*]+)\*\*$/m)?.[1] ?? null;
  const specificationMode = markdown.match(/^Specification mode: \*\*([^*]+)\*\*$/m)?.[1] ?? null;
  const executable = markdown.match(/^Executable role definition: \*\*([^*]+)\*\*$/m)?.[1] ?? null;
  const authorityBoundary = paragraph(sectionBody(markdown, "Authority boundary"));

  return {
    failures,
    header,
    status,
    specificationMode,
    executable,
    identity,
    mission: paragraph(sectionBody(markdown, "Mission")),
    responsibilities: bulletList(sectionBody(markdown, "Responsibilities"), failures, "Responsibilities"),
    allowedInputs: bulletList(sectionBody(markdown, "Allowed inputs"), failures, "Allowed inputs"),
    outputs: bulletList(sectionBody(markdown, "Outputs"), failures, "Outputs"),
    requiredEvidence: bulletList(sectionBody(markdown, "Required evidence"), failures, "Required evidence"),
    prohibitedActions: bulletList(sectionBody(markdown, "Prohibited actions"), failures, "Prohibited actions"),
    escalation: bulletList(sectionBody(markdown, "Escalation"), failures, "Escalation"),
    backgroundCadence: paragraph(sectionBody(markdown, "Background cadence")),
    sourceRefs: bulletList(sectionBody(markdown, "Source references"), failures, "Source references"),
    authorityBoundary
  };
}

export function validatePassiveCard(role, markdown) {
  const parsed = parsePassiveCard(markdown);
  const failures = [...parsed.failures];
  const label = role.roleId === 0 ? "Kai" : `role ${role.roleId}`;
  const expectedHeader = role.roleId === 0
    ? `Kai — ${role.codename}: ${role.title}`
    : `Ronin ${String(role.roleId).padStart(2, "0")} — ${role.codename}: ${role.title}`;
  const expectedHead = role.headRoleId === null ? "none — Kai is outside the 47" : String(role.headRoleId);
  const expectedIdentity = {
    "Role ID": String(role.roleId),
    "Card ID": role.cardId,
    "Functional role ID": role.functionalRoleId,
    Department: `${role.departmentId} — ${role.departmentTitle}`,
    Codename: role.codename,
    "Department head role ID": expectedHead,
    "Reports to": role.reportsTo,
    "Runtime principal": role.runtimePrincipalId,
    "Runtime principal boundary": role.runtimePrincipalBoundary,
    "Action classes": role.actionClasses.join(", ")
  };
  const scalarChecks = {
    header: expectedHeader,
    status: role.implementationStatus,
    specificationMode: "passive-specification",
    executable: "no",
    mission: role.mission,
    backgroundCadence: role.backgroundCadence
  };
  for (const [field, expected] of Object.entries(scalarChecks)) {
    if (parsed[field] !== expected) failures.push(`${field} drifted`);
  }
  for (const [field, expected] of Object.entries(expectedIdentity)) {
    if (parsed.identity[field] !== expected) failures.push(`Identity.${field} drifted`);
  }
  for (const field of [
    "responsibilities",
    "allowedInputs",
    "outputs",
    "requiredEvidence",
    "prohibitedActions",
    "escalation",
    "sourceRefs"
  ]) {
    if (!sameValues(parsed[field], role[field])) failures.push(`${field} drifted`);
  }
  if (!parsed.authorityBoundary?.includes("47 Ronin remain logical roles rather than processes")
      || !parsed.authorityBoundary?.includes("this card enables no external action")) {
    failures.push("authority boundary must remain passive and external-action closed");
  }
  return failures.map((failure) => `${label} card: ${failure}`);
}

export function validateBackgroundTaskPlan(schedule, roles) {
  const failures = [];
  const fail = (message) => failures.push(`background plan: ${message}`);
  if (!exactKeys(schedule, PLAN_KEYS)) fail("top-level fields do not match the closed 1.1 contract");
  if (schedule?.schemaVersion !== "1.1") fail("schemaVersion must equal 1.1");
  if (schedule?.status !== "PLAN_ONLY") fail("status must remain PLAN_ONLY");
  if (schedule?.enabled !== false) fail("enabled must remain false");
  if (schedule?.maxConcurrentTasks !== 1) fail("maxConcurrentTasks must remain 1");
  if (!Array.isArray(schedule?.tasks) || schedule.tasks.length === 0) {
    fail("tasks must be a non-empty array");
    return failures;
  }

  const expectedTaskIds = Object.keys(EXPECTED_BACKGROUND_TASKS).sort();
  const actualTaskIds = schedule.tasks.map((task) => task?.id).sort();
  if (!sameValues(actualTaskIds, expectedTaskIds)) fail("task IDs do not match the closed task allowlist");
  if (new Set(actualTaskIds).size !== actualTaskIds.length) fail("task IDs must be unique");
  const rolesById = new Map(roles.map((role) => [role.roleId, role]));

  for (const task of schedule.tasks) {
    const taskId = nonEmptyString(task?.id) ? task.id : "<missing-id>";
    const expected = EXPECTED_BACKGROUND_TASKS[taskId];
    if (!exactKeys(task, TASK_KEYS)) fail(`${taskId} fields do not match the closed task contract`);
    if (!expected) continue;
    if (task.enabled !== false) fail(`${taskId} must remain disabled`);
    if (task.mode !== expected.mode) fail(`${taskId} mode must remain ${expected.mode}`);
    if (!nonEmptyString(task.purpose)) fail(`${taskId} purpose must be a non-empty string`);
    if (task.cadence !== expected.cadence) fail(`${taskId} task cadence drifted`);
    if (!Number.isInteger(task.maxRuntimeSeconds) || task.maxRuntimeSeconds < 1 || task.maxRuntimeSeconds > 900) {
      fail(`${taskId} maxRuntimeSeconds must be an integer from 1 through 900`);
    }
    if (!Number.isInteger(task.maxSteps) || task.maxSteps < 1 || task.maxSteps > 50) {
      fail(`${taskId} maxSteps must be an integer from 1 through 50`);
    }
    for (const field of ["outputs", "prohibitedActions", "stopConditions"]) {
      if (!nonEmptyUniqueStringArray(task[field])) fail(`${taskId} ${field} must contain unique non-empty strings`);
    }
    if (!sameValues(task.outputs ?? [], [expected.output])) fail(`${taskId} task output drifted`);
    if (task.activationGate !== expected.activationGate) fail(`${taskId} activation gate drifted`);
    if (!Array.isArray(task.roleAssignments) || task.roleAssignments.length === 0) {
      fail(`${taskId} roleAssignments must be a non-empty array`);
      continue;
    }
    const assignedRoleIds = task.roleAssignments.map((assignment) => assignment?.roleId);
    if (!sameValues(assignedRoleIds, expected.roleIds)) fail(`${taskId} role assignment allowlist drifted`);
    if (new Set(assignedRoleIds).size !== assignedRoleIds.length) fail(`${taskId} role assignments must be unique`);

    for (const assignment of task.roleAssignments) {
      const role = rolesById.get(assignment?.roleId);
      if (!exactKeys(assignment, ASSIGNMENT_KEYS)) fail(`${taskId} role ${assignment?.roleId} assignment fields drifted`);
      if (!role) {
        fail(`${taskId} role ${assignment?.roleId} does not resolve to a canonical numbered role`);
        continue;
      }
      if (assignment.cardId !== role.cardId) fail(`${taskId} role ${role.roleId} cardId drifted`);
      if (assignment.functionalRoleId !== role.functionalRoleId) {
        fail(`${taskId} role ${role.roleId} functionalRoleId drifted`);
      }
      if (!nonEmptyUniqueStringArray(assignment.contributionOutputs)) {
        fail(`${taskId} role ${role.roleId} contributionOutputs must contain unique non-empty strings`);
      } else {
        const unrelated = assignment.contributionOutputs.filter((output) => !role.outputs.includes(output));
        if (unrelated.length > 0) {
          fail(`${taskId} role ${role.roleId} declares non-canonical outputs: ${unrelated.join(", ")}`);
        }
        if (task.prohibitedActions?.includes("receipt-create")
            && assignment.contributionOutputs.includes("transition-receipt")) {
          fail(`${taskId} cannot contribute transition-receipt while receipt-create is prohibited`);
        }
      }
      if (assignment.cadence !== role.backgroundCadence) {
        fail(`${taskId} role ${role.roleId} cadence does not equal its canonical card cadence`);
      }
    }
  }
  return failures;
}

function parseJson(path, failures) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failures.push(`${path}: ${error.message}`);
    return null;
  }
}

async function loadRegistry() {
  try {
    const module = await import("../services/dev-control-api/src/ronin-role-registry.mjs");
    return module.RONIN_ROLE_REGISTRY;
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "RONIN_REGISTRY_IMPORT_FAILED";
    const message = (error instanceof Error ? error.message : String(error)).replace(/\s+/g, " ").trim();
    console.error("RONIN_REGISTRY_INVALID failures=1");
    console.error(`- code=${code} message=${message}`);
    process.exit(1);
  }
}

export async function validateRepositoryContracts() {
  const failures = [];
  const registry = await loadRegistry();
  const roles = registry.roles;
  for (const role of [...roles, registry.kai]) {
    for (const sourceRef of role.sourceRefs) {
      if (!existsSync(join(root, sourceRef))) failures.push(`role ${role.roleId} source ref is missing: ${sourceRef}`);
    }
    const cardPath = join(cardsDir, `${role.cardId}.md`);
    if (!existsSync(cardPath)) failures.push(`role ${role.roleId} passive card is missing`);
    else {
      const card = readFileSync(cardPath, "utf8");
      if (card.startsWith("---")) failures.push(`role ${role.roleId} card must not have executable frontmatter`);
      failures.push(...validatePassiveCard(role, card));
    }
  }

  const numberedCards = readdirSync(cardsDir).filter((name) => /^ronin-\d{2}-.+\.md$/.test(name));
  if (numberedCards.length !== 47) failures.push("cards directory must contain exactly 47 numbered passive cards");

  let backgroundSchema = null;
  for (const name of readdirSync(schemaDir).filter((entry) => entry.endsWith(".json"))) {
    const parsed = parseJson(join(schemaDir, name), failures);
    if (name === "background-task-plan.v1.schema.json") backgroundSchema = parsed;
  }
  if (backgroundSchema?.properties?.schemaVersion?.const !== "1.1") {
    failures.push("background task JSON Schema must require contract version 1.1");
  }
  if (!backgroundSchema?.$defs?.task?.properties?.roleAssignments) {
    failures.push("background task JSON Schema must define roleAssignments");
  }
  const schedule = parseJson(schedulePath, failures);
  failures.push(...validateBackgroundTaskPlan(schedule, roles));

  return { failures, registry, numberedCards };
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const { failures, registry, numberedCards } = await validateRepositoryContracts();
  if (failures.length > 0) {
    console.error(`RONIN_REGISTRY_INVALID failures=${failures.length}`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(
    `RONIN_REGISTRY_VALID roles=${registry.roles.length} departments=16/9/10/8/4 `
      + `cards=${numberedCards.length} card_fields=22 background_contract=1.1 `
      + `workers_max=3 external_actions=false schedules_enabled=0`
  );
}
