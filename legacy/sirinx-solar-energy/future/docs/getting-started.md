# เริ่มต้นใช้งาน Future Agentic OS

> คู่มือเริ่มต้นฉบับสมบูรณ์ — ติดตั้งและรัน API ภายใน 5 นาที

---

## ข้อกำหนดเบื้องต้น

| สิ่งที่ต้องมี | เวอร์ชัน | หมายเหตุ |
|------------|---------|---------|
| Python | 3.11 หรือสูงกว่า | `python --version` เพื่อตรวจสอบ |
| pip หรือ uv | ล่าสุด | `uv` แนะนำ — ติดตั้งเร็วกว่า pip มาก |
| Git | ใดก็ได้ | สำหรับ clone โปรเจกต์ |

### ตรวจสอบ Python version

```bash
python --version
# ต้องได้ Python 3.11.x หรือสูงกว่า
```

ถ้ายังไม่มี Python 3.11+ ให้ดาวน์โหลดจาก [python.org](https://www.python.org/downloads/) หรือใช้ `pyenv`:

```bash
# ติดตั้งด้วย pyenv (macOS/Linux)
pyenv install 3.11.9
pyenv local 3.11.9
```

---

## ติดตั้ง

### ขั้นตอนที่ 1 — เข้าไปที่ folder `future/`

```bash
cd C:/Users/Ton36/AI-WarRoom/future
```

หรือถ้าอยู่ที่ root ของโปรเจกต์:

```bash
cd future/
```

### ขั้นตอนที่ 2 — สร้าง Virtual Environment

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux:**
```bash
python -m venv .venv
source .venv/bin/activate
```

เมื่อ activate สำเร็จ จะเห็น `(.venv)` ที่ต้นบรรทัด terminal

**ทางเลือก: ใช้ `uv` (เร็วกว่า 10-100x)**
```bash
pip install uv          # ติดตั้ง uv ครั้งเดียว
uv venv .venv
source .venv/bin/activate  # หรือ .venv\Scripts\activate บน Windows
```

### ขั้นตอนที่ 3 — ติดตั้ง Dependencies

```bash
pip install -r requirements.txt
```

หรือถ้าใช้ `uv`:
```bash
uv pip install -r requirements.txt
```

Dependencies หลักที่จะถูกติดตั้ง:
- `fastapi==0.111.0` — Web framework
- `uvicorn[standard]==0.29.0` — ASGI server
- `sqlalchemy==2.0.30` — ORM
- `alembic==1.13.1` — Database migration
- `aiosqlite==0.20.0` — Async SQLite driver
- `anthropic==0.25.1` — Claude API client
- `openai==1.25.0` — OpenAI API client
- `pydantic==2.7.1` — Data validation

### ขั้นตอนที่ 4 — ตั้งค่า Environment Variables

```bash
cp .env.example .env
```

เปิดไฟล์ `.env` และแก้ไขค่าต่อไปนี้:

```env
# ===== จำเป็น =====
APP_ENV=development
APP_SECRET_KEY=your-secret-key-change-this-to-random-string-at-least-32-chars

# ===== Database (dev ใช้ SQLite ได้เลย) =====
DATABASE_URL=sqlite+aiosqlite:///./future.db

# ===== LLM Providers (ใส่อย่างน้อย 1 อัน) =====
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=AIza...

# ===== ค่าเริ่มต้นอื่น ๆ (ไม่จำเป็นต้องแก้สำหรับ dev) =====
DEFAULT_PLANNING_MODEL=claude-opus-4-6
DEFAULT_EXECUTION_MODEL=claude-sonnet-4-6
DEFAULT_MONTHLY_BUDGET=100.0
KAIROS_ENABLED=true
KAIROS_INTERVAL_SECONDS=60
CORS_ORIGINS=http://localhost:3000,http://localhost:3002
```

**หมายเหตุ:** ไม่จำเป็นต้องมี API key ทุกตัวก็ได้ ระบบจะใช้เฉพาะ provider ที่กำหนดค่าไว้

### ขั้นตอนที่ 5 — รัน API Server

```bash
uvicorn apps.api.main:app --reload --port 8000
```

**Options เพิ่มเติม:**
```bash
# รัน พร้อมแสดง log ละเอียด
uvicorn apps.api.main:app --reload --port 8000 --log-level debug

# รันบน port อื่น
uvicorn apps.api.main:app --reload --port 8080

# รันโดยไม่ auto-reload (production-like)
uvicorn apps.api.main:app --port 8000 --workers 4
```

เมื่อรันสำเร็จจะเห็น:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Development: tables created/verified
INFO:     Starting Future Agentic OS API...
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## ทดสอบ

### รัน Test Suite

```bash
pytest tests/ -v
```

**Options ที่มีประโยชน์:**
```bash
# รัน test พร้อม coverage report
pytest tests/ -v --cov=apps --cov=packages --cov-report=term-missing

# รัน test เฉพาะ file
pytest tests/test_orgs.py -v

# รัน test เฉพาะ function
pytest tests/test_tasks.py::test_create_task -v

# รัน test แบบ fail-fast (หยุดทันทีเมื่อ fail แรก)
pytest tests/ -v -x
```

**ผลลัพธ์ที่ควรได้:**
```
tests/test_orgs.py::test_create_org PASSED
tests/test_orgs.py::test_list_orgs PASSED
tests/test_tasks.py::test_create_task PASSED
tests/test_tasks.py::test_run_task PASSED
...
===== X passed in Y.Ys =====
```

---

## API Docs

หลังจากรัน server แล้ว เปิด browser ไปที่:

| URL | คำอธิบาย |
|-----|---------|
| `http://localhost:8000/docs` | Swagger UI — interactive API docs |
| `http://localhost:8000/redoc` | ReDoc — อ่านง่าย สวยงาม |
| `http://localhost:8000/openapi.json` | OpenAPI spec (JSON) |

ใน Swagger UI สามารถ:
- ดู endpoints ทั้งหมด พร้อม schemas
- ทดสอบ API ได้โดยตรงจาก browser
- ดู request/response examples

---

## Quick Start: ใช้งาน API ครั้งแรก

### ขั้นตอนที่ 1 — ตรวจสอบ Health

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "development"
}
```

### ขั้นตอนที่ 2 — เพิ่ม Organization แรก

```bash
curl -X POST http://localhost:8000/api/v1/orgs/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SIRINX Solar Energy",
    "industry": "solar_energy",
    "language": "th",
    "timezone": "Asia/Bangkok",
    "currency": "THB"
  }'
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "SIRINX Solar Energy",
  "slug": "sirinx-solar-energy",
  "industry": "solar_energy",
  "language": "th",
  "timezone": "Asia/Bangkok",
  "currency": "THB",
  "is_active": true,
  "workspace_count": 0,
  "created_at": "2026-04-02T10:00:00Z"
}
```

**บันทึก `org_id`** จาก response — จะใช้ใน header `X-Org-ID` สำหรับทุก request ต่อไป

### ขั้นตอนที่ 3 — สร้าง Task แรก

```bash
curl -X POST http://localhost:8000/api/v1/tasks/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -d '{
    "title": "วิเคราะห์ใบเสนอราคาพลังงานแสงอาทิตย์",
    "description": "วิเคราะห์และสรุปใบเสนอราคาสำหรับโรงงาน ABC ขนาด 500 kWp",
    "priority": "high",
    "input_data": {
      "factory_name": "ABC Manufacturing",
      "location": "จังหวัดชลบุรี",
      "electricity_bill": 150000,
      "roof_area_sqm": 2000
    },
    "max_steps": 10,
    "budget_limit": 2.0
  }'
