//! First production Ronin implementations: the lead pipeline.
//!
//! ```text
//! lead-created ─▶ Kuranosuke(01,L1) ─▶ Jūnai(17,L2) ─▶ Kihei(26,L3) ─▶ Gengo(36,L4)
//!                 intake/normalize     ROI scoring     follow-up       work order
//! ```
//!
//! Each agent is pure (no I/O): the caller feeds the L4 output into the
//! shared pending-work queue. Layer discipline is still enforced by the
//! [`crate::Dispatcher`]; [`run_lead_pipeline`] is the convenience path
//! that runs the four stages in order and returns the work order.

use serde::{Deserialize, Serialize};

use sirinx_core::{Lead, PendingWork};
use sirinx_roi::{estimate, RoiEstimate, RoiInput, UsageProfile};

use crate::agent::{Agent, AgentError, AgentInput, AgentOutput};
use crate::roster::AgentId;

/// Lead temperature decided by L2 scoring.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LeadTemperature {
    Hot,
    Warm,
    Cold,
}

/// Follow-up action decided by L3.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FollowUp {
    SiteSurveyProposal,
    NurtureCall,
    DripCampaign,
}

/// L1 Kuranosuke — intake: validate shape, strip noise, forward.
pub struct Kuranosuke;

impl Agent for Kuranosuke {
    fn id(&self) -> AgentId {
        AgentId(1)
    }

    fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError> {
        let lead: Lead = serde_json::from_value(input.payload.clone())
            .map_err(|e| AgentError::BadPayload(e.to_string()))?;
        Ok(AgentOutput {
            summary: format!("lead {} scanned from {}", lead.id, lead.draft.source),
            publish: Some(AgentInput {
                event: "lead-scanned".into(),
                payload: input.payload,
            }),
        })
    }
}

/// L2 Jūnai — scoring: run the ROI model, classify temperature.
pub struct Junai;

/// Scoring thresholds (THB/month bill).
const HOT_BILL_THB: f64 = 50_000.0;
const WARM_BILL_THB: f64 = 20_000.0;

fn score(lead: &Lead) -> (LeadTemperature, Option<RoiEstimate>) {
    let roi = estimate(RoiInput {
        monthly_bill_thb: lead.draft.monthly_electric_bill,
        available_area_sqm: lead.draft.available_area_sqm,
        usage: UsageProfile::MediumDaytime,
    })
    .ok();

    let bill = lead.draft.monthly_electric_bill;
    // ICP: factories/warehouses/hotels with bill > 50K THB are hot.
    let temp = if bill >= HOT_BILL_THB {
        LeadTemperature::Hot
    } else if bill >= WARM_BILL_THB {
        LeadTemperature::Warm
    } else {
        LeadTemperature::Cold
    };
    (temp, roi)
}

impl Agent for Junai {
    fn id(&self) -> AgentId {
        AgentId(17)
    }

    fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError> {
        let lead: Lead = serde_json::from_value(input.payload.clone())
            .map_err(|e| AgentError::BadPayload(e.to_string()))?;
        let (temperature, roi) = score(&lead);
        let payload = serde_json::json!({
            "lead": lead,
            "temperature": temperature,
            "roi": roi,
        });
        Ok(AgentOutput {
            summary: format!("lead {} scored {:?}", lead.id, temperature),
            publish: Some(AgentInput {
                event: "lead-scored".into(),
                payload,
            }),
        })
    }
}

/// L3 Kihei — decision: pick the follow-up per temperature.
pub struct Kihei;

fn decide(temperature: LeadTemperature) -> FollowUp {
    match temperature {
        LeadTemperature::Hot => FollowUp::SiteSurveyProposal,
        LeadTemperature::Warm => FollowUp::NurtureCall,
        LeadTemperature::Cold => FollowUp::DripCampaign,
    }
}

impl Agent for Kihei {
    fn id(&self) -> AgentId {
        AgentId(26)
    }

    fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError> {
        let temperature: LeadTemperature =
            serde_json::from_value(input.payload["temperature"].clone())
                .map_err(|e| AgentError::BadPayload(e.to_string()))?;
        let follow_up = decide(temperature);
        let mut payload = input.payload.clone();
        payload["followUp"] = serde_json::to_value(follow_up).expect("enum serializes");
        Ok(AgentOutput {
            summary: format!("decided {follow_up:?} for {temperature:?} lead"),
            publish: Some(AgentInput {
                event: "follow-up-decided".into(),
                payload,
            }),
        })
    }
}

/// L4 Gengo — coordination: turn the decision into a work order for the
/// shared queue. Execution (queue insert, messaging) stays with the
/// caller and behind the usual gates.
pub struct Gengo;

impl Agent for Gengo {
    fn id(&self) -> AgentId {
        AgentId(36)
    }

    fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError> {
        let lead: Lead = serde_json::from_value(input.payload["lead"].clone())
            .map_err(|e| AgentError::BadPayload(e.to_string()))?;
        let follow_up: FollowUp = serde_json::from_value(input.payload["followUp"].clone())
            .map_err(|e| AgentError::BadPayload(e.to_string()))?;
        Ok(AgentOutput {
            summary: format!("work order: {follow_up:?} for lead {}", lead.id),
            publish: None,
        })
    }
}

/// Run the whole pipeline for one lead and build the pending-work item
/// the caller should enqueue. Pure function: no I/O, no side effects.
pub fn run_lead_pipeline(lead: &Lead) -> Result<PendingWork, AgentError> {
    let intake = Kuranosuke.process(AgentInput {
        event: "lead-created".into(),
        payload: serde_json::to_value(lead).map_err(|e| AgentError::BadPayload(e.to_string()))?,
    })?;
    let scored = Junai.process(intake.publish.expect("L1 always forwards"))?;
    let decided = Kihei.process(scored.publish.expect("L2 always forwards"))?;
    let payload = decided.publish.expect("L3 always forwards").payload;
    let order = Gengo.process(AgentInput {
        event: "follow-up-decided".into(),
        payload: payload.clone(),
    })?;

    Ok(PendingWork::new(
        "agent:gengo-36",
        order.summary,
        serde_json::json!({
            "leadId": lead.id,
            "temperature": payload["temperature"],
            "followUp": payload["followUp"],
            "roi": payload["roi"],
        }),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use sirinx_core::{BusinessType, Consent, Interest, LeadDraft};

    fn lead(bill: f64) -> Lead {
        Lead::from_draft(LeadDraft {
            business_type: BusinessType::Factory,
            monthly_electric_bill: bill,
            available_area_sqm: 800.0,
            interest: vec![Interest::SolarRooftop],
            source: "pipeline-test".into(),
            consent: Consent {
                analytics: true,
                marketing_contact: true,
            },
        })
        .unwrap()
    }

    #[test]
    fn hot_lead_gets_site_survey_proposal() {
        let work = run_lead_pipeline(&lead(120_000.0)).unwrap();
        assert_eq!(work.source, "agent:gengo-36");
        assert_eq!(work.detail["followUp"], "site_survey_proposal");
        assert_eq!(work.detail["temperature"], "hot");
        // ROI came from the real model.
        assert!(work.detail["roi"]["estimatedKw"].as_f64().unwrap() > 0.0);
    }

    #[test]
    fn warm_and_cold_leads_route_correctly() {
        let warm = run_lead_pipeline(&lead(30_000.0)).unwrap();
        assert_eq!(warm.detail["followUp"], "nurture_call");

        let cold = run_lead_pipeline(&lead(8_000.0)).unwrap();
        assert_eq!(cold.detail["followUp"], "drip_campaign");
    }

    #[test]
    fn pipeline_respects_layer_order_via_dispatcher() {
        // The same agents registered on the dispatcher still obey
        // layer routing (L1 output reaches L2, never skips).
        let mut dispatcher = crate::Dispatcher::new();
        dispatcher.register(Box::new(Kuranosuke));
        dispatcher.register(Box::new(Junai));
        let outputs = dispatcher
            .run(
                AgentId(1),
                AgentInput {
                    event: "lead-created".into(),
                    payload: serde_json::to_value(lead(60_000.0)).unwrap(),
                },
            )
            .unwrap();
        assert_eq!(outputs.len(), 2);
        assert!(outputs[1].summary.contains("scored Hot"));
    }
}
