import { chmod, mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TELEGRAM_STACK_OWNER,
  TELEGRAM_STACK_SERVICES,
  getTelegramStackStatus,
  preflightTelegramStackStart,
  runTelegramStackManagerCli,
  startTelegramStack,
  stopTelegramStack,
} from "./stack-manager.mjs";

const NOW = () => new Date("2026-07-20T06:00:00.000Z");
const RUN_ID = "00000000-0000-4000-8000-000000000001";
const FULL_ENV = Object.freeze({
  TELEGRAM_BOT_TOKEN: "test-bot-token-never-print",
  TELEGRAM_CHAT_ID: "-10000000001",
  TELEGRAM_OWNER_IDS: "1001,1002",
  SIRINX_TELEGRAM_CONFIRM: "SEND",
  CONTROL_API_TOKEN: "test-control-token-never-print",
  DATABASE_URL: "postgresql://test-never-print",
  SIRINX_CONTROL_URL: "http://127.0.0.1:8711",
  SAFE_INHERITED_VALUE: "inherited-by-test-child",
});
const HELD_DURABLE_GATE = Object.freeze({
  authority: "sirinx-control",
  testOnly: false,
  effectiveState: "hold",
  reportedState: "hold",
  open: false,
  authoritative: true,
  fresh: true,
  persistenceBackend: "postgres",
  durable: true,
  durabilityVerified: true,
  reason: "gate_held",
});
const PID_BY_SERVICE = Object.freeze({
  rustControl: 41_101,
  nodeLongTail: 41_102,
  telegramGateway: 41_103,
});

const temporaryRoots = [];

async function runtimeFixture() {
  const root = await mkdtemp(join(tmpdir(), "sirinx-telegram-stack-test-"));
  temporaryRoots.push(root);
  return {
    root,
    runtimeDir: join(root, ".runtime", "telegram-stack"),
    statePath: join(root, ".runtime", "telegram-stack", "state.json"),
  };
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, {
    recursive: true,
    force: true,
  })));
});

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function acquireTestManagerLock(path, pid) {
  try {
    await writeFile(path, `${pid}\n`, { mode: 0o600, flag: "wx" });
    return true;
  } catch (error) {
    if (error?.code === "EEXIST") return false;
    throw error;
  }
}

function createInjectedPrimitives(overrides = {}) {
  const processTable = new Map();
  const processGroupTable = new Map();
  const spawned = [];
  const signaled = [];
  const commandProbeImpl = overrides.commandProbeImpl || vi.fn().mockResolvedValue(true);
  const portProbeImpl = overrides.portProbeImpl || vi.fn().mockResolvedValue(true);
  const serviceProbeImpl = overrides.serviceProbeImpl || vi.fn().mockResolvedValue({
    reachable: true,
    httpOk: true,
    identityVerified: true,
    httpStatus: 200,
    reason: null,
  });
  const portOwnershipProbeImpl = overrides.portOwnershipProbeImpl
    || vi.fn().mockResolvedValue(true);
  const readTelegramSendGateImpl = overrides.readTelegramSendGateImpl
    || vi.fn().mockResolvedValue(HELD_DURABLE_GATE);
  const managerLockAcquireImpl = overrides.managerLockAcquireImpl
    || vi.fn(acquireTestManagerLock);
  const spawnServiceImpl = overrides.spawnServiceImpl || vi.fn(async (service, childEnv) => {
    const pid = PID_BY_SERVICE[service.id];
    const processStartedAt = `test-start-${service.id}`;
    processTable.set(pid, {
      running: true,
      commandLine: `${service.command} ${service.args.join(" ")}`,
      processStartedAt,
      processGroupId: pid,
    });
    processGroupTable.set(pid, true);
    spawned.push({ id: service.id, pid, childEnv: { ...childEnv } });
    return { pid };
  });
  const processInspectImpl = overrides.processInspectImpl || vi.fn(async (pid) => (
    processTable.get(pid) || { running: false }
  ));
  const signalProcessGroupImpl = overrides.signalProcessGroupImpl || vi.fn(async (pid) => {
    signaled.push(pid);
    const process = processTable.get(pid);
    if (process) process.running = false;
    processGroupTable.set(pid, false);
  });
  const waitForExitImpl = overrides.waitForExitImpl || vi.fn(async (pid) => (
    processGroupTable.get(pid) !== true
  ));
  const processGroupAliveImpl = overrides.processGroupAliveImpl || vi.fn(async (pid) => (
    processGroupTable.get(pid) === true
  ));

  return {
    processTable,
    processGroupTable,
    spawned,
    signaled,
    options: {
      env: FULL_ENV,
      now: NOW,
      runIdImpl: () => RUN_ID,
      commandProbeImpl,
      portProbeImpl,
      spawnServiceImpl,
      processInspectImpl,
      signalProcessGroupImpl,
      waitForExitImpl,
      processGroupAliveImpl,
      serviceProbeImpl,
      portOwnershipProbeImpl,
      readTelegramSendGateImpl,
      managerLockAcquireImpl,
      sleepImpl: vi.fn().mockResolvedValue(undefined),
      ...overrides.options,
    },
  };
}

