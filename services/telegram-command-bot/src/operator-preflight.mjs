import { readTelegramSendGate } from "./control-gate.mjs";

export const OPERATOR_PREFLIGHT_VERSION = "1.0";
export const OPERATOR_PREFLIGHT_TIMEOUT_MS = 1_500;
export const OPERATOR_PREFLIGHT_MAX_RESPONSE_BYTES = 32 * 1024;

const CONTROL_BASE_URL = "http://127.0.0.1:8711";

export const OPERATOR_PREFLIGHT_SERVICES = Object.freeze([
  Object.freeze({
    id: "rustControl",
    port: 8711,
    healthUrl: `${CONTROL_BASE_URL}/health`,
    expectedService: "sirinx-control",
    required: true,
    matches(body) {
      return body?.status === "ok" && body?.service === "sirinx-control";
    },
  }),
  Object.freeze({
    id: "nodeLongTail",
    port: 8790,
    healthUrl: "http://127.0.0.1:8790/health",
    expectedService: "sirinx-dev-control-api",
    required: true,
    matches(body) {
      return body?.status === "ok" && body?.service === "sirinx-dev-control-api";
    },
  }),
  Object.freeze({
    id: "telegramGateway",
    port: 8791,
    healthUrl: "http://127.0.0.1:8791/health",
    expectedService: "telegram-command-bot",
    required: true,
    matches(body) {
      return body?.status === "ok" && body?.service === "telegram-command-bot";
    },
  }),
  Object.freeze({
    id: "hermesA2a",
    port: 9000,
    healthUrl: "http://127.0.0.1:9000/health",
    expectedService: "a2a-server",
    required: false,
    matches(body) {
      return body?.ok === true && body?.service === "a2a-server";
    },
  }),
]);

const SAFE_PROBE_REASONS = new Set([
  "fetch_unavailable",
  "http_error",
  "identity_mismatch",
  "invalid_json",
  "request_failed",
  "response_too_large",
  "timeout",
]);

const SAFE_GATE_REASONS = new Set([
  "control_api_token_missing",
  "control_fetch_unavailable",
  "control_gate_list_invalid",
  "control_http_400",
  "control_http_401",
  "control_http_403",
  "control_http_404",
  "control_http_500",
  "control_http_502",
  "control_http_503",
  "control_persistence_invalid",
  "control_persistence_not_durable",
  "control_persistence_stale",
  "control_request_failed",
  "control_request_timeout",
  "control_response_invalid_json",
  "control_url_not_loopback",
  "gate_evidence_from_future",
  "gate_evidence_stale",
  "gate_held",
  "gate_state_invalid",
  "gate_ticket_invalid",
  "telegram_gate_duplicate",
  "telegram_gate_missing",
]);

