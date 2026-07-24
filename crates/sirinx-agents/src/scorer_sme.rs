//! L2 SME-segment lead scorer — B4 Ronin roster expansion.
//!
//! [`SmeScorer`] (AgentId 18) mirrors [`crate::ronin::Junai`] but targets
//! the SME / shophouse / small-office segment: lower tickets than Junai's
//! factory/warehouse/hotel ICP, so the temperature thresholds are lower.
//! The output envelope is byte-shape compatible with Junai
//! (`{ "lead", "temperature", "roi" }` on a `lead-scored` event) so
//! [`crate::ronin::Kihei`] (L3) consumes it unchanged.

use serde_json::json;
use sirinx_core::{BusinessType, Lead};
use sirinx_roi::{estimate, RoiEstimate, RoiInput, UsageProfile};

use crate::agent::{Agent, AgentError, AgentInput, AgentOutput};
use crate::ronin::LeadTemperature;
use crate::roster::AgentId;

/// HOT threshold (THB/month bill). A Bangkok shophouse / small office
/// paying ≥30K THB/month has roughly 30+ kW of sensible solar capacity
/// (bill / 900 THB per kW in the ROI model) — a viable SME installation
/// ticket, well below Junai's 50K factory bar.
const HOT_BILL_THB: f64 = 30_000.0;

/// WARM threshold (THB/month bill). 12K THB/month is the typical upper
/// bill of a small shophouse with air-con; below that the system size
/// floor (1 kW) makes the ticket marginal, so it routes to nurture.
const WARM_BILL_THB: f64 = 12_000.0;

/// Pick the daytime usage profile from the declared business type.
/// `sirinx-roi` exposes Low/Medium/HighDaytime variants, so we map the
/// SME-relevant types instead of Junai's blanket MediumDaytime:
/// shops, showrooms and hotels trade through solar hours with heavy
/// air-con / refrigeration load → HighDaytime; offices, warehouses,
/// factories and anything unclassified stay at the conservative
/// MediumDaytime default.
fn usage_for(business_type: BusinessType) -> UsageProfile {
    match business_type {
        BusinessType::RetailStore | BusinessType::Showroom | BusinessType::Hotel => {
            UsageProfile::HighDaytime
        }
        BusinessType::Office
        | BusinessType::Warehouse
        | BusinessType::Factory
        | BusinessType::Other => UsageProfile::MediumDaytime,
    }
}

fn score(lead: &Lead) -> (LeadTemperature, Option<RoiEstimate>) {
    let roi = estimate(RoiInput {
        monthly_bill_thb: lead.draft.monthly_electric_bill,
        available_area_sqm: lead.draft.available_area_sqm,
        usage: usage_for(lead.draft.business_type),
    })
    .ok();

    let bill = lead.draft.monthly_electric_bill;
    // SME ICP: shophouses / small offices with bill ≥ 30K THB are hot.
    let temp = if bill >= HOT_BILL_THB {
        LeadTemperature::Hot
    } else if bill >= WARM_BILL_THB {
        LeadTemperature::Warm
    } else {
        LeadTemperature::Cold
    };
    (temp, roi)
}

/// L2 SME scorer — consumes a `lead-scanned` envelope (payload = Lead
/// JSON), runs the real ROI model, classifies temperature for the
/// SME segment, forwards a Junai-compatible `lead-scored` envelope.
pub struct SmeScorer;

impl Agent for SmeScorer {
    fn id(&self) -> AgentId {
        AgentId(18)
    }

    fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError> {
        let lead: Lead = serde_json::from_value(input.payload.clone())
            .map_err(|e| AgentError::BadPayload(e.to_string()))?;
        // PDPA: this scorer only reads the lead and forwards it unchanged.
        // Consent flags pass through as the L1 scanner set them
        // (`marketing_contact` stays false unless the source payload
        // carried an explicit opt-in); scoring never flips consent.
        let (temperature, roi) = score(&lead);
        let payload = json!({
            "lead": lead,
            "temperature": temperature,
            "roi": roi,
        });
        Ok(AgentOutput {
            summary: format!("SME lead {} scored {:?}", lead.id, temperature),
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
    use crate::ronin::{FollowUp, Kihei, Kuranosuke};
    use sirinx_core::{BusinessType, Consent, Interest, LeadDraft};

    fn sme_lead(business_type: BusinessType, bill: f64) -> Lead {
        Lead::from_draft(LeadDraft {
            business_type,
            monthly_electric_bill: bill,
            available_area_sqm: 120.0, // typical shophouse rooftop
            interest: vec![Interest::SolarRooftop],
            source: "sme-test".into(),
            consent: Consent {
                analytics: true,
                // No explicit opt-in in this synthetic payload → stays false.
                marketing_contact: false,
            },
        })
        .unwrap()
    }

    fn scored_payload(lead: &Lead) -> serde_json::Value {
        let out = SmeScorer
            .process(AgentInput {
                event: "lead-scanned".into(),
                payload: serde_json::to_value(lead).unwrap(),
            })
            .unwrap();
        assert_eq!(out.publish.as_ref().unwrap().event, "lead-scored");
        out.publish.unwrap().payload
    }

    #[test]
    fn happy_path_envelope_is_junai_compatible() {
        let payload = scored_payload(&sme_lead(BusinessType::RetailStore, 45_000.0));
        // Same three keys Junai emits.
        assert!(payload.get("lead").is_some());
        assert_eq!(payload["temperature"], "hot");
        // ROI came from the real model; retail maps to HighDaytime.
        assert!(payload["roi"]["estimatedKw"].as_f64().unwrap() > 0.0);
        assert!(payload["roi"]["savingHighThb"].as_f64().unwrap() > 0.0);
        // Consent flags survive the round trip untouched.
        assert_eq!(payload["lead"]["consent"]["marketingContact"], false);
    }

    #[test]
    fn thresholds_split_sme_bands() {
        let hot = scored_payload(&sme_lead(BusinessType::Office, 30_000.0));
        assert_eq!(hot["temperature"], "hot");
        let warm = scored_payload(&sme_lead(BusinessType::Office, 12_000.0));
        assert_eq!(warm["temperature"], "warm");
        let cold = scored_payload(&sme_lead(BusinessType::Other, 5_000.0));
        assert_eq!(cold["temperature"], "cold");
    }

    #[test]
    fn malformed_payload_returns_bad_payload() {
        let err = SmeScorer
            .process(AgentInput {
                event: "lead-scanned".into(),
                payload: json!({"not": "a lead"}),
            })
            .unwrap_err();
        assert!(matches!(err, AgentError::BadPayload(_)));
    }

    #[test]
    fn pipeline_compat_kuranosuke_to_sme_scorer_to_kihei() {
        // L1 Kuranosuke intake output feeds this scorer unchanged...
        let lead = sme_lead(BusinessType::Showroom, 60_000.0);
        let intake = Kuranosuke
            .process(AgentInput {
                event: "lead-created".into(),
                payload: serde_json::to_value(&lead).unwrap(),
            })
            .unwrap();
        let scored = SmeScorer.process(intake.publish.unwrap()).unwrap();
        // ...and L3 Kihei decides a follow-up from this scorer's envelope.
        let decided = Kihei.process(scored.publish.unwrap()).unwrap();
        let follow_up: FollowUp =
            serde_json::from_value(decided.publish.unwrap().payload["followUp"].clone()).unwrap();
        assert_eq!(follow_up, FollowUp::SiteSurveyProposal);
    }
}
