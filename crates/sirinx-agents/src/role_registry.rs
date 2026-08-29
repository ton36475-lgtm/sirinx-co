//! Typed, fail-closed projection of the passive 47-Ronin role registry.
//!
//! [`Roster`] remains the authority for numeric role and layer ranges. This
//! module adds descriptive role metadata while deliberately granting no
//! execution authority.

use std::collections::{BTreeMap, BTreeSet};
use std::sync::OnceLock;

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::layer::Layer;
use crate::roster::{AgentId, Roster};

const EMBEDDED_ROLE_REGISTRY_JSON: &str = include_str!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/data/ronin-role-registry.v1.json"
));

const EXPECTED_IMPLEMENTED_ROLE_IDS: [u8; 9] = [1, 2, 3, 4, 17, 18, 19, 26, 36];
const EXPECTED_REGISTRY_ID: &str = "sirinx-47-ronin-passive-role-registry";
const EXPECTED_REGISTRY_VERSION: &str = "1.0.0";
const EXPECTED_NUMERIC_ROLE_RANGES: &str =
    "Rust numeric ranges in crates/sirinx-agents/src/roster.rs are authoritative.";
const EXPECTED_RUNTIME_MEANING: &str = "The 47 entries are logical roles, not processes.";
const EXPECTED_DURABLE_STATE_AUTHORITY: &str =
    "Postgres is the sole durable task, lease, approval, gate, and receipt authority.";
const EXPECTED_MAKER_CHECKER_SEPARATION: &str =
    "A maker and checker must use different role IDs, principals, and leases for the same stage.";
const EXPECTED_EXTERNAL_ACTION_POLICY: &str = "No external action is enabled by this registry. Install, provider call, live send, push, merge, production migration, Cloudflare mutation, and deploy each require a separate exact task-specific human ticket.";
const EXPECTED_LANE_POLICY: [&str; 3] = [
    "one-maker",
    "one-independent-checker",
    "one-verifier-or-researcher",
];

static EMBEDDED_ROLE_REGISTRY: OnceLock<Result<RoninRoleRegistry, RoleRegistryError>> =
    OnceLock::new();

/// Load and validate the embedded canonical role registry once.
///
/// The error is retained alongside the registry so repeated callers observe
/// the same fail-closed result without reparsing or panicking.
pub fn embedded_role_registry() -> Result<&'static RoninRoleRegistry, &'static RoleRegistryError> {
    match EMBEDDED_ROLE_REGISTRY
        .get_or_init(|| RoninRoleRegistry::from_json(EMBEDDED_ROLE_REGISTRY_JSON))
    {
        Ok(registry) => Ok(registry),
        Err(error) => Err(error),
    }
}

/// Accepted passive-registry lifecycle state.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RegistryStatus {
    #[serde(rename = "passive-specification")]
    PassiveSpecification,
}

/// Fixed functional department identifiers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum DepartmentId {
    #[serde(rename = "L1")]
    L1,
    #[serde(rename = "L2")]
    L2,
    #[serde(rename = "L3")]
    L3,
    #[serde(rename = "L4")]
    L4,
    #[serde(rename = "L5")]
    L5,
    #[serde(rename = "KAI")]
    Kai,
}

/// Action classes declared by passive role cards.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum ActionClass {
    #[serde(rename = "A")]
    A,
    #[serde(rename = "A_DRAFT_ONLY")]
    ADraftOnly,
    #[serde(rename = "B_COORDINATION")]
    BCoordination,
    #[serde(rename = "B_EXACT_LEASE")]
    BExactLease,
    #[serde(rename = "B_FIXTURE_ONLY")]
    BFixtureOnly,
    #[serde(rename = "B_PLAN_ONLY")]
    BPlanOnly,
    #[serde(rename = "C_MAKER_CHECKER")]
    CMakerChecker,
    #[serde(rename = "D_TICKETED_ONLY")]
    DTicketedOnly,
    #[serde(rename = "X")]
    X,
}

/// Runtime source-access boundary shared by principals and role cards.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RuntimePrincipalBoundary {
    #[serde(rename = "candidate-output-only")]
    CandidateOutputOnly,
    #[serde(rename = "compiled-runtime-only")]
    CompiledRuntimeOnly,
    #[serde(rename = "no-repo-source-write")]
    NoRepoSourceWrite,
    #[serde(rename = "none")]
    None,
    #[serde(rename = "read-only")]
    ReadOnly,
    #[serde(rename = "read-only-except-exact-artifact-job")]
    ReadOnlyExceptExactArtifactJob,
    #[serde(rename = "write-with-exact-path-lease-for-l4-only")]
    WriteWithExactPathLeaseForL4Only,
}

/// Implementation truth declared by a role card.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ImplementationStatus {
    #[serde(rename = "coded-rust-runtime-plus-passive-card")]
    CodedRustRuntimePlusPassiveCard,
    #[serde(rename = "passive-specification-anchor-codename")]
    PassiveSpecificationAnchorCodename,
    #[serde(rename = "passive-specification-outside-47")]
    PassiveSpecificationOutside47,
    #[serde(rename = "passive-specification-runtime-principal-mapped")]
    PassiveSpecificationRuntimePrincipalMapped,
}

/// Safety and concurrency authority carried by the registry.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RegistryAuthority {
    pub numeric_role_ranges: String,
    pub runtime_meaning: String,
    pub durable_state_authority: String,
    pub max_concurrent_workers: usize,
    pub lane_policy: Vec<String>,
    pub maker_checker_separation: String,
    pub external_actions: bool,
    pub external_action_policy: String,
}

/// One canonical department declaration.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct DepartmentDefinition {
    pub department_id: DepartmentId,
    pub title: String,
    pub range: String,
    pub count: usize,
    pub head_role_id: u8,
    pub head_codename: String,
    pub default_action_classes: Vec<ActionClass>,
}

/// One runtime principal and the logical roles it may represent.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RuntimePrincipal {
    pub runtime_principal_id: String,
    pub role_ids: Vec<u8>,
    pub source_access: RuntimePrincipalBoundary,
}

