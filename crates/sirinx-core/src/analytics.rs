use serde::{Deserialize, Serialize};

/// Consent flags captured with every lead and analytics event.
/// Analytics stays consent-safe: no event is accepted without
/// `analytics: true` (white-hat SEO guard from the landing spec).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Consent {
    pub analytics: bool,
    pub marketing_contact: bool,
}

/// The closed set of analytics events allowed by the
/// THAIMART_SIRINX_TASTE_SKILL_GOAL_SPEC_V1 contract.
pub const ALLOWED_EVENTS: &[&str] = &[
    "thaimart_partner_view",
    "thaimart_footer_logo_click",
    "roi_calculator_start",
    "roi_calculator_submit",
    "line_add_friend_click",
    "contact_form_submit",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsEvent {
    pub event: String,
    #[serde(default)]
    pub payload: serde_json::Value,
    pub page: String,
    pub consent: Consent,
}

impl AnalyticsEvent {
    /// An event is accepted only when the visitor granted analytics consent
    /// and the event name is on the allowlist.
    pub fn is_accepted(&self) -> bool {
        self.consent.analytics && ALLOWED_EVENTS.contains(&self.event.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn event(name: &str, analytics: bool) -> AnalyticsEvent {
        AnalyticsEvent {
            event: name.into(),
            payload: serde_json::Value::Null,
            page: "thaimart_sirinx_landing".into(),
            consent: Consent {
                analytics,
                marketing_contact: false,
            },
        }
    }

    #[test]
    fn consent_gates_events() {
        assert!(event("roi_calculator_submit", true).is_accepted());
        assert!(!event("roi_calculator_submit", false).is_accepted());
    }

    #[test]
    fn unknown_events_are_rejected() {
        assert!(!event("keyword_stuffing_ping", true).is_accepted());
    }
}
