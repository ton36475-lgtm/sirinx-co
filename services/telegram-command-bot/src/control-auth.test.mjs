import { describe, expect, it } from "vitest";
import { authorizeControlRequest } from "./control-auth.mjs";

describe("authorizeControlRequest", () => {
  it("fails closed when no control token is configured", () => {
    expect(authorizeControlRequest({}, {})).toEqual({
      configured: false,
      authorized: false,
      reason: "control_api_token_missing",
    });
  });

  it("accepts only the exact bearer token", () => {
    const env = { CONTROL_API_TOKEN: "control-token-test" };

    expect(authorizeControlRequest({ authorization: "Bearer wrong" }, env).authorized).toBe(false);
    expect(authorizeControlRequest({ authorization: "Basic control-token-test" }, env).authorized).toBe(false);
    expect(authorizeControlRequest({ authorization: "Bearer control-token-test" }, env)).toEqual({
      configured: true,
      authorized: true,
      reason: null,
    });
  });

  it("never includes the token in its result", () => {
    const token = "control-token-must-not-leak";
    const result = authorizeControlRequest({ authorization: `Bearer ${token}` }, {
      CONTROL_API_TOKEN: token,
    });

    expect(JSON.stringify(result)).not.toContain(token);
  });
});
