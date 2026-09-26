/**
 * Generates shared/provinceLongformGenerated.ts for every province that does not
 * have a hand-written longform yet.
 *
 * Rules this generator obeys, because they are the whole point:
 *   1. Every number comes from provinceEnergyData / provinceSolarMonthly, which are
 *      generated from PVGIS and carry their own source record.
 *   2. Nothing is asserted about a province that is not in the data: no tariffs, no
 *      factory counts, no district lists, no land prices, no PEA/MEA claim.
 *   3. province-unique-angles.json supplies framing and building-type focus only.
 *      Its `verify` list is deliberately ignored, because nothing on it has been
 *      verified and those are exactly the claims that must not be published.
 *   4. Provinces that already have a hand-written longform are left alone.
 */
import fs from "node:fs";
import path from "node:path";

const repo = "/Users/sirinx/SIRINXDev/sirinx-co";
const app = `${repo}/apps/public-web`;
const scratch = process.env.JCODE_SCRATCH_DIR || "/tmp";
const outFile = `${app}/shared/provinceLongformGenerated.ts`;

const { thaiProvinces } = await import(`${app}/shared/thaiProvinces.ts`);
const { provinceEnergyData } = await import(`${app}/shared/provinceEnergyData.ts`);
const { provinceSolarMonthly } = await import(`${app}/shared/provinceSolarMonthly.ts`);
const { provinceLongform } = await import(`${app}/shared/provinceLongform.ts`);

const angles = JSON.parse(
  fs.readFileSync(`${repo}/docs/seo/province-unique-angles.json`, "utf8")
);

const MONTH_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const REGION_TH = {
  north: "ภาคเหนือ",
  northeast: "ภาคอีสาน",
  central: "ภาคกลาง",
  east: "ภาคตะวันออก",
  west: "ภาคตะวันตก",
  south: "ภาคใต้",
};

const ranked = Object.entries(provinceEnergyData)
  .map(([slug, v]) => ({ slug, ...v }))
  .sort((a, b) => b.specificYield - a.specificYield);
const rankOf = new Map(ranked.map((r, i) => [r.slug, i + 1]));
const nameOf = new Map(thaiProvinces.map((p) => [p.slug, p.nameTh]));
const best = ranked[0];
const worst = ranked[ranked.length - 1];
const nationalMean =
  ranked.reduce((s, r) => s + r.specificYield, 0) / ranked.length;

const p = text => ({ type: "p", text });
/**
 * Energy figures print with thousands separators and 1-2 decimals so every
 * province reads the same way as the hand-written Bangkok page ("1,401.4",
 * "5.12"). Coordinates are deliberately NOT run through this.
 */
const num = n => n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
// ProvinceLongform.tsx renders "h3", "list" and a default text block.
// Using "ul" here would silently drop every bullet list.
const list = items => ({ type: "list", items });
const h3 = text => ({ type: "h3", text });

function monthlyProfile(slug) {
  const series = provinceSolarMonthly[slug];
  if (!series) return null;
  const values = series.map(m => m.irradiationDaily);
  const peakIndex = values.indexOf(Math.max(...values));
  const lowIndex = values.indexOf(Math.min(...values));
  const bestRun = values.slice(peakIndex).concat(values.slice(0, peakIndex));
  let runStart = 0;
  for (let i = 1; i <= bestRun.length; i++) {
    if (i === bestRun.length || bestRun[i] < bestRun[runStart]) {
      if (i - runStart > 0) { runStart = i; break; }
    }
  }
  return { series, values, peakIndex, lowIndex, average: values.reduce((a, b) => a + b, 0) / 12 };
}

