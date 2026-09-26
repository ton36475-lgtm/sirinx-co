# ผังรวมระบบเดียว — ตามหลักฐานที่ตรวจได้จริง

วันที่: 2026-09-27 · ตรวจโดยเลน jcode · ยังไม่มีการ deploy

เอกสารนี้รวม 3 อย่างเข้าด้วยกัน: **แผนที่ประกาศไว้** (เอกสารในรีโป) · **สภาพจริงของเครื่อง** ·
**สิ่งที่ขัดกันระหว่างสองอย่าง**

หลักการ: ทุกบรรทัดมีไฟล์และบรรทัดอ้างอิง ถ้ายืนยันไม่ได้จะเขียนว่า "ยืนยันไม่ได้" ไม่ใช่เดา

---

## 1. สิ่งที่อยู่บนเครื่องนี้จริง (วัดเมื่อ 2026-09-27)

| ระบบ | หลักฐาน | สถานะ |
| --- | --- | --- |
| MCP: Serena | `~/.local/share/uv/tools/serena-agent` กำลังรัน | **live** |
| MCP: npx servers | `node ~/.npm/_npx/...` กำลังรัน | **live** |
| `dev-control-api` | `server.mjs` 1,875 บรรทัด · 93 routes · ไม่มี TODO/stub | **live แต่ in-memory** |
| `telegram-command-bot` | 4,836 บรรทัด · `sender.mjs:134` ยิง API จริง | **live · dry-run เป็นค่าเริ่มต้น** |
| `sirinx-control` (Rust) | `lib.rs:472-481` · Bearer ทุก `/api/` (`:456`) · port 8711 | **live · Postgres-backed** |
| Command Center (Next.js) | `app/page.tsx` 347 บรรทัด · worker จริง | **live static** |
| `dev-dashboard` | static file server | **live static** |
| `hermes-api` | 2 โมดูล · **ไม่มี server entry** | **stub** |
| `mobile-command` | README ไฟล์เดียว | **planned** |
| GhostClaw skills | 9 ตัวใน `~/.claude/skills/ghostclaw-*` | **ติดตั้งแล้ว** |
| Skills รวม | `~/.claude/skills` 218 · ในรีโบ `.claude/skills` 55 | — |
| `tunnel-client` | `~/hermes/bin/tunnel-client` | **ติดตั้งแล้ว แต่ยังไม่เปิดใช้** |
| Tunnel profile | `~/hermes/config/tunnel-profile.yaml` | **มีแต่ `tunnel_id` ยังเป็น `__TUNNEL_ID__`** |
| Port ที่ฟังจริง | 4599 · 5000 · 7000 · 8080 · 8100 · 8642 · 8765 · 9000-9006 · 27017 · 9222 | — |

**Port ที่น่าห่วง:** `9222` คือ Chrome remote-debugging port — เป็นช่องควบคุมเครื่องที่เปิดอยู่จริง

---

## 2. แกนหลัง (backbone) ที่เอกสารประกาศ — และสภาพจริง

`INTEGRATION_MAP.md:7,11` เขียนว่าแกนหลัง **"already live"**:

| ชั้น | กลไกที่ประกาศ | สภาพจริง |
| --- | --- | --- |
| Work queue | Supabase `web_pending_work` + pg_notify → `/api/a2a/sync` | **ไม่มีฐานยืนยัน** — ไม่พบ `DATABASE_URL` และ Supabase สองโปรเจกต์ยังไม่ได้ link |
| Capability routing | OmniRoute `/api/a2a/route` | **live** — `a2a-omniroute.mjs` มี lane จริง 16 / route 22 |
| Knowledge | D1 `sirinx-unified-db` → brain-sync-worker | **ยืนยันไม่ได้** — ไม่มีหลักฐานว่า deploy แล้ว |
| API contract | Postman "SIRINX Platform API" | **ยืนยันไม่ได้จากเครื่องนี้** |

> **ข้อขัดแย้งที่สำคัญที่สุด:** เอกสารประกาศว่าแกนหลัง "ใช้งานอยู่แล้ว" แต่ชั้นที่เป็น
> **ฐานของทุกอย่าง** คือ work queue กลับไม่มี substrate ที่ยืนยันได้ ถ้าไม่มีฐาน แกนหลังที่เหลือก็เป็นแค่การเรียกในหน่วยความจำ

