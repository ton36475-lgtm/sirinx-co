# SIRINX proposal prototype — mock API contract

This contract exists only to demonstrate front-end → API → Postman structure. Hosted static previews use in-browser fixtures; the optional local preview at `127.0.0.1:8766` calls `mock_api_server.py` on the same origin. No live SIRINX, Google, GitHub, INET, meter, inverter, BESS, CRM, billing or LLM API is wired.

- OpenAPI: `public/prototype-api/openapi.yaml`
- Postman collection: `public/prototype-api/SIRINX-Proposal-Mock.postman_collection.json`
- Local test base URL: `http://127.0.0.1:8766/api`
- Start local server: `python3 mock_api_server.py`
- Open local full-stack preview: `http://127.0.0.1:8766/prototypes/`
- `GET` and `POST` fixtures are synthetic. `POST` never persists data. Use no real names, email addresses, phone numbers, credentials or customer records.

## Routes

| Method | Path | Purpose | Side effects |
|---|---|---|---|
| GET | `/v1/status` | Show explicit demo/offline boundary | None |
| GET | `/v1/knowledge` | Static knowledge records with source URLs and claim states | None |
| GET | `/v1/evidence` | Website-reported/project evidence placeholders | None |
| GET | `/v1/projects` | Source-linked project claims with pending verification | None |
| POST | `/v1/assessments` | Create a local brief from site inputs; no energy/ROI calculation | No persistence; no lead created |
| POST | `/v1/ai/knowledge-query` | Show that an AI knowledge route is proposed, not connected | No model call |
| POST | `/v1/cloud/workload-intakes` | Mock workload intake; availability/pricing remain unknown | No ticket or capacity reservation |
| POST | `/v1/pricing/scenarios` | List quote prerequisites for Solar/BESS/EV/EMS choices | No price, quote or ROI result |
| POST | `/v1/editorial/review-briefs` | Show owner/source/rights checks for About, Strategy, Blog, video or speaking routes | No content generated or published |
| POST | `/v1/contact/routing` | Suggest a local prototype route by intent | No contact details captured or inquiry sent |
| POST | `/v1/brand-consents` | Generate a consent checklist for name/photo/voice/video/quote/byline/credentials and channel scopes | No consent record saved |
| POST | `/v1/partner-inquiries` | Generate a partner-intake preview | No inquiry saved |

## BESS assessment extension (2026-10-15)

`POST /v1/assessments` additionally accepts the allow-listed, non-contact fields `bessGoal`, `loadProfile`, `existingSolar`, and `siteDataStatus` for the local BESS prototype. Values are bounded; the endpoint rejects unknown fields and personal/contact/secret keys. It does not calculate sizing, ROI, IRR, LCOE, savings, forecast or compatibility; it does not persist, create a lead, contact a user or call CRM. Fixtures use synthetic values only.

## Non-negotiable exclusions

No device-control or raw-command routes, telemetry polling, payment, booking, email sending, account provisioning, customer CRM record creation, real consent capture, GPU capacity claim or production write route is defined. Any future live integration needs a separate scope, verified source/owner, permission review, security/data-protection review and explicit authorization.
