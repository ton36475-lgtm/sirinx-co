/**
 * Image helper retained for call-site compatibility.
 *
 * These helpers used to build Cloudflare Image Transformation URLs for the
 * Manus-era CloudFront distribution. That origin answers 403 for every file
 * and all site imagery is now local (see `@/lib/media`), so the transform
 * path is gone: passing the source straight through is both correct and
 * cheaper than a second network hop.
 */

type CfImageOptions = {
  quality?: number;
  format?: "auto" | "webp" | "avif" | "jpeg";
};

export function cfImage(src: string, width: number, options: CfImageOptions = {}) {
  void width;
  void options;
  return src;
}

export function cfImageSrcSet(
  _src: string,
  widths: number[] = [360, 640, 960, 1280],
  options: CfImageOptions = {}
) {
  void widths;
  void options;
  // Local assets ship their own `srcSet`/`<picture>` markup; there is no
  // transform service left to vary the width here.
  return undefined;
}
