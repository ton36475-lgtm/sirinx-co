# สถาปัตยกรรม Future Agentic OS

> เวอร์ชัน: 0.1.0 | อัปเดต: เมษายน 2026

---

## ภาพรวมระบบ

**Future Agentic OS** คือระบบปฏิบัติการ AI แบบ Self-Service สำหรับองค์กร ออกแบบมาเพื่อให้ทีมสามารถสร้าง รัน และควบคุม AI Agents ได้อย่างอิสระโดยไม่ต้องพึ่งพาผู้เชี่ยวชาญด้านเทคนิค

ระบบประกอบด้วย **5 Control Planes** ที่ทำงานร่วมกันแบบแบ่งชั้นชัดเจน:

```
┌─────────────────────────────────────────────────────────┐
│              Future Agentic OS — API Layer               │
│                  FastAPI + Uvicorn :8000                 │
├──────────────┬──────────────┬───────────────────────────┤
│  Control     │  Runtime     │  Governance               │
│  Plane       │  Plane       │  Plane                    │
├──────────────┴──────────────┴───────────────────────────┤
│                   Knowledge Plane                        │
├─────────────────────────────────────────────────────────┤
│                    Provider Plane                        │
├─────────────────────────────────────────────────────────┤
│         Database Layer — SQLAlchemy 2.x + SQLite/PG      │
└─────────────────────────────────────────────────────────┘
```

### หลักการออกแบบ

| หลักการ | รายละเอียด |
|---------|-----------|
| Multi-Tenant | ทุก entity มี `org_id` — แยกข้อมูลระหว่าง Organization อย่างสมบูรณ์ |
| Governance First | ทุก action ผ่าน PolicyEngine และ BudgetEngine ก่อนเสมอ |
| Async by Default | FastAPI + SQLAlchemy AsyncSession + aiosqlite/asyncpg |
| Provider Agnostic | รองรับ Anthropic, OpenAI, Google และ Provider ใหม่ได้ง่าย |
| Audit Everything | ทุก event สำคัญถูกบันทึกใน AuditLog พร้อม timestamp UTC |

---

## 1. Control Plane (ชั้นควบคุม)

Control Plane เป็นชั้นบริหารจัดการ Identity และโครงสร้างองค์กร ทุก entity ต้องอยู่ภายใต้ Organization เสมอ

### 1.1 Entities หลัก

#### Organization (Org)
หน่วยสูงสุดของระบบ ทุก resource ล้วนเป็นของ Org ใด Org หนึ่ง

```
Org
├── id: UUID (primary key)
├── name: str
├── slug: str (unique, auto-generated จาก name)
├── industry: enum (solar_energy, manufacturing, hospitality, ...)
├── language: str (default: "th")
├── timezone: str (default: "Asia/Bangkok")
├── currency: str (default: "THB")
├── brand_colors: JSON
├── logo_url: str
├── is_active: bool
└── created_at / updated_at: datetime UTC
```

**Soft Delete:** การลบ Org จะ set `is_active = False` ไม่ลบจริง เพื่อรักษา audit trail

#### Workspace
พื้นที่ทำงานย่อยภายใน Org เช่น แบ่งตาม department หรือ project

```
Workspace
├── id: UUID
├── org_id: UUID → Org.id
├── name: str (unique ภายใน org)
├── description: str
├── is_active: bool
└── created_at / updated_at
```

#### OrgUser (User)
ผู้ใช้งานที่ผูกกับ Org พร้อม role-based access

```
OrgUser
├── id: UUID
├── org_id: UUID → Org.id
├── email: str (lowercase, unique ภายใน org)
├── full_name: str
├── role: enum (owner / admin / member / viewer)
├── is_active: bool
└── created_at / updated_at
```

**Roles:**
- `owner` — สิทธิ์เต็ม สร้าง/ลบ resource ทั้งหมด
- `admin` — บริหาร users, budgets, policies
- `member` — รัน tasks, อ่าน results
- `viewer` — อ่านได้อย่างเดียว

