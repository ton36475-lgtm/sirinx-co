//! L2 24/7-operation lead scorer — B4 Ronin roster expansion.
//!
//! Segment: round-the-clock operations — hotels, hospitals, and factories
//! running night shifts. Night-heavy loads self-consume less daytime solar
//! generation, so this scorer applies a documented night-load adjustment to
//! Junai's thresholds before classifying temperature.
//!
//! Pipeline contract (identical to [`crate::ronin::Junai`]):
//! - consumes a `lead-scanned` envelope whose payload is a serialized
//!   [`sirinx_core::Lead`] (Kuranosuke's output shape), optionally wrapped as
//!   `{"lead": ..., "operations": "24h"}` to carry the explicit 24/7 hint;
//! - publishes `lead-scored` with payload
//!   `{ "lead": ..., "temperature": ..., "roi": ... }` reusing
//!   [`crate::ronin::LeadTemperature`], so [`crate::ronin::Kihei`] (L3)
//!   consumes it unchanged.

use serde_json::Value;

use sirinx_core::{BusinessType, Lead};
use sirinx_roi::{estimate, RoiEstimate, RoiInput, UsageProfile};

use crate::agent::{Agent, AgentError, AgentInput, AgentOutput};
use crate::ronin::LeadTemperature;
use crate::roster::AgentId;

/// Junai parity: hot-threshold monthly bill (THB) for a daytime-profile lead.
/// Mirrors `HOT_BILL_THB` in `crate::ronin` (private there, restated here).
const HOT_BILL_THB: f64 = 50_000.0;

/// Junai parity: warm-threshold monthly bill (THB) for a daytime-profile lead.
const WARM_BILL_THB: f64 = 20_000.0;

/// Night-load adjustment applied to Junai's thresholds for 24/7 sites.
/// Thai hotels, hospitals, and EEC night-shift factories burn most of their
/// load after sunset, when rooftop solar generates nothing; without battery
/// storage they self-consume materially less daytime generation. Applied as a
/// divisor so the qualification bar rises by 1 / 0.8 = 1.25x — the
/// conservative direction (we would rather under-promise than assume storage
/// the site does not have). Tunable once real 24/7 self-consumption data
/// lands from site surveys.
const NIGHT_FACTOR: f64 = 0.8;

/// Business types treated as round-the-clock by default.
/// - `Hotel`: Thai hotels run reception, cooling, and laundry 24/7 by nature.
/// - `Factory`: export manufacturing in the EEC (Rayong/Chonburi) commonly
///   runs 2-3 shifts; misclassifying a daytime-only factory only raises its
///   bar, which is the conservative failure direction.
///
/// Hospitals have no dedicated `BusinessType` variant — they arrive as
/// `other` and are covered by the explicit hint below.
const ROUND_THE_CLOCK_TYPES: &[BusinessType] = &[BusinessType::Hotel, BusinessType::Factory];

/// Accepted value of the optional `"operations"` payload hint that marks any
/// lead as round-the-clock regardless of business type.
const OPERATIONS_HINT_24H: &str = "24h";

/// L2 RoundTheClock — scoring for 24/7-operation leads with night-load
/// adjustment. Pure function: no I/O, no network, no clocks.
pub struct RoundTheClockScorer;

/// 24/7 detection rules (first match wins):
/// 1. Explicit hint: envelope payload carries `"operations": "24h"` — covers
///    hospitals and any site whose source knows its shift pattern.
/// 2. Business type: `business_type` is in [`ROUND_THE_CLOCK_TYPES`].
fn is_round_the_clock(lead: &Lead, operations_hint: Option<&str>) -> bool {
    matches!(operations_hint, Some(OPERATIONS_HINT_24H))
        || ROUND_THE_CLOCK_TYPES.contains(&lead.draft.business_type)
}

/// Accept both the raw `lead-scanned` payload (a serialized `Lead`, byte-shape
/// compatible with Kuranosuke's output) and the hint envelope
/// `{"lead": <Lead>, "operations": "24h"}`.
fn parse_input(payload: &Value) -> Result<(Lead, Option<String>), AgentError> {
    if payload.get("lead").is_some() {
        let lead: Lead = serde_json::from_value(payload["lead"].clone())
            .map_err(|e| AgentError::BadPayload(e.to_string()))?;
        let hint = payload
            .get("operations")
            .and_then(Value::as_str)
            .map(str::to_owned);
        Ok((lead, hint))
    } else {
        let lead: Lead = serde_json::from_value(payload.clone())
            .map_err(|e| AgentError::BadPayload(e.to_string()))?;
        Ok((lead, None))
    }
}

fn score(lead: &Lead, round_the_clock: bool) -> (LeadTemperature, Option<RoiEstimate>) {
    // sirinx-roi has no true night-shift profile; for 24/7 sites the closest
    // available variant is LowDaytime (daytime factor 0.45), which best
    // approximates a load curve weighted away from daylight hours. Daytime
    // leads keep Junai's MediumDaytime default.
    let usage = if round_the_clock {
        UsageProfile::LowDaytime
    } else {
        UsageProfile::MediumDaytime
    };
    let roi = estimate(RoiInput {
        monthly_bill_thb: lead.draft.monthly_electric_bill,
        available_area_sqm: lead.draft.available_area_sqm,
        usage,
    })
    .ok();

    // NIGHT_FACTOR applied to Junai's thresholds as a divisor: the 24/7 bar
    // rises 1.25x (HOT 50k -> 62.5k, WARM 20k -> 25k THB/month).
    let (hot, warm) = if round_the_clock {
        (HOT_BILL_THB / NIGHT_FACTOR, WARM_BILL_THB / NIGHT_FACTOR)
    } else {
        (HOT_BILL_THB, WARM_BILL_THB)
    };
    let bill = lead.draft.monthly_electric_bill;
    let temp = if bill >= hot {
        LeadTemperature::Hot
    } else if bill >= warm {
        LeadTemperature::Warm
    } else {
        LeadTemperature::Cold
    };
    (temp, roi)
}

