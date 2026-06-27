# สถาปัตยกรรมความปลอดภัยของ LLM ระดับโปรดักชัน

Status: defensive public technical article for production LLM application design.

Safety boundary: this article does not include jailbreak prompts, bypass
instructions, reproducible attack steps, evasion recipes, or obfuscation
patterns. Risk descriptions are framed as defensive risk surfaces.

## 1. บทนำ

LLM ที่ดีในห้องทดลองไม่เท่ากับ LLM application ที่ปลอดภัยในโปรดักชัน เพราะความเสี่ยงจริงไม่ได้อยู่แค่ตัวโมเดล แต่อยู่ในระบบรอบโมเดลด้วย: prompt orchestration, retrieval context, tool permission, output handling, audit log, human workflow, และระบบ downstream ที่รับผลลัพธ์จากโมเดลไปทำงานต่อ

สำหรับ GHOSTCLAW แนวคิดนี้สอดคล้องกับ Zero Prompting Multi-Agent System:

- Co-workers มีบทบาทเฉพาะ เช่น Marketing, Content, Video, Admin, Finance
- Fleet Orchestrator คุม routing และ workflow
- Ship Protocol ใช้ส่งงานแบบ structured handoff
- Vault / audit / monitoring เก็บหลักฐานการทำงาน
- 6-step workflow ช่วยแยก planning, execution, review, delivery, learning

บทความนี้จึงไม่ได้ถามว่า "จะทำให้โมเดลตอบทุกอย่างได้อย่างไร" แต่ถามว่า "จะออกแบบระบบ LLM ให้ช่วยงานได้จริงโดยไม่ทำให้ข้อมูลรั่ว สิทธิ์เกินขอบเขต หรือ output ไปกระทบ production โดยไม่มีการตรวจสอบได้อย่างไร"

## 2. Helpfulness vs Safety

ความยากของ LLM safety คือโมเดลถูกฝึกให้ช่วยเหลือผู้ใช้ แต่โปรดักชันต้องให้ความช่วยเหลือนั้นอยู่ภายใต้ policy, context boundary, และ tool permission ที่ชัดเจน

ในระบบจริง ความ helpful ควรถูกนิยามใหม่เป็น:

1. ตอบงานที่อยู่ใน scope
2. ปฏิเสธหรือ redirect งานที่เกิน policy
3. ถามเพิ่มเมื่อข้อมูลไม่พอ
4. ไม่สร้างข้อมูลเท็จเพื่อให้คำตอบดูครบ
5. ไม่ส่งข้อมูลส่วนตัวหรือ secret ออกไป
6. ไม่สั่ง downstream tool โดยไม่มีสิทธิ์ที่ชัดเจน

Safety จึงไม่ใช่การทำให้โมเดล "พูดน้อยลง" แต่เป็นการทำให้ระบบรู้ว่าเมื่อใดควรตอบ เมื่อใดควรจำกัด และเมื่อใดควรส่งงานเข้าสู่ review path

## 3. Model Safety vs Application Safety

ต้องแยกสองชั้นนี้ออกจากกันเสมอ

### Model Safety

Model Safety คือคุณสมบัติภายในโมเดล เช่น alignment, refusal behavior, policy training, robustness ต่อ instruction conflict, และความสามารถในการไม่เปิดเผยข้อมูลที่ไม่ควรเปิดเผย

ข้อจำกัด:

- ไม่มีโมเดลใดควรถูกถือว่าเป็น security boundary เดี่ยว
- evaluation ของโมเดลมักเปลี่ยนตาม prompt, context, model version, และ deployment wrapper
- mechanistic interpretability ช่วยตั้ง hypothesis เกี่ยวกับ internal behavior ได้ แต่ยังไม่ควรถูกใช้เป็นหลักฐานว่าเข้าใจทุก failure mode ของโมเดลครบถ้วน
- คำกล่าวอ้างเชิงกลไกที่ระบุ layer, attention head, activation direction,
  หรือสัดส่วนเชิงตัวเลขเฉพาะ ต้องมีแหล่งอ้างอิง primary source และควรเขียน
  เป็น hypothesis จนกว่าจะมีการ reproduce ในสภาพแวดล้อมของระบบเอง

