import { spawn as spawnChild } from "node:child_process";
import { resolve } from "node:path";
import { StringDecoder } from "node:string_decoder";
import { fileURLToPath } from "node:url";

export const ACP_PROTOCOL_VERSION = 1;
export const ACP_PROBE_REPO_ROOT = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../../.."
);

const INITIALIZE_REQUEST_ID = 0;
const ISOLATED_HOME = "/var/empty";
const ISOLATED_TEMP_PREFIX = "/tmp/sirinx-acp-probe-";
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_KILL_GRACE_MS = 150;
const DEFAULT_OUTPUT_LIMIT_BYTES = 64 * 1024;
const CLIENT_INFO = Object.freeze({
  name: "sirinx-acp-initialize-probe",
  title: "SIRINX ACP Initialize Probe",
  version: "1.0.0"
});

function freezeProfile({ id, kind, command, args }) {
  return Object.freeze({ id, kind, command, args: Object.freeze([...args]) });
}

export const ACP_HANDSHAKE_PROFILES = Object.freeze({
  kimi: freezeProfile({
    id: "kimi",
    kind: "initialize",
    command: "kimi",
    args: ["--skills-dir", ISOLATED_HOME, "acp"]
  }),
  opencode: freezeProfile({
    id: "opencode",
    kind: "initialize",
    command: "opencode",
    args: [
      "acp",
      "--pure",
      "--hostname",
      "127.0.0.1",
      "--port",
      "0",
      "--cwd",
      ACP_PROBE_REPO_ROOT
    ]
  }),
  "hermes-check": freezeProfile({
    id: "hermes-check",
    kind: "preflight",
    command: "hermes",
    args: ["acp", "--check"]
  }),
  copilot: freezeProfile({
    id: "copilot",
    kind: "initialize",
    command: "copilot",
    args: [
      "--acp",
      "--no-remote",
      "--no-remote-export",
      "--disable-builtin-mcps",
      "--no-auto-update",
      "--no-custom-instructions",
      "-C",
      ACP_PROBE_REPO_ROOT
    ]
  })
});

export const ACP_HANDSHAKE_AGENT_IDS = Object.freeze(Object.keys(ACP_HANDSHAKE_PROFILES));

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function boundedInteger(value, fallback, minimum, maximum) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(value)));
}

function resolveIsolatedHome(value) {
  if (typeof value !== "string" || !value.trim()) return ISOLATED_HOME;
  const candidate = resolve(value.trim());
  return candidate.startsWith(ISOLATED_TEMP_PREFIX) ? candidate : ISOLATED_HOME;
}

function createIsolatedEnvironment(parentEnv = process.env, isolatedHome = ISOLATED_HOME) {
  return {
    PATH:
      typeof parentEnv?.PATH === "string" && parentEnv.PATH.length > 0
        ? parentEnv.PATH
        : "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
    HOME: isolatedHome,
    XDG_CONFIG_HOME: isolatedHome,
    XDG_DATA_HOME: isolatedHome,
    XDG_STATE_HOME: isolatedHome,
    XDG_CACHE_HOME: isolatedHome,
    NO_COLOR: "1",
    CI: "1",
    LANG: "C"
  };
}

export function createAcpInitializeRequest() {
  return {
    jsonrpc: "2.0",
    id: INITIALIZE_REQUEST_ID,
    method: "initialize",
    params: {
      protocolVersion: ACP_PROTOCOL_VERSION,
      clientCapabilities: {
        fs: {
          readTextFile: false,
          writeTextFile: false
        },
        terminal: false
      },
      clientInfo: { ...CLIENT_INFO }
    }
  };
}

function knownAgentCapabilityEvidence(value) {
  const capabilities = isRecord(value) ? value : {};
  const prompt = isRecord(capabilities.promptCapabilities)
    ? capabilities.promptCapabilities
    : {};
  const mcp = isRecord(capabilities.mcpCapabilities) ? capabilities.mcpCapabilities : {};
  const session = isRecord(capabilities.sessionCapabilities)
    ? capabilities.sessionCapabilities
    : {};
  const auth = isRecord(capabilities.auth) ? capabilities.auth : {};

  return {
    advertised: isRecord(value),
    loadSession: capabilities.loadSession === true,
    prompt: {
      image: prompt.image === true,
      audio: prompt.audio === true,
      embeddedContext: prompt.embeddedContext === true
    },
    mcp: {
      http: mcp.http === true,
      sse: mcp.sse === true
    },
    session: {
      list: isRecord(session.list),
      delete: isRecord(session.delete),
      resume: isRecord(session.resume),
      close: isRecord(session.close),
      additionalDirectories: isRecord(session.additionalDirectories)
    },
    auth: {
      logout: isRecord(auth.logout)
    }
  };
}

