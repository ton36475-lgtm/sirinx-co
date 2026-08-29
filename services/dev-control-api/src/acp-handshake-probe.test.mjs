import { EventEmitter } from "node:events";
import { PassThrough, Writable } from "node:stream";

import { describe, expect, it, vi } from "vitest";

import {
  ACP_HANDSHAKE_AGENT_IDS,
  ACP_HANDSHAKE_PROFILES,
  ACP_PROBE_REPO_ROOT,
  ACP_PROTOCOL_VERSION,
  createAcpInitializeRequest,
  probeAcpInitialize
} from "./acp-handshake-probe.mjs";

class FakeChild extends EventEmitter {
  constructor({ onStdin, closeOnSigterm = true, closeOnSigkill = true } = {}) {
    super();
    this.stdout = new PassThrough();
    this.stderr = new PassThrough();
    this.stdinWrites = [];
    this.killSignals = [];
    this.exitCode = null;
    this.signalCode = null;
    this.closed = false;
    this.closeOnSigterm = closeOnSigterm;
    this.closeOnSigkill = closeOnSigkill;
    this.stdin = new Writable({
      write: (chunk, _encoding, callback) => {
        const text = chunk.toString();
        this.stdinWrites.push(text);
        onStdin?.(text, this);
        callback();
      }
    });
  }

  close(code = 0, signal = null) {
    if (this.closed) return;
    this.closed = true;
    this.exitCode = code;
    this.signalCode = signal;
    this.emit("close", code, signal);
  }

  kill(signal) {
    this.killSignals.push(signal);
    const shouldClose =
      (signal === "SIGTERM" && this.closeOnSigterm) ||
      (signal === "SIGKILL" && this.closeOnSigkill);
    if (shouldClose) {
      this.signalCode = signal;
      queueMicrotask(() => this.close(null, signal));
    }
    return true;
  }
}

function initializeResponse(overrides = {}) {
  return {
    jsonrpc: "2.0",
    id: 0,
    result: {
      protocolVersion: ACP_PROTOCOL_VERSION,
      ...overrides
    }
  };
}

function respondingChild(response, options = {}) {
  const { stderrText, ...childOptions } = options;
  return new FakeChild({
    ...childOptions,
    onStdin: (_text, child) => {
      queueMicrotask(() => {
        if (stderrText) child.stderr.write(stderrText);
        child.stdout.write(`${JSON.stringify(response)}\n`);
      });
    }
  });
}

describe("ACP handshake profiles", () => {
  it("uses a fixed four-agent allowlist with bounded safety flags", () => {
    expect(ACP_HANDSHAKE_AGENT_IDS).toEqual(["kimi", "opencode", "hermes-check", "copilot"]);
    expect(ACP_HANDSHAKE_PROFILES.opencode.args).toEqual([
      "acp",
      "--pure",
      "--hostname",
      "127.0.0.1",
      "--port",
      "0",
      "--cwd",
      ACP_PROBE_REPO_ROOT
    ]);
    expect(ACP_HANDSHAKE_PROFILES["hermes-check"].args).toEqual(["acp", "--check"]);
    expect(ACP_HANDSHAKE_PROFILES.copilot.args).toEqual(
      expect.arrayContaining([
        "--acp",
        "--no-remote",
        "--no-remote-export",
        "--disable-builtin-mcps",
        "--no-auto-update"
      ])
    );
  });

  it("blocks unknown and prototype-property agent ids without spawning", async () => {
    const spawnImpl = vi.fn();

    const unknown = await probeAcpInitialize("claude", { spawnImpl });
    const prototypeProperty = await probeAcpInitialize("toString", { spawnImpl });

    expect(unknown).toMatchObject({ status: "blocked-acp-probe", reason: "agent_not_allowlisted" });
    expect(prototypeProperty).toMatchObject({
      status: "blocked-acp-probe",
      reason: "agent_not_allowlisted"
    });
    expect(spawnImpl).not.toHaveBeenCalled();
  });
});