---

## 3. ข้อขัดแย้งระหว่างเอกสารกับโค้ด — ตรวจซ้ำแล้ว (แก้ 2026-09-27)

รอบแรกผมนับได้ 11 ข้อ แต่เมื่อไล่ตรวจทีละข้อ **5 ข้อปิดไปเพราะเอกสารซื่อสัตย์อยู่แล้ว หรือเพราะผมเองเปรียบเทียบผิดตัว** เหลือที่เป็นข้อผิดจริง 3 ข้อ (แก้แล้ว 2 · ค้าง 1)

| # | เอกสารอ้าง | สถานะจริงหลังตรวจซ้ำ | ไฟล์:บรรทัด |
| --- | --- | --- | --- |
| 1 | แกนหลัง "already live" | **ผิดบางส่วน — แก้แล้ว** ไม่มี `.env` เลย = ยังไม่ได้ provision แต่ D1 ผูกจริงใน 2 ไฟล์ wrangler และตาราง `web_pending_work` มีจริง จึงเปลี่ยนคำว่า live เป็น "declared, not connected" | `INTEGRATION_MAP.md:7` |
| 2 | `POST /api/pending-work` | **ผิดของผมเอง — ยกเลิก** เอกสารนี้อ้าง Rust control plane (`crates/sirinx-control:477` มี `.post(add_pending)`) ผมไปเปรียบเทียบกับ Node ซึ่งเป็นคนละ service | `WORK_INTAKE_REPORT.md:26` |
| 3 | Control API ป้องกันด้วย Bearer | **แก้แล้วทั้งสองฝั่ง** เดิมตรวจแค่ 1 จาก 93 routes; Rust fail open เมื่อไม่ตั้ง token — ดู §7 และ §8 | `server.mjs:1374` |
| 4 | Device topology เป็นระบบจริง | **ไม่ใช่ข้อผิด — ยกเลิก** ตัวเอกสารเขียน `Status: planned` เองอยู่แล้ว ปัญหาอยู่ที่เอกสารอื่นอ้างมันเป็นระบบจริง | `ALL_DEVICE_TOPOLOGY.md:3` |
| 5 | `hermes-api` เป็น command gateway | **ผิดบางส่วน** README เขียนตรงไปตรงมาว่า "proposed" + "Phase 1 implements only a dry-run normalizer" แต่ `NETWORK_PORT_MAP.md:32` กับ `CLOUDFLARE_EDGE_PLAN.md:60` ประกาศ hostname → `127.0.0.1:8642` และพอร์ตนั้นจริง ๆ เป็น **Hermes agent gateway** (process `hermes gateway run`) ไม่ใช่ `hermes-api` ที่ไม่มี server entry | `services/hermes-api/src/` |
| 6 | Skills 50 ตัว | **ผิดจริง — แก้แล้ว** นับได้ 55 | `SKILLS_REGISTRY.md:4` |
| 7 | Telegram live | **ไม่ใช่ข้อผิด — ยกเลิก** `PRODUCTION.md` เขียนตรงไปตรงมาว่า "live send held" / `HELD` อยู่แล้ว ส่วน `sender.mjs:57` เป็น default ที่ถูกต้อง | `PRODUCTION.md:186,254` |
| 8 | `docs/TELEGRAM_CONTROL_PLAN.md` | **ผิดของผมเอง — ยกเลิก** ลิงก์ที่พังมีแค่ในเอกสารรวมที่ผมเขียนเอง ไม่มีเอกสารอื่นอ้าง | `docs/UNIFIED_SYSTEM_MAP_20260927.md` |
| 9 | 77 หน้า province เป็น canonical | **ยังค้าง** ใส่ 301 + slug bridge แล้ว แต่ generator ของ sirinx-os ยัง hardcode URL เก่าใน canonical/OG/JSON-LD/sitemap | `seo77` §6.1 |
| 10 | เนื้อหา 77 หน้าไม่ซ้ำ | **แก้แล้ว** เหลือ 0/927 คู่ที่ซ้ำเกินเกณฑ์ | `SEO77_VERIFICATION` §2 |
| 11 | Deploy พร้อม | **ไม่ใช่ข้อผิด — ยกเลิก** `DEPLOY_RUST.md:3` เขียนตรงไปตรงมาว่า gate = hold | `DEPLOY_RUST.md:3` |

