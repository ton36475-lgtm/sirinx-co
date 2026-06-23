# Ledger Runtime Status Manifest

Status: local-only runtime status bridge

## Purpose

`scripts/igaming_practice/run_ledger_kata_status.py` runs the sandbox
`@sirinx/ledger-kata` test suite and writes a machine-readable status manifest
outside git.

This lets Mission Control or a future localhost backend show real test status
without connecting to a live payment provider, real Supabase project, public
endpoint, or service-role key.

## Runtime Output

Runtime root:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/igaming_practice/ledger-kata-status
```

Generated files:

```text
ledger_test_status.json
ledger_test_status.md
ledger_test_output.txt
```

## JSON Shape

```json
{
  "schema_version": 1,
  "generated_at": "2026-06-24T03:00:00+07:00",
  "mode": "SANDBOX_ONLY",
  "package": "@sirinx/ledger-kata",
  "command": ["pnpm", "--filter", "@sirinx/ledger-kata", "test"],
  "result": {
    "status": "passing",
    "tests_passed": 6,
    "tests_total": 6,
    "tests_failed": 0,
    "test_files_passed": 1,
    "test_files_total": 1
  },
  "blocked_actions": [
    "real_money_gambling",
    "live_payment_provider",
    "service_role_key_display",
    "public_endpoint",
    "supabase_live_migration"
  ]
}
```

## Local Command

```bash
python3 scripts/igaming_practice/run_ledger_kata_status.py
```

## Boundary

- No real-money gambling flow.
- No live payment provider call.
- No Supabase migration or mutation.
- No service-role key read or printed.
- No public endpoint opened.

## Next Integration Step

Add a localhost-only status bridge that reads `ledger_test_status.json` and
serves it to Mission Control. Keep the bridge loopback-only and read-only.
