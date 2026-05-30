Read `../AGENTS.md` first.

Scope: Express, tRPC, runtime contracts, auth, queue-safe internal services.

Rules:
- no raw shell endpoints
- no direct hardware write paths
- no production secrets in code or tests
- treat telemetry and ROI as structured data, not marketing claims
- keep control-plane and execution-plane boundaries explicit
- prefer read-only defaults for ops integrations
- keep Database Steward and Mentor/Apprentice logic as packet-driven support lanes, not public API roles
- if a route or service references brain-skill bootstrap or DB preflight, it must remain internal-only and validator-gated

Validation:
- `corepack pnpm run check`
- `corepack pnpm run test`
