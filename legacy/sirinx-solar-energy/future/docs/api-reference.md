# API Reference — Future Agentic OS

> Version: 0.1.0 | Base URL: `http://localhost:8000`

---

## Overview

The Future Agentic OS REST API follows standard conventions:

- All endpoints return JSON
- Timestamps are ISO 8601 UTC (e.g., `"2026-04-02T10:00:00Z"`)
- UUIDs are used as primary keys (string format)
- Pagination uses `page` + `page_size` query parameters
- HTTP status codes follow REST standards: `200 OK`, `201 Created`, `204 No Content`, `400 Bad Request`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `500 Internal Server Error`

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

Most org-scoped endpoints require the `X-Org-ID` header:

```
X-Org-ID: <org_uuid>
```

If the header is missing or the org does not exist, the API returns `404 Not Found`.

**Endpoints that do NOT require X-Org-ID:**
- `GET /health`
- `GET /` (root)
- `GET /api/v1/orgs` — lists all orgs
- `POST /api/v1/orgs` — creates a new org

## Pagination

All list endpoints support pagination:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` | int | 1 | — | Page number (1-indexed) |
| `page_size` | int | 20 | 100 | Items per page |

**Paginated Response Shape:**
```json
{
  "total": 42,
  "page": 1,
  "page_size": 20,
  "items": [ ... ]
}
```

---

## 1. Health

### `GET /health`

Check API health status.

**No headers required.**

**Response `200 OK`:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "development"
}
```

**Example:**
```bash
curl http://localhost:8000/health
```

---

## 2. Organizations

### `GET /api/v1/orgs`

List all active organizations (paginated). No `X-Org-ID` required.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `page_size` | int | 20 | Items per page (max 100) |

**Response `200 OK`:**
```json
{
  "total": 3,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "SIRINX Solar Energy",
      "slug": "sirinx-solar-energy",
      "industry": "solar_energy",
      "language": "th",
      "timezone": "Asia/Bangkok",
      "currency": "THB",
      "brand_colors": null,
      "logo_url": null,
      "is_active": true,
      "workspace_count": 2,
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T10:00:00Z"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8000/api/v1/orgs
```

---

### `POST /api/v1/orgs`

Create a new organization. Slug is auto-generated from name if not provided.

**Request Body:**
```json
{
  "name": "SIRINX Solar Energy",
  "slug": "sirinx-solar",
  "industry": "solar_energy",
  "language": "th",
  "timezone": "Asia/Bangkok",
  "currency": "THB",
  "brand_colors": { "primary": "#F5A623", "secondary": "#0A2342" },
  "logo_url": "https://example.com/logo.png"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Organization display name |
| `slug` | string | No | URL-safe identifier (auto-generated if omitted) |
| `industry` | enum | No | Industry vertical (see values below) |
| `language` | string | No | Default: `"th"` |
| `timezone` | string | No | Default: `"Asia/Bangkok"` |
| `currency` | string | No | Default: `"THB"` |
| `brand_colors` | object | No | Key-value color map |
| `logo_url` | string | No | URL to logo image |

**Industry Values:** `solar_energy`, `manufacturing`, `hospitality`, `retail`, `logistics`, `healthcare`, `finance`, `technology`, `other`

**Response `201 Created`:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "SIRINX Solar Energy",
  "slug": "sirinx-solar-energy",
  "industry": "solar_energy",
  "workspace_count": 0,
  "created_at": "2026-04-02T10:00:00Z"
}
```

**Error `409 Conflict`:** Slug already exists.

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/orgs \
  -H "Content-Type: application/json" \
  -d '{"name": "SIRINX Solar Energy", "industry": "solar_energy", "language": "th"}'
```

---

### `GET /api/v1/orgs/{org_id}`

Get a single organization by ID.

**Response `200 OK`:** Same as org object above.

**Error `404 Not Found`:** Organization does not exist or is inactive.

**Example:**
```bash
curl http://localhost:8000/api/v1/orgs/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### `PUT /api/v1/orgs/{org_id}`

Partially update an organization. Only provided fields are updated.

