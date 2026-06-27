# Manus Remaining Export Sync

Status: local-only export audit and A2A metadata registration.

This note tracks the requested Manus files that must be exported to the Mac
before Codex can review or import them. It separates real local files with
hashes from Manus-visible files that are still pending export.

## Confirmed Local Export

| File                | Local path                                  |     Size | SHA-256                                                            | A2A artifact                                                                                                  |
| ------------------- | ------------------------------------------- | -------: | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `SPEC_DRIVING.html` | `/Users/sirinx/Downloads/SPEC_DRIVING.html` | `52,704` | `0ca8d018ba8aa7b0b6c22c91688828061339b3bcd83e7599a0b895a6461d078f` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-040524-interactive_html_spec.json` |

Decision: `SPEC_DRIVING.html` remains review-only. Stable sections should be
converted into scoped docs and Mission Control tasks; the generated HTML should
not be imported directly into production.

## Pending Manus Exports

The following files are visible in the Manus delivery summary but were not
found on the Mac under Downloads, Desktop, Documents, common app support/cache
locations, or the Manus runtime wrapper by filename search.

| File                                | Expected local path checked                                 | Source exists | A2A pending artifact                                                                                         |
| ----------------------------------- | ----------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `AGENT.md`                          | `/Users/sirinx/Downloads/AGENT.md`                          | `false`       | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-050006-manus_pending_export.json` |
| `GHOSTCLAW_MARKETING_CLAUDE.md`     | `/Users/sirinx/Downloads/GHOSTCLAW_MARKETING_CLAUDE.md`     | `false`       | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-050008-manus_pending_export.json` |
| `GHOSTCLAW_CONTENT_CLAUDE.md`       | `/Users/sirinx/Downloads/GHOSTCLAW_CONTENT_CLAUDE.md`       | `false`       | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-050009-manus_pending_export.json` |
| `GHOSTCLAW_VIDEO_CLAUDE.md`         | `/Users/sirinx/Downloads/GHOSTCLAW_VIDEO_CLAUDE.md`         | `false`       | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-050010-manus_pending_export.json` |
| `GHOSTCLAW_ADMIN_CLAUDE.md`         | `/Users/sirinx/Downloads/GHOSTCLAW_ADMIN_CLAUDE.md`         | `false`       | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-050011-manus_pending_export.json` |
| `GHOSTCLAW_FINANCE_CLAUDE.md`       | `/Users/sirinx/Downloads/GHOSTCLAW_FINANCE_CLAUDE.md`       | `false`       | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-050012-manus_pending_export.json` |
| `GHOSTCLAW_SHIP_PROTOCOL.md`        | `/Users/sirinx/Downloads/GHOSTCLAW_SHIP_PROTOCOL.md`        | `false`       | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-050013-manus_pending_export.json` |
| `GHOSTCLAW_CREW_REGISTRY_SCHEMA.ts` | `/Users/sirinx/Downloads/GHOSTCLAW_CREW_REGISTRY_SCHEMA.ts` | `false`       | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-050014-manus_pending_export.json` |
| `GHOSTCLAW_INTEGRATION_TESTING.md`  | `/Users/sirinx/Downloads/GHOSTCLAW_INTEGRATION_TESTING.md`  | `false`       | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-050015-manus_pending_export.json` |
| `server/ghostclaw-orchestrator.ts`  | `/Users/sirinx/Downloads/server/ghostclaw-orchestrator.ts`  | `false`       | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-050016-manus_pending_export.json` |

Each pending file has a local A2A task that dry-ran through the file queue. The
task records metadata only and intentionally has no file hash because the source
file is not present on disk.

## Export Package Received

A later export appeared on the Mac at:

`/Users/sirinx/Downloads/GHOSTCLAW_COMPLETE_SYSTEM/`

These files were hash-synced through A2A as real local files. This proves file
presence and identity only; it does not prove the package is complete or that
the files match the original Manus delivery.

| File                                   |     Size | SHA-256                                                            | A2A artifact                                                                                                |
| -------------------------------------- | -------: | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `AGENT.md`                             |     `43` | `3cd4a061867a35b065d73c045b83c1383c7c9b24a64da31fb0ad78548fa46ee2` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051235-manus_exported_file.json` |
| `GHOSTCLAW_ADMIN_CLAUDE.md`            |  `1,044` | `208a1418a51ccf4c5f0649f6dafdd34d0f0f91999b9c76772c18b0fa74b43013` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051236-manus_exported_file.json` |
| `GHOSTCLAW_CONTENT_CLAUDE.md`          |  `1,067` | `de1423e744ad91921eec96b1f2ab153f8798c98fb3c6c8001e24212925f09eb4` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051237-manus_exported_file.json` |
| `GHOSTCLAW_FINANCE_CLAUDE.md`          |  `1,085` | `9cc173370882162489e5c1c4442d1f7b11d72da4bb48d9650cc1aa32463bc637` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051238-manus_exported_file.json` |
| `GHOSTCLAW_MARKETING_CLAUDE.md`        |  `1,113` | `774e276713ec8109d72f244def00eea116e84f2184b559094a0240a91514b601` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051239-manus_exported_file.json` |
| `GHOSTCLAW_README.md`                  | `13,595` | `576af77290c1ba0f2dbcd0ce827070c77b9f8e8bea2d925c848f3d3686b10aca` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051240-manus_exported_file.json` |
| `GHOSTCLAW_SHIP_PROTOCOL.md`           |  `1,093` | `2935d636a6a08f76bd3d434464ffbe43b220fffa95b6bdf182c40c5b6e9136bf` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051241-manus_exported_file.json` |
| `GHOSTCLAW_SYSTEM/GHOSTCLAW_README.md` | `13,595` | `576af77290c1ba0f2dbcd0ce827070c77b9f8e8bea2d925c848f3d3686b10aca` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051242-manus_exported_file.json` |
| `GHOSTCLAW_VIDEO_CLAUDE.md`            |  `1,080` | `dfce2d5986aa625540a065ba2dc5e1d340a6484f925f7e210b5646f035585667` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051244-manus_exported_file.json` |
| `IMPLEMENTATION_GUIDE.md`              |  `1,864` | `6e8f81bf3e5b69d5fc59ba68ace128622e72bcb344a6bc46b251cad505562837` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051245-manus_exported_file.json` |
| `SPEC_DRIVING.html`                    |     `44` | `d9b0885e2e1377207769f57992fb102017219774caa167cc655c8229c768b76f` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-051246-manus_exported_file.json` |

