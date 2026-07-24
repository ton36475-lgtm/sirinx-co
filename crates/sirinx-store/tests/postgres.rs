//! Legacy-store Postgres integration test — runs only when TEST_DATABASE_URL
//! points to an already migrated disposable database. Schema migration is a
//! separate fixture step and is never performed by the runtime constructor.

use sirinx_core::{BusinessType, Consent, Interest, Lead, LeadDraft, LeadStatus};
use sirinx_store::{PostgresStore, Store, StoreError};

fn test_lead() -> Lead {
    Lead::from_draft(LeadDraft {
        business_type: BusinessType::Warehouse,
        monthly_electric_bill: 80_000.0,
        available_area_sqm: 1_200.0,
        interest: vec![Interest::SolarRooftop, Interest::Bess],
        source: "postgres-integration-test".into(),
        consent: Consent {
            analytics: true,
            marketing_contact: false,
        },
    })
    .unwrap()
}

#[tokio::test]
async fn lead_lifecycle_against_real_postgres() {
    let Ok(url) = std::env::var("TEST_DATABASE_URL") else {
        eprintln!("TEST_DATABASE_URL not set; skipping postgres integration test");
        return;
    };

    let store = PostgresStore::connect(&url)
        .await
        .expect("connect to pre-migrated disposable Postgres");
    let lead = test_lead();

    store.insert_lead(&lead).await.unwrap();
    let fetched = store.get_lead(lead.id).await.unwrap().expect("lead stored");
    assert_eq!(fetched.status, LeadStatus::New);
    assert_eq!(fetched.draft.monthly_electric_bill, 80_000.0);
    assert_eq!(fetched.draft.interest, lead.draft.interest);

    let updated = store
        .update_lead_status(lead.id, LeadStatus::Contacted)
        .await
        .unwrap();
    assert_eq!(updated.status, LeadStatus::Contacted);

    let err = store
        .update_lead_status(lead.id, LeadStatus::ProposalSent)
        .await
        .unwrap_err();
    assert!(matches!(err, StoreError::Validation(_)));

    // Clean up the test row.
    assert!(store.delete_lead(lead.id).await.unwrap());
    assert_eq!(store.get_lead(lead.id).await.unwrap(), None);
}
