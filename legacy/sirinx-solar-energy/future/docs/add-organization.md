# วิธีเพิ่ม Organization ใหม่

> คู่มือฉบับสมบูรณ์: ตั้งค่า Organization ใหม่ใน Future Agentic OS ทีละขั้นตอน

---

## ภาพรวม

การเพิ่ม Organization ใหม่ให้พร้อมใช้งานเต็มรูปแบบประกอบด้วย **7 ขั้นตอน**:

```
1. สร้าง Organization  →  ได้ org_id
2. สร้าง Workspace     →  พื้นที่ทำงาน
3. เพิ่ม User          →  กำหนดผู้ใช้งาน
4. ตั้งค่า Provider    →  เชื่อมต่อ AI
5. กำหนด Budget        →  ควบคุมค่าใช้จ่าย
6. เพิ่ม Brain         →  ความรู้สำหรับ Agent
7. กำหนด Policy        →  กฎการควบคุม (optional)
```

**ข้อกำหนดเบื้องต้น:**
- API server รันอยู่ที่ `http://localhost:8000`
- มี API key ของ LLM provider อย่างน้อย 1 อัน (Anthropic, OpenAI, หรือ Google)

---

## ขั้นตอนที่ 1 — สร้าง Organization

Organization คือหน่วยสูงสุดของระบบ ทุก resource จะอยู่ภายใต้ Org นี้

**API Endpoint:**
```
POST /api/v1/orgs/
```

**Request Body (ทุก field):**
```json
{
  "name": "SIRINX Solar Energy",
  "slug": "sirinx-solar",
  "industry": "solar_energy",
  "language": "th",
  "timezone": "Asia/Bangkok",
  "currency": "THB",
  "brand_colors": {
    "primary": "#F5A623",
    "secondary": "#0A2342",
    "accent": "#10B981"
  },
  "logo_url": "https://cdn.sirinx.com/logo.png"
}
```

**Field Reference:**
| Field | ประเภท | จำเป็น | คำอธิบาย |
|-------|--------|--------|---------|
| `name` | string | ใช่ | ชื่อองค์กร (แสดงในระบบ) |
| `slug` | string | ไม่ | URL-safe identifier (auto-generate จาก name ถ้าไม่ระบุ) |
| `industry` | enum | ไม่ | ประเภทธุรกิจ: `solar_energy`, `manufacturing`, `hospitality`, `retail`, `logistics`, `healthcare`, `finance`, `technology`, `other` |
| `language` | string | ไม่ | ภาษาหลัก เช่น `"th"`, `"en"`. Default: `"th"` |
| `timezone` | string | ไม่ | Timezone. Default: `"Asia/Bangkok"` |
| `currency` | string | ไม่ | สกุลเงิน. Default: `"THB"` |
| `brand_colors` | object | ไม่ | สีแบรนด์ (key-value) |
| `logo_url` | string | ไม่ | URL รูปโลโก้ |

**cURL Command:**
```bash
curl -X POST http://localhost:8000/api/v1/orgs/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SIRINX Solar Energy",
    "slug": "sirinx-solar",
    "industry": "solar_energy",
    "language": "th",
    "timezone": "Asia/Bangkok",
    "currency": "THB",
    "brand_colors": {
      "primary": "#F5A623",
      "secondary": "#0A2342"
    }
  }'
```

**Response สำเร็จ (201 Created):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "SIRINX Solar Energy",
  "slug": "sirinx-solar",
  "industry": "solar_energy",
  "language": "th",
  "timezone": "Asia/Bangkok",
  "currency": "THB",
  "brand_colors": { "primary": "#F5A623", "secondary": "#0A2342" },
  "logo_url": null,
  "is_active": true,
  "workspace_count": 0,
  "created_at": "2026-04-02T10:00:00Z",
  "updated_at": "2026-04-02T10:00:00Z"
}
```

**สำคัญ:** บันทึก `id` ไว้ — นี่คือ `ORG_ID` ที่จะใช้ใน header `X-Org-ID` ทุก request ต่อไป

```bash
# ตั้ง variable สำหรับใช้ในขั้นตอนต่อไป
ORG_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**Errors ที่อาจพบ:**
- `409 Conflict` — slug ซ้ำกับ org ที่มีอยู่แล้ว ให้เปลี่ยน slug

