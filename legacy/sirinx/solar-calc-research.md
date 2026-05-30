# Solar Sizing Engineering Calculations — Thailand Context

## Key Parameters for Thailand
- Average solar irradiance: 1,875 kWh/m²/year (5.06 kWh/m²/day)
- Peak Sun Hours (PSH): 4-6 hours/day (avg ~4.5 for central Thailand)
- Regional PSH variations:
  - Bangkok/Central: ~4.2-4.5 h/day
  - Northeast (Isan): ~4.5-5.0 h/day
  - South: ~4.0-4.5 h/day
  - North: ~4.3-4.8 h/day

## Panel Specifications (2024-2026 standard)
- Standard panel: 540-580W (bifacial mono PERC/TOPCon)
- Panel dimensions: ~2.278m x 1.134m = ~2.58 m²
- Panel efficiency: 20-22%
- Area per kWp: ~4.5-5.0 m² (including spacing/walkways)
- Usable roof area: typically 60-70% of total roof area

## System Sizing Formulas

### 1. From electricity bill to recommended size
- Monthly consumption (kWh) = Monthly bill (THB) / electricity rate (THB/kWh)
- Thai electricity rates (2024-2026 approx):
  - Small business (TOU): ~4.0-4.5 THB/kWh
  - Large business (TOU): ~3.5-4.5 THB/kWh
  - Factory (TOU peak): ~5.0-5.5 THB/kWh
  - Factory (TOU off-peak): ~2.5-3.0 THB/kWh
- Average blended rate: ~4.0-4.5 THB/kWh

### 2. Recommended system size
- Annual consumption = Monthly consumption × 12
- Daytime consumption ratio: ~40-60% of total (depends on business type)
- Recommended kWp = (Annual daytime consumption) / (PSH × 365 × system_efficiency)
- System efficiency (performance ratio): 0.75-0.85 (includes inverter loss, cable loss, temperature loss, soiling, mismatch)

### 3. Roof area validation
- Required roof area = kWp × area_per_kWp (4.5-5.0 m²/kWp)
- Maximum kWp from roof = (Usable roof area) / area_per_kWp
- Usable roof area = Total roof area × usable_ratio (0.6-0.7)

### 4. Annual production estimate
- Annual production (kWh) = kWp × PSH × 365 × performance_ratio
- Example: 100 kWp × 4.5 × 365 × 0.80 = 131,400 kWh/year

### 5. Financial calculations
- Annual savings = Annual production × electricity_rate
- System cost = kWp × cost_per_kWp (THB 25,000-35,000/kWp for rooftop)
- Simple payback = System cost / Annual savings
- ROI = Annual savings / System cost × 100%

### 6. Degradation
- Year 1: 2% degradation
- Year 2-25: 0.5-0.7% per year
- 25-year production: ~85-90% of year-1 production

## Validation Rules
- If desired kWp > max kWp from roof → Flag: "พื้นที่หลังคาไม่เพียงพอ"
- If desired kWp production > total consumption → Flag: "ผลิตเกินความต้องการ (net metering ไม่คุ้ม)"
- If payback > 8 years → Flag: "ระยะคืนทุนนาน ควรพิจารณาเพิ่มเติม"
- If desired kWp < 30% of recommended → Flag: "ขนาดเล็กเกินไป อาจไม่คุ้มค่าการลงทุน"

## Business Type Profiles
- Factory: daytime ratio 70%, rate 4.2, cost/kWp 28,000
- Commercial building: daytime ratio 60%, rate 4.5, cost/kWp 30,000
- Hotel: daytime ratio 50%, rate 4.3, cost/kWp 32,000
- Agriculture: daytime ratio 80%, rate 3.8, cost/kWp 28,000
- Education: daytime ratio 65%, rate 4.0, cost/kWp 30,000
- Government: daytime ratio 60%, rate 4.0, cost/kWp 30,000
