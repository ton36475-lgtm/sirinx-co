import { describe, it, expect } from 'vitest';
import { OrchestrationEnvelopeValidator } from './validator.js';
describe('SIRINX Orchestration Envelope Validator Tests', () => {
    const getValidEnvelope = () => ({
        task_id: "task-001-audit",
        workflow_stage: "validate",
        source_request: "Perform battery cell check.",
        assigned_agent: "Validator",
        required_context: {
            brand_facts: true,
            field_context: true,
            repo_paths: ["packages/thclaws-runtime"],
            bundle_paths: [],
            telemetry_inputs: [],
            financial_inputs: []
        },
        constraints: {
            locked_facts_required: true,
            no_marketing_claims_without_analysis: true,
            no_global_fact_mutation: true,
            server_ready_hold_mode: true
        },
        input_payload: { cellId: "cell-7" },
        output_payload: { status: "pending" },
        validation: {
            schema_ok: true,
            paths_exist: true,
            fact_lock_passed: true,
            handoff_ready: true
        },
        next_agent: "Delivery",
        fallback_queue_reason: null
    });
    it('should validate a perfect orchestration envelope payload', () => {
        const envelope = getValidEnvelope();
        const result = OrchestrationEnvelopeValidator.audit(envelope);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it('should fail and list missing fields if root keys are deleted', () => {
        const envelope = getValidEnvelope();
        // @ts-ignore
        delete envelope.task_id;
        // @ts-ignore
        delete envelope.workflow_stage;
        const result = OrchestrationEnvelopeValidator.audit(envelope);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required root property: "task_id".');
        expect(result.errors).toContain('Missing required root property: "workflow_stage".');
        expect(result.remediation).toBeDefined();
    });
    it('should fail if schema enum values are invalid', () => {
        const envelope = getValidEnvelope();
        // @ts-ignore
        envelope.workflow_stage = 'invalid_stage';
        // @ts-ignore
        envelope.assigned_agent = 'SuperAgent';
        const result = OrchestrationEnvelopeValidator.audit(envelope);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid workflow_stage: "invalid_stage".');
        expect(result.errors).toContain('Invalid assigned_agent: "SuperAgent".');
    });
    it('should enforce fact_lock_passed validation if fact lock constraint is engaged', () => {
        const envelope = getValidEnvelope();
        envelope.constraints.locked_facts_required = true;
        envelope.validation.fact_lock_passed = false;
        const result = OrchestrationEnvelopeValidator.audit(envelope);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Security Alert: Fact Lock validation required but not passed (fact_lock_passed: false).');
    });
});
//# sourceMappingURL=validator.test.js.map