---

## ขั้นตอนที่ 2 — สร้าง Workspace

Workspace คือพื้นที่ทำงานย่อยภายใน Org เหมาะสำหรับแบ่งตาม department หรือ project

**API Endpoint:**
```
POST /api/v1/workspaces/
```

**Headers ที่ต้องใส่:**
```
X-Org-ID: <org_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Sales Operations",
  "description": "พื้นที่ทำงานสำหรับทีม Sales — Lead analysis, proposal generation, follow-up automation"
}
```

**Field Reference:**
| Field | ประเภท | จำเป็น | คำอธิบาย |
|-------|--------|--------|---------|
| `name` | string | ใช่ | ชื่อ Workspace (unique ภายใน org) |
| `description` | string | ไม่ | คำอธิบายวัตถุประสงค์ของ workspace |

**cURL Command:**
```bash
curl -X POST http://localhost:8000/api/v1/workspaces/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "name": "Sales Operations",
    "description": "พื้นที่ทำงานสำหรับทีม Sales"
  }'
```

**Response สำเร็จ (201 Created):**
```json
{
  "id": "ws-uuid-1234-5678-abcd",
  "org_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Sales Operations",
  "description": "พื้นที่ทำงานสำหรับทีม Sales",
  "is_active": true,
  "created_at": "2026-04-02T10:01:00Z",
  "updated_at": "2026-04-02T10:01:00Z"
}
```

```bash
WORKSPACE_ID="ws-uuid-1234-5678-abcd"
```

**แนะนำ:** สร้าง Workspace หลายอันแยกตาม department:
- `Sales Operations` — สำหรับ lead และ proposal
- `Finance Analysis` — สำหรับ ROI calculation
- `Content Creation` — สำหรับ marketing content

---

## ขั้นตอนที่ 3 — เพิ่ม User

เพิ่มสมาชิกเข้าในองค์กรพร้อมกำหนด role

**API Endpoint:**
```
POST /api/v1/users/
```

**Request Body:**
```json
{
  "email": "admin@sirinx.com",
  "full_name": "สมชาย ใจดี",
  "role": "admin"
}
```

**Field Reference:**
| Field | ประเภท | จำเป็น | คำอธิบาย |
|-------|--------|--------|---------|
| `email` | string (email) | ใช่ | อีเมล (lowercase อัตโนมัติ, unique ภายใน org) |
| `full_name` | string | ใช่ | ชื่อ-นามสกุล |
| `role` | enum | ใช่ | `owner`, `admin`, `member`, `viewer` |

**Role Permissions:**
| Role | สร้าง Org Resources | รัน Tasks | ดู Results | อนุมัติ Approvals |
|------|-------------------|-----------|-----------|-----------------|
| `owner` | ทั้งหมด | ใช่ | ใช่ | ใช่ |
| `admin` | บาง resource | ใช่ | ใช่ | ใช่ |
| `member` | ไม่ | ใช่ | ใช่ | ไม่ |
| `viewer` | ไม่ | ไม่ | ใช่ | ไม่ |

**cURL Command — เพิ่ม Owner:**
```bash
curl -X POST http://localhost:8000/api/v1/users/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "email": "owner@sirinx.com",
    "full_name": "สมชาย ใจดี",
    "role": "owner"
  }'
```

**cURL Command — เพิ่ม Admin:**
```bash
curl -X POST http://localhost:8000/api/v1/users/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "email": "sales-manager@sirinx.com",
    "full_name": "สมหญิง รักงาน",
    "role": "admin"
  }'
```

**cURL Command — เพิ่ม Member:**
```bash
curl -X POST http://localhost:8000/api/v1/users/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "email": "sales@sirinx.com",
    "full_name": "ประสิทธิ์ ขายดี",
    "role": "member"
  }'
```

**Response สำเร็จ (201 Created):**
```json
{
  "id": "user-uuid-here",
  "org_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "admin@sirinx.com",
  "full_name": "สมชาย ใจดี",
  "role": "admin",
  "is_active": true,
  "created_at": "2026-04-02T10:02:00Z",
  "updated_at": "2026-04-02T10:02:00Z"
}
```

