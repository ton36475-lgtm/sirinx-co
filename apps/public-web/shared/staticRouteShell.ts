import { getPageMeta } from "../server/ogTags";

/**
 * Static shell for routes that are otherwise client-rendered.
 *
 * Commercial routes (/pricing, /projects, /assessment, /solar-carport) used
 * to ship an empty #root in the server HTML: zero visible characters, zero
 * H1. Crawlers and answer engines that do not execute JavaScript, which is
 * most AI crawlers, saw a <title> and nothing else.
 *
 * The wording comes from getPageMeta, the same registry that produces the
 * <title> and meta description, so it cannot drift from the page it mirrors
 * and no text is invented here.
 */
export function buildStaticRouteShell(
  route: string,
  options: { escapeHtml?: (value: string) => string } = {}
): string | null {
  const escape =
    options.escapeHtml ??
    ((value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;"));

  const meta = getPageMeta(route);
  if (!meta?.title) return null;

  const title = escape(meta.title);
  const description = escape(meta.description ?? "");

  return `<main data-sirinx-static-shell="route">
      <section class="bg-background px-4 py-16 text-foreground sm:px-6 lg:py-24">
        <div class="container mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" class="mb-6 text-sm text-text-secondary">
            <a href="/" class="underline-offset-4 hover:underline">หน้าแรก</a>
            <span aria-hidden="true"> / </span>
            <span>${title}</span>
          </nav>
          <h1 class="font-display text-3xl font-bold leading-tight sm:text-4xl">${title}</h1>
          ${
            description
              ? `<p class="mt-5 max-w-3xl text-base leading-relaxed text-text-secondary">${description}</p>`
              : ""
          }
          <div class="mt-10 flex flex-wrap gap-4">
            <a href="/contact?interest=solar-carport" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent">ส่งข้อมูลโครงการ</a>
            <a href="/provinces/" class="inline-flex items-center justify-center rounded-lg px-6 py-3.5 font-display font-semibold btn-accent-outline">ดูบริการ 77 จังหวัด</a>
          </div>
        </div>
      </section>
    </main>`;
}

/** Visible text a crawler would see, used by the regression test. */
export function visibleTextOf(html: string): string {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) ?? [])[1] ?? "";
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