```

**Response:**
```json
{
  "id": "task-uuid-here",
  "org_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "วิเคราะห์ใบเสนอราคาพลังงานแสงอาทิตย์",
  "status": "pending",
  "priority": "high",
  "run_count": 0,
  "created_at": "2026-04-02T10:01:00Z"
}
```

### ขั้นตอนที่ 4 — รัน Task

```bash
curl -X POST http://localhost:8000/api/v1/tasks/task-uuid-here/run \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -d '{
    "triggered_by": "user-001"
  }'
```

**Response:**
```json
{
  "id": "run-uuid-here",
  "task_id": "task-uuid-here",
  "status": "pending",
  "triggered_by": "user-001",
  "started_at": "2026-04-02T10:02:00Z",
  "steps": [],
  "created_at": "2026-04-02T10:02:00Z"
}
```

### ขั้นตอนที่ 5 — ตรวจสอบสถานะ Task Run

```bash
curl http://localhost:8000/api/v1/tasks/task-uuid-here/runs/run-uuid-here \
  -H "X-Org-ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

---

## โครงสร้าง Project

```
future/
├── apps/
│   ├── api/                    ← FastAPI application
│   │   ├── main.py             ← App entry point
│   │   ├── config.py           ← Settings (pydantic-settings)
│   │   ├── database.py         ← SQLAlchemy engine + session
│   │   ├── dependencies.py     ← FastAPI dependencies (get_current_org)
│   │   ├── models/             ← SQLAlchemy ORM models
│   │   │   ├── org.py          ← Org, Workspace, OrgUser, Pack, Policy
│   │   │   ├── task.py         ← Task, TaskRun, TaskStep, TaskArtifact
│   │   │   ├── brain.py        ← BrainEntry
│   │   │   ├── budget.py       ← Budget, BudgetUsage
│   │   │   ├── provider.py     ← ProviderConfig
│   │   │   ├── approval.py     ← ApprovalRequest, ApprovalDecision
│   │   │   └── audit.py        ← AuditEvent
│   │   ├── routers/            ← API route handlers
│   │   │   ├── health.py
│   │   │   ├── orgs.py
│   │   │   ├── workspaces.py
│   │   │   ├── users.py
│   │   │   ├── packs.py
│   │   │   ├── policies.py
│   │   │   ├── providers.py
│   │   │   ├── budgets.py
│   │   │   ├── tasks.py
│   │   │   ├── brain.py
│   │   │   ├── approvals.py
│   │   │   └── audit.py
│   │   └── services/           ← Business logic
│   │       ├── runtime/        ← Agent loop (orchestrator, planner, executor, reviewer)
│   │       ├── governance/     ← Policy, approval, budget, audit
│   │       ├── knowledge/      ← Brain manager, memory, templates
│   │       ├── providers/      ← LLM provider implementations
│   │       └── kairos/         ← Background monitoring & scheduling
│   └── web/                    ← Frontend (optional)
├── packages/
│   ├── core/                   ← Shared utilities, types, errors
│   └── schemas/                ← Pydantic request/response schemas
├── tests/                      ← Test suite
├── docs/                       ← Documentation (คุณอยู่ที่นี่)
├── requirements.txt
├── .env.example
└── pyproject.toml
```