function currentDate(options = {}) {
  const value = typeof options.now === "function" ? options.now() : options.now || new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function configured(value) {
  return String(value || "").trim().length > 0;
}

function ownerIdsConfigured(value) {
  return String(value || "")
    .split(",")
    .some((item) => item.trim().length > 0);
}

export function inspectOperatorEnvironment(env = process.env) {
  const controlUrl = String(env.SIRINX_CONTROL_URL || "").trim();
  const readiness = {
    telegramBotTokenConfigured: configured(env.TELEGRAM_BOT_TOKEN),
    telegramChatIdConfigured: configured(env.TELEGRAM_CHAT_ID),
    telegramOwnerIdsConfigured: ownerIdsConfigured(env.TELEGRAM_OWNER_IDS),
    confirmSendConfigured: env.SIRINX_TELEGRAM_CONFIRM === "SEND",
    controlApiTokenConfigured: configured(env.CONTROL_API_TOKEN),
    databaseUrlConfigured: configured(env.DATABASE_URL),
    controlUrlConfigured: configured(controlUrl),
    controlUrlIsExactLoopbackAuthority: controlUrl === CONTROL_BASE_URL,
  };

  return {
    ...readiness,
    ready: Object.values(readiness).every(Boolean),
  };
}

function responseSignal(timeoutMs) {
  return typeof AbortSignal?.timeout === "function"
    ? AbortSignal.timeout(timeoutMs)
    : undefined;
}

export async function probeServiceIdentity(service, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const timeoutMs = Number(options.timeoutMs || OPERATOR_PREFLIGHT_TIMEOUT_MS);
  const maxResponseBytes = Number(
    options.maxResponseBytes || OPERATOR_PREFLIGHT_MAX_RESPONSE_BYTES,
  );

  if (typeof fetchImpl !== "function") {
    return {
      reachable: false,
      httpOk: false,
      identityVerified: false,
      httpStatus: null,
      reason: "fetch_unavailable",
    };
  }

  try {
    const response = await fetchImpl(service.healthUrl, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: options.signal || responseSignal(timeoutMs),
    });
    const httpStatus = Number.isInteger(response.status) ? response.status : null;
    if (!response.ok) {
      return {
        reachable: true,
        httpOk: false,
        identityVerified: false,
        httpStatus,
        reason: "http_error",
      };
    }

    let raw;
    try {
      raw = await response.text();
    } catch {
      return {
        reachable: true,
        httpOk: true,
        identityVerified: false,
        httpStatus,
        reason: "invalid_json",
      };
    }
    if (Buffer.byteLength(raw) > maxResponseBytes) {
      return {
        reachable: true,
        httpOk: true,
        identityVerified: false,
        httpStatus,
        reason: "response_too_large",
      };
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return {
        reachable: true,
        httpOk: true,
        identityVerified: false,
        httpStatus,
        reason: "invalid_json",
      };
    }

    const identityVerified = service.matches(body) === true;
    return {
      reachable: true,
      httpOk: true,
      identityVerified,
      httpStatus,
      reason: identityVerified ? null : "identity_mismatch",
      reportedEnvReady: service.id === "telegramGateway" && body.envReady === true,
      reportedLiveSendReady: service.id === "telegramGateway" && body.liveSendReady === true,
    };
  } catch (error) {
    const timeout = error?.name === "AbortError" || error?.name === "TimeoutError";
    return {
      reachable: false,
      httpOk: false,
      identityVerified: false,
      httpStatus: null,
      reason: timeout ? "timeout" : "request_failed",
    };
  }
}

function normalizeProbeResult(result) {
  const reason = SAFE_PROBE_REASONS.has(result?.reason) ? result.reason : "request_failed";
  return {
    reachable: result?.reachable === true,
    httpOk: result?.httpOk === true,
    identityVerified: result?.identityVerified === true,
    httpStatus: Number.isInteger(result?.httpStatus) ? result.httpStatus : null,
    reportedEnvReady: result?.reportedEnvReady === true,
    reportedLiveSendReady: result?.reportedLiveSendReady === true,
    reason: result?.identityVerified === true ? null : reason,
  };
}

