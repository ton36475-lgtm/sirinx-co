export const WORKFLOW_STAGES = ["route", "analyze", "create", "validate", "deliver"] as const;
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export const ORCHESTRATION_EXECUTION_MODES = ["standard", "specialist-lane"] as const;
export type OrchestrationExecutionMode = (typeof ORCHESTRATION_EXECUTION_MODES)[number];

export const AGENT_STATES = ["Standby", "Thinking", "Analyzing Hardware", "Executing"] as const;
export type AgentState = (typeof AGENT_STATES)[number];

export const AGENT_IDS = ["Hermes", "Analyst", "Creator", "Validator", "Delivery"] as const;
export type AgentId = (typeof AGENT_IDS)[number];

export const SPECIALIST_LANES = ["DatabaseSteward", "Mentor", "Apprentice"] as const;
export type SpecialistLane = (typeof SPECIALIST_LANES)[number];

export type MultiAgentRole = {
  id: AgentId;
  label: string;
  stage: WorkflowStage;
  responsibility: string;
  forbiddenActions: string[];
};

export type SpecialistLaneRole = {
  id: SpecialistLane;
  label: string;
  responsibility: string;
  outputs: string[];
  forbiddenActions: string[];
};

export const MULTI_AGENT_ROSTER: MultiAgentRole[] = [
  {
    id: "Hermes",
    label: "Hermes Orchestrator",
    stage: "route",
    responsibility: "Route tasks and emit orchestration JSON only.",
    forbiddenActions: ["ROI calculation", "marketing copy generation", "live deployment"],
  },
  {
    id: "Analyst",
    label: "Cyber-Physical Analyst",
    stage: "analyze",
    responsibility: "Process telemetry, ROI assumptions, TOU logic, and field hardware context.",
    forbiddenActions: ["brand copy writing", "global package truth mutation"],
  },
  {
    id: "Creator",
    label: "Sovereign Creator",
    stage: "create",
    responsibility: "Transform validated analysis into executive-ready narrative and handoff copy.",
    forbiddenActions: ["number changes", "hardware assumption changes"],
  },
  {
    id: "Validator",
    label: "Validator Agent",
    stage: "validate",
    responsibility: "Check schemas, file existence, fact locks, and bundle completeness.",
    forbiddenActions: ["new fact creation", "live environment changes"],
  },
  {
    id: "Delivery",
    label: "Delivery Agent",
    stage: "deliver",
    responsibility: "Assemble deployment and handoff bundle from validated artifacts only.",
    forbiddenActions: ["false completion claims", "secret injection", "production cutover"],
  },
];

export const SPECIALIST_LANE_ROSTER: SpecialistLaneRole[] = [
  {
    id: "DatabaseSteward",
    label: "Database Steward Lane",
    responsibility:
      "Prepare PostgreSQL and pgvector readiness, backup posture, migration safety, and DB bootstrap packets for Hermes-controlled server setup.",
    outputs: [
      "DB bootstrap packet",
      "preflight findings",
      "backup and PITR readiness notes",
    ],
    forbiddenActions: [
      "destructive production SQL",
      "secret injection",
      "unapproved migration cutover",
    ],
  },
  {
    id: "Mentor",
    label: "Senior Mentor Lane",
    responsibility:
      "Convert approved runbooks and validated outputs into training packets so junior agents can execute deterministic setup tasks.",
    outputs: [
      "mentor packet",
      "starter checklist",
      "escalation notes",
    ],
    forbiddenActions: [
      "granting new privileges",
      "inventing architecture facts",
      "bypassing validator gates",
    ],
  },
  {
    id: "Apprentice",
    label: "Junior Apprentice Lane",
    responsibility:
      "Execute only the deterministic steps delegated by Mentor and Hermes using approved packets, then return evidence to Validator.",
    outputs: [
      "execution evidence",
      "path checks",
      "status handoff",
    ],
    forbiddenActions: [
      "improvised system changes",
      "production cutover",
      "running without mentor packet",
    ],
  },
];

export const MULTI_AGENT_GUARDRAILS = [
  "Brand = SIRINX",
  "Preserve locked package truth exactly",
  "Treat LISINER, Solis EMS, and 250k-to-50k-70k only as field context or scenario models",
  "Stop at SERVER-READY HOLD MODE without explicit deployment authorization",
  "Use DatabaseSteward and Mentor specialist lanes for DB bootstrap and junior-agent enablement instead of granting broader autonomy",
] as const;
