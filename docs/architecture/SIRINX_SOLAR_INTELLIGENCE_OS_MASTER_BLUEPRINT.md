# SIRINX Solar Intelligence OS — Master Integration Blueprint

Status: RESEARCH-READY / BRANCH-ONLY
Target: SIRINX.co + SIRINX.org + GhostClaw + Hermes + agentic coding + Solar Intelligence

## Mission
Build an evidence-gated Solar Intelligence Operating Layer.

SIGNAL -> SOURCE -> CLAIM -> STATUS -> SITE -> DIGITAL TWIN -> SIMULATION -> ENGINEERING -> PROPOSAL -> FIELD DATA -> VERIFICATION

Hard separation:
- Model != Authority
- Simulation != Official Eligibility
- REPORTED != VERIFIED
- planned_graph != actual_graph
- PR merged != production complete

## System boundaries
SIRINX.org = knowledge, policy, evidence, AEO/GEO, simulation, public intelligence.
SIRINX.co = engineering, products, projects, assessment, proposal, conversion.
GhostClaw = policy/capability/evidence gates and execution receipts.
Hermes = orchestration, delegation and swarm scheduling.
Trajectory Controller = execution state only.
Claim Registry = evidence authority.
Three.js/R3F = spatial rendering and digital twin.
Anime.js = DOM motion.
Postman = API contract and negative-path verification.

## Solar Intelligence data plane
Inputs:
province/utility/tariff, bills/load profiles, roof geometry, orientation/tilt/shading,
structural constraints, weather/irradiance, PV/inverter/BESS/EV metadata,
drone RGB/thermal/multispectral imagery, inverter telemetry, alarms and maintenance history.

Derived:
PV potential, load model, self-consumption, storage scenarios, EV scenarios,
export/import behavior, loss/degradation, anomaly likelihood, uncertainty,
engineering recommendation and policy eligibility state.

## AI + drone
Mission planning: site boundary, roof/array segmentation, risk-aware waypoints,
weather constraints, RGB/thermal capture and repeatable inspection routes.

Vision tasks:
panel detection, hotspot detection, soiling, visible defects, vegetation/shading,
inverter/BOS anomaly cues and thermal anomaly ranking.

Every model result returns prediction, confidence, evidence image, model/version,
timestamp and sensor provenance. Prediction never becomes certification automatically.

## Digital twin
SITE -> ROOF/FIELD -> ARRAY -> STRING -> INVERTER -> BESS -> EV -> LOAD -> GRID

Every entity has asset_id, geometry, source, timestamp, telemetry, model version,
confidence and lifecycle state.

States:
DESIGNED / OBSERVED / VERIFIED / SIMULATED / COMMISSIONED / DEGRADED / RETIRED

The 3D frontend is a view of the twin, not the source of truth.

## Forecast + optimization
Solar generation, load, battery dispatch, EV charging, peak management,
export/import optimization, anomaly detection and predictive maintenance.

Prefer probabilistic outputs and expose assumptions and uncertainty.

## Policy intelligence
Claim fields:
claim_id, jurisdiction, topic, claim_text, source_url, source_type,
publication_date, effective_date, announcement_date, last_verified,
status, confidence, scope, conditions, supersedes, simulation_or_official.

Statuses:
VERIFIED / LAW / REGULATION / OFFICIAL_POLICY / IMPLEMENTATION_PENDING /
ANNOUNCED_DATE_PENDING / UNKNOWN / EXPIRED

Policy logic recommends an evidence path; it never invents eligibility.

## API contract
Canonical groups:
GET /claims
GET /claims/:id
GET /policy/status
POST /assessment
POST /site
POST /scenario
POST /simulation
POST /drone/inspection
POST /vision/anomalies
POST /forecast
POST /optimization
POST /proposal
GET /evidence/:id
GET /receipts/:id

Mutating APIs return request_id, trace_id, schema_version, execution_status,
evidence_refs, assumptions, warnings and receipt_id.

Negative tests include stale evidence, unsupported utility, invalid geometry,
contradictory telemetry, simulation-as-eligibility, unauthorized control,
stale execution epoch and duplicate/idempotency replay.

## Agentic coding team
47 Ronins are logical roles with explicit ownership, not uncontrolled duplicate agents.

01-06 Evidence/Policy
07-12 Solar Engineering
13-18 AI/CV/Drone
19-24 Backend/API/Data
25-30 Frontend/3D/Motion
31-35 QA/Security/Red-team
36-39 DevOps/Edge/Observability
40-43 Research/AEO/GEO/Content
44-46 Product/Commercial
47 Commander-integrator

