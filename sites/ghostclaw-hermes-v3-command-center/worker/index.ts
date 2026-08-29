import handler from "vinext/server/app-router-entry";

interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: AssetFetcher;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  fetch(request: Request, env: Env, context: ExecutionContext) {
    // Sites access policy is the owner allowlist. Require the authenticated
    // workspace identity header as a second fail-closed boundary before the
    // application renderer receives any request.
    if (!(request.headers.get("oai-authenticated-user-email") ?? "").trim()) {
      return Promise.resolve(
        new Response("Authentication required", {
          status: 401,
          headers: { "cache-control": "no-store" },
        }),
      );
    }
    return handler.fetch(request, env, context);
  },
};

export default worker;
