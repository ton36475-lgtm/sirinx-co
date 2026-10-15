# SIRINX prototype integration map

**Status:** proposal / local demo only · **Updated:** 15 October 2026

This map describes the prototype wiring only. It does not authorize or describe a production migration, live API, CRM, cloud/GPU service, energy-device connection or external publication.

## Browser-to-API path

```text
Existing .org page (/)
  └─ preserves the 77-province knowledge directory
     └─ prototype hub (/prototypes/)
        ├─ .org knowledge / evidence / policy modules
        ├─ .co route proposals: assessment, projects, pricing, investment,
        │  strategy, About, Blog/video, partner, contact
        ├─ proposed ai/cloud experiences (not live DNS hosts)
        ├─ CEO/staff opt-in branding + synthetic rights register
        └─ 2D SVG default → user-selected local Three.js → optional Anime.js

Existing .co page (/co.html)
  └─ preserves live-derived service, project, assessment and FAQ structure

UI API console
  ├─ Hosted/static preview: deterministic in-browser fixtures; no network request
  └─ Local at http://127.0.0.1:8766:
       same-origin fetch to /api/v1/* only
          └─ mock_api_server.py (binds 127.0.0.1, no persistence)
               ├─ OpenAPI 3.1 contract: public/prototype-api/openapi.yaml
               └─ Postman v2.1: public/prototype-api/SIRINX-Proposal-Mock.postman_collection.json
```

## API contract

The local mock exposes 12 allow-listed routes:

- `GET /v1/status`, `/v1/knowledge`, `/v1/evidence`, `/v1/projects`
- `POST /v1/assessments`, `/v1/ai/knowledge-query`, `/v1/cloud/workload-intakes`
- `POST /v1/brand-consents`, `/v1/partner-inquiries`
- `POST /v1/pricing/scenarios`, `/v1/editorial/review-briefs`, `/v1/contact/routing`

All POST responses are synthetic, non-persistent and explicitly avoid consequential claims/actions: no price/ROI/quote, generated or published content, captured contact details, real consent record, AI-model call, cloud capacity reservation, device command or lead submission. Unknown fields and sensitive contact keys are rejected by the mock.

## Rendering and accessibility path

1. A descriptive inline SVG clay-style diagram is the default and fallback.
2. The browser downloads no 3D modules until the visitor explicitly chooses **Load 3D**.
3. Three.js and Anime.js are locally vendored; the scene is original low-poly geometry, not a model made from the reference photographs.
4. Motion requires a separate user action; pause/return-to-2D controls are always available. `prefers-reduced-motion` disables motion while preserving the static scene.
5. Keyboard slider controls, semantic headings/landmarks, visible focus and text descriptions remain available without WebGL.

## Data and governance path

`.org` public knowledge/policy/evidence projection → source and owner review → `.co` assessment/engineering handoff → owner-approved publication or private transfer.

The shared back-office cards are synthetic role/work queue examples only. Policy schema reserves fields for jurisdiction, source/publisher, publication/effective dates, last-reviewed date, reviewer, owner, status and version; no Drive policy record is imported. Personal assets are opt-in by role, asset, channel, purpose and expiry; the rights register contains placeholders only, with an owner-review and withdrawal/update path.

## How to run the local mock

```bash
cd /home/ubuntu/sirinx-bess-implementation
python3 mock_api_server.py --port 8766
```

Open `http://127.0.0.1:8766/prototypes/`. Import the Postman collection and keep `baseUrl` pointed at the loopback mock. The hosted static preview does not call this API.

## Explicit non-integrations

No production API, database, migration, third-party account, payment, CRM, email, cloud/GPU provider, meter, inverter, BESS, real-time telemetry, raw-device command or live LLM is connected. Repository/Drive evidence limitations are recorded in `SOURCE_AUDIT.md` and `SIRINX_PROTOTYPE_SCOPE.md`.


## Additive BESS module (2026-10-15)

```text
.org knowledge intent
  └─ /bess-knowledge.html (noindex prototype; DOE basics + source states)
      └─ /bess.html (service / assessment intent)
          └─ anonymous BESS brief → POST /api/v1/assessments only on 127.0.0.1:8766
              └─ no persistence / no lead / no CRM / no email / no device control
```

Both BESS pages read `public/data/bess-master.json`, which is also the source for mock API knowledge/evidence fixtures. Product claims remain manufacturer-reported; the 16.07/16.38 kWh discrepancy and disputed 5000U/10000U IP rating are shown as unresolved. See `BESS_IMPLEMENTATION.md` for source status, KPI definitions, 90-day gates and required owner approvals.