/// Passive metadata for one Ronin role, or Kai when stored in [`RoninRoleRegistry::kai`].
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RoninRoleCard {
    pub role_id: u8,
    pub card_id: String,
    pub functional_role_id: String,
    pub department_id: DepartmentId,
    pub department_title: String,
    pub codename: String,
    pub title: String,
    pub mission: String,
    pub head_role_id: Option<u8>,
    pub reports_to: String,
    pub runtime_principal_id: String,
    pub runtime_principal_boundary: RuntimePrincipalBoundary,
    pub action_classes: Vec<ActionClass>,
    pub responsibilities: Vec<String>,
    pub allowed_inputs: Vec<String>,
    pub outputs: Vec<String>,
    pub required_evidence: Vec<String>,
    pub prohibited_actions: Vec<String>,
    pub escalation: Vec<String>,
    pub background_cadence: String,
    pub implementation_status: ImplementationStatus,
    pub source_refs: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct RawRoninRoleRegistry {
    registry_id: String,
    registry_version: String,
    status: RegistryStatus,
    executable: bool,
    description: String,
    authority: RegistryAuthority,
    departments: Vec<DepartmentDefinition>,
    runtime_principals: Vec<RuntimePrincipal>,
    roles: Vec<RoninRoleCard>,
    kai: RoninRoleCard,
}

/// Validated, immutable passive role registry for 47 numbered Ronin and Kai.
///
/// The raw serde representation is private, so callers can only obtain this
/// type through [`RoninRoleRegistry::from_json`] or
/// [`embedded_role_registry`]. Serialization is supported for read-only API
/// projection, but deserialization is intentionally unavailable.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(transparent)]
pub struct RoninRoleRegistry {
    raw: RawRoninRoleRegistry,
}

impl RoninRoleRegistry {
    /// Parse and fully validate a registry document.
    pub fn from_json(input: &str) -> Result<Self, RoleRegistryError> {
        let raw: RawRoninRoleRegistry = serde_json::from_str(input)?;
        let registry = Self { raw };
        registry.validate()?;
        Ok(registry)
    }

    /// Validate all safety, numeric, department, implementation, and principal invariants.
    pub fn validate(&self) -> Result<(), RoleRegistryError> {
        self.raw.validate()
    }

    /// Stable registry identifier.
    pub fn registry_id(&self) -> &str {
        &self.raw.registry_id
    }

    /// Schema and semantic version of the registry.
    pub fn registry_version(&self) -> &str {
        &self.raw.registry_version
    }

    /// Passive lifecycle state.
    pub fn status(&self) -> RegistryStatus {
        self.raw.status
    }

    /// Registry description.
    pub fn description(&self) -> &str {
        &self.raw.description
    }

    /// Validated safety and concurrency authority.
    pub fn authority(&self) -> &RegistryAuthority {
        &self.raw.authority
    }

    /// Canonical department definitions.
    pub fn departments(&self) -> &[DepartmentDefinition] {
        &self.raw.departments
    }

    /// Runtime principal mappings.
    pub fn runtime_principals(&self) -> &[RuntimePrincipal] {
        &self.raw.runtime_principals
    }

    /// All 47 numbered role cards.
    pub fn roles(&self) -> &[RoninRoleCard] {
        &self.raw.roles
    }

    /// Kai's separately validated draft-only role card.
    pub fn kai(&self) -> &RoninRoleCard {
        &self.raw.kai
    }

    /// Look up a numbered Ronin, or Kai for [`AgentId::KAI`].
    pub fn role(&self, id: AgentId) -> Option<&RoninRoleCard> {
        self.raw.role(id)
    }

    /// Look up a declared runtime principal by stable identifier.
    pub fn runtime_principal(&self, id: &str) -> Option<&RuntimePrincipal> {
        self.raw.runtime_principal(id)
    }
}

impl RawRoninRoleRegistry {
    fn validate(&self) -> Result<(), RoleRegistryError> {
        self.validate_authority()?;
        self.validate_schema_constraints()?;
        self.validate_departments()?;
        self.validate_roles()?;
        self.validate_reporting_chain()?;
        self.validate_runtime_principals()?;
        self.validate_kai()?;
        Ok(())
    }

    fn role(&self, id: AgentId) -> Option<&RoninRoleCard> {
        if id == AgentId::KAI {
            return Some(&self.kai);
        }

        self.roles.iter().find(|role| role.role_id == id.0)
    }

    fn runtime_principal(&self, id: &str) -> Option<&RuntimePrincipal> {
        self.runtime_principals
            .iter()
            .find(|principal| principal.runtime_principal_id == id)
    }

    fn validate_authority(&self) -> Result<(), RoleRegistryError> {
        if self.registry_id != EXPECTED_REGISTRY_ID {
            return Err(RoleRegistryError::RegistryId {
                actual: self.registry_id.clone(),
            });
        }
        if self.registry_version != EXPECTED_REGISTRY_VERSION {
            return Err(RoleRegistryError::RegistryVersion {
                actual: self.registry_version.clone(),
            });
        }
        if self.status != RegistryStatus::PassiveSpecification {
            return Err(RoleRegistryError::NonPassiveStatus);
        }
        if self.executable {
            return Err(RoleRegistryError::ExecutableRegistry);
        }
        if self.authority.max_concurrent_workers != 3 {
            return Err(RoleRegistryError::WorkerCap {
                actual: self.authority.max_concurrent_workers,
            });
        }
        if self.authority.external_actions {
            return Err(RoleRegistryError::ExternalActionsEnabled);
        }
        if self.authority.durable_state_authority != EXPECTED_DURABLE_STATE_AUTHORITY {
            return Err(RoleRegistryError::DurableStateAuthority);
        }
        for (field, actual, expected) in [
            (
                "numericRoleRanges",
                self.authority.numeric_role_ranges.as_str(),
                EXPECTED_NUMERIC_ROLE_RANGES,
            ),
            (
                "runtimeMeaning",
                self.authority.runtime_meaning.as_str(),
                EXPECTED_RUNTIME_MEANING,
            ),
            (
                "makerCheckerSeparation",
                self.authority.maker_checker_separation.as_str(),
                EXPECTED_MAKER_CHECKER_SEPARATION,
            ),
            (
                "externalActionPolicy",
                self.authority.external_action_policy.as_str(),
                EXPECTED_EXTERNAL_ACTION_POLICY,
            ),
        ] {
            if actual != expected {
                return Err(RoleRegistryError::AuthorityContract { field });
            }
        }
        if self.authority.lane_policy.len() != EXPECTED_LANE_POLICY.len()
            || !self
                .authority
                .lane_policy
                .iter()
                .map(String::as_str)
                .eq(EXPECTED_LANE_POLICY)
        {
            return Err(RoleRegistryError::LanePolicy);
        }
        Ok(())
    }

    fn validate_schema_constraints(&self) -> Result<(), RoleRegistryError> {
        require_nonblank("registry", "description", &self.description)?;
        require_nonblank(
            "authority",
            "numericRoleRanges",
            &self.authority.numeric_role_ranges,
        )?;
        require_nonblank(
            "authority",
            "runtimeMeaning",
            &self.authority.runtime_meaning,
        )?;
        require_nonblank(
            "authority",
            "durableStateAuthority",
            &self.authority.durable_state_authority,
        )?;
        require_nonblank(
            "authority",
            "makerCheckerSeparation",
            &self.authority.maker_checker_separation,
        )?;
        require_nonblank(
            "authority",
            "externalActionPolicy",
            &self.authority.external_action_policy,
        )?;
        require_unique_nonblank_strings("authority", "lanePolicy", &self.authority.lane_policy, 3)?;

        for department in &self.departments {
            let scope = format!("department:{:?}", department.department_id);
            require_nonblank(&scope, "title", &department.title)?;
            require_nonblank(&scope, "range", &department.range)?;
            require_nonblank(&scope, "headCodename", &department.head_codename)?;
            require_unique_actions(
                &scope,
                "defaultActionClasses",
                &department.default_action_classes,
            )?;
        }

        for principal in &self.runtime_principals {
            let scope = format!("runtimePrincipal:{}", principal.runtime_principal_id);
            require_nonblank(
                &scope,
                "runtimePrincipalId",
                &principal.runtime_principal_id,
            )?;
            if principal.role_ids.is_empty() {
                return Err(RoleRegistryError::SchemaConstraint {
                    scope,
                    field: "roleIds",
                });
            }
            let unique_role_ids: BTreeSet<u8> = principal.role_ids.iter().copied().collect();
            if unique_role_ids.len() != principal.role_ids.len() {
                return Err(RoleRegistryError::SchemaConstraint {
                    scope,
                    field: "roleIds",
                });
            }
        }

        for role in &self.roles {
            validate_role_card_schema(role, false)?;
        }
        validate_role_card_schema(&self.kai, true)?;

        Ok(())
    }

    fn validate_departments(&self) -> Result<(), RoleRegistryError> {
        if self.departments.len() != DEPARTMENT_SPECS.len() {
            return Err(RoleRegistryError::DepartmentCount {
                actual: self.departments.len(),
            });
        }

        let mut seen = BTreeSet::new();
        for department in &self.departments {
            if !seen.insert(department.department_id) {
                return Err(RoleRegistryError::DuplicateDepartment {
                    department: department.department_id,
                });
            }
        }

        for spec in DEPARTMENT_SPECS {
            let Some(department) = self
                .departments
                .iter()
                .find(|department| department.department_id == spec.id)
            else {
                return Err(RoleRegistryError::MissingDepartment {
                    department: spec.id,
                });
            };

            let expected_actions = expected_department_actions(spec.id);
            if department.title != spec.title
                || department.range != spec.range
                || department.count != spec.count
                || department.head_role_id != spec.head_role_id
                || department.head_codename != spec.head_codename
                || !same_action_class_set(&department.default_action_classes, expected_actions)
            {
                return Err(RoleRegistryError::DepartmentDefinition {
                    department: spec.id,
                });
            }
        }

        Ok(())
    }

    fn validate_roles(&self) -> Result<(), RoleRegistryError> {
        if Roster::SIZE != 47 || self.roles.len() != usize::from(Roster::SIZE) {
            return Err(RoleRegistryError::RoleCount {
                actual: self.roles.len(),
            });
        }

        let mut role_ids = BTreeSet::new();
        let mut card_ids = BTreeSet::new();
        let mut functional_role_ids = BTreeSet::new();
        let mut implemented_role_ids = BTreeSet::new();

        for role in &self.roles {
            if !(1..=Roster::SIZE).contains(&role.role_id) {
                return Err(RoleRegistryError::OutOfRangeRoleId {
                    role_id: role.role_id,
                });
            }
            if !role_ids.insert(role.role_id) {
                return Err(RoleRegistryError::DuplicateRoleId {
                    role_id: role.role_id,
                });
            }
            if !card_ids.insert(role.card_id.as_str()) {
                return Err(RoleRegistryError::DuplicateCardId {
                    card_id: role.card_id.clone(),
                });
            }
            if !functional_role_ids.insert(role.functional_role_id.as_str()) {
                return Err(RoleRegistryError::DuplicateFunctionalRoleId {
                    functional_role_id: role.functional_role_id.clone(),
                });
            }

            let Some(spec) = department_spec_for_role(role.role_id) else {
                return Err(RoleRegistryError::OutOfRangeRoleId {
                    role_id: role.role_id,
                });
            };
            if role.department_id != spec.id
                || role.department_title != spec.title
                || role.head_role_id != Some(spec.head_role_id)
            {
                return Err(RoleRegistryError::RoleDepartment {
                    role_id: role.role_id,
                    expected: spec.id,
                    actual: role.department_id,
                });
            }
            if !same_action_class_set(&role.action_classes, expected_role_actions(role.role_id)) {
                return Err(RoleRegistryError::RoleActionClasses {
                    role_id: role.role_id,
                });
            }
            if let Some(roster_codename) = Roster::codename(AgentId(role.role_id)) {
                if roster_codename != role.codename {
                    return Err(RoleRegistryError::RosterCodename {
                        role_id: role.role_id,
                        expected: roster_codename.to_owned(),
                        actual: role.codename.clone(),
                    });
                }
            }

            match role.implementation_status {
                ImplementationStatus::CodedRustRuntimePlusPassiveCard => {
                    implemented_role_ids.insert(role.role_id);
                }
                ImplementationStatus::PassiveSpecificationAnchorCodename
                | ImplementationStatus::PassiveSpecificationRuntimePrincipalMapped => {}
                ImplementationStatus::PassiveSpecificationOutside47 => {
                    return Err(RoleRegistryError::OutsideStatusOnRonin {
                        role_id: role.role_id,
                    });
                }
            }
        }

        for expected_id in 1..=Roster::SIZE {
            if !role_ids.contains(&expected_id) {
                return Err(RoleRegistryError::MissingRoleId {
                    role_id: expected_id,
                });
            }
        }

        let expected_implemented: BTreeSet<u8> =
            EXPECTED_IMPLEMENTED_ROLE_IDS.into_iter().collect();
        if implemented_role_ids != expected_implemented {
            return Err(RoleRegistryError::ImplementedRoleSet {
                expected: expected_implemented,
                actual: implemented_role_ids,
            });
        }

        Ok(())
    }

    fn validate_reporting_chain(&self) -> Result<(), RoleRegistryError> {
        let cards: BTreeMap<u8, &RoninRoleCard> =
            self.roles.iter().map(|role| (role.role_id, role)).collect();
        let card_ids: BTreeSet<&str> = self
            .roles
            .iter()
            .map(|role| role.card_id.as_str())
            .collect();

        for role in &self.roles {
            if !is_reporting_sentinel(&role.reports_to)
                && !card_ids.contains(role.reports_to.as_str())
            {
                return Err(RoleRegistryError::UnresolvedReportsTo {
                    role_id: role.role_id,
                    reports_to: role.reports_to.clone(),
                });
            }

            let Some(spec) = department_spec_for_role(role.role_id) else {
                return Err(RoleRegistryError::OutOfRangeRoleId {
                    role_id: role.role_id,
                });
            };
            if role.role_id == spec.head_role_id {
                let expected = expected_head_reports_to(role.role_id);
                if expected != Some(role.reports_to.as_str()) {
                    return Err(RoleRegistryError::HeadReportsTo {
                        role_id: role.role_id,
                        reports_to: role.reports_to.clone(),
                    });
                }
                continue;
            }

            let Some(head) = cards.get(&spec.head_role_id) else {
                return Err(RoleRegistryError::MissingRoleId {
                    role_id: spec.head_role_id,
                });
            };
            if role.reports_to != head.card_id {
                return Err(RoleRegistryError::MemberReportsTo {
                    role_id: role.role_id,
                    expected: head.card_id.clone(),
                    actual: role.reports_to.clone(),
                });
            }
        }

        Ok(())
    }

    fn validate_runtime_principals(&self) -> Result<(), RoleRegistryError> {
        if self.runtime_principals.len() != 14 {
            return Err(RoleRegistryError::RuntimePrincipalCount {
                actual: self.runtime_principals.len(),
            });
        }

        let mut principal_ids = BTreeSet::new();
        let mut role_assignments: BTreeMap<u8, &RuntimePrincipal> = BTreeMap::new();

        for principal in &self.runtime_principals {
            if !principal_ids.insert(principal.runtime_principal_id.as_str()) {
                return Err(RoleRegistryError::DuplicateRuntimePrincipal {
                    runtime_principal_id: principal.runtime_principal_id.clone(),
                });
            }

            for role_id in &principal.role_ids {
                if !(1..=Roster::SIZE).contains(role_id) {
                    return Err(RoleRegistryError::RuntimePrincipalOutOfRangeRole {
                        runtime_principal_id: principal.runtime_principal_id.clone(),
                        role_id: *role_id,
                    });
                }
                if role_assignments.insert(*role_id, principal).is_some() {
                    return Err(RoleRegistryError::DuplicateRuntimePrincipalRole {
                        role_id: *role_id,
                    });
                }
            }

            let Some((expected_boundary, expected_role_ids)) =
                expected_runtime_principal(&principal.runtime_principal_id)
            else {
                return Err(RoleRegistryError::UnknownRuntimePrincipal {
                    runtime_principal_id: principal.runtime_principal_id.clone(),
                });
            };
            let actual_role_ids: BTreeSet<u8> = principal.role_ids.iter().copied().collect();
            let expected_role_ids: BTreeSet<u8> = expected_role_ids.iter().copied().collect();
            if principal.source_access != expected_boundary || actual_role_ids != expected_role_ids
            {
                return Err(RoleRegistryError::RuntimePrincipalDefinition {
                    runtime_principal_id: principal.runtime_principal_id.clone(),
                });
            }
        }

        for role in &self.roles {
            let Some(principal) = role_assignments.get(&role.role_id) else {
                return Err(RoleRegistryError::MissingRuntimePrincipalRole {
                    role_id: role.role_id,
                });
            };
            if principal.runtime_principal_id != role.runtime_principal_id {
                return Err(RoleRegistryError::RuntimePrincipalMismatch {
                    role_id: role.role_id,
                    expected: role.runtime_principal_id.clone(),
                    actual: principal.runtime_principal_id.clone(),
                });
            }
            if principal.source_access != role.runtime_principal_boundary {
                return Err(RoleRegistryError::RuntimeBoundaryMismatch {
                    role_id: role.role_id,
                });
            }
        }

        Ok(())
    }

    fn validate_kai(&self) -> Result<(), RoleRegistryError> {
        if self.kai.role_id != AgentId::KAI.0
            || self.kai.card_id != "kai-customer-liaison"
            || self.kai.functional_role_id != "customer.draft-liaison"
            || self.kai.department_id != DepartmentId::Kai
            || self.kai.department_title != "Customer Liaison"
            || self.kai.head_role_id.is_some()
            || self.kai.reports_to != "human-operator"
            || self.kai.runtime_principal_id != "telegram-kai"
            || self.kai.runtime_principal_boundary != RuntimePrincipalBoundary::None
            || self.kai.codename != "Kai"
            || !same_action_class_set(&self.kai.action_classes, &[ActionClass::ADraftOnly])
            || self.kai.implementation_status != ImplementationStatus::PassiveSpecificationOutside47
        {
            return Err(RoleRegistryError::InvalidKai);
        }

        if self.roles.iter().any(|role| {
            role.card_id == self.kai.card_id
                || role.functional_role_id == self.kai.functional_role_id
        }) {
            return Err(RoleRegistryError::KaiIdentifierCollision);
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Copy)]
struct DepartmentSpec {
    id: DepartmentId,
    title: &'static str,
    range: &'static str,
    count: usize,
    head_role_id: u8,
    head_codename: &'static str,
}

const DEPARTMENT_SPECS: [DepartmentSpec; 5] = [
    DepartmentSpec {
        id: DepartmentId::L1,
        title: "Perception",
        range: "01-16",
        count: 16,
        head_role_id: 1,
        head_codename: "Kuranosuke",
    },
    DepartmentSpec {
        id: DepartmentId::L2,
        title: "Analysis",
        range: "17-25",
        count: 9,
        head_role_id: 17,
        head_codename: "Jūnai",
    },
    DepartmentSpec {
        id: DepartmentId::L3,
        title: "Decision",
        range: "26-35",
        count: 10,
        head_role_id: 26,
        head_codename: "Kihei",
    },
    DepartmentSpec {
        id: DepartmentId::L4,
        title: "Coordination",
        range: "36-43",
        count: 8,
        head_role_id: 36,
        head_codename: "Gengo",
    },
    DepartmentSpec {
        id: DepartmentId::L5,
        title: "Research",
        range: "44-47",
        count: 4,
        head_role_id: 44,
        head_codename: "Mimura",
    },
];

fn department_spec_for_role(role_id: u8) -> Option<DepartmentSpec> {
    let department_id = match AgentId(role_id).layer()? {
        Layer::Perception => DepartmentId::L1,
        Layer::Analysis => DepartmentId::L2,
        Layer::Decision => DepartmentId::L3,
        Layer::Coordination => DepartmentId::L4,
        Layer::Research => DepartmentId::L5,
        Layer::Chatbot => return None,
    };

    DEPARTMENT_SPECS
        .into_iter()
        .find(|spec| spec.id == department_id)
}

fn expected_department_actions(department: DepartmentId) -> &'static [ActionClass] {
    match department {
        DepartmentId::L1 | DepartmentId::L2 | DepartmentId::L5 => &[ActionClass::A],
        DepartmentId::L3 => &[ActionClass::A, ActionClass::BPlanOnly],
        DepartmentId::L4 => &[ActionClass::A, ActionClass::BCoordination],
        DepartmentId::Kai => &[],
    }
}

fn expected_role_actions(role_id: u8) -> &'static [ActionClass] {
    match AgentId(role_id).layer() {
        Some(Layer::Perception | Layer::Analysis | Layer::Research) => &[ActionClass::A],
        Some(Layer::Decision) => &[ActionClass::A, ActionClass::BPlanOnly],
        Some(Layer::Coordination) => match role_id {
            36 => &[ActionClass::A, ActionClass::BCoordination],
            37..=39 => &[
                ActionClass::A,
                ActionClass::BExactLease,
                ActionClass::CMakerChecker,
                ActionClass::DTicketedOnly,
            ],
            40..=41 => &[
                ActionClass::A,
                ActionClass::BExactLease,
                ActionClass::CMakerChecker,
            ],
            42 => &[
                ActionClass::A,
                ActionClass::BFixtureOnly,
                ActionClass::CMakerChecker,
            ],
            43 => &[
                ActionClass::A,
                ActionClass::BCoordination,
                ActionClass::DTicketedOnly,
            ],
            _ => &[],
        },
        Some(Layer::Chatbot) | None => &[],
    }
}

