export type WorkflowStage = 'route' | 'analyze' | 'create' | 'validate' | 'deliver';
export type AgentRole = 'Hermes' | 'Analyst' | 'Creator' | 'Validator' | 'Delivery';
export type ExecutionMode = 'standard' | 'specialist-lane';
export type SpecialistLane = 'DatabaseSteward' | 'Mentor' | 'Apprentice' | null;
export interface RequiredContext {
    brand_facts: boolean;
    field_context: boolean;
    repo_paths: string[];
    bundle_paths: string[];
    telemetry_inputs: string[];
    financial_inputs: string[];
    database_inputs?: string[];
    brain_skill_inputs?: string[];
    approval_packet_refs?: string[];
    training_packet_refs?: string[];
}
export interface SafetyConstraints {
    locked_facts_required: boolean;
    no_marketing_claims_without_analysis: boolean;
    no_global_fact_mutation: boolean;
    server_ready_hold_mode: boolean;
    production_db_change_requires_approval?: boolean;
    mentor_packet_required_for_apprentice?: boolean;
    server_bootstrap_requires_validators?: boolean;
}
export interface ValidationChecks {
    schema_ok: boolean;
    paths_exist: boolean;
    fact_lock_passed: boolean;
    handoff_ready: boolean;
}
export interface OrchestrationEnvelope {
    task_id: string;
    workflow_stage: WorkflowStage;
    source_request: string;
    assigned_agent: AgentRole;
    required_context: RequiredContext;
    constraints: SafetyConstraints;
    execution_mode?: ExecutionMode;
    specialist_lane?: SpecialistLane;
    input_payload: Record<string, any>;
    output_payload: Record<string, any>;
    validation: ValidationChecks;
    next_agent: AgentRole | null;
    fallback_queue_reason: string | null;
}
export interface AuditResult {
    valid: boolean;
    errors: string[];
    remediation?: string[];
}
export declare class OrchestrationEnvelopeValidator {
    /**
     * Runs a complete structural and policy audit on a multi-agent transition envelope
     */
    static audit(envelope: any): AuditResult;
}
//# sourceMappingURL=validator.d.ts.map