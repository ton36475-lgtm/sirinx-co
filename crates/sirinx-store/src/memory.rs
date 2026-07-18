use std::collections::HashMap;
use std::sync::RwLock;

use async_trait::async_trait;
use uuid::Uuid;

use sirinx_core::{AnalyticsEvent, Lead, LeadStatus};

use crate::{Store, StoreError};

/// In-memory backend for tests and local development.
#[derive(Default)]
pub struct MemoryStore {
    leads: RwLock<HashMap<Uuid, Lead>>,
    events: RwLock<Vec<AnalyticsEvent>>,
}

#[async_trait]
impl Store for MemoryStore {
    async fn insert_lead(&self, lead: &Lead) -> Result<(), StoreError> {
        self.leads
            .write()
            .expect("lead store poisoned")
            .insert(lead.id, lead.clone());
        Ok(())
    }

    async fn get_lead(&self, id: Uuid) -> Result<Option<Lead>, StoreError> {
        Ok(self.leads.read().expect("lead store poisoned").get(&id).cloned())
    }

    async fn update_lead_status(&self, id: Uuid, next: LeadStatus) -> Result<Lead, StoreError> {
        let mut leads = self.leads.write().expect("lead store poisoned");
        let lead = leads.get_mut(&id).ok_or(StoreError::NotFound)?;
        lead.transition(next)?;
        Ok(lead.clone())
    }

    async fn delete_lead(&self, id: Uuid) -> Result<bool, StoreError> {
        Ok(self
            .leads
            .write()
            .expect("lead store poisoned")
            .remove(&id)
            .is_some())
    }

    async fn count_leads(&self) -> Result<u64, StoreError> {
        Ok(self.leads.read().expect("lead store poisoned").len() as u64)
    }

    async fn insert_event(&self, event: &AnalyticsEvent) -> Result<(), StoreError> {
        self.events
            .write()
            .expect("event store poisoned")
            .push(event.clone());
        Ok(())
    }

    async fn count_events(&self) -> Result<u64, StoreError> {
        Ok(self.events.read().expect("event store poisoned").len() as u64)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sirinx_core::{BusinessType, Consent, Interest, LeadDraft};

    fn lead() -> Lead {
        Lead::from_draft(LeadDraft {
            business_type: BusinessType::Factory,
            monthly_electric_bill: 120_000.0,
            available_area_sqm: 2_000.0,
            interest: vec![Interest::SolarRooftop, Interest::AiEms],
            source: "unit-test".into(),
            consent: Consent {
                analytics: true,
                marketing_contact: false,
            },
        })
        .unwrap()
    }

    #[tokio::test]
    async fn lead_crud_roundtrip() {
        let store = MemoryStore::default();
        let lead = lead();
        store.insert_lead(&lead).await.unwrap();
        assert_eq!(store.count_leads().await.unwrap(), 1);

        let fetched = store.get_lead(lead.id).await.unwrap().unwrap();
        assert_eq!(fetched.id, lead.id);

        let updated = store
            .update_lead_status(lead.id, LeadStatus::Contacted)
            .await
            .unwrap();
        assert_eq!(updated.status, LeadStatus::Contacted);

        // Illegal skip is a validation error, state unchanged.
        let err = store
            .update_lead_status(lead.id, LeadStatus::ProposalSent)
            .await
            .unwrap_err();
        assert!(matches!(err, StoreError::Validation(_)));

        assert!(store.delete_lead(lead.id).await.unwrap());
        assert!(!store.delete_lead(lead.id).await.unwrap());
        assert_eq!(store.count_leads().await.unwrap(), 0);
    }

    #[tokio::test]
    async fn missing_lead_is_not_found() {
        let store = MemoryStore::default();
        let err = store
            .update_lead_status(Uuid::new_v4(), LeadStatus::Contacted)
            .await
            .unwrap_err();
        assert!(matches!(err, StoreError::NotFound));
    }
}
