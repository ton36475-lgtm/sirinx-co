# Technology stack extracted from public repository manifests

Read 125 public package/build manifests and package-manager/config presence records from the 24 public repositories. Versioned dependency lockfile contents were not expanded. No source code was changed.

| Repository | Manifest/config files read | Detected direct stack signals | Fetch failures |
|---|---:|---|---:|
| `ton36475-lgtm/3d-portfolio-codex` | 2 | react, react-dom, vite, three | 0 |
| `ton36475-lgtm/3d-portfolio-drive` | 2 | react, react-dom, vite, typescript, three | 0 |
| `ton36475-lgtm/3d-portfolio-production` | 3 | react, react-dom, vite, typescript, three, tailwindcss, playwright, zod, pg, npm | 0 |
| `ton36475-lgtm/3dcarRealwordportfolio` | 3 | react, react-dom, vite, typescript, three, tailwindcss, playwright, zod, pg, npm | 0 |
| `ton36475-lgtm/automated-marketing-agency` | 2 | react, react-dom, vite, typescript, express, drizzle-orm, tailwindcss, zod | 0 |
| `ton36475-lgtm/automation-dashboard` | 3 | next, react, react-dom, typescript, tailwindcss, npm | 0 |
| `ton36475-lgtm/automation-documentation` | 0 | manifest data unavailable | 0 |
| `ton36475-lgtm/automation-mobile-app` | 3 | react, react-dom, typescript, express, drizzle-orm, expo, react-native, tailwindcss, zod, pnpm | 0 |
| `ton36475-lgtm/automation-system-backend` | 2 | next, react, react-dom, typescript, express, tailwindcss, zod, pg | 0 |
| `ton36475-lgtm/chokma-growth-os` | 3 | react, react-dom, vite, typescript, express, drizzle-orm, tailwindcss, zod, pnpm | 0 |
| `ton36475-lgtm/driveto3dworld` | 3 | react, react-dom, vite, typescript, three, tailwindcss, playwright, zod, pg, npm | 0 |
| `ton36475-lgtm/ghost-claw-os` | 7 | yarn | 0 |
| `ton36475-lgtm/new3dport` | 3 | react, react-dom, vite, typescript, three, tailwindcss, playwright, zod, pg, npm | 0 |
| `ton36475-lgtm/oz-corp-omega-dual-node` | 10 | next, react, react-dom, typescript, @supabase/supabase-js, tailwindcss, wrangler, pnpm, npm | 0 |
| `ton36475-lgtm/oz_mobile_app` | 14 | react, react-dom, typescript, express, drizzle-orm, expo, react-native, tailwindcss, zod, pnpm | 0 |
| `ton36475-lgtm/sirinx` | 5 | react, react-dom, vite, typescript, express, drizzle-orm, tailwindcss, zod, pnpm | 0 |
| `ton36475-lgtm/sirinx-co` | 25 | next, react, react-dom, vite, typescript, three, express, drizzle-orm, tailwindcss, wrangler, zod, pnpm, npm | 0 |
| `ton36475-lgtm/sirinx-godmode` | 0 | manifest data unavailable | 0 |
| `ton36475-lgtm/sirinx-os` | 14 | next, react, react-dom, typescript, tailwindcss, wrangler, pnpm | 0 |
| `ton36475-lgtm/sirinx-secret-recon` | 0 | Python | 0 |
| `ton36475-lgtm/sirinx-skills-kit` | 1 | JavaScript | 0 |
| `ton36475-lgtm/sirinx-solar-energy` | 18 | next, react, react-dom, vite, typescript, @supabase/supabase-js, tailwindcss, zod | 0 |
| `ton36475-lgtm/sirinx-sovereign-swarm` | 1 | JavaScript | 0 |
| `ton36475-lgtm/unknowcoding-newbie-dev-skill` | 1 | JavaScript | 0 |

## Scope notes

- The stack list is inferred from current public manifests on each repository default branch; it is not a deployment/runtime verification.
- Subproject manifests are listed separately so monorepo packages may have different frameworks.
- No `.env` file values, secrets, tokens, API credentials, production endpoints or private source were collected.
