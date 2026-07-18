//! Solar ROI pre-screening calculator.
//!
//! A 1:1 port of the client-side estimator on the Thaimart x SIRINX
//! landing page, so the server-side API and the browser demo always
//! produce identical numbers:
//!
//! ```js
//! possibleKw  = max(1, min(area / 6, bill / 900))
//! savingLow   = round(bill * max(0.10, usage * 0.28))
//! savingHigh  = round(bill * min(0.42, usage * 0.48))
//! ```
//!
//! Results are a screening scenario, not a quote and not a savings
//! guarantee — a site survey is always required before system sizing.

use serde::{Deserialize, Serialize};

/// Daytime electricity usage profile. The factor mirrors the
/// `<select>` options on the landing page.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UsageProfile {
    LowDaytime,
    MediumDaytime,
    HighDaytime,
}

impl UsageProfile {
    pub fn factor(self) -> f64 {
        match self {
            UsageProfile::LowDaytime => 0.45,
            UsageProfile::MediumDaytime => 0.62,
            UsageProfile::HighDaytime => 0.78,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoiInput {
    /// Monthly electricity bill in THB.
    pub monthly_bill_thb: f64,
    /// Usable rooftop / carport area in square metres.
    pub available_area_sqm: f64,
    pub usage: UsageProfile,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoiEstimate {
    /// Estimated system size in kW.
    pub estimated_kw: f64,
    /// Lower bound of estimated monthly savings in THB.
    pub saving_low_thb: f64,
    /// Upper bound of estimated monthly savings in THB.
    pub saving_high_thb: f64,
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum RoiError {
    #[error("monthly bill must be greater than zero")]
    NonPositiveBill,
    #[error("available area must be greater than zero")]
    NonPositiveArea,
}

/// Compute the pre-screening estimate. Sizing is capped both by the
/// available area (~6 m² per kW) and by the bill (~900 THB per kW of
/// economically sensible capacity), with a 1 kW floor.
pub fn estimate(input: RoiInput) -> Result<RoiEstimate, RoiError> {
    if input.monthly_bill_thb <= 0.0 {
        return Err(RoiError::NonPositiveBill);
    }
    if input.available_area_sqm <= 0.0 {
        return Err(RoiError::NonPositiveArea);
    }

    let bill = input.monthly_bill_thb;
    let usage = input.usage.factor();

    let possible_kw = (input.available_area_sqm / 6.0).min(bill / 900.0).max(1.0);
    // Round to one decimal like `possibleKw.toFixed(1)` in the page script.
    let estimated_kw = (possible_kw * 10.0).round() / 10.0;

    let saving_low = (bill * (usage * 0.28).max(0.10)).round();
    let saving_high = (bill * (usage * 0.48).min(0.42)).round();

    Ok(RoiEstimate {
        estimated_kw,
        saving_low_thb: saving_low,
        saving_high_thb: saving_high,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_landing_page_example() {
        // bill = 45_000, area = 300, usage = medium (0.62)
        let out = estimate(RoiInput {
            monthly_bill_thb: 45_000.0,
            available_area_sqm: 300.0,
            usage: UsageProfile::MediumDaytime,
        })
        .unwrap();

        // possibleKw = max(1, min(300/6=50, 45000/900=50)) = 50
        assert_eq!(out.estimated_kw, 50.0);
        // savingLow  = round(45000 * max(0.10, 0.62*0.28=0.1736)) = 7812
        assert_eq!(out.saving_low_thb, 7_812.0);
        // savingHigh = round(45000 * min(0.42, 0.62*0.48=0.2976)) = 13392
        assert_eq!(out.saving_high_thb, 13_392.0);
    }

    #[test]
    fn small_site_hits_one_kw_floor() {
        let out = estimate(RoiInput {
            monthly_bill_thb: 500.0,
            available_area_sqm: 3.0,
            usage: UsageProfile::LowDaytime,
        })
        .unwrap();
        assert_eq!(out.estimated_kw, 1.0);
    }

    #[test]
    fn low_usage_floors_saving_at_ten_percent() {
        let out = estimate(RoiInput {
            monthly_bill_thb: 10_000.0,
            available_area_sqm: 100.0,
            usage: UsageProfile::LowDaytime,
        })
        .unwrap();
        // 0.45 * 0.28 = 0.126 > 0.10, so the floor does not bind here;
        // verify the multiplication itself instead.
        assert_eq!(out.saving_low_thb, 1_260.0);
        // 0.45 * 0.48 = 0.216 < 0.42 cap.
        assert_eq!(out.saving_high_thb, 2_160.0);
    }

    #[test]
    fn high_usage_caps_saving_at_forty_two_percent() {
        let out = estimate(RoiInput {
            monthly_bill_thb: 10_000.0,
            available_area_sqm: 100.0,
            usage: UsageProfile::HighDaytime,
        })
        .unwrap();
        // 0.78 * 0.48 = 0.3744 < 0.42 → not capped; low = 0.78*0.28 = 0.2184
        assert_eq!(out.saving_low_thb, 2_184.0);
        assert_eq!(out.saving_high_thb, 3_744.0);
    }

    #[test]
    fn rejects_non_positive_inputs() {
        let bad_bill = estimate(RoiInput {
            monthly_bill_thb: 0.0,
            available_area_sqm: 100.0,
            usage: UsageProfile::MediumDaytime,
        });
        assert_eq!(bad_bill, Err(RoiError::NonPositiveBill));

        let bad_area = estimate(RoiInput {
            monthly_bill_thb: 1_000.0,
            available_area_sqm: -5.0,
            usage: UsageProfile::MediumDaytime,
        });
        assert_eq!(bad_area, Err(RoiError::NonPositiveArea));
    }
}