fn is_reporting_sentinel(reports_to: &str) -> bool {
    matches!(
        reports_to,
        "human-operator" | "requesting-operational-layer"
    )
}

fn expected_head_reports_to(role_id: u8) -> Option<&'static str> {
    match role_id {
        1 => Some("ronin-17-junai-lead-analyst"),
        17 => Some("ronin-26-kihei-decision-lead"),
        26 => Some("ronin-36-gengo-coordinator"),
        36 => Some("human-operator"),
        44 => Some("requesting-operational-layer"),
        _ => None,
    }
}

fn expected_runtime_principal(id: &str) -> Option<(RuntimePrincipalBoundary, &'static [u8])> {
    match id {
        "sirinx-rust-runtime" => Some((
            RuntimePrincipalBoundary::CompiledRuntimeOnly,
            &[1, 2, 3, 4, 17, 18, 19, 26, 36],
        )),
        "webmcp" => Some((RuntimePrincipalBoundary::ReadOnly, &[5, 6, 7, 45])),
        "claude-code" => Some((
            RuntimePrincipalBoundary::ReadOnly,
            &[8, 9, 10, 20, 21, 30, 31, 42],
        )),
        "claude-cowork" => Some((RuntimePrincipalBoundary::ReadOnly, &[11, 12, 32, 46])),
        "hermes" => Some((RuntimePrincipalBoundary::ReadOnly, &[13, 27, 28, 29, 35])),
        "manus" => Some((RuntimePrincipalBoundary::ReadOnly, &[14, 47])),
        "droid" => Some((RuntimePrincipalBoundary::ReadOnly, &[15])),
        "pi" => Some((RuntimePrincipalBoundary::ReadOnly, &[16])),
        "kimi-code" => Some((RuntimePrincipalBoundary::ReadOnly, &[22, 23, 44])),
        "codex" => Some((
            RuntimePrincipalBoundary::WriteWithExactPathLeaseForL4Only,
            &[24, 33, 34, 37, 38, 39],
        )),
        "copilot-cli" => Some((RuntimePrincipalBoundary::ReadOnly, &[25])),
        "opencode" => Some((
            RuntimePrincipalBoundary::ReadOnlyExceptExactArtifactJob,
            &[40],
        )),
        "antigravity2" => Some((RuntimePrincipalBoundary::CandidateOutputOnly, &[41])),
        "openclaw" => Some((RuntimePrincipalBoundary::NoRepoSourceWrite, &[43])),
        _ => None,
    }
}