function serializedContainsEnvironmentValue(value) {
  const serialized = JSON.stringify(value);
  return Object.values(FULL_ENV).some((envValue) => serialized.includes(envValue));
}

describe("preflightTelegramStackStart", () => {
  it("reports boolean-only env readiness and exact free-port admission without writing", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();

    const report = await preflightTelegramStackStart({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "READY",
      ready: true,
      readOnly: true,
      providerCalls: false,
      gateMutations: false,
      externalWrites: false,
      trackedState: "missing",
      blockers: [],
      commands: { cargo: true, node: true, lsof: true, ps: true, shlock: true },
      ports: {
        rustControl: { port: 8711, available: true },
        nodeLongTail: { port: 8790, available: true },
        telegramGateway: { port: 8791, available: true },
      },
    });
    expect(Object.values(report.environment).every((value) => typeof value === "boolean"))
      .toBe(true);
    expect(serializedContainsEnvironmentValue(report)).toBe(false);
    expect(harness.options.commandProbeImpl).toHaveBeenCalledTimes(5);
    expect(harness.options.portProbeImpl).toHaveBeenCalledTimes(3);
    expect(harness.options.spawnServiceImpl).not.toHaveBeenCalled();
    expect(harness.options.signalProcessGroupImpl).not.toHaveBeenCalled();
    expect(await pathExists(join(fixture.root, ".runtime"))).toBe(false);
  });

  it("fails closed with stable command, environment, and occupied-port blockers", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives({
      commandProbeImpl: vi.fn(async (command) => command !== "cargo"),
      portProbeImpl: vi.fn(async (service) => service.port !== 8711),
    });

    const report = await preflightTelegramStackStart({
      ...harness.options,
      env: {
        ...FULL_ENV,
        TELEGRAM_BOT_TOKEN: "",
        DEV_CONTROL_API_PORT: "8711",
      },
      runtimeDir: fixture.runtimeDir,
    });

    expect(report.verdict).toBe("HOLD");
    expect(report.blockers).toEqual(expect.arrayContaining([
      "env_telegram_bot_token_missing",
      "env_node_port_not_exact",
      "command_cargo_unavailable",
      "port_8711_occupied_or_unavailable",
    ]));
    expect(harness.options.spawnServiceImpl).not.toHaveBeenCalled();
  });

  it("does not trust state through an insecure read-only runtime path", async () => {
    const fixture = await runtimeFixture();
    const runtimeParent = join(fixture.root, ".runtime");
    await mkdir(runtimeParent, { mode: 0o700 });
    await chmod(runtimeParent, 0o777);
    const harness = createInjectedPrimitives();

    const preflight = await preflightTelegramStackStart({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });
    const status = await getTelegramStackStatus({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(preflight).toMatchObject({
      verdict: "HOLD",
      ready: false,
      runtimeDirectorySecure: false,
      trackedState: "insecure",
      blockers: ["runtime_directory_insecure"],
    });
    expect(status).toMatchObject({
      verdict: "HOLD",
      running: false,
      trackedState: "insecure",
      blockers: ["runtime_directory_insecure"],
    });
    expect(harness.options.spawnServiceImpl).not.toHaveBeenCalled();
    expect(harness.options.signalProcessGroupImpl).not.toHaveBeenCalled();
    expect(await pathExists(fixture.runtimeDir)).toBe(false);
  });
});