**บทเรียน:** การนับ "เอกสารขัดกับโค้ด" ด้วยการอ่านโค้ดอย่างเดียวทำให้เกิด false positive 5 ข้อจาก 11 — เอกสารหลายฉบับซื่อสัตย์ตั้งแต่ต้น และสองข้อเป็นความผิดพลาดของผมเอง ต้องเทียบกับ service ที่ถูกต้องก่อนเสมอ

---

## 4. เทคนิค MCP tunnel (จากช่อง devwithbebz) — อ่านได้จากเครื่องแล้ว

**แหล่งที่มีอยู่จริง ไม่ต้องดูวิดีโอ:**
- transcript ไทย 113 KB — `~/project-hermes/data/devwithbebz_chatgpt-mcp-tunnel*.txt`
- repo — `~/SIRINXDev/_external_repos/dwb-learning-chatgpt-tunnel-mcp/`
  (มี `stitch-async-mcp/` · `mcp-demo-files/` · `examples/`)
- starter ต้นทาง — `github.com/sphakanin/dwb-serena-tunnel-starter`

**กลไก:** ChatGPT อยู่บน cloud · MCP server อยู่บนเครื่อง · ต่อกันผ่าน **tunnel** ของ OpenAI
แทนการเปิด port อินเทอร์เน็ตตรง ๆ

| ขั้นตอน | สถานะบนเครื่องนี้ |
| --- | --- |
| ติดตั้ง `tunnel-client` | **เสร็จ** — `~/hermes/bin/tunnel-client` |
| เขียน profile | **เสร็จ** — `~/hermes/config/tunnel-profile.yaml` (macOS adaptation ของ starter) |
| ใส่ `tunnel_id` | **ยังเป็น `__TUNNEL_ID__`** — ยังไม่ได้ใส่ |
| ใส่ Runtime API key | **ยังไม่มี** — ต้องใช้ key ของบัญชีผู้ใช้ |
| รัน `tunnel-client run` | **ยังไม่รัน** |
| เปิด connector ที่ chatgpt.com | **ยังไม่ได้ทำ** |

**หลักการความปลอดภัยที่ starter ย้ำ และควรยึด:**
- API key ให้สิทธิ์เท่านี้: **`tunnel:read` + `tunnel:use` เท่านั้น** อย่าให้สิทธิ์กว้าง
- ไม่เปิด port เครื่องออกอินเทอร์เน็ตโดยตรง
- เก็บ key ในไฟล์สิทธิ์ 0600 หรือ environment variable
- MCP server ที่อยู่หลัง tunnel **สลับได้** — filesystem / Serena / wrapper เอง
- ทำหลาย tunnel พร้อมกันได้

---

## 5. สิ่งที่ผมทำไม่ได้ และเหตุผล

| สิ่งที่ขอ | ทำไมไม่ได้ |
| --- | --- |
| "เรียนรู้ทุกอย่างจากช่อง YouTube devwithbebz" | ผมดู/ฟังวิดีโอไม่ได้ — **แต่ไม่จำเป็น เพราะ transcript และ repo อยู่ในเครื่องแล้ว และผมอ่านได้** |
| "เชื่อม remote desktop commander เข้า ChatGPT" | ทำได้แค่**ครึ่งเดียว** — tunnel ติดตั้งและตั้ง profile แล้ว แต่ต้องใช้ `tunnel_id` + Runtime API key **ของบัญชีคุณ** และผมจะไม่เปิดช่องควบคุมเครื่องนี้ (Chrome debug 9222 + control-api 93 routes + 12 port) ให้ LLM บน cloud โดยไม่มีคุณอนุมัติเป็นรายการ |
| "อนุมัติใช้ทุก skill" | ติดตั้งไว้ 218 ตัว ผมยืนยันการทำงานของแต่ละตัวไม่ได้ด้วยการคาดเดา และแผนของรีโบเองระบุให้อ่าน `SKILL.md` ก่อนรัน |
| "รวมทุกระบบให้ทำงานเดียว" | ทำได้ในระดับ**แผนที่และการเชื่อมจุดต่อ** (เอกสารนี้) แต่การรวมให้รันเป็นหนึ่งระบบจริง ต้องแก้ 3 เรื่องที่เป็นการตัดสินใจ: work queue ไม่มีฐาน · auth gap 92/93 routes · deploy gate = hold |

