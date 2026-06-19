type Status = 'ready' | 'guarded' | 'needs_env';

type CommandCenterLane = {
  name: string;
  status: Status;
  scope: string;
  evidence: string;
};

const lanes: CommandCenterLane[] = [
  {
    name: 'API wiring',
    status: 'ready',
    scope: 'web-sirinx Express/tRPC, OZ static GET endpoints, OpenClaw preset routes',
    evidence: 'apps/web-sirinx test/build and OZ static smoke',
  },
  {
    name: 'Database access',
    status: 'guarded',
    scope: 'DATABASE_URL enables Drizzle/MySQL; public leads fall back to local JSONL queue',
    evidence: 'localLeadQueue and integration-health tests',
  },
  {
    name: 'Access allowlist',
    status: 'ready',
    scope: 'OpenClaw accepts preset command names only; raw argv, shell, env, cwd are rejected',
    evidence: '/api/openclaw/run source contract',
  },
  {
    name: 'Provider secrets',
    status: 'guarded',
    scope: 'Static readiness fixture only; live provider/API execution still requires approval and env gates',
    evidence: 'No provider call is wired from this local panel',
  },
];

const statusLabel: Record<Status, string> = {
  ready: 'Ready',
  guarded: 'Guarded',
  needs_env: 'Needs env',
};

const checks = [
  'pnpm --filter @sirinx/dev-command-center build',
  'pnpm --dir apps/web-sirinx test',
  'pnpm --dir apps/web-sirinx build',
  'pnpm --filter @sirinx/database build',
  'pnpm --filter @sirinx/ai-access-gateway build',
];

export default function App() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">SIRINXDev local fixture</p>
          <h1>Command Center Readiness Draft</h1>
        </div>
        <span className="gate">Static review only</span>
      </header>

      <section className="grid" aria-label="Readiness lanes">
        {lanes.map((lane) => (
          <article className="lane" key={lane.name}>
            <div className="laneHeader">
              <h2>{lane.name}</h2>
              <span className={`status ${lane.status}`}>{statusLabel[lane.status]}</span>
            </div>
            <p>{lane.scope}</p>
            <small>{lane.evidence}</small>
          </article>
        ))}
      </section>

      <section className="checks" aria-label="Verification commands">
        <h2>Verification</h2>
        <div className="commandList">
          {checks.map((check) => (
            <code key={check}>{check}</code>
          ))}
        </div>
      </section>
    </main>
  );
}
