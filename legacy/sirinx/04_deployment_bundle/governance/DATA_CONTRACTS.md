# SIRINX Data Contracts

## Public Lead Payload

```json
{
  "name": "string",
  "phone": "string",
  "email": "string | null",
  "businessType": "factory | commercial | agriculture | other",
  "monthlyBillThb": "number | null",
  "roofAreaSqm": "number | null",
  "message": "string | null",
  "consent": true,
  "source": "sirinx.co",
  "submittedAt": "ISO-8601"
}
```

Rules:

- Treat all user-provided fields as untrusted.
- Store contact data only in approved DB/storage.
- Do not export raw leads to files without approval.
- Do not send raw leads to agent prompts unless redacted.

## Multi-Agent Orchestration Envelope

All governed agent handoffs must conform to `ORCHESTRATION_SCHEMA.json`.

```json
{
  "task_id": "string",
  "workflow_stage": "route | analyze | create | validate | deliver",
  "source_request": "string",
  "assigned_agent": "Hermes | Analyst | Creator | Validator | Delivery",
  "execution_mode": "standard | specialist-lane | null",
  "specialist_lane": "DatabaseSteward | Mentor | Apprentice | null",
  "required_context": {},
  "constraints": {},
  "input_payload": {},
  "output_payload": {},
  "validation": {
    "schema_ok": "boolean",
    "paths_exist": "boolean",
    "fact_lock_passed": "boolean",
    "handoff_ready": "boolean"
  },
  "next_agent": "Hermes | Analyst | Creator | Validator | Delivery | null",
  "fallback_queue_reason": "string | null"
}
```

Rules:

- Hermes routes only.
- Analyst computes structured analysis only.
- Creator writes structured narrative only.
- Validator must explicitly set `handoff_ready=true` before Delivery runs.
- Delivery must not claim completion unless required files physically exist on disk.

Per-agent schemas:

- `.ops/contracts/ORCHESTRATOR_SCHEMA.json`
- `.ops/contracts/ANALYST_SCHEMA.json`
- `.ops/contracts/CREATOR_SCHEMA.json`
- `.ops/contracts/VALIDATOR_SCHEMA.json`
- `.ops/contracts/DELIVERY_SCHEMA.json`
- `.ops/contracts/DATABASE_STEWARD_SCHEMA.json`
- `.ops/contracts/MENTOR_BOOTSTRAP_SCHEMA.json`

## Specialist Lane Contracts

Use specialist lanes only when the five-agent core requires governed depth for server bootstrap or junior-agent enablement.

### Database Steward Packet

```json
{
  "specialist_lane": "DatabaseSteward",
  "task_type": "bootstrap | preflight | migration-review | backup-review | restore-drill",
  "database_scope": {
    "engine": "postgresql",
    "target_service": "sirinx-postgres",
    "profile": "postgres-target | automation | ops-dashboard",
    "pgvector_expected": true
  },
  "approved_change_window": "string",
  "validator_gate_required": true,
  "rollback_note": "string",
  "audit_trail_note": "string"
}
```

Rules:

- DB packets are dry-run and planning oriented by default.
- They must not authorize destructive SQL or production migrations by themselves.
- They must include rollback and audit notes.

### Mentor Bootstrap Packet

```json
{
  "specialist_lane": "Mentor",
  "training_mode": "shadow | guided-handoff | apprentice-exec",
  "senior_agent": "string",
  "apprentice_scope": ["string"],
  "starter_packet_refs": ["string"],
  "validator_gate_required": true,
  "escalation_rule": "string"
}
```

Rules:

- Mentor may package approved runbooks and starter tasks only.
- Apprentice execution must be constrained to starter packets plus validator checks.
- Missing packet or missing approval must route back to Hermes instead of improvising.

## Quote Intake State

Allowed states:

- `new`
- `triaged`
- `needs_info`
- `qualified`
- `proposal_draft`
- `approved_to_send`
- `sent`
- `closed_won`
- `closed_lost`

## Pricing Source Of Truth

Reference packages from v15 handoff:

- START: `125,000 THB + VAT`
- PRO: `315,000 THB + VAT`
- ENTERPRISE BESS: `4,990,000 THB + VAT`

Any future price change must update the standard vault and approval packet together.

## Hardware Context Record

Supplier and equipment references must not overwrite Locked Package Facts. Use `governance/HARDWARE_CONTEXT_GOVERNANCE.md`.