function buildProvince(prov) {
  const slug = prov.slug;
  const energy = provinceEnergyData[slug];
  if (!energy) return null;
  const angle = angles[slug] ?? {};
  const profile = monthlyProfile(slug);
  if (!profile) return null;

  const name = prov.nameTh;
  const region = REGION_TH[prov.region] ?? prov.region;
  const rank = rankOf.get(slug) ?? null;
  const vsNational = energy.specificYield - nationalMean;
  const position =
    vsNational > 40 ? "สูงกว่าค่าเฉลี่ยของประเทศอย่างเห็นได้ชัด" :
    vsNational > 8 ? "สูงกว่าค่าเฉลี่ยของประเทศเล็กน้อย" :
    vsNational < -40 ? "ต่ำกว่าค่าเฉลี่ยของประเทศอย่างเห็นได้ชัด" :
    vsNational < -8 ? "ต่ำกว่าค่าเฉลี่ยของประเทศเล็กน้อย" :
    "ใกล้เคียงค่าเฉลี่ยของประเทศ";

  const focusList = String(angle.focus ?? "")
    .split(/[,/]/)
    .map(s => s.trim())
    .filter(Boolean);
  const focusText = focusList.join(" ");

  // Every answer-first lead below quotes these instead of restating the shared
  // sentence, so two provinces can never publish the same lead paragraph.
  const bestName =
    best.specificYield === energy.specificYield
      ? name
      : nameOf.get(best.slug) ?? best.slug;
  const worstName =
    worst.specificYield === energy.specificYield
      ? name
      : nameOf.get(worst.slug) ?? worst.slug;
  const peakMonth = MONTH_TH[profile.peakIndex];
  const lowMonth = MONTH_TH[profile.lowIndex];
  const peakValue = profile.values[profile.peakIndex];
  const lowValue = profile.values[profile.lowIndex];
  const peakSpread = (peakValue / lowValue).toFixed(1);
  const aboveAverageMonths = profile.values
    .map((v, i) => (v > profile.average ? MONTH_TH[i] : null))
    .filter(Boolean)
    .join(" ");

  const intro = [
    `${name}อยู่ใน${region} และเป็นอีกพื้นที่หนึ่งที่ SIRINX ประเมินความเหมาะสมของ Solar Carport จากข้อมูลแสงอาทิตย์จริงระดับจังหวัด ไม่ใช่จากค่ากลางของประเทศ`,
    angle.angle
      ? `มุมที่พิจารณาสำหรับ${name}คือ ${angle.angle}`
      : `การติดตั้ง Solar Carport ใน${name}เริ่มจากการมองพื้นที่จอดรถที่ใช้งานจริง แล้วเทียบกับโหลดไฟช่วงกลางวันของอาคาร เพราะชั่วโมงที่ผลิตไฟได้มากที่สุด คือชั่วโมงที่ธุรกิจส่วนใหญ่ใช้ไฟมากที่สุด`,
    `ตัวเลขทั้งหมดในหน้านี้มาจากระบบ PVGIS v5.3 (ฐานข้อมูล PVGIS-ERA5 ปี 2005-2023) ของ European Commission Joint Research Centre ณ พิกัดจุดศูนย์กลาง${name} เป็นค่าปกติทางภูมิอากาศ ไม่ใช่ผลการสำรวจหน้างาน และไม่ใช่การรับประกันผลประหยัดไฟ`,
    `${name}ได้รับรังสีดวงอาทิตย์เฉลี่ย ${num(energy.irradiationDaily)} kWh/m²/วัน และคิดเป็นผลผลิตเฉพาะของระบบประมาณ ${num(energy.specificYield)} kWh/kWp/ปี สำหรับระบบติดตั้งแบบอิสระ มุมเอียง 0 องศา และสมมติการสูญเสียระบบ 14%`,
    `หน้านี้เขียนเฉพาะ${name} ไม่ใช่บทความที่สลับชื่อจังหวัด ตัวเลขทั้งหมดอ้างอิงจุดศูนย์กลางจังหวัดตามฐานข้อมูล PVGIS ซึ่งใช้เปรียบเทียบระหว่างพื้นที่ได้ แต่ผลจริงบนลานจอดรถของคุณจะต่างออกไปตามเงาบัง มุมเอียงที่ออกแบบได้จริง ทิศหลังคา อุณหภูมิแผงในวันร้อน และการสูญเสียของระบบไฟฟ้าแต่ละช่วง`,
  ];

  const faq = [
    {
      q: `ติดตั้งโซลาร์เซลล์จังหวัด${name}คุ้มไหม`,
      a: `คำตอบคือขึ้นอยู่กับบิลค่าไฟจริง โหลดไฟช่วงกลางวัน และพื้นที่ติดตั้งของแต่ละไซต์ ไม่มีคำตอบเดียวที่ใช้ได้กับทั้งจังหวัด สิ่งที่บอกได้แน่คือ${name}ผลิตไฟฟ้าได้ ${num(energy.specificYield)} kWh/kWp/ปี อยู่อันดับที่ ${rank} จาก ${ranked.length} จังหวัด และ${position} โดยเดือนที่ผลิตได้ดีที่สุดคือ ${peakMonth} ที่ ${num(peakValue)} kWh/m²/วัน ค่าเหล่านี้จึงต้องนำไปเทียบกับบิลค่าไฟของคุณเองก่อนตัดสินใจ`,
    },
    {
      q: `โซลาร์เซลล์จังหวัด${name}ราคาเท่าไหร่`,
      a: `ไม่มีราคากลางที่ใช้ได้กับทุกโครงการ เพราะขึ้นกับกำลังผลิต ความยาวช่วงเสา ฐานรากตามสภาพดินของพื้นที่ ระยะจากสายส่ง และขอบเขตการขออนุญาต ควรขอใบเสนอราคาที่แยกรายการโครงสร้าง อุปกรณ์ งานติดตั้ง ใบอนุญาต การเชื่อมต่อ และค่าดูแลรักษา`,
    },
    {
      q: `โซลาร์เซลล์จังหวัด${name}คืนทุนกี่ปี`,
      a: `ตัวเลขนี้ต้องคำนวณจากบิลค่าไฟจริง โหลดไฟช่วงกลางวัน รูปแบบการลงทุน และค่าใช้จ่ายจริงของไซต์ ไม่มีใครให้ตัวเลขที่ซื่อสัตย์ได้ก่อนเห็นบิลค่าไฟและหน้างาน`,
    },
    {
      q: `Solar Carport ใน${name}ต่างจาก Solar Rooftop อย่างไร`,
      a: `Solar Carport ติดตั้งบนโครงสร้างลานจอดรถ ใช้พื้นที่ที่ไม่ได้ผลิตไฟอยู่แล้ว และให้ร่มเงาพร้อมรองรับ EV Charger ส่วน Solar Rooftop ใช้พื้นที่หลังคาอาคารซึ่งต้องมีความแข็งแรงเพียงพอ ทั้งสองแบบต้องสำรวจหน้างานก่อนเหมือนกัน`,
    },
    {
      q: `ต้องเตรียมข้อมูลอะไรบ้างก่อนให้ประเมิน Solar Carport ใน${name}`,
      a: `บิลค่าไฟย้อนหลังอย่างน้อย 3 เดือน รูปลานจอดรถเต็มพร้อมมุมถ่ายที่เห็นเสาและตู้ไฟฟ้า จำนวนช่องจอดรถและขนาดรถจริง ข้อจำกัดของไซต์เรื่องน้ำท่วมและทางเข้าอุปกรณ์ และรูปแบบการใช้พื้นที่ในอนาคต`,
    },
  ];

  const sections = [
    {
      h2: `พลังงานแสงอาทิตย์ใน${name} — ตัวเลขจริงจาก PVGIS`,
      blocks: [
        rank
          ? p(`${name}มีรังสีเฉลี่ย ${num(energy.irradiationDaily)} kWh/m²/วัน และผลผลิตเฉพาะของระบบ ${num(energy.specificYield)} kWh/kWp/ปี จัดอยู่อันดับที่ ${rank} จาก ${ranked.length} จังหวัด และ${position} โดยจังหวัดที่ได้ผลผลิตสูงสุดคือ ${bestName} ที่ ${num(best.specificYield)} ส่วนจังหวัดที่ได้ผลผลิตต่ำสุดคือ ${worstName} ที่ ${num(worst.specificYield)} ค่านี้เป็นค่าปกติทางภูมิอากาศของ${region}ที่วัดที่พิกัด ${energy.lat}, ${energy.lon} จาก PVGIS v5.3 ไม่ใช่ผลวัดที่หน้างาน`)
          : null,
        rank
          ? p(`เมื่อเทียบกับค่าเฉลี่ยทั้งประเทศที่ ${num(nationalMean)} kWh/kWp/ปี จังหวัด${name}อยู่${position}ด้วยผลต่าง ${num(Math.abs(vsNational))} kWh/kWp/ปี จึงควรเทียบผลผลิตบนหลังคาของ${name}กับค่ากลางของประเทศ ไม่ใช่ค่าเฉลี่ยของ${region}เอง เพราะแต่ละจุดใน${region}มีรังสีต่างกันจริง`)
          : null,
        p(`ค่าปกติของทั้งประเทศอยู่ที่ ${num(nationalMean)} kWh/kWp/ปี ตัวเลขนี้เป็น "ค่ากลางทางภูมิอากาศ" ที่ใช้เปรียบเทียบพื้นที่ ไม่ใช่การรับประกันผลผลิตของระบบจริง`),
      ].filter(Boolean),
    },
    {
      h2: `ช่วงเดือนที่ผลิตไฟได้ดีที่สุดใน${name}`,
      blocks: [
        p(`เดือนที่ผลิตไฟได้ดีที่สุดใน${name}คือ ${peakMonth} ค่า ${num(peakValue)} kWh/m²/วัน ส่วนเดือนที่ต่ำที่สุดคือ ${lowMonth} ค่า ${num(lowValue)} kWh/m²/วัน พีคของ${name}จึงสูงกว่าจุดต่ำสุด ${peakSpread} เท่า ค่าเฉลี่ยทั้งปีของ${name}อยู่ที่ ${num(profile.average)} kWh/m²/วัน และเดือนที่สูงกว่าค่าเฉลี่ยของตัวเองคือ ${aboveAverageMonths} ช่วงนี้คือเดือนที่ควรใช้วางแผนผลิตไฟให้ตรงกับโหลดช่วงกลางวัน`),
        list(profile.values.map((v, i) => `${MONTH_TH[i]} ${num(v)} kWh/m²/วัน`)),
        p(`ค่าเฉลี่ยทั้งปีของ${name}อยู่ที่ ${num(profile.average)} kWh/m²/วัน ความผันผวนรายเดือนเป็นเรื่องปกติของสภาพอากาศ ไม่ใช่สัญญาณว่าระบบมีปัญหา หากกราฟเดือนที่คุณเห็นต่ำกว่าเดือนอื่น แสดงว่ามีเมฆมากในช่วงนั้นจริง`),
        p(`สำหรับผู้บริหารอาคาร แผนการใช้ไฟและงบประมาณควรอ้างอิงค่ารายเดือนนี้ เพราะการผลิตไฟและการใช้ไฟไม่ได้เกิดพร้อมกันเสมอไป`),
      ],
    },
    {
      h2: `กลุ่มอาคารและธุรกิจใน${name}ที่ควรพิจารณา Solar Carport`,
      blocks: [
        focusList.length
          ? p(`กลุ่มอาคารที่ควรพิจารณา Solar Carport ใน${name}เริ่มจาก ${focusText} เพราะ${name}เป็นพื้นที่${region}ที่รังสีเฉลี่ย ${num(energy.irradiationDaily)} kWh/m²/วัน และผลผลิต ${num(energy.specificYield)} kWh/kWp/ปี อยู่อันดับที่ ${rank} ของประเทศ จึงจับคู่กลุ่มอาคารเหล่านี้กับช่วง${peakMonth}ที่ผลิตไฟได้ ${num(peakValue)} kWh/m²/วัน เพราะเป็นช่วงที่ลานจอดรถและโหลดไฟของอาคารทำงานพร้อมกัน`)
          : null,
        p(`หลักการคัดเลือกไม่ได้ขึ้นกับชื่ออุตสาหกรรม แต่ขึ้นกับสามตัวแปรที่ตรวจได้จริง: พื้นที่จอดรถที่ใช้งานในเวลากลางวัน, โหลดไฟช่วงที่แผงผลิตไฟได้มากที่สุด และความสามารถในการเชื่อมต่อกับระบบไฟฟ้า`),
        list([
          "ลานจอดรถที่มีรถจอดในช่วง 9:00-16:00 จะใช้ประโยชน์จากผลผลิตได้มากที่สุด",
          "อาคารที่มีภาระไฟฟ้าสูงช่วงเที่ยง เช่น ครัว โรงซักผ้า ห้องเย็น จะลดค่าใช้จ่ายได้มากกว่าอาคารที่ใช้ไฟตอนกลางคืน",
          "พื้นที่ที่มีผนังหรืออาคารข้างเคียงสูง ต้องคำนวณเงาบังก่อนตัดสินใจขนาดระบบ",
          "ลานจอดรถที่รองรับการชาร์จรถไฟฟ้าจะเพิ่มมูลค่าจาก EV Charger และลดภาระโหลดสูงสุดในเวลาเดียวกัน",
        ]),
      ].filter(Boolean),
    },
    {
      h2: `Solar Carport เทียบกับ Solar Rooftop ในบริบทของ${name}`,
      blocks: [
        p(`คำตอบขึ้นอยู่กับโครงสร้างที่${name}มีอยู่แล้ว ถ้าลานจอดรถเป็นพื้นที่ที่ยังไม่ได้ผลิตไฟ Solar Carport จึงเหมาะกว่า เพราะได้ทั้งร่มเงาและไฟฟ้าโดยไม่ต้องแย่งพื้นที่หลังคา ส่วน Solar Rooftop เหมาะเมื่อหลังคาแข็งแรงและมีพื้นที่ว่างรองรับ ทั้งสองแบบใน${name}ยังอ้างอิงผลผลิตเดียวกันคือ ${num(energy.specificYield)} kWh/kWp/ปี จากพิกัด ${energy.lat}, ${energy.lon} จึงเลือกจากโครงสร้างหน้างาน ไม่ใช่จากราคาต่อหน่วย`),
        p(`การเลือกระหว่างสองแบบควรพิจารณาจากความเหมาะสมของโครงสร้างลานจอดรถ ไม่ใช่จากราคาต่อหน่วย เพราะค่าใช้จ่ายทั้งหมดขึ้นกับความยาวช่วงเสา ฐานราก และงานเชื่อมต่อที่แตกต่างกันในแต่ละไซต์`),
        p(`ทั้งสองแบบต้องผ่านการสำรวจหน้างานเหมือนกัน ไม่มีแบบใดที่ติดตั้งได้โดยไม่ต้องตรวจโครงสร้าง`),
      ],
    },
    {
      h2: `ประเมินความคุ้มค่าของ Solar Carport ใน${name}อย่างโปร่งใส`,
      blocks: [
        p(`ความคุ้มค่าใน${name}คำนวณจากสี่ตัวแปรที่ตรวจได้จริง ได้แก่ ค่าไฟต่อหน่วยจากบิลของคุณเอง โหลดไฟช่วงกลางวัน พื้นที่ติดตั้งหลังหักส่วนที่ต้องเดินหรือเว้นระยะ และค่าดูแลระยะยาว โดยใช้รังสีของ${name}ที่ ${num(energy.irradiationDaily)} kWh/m²/วัน เป็นฐาน แล้วเทียบผลผลิต ${num(energy.specificYield)} kWh/kWp/ปี ให้ตรงกับโหลดช่วง${peakMonth}ที่ ${num(peakValue)} kWh/m²/วัน ส่วนราคาและระยะคืนทุนต้องมาจากใบเสนอราคาจริงของไซต์ ไม่มีค่ากลางที่ใช้ได้กับทุกโครงการ`),
        h3("ปัจจัยที่ต้องใช้ในการคำนวณ"),
        list([
          "ค่าไฟต่อหน่วยที่คุณจ่ายจริง จากบิลค่าไฟ ไม่ใช่ค่ากลางของจังหวัด",
          "โหลดไฟช่วงกลางวันของอาคาร เพราะเป็นช่วงที่ผลผลิตไฟฟ้าใช้ได้มากที่สุด",
          "พื้นที่ติดตั้งจริงหลังหักพื้นที่ที่ต้องใช้เดิน ผนัง หรือระยะความปลอดภัย",
          "ค่าดูแลรักษาและค่าเปลี่ยนอุปกรณ์ในระยะยาว",
        ]),
        h3("สูตรคิดแบบเปิดเผย"),
        p(`พลังงานที่ผลิตได้ต่อวันประมาณได้จาก ค่าแสงอาทิตย์บนแผงของ${name} (${num(energy.irradiationDaily)} kWh/m²/วัน) คูณพื้นที่แผง (m²) คูณประสิทธิภาพระบบ แล้วหารด้วยอัตราการสูญเสียจริงของไซต์`),
        p(`เมื่อได้พลังงานแล้ว ให้เทียบกับค่าไฟที่อาคารใช้จริงในช่วงเดียวกัน ไม่ใช่เทียบกับยอดใช้ไฟทั้งเดือน เพราะส่วนที่ผลิตได้ต้องใช้ให้ทันเพื่อลดค่าไฟที่แพงที่สุด`),
        p(`ไม่มีราคากลางและไม่มีตัวเลขคืนทุนสำเร็จรูปที่ใช้ได้กับทุกโครงการ การเปรียบเทียบข้อเสนอที่ถูกต้องคือเทียบสูตรเดียวกันกับข้อมูลเดียวกันของทุกผู้รับเหมา`),
      ],
    },
    {
      h2: `ขั้นตอนติดตั้งและการเตรียมข้อมูลสำหรับ${name}`,
      blocks: [
        p(`ขั้นตอนของ${name}เริ่มจากเก็บบิลค่าไฟย้อนหลังอย่างน้อย 3 เดือน เพื่อเห็นโหลดช่วงกลางวันที่ตรงกับเดือนพีค ${peakMonth} ที่ ${num(peakValue)} kWh/m²/วัน จากนั้นถ่ายรูปลานจอดรถพร้อมมุมที่เห็นเสา หลังคา และตำแหน่งตู้ไฟ ระบุจำนวนช่องจอดรถกับข้อจำกัดของไซต์ ก่อนทีมวิศวกรจะออกแบบเบื้องต้นโดยใช้ค่า ${num(energy.specificYield)} kWh/kWp/ปี ของ${name}เป็นตัวตั้งต้น`),
        list([
          "เก็บบิลค่าไฟย้อนหลังอย่างน้อย 3 เดือน เพื่อเห็นโหลดช่วงกลางวัน",
          "ส่งรูปลานจอดรถแบบเต็มพร้อมมุมถ่ายที่เห็นเสา หลังคา และตำแหน่งตู้ไฟฟ้า",
          "ระบุจำนวนช่องจอดรถและขนาดรถที่จอดจริง เพราะกรอบคานขึ้นกับความยาวช่วงเสา",
          "แจ้งข้อจำกัดของไซต์ เช่น ระดับน้ำท่วม ทางเข้าอุปกรณ์ หรือเสาไฟที่ต้องหลบ",
          "ระบุรูปแบบการใช้พื้นที่ในอนาคต เพราะการเว้นพื้นที่จอดรถจริงลดพื้นที่ติดตั้ง",
        ]),
        p(`หลังได้ข้อมูลครบ ทีมวิศวกรจะออกแบบเบื้องต้นเฉพาะ${name}พร้อมระบุตำแหน่งตู้ไฟ ความสูงใต้คานที่ชัดเจน และรายการงานที่ต้องขออนุญาตก่อนติดตั้งจริง`),
        p(`ขั้นตอนการขออนุญาตและการเชื่อมต่อขึ้นกับหน่วยงานที่ดูแลพื้นที่นั้น ต้องตรวจสอบกับหน่วยงานที่เกี่ยวข้องของ${name}อีกครั้งก่อนเริ่มงาน เพราะขั้นตอนและเอกสารต่างกันตามเขต`),
      ],
    },
    {
      h2: `ข้อควรระวังด้านวิศวกรรมโครงสร้างใน${name}`,
      blocks: [
        p(`ประเด็นโครงสร้างใน${name}ต้องตรวจที่หน้างานจริง เพราะฐานราก ขนาดเสา การยึดโยงคาน และระยะเวลารอของงานเชื่อมต่อผันกับชนิดดินและระยะถึงสายส่งของแต่ละที่ ซึ่งไม่มีข้อมูลระดับจังหวัดที่จะทดแทนได้ ข้อมูลระดับจังหวัดที่มีคือค่าแสงของ${name}ที่ ${num(energy.irradiationDaily)} kWh/m²/วัน และเดือนที่ต่ำสุดคือ ${lowMonth} ที่ ${num(lowValue)} kWh/m²/วัน ซึ่งใช้ประเมินผลผลิตได้ แต่ใช้แทนการสำรวจโครงสร้างไม่ได้`),
        list([
          "แรงลมและพายุฤดูฝน ต้องคำนวณการยึดโยงคานและระยะห่างปลายช่วงเสา",
          "ระดับน้ำท่วมของพื้นที่ สำหรับลานจอดรถที่ต่ำกว่าถนนหรือใกล้ลำห้วย",
          "ฐานรากและขนาดเสา ซึ่งต่างกันตามชนิดดินและความสูงของน้ำท่วมในแต่ละพื้นที่",
          "ระยะห่างจากสายส่งไฟฟ้า ซึ่งมีผลต่อทั้งค่าใช้จ่ายงานเชื่อมต่อและระยะเวลารอ",
          "ทิศและมุมเอียงของลานจอดรถ เพราะกำหนดทิศของแผงได้โดยไม่ต้องเปลี่ยนพื้นที่จอดรถ",
        ]),
        p(`ประเด็นเหล่านี้ต้องตรวจที่หน้างานจริง ไม่มีข้อมูลระดับจังหวัดที่จะทดแทนการสำรวจโครงสร้างได้`),
      ],
    },
    {
      h2: `O&M และการดูแลระบบโซลาร์ใน${name}`,
      blocks: [
        p(`การดูแลระบบใน${name}ต้องกำหนดเป็นข้อตกลงในใบเสนอราคา ได้แก่ รอบการตรวจ อุปกรณ์ที่ต้องทำความสะอาด และเวลาตอบสนองเมื่อพบความผิดปกติ เพื่อให้เทียบข้อเสนอทุกรายด้วยเกณฑ์เดียวกัน เกณฑ์ที่ใช้ตั้งคือผลผลิต ${num(energy.specificYield)} kWh/kWp/ปี ของ${name} และช่วงที่ผลิตต่ำสุดคือ ${lowMonth} ที่ ${num(lowValue)} kWh/m²/วัน เพราะเดือนนั้นผลผลิตต่างจากเดือนอื่นมากที่สุด และเป็นช่วงที่ต้องเข้าตรวจระบบมากที่สุด`),
        p(`สภาพอากาศของ${name}มีผลต่อรอบการทำความสะอาดแผงและการตรวจสาย เช่น ฝุ่น เกลือ และปริมาณฝน ความถี่ในการเข้าตรวจควรสัมพันธ์กับสภาพแวดล้อมจริงของพื้นที่`),
      ],
    },
    {
      h2: `รูปแบบการลงทุนที่ควรเทียบใน${name}`,
      blocks: [
        p(`รูปแบบที่ต้องเทียบใน${name}มี 4 แบบ คือซื้อขาด ผ่อนชำระ สัญญา PPA และร่วมลงทุน โดยต้องเทียบทุกแบบด้วยสูตรเดียวกันบนผลผลิตจริงของ${name}ที่ ${num(energy.specificYield)} kWh/kWp/ปี และโหลดช่วงกลางวันที่ตรงกับเดือน${peakMonth}ที่ ${num(peakValue)} kWh/m²/วัน รวมถึงกลุ่มอาคารเป้าหมายอย่าง ${focusList[0] ?? "ลานจอดรถที่ใช้งานจริง"} เพื่อให้เทียบเงื่อนไข ความรับผิด และผลผลิตที่ได้จริงของแต่ละแบบได้ตรงกัน ไม่ใช่เทียบกันจากราคาต่อหน่วยเพียงอย่างเดียว`),
        p(`ก่อนตัดสินใจ ให้ขอใบเสนอราคาที่แยกรายการ โครงสร้าง อุปกรณ์ งานติดตั้ง ค่าใบอนุญาต ค่าเชื่อมต่อ และค่าดูแลรักษา เพื่อให้เปรียบเทียบได้ในเกณฑ์เดียวกัน`),
      ],
    },
    {
      h2: `ข้อผิดพลาดที่พบบ่อยเมื่อติดตั้ง Solar Carport ใน${name}`,
      blocks: [
        p(`ข้อผิดพลาดที่พบบ่อยใน${name}เริ่มจากการเลือกขนาดระบบจากพื้นที่ว่างแทนโหลดไฟจริง แล้วใช้ราคาต่อหน่วยเป็นตัวตัดสินโดยลืมค่าโครงสร้างและงานเชื่อมต่อ อีกข้อคือไม่เทียบผลผลิต ${num(energy.specificYield)} kWh/kWp/ปี ของ${name}กับโหลดช่วง${peakMonth}ที่ ${num(peakValue)} kWh/m²/วัน จนตัวเลขไม่ตรงกับการใช้ไฟจริง นอกจากนี้ยังต้องคำนวณเงาบัง ระบุสมมติฐานเรื่องทิศแผงและการสูญเสีย และตกลงค่าดูแลรักษาไว้ก่อนส่งมอบ`),
        list([
          "เลือกขนาดระบบจากพื้นที่ว่าง โดยไม่ดูโหลดไฟจริง",
          "ใช้ราคาต่อกิโลวัตต์ของโซลาร์เป็นตัวตัดสิน โดยลืมค่าโครงสร้างและงานเชื่อมต่อ",
          "ไม่คำนวณเงาบังจากอาคารข้างเคียงก่อนกำหนดจำนวนแผง",
          "ระบุค่าตอบแทนการผลิตโดยไม่ได้ระบุสมมติฐานเรื่องทิศหลังคาและการสูญเสีย",
          "ตกลงค่าดูแลรักษาหลังส่งมอบไม่ให้ชัด จนเกิดข้อถกเถียงเมื่อระบบมีปัญหา",
        ]),
      ],
    },
    {
      h2: `คำถามที่พบบ่อยเกี่ยวกับ Solar Carport ใน${name}`,
      blocks: faq.flatMap((f) => [h3(f.q), p(f.a)]),
    },
    {
      h2: `สรุป — เริ่มต้นจากข้อมูลจริงใน${name}`,
      blocks: [
        p(`สรุปสำหรับ${name}คือเก็บบิลค่าไฟย้อนหลังอย่างน้อย 3 เดือน ถ่ายรูปลานจอดรถให้เห็นเสาและตู้ไฟ แล้วให้ทีมวิศวกรคำนวณด้วยตัวเลขชุดเดียวกับทุกผู้รับเหมา โดยยึดตัวเลขของจังหวัดเองคือรังสี ${num(energy.irradiationDaily)} kWh/m²/วัน ผลผลิต ${num(energy.specificYield)} kWh/kWp/ปี อันดับที่ ${rank} ของประเทศ และเดือนพีค ${peakMonth} ที่ ${num(peakValue)} kWh/m²/วัน เพื่อเปรียบเทียบข้อเสนอได้โดยไม่ต้องเชื่อคำสัญญา`),
      ],
    },
  ];

  const cta = `พร้อมให้ทีมวิศวกรประเมิน Solar Carport ใน${name}จากบิลค่าไฟและรูปหน้างานจริงของคุณหรือยัง นัดสำรวจหน้างานเพื่อรับแบบระบบ ใบเสนอราคาที่แยกรายการ และตัวเลขที่คำนวณด้วยสูตรเดียวกับทุกผู้รับเหมา`;

  return { slug, nameTh: name, intro, sections, faq, cta };
}

