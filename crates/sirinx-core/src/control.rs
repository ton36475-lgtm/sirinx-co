use serde::{Deserialize, Serialize};

/// Persisted release-gate state. String-typed here so the store layer
/// stays decoupled from `sirinx-control`'s richer enum; the control
/// plane owns validation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GateRecord {
    pub name: String,
    /// `hold` | `open`
    pub state: String,
    pub ticket: Option<String>,
}

/// A recorded failure — raw material for the self-learning loop.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FailureRecord {
    /// Which component failed, e.g. `tool:deploy`, `agent:junai-17`.
    pub component: String,
    pub error: String,
    #[serde(default)]
    pub context: serde_json::Value,
}

/// A learned resolution: when `pattern` appears in a failure, apply
/// `resolution`. `hits` counts how often the lesson matched.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Lesson {
    pub pattern: String,
    pub resolution: String,
    #[serde(default)]
    pub hits: u64,
}

impl Lesson {
    /// Whether this lesson applies to the given failure text.
    pub fn matches(&self, failure_text: &str) -> bool {
        !self.pattern.is_empty() && failure_text.contains(&self.pattern)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lesson_matches_by_substring() {
        let lesson = Lesson {
            pattern: "connection refused".into(),
            resolution: "wait for service startup, then retry".into(),
            hits: 0,
        };
        assert!(lesson.matches("tool deploy failed: connection refused (os error 111)"));
        assert!(!lesson.matches("unrelated failure"));
    }

    #[test]
    fn empty_pattern_never_matches() {
        let lesson = Lesson {
            pattern: String::new(),
            resolution: "noop".into(),
            hits: 0,
        };
        assert!(!lesson.matches("anything"));
    }
}