### Application Safety

Application Safety คือระบบรอบโมเดล:

- input normalization
- intent and risk classification
- policy decision engine
- context isolation
- retrieval filtering
- output validation
- tool broker
- audit log
- red-team feedback loop
- rollback and kill switch

Production LLM system ต้องพึ่ง Application Safety เป็นหลัก เพราะความเสียหายจำนวนมากเกิดจาก tool access, data movement, permission design, และ output handling ไม่ใช่จากข้อความตอบกลับของโมเดลเพียงอย่างเดียว

## 4. อนุกรมวิธานของพื้นผิวความเสี่ยงและมาตรการป้องกันเชิงระบบ

ตารางนี้แปลงคำอธิบายเชิงโจมตีให้เป็น risk-surface language เพื่อใช้ในงานออกแบบระบบป้องกัน

| Risk Surface               | ความหมายเชิงระบบ                                                                                 | มาตรการป้องกัน                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Instruction Conflict       | ผู้ใช้, system, tool, retrieval, หรือ memory ให้คำสั่งที่ขัดกัน                                  | ลำดับชั้น policy, immutable system rules, conflict detector, refusal reason logging                                 |
| Contextual Framing Abuse   | บริบทถูกจัดวางให้ระบบตีความงานเสี่ยงเป็นงานปลอดภัย                                               | intent classifier, task scope validator, role and domain boundary, high-risk topic routing                          |
| Semantic Obfuscation       | ข้อความมีรูปแบบที่ทำให้การ classify ความเสี่ยงยากขึ้น                                            | canonicalization, language/script normalization, Unicode hygiene, semantic risk scoring                             |
| Indirect Prompt Injection  | ข้อมูลจากเว็บ, เอกสาร, email, RAG, หรือ third-party content มีคำสั่งแฝงต่อ agent                 | isolate retrieved content, treat external content as data not instruction, source labeling, retrieval trust scoring |
| Tool Abuse                 | โมเดลพยายามใช้ tool เกินสิทธิ์หรือใช้ผิดบริบท                                                    | tool permission broker, least privilege, execution lease, dry-run default, allowlist, rate limit                    |
| Data Exfiltration          | ข้อมูลภายใน, secret, customer data, หรือ private context ถูกส่งออก                               | data classification, redaction, DLP filters, egress policy, secret scanning, output review                          |
| Output Handling Risk       | downstream system เชื่อ output จากโมเดลโดยไม่ validate                                           | output schema validation, sanitizer, human-readable diff, transaction preview, no direct shell/SQL execution        |
| Agent Memory Contamination | long-term memory, agent files, หรือ workspace docs ถูกปนเปื้อนด้วยคำสั่งที่ไม่ควรกลายเป็น policy | signed/owned memory sources, quarantine, diff review, hash-based trust, memory writeback gate                       |

OWASP Top 10 for LLM Applications ควรถูกใช้เป็น defensive risk catalog ไม่ใช่ checklist สำหรับโจมตี ส่วน NIST AI RMF ควรถูกใช้เพื่อ govern, map, measure, manage risk ตลอดวงจรชีวิตของระบบ

## 5. แบบจำลองเชิงคณิตศาสตร์ของความเสี่ยง

Production risk ควรถูกทำให้วัดได้ แม้จะเป็นค่าประมาณ

นิยามพื้นฐาน:

```text
Risk = Exposure Probability x Control Failure Probability x Impact
```

สำหรับ LLM application:

```text
R_task = P(risky_input) x P(policy_miss) x P(tool_or_output_harm) x I
```

โดย:

- `P(risky_input)` = โอกาสที่ input, context, retrieval, หรือ file จะมี risk surface
- `P(policy_miss)` = โอกาสที่ classifier/policy engine ไม่จับความเสี่ยง
- `P(tool_or_output_harm)` = โอกาสที่ output หรือ tool action จะทำให้เกิดผลเสีย
- `I` = impact เช่น data leakage, financial cost, production outage, legal exposure

