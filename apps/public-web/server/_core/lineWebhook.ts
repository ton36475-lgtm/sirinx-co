import express, { type Express, type Request, type Response } from "express";
import {
  getLineWebhookRuntime,
  summarizeLineWebhookPayload,
  verifyLineSignature,
} from "./lineWebhookCore";

const getRawBody = (req: Request): Buffer => {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  return Buffer.from(JSON.stringify(req.body ?? {}), "utf8");
};

export function registerLineWebhookRoutes(app: Express) {
  app.get("/api/line/webhook/health", (_req: Request, res: Response) => {
    const runtime = getLineWebhookRuntime();
    res.json({
      ok: true,
      provider: "line",
      mode: runtime.effectiveMode,
      requestedMode: runtime.requestedMode,
      autoReplyApproved: runtime.autoReplyApproved,
      channelSecretConfigured: runtime.channelSecretConfigured,
      channelAccessTokenConfigured: runtime.channelAccessTokenConfigured,
      liveReplyEnabled: false,
    });
  });

  app.post(
    "/api/line/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    (req: Request, res: Response) => {
      const runtime = getLineWebhookRuntime();

      if (runtime.effectiveMode === "disabled") {
        return res.status(503).json({
          ok: false,
          provider: "line",
          mode: runtime.effectiveMode,
          error: "line_webhook_disabled",
          liveReplySent: false,
        });
      }

      const body = getRawBody(req);
      const signature = verifyLineSignature(
        body,
        process.env.LINE_CHANNEL_SECRET ?? "",
        req.header("x-line-signature") ?? undefined
      );

      if (signature.status === "invalid") {
        return res.status(401).json({
          ok: false,
          provider: "line",
          mode: runtime.effectiveMode,
          signature,
          liveReplySent: false,
        });
      }

      let payloadSummary: ReturnType<typeof summarizeLineWebhookPayload>;
      try {
        payloadSummary = summarizeLineWebhookPayload(body);
      } catch {
        return res.status(400).json({
          ok: false,
          provider: "line",
          mode: runtime.effectiveMode,
          error: "invalid_line_webhook_json",
          liveReplySent: false,
        });
      }

      return res.json({
        ok: true,
        provider: "line",
        mode: runtime.effectiveMode,
        requestedMode: runtime.requestedMode,
        autoReplyApproved: runtime.autoReplyApproved,
        signature,
        payload: payloadSummary,
        liveReplySent: false,
        nextGate:
          "Live reply requires deploy evidence, signature verification, and explicit test-user approval.",
      });
    }
  );
}
