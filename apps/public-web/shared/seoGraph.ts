/**
 * Shared JSON-LD graph builder.
 *
 * The static build (server/ogTags.ts) and the hydrated page (RouteSeo) both call
 * this function, so the served HTML and the rendered DOM always describe the same
 * entities. Exactly one FAQPage node can exist per document because the FAQ list is
 * passed in once, by the caller that owns the visible content.
 */

export type SeoGraphFaqItem = { question: string; answer: string };

export type SeoGraphArea = { name: string };

export type SeoGraphBreadcrumb = { name: string; item: string };

export type SeoGraphInput = {
  baseUrl: string;
  siteName: string;
  /** Normalized path without a trailing slash, "/" for the homepage. */
  path: string;
  title: string;
  description: string;
  image: string;
  organizationDescription: string;
  service: {
    id: string;
    name: string;
    serviceType: string;
  };
  areaServed: SeoGraphArea[];
  breadcrumbs: SeoGraphBreadcrumb[];
  faq?: SeoGraphFaqItem[];
  inLanguage?: string;
  /**
   * Long-form editorial content. Emits an Article node so the 77 province
   * pages describe themselves as articles, not just service landing pages.
   * `author` is the Organization on purpose: no individual author has been
   * verified, and inventing a byline is worse than attributing the company.
   * `datePublished` stays optional because a real first-publish date per
   * province is not recorded anywhere in this repo.
   */
  article?: {
    headline: string;
    dateModified: string;
    wordCount?: number;
    section?: string;
  };
  /** Step-by-step procedure, emitted as a HowTo node. */
  howTo?: {
    name: string;
    description: string;
    steps: Array<{ name: string; text: string }>;
  };
};

function absolute(baseUrl: string, path: string) {
  if (!path || path === "/") return baseUrl;
  return `${baseUrl}${path}`;
}

/**
 * Breadcrumb trail shared by the static build and the hydrated page so the
 * visible breadcrumb and the BreadcrumbList schema are generated from one rule.
 */
export function buildSeoBreadcrumbs(input: {
  baseUrl: string;
  path: string;
  title: string;
  province?: { slug: string; nameTh: string } | null;
  homeLabel?: string;
  carportLabel?: string;
}): SeoGraphBreadcrumb[] {
  const { baseUrl, path, title, province } = input;
  const items: SeoGraphBreadcrumb[] = [
    { name: input.homeLabel ?? "หน้าแรก", item: baseUrl },
  ];

  if (path.startsWith("/solar-carport")) {
    items.push({
      name: input.carportLabel ?? "Solar Carport",
      item: `${baseUrl}/solar-carport/`,
    });
    if (province) {
      // The 77-province hub is the browseable parent of every province page.
      // Without it in the trail, the 77 pages read as siblings promoted
      // straight into the results — the hierarchy Google calls out under
      // doorway abuse. Trailing slashes match the canonical URLs exactly.
      items.push({
        name: "77 จังหวัด",
        item: `${baseUrl}/provinces/`,
      });
      items.push({
        name: `Solar Carport ${province.nameTh}`,
        item: `${baseUrl}/solar-carport/${province.slug}/`,
      });
    }
  } else if (path !== "/") {
    items.push({
      name: title.split("|")[0].trim(),
      item: `${baseUrl}${path}`,
    });
  }

  return items;
}

export function buildSeoGraph(input: SeoGraphInput) {
  const {
    baseUrl,
    siteName,
    path,
    title,
    description,
    image,
    organizationDescription,
    service,
    areaServed,
    breadcrumbs,
    faq,
    article,
    howTo,
    inLanguage = "th-TH",
  } = input;

  const pageUrl = absolute(baseUrl, path);

  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: siteName,
      url: baseUrl,
      logo: image,
      description: organizationDescription,
      areaServed: {
        "@type": "Country",
        name: "Thailand",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        areaServed: "TH",
        availableLanguage: ["th", "en", "zh"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: siteName,
      url: baseUrl,
      inLanguage,
      publisher: { "@id": `${baseUrl}/#organization` },
    },
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description,
      isPartOf: { "@id": `${baseUrl}/#website` },
      about: { "@id": service.id },
      inLanguage,
    },
    {
      "@type": "Service",
      "@id": service.id,
      name: service.name,
      serviceType: service.serviceType,
      provider: { "@id": `${baseUrl}/#organization` },
      areaServed: {
        "@type": "AdministrativeArea",
        name: areaServed[0]?.name,
      },
      description,
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceSpecification: {
          "@type": "PriceSpecification",
          priceCurrency: "THB",
          description:
            "Project-specific quotation after site survey and engineering assessment.",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: entry.name,
        item: entry.item,
      })),
    },
  ];

  if (article) {
    graph.push({
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: article.headline,
      description,
      url: pageUrl,
      mainEntityOfPage: { "@id": `${pageUrl}#webpage` },
      isPartOf: { "@id": `${baseUrl}/#website` },
      about: { "@id": service.id },
      author: { "@id": `${baseUrl}/#organization` },
      publisher: { "@id": `${baseUrl}/#organization` },
      image,
      dateModified: article.dateModified,
      ...(article.wordCount ? { wordCount: article.wordCount } : {}),
      ...(article.section ? { articleSection: article.section } : {}),
      inLanguage,
    });
  }

  if (howTo && howTo.steps.length > 0) {
    graph.push({
      "@type": "HowTo",
      "@id": `${pageUrl}#howto`,
      name: howTo.name,
      description: howTo.description,
      ...(article ? { mainEntityOfPage: { "@id": `${pageUrl}#article` } } : {}),
      step: howTo.steps.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text,
      })),
      inLanguage,
    });
  }

  if (faq && faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map(item => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
