/**
 * SIRINX Dev Router — dev.sirinx.co
 *
 * Routes to local services through Cloudflare Tunnel:
 *   dev.sirinx.co/*              -> dev-control-api (port 8790)
 *   dev.sirinx.co/hermes/*       -> hermes-api (port 9000)
 *   dev.sirinx.co/web/*          -> sirinx-web (port 8080)
 *
 * Deployment gated behind `cloudflare_dns` + `deploy` gates.
 */

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function notFound() {
  return json({ error: "not found" }, 404);
}

async function proxyTo(url, request) {
  const headers = new Headers(request.headers);
  headers.set("x-forwarded-host", "dev.sirinx.co");
  headers.set("x-forwarded-proto", "https");

  const upstream = new Request(url.toString(), {
    method: request.method,
    headers,
    body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
  });

  try {
    const response = await fetch(upstream);
    const outHeaders = new Headers(response.headers);
    outHeaders.set("access-control-allow-origin", "*");
    return new Response(response.body, { status: response.status, headers: outHeaders });
  } catch {
    return json({ error: "service unavailable" }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ status: "ok", service: "sirinx-dev-router", version: "1.0" });
    }

    if (url.pathname.startsWith("/hermes/")) {
      const target = new URL(url.pathname.slice(7) + url.search, env.HERMES_API_HOST);
      return proxyTo(target, request);
    }

    if (url.pathname.startsWith("/web/")) {
      const target = new URL(url.pathname.slice(4) + url.search, env.SIRINX_WEB_HOST);
      return proxyTo(target, request);
    }

    // Default: dev-control-api (A2A sync, OmniRoute, CenterBrain Hub)
    const target = new URL(url.pathname + url.search, env.DEV_API_HOST);
    return proxyTo(target, request);
  },
};