หลังใส่ control:

```text
Residual Risk = Inherent Risk x (1 - Control Effectiveness)
```

ตัวอย่าง control effectiveness ที่ควรวัด:

- policy decision precision/recall
- unsafe tool call block rate
- false positive rate
- red-team finding recurrence
- time to detect
- time to quarantine
- output schema failure rate
- incident rollback time

สำหรับ GHOSTCLAW ควรเก็บ metric นี้ใน Vault / audit / monitoring layer และผูกกับ Ship Protocol artifact ของแต่ละ task

## 6. Production LLM Safety Architecture

Pipeline ที่ควรใช้:

```text
User Input
-> Input Normalization / Canonicalization
-> Intent & Risk Classifier
-> Policy Decision Engine
-> Context Isolation Layer
-> LLM Core
-> Output Safety Validator
-> Tool Permission Broker
-> Audit Log / Monitoring / Red-Team Feedback
```

### Layer 1: User Input

รับข้อความ, ไฟล์, URL, screenshot, transcript, หรือ payload จากระบบอื่น โดยยังไม่เชื่อว่า input เป็นคำสั่งที่ปลอดภัย

### Layer 2: Input Normalization / Canonicalization

ทำให้ input อยู่ในรูปแบบที่ตรวจได้:

- normalize encoding
- remove parser ambiguity
- classify language and source
- separate user instruction from external content
- attach source metadata

Layer นี้ไม่ควรพยายาม "ถอดรหัสเพื่อทำตาม" แต่ควร normalize เพื่อให้ policy ตรวจง่ายขึ้น

### Layer 3: Intent & Risk Classifier

จำแนก:

- intent
- domain
- data sensitivity
- tool requirement
- external action requirement
- user authorization level
- risk surfaces present

### Layer 4: Policy Decision Engine

ตัดสินใจด้วย policy ก่อนเรียกโมเดลหรือ tool:

- allow
- allow with constraints
- dry-run only
- require review
- quarantine
- block

Policy ต้องอยู่ใน code/config ที่ตรวจได้ ไม่ใช่ prompt เพียงอย่างเดียว

### Layer 5: Context Isolation Layer

แยก context ตาม trust boundary:

- system policy
- developer instruction
- user request
- retrieved content
- tool result
- memory
- private data

External content ต้องถูก label เป็น data ไม่ใช่ instruction และต้องไม่สามารถ override policy ได้

ในระบบ agentic coding หรือ multi-agent workspace ต้องถือว่าไฟล์ความจำระยะยาว,
agent instruction files, repo docs, web pages, email, ticket, และ RAG content
เป็น trust zones ที่ต่างกัน แม้ทั้งหมดจะเป็นข้อความเหมือนกันก็ตาม เอกสารภายนอก
ควรถูกส่งเข้า context พร้อม metadata ว่าเป็น `untrusted data` ไม่ใช่ authority
ที่แก้ system policy ได้

### Layer 6: LLM Core

โมเดลทำ reasoning, drafting, summarization, classification, planning, หรือ code review ตาม scope ที่ policy อนุญาต โมเดลไม่ควรถือ secret โดยไม่จำเป็น และไม่ควรมี direct access ไปยัง production tool

### Layer 7: Output Safety Validator

ตรวจ output ก่อนส่งต่อ:

- schema validation
- unsafe content classification
- secret and PII scan
- claim/source grounding
- downstream command/SQL/HTML sanitizer
- user-visible uncertainty

### Layer 8: Tool Permission Broker

Tool broker เป็น security boundary ที่สำคัญกว่า prompt:

- least privilege
- per-tool allowlist
- execution lease
- command hash or action manifest
- dry-run preview
- rate limit and budget cap
- rollback plan
- local-only default

Tool broker ต้องไม่รับคำสั่ง executable ตรงจาก model output โดยไม่มี action
manifest ที่ตรวจได้ก่อน เช่น tool name, purpose, target resource, input schema,
permission scope, rate/budget bound, rollback requirement, และ audit event
ทุกครั้ง