```json
{
  "name": "string",
  "category": "inverter | panel | bess | mounting | ev_charger | accessory | supplier | installer",
  "status": "Candidate Vendor Context | Field-Validated Hardware Context | Track-Record Hardware Profile | Locked Package Fact",
  "sourceEvidence": ["string"],
  "fieldNotes": "string | null",
  "knownRisks": "string | null",
  "packageImpact": "none | scenario-only | package-candidate | package-standard",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

## Field-Observed Hardware Stack Record

Observed hardware stacks must not become global package truth without approval. Use `governance/FIELD_OBSERVED_HARDWARE_STACK.md`.

```json
{
  "stackName": "string",
  "status": "Field-Observed Hardware Stack",
  "observedAt": "ISO-8601 | unknown",
  "observedBy": "string | role",
  "sourceType": "site_visit | vendor_conversation | prior_install | quotation | datasheet | service_record | photo_reference | other",
  "sourceEvidence": ["string"],
  "siteContext": {
    "buildingType": "factory | commercial | agriculture | residence | other | unknown",
    "roofType": "metal_sheet | concrete | ground_mount | carport | unknown",
    "gridContext": "single_phase | three_phase | unknown",
    "monthlyBillRangeThb": "string | unknown"
  },
  "hardware": {
    "inverter": ["string"],
    "panel": ["string"],
    "bess": ["string"],
    "mounting": ["string"],
    "evCharger": ["string"],
    "monitoringGateway": ["string"],
    "protectionAndMetering": ["string"]
  },
  "confidence": "low | medium | high",
  "allowedUse": "internal_reference | validated_sales_scenario | target_model | case_study_hypothesis | package_candidate",
  "promotionTarget": "none | Track-Record Hardware Profile | Locked Package Fact",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

Preserved record:

- `governance/records/FIELD_OBSERVED_LISINER_LIQUID_COOLED_BESS_2026-04-23.md`
- `governance/records/FIELD_OBSERVED_SOLIS_EMS_INVERTER_INTERFACE_2026-04-23.md`

## Hardware Integration Knowledge Record

Hardware integration knowledge must include provenance notes. Use `governance/records/HARDWARE_INTEGRATION_PROVENANCE_GUARDRAIL_2026-04-23.md`.

```json
{
  "knowledgeId": "string",
  "integrationTopic": "string",
  "hardwareRefs": ["string"],
  "sourceType": "site_visit | photo_reference | interface_screenshot | datasheet | commissioning_note | telemetry_sample | vendor_conversation | service_record | operator_note | other",
  "sourceEvidence": ["string"],
  "capturedBy": "string | role",
  "capturedAt": "ISO-8601 | unknown",
  "sourceOwner": "customer | supplier | SIRINX | operator | unknown",
  "permissionStatus": "permission_granted | internal_only | needs_permission | unknown",
  "confidence": "low | medium | high",
  "integrationBoundary": {
    "readOnlyTelemetry": "boolean",
    "remoteControl": "not_allowed | review_required | approved_limited",
    "protocols": ["Modbus TCP | Modbus RTU | API | cloud export | CSV | manual | unknown"],
    "networkBoundary": "local_lan | vendor_cloud | customer_network | isolated_gateway | unknown",
    "dataFreshnessTarget": "string"
  },
  "assumptions": ["string"],
  "knownRisks": ["string"],
  "securityNotes": ["string"],
  "telemetryRefs": ["string"],
  "allowedUse": "internal_engineering | telemetry_mapping | proposal_assumption | pilot_planning | service_runbook_draft",
  "approvalStatus": "draft | review_required | approved_internal | approved_public_reference | rejected",
  "reviewedBy": "string | null",
  "reviewedAt": "ISO-8601 | null",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

## Pilot Project Status Record

Pilot projects must not become global package truth or guaranteed ROI without review and approval. Use `governance/PILOT_PROJECT_STATUS.md`.

```json
{
  "pilotId": "string",
  "pilotName": "string",
  "status": "Proposed Pilot | Approved Pilot | Active Pilot | Pilot Under Review | Validated Pilot | Promoted Package Evidence | Rejected / Archived Pilot",
  "customerContext": "redacted string",
  "siteContext": {
    "buildingType": "factory | commercial | agriculture | residence | other | unknown",
    "roofType": "metal_sheet | concrete | ground_mount | carport | unknown",
    "gridContext": "single_phase | three_phase | unknown",
    "monthlyBillRangeThb": "string | unknown"
  },
  "hardwareStackRefs": ["string"],
  "roiScenarioRefs": ["string"],
  "measuredDataRefs": ["string"],
  "completionPercentEstimate": {
    "min": "number | null",
    "max": "number | null",
    "basis": "operator_estimate | punch_list | commissioning_checklist | telemetry | customer_acceptance | unknown",
    "claimStatus": "estimate_only | under_review | validated | approved_public_copy"
  },
  "validatedFor": ["internal_reference | validated_sales_scenario | target_model | case_study_hypothesis | package_evidence"],
  "limitations": ["string"],
  "knownRisks": ["string"],
  "reviewedBy": "string | null",
  "reviewedAt": "ISO-8601 | null",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

Preserved record:

- `governance/records/PILOT_PROJECT_COMPLETION_ESTIMATE_2026-04-23.md`

## Field-Validated Project Context Record

Field-validated project context must preserve field evidence without becoming public proof or package truth automatically. Use `governance/FIELD_VALIDATED_PROJECT_CONTEXT.md`.

```json
{
  "contextId": "string",
  "contextTitle": "string",
  "status": "Field Note | Field-Validated Context | Project Context Under Review | Approved Project Context | Promoted Evidence | Archived / Rejected Context",
  "sourceType": "site_visit | customer_conversation | vendor_conversation | pilot | prior_install | telemetry | quotation | bill_review | photo_reference | service_record | other",
  "sourceEvidence": ["string"],
  "customerContext": "redacted string",
  "siteContext": {
    "buildingType": "factory | commercial | agriculture | residence | other | unknown",
    "roofType": "metal_sheet | concrete | ground_mount | carport | unknown",
    "gridContext": "single_phase | three_phase | unknown",
    "monthlyBillRangeThb": "string | unknown",
    "operatingPattern": "string | unknown"
  },
  "hardwareStackRefs": ["string"],
  "pilotRefs": ["string"],
  "roiModelRefs": ["string"],
  "telemetryRefs": ["string"],
  "trackRecordRefs": ["string"],
  "claimBoundaries": ["string"],
  "redactionStatus": "redacted | needs_redaction | not_applicable",
  "allowedUse": "internal_reference | proposal_prep | validated_sales_scenario | target_model | case_study_hypothesis | track_record_draft | package_evidence",
  "confidence": "low | medium | high",
  "reviewedBy": "string | null",
  "reviewedAt": "ISO-8601 | null",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

## ROI Scenario Record

High-impact ROI examples must not be guaranteed claims. Use `governance/ROI_SCENARIO_CLAIM_GOVERNANCE.md`.

```json
{
  "currentMonthlyBillThb": "number",
  "targetMonthlyBillThb": "number | null",
  "tariffBasis": "string",
  "loadProfile": "string",
  "systemSizeKw": "number | null",
  "claimStatus": "Verified | Estimate | Validated Sales Scenario | Target Model | Case-Study Hypothesis | Review Required",
  "assumptions": ["string"],
  "evidenceLinks": ["string"],
  "reviewedBy": "string | null",
  "reviewedAt": "ISO-8601 | null"
}
```

## ROI Scenario Modeling Record

ROI scenario models must follow `governance/ROI_SCENARIO_MODELING.md`.

```json
{
  "modelId": "string",
  "modelVersion": "string",
  "modelStatus": "Draft Model | Assumption-Based Estimate | Validated Sales Scenario Model | Target Model | Case-Study Hypothesis Model | Pilot-Calibrated Model | Verified Case Model",
  "inputs": {
    "currentMonthlyBillThb": "number | null",
    "targetMonthlyBillThb": "number | null",
    "tariffBasis": "string",
    "loadProfile": "string | unknown",
    "operatingHours": "string | unknown",
    "siteType": "factory | commercial | agriculture | residence | other | unknown",
    "systemSizeKw": "number | null",
    "estimatedAnnualGenerationKwh": "number | null",
    "selfConsumptionRatio": "number | null",
    "financeMode": "capex | ppa | lease | unknown",
    "hardwareStackRefs": ["string"],
    "pilotRefs": ["string"],
    "evidenceLinks": ["string"]
  },
  "outputs": {
    "monthlySavingsRangeThb": {"low": "number | null", "base": "number | null", "high": "number | null"},
    "annualSavingsRangeThb": {"low": "number | null", "base": "number | null", "high": "number | null"},
    "paybackYearsRange": {"low": "number | null", "base": "number | null", "high": "number | null"},
    "lcoeRangeThbPerKwh": {"low": "number | null", "base": "number | null", "high": "number | null"},
    "claimStatus": "Estimate | Validated Sales Scenario | Target Model | Case-Study Hypothesis | Review Required | Verified"
  },
  "reviewedBy": "string | null",
  "reviewedAt": "ISO-8601 | null"
}
```

Preserved record:

- `governance/records/ROI_TARGET_MODEL_250K_TO_50K_70K_2026-04-23.md`

## Revenue-Plane Track Record Creative Record

Public track record sections must follow `governance/REVENUE_PLANE_TRACK_RECORD_CREATIVE_DIRECTION.md`.

```json
{
  "trackRecordId": "string",
  "title": "string",
  "displayStatus": "Verified Case | Validated Pilot | Field-Observed Stack | Track-Record Hardware Profile | ROI Target Model | Case-Study Hypothesis | Review Required",
  "publicVisibility": "draft | internal_only | public_ready | published",
  "clientIdentityStatus": "anonymous | permission_granted | internal_only",
  "evidenceTier": "none | internal_note | field_observed | pilot_validated | measured_verified",
  "sourceRefs": ["string"],
  "hardwareStackRefs": ["string"],
  "pilotRefs": ["string"],
  "roiModelRefs": ["string"],
  "claimStatus": "Verified | Estimate | Validated Sales Scenario | Target Model | Case-Study Hypothesis | Review Required",
  "redactionStatus": "redacted | not_applicable",
  "publicCopy": "string",
  "visualAssetRefs": ["string"],
  "visualPolicy": {
    "imageryPolicy": "premium_real_world_only | concept_visual_not_track_record_proof",
    "assetSource": "project_photo | approved_stock_as_concept | generated_concept | monitoring_screenshot | equipment_photo | other",
    "permissionStatus": "permission_granted | internal_only | needs_permission | not_applicable",
    "redactionStatus": "redacted | needs_redaction | not_applicable",
    "evidenceRefs": ["string"]
  },
  "reviewedBy": "string | null",
  "reviewedAt": "ISO-8601 | null",
  "approvedBy": "string | null",
  "approvedAt": "ISO-8601 | null"
}
```

Visual directive:

- `governance/records/EXECUTIVE_UI_TRACK_RECORD_IMAGERY_DIRECTIVE_2026-04-23.md`

## Analytics Events

Allowed public events:

- `page_view`
- `cta_click`
- `lead_form_start`
- `lead_form_submit`
- `contact_click`

Do not collect sensitive personal data in analytics metadata.

## Telemetry Event Envelope

Telemetry ingestion must follow `governance/TELEMETRY_INGESTION_REQUIREMENTS.md`.

```json
{
  "eventId": "uuid | deterministic idempotency key",
  "timestamp": "ISO-8601",
  "source": "sirinx.co | ops.sirinx.co | agents.sirinx.internal | server | ci | manual",
  "class": "public_site | runtime_health | deployment | pilot_project | hardware_context | hardware_integration | roi_model | security_audit",
  "event": "string",
  "actorType": "public_user | operator | agent | system | unknown",
  "requestId": "string | null",
  "sessionId": "redacted string | null",
  "entityRef": "string | null",
  "safeContext": {},
  "sensitivity": "public | internal | restricted",
  "redactionStatus": "redacted | not_applicable",
  "schemaVersion": "1.0"
}
```

Telemetry must not include production secrets, raw access tokens, passwords, private keys, or unrestricted customer PII.

## Omniscient Dashboard State Event

Internal only for `ops.sirinx.co`:

```json
{
  "eventId": "uuid",
  "timestamp": "ISO-8601",
  "node": "Hermes | Analyst | Creator | Validator | Delivery",
  "state": "Standby | Thinking | Analyzing Hardware | Executing",
  "severity": "info | warning | critical",
  "queueDepth": "number | null",
  "latencyMs": "number | null",
  "safeContext": {},
  "redactionStatus": "redacted | not_applicable",
  "schemaVersion": "1.0"
}
```

Rules:

- no secrets
- no raw prompts by default
- no direct hardware write payloads
- no public-plane exposure

## Delivery Bundle Manifest

The final handoff bundle must follow `.ops/contracts/HANDOFF_BUNDLE_MANIFEST.json`.

Rules:

- `requiredFiles` must exist before the bundle is considered valid.
- `requiredDirectories` may be copied recursively, but excluded historical files must stay out of the final bundle.
- `bundleExcludes` takes precedence over convenience copies.
- `validationGates` must all pass before the Delivery Agent may set `handoff_ready=true`.