Each task = owner -> inputs -> acceptance -> evidence -> verification -> receipt.
One writer per file scope; independent verification before promotion.

## Defensive security
Threat model includes prompt injection, poisoned sources, dependency compromise,
stale policy, forged telemetry, replayed commands, unauthorized APIs, SSRF,
webhook abuse and secret leakage.

Controls:
source allowlists, content sanitization, lockfiles/SBOM,
signed receipts, idempotency, control epoch/fence, least privilege,
read-only discovery first, sandbox execution and independent verification.

Reverse engineering is limited to public behavior, interfaces, public documentation,
open-source architecture and UX patterns. Do not bypass access controls or extract secrets.

## Frontend
SIGNAL -> PROOF -> EXPLORE -> DECIDE -> ENGINEER -> CONVERT

3D Energy Lab:
ROOFTOP / CARPORT / BESS / EV / HYBRID

Motion:
bootSequence, heroReveal, evidenceReveal, policyStagger, labEnter,
scenarioTransition, proposalHandoff.

Performance:
lazy 3D, adaptive DPR, mobile fallback, offscreen pause,
reduced motion, asset budgets and no blocking analytics.

## Postman
Collections:
Public Claims, Policy Engine, Assessment, Digital Twin, Simulation,
Drone Inspection, CV Anomaly, Forecast, Optimization, Proposal, Receipts, Security.

Every endpoint: happy path, schema, auth, RBAC, idempotency, stale evidence,
timeouts, partial dependencies, error contract and traceability.

## Research corpus
Priority:
MIT/MITEI, DOE/SETO/NREL, Fraunhofer ISE, IEA, peer-reviewed PV/UAV/CV research,
Thai official agencies/utilities, manufacturer documentation and open-source projects.

Current evidence signals:
MIT: AI for solar-cell optimization and renewable-grid operations.
DOE: AI/ML predictive PV maintenance and anomaly detection.
Fraunhofer ISE: interpretable AI, 2D/3D defect segmentation and digital-twin data.
2026 research: UAV PV route planning and infrared deep learning.
Tesla: VPP, Powerhub and software-driven DER optimization.
Enphase: agentic AI assistant and AI energy management.
SolarEdge: AI-based home energy optimization.
Microsoft: AI-powered microgrid/digital-twin simulation.
AWS ecosystem: renewable forecasting and optimization agents.

External claims remain research evidence until independently validated for SIRINX.

## Search/AEO/GEO graph
solar cell, solar panel, solar rooftop, solar carport, solar BESS,
battery energy storage, AI energy management, EMS, solar monitoring,
predictive maintenance, drone solar inspection, thermal inspection,
PV digital twin, solar AI, solar engineering, solar assessment, solar ROI,
solar policy Thailand, solar tax Thailand, net billing Thailand, FiT Thailand,
community solar Thailand, EV solar charging, peak demand, self-consumption,
energy arbitrage, virtual power plant, distributed energy resources.

Do not fabricate search volume. Measured keyword data must enter the registry with source/date.

## SIRINX moat
ข่าว -> หลักฐาน -> สถานะ -> สิทธิ -> คำนวณ -> วิศวกรรม -> Proposal
then Proposal -> Installation -> Telemetry -> Inspection -> O&M ->
Verified field evidence -> Better models -> Better knowledge graph.

## Execution gates
G0 control-plane reachable
G1 workspace bound
G2 repo inventory
G3 research corpus
G4 claim registry
G5 API contracts
G6 frontend/3D
G7 drone/CV research prototype
G8 Postman suite
G9 browser runtime
G10 security/red-team
G11 edge verification
G12 production

Known blocker: GhostClaw/DWB tunnel-client has not been seen for >300 seconds,
so Remote Desktop execution is not currently verified reachable.

## Immediate backlog
P0: restore tunnel; verify devices; bind /Users/sirinx/sirinx-os;
inventory nodes/repos/agents; reconcile PR #10/#12; add Anime.js with lockfile;
Claim Registry schema; OpenAPI contract; Postman collections; digital-twin model;
drone evidence schema; browser runtime QA.

P1: production 3D Energy Lab; policy-to-engineering calculator;
thermal/RGB research pipeline; forecasting/optimization; AEO/GEO graph;
observability and receipts.

P2: VPP/DER simulation; fleet O&M intelligence; autonomous inspection planning;
field-data learning loop.

## Release law
No promotion merely because code exists.
Require source diff, CI, runtime, API, asset/media, security, edge,
control-path evidence and receipt before production.