#### Pack
ชุด tools หรือ capabilities ที่รวมไว้ด้วยกัน (เช่น "Solar Analysis Pack", "Report Generation Pack")

```
Pack
├── id: UUID
├── org_id: UUID → Org.id
├── name: str
├── description: str
├── tools: JSON[]  ← รายการ tools ที่รวมอยู่
├── version: str
├── is_active: bool
└── created_at / updated_at
```

#### Policy
กฎการควบคุมที่ PolicyEngine ใช้ตรวจสอบก่อน action ทุกครั้ง

```
Policy
├── id: UUID
├── org_id: UUID → Org.id
├── name: str
├── description: str
├── rules: JSON[]  ← array ของ rule objects
├── is_active: bool
└── created_at / updated_at
```

### 1.2 Multi-Tenancy Pattern

```python
# ทุก query ต้องกรองด้วย org_id เสมอ
result = await db.execute(
    select(Task).where(
        and_(Task.id == task_id, Task.org_id == org.id)
    )
)
```

`org_id` ถูก inject ผ่าน `X-Org-ID` header และ validate ผ่าน `get_current_org` dependency ทุก request

---

## 2. Runtime Plane (ชั้นประมวลผล)

Runtime Plane คือหัวใจของการรัน AI Agent Loop ตาม pattern **Plan → Execute → Review**

### 2.1 Agent Loop

```
┌─────────────────────────────────────────────┐
│              TaskOrchestrator               │
│                                             │
│  1. รับ TaskRun request                     │
│  2. เรียก TaskPlanner (UltraPlan)           │
│  3. ส่ง plan ให้ StepExecutor              │
│  4. ส่ง output ให้ OutputReviewer          │
│  5. อัปเดต TaskRun status                  │
└─────────────────────────────────────────────┘
```

### 2.2 Components

#### TaskOrchestrator
ตัวควบคุมหลักที่ประสาน components ทั้งหมด

```python
# services/runtime/orchestrator.py
class TaskOrchestrator:
    async def run(self, task_run_id: str) -> TaskRunResult:
        # 1. โหลด task และ org context
        # 2. เรียก PolicyEngine.check()
        # 3. เรียก BudgetEngine.check()
        # 4. Plan → Execute → Review loop
        # 5. บันทึก AuditLog
```

#### TaskPlanner (UltraPlan)
วิเคราะห์ task และสร้าง execution plan แบบ structured

```python
# services/runtime/planner.py
class TaskPlanner:
    async def plan(self, task: Task, context: BrainContext) -> ExecutionPlan:
        # ใช้ Planning LLM (default: claude-opus-4-6)
        # คืน list of TaskStep พร้อม tool calls
```

#### StepExecutor
รัน step ทีละ step ตาม plan พร้อม tool execution

```python
# services/runtime/executor.py
class StepExecutor:
    async def execute_step(self, step: TaskStep) -> StepResult:
        # เรียก ToolRegistry.execute(tool_name, params)
        # บันทึก output, tokens, cost
```

#### OutputReviewer
ตรวจสอบ output ว่าถูกต้อง ครบถ้วน และตรงตาม requirements

```python
# services/runtime/reviewer.py
class OutputReviewer:
    async def review(self, output: str, task: Task) -> ReviewResult:
        # ใช้ Review LLM (default: claude-sonnet-4-6)
        # คืน passed/failed พร้อม feedback
```

### 2.3 ToolRegistry

ลงทะเบียนและเรียกใช้ tools ที่ agents ใช้ได้

```python
# services/runtime/tool_registry.py
BUILT_IN_TOOLS = {
    "read_file":     ReadFileTool,      # อ่านไฟล์จาก path
    "write_file":    WriteFileTool,     # เขียนไฟล์
    "search_files":  SearchFilesTool,   # ค้นหาไฟล์ตาม pattern
    "run_command":   RunCommandTool,    # รัน shell command (sandboxed)
    "http_request":  HttpRequestTool,   # เรียก external API
}
```

