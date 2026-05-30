export class OrchestrationEnvelopeValidator {
    /**
     * Runs a complete structural and policy audit on a multi-agent transition envelope
     */
    static audit(envelope) {
        const errors = [];
        const remediation = [];
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
        const typedEnvelope = envelope;
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
        }
        else {
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
        }
        else {
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
        }
        else {
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
//# sourceMappingURL=validator.js.map