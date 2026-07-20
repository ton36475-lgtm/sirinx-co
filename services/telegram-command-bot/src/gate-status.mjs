// Real /gates and /status command bodies for the Hermes Telegram
// commander center — replaces the hardcoded "hold" placeholder (B9)
// by querying the live sirinx-control API. No Telegram polling here
// (that still needs TELEGRAM_BOT_TOKEN, provisioned by the operator);
// this module is the part that can be built and tested without one.

const DEFAULT_CONTROL_URL = "http://127.0.0.1:8711";

/**
 * Fetch live gate state from sirinx-control. Throws on network/auth
 * failure so the caller can fall back to an explicit "unreachable"
 * message instead of silently reporting stale/wrong data.
 */
export async function fetchGateStatus({
  controlUrl = process.env.CONTROL_URL || DEFAULT_CONTROL_URL,
  token = process.env.CONTROL_API_TOKEN,
  fetchImpl = fetch,
} = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetchImpl(`${controlUrl}/api/gates`, { headers });
  if (!response.ok) {
    throw new Error(`sirinx-control returned ${response.status} for /api/gates`);
  }
  const body = await response.json();
  return body.gates;
}

/** Render the `/gates` command reply from live gate records. */
export function formatGatesReply(gates) {
  const lines = gates.map((g) => {
    const icon = g.state === "open" ? "🟢" : "🔒";
    const ticket = g.ticket ? ` (ticket: ${g.ticket})` : "";
    return `${icon} ${g.name}: ${g.state}${ticket}`;
  });
  return ["SIRINX release gates (live):", ...lines].join("\n");
}

/** Render the `/gates` reply when the control plane cannot be reached. */
export function formatGatesUnavailable(reason) {
  return [
    "⚠️ Could not reach sirinx-control for live gate state.",
    `Reason: ${reason}`,
    "Falling back to the documented default: ALL gates hold until an",
    "operator opens one with a ticket. See GO_LIVE_GATE_CHECKLIST.md.",
  ].join("\n");
}

/**
 * Full `/gates` command handler: live-query with a safe, honest
 * fallback. Never fabricates "open" when the query fails — that
 * direction of error would be unsafe; failing toward "assume hold" is
 * the fail-closed choice.
 */
export async function handleGatesCommand(options = {}) {
  try {
    const gates = await fetchGateStatus(options);
    return formatGatesReply(gates);
  } catch (err) {
    return formatGatesUnavailable(err.message);
  }
}
