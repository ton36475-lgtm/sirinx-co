Read `../AGENTS.md` first.

Scope: public revenue plane UI and internal admin UI.

Rules:
- preserve SIRINX premium, engineering-first tone
- public pages stay SIRINX-only
- `ops.sirinx.co` visuals stay internal-only and premium graphite/gold
- no cartoon, anime, gacha, casino, lottery, or gambling aesthetics
- lazy load non-critical UI
- prefer small components and reviewable diffs
- do not add heavy runtime dependencies without a clear need and validation

Validation:
- `corepack pnpm run check`
- `corepack pnpm run test`
- `corepack pnpm run build`