### Layer 9: Audit Log / Monitoring / Red-Team Feedback

ทุก task ควรมี:

- request ID
- policy decision
- tool request
- allowed/blocked decision
- output validator result
- artifact hash
- reviewer notes
- incident or quarantine status

Red-team feedback ควรถูกแปลงเป็น test cases, policy updates, และ monitoring rules ไม่ใช่แค่รายงาน PDF

### Defensive Pattern A: Secure Planner + Dynamic Validator

สำหรับงานหลายขั้นตอน ให้แยก planner ออกจาก executor:

- planner สร้าง minimal action plan และ schema ของ tool call ที่จำเป็น
- validator ตรวจว่าการเรียก tool ตรงกับ plan, schema, และ policy หรือไม่
- executor ทำงานเฉพาะ action ที่มี lease และ audit ID
- deviation จาก plan ต้องถูก quarantine หรือส่งกลับไป review

จุดสำคัญคือไม่ให้โมเดลสร้างเส้นทาง tool ใหม่เองระหว่าง execution โดยไม่มี
policy decision ใหม่

### Defensive Pattern B: Control/Data Flow Separation

ข้อมูลที่ไม่เชื่อถือได้ควรเป็น data flow เท่านั้น ไม่ใช่ control flow:

- privileged controller เห็น policy, task goal, และ action schema
- untrusted content processor เห็น raw external content ใน sandbox
- ผลลัพธ์จาก untrusted processor ต้องเป็น structured extraction ที่ validate ได้
- controller ไม่ควรรับ external instruction เป็นคำสั่งใหม่โดยตรง

แนวคิดนี้เหมาะกับระบบที่อ่านเว็บ, PDF, email, ticket, repo, หรือ memory ที่ผู้ใช้
หลายคนแก้ได้

### Defensive Pattern C: Signed Context Boundary

เมื่อระบบต้องส่งข้อความหลายชนิดเข้า prompt เดียวกัน ให้เพิ่ม boundary metadata
ที่ตรวจได้:

- source type
- owner
- trust level
- source hash
- timestamp
- allowed use
- policy decision

ถ้าใช้ลายเซ็นหรือ hash ควรถือว่าเป็น application-layer integrity control
ไม่ใช่สิ่งที่ทำให้โมเดลปลอดภัยโดยตัวมันเอง

### Defensive Pattern D: Multimodal Intake Hardening

ไฟล์ภาพ เสียง วิดีโอ และ screenshot อาจมีข้อความหรือสัญญาณที่ classifier text-only
ไม่เห็น Production pipeline จึงควร:

- แยก OCR, vision summary, metadata, และ raw media ออกจากกัน
- ลดความเสี่ยงจาก hidden or imperceptible content ด้วย media normalization
- เก็บ evidence crop/hash แทนการส่ง raw media ไปยังทุก agent
- ให้ multimodal model ตอบเป็น structured observation ไม่ใช่ instruction
- validate observation ก่อนเข้าสู่ tool workflow

อย่าใช้การ hardening ภาพหรือเสียงเพียงชั้นเดียวเป็นหลักฐานว่าปลอดภัยทั้งหมด
ควรรวมกับ policy engine, output validator, และ audit trail เสมอ

## 7. Governance, Monitoring, and Red-Team Feedback

NIST AI RMF ให้กรอบ govern, map, measure, manage สำหรับ AI risk ส่วน NIST SSDF ช่วยให้ LLM application ถูกพัฒนาแบบ secure software ไม่ใช่ prototype ที่หลุดเข้า production

ใน GHOSTCLAW ให้ map governance แบบนี้:

| GHOSTCLAW Component | Safety Responsibility                                             |
| ------------------- | ----------------------------------------------------------------- |
| Fleet Orchestrator  | route task, enforce workflow stage, attach policy context         |
| Ship Protocol       | structured handoff, traceable artifacts, request/response linkage |
| Co-workers          | domain-specific execution with least privilege                    |
| Vault               | evidence, decisions, hashes, audit trail                          |
| Monitoring          | detect drift, blocked actions, validator failures, cost anomalies |
| Admin co-worker     | QA, policy review, escalation packet                              |

