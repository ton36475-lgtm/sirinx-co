const DEFAULT_CONTROL_BASE_URL = "http://127.0.0.1:8711";
const TELEGRAM_GATE_NAME = "telegram_send";
const TELEGRAM_TICKET_PATTERN = /^OPS-TG-[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;

function nowMs(value) {
  const resolved = typeof value === "function" ? value() : value;
  if (resolved instanceof Date) return resolved.getTime();
  const numeric = Number(resolved ?? Date.now());
  return Number.isFinite(numeric) ? numeric : Date.now();
}

function heldEvidence(reason, extras = {}) {
  return {
    authority: "sirinx-control",
    testOnly: false,
    gateName: TELEGRAM_GATE_NAME,
    effectiveState: "hold",
    reportedState: null,
    open: false,
    authoritative: false,
    fresh: false,
    ticketPresent: false,
    ticketPrefixValid: false,
    persistenceBackend: null,
    durable: false,
    durabilityVerified: false,
    persistenceObservedAt: null,
    persistenceObservedAtMs: null,
    checkedAt: null,
    checkedAtMs: null,
    expiresAt: null,
    reason,
    ...extras
  };
}

function isLoopbackControlUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:"
      && ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function normalizeInjectedGate(gate, timestampMs, maxAgeMs) {
  if (!gate || typeof gate !== "object") return heldEvidence("injected_gate_invalid");
  const ticket = typeof gate.ticket === "string" ? gate.ticket.trim() : "";
  const reportedState = gate.state === "open" || gate.state === "hold" ? gate.state : null;
  const ticketPrefixValid = TELEGRAM_TICKET_PATTERN.test(ticket);
  const open = reportedState === "open" && ticketPrefixValid;
  const checkedAt = new Date(timestampMs).toISOString();

  return {
    authority: "test-injected",
    testOnly: true,
    gateName: TELEGRAM_GATE_NAME,
    effectiveState: open ? "open" : "hold",
    reportedState,
    open,
    authoritative: reportedState !== null,
    fresh: true,
    ticketPresent: Boolean(ticket),
    ticketPrefixValid,
    persistenceBackend: "test-injected",
    durable: false,
    durabilityVerified: false,
    persistenceObservedAt: null,
    persistenceObservedAtMs: null,
    checkedAt,
    checkedAtMs: timestampMs,
    expiresAt: new Date(timestampMs + maxAgeMs).toISOString(),
    reason: reportedState === null
      ? "gate_state_invalid"
      : reportedState === "open" && !ticketPrefixValid
        ? "gate_ticket_invalid"
        : reportedState === "hold"
          ? "gate_held"
          : null
  };
}

function inspectPersistenceEvidence(persistence, timestampMs, maxAgeMs) {
  if (!persistence || typeof persistence !== "object") {
    return {
      backend: null,
      durable: false,
      verified: false,
      observedAt: null,
      observedAtMs: null,
      reason: "control_persistence_invalid",
    };
  }

  const backend = persistence.backend === "memory" || persistence.backend === "postgres"
    ? persistence.backend
    : null;
  const durable = persistence.durable === true;
  const rawObservedAt = persistence.observedAt;
  const observedAtMs = typeof rawObservedAt === "number"
    ? rawObservedAt
    : typeof rawObservedAt === "string"
      ? Date.parse(rawObservedAt)
      : Number.NaN;
  const observedAtValid = Number.isSafeInteger(observedAtMs)
    && observedAtMs > 0
    && observedAtMs <= 8_640_000_000_000_000;
  const observedAtFresh = observedAtValid
    && Math.abs(timestampMs - observedAtMs) <= maxAgeMs;
  const shapeConsistent = (backend === "memory" && durable === false)
    || (backend === "postgres" && durable === true);
  const verified = shapeConsistent
    && backend === "postgres"
    && durable
    && observedAtFresh;

  let reason = null;
  if (!backend || !shapeConsistent || !observedAtValid) {
    reason = "control_persistence_invalid";
  } else if (!observedAtFresh) {
    reason = "control_persistence_stale";
  } else if (!verified) {
    reason = "control_persistence_not_durable";
  }

  return {
    backend,
    durable,
    verified,
    observedAt: observedAtValid ? new Date(observedAtMs).toISOString() : null,
    observedAtMs: observedAtValid ? observedAtMs : null,
    reason,
  };
}

export function assessTelegramSendGateEvidence(evidence, options = {}) {
  const maxAgeMs = Number(options.maxAgeMs || 2_000);
  const currentMs = nowMs(options.now);
  const checkedAtMs = Number(evidence?.checkedAtMs);
  const ageMs = currentMs - checkedAtMs;
  const fresh = Number.isFinite(checkedAtMs) && ageMs >= 0 && ageMs <= maxAgeMs;

  if (!evidence || !fresh) {
    return heldEvidence(ageMs < 0 ? "gate_evidence_from_future" : "gate_evidence_stale", {
      reportedState: evidence?.reportedState || null,
      authoritative: Boolean(evidence?.authoritative),
      ticketPresent: Boolean(evidence?.ticketPresent),
      ticketPrefixValid: Boolean(evidence?.ticketPrefixValid),
      testOnly: evidence?.testOnly === true,
      persistenceBackend: evidence?.persistenceBackend || null,
      durable: evidence?.durable === true,
      durabilityVerified: evidence?.durabilityVerified === true,
      persistenceObservedAt: evidence?.persistenceObservedAt || null,
      persistenceObservedAtMs: Number.isFinite(Number(evidence?.persistenceObservedAtMs))
        ? Number(evidence.persistenceObservedAtMs)
        : null,
      checkedAt: evidence?.checkedAt || null,
      checkedAtMs: Number.isFinite(checkedAtMs) ? checkedAtMs : null,
      expiresAt: evidence?.expiresAt || null
    });
  }

  const open = evidence.authoritative === true
    && evidence.reportedState === "open"
    && evidence.ticketPrefixValid === true
    && (evidence.testOnly === true || (
      evidence.persistenceBackend === "postgres"
      && evidence.durable === true
      && evidence.durabilityVerified === true
    ));

  return {
    ...evidence,
    effectiveState: open ? "open" : "hold",
    open,
    fresh: true,
    reason: open ? null : evidence.reason || "gate_held"
  };
}

export async function readTelegramSendGate(options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const maxAgeMs = Number(options.maxAgeMs || 2_000);
  const timestampMs = nowMs(options.now);

  if (options.gate) {
    return normalizeInjectedGate(options.gate, timestampMs, maxAgeMs);
  }

  const token = String(env.CONTROL_API_TOKEN || "").trim();
  if (!token) return heldEvidence("control_api_token_missing");
  if (typeof fetchImpl !== "function") return heldEvidence("control_fetch_unavailable");

  const baseUrl = String(options.baseUrl || env.SIRINX_CONTROL_URL || DEFAULT_CONTROL_BASE_URL)
    .replace(/\/+$/, "");
  if (!isLoopbackControlUrl(baseUrl)) return heldEvidence("control_url_not_loopback");

  try {
    const response = await fetchImpl(`${baseUrl}/api/gates`, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`
      },
      cache: "no-store",
      redirect: "error",
      signal: options.signal || AbortSignal.timeout(Number(options.timeoutMs || 1_500))
    });

    if (!response.ok) return heldEvidence(`control_http_${response.status}`);

    let body;
    try {
      body = await response.json();
    } catch {
      return heldEvidence("control_response_invalid_json");
    }

    if (!body || !Array.isArray(body.gates)) return heldEvidence("control_gate_list_invalid");
    const matches = body.gates.filter((gate) => gate?.name === TELEGRAM_GATE_NAME);
    if (matches.length !== 1) {
      return heldEvidence(matches.length === 0 ? "telegram_gate_missing" : "telegram_gate_duplicate");
    }

    const gate = matches[0];
    if (gate.state !== "hold" && gate.state !== "open") return heldEvidence("gate_state_invalid");

    const ticket = typeof gate.ticket === "string" ? gate.ticket.trim() : "";
    const ticketPrefixValid = TELEGRAM_TICKET_PATTERN.test(ticket);
    const persistence = inspectPersistenceEvidence(body.persistence, timestampMs, maxAgeMs);
    const checkedAt = new Date(timestampMs).toISOString();
    const evidence = {
      authority: "sirinx-control",
      testOnly: false,
      gateName: TELEGRAM_GATE_NAME,
      effectiveState: "hold",
      reportedState: gate.state,
      open: false,
      authoritative: true,
      fresh: true,
      ticketPresent: Boolean(ticket),
      ticketPrefixValid,
      persistenceBackend: persistence.backend,
      durable: persistence.durable,
      durabilityVerified: persistence.verified,
      persistenceObservedAt: persistence.observedAt,
      persistenceObservedAtMs: persistence.observedAtMs,
      checkedAt,
      checkedAtMs: timestampMs,
      expiresAt: new Date(timestampMs + maxAgeMs).toISOString(),
      reason: gate.state === "hold"
        ? "gate_held"
        : ticketPrefixValid
          ? persistence.reason
          : "gate_ticket_invalid"
    };

    return assessTelegramSendGateEvidence(evidence, { now: timestampMs, maxAgeMs });
  } catch (error) {
    const reason = error?.name === "AbortError" || error?.name === "TimeoutError"
      ? "control_request_timeout"
      : "control_request_failed";
    return heldEvidence(reason);
  }
}

export const TELEGRAM_CONTROL_GATE = Object.freeze({
  authority: "sirinx-control",
  name: TELEGRAM_GATE_NAME,
  ticketPrefix: "OPS-TG-",
  defaultControlBaseUrl: DEFAULT_CONTROL_BASE_URL
});
