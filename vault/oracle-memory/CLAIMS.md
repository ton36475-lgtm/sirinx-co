# Claims

Status: LOCAL ONLY

Claims extracted from conversations, screenshots, documents, local files, and
operator instructions belong here before promotion.

## Intake Seed - 2026-06-05

- SIRINXDev should add Oracle Provenance Layer.
- SIRINXDev should add Codex Product Design Layer.
- The system remains local-only until Part 8 approval.
- Prototype is not production.
- Spec comes before code.
- PROVEN requires an evidence chain.
- Mission Control should include a Git Evidence Review Panel that links local
  diffs to timeline events, evidence packet placeholders, and approval status.
- After explicit `APPROVE_IMPLEMENTATION`, the Git Evidence Review Panel was
  implemented locally in Mission Control as a UI-only review surface.
- The 2026-06-05 continuation pass consolidated old pending work into a local
  board and generated ADS ANDROMEDA batch 02 artifacts without live publish.
- The lane `P0-ADS-ANDROMEDA-BATCH02-QC-EVIDENCE` created a local evidence
  packet for EP006-EP010 and classified copy as `APPROVED_LOCAL_DRAFT`.
- ADS ANDROMEDA batch 02 video QC remains `NEEDS_VISUAL_EDIT` until rendered
  visual/video assets are generated or imported for local review.
- The lane `P0-ADS-ANDROMEDA-BATCH02-MANUAL-POST-PREP` created a local
  human-review-only packet for EP006-EP010 with exact captions, schedule table,
  operator checklist, stop gate, file tree, and checksums.
- ADS ANDROMEDA batch 02 manual post prep did not perform Facebook API calls,
  live posting, provider calls, Telegram sends, deploys, pushes, installs, or
  external mutation.
- Claw-Empire was cloned and isolated-installed locally under
  `tools/repo-intake/2026-06-05/claw-empire`.
- Claw-Empire production build passed after installing dependencies with
  `--ignore-workspace` and `--ignore-scripts`.
- Claw-Empire does not expose a direct `hermes` provider in the scanned source,
  so Hermes integration should use a local adapter contract rather than
  overwriting Hermes live gateway configuration.
- The operator reports that OpenCode with `deepseek-v4-flash-free` produced
  good Thai long-form story output and story-to-website drafts.
- Local CLI detection did not find `opencode` in `PATH`, so Hermes cannot route
  to OpenCode on this Mac until OpenCode is installed or located.
- `deepseek-v4-flash-free` should be treated as a candidate low-risk creative
  worker lane only until model availability, terms, and smoke-test quality are
  verified.
- OpenAI's Wasmer case study supports Codex-assisted low-level runtime work as
  a practical strategy for small teams, specifically the Node.js-on-Wasm edge
  runtime case.
- Wasmer's architecture docs support Rust/Wasm as a sandboxed, small-footprint,
  fast-start runtime direction, but this does not imply all SIRINX packages
  should be rewritten in Rust.
- The Django-to-Rust performance metrics in the operator screenshot remain
  unverified until linked to durable source and benchmark context.
- SIRINX should consider `packages/evidence-hasher` as the first bounded
  Rust/Wasm pilot because it has simple inputs, deterministic output, and local
  verification boundaries.
- `APPROVE_RUST_WASM_EVIDENCE_HASHER_SPEC_LOCAL_ONLY` approved specification
  work only; the Rust/Wasm evidence-hasher prototype still requires a separate
  prototype approval.
- The Rust/Wasm evidence-hasher spec defines SHA-256-first deterministic
  manifests, manifest verification, local-only security constraints, and a
  schema contract at `schemas/evidence-hash-manifest.schema.json`.
- Old pending work can proceed in parallel only through safe lanes documented in
  `docs/repo-intake/2026-06-05-parallel-work-coordination.md`.
- `APPROVE_ADS_ANDROMEDA_BATCH02_VISUAL_ASSET_QC_LOCAL_ONLY` approved local
  visual readiness review only, not provider generation, rendering, Facebook
  posting, Telegram sending, deploy, push, install, or external mutation.
- ADS ANDROMEDA batch 02 EP006-EP010 image prompts are ready and aligned with
  local avatar/design/motion standards, but rendered image/video assets are not
  present yet.
- Future SIRINXDev executable internal tooling should prefer Rust first when it
  is practical, while existing frontend, documentation, schema, CSS, static
  config, and ecosystem-specific integration layers may remain in their
  appropriate languages.
- On 2026-06-06, GitHub Trending first-page intake captured 17 repositories
  from `https://github.com/trending` into a local manifest and triage matrix.
- Bulk installing all GitHub Trending repositories is blocked because it would
  execute unreviewed third-party dependency managers and lifecycle scripts
  across multiple ecosystems.
- The safe next gate for GitHub Trending is read-only clone intake, not package
  installation.
- After `APPROVE_GITHUB_TRENDING_CLONE_READONLY_2026_06_06`, all 17 captured
  GitHub Trending repositories were cloned read-only under
  `tools/repo-intake/2026-06-06/github-trending-first-page`.
