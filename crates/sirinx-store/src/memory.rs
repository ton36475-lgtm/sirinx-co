use std::collections::btree_map::Entry;
use std::collections::{BTreeMap, HashMap};
use std::sync::RwLock;

use async_trait::async_trait;
use uuid::Uuid;

use sirinx_core::{
    bounded_recovery_tool_name, AnalyticsEvent, FailureEvent, FailureKind, Gate, Lead, LeadStatus,
    Lesson, LessonGuidance, PendingWork,
};

use crate::agent_runtime::AgentRuntimeMemory;
use crate::{Store, StoreError};

/// In-memory backend for tests and local development.
#[derive(Default)]
pub struct MemoryStore {
    leads: RwLock<HashMap<Uuid, Lead>>,
    events: RwLock<Vec<AnalyticsEvent>>,
    pending: RwLock<Vec<PendingWork>>,
    gates: RwLock<BTreeMap<String, Gate>>,
    failures: RwLock<Vec<FailureEvent>>,
    lessons: RwLock<BTreeMap<(String, FailureKind, LessonGuidance), Lesson>>,
    pub(crate) agent_runtime: AgentRuntimeMemory,
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
        Ok(self.pending.read().expect("pending store poisoned").clone())
    }

    async fn count_pending_work(&self) -> Result<u64, StoreError> {
        Ok(self.pending.read().expect("pending store poisoned").len() as u64)
    }

    async fn upsert_gate(&self, gate: &Gate) -> Result<(), StoreError> {
        self.gates
            .write()
            .expect("gate store poisoned")
            .insert(gate.name.clone(), gate.clone());
        Ok(())
    }

    async fn list_gates(&self) -> Result<Vec<Gate>, StoreError> {
        Ok(self
            .gates
            .read()
            .expect("gate store poisoned")
            .values()
            .cloned()
            .collect())
    }

    async fn get_gate(&self, name: &str) -> Result<Option<Gate>, StoreError> {
        Ok(self
            .gates
            .read()
            .expect("gate store poisoned")
            .get(name)
            .cloned())
    }

    async fn record_failure(&self, event: &FailureEvent) -> Result<(), StoreError> {
        let mut bounded = event.clone();
        bounded.tool = bounded_recovery_tool_name(&event.tool);
        bounded.attempt = bounded.attempt.max(1);
        self.failures
            .write()
            .expect("failure store poisoned")
            .push(bounded);
        Ok(())
    }

    async fn failure_events_for_run(&self, run_id: Uuid) -> Result<Vec<FailureEvent>, StoreError> {
        let mut events: Vec<_> = self
            .failures
            .read()
            .expect("failure store poisoned")
            .iter()
            .filter(|event| event.run_id == run_id)
            .cloned()
            .collect();
        events.sort_by_key(|event| (event.attempt, event.id));
        Ok(events)
    }

    async fn upsert_lesson(&self, lesson: &Lesson) -> Result<Lesson, StoreError> {
        let tool = bounded_recovery_tool_name(&lesson.tool);
        let key = (tool.clone(), lesson.error_kind, lesson.guidance);
        let mut lessons = self.lessons.write().expect("lesson store poisoned");
        let stored = match lessons.entry(key) {
            Entry::Vacant(entry) => {
                let mut inserted = lesson.clone();
                inserted.tool = tool;
                inserted.occurrences = 1;
                entry.insert(inserted).clone()
            }
            Entry::Occupied(mut entry) => {
                let stored = entry.get_mut();
                stored.occurrences = stored.occurrences.saturating_add(1);
                stored.clone()
            }
        };
        Ok(stored)
    }

    async fn lessons_for_tool(&self, tool: &str) -> Result<Vec<Lesson>, StoreError> {
        let tool = bounded_recovery_tool_name(tool);
        let mut lessons: Vec<_> = self
            .lessons
            .read()
            .expect("lesson store poisoned")
            .iter()
            .filter(|((stored_tool, _, _), _)| stored_tool == &tool)
            .map(|(_, lesson)| lesson.clone())
            .collect();
        lessons.sort_by(|left, right| {
            right
                .occurrences
                .cmp(&left.occurrences)
                .then_with(|| left.error_kind.cmp(&right.error_kind))
                .then_with(|| left.guidance.cmp(&right.guidance))
                .then_with(|| left.id.cmp(&right.id))
        });
        Ok(lessons)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sirinx_core::{
        BusinessType, Consent, FailureKind, GateState, Interest, LeadDraft, LessonGuidance,
    };

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
    async fn gate_upsert_and_list_roundtrip() {
        let store = MemoryStore::default();
        assert!(store.list_gates().await.unwrap().is_empty());

        let held = Gate {
            name: "deploy".into(),
            state: GateState::Hold,
            ticket: None,
        };
        store.upsert_gate(&held).await.unwrap();

        let opened = Gate {
            name: "deploy".into(),
            state: GateState::Open,
            ticket: Some("GO-LIVE-001".into()),
        };
        store.upsert_gate(&opened).await.unwrap();

        assert_eq!(store.list_gates().await.unwrap(), vec![opened]);
    }

    #[tokio::test]
    async fn failure_events_are_filtered_by_run() {
        let store = MemoryStore::default();
        let run_a = Uuid::new_v4();
        let run_b = Uuid::new_v4();
        store
            .record_failure(&FailureEvent::new(run_a, "quote", FailureKind::BadArgs, 2))
            .await
            .unwrap();
        store
            .record_failure(&FailureEvent::new(run_b, "quote", FailureKind::Failed, 1))
            .await
            .unwrap();
        store
            .record_failure(&FailureEvent::new(run_a, "quote", FailureKind::Failed, 3))
            .await
            .unwrap();

        let events = store.failure_events_for_run(run_a).await.unwrap();
        assert_eq!(events.len(), 2);
        assert!(events.iter().all(|event| event.run_id == run_a));
        assert_eq!(events[0].attempt, 2);
        assert_eq!(events[1].attempt, 3);
    }

    #[tokio::test]
    async fn lessons_dedupe_increment_and_filter_by_tool() {
        let store = MemoryStore::default();
        let quote = Lesson::new(
            "quote",
            FailureKind::BadArgs,
            LessonGuidance::ValidateArguments,
        );
        let first = store.upsert_lesson(&quote).await.unwrap();
        let second = store.upsert_lesson(&quote).await.unwrap();
        store
            .upsert_lesson(&Lesson::new(
                "deploy",
                FailureKind::Failed,
                LessonGuidance::RetryTransientFailure,
            ))
            .await
            .unwrap();

        assert_eq!(first.id, second.id);
        assert_eq!(second.occurrences, 2);
        let lessons = store.lessons_for_tool("quote").await.unwrap();
        assert_eq!(lessons, vec![second]);
        assert!(store.lessons_for_tool("missing").await.unwrap().is_empty());
    }
}
