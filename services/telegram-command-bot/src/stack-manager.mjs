import { execFile, spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { accessSync, constants as fsConstants } from "node:fs";
import {
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { createServer } from "node:net";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  inspectOperatorEnvironment,
  probeServiceIdentity,
} from "./operator-preflight.mjs";
import { readTelegramSendGate } from "./control-gate.mjs";

const execFileAsync = promisify(execFile);
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

export const TELEGRAM_STACK_VERSION = "1.0";
export const TELEGRAM_STACK_OWNER = "sirinx-co-telegram-stack";
export const DEFAULT_TELEGRAM_STACK_RUNTIME_DIR = resolve(
  REPO_ROOT,
  ".runtime",
  "telegram-stack",
);

const STATE_FILE = "state.json";
const LOCK_FILE = "manager.lock";
const PROCESS_START_TIMEOUT_MS = 60_000;
const PROCESS_STOP_TIMEOUT_MS = 8_000;
const POLL_INTERVAL_MS = 100;

export const TELEGRAM_STACK_SERVICES = Object.freeze([
  Object.freeze({
    id: "rustControl",
    port: 8711,
    command: "cargo",
    args: Object.freeze(["run", "-p", "sirinx-control"]),
    commandSignature: "cargo-run-sirinx-control",
    env: Object.freeze({ CONTROL_PORT: "8711" }),
    health: Object.freeze({
      id: "rustControl",
      healthUrl: "http://127.0.0.1:8711/health",
      matches: (body) => body?.status === "ok" && body?.service === "sirinx-control",
    }),
  }),
  Object.freeze({
    id: "nodeLongTail",
    port: 8790,
    command: "node",
    args: Object.freeze(["services/dev-control-api/server.mjs"]),
    commandSignature: "node-dev-control-api",
    env: Object.freeze({
      DEV_CONTROL_API_HOST: "127.0.0.1",
      DEV_CONTROL_API_PORT: "8790",
    }),
    health: Object.freeze({
      id: "nodeLongTail",
      healthUrl: "http://127.0.0.1:8790/health",
      matches: (body) => body?.status === "ok" && body?.service === "sirinx-dev-control-api",
    }),
  }),
  Object.freeze({
    id: "telegramGateway",
    port: 8791,
    command: "node",
    args: Object.freeze(["services/telegram-command-bot/src/index.mjs"]),
    commandSignature: "node-telegram-command-bot",
    env: Object.freeze({
      TELEGRAM_BOT_HOST: "127.0.0.1",
      TELEGRAM_BOT_PORT: "8791",
    }),
    health: Object.freeze({
      id: "telegramGateway",
      healthUrl: "http://127.0.0.1:8791/health",
      matches: (body) => body?.status === "ok" && body?.service === "telegram-command-bot",
    }),
  }),
]);

function currentDate(options = {}) {
  const value = typeof options.now === "function" ? options.now() : options.now || new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function currentMs(options = {}) {
  if (typeof options.nowMsImpl === "function") return Number(options.nowMsImpl());
  return Date.now();
}

function sleep(ms, options = {}) {
  const sleepImpl = options.sleepImpl || ((delay) => new Promise((resolveSleep) => {
    setTimeout(resolveSleep, delay);
  }));
  return sleepImpl(ms);
}

function serviceById(id) {
  return TELEGRAM_STACK_SERVICES.find((service) => service.id === id) || null;
}

function commandMatches(service, commandLine) {
  const tokens = String(commandLine || "").trim().split(/\s+/).filter(Boolean);
  if (tokens.length !== service.args.length + 1) return false;
  if (basename(tokens[0]) !== service.command) return false;
  return service.args.every((argument, index) => tokens[index + 1] === argument);
}

function exactOrUnset(value, expected) {
  const normalized = String(value || "").trim();
  return normalized === "" || normalized === expected;
}

function stackEnvironment(env) {
  const base = inspectOperatorEnvironment(env);
  const topology = {
    controlPortExact: exactOrUnset(env.CONTROL_PORT, "8711"),
    nodeHostExact: exactOrUnset(env.DEV_CONTROL_API_HOST, "127.0.0.1"),
    nodePortExact: exactOrUnset(env.DEV_CONTROL_API_PORT, "8790"),
    telegramHostExact: exactOrUnset(env.TELEGRAM_BOT_HOST, "127.0.0.1"),
    telegramPortExact: exactOrUnset(env.TELEGRAM_BOT_PORT, "8791"),
  };
  return {
    ...base,
    ...topology,
    ready: base.ready && Object.values(topology).every(Boolean),
  };
}

function environmentBlockers(environment) {
  const blockers = [];
  if (!environment.telegramBotTokenConfigured) blockers.push("env_telegram_bot_token_missing");
  if (!environment.telegramChatIdConfigured) blockers.push("env_telegram_chat_id_missing");
  if (!environment.telegramOwnerIdsConfigured) blockers.push("env_telegram_owner_ids_missing");
  if (!environment.confirmSendConfigured) blockers.push("env_confirm_send_missing");
  if (!environment.controlApiTokenConfigured) blockers.push("env_control_api_token_missing");
  if (!environment.databaseUrlConfigured) blockers.push("env_database_url_missing");
  if (!environment.controlUrlConfigured) blockers.push("env_control_url_missing");
  else if (!environment.controlUrlIsExactLoopbackAuthority) {
    blockers.push("env_control_url_not_exact_loopback_authority");
  }
  if (!environment.controlPortExact) blockers.push("env_control_port_not_exact");
  if (!environment.nodeHostExact) blockers.push("env_node_host_not_exact");
  if (!environment.nodePortExact) blockers.push("env_node_port_not_exact");
  if (!environment.telegramHostExact) blockers.push("env_telegram_host_not_exact");
  if (!environment.telegramPortExact) blockers.push("env_telegram_port_not_exact");
  return blockers;
}

export function defaultCommandProbe(command) {
  const systemCommands = {
    lsof: "/usr/sbin/lsof",
    ps: "/bin/ps",
    shlock: "/usr/bin/shlock",
  };
  if (systemCommands[command]) {
    try {
      accessSync(systemCommands[command], fsConstants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
  const result = spawnSync(command, command === "lsof" ? ["-v"] : ["--version"], {
    cwd: REPO_ROOT,
    stdio: "ignore",
    timeout: 5_000,
  });
  return result.status === 0 && !result.error;
}

export async function defaultPortProbe(service) {
  return new Promise((resolveProbe) => {
    const server = createServer();
    let settled = false;
    const finish = (available) => {
      if (settled) return;
      settled = true;
      resolveProbe(available);
    };
    server.unref();
    server.once("error", () => finish(false));
    server.listen({ host: "127.0.0.1", port: service.port, exclusive: true }, () => {
      server.close((error) => finish(!error));
    });
  });
}

export async function defaultProcessInspect(pid) {
  if (!Number.isInteger(pid) || pid <= 1) return { running: false };
  try {
    const [command, started, processGroup] = await Promise.all([
      execFileAsync("/bin/ps", ["-p", String(pid), "-o", "command="], {
        timeout: 2_000,
        maxBuffer: 16 * 1024,
      }),
      execFileAsync("/bin/ps", ["-p", String(pid), "-o", "lstart="], {
        timeout: 2_000,
        maxBuffer: 4 * 1024,
      }),
      execFileAsync("/bin/ps", ["-p", String(pid), "-o", "pgid="], {
        timeout: 2_000,
        maxBuffer: 4 * 1024,
      }),
    ]);
    const commandLine = String(command.stdout || "").trim();
    const processStartedAt = String(started.stdout || "").trim();
    const processGroupId = Number.parseInt(String(processGroup.stdout || "").trim(), 10);
    return {
      running: Boolean(commandLine && processStartedAt && Number.isInteger(processGroupId)),
      commandLine,
      processStartedAt,
      processGroupId: Number.isInteger(processGroupId) ? processGroupId : null,
    };
  } catch {
    return { running: false };
  }
}

export async function defaultPortOwnershipProbe(service, rootPid) {
  if (!Number.isInteger(rootPid) || rootPid <= 1) return false;
  try {
    const listeners = await execFileAsync("/usr/sbin/lsof", [
      "-nP",
      "-a",
      `-iTCP@127.0.0.1:${service.port}`,
      "-sTCP:LISTEN",
      "-Fp",
    ], {
      timeout: 2_000,
      maxBuffer: 16 * 1024,
    });
    const listenerPids = [...new Set(String(listeners.stdout || "")
      .split(/\r?\n/)
      .map((line) => /^p([0-9]+)$/.exec(line)?.[1])
      .filter(Boolean)
      .map(Number))];
    if (listenerPids.length === 0) return false;

    const root = await defaultProcessInspect(rootPid);
    if (root.running !== true || root.processGroupId !== rootPid) return false;
    const owners = await Promise.all(listenerPids.map((pid) => defaultProcessInspect(pid)));
    return owners.every((owner) => (
      owner.running === true && owner.processGroupId === root.processGroupId
    ));
  } catch {
    return false;
  }
}

export function defaultProcessGroupAlive(processGroupId) {
  if (!Number.isInteger(processGroupId) || processGroupId <= 1) return false;
  try {
    process.kill(-processGroupId, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

export function defaultSpawnService(service, env) {
  const child = spawn(service.command, [...service.args], {
    cwd: REPO_ROOT,
    env: { ...env },
    detached: true,
    stdio: "ignore",
  });
  // Admission already verified the command, but spawn errors can still race
  // with process inspection. Consume the event and let PID/ownership checks
  // fail closed instead of crashing the manager.
  child.once("error", () => {});
  child.unref();
  return { pid: child.pid };
}

export function defaultSignalProcessGroup(pid, signal = "SIGTERM") {
  process.kill(-pid, signal);
}

function directoryStatsSecure(stats) {
  const ownedByCurrentUser = typeof process.getuid !== "function"
    || stats.uid === process.getuid();
  const groupOrWorldWritable = (stats.mode & 0o022) !== 0;
  return stats.isDirectory()
    && !stats.isSymbolicLink()
    && ownedByCurrentUser
    && !groupOrWorldWritable;
}

async function runtimeDirectoryReadSafe(runtimeDir) {
  const parent = dirname(runtimeDir);
  try {
    const parentStats = await lstat(parent);
    if (!directoryStatsSecure(parentStats)) return false;
  } catch (error) {
    return error?.code === "ENOENT";
  }
  try {
    return directoryStatsSecure(await lstat(runtimeDir));
  } catch (error) {
    return error?.code === "ENOENT";
  }
}

async function ensureDirectoryNoSymlink(path) {
  const validate = (stats) => {
    if (!directoryStatsSecure(stats)) throw new Error("runtime_directory_invalid");
  };
  try {
    const stats = await lstat(path);
    validate(stats);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await mkdir(path, { mode: 0o700 });
    const stats = await lstat(path);
    validate(stats);
  }
}

async function ensureRuntimeDir(runtimeDir) {
  const parent = dirname(runtimeDir);
  await ensureDirectoryNoSymlink(parent);
  await ensureDirectoryNoSymlink(runtimeDir);
}

function statePath(runtimeDir) {
  return resolve(runtimeDir, STATE_FILE);
}

function lockPath(runtimeDir) {
  return resolve(runtimeDir, LOCK_FILE);
}

function validProcessStartedAt(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 128;
}

function validateState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (value.version !== 1 || value.owner !== TELEGRAM_STACK_OWNER) return false;
  if (typeof value.runId !== "string" || value.runId.length < 8 || value.runId.length > 64) {
    return false;
  }
  if (!Array.isArray(value.services) || value.services.length > TELEGRAM_STACK_SERVICES.length) {
    return false;
  }
  const ids = new Set();
  for (const entry of value.services) {
    const service = serviceById(entry?.id);
    if (!service || ids.has(entry.id)) return false;
    ids.add(entry.id);
    if (!Number.isInteger(entry.pid) || entry.pid <= 1) return false;
    if (entry.port !== service.port || entry.commandSignature !== service.commandSignature) {
      return false;
    }
    if (!validProcessStartedAt(entry.processStartedAt)) return false;
  }
  return true;
}

async function loadState(runtimeDir) {
  const path = statePath(runtimeDir);
  try {
    const stats = await lstat(path);
    if (!stats.isFile() || stats.isSymbolicLink() || stats.size > 32 * 1024) {
      return { kind: "invalid", state: null };
    }
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw);
    return validateState(parsed)
      ? { kind: "valid", state: parsed }
      : { kind: "invalid", state: null };
  } catch (error) {
    if (error?.code === "ENOENT") return { kind: "missing", state: null };
    return { kind: "invalid", state: null };
  }
}

async function writeState(runtimeDir, state) {
  if (!validateState(state)) throw new Error("runtime_state_invalid");
  const temporary = resolve(runtimeDir, `.state-${state.runId}.tmp`);
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });
  await rename(temporary, statePath(runtimeDir));
}

async function removeState(runtimeDir) {
  await rm(statePath(runtimeDir), { force: true });
}

async function lockOwnedByPid(path, pid, expectedInode = null) {
  try {
    const stats = await lstat(path);
    if (!stats.isFile()
        || stats.isSymbolicLink()
        || stats.size > 128
        || (expectedInode !== null && stats.ino !== expectedInode)) {
      return false;
    }
    return String(await readFile(path, "utf8")).trim() === String(pid);
  } catch {
    return false;
  }
}

export async function defaultManagerLockAcquire(path, pid) {
  try {
    try {
      const stats = await lstat(path);
      const ownedByCurrentUser = typeof process.getuid !== "function"
        || stats.uid === process.getuid();
      const rawPid = String(await readFile(path, "utf8")).trim();
      const parsedPid = Number(rawPid);
      if (!stats.isFile()
          || stats.isSymbolicLink()
          || stats.size > 128
          || !ownedByCurrentUser
          || (stats.mode & 0o022) !== 0
          || !Number.isInteger(parsedPid)
          || parsedPid <= 1
          || String(parsedPid) !== rawPid) {
        return false;
      }
    } catch (error) {
      if (error?.code !== "ENOENT") return false;
    }
    await execFileAsync("/usr/bin/shlock", ["-f", path, "-p", String(pid)], {
      timeout: 2_000,
      maxBuffer: 4 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}

async function acquireManagerLock(runtimeDir, options = {}) {
  await ensureRuntimeDir(runtimeDir);
  const path = lockPath(runtimeDir);
  const acquire = options.managerLockAcquireImpl || defaultManagerLockAcquire;
  const acquired = await acquire(path, process.pid) === true;
  if (!acquired) throw new Error("stack_manager_lock_unavailable");
  const stats = await lstat(path);
  if (!await lockOwnedByPid(path, process.pid, stats.ino)) {
    throw new Error("stack_manager_lock_invalid");
  }
  return async () => {
    if (await lockOwnedByPid(path, process.pid, stats.ino)) {
      await rm(path, { force: true }).catch(() => {});
    }
  };
}

async function inspectTrackedEntry(entry, options = {}) {
  const service = serviceById(entry.id);
  const inspectProcess = options.processInspectImpl || defaultProcessInspect;
  let observed;
  try {
    observed = await inspectProcess(entry.pid);
  } catch {
    observed = { running: false };
  }
  const running = observed?.running === true;
  const commandValidated = running && commandMatches(service, observed.commandLine);
  const startValidated = running && observed.processStartedAt === entry.processStartedAt;
  const processGroupValidated = running && observed.processGroupId === entry.pid;
  return {
    id: entry.id,
    pid: entry.pid,
    port: entry.port,
    running,
    commandValidated,
    startValidated,
    processGroupValidated,
    ownedProcessValidated: commandValidated && startValidated && processGroupValidated,
  };
}

async function inspectTrackedState(state, options = {}) {
  return Promise.all(state.services.map((entry) => inspectTrackedEntry(entry, options)));
}

async function waitForOwnedProcess(service, pid, options = {}) {
  const timeoutMs = Number(options.startTimeoutMs || PROCESS_START_TIMEOUT_MS);
  const deadline = currentMs(options) + timeoutMs;
  const inspectProcess = options.processInspectImpl || defaultProcessInspect;
  do {
    let observed;
    try {
      observed = await inspectProcess(pid);
    } catch {
      observed = null;
    }
    if (observed?.running === true
        && commandMatches(service, observed.commandLine)
        && validProcessStartedAt(observed.processStartedAt)
        && observed.processGroupId === pid) {
      return observed.processStartedAt;
    }
    if (currentMs(options) >= deadline) break;
    await sleep(POLL_INTERVAL_MS, options);
  } while (currentMs(options) <= deadline);
  return null;
}

async function waitForServiceIdentity(service, options = {}) {
  const timeoutMs = Number(options.startTimeoutMs || PROCESS_START_TIMEOUT_MS);
  const deadline = currentMs(options) + timeoutMs;
  const probe = options.serviceProbeImpl || probeServiceIdentity;
  do {
    let result;
    try {
      result = await probe(service.health, {
        fetchImpl: options.fetchImpl,
        timeoutMs: options.probeTimeoutMs,
      });
    } catch {
      result = null;
    }
    if (result?.identityVerified === true) return true;
    if (currentMs(options) >= deadline) break;
    await sleep(POLL_INTERVAL_MS, options);
  } while (currentMs(options) <= deadline);
  return false;
}

async function waitForServiceOwnership(service, entry, options = {}) {
  const timeoutMs = Number(options.startTimeoutMs || PROCESS_START_TIMEOUT_MS);
  const deadline = currentMs(options) + timeoutMs;
  const inspectProcess = options.processInspectImpl || defaultProcessInspect;
  const probeOwnership = options.portOwnershipProbeImpl || defaultPortOwnershipProbe;
  do {
    let observed;
    let listenerOwned = false;
    try {
      observed = await inspectProcess(entry.pid);
      listenerOwned = await probeOwnership(service, entry.pid) === true;
    } catch {
      observed = null;
      listenerOwned = false;
    }
    if (observed?.running === true
        && commandMatches(service, observed.commandLine)
        && observed.processStartedAt === entry.processStartedAt
        && observed.processGroupId === entry.pid
        && listenerOwned) {
      return true;
    }
    if (currentMs(options) >= deadline) break;
    await sleep(POLL_INTERVAL_MS, options);
  } while (currentMs(options) <= deadline);
  return false;
}

async function processGroupIsAlive(pid, options = {}) {
  const processGroupAlive = options.processGroupAliveImpl || defaultProcessGroupAlive;
  try {
    return await processGroupAlive(pid) === true;
  } catch {
    return true;
  }
}

async function waitForExit(pid, options = {}) {
  if (typeof options.waitForExitImpl === "function") {
    return options.waitForExitImpl(pid);
  }
  const timeoutMs = Number(options.stopTimeoutMs || PROCESS_STOP_TIMEOUT_MS);
  const deadline = currentMs(options) + timeoutMs;
  const inspectProcess = options.processInspectImpl || defaultProcessInspect;
  do {
    const observed = await inspectProcess(pid).catch(() => ({ running: false }));
    const groupAlive = await processGroupIsAlive(pid, options);
    if (observed?.running !== true && !groupAlive) return true;
    if (currentMs(options) >= deadline) break;
    await sleep(POLL_INTERVAL_MS, options);
  } while (currentMs(options) <= deadline);
  return false;
}

async function heldDurableGate(env, options = {}) {
  const readGate = options.readTelegramSendGateImpl || readTelegramSendGate;
  let evidence;
  try {
    evidence = await readGate({
      env,
      fetchImpl: options.fetchImpl,
      baseUrl: "http://127.0.0.1:8711",
      timeoutMs: options.probeTimeoutMs,
      maxAgeMs: options.gateMaxAgeMs,
      now: options.now,
    });
  } catch {
    evidence = null;
  }
  return evidence?.reportedState === "hold"
    && evidence?.effectiveState === "hold"
    && evidence?.authoritative === true
    && evidence?.fresh === true
    && evidence?.persistenceBackend === "postgres"
    && evidence?.durable === true
    && evidence?.durabilityVerified === true
    && evidence?.testOnly !== true;
}

function safeReportBase(command, options = {}) {
  return {
    command,
    version: TELEGRAM_STACK_VERSION,
    providerCalls: false,
    telegramSends: false,
    managerDirectGateMutations: false,
    managerDirectExternalWrites: false,
    generatedAt: currentDate(options).toISOString(),
  };
}

function startChildEffects(_children) {
  return {
    childMigrationWritesPossible: false,
    childGateInitializationPossible: false,
  };
}

export async function preflightTelegramStackStart(options = {}) {
  const env = options.env || process.env;
  const runtimeDir = options.runtimeDir || DEFAULT_TELEGRAM_STACK_RUNTIME_DIR;
  const environment = stackEnvironment(env);
  const commandProbe = options.commandProbeImpl || defaultCommandProbe;
  const portProbe = options.portProbeImpl || defaultPortProbe;
  const blockers = [...environmentBlockers(environment)];

  const commands = {};
  for (const command of ["cargo", "node", "lsof", "ps", "shlock"]) {
    let available = false;
    try {
      available = await commandProbe(command) === true;
    } catch {
      available = false;
    }
    commands[command] = available;
    if (!available) blockers.push(`command_${command}_unavailable`);
  }

  const ports = {};
  for (const service of TELEGRAM_STACK_SERVICES) {
    let available = false;
    try {
      available = await portProbe(service) === true;
    } catch {
      available = false;
    }
    ports[service.id] = { port: service.port, available };
    if (!available) blockers.push(`port_${service.port}_occupied_or_unavailable`);
  }

  const runtimeDirectorySecure = await runtimeDirectoryReadSafe(runtimeDir);
  const loaded = runtimeDirectorySecure
    ? await loadState(runtimeDir)
    : { kind: "insecure", state: null };
  let staleTrackedState = false;
  if (loaded.kind === "insecure") {
    blockers.push("runtime_directory_insecure");
  } else if (loaded.kind === "invalid") {
    blockers.push("runtime_state_invalid");
  } else if (loaded.kind === "valid") {
    const tracked = await inspectTrackedState(loaded.state, options);
    const anyRunning = tracked.some((entry) => entry.running);
    const anyUnvalidated = tracked.some((entry) => entry.running && !entry.ownedProcessValidated);
    if (anyUnvalidated) blockers.push("runtime_state_contains_unvalidated_live_pid");
    else if (anyRunning) blockers.push("telegram_stack_already_tracked");
    else staleTrackedState = true;
  }

  const uniqueBlockers = [...new Set(blockers)];
  const ready = uniqueBlockers.length === 0;
  return {
    ...safeReportBase("telegram-stack-preflight", options),
    verdict: ready ? "READY" : "HOLD",
    ready,
    readOnly: true,
    gateMutations: false,
    externalWrites: false,
    environment,
    commands,
    ports,
    runtimeDirectorySecure,
    trackedState: loaded.kind,
    staleTrackedState,
    blockers: uniqueBlockers,
    guardrail:
      "Start admission checks env presence, commands, exact free ports, and owned state only. It never reads .env, sends Telegram, or mutates a gate.",
  };
}

async function signalOwnedEntry(entry, options = {}) {
  const signalProcess = options.signalProcessGroupImpl || defaultSignalProcessGroup;
  try {
    await signalProcess(entry.pid, "SIGTERM");
  } catch (error) {
    if (error?.code !== "ESRCH") return false;
  }
  return waitForExit(entry.pid, options);
}

async function cleanupDirectChildren(children, options = {}) {
  const unresolvedSpawnPids = [];
  for (const child of [...children].reverse()) {
    const service = serviceById(child.id);
    const inspectProcess = options.processInspectImpl || defaultProcessInspect;
    let observed;
    try {
      observed = await inspectProcess(child.pid);
    } catch {
      observed = null;
    }
    if (observed?.running !== true) {
      if (await processGroupIsAlive(child.pid, options)) {
        unresolvedSpawnPids.push(child.pid);
      }
      continue;
    }
    const commandValidated = commandMatches(service, observed.commandLine);
    const startValidated = validProcessStartedAt(child.processStartedAt)
      && observed.processStartedAt === child.processStartedAt;
    const processGroupValidated = observed.processGroupId === child.pid;
    if (!commandValidated || !startValidated || !processGroupValidated) {
      unresolvedSpawnPids.push(child.pid);
      continue;
    }
    const stopped = await signalOwnedEntry(child, options);
    if (!stopped) unresolvedSpawnPids.push(child.pid);
  }
  return {
    complete: unresolvedSpawnPids.length === 0,
    unresolvedSpawnPids,
  };
}

export async function startTelegramStack(options = {}) {
  const env = options.env || process.env;
  const runtimeDir = options.runtimeDir || DEFAULT_TELEGRAM_STACK_RUNTIME_DIR;
  let releaseLock;
  try {
    releaseLock = await acquireManagerLock(runtimeDir, options);
  } catch {
    return {
      ...safeReportBase("telegram-stack-start", options),
      ...startChildEffects([]),
      verdict: "HOLD",
      started: false,
      localProcessesStarted: false,
      blockers: ["stack_manager_lock_unavailable"],
    };
  }

  const directChildren = [];
  let state = null;
  try {
    const admission = await preflightTelegramStackStart({ ...options, env, runtimeDir });
    if (!admission.ready) {
      return {
        ...safeReportBase("telegram-stack-start", options),
        ...startChildEffects(directChildren),
        verdict: "HOLD",
        started: false,
        localProcessesStarted: false,
        admission,
        blockers: admission.blockers,
      };
    }
    if (admission.staleTrackedState) await removeState(runtimeDir);

    state = {
      version: 1,
      owner: TELEGRAM_STACK_OWNER,
      runId: typeof options.runIdImpl === "function" ? options.runIdImpl() : randomUUID(),
      createdAt: currentDate(options).toISOString(),
      services: [],
    };
    const spawnService = options.spawnServiceImpl || defaultSpawnService;

    for (const service of TELEGRAM_STACK_SERVICES) {
      let spawned;
      try {
        spawned = await spawnService(service, { ...env, ...service.env });
      } catch {
        throw new Error(`start_${service.id}_failed`);
      }
      if (!Number.isInteger(spawned?.pid) || spawned.pid <= 1) {
        throw new Error(`start_${service.id}_failed`);
      }
      const directChild = { id: service.id, pid: spawned.pid, processStartedAt: null };
      directChildren.push(directChild);
      const processStartedAt = await waitForOwnedProcess(service, spawned.pid, options);
      if (!processStartedAt) throw new Error(`start_${service.id}_process_not_verified`);
      directChild.processStartedAt = processStartedAt;
      const entry = {
        id: service.id,
        pid: spawned.pid,
        port: service.port,
        commandSignature: service.commandSignature,
        processStartedAt,
      };
      state.services.push(entry);
      await writeState(runtimeDir, state);
      const identityReady = await waitForServiceIdentity(service, options);
      if (!identityReady) throw new Error(`start_${service.id}_identity_not_ready`);
      const listenerOwned = await waitForServiceOwnership(service, entry, options);
      if (!listenerOwned) throw new Error(`start_${service.id}_listener_not_owned`);

      if (service.id === "rustControl") {
        const safeHeld = await heldDurableGate(env, options);
        if (!safeHeld) throw new Error("start_control_gate_not_durable_held");
      }
    }

    return {
      ...safeReportBase("telegram-stack-start", options),
      ...startChildEffects(directChildren),
      verdict: "RUNNING",
      started: true,
      localProcessesStarted: true,
      services: state.services.map(({ id, pid, port }) => ({ id, pid, port })),
      blockers: [],
      guardrail:
        "The manager made no direct send or gate mutation. The Rust child may run embedded Postgres migrations, including held-gate initialization.",
    };
  } catch (error) {
    const cleanup = await cleanupDirectChildren(directChildren, options);
    if (cleanup.complete) await removeState(runtimeDir).catch(() => {});
    const code = typeof error?.message === "string" && /^start_[a-zA-Z0-9_]+$/.test(error.message)
      ? error.message
      : "stack_start_failed";
    return {
      ...safeReportBase("telegram-stack-start", options),
      ...startChildEffects(directChildren),
      verdict: "HOLD",
      started: false,
      localProcessesStarted: cleanup.unresolvedSpawnPids.length > 0,
      cleanupComplete: cleanup.complete,
      unresolvedSpawnPids: cleanup.unresolvedSpawnPids,
      blockers: cleanup.complete ? [code] : [code, "partial_cleanup_incomplete"],
    };
  } finally {
    await releaseLock();
  }
}

export async function getTelegramStackStatus(options = {}) {
  const runtimeDir = options.runtimeDir || DEFAULT_TELEGRAM_STACK_RUNTIME_DIR;
  if (!await runtimeDirectoryReadSafe(runtimeDir)) {
    return {
      ...safeReportBase("telegram-stack-status", options),
      readOnly: true,
      gateMutations: false,
      externalWrites: false,
      verdict: "HOLD",
      running: false,
      trackedState: "insecure",
      services: [],
      blockers: ["runtime_directory_insecure"],
    };
  }
  const loaded = await loadState(runtimeDir);
  if (loaded.kind === "missing") {
    return {
      ...safeReportBase("telegram-stack-status", options),
      readOnly: true,
      gateMutations: false,
      externalWrites: false,
      verdict: "NOT_STARTED",
      running: false,
      trackedState: "missing",
      services: [],
      blockers: [],
    };
  }
  if (loaded.kind === "invalid") {
    return {
      ...safeReportBase("telegram-stack-status", options),
      readOnly: true,
      gateMutations: false,
      externalWrites: false,
      verdict: "HOLD",
      running: false,
      trackedState: "invalid",
      services: [],
      blockers: ["runtime_state_invalid"],
    };
  }

  const inspected = await inspectTrackedState(loaded.state, options);
  const probe = options.serviceProbeImpl || probeServiceIdentity;
  const probeOwnership = options.portOwnershipProbeImpl || defaultPortOwnershipProbe;
  const services = [];
  const blockers = [];
  for (const entry of inspected) {
    const definition = serviceById(entry.id);
    let identityVerified = false;
    let listenerOwned = false;
    let processRevalidated = false;
    if (entry.ownedProcessValidated) {
      try {
        const result = await probe(definition.health, {
          fetchImpl: options.fetchImpl,
          timeoutMs: options.probeTimeoutMs,
        });
        identityVerified = result?.identityVerified === true;
      } catch {
        identityVerified = false;
      }
      try {
        listenerOwned = await probeOwnership(definition, entry.pid) === true;
      } catch {
        listenerOwned = false;
      }
      const original = loaded.state.services.find((item) => item.id === entry.id);
      const revalidated = await inspectTrackedEntry(original, options);
      processRevalidated = revalidated.ownedProcessValidated;
    }
    const ownedProcessValidated = entry.ownedProcessValidated && processRevalidated;
    services.push({
      id: entry.id,
      pid: entry.pid,
      port: entry.port,
      running: entry.running,
      ownedProcessValidated,
      identityVerified,
      listenerOwned,
    });
    if (!entry.running) blockers.push(`tracked_${entry.id}_not_running`);
    else if (!ownedProcessValidated) blockers.push(`tracked_${entry.id}_ownership_invalid`);
    else if (!identityVerified) blockers.push(`tracked_${entry.id}_identity_invalid`);
    else if (!listenerOwned) blockers.push(`tracked_${entry.id}_listener_ownership_invalid`);
  }
  if (services.length !== TELEGRAM_STACK_SERVICES.length) {
    blockers.push("tracked_stack_incomplete");
  }
  const uniqueBlockers = [...new Set(blockers)];
  const running = uniqueBlockers.length === 0;
  return {
    ...safeReportBase("telegram-stack-status", options),
    readOnly: true,
    gateMutations: false,
    externalWrites: false,
    verdict: running ? "RUNNING" : "HOLD",
    running,
    trackedState: "valid",
    services,
    blockers: uniqueBlockers,
  };
}

export async function stopTelegramStack(options = {}) {
  const runtimeDir = options.runtimeDir || DEFAULT_TELEGRAM_STACK_RUNTIME_DIR;
  let releaseLock;
  try {
    releaseLock = await acquireManagerLock(runtimeDir, options);
  } catch {
    return {
      ...safeReportBase("telegram-stack-stop", options),
      verdict: "HOLD",
      stopped: false,
      blockers: ["stack_manager_lock_unavailable"],
    };
  }

  try {
    const loaded = await loadState(runtimeDir);
    if (loaded.kind === "missing") {
      return {
        ...safeReportBase("telegram-stack-stop", options),
        verdict: "STOPPED",
        stopped: true,
        signaledPids: [],
        blockers: [],
      };
    }
    if (loaded.kind === "invalid") {
      return {
        ...safeReportBase("telegram-stack-stop", options),
        verdict: "HOLD",
        stopped: false,
        signaledPids: [],
        blockers: ["runtime_state_invalid"],
      };
    }

    const blockers = [];
    const signaledPids = [];
    for (const original of [...loaded.state.services].reverse()) {
      const entry = await inspectTrackedEntry(original, options);
      if (!entry.running) {
        if (await processGroupIsAlive(entry.pid, options)) {
          blockers.push(`tracked_${entry.id}_process_group_survives`);
        }
        continue;
      }
      if (!entry.ownedProcessValidated) {
        blockers.push(`tracked_${entry.id}_ownership_invalid`);
        continue;
      }
      const stopped = await signalOwnedEntry(entry, options);
      signaledPids.push(entry.pid);
      if (!stopped) blockers.push(`tracked_${entry.id}_did_not_stop`);
    }

    if (blockers.length === 0) await removeState(runtimeDir);
    return {
      ...safeReportBase("telegram-stack-stop", options),
      verdict: blockers.length === 0 ? "STOPPED" : "HOLD",
      stopped: blockers.length === 0,
      signaledPids,
      blockers,
      guardrail:
        "SIGTERM was sent only to tracked process groups whose PID, command signature, and start fingerprint matched state.",
    };
  } finally {
    await releaseLock();
  }
}

function unsupportedCommandReport(options = {}) {
  return {
    ...safeReportBase("telegram-stack", options),
    verdict: "HOLD",
    blockers: ["supported_command_required"],
    supportedCommands: ["preflight", "start", "status", "stop"],
  };
}

export async function runTelegramStackManagerCli(args = process.argv.slice(2), options = {}) {
  const command = args.length === 1 ? args[0] : null;
  let report;
  if (command === "preflight") report = await preflightTelegramStackStart(options);
  else if (command === "start") report = await startTelegramStack(options);
  else if (command === "status") report = await getTelegramStackStatus(options);
  else if (command === "stop") report = await stopTelegramStack(options);
  else report = unsupportedCommandReport(options);

  const write = options.writeImpl || ((value) => console.log(value));
  write(JSON.stringify(report, null, 2));
  const success = ["READY", "RUNNING", "STOPPED", "NOT_STARTED"].includes(report.verdict);
  return { exitCode: success ? 0 : 2, report };
}
