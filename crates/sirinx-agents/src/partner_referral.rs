//! L1 partner-referral lead scanner — B4 Ronin roster expansion.
//!
//! Trusted-channel intake: a partner (e.g. the Thaimart network) refers
//! a site owner directly, so payloads are expected to be complete and
//! well-formed. The scanner validates strictly, guesses nothing,
//! normalizes the referral into a [`sirinx_core::Lead`], and forwards
//! the same `lead-scanned` envelope shape as
//! [`crate::ronin::Kuranosuke`] so any L2 scorer can consume it
//! unchanged.

use sirinx_core::{BusinessType, Consent, Interest, Lead, LeadDraft};

use crate::agent::{Agent, AgentError, AgentInput, AgentOutput};
use crate::roster::AgentId;

/// Channel label stored in `LeadDraft.source`. Partners come and go;
/// the funnel channel does not, so downstream reporting can group all
/// referral leads under one stable name.
const SOURCE: &str = "partner_referral";

/// Snake_case names accepted for `site.business_type`, mirroring
/// [`sirinx_core::BusinessType`]. Listed explicitly so the strict-mode
/// rejection tells the partner integrator exactly what to send.
const ACCEPTED_BUSINESS_TYPES: &[&str] = &[
    "retail_store",
    "warehouse",
    "factory",
    "hotel",
    "showroom",
    "office",
    "other",
];

/// Referrals arriving through the Thai partner channel are rooftop
/// solar prospects by default — monthly bill and roof area are the two
/// numbers partners collect up front. Other modules (carport, BESS, EV
/// charging) are attached after the site survey, never guessed here.
const DEFAULT_INTEREST: Interest = Interest::SolarRooftop;

/// L1 — validate a partner referral and normalize it into a [`Lead`].
pub struct PartnerReferralScanner;

impl Agent for PartnerReferralScanner {
    fn id(&self) -> AgentId {
        AgentId(4)
    }

    fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError> {
        let p = &input.payload;

        // Trusted channel, strict shape: partner_code identifies the
        // referring partner and must be present and non-empty.
        let partner_code = p["partner_code"]
            .as_str()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .ok_or_else(|| {
                AgentError::BadPayload(
                    "partner_code is required and must be a non-empty string".into(),
                )
            })?;

        // Contact is validated (name required, phone optional) but the
        // PII is NOT forwarded: the Lead funnel carries no contact
        // fields, so PDPA data minimization keeps name/phone at the
        // edge. Downstream agents never see them.
        let contact = &p["contact"];
        let has_name = contact["name"]
            .as_str()
            .map(str::trim)
            .is_some_and(|s| !s.is_empty());
        if !has_name {
            return Err(AgentError::BadPayload(
                "contact.name is required and must be a non-empty string".into(),
            ));
        }
        let phone_ok = match contact.get("phone") {
            None => true,
            Some(phone) => phone.as_str().map(str::trim).is_some_and(|s| !s.is_empty()),
        };
        if !phone_ok {
            return Err(AgentError::BadPayload(
                "contact.phone must be a non-empty string when present".into(),
            ));
        }

        let site = &p["site"];
        let business_type_raw = site["business_type"].as_str().ok_or_else(|| {
            AgentError::BadPayload(format!(
                "site.business_type must be a snake_case string; accepted values: {}",
                ACCEPTED_BUSINESS_TYPES.join(", ")
            ))
        })?;
        let business_type: BusinessType =
            serde_json::from_value(serde_json::Value::String(business_type_raw.to_owned()))
                .map_err(|_| {
                    AgentError::BadPayload(format!(
                        "unknown site.business_type {business_type_raw:?}; accepted values: {}",
                        ACCEPTED_BUSINESS_TYPES.join(", ")
                    ))
                })?;
        let monthly_bill = site["monthly_electric_bill"].as_f64().ok_or_else(|| {
            AgentError::BadPayload(
                "site.monthly_electric_bill is required and must be a number".into(),
            )
        })?;
        let area = site["available_area_sqm"].as_f64().ok_or_else(|| {
            AgentError::BadPayload(
                "site.available_area_sqm is required and must be a number".into(),
            )
        })?;

        // note: optional free text for the sales team. Type-checked but
        // not forwarded — Lead carries no free-text field.
        if p.get("note").is_some_and(|n| !n.is_string()) {
            return Err(AgentError::BadPayload(
                "note must be a string when present".into(),
            ));
        }

        // PDPA: marketing contact is opt-in only. The explicit boolean
        // `consent_marketing` is the single source of truth; absent
        // means false, and a non-boolean value is rejected outright —
        // on a trusted channel, malformed consent is a contract breach,
        // never something to guess. Analytics is granted by the
        // referral act itself (the prospect asked the partner to make
        // the introduction), the operational minimum for funnel
        // tracking.
        let marketing_contact = match p.get("consent_marketing") {
            None => false,
            Some(v) => v.as_bool().ok_or_else(|| {
                AgentError::BadPayload("consent_marketing must be a boolean when present".into())
            })?,
        };

        let draft = LeadDraft {
            business_type,
            monthly_electric_bill: monthly_bill,
            available_area_sqm: area,
            interest: vec![DEFAULT_INTEREST],
            source: SOURCE.into(),
            consent: Consent {
                analytics: true,
                marketing_contact,
            },
        };
        // Lead::from_draft re-checks bill/area positivity; surface its
        // verdict as BadPayload so the strict contract has one voice.
        let lead = Lead::from_draft(draft).map_err(|e| AgentError::BadPayload(e.to_string()))?;

        let payload =
            serde_json::to_value(&lead).map_err(|e| AgentError::BadPayload(e.to_string()))?;
        Ok(AgentOutput {
            summary: format!(
                "lead {} scanned from {SOURCE} (partner {partner_code})",
                lead.id
            ),
            publish: Some(AgentInput {
                event: "lead-scanned".into(),
                payload,
            }),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn payload() -> serde_json::Value {
        json!({
            "partner_code": "THAIMART-001",
            "contact": { "name": "Somchai Jaidee", "phone": "0812345678" },
            "site": {
                "business_type": "factory",
                "monthly_electric_bill": 120_000,
                "available_area_sqm": 800
            },
            "note": "owner asked for a callback after 6pm",
            "consent_marketing": true
        })
    }

    fn scan(p: serde_json::Value) -> Result<AgentOutput, AgentError> {
        PartnerReferralScanner.process(AgentInput {
            event: "partner-referral-received".into(),
            payload: p,
        })
    }

    #[test]
    fn happy_path_normalizes_referral_into_lead_envelope() {
        let out = scan(payload()).unwrap();
        assert!(out.summary.contains("partner THAIMART-001"));

        let publish = out.publish.expect("L1 always forwards");
        assert_eq!(publish.event, "lead-scanned");

        let lead: Lead = serde_json::from_value(publish.payload).unwrap();
        assert_eq!(lead.draft.source, SOURCE);
        assert_eq!(lead.draft.business_type, BusinessType::Factory);
        assert_eq!(lead.draft.monthly_electric_bill, 120_000.0);
        assert_eq!(lead.draft.available_area_sqm, 800.0);
        assert_eq!(lead.draft.interest, vec![Interest::SolarRooftop]);
        assert!(lead.draft.consent.analytics);
        assert!(lead.draft.consent.marketing_contact);
    }

    #[test]
    fn missing_or_empty_partner_code_is_rejected() {
        let mut p = payload();
        p["partner_code"] = json!("   ");
        assert!(matches!(scan(p), Err(AgentError::BadPayload(_))));

        let mut p = payload();
        p.as_object_mut().unwrap().remove("partner_code");
        assert!(matches!(scan(p), Err(AgentError::BadPayload(_))));
    }

    #[test]
    fn unknown_business_type_lists_accepted_values() {
        let mut p = payload();
        p["site"]["business_type"] = json!("spaceship");
        match scan(p).unwrap_err() {
            AgentError::BadPayload(msg) => {
                assert!(msg.contains("spaceship"));
                for v in ACCEPTED_BUSINESS_TYPES {
                    assert!(msg.contains(v), "error must list {v}");
                }
            }
            other => panic!("expected BadPayload, got {other:?}"),
        }
    }

    #[test]
    fn marketing_consent_defaults_false_and_rejects_non_boolean() {
        // Absent flag → no marketing contact (PDPA opt-in only).
        let mut p = payload();
        p.as_object_mut().unwrap().remove("consent_marketing");
        let out = scan(p).unwrap();
        let lead: Lead = serde_json::from_value(out.publish.unwrap().payload).unwrap();
        assert!(!lead.draft.consent.marketing_contact);

        // Non-boolean flag → strict rejection, never a guess.
        let mut p = payload();
        p["consent_marketing"] = json!("yes");
        assert!(matches!(scan(p), Err(AgentError::BadPayload(_))));
    }

    #[test]
    fn malformed_contact_or_site_is_rejected() {
        let mut p = payload();
        p["contact"]["name"] = json!("  ");
        assert!(matches!(scan(p), Err(AgentError::BadPayload(_))));

        let mut p = payload();
        p["contact"]["phone"] = json!(123);
        assert!(matches!(scan(p), Err(AgentError::BadPayload(_))));

        // from_draft backstop: non-positive bill fails validation.
        let mut p = payload();
        p["site"]["monthly_electric_bill"] = json!(0);
        assert!(matches!(scan(p), Err(AgentError::BadPayload(_))));

        let mut p = payload();
        p.as_object_mut().unwrap().remove("site");
        assert!(matches!(scan(p), Err(AgentError::BadPayload(_))));
    }

    #[test]
    fn output_feeds_junai_l2_scorer_unchanged() {
        // Pipeline compatibility: the envelope must be byte-shape
        // compatible with Kuranosuke's, so Junai scores it as-is.
        let publish = scan(payload()).unwrap().publish.unwrap();
        let scored = crate::ronin::Junai
            .process(publish)
            .expect("Junai must score the referral envelope");
        let scored_publish = scored.publish.expect("L2 always forwards");
        assert_eq!(scored_publish.event, "lead-scored");
        // 120k THB factory bill → hot, with a real ROI estimate.
        assert_eq!(scored_publish.payload["temperature"], json!("hot"));
        assert!(
            scored_publish.payload["roi"]["estimatedKw"]
                .as_f64()
                .unwrap()
                > 0.0
        );
    }
}
