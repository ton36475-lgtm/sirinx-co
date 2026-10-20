# Home offload — split sets to USB + iCloud, Hermes agents stay local (2026-10-21)

Status: `BLOCKED_ON_HARDWARE / PARTIAL_COPY_DONE / NO_DELETION`

Request: move all home data off the Mac mini, split into separate datasets, stored
in **both** USB and iCloud, with **Hermes agent data kept on the Mac mini only**.

What this report proves and what it cannot: the split plan exists and is
runnable, one set is copied and checksum-verified into iCloud, and the USB target
is **not writable at all** because the volume has been wedged for four days by an
earlier copy job. Nothing was deleted, and no source file moved.

## 1. Why the USB target is unusable (measured, not inferred)

`/Volumes/SIRINXSCR` is mounted but every synchronous call into it blocks:
`ls /Volumes/SIRINXSCR`, `df -h`, `mount`, `diskutil info` and
`os.statvfs('/Volumes/SIRINXSCR')` all hang until killed. `df` hangs because
macOS `df` walks `getmntinfo()` and statfs on this one volume never returns.
`os.statvfs('/')` still answers, so the block is specific to this volume.

Cause is a home-wide backup that has been stuck since **2026-10-16**:

| PID | Elapsed at check | State | Command |
| --- | --- | --- | --- |
| 12252 | 4 d 08 h 01 m | S (waiting on child) | `rsync -a --exclude Library/Caches --exclude .Trash --exclude Library/Group Containers --exclude node_modules --exclude .venv --exclude "Library/Application Support/MobileSync" /Users/sirinx/ /Volumes/SIRINXSCR/FULL_HOME_BACKUP_20261016/` |
| 12255 | 4 d 08 h 00 m | **U** (uninterruptible I/O) | `rsync --server … . /Volumes/SIRINXSCR/FULL_HOME_BACKUP_20261016/` |
| 15762 | 4 d 07 h 37 m | **U** | `cp -R /Users/sirinx/SIRINXDev /Volumes/SIRINXSCR/sirinx-migration-20261016/archive/SIRINXDev` |
| 16286 | 4 d 07 h 36 m | **U** | `cp -Rp /Users/sirinx/SIRINXDev /Volumes/SIRINXSCR/sirinx-migration-20261016/archive/SIRINXDEV_FULL` |
| 4919 | 3 d 19 h 48 m | **U** | `python /Users/sirinx/bin/sirinxscr-sync.py` |

The blocker is not only those five processes: `diskarbitrationd` (128),
`fseventsd` (100) and `mds` (125) are also in `U` state, so mount arbitration,
FSEvents and Spotlight are stuck behind the same device. That is why unrelated
commands (`df`, `diskutil`, `ls`) hang instead of failing fast.

The two `cp -R` jobs are not resumable and not verified; the rsync job was a
full-home copy that included the Hermes agent state this request wants excluded.
Their partial output cannot be trusted as a backup.

`~/hermes/backup_home_usb.sh` is the script that started the rsync job, and
`~/hermes/backup_status_watch.sh` polls the (now hung) destination. Neither
script excludes Hermes data and neither writes a manifest, so even a completed
run would not satisfy the requested split.

## 2. Split dataset plan (implemented)

`config/backup/home-offload.v1.json` declares seven sets. Six go to both targets;
`hermes-agents` is `localOnly` and is never synced.

| Set | Local only | Entries | Content |
| --- | --- | --- | --- |
| `hermes-agents` | **yes — Mac mini only** | 10 | `hermes/`, `hermes-mcp/`, `hermes-one-fresh/`, `project-hermes/`, `.hermes`, `skills/`, `plugins/`, `custom-learned-skills-dir/`, `Library/Application Support/hermes`, `Library/Application Support/Hermes` (the last two resolve as distinct paths on this volume) |
| `repo-evidence` | no | 4 | `reports/`, `receipts/`, `exports/`, `docs/` (offload receipts under `reports/backup/` are excluded to avoid self-drift) |
| `documents` | no | 4 | `Documents/`, `Desktop/`, `Downloads/`, `Public/` |
| `media` | no | 3 | `Movies/`, `Pictures/`, `Music/` |
| `projects` | no | 18 | `SIRINXDev/`, `sirinx-co/`, `sirinx-os/`, `sirinox-os/`, `SIRINX_staging/`, `sirinx-apex-scratch/`, `sirinx-sirinsi/`, `OZ-CORP*/`, `oz-runtime/`, `OpenManus/`, `workspace/`, `ZCodeProject/`, `ZCode-backup-2026-08-09/`, `ai-dev-macmini/`, `agm-sandbox/`, `TUI-PRESERVATION-20261014…` |
| `data-dumps` | no | 4 | `mongodb_data/`, `ghidra-projects/`, `secure-backups/`, `9router-backup/` |
| `home-loose` | no | 108 files | loose top-level `*.py`, `*.json`, `*.md`, `*.yaml`, `*.sh` specs and notes |

Targets:

- USB → `/Volumes/SIRINXSCR/OFFLOAD_20261021/<set>/<entry>/`
- iCloud → `~/Library/Mobile Documents/com~apple~CloudDocs/SIRINX_COLD_ARCHIVE_20261021/<set>/<entry>/`

Excludes (both targets): `Library/Caches`, `Library/Group Containers`,
`Library/Application Support/MobileSync`, `Library/Containers/com.docker.docker`,
`.Trash`, `node_modules`, `.venv`, `venvs`, `vcpkg`, `target`, `.cargo`,
`.rustup`, `__pycache__`.

## 3. Tool

`scripts/home-offload.mjs` (no dependencies, Node 22):