### 2.4 TaskRun State Machine

```
pending
   │
   ▼
planning ──► (UltraPlan สร้าง steps)
   │
   ▼
executing ──► (StepExecutor รัน steps ทีละตัว)
   │
   ▼
reviewing ──► (OutputReviewer ตรวจสอบ)
   │
   ├──► completed  (ผ่านการ review)
   └──► failed     (error หรือ review failed)

(cancelled — task ถูกยกเลิกก่อนรัน)
```

### 2.5 Database Models

#### Task
```
Task
├── id: UUID
├── org_id: UUID → Org.id
├── workspace_id: UUID → Workspace.id (optional)
├── title: str
├── description: str
├── priority: enum (low / medium / high / critical)
├── status: enum (pending / executing / completed / failed / cancelled)
├── input_data: JSON
├── max_steps: int (default: 20)
├── budget_limit: float (USD)
└── created_at / updated_at
```

#### TaskRun
```
TaskRun
├── id: UUID
├── task_id: UUID → Task.id
├── status: enum (pending / planning / executing / reviewing / completed / failed)
├── triggered_by: str (user_id หรือ "system")
├── plan: JSON  ← ExecutionPlan จาก Planner
├── output: str
├── error_message: str
├── tokens_used: int
├── cost_usd: float
├── started_at: datetime
├── completed_at: datetime
└── created_at
```

#### TaskStep
```
TaskStep
├── id: UUID
├── task_run_id: UUID → TaskRun.id
├── step_number: int
├── tool_name: str
├── tool_input: JSON
├── tool_output: str
├── status: str
├── started_at / completed_at
└── created_at
```

#### TaskArtifact
```
TaskArtifact
├── id: UUID
├── task_run_id: UUID → TaskRun.id
├── name: str
├── artifact_type: str (file / report / code / data)
├── content: str
├── metadata_: JSON
└── created_at
```

---

## 3. Governance Plane (ชั้นกำกับดูแล)

Governance Plane ทำหน้าที่เป็น "ประตูรักษาความปลอดภัย" ตรวจสอบทุก action ก่อนให้ผ่าน

### 3.1 PolicyEngine

ตรวจสอบ action ว่าตรงตาม policy ขององค์กรหรือไม่

```python
# services/governance/policy_engine.py
class PolicyEngine:
    async def check(self, org_id: str, action: str, context: dict) -> PolicyResult:
        """
        คืน:
          - allowed: True/False
          - matched_rules: list of rules ที่ match
          - reason: เหตุผลถ้าถูกปฏิเสธ
        """
```

**Rule Format:**
```json
{
  "rule_id": "no_external_http",
  "condition": "tool_name == 'http_request' AND domain NOT IN allowed_domains",
  "action": "deny",
  "message": "External HTTP requests must use approved domains only"
}
```

### 3.2 ApprovalEngine

จัดการ approval workflow สำหรับ actions ที่มีความเสี่ยงสูง

```python
# services/governance/approval_engine.py
class ApprovalEngine:
    async def request_approval(
        self,
        org_id: str,
        task_run_id: str,
        action: str,
        risk_level: str,  # low / medium / high / critical
        context: dict,
    ) -> ApprovalRequest:
        """สร้าง ApprovalRequest และรอ human decision"""

    async def get_decision(self, approval_id: str) -> ApprovalDecision:
        """ดึง decision ของ approval"""
```

**ApprovalRequest States:**
```
pending → approved (task ดำเนินการต่อ)
        → rejected (task หยุด)
```

**Database Models:**
```
ApprovalRequest
├── id: UUID
├── org_id: UUID → Org.id
├── task_run_id: UUID → TaskRun.id
├── action: str  ← description ของ action ที่ขอ approval
├── risk_level: enum (low / medium / high / critical)
├── context: JSON
├── requested_by: str
├── status: enum (pending / approved / rejected)
└── created_at / updated_at

ApprovalDecision
├── id: UUID
├── approval_id: UUID → ApprovalRequest.id
├── decision: enum (approved / rejected)
├── decided_by: str
├── reason: str
└── created_at
```

