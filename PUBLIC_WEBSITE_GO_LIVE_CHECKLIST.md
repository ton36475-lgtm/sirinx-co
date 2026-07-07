# Public Website Go-Live Checklist

Status: planned for PR-MONO-002 and later.

## Canonical Domain

```text
https://www.sirinx.co
```

## Public Site Rules

- No internal dashboard controls.
- No `dev.sirinx.co` links unless clearly hidden from public navigation and approved.
- No localhost or `127.0.0.1`.
- No bearer tokens, API keys, Supabase service role keys, Cloudflare tokens, or Telegram/LINE tokens.
- No source-code dump endpoints.
- No guaranteed ROI, savings, revenue, no-ban, bypass, fake-proof, or zero-downtime claims.
- Lead forms require safe backend route, CORS, rate limit, and spam protection before production.

## Gate Checklist

- Static leak scan passes.
- Browser smoke test passes desktop and mobile.
- Public content reviewed for claim safety.
- Apex redirect plan reviewed.
- Cloudflare Pages preview reviewed.
- Rollback path documented.

## Sources For PR-MONO-002

- Current `public/index.html` in this repo.
- `sirinx` public web assets after quarantine.
- `sirinx-solar-energy` public/solar assets after quarantine.

No bulk copy.