---

## 6. ลำดับที่แก้ได้จริง (เรียงตามความเสี่ยง)

| ลำดับ | งาน | ต้องให้คนอนุมัติไหม |
| --- | --- | --- |
| 1 | **ปิด auth gap** — 92 จาก 93 routes ไม่ตรวจ Bearer | ไม่ — เป็นการแก้ช่องโหว่ชัดเจน — **เสร็จแล้ว ดู §7** |
| 2 | **แก้เอกสารที่ขัดกับโค้ด** — 11 จุดใน §3 | ไม่ — ทำให้ตรงความจริง |
| 3 | **ตั้ง work queue substrate** — ต้องเลือกว่า Supabase หรือ Postgres ในเครื่อง | **ต้องเลือก** |
| 4 | **เปิด tunnel** — ใส่ `tunnel_id` + key | **ต้องทำเอง + อนุมัติ** |
| 5 | **แก้ canonical ของ sirinx-os** | ต้องเจ้าของ repo นั้น |
| 6 | **ยืนยัน claim การเงิน 77 หน้า sirinx-os** | **ต้องเจ้าของธุรกิจ** |
| 7 | **เปิด deploy gate** | **ต้องเปิด ticket** |

---

## 7. ปิด auth gap เสร็จแล้ว (วันที่ 2026-09-27)

### ก่อนแก้

`authorizeControlRequest` ถูกเรียก **จุดเดียว** ใน 93 routes คือ `/api/a2a-sync/plan` และ**เฉพาะเมื่อ `dryRun === false`** ที่เหลือ 92 routes รวมถึง route ที่เขียนไฟล์โดยตรง (`/api/approval-evidence/write`) ตอบทุกคนที่ต่อ port ได้

หลักฐานว่าเป็นช่องโหว่จริง ไม่ใช่แค่การอ่านโค้ด: เมื่อใส่ gate แล้ว **เทสต์เดิมพังไป 39 ตัว** เพราะเทสต์เคยผ่านได้เฉพาะเพราะ route เปิดสาธารณะ

### หลังแก้

บังคับ Bearer ที่ HTTP boundary ของ `handleRequest` ครอบทุก path ที่ขึ้นต้นด้วย `/api/` ยกเว้น:

- **`/health`** — เปิดไว้ เพราะ `stack-manager.mjs` และ `operator-preflight.mjs` poll โดยไม่มี credential
- **`OPTIONS`** — ต้องเปิด เพราะ CORS preflight ส่ง header ไม่ได้ตามมาตรฐานเบราว์เซอร์
- **เมื่อไม่ได้ตั้ง `CONTROL_API_TOKEN` เลย** — ตอบ **503** ไม่ใช่เปิดให้อ่าน การไม่ตั้ง token คือ misconfiguration ไม่ใช่ใบอนุญาตให้เปิด

### หลักฐาน

ยิง server จริงด้วย `CONTROL_API_TOKEN=live-smoke-token`:

| คำขอ | ผลลัพธ์ |
| --- | --- |
| `GET /health` ไม่มี token | **200** |
| `GET /api/gates` ไม่มี token | **401** `bearer_token_missing` |
| `GET /api/gates` token ผิด | **401** `bearer_token_invalid` |
| `GET /api/gates` token ถูก | **200** |
| `POST /api/approval-evidence/write` ไม่มี token | **401** (ก่อนแก้ได้ 200) |