describe("startTelegramStack", () => {
  it("refuses an occupied required port before spawning anything", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives({
      portProbeImpl: vi.fn(async (service) => service.port !== 8711),
    });

    const report = await startTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      started: false,
      localProcessesStarted: false,
      blockers: ["port_8711_occupied_or_unavailable"],
    });
    expect(harness.options.spawnServiceImpl).not.toHaveBeenCalled();
    expect(harness.options.signalProcessGroupImpl).not.toHaveBeenCalled();
  });

  it("cleans up when health responds but the listener is outside the child process group", async () => {
    const fixture = await runtimeFixture();
    let clock = 0;
    const harness = createInjectedPrimitives({
      portOwnershipProbeImpl: vi.fn().mockResolvedValue(false),
      options: {
        startTimeoutMs: 1,
        nowMsImpl: () => {
          clock += 10;
          return clock;
        },
      },
    });

    const report = await startTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      started: false,
      localProcessesStarted: false,
      cleanupComplete: true,
      blockers: ["start_rustControl_listener_not_owned"],
      childMigrationWritesPossible: false,
    });
    expect(harness.signaled).toEqual([PID_BY_SERVICE.rustControl]);
    expect(harness.options.readTelegramSendGateImpl).not.toHaveBeenCalled();
    expect(await pathExists(fixture.statePath)).toBe(false);
  });

  it("starts the exact topology with inherited env, forced ports, and secret-free state", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();

    const report = await startTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "RUNNING",
      started: true,
      localProcessesStarted: true,
      providerCalls: false,
      managerDirectGateMutations: false,
      managerDirectExternalWrites: false,
      childMigrationWritesPossible: false,
      childGateInitializationPossible: false,
      blockers: [],
    });
    expect(report).not.toHaveProperty("externalWrites");
    expect(harness.spawned.map(({ id }) => id)).toEqual([
      "rustControl",
      "nodeLongTail",
      "telegramGateway",
    ]);
    expect(harness.spawned[0].childEnv).toMatchObject({
      SAFE_INHERITED_VALUE: FULL_ENV.SAFE_INHERITED_VALUE,
      CONTROL_PORT: "8711",
    });
    expect(harness.spawned[1].childEnv).toMatchObject({
      SAFE_INHERITED_VALUE: FULL_ENV.SAFE_INHERITED_VALUE,
      DEV_CONTROL_API_HOST: "127.0.0.1",
      DEV_CONTROL_API_PORT: "8790",
    });
    expect(harness.spawned[2].childEnv).toMatchObject({
      SAFE_INHERITED_VALUE: FULL_ENV.SAFE_INHERITED_VALUE,
      TELEGRAM_BOT_HOST: "127.0.0.1",
      TELEGRAM_BOT_PORT: "8791",
    });
    expect(harness.options.readTelegramSendGateImpl).toHaveBeenCalledTimes(1);
    expect(harness.options.serviceProbeImpl).toHaveBeenCalledTimes(3);

    const rawState = await readFile(fixture.statePath, "utf8");
    const state = JSON.parse(rawState);
    expect(state).toMatchObject({
      version: 1,
      owner: TELEGRAM_STACK_OWNER,
      runId: RUN_ID,
      services: [
        { id: "rustControl", pid: 41_101, port: 8711 },
        { id: "nodeLongTail", pid: 41_102, port: 8790 },
        { id: "telegramGateway", pid: 41_103, port: 8791 },
      ],
    });
    expect(serializedContainsEnvironmentValue(state)).toBe(false);

    const status = await getTelegramStackStatus({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });
    expect(status).toMatchObject({
      verdict: "RUNNING",
      running: true,
      trackedState: "valid",
      blockers: [],
    });
    expect(status.services).toHaveLength(TELEGRAM_STACK_SERVICES.length);
    expect(status.services.every((service) => (
      service.ownedProcessValidated && service.identityVerified && service.listenerOwned
    ))).toBe(true);
  });

  it("cleans up only its direct child when a later spawn fails", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();
    const successfulSpawn = harness.options.spawnServiceImpl;
    harness.options.spawnServiceImpl = vi.fn(async (service, childEnv) => {
      if (service.id === "nodeLongTail") throw new Error("private spawn detail");
      return successfulSpawn(service, childEnv);
    });

    const report = await startTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      started: false,
      localProcessesStarted: false,
      cleanupComplete: true,
      blockers: ["start_nodeLongTail_failed"],
    });
    expect(harness.signaled).toEqual([PID_BY_SERVICE.rustControl]);
    expect(await pathExists(fixture.statePath)).toBe(false);
    expect(JSON.stringify(report)).not.toContain("private spawn detail");
  });

  it("does not signal a direct-child PID if ownership changes before cleanup", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();
    const successfulSpawn = harness.options.spawnServiceImpl;
    harness.options.spawnServiceImpl = vi.fn(async (service, childEnv) => {
      if (service.id === "nodeLongTail") {
        harness.processTable.set(PID_BY_SERVICE.rustControl, {
          running: true,
          commandLine: "unrelated-wrapper cargo run -p sirinx-control",
          processStartedAt: "test-start-rustControl",
          processGroupId: PID_BY_SERVICE.rustControl,
        });
        throw new Error("spawn failed after PID reuse");
      }
      return successfulSpawn(service, childEnv);
    });

    const report = await startTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      started: false,
      localProcessesStarted: true,
      cleanupComplete: false,
      unresolvedSpawnPids: [PID_BY_SERVICE.rustControl],
      blockers: ["start_nodeLongTail_failed", "partial_cleanup_incomplete"],
    });
    expect(harness.signaled).toEqual([]);
    expect(await pathExists(fixture.statePath)).toBe(true);
  });

  it("does not signal a child that failed before a start fingerprint was captured", async () => {
    const fixture = await runtimeFixture();
    let clock = 0;
    let inspections = 0;
    const harness = createInjectedPrimitives({
      processInspectImpl: vi.fn(async (pid) => {
        inspections += 1;
        return {
          running: true,
          commandLine: "cargo run -p sirinx-control",
          processStartedAt: inspections === 1 ? "" : "untrusted-later-start",
          processGroupId: pid,
        };
      }),
      options: {
        startTimeoutMs: 1,
        nowMsImpl: () => {
          clock += 10;
          return clock;
        },
      },
    });

    const report = await startTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      started: false,
      localProcessesStarted: true,
      cleanupComplete: false,
      unresolvedSpawnPids: [PID_BY_SERVICE.rustControl],
      blockers: [
        "start_rustControl_process_not_verified",
        "partial_cleanup_incomplete",
      ],
    });
    expect(harness.signaled).toEqual([]);
    expect(await pathExists(fixture.statePath)).toBe(false);
  });

  it("stops after Rust and cleans up when the durable gate is not held", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives({
      readTelegramSendGateImpl: vi.fn().mockResolvedValue({
        ...HELD_DURABLE_GATE,
        reportedState: "open",
        effectiveState: "open",
        open: true,
        reason: null,
      }),
    });

    const report = await startTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      started: false,
      localProcessesStarted: false,
      cleanupComplete: true,
      blockers: ["start_control_gate_not_durable_held"],
    });
    expect(harness.spawned.map(({ id }) => id)).toEqual(["rustControl"]);
    expect(harness.signaled).toEqual([PID_BY_SERVICE.rustControl]);
    expect(await pathExists(fixture.statePath)).toBe(false);
  });
});

