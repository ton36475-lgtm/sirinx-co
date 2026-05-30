/**
 * SIRINX Solar Energy — API Proxy Worker
 * Cloudflare Worker ทำหน้าที่เป็น API Gateway
 *
 * Routes:
 *   /api/*  → backend (sirinx-app Next.js)
 *   /health → health check
 */

// Rate limiting: in-memory per Cloudflare isolate (resets on redeploy)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window per IP
const rateLimitMap = new Map(); // ip → { count, windowStart }

// Allowed origins
const ALLOWED_ORIGINS = [
  'https://sirinx.com',
  'https://www.sirinx.com',
  'https://app.sirinx.com',
  'http://localhost:3002', // local dev
];

/**
 * Add CORS headers to a response
 */
function addCorsHeaders(response, origin) {
  const headers = new Headers(response.headers);
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  headers.set('Access-Control-Allow-Origin', allowed);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Vary', 'Origin');
  return new Response(response.body, { status: response.status, headers });
}

/**
 * Check rate limit for an IP address
 * Returns true if within limit, false if exceeded
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Rate limit headers
 */
function getRateLimitHeaders(ip) {
  const entry = rateLimitMap.get(ip);
  if (!entry) return {};
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);
  const reset = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS) / 1000);
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  };
}

/**
 * Route table: maps path prefixes to backend base URLs
 * Set BACKEND_URL env var in wrangler.toml or Cloudflare dashboard
 */
function getBackendUrl(env) {
  return env.BACKEND_URL || 'https://app.sirinx.com';
}

/**
 * Main request handler
 */
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin') || '';
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return addCorsHeaders(new Response(null, { status: 204 }), origin);
  }

  // Health check
  if (url.pathname === '/health') {
    return addCorsHeaders(
      new Response(JSON.stringify({ status: 'ok', worker: 'api-proxy', ts: Date.now() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      origin
    );
  }

  // Rate limiting
  if (!checkRateLimit(ip)) {
    return addCorsHeaders(
      new Response(JSON.stringify({ error: 'Too many requests', retryAfter: 60 }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          ...getRateLimitHeaders(ip),
        },
      }),
      origin
    );
  }

  // Only proxy /api/* paths
  if (!url.pathname.startsWith('/api/')) {
    return addCorsHeaders(
      new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
      origin
    );
  }

  // Build backend URL
  const backendBase = getBackendUrl(env);
  const backendUrl = new URL(url.pathname + url.search, backendBase);

  // Forward headers (exclude host, cf-specific)
  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.delete('host');
  forwardHeaders.set('X-Forwarded-For', ip);
  forwardHeaders.set('X-Worker-Version', '1.0.0');

  try {
    const backendRequest = new Request(backendUrl.toString(), {
      method: request.method,
      headers: forwardHeaders,
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
      redirect: 'follow',
    });

    const backendResponse = await fetch(backendRequest);

    // Clone and add CORS + rate limit headers
    const responseHeaders = new Headers(backendResponse.headers);
    Object.entries(getRateLimitHeaders(ip)).forEach(([k, v]) => responseHeaders.set(k, v));
    responseHeaders.set('X-Proxied-By', 'sirinx-cf-worker');

    const proxied = new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });

    return addCorsHeaders(proxied, origin);
  } catch (err) {
    return addCorsHeaders(
      new Response(JSON.stringify({ error: 'Backend unavailable', detail: err.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }),
      origin
    );
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};
