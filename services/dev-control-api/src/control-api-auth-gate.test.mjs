import { describe, expect, it, beforeEach, afterEach } from "vitest";

/**
 * The control API used to enforce its Bearer token on exactly one of 93 routes
 * (a2a-sync/plan, and only when dryRun === false). Everything else — including
 * the local-file writers — was reachable by anything that could open the port.
 * These tests pin the gate so that cannot regress silently.
 */

const FIXTURE_BEARER = "test-bearer-fixture";
let previousToken;

/** Invoke handleRequest with a minimal request/response pair and read the reply. */
async function call(path, { token, configured = true } = {}) {
  if (configured) process.env.CONTROL_API_TOKEN = FIXTURE_BEARER;
  else delete process.env.CONTROL_API_TOKEN;

  const { handleRequest } = await import("../server.mjs");
  let status = 0;
  let body = "";
  const request = {
    method: "GET",
    url: path,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    async text() {
      return "";
    }
  };
  const response = {
    statusCode: 0,
    setHeader() {},
    getHeader() {
      return undefined;
    },
    writeHead(code) {
      status = code;
      return this;
    },
    end(chunk) {
      body = String(chunk ?? "");
    },
    write() {}
  };
  await handleRequest(request, response);
  return { status, payload: body ? JSON.parse(body) : null };
}

beforeEach(() => {
  previousToken = process.env.CONTROL_API_TOKEN;
});

afterEach(() => {
  if (previousToken === undefined) delete process.env.CONTROL_API_TOKEN;
  else process.env.CONTROL_API_TOKEN = previousToken;
});

describe("control API auth gate", () => {
  it("leaves /health open, because the stack manager polls it without credentials", async () => {
    const { status, payload } = await call("/health");
    expect(status).toBe(200);
    expect(payload.service).toBe("sirinx-dev-control-api");
  });

  it("refuses an /api/ route with no token", async () => {
    const { status, payload } = await call("/api/gates");
    expect(status).toBe(401);
    expect(payload.error).toBe("bearer_token_missing");
  });

  it("refuses an /api/ route with the wrong token", async () => {
    const { status, payload } = await call("/api/gates", { token: "wrong" });
    expect(status).toBe(401);
    expect(payload.error).toBe("bearer_token_invalid");
  });

  it("serves an /api/ route with the right token", async () => {
    const { status } = await call("/api/gates", { token: FIXTURE_BEARER });
    expect(status).toBe(200);
  });

  it("fails closed when no token is configured, rather than serving open", async () => {
    const { status, payload } = await call("/api/gates", { configured: false });
    expect(status).toBe(503);
    expect(payload.error).toBe("control_api_token_not_configured");
  });

  it("gates the local-file writer, not only the read routes", async () => {
    // approval-evidence/write reaches the filesystem, so it must be covered.
    const { status } = await call("/api/approval-evidence/write");
    expect(status).toBe(401);
  });
});
