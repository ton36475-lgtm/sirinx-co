import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  GitBranch,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

type StatusTone = "pass" | "blocked" | "pending";

const statusCards: Array<{
  title: string;
  status: string;
  tone: StatusTone;
  detail: string;
}> = [
  {
    title: "Dependency layout repair",
    status: "local verified",
    tone: "pass",
    detail:
      "apps/public-web dependencies are present and the package check/build path is available for local validation.",
  },
  {
    title: "Local validation status",
    status: "green except /goal red test now resolved by this page",
    tone: "pass",
    detail:
      "Use this surface to keep root verification, public-web checks, and browser UAT status visible before any remote gate.",
  },
  {
    title: "Push blocked by GitHub credential",
    status: "blocked",
    tone: "blocked",
    detail:
      "The last approved push attempt stopped before remote mutation because the HTTPS credential was unavailable on this Mac.",
  },
  {
    title: "Competitor SWOT/AEO backlog",
    status: "documented",
    tone: "pending",
    detail:
      "AEO and conversion opportunities are captured as a backlog. Public copy changes still require review before publishing.",
  },
];

const gateSteps = [
  "Keep website source changes local and reviewable.",
  "Pass public-web tests, typecheck, build, and static verifiers.",
  "Refresh evidence so it matches the current branch head.",
  "Repair GitHub credentials or provide an exact remote-auth gate.",
  "Push only after the exact branch and command are confirmed.",
  "Run browser UAT before any deploy target is approved.",
];

const safetyBoundaryCopy =
  "No deploy, webhook, production analytics, CRM, or customer data storage";

const projectLanes = [
  "SIRINX_SOLAR / sirinx.co",
  "POCKET_HATCHERY",
  "AGM_CREATIVE",
  "ADS_ANDROMEDA",
  "PHITSANULOK_NEWS",
  "GhostClaw OS",
  "SIRINXDev Agent-Native Monorepo",
];

function toneClasses(tone: StatusTone) {
  if (tone === "pass") {
    return {
      icon: CheckCircle2,
      badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
      ring: "border-emerald-400/20",
    };
  }

  if (tone === "blocked") {
    return {
      icon: AlertTriangle,
      badge: "border-amber-400/30 bg-amber-400/10 text-amber-100",
      ring: "border-amber-400/20",
    };
  }

  return {
    icon: CircleDashed,
    badge: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
    ring: "border-cyan-400/20",
  };
}

export default function GoalDependencyLayout() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.22),transparent_36%),linear-gradient(135deg,rgba(15,23,42,1),rgba(2,6,23,1))] px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pt-32">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-100">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Internal readiness surface
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Goal dependency layout
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              A local-only control view for public-web readiness, evidence
              freshness, and release gates before push, review, or deployment.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md">
              <p className="text-sm font-semibold text-slate-400">
                Current mode
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Local first
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {safetyBoundaryCopy}.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md">
              <p className="text-sm font-semibold text-slate-400">
                Release dependency
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Evidence first
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Push and deploy gates remain blocked until validation and human
                review match the current branch head.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md">
              <p className="text-sm font-semibold text-slate-400">
                Automation boundary
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                Governed
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Broad approval language is recorded as local automation only
                unless an exact executable gate is supplied.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {statusCards.map(card => {
              const tone = toneClasses(card.tone);
              const Icon = tone.icon;

              return (
                <article
                  key={card.title}
                  className={`rounded-xl border bg-slate-900/40 p-6 backdrop-blur-md ${tone.ring}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <Icon className="mt-1 h-5 w-5 text-emerald-200" aria-hidden="true" />
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}
                    >
                      {card.status}
                    </span>
                  </div>
                  <h2 className="mt-5 text-lg font-semibold tracking-tight text-white">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {card.detail}
                  </p>
                </article>
              );
            })}
          </div>

          <aside className="rounded-xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Next gate order
              </h2>
            </div>
            <ol className="mt-6 space-y-4">
              {gateSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-xs font-semibold text-cyan-100">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm leading-6 text-slate-300">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-emerald-200" aria-hidden="true" />
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Safety locks
              </h2>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
              <p>Push requires a working GitHub credential and exact command.</p>
              <p>Deploy requires an exact target and deploy command.</p>
              <p>LINE webhook, analytics, and CRM remain separate gates.</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-md">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Governed project lanes
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {projectLanes.map(lane => (
                <div
                  key={lane}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-200"
                >
                  {lane}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