describe("ACP initialize-only probe", () => {
  it("spawns without a shell and sends only a capability-disabled initialize request", async () => {
    const child = respondingChild(initializeResponse());
    const spawnImpl = vi.fn(() => child);

    const result = await probeAcpInitialize("kimi", {
      spawnImpl,
      isolatedHome: "/tmp/sirinx-acp-probe-test-home",
      parentEnv: {
        PATH: "/safe/bin",
        HOME: "/secret/home",
        TELEGRAM_BOT_TOKEN: "must-not-propagate"
      }
    });

    expect(result).toMatchObject({
      status: "acp-initialize-verified",
      handshakeVerified: true,
      initializeSent: true,
      sessionCreated: false,
      promptSent: false,
      modelRequestSent: false,
      providerCallAuthorized: false,
      externalWrites: false
    });
    expect(spawnImpl).toHaveBeenCalledOnce();
    const [command, args, spawnOptions] = spawnImpl.mock.calls[0];
    expect(command).toBe("kimi");
    expect(args).toEqual(["--skills-dir", "/tmp/sirinx-acp-probe-test-home", "acp"]);
    expect(spawnOptions).toMatchObject({
      cwd: ACP_PROBE_REPO_ROOT,
      shell: false,
      detached: false,
      stdio: ["pipe", "pipe", "pipe"]
    });
    expect(spawnOptions.env).toMatchObject({
      PATH: "/safe/bin",
      HOME: "/tmp/sirinx-acp-probe-test-home",
      XDG_CONFIG_HOME: "/tmp/sirinx-acp-probe-test-home"
    });
    expect(spawnOptions.env).not.toHaveProperty("TELEGRAM_BOT_TOKEN");

    expect(child.stdinWrites).toHaveLength(1);
    const request = JSON.parse(child.stdinWrites[0]);
    expect(request).toEqual(createAcpInitializeRequest());
    expect(request).toMatchObject({
      jsonrpc: "2.0",
      id: 0,
      method: "initialize",
      params: {
        protocolVersion: 1,
        clientCapabilities: {
          fs: { readTextFile: false, writeTextFile: false },
          terminal: false
        }
      }
    });
    expect(JSON.stringify(request)).not.toMatch(/session\/|prompt|model|provider/i);
    expect(child.killSignals).toEqual(["SIGTERM"]);
  });

  it("rejects an arbitrary isolated-home override and falls back to the non-secret empty home", async () => {
    const child = respondingChild(initializeResponse());
    const spawnImpl = vi.fn(() => child);

    await probeAcpInitialize("kimi", {
      spawnImpl,
      isolatedHome: "/Users/sirinx"
    });

    const [, args, spawnOptions] = spawnImpl.mock.calls[0];
    expect(args).toEqual(["--skills-dir", "/var/empty", "acp"]);
    expect(spawnOptions.env.HOME).toBe("/var/empty");
  });

  it("returns only known capability booleans and redacts agent, auth, stdout, and stderr text", async () => {
    const secret = "raw-secret-must-never-escape";
    const child = respondingChild(
      initializeResponse({
        agentCapabilities: {
          loadSession: true,
          promptCapabilities: { image: true, audio: false, embeddedContext: true },
          mcpCapabilities: { http: true, sse: false },
          sessionCapabilities: { list: {}, delete: {}, privateCapability: secret },
          auth: { logout: {} },
          _meta: { secret }
        },
        authMethods: [{ id: secret, name: secret }],
        agentInfo: { name: secret, title: secret, version: secret }
      }),
      { stderrText: secret }
    );

    const result = await probeAcpInitialize("opencode", { spawnImpl: () => child });
    const rendered = JSON.stringify(result);

    expect(result).toMatchObject({
      status: "acp-initialize-verified",
      protocolVersion: 1,
      agentCapabilities: {
        advertised: true,
        loadSession: true,
        prompt: { image: true, audio: false, embeddedContext: true },
        mcp: { http: true, sse: false },
        session: { list: true, delete: true },
        auth: { logout: true }
      },
      authentication: { methodsAdvertised: true, methodCount: 1 },
      agentInfo: {
        advertised: true,
        namePresent: true,
        titlePresent: true,
        versionPresent: true
      },
      diagnostics: { stderrObserved: true }
    });
    expect(rendered).not.toContain(secret);
    expect(result).not.toHaveProperty("stdout");
    expect(result).not.toHaveProperty("stderr");
  });

  it("decodes a response safely when a UTF-8 code point is split across stdout chunks", async () => {
    const responseBytes = Buffer.from(
      `${JSON.stringify(initializeResponse({ agentInfo: { name: "ภาษาไทย" } }))}\n`
    );
    const thaiCharacterOffset = responseBytes.indexOf(Buffer.from("ภ"));
    const child = new FakeChild({
      onStdin: (_text, instance) => {
        queueMicrotask(() => {
          instance.stdout.write(responseBytes.subarray(0, thaiCharacterOffset + 1));
          instance.stdout.write(responseBytes.subarray(thaiCharacterOffset + 1));
        });
      }
    });

    const result = await probeAcpInitialize("kimi", { spawnImpl: () => child });

    expect(result).toMatchObject({
      status: "acp-initialize-verified",
      handshakeVerified: true,
      agentInfo: { advertised: true, namePresent: true }
    });
    expect(JSON.stringify(result)).not.toContain("ภาษาไทย");
  });

  it("redacts JSON-RPC error messages and data", async () => {
    const secret = "provider-token-in-error";
    const child = respondingChild({
      jsonrpc: "2.0",
      id: 0,
      error: { code: -32000, message: secret, data: { secret } }
    });

    const result = await probeAcpInitialize("copilot", { spawnImpl: () => child });

    expect(result).toMatchObject({
      status: "acp-initialize-failed",
      reason: "initialize_rejected",
      rpcErrorCode: -32000,
      handshakeVerified: false
    });
    expect(JSON.stringify(result)).not.toContain(secret);
  });

  it("rejects an unsupported negotiated protocol version", async () => {
    const child = respondingChild(initializeResponse({ protocolVersion: 2 }));

    const result = await probeAcpInitialize("kimi", { spawnImpl: () => child });

    expect(result).toMatchObject({
      status: "acp-initialize-failed",
      reason: "unsupported_protocol_version",
      protocolVersion: 2,
      handshakeVerified: false
    });
  });

  it("fails closed on non-JSON stdout and terminates the child", async () => {
    const child = new FakeChild({
      onStdin: (_text, instance) => queueMicrotask(() => instance.stdout.write("banner text\n"))
    });

    const result = await probeAcpInitialize("kimi", { spawnImpl: () => child });

    expect(result).toMatchObject({
      status: "acp-initialize-failed",
      reason: "invalid_stdout_json",
      handshakeVerified: false
    });
    expect(child.killSignals).toEqual(["SIGTERM"]);
  });

  it("bounds stdout and never returns the captured payload", async () => {
    const payload = "sensitive-output".repeat(32);
    const child = new FakeChild({
      onStdin: (_text, instance) => queueMicrotask(() => instance.stdout.write(payload))
    });

    const result = await probeAcpInitialize("kimi", {
      spawnImpl: () => child,
      outputLimitBytes: 256
    });

    expect(result).toMatchObject({
      status: "acp-initialize-failed",
      reason: "stdout_limit_exceeded",
      handshakeVerified: false
    });
    expect(JSON.stringify(result)).not.toContain(payload);
  });

  it("times out, requests SIGTERM, and escalates to SIGKILL when necessary", async () => {
    const child = new FakeChild({ closeOnSigterm: false, closeOnSigkill: true });

    const result = await probeAcpInitialize("kimi", {
      spawnImpl: () => child,
      timeoutMs: 10,
      killGraceMs: 5
    });

    expect(result).toMatchObject({
      status: "acp-initialize-failed",
      reason: "timeout",
      handshakeVerified: false,
      process: {
        terminationRequested: true,
        forcedTermination: true,
        exited: true
      }
    });
    expect(child.killSignals).toEqual(["SIGTERM", "SIGKILL"]);
  });
});

describe("Hermes ACP preflight", () => {
  it("runs check-only without an initialize frame and never marks a handshake verified", async () => {
    const child = new FakeChild();
    const spawnImpl = vi.fn(() => {
      queueMicrotask(() => child.close(0));
      return child;
    });

    const result = await probeAcpInitialize("hermes-check", { spawnImpl });

    expect(spawnImpl).toHaveBeenCalledWith(
      "hermes",
      ["acp", "--check"],
      expect.objectContaining({ shell: false })
    );
    expect(child.stdinWrites).toEqual([]);
    expect(result).toMatchObject({
      status: "acp-preflight-passed",
      reason: null,
      preflightPassed: true,
      initializeOnly: false,
      initializeSent: false,
      handshakeVerified: false,
      sessionCreated: false,
      promptSent: false,
      providerCallAuthorized: false
    });
  });
});
