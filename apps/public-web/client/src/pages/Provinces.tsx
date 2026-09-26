/**
 * Province index — the crawl hub for all 77 province Solar Carport pages.
 *
 * Every province is a plain anchor to its own page, so the whole set is reachable
 * by internal links instead of by sitemap alone.
 */
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Search } from "lucide-react";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/provinces";
import { thaiProvinces } from "@shared/thaiProvinces";
import { getProvincesForIndex } from "@/lib/routeSeoContent";

export default function Provinces() {
  const { t } = usePageTranslation("provinces");
  const [query, setQuery] = useState("");

  const provinces = useMemo(() => {
    const all = getProvincesForIndex(thaiProvinces);
    const needle = query.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      province =>
        province.nameTh.toLowerCase().includes(needle) ||
        province.nameEn.toLowerCase().includes(needle)
    );
  }, [query]);

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        data-sirinx-breadcrumb="provinces"
        className="container pt-6 text-sm text-text-secondary"
      >
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="underline-offset-4 hover:underline">
              หน้าแรก
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/solar-carport"
              className="underline-offset-4 hover:underline"
            >
              Solar Carport
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            77 จังหวัด
          </li>
        </ol>
      </nav>

      <section className="container py-12 lg:py-16">
        <span className="inline-flex items-center gap-2 rounded-full border border-border-accent bg-accent-glow px-3 py-1.5 text-xs font-semibold text-accent-primary">
          {t("pv.badge")}
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
          {t("pv.title")}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-secondary lg:text-base">
          {t("pv.intro")}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <label className="relative flex w-full max-w-sm items-center">
            <span className="sr-only">{t("pv.search")}</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 h-4 w-4 text-text-muted"
            />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={t("pv.search")}
              className="h-11 w-full rounded-lg border border-border-subtle bg-surface-elevated pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-accent-primary"
            />
          </label>
          <span className="text-sm text-text-muted">
            {provinces.length} {t("pv.count")}
          </span>
          <Link
            href="/solar-carport"
            className="text-sm text-text-secondary underline-offset-4 hover:underline"
          >
            {t("pv.backCarport")}
          </Link>
        </div>
      </section>

      <section className="container pb-16">
        {provinces.length === 0 ? (
          <p className="text-sm text-text-secondary">{t("pv.noResult")}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {provinces.map(province => (
              <li key={province.slug}>
                <Link
                  href={`/solar-carport/${province.slug}`}
                  data-sirinx-province={province.slug}
                  className="flex h-full items-center justify-between gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3 text-sm text-foreground transition-colors hover:border-accent-primary"
                >
                  <span className="min-w-0 truncate">
                    <span className="block truncate">{province.nameTh}</span>
                    <span className="block truncate text-xs text-text-muted">
                      {province.nameEn}
                    </span>
                  </span>
                  <span className="sr-only">{t("pv.visit")}</span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-accent-primary"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="container pb-20">
        <div className="glass-card flex flex-col items-start gap-5 rounded-2xl p-7 lg:flex-row lg:items-center lg:justify-between lg:p-9">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground lg:text-2xl">
              {t("pv.cta.title")}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-text-secondary">
              {t("pv.cta.desc")}
            </p>
          </div>
          <Link
            href="/contact?interest=solar-carport"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 font-display font-semibold btn-accent"
          >
            {t("pv.cta.btn")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