function implementationEvidence(value) {
  const info = isRecord(value) ? value : {};
  return {
    advertised: isRecord(value),
    namePresent: typeof info.name === "string" && info.name.length > 0,
    titlePresent: typeof info.title === "string" && info.title.length > 0,
    versionPresent: typeof info.version === "string" && info.version.length > 0
  };
}

function commonEvidence(profile, timeoutMs) {
  return {
    agentId: profile?.id ?? null,
    mode: profile?.kind === "preflight" ? "local-acp-preflight" : "local-acp-initialize-only",
    protocol: profile?.kind === "preflight" ? "acp-preflight" : "acp",
    transport: profile?.kind === "preflight" ? "process-exit" : "stdio",
    initializeOnly: profile?.kind === "initialize",
    initializeSent: false,
    sessionCreated: false,
    promptSent: false,
    modelRequestSent: false,
    providerCallAuthorized: false,
    externalWrites: false,
    commandProfile: profile?.id ?? null,
    timeoutMs
  };
}

function blockedEvidence(agentId, reason) {
  return {
    agentId: typeof agentId === "string" ? agentId : null,
    status: "blocked-acp-probe",
    reason,
    handshakeVerified: false,
    mode: "local-acp-initialize-only",
    protocol: "acp",
    transport: "stdio",
    initializeOnly: true,
    initializeSent: false,
    sessionCreated: false,
    promptSent: false,
    modelRequestSent: false,
    providerCallAuthorized: false,
    externalWrites: false,
    commandProfile: null,
    process: {
      spawnInvoked: false,
      terminationRequested: false,
      forcedTermination: false,
      exited: true
    }
  };
}

function hasExited(child) {
  return child?.exitCode !== null && child?.exitCode !== undefined
    ? true
    : child?.signalCode !== null && child?.signalCode !== undefined;
}

function waitForExit(child, timeoutMs) {
  if (hasExited(child)) return Promise.resolve(true);
  return new Promise((resolvePromise) => {
    let finished = false;
    const finish = (exited) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      child.removeListener?.("close", onClose);
      resolvePromise(exited);
    };
    const onClose = () => finish(true);
    const timer = setTimeout(() => finish(hasExited(child)), timeoutMs);
    child.once?.("close", onClose);
  });
}

async function terminateChild(child, killGraceMs) {
  try {
    child.stdin?.end?.();
  } catch {
    // Termination continues even when stdin has already closed.
  }

  if (hasExited(child)) {
    return { terminationRequested: false, forcedTermination: false, exited: true };
  }

  let terminationRequested = false;
  try {
    terminationRequested = child.kill?.("SIGTERM") !== false;
  } catch {
    terminationRequested = false;
  }
  if (await waitForExit(child, killGraceMs)) {
    return { terminationRequested, forcedTermination: false, exited: true };
  }

  let forcedTermination = false;
  try {
    forcedTermination = child.kill?.("SIGKILL") !== false;
  } catch {
    forcedTermination = false;
  }
  const exited = await waitForExit(child, killGraceMs);
  return { terminationRequested, forcedTermination, exited };
}

function analyzeInitializeResponse(message) {
  if (!isRecord(message) || message.jsonrpc !== "2.0" || message.id !== INITIALIZE_REQUEST_ID) {
    return {
      status: "acp-initialize-failed",
      reason: "unexpected_protocol_message",
      handshakeVerified: false
    };
  }

  if (isRecord(message.error)) {
    return {
      status: "acp-initialize-failed",
      reason: "initialize_rejected",
      handshakeVerified: false,
      rpcErrorCode: Number.isInteger(message.error.code) ? message.error.code : null
    };
  }

  if (!isRecord(message.result) || !Number.isInteger(message.result.protocolVersion)) {
    return {
      status: "acp-initialize-failed",
      reason: "invalid_initialize_response",
      handshakeVerified: false
    };
  }

  const protocolVersion = message.result.protocolVersion;
  if (protocolVersion !== ACP_PROTOCOL_VERSION) {
    return {
      status: "acp-initialize-failed",
      reason: "unsupported_protocol_version",
      handshakeVerified: false,
      protocolVersion
    };
  }

  return {
    status: "acp-initialize-verified",
    reason: null,
    handshakeVerified: true,
    protocolVersion,
    agentCapabilities: knownAgentCapabilityEvidence(message.result.agentCapabilities),
    authentication: {
      methodsAdvertised: Array.isArray(message.result.authMethods),
      methodCount: Array.isArray(message.result.authMethods)
        ? Math.min(message.result.authMethods.length, 1_000)
        : 0
    },
    agentInfo: implementationEvidence(message.result.agentInfo)
  };
}