fn same_action_class_set(actual: &[ActionClass], expected: &[ActionClass]) -> bool {
    let actual_set: BTreeSet<ActionClass> = actual.iter().copied().collect();
    let expected_set: BTreeSet<ActionClass> = expected.iter().copied().collect();
    actual_set.len() == actual.len()
        && expected_set.len() == expected.len()
        && actual_set == expected_set
}

fn require_nonblank(
    scope: &str,
    field: &'static str,
    value: &str,
) -> Result<(), RoleRegistryError> {
    if value.trim().is_empty() {
        return Err(RoleRegistryError::SchemaConstraint {
            scope: scope.to_owned(),
            field,
        });
    }
    Ok(())
}

fn require_unique_nonblank_strings(
    scope: &str,
    field: &'static str,
    values: &[String],
    minimum: usize,
) -> Result<(), RoleRegistryError> {
    let unique: BTreeSet<&str> = values.iter().map(String::as_str).collect();
    if values.len() < minimum
        || unique.len() != values.len()
        || values.iter().any(|value| value.trim().is_empty())
    {
        return Err(RoleRegistryError::SchemaConstraint {
            scope: scope.to_owned(),
            field,
        });
    }
    Ok(())
}

fn require_unique_actions(
    scope: &str,
    field: &'static str,
    values: &[ActionClass],
) -> Result<(), RoleRegistryError> {
    let unique: BTreeSet<ActionClass> = values.iter().copied().collect();
    if values.is_empty() || unique.len() != values.len() {
        return Err(RoleRegistryError::SchemaConstraint {
            scope: scope.to_owned(),
            field,
        });
    }
    Ok(())
}

