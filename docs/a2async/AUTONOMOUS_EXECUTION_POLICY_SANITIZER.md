# Autonomous Execution Policy Sanitizer

Status: local-only policy sanitizer.

The sanitizer converts broad `autonomous_execution` requests into broker
decisions. It never applies `security_controls: none`, never approves every
action, and never executes a tool.

## Purpose

Use this when a request mixes safe automation work with dangerous action
classes. The sanitizer preserves local productivity while proving that hard
blocks stay hard-blocked.

Safe examples can become `auto_allow_dry_run`:

- `read_repository_files`
- `inspect_architecture`
- `run_lint`
- `run_unit_tests`
- `generate_docs`
- `code_review_dry_run`
- `code_review_report`
- `diff_review`
- `security_review_plan`
- `update_markdown`
- `create_test_files`
- `simulate_deploy_plan`

Repo-affecting examples become `requires_executor_lease`:

- `create_non_destructive_patches`
- `propose_refactors`
- `scoped_repo_edit`

Dangerous examples become `blocked`:

- `access_secrets`
- `read_or_export_user_data`
- `modify_authentication`
- `modify_authorization`
- `change_payment_logic`
- `change_security_policy`
- `install_new_dependencies`
- `run_unknown_scripts`
- `database_migration`
- `delete_or_overwrite_files`
- `production_deploy`
- `external_api_write_actions`
- `disable_logging`
- `disable_monitoring`
- `bypass_access_control`
- `bypass_rate_limits`
- `exfiltrate_credentials`
- `approve_all_actions`
- `modify_audit_trail`
- `hide_execution_history`

## Command

Run the built-in policy stress sample:

```bash
python3 scripts/a2a/a2a_autonomous_policy_sanitizer.py --use-default-sample
```

Or pass a YAML-like file. Only list item names are parsed; raw config is not
copied into the runtime report.

```bash
python3 scripts/a2a/a2a_autonomous_policy_sanitizer.py --input request.yaml
```

## Outputs

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/autonomous_execution_policy_sanitizer.json
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/autonomous_execution_policy_sanitizer.md
apps/mission-control/src/fixtures/autonomousExecutionPolicyStatus.json
```

Mission Control reads the fixture in the `Goal Plan` tab. Browser code does not
run the sanitizer and cannot execute the classified actions.

## Acceptance Criteria

- Safe local actions are dry-run only.
- Repo-affecting patch/refactor actions require executor lease and lane lock.
- Secret access, export, auth/payment/security mutation, destructive changes,
  deploy, external writes, logging/monitoring disablement, access-control
  bypass, credential exfiltration, audit tampering, and hidden history are
  blocked.
- The sanitizer writes local evidence and leaves live execution untouched.
