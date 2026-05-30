const SIRINX_IMAGE_ORIGIN = "https://www.sirinx.co";
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
  if (!isResizableRemoteImage(src)) return src;
  const quality = options.quality ?? 74;
  const format = options.format ?? "auto";
  const directives = [
    `width=${Math.max(1, Math.round(width))}`,
    `quality=${quality}`,
    `format=${format}`,
    "fit=scale-down",
  ];
  return `${SIRINX_IMAGE_ORIGIN}/cdn-cgi/image/${directives.join(",")}/${src}`;
}

export function cfImageSrcSet(
  src: string,
  widths: number[] = [360, 640, 960, 1280],
  options: CfImageOptions = {}
) {
  if (!isResizableRemoteImage(src)) return undefined;
  return widths.map(width => `${cfImage(src, width, options)} ${width}w`).join(", ");
}
