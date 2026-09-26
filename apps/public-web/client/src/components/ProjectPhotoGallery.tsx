import ProjectImage from "@/components/ProjectImage";
import type { PublicProjectPhoto } from "@shared/publicProjectMedia";
import type { Language } from "@/contexts/LanguageContext";

type ProjectPhotoGalleryProps = Readonly<{
  galleryId: string;
  photos: readonly PublicProjectPhoto[];
  lang: Language;
  fallbackLabel: string;
  title: string;
  description: string;
}>;

export default function ProjectPhotoGallery({
  galleryId,
  photos,
  lang,
  fallbackLabel,
  title,
  description,
}: ProjectPhotoGalleryProps) {
  if (photos.length === 0) return null;

  return (
    <section aria-labelledby={`${galleryId}-gallery-title`} className="mt-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-primary">Portfolio evidence</p>
      <h2 id={`${galleryId}-gallery-title`} className="mt-2 font-display text-2xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">{description}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <figure
            key={photo.id}
            className="overflow-hidden rounded-2xl border border-border-subtle bg-surface-elevated"
          >
            <ProjectImage
              src={photo.src}
              alt={photo.alt[lang]}
              fallbackLabel={fallbackLabel}
              width={photo.width}
              height={photo.height}
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
              className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
            {photo.presentation === "cosmetic-retouch" ? (
              <figcaption className="border-t border-border-subtle px-3 py-2 text-[0.7rem] text-text-muted">Cosmetic retouch</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