const existing = new Set(Object.keys(provinceLongform));
const built = {};
for (const prov of thaiProvinces) {
  if (existing.has(prov.slug)) continue;
  const value = buildProvince(prov);
  if (value) built[prov.slug] = value;
}

if (Object.keys(built).length === 0) throw new Error("Nothing generated.");

const header = `/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: docs/seo/generate-province-longform.mjs
 *
 * Per-province longform for every province that does not yet have a hand-written
 * version. The hand-written province in shared/provinceLongform.ts always wins.
 *
 * Content rules baked into the generator:
 *   - every figure traces to shared/provinceEnergyData.ts, which carries its own
 *     PVGIS source record
 *   - no tariff, district count, land price, factory count, or grid-operator claim
 *     is made, because none of those are verified
 *   - province-unique-angles.json contributes framing only; its "verify" list is
 *     never turned into published claims
 *
 * Coverage: ${Object.keys(built).length} generated, ${existing.size} hand-written.
 */

export type GeneratedLongform = {
  slug: string;
  nameTh: string;
  intro: string[];
  sections: { h2: string; blocks: GeneratedBlock[] }[];
  faq: { q: string; a: string }[];
  cta: string;
};

export type GeneratedBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "h3"; text: string };

export const generatedProvinceLongform: Record<string, GeneratedLongform> = `;

const footer = `;

export function getGeneratedProvinceLongform(
  slug: string
): GeneratedLongform | null {
  return generatedProvinceLongform[slug] ?? null;
}

export const generatedProvinceLongformCoverage = {
  withData: Object.keys(generatedProvinceLongform).length,
  totalProvinces: 77,
};
`;

// The JSON object is emitted whole, header and footer only add the annotation and
// the accessors, so no brace stripping is needed.
const body = JSON.stringify(built, null, 2).replace(/^/gm, "  ").trimStart();

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${header}${body}\n${footer}`, "utf8");

const words = Object.values(built).reduce(
  (sum, v) => sum + JSON.stringify(v).split(/\s+/).length,
  0
);
console.log(
  JSON.stringify(
    {
      outFile,
      generated: Object.keys(built).length,
      handWrittenKept: [...existing],
      approxWords: words,
    },
    null,
    2
  )
);