---

## คำสั่งที่ใช้บ่อย

```bash
# เริ่ม development server
uvicorn apps.api.main:app --reload --port 8000

# รัน tests ทั้งหมด
pytest tests/ -v

# รัน tests พร้อม coverage
pytest tests/ -v --cov=apps --cov=packages

# ตรวจสอบ code style
flake8 apps/ packages/

# รัน type checking
mypy apps/ packages/

# สร้าง database migration ใหม่
alembic revision --autogenerate -m "add new table"

# รัน migrations
alembic upgrade head

# ย้อนกลับ migration
alembic downgrade -1
```

---

## แก้ปัญหาที่พบบ่อย

### ปัญหา: `ModuleNotFoundError: No module named 'apps'`

**สาเหตุ:** Python ไม่พบ module path

**แก้ไข:** รัน uvicorn จาก directory `future/` และตรวจสอบว่ามี `__init__.py` ในทุก folder

```bash
cd C:/Users/Ton36/AI-WarRoom/future
uvicorn apps.api.main:app --reload --port 8000
```

### ปัญหา: `UNIQUE constraint failed: orgs.slug`

**สาเหตุ:** Organization ที่มี slug เดียวกันมีอยู่แล้ว

**แก้ไข:** เปลี่ยน `name` หรือระบุ `slug` ที่ไม่ซ้ำกัน

```json
{
  "name": "SIRINX Solar Energy 2",
  "slug": "sirinx-solar-2"
}
```

### ปัญหา: `422 Unprocessable Entity`

**สาเหตุ:** Request body ไม่ถูกต้อง

**แก้ไข:** ตรวจสอบ required fields และ data types ที่ `/docs`

### ปัญหา: `404 Not Found` สำหรับ org-scoped endpoint

**สาเหตุ:** ลืมใส่ `X-Org-ID` header หรือ org_id ไม่ถูกต้อง

**แก้ไข:**
```bash
curl -H "X-Org-ID: your-actual-org-id-here" http://localhost:8000/api/v1/tasks/
```

### ปัญหา: Database ไม่มีตาราง

**สาเหตุ:** `APP_ENV` ไม่ได้ตั้งเป็น `development` หรือ migration ยังไม่รัน

**แก้ไข (development):** ตรวจสอบ `.env` ว่ามี `APP_ENV=development` — ระบบจะ auto-create tables เมื่อ startup

**แก้ไข (production):**
```bash
alembic upgrade head
```

---

## ขั้นตอนต่อไป

หลังจาก setup เสร็จแล้ว แนะนำให้ทำตามลำดับ:

1. **อ่าน [API Reference](./api-reference.md)** — เข้าใจ endpoints ทั้งหมด
2. **ทำตาม [Add Organization Guide](./add-organization.md)** — setup org แรกแบบสมบูรณ์
3. **อ่าน [Architecture](./architecture.md)** — เข้าใจ 5 Control Planes
4. **ลองรัน Task จริง** — เพิ่ม Provider และทดสอบ agent loop

---

*Future Agentic OS — Getting Started Guide v0.1.0*
