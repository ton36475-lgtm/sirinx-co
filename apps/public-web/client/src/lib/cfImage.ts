const SIRINX_IMAGE_ORIGIN = "https://www.sirinx.co";
const REMOTE_ORIGIN = "https://d2xsxph8kpxj0f.cloudfront.net";
const REMOTE_PATH = "/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/";

type CfImageOptions = {
  quality?: number;
  format?: "auto" | "webp" | "avif" | "jpeg";
};

function isResizableRemoteImage(src: string) {
  try {
    const url = new URL(src);
    return url.origin === REMOTE_ORIGIN &&
      url.pathname.startsWith(REMOTE_PATH) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function normalizeWidth(width: number) {
  if (!Number.isFinite(width) || width <= 0) return undefined;
  return Math.min(8192, Math.max(1, Math.round(width)));
}

// Keep transformation policy testable without requiring a Cloudflare account.
export function createCfImageHelpers(enabled: boolean) {
  function cfImage(src: string, width: number, options: CfImageOptions = {}) {
    const normalizedWidth = normalizeWidth(width);
    if (!enabled || !isResizableRemoteImage(src) || normalizedWidth === undefined) {
      return src;
    }
    const quality = Number.isFinite(options.quality)
      ? Math.min(100, Math.max(1, Math.round(options.quality!))) : 74;
    const directives = [
      `width=${normalizedWidth}`,
      `quality=${quality}`,
      `format=${options.format ?? "auto"}`,
      "fit=scale-down",
    ];
    return `${SIRINX_IMAGE_ORIGIN}/cdn-cgi/image/${directives.join(",")}/${src}`;
  }

  function cfImageSrcSet(
    src: string,
    widths: number[] = [360, 640, 960, 1280],
    options: CfImageOptions = {}
  ) {
    if (!enabled || !isResizableRemoteImage(src)) return undefined;
    const validWidths = [...new Set(widths.map(normalizeWidth)
      .filter((width): width is number => width !== undefined))].sort((a, b) => a - b);
    if (validWidths.length === 0) return undefined;
    return validWidths.map(width => `${cfImage(src, width, options)} ${width}w`).join(", ");
  }

  return { cfImage, cfImageSrcSet };
}

// Enable only after the zone and this exact external source are verified.
// This is a public build-time flag, not a secret or a runtime dashboard toggle.
const env = (import.meta as ImportMeta & {
  env?: { VITE_CF_IMAGE_TRANSFORMS?: string };
}).env;
export const { cfImage, cfImageSrcSet } = createCfImageHelpers(
  env?.VITE_CF_IMAGE_TRANSFORMS === "true"
);
