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

export class OrchestrationEnvelopeValidator {
  /**
   * Runs a complete structural and policy audit on a multi-agent transition envelope
   */
  static audit(envelope: any): AuditResult {
    const errors: string[] = [];
    const remediation: string[] = [];

    // 1. Structural Checks
    if (!envelope || typeof envelope !== 'object') {
      return { valid: false, errors: ['Envelope must be a non-null object.'] };
    }

    const requiredFields = [
      'task_id',
      'workflow_stage',
      'source_request',
      'assigned_agent',
      'required_context',
      'constraints',
      'input_payload',
      'output_payload',
      'validation',
      'next_agent',
      'fallback_queue_reason',
    ];

    for (const field of requiredFields) {
      if (!(field in envelope)) {
        errors.push(`Missing required root property: "${field}".`);
        remediation.push(`Initialize envelope with field: "${field}".`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors, remediation };
    }

    const typedEnvelope = envelope as OrchestrationEnvelope;

    // 2. Enum Parameter Checks
    const validStages = ['route', 'analyze', 'create', 'validate', 'deliver'];
    if (!validStages.includes(typedEnvelope.workflow_stage)) {
      errors.push(`Invalid workflow_stage: "${typedEnvelope.workflow_stage}".`);
    }

    const validRoles = ['Hermes', 'Analyst', 'Creator', 'Validator', 'Delivery'];
    if (!validRoles.includes(typedEnvelope.assigned_agent)) {
      errors.push(`Invalid assigned_agent: "${typedEnvelope.assigned_agent}".`);
    }

    if (typedEnvelope.next_agent && !validRoles.includes(typedEnvelope.next_agent)) {
      errors.push(`Invalid next_agent target: "${typedEnvelope.next_agent}".`);
    }

    // 3. Required Context Validation
    const ctx = typedEnvelope.required_context;
    if (!ctx || typeof ctx !== 'object') {
      errors.push('required_context must be a valid object.');
    } else {
      const requiredContextKeys = [
        'brand_facts',
        'field_context',
        'repo_paths',
        'bundle_paths',
        'telemetry_inputs',
        'financial_inputs',
      ];
      for (const k of requiredContextKeys) {
        if (!(k in ctx)) {
          errors.push(`Missing context criteria: required_context.${k}.`);
        }
      }
    }

    // 4. Safety Constraints Audit
    const cns = typedEnvelope.constraints;
    if (!cns || typeof cns !== 'object') {
      errors.push('constraints must be a valid object.');
    } else {
      const requiredConstraintKeys = [
        'locked_facts_required',
        'no_marketing_claims_without_analysis',
        'no_global_fact_mutation',
        'server_ready_hold_mode',
      ];
      for (const k of requiredConstraintKeys) {
        if (!(k in cns)) {
          errors.push(`Missing safety constraint: constraints.${k}.`);
        }
      }
    }

    // 5. Audit validation checkboxes vs true state
    const val = typedEnvelope.validation;
    if (!val || typeof val !== 'object') {
      errors.push('validation must be a valid object.');
    } else {
      if (val.schema_ok !== true) {
        errors.push('Envelope schema validation has not been executed (schema_ok: false).');
        remediation.push('Verify structure and set validation.schema_ok = true.');
      }
      if (cns && cns.locked_facts_required && val.fact_lock_passed !== true) {
        errors.push('Security Alert: Fact Lock validation required but not passed (fact_lock_passed: false).');
        remediation.push('Run verification engine and toggle fact_lock_passed = true.');
      }
      if (val.handoff_ready && !typedEnvelope.next_agent) {
        errors.push('Inconsistent State: Handoff is ready but next_agent is null.');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      remediation: remediation.length > 0 ? remediation : undefined,
    };
  }
}