function classifySpawnError(error) {
  return error?.code === "ENOENT" ? "executable_not_found" : "spawn_failed";
}

/**
 * Performs one bounded ACP initialize exchange for an allowlisted CLI.
 * It never sends authentication, session, prompt, model, tool, or provider requests.
 */
export async function probeAcpInitialize(agentId, options = {}) {
  const profile =
    typeof agentId === "string" && Object.hasOwn(ACP_HANDSHAKE_PROFILES, agentId)
      ? ACP_HANDSHAKE_PROFILES[agentId]
      : null;
  if (!profile) return blockedEvidence(agentId, "agent_not_allowlisted");

  const timeoutMs = boundedInteger(options.timeoutMs, DEFAULT_TIMEOUT_MS, 10, 10_000);
  const killGraceMs = boundedInteger(
    options.killGraceMs,
    DEFAULT_KILL_GRACE_MS,
    5,
    1_000
  );
  const outputLimitBytes = boundedInteger(
    options.outputLimitBytes,
    DEFAULT_OUTPUT_LIMIT_BYTES,
    256,
    256 * 1024
  );
  const spawnImpl = options.spawnImpl ?? spawnChild;
  const isolatedHome = resolveIsolatedHome(options.isolatedHome);
  const profileArgs = profile.args.map((argument) => (
    argument === ISOLATED_HOME ? isolatedHome : argument
  ));
  if (typeof spawnImpl !== "function") {
    return {
      ...commonEvidence(profile, timeoutMs),
      status: "blocked-acp-probe",
      reason: "invalid_spawn_adapter",
      handshakeVerified: false,
      process: {
        spawnInvoked: false,
        terminationRequested: false,
        forcedTermination: false,
        exited: true
      }
    };
  }

  let child;
  try {
    child = spawnImpl(profile.command, profileArgs, {
      cwd: ACP_PROBE_REPO_ROOT,
      shell: false,
      detached: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
      env: createIsolatedEnvironment(options.parentEnv, isolatedHome)
    });
  } catch (error) {
    return {
      ...commonEvidence(profile, timeoutMs),
      status:
        profile.kind === "preflight" ? "acp-preflight-failed" : "acp-initialize-failed",
      reason: classifySpawnError(error),
      handshakeVerified: false,
      process: {
        spawnInvoked: true,
        terminationRequested: false,
        forcedTermination: false,
        exited: true
      }
    };
  }

  if (!child || !child.stdout || !child.stderr || !child.stdin) {
    const termination = child
      ? await terminateChild(child, killGraceMs)
      : { terminationRequested: false, forcedTermination: false, exited: true };
    return {
      ...commonEvidence(profile, timeoutMs),
      status:
        profile.kind === "preflight" ? "acp-preflight-failed" : "acp-initialize-failed",
      reason: "invalid_spawn_contract",
      handshakeVerified: false,
      process: { spawnInvoked: true, ...termination }
    };
  }

  return new Promise((resolvePromise) => {
    let finalizing = false;
    let timer;
    let stdoutBuffer = "";
    const stdoutDecoder = new StringDecoder("utf8");
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let initializeSent = false;

    const cleanup = () => {
      clearTimeout(timer);
      child.stdout.removeListener?.("data", onStdout);
      child.stderr.removeListener?.("data", onStderr);
      child.removeListener?.("error", onError);
      child.removeListener?.("close", onClose);
    };

    const finalize = async (draft, shouldTerminate) => {
      if (finalizing) return;
      finalizing = true;
      clearTimeout(timer);
      const termination = shouldTerminate
        ? await terminateChild(child, killGraceMs)
        : { terminationRequested: false, forcedTermination: false, exited: true };
      cleanup();

      const safeDraft = { ...draft };
      if (safeDraft.handshakeVerified && !termination.exited) {
        safeDraft.status = "acp-initialize-failed";
        safeDraft.reason = "termination_unconfirmed";
        safeDraft.handshakeVerified = false;
      }

      resolvePromise({
        ...commonEvidence(profile, timeoutMs),
        ...safeDraft,
        initializeSent,
        diagnostics: {
          stdoutBytes: Math.min(stdoutBytes, outputLimitBytes + 1),
          stderrBytes: Math.min(stderrBytes, outputLimitBytes + 1),
          stderrObserved: stderrBytes > 0
        },
        process: {
          spawnInvoked: true,
          ...termination
        }
      });
    };

    const onStdout = (chunk) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      stdoutBytes += bytes.byteLength;
      if (stdoutBytes > outputLimitBytes) {
        void finalize(
          {
            status:
              profile.kind === "preflight" ? "acp-preflight-failed" : "acp-initialize-failed",
            reason: "stdout_limit_exceeded",
            handshakeVerified: false
          },
          true
        );
        return;
      }
      if (profile.kind === "preflight") return;

      stdoutBuffer += stdoutDecoder.write(bytes);
      while (!finalizing) {
        const newline = stdoutBuffer.indexOf("\n");
        if (newline < 0) break;
        let line = stdoutBuffer.slice(0, newline);
        stdoutBuffer = stdoutBuffer.slice(newline + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.length === 0) {
          void finalize(
            {
              status: "acp-initialize-failed",
              reason: "invalid_stdout_frame",
              handshakeVerified: false
            },
            true
          );
          break;
        }

        let message;
        try {
          message = JSON.parse(line);
        } catch {
          void finalize(
            {
              status: "acp-initialize-failed",
              reason: "invalid_stdout_json",
              handshakeVerified: false
            },
            true
          );
          break;
        }
        void finalize(analyzeInitializeResponse(message), true);
      }
    };

    const onStderr = (chunk) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      stderrBytes += bytes.byteLength;
      if (stderrBytes > outputLimitBytes) {
        void finalize(
          {
            status:
              profile.kind === "preflight" ? "acp-preflight-failed" : "acp-initialize-failed",
            reason: "stderr_limit_exceeded",
            handshakeVerified: false
          },
          true
        );
      }
    };

    const onError = (error) => {
      void finalize(
        {
          status:
            profile.kind === "preflight" ? "acp-preflight-failed" : "acp-initialize-failed",
          reason: classifySpawnError(error),
          handshakeVerified: false
        },
        true
      );
    };

    const onClose = (code, signal) => {
      if (profile.kind === "preflight") {
        void finalize(
          {
            status: code === 0 ? "acp-preflight-passed" : "acp-preflight-failed",
            reason: code === 0 ? null : signal ? "preflight_signaled" : "preflight_exit_nonzero",
            handshakeVerified: false,
            preflightPassed: code === 0
          },
          false
        );
        return;
      }

      if (!finalizing) stdoutBuffer += stdoutDecoder.end();

      void finalize(
        {
          status: "acp-initialize-failed",
          reason: stdoutBuffer.length > 0 ? "incomplete_stdout_frame" : "exited_before_initialize",
          handshakeVerified: false
        },
        false
      );
    };

    child.stdout.on("data", onStdout);
    child.stderr.on("data", onStderr);
    child.once("error", onError);
    child.once("close", onClose);

    timer = setTimeout(() => {
      void finalize(
        {
          status:
            profile.kind === "preflight" ? "acp-preflight-failed" : "acp-initialize-failed",
          reason: "timeout",
          handshakeVerified: false
        },
        true
      );
    }, timeoutMs);

    if (profile.kind === "preflight") {
      try {
        child.stdin.end();
      } catch {
        void finalize(
          {
            status: "acp-preflight-failed",
            reason: "stdin_close_failed",
            handshakeVerified: false
          },
          true
        );
      }
      return;
    }

    try {
      const request = `${JSON.stringify(createAcpInitializeRequest())}\n`;
      child.stdin.write(request);
      initializeSent = true;
    } catch {
      void finalize(
        {
          status: "acp-initialize-failed",
          reason: "stdin_write_failed",
          handshakeVerified: false
        },
        true
      );
    }
  });
}
