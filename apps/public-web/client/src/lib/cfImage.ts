const RESIZABLE_REMOTE_ORIGINS = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv",
];

type CfImageOptions = {
  quality?: number;
  format?: "auto" | "webp" | "avif" | "jpeg";
};

function isResizableRemoteImage(src: string) {
  return RESIZABLE_REMOTE_ORIGINS.some(origin => src.startsWith(origin));
}

export function cfImage(src: string, width: number, options: CfImageOptions = {}) {
  // The Cloudflare Image Transform endpoint currently returns 403 for this
  // CloudFront origin. Keep the original asset URL until the transform route
  // has a verified origin policy; a broken optimized URL must not replace a
  // working image in the public site.
  void width;
  void options;
  return src;
}

export function cfImageSrcSet(
  src: string,
  widths: number[] = [360, 640, 960, 1280],
  options: CfImageOptions = {}
) {
  void widths;
  void options;
  if (!isResizableRemoteImage(src)) return undefined;
  return undefined;
}
