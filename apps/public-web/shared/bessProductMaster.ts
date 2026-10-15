/**
 * bessProductMaster.ts — typed, read-only view over the ported BESS prototype data.
 *
 * Council verdict 2026-10-15: keep bess-master.json as the single source (no
 * hand-porting values into code), conflicts stay conflicts. This module only
 * imports the JSON and narrows its shape for React pages — never edits values.
 */
import master from "../client/public/prototypes/data/bess-master.json";

export interface BessSpecification {
  label: string;
  value: string;
  status: string;
}

export interface BessConflict {
  field: string;
  details: string;
  values: string[];
}

export interface BessProduct {
  id: string;
  manufacturer: string;
  model: string;
  recordState: string;
  recordStateLabel: string;
  specifications: BessSpecification[];
  conflicts: BessConflict[];
}

export interface BessKnowledgeRecord {
  id: string;
  topic: string;
  title: string;
  state: string;
  summary: string;
  sources: string[];
}

export const bessMaster = master as unknown as {
  schemaVersion: string;
  recordSet: string;
  reviewedAt: string;
  reviewBoundary: string;
  sources: Array<{ id: string; publisher: string; title: string; url: string; reviewedAt: string; status: string; scope: string }>;
  knowledgeRecords: BessKnowledgeRecord[];
  products: BessProduct[];
  pendingEvidence: Array<{ id: string; subject: string; status: string; details: string; sourceIds: string[] }>;
  prohibitedOutputs: string[];
};

export const bessProduct = bessMaster.products[0];
export const bessKnowledge = bessMaster.knowledgeRecords;
export const bessPending = bessMaster.pendingEvidence;