| Command | Behavior |
| --- | --- |
| `plan [--sizes] [--json]` | prints each set, entry count, missing entries, optional size; never touches a target |
| `probe [--json]` | statfs each target in a **child process with a 6 s cap**, so a wedged volume cannot hang the script; exit 1 if any target is unresponsive |
| `sync --set=<id> [--target=usb\|icloud\|both] --confirm [--dry-run]` | refuses unknown sets, refuses `localOnly` sets, refuses unless every selected target probes responsive, then `mkdir -p` + `rsync -a --partial` per entry; writes a JSON receipt to `reports/backup/<local-date>/` |
| `verify --set=<id> [--target=…]` | `rsync -a -n -c --itemize-changes` and counts changed lines; prints `MATCH` / `DRIFT n` / `MISSING`, exit 1 on drift |

Guards that matter here:

- **copy-only**: `--delete` is never passed, no `--remove-source-files`, no
  `rm`. A "move" is copy → verify → operator decides about the source.
- `localOnly` is enforced in code, not only in the JSON: `sync --set=hermes-agents --confirm`
exits 2 with `refused: set "hermes-agents" is local-only and must stay on this Mac`, an
unknown set exits 2, and a sync without `--confirm` exits 2.
- The USB wedge cannot block the tool: the probe returned
  `usb: WEDGED (statfs_timeout)` in ~6 s and exited 1 instead of hanging.

## 4. What actually ran

| Step | Result |
| --- | --- |
| `node --check scripts/home-offload.mjs` | rc 0 |
| `plan` | 7 sets, 151 existing entries, 0 missing |
| `probe` | `usb: WEDGED (statfs_timeout)`, `icloud: RESPONSIVE free 6.6 GiB / 228.3 GiB` |
| `sync --set=repo-evidence --target=icloud --confirm --dry-run` | `SYNC_OK`, **0 files copied** (verified with `find … -type f | wc -l` = 0) |
| `sync --set=repo-evidence --target=icloud --confirm` | `SYNC_OK`, 51 MiB copied |
| `verify --set=repo-evidence --target=icloud` | `MATCH` on all four entries (reports/receipts/exports/docs), rc 0 |

Receipts: `reports/backup/2026-10-21/sync-repo-evidence-*.json`.

## 5. Capacity reality (why the rest cannot proceed yet)

| Fact | Value |
| --- | --- |
| Data volume | 228 GiB total, **6.6 GiB available** (177 GiB used, 97 %) |
| Repo working tree | 1.7 GiB (`sites` 760 MB, `node_modules` 600 MB, `.git` 135 MB) |
| `repo-evidence` set | 51.4 MiB |
| USB free space | **unknown** — statfs cannot answer |
| iCloud free space | 6.6 GiB reported — iCloud Drive lives on the same volume, so a file counts against local disk until it is uploaded **and** evicted |

Consequences:

1. iCloud cannot be the first destination for 177 GiB. Writing it there needs the
   same bytes locally first, which would take the disk to zero and break the
   repo's 15 GiB workload floor. Only small sets (repo-evidence today, plus
   `home-loose` and `documents` if they fit) can go to iCloud now.
2. USB must come back before `media`, `projects`, or `data-dumps` can move. Its
   free space has to be measured after recovery; a 177 GiB set needs a drive with
   room plus headroom.
3. Evicting iCloud copies later (`brctl evict`) is a per-file operator action and
   was not attempted — deleting the local copy of a synced file is a destructive
   step that has not been authorized.

## 6. Recovery runbook for the wedged volume (needs hands on the machine)

1. Stop starting new work against `/Volumes/SIRINXSCR`. Do **not** run
   `rsync`, `cp`, `du`, `df`, or Finder operations on it — each adds another
   process to the `U`-state pile.
2. Physically unplug the drive, wait ~10 s, plug it back into a **different**
   port (prefer a direct port over a hub). A USB reset is what clears `U`-state
   I/O; `kill -9` cannot, because the process is inside the kernel waiting on the
   device.
3. If the volume does not reappear within a minute, reboot the Mac mini. The
   stuck `rsync`/`cp`/`sirinxscr-sync.py` processes will be gone afterwards.
4. Verify, in this order:
   - `node scripts/home-offload.mjs probe` → `usb: RESPONSIVE free … GiB`
   - `diskutil verifyVolume /Volumes/SIRINXSCR` (read-only check; the previous
     `cp` jobs died mid-write, so filesystem damage is possible)
5. Treat `FULL_HOME_BACKUP_20261016/` and `sirinx-migration-20261016/` as
   **unverified partial copies**. Either re-copy those sets with
   `home-offload.mjs` into `OFFLOAD_20261021/`, or delete them only after the new
   copy verifies — deletion is not part of this run.
6. Retire `~/hermes/backup_home_usb.sh` and `backup_status_watch.sh`; they copy
   the Hermes agent state that must stay local and they write no manifest. Keep
   them only if the full-home copy is wanted as a second, different artifact.
7. Then, per set: `node scripts/home-offload.mjs sync --set=<id> --confirm`
   followed by `verify --set=<id>`.

Do not write to a drive that just dropped out until `diskutil verifyVolume`
passes; a resumed copy on a failing device is how a backup becomes the only
remaining copy of corrupted data.

## 7. Not done

- No write to the USB volume (impossible), no unmount/force-unmount (it would
  hang behind the same `U`-state processes), no reboot, no re-plug.
- No kill of the five stuck processes and no stop of `sirinxscr-sync.py`.
- No deletion of any source file, no deletion of the partial 2026-10-16 backups.
- No copy of `documents`, `media`, `projects`, `data-dumps`, or `home-loose` yet.
- No Cloudflare/DNS/Access/tunnel change in this run (see
  `cf-tunnel-hermes-mcp-20261021.md` for that plane).