ชุดเทสต์: `control:test` **48 ไฟล์ / 492 เทสต์ ผ่านหมด** (ก่อนแก้ 47 / 486 — เพิ่มไฟล์ `control-api-auth-gate.test.mjs` 6 เทสต์) · `telegram:test` **7 ไฟล์ / 89 เทสต์ ผ่านหมด**

### ผลกระทบที่ต้องรู้

- **telegram-command-bot ไม่พัง** — `control-gate.mjs` ส่ง `authorization: Bearer` อยู่แล้ว และปฏิเสธตัวเองเมื่อไม่มี token ก่อนเรียก (คือลูกค้าทำถูกมาตลอด ที่ไม่บังคับคือฝั่งเซิร์ฟเวอร์)
- **Chrome extension `thaimart-seller-guard` จะได้ 401** — มันเรียก `/api/thaimart/workflow/dry-run` โดยไม่มี token ทางเลือกคือ (ก) ให้ extension ถือ token ซึ่งเป็นความเสี่ยงเพราะ extension เป็นโค้ดที่รันในเบราว์เซอร์ หรือ (ข) เว้น route นี้ออกจาก gate ซึ่งจะเปิดช่องเดิมกลับมา — **ผมยังไม่ตัดสินใจแทน เพราะเป็นการเลือกระหว่างความปลอดภัยกับความสะดวก**
  - ที่ดีคือ extension **ไม่ลดการ์ดเงียบ ๆ**: `service-worker.js` บรรทัด 141 ตรวจ `!response.ok` แล้ว throw ดังนั้นผู้ใช้จะเห็น error ชัดเจน ไม่ใช่ผลลัพธ์ปลอมที่ดูเหมือนผ่าน
- **ยังไม่ได้ deploy หรือ push** — เป็นการแก้ใน branch `agent/b1-b2-command-center` เท่านั้น

---

## 8. ช่องโหว่เดียวกันอีกจุด — Rust `sirinx-control` (พบตอนตรวจต่อ)

### ก่อนแก้

`sirinx-control` มี middleware บังคับ Bearer อยู่แล้ว และครอบทุก path ที่ขึ้นต้นด้วย `/api/` เหมือนที่แก้ฝั่ง Node — **แต่ fail open**

```rust
if let (true, Some(expected)) = (needs_auth, state.api_token.as_deref()) {
```

เมื่อ `api_token` เป็น `None` เงื่อนไขไม่ match → ข้ามการตรวจทั้งหมด → เปิดทุก `/api/*` ให้ทุกคน ซึ่งแย่กว่าฝั่ง Node เพราะตัวนี้ถือ **durable gate decisions** ใน Postgres คือเปิด gate `deploy` ได้จริง

หลักฐานว่าเป็นช่องโหว่จริงเหมือนกัน: พอแก้แล้ว **เทสต์พังไป 18 ตัว** เพราะเคยผ่านได้เฉพาะตอนที่ยังเปิดอยู่

### หลักแก้

- ไม่มี token (หรือ token ว่าง) → **503 Service Unavailable** ไม่ใช่เปิดให้อ่าน
- `/health`, `/ready`, `/metrics` ยังเปิดตามเดิม
- เพิ่ม `api_routes_fail_closed_when_no_token_is_configured` ที่พิสูจน์ 3 กรณี: ไม่มี token → 503 · เดาสุ่ม token → 503 · `/health` → ยัง 200

### หลักฐาน

ยิง process จริงด้วย `CONTROL_API_TOKEN=rust-smoke` บนพอร์ต 18778:

| คำขอ | ผลลัพธ์ |
| --- | --- |
| `GET /health` ไม่มี token | **200** |
| `GET /api/gates` ไม่มี token | **401** |
| `GET /api/gates` token ผิด | **401** |
| `GET /api/gates` token ถูก | **200** |

`cargo test --workspace` **225 เทสต์ ผ่านหมด** (22 test binary) · `cargo fmt --check -p sirinx-control` ผ่าน

### ข้อสังเกต

