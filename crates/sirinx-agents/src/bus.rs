use std::collections::HashMap;

use crate::agent::{Agent, AgentError, AgentInput, AgentOutput};
use crate::layer::Layer;
use crate::roster::AgentId;

/// A message travelling between layers.
#[derive(Debug, Clone)]
pub struct Envelope {
    pub from: AgentId,
    pub to_layer: Layer,
    pub input: AgentInput,
}

#[derive(Debug, thiserror::Error)]
pub enum DispatchError {
    #[error("layer skip forbidden: {from:?} ({from_layer:?}) may not publish to {to:?}")]
    LayerSkip {
        from: AgentId,
        from_layer: Layer,
        to: Layer,
    },
    #[error("no agent registered for id {0:?}")]
    UnknownAgent(AgentId),
    #[error(transparent)]
    Agent(#[from] AgentError),
}

/// Registry + router. Enforces ห้ามข้ามชั้น: an operational agent may only
/// publish to `layer.next_operational()`; L5 research agents may publish
/// advisories to any operational layer.
#[derive(Default)]
pub struct Dispatcher {
    agents: HashMap<AgentId, Box<dyn Agent>>,
}

impl Dispatcher {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&mut self, agent: Box<dyn Agent>) {
        self.agents.insert(agent.id(), agent);
    }

    pub fn agent_count(&self) -> usize {
        self.agents.len()
    }

    /// Validate that `from` is allowed to publish into `to_layer`.
    pub fn check_route(from: AgentId, to_layer: Layer) -> Result<(), DispatchError> {
        let from_layer = from.layer().ok_or(DispatchError::UnknownAgent(from))?;
        let allowed = match from_layer {
            Layer::Research => to_layer.is_operational(),
            _ => from_layer.next_operational() == Some(to_layer),
        };
        if allowed {
            Ok(())
        } else {
            Err(DispatchError::LayerSkip {
                from,
                from_layer,
                to: to_layer,
            })
        }
    }

    /// Run one agent and, if it publishes, route the follow-up event to
    /// every registered agent in the next layer. Returns each produced
    /// output in execution order.
    pub fn run(&self, start: AgentId, input: AgentInput) -> Result<Vec<AgentOutput>, DispatchError> {
        let mut outputs = Vec::new();
        let mut queue = vec![(start, input)];

        while let Some((id, input)) = queue.pop() {
            let agent = self
                .agents
                .get(&id)
                .ok_or(DispatchError::UnknownAgent(id))?;
            let output = agent.process(input)?;

            if let Some(publish) = &output.publish {
                let from_layer = agent.layer();
                if let Some(next_layer) = from_layer.next_operational() {
                    Self::check_route(id, next_layer)?;
                    for (next_id, next_agent) in &self.agents {
                        if next_agent.layer() == next_layer {
                            queue.push((*next_id, publish.clone()));
                        }
                    }
                }
            }
            outputs.push(output);
        }
        Ok(outputs)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Probe {
        id: AgentId,
        forward: bool,
    }

    impl Agent for Probe {
        fn id(&self) -> AgentId {
            self.id
        }

        fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError> {
            Ok(AgentOutput {
                summary: format!("agent {} handled {}", self.id.0, input.event),
                publish: self.forward.then(|| AgentInput {
                    event: format!("{}-processed", input.event),
                    payload: input.payload,
                }),
            })
        }
    }

    fn input() -> AgentInput {
        AgentInput {
            event: "lead-scanned".into(),
            payload: serde_json::json!({ "billThb": 45000 }),
        }
    }

    #[test]
    fn l1_output_flows_to_l2() {
        let mut dispatcher = Dispatcher::new();
        dispatcher.register(Box::new(Probe { id: AgentId(1), forward: true })); // L1
        dispatcher.register(Box::new(Probe { id: AgentId(17), forward: false })); // L2

        let outputs = dispatcher.run(AgentId(1), input()).unwrap();
        assert_eq!(outputs.len(), 2);
        assert!(outputs[1].summary.contains("agent 17"));
        assert!(outputs[1].summary.contains("lead-scanned-processed"));
    }

    #[test]
    fn layer_skip_is_forbidden() {
        // L1 publishing straight to L3 must be rejected.
        let err = Dispatcher::check_route(AgentId(1), Layer::Decision).unwrap_err();
        assert!(matches!(err, DispatchError::LayerSkip { .. }));
        // The legal route is fine.
        Dispatcher::check_route(AgentId(1), Layer::Analysis).unwrap();
    }

    #[test]
    fn research_may_advise_any_operational_layer() {
        Dispatcher::check_route(AgentId(44), Layer::Perception).unwrap();
        Dispatcher::check_route(AgentId(44), Layer::Coordination).unwrap();
        // ...but not the chatbot.
        assert!(Dispatcher::check_route(AgentId(44), Layer::Chatbot).is_err());
    }

    #[test]
    fn l4_is_the_end_of_the_chain() {
        let mut dispatcher = Dispatcher::new();
        dispatcher.register(Box::new(Probe { id: AgentId(36), forward: true })); // L4
        let outputs = dispatcher.run(AgentId(36), input()).unwrap();
        // Publishes, but there is no next layer, so nothing is routed.
        assert_eq!(outputs.len(), 1);
    }

    #[test]
    fn unknown_agent_errors() {
        let dispatcher = Dispatcher::new();
        assert!(matches!(
            dispatcher.run(AgentId(1), input()),
            Err(DispatchError::UnknownAgent(_))
        ));
    }
}