### 3.3 BudgetEngine

ตรวจสอบงบประมาณก่อนรัน task และหักงบประมาณหลัง task เสร็จ

```python
# services/governance/budget_engine.py
class BudgetEngine:
    async def check(self, org_id: str, estimated_cost: float) -> BudgetCheckResult:
        """
        ตรวจสอบว่า estimated_cost ไม่เกิน remaining budget
        คืน: allowed, remaining, current_usage
        """

    async def deduct(self, budget_id: str, cost_usd: float, task_run_id: str):
        """บันทึก BudgetUsage หลัง task เสร็จ"""
```

**Budget Model:**
```
Budget
├── id: UUID
├── org_id: UUID → Org.id
├── name: str
├── monthly_limit: float (USD)
├── task_limit: float (USD per task)
├── alert_threshold: float (0.0-1.0, default: 0.8 = แจ้งเตือนเมื่อใช้ 80%)
├── currency: str
└── created_at / updated_at

BudgetUsage
├── id: UUID
├── budget_id: UUID → Budget.id
├── task_run_id: UUID → TaskRun.id
├── cost_usd: float
├── tokens_used: int
├── model_name: str
└── created_at
```

### 3.4 AuditLogger

บันทึกทุก event สำคัญสำหรับ compliance และ debugging

```python
# services/governance/audit_logger.py
class AuditLogger:
    async def log(
        self,
        org_id: str,
        event_type: str,  # task.created / task.completed / approval.requested / ...
        user_id: str,
        resource_type: str,
        resource_id: str,
        metadata: dict,
    ):
        """บันทึก AuditEvent ลง database"""
```

**AuditEvent Model:**
```
AuditEvent
├── id: UUID
├── org_id: UUID → Org.id
├── event_type: str  ← dot-notation เช่น "task.run.completed"
├── user_id: str
├── resource_type: str  ← "task" / "approval" / "budget" / ...
├── resource_id: str
├── metadata: JSON  ← ข้อมูลเพิ่มเติม
└── created_at (UTC)
```

**Event Types ที่ใช้:**
```
org.created           org.updated           org.deleted
workspace.created     workspace.updated
user.created          user.deactivated
task.created          task.run.started      task.run.completed
task.run.failed       task.cancelled
approval.requested    approval.approved     approval.rejected
budget.created        budget.limit_reached  budget.alert_triggered
brain.entry.created   brain.entry.updated
provider.created      provider.tested
```

---

## 4. Knowledge Plane (ชั้นความรู้)

Knowledge Plane เก็บและจัดการ "สมองขององค์กร" — ข้อมูลที่ agents ใช้ประกอบการตัดสินใจ

### 4.1 Company Brain

**BrainEntry** คือหน่วยความรู้พื้นฐาน รองรับ 5 ประเภท:

| entry_type | คำอธิบาย | ตัวอย่าง |
|-----------|---------|---------|
| `doctrine` | หลักการและค่านิยมองค์กร | "เราเน้น B2B Solar, ลูกค้าคือโรงงาน/โรงแรม" |
| `template` | แม่แบบสำหรับ output | template proposal, report, email |
| `knowledge` | ความรู้ทั่วไป | ข้อมูลผลิตภัณฑ์, ราคา, specs |
| `research_standard` | มาตรฐานการวิจัย | วิธีคำนวณ ROI, แนวทางการวิเคราะห์ |
| `memory` | ความจำระยะสั้น/ยาว | ผลการรัน task ก่อนหน้า, patterns |