Red-team loop ที่ปลอดภัย:

1. สร้าง risk scenario แบบไม่ใส่ payload โจมตีจริง
2. map scenario กับ risk surface
3. รัน classifier และ policy engine ด้วย synthetic safe inputs
4. ตรวจว่า tool broker block ตาม expected decision
5. บันทึก finding เป็น test case
6. อัปเดต policy และ monitoring
7. ทำ regression test ทุก release

## 8. บทสรุปเชิงวิศวกรรม

Production LLM safety ไม่ควรถูกฝากไว้กับ prompt หรือโมเดลเพียงอย่างเดียว ระบบที่ปลอดภัยต้องมีหลายชั้น:

- แยก Model Safety ออกจาก Application Safety
- ใช้ OWASP เป็น risk taxonomy เชิงป้องกัน
- ใช้ NIST AI RMF เป็น governance loop
- ใช้ NIST SSDF เพื่อให้ LLM app อยู่ใน secure SDLC
- ทำ context isolation และ tool permission broker เป็น core architecture
- validate output ก่อนส่งต่อ downstream
- เก็บ audit log และ red-team feedback เป็น artifact ที่ตรวจย้อนหลังได้

สำหรับ GHOSTCLAW เป้าหมายไม่ใช่ให้ agent ทำทุกอย่างโดยไม่มีข้อจำกัด แต่ให้ agent ทำงานได้เร็วขึ้นในขอบเขตที่พิสูจน์ ตรวจสอบ และ rollback ได้

## Ship Protocol Example Payload

ตัวอย่างนี้เป็น workflow สำหรับการผลิตบทความ safety แบบ defensive เท่านั้น

```json
{
  "ship_protocol_version": "ghostclaw-article-safety-v1",
  "task_id": "LLM-SAFETY-ARTICLE-001",
  "source_request": "Convert an LLM safety analysis draft into a defensive production safety article.",
  "workflow_stage": "article_review",
  "assigned_agent": "Content",
  "review_agent": "Admin",
  "risk_class": "security_publication",
  "required_context": {
    "repo_docs": [
      "docs/architecture/GHOSTCLAW_MASTER_ARCHITECTURE.md",
      "docs/architecture/WORKFLOW_MAP.md",
      "docs/security/LOCAL_FIRST_SECURITY_POLICY.md",
      "docs/a2async/A2A_TASK_SCHEMA.md"
    ],
    "frameworks": [
      "OWASP Top 10 for LLM Applications 2025",
      "NIST AI RMF 1.0",
      "NIST SSDF SP 800-218"
    ]
  },
  "constraints": {
    "no_jailbreak_prompts": true,
    "no_bypass_instructions": true,
    "no_reproducible_attack_steps": true,
    "risk_surfaces_only": true,
    "separate_model_and_application_safety": true,
    "public_publication_safe": true
  },
  "output_artifacts": [
    "docs/LLM_PRODUCTION_SAFETY_ARCHITECTURE.md",
    "docs/LLM_RISK_SURFACE_TAXONOMY.md",
    "docs/ARTICLE_SAFETY_QA_CHECKLIST.md",
    "docs/REFERENCES.md"
  ],
  "validation": {
    "article_structure_complete": true,
    "unsafe_prompt_examples_removed": true,
    "references_defensive_only": true,
    "qa_checklist_required": true
  },
  "next_agent": "Admin",
  "fallback_queue_reason": null
}
```

## References

- OWASP Top 10 for Large Language Model Applications 2025:
  <https://genai.owasp.org/llm-top-10/>
- NIST AI Risk Management Framework:
  <https://www.nist.gov/itl/ai-risk-management-framework>
- NIST AI RMF 1.0 PDF:
  <https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf>
- NIST AI RMF Playbook:
  <https://airc.nist.gov/airmf-resources/playbook/>
- NIST SP 800-218 Secure Software Development Framework:
  <https://csrc.nist.gov/pubs/sp/800/218/final>