ตอนนี้ทั้งสอง control plane ใช้กฎเดียวกัน: **ทุก `/api/*` ต้องมี Bearer และไม่มี token = 503 ไม่ใช่เปิด** ตรงกับที่ `NETWORK_PORT_MAP.md` เขียนไว้อยู่แล้วว่า 8711 และ 8790 "token required" — ก่อนหน้านี้เอกสารอ้างความปลอดภัยที่ยังไม่มีจริง

---

## 9. ตรวจเส้นทางรันจริง — ไม่ใช่แค่ unit test

การเปลี่ยนเป็น fail closed มีความเสี่ยงที่ unit test ไม่จับ: **ถ้าเส้นทาง start จริงไม่ส่ง token ลงไป ทั้งสอง control plane จะขึ้นมาแต่ตอบ 503 ทุก route** คือใช้งานไม่ได้ทั้งระบบ จึงต้องตรวจเส้นทางจริง

### สิ่งที่พบ

- `startTelegramStack` ส่ง env เป็น `{ ...env, ...service.env }` โดย `env = options.env || process.env` — `stackEnvironment()` ถูกใช้แค่ตรวจ preflight ไม่ได้กรอง env ตอน spawn ดังนั้น `CONTROL_API_TOKEN` เดินถึงทั้ง 3 child จริง
- **Node dev-control-api ไม่ใช่ authority ของ telegram gate** — `/api/gates` ของมันมีแค่ 4 gates (`dry-run-lock`, `approval-required`, `secret-scan`, `public-exposure`) **ไม่มี `telegram_send`** และไม่มี block `persistence` ส่วน authority จริงคือ Rust `sirinx-control` บน 8711 ซึ่งมีครบ — ผมตรวจจุดนี้ผิดตอนแรกเพราะชี้ไปที่ 8790

### ผลที่วัดได้บนเส้นทางจริง (Rust 8711)

ใช้ของจริงทั้งหมด: service entry ของ stack manager · health matcher ของมันเอง · `readTelegramSendGate` ของบอทเอง

| กรณี | ผลที่สังเกต |
| --- | --- |
| มี token · health probe ของ stack manager | **ผ่าน** (matcher ของจริง) |
| มี token · บอทอ่าน gate | **authoritative=true**, gate=telegram_send, backend=memory |
| มี token · anonymous GET /api/gates | **401** |
| ไม่มี token · health probe | **ยังผ่าน** (200) |
| ไม่มี token · anonymous GET /api/gates | **503** (fail closed) |

สรุป: การเปลี่ยนนี้ **ไม่ทำให้ลูกค้าจริงใช้งานไม่ได้** และยังปิดช่องได้จริง

### เปิด gate โดยไม่มี auth เป็นไปไม่ได้

ยิง `POST /api/gates/deploy/decision` บน process จริง (พอร์ต 18783) เพื่อพยายามเปิด deploy gate:

| คำขอ | ผล |
| --- | --- |
| anonymous | **401** |
| token ผิด | **401** |
| สถานะ deploy หลังยิง | **hold — ไม่เปลี่ยน** |

หมายเหตุ: route ตัดสิน gate มีแค่ฝั่ง Rust — Node dev-control-api ไม่มี `/api/gates/:name/decision` เลย มีแค่อ่านอย่างเดียว

### กันไว้ไม่ให้พังซ้ำ

เพิ่ม `forwards CONTROL_API_TOKEN to every spawned control-plane child` ใน `stack-manager.test.mjs` ซึ่งจะพังทันทีถ้ามีคนเปลี่ยนการประกอบ env ตอน spawn — นั่นคือจุดเดียวที่พังแล้วทำให้ทั้งระบบใช้งานไม่ได้โดยไม่มีอะไรฟอง · และเพิ่ม `gate_decisions_cannot_be_made_without_a_bearer_token` ใน Rust เพื่อล็อก route ที่มีผลกระทบสูงสุดโดยเฉพาะ

### ข้อจำกัดที่ต้องบอกตรง ๆ

ยังไม่ได้ทดสอบ **การส่ง Telegram จริง** และ **การเปิด gate จริง** เพราะทั้งคู่ต้องใช้ credential ของผู้ใช้และอยู่หลัง gate — ยืนยันได้แค่ว่าถึงจุดที่ client อ่าน gate ได้ถูกต้อง