**Errors ที่อาจพบ:**
- `409 Conflict` — email ซ้ำใน org นี้

---

## ขั้นตอนที่ 4 — ตั้งค่า AI Provider

เชื่อมต่อ AI Provider เพื่อให้ agents ใช้งานได้ API key จะถูก encrypt ก่อนบันทึก และ **ไม่เคย return ในรูป plaintext**

**API Endpoint:**
```
POST /api/v1/providers/
```

**Request Body:**
```json
{
  "name": "anthropic",
  "api_key": "sk-ant-api03-your-actual-key-here",
  "models": ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
  "capabilities": ["planning", "execution", "review"],
  "is_active": true,
  "priority": 10,
  "extra_config": {}
}
```

**Field Reference:**
| Field | ประเภท | จำเป็น | คำอธิบาย |
|-------|--------|--------|---------|
| `name` | enum | ใช่ | `anthropic`, `openai`, `google`, `mock` |
| `api_key` | string | ใช่ | API key ของ provider (encrypt ที่เซิร์ฟเวอร์) |
| `models` | string[] | ใช่ | รายการ model ที่ใช้ได้ |
| `capabilities` | enum[] | ใช่ | `planning`, `execution`, `review`, `embedding` |
| `is_active` | bool | ไม่ | เปิด/ปิดใช้งาน. Default: `true` |
| `priority` | int | ไม่ | ลำดับความสำคัญ (สูงกว่า = ใช้ก่อน). Default: `0` |
| `extra_config` | object | ไม่ | ค่า config เพิ่มเติม |

**cURL Command — Anthropic (Claude):**
```bash
curl -X POST http://localhost:8000/api/v1/providers/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "name": "anthropic",
    "api_key": "sk-ant-api03-your-key-here",
    "models": ["claude-opus-4-6", "claude-sonnet-4-6"],
    "capabilities": ["planning", "execution", "review"],
    "priority": 10
  }'
```

**cURL Command — OpenAI (GPT + Embeddings):**
```bash
curl -X POST http://localhost:8000/api/v1/providers/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "name": "openai",
    "api_key": "sk-proj-your-key-here",
    "models": ["gpt-4o", "text-embedding-3-small"],
    "capabilities": ["execution", "embedding"],
    "priority": 5
  }'
```

**cURL Command — Google (Gemini):**
```bash
curl -X POST http://localhost:8000/api/v1/providers/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "name": "google",
    "api_key": "AIzaSyYour-key-here",
    "models": ["gemini-1.5-pro"],
    "capabilities": ["execution", "vision"],
    "priority": 3
  }'
```

**Response สำเร็จ (201 Created):**
```json
{
  "id": "provider-uuid-here",
  "org_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "anthropic",
  "models": ["claude-opus-4-6", "claude-sonnet-4-6"],
  "capabilities": ["planning", "execution", "review"],
  "is_active": true,
  "priority": 10,
  "api_key_masked": "****abcd",
  "created_at": "2026-04-02T10:03:00Z",
  "updated_at": "2026-04-02T10:03:00Z"
}
```

สังเกตว่า `api_key_masked` แสดงเพียง 4 ตัวท้าย — นี่คือพฤติกรรมที่ถูกต้อง ปลอดภัย

**ทดสอบการเชื่อมต่อ:**
```bash
curl -X POST http://localhost:8000/api/v1/providers/$PROVIDER_ID/test \
  -H "X-Org-ID: $ORG_ID"

# Response ที่ต้องการ:
# {"status": "ok", "provider": "anthropic", "response": "..."}
```

---

## ขั้นตอนที่ 5 — กำหนด Budget

ตั้งค่าวงเงินรายเดือนและต่อ task เพื่อควบคุมค่าใช้จ่าย AI

**API Endpoint:**
```
POST /api/v1/budgets/
```

**Request Body:**
```json
{
  "name": "Monthly AI Budget — April 2026",
  "monthly_limit": 100.0,
  "task_limit": 5.0,
  "alert_threshold": 0.8,
  "currency": "USD"
}
```

