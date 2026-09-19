import { describe, expect, it } from "vitest";
import { ApiResponseTypeError, requireJsonApiResponse } from "../lib/apiResponse";
import { isLeadTransportFallbackError } from "../lib/leadFallback";

describe("API transport response type", () => {
  it("keeps the original JSON response and does not consume its body", async () => {
    const response = new Response('{"ok":true}', { headers: { "Content-Type": "application/json; charset=utf-8" } });
    expect(requireJsonApiResponse(response)).toBe(response);
    expect(response.bodyUsed).toBe(false);
    expect(await response.json()).toEqual({ ok: true });
  });
  it.each([401, 403, 422, 500])("preserves JSON status %s for normal tRPC handling", status => {
    const response = new Response('{"error":"test"}', { status, headers: { "Content-Type": "application/json" } });
    expect(requireJsonApiResponse(response)).toBe(response);
    expect(response.status).toBe(status);
  });
  it("accepts a case-insensitive structured JSON media type", () => {
    const response = new Response('{}', { headers: { "Content-Type": "Application/Problem+JSON; charset=utf-8" } });
    expect(requireJsonApiResponse(response)).toBe(response);
  });
  it.each(["text/html", "text/plain", "application/xml", "application/jsonp", ""])(
    "rejects non-JSON or missing content type '%s' without reporting success", contentType => {
      const response = new Response('<html>private-customer-value</html>', {
        headers: contentType ? { "Content-Type": contentType } : {},
      });
      if (!contentType) response.headers.delete("content-type");
      expect(() => requireJsonApiResponse(response)).toThrow(ApiResponseTypeError);
      expect(response.bodyUsed).toBe(false);
    }
  );
  it("classifies HTML 200 as a contact fallback without leaking content", () => {
    const response = new Response('<html>private-customer-value</html>', { headers: { "Content-Type": "text/html" } });
    let caught: unknown;
    try { requireJsonApiResponse(response); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(ApiResponseTypeError);
    expect((caught as ApiResponseTypeError).status).toBe(200);
    expect((caught as ApiResponseTypeError).code).toBe("SIRINX_API_NON_JSON");
    expect((caught as Error).message).not.toContain("private-customer-value");
    expect(isLeadTransportFallbackError(caught)).toBe(true);
  });
});