describe("status and stop ownership boundaries", () => {
  it("stops validated tracked children in reverse order and removes its state", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();
    await startTelegramStack({ ...harness.options, runtimeDir: fixture.runtimeDir });

    const report = await stopTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "STOPPED",
      stopped: true,
      blockers: [],
      signaledPids: [41_103, 41_102, 41_101],
    });
    expect(harness.signaled).toEqual([41_103, 41_102, 41_101]);
    expect(await pathExists(fixture.statePath)).toBe(false);

    const status = await getTelegramStackStatus({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });
    expect(status).toMatchObject({ verdict: "NOT_STARTED", running: false });
  });

  it("never signals a tracked PID whose command ownership no longer matches", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();
    await startTelegramStack({ ...harness.options, runtimeDir: fixture.runtimeDir });
    harness.processTable.set(PID_BY_SERVICE.nodeLongTail, {
      running: true,
      commandLine: "unrelated-wrapper node services/dev-control-api/server.mjs",
      processStartedAt: "test-start-nodeLongTail",
      processGroupId: PID_BY_SERVICE.nodeLongTail,
    });

    const report = await stopTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      stopped: false,
      blockers: ["tracked_nodeLongTail_ownership_invalid"],
      signaledPids: [41_103, 41_101],
    });
    expect(harness.signaled).toEqual([41_103, 41_101]);
    expect(harness.signaled).not.toContain(PID_BY_SERVICE.nodeLongTail);
    expect(await pathExists(fixture.statePath)).toBe(true);
  });

  it("reports HOLD when a healthy listener is not owned by the tracked process group", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();
    await startTelegramStack({ ...harness.options, runtimeDir: fixture.runtimeDir });
    harness.options.portOwnershipProbeImpl = vi.fn(async (service) => (
      service.id !== "nodeLongTail"
    ));

    const report = await getTelegramStackStatus({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      running: false,
      blockers: ["tracked_nodeLongTail_listener_ownership_invalid"],
    });
    expect(report.services.find(({ id }) => id === "nodeLongTail")).toMatchObject({
      identityVerified: true,
      listenerOwned: false,
      ownedProcessValidated: true,
    });
  });

  it("never signals a reused PID whose process-start fingerprint changed", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();
    await startTelegramStack({ ...harness.options, runtimeDir: fixture.runtimeDir });
    harness.processTable.set(PID_BY_SERVICE.rustControl, {
      running: true,
      commandLine: "cargo run -p sirinx-control",
      processStartedAt: "different-process-incarnation",
      processGroupId: PID_BY_SERVICE.rustControl,
    });

    const report = await stopTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      stopped: false,
      blockers: ["tracked_rustControl_ownership_invalid"],
      signaledPids: [41_103, 41_102],
    });
    expect(harness.signaled).toEqual([41_103, 41_102]);
    expect(harness.signaled).not.toContain(PID_BY_SERVICE.rustControl);
    expect(await pathExists(fixture.statePath)).toBe(true);
  });

  it("revalidates each later PID after stopping the previous process group", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();
    await startTelegramStack({ ...harness.options, runtimeDir: fixture.runtimeDir });
    const signalOwnedGroup = harness.options.signalProcessGroupImpl;
    harness.options.signalProcessGroupImpl = vi.fn(async (pid, signal) => {
      if (pid === PID_BY_SERVICE.telegramGateway) {
        harness.processTable.set(PID_BY_SERVICE.nodeLongTail, {
          running: true,
          commandLine: "unrelated-wrapper node services/dev-control-api/server.mjs",
          processStartedAt: "test-start-nodeLongTail",
          processGroupId: PID_BY_SERVICE.nodeLongTail,
        });
      }
      return signalOwnedGroup(pid, signal);
    });

    const report = await stopTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      stopped: false,
      blockers: ["tracked_nodeLongTail_ownership_invalid"],
      signaledPids: [41_103, 41_101],
    });
    expect(harness.signaled).toEqual([41_103, 41_101]);
    expect(harness.signaled).not.toContain(PID_BY_SERVICE.nodeLongTail);
    expect(await pathExists(fixture.statePath)).toBe(true);
  });

  it("fails closed on corrupt state without signaling any PID", async () => {
    const fixture = await runtimeFixture();
    await mkdir(fixture.runtimeDir, { recursive: true });
    await writeFile(fixture.statePath, JSON.stringify({
      owner: TELEGRAM_STACK_OWNER,
      services: [{ id: "rustControl", pid: 2, port: 8711 }],
    }), "utf8");
    const signalProcessGroupImpl = vi.fn();

    const report = await stopTelegramStack({
      runtimeDir: fixture.runtimeDir,
      now: NOW,
      managerLockAcquireImpl: vi.fn(acquireTestManagerLock),
      signalProcessGroupImpl,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      stopped: false,
      signaledPids: [],
      blockers: ["runtime_state_invalid"],
    });
    expect(signalProcessGroupImpl).not.toHaveBeenCalled();
  });

  it("keeps state when a process-group descendant survives SIGTERM", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();
    await startTelegramStack({ ...harness.options, runtimeDir: fixture.runtimeDir });
    harness.options.waitForExitImpl = vi.fn(async (pid) => (
      pid !== PID_BY_SERVICE.rustControl
    ));

    const report = await stopTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      stopped: false,
      signaledPids: [41_103, 41_102, 41_101],
      blockers: ["tracked_rustControl_did_not_stop"],
    });
    expect(await pathExists(fixture.statePath)).toBe(true);
  });

  it("retains state and never signals when a dead leader has a surviving group", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();
    await startTelegramStack({ ...harness.options, runtimeDir: fixture.runtimeDir });
    harness.processTable.get(PID_BY_SERVICE.rustControl).running = false;
    harness.processGroupTable.set(PID_BY_SERVICE.rustControl, true);

    const report = await stopTelegramStack({
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      stopped: false,
      signaledPids: [41_103, 41_102],
      blockers: ["tracked_rustControl_process_group_survives"],
    });
    expect(harness.signaled).toEqual([41_103, 41_102]);
    expect(harness.signaled).not.toContain(PID_BY_SERVICE.rustControl);
    expect(await pathExists(fixture.statePath)).toBe(true);
  });

  it("reclaims a validated stale manager lock before a safe no-op stop", async () => {
    const fixture = await runtimeFixture();
    await mkdir(fixture.runtimeDir, { recursive: true, mode: 0o700 });
    const managerLockPath = join(fixture.runtimeDir, "manager.lock");
    await writeFile(managerLockPath, "91919\n", { mode: 0o600 });
    const managerLockAcquireImpl = vi.fn(async (path, pid) => {
      await rm(path, { force: true });
      return acquireTestManagerLock(path, pid);
    });

    const report = await stopTelegramStack({
      runtimeDir: fixture.runtimeDir,
      now: NOW,
      managerLockAcquireImpl,
    });

    expect(report).toMatchObject({
      verdict: "STOPPED",
      stopped: true,
      signaledPids: [],
      blockers: [],
    });
    expect(managerLockAcquireImpl).toHaveBeenCalledTimes(1);
    expect(await pathExists(managerLockPath)).toBe(false);
  });

  it("fails closed when a manager lock has a validated live owner", async () => {
    const fixture = await runtimeFixture();
    await mkdir(fixture.runtimeDir, { recursive: true, mode: 0o700 });
    const managerLockPath = join(fixture.runtimeDir, "manager.lock");
    await writeFile(managerLockPath, "91920\n", { mode: 0o600 });
    const managerLockAcquireImpl = vi.fn().mockResolvedValue(false);
    const signalProcessGroupImpl = vi.fn();

    const report = await stopTelegramStack({
      runtimeDir: fixture.runtimeDir,
      now: NOW,
      managerLockAcquireImpl,
      signalProcessGroupImpl,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      stopped: false,
      blockers: ["stack_manager_lock_unavailable"],
    });
    expect(signalProcessGroupImpl).not.toHaveBeenCalled();
    expect(await pathExists(managerLockPath)).toBe(true);
  });

  it("refuses a group/world-writable runtime parent", async () => {
    const fixture = await runtimeFixture();
    const runtimeParent = join(fixture.root, ".runtime");
    await mkdir(runtimeParent, { mode: 0o700 });
    await chmod(runtimeParent, 0o777);
    const signalProcessGroupImpl = vi.fn();

    const report = await stopTelegramStack({
      runtimeDir: fixture.runtimeDir,
      now: NOW,
      signalProcessGroupImpl,
    });

    expect(report).toMatchObject({
      verdict: "HOLD",
      stopped: false,
      blockers: ["stack_manager_lock_unavailable"],
    });
    expect(signalProcessGroupImpl).not.toHaveBeenCalled();
    expect(await pathExists(fixture.runtimeDir)).toBe(false);
  });
});

describe("runTelegramStackManagerCli", () => {
  it("rejects unsupported commands without touching process or port primitives", async () => {
    const fixture = await runtimeFixture();
    const harness = createInjectedPrimitives();
    const writes = [];

    const result = await runTelegramStackManagerCli(["launch"], {
      ...harness.options,
      runtimeDir: fixture.runtimeDir,
      writeImpl: (value) => writes.push(value),
    });

    expect(result).toMatchObject({
      exitCode: 2,
      report: {
        verdict: "HOLD",
        blockers: ["supported_command_required"],
        supportedCommands: ["preflight", "start", "status", "stop"],
      },
    });
    expect(writes).toHaveLength(1);
    expect(harness.options.commandProbeImpl).not.toHaveBeenCalled();
    expect(harness.options.portProbeImpl).not.toHaveBeenCalled();
    expect(harness.options.spawnServiceImpl).not.toHaveBeenCalled();
    expect(harness.options.signalProcessGroupImpl).not.toHaveBeenCalled();
    expect(await pathExists(join(fixture.root, ".runtime"))).toBe(false);
  });
});