**Field Reference:**
| Field | ประเภท | จำเป็น | คำอธิบาย |
|-------|--------|--------|---------|
| `name` | string | ใช่ | ชื่อ budget สำหรับ reference |
| `monthly_limit` | float | ใช่ | วงเงินรายเดือน (USD) |
| `task_limit` | float | ไม่ | วงเงินสูงสุดต่อ task (USD) |
| `alert_threshold` | float | ไม่ | แจ้งเตือนเมื่อใช้ถึง % นี้ (0.0-1.0). Default: `0.8` = 80% |
| `currency` | string | ไม่ | Default: `"USD"` |

**ตัวอย่าง Budget Tiers:**

| ระดับ | monthly_limit | task_limit | alert_threshold | เหมาะกับ |
|-------|--------------|-----------|-----------------|---------|
| Starter | $50 | $2 | 0.8 | ทดสอบระบบ |
| Growth | $200 | $5 | 0.8 | ใช้งาน daily |
| Enterprise | $1,000 | $20 | 0.75 | Production ขนาดใหญ่ |

**cURL Command:**
```bash
curl -X POST http://localhost:8000/api/v1/budgets/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "name": "Monthly AI Budget",
    "monthly_limit": 100.0,
    "task_limit": 5.0,
    "alert_threshold": 0.8,
    "currency": "USD"
  }'
```

**Response สำเร็จ (201 Created):**
```json
{
  "id": "budget-uuid-here",
  "org_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Monthly AI Budget",
  "monthly_limit": 100.0,
  "task_limit": 5.0,
  "alert_threshold": 0.8,
  "currency": "USD",
  "current_month_usage": 0.0,
  "remaining": 100.0,
  "utilization_pct": 0.0,
  "created_at": "2026-04-02T10:04:00Z",
  "updated_at": "2026-04-02T10:04:00Z"
}
```

**ตรวจสอบ usage ตลอดเวลา:**
```bash
curl http://localhost:8000/api/v1/budgets/$BUDGET_ID \
  -H "X-Org-ID: $ORG_ID"
# ดู current_month_usage, remaining, utilization_pct
```

---

## ขั้นตอนที่ 6 — สร้าง Company Brain

Brain คือคลังความรู้ขององค์กรที่ agents ใช้ประกอบการตัดสินใจ ควรเพิ่มอย่างน้อย 1 `doctrine` entry

**API Endpoint:**
```
POST /api/v1/brain/
```

**cURL Command — Doctrine (หลักการองค์กร):**
```bash
curl -X POST http://localhost:8000/api/v1/brain/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "entry_type": "doctrine",
    "title": "SIRINX — หลักการหลักและ ICP",
    "content": "SIRINX Solar Energy ให้บริการ B2B EPC (Engineering, Procurement, Construction) สำหรับพลังงานแสงอาทิตย์ในประเทศไทย\n\nกลุ่มลูกค้าเป้าหมาย (ICP):\n- โรงงานอุตสาหกรรมที่มีค่าไฟ > 50,000 บาท/เดือน\n- โรงแรมและรีสอร์ทขนาดกลาง-ใหญ่\n- ห้างสรรพสินค้าและอาคารพาณิชย์\n\nบริการหลัก:\n1. ออกแบบและติดตั้งระบบ Solar PV (On-grid, Off-grid, Hybrid)\n2. O&M (Operations & Maintenance) รายปี\n3. AI Platform สำหรับ monitoring และ optimization",
    "tags": ["doctrine", "core", "icp", "b2b"],
    "metadata": { "version": "1.0", "author": "CEO" },
    "source": "company_handbook_2026"
  }'
```

**cURL Command — Knowledge (ความรู้ผลิตภัณฑ์):**
```bash
curl -X POST http://localhost:8000/api/v1/brain/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "entry_type": "knowledge",
    "title": "ราคาและ Specifications ระบบ Solar PV",
    "content": "ระบบ Solar PV มาตรฐานของ SIRINX:\n\nขนาด 100 kWp:\n- ราคาติดตั้ง: 2,500,000 - 3,000,000 บาท\n- ผลิตพลังงาน: ~430 kWh/วัน\n- Payback period: 4-6 ปี\n- อายุการใช้งาน: 25+ ปี\n\nขนาด 500 kWp:\n- ราคาติดตั้ง: 11,000,000 - 13,000,000 บาท\n- ผลิตพลังงาน: ~2,150 kWh/วัน\n- Payback period: 4-5 ปี",
    "tags": ["solar", "pricing", "specs", "kWp"],
    "source": "product_catalog_2026"
  }'
```

