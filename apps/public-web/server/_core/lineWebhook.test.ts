import { describe, expect, it } from "vitest";
import {
  createLineSignature,
  getLineWebhookRuntime,
  summarizeLineWebhookPayload,
  verifyLineSignature,
} from "./lineWebhookCore";

describe("LINE webhook dry-run guard", () => {
  it("keeps live mode downgraded to dry-run until auto reply is approved", () => {
    const runtime = getLineWebhookRuntime({
      lineMode: "live",
      autoReplyApproved: "false",
      channelSecret: "secret",
      channelAccessToken: "token",
    });

    expect(runtime.requestedMode).toBe("live");
    expect(runtime.effectiveMode).toBe("dry-run");
    expect(runtime.autoReplyApproved).toBe(false);
    expect(runtime.channelSecretConfigured).toBe(true);
    expect(runtime.channelAccessTokenConfigured).toBe(true);
  });

  it("verifies a LINE signature without exposing the channel secret", () => {
    const body = Buffer.from(JSON.stringify({ destination: "U123", events: [] }));
    const signature = createLineSignature(body, "local-test-secret");

    expect(verifyLineSignature(body, "local-test-secret", signature)).toEqual({
      status: "verified",
    });
    expect(verifyLineSignature(body, "local-test-secret", "bad")).toEqual({
      status: "invalid",
      reason: "signature_length_mismatch",
    });
  });

  it("allows synthetic dry-run payloads to be summarized without live sends", () => {
    const body = Buffer.from(
      JSON.stringify({ destination: "U123", events: [{ type: "message" }] })
    );

    expect(summarizeLineWebhookPayload(body)).toEqual({
      destinationPresent: true,
      eventCount: 1,
    });
  });
});
