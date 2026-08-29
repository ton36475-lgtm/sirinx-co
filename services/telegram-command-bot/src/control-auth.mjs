import { timingSafeEqual } from "node:crypto";

function readHeader(headers, name) {
  if (!headers) return "";
  if (typeof headers.get === "function") return String(headers.get(name) || "");
  return String(headers[name] || headers[name.toLowerCase()] || "");
}

function secureEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function authorizeControlRequest(headers, env = process.env) {
  const expectedToken = String(env.CONTROL_API_TOKEN || "").trim();
  if (!expectedToken) {
    return {
      configured: false,
      authorized: false,
      reason: "control_api_token_missing"
    };
  }

  const authorization = readHeader(headers, "authorization");
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) {
    return {
      configured: true,
      authorized: false,
      reason: "bearer_token_missing"
    };
  }

  return secureEqual(match[1], expectedToken)
    ? { configured: true, authorized: true, reason: null }
    : { configured: true, authorized: false, reason: "bearer_token_invalid" };
}

