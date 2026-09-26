#!/usr/bin/env node
/**
 * generate-province-content-briefs.mjs
 *
 * Generates one content brief per province into
 * docs/seo/province-content-briefs/<slug>.md.
 *
 * Inputs (all local, no network):
 *   - docs/seo/province-unique-angles.json     hand-authored unique angles (anti-duplication core)
 *   - docs/seo/keyword-map-77-provinces.csv    keyword clusters per province (P1-P4 tiers)
 *   - apps/public-web/shared/thaiProvinces.ts  slug / nameTh / nameEn / region
 *   - apps/public-web/shared/provinceEnergyData.ts  sourced PVGIS figures (optional per province)
 *
 * Honesty rules encoded in every brief: climate normals are not a savings
 * promise; missing energy data means "do not guess"; local facts listed in
 * `verify` must be checked before publishing.
 *
 * Usage: node docs/seo/generate-province-content-briefs.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SEO_DIR = path.join(ROOT, "docs", "seo");
const OUT_DIR = path.join(SEO_DIR, "province-content-briefs");
const SHARED = path.join(ROOT, "apps", "public-web", "shared");

// MEA (การไฟฟ้านครหลวง) covers only these 4 provinces; PEA covers the rest.
const MEA_SLUGS = new Set(["bangkok", "nonthaburi", "pathum-thani", "samut-prakan"]);

// ---------- parsers ----------

function parseProvinces() {
  const src = fs.readFileSync(path.join(SHARED, "thaiProvinces.ts"), "utf8");
  const out = [];
  const re = /\{ slug: "([^"]+)", nameTh: "([^"]+)", nameEn: "([^"]+)", region: "([^"]+)" \}/g;
  let m;
  while ((m = re.exec(src))) {
    out.push({ slug: m[1], nameTh: m[2], nameEn: m[3], region: m[4] });
  }
  return out;
}

function parseEnergy() {
  const file = path.join(SHARED, "provinceEnergyData.ts");
  if (!fs.existsSync(file)) return { coverage: 0, records: {} };
  const src = fs.readFileSync(file, "utf8");
  const records = {};
  const re = /"([a-z0-9-]+)": \{\s*lat: ([\d.]+),\s*lon: ([\d.]+),\s*irradiationDaily: ([\d.]+),\s*specificYield: ([\d.]+),/g;
  let m;
  while ((m = re.exec(src))) {
    records[m[1]] = {
      lat: Number(m[2]),
      lon: Number(m[3]),
      irradiationDaily: Number(m[4]),
      specificYield: Number(m[5]),
    };
  }
  return { coverage: Object.keys(records).length, records };
}

function parseCsvLine(line) {
  const cells = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      cells.push(cur);
      cur = "";
    } else cur += c;
  }
  cells.push(cur);
  return cells;
}

function parseKeywords() {
  const file = path.join(SEO_DIR, "keyword-map-77-provinces.csv");
  const lines = fs.readFileSync(file, "utf8").trim().split("\n");
  const header = parseCsvLine(lines[0]);
  const bySlug = new Map();
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    const row = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
    if (!bySlug.has(row.province_slug)) bySlug.set(row.province_slug, []);
    bySlug.get(row.province_slug).push(row);
  }
  return bySlug;
}

// ---------- brief ----------

const REGION_TH = {
  north: "ภาคเหนือ",
  northeast: "ภาคตะวันออกเฉียงเหนือ",
  central: "ภาคกลาง",
  east: "ภาคตะวันออก",
  west: "ภาคตะวันตก",
  south: "ภาคใต้",
};

function keywordBlock(rows) {
  const byTier = new Map();
  for (const r of rows) {
    if (!byTier.has(r.tier)) byTier.set(r.tier, []);
    byTier.get(r.tier).push(r);
  }
  const tierNames = {
    "P1-core": "P1 — คีย์เวิร์ดหลัก (หน้า hub ต้องชนะ)",
    "P2-commercial": "P2 — เชิงพาณิชย์/ตัดสินใจซื้อ",
    "P3-cluster": "P3 — คลัสเตอร์ขยาย (หัวข้อย่อย/หน้าเสริม)",
    "P4-aeo": "P4 — คำถาม AEO/AEO (ตอบใน FAQ + ย่อหน้าแรกของแต่ละ H2)",
  };
  const parts = [];
  for (const [tier, name] of Object.entries(tierNames)) {
    const list = byTier.get(tier) ?? [];
    if (!list.length) continue;
    parts.push(`### ${name} (${list.length} คำ)\n`);
    for (const r of list) {
      parts.push(`- \`${r.keyword}\` — intent: ${r.intent} · funnel: ${r.funnel_stage} · เป้าหมาย: \`${r.target_url}\`${r.evidence_required !== "none" ? ` · ต้องมีหลักฐาน: ${r.evidence_required}` : ""}`);
    }
    parts.push("");
  }
  return parts.join("\n");
}

function energyBlock(prov, energy, rank) {
  const rec = energy.records[prov.slug];
  if (!rec) {
    return [
      "> **ยังไม่มีข้อมูลพลังงานประจำจังหวัดนี้** — `provinceEnergyData.ts` ยังไม่มี record (อยู่ระหว่างเติมข้อมูล)",
      "> **ห้ามเดาตัวเลขพลังงานในหน้านี้** ให้เว้นบล็อกข้อมูลไว้จนกว่าข้อมูลจริงพร้อม หรือเขียนเชิงคุณภาพแทน",
      "",
    ].join("\n");
  }
  return [
    "ข้อมูลจริงด้านล่างใช้ได้ทันที มีแหล่งอ้างอิงแล้ว (climate normals — **ไม่ใช่**สัญญาประหยัดไฟ):",
    "",
    "| รายการ | ค่า |",
    "| --- | --- |",
    `| รังสีดวงอาทิตย์เฉลี่ย (GHI) | **${rec.irradiationDaily} kWh/m²/วัน** |`,
    `| ผลผลิตเฉพาะ (specific yield) | **${rec.specificYield} kWh/kWp/ปี** |`,
    `| เทียบอันดับทั้ง 77 จังหวัด | **อันดับ ${rank} จาก ${energy.coverage}** จังหวัดที่มีข้อมูล |`,
    `| พิกัดจุดศูนย์กลางจังหวัด | ${rec.lat}, ${rec.lon} |`,
    "| แหล่งข้อมูล | PVGIS v5.3 (PVGIS-ERA5, 2005–2023), EC Joint Research Centre |",
    "",
    "หมายเหตุบังคับ: ตัวเลขข้างต้นคือค่าปกติของอากาศ ณ จุดศูนย์กลางจังหวัด — ไม่ใช่การสำรวจหน้างาน",
    "และไม่ใช่คำสัญญาประหยัด ผลจริงขึ้นกับระบบสูญเสีย มุมเอียง เงาบัง และโหลดจริงของอาคาร",
    "",
  ].join("\n");
}

function brief(prov, angle, rows, energy, rank) {
  const utility = MEA_SLUGS.has(prov.slug) ? "การไฟฟ้านครหลวง (MEA)" : "การไฟฟ้าส่วนภูมิภาค (PEA)";
  const q4 = rows.filter((r) => r.tier === "P4-aeo").map((r) => r.keyword);
  const totalBand = "12,000+ (พื้นขั้นต่ำ 3,200)";
  return `# Content Brief — /solar-carport/${prov.slug}/ (จังหวัด${prov.nameTh})

> สร้างจาก \`docs/seo/generate-province-content-briefs.mjs\` — ห้ามคัดลอกประโยค template ข้ามจังหวัด
> เป้าหมายเนื้อหา: **${totalBand} คำ** (ต่ำกว่า 3,200 คำ = ไม่ผ่าน) · ภูมิภาค: ${REGION_TH[prov.region] ?? prov.region} · ${prov.nameEn}

## 1. เป้าหมายของหน้า

- URL: \`https://www.sirinx.co/solar-carport/${prov.slug}/\`
- คำค้นหลักที่หน้านี้ต้องชนะ (P1): ${rows.filter((r) => r.tier === "P1-core").map((r) => "`" + r.keyword + "`").slice(0, 5).join(", ")}
- Search intent หลัก: commercial (consideration) — ผู้ประกอบการในจังหวัด${prov.nameTh}กำลังหาผู้ติดตั้ง ไม่ใช่หาข้อมูลทั่วไป
- การไฟฟ้าในพื้นที่: **${utility}**

## 2. คลัสเตอร์คีย์เวิร์ด (จาก keyword-map-77-provinces.csv)

${keywordBlock(rows)}

## 3. ข้อมูลจริงที่ใช้ได้ทันที

${energyBlock(prov, energy, rank)}

## 4. มุมเขียนเฉพาะจังหวัด (ห้ามคัดลอกไปหน้าอื่น — นี่คือหัวใจต้านเนื้อหาซ้ำ)

**มุมหลัก:** ${angle.angle}

**กลุ่มอาคาร/ธุรกิจที่เน้น:** ${angle.focus}

**ข้อเท็จจริงท้องถิ่นที่ต้องตรวจสอบก่อนเผยแพร่ (ห้ามเดา):**
${angle.verify.map((v) => `- [ ] ${v}`).join("\n")}

## 5. โครงสร้างบทความ + word budget

| ส่วน | H2/H3 | word budget | ข้อกำหนดความไม่ซ้ำ |
| --- | --- | --- | --- |
| 1 | H1: ติดตั้ง Solar Carport จังหวัด${prov.nameTh} — ลดค่าไฟองค์กรด้วยที่จอดรถผลิตไฟ | title | มีชื่อจังหวัด + คำ P1 |
| 2 | ย่อหน้าเปิด (ก่อน H2 แรก) | 400–500 | เอ่ย ${prov.nameTh} ≥ 3 ครั้ง + ปัจจัยเฉพาะถิ่นจาก §4 อย่างน้อย 1 อย่าง |
| 3 | H2: พลังงานแสงอาทิตย์ในจังหวัด${prov.nameTh} — ตัวเลขจริงจาก PVGIS | 600–800 | ตาราง §3 + เปรียบเทียบอันดับ/ภูมิภาค/ฤดูกาล |
| 4 | H2: (ตั้งชื่อจากมุมหลัก §4) | 800–1,000 | ทุกย่อหน้ามาจากมุมหลัก — ย้ายไปหน้าอื่นไม่ได้ |
| 5 | H2: กลุ่มอาคาร/ธุรกิจใน${prov.nameTh} (แยก H3 ทีละกลุ่มจาก §4 focus) | 1,800–2,400 | H3 ละ 400–600 คำ — เหตุผลเชิงโหลดไฟรายกลุ่ม เฉพาะถิ่น |
| 6 | H2: Solar Carport เทียบกับ Rooftop Solar ในบริบท${prov.nameTh} | 600–800 | การเปรียบเทียบต้องอ้างบริบทพื้นที่/อาคาร §4 |
| 7 | H2: EV Charging + BESS ในพื้นที่${prov.nameTh} | 700–900 | ผูกกับการไฟฟ้า ${utility} + กลุ่มผู้ใช้ §4 |
| 8 | H2: ประเมินความคุ้มค่าอย่างโปร่งใส (ไม่ใส่ตัวเลขยืนยัน) | 700–900 | สูตร/ปัจจัย + ข้อมูล §3 ของจังหวัดนี้เท่านั้น |
| 9 | H2: ขั้นตอนติดตั้ง ขออนุญาต และเชื่อมต่อกับ ${utility} | 600–800 | ชื่อการไฟฟ้าพื้นที่ + ขั้นตอนจริงที่ตรวจสอบแล้ว |
| 10 | H2: วิศวกรรมโครงสร้างที่ต้องคิดใน${prov.nameTh} (ลม/น้ำท่วม/พื้นที่) | 500–700 | อิงสภาพพื้นที่ §4 verify |
| 11 | H2: O&M และการดูแลระยะยาวในพื้นที่ | 400–500 | เฉพาะบริบทพื้นที่ §4 |
| 12 | H2: รูปแบบการลงทุนที่เหมาะกับผู้ประกอบการ${prov.nameTh} | 400–600 | ไม่สัญญาตัวเลขผลตอบแทน |
| 13 | H2: ESG / Green Building / มาตรฐานที่เกี่ยวข้อง | 400–500 | ผูกกับกลุ่มผู้ซื้อ §4 |
| 14 | H2: ข้อผิดพลาดที่พบบ่อยเมื่อติดตั้งในพื้นที่นี้ | 400–500 | เฉพาะถิ่นจาก §4 verify |
| 15 | H2: คำถามที่พบบ่อย (FAQ/AEO) — ตอบทุกข้อ P4 | 1,200–1,500 | คำถาม P4 เป็น H3 ทีละข้อ |
| 16 | H2: สรุป + นัดสำรวจหน้างาน | 250–350 | CTA เฉพาะถิ่น |

**กติกาความไม่ซ้ำบังคับ:** ทุก H2 ต้องมีอย่างน้อย 2 ประโยคที่ "ย้ายไปหน้าจังหวัดอื่นไม่ได้"
(ระบุชื่อจังหวัด/พื้นที่/กลุ่มอาคาร/ตัวเลขเฉพาะ) และห้ามมีประโยค template เดียวกันกับหน้าอื่นเกิน 1 ประโยคต่อ H2

## 6. คำถาม AEO ที่ต้องตอบ (P4)

${q4.map((q) => `- ${q}`).join("\n") || "- (ดู §2)"}

## 7. กติกาต้านเนื้อหาซ้ำ — เกณฑ์รับงาน

- [ ] เนื้อหารวม ≥ 3,200 คำ (พื้นขั้นต่ำ) และตั้งเป้า **12,000 คำขึ้นไป** (วัดด้วย Intl.Segmenter ภาษาไทย ไม่ใช่ split วรรคตอน)
- [ ] วัดความคล้ายกับหน้าจังหวัดอื่น (SequenceMatcher แบบที่ใช้ในงานวัดผลรอบ 2026-09-26): **ต้อง < 0.80**
  (ก่อนแก้ กรุงเทพฯ–ภูเก็ต = 0.982 — ตัวเลขนี้คือ baseline ที่ต้องเอาชนะ)
- [ ] ไม่มีตัวเลขประหยัด/คืนทุนที่ไม่มีแหล่ง — ใช้ได้เฉพาะตาราง §3 + สมมติฐานที่เปิดเผย
- [ ] ผ่านรายการตรวจสอบ §4 verify ทุกข้อ (หรือตัดข้อความนั้นทิ้ง)
- [ ] ไม่มีเบอร์โทรปลอม/placeholder ใน JSON-LD (ดู TECHNICAL_SEO_FIX_PACK §3)

## 8. Internal links + structured data

- ลิงก์เข้า: \`/solar-carport/\` (hub), \`/provinces/\`, หน้าจังหวัดข้างเคียงในภูมิภาคเดียวกัน 3–5 หน้า (เลือกจาก region "${REGION_TH[prov.region] ?? prov.region}")
- ลิงก์ออก: \`/pricing/\`, \`/assessment/\`, \`/projects/\`, \`/contact/\`
- Schema: LocalBusiness + FAQPage (คำถาม §6) + BreadcrumbList — ใช้ข้อมูลจริงเท่านั้น ไม่ใส่ telephone ปลอม
`;
}

// ---------- main ----------

const provinces = parseProvinces();
const energy = parseEnergy();
const keywords = parseKeywords();
const angles = JSON.parse(fs.readFileSync(path.join(SEO_DIR, "province-unique-angles.json"), "utf8"));

// rank by specific yield among available records (1 = highest)
const ranked = Object.entries(energy.records)
  .sort((a, b) => b[1].specificYield - a[1].specificYield)
  .map(([slug]) => slug);
const rankOf = (slug) => ranked.indexOf(slug) + 1;

fs.mkdirSync(OUT_DIR, { recursive: true });
let written = 0;
const missingAngles = [];
for (const prov of provinces) {
  const angle = angles[prov.slug];
  if (!angle) { missingAngles.push(prov.slug); continue; }
  const rows = keywords.get(prov.slug) ?? [];
  const md = brief(prov, angle, rows, energy, rankOf(prov.slug));
  fs.writeFileSync(path.join(OUT_DIR, `${prov.slug}.md`), md, "utf8");
  written++;
}

console.log(JSON.stringify({
  written,
  provinces: provinces.length,
  energyCoverage: energy.coverage,
  missingAngles,
  outDir: OUT_DIR,
}, null, 2));
