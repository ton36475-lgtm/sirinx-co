import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { absoluteUrl, getSeoMeta, seoDefaults } from "@/lib/seo";

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
}

function upsertCanonical(href: string) {
  const canonicals = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
  const canonical = canonicals[0] ?? document.createElement("link");
  canonical.setAttribute("rel", "canonical");
  canonical.setAttribute("href", href);
  if (!canonical.parentElement) {
    document.head.appendChild(canonical);
  }
  for (const duplicate of canonicals.slice(1)) {
    duplicate.remove();
  }
}

export default function RouteSeo() {
  const [location] = useLocation();
  const meta = getSeoMeta(location);
  const url = absoluteUrl(meta.path);
  const image = meta.image ?? seoDefaults.image;
  const robots = meta.noindex ? "noindex, nofollow" : "index, follow";

  useEffect(() => {
    document.title = meta.title;
    upsertMeta('meta[name="description"]', { name: "description", content: meta.description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: robots });
    upsertCanonical(url);
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: seoDefaults.siteName });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: meta.title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: meta.description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "th_TH" });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: meta.title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: meta.description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
  }, [image, meta.description, meta.title, robots, url]);

  return (
    <Helmet>
      <html lang="th" />
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={seoDefaults.siteName} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="th_TH" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
