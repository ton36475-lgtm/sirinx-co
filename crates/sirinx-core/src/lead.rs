use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::analytics::Consent;

/// Business categories accepted by the lead funnel.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BusinessType {
    RetailStore,
    Warehouse,
    Factory,
    Hotel,
    Showroom,
    Office,
    Other,
}

/// Solution modules a prospect can express interest in.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Interest {
    SolarRooftop,
    SolarCarport,
    Bess,
    EvCharging,
    AiEms,
}

/// Lifecycle of a lead inside the funnel. Transitions are linear with the
/// two terminal states reachable from any active state.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LeadStatus {
    New,
    Contacted,
    Qualified,
    ProposalSent,
    Won,
    Lost,
}

impl LeadStatus {
    /// Whether a transition from `self` to `next` is allowed.
    pub fn can_transition_to(self, next: LeadStatus) -> bool {
        use LeadStatus::*;
        match (self, next) {
            (Won, _) | (Lost, _) => false,
            (_, Won) | (_, Lost) => true,
            (New, Contacted) => true,
            (Contacted, Qualified) => true,
            (Qualified, ProposalSent) => true,
            _ => false,
        }
    }
}

/// Incoming lead payload, camelCase on the wire to match the landing spec.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LeadDraft {
    pub business_type: BusinessType,
    pub monthly_electric_bill: f64,
    pub available_area_sqm: f64,
    pub interest: Vec<Interest>,
    pub source: String,
    pub consent: Consent,
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum ValidationError {
    #[error("monthlyElectricBill must be greater than zero")]
    NonPositiveBill,
    #[error("availableAreaSqm must be greater than zero")]
    NonPositiveArea,
    #[error("interest must contain at least one module")]
    EmptyInterest,
    #[error("source must not be empty")]
    EmptySource,
    #[error("invalid status transition from {from:?} to {to:?}")]
    InvalidTransition { from: LeadStatus, to: LeadStatus },
}

impl LeadDraft {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.monthly_electric_bill <= 0.0 {
            return Err(ValidationError::NonPositiveBill);
        }
        if self.available_area_sqm <= 0.0 {
            return Err(ValidationError::NonPositiveArea);
        }
        if self.interest.is_empty() {
            return Err(ValidationError::EmptyInterest);
        }
        if self.source.trim().is_empty() {
            return Err(ValidationError::EmptySource);
        }
        Ok(())
    }
}

/// A persisted lead.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Lead {
    pub id: Uuid,
    pub status: LeadStatus,
    #[serde(flatten)]
    pub draft: LeadDraft,
}

impl Lead {
    /// Validate and promote a draft into a stored lead.
    pub fn from_draft(draft: LeadDraft) -> Result<Self, ValidationError> {
        draft.validate()?;
        Ok(Self {
            id: Uuid::new_v4(),
            status: LeadStatus::New,
            draft,
        })
    }

    pub fn transition(&mut self, next: LeadStatus) -> Result<(), ValidationError> {
        if !self.status.can_transition_to(next) {
            return Err(ValidationError::InvalidTransition {
                from: self.status,
                to: next,
            });
        }
        self.status = next;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn draft() -> LeadDraft {
        LeadDraft {
            business_type: BusinessType::RetailStore,
            monthly_electric_bill: 45_000.0,
            available_area_sqm: 300.0,
            interest: vec![Interest::SolarCarport, Interest::Bess, Interest::EvCharging],
            source: "thaimart_sirinx_landing".into(),
            consent: Consent {
                analytics: true,
                marketing_contact: false,
            },
        }
    }

    #[test]
    fn spec_payload_deserializes() {
        let json = r#"{
            "businessType": "retail_store",
            "monthlyElectricBill": 45000,
            "availableAreaSqm": 300,
            "interest": ["solar_carport", "bess", "ev_charging"],
            "source": "thaimart_sirinx_landing",
            "consent": { "analytics": true, "marketingContact": false }
        }"#;
        let parsed: LeadDraft = serde_json::from_str(json).expect("spec payload must parse");
        assert_eq!(parsed.business_type, BusinessType::RetailStore);
        assert_eq!(parsed.interest.len(), 3);
        assert!(parsed.consent.analytics);
        assert!(!parsed.consent.marketing_contact);
    }

    #[test]
    fn draft_validation_rejects_bad_input() {
        let mut d = draft();
        d.monthly_electric_bill = 0.0;
        assert_eq!(d.validate(), Err(ValidationError::NonPositiveBill));

        let mut d = draft();
        d.interest.clear();
        assert_eq!(d.validate(), Err(ValidationError::EmptyInterest));
    }

    #[test]
    fn status_transitions_are_enforced() {
        let mut lead = Lead::from_draft(draft()).unwrap();
        assert_eq!(lead.status, LeadStatus::New);
        lead.transition(LeadStatus::Contacted).unwrap();
        lead.transition(LeadStatus::Qualified).unwrap();
        lead.transition(LeadStatus::Won).unwrap();
        // Terminal state: nothing may follow.
        assert!(lead.transition(LeadStatus::Contacted).is_err());
    }

    #[test]
    fn skipping_stages_is_rejected() {
        let mut lead = Lead::from_draft(draft()).unwrap();
        let err = lead.transition(LeadStatus::ProposalSent).unwrap_err();
        assert!(matches!(err, ValidationError::InvalidTransition { .. }));
    }
}