function serviceView(service, result, required) {
  return {
    port: service.port,
    expectedService: service.expectedService,
    required,
    reachable: result.reachable,
    httpOk: result.httpOk,
    identityVerified: result.identityVerified,
    httpStatus: result.httpStatus,
    reportedEnvReady: service.id === "telegramGateway" ? result.reportedEnvReady : undefined,
    reportedLiveSendReady:
      service.id === "telegramGateway" ? result.reportedLiveSendReady : undefined,
    reason: result.reason,
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
  return blockers;
}

function serviceBlockers(service, result, required) {
  if (!required) return [];
  if (!result.reachable) return [`service_${service.id}_unreachable`];
  if (!result.httpOk) return [`service_${service.id}_http_error`];
  if (!result.identityVerified) return [`service_${service.id}_identity_mismatch`];
  return [];
}

function safeGateReason(reason) {
  if (typeof reason !== "string") return null;
  if (SAFE_GATE_REASONS.has(reason)) return reason;
  if (/^control_http_[45]\d\d$/.test(reason)) return reason;
  return "control_gate_evidence_invalid";
}

function gateView(evidence) {
  const state = evidence?.reportedState === "hold" || evidence?.reportedState === "open"
    ? evidence.reportedState
    : "unknown";
  return {
    state,
    authoritative: evidence?.authoritative === true,
    fresh: evidence?.fresh === true,
    postgresBacked: evidence?.persistenceBackend === "postgres",
    durable: evidence?.durable === true,
    durabilityVerified: evidence?.durabilityVerified === true,
    testOnly: evidence?.testOnly === true,
    heldForReview: state === "hold"
      && evidence?.effectiveState === "hold"
      && evidence?.authoritative === true
      && evidence?.fresh === true
      && evidence?.persistenceBackend === "postgres"
      && evidence?.durable === true
      && evidence?.durabilityVerified === true
      && evidence?.testOnly !== true,
    reason: safeGateReason(evidence?.reason),
  };
}

function gateBlockers(gate, tokenConfigured) {
  if (!tokenConfigured) return ["control_gate_not_checked_without_token"];
  const blockers = [];
  if (gate.testOnly) blockers.push("control_gate_test_evidence_rejected");
  if (!gate.authoritative) blockers.push("control_gate_not_authoritative");
  if (!gate.fresh) blockers.push("control_gate_evidence_not_fresh");
  if (!gate.postgresBacked || !gate.durable || !gate.durabilityVerified) {
    blockers.push("control_gate_not_durable_postgres");
  }
  if (gate.state !== "hold") blockers.push("telegram_gate_not_held");
  return blockers;
}

export async function collectTelegramOperatorPreflight(options = {}) {
  const env = options.env || process.env;
  const environment = inspectOperatorEnvironment(env);
  const includeHermes = options.includeHermes === true;
  const probe = options.probeImpl || probeServiceIdentity;
  const selectedServices = OPERATOR_PREFLIGHT_SERVICES.filter(
    (service) => service.required || includeHermes,
  );

  const observed = await Promise.all(selectedServices.map(async (service) => {
    let result;
    try {
      result = await probe(service, {
        fetchImpl: options.fetchImpl,
        timeoutMs: options.timeoutMs,
        maxResponseBytes: options.maxResponseBytes,
      });
    } catch {
      result = { reason: "request_failed" };
    }
    return [service, normalizeProbeResult(result)];
  }));

  const services = {};
  const blockers = [...environmentBlockers(environment)];
  for (const [service, result] of observed) {
    const required = service.required || includeHermes;
    services[service.id] = serviceView(service, result, required);
    blockers.push(...serviceBlockers(service, result, required));
  }

  let evidence = null;
  if (environment.controlApiTokenConfigured) {
    const readGate = options.readTelegramSendGateImpl || readTelegramSendGate;
    try {
      evidence = await readGate({
        env,
        fetchImpl: options.fetchImpl,
        baseUrl: CONTROL_BASE_URL,
        timeoutMs: options.timeoutMs,
        maxAgeMs: options.gateMaxAgeMs,
        now: options.now,
      });
    } catch {
      evidence = null;
    }
  }
  const gate = gateView(evidence);
  blockers.push(...gateBlockers(gate, environment.controlApiTokenConfigured));

  const telegram = services.telegramGateway;
  if (telegram?.identityVerified && !telegram.reportedEnvReady) {
    blockers.push("telegram_gateway_reports_env_not_ready");
  }
  if (telegram?.reportedLiveSendReady) {
    blockers.push("telegram_gateway_reports_live_while_preflight_requires_hold");
  }

  const uniqueBlockers = [...new Set(blockers)];
  const ready = uniqueBlockers.length === 0;
  return {
    command: "telegram-operator-preflight",
    version: OPERATOR_PREFLIGHT_VERSION,
    verdict: ready ? "READY" : "HOLD",
    ready,
    readOnly: true,
    providerCalls: false,
    mutations: false,
    generatedAt: currentDate(options).toISOString(),
    environment,
    services,
    gate,
    blockers: uniqueBlockers,
    guardrail:
      "Preflight performs GET-only loopback checks. It never reads .env files, starts or stops services, changes gates, or calls Telegram.",
  };
}

export async function runTelegramOperatorPreflightCli(args = process.argv.slice(2), options = {}) {
  const flags = new Set(args);
  const supported = new Set(["--include-hermes"]);
  const invalid = args.some((arg) => !supported.has(arg));
  const report = invalid
    ? {
        command: "telegram-operator-preflight",
        version: OPERATOR_PREFLIGHT_VERSION,
        verdict: "HOLD",
        ready: false,
        readOnly: true,
        providerCalls: false,
        mutations: false,
        generatedAt: currentDate(options).toISOString(),
        environment: inspectOperatorEnvironment(options.env || process.env),
        services: {},
        gate: gateView(null),
        blockers: ["unsupported_cli_argument"],
        guardrail:
          "Preflight performs GET-only loopback checks. It never reads .env files, starts or stops services, changes gates, or calls Telegram.",
      }
    : await collectTelegramOperatorPreflight({
        ...options,
        includeHermes: flags.has("--include-hermes"),
      });

  const write = options.writeImpl || ((value) => console.log(value));
  write(JSON.stringify(report, null, 2));
  return { exitCode: report.ready ? 0 : 2, report };
}