**cURL Command — Template (แม่แบบเอกสาร):**
```bash
curl -X POST http://localhost:8000/api/v1/brain/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "entry_type": "template",
    "title": "Template: ใบเสนอราคา Solar B2B",
    "content": "# ใบเสนอราคาระบบพลังงานแสงอาทิตย์\n\n**บริษัท:** {{customer_name}}\n**วันที่:** {{proposal_date}}\n**อ้างอิง:** {{reference_number}}\n\n## สรุปโครงการ\n- ขนาดระบบ: {{system_size}} kWp\n- ค่าไฟปัจจุบัน: {{current_bill}} บาท/เดือน\n- พื้นที่ติดตั้ง: {{roof_area}} ตร.ม.\n\n## ROI Analysis\n- เงินลงทุนเริ่มต้น: {{investment}} บาท\n- ประหยัดต่อปี: {{annual_savings}} บาท\n- Payback Period: {{payback_years}} ปี\n- ROI 25 ปี: {{roi_25yr}} %",
    "tags": ["template", "proposal", "solar", "b2b"],
    "metadata": { "format": "markdown", "version": "2.0" }
  }'
```

**cURL Command — Research Standard (มาตรฐานการวิเคราะห์):**
```bash
curl -X POST http://localhost:8000/api/v1/brain/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "entry_type": "research_standard",
    "title": "มาตรฐานการคำนวณ Solar ROI",
    "content": "การคำนวณ ROI ระบบ Solar ของ SIRINX:\n\n1. ชั่วโมงแสงแดดมาตรฐานไทย: 4.5-5.5 ชั่วโมง/วัน (ขึ้นกับจังหวัด)\n2. Performance Ratio: 0.80 (มาตรฐานอุตสาหกรรม)\n3. System Degradation: 0.5%/ปี\n4. ค่าไฟ escalation: 3%/ปี (ตามสถิติ กฟน.)\n5. Discount Rate: 7% (WACC มาตรฐาน)\n\nสูตรคำนวณ:\nAnnual Generation (kWh) = System Size (kWp) × Peak Sun Hours × 365 × PR\nAnnual Savings (THB) = Annual Generation × Average Tariff Rate\nSimple Payback = Total Investment / Annual Savings",
    "tags": ["solar", "roi", "calculation", "standard"],
    "source": "engineering_dept_guidelines"
  }'
```

**ค้นหา Brain entry ที่เพิ่มไป:**
```bash
curl -X POST http://localhost:8000/api/v1/brain/search \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{"query": "solar ROI", "limit": 5}'
```

---

## ขั้นตอนที่ 7 — กำหนด Policy (optional)

Policy กำหนดกฎการควบคุมที่ agents ต้องปฏิบัติตาม เช่น ขออนุมัติก่อนส่ง email หรือจำกัด domains ที่ HTTP request ทำได้

**API Endpoint:**
```
POST /api/v1/policies/
```

**cURL Command — Security Policy:**
```bash
curl -X POST http://localhost:8000/api/v1/policies/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "name": "Default Security Policy",
    "description": "กฎพื้นฐานด้านความปลอดภัยสำหรับ AI agents",
    "rules": [
      {
        "rule_id": "http_domain_whitelist",
        "description": "จำกัด HTTP requests เฉพาะ approved domains",
        "condition": "tool_name == http_request",
        "allowed_domains": [
          "api.anthropic.com",
          "api.openai.com",
          "api.sirinx.com",
          "data.egat.co.th"
        ],
        "action": "restrict",
        "message": "HTTP requests ต้องใช้ approved domains เท่านั้น"
      },
      {
        "rule_id": "high_cost_approval",
        "description": "Task ที่ค่าใช้จ่ายสูงต้องได้รับอนุมัติ",
        "condition": "estimated_cost_usd > 5.0",
        "action": "require_approval",
        "approval_role": "admin",
        "message": "Task ที่มีต้นทุนเกิน $5 ต้องได้รับการอนุมัติจาก Admin"
      }
    ],
    "is_active": true
  }'
```

