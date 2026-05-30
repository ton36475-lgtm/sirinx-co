# Future Agentic OS

## ภาพรวม (Overview — Thai)

**Future Agentic OS** คือระบบปฏิบัติการ AI เชิง Agentic แบบ Self-Service สำหรับองค์กรที่ต้องการนำ AI มาช่วยอัตโนมัติกระบวนการทางธุรกิจ ระบบนี้ถูกออกแบบมาให้ทีม Non-Technical สามารถสร้าง ควบคุม และติดตาม AI Agent ได้โดยไม่ต้องเขียนโค้ด

คุณสมบัติหลัก:
- **Multi-Tenant** — รองรับหลาย Org และ Workspace ในระบบเดียว
- **Policy Engine** — กำหนดกฎควบคุม AI ด้วย Risk Level และ Approval Flow
- **Budget Control** — ควบคุมค่าใช้จ่าย LLM ทั้งรายเดือนและต่อ Task
- **Brain / Knowledge Base** — จัดเก็บ Doctrine, Template, และ Memory สำหรับ Agent
- **Provider Abstraction** — รองรับ Anthropic, OpenAI, Google และ Local Model
- **Audit Trail** — บันทึกทุกการกระทำสำหรับ Compliance

---

## Overview (English)

**Future Agentic OS** is a self-service agentic operating system for organizations that want to automate business processes with AI. It is designed so that non-technical teams can create, govern, and monitor AI agents without writing code.

Key features:
- **Multi-Tenant** — supports multiple organizations and workspaces in a single deployment
- **Policy Engine** — define AI governance rules with risk levels and approval workflows
- **Budget Control** — per-task and per-month LLM cost limits with real-time tracking
- **Brain / Knowledge Base** — store doctrine, templates, and memory entries for agents
- **Provider Abstraction** — Anthropic, OpenAI, Google, and local model support
- **Audit Trail** — immutable event log for compliance and debugging

---

## Architecture — 5 Planes

```
┌─────────────────────────────────────────────────────────┐
│  Control Plane   — REST API, Auth, Multi-Tenant Routing  │
├─────────────────────────────────────────────────────────┤
│  Runtime Plane   — Task Execution, Step Orchestration    │
│                    Tool Registry, Artifact Storage        │
├─────────────────────────────────────────────────────────┤
│  Governance Plane — Policy Engine, Budget Guard,         │
│                     Approval Workflow, Audit Log          │
├─────────────────────────────────────────────────────────┤
│  Knowledge Plane  — Brain Store (Doctrine/Template/      │
│                     Memory), Vector Search (future)       │
├─────────────────────────────────────────────────────────┤
│  Provider Plane  — LLM Router (Anthropic / OpenAI /      │
│                    Google / Local), Cost Accounting        │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# 1. Clone and enter directory
cd future

# 2. Create virtual environment
python -m venv .venv
source .venv/bin/activate      # Linux/Mac
# .venv\Scripts\activate       # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 5. Run database migrations
alembic upgrade head

# 6. Start the server
uvicorn future.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=. --cov-report=html

# Run only unit tests (fast, no DB)
pytest -m unit

# Run integration tests
pytest -m integration

# Run specific test file
pytest tests/test_org.py -v
```

---

## Project Structure

```
future/
├── future/               ← Main FastAPI application
│   ├── main.py           ← App factory, routers, middleware
│   ├── config.py         ← Settings via pydantic-settings
│   ├── database.py       ← SQLAlchemy async engine
│   ├── dependencies.py   ← FastAPI Depends() helpers
│   ├── models/           ← SQLAlchemy ORM models
│   ├── routers/          ← API route handlers
│   ├── services/         ← Business logic layer
│   └── runtime/          ← Task execution engine
├── packages/
│   ├── core/             ← Shared enums, errors, utils
│   └── schemas/          ← Pydantic v2 request/response schemas
├── tests/                ← pytest test suite
├── alembic/              ← Database migrations
├── requirements.txt
├── pyproject.toml
└── .env.example
```

---

## Environment Variables

See `.env.example` for the full list. Required variables:

| Variable | Description |
|---|---|
| `APP_SECRET_KEY` | JWT signing secret (change in production) |
| `DATABASE_URL` | SQLAlchemy async database URL |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_API_KEY` | Google Gemini API key |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.111 + Python 3.11 |
| Validation | Pydantic v2 |
| Database | SQLAlchemy 2.0 async + SQLite (dev) / PostgreSQL (prod) |
| Migrations | Alembic |
| LLM Clients | Anthropic SDK, OpenAI SDK, google-generativeai |
| Scheduler | APScheduler (Kairos) |
| Testing | pytest + pytest-asyncio |
| Logging | structlog |

---

*Built for SIRINX Solar Energy — Thailand's AI-powered solar platform.*
