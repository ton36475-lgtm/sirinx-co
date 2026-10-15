/**
 * BESS service page — first-class React surface for the ported local-only prototype.
 *
 * Data comes straight from bess-master.json (single source, conflicts stay
 * conflicts — council verdict 2026-10-15). This page makes no sizing, ROI,
 * compatibility or PEA claims: those are prohibited outputs in the master
 * and remain pending exact-SKU datasheet confirmation.
 */
import { bessProduct, bessKnowledge, bessPending, bessMaster } from "@shared/bessProductMaster";
import { usePageTranslation } from "@/i18n";
import "@/i18n/pages/bess";

function StatusChip({ status }: { status: string }) {
  const cls = status.includes("conflict")
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export default function BessService() {
  const { t } = usePageTranslation("bess");
  const conflict = bessProduct.conflicts[0];
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
        {t("sg.tag")}
      </p>
      <h1 className="mb-4 text-3xl font-bold">{t("sg.title")}</h1>
      <p className="mb-8 text-lg text-text-secondary">{t("sg.lede")}</p>

      <div className="mb-10 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
        <strong>DEMO — NOT CONNECTED.</strong> {t("sg.demoNote")}
      </div>

      <h2 className="mb-4 text-2xl font-semibold">{t("sg.productTitle")}</h2>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm">{bessProduct.model}</span>
        <span className="text-sm text-text-secondary">{bessProduct.manufacturer}</span>
        <StatusChip status={bessProduct.recordStateLabel || bessProduct.recordState} />
      </div>
      <dl className="mb-10 grid gap-2 sm:grid-cols-2">
        {bessProduct.specifications.map((s) => (
          <div key={s.label} className="rounded-lg border border-border-subtle bg-surface-elevated p-3">
            <dt className="text-xs text-text-secondary">{s.label}</dt>
            <dd className="font-medium">
              {s.value} <StatusChip status={s.status} />
            </dd>
          </div>
        ))}
      </dl>

      {conflict && (
        <div className="mb-10 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
          <h3 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">
            {t("sg.conflictTitle")}: {conflict.field}
          </h3>
          <p className="mb-2 text-sm">{conflict.details}</p>
          <ul className="list-inside list-disc text-sm font-mono">
            {conflict.values.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="mb-4 text-2xl font-semibold">{t("sg.knowledgeTitle")}</h2>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {bessKnowledge.map((k) => (
          <article key={k.id} className="rounded-xl border border-border-subtle p-4">
            <h3 className="mb-2 font-semibold">{k.title}</h3>
            <p className="text-sm text-text-secondary">{k.summary}</p>
            <p className="mt-2 text-xs text-text-secondary">
              {t("sg.state")}: {k.state}
            </p>
          </article>
        ))}
      </div>

      <h2 className="mb-4 text-2xl font-semibold">{t("sg.pendingTitle")}</h2>
      <ul className="mb-10 list-inside list-disc text-sm text-text-secondary">
        {bessPending.map((e) => (
          <li key={e.id}>
            <strong className="text-foreground">{e.subject}</strong> — {e.status}
          </li>
        ))}
      </ul>

      <h2 className="mb-4 text-2xl font-semibold">{t("sg.sourcesTitle")}</h2>
      <ul className="mb-10 grid gap-2 text-sm">
        {bessMaster.sources.map((s) => (
          <li key={s.id} className="rounded-lg border border-border-subtle bg-surface-elevated p-3">
            <span className="font-medium">{s.publisher}</span>{" "}
            <span className="text-text-secondary">— {s.status}</span>{" "}
            {s.url && (
              <a href={s.url} className="text-primary-600 underline dark:text-primary-400" rel="nofollow noopener">
                {s.id}
              </a>
            )}
          </li>
        ))}
      </ul>

      <p className="text-xs text-text-secondary">
        {t("sg.reviewedAt")}: {bessMaster.reviewedAt} · {bessMaster.reviewBoundary}
      </p>
    </div>
  );
}