```
BrainEntry
├── id: UUID
├── org_id: UUID → Org.id
├── entry_type: enum (doctrine / template / knowledge / research_standard / memory)
├── title: str
├── content: str (เนื้อหาหลัก)
├── tags: str[]  ← ใช้สำหรับ filtering
├── metadata_: JSON  ← ข้อมูลเพิ่มเติมเช่น version, author
├── source: str  ← แหล่งที่มา
└── created_at / updated_at
```

### 4.2 BrainManager

จัดการ CRUD ของ BrainEntry และดึง context ที่เกี่ยวข้องให้ agent

```python
# services/knowledge/brain_manager.py
class BrainManager:
    async def get_context(
        self,
        org_id: str,
        task_description: str,
        max_entries: int = 10,
    ) -> BrainContext:
        """
        ดึง BrainEntry ที่เกี่ยวข้องกับ task
        - doctrine entries (เสมอ)
        - knowledge entries ที่ match keywords
        - template entries ที่เกี่ยวข้อง
        รวมเป็น context string สำหรับ LLM prompt
        """
```

### 4.3 Brain Search

ค้นหา BrainEntry แบบ full-text (dev) หรือ vector similarity (prod)

```
POST /api/v1/brain/search
{
  "query": "solar ROI calculation",
  "entry_type": "knowledge",  // optional filter
  "limit": 10
}
```

**Dev:** ค้นหาแบบ substring match บน title + content
**Prod:** แนะนำ pgvector หรือ Qdrant สำหรับ semantic search

### 4.4 AutoDream

กระบวนการสรุปความรู้ใหม่จากผลของ task โดยอัตโนมัติ

```python
# services/knowledge/memory.py
class AutoDream:
    async def condense(self, task_run: TaskRun, org_id: str):
        """
        หลัง task เสร็จ:
        1. วิเคราะห์ output + steps
        2. สกัด patterns ใหม่
        3. สร้าง BrainEntry ประเภท 'memory'
        4. รัน daily ผ่าน KairosScheduler
        """
```

### 4.5 TemplateManager

จัดการ template สำหรับ output format ต่าง ๆ

```python
# services/knowledge/templates.py
class TemplateManager:
    async def get_template(self, org_id: str, template_name: str) -> str:
        """ดึง template จาก BrainEntry ประเภท 'template'"""

    async def render(self, template: str, variables: dict) -> str:
        """Render template ด้วย Jinja2"""
```

**Built-in Templates:**
- `proposal_solar` — ใบเสนอราคาพลังงานแสงอาทิตย์
- `monthly_report` — รายงานประจำเดือน
- `lead_outreach_email` — email ติดต่อลูกค้า
- `roi_analysis` — รายงานวิเคราะห์ ROI

---

## 5. Provider Plane (ชั้น AI Provider)

Provider Plane จัดการการเชื่อมต่อกับ LLM providers ต่าง ๆ และ routing อัจฉริยะ

### 5.1 BaseLLMProvider

```python
# services/providers/base.py
class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        messages: list[Message],
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> GenerationResult:
        """รัน LLM generation"""

    @abstractmethod
    async def embed(self, text: str, model: str) -> list[float]:
        """สร้าง embedding vector"""

    @property
    @abstractmethod
    def capabilities(self) -> list[str]:
        """capabilities ของ provider นี้"""
```

### 5.2 Provider Implementations

#### AnthropicProvider
```python
# services/providers/anthropic.py
# ใช้ claude-opus-4-6 สำหรับ planning (128K context)
# ใช้ claude-sonnet-4-6 สำหรับ execution
# capabilities: ["planning", "execution", "review", "analysis"]
```

#### OpenAIProvider
```python
# services/providers/openai.py
# ใช้ gpt-4o สำหรับ general tasks
# ใช้ text-embedding-3-small สำหรับ embedding
# capabilities: ["execution", "embedding", "review"]
```

#### GoogleProvider
```python
# services/providers/google.py
# ใช้ gemini-1.5-pro สำหรับ multimodal tasks
# capabilities: ["execution", "vision", "research"]
```

### 5.3 ProviderRegistry

