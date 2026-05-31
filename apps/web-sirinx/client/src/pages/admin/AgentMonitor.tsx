import {
  Activity,
  BatteryCharging,
  Brain,
  Database,
  Gauge,
  HardDrive,
  Radio,
  ServerCog,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  MULTI_AGENT_ROSTER,
  SPECIALIST_LANE_ROSTER,
  type AgentId,
  type AgentState,
} from "@shared/_core/agentContracts";

type AgentNode = {
  id: AgentId;
  name: string;
  role: string;
  state: AgentState;
  latencyMs: number;
  queue: number;
  icon: typeof Brain;
  accent: string;
};

const stateStyles: Record<AgentState, string> = {
  Standby: "border-slate-500/30 bg-slate-500/10 text-slate-200",
  Thinking: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  "Analyzing Hardware": "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  Executing: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
};

const agentVisuals: Record<AgentId, Pick<AgentNode, "icon" | "accent" | "state" | "latencyMs" | "queue">> = {
  Hermes: {
    state: "Thinking",
    latencyMs: 118,
    queue: 3,
    icon: Brain,
    accent: "from-amber-300/30 to-yellow-700/10",
  },
  Analyst: {
    state: "Analyzing Hardware",
    latencyMs: 132,
    queue: 2,
    icon: BatteryCharging,
    accent: "from-cyan-300/25 to-blue-900/10",
  },
  Creator: {
    state: "Standby",
    latencyMs: 94,
    queue: 1,
    icon: Workflow,
    accent: "from-zinc-300/20 to-stone-700/10",
  },
  Validator: {
    state: "Executing",
    latencyMs: 86,
    queue: 4,
    icon: ShieldCheck,
    accent: "from-emerald-300/25 to-green-900/10",
  },
  Delivery: {
    state: "Executing",
    latencyMs: 146,
    queue: 5,
    icon: ServerCog,
    accent: "from-orange-300/25 to-amber-900/10",
  },
};

const baseAgents: AgentNode[] = MULTI_AGENT_ROSTER.map((agent) => ({
  id: agent.id,
  name: agent.label,
  role: agent.responsibility,
  ...agentVisuals[agent.id],
}));

const memoryChunks = [
  "pgvector: ROI_SCENARIO_MODEL_250K_TO_50K_70K :: assumptions-only retrieval",
  "pgvector: FIELD_OBSERVED_SOLIS_EMS_INTERFACE :: telemetry schema boundary",
  "pgvector: LISINER_BESS_CHILLER_HEALTH :: thermal review thresholds",
  "pgvector: SIRINX_PACKAGE_TRUTH :: START / PRO / ENTERPRISE BESS guardrail",
  "pgvector: HANDOFF_BUNDLE_MANIFEST :: required files and exclusions",
];

const activityFeed = [
  "Hermes emitted routing JSON and blocked direct ROI calculation in the control plane.",
  "Cyber-Physical Analyst marked Solis EMS freshness target at 1-5 minutes for read-only dashboards.",
  "Validator confirmed field context did not overwrite package truth.",
  "Delivery rebuilt the handoff bundle only after path and schema checks passed.",
];

const specialistLaneFeed = [
  "Database Steward keeps PostgreSQL/pgvector bootstrap in dry-run mode until approval is present.",
  "Mentor emits starter packets so junior agents inherit exact scope, validator gates, and escalation rules.",
  "Apprentice runs only deterministic checks and returns evidence instead of improvising infrastructure changes.",
];

