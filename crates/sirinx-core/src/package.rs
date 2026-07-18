use serde::{Deserialize, Serialize};

/// A sellable energy package surfaced by `GET /api/packages`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnergyPackage {
    pub slug: &'static str,
    pub name_th: &'static str,
    pub name_en: &'static str,
    pub summary_th: &'static str,
}

/// The four solution modules shown on the Thaimart x SIRINX landing page.
pub fn default_packages() -> Vec<EnergyPackage> {
    vec![
        EnergyPackage {
            slug: "solar-retail",
            name_th: "โซลาร์สำหรับร้านค้า",
            name_en: "Solar for Retail",
            summary_th: "Solar Rooftop / Solar Carport สำหรับร้านค้า โชว์รูม คลังสินค้า และพื้นที่จอดรถ",
        },
        EnergyPackage {
            slug: "bess-ready",
            name_th: "ระบบกักเก็บพลังงาน",
            name_en: "BESS Ready",
            summary_th: "ระบบกักเก็บพลังงานสำหรับธุรกิจที่ต้องการเสถียรภาพและบริหารโหลดไฟ",
        },
        EnergyPackage {
            slug: "ev-charging",
            name_th: "จุดชาร์จรถยนต์ไฟฟ้า",
            name_en: "EV Charging",
            summary_th: "เพิ่มจุดชาร์จ EV สำหรับลูกค้า พนักงาน fleet และจุดบริการพลังงานสะอาด",
        },
        EnergyPackage {
            slug: "ai-ems",
            name_th: "ระบบบริหารพลังงานอัจฉริยะ",
            name_en: "AI EMS",
            summary_th: "วิเคราะห์ค่าไฟ โหลดไฟ ช่วงเวลาการใช้พลังงาน และ ROI เบื้องต้น",
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn four_default_packages() {
        let packages = default_packages();
        assert_eq!(packages.len(), 4);
        assert!(packages.iter().any(|p| p.slug == "ai-ems"));
    }
}
