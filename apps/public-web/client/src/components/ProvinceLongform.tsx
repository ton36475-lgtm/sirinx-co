/**
 * ProvinceLongform — renders the deep-dive province content from
 * shared/provinceLongform.ts (12,000-word standard).
 *
 * Text-only (no WebGL): mounted as a lazy chunk from SolarCarport.tsx so the
 * long-form payload stays out of the province page bundle. Renders nothing
 * when the province has no long-form entry yet.
 */
import { type LongformSection } from "@shared/provinceLongform";
import { Link } from "wouter";
import {
  getProvinceLongformEntry,
  getProvinceSiblings,
  type ResolvedLongform,
} from "@shared/provinceLongformResolver";
import { buildProvinceMonthlyFigure } from "@shared/provinceLongformFigure";

function Section({ section }: { section: LongformSection }) {
  return (
    <div className="mt-10">
      <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground">
        {section.h2}
      </h2>
      <div className="mt-4 space-y-4">
        {section.blocks.map((block, i) => {
          if (block.type === "h3") {
            return (
              <h3
                key={i}
                className="font-display text-lg font-semibold text-foreground pt-2"
              >
                {block.text}
              </h3>
            );
          }
          if (block.type === "list") {
            return (
              <ul
                key={i}
                className="list-disc pl-5 space-y-2 text-sm lg:text-base leading-relaxed text-text-secondary"
              >
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          }
          return (
            <p
              key={i}
              className="text-sm lg:text-base leading-relaxed text-text-secondary"
            >
              {block.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default function ProvinceLongform({ slug }: { slug: string }) {
  const entry: ResolvedLongform | null = getProvinceLongformEntry(slug);
  if (!entry) return null;
  // Shared markup with the prerender renderer (provinceLongformHtml) so the
  // static document and this hydrated view show the identical province figure.
  const figureHtml = buildProvinceMonthlyFigure(slug);
  return (
    <section
      className="py-14 lg:py-20 bg-background"
      data-sirinx-longform={slug}
      aria-label={`${entry.nameTh} — บทความเชิงลึก`}
    >
      <div className="container max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-text-secondary">
          <Link href="/">หน้าแรก</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/solar-carport/">Solar Carport</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/provinces/">77 จังหวัด</Link>
          <span aria-hidden="true"> / </span>
          <span>{entry.nameTh}</span>
        </nav>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground">
          Solar Carport ใน{entry.nameTh}
        </h1>
        <div className="space-y-4">
          {entry.intro.map((text) => (
            <p
              key={text.slice(0, 32)}
              className="text-sm lg:text-base leading-relaxed text-text-secondary"
            >
              {text}
            </p>
          ))}
        </div>
        {figureHtml ? (
          <div
            className="mt-10"
            dangerouslySetInnerHTML={{ __html: figureHtml }}
          />
        ) : null}
        {entry.sections.map((section) => (
          <Section key={section.h2} section={section} />
        ))}
        <div className="mt-12 rounded-2xl border border-border-subtle bg-surface-elevated p-6 lg:p-8">
          <p className="text-sm lg:text-base leading-relaxed text-foreground">
            {entry.cta}
          </p>
          <a
            href="/contact"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-primary"
          >
            นัดสำรวจหน้างาน →
          </a>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="font-display text-lg font-bold">จังหวัดอื่นในระบบเดียวกัน</h2>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {getProvinceSiblings(slug).map((sibling) => (
              <li key={sibling.slug}>
                <Link href={`/solar-carport/${sibling.slug}/`}>{sibling.nameTh}</Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm">
            <Link href="/provinces/">ดูทั้ง 77 จังหวัด →</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
