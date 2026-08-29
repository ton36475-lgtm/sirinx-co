use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Maximum persisted tool-name length. Recovery records intentionally omit
/// invocation arguments and error messages; the tool name is the only caller
/// supplied text retained by this subsystem.
pub const MAX_RECOVERY_TOOL_NAME_CHARS: usize = 128;

/// Safe, closed classification of a failed tool attempt.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FailureKind {
    BadArgs,
    Failed,
    Unknown,
}

/// Structured planner guidance. These values describe how to reconsider a
/// plan; they are not commands, scripts, arguments, or executable payloads.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LessonGuidance {
    ValidateArguments,
    RetryTransientFailure,
    VerifyToolAvailability,
}

impl FailureKind {
    pub fn default_guidance(self) -> LessonGuidance {
        match self {
            Self::BadArgs => LessonGuidance::ValidateArguments,
            Self::Failed => LessonGuidance::RetryTransientFailure,
            Self::Unknown => LessonGuidance::VerifyToolAvailability,
        }
    }
}

/// One failed tool attempt. No raw arguments or error text cross this domain
/// boundary, keeping the durable record bounded and safe to inspect.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FailureEvent {
    pub id: Uuid,
    pub run_id: Uuid,
    pub tool: String,
    pub error_kind: FailureKind,
    /// One-based attempt number within the global loop budget.
    pub attempt: u32,
}

impl FailureEvent {
    pub fn new(
        run_id: Uuid,
        tool: impl AsRef<str>,
        error_kind: FailureKind,
        attempt: usize,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            run_id,
            tool: bounded_recovery_tool_name(tool.as_ref()),
            error_kind,
            attempt: u32::try_from(attempt).unwrap_or(u32::MAX).max(1),
        }
    }
}

/// Deduplicated lesson learned from one or more matching failures.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Lesson {
    pub id: Uuid,
    pub tool: String,
    pub error_kind: FailureKind,
    pub guidance: LessonGuidance,
    pub occurrences: u64,
}

impl Lesson {
    pub fn new(tool: impl AsRef<str>, error_kind: FailureKind, guidance: LessonGuidance) -> Self {
        Self {
            id: Uuid::new_v4(),
            tool: bounded_recovery_tool_name(tool.as_ref()),
            error_kind,
            guidance,
            occurrences: 1,
        }
    }
}

pub fn bounded_recovery_tool_name(tool: &str) -> String {
    let trimmed = tool.trim();
    let bounded: String = trimmed.chars().take(MAX_RECOVERY_TOOL_NAME_CHARS).collect();
    if bounded.is_empty() {
        "unknown".into()
    } else {
        bounded
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recovery_records_are_bounded_and_contain_no_raw_payload_or_error() {
        let event = FailureEvent::new(
            Uuid::new_v4(),
            "x".repeat(MAX_RECOVERY_TOOL_NAME_CHARS + 50),
            FailureKind::BadArgs,
            0,
        );
        assert_eq!(event.tool.chars().count(), MAX_RECOVERY_TOOL_NAME_CHARS);
        assert_eq!(event.attempt, 1);

        let value = serde_json::to_value(event).unwrap();
        assert!(value.get("args").is_none());
        assert!(value.get("error").is_none());
        assert!(value.get("message").is_none());
    }

    #[test]
    fn guidance_is_closed_and_non_executable() {
        assert_eq!(
            FailureKind::BadArgs.default_guidance(),
            LessonGuidance::ValidateArguments
        );
        assert_eq!(
            FailureKind::Failed.default_guidance(),
            LessonGuidance::RetryTransientFailure
        );
        assert_eq!(
            FailureKind::Unknown.default_guidance(),
            LessonGuidance::VerifyToolAvailability
        );
    }
}
