/**
 * buildProvinceLongformHtml — pure renderer of the province long-form into
 * prerender HTML for server/staticSeoBuild.ts.
 *
 * The client shows the same content from a lazy chunk, but AI/answer-engine
 * crawlers and a large share of search crawlers do not execute JS — the
 * word standard only counts if the words are in the static HTML.
 *
 * Content comes through shared/provinceLongformResolver: the hand-written entry
 * wins, generated provinces fall back to provinceLongformGenerated, so every
 * province with long-form content gets the full article in its static HTML.
 */
import {
  type LongformSection,
  type ProvinceLongform,
} from "./provinceLongform";
import { getProvinceLongformEntry, getProvinceSiblings } from "./provinceLongformResolver";
import { buildProvinceMonthlyFigure } from "./provinceLongformFigure";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function renderSection(section: LongformSection): string {
  const blocks = section.blocks
    .map((block) => {
      if (block.type === "h3") {
        return `        <h3 class="font-display text-lg font-semibold pt-2">${escapeHtml(block.text)}</h3>`;
      }
      if (block.type === "list") {
        const items = block.items
          .map((item) => `          <li>${escapeHtml(item)}</li>`)
          .join("\n");
        return `        <ul class="list-disc pl-5 space-y-2">\n${items}\n        </ul>`;
      }
      return `        <p class="leading-relaxed">${escapeHtml(block.text)}</p>`;
    })
    .join("\n");

  return `      <section class="mt-10">
        <h2 class="font-display text-xl lg:text-2xl font-bold">${escapeHtml(section.h2)}</h2>
        <div class="mt-4 space-y-4">
${blocks}
        </div>
      </section>`;
}

function renderEntry(entry: ProvinceLongform): string {
  const intro = entry.intro
    .map((text) => `        <p class="leading-relaxed">${escapeHtml(text)}</p>`)
    .join("\n");
  // The province figure is shared markup with the client component, so the
  // static document and the hydrated page render the identical figure.
  const figure = buildProvinceMonthlyFigure(entry.slug) ?? "";
  const sections = entry.sections.map(renderSection).join("\n");
  // A province page used to ship with a single <a> and no breadcrumb, so the
  // 77 pages were link islands reachable only from the sitemap. These links
  // give a non-JS crawler the same hierarchy the client-side nav provides.
  const breadcrumb = `        <nav aria-label="Breadcrumb" class="mb-6 text-sm text-text-secondary">
          <a href="/" class="underline-offset-4 hover:underline">หน้าแรก</a>
          <span aria-hidden="true"> / </span>
          <a href="/solar-carport/" class="underline-offset-4 hover:underline">Solar Carport</a>
          <span aria-hidden="true"> / </span>
          <a href="/provinces/" class="underline-offset-4 hover:underline">77 จังหวัด</a>
          <span aria-hidden="true"> / </span>
          <span>${escapeHtml(entry.nameTh)}</span>
        </nav>`;
  const siblings = getProvinceSiblings(entry.slug)
    .map(
      (sibling) =>
        `            <li><a href="/solar-carport/${escapeHtml(sibling.slug)}/" class="underline-offset-4 hover:underline">${escapeHtml(sibling.nameTh)}</a></li>`,
    )
    .join("\n");
  const related = siblings
    ? `
        <div class="mt-12 border-t border-border pt-8">
          <h2 class="font-display text-lg font-bold">จังหวัดอื่นในระบบเดียวกัน</h2>
          <ul class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
${siblings}
          </ul>
          <p class="mt-4 text-sm"><a href="/provinces/" class="underline-offset-4 hover:underline">ดูทั้ง 77 จังหวัด →</a></p>
        </div>`
    : `
        <div class="mt-12 border-t border-border pt-8">
          <p class="text-sm"><a href="/provinces/" class="underline-offset-4 hover:underline">ดูทั้ง 77 จังหวัด →</a></p>
        </div>`;
  return `<main data-sirinx-static-shell="province-longform" data-sirinx-longform="${escapeHtml(entry.slug)}">
      <section class="bg-background px-4 py-16 text-foreground sm:px-6 lg:py-20">
        <article class="container mx-auto max-w-3xl">
${breadcrumb}
        <h1 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground">Solar Carport ใน${escapeHtml(entry.nameTh)}</h1>
        <div class="space-y-4">
${intro}
        </div>
${figure}
${sections}
        <div class="mt-12 rounded-2xl border border-border bg-card p-6 lg:p-8">
          <p class="leading-relaxed">${escapeHtml(entry.cta)}</p>
          <p class="mt-4"><a href="/contact" class="font-medium">นัดสำรวจหน้างาน →</a></p>
        </div>${related}
        </article>
      </section>
    </main>`;
}

/**
 * Returns the prerender shell for a province with long-form content,
 * or null when the route has no entry (fall back to the generic shell).
 * Accepts a route (`/solar-carport/bangkok`) or a bare slug (`bangkok`).
 */
export function buildProvinceLongformHtml(routeOrSlug: string): string | null {
  const routeMatch = routeOrSlug.match(/^\/solar-carport\/([^/]+)\/?$/);
  const slug = routeMatch ? routeMatch[1] : routeOrSlug;
  if (slug.includes("/")) return null;
  const entry = getProvinceLongformEntry(slug);
  if (!entry) return null;
  return renderEntry(entry);
}