fn validate_role_card_schema(role: &RoninRoleCard, is_kai: bool) -> Result<(), RoleRegistryError> {
    let scope = if is_kai {
        "kai".to_owned()
    } else {
        format!("role:{}", role.role_id)
    };

    if !is_kai && !valid_numbered_card_id(&role.card_id, role.role_id) {
        return Err(RoleRegistryError::RoleCardSyntax {
            role_id: role.role_id,
            card_id: role.card_id.clone(),
        });
    }
    if !valid_functional_role_id(&role.functional_role_id) {
        return Err(RoleRegistryError::FunctionalRoleIdSyntax {
            role_id: role.role_id,
            functional_role_id: role.functional_role_id.clone(),
        });
    }

    for (field, value) in [
        ("cardId", role.card_id.as_str()),
        ("functionalRoleId", role.functional_role_id.as_str()),
        ("departmentTitle", role.department_title.as_str()),
        ("codename", role.codename.as_str()),
        ("title", role.title.as_str()),
        ("mission", role.mission.as_str()),
        ("reportsTo", role.reports_to.as_str()),
        ("runtimePrincipalId", role.runtime_principal_id.as_str()),
        ("backgroundCadence", role.background_cadence.as_str()),
    ] {
        require_nonblank(&scope, field, value)?;
    }

    require_unique_actions(&scope, "actionClasses", &role.action_classes)?;
    require_unique_nonblank_strings(
        &scope,
        "responsibilities",
        &role.responsibilities,
        if is_kai { 1 } else { 2 },
    )?;
    require_unique_nonblank_strings(&scope, "allowedInputs", &role.allowed_inputs, 1)?;
    require_unique_nonblank_strings(&scope, "outputs", &role.outputs, 1)?;
    require_unique_nonblank_strings(&scope, "requiredEvidence", &role.required_evidence, 1)?;
    require_unique_nonblank_strings(&scope, "prohibitedActions", &role.prohibited_actions, 1)?;
    require_unique_nonblank_strings(&scope, "escalation", &role.escalation, 1)?;
    require_unique_nonblank_strings(&scope, "sourceRefs", &role.source_refs, 1)?;
    Ok(())
}

