use std::collections::HashMap;
use std::sync::RwLock;

use async_trait::async_trait;
use uuid::Uuid;

use sirinx_core::{
    AnalyticsEvent, FailureRecord, GateRecord, Lead, LeadStatus, Lesson, PendingWork,
};

use crate::{Store, StoreError};

/// In-memory backend for tests and local development.
#[derive(Default)]
pub struct MemoryStore {
    leads: RwLock<HashMap<Uuid, Lead>>,
    events: RwLock<Vec<AnalyticsEvent>>,
    pending: RwLock<Vec<PendingWork>>,
    gates: RwLock<HashMap<String, GateRecord>>,
    failures: RwLock<Vec<FailureRecord>>,
    lessons: RwLock<HashMap<String, Lesson>>,
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
        Ok(self
            .leads
            .read()
            .expect("lead store poisoned")
            .get(&id)
            .cloned())
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

    async fn insert_pending_work(&self, item: &PendingWork) -> Result<(), StoreError> {
        self.pending
            .write()
            .expect("pending store poisoned")
            .push(item.clone());
        Ok(())
    }

    async fn list_pending_work(&self) -> Result<Vec<PendingWork>, StoreError> {
        Ok(self
            .pending
            .read()
            .expect("pending store poisoned")
            .iter()
            .filter(|item| item.status == "pending")
            .cloned()
            .collect())
    }

    async fn count_pending_work(&self) -> Result<u64, StoreError> {
        Ok(self
            .pending
            .read()
            .expect("pending store poisoned")
            .iter()
            .filter(|item| item.status == "pending")
            .count() as u64)
    }

    async fn complete_pending_work(
        &self,
        id: Uuid,
        completed_by: &str,
    ) -> Result<PendingWork, StoreError> {
        let mut pending = self.pending.write().expect("pending store poisoned");
        let item = pending
            .iter_mut()
            .find(|item| item.id == id)
            .ok_or(StoreError::NotFound)?;
        item.status = "completed".to_owned();
        // MemoryStore is for tests/local dev only; PostgresStore's
        // `now()` is the timestamp of record in production.
        let secs = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        item.completed_at = Some(format!("epoch:{secs}"));
        item.completed_by = Some(completed_by.to_owned());
        Ok(item.clone())
    }

    async fn load_gates(&self) -> Result<Vec<GateRecord>, StoreError> {
        let mut gates: Vec<GateRecord> = self
            .gates
            .read()
            .expect("gate store poisoned")
            .values()
            .cloned()
            .collect();
        gates.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(gates)
    }

    async fn upsert_gate(&self, gate: &GateRecord) -> Result<(), StoreError> {
        self.gates
            .write()
            .expect("gate store poisoned")
            .insert(gate.name.clone(), gate.clone());
        Ok(())
    }

    async fn record_failure(&self, failure: &FailureRecord) -> Result<(), StoreError> {
        self.failures
            .write()
            .expect("failure store poisoned")
            .push(failure.clone());
        Ok(())
    }

    async fn count_failures(&self) -> Result<u64, StoreError> {
        Ok(self.failures.read().expect("failure store poisoned").len() as u64)
    }

    async fn upsert_lesson(&self, lesson: &Lesson) -> Result<(), StoreError> {
        let mut lessons = self.lessons.write().expect("lesson store poisoned");
        lessons
            .entry(lesson.pattern.clone())
            .and_modify(|existing| {
                existing.resolution = lesson.resolution.clone();
                existing.hits += 1;
            })
            .or_insert_with(|| lesson.clone());
        Ok(())
    }

    async fn list_lessons(&self) -> Result<Vec<Lesson>, StoreError> {
        let mut lessons: Vec<Lesson> = self
            .lessons
            .read()
            .expect("lesson store poisoned")
            .values()
            .cloned()
            .collect();
        lessons.sort_by(|a, b| a.pattern.cmp(&b.pattern));
        Ok(lessons)
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

    #[tokio::test]
    async fn completing_pending_work_stamps_it_and_drains_the_queue() {
        let store = MemoryStore::default();
        let item = PendingWork::new("agent:kuranosuke-01", "scan leads", serde_json::json!({}));
        store.insert_pending_work(&item).await.unwrap();
        assert_eq!(store.count_pending_work().await.unwrap(), 1);

        let completed = store
            .complete_pending_work(item.id, "agent:gengo-35")
            .await
            .unwrap();
        assert_eq!(completed.status, "completed");
        assert_eq!(completed.completed_by.as_deref(), Some("agent:gengo-35"));
        assert!(completed.completed_at.is_some());

        // Completed work drops off the live queue, same as Postgres.
        assert_eq!(store.count_pending_work().await.unwrap(), 0);
        assert!(store.list_pending_work().await.unwrap().is_empty());
    }

    #[tokio::test]
    async fn completing_unknown_work_is_not_found() {
        let store = MemoryStore::default();
        let err = store
            .complete_pending_work(Uuid::new_v4(), "agent:gengo-35")
            .await
            .unwrap_err();
        assert!(matches!(err, StoreError::NotFound));
    }
}