- GitHub Trending read-only clone used shallow partial clone and did not run
  package installation, lifecycle scripts, setup scripts, servers, Docker,
  providers, deploy, push, or external mutation.
- The next safe GitHub Trending gate is security/script triage followed by
  per-repo install packets.
- After `APPROVE_GITHUB_TRENDING_SECURITY_TRIAGE_LOCAL_ONLY`, static read-only
  triage generated a per-repo risk matrix for all 17 cloned GitHub Trending
  repositories.
- GitHub Trending bulk install remains blocked after triage; all non-Headroom
  repositories remain blocked pending per-repo approval.
- `chopratejas/headroom` was selected as the first install candidate because it
  fits the Rust-first and token-compression lane better than the rest of the
  cloned first-page set.
- After `APPROVE_INSTALL_GITHUB_TRENDING_HEADROOM_LOCAL_ONLY`, Headroom was
  installed into isolated venv
  `tools/repo-intake/2026-06-06/venvs/headroom`.
- Headroom local verification passed for CLI version/help, Python import,
  Rust-backed `SmartCrusher`, `pip check`, and a provider-free compression
  smoke that saved 4,787 tokens.
- Headroom proxy, wrap, init, install, MCP server, Hermes/Codex/OpenClaw config
  mutation, provider calls, deploy, push, and external mutation remain blocked.
- TestSprite MCP validation should be treated as a missing enforcement layer
  between Codex/Hermes code generation and Part 8 approval.
- `APPROVE_TESTSPRITE_MCP_SPEC_LOCAL_ONLY` approved only local spec work, not
  MCP installation, API key setup, cloud sandbox execution, provider calls, or
  live config mutation.
- The TestSprite MCP config example uses placeholder `API_KEY` and must not be
  copied into live MCP settings with real secrets without a separate gate.
- `APPROVE_MERCURY_SKILLS_CLONE_READONLY_LOCAL_ONLY` approved only a read-only
  clone and static review of Mercury Skills.
- Mercury Skills upstream README advertises 130 skills across 23 categories;
  local file-system scan found 132 `SKILL.md` files under 23 category
  directories.
- Mercury Agent install, Mercury CLI execution, and skill copy into live agent
  directories remain blocked until separate per-skill approval.
- `APPROVE_HEADROOM_HERMES_ADAPTER_SPEC_LOCAL_ONLY` approved only a local
  adapter spec, not adapter implementation or Headroom activation.
- Headroom-to-Hermes integration must preserve original evidence as source of
  truth and label compressed outputs as derived artifacts.
- `APPROVE_TESTSPRITE_MCP_INSTALL_DRY_RUN_LOCAL_ONLY` approved only package
  metadata and `npm pack --dry-run` inspection, not API key setup, config write,
  MCP server start, or TestSprite cloud execution.
- TestSprite package metadata observed on 2026-06-06 reports
  `@testsprite/testsprite-mcp@0.0.38`, binary `testsprite-mcp-plugin`, and
  `node >=22`.
- `APPROVE_MERCURY_SKILLS_TRIAGE_SAFE_IMPORTS_LOCAL_ONLY` approved only local
  triage of the read-only clone, not importing or installing Mercury skills.
- Mercury safe-import triage scanned 132 skills and classified 20 as
  safe-import candidates, 88 as review-required, and 24 as blocked-for-import.
- `APPROVE_HEADROOM_HERMES_ADAPTER_PROTOTYPE_LOCAL_ONLY` approved a local
  prototype only, not MCP/proxy/wrap/init/install activation or Hermes live
  routing mutation.
- The Headroom adapter prototype is Rust-first at the wrapper layer and produced
  a derived compressed preview while preserving the original evidence file.
- After `APPROVE_TESTSPRITE_API_KEY_LOCAL_SECRET_SETUP`, `.env.testsprite.local`
  was created as an ignored local secret slot with owner-only mode, but no real
  TestSprite key was present.
- After `APPROVE_TESTSPRITE_MCP_CONFIG_WRITE_LOCAL_ONLY`, `.mcp.local/testsprite-mcp.json`
  was written as an ignored placeholder-only local MCP config and was not
  activated.
- After `APPROVE_MERCURY_SKILLS_IMPORT_FIRST_BATCH_LOCAL_ONLY`, five Mercury
  first-batch skills were copied into `vendor/mercury-first-batch` as a
  repo-local vendor snapshot only.
- The 2026-06-07 Mercury first-batch lane did not mutate live Hermes, Codex,
  Claude, or OpenClaw skill directories.
- After `APPROVE_HEADROOM_HERMES_ADAPTER_WIRE_TO_EVIDENCE_PACKETS_LOCAL_ONLY`,
  `tools/local-bin/headroom-evidence-wire.rs` wired the Headroom adapter to a
  local evidence packet and produced a derived compressed preview.
- Headroom evidence wiring compressed TestSprite dry-run evidence from 3,372 to
  1,184 estimated tokens with provider call, proxy, MCP, source overwrite, and
  external mutation all false.
