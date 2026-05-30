import { describe, expect, it } from "vitest";
import { ensureOAuthConfigured } from "./sdk";

describe("OAuth configuration guard", () => {
  it("throws a clear configuration error when OAuth is not configured", () => {
    expect(() => ensureOAuthConfigured("")).toThrow(
      "OAUTH_SERVER_URL is not configured"
    );
  });
});