impl Agent for RoundTheClockScorer {
    fn id(&self) -> AgentId {
        AgentId(19)
    }

    fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError> {
        let (lead, hint) = parse_input(&input.payload)?;
        let round_the_clock = is_round_the_clock(&lead, hint.as_deref());
        let (temperature, roi) = score(&lead, round_the_clock);

        // PDPA: strict pass-through. Consent is owned by the L1 scanner / lead
        // source and this scorer never mutates it — `marketing_contact` stays
        // whatever the source set (false unless the source payload carried an
        // explicit opt-in).
        let payload = serde_json::json!({
            "lead": lead,
            "temperature": temperature,
            "roi": roi,
            "roundTheClock": round_the_clock,
        });
        Ok(AgentOutput {
            summary: format!(
                "lead {} scored {:?} (24/7 segment: {round_the_clock})",
                lead.id, temperature
            ),
            publish: Some(AgentInput {
                event: "lead-scored".into(),
                payload,
            }),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sirinx_core::{Consent, Interest, LeadDraft};

    fn lead(business_type: BusinessType, bill: f64) -> Lead {
        Lead::from_draft(LeadDraft {
            business_type,
            monthly_electric_bill: bill,
            available_area_sqm: 800.0,
            interest: vec![Interest::SolarRooftop],
            source: "round-the-clock-test".into(),
            // PDPA default: no marketing opt-in carried by the source.
            consent: Consent {
                analytics: true,
                marketing_contact: false,
            },
        })
        .unwrap()
    }

    fn scored_payload(lead: &Lead) -> Value {
        let out = RoundTheClockScorer
            .process(AgentInput {
                event: "lead-scanned".into(),
                payload: serde_json::to_value(lead).unwrap(),
            })
            .unwrap();
        let publish = out.publish.expect("L2 always forwards");
        assert_eq!(publish.event, "lead-scored");
        publish.payload
    }

    #[test]
    fn hotel_lead_scores_at_night_adjusted_thresholds() {
        // 45k THB/month hotel: above Junai's warm bar (20k) but below the
        // night-adjusted hot bar (62.5k) -> warm, not hot.
        let payload = scored_payload(&lead(BusinessType::Hotel, 45_000.0));
        assert_eq!(payload["temperature"], "warm");
        assert_eq!(payload["roundTheClock"], true);
        assert!(payload["lead"]["id"].is_string());
        // ROI from the real model on the LowDaytime profile:
        // savingLow = round(45_000 * 0.45 * 0.28) = 5_670.
        assert_eq!(payload["roi"]["savingLowThb"], 5_670.0);
        assert!(payload["roi"]["estimatedKw"].as_f64().unwrap() > 0.0);
    }

    #[test]
    fn daytime_lead_keeps_junai_thresholds() {
        // 55k THB/month retail store: not a 24/7 type -> Junai's 50k hot bar.
        let payload = scored_payload(&lead(BusinessType::RetailStore, 55_000.0));
        assert_eq!(payload["temperature"], "hot");
        assert_eq!(payload["roundTheClock"], false);
        // Junai's MediumDaytime profile: round(55_000 * 0.62 * 0.28) = 9_548.
        assert_eq!(payload["roi"]["savingLowThb"], 9_548.0);
    }

    #[test]
    fn explicit_operations_hint_marks_any_type_round_the_clock() {
        // Hospital-like lead: `other` type + explicit "24h" hint (e.g. 55k
        // bill) clears Junai's hot bar but not the night-adjusted 62.5k bar.
        let envelope = serde_json::json!({
            "lead": lead(BusinessType::Other, 55_000.0),
            "operations": "24h",
        });
        let out = RoundTheClockScorer
            .process(AgentInput {
                event: "lead-scanned".into(),
                payload: envelope,
            })
            .unwrap();
        let payload = out.publish.unwrap().payload;
        assert_eq!(payload["roundTheClock"], true);
        assert_eq!(payload["temperature"], "warm");
    }

    #[test]
    fn malformed_payload_is_rejected() {
        let err = RoundTheClockScorer
            .process(AgentInput {
                event: "lead-scanned".into(),
                payload: serde_json::json!({ "unexpected": true }),
            })
            .unwrap_err();
        assert!(matches!(err, AgentError::BadPayload(_)));

        let err = RoundTheClockScorer
            .process(AgentInput {
                event: "lead-scanned".into(),
                payload: serde_json::json!({ "lead": "not-a-lead" }),
            })
            .unwrap_err();
        assert!(matches!(err, AgentError::BadPayload(_)));
    }

    #[test]
    fn pipeline_compat_kuranosuke_to_scorer_to_kihei() {
        // Kuranosuke (L1) output feeds this scorer unchanged...
        let intake = crate::ronin::Kuranosuke
            .process(AgentInput {
                event: "lead-created".into(),
                payload: serde_json::to_value(lead(BusinessType::Factory, 130_000.0)).unwrap(),
            })
            .unwrap();
        let scored = RoundTheClockScorer
            .process(intake.publish.expect("L1 always forwards"))
            .unwrap();
        // ...and this scorer's output feeds Kihei (L3) unchanged.
        let decided = crate::ronin::Kihei
            .process(scored.publish.expect("L2 always forwards"))
            .unwrap();
        let payload = decided.publish.expect("L3 always forwards").payload;
        // 130k clears the night-adjusted hot bar (62.5k) -> site survey.
        assert_eq!(payload["temperature"], "hot");
        assert_eq!(payload["followUp"], "site_survey_proposal");
    }
}