export default function AgentMonitor() {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPulse((value) => (value + 1) % 4);
    }, 1800);

    return () => window.clearInterval(timer);
  }, []);

  const agents = useMemo(
    () =>
      baseAgents.map((agent, index) => ({
        ...agent,
        latencyMs: agent.latencyMs + ((pulse + index) % 3) * 7,
      })),
    [pulse],
  );

  return (
    <div className="min-h-[calc(100vh-3rem)] overflow-hidden rounded-[2rem] border border-amber-400/15 bg-[#0b0d10] text-slate-100 shadow-2xl shadow-black/40">
      <div className="relative overflow-hidden border-b border-white/10 px-5 py-6 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,197,92,0.2),transparent_30%),radial-gradient(circle_at_top_right,rgba(80,120,160,0.18),transparent_35%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
              <Radio className="h-3.5 w-3.5" />
              Internal Control Plane
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
              Omniscient Agent Monitor
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Premium ops view for n8n queue workers, pgvector retrieval activity, and
              read-only Solis EMS / LISINER BESS telemetry. This screen is an internal
              dashboard scaffold for `ops.sirinx.co`; production hooks require Zero Trust,
              SSO, MFA, and human approval.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <StatusPill label="Redis/BullMQ" value="Queue Mode" />
            <StatusPill label="PostgreSQL" value="pgvector" />
            <StatusPill label="Mobile" value="Read Only" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 md:p-8 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {agents.map((agent) => (
              <article
                key={agent.name}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#11151b] p-5 shadow-xl shadow-black/25"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${agent.accent} opacity-80 transition-opacity group-hover:opacity-100`} />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/25 bg-black/30 text-amber-200 shadow-inner">
                      <agent.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-white">{agent.name}</h2>
                      <p className="text-xs text-slate-300">{agent.role}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${stateStyles[agent.state]}`}>
                    {agent.state}
                  </span>
                </div>

                <div className="relative mt-5 grid grid-cols-3 gap-3 text-sm">
                  <Metric icon={Activity} label="Latency" value={`${agent.latencyMs}ms`} />
                  <Metric icon={Workflow} label="Queue" value={`${agent.queue}`} />
                  <Metric icon={ShieldCheck} label="Scope" value="Internal" />
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#11151b] p-5 shadow-xl shadow-black/25">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Live State Mapping</h2>
                <p className="text-xs text-slate-400">
                  WebSocket or Redis pub/sub events map workers to controlled states.
                </p>
              </div>
              <Gauge className="h-5 w-5 text-amber-200" />
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {Object.keys(stateStyles).map((state, index) => (
                <div key={state} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${index === pulse ? "bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.85)]" : "bg-slate-500"}`} />
                    <span className="text-sm font-semibold text-white">{state}</span>
                  </div>
                  <p className="text-xs leading-5 text-slate-400">
                    {stateDescriptions[state as AgentState]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#11151b] p-5 shadow-xl shadow-black/25">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">Specialist Lanes</h2>
                <p className="text-xs text-slate-400">
                  Support lanes extend the core workflow for DB bootstrap and junior-agent enablement.
                </p>
              </div>
              <ServerCog className="h-5 w-5 text-amber-200" />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {SPECIALIST_LANE_ROSTER.map((lane) => (
                <div key={lane.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-2 flex items-center gap-2 text-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.65)]" />
                    <span className="font-semibold">{lane.label}</span>
                  </div>
                  <p className="text-xs leading-5 text-slate-300">{lane.responsibility}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-amber-300/15 bg-[#101115] p-5 shadow-xl shadow-black/25">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Vector Memory Feed</h2>
              <Database className="h-5 w-5 text-amber-200" />
            </div>
            <div className="space-y-3">
              {memoryChunks.map((chunk, index) => (
                <div key={chunk} className="rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-xs leading-5 text-slate-300">
                  <span className="text-amber-200">0{index + 1}</span> {chunk}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#101115] p-5 shadow-xl shadow-black/25">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Activity Feed</h2>
              <HardDrive className="h-5 w-5 text-amber-200" />
            </div>
            <div className="space-y-3">
              {activityFeed.map((event, index) => (
                <div key={event} className="flex gap-3 rounded-2xl bg-black/25 p-3 text-sm leading-6 text-slate-300">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.75)]" />
                  <div>
                    <p>{event}</p>
                    <p className="mt-1 text-xs text-slate-500">T-{index + 1}m / audit retained</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#101115] p-5 shadow-xl shadow-black/25">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Mentor Ladder</h2>
              <Brain className="h-5 w-5 text-amber-200" />
            </div>
            <div className="space-y-3">
              {specialistLaneFeed.map((event, index) => (
                <div key={event} className="rounded-2xl bg-black/25 p-3 text-sm leading-6 text-slate-300">
                  <p>{event}</p>
                  <p className="mt-1 text-xs text-slate-500">Lane checkpoint {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const stateDescriptions: Record<AgentState, string> = {
  Standby: "Idle, authenticated, and waiting for queue-safe work.",
  Thinking: "Planning with governance guardrails before execution.",
  "Analyzing Hardware": "Reading Solis/LISINER metrics as internal telemetry only.",
  Executing: "Running an approved worker action with audit trail enabled.",
};

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-amber-200">{value}</p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}