routing ตาม capability และ priority

```python
# services/providers/registry.py
class ProviderRegistry:
    def get_provider_for(
        self,
        capability: str,  # "planning" | "execution" | "review" | "embedding"
        org_id: str,
    ) -> BaseLLMProvider:
        """
        เลือก provider ที่:
        1. มี capability ที่ต้องการ
        2. is_active = True
        3. priority สูงที่สุด
        4. ยังมี budget เหลือ
        """
```

**Default Model Routing:**

| Capability | Default Model | Provider |
|-----------|--------------|---------|
| planning | claude-opus-4-6 | Anthropic |
| execution | claude-sonnet-4-6 | Anthropic |
| review | claude-sonnet-4-6 | Anthropic |
| embedding | text-embedding-3-small | OpenAI |

### 5.4 ProviderConfig Model

```
ProviderConfig
├── id: UUID
├── org_id: UUID → Org.id
├── name: enum (anthropic / openai / google / mock)
├── api_key_encrypted: str  ← base64 encoded (prod: Fernet)
├── models: str[]  ← รายการ model ที่ใช้ได้
├── capabilities: str[]  ← planning / execution / review / embedding
├── is_active: bool
├── priority: int  ← สูงกว่า = ใช้ก่อน
├── extra_config: JSON  ← base_url, timeout, etc.
└── created_at / updated_at
```

**Security Note:** API key ไม่เคยถูก return ใน response ในรูปแบบ plaintext จะถูก mask เหลือเพียง 4 ตัวท้าย เช่น `****abcd`

### 5.5 MockProvider

สำหรับ testing โดยไม่ต้องใช้ API จริง

```python
# services/providers/mock.py
class MockProvider(BaseLLMProvider):
    async def generate(self, ...) -> GenerationResult:
        return GenerationResult(
            text="Mock response for testing",
            tokens_used=10,
            cost_usd=0.0,
        )
```

---

## Kairos System

Kairos คือ background monitoring และ scheduling system ที่ทำงานเบื้องหลังอย่างต่อเนื่อง

### KairosMonitor

ตรวจสอบสถานะของระบบทุก `KAIROS_INTERVAL_SECONDS` (default: 60 วินาที)

```python
# services/kairos/monitor.py
class KairosMonitor:
    async def run_cycle(self):
        await self._check_budget_alerts()    # แจ้งเตือนเมื่อใกล้เกิน budget
        await self._check_approval_timeouts()  # escalate approvals ที่รอนานเกิน threshold
        await self._check_stuck_tasks()      # รีสตาร์ท tasks ที่ค้างอยู่นานเกินไป
```

**Budget Alert Logic:**
```
ถ้า current_month_usage / monthly_limit >= alert_threshold:
    log AuditEvent: "budget.alert_triggered"
    ส่ง notification (Telegram / Email)
```

**Approval Timeout Logic:**
```
ถ้า approval.status == "pending" AND
   now - approval.created_at > org.approval_timeout_hours:
    escalate ไปยัง admin role
    log AuditEvent: "approval.timeout_escalated"
```

### KairosScheduler

รัน scheduled tasks ตามเวลา

```python
# services/kairos/scheduler.py
class KairosScheduler:
    JOBS = [
        # รัน AutoDream ทุกวัน 02:00 น. UTC
        CronJob("daily_brain_condensation", "0 2 * * *", auto_dream.condense_all),

        # ตรวจสอบ budget ทุกชั่วโมง
        CronJob("hourly_budget_check", "0 * * * *", monitor.check_budgets),

        # Cleanup expired approvals ทุกวัน 03:00 น. UTC
        CronJob("daily_approval_cleanup", "0 3 * * *", cleanup.expire_approvals),
    ]
```

---

## Database Schema

### Stack

| Component | Dev | Production |
|-----------|-----|-----------|
| ORM | SQLAlchemy 2.x + AsyncSession | เหมือนกัน |
| Database | SQLite + aiosqlite | PostgreSQL + asyncpg |
| Migration | Alembic | เหมือนกัน |

