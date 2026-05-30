# GitHub Source Inventory - 2026-04-23

## Owner

GitHub account: `ton36475-lgtm`

## Repository Discovery

Public GitHub API returned one public repository:

| Repository | Local mirror | Commit | Usage decision |
| --- | --- | --- | --- |
| `ghost-claw-os` | `C:\Users\Ton36\OneDrive\เอกสาร\Playground\_github\ton36475-lgtm\ghost-claw-os` | `35d19f2e5b7b9ce269349834b82aa50ec7c7f70c` | Reference only for control-plane, mobile companion, review/release, queue, and asset-memory patterns |

`sirinx-solar-energy` was not visible through unauthenticated GitHub API at the time of this inventory. Treat it as private or unavailable until `gh auth login` or `GH_TOKEN` is configured.

## Clone Method

`ghost-claw-os` contains a committed `node_modules` tree with more than 51k files. A normal Windows checkout hit path-length errors. The local mirror was therefore created with sparse checkout:

- Source/docs/config checked out.
- Root `node_modules/` excluded.
- Git metadata retained so the mirror can be updated later.

## Reusable Patterns For SIRINX

- Review and release gate structure: useful for SIRINX approval workflow and production cutover gates.
- Queue worker design: useful for later n8n/worker separation and controlled background processing.
- Asset memory concept: useful for SIRINX standard/shadow vault separation.
- Mobile app shell: useful as a future SIRINX ops companion reference, not a direct runtime dependency.
- API integration and offline-first retry notes: useful for internal control-plane resilience.

## Explicit Non-Use

- Do not copy Ghost Claw branding, Manus production claims, or non-SIRINX content into the public SIRINX site.
- Do not use committed keystore/materials from the reference repo as production secrets.
- Do not import platform-publishing, scraping, stealth, or unofficial automation flows into SIRINX.
- Do not let Ghost Claw OS become a second owner of the SIRINX public gateway or model-host role.

## Next Safe Uses

1. Extract only architecture patterns into SIRINX governance docs.
2. Compare Ghost Claw queue/review docs against the SIRINX v15 approval packet before production cutover.
3. If private GitHub access is needed, configure GitHub auth explicitly and re-run discovery before assuming more repos exist.

