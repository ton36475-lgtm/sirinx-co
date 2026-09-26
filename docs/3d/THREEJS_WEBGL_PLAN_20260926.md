# Three.js / WebGL ขั้นสูง — แผนและหลักการสำหรับ www.sirinx.co

Status: LOCAL_ONLY · 2026-09-26 · Gate consumed: ไม่มี · ใช้ `three@0.186.1` ที่มีอยู่แล้วใน monorepo

## 1. สิ่งที่ลงมือแล้ว (ไฟล์จริง)

| artifact | คืออะไร |
| --- | --- |
| `shared/sunMath.ts` | คณิตศาสตร์ตำแหน่งดวงอาทิตย์จริง (NOAA) — pure/tested: elevation, azimuth, daylight window |
| `shared/sunMath.test.ts` | 6 tests ตาม invariant ทางดาราศาสตร์ (เที่ยงสูง/เที่ยงคืนต่ำ, azimuth 0–360, ดวงอาทิตย์อยู่ฟ้าเหนือที่ภูเก็ต solstice) |
| `client/src/components/three/ProvinceSolarScene.tsx` | 3D solar-carport scene: เส้นทางดวงอาทิตย์จริงรายจังหวัด + แผงแบบ InstancedMesh + data overlay |

## 2. หลักการขั้นสูงที่ใช้ในคอมโพเนนต์ (checklist สำหรับงาน 3D ทุกชิ้น)

1. **Lazy dynamic import** — `import("three")` ใน useEffect: 3D ไม่ถ่วง bundle แรก/ไม่กระทบ LCP
2. **Perf budget** — DPR ≤ 2, antialias เฉพาะจอ DPR ต่ำ, `powerPreference: "low-power"`,
   InstancedMesh (1 draw call ต่อวัสดุ), shadow map 1024, fog ตัดระยะ
3. **Render เฉพาะที่จำเป็น** — IntersectionObserver หยุด loop เมื่อพ้นจอ; `prefers-reduced-motion`
   = นิ่ง 1 เฟรม (solar noon) ไม่มีแอนิเมชัน
4. **Color pipeline** — `SRGBColorSpace` + ACESFilmicToneMapping (ภาพไม่เพี้ยน/ไม่ซีด)
5. **Context loss** — ฟัง `webglcontextlost` + preventDefault (กันจอดำบน Android)
6. **A11y/SEO** — canvas `aria-hidden` ข้อมูลจริงอยู่ใน HTML figcaption (crawler เห็นครบ)
7. **Dispose ครบ** — geometry/material/renderer/controls ทุกตัวใน cleanup (กัน VRAM leak)
8. **ความถูกต้อง** — ดวงอาทิตย์มาจากพิกัดจริง + ดาราศาสตร์ ไม่ใช่แอนิเมชันมั่ว = ภาพที่ "จริง" ทุกจังหวัด

## 3. แนวทางต่อยอด (ลำดับถัดไป)

| ลำดับ | งาน | หมายเหตุ |
| --- | --- | --- |
| 1 | Wire `ProvinceSolarScene` เข้าหน้า `/solar-carport/:slug` (lazy, below the fold) | รอ jcode ว่างจาก `SolarCarport.tsx` — จุดต่อเดียว |
| 2 | GLB pipeline จากงาน 47-ronin (`sirinx_solar_carport.glb` 52KB) — เสริมด้วย Draco/meshopt + KTX2 | คัดลอก asset + sha256 เข้า `client/public/assets/3d/` |
| 3 | 3D infographic รายจังหวัด: กราฟ irradiation 3 มิติจาก `provinceEnergyData` | ข้อมูลจริง = GEO citation bait |
| 4 | WebGPU renderer (three r186 มี WebGPURenderer) แบบ feature-detect + fallback | ยังไม่จำเป็นกับผู้ใช้ส่วนใหญ่ |
| 5 | Before/after carport visualization (เปลี่ยนสีพื้น/หลังคา) | ต้องมีภาพจริงที่ผ่านการตรวจสอบสิทธิ์แล้วเท่านั้น |

## 4. ข้อห้าม

- ห้ามใส่ภาพ/โมเดลที่ไม่มีสิทธิ์หรือ "แต่งขึ้น" เป็นผลงานจริง — 3D ใช้เป็น visualization อธิบายได้เท่านั้น
- ห้ามอ้างตัวเลขประหยัดจาก scene — ทุกตัวเลขต้องมาจาก `provinceEnergyData` (PVGIS) + ข้อความปฏิเสธ
- ทุก scene ต้องทำงานได้เมื่อ WebGL ล่ม (เนื้อหา HTML ต้องครบถ้วนโดยไม่มี 3D)