**Request Body:** Any subset of org fields (all optional):
```json
{
  "name": "SIRINX Solar Energy Thailand",
  "logo_url": "https://cdn.example.com/new-logo.png"
}
```

**Response `200 OK`:** Updated org object.

**Example:**
```bash
curl -X PUT http://localhost:8000/api/v1/orgs/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "Content-Type: application/json" \
  -d '{"name": "SIRINX Solar Energy Thailand"}'
```

---

### `DELETE /api/v1/orgs/{org_id}`

Soft-delete an organization (sets `is_active = false`). Data is preserved.

**Response `204 No Content`**

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/v1/orgs/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## 3. Workspaces

All workspace endpoints require `X-Org-ID` header.

### `GET /api/v1/workspaces`

List all active workspaces for the current org.

**Response `200 OK`:**
```json
{
  "total": 2,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "ws-uuid-here",
      "org_id": "org-uuid-here",
      "name": "Sales Operations",
      "description": "Workspace for sales agent tasks",
      "is_active": true,
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T10:00:00Z"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8000/api/v1/workspaces \
  -H "X-Org-ID: org-uuid-here"
```

---

### `POST /api/v1/workspaces`

Create a new workspace within the current org.

**Request Body:**
```json
{
  "name": "Sales Operations",
  "description": "Workspace for sales agent tasks"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Workspace name (unique within org) |
| `description` | string | No | Optional description |

**Response `201 Created`:** Workspace object.

**Error `409 Conflict`:** Workspace name already exists in this org.

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{"name": "Sales Operations", "description": "Sales agent workspace"}'
```

---

### `GET /api/v1/workspaces/{workspace_id}`

Get a workspace by ID (must belong to current org).

**Response `200 OK`:** Workspace object.

---

### `PUT /api/v1/workspaces/{workspace_id}`

Update a workspace.

**Request Body:**
```json
{
  "name": "Sales & Marketing",
  "description": "Updated description"
}
```

---

### `DELETE /api/v1/workspaces/{workspace_id}`

Soft-delete a workspace.

**Response `204 No Content`**

---

## 4. Users

All user endpoints require `X-Org-ID` header.

### `GET /api/v1/users`

List active users for the current org.

**Response `200 OK`:**
```json
{
  "total": 5,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "user-uuid-here",
      "org_id": "org-uuid-here",
      "email": "admin@sirinx.com",
      "full_name": "สมชาย ใจดี",
      "role": "admin",
      "is_active": true,
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T10:00:00Z"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8000/api/v1/users \
  -H "X-Org-ID: org-uuid-here"
```

---

### `POST /api/v1/users`

Add a new user to the current org.

**Request Body:**
```json
{
  "email": "sales@sirinx.com",
  "full_name": "สมหญิง รักงาน",
  "role": "member"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string (email) | Yes | Email (lowercased, unique within org) |
| `full_name` | string | Yes | Display name |
| `role` | enum | Yes | `owner`, `admin`, `member`, `viewer` |

**Response `201 Created`:** User object.

**Error `409 Conflict`:** Email already exists in this org.

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{"email": "sales@sirinx.com", "full_name": "สมหญิง รักงาน", "role": "member"}'
```

---

### `GET /api/v1/users/{user_id}`

Get a user by ID.

---

### `PUT /api/v1/users/{user_id}`

Update user role or full_name.

**Request Body:**
```json
{
  "role": "admin",
  "full_name": "สมหญิง รักงานมาก"
}
```

---

### `DELETE /api/v1/users/{user_id}`

Deactivate a user (soft delete).

**Response `204 No Content`**

---

## 5. Packs

All pack endpoints require `X-Org-ID` header.

### `GET /api/v1/packs`

List all packs for the current org.

**Response `200 OK`:**
```json
{
  "total": 1,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "pack-uuid-here",
      "org_id": "org-uuid-here",
      "name": "Solar Analysis Pack",
      "description": "Tools for solar energy analysis and proposal generation",
      "tools": ["http_request", "read_file", "write_file"],
      "version": "1.0.0",
      "is_active": true,
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/packs`

