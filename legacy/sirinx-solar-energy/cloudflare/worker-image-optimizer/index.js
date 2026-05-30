/**
 * SIRINX Solar Energy — Image Optimizer Worker
 * รับ image URL → resize/optimize → return WebP
 *
 * Usage:
 *   GET /img?url=<encoded_url>&w=800&h=600&q=80&f=webp
 *
 * Params:
 *   url  — source image URL (must be from allowed domains)
 *   w    — target width (max 2000)
 *   h    — target height (optional, preserves aspect ratio if omitted)
 *   q    — quality 1-100 (default 85)
 *   f    — format: webp | jpeg | png | avif (default: webp)
 *
 * Requires: Cloudflare Images / Image Resizing (available on Pro+ plans)
 * Cache: CF edge cache for 30 days
 */

// Allowed source domains (prevent open redirect / SSRF)
const ALLOWED_IMAGE_DOMAINS = [
  'sirinx.com',
  'www.sirinx.com',
  'cdn.sirinx.com',
  'images.sirinx.com',
  'sirinx-storage.supabase.co',
  'lh3.googleusercontent.com',     // Google product images
  'cdn.pixabay.com',               // Free stock photos
];

const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
const DEFAULT_QUALITY = 85;
const CACHE_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

/**
 * Check if a URL's hostname is in the allowed list
 */
function isAllowedDomain(urlString) {
  try {
    const u = new URL(urlString);
    return ALLOWED_IMAGE_DOMAINS.some(
      (domain) => u.hostname === domain || u.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Clamp a number between min and max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Return an error response as JSON
 */
function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleRequest(request) {
  const url = new URL(request.url);

  // Health check
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok', worker: 'image-optimizer' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only handle /img path
  if (url.pathname !== '/img') {
    return errorResponse('Use /img?url=...&w=...&h=...&q=...&f=...', 404);
  }

  // Parse params
  const sourceUrl = url.searchParams.get('url');
  if (!sourceUrl) {
    return errorResponse('Missing required param: url');
  }

  // Decode if percent-encoded
  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(sourceUrl);
  } catch {
    return errorResponse('Invalid url encoding');
  }

  // Security: only allow whitelisted domains
  if (!isAllowedDomain(decodedUrl)) {
    return errorResponse('Image domain not allowed', 403);
  }

  const width = url.searchParams.has('w')
    ? clamp(parseInt(url.searchParams.get('w'), 10), 1, MAX_WIDTH)
    : undefined;

  const height = url.searchParams.has('h')
    ? clamp(parseInt(url.searchParams.get('h'), 10), 1, MAX_HEIGHT)
    : undefined;

  const quality = url.searchParams.has('q')
    ? clamp(parseInt(url.searchParams.get('q'), 10), 1, 100)
    : DEFAULT_QUALITY;

  const format = ['webp', 'jpeg', 'png', 'avif'].includes(url.searchParams.get('f'))
    ? url.searchParams.get('f')
    : 'webp';

  // Use Cloudflare Image Resizing (cf.image options)
  // Requires Cloudflare Pro plan with Image Resizing enabled
  const imageOptions = {
    cf: {
      image: {
        fit: 'scale-down',
        format,
        quality,
        ...(width && { width }),
        ...(height && { height }),
        sharpen: 0.5,
      },
      // Cache transformed image at edge for 30 days
      cacheTtl: CACHE_TTL,
      cacheEverything: true,
    },
  };

  try {
    const imageResponse = await fetch(decodedUrl, imageOptions);

    if (!imageResponse.ok) {
      return errorResponse(`Failed to fetch source image: HTTP ${imageResponse.status}`, 502);
    }

    // Build response with cache headers
    const headers = new Headers(imageResponse.headers);
    headers.set('Cache-Control', `public, max-age=${CACHE_TTL}, immutable`);
    headers.set('Content-Type', `image/${format}`);
    headers.set('X-Optimized-By', 'sirinx-cf-image-worker');
    headers.set(
      'Vary',
      'Accept' // Allow CDN to serve different formats based on Accept header
    );

    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.delete('Set-Cookie'); // Never set cookies on image responses

    return new Response(imageResponse.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    // Fallback: proxy original image without transformation
    try {
      const fallbackResponse = await fetch(decodedUrl);
      if (fallbackResponse.ok) {
        const headers = new Headers(fallbackResponse.headers);
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('X-Optimized-By', 'sirinx-cf-image-worker-fallback');
        return new Response(fallbackResponse.body, { status: 200, headers });
      }
    } catch {
      // ignore fallback error
    }
    return errorResponse(`Image processing failed: ${err.message}`, 500);
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  },
};