Content completeness findings:

- `AGENT.md` is only one line and `43` bytes.
- `SPEC_DRIVING.html` is only a minimal placeholder and does not match the
  earlier full export at `/Users/sirinx/Downloads/SPEC_DRIVING.html`.
- `GHOSTCLAW_SYSTEM/GHOSTCLAW_README.md` is a duplicate of the top-level
  `GHOSTCLAW_README.md`.
- `GHOSTCLAW_CREW_REGISTRY_SCHEMA.ts` is still missing as a standalone file.
- `GHOSTCLAW_INTEGRATION_TESTING.md` is still missing as a standalone file.
- `server/ghostclaw-orchestrator.ts` is still missing as a standalone file.

Decision: this package is hash-synced but not import-ready. It can be used as a
recovery/reference package only after Codex content review selects specific
sections. It should not replace the earlier full `SPEC_DRIVING.html` export.

## Additional User-Provided Local Exports

The user later provided a focused set of files directly under Downloads. These
files now exist on the Mac and were hash-synced through A2A with unique
artifact filenames after hardening `a2a_manus_adapter.py` against same-second
filename collisions.

| File                                    | Local path                                                      |     Size | SHA-256                                                            | Latest A2A artifact                                                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------- | -------: | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SKILL.md`                              | `/Users/sirinx/Downloads/SKILL.md`                              | `10,754` | `a2bac19beda6e922e4511fae562bfd1a56534daa344eb0ed7ab7c8be301c2934` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-073804-exported_skill_markdown-ghostclaw-skill.md.json`                    |
| `ghostclaw-schema.ts`                   | `/Users/sirinx/Downloads/ghostclaw-schema.ts`                   | `11,640` | `b9979f0f1b45ef64a614d9cb5015f4a1bb40593c394f9af83778b09828d136e5` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-073804-exported_schema_candidate-ghostclaw-ghostclaw-schema.ts.json`       |
| `GHOSTCLAW_MARKETING_CLAUDE.md`         | `/Users/sirinx/Downloads/GHOSTCLAW_MARKETING_CLAUDE.md`         |  `4,186` | `dae569dd4e00eb24f22775370e3e90b2fc282a80b374251d6f448f60c56fe021` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-073804-exported_claude_template-ghostclaw-marketing-claude-template.json`  |
| `GHOSTCLAW_VIDEO_CLAUDE.md`             | `/Users/sirinx/Downloads/GHOSTCLAW_VIDEO_CLAUDE.md`             |  `4,827` | `36c563ffd8b32aaa6ee8fd83296febd638be27c2e91ff4a3449c32838dbb3a94` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-073804-exported_claude_template-ghostclaw-video-claude-template.json`      |
| `GHOSTCLAW_CONTENT_CLAUDE.md`           | `/Users/sirinx/Downloads/GHOSTCLAW_CONTENT_CLAUDE.md`           |  `4,440` | `dfd5445f95a11c1cc2849519333bd93c8f6a69e72d9be25a148cae782fd14d55` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-073804-exported_claude_template-ghostclaw-content-claude-template.json`    |
| `ghostclaw-zero-prompting-system.skill` | `/Users/sirinx/Downloads/ghostclaw-zero-prompting-system.skill` |  `6,342` | `0c87d5b368f48ef382f30c47ccc5c1c4b429bd4bcfa1ec3399b0b50aac13b3e9` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-073804-exported_skill_package-ghostclaw-zero-prompting-skill-package.json` |
| `AUTOMATED CODE REVIEW WORKFLOW.md`     | `/Users/sirinx/Downloads/🤖 AUTOMATED CODE REVIEW WORKFLOW.md`  | `21,941` | `1fac843943225f32fa20cd96a7a6ee95af8747cdb6153d5adff9347459f0d5c3` | `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/artifacts/A2A-20260627-073804-exported_review_workflow-automated-code-review-workflow.json`       |

Decision: these files are now identity-verified local inputs, not repo imports.
`ghostclaw-zero-prompting-system.skill` is treated as a package/archive and
must not be installed until a dedicated skill-review lane inspects its manifest.
The schema and CLAUDE templates require content review before any source,
database, or agent-template integration.

## Manus UI Evidence

The Manus summary listed these files under
`/home/ubuntu/godmode-ads-agency/`, which is a Manus sandbox path, not a Mac
path. A later attempt to create a combined ZIP reported that the files were not
present in the current Manus sandbox and had moved to
`/home/ubuntu/upload/.recovery/`.

When Manus began recreating the files from scratch, the session was stopped.
Recreated files are not acceptable for hash-backed sync unless explicitly
approved as regenerated artifacts, because they may not match the original
delivery.

## Safe Next Action

Export or download the original files from Manus to a Mac folder, preferably:

`/Users/sirinx/Downloads/manus-ghostclaw-export/`

After the files exist locally, rerun `scripts/a2a/a2a_manus_adapter.py` once per
file with the real `--source-path`. Only then should Codex review the file
contents and create scoped repo changes.

Blocked until then:

- importing `AGENT.md` or CLAUDE templates into the repo
- importing schema, tests, or orchestrator source
- treating Manus-recreated files as originals
- deploying, pushing, or publishing any Manus-derived file