**cURL Command — Email Approval Policy:**
```bash
curl -X POST http://localhost:8000/api/v1/policies/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "name": "Email Approval Policy",
    "description": "ต้องได้รับอนุมัติก่อนส่ง email ออกนอกองค์กร",
    "rules": [
      {
        "rule_id": "external_email_approval",
        "description": "อนุมัติก่อนส่ง mass email",
        "condition": "action_type == send_email AND recipient_count > 10",
        "action": "require_approval",
        "approval_role": "admin",
        "message": "การส่ง email มากกว่า 10 คนต้องได้รับอนุมัติ"
      }
    ],
    "is_active": true
  }'
```

---

## ตัวอย่าง cURL Commands แบบสมบูรณ์ (Script)

บันทึกเป็นไฟล์ `setup-org.sh` และรันครั้งเดียว:

```bash
#!/bin/bash
# setup-org.sh — ตั้งค่า Organization ใหม่อย่างสมบูรณ์

API="http://localhost:8000/api/v1"

echo "====== Step 1: Create Organization ======"
ORG_RESPONSE=$(curl -s -X POST $API/orgs/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SIRINX Solar Energy",
    "industry": "solar_energy",
    "language": "th",
    "timezone": "Asia/Bangkok",
    "currency": "THB"
  }')
echo $ORG_RESPONSE | python3 -m json.tool
ORG_ID=$(echo $ORG_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "ORG_ID: $ORG_ID"

echo ""
echo "====== Step 2: Create Workspace ======"
WS_RESPONSE=$(curl -s -X POST $API/workspaces/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{"name": "Sales Operations", "description": "Sales agent workspace"}')
echo $WS_RESPONSE | python3 -m json.tool
WS_ID=$(echo $WS_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "WORKSPACE_ID: $WS_ID"

echo ""
echo "====== Step 3: Add Owner User ======"
curl -s -X POST $API/users/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{"email": "owner@sirinx.com", "full_name": "สมชาย ใจดี", "role": "owner"}' \
  | python3 -m json.tool

echo ""
echo "====== Step 4: Add AI Provider (Anthropic) ======"
# แก้ไข api_key ก่อนรัน
PROVIDER_RESPONSE=$(curl -s -X POST $API/providers/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "name": "anthropic",
    "api_key": "sk-ant-api03-YOUR-KEY-HERE",
    "models": ["claude-opus-4-6", "claude-sonnet-4-6"],
    "capabilities": ["planning", "execution", "review"],
    "priority": 10
  }')
echo $PROVIDER_RESPONSE | python3 -m json.tool
PROVIDER_ID=$(echo $PROVIDER_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

echo ""
echo "====== Step 5: Create Budget ======"
curl -s -X POST $API/budgets/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "name": "Monthly AI Budget",
    "monthly_limit": 100.0,
    "task_limit": 5.0,
    "alert_threshold": 0.8
  }' | python3 -m json.tool

echo ""
echo "====== Step 6: Add Brain Entry (Doctrine) ======"
curl -s -X POST $API/brain/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "entry_type": "doctrine",
    "title": "SIRINX — หลักการหลัก",
    "content": "B2B Solar EPC สำหรับโรงงาน/โรงแรม ค่าไฟ > 50K THB/เดือน",
    "tags": ["doctrine", "core"]
  }' | python3 -m json.tool

echo ""
echo "====== Step 7: Create Policy ======"
curl -s -X POST $API/policies/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "name": "Default Security Policy",
    "rules": [],
    "is_active": true
  }' | python3 -m json.tool

echo ""
echo "====== Setup Complete! ======"
echo "ORG_ID:       $ORG_ID"
echo "WORKSPACE_ID: $WS_ID"
echo "PROVIDER_ID:  $PROVIDER_ID"
echo ""
echo "ตอนนี้สามารถสร้าง Task แรกได้:"
echo "curl -X POST $API/tasks/ -H 'X-Org-ID: $ORG_ID' -d '{\"title\": \"My First Task\", \"priority\": \"high\"}'"
```