Create a new pack.

**Request Body:**
```json
{
  "name": "Solar Analysis Pack",
  "description": "Tools for solar energy analysis",
  "tools": ["http_request", "read_file", "write_file"],
  "version": "1.0.0"
}
```

**Response `201 Created`:** Pack object.

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/packs \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{"name": "Solar Analysis Pack", "tools": ["http_request", "read_file"], "version": "1.0.0"}'
```

---

### `GET /api/v1/packs/{pack_id}` | `PUT /api/v1/packs/{pack_id}` | `DELETE /api/v1/packs/{pack_id}`

Standard CRUD operations. DELETE returns `204 No Content`.

---

## 6. Policies

All policy endpoints require `X-Org-ID` header.

### `GET /api/v1/policies`

List all policies for the current org.

**Response `200 OK`:**
```json
{
  "total": 1,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "policy-uuid-here",
      "org_id": "org-uuid-here",
      "name": "Default Security Policy",
      "description": "Restrict external HTTP calls to approved domains",
      "rules": [
        {
          "rule_id": "no_external_http",
          "condition": "tool_name == 'http_request'",
          "allowed_domains": ["api.anthropic.com", "api.openai.com"],
          "action": "restrict",
          "message": "HTTP requests limited to approved domains"
        }
      ],
      "is_active": true,
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/policies`

Create a new policy.

**Request Body:**
```json
{
  "name": "Default Security Policy",
  "description": "Governance rules for agent actions",
  "rules": [
    {
      "rule_id": "budget_guard",
      "condition": "estimated_cost > 10.0",
      "action": "require_approval",
      "message": "Tasks costing over $10 require manager approval"
    }
  ]
}
```

**Response `201 Created`:** Policy object.

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/policies \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{"name": "Default Security Policy", "rules": []}'
```

---

### `GET /api/v1/policies/{policy_id}` | `PUT /api/v1/policies/{policy_id}` | `DELETE /api/v1/policies/{policy_id}`

Standard CRUD. DELETE returns `204 No Content`.

---

## 7. Providers

All provider endpoints require `X-Org-ID` header. **API keys are never returned in plaintext — always masked.**

### `GET /api/v1/providers`

List all LLM provider configurations for the current org (keys masked).

**Response `200 OK`:**
```json
{
  "total": 2,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "provider-uuid-here",
      "org_id": "org-uuid-here",
      "name": "anthropic",
      "models": ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
      "capabilities": ["planning", "execution", "review"],
      "is_active": true,
      "priority": 10,
      "api_key_masked": "****abcd",
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/providers`

Register a new LLM provider. The `api_key` is encrypted at rest and never returned.

**Request Body:**
```json
{
  "name": "anthropic",
  "api_key": "sk-ant-api03-your-key-here",
  "models": ["claude-opus-4-6", "claude-sonnet-4-6"],
  "capabilities": ["planning", "execution", "review"],
  "is_active": true,
  "priority": 10,
  "extra_config": {}
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | enum | Yes | `anthropic`, `openai`, `google`, `mock` |
| `api_key` | string | Yes | Provider API key (encrypted at rest) |
| `models` | string[] | Yes | List of model names to use |
| `capabilities` | enum[] | Yes | `planning`, `execution`, `review`, `embedding` |
| `is_active` | bool | No | Default: `true` |
| `priority` | int | No | Higher = preferred. Default: `0` |
| `extra_config` | object | No | Provider-specific config (base_url, timeout, etc.) |

**Response `201 Created`:** Provider object with `api_key_masked`.

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/providers \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{
    "name": "anthropic",
    "api_key": "sk-ant-api03-...",
    "models": ["claude-opus-4-6", "claude-sonnet-4-6"],
    "capabilities": ["planning", "execution", "review"],
    "priority": 10
  }'
```

---

### `GET /api/v1/providers/{provider_id}`

Get a provider config (key masked).

---

### `PUT /api/v1/providers/{provider_id}`

Update a provider config. If `api_key` is provided, it is re-encrypted.

**Request Body:** Any subset of provider fields:
```json
{
  "is_active": false,
  "priority": 5
}
```

---

### `DELETE /api/v1/providers/{provider_id}`

Delete a provider config.

**Response `204 No Content`**

---

### `POST /api/v1/providers/{provider_id}/test`

Test provider connectivity by making a minimal generation call.

**No request body required.**

**Response `200 OK`:**
```json
{
  "status": "ok",
  "provider": "anthropic",
  "response": "pong"
}
```

**Error response:**
```json
{
  "status": "error",
  "provider": "anthropic",
  "detail": "Invalid API key"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/providers/provider-uuid-here/test \
  -H "X-Org-ID: org-uuid-here"
```

---

## 8. Budgets

All budget endpoints require `X-Org-ID` header.

### `GET /api/v1/budgets`

List all budgets for the current org with real-time current-month usage computed.

**Response `200 OK`:**
```json
{
  "total": 1,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "budget-uuid-here",
      "org_id": "org-uuid-here",
      "name": "Monthly AI Budget",
      "monthly_limit": 100.0,
      "task_limit": 5.0,
      "alert_threshold": 0.8,
      "currency": "USD",
      "current_month_usage": 23.45,
      "remaining": 76.55,
      "utilization_pct": 23.45,
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/v1/budgets`

Create a new budget.

**Request Body:**
```json
{
  "name": "Monthly AI Budget",
  "monthly_limit": 100.0,
  "task_limit": 5.0,
  "alert_threshold": 0.8,
  "currency": "USD"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Budget name |
| `monthly_limit` | float | Yes | Monthly spending cap in USD |
| `task_limit` | float | No | Per-task spending cap in USD |
| `alert_threshold` | float | No | Alert at this fraction (0.0-1.0). Default: `0.8` |
| `currency` | string | No | Default: `"USD"` |

**Response `201 Created`:** Budget object with `current_month_usage: 0.0`.

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/budgets \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{"name": "Monthly AI Budget", "monthly_limit": 100.0, "task_limit": 5.0, "alert_threshold": 0.8}'
```

---

### `GET /api/v1/budgets/{budget_id}`

Get a budget with current-month usage stats.

---

### `PUT /api/v1/budgets/{budget_id}`

Update budget limits.

**Request Body:** Any subset of budget fields.

---

### `DELETE /api/v1/budgets/{budget_id}`

Delete a budget and all its usage records.

**Response `204 No Content`**

---

### `GET /api/v1/budgets/{budget_id}/usage`

List usage records for a budget, newest first.

**Query Parameters:** `page`, `page_size` (max 200, default 50)

**Response `200 OK`:**
```json
{
  "total": 15,
  "page": 1,
  "page_size": 50,
  "items": [
    {
      "id": "usage-uuid-here",
      "budget_id": "budget-uuid-here",
      "task_run_id": "run-uuid-here",
      "cost_usd": 0.45,
      "tokens_used": 1250,
      "model_name": "claude-sonnet-4-6",
      "created_at": "2026-04-02T10:05:00Z"
    }
  ]
}
```

---

## 9. Tasks

All task endpoints require `X-Org-ID` header.

### `GET /api/v1/tasks`

List tasks for the current org, with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `page_size` | int | Items per page (max 100) |
| `status` | string | Filter by status: `pending`, `executing`, `completed`, `failed`, `cancelled` |
| `priority` | string | Filter by priority: `low`, `medium`, `high`, `critical` |

**Response `200 OK`:**
```json
{
  "total": 10,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "task-uuid-here",
      "org_id": "org-uuid-here",
      "workspace_id": "ws-uuid-here",
      "title": "วิเคราะห์ใบเสนอราคาโรงงาน ABC",
      "description": "...",
      "priority": "high",
      "status": "completed",
      "input_data": { "factory_name": "ABC" },
      "max_steps": 10,
      "budget_limit": 2.0,
      "run_count": 3,
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T11:00:00Z"
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:8000/api/v1/tasks?status=pending&priority=high" \
  -H "X-Org-ID: org-uuid-here"
```

---

### `POST /api/v1/tasks`

Create a new task definition.

**Request Body:**
```json
{
  "title": "วิเคราะห์ใบเสนอราคาพลังงานแสงอาทิตย์",
  "description": "วิเคราะห์และสรุปสำหรับโรงงาน ABC ขนาด 500 kWp",
  "workspace_id": "ws-uuid-here",
  "priority": "high",
  "input_data": {
    "factory_name": "ABC Manufacturing",
    "location": "ชลบุรี",
    "electricity_bill": 150000,
    "roof_area_sqm": 2000
  },
  "max_steps": 10,
  "budget_limit": 2.0
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Task title |
| `description` | string | No | Detailed description |
| `workspace_id` | string (UUID) | No | Target workspace |
| `priority` | enum | No | `low`, `medium`, `high`, `critical`. Default: `medium` |
| `input_data` | object | No | Structured input for the agent |
| `max_steps` | int | No | Maximum execution steps. Default: `20` |
| `budget_limit` | float | No | Per-task USD budget cap |

**Response `201 Created`:** Task object with `run_count: 0`.

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{"title": "วิเคราะห์ใบเสนอราคา", "priority": "high", "max_steps": 10, "budget_limit": 2.0}'
```

---

### `GET /api/v1/tasks/{task_id}`

Get a task with its total run count.

---

### `PUT /api/v1/tasks/{task_id}`

Update a task definition (title, description, priority, etc.).

---

### `DELETE /api/v1/tasks/{task_id}`

Cancel or delete a task.

- If the task has runs: sets `status = "cancelled"`, data is preserved.
- If the task has no runs: deletes the task record.

**Response `204 No Content`**

**Error `404 Not Found`:** Task does not exist.

---

### `POST /api/v1/tasks/{task_id}/run`

Create a new TaskRun and initiate execution. Returns immediately with the run record; orchestration proceeds asynchronously.

**Request Body:**
```json
{
  "triggered_by": "user-001"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `triggered_by` | string | No | User ID or identifier who triggered the run |

**Response `201 Created`:**
```json
{
  "id": "run-uuid-here",
  "task_id": "task-uuid-here",
  "status": "pending",
  "triggered_by": "user-001",
  "plan": null,
  "output": null,
  "error_message": null,
  "tokens_used": null,
  "cost_usd": null,
  "started_at": "2026-04-02T10:02:00Z",
  "completed_at": null,
  "steps": [],
  "created_at": "2026-04-02T10:02:00Z"
}
```

**Error `404 Not Found`:** Task does not exist.
**Error `409 Conflict`:** Task is cancelled and cannot be run.

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/tasks/task-uuid-here/run \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{"triggered_by": "user-001"}'
```

---

### `GET /api/v1/tasks/{task_id}/runs`

List all runs for a task, newest first.

**Query Parameters:** `page`, `page_size`

**Response `200 OK`:** Paginated list of TaskRun objects (each including `steps` array).

**Example:**
```bash
curl http://localhost:8000/api/v1/tasks/task-uuid-here/runs \
  -H "X-Org-ID: org-uuid-here"
```

---

### `GET /api/v1/tasks/{task_id}/runs/{run_id}`

Get a specific run with all its steps.

**Response `200 OK`:**
```json
{
  "id": "run-uuid-here",
  "task_id": "task-uuid-here",
  "status": "completed",
  "triggered_by": "user-001",
  "plan": { "steps": [ ... ] },
  "output": "การวิเคราะห์เสร็จสมบูรณ์...",
  "tokens_used": 4250,
  "cost_usd": 0.38,
  "started_at": "2026-04-02T10:02:00Z",
  "completed_at": "2026-04-02T10:03:45Z",
  "steps": [
    {
      "id": "step-uuid-here",
      "task_run_id": "run-uuid-here",
      "step_number": 1,
      "tool_name": "http_request",
      "tool_input": { "url": "https://...", "method": "GET" },
      "tool_output": "{ ... }",
      "status": "completed",
      "started_at": "2026-04-02T10:02:05Z",
      "completed_at": "2026-04-02T10:02:08Z",
      "created_at": "2026-04-02T10:02:05Z"
    }
  ],
  "created_at": "2026-04-02T10:02:00Z"
}
```

---

### `GET /api/v1/tasks/{task_id}/runs/{run_id}/artifacts`

List artifacts produced by a task run.

**Response `200 OK`:**
```json
[
  {
    "id": "artifact-uuid-here",
    "task_run_id": "run-uuid-here",
    "name": "solar_proposal_abc.pdf",
    "artifact_type": "report",
    "content": "ใบเสนอราคาพลังงานแสงอาทิตย์...",
    "metadata": { "pages": 5, "format": "markdown" },
    "created_at": "2026-04-02T10:03:40Z"
  }
]
```

---

## 10. Brain

All brain endpoints require `X-Org-ID` header. The Brain is the organization's knowledge base used to provide context to agents.

### `GET /api/v1/brain`

List brain entries for the current org, with optional type filter.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `page_size` | int | Items per page (max 100) |
| `entry_type` | string | Filter by type: `doctrine`, `template`, `knowledge`, `research_standard`, `memory` |

**Response `200 OK`:**
```json
{
  "total": 8,
  "page": 1,
  "page_size": 20,
  "items": [
    {
      "id": "brain-uuid-here",
      "org_id": "org-uuid-here",
      "entry_type": "doctrine",
      "title": "บริษัท SIRINX — หลักการหลัก",
      "content": "เราให้บริการ B2B solar EPC สำหรับโรงงานและโรงแรมในไทย...",
      "tags": ["doctrine", "core", "b2b"],
      "metadata": { "version": "1.0", "author": "CEO" },
      "source": "company_handbook",
      "created_at": "2026-04-02T10:00:00Z",
      "updated_at": "2026-04-02T10:00:00Z"
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:8000/api/v1/brain?entry_type=doctrine" \
  -H "X-Org-ID: org-uuid-here"
```

---

### `POST /api/v1/brain`

Create a new brain entry.

**Request Body:**
```json
{
  "entry_type": "doctrine",
  "title": "บริษัท SIRINX — หลักการหลัก",
  "content": "เราให้บริการ B2B solar EPC สำหรับโรงงานและโรงแรมในไทย ลูกค้าหลักคือองค์กรที่มีค่าไฟ > 50,000 บาท/เดือน",
  "tags": ["doctrine", "core", "b2b"],
  "metadata": { "version": "1.0" },
  "source": "company_handbook"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entry_type` | enum | Yes | `doctrine`, `template`, `knowledge`, `research_standard`, `memory` |
| `title` | string | Yes | Entry title |
| `content` | string | Yes | Main content text |
| `tags` | string[] | No | Tags for filtering |
| `metadata` | object | No | Additional metadata |
| `source` | string | No | Source reference |

**Response `201 Created`:** Brain entry object.

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/brain \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{
    "entry_type": "doctrine",
    "title": "Core Doctrine",
    "content": "We serve B2B solar customers...",
    "tags": ["doctrine", "core"]
  }'
```

---

### `GET /api/v1/brain/{entry_id}`

Get a brain entry by ID.

---

### `PUT /api/v1/brain/{entry_id}`

Update a brain entry.

---

### `DELETE /api/v1/brain/{entry_id}`

Delete a brain entry permanently.

**Response `204 No Content`**

---

### `POST /api/v1/brain/search`

Search brain entries by query text (title + content). Uses substring match in dev; replace with vector search in production.

**Request Body:**
```json
{
  "query": "solar ROI calculation",
  "entry_type": "knowledge",
  "limit": 10
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | Yes | Search query text |
| `entry_type` | enum | No | Filter by entry type |
| `limit` | int | No | Max results. Default: `10` |

**Response `200 OK`:**
```json
{
  "entries": [
    {
      "id": "brain-uuid-here",
      "entry_type": "knowledge",
      "title": "Solar ROI Formula",
      "content": "ROI = (Annual Savings - Annual Cost) / Initial Investment × 100",
      "tags": ["solar", "finance", "roi"],
      ...
    }
  ],
  "total": 3
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/brain/search \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{"query": "solar ROI", "limit": 5}'
```

---

## 11. Approvals

All approval endpoints require `X-Org-ID` header.

### `GET /api/v1/approvals/pending`

List all **pending** approval requests for the current org, oldest first. Use this endpoint to build an approval queue UI.

**Response `200 OK`:**
```json
[
  {
    "id": "approval-uuid-here",
    "org_id": "org-uuid-here",
    "task_run_id": "run-uuid-here",
    "action": "ส่ง email ถึงลูกค้า 500 คน",
    "risk_level": "high",
    "context": { "email_count": 500, "template": "promotion_q2" },
    "requested_by": "agent-kuranosuke-01",
    "status": "pending",
    "created_at": "2026-04-02T10:05:00Z",
    "updated_at": "2026-04-02T10:05:00Z"
  }
]
```

**Example:**
```bash
curl http://localhost:8000/api/v1/approvals/pending \
  -H "X-Org-ID: org-uuid-here"
```

---

### `GET /api/v1/approvals`

List all approval requests with optional status filter.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `page_size` | int | Items per page (max 100) |
| `status` | string | Filter by: `pending`, `approved`, `rejected` |

---

### `POST /api/v1/approvals`

Create a new approval request (typically called by the agent runtime, not manually).

**Request Body:**
```json
{
  "task_run_id": "run-uuid-here",
  "action": "ส่ง email ถึงลูกค้า 500 คน",
  "risk_level": "high",
  "context": {
    "email_count": 500,
    "estimated_cost": 0.15
  },
  "requested_by": "agent-kuranosuke-01"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task_run_id` | string (UUID) | No | Associated task run |
| `action` | string | Yes | Description of the action requiring approval |
| `risk_level` | enum | Yes | `low`, `medium`, `high`, `critical` |
| `context` | object | No | Additional context for the approver |
| `requested_by` | string | No | Agent or user ID requesting approval |

**Response `201 Created`:** Approval request with `status: "pending"`.

---

### `GET /api/v1/approvals/{approval_id}`

Get an approval request with its decisions.

---

### `POST /api/v1/approvals/{approval_id}/decide`

Submit an approval decision. Updates the parent request status to match.

**Request Body:**
```json
{
  "decision": "approved",
  "decided_by": "manager-user-id",
  "reason": "ตรวจสอบรายชื่อแล้ว ไม่มี unsubscribed"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `decision` | enum | Yes | `approved` or `rejected` |
| `decided_by` | string | Yes | User ID making the decision |
| `reason` | string | No | Explanation for the decision |

**Response `201 Created`:**
```json
{
  "id": "decision-uuid-here",
  "approval_id": "approval-uuid-here",
  "decision": "approved",
  "decided_by": "manager-user-id",
  "reason": "ตรวจสอบรายชื่อแล้ว ไม่มี unsubscribed",
  "created_at": "2026-04-02T10:10:00Z"
}
```

**Error `409 Conflict`:** Approval is already decided (not in `pending` state).

**Example:**
```bash
curl -X POST http://localhost:8000/api/v1/approvals/approval-uuid-here/decide \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: org-uuid-here" \
  -d '{"decision": "approved", "decided_by": "manager-001", "reason": "Approved after review"}'
```

---

## 12. Audit

All audit endpoints require `X-Org-ID` header. The audit log is **read-only** — records are written internally by the system.

### `GET /api/v1/audit/summary`

Count audit events by type for the current org in the last 30 days.

**Response `200 OK`:**
```json
{
  "org_id": "org-uuid-here",
  "period_days": 30,
  "since": "2026-03-03T10:00:00Z",
  "event_counts": {
    "task.run.completed": 145,
    "task.created": 48,
    "approval.requested": 12,
    "approval.approved": 11,
    "budget.alert_triggered": 2
  },
  "total": 218
}
```

**Example:**
```bash
curl http://localhost:8000/api/v1/audit/summary \
  -H "X-Org-ID: org-uuid-here"
```

---

### `GET /api/v1/audit`

List audit events with optional filters, newest first.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `page_size` | int | Items per page (max 200, default 50) |
| `event_type` | string | Filter by event type (e.g., `task.run.completed`) |
| `user_id` | string | Filter by user ID |
| `from_date` | datetime | Filter events after this timestamp (ISO 8601) |
| `to_date` | datetime | Filter events before this timestamp (ISO 8601) |

**Response `200 OK`:**
```json
{
  "total": 218,
  "page": 1,
  "page_size": 50,
  "items": [
    {
      "id": "audit-uuid-here",
      "org_id": "org-uuid-here",
      "event_type": "task.run.completed",
      "user_id": "user-001",
      "resource_type": "task_run",
      "resource_id": "run-uuid-here",
      "metadata": {
        "tokens_used": 4250,
        "cost_usd": 0.38,
        "duration_seconds": 105
      },
      "created_at": "2026-04-02T10:03:45Z"
    }
  ]
}
```

**Example:**
```bash
curl "http://localhost:8000/api/v1/audit?event_type=task.run.completed&page_size=10" \
  -H "X-Org-ID: org-uuid-here"
```

---

### `GET /api/v1/audit/{event_id}`

Get a single audit event by ID.

---

## Error Reference

### Standard Error Response

All errors return a JSON body:

```json
{
  "detail": "Human-readable error message"
}
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200 OK` | Success | GET, PUT requests |
| `201 Created` | Resource created | POST requests |
| `204 No Content` | Success, no body | DELETE requests |
| `400 Bad Request` | Invalid request | Malformed JSON |
| `404 Not Found` | Resource not found | Wrong ID or org mismatch |
| `409 Conflict` | Duplicate resource | Slug/email already exists |
| `422 Unprocessable Entity` | Validation error | Missing required fields, wrong types |
| `500 Internal Server Error` | Server error | Unexpected exceptions |

### Validation Error Response

FastAPI returns detailed validation errors:

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "name"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

---

## Quick Reference

| Resource | List | Create | Get | Update | Delete | Special |
|----------|------|--------|-----|--------|--------|---------|
| Orgs | `GET /orgs` | `POST /orgs` | `GET /orgs/{id}` | `PUT /orgs/{id}` | `DELETE /orgs/{id}` | — |
| Workspaces | `GET /workspaces` | `POST /workspaces` | `GET /workspaces/{id}` | `PUT /workspaces/{id}` | `DELETE /workspaces/{id}` | — |
| Users | `GET /users` | `POST /users` | `GET /users/{id}` | `PUT /users/{id}` | `DELETE /users/{id}` | — |
| Packs | `GET /packs` | `POST /packs` | `GET /packs/{id}` | `PUT /packs/{id}` | `DELETE /packs/{id}` | — |
| Policies | `GET /policies` | `POST /policies` | `GET /policies/{id}` | `PUT /policies/{id}` | `DELETE /policies/{id}` | — |
| Providers | `GET /providers` | `POST /providers` | `GET /providers/{id}` | `PUT /providers/{id}` | `DELETE /providers/{id}` | `POST /providers/{id}/test` |
| Budgets | `GET /budgets` | `POST /budgets` | `GET /budgets/{id}` | `PUT /budgets/{id}` | `DELETE /budgets/{id}` | `GET /budgets/{id}/usage` |
| Tasks | `GET /tasks` | `POST /tasks` | `GET /tasks/{id}` | `PUT /tasks/{id}` | `DELETE /tasks/{id}` | `POST /tasks/{id}/run`, `GET /tasks/{id}/runs`, `GET /tasks/{id}/runs/{rid}`, `GET /tasks/{id}/runs/{rid}/artifacts` |
| Brain | `GET /brain` | `POST /brain` | `GET /brain/{id}` | `PUT /brain/{id}` | `DELETE /brain/{id}` | `POST /brain/search` |
| Approvals | `GET /approvals` | `POST /approvals` | `GET /approvals/{id}` | — | — | `GET /approvals/pending`, `POST /approvals/{id}/decide` |
| Audit | `GET /audit` | — | `GET /audit/{id}` | — | — | `GET /audit/summary` |

---

*Future Agentic OS API Reference v0.1.0*