fn valid_numbered_card_id(value: &str, role_id: u8) -> bool {
    let Some(rest) = value.strip_prefix("ronin-") else {
        return false;
    };
    let Some((number, suffix)) = rest.split_once('-') else {
        return false;
    };
    if number.len() != 2 || !number.bytes().all(|byte| byte.is_ascii_digit()) {
        return false;
    }
    let Ok(parsed_role_id) = number.parse::<u8>() else {
        return false;
    };
    parsed_role_id == role_id && valid_segmented_identifier(suffix, &['-'])
}

fn valid_functional_role_id(value: &str) -> bool {
    valid_segmented_identifier(value, &['.', '-'])
}

fn valid_segmented_identifier(value: &str, separators: &[char]) -> bool {
    let mut segment_is_empty = true;
    for character in value.chars() {
        if separators.contains(&character) {
            if segment_is_empty {
                return false;
            }
            segment_is_empty = true;
        } else if character.is_ascii_lowercase() || character.is_ascii_digit() {
            segment_is_empty = false;
        } else {
            return false;
        }
    }
    !segment_is_empty
}

/// Fail-closed role-registry validation errors.
#[derive(Debug, Error)]
pub enum RoleRegistryError {
    #[error("role registry JSON is invalid: {0}")]
    Json(#[from] serde_json::Error),
    #[error("registryId must remain {EXPECTED_REGISTRY_ID}, found {actual}")]
    RegistryId { actual: String },
    #[error("registryVersion must remain {EXPECTED_REGISTRY_VERSION}, found {actual}")]
    RegistryVersion { actual: String },
    #[error("role registry status must remain passive-specification")]
    NonPassiveStatus,
    #[error("passive role registry must not be executable")]
    ExecutableRegistry,
    #[error("role registry worker cap must be exactly 3, found {actual}")]
    WorkerCap { actual: usize },
    #[error("role registry must not enable external actions")]
    ExternalActionsEnabled,
    #[error("Postgres must remain the sole durable registry authority")]
    DurableStateAuthority,
    #[error("registry authority contract drifted at {field}")]
    AuthorityContract { field: &'static str },
    #[error("registry lane policy drifted from the exact three-lane contract")]
    LanePolicy,
    #[error("schema constraint failed for {scope}.{field}")]
    SchemaConstraint { scope: String, field: &'static str },
    #[error("role registry must contain exactly 47 numbered roles, found {actual}")]
    RoleCount { actual: usize },
    #[error("role id {role_id} is outside the authoritative 1-47 range")]
    OutOfRangeRoleId { role_id: u8 },
    #[error("duplicate role id {role_id}")]
    DuplicateRoleId { role_id: u8 },
    #[error("missing role id {role_id}")]
    MissingRoleId { role_id: u8 },
    #[error("duplicate role card id {card_id}")]
    DuplicateCardId { card_id: String },
    #[error("duplicate functional role id {functional_role_id}")]
    DuplicateFunctionalRoleId { functional_role_id: String },
    #[error("role {role_id} has malformed card id {card_id}")]
    RoleCardSyntax { role_id: u8, card_id: String },
    #[error("role {role_id} has malformed functional role id {functional_role_id}")]
    FunctionalRoleIdSyntax {
        role_id: u8,
        functional_role_id: String,
    },
    #[error("registry must contain exactly 5 department definitions, found {actual}")]
    DepartmentCount { actual: usize },
    #[error("duplicate department definition for {department:?}")]
    DuplicateDepartment { department: DepartmentId },
    #[error("missing department definition for {department:?}")]
    MissingDepartment { department: DepartmentId },
    #[error("department definition drifted for {department:?}")]
    DepartmentDefinition { department: DepartmentId },
    #[error("role {role_id} department drift: expected {expected:?}, found {actual:?}")]
    RoleDepartment {
        role_id: u8,
        expected: DepartmentId,
        actual: DepartmentId,
    },
    #[error("role {role_id} action classes drifted from its passive authority")]
    RoleActionClasses { role_id: u8 },
    #[error("role {role_id} codename drift: expected {expected}, found {actual}")]
    RosterCodename {
        role_id: u8,
        expected: String,
        actual: String,
    },
    #[error("role {role_id} cannot use Kai's outside-47 implementation status")]
    OutsideStatusOnRonin { role_id: u8 },
    #[error("implemented role set drifted: expected {expected:?}, found {actual:?}")]
    ImplementedRoleSet {
        expected: BTreeSet<u8>,
        actual: BTreeSet<u8>,
    },
    #[error("role {role_id} reports to unresolved target {reports_to}")]
    UnresolvedReportsTo { role_id: u8, reports_to: String },
    #[error("department head role {role_id} has invalid reportsTo target {reports_to}")]
    HeadReportsTo { role_id: u8, reports_to: String },
    #[error("role {role_id} must report to {expected}, found {actual}")]
    MemberReportsTo {
        role_id: u8,
        expected: String,
        actual: String,
    },
    #[error("registry must contain exactly 14 runtime principals, found {actual}")]
    RuntimePrincipalCount { actual: usize },
    #[error("duplicate runtime principal id {runtime_principal_id}")]
    DuplicateRuntimePrincipal { runtime_principal_id: String },
    #[error("unknown runtime principal id {runtime_principal_id}")]
    UnknownRuntimePrincipal { runtime_principal_id: String },
    #[error("runtime principal definition drifted for {runtime_principal_id}")]
    RuntimePrincipalDefinition { runtime_principal_id: String },
    #[error("runtime principal {runtime_principal_id} maps out-of-range role {role_id}")]
    RuntimePrincipalOutOfRangeRole {
        runtime_principal_id: String,
        role_id: u8,
    },
    #[error("role {role_id} is mapped by more than one runtime principal")]
    DuplicateRuntimePrincipalRole { role_id: u8 },
    #[error("role {role_id} has no runtime-principal mapping")]
    MissingRuntimePrincipalRole { role_id: u8 },
    #[error("role {role_id} runtime principal drift: expected {expected}, found {actual}")]
    RuntimePrincipalMismatch {
        role_id: u8,
        expected: String,
        actual: String,
    },
    #[error("role {role_id} runtime-principal boundary does not match its principal")]
    RuntimeBoundaryMismatch { role_id: u8 },
    #[error("Kai must remain id 0, draft-only, headless, and outside the 47-role registry")]
    InvalidKai,
    #[error("Kai identifiers must not collide with a numbered Ronin")]
    KaiIdentifierCollision,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parsed_registry() -> RoninRoleRegistry {
        match RoninRoleRegistry::from_json(EMBEDDED_ROLE_REGISTRY_JSON) {
            Ok(registry) => registry,
            Err(error) => panic!("embedded role registry must validate: {error}"),
        }
    }

    #[test]
    fn embedded_registry_has_47_ronin_and_kai() {
        let registry = parsed_registry();

        assert_eq!(registry.roles().len(), 47);
        assert_eq!(
            registry.role(AgentId(1)).map(|role| role.codename.as_str()),
            Some("Kuranosuke")
        );
        assert_eq!(
            registry
                .role(AgentId(47))
                .map(|role| role.codename.as_str()),
            Some("Terasaka")
        );
        assert_eq!(
            registry
                .role(AgentId::KAI)
                .map(|role| role.codename.as_str()),
            Some("Kai")
        );
        assert!(registry.role(AgentId(48)).is_none());
    }

    #[test]
    fn embedded_registry_exposes_runtime_principal_lookup() {
        let registry = parsed_registry();
        let principal = registry.runtime_principal("sirinx-rust-runtime");

        assert_eq!(
            principal.map(|entry| entry.role_ids.as_slice()),
            Some(EXPECTED_IMPLEMENTED_ROLE_IDS.as_slice())
        );
    }

    #[test]
    fn embedded_registry_round_trips_without_semantic_drift() {
        let registry = parsed_registry();
        let source: serde_json::Value = match serde_json::from_str(EMBEDDED_ROLE_REGISTRY_JSON) {
            Ok(value) => value,
            Err(error) => panic!("embedded role registry must be valid JSON: {error}"),
        };
        let projected = match serde_json::to_value(&registry.raw) {
            Ok(value) => value,
            Err(error) => panic!("typed role registry must serialize: {error}"),
        };

        assert_eq!(projected, source);
    }

    #[test]
    fn executable_registry_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.executable = true;

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::ExecutableRegistry)
        ));
    }

    #[test]
    fn worker_cap_drift_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.authority.max_concurrent_workers = 4;

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::WorkerCap { actual: 4 })
        ));
    }

    #[test]
    fn registry_id_drift_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.registry_id = "other-registry".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::RegistryId { .. })
        ));
    }

    #[test]
    fn registry_version_drift_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.registry_version = "2.0.0".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::RegistryVersion { .. })
        ));
    }

    #[test]
    fn external_actions_are_rejected() {
        let mut registry = parsed_registry();
        registry.raw.authority.external_actions = true;

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::ExternalActionsEnabled)
        ));
    }

    #[test]
    fn contradictory_authority_text_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.authority.external_action_policy =
            "External actions are implicitly allowed.".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::AuthorityContract {
                field: "externalActionPolicy"
            })
        ));
    }

    #[test]
    fn empty_required_evidence_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[0].required_evidence.clear();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::SchemaConstraint {
                field: "requiredEvidence",
                ..
            })
        ));
    }

    #[test]
    fn duplicate_role_id_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[1].role_id = 1;
        registry.raw.roles[1].card_id = "ronin-01-fb-group-scanner".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::DuplicateRoleId { role_id: 1 })
        ));
    }

    #[test]
    fn card_id_prefix_drift_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[0].card_id = "ronin-02-kuranosuke-intake".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::RoleCardSyntax { role_id: 1, .. })
        ));
    }

    #[test]
    fn malformed_card_suffix_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[0].card_id = "ronin-01-Bad_suffix".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::RoleCardSyntax { role_id: 1, .. })
        ));
    }

    #[test]
    fn malformed_functional_role_id_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[0].functional_role_id = "intake..normalizer".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::FunctionalRoleIdSyntax { role_id: 1, .. })
        ));
    }

    #[test]
    fn documented_roster_codename_drift_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[16].codename = "Not-Jūnai".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::RosterCodename { role_id: 17, .. })
        ));
    }

    #[test]
    fn ascii_roster_codename_aliases_are_rejected() {
        for (index, role_id, ascii_codename) in [(16, 17, "Junai"), (24, 25, "Jurozaemon")] {
            let mut registry = parsed_registry();
            registry.raw.roles[index].codename = ascii_codename.to_owned();

            assert!(matches!(
                registry.validate(),
                Err(RoleRegistryError::RosterCodename {
                    role_id: actual_role_id,
                    ..
                }) if actual_role_id == role_id
            ));
        }
    }

    #[test]
    fn action_class_order_is_not_semantic() {
        let mut registry = parsed_registry();
        registry.raw.roles[25].action_classes.reverse();

        assert!(registry.validate().is_ok());
    }

    #[test]
    fn duplicate_department_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.departments[1].department_id = DepartmentId::L1;

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::DuplicateDepartment {
                department: DepartmentId::L1
            })
        ));
    }

    #[test]
    fn missing_department_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.departments[4].department_id = DepartmentId::Kai;

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::MissingDepartment {
                department: DepartmentId::L5
            })
        ));
    }

    #[test]
    fn wrong_role_department_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[1].department_id = DepartmentId::L2;

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::RoleDepartment { role_id: 2, .. })
        ));
    }

    #[test]
    fn member_reporting_outside_department_head_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[1].reports_to = "ronin-17-junai-lead-analyst".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::MemberReportsTo { role_id: 2, .. })
        ));
    }

    #[test]
    fn unresolved_reporting_target_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[1].reports_to = "ronin-99-unknown".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::UnresolvedReportsTo { role_id: 2, .. })
        ));
    }

    #[test]
    fn principal_mapping_mismatch_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[0].runtime_principal_id = "codex".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::RuntimePrincipalMismatch { role_id: 1, .. })
        ));
    }

    #[test]
    fn principal_partition_drift_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.runtime_principals[0].role_ids.pop();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::RuntimePrincipalDefinition { .. })
        ));
    }

    #[test]
    fn codex_role_boundary_drift_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[36].runtime_principal_boundary = RuntimePrincipalBoundary::ReadOnly;

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::RuntimeBoundaryMismatch { role_id: 37 })
        ));
    }

    #[test]
    fn unknown_runtime_principal_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.runtime_principals[0].runtime_principal_id = "unknown".to_owned();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::UnknownRuntimePrincipal { .. })
        ));
    }

    #[test]
    fn out_of_range_runtime_principal_role_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.runtime_principals[0].role_ids[0] = 48;

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::RuntimePrincipalOutOfRangeRole { role_id: 48, .. })
        ));
    }

    #[test]
    fn implemented_role_set_drift_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[0].implementation_status =
            ImplementationStatus::PassiveSpecificationRuntimePrincipalMapped;

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::ImplementedRoleSet { .. })
        ));
    }

    #[test]
    fn kai_joining_the_numbered_roster_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.kai.role_id = 1;

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::InvalidKai)
        ));
    }

    #[test]
    fn kai_functional_identifier_collision_is_rejected() {
        let mut registry = parsed_registry();
        registry.raw.roles[0].functional_role_id = registry.raw.kai.functional_role_id.clone();

        assert!(matches!(
            registry.validate(),
            Err(RoleRegistryError::KaiIdentifierCollision)
        ));
    }

    #[test]
    fn unknown_json_fields_are_rejected() {
        let invalid = EMBEDDED_ROLE_REGISTRY_JSON.replacen(
            "\"registryId\"",
            "\"unexpectedAuthority\": true, \"registryId\"",
            1,
        );

        assert!(matches!(
            RoninRoleRegistry::from_json(&invalid),
            Err(RoleRegistryError::Json(_))
        ));
    }
}
