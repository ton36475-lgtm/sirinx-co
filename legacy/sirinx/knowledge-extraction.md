# SIRINX Knowledge Extraction — จากเอกสารที่แนบมา

> สกัดเฉพาะองค์ความรู้ที่ปรับใช้ได้จริงกับโปรเจกต์ SIRINX (Solar Digital Agentic Company)

---

## 1. Interactive Dashboard & Data Visualization

**แหล่งที่มา**: บทความ "How to Create Interactive Charts in Claude"

**หลักการสำคัญ**: อย่าสร้างแค่กราฟ แต่สร้าง "เครื่องมือให้คนเล่นกับข้อมูล" — Chart ธรรมดาคือ "ดู" แต่ Interactive Chart คือ "ใช้"

**ปรับใช้กับ SIRINX**:

| Feature | การปรับใช้ | Priority |
|---------|-----------|----------|
| Solar ROI Calculator | เปลี่ยนจาก static form เป็น interactive chart ที่ปรับค่าได้ real-time ด้วย slider | High |
| Energy Savings Dashboard | Admin Panel แสดง lead metrics, conversion rate ด้วย interactive charts | Medium |
| Investment Scenario Planner | Best case / Worst case scenario comparison สำหรับนักลงทุน | Medium |

**เทคนิคที่ใช้ได้**:
- ระบุ Scenario ให้ชัด (pessimistic/optimistic case) สำหรับ Solar ROI
- ให้ user ปรับค่าได้ด้วย slider/input ใน Assessment Calculator
- ใช้ real-world data จากโครงการจริง (Royal Park, Holatel) เป็น benchmark

---

## 2. Spec-Driven Development (Agent Skills / GSD)

**แหล่งที่มา**: Addy Osmani's agent-skills + GSD (Get Shit Done) framework

**หลักการสำคัญ**: AI coding agents เก่งในการ generate code แต่แย่ในการทำตาม engineering process ต้องมีระบบควบคุมที่ชัดเจน

**ปรับใช้กับ SIRINX**:

| หลักการ | การปรับใช้ |
|---------|-----------|
| Process, Not Prose | ใช้ todo.md เป็น milestone tracker ทำทีละขั้นตอน ข้ามไม่ได้ |
| Anti-Rationalization | ทุก feature ต้องมี vitest test ก่อน deliver ห้ามหาข้ออ้าง |
| Non-Negotiable Verification | ทุก API route ต้องผ่าน test, ทุก DB migration ต้อง verify |
| Milestone-based workflow | แบ่ง Phase 2 เป็น milestones: Schema → API → Admin → LINE |
| Context management | Clear context ระหว่าง phases เพื่อป้องกัน context rot |

**Workflow ที่นำมาใช้**:
1. Plan → กำหนด milestone ใน todo.md
2. Execute → implement ตาม plan
3. Verify → vitest + manual check
4. Complete → checkpoint + squash

---

## 3. Self-Improving Loop & Knowledge Management

**แหล่งที่มา**: Hermes Agent + Second Brain (CODE framework)

**หลักการสำคัญ**: ระบบที่ดีคือระบบที่ "ยิ่งใช้ยิ่งเก่ง" — เก็บ skill จากงานที่ทำเสร็จ ใช้ซ้ำครั้งหน้า

**ปรับใช้กับ SIRINX**:

| แนวคิด | การปรับใช้ |
|---------|-----------|
| Capture (Input) | Lead form → เก็บเข้า DB ทันที ไม่ใช่แค่แสดง toast |
| Organize (Process) | Auto-categorize leads ตาม industry, budget, timeline |
| Distill (Summarize) | Admin dashboard สรุป lead metrics, conversion funnel |
| Express (Output) | Owner notification เมื่อมี lead ใหม่ + weekly summary |

**สำหรับ Blog CMS**:
- Capture: Admin สร้าง draft → เก็บใน DB
- Organize: Category + tags system
- Distill: SEO metadata auto-suggest
- Express: Publish → public blog page

---

## 4. LINE OA Integration Priority

**แหล่งที่มา**: BoomBigNose Channel insights + เอกสาร AGENTS.md Section 16

**หลักการสำคัญ**: ตลาดไทยต้องมี LINE Official Account เป็น primary channel สำหรับ customer communication

**ปรับใช้กับ SIRINX**:

| Component | Implementation |
|-----------|---------------|
| LINE Button | เพิ่มปุ่ม LINE ในหน้า Contact + floating button |
| LINE URL | ใช้ `https://line.me/R/ti/p/@sirinx` หรือ LINE OA ID |
| Auto-response | Webhook รับ message → ตอบกลับอัตโนมัติ |
| Lead capture | เมื่อ user เพิ่มเพื่อน → บันทึกเป็น lead ใน DB |
| Notification | เมื่อมี lead ใหม่จาก web form → notify ผ่าน LINE |

**ลำดับความสำคัญ** (ตาม AGENTS.md Section 16):
1. LINE OA button + link (ทำได้ทันที)
2. Lead form → DB → Owner notification
3. LINE webhook auto-response (ต้องมี LINE OA credentials)

---

## 5. Production-Grade Quality Standards

**แหล่งที่มา**: Addy Osmani's engineering culture (Google standards)

**ปรับใช้กับ SIRINX**:

| Standard | Implementation |
|----------|---------------|
| Hyrum's Law | API design ต้องคิดถึง backward compatibility |
| Beyonce Rule | ถ้าคุณชอบมัน ก็ต้องเขียน test ให้มัน |
| Trunk-based dev | ใช้ checkpoint system แทน branching |
| Code review | ทุก feature ต้อง verify ก่อน checkpoint |

---

## 6. สรุปสิ่งที่ต้องทำทันทีสำหรับ SIRINX Phase 2

จากองค์ความรู้ทั้งหมด สิ่งที่ต้อง implement ตามลำดับ:

1. **Database Schema** — leads, blog_posts, projects, contact_submissions (Milestone-based)
2. **tRPC API Routes** — CRUD สำหรับทุก table + input validation ด้วย zod
3. **Admin Panel** — ใช้ DashboardLayout ที่มีอยู่แล้ว + role-based access
4. **Lead Management** — Contact form → DB → Owner notification → Admin dashboard
5. **Blog CMS** — Draft/Publish workflow, category/tags, SEO metadata
6. **LINE OA Button** — เพิ่มใน Contact page + floating button
7. **Interactive Charts** — Lead analytics ใน Admin Panel
8. **Vitest Tests** — ทุก API route ต้องมี test

---

*สกัดเมื่อ: 2026-04-12 | สำหรับ: SIRINX Phase 2 Full-Stack Upgrade*
