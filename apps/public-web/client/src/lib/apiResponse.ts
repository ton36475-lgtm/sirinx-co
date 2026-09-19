/** Validate transport only; authorization and application errors remain tRPC's responsibility. */
export class ApiResponseTypeError extends Error {
  readonly code = "SIRINX_API_NON_JSON";
  readonly status: number;

  constructor(status: number) {
    // Never expose response bodies, request URLs, cookies, or customer data.
    super("Service unavailable (SIRINX_API_NON_JSON): expected a JSON API response.");
    this.name = "ApiResponseTypeError";
    this.status = status;
  }
}

export function requireJsonApiResponse(response: Response): Response {
  const mediaType = (response.headers.get("content-type") ?? "")
    .split(";", 1)[0].trim().toLowerCase();
  if (!/^application\/(?:json|[a-z0-9!#$&^_.+-]+\+json)$/.test(mediaType)) {
    throw new ApiResponseTypeError(response.status);
  }
  // Preserve the unread response, status and headers, including JSON 401/403 errors.
  return response;
}
