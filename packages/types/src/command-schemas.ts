export type RiskClass = "C0" | "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7";

export type CommandEnvelope = {
  id: string;
  requestedBy: "mobile" | "telegram" | "dashboard" | "codex" | "hermes";
  target: "mac-control-plane" | "windows-worker-node" | "cloudflare-edge" | "github";
  action: "status" | "gates" | "sync-plan" | "emergency-stop" | "preview-send";
  riskClass: RiskClass;
  requiresApproval: boolean;
  dryRunFirst: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type NodeHeartbeat = {
  nodeId: string;
  nodeType: "control-plane" | "worker" | "mobile" | "edge";
  hostname: string;
  status: "healthy" | "degraded" | "offline";
  capabilities: string[];
  blockedCapabilities: string[];
  currentJobs: string[];
  queueDepth: number;
  lastCheckedAt: string;
  version: string;
};
