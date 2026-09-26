import { useState, type ImgHTMLAttributes } from "react";

type ProjectImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "onError"> & {
  src?: string;
  alt: string;
  fallbackLabel: string;
};

function ProjectImageContent({ src, alt, fallbackLabel, className, width, height, style, ...imageProps }: ProjectImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src?.trim() || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} — ${fallbackLabel}`}
        className={`flex items-center justify-center bg-surface-elevated p-6 text-center text-sm text-text-muted ${className ?? ""}`}
        style={{ width, height, ...style }}
      >
        <span>{fallbackLabel}</span>
      </div>
    );
  }
  return <img {...imageProps} src={src} alt={alt} className={className} width={width} height={height} style={style} onError={() => setFailed(true)} />;
}

export default function ProjectImage(props: ProjectImageProps) {
  return <ProjectImageContent key={props.src} {...props} />;
}
