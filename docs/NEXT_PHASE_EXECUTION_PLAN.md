# Next Phase Execution Plan

Status: gated.

## Phase Order

1. Pipeline audit and repair.
2. GitHub auth and branch push.
3. Draft PR creation.
4. Public website import plan.
5. Public website static leak scan and browser QA.
6. Cloudflare preview for `www.sirinx.co`.
7. Confirmed Cloudflare write gate.
8. Supabase schema/mirror planning.
9. Notion/ClickUp/Google Drive/Figma documentation tasks after connector confirmation.
10. AdaptiveSync Drive D dry-run after Windows share mount.
11. Telegram command lane after token/chat id setup.

## Current Gates

| Gate | Status | Reason |
| --- | --- | --- |
| Local pipeline | active | `npm run pipeline:audit` |
| GitHub push | blocked | `gh auth login` needed |
| Cloudflare write | blocked | origin cert/login and explicit route preview needed |
| Windows Drive D | blocked | not mounted on Mac |
| Telegram real send | blocked | no token/chat id and no action-time approval |
| Supabase writes | blocked | no project confirmation and no RLS migration approval |
| Notion/ClickUp/Drive/Figma writes | blocked | create/update previews must be approved first |

## Tool Lanes

- GitHub: push branch and draft PR after auth.
- Cloudflare: preview DNS/Pages/Access first, write only after confirmed gate.
- Supabase: migration files and RLS plan first, database write only after confirmation.
- Notion/ClickUp/Google Drive/Figma: documentation/design mirrors only after preview.
- Chrome/Browser/Computer Use: QA and visual verification, not account mutation without confirmation.

## Next Safe Step

Run:

```bash
npm run pipeline:audit
```

Then resolve blockers in this order:

1. `gh auth login`
2. push PR branches
3. mount Windows Drive D
4. configure Cloudflare origin cert
5. configure Telegram token/chat id outside Git
