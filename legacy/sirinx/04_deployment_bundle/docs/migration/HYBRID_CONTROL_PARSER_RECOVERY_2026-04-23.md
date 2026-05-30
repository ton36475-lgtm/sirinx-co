# Hybrid Control Parser Recovery - 2026-04-23

## Confirmed Bug

`scripts/hybrid_website_control.ps1` failed to parse when executed through Windows PowerShell 5.1 using:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\hybrid_website_control.ps1 -Mode continue-safe
```

The failure happened before the controller could audit or recover anything.

## Root Cause

The script contained non-ASCII Thai string literals inside regex patterns. The active terminal could display them correctly, but Windows PowerShell 5.1 interpreted the UTF-8 file through a legacy code page when launched as `powershell.exe -File`, producing mojibake and parser errors.

## Implemented Fix

- Removed non-ASCII string literals from `scripts/hybrid_website_control.ps1`.
- Centralized wrong-brand detection in `Test-KnownWrongBrandContent`.
- Kept the hybrid control script ASCII-only for parser safety.
- Added a regression guard in `scripts/test_hybrid_website_control.ps1` that fails if non-ASCII characters return to the hybrid controller.

## Regression Test

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\test_hybrid_website_control.ps1
```

Result:

```text
HYBRID_CONTROL_SMOKE_OK
```

## Validation After Fix

- `scripts/hybrid_website_control.ps1 -Mode continue-safe`: passed.
- OpenClaw gateway owner: one Windows process.
- Ubuntu PM2 apps: `Zenith-Sentinel` and `Zenith-Cognitive`.
- SIRINX local website: HTTP 200, SIRINX brand confirmed, wrong-brand content not detected.
- SIRINX app validation inside controller: check/test/build passed.
- Route smoke: `/`, `/contact`, and `/assessment` returned SIRINX content.
- Docker compose config: passed.
- Docker build: passed for `sirinx-public:local`.
- Docker runtime smoke on port `3010`: HTTP 200, SIRINX brand found, wrong-brand content not found.

## Evidence

- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\artifacts\control-plane\HYBRID_CONTINUE_SAFE-25690423-071631.log` records the failing parser run.
- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\artifacts\control-plane\HYBRID_CONTINUE_SAFE-25690423-072145.log` records the successful recovery run.
- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\artifacts\control-plane\SIRINX_ROUTE_SMOKE-25690423-072409.json` records route-level brand smoke.
- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx\artifacts\deploy-handshake\docker-compose-config-latest.log` records rendered compose config.
- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx\artifacts\deploy-handshake\docker-build-sirinx-public-latest.log` records the Docker image build.
- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx\artifacts\deploy-handshake\docker-smoke-latest.log` records the runtime smoke result.

## Rule Or Pattern Update

Hybrid control scripts must stay ASCII-only unless they are explicitly encoded and validated under Windows PowerShell 5.1. This rule was added to:

- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\AGENTS.md`
- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx\.windsurfrules`
- `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx\.cursorrules`

## Rollback Note

If this parser-safety change causes an unexpected regression, roll back only the small changes in:

- `scripts/hybrid_website_control.ps1`
- `scripts/test_hybrid_website_control.ps1`
- the related rule notes listed above

Do not roll back unrelated SIRINX app recovery or Docker artifacts.

## Audit Trail Note

This change affects the local recovery controller, not public DNS, TLS, production secrets, or server traffic. It is safe for local recovery validation but still requires human review before being treated as production runbook policy.

## Future Prevention

When recovery scripts must be called by both PowerShell 7 and Windows PowerShell 5.1, keep executable script text ASCII-only and place localized human-readable text in Markdown docs or generated reports instead of parser-sensitive string literals.