**รัน script:**
```bash
chmod +x setup-org.sh
./setup-org.sh
```

---

## ทดสอบ Organization ที่สร้าง

หลังจาก setup เสร็จ ทดสอบด้วยการสร้างและรัน task:

```bash
# 1. สร้าง Task
TASK_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/tasks/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{
    "title": "ทดสอบ: วิเคราะห์ศักยภาพ Solar",
    "description": "ทดสอบระบบด้วย task วิเคราะห์ศักยภาพพลังงานแสงอาทิตย์",
    "priority": "medium",
    "workspace_id": "'$WS_ID'",
    "input_data": { "location": "กรุงเทพมหานคร", "test": true },
    "max_steps": 5,
    "budget_limit": 1.0
  }')
echo $TASK_RESPONSE | python3 -m json.tool
TASK_ID=$(echo $TASK_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# 2. รัน Task
curl -s -X POST http://localhost:8000/api/v1/tasks/$TASK_ID/run \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{"triggered_by": "setup-test"}' \
  | python3 -m json.tool

# 3. ตรวจสอบ Audit Log
curl -s "http://localhost:8000/api/v1/audit/summary" \
  -H "X-Org-ID: $ORG_ID" \
  | python3 -m json.tool
```

---

## Checklist ก่อนเริ่มใช้งาน Production

ตรวจสอบทุกข้อก่อน go-live:

### Control Plane
- [ ] สร้าง Organization แล้ว (ได้ `org_id`)
- [ ] สร้าง Workspace อย่างน้อย 1 อัน
- [ ] เพิ่ม User ที่มี role `owner` หรือ `admin` อย่างน้อย 1 คน

### Provider Plane
- [ ] ตั้งค่า Provider อย่างน้อย 1 อัน
- [ ] ทดสอบ Provider ด้วย `/providers/{id}/test` แล้วได้ `status: "ok"`
- [ ] Provider มี capabilities `planning` และ `execution`

### Governance Plane
- [ ] กำหนด Budget แล้ว (มี `monthly_limit` และ `task_limit`)
- [ ] `alert_threshold` ตั้งค่าเหมาะสม (แนะนำ 0.8)
- [ ] Policy สร้างแล้ว (ถ้าต้องการ governance rules)

### Knowledge Plane
- [ ] เพิ่ม Brain entry ประเภท `doctrine` อย่างน้อย 1 อัน
- [ ] เพิ่ม Brain entry ประเภท `knowledge` (ข้อมูลผลิตภัณฑ์/บริการ)
- [ ] เพิ่ม Brain entry ประเภท `template` (ถ้าใช้สำหรับสร้างเอกสาร)

### Verification
- [ ] `GET /health` ตอบกลับ `{"status": "ok"}`
- [ ] สร้าง Task ทดสอบและรันสำเร็จ
- [ ] ตรวจสอบ Audit Log มี events บันทึกอยู่
- [ ] Budget `current_month_usage` เพิ่มขึ้นหลังรัน task

---

## การแก้ไข Organization ที่มีอยู่แล้ว

### เปลี่ยนชื่อองค์กร
```bash
curl -X PUT http://localhost:8000/api/v1/orgs/$ORG_ID \
  -H "Content-Type: application/json" \
  -d '{"name": "SIRINX Solar Energy Thailand Co., Ltd."}'
```

### เพิ่ม Workspace เพิ่มเติม
```bash
curl -X POST http://localhost:8000/api/v1/workspaces/ \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{"name": "Finance Analysis", "description": "ROI and financial analysis"}'
```

### อัปเดต Budget
```bash
curl -X PUT http://localhost:8000/api/v1/budgets/$BUDGET_ID \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{"monthly_limit": 200.0}'
```

### ปิด Provider ชั่วคราว
```bash
curl -X PUT http://localhost:8000/api/v1/providers/$PROVIDER_ID \
  -H "Content-Type: application/json" \
  -H "X-Org-ID: $ORG_ID" \
  -d '{"is_active": false}'
```

---

*Future Agentic OS — Add Organization Guide v0.1.0*
