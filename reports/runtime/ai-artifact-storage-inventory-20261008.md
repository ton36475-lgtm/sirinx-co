# AI Artifact Storage Inventory — Read-Only Snapshot

Date: 2026-10-08  
Status: `OBSERVED_NOT_APPROVED / NO_TRANSFER_PERFORMED`

This is an observation packet, not a migration grant. Values are `du -sk` allocated-size estimates captured locally; APFS reclaim after moving or deleting is not guaranteed. Do not use this inventory as blanket authority to move, prune, or delete data.

## Filesystems

| Location | Filesystem | Available | Notes |
| --- | --- | ---: | --- |
| Internal `/` | APFS container device `/dev/disk3s1s1` | 2,838,780 KiB (~2.71 GiB) | Below the repo's 15 GiB workload floor; the prior observation was about 4 GiB, so remeasure before any operational action. |
| `/Volumes/SIRINXSCR` | exFAT, `/dev/disk6s2` | 117,524,864 KiB (~112.06 GiB) | Removable USB, 120.4 GB volume. exFAT does not preserve POSIX symlinks/permissions and should not host active dependency caches or Cargo targets. |

## Observed candidates

| Literal path | `du -sk` KiB | Approx. GiB | Class / decision |
| --- | ---: | ---: | --- |
| `/Users/sirinx/.cache/huggingface` | 2,225,856 | 2.12 | Hugging Face model cache root; excluded from wholesale movement/cleanup. |
| `/Users/sirinx/.cache/huggingface/hub/models--mlx-community--Qwen3-4B-4bit` | 2,225,584 | 2.12 | MLX model cache candidate. Current cache semantics include symlinks; model provenance/admission and consumer reconfiguration are unresolved. No open file references were returned by `lsof +D` at this capture only. Do not relocate in-place or delete source. |
| `/Users/sirinx/.cache/uv` | 9,636,600 | 9.19 | Python package cache, not model artifacts; shared cache roots are excluded from wholesale movement/pruning. |
| `<repo>/target` | 5,804,984 | 5.54 | Cargo build output; repository/resource policy holds broad target cleanup. Do not point Cargo builds at exFAT. |
| `<repo>/node_modules` | 565,080 | 0.54 | Dependency root; shared dependency directory, not AI artifact storage. |
| `<repo>/apps/public-web/client/node_modules` | unavailable | n/a | Path absent at capture. |
| `<repo>/apps/public-web/client/dist` | unavailable | n/a | Path absent at capture. |

The component `du` command returned exit 1 because two app paths did not exist; listed existing path values are still the command output, not a complete whole-machine inventory.

## Migration/cleanup gates

1. Keep source data intact. Any artifact packaging/copy is a separate action requiring an exact source path, destination path, format, verification digest, consumer plan, and rollback plan.
2. Do not put live Hugging Face/MLX cache semantics on exFAT. If the user wants a model archive, first separately approve a portable artifact bundle (not a cache-root move); verify hashes and read-back before any consumer reconfiguration. Never remove the source as part of this packet.
3. Do not move repository, worktree, Cargo target, `node_modules`, uv/pip caches, or broad home folders to USB. These include permanent exclusions / shared-root restrictions in `RESOURCE_RECOVERY_ADMISSION.md`.
4. Disk thresholds are currently unmet by a wide margin. Recovery actions need exact one-target review and a distinct action-time cleanup grant; none is present. The user phrase “all/everything” is not an exact target grant.
5. Re-read `df -Pk`, exact path/device/inode/symlink/hard-link/process evidence and cache consumers before each separately authorized action. Stop and remeasure after one target; no automatic chaining.
6. Cline collaboration does not change the effect boundary. No move, deletion, config rewrite, agent dispatch, or Telegram send was performed.

## Telegram/Cline boundary

No report was sent to Telegram. There is no confirmed community test chat ID, approved file list/payload, redaction preview, or action-time `--send` + `SIRINX_TELEGRAM_CONFIRM=SEND` grant. Do not read or print any token from environment/config. Cline has no available dispatch tool in this session; coordinate only after exact file ownership/target and gate are clarified.

## Evidence limits

This inventory is one point-in-time read-only sample, not proof of all Mac space consumers, guaranteed reclaim, model provenance, or migration safety. Generated report contents may themselves contain local paths; review and sanitize before any external sharing.