### Conventions

```python
# Base model ทุก table ใช้ pattern เดียวกัน
class Base(DeclarativeBase):
    pass

class MyModel(Base):
    __tablename__ = "my_models"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    org_id: Mapped[str] = mapped_column(String(36), ForeignKey("orgs.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
```

**Rules:**
- UUID primary keys ทุก table (String(36))
- UTC timestamps ทุก record
- `org_id` index ทุก table ที่เป็น multi-tenant
- Soft delete ด้วย `is_active = False` (ไม่ลบจริง) สำหรับ entities หลัก
- JSON fields สำหรับ flexible data

### Entity Relationship Diagram

```
Org
 ├── Workspace (1:N)
 ├── OrgUser (1:N)
 ├── Pack (1:N)
 ├── Policy (1:N)
 ├── ProviderConfig (1:N)
 ├── Budget (1:N)
 │    └── BudgetUsage (1:N)
 ├── Task (1:N)
 │    └── TaskRun (1:N)
 │         ├── TaskStep (1:N)
 │         └── TaskArtifact (1:N)
 ├── BrainEntry (1:N)
 ├── ApprovalRequest (1:N)
 │    └── ApprovalDecision (1:N)
 └── AuditEvent (1:N)
```

---

## DNA Loop

DNA Loop คือกระบวนการเรียนรู้และพัฒนาตัวเองของระบบอย่างต่อเนื่อง

```
        ┌──────────────────────────────┐
        │                              │
   ┌────▼────┐    ┌──────────┐    ┌───▼──────┐
   │  Learn  │───►│  Evolve  │───►│ Execute  │
   └─────────┘    └──────────┘    └──────────┘
        ▲                               │
        └───────────────────────────────┘
```

### Learn (เรียนรู้)
- บันทึก task logs และ outcomes ทุกครั้ง
- เก็บ error patterns และ success patterns
- รัน AutoDream เพื่อสกัด insights จาก task history
- เก็บลงใน BrainEntry ประเภท `memory`

### Evolve (พัฒนา)
- KairosScheduler รัน daily brain condensation
- สรุป memory entries เป็น knowledge entries
- ปรับปรุง templates จาก patterns ที่พบ
- อัปเดต research_standard จากผลการวิเคราะห์

### Execute (ดำเนินการ)
- TaskOrchestrator รัน agent loop
- ดึง BrainContext ที่เกี่ยวข้อง
- ผลิต output ตาม template ที่กำหนด
- บันทึก artifacts สำหรับ Learn cycle ต่อไป

---

## Configuration Reference

ตัวแปรสภาพแวดล้อมหลักที่ควบคุมพฤติกรรมระบบ:

```env
# Application
APP_ENV=development          # development | production
APP_SECRET_KEY=...           # ใช้สร้าง JWT tokens
APP_HOST=0.0.0.0
APP_PORT=8000
CORS_ORIGINS=http://localhost:3000,http://localhost:3002

# Database
DATABASE_URL=sqlite+aiosqlite:///./future.db   # dev
# DATABASE_URL=postgresql+asyncpg://user:pass@host/db  # prod
DATABASE_ECHO=false

# LLM Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...

# Default Models
DEFAULT_PLANNING_MODEL=claude-opus-4-6
DEFAULT_EXECUTION_MODEL=claude-sonnet-4-6
DEFAULT_EMBEDDING_MODEL=text-embedding-3-small

# Budget Defaults
DEFAULT_MONTHLY_BUDGET=100.0     # USD
DEFAULT_TASK_BUDGET=5.0          # USD per task

# Kairos
KAIROS_ENABLED=true
KAIROS_INTERVAL_SECONDS=60

# Redis (สำหรับ task queue production)
REDIS_URL=redis://localhost:6379/0
```

---

*Future Agentic OS — Built for Enterprise AI Autonomy*
