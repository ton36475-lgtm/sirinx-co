import { createHmac, timingSafeEqual } from "node:crypto";

type LineRuntimeMode = "dry-run" | "disabled" | "live";

type LineRuntimeOverrides = {
  lineMode?: string;
  autoReplyApproved?: string;
  channelSecret?: string;
  channelAccessToken?: string;
};

type LineSignatureResult =
  | { status: "verified" }
  | { status: "invalid"; reason: string }
  | { status: "skipped_missing_secret" }
  | { status: "missing_header" };

const normalizeLineMode = (mode: string | undefined): LineRuntimeMode => {
  if (mode === "live" || mode === "disabled") return mode;
  return "dry-run";
};

export function getLineWebhookRuntime(overrides: LineRuntimeOverrides = {}) {
  const requestedMode = normalizeLineMode(
    overrides.lineMode ?? process.env.SIRINX_LINE_MODE
  );
  const autoReplyApproved =
    (overrides.autoReplyApproved ??
      process.env.SIRINX_LINE_AUTO_REPLY_APPROVED) === "true";
  const channelSecret =
    overrides.channelSecret ?? process.env.LINE_CHANNEL_SECRET ?? "";
  const channelAccessToken =
    overrides.channelAccessToken ?? process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "";
  const effectiveMode =
    requestedMode === "live" && !autoReplyApproved ? "dry-run" : requestedMode;

  return {
    requestedMode,
    effectiveMode,
    autoReplyApproved,
    channelSecretConfigured: channelSecret.length > 0,
    channelAccessTokenConfigured: channelAccessToken.length > 0,
  };
}

export function createLineSignature(body: Buffer, channelSecret: string) {
  return createHmac("sha256", channelSecret).update(body).digest("base64");
}

export function verifyLineSignature(
  body: Buffer,
  channelSecret: string,
  signatureHeader: string | undefined
): LineSignatureResult {
  if (channelSecret.length === 0) {
    return { status: "skipped_missing_secret" };
  }

  if (!signatureHeader) {
    return { status: "missing_header" };
  }

  const expected = Buffer.from(createLineSignature(body, channelSecret));
  const actual = Buffer.from(signatureHeader);
  if (expected.length !== actual.length) {
    return { status: "invalid", reason: "signature_length_mismatch" };
  }

  return timingSafeEqual(expected, actual)
    ? { status: "verified" }
    : { status: "invalid", reason: "signature_mismatch" };
}

export function summarizeLineWebhookPayload(body: Buffer) {
  const parsed = JSON.parse(body.toString("utf8")) as {
    destination?: string;
    events?: unknown[];
  };

  return {
    destinationPresent: typeof parsed.destination === "string",
    eventCount: Array.isArray(parsed.events) ? parsed.events.length : 0,
  };
}
