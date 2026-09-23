# Real installation import

This script prepares/imports the 3 user-identified projects and their 27 processed JPGs from `release/catalog/projects.json`. It uses the existing MySQL `projects` table and Forge `storagePut` helper. It does not provision services, change schemas, update existing rows, delete anything, publish rows, or deploy the website.

## Dry-run first

From `apps/public-web`, with the project's installed `tsx` module:

```sh
node --import tsx scripts/import-real-installations.ts --release-root /absolute/path/to/release --dry-run > /absolute/path/to/import-plan.json
node --import tsx --test scripts/import-real-installations.test.ts
```

Dry-run reads local media only. It verifies the 27 expected asset IDs and JPG paths, blocks symlink escapes, hashes derivative bytes, and emits `project.create`-compatible payloads with `published: false`. Unknown capacity, savings, date and location remain omitted. Planned static URLs use `/assets/real-installations/<project>/<id>.jpg`; those paths do not imply the files are deployed.

Videos remain sidecar metadata in the plan. The existing projects schema supports image URL arrays, not videos, captions or responsive variants. No video or master/original files are uploaded by this script.

## Trusted execution, after runtime access is verified

Use the already configured private server environment. Required environment variable names are `DATABASE_URL`, `BUILT_IN_FORGE_API_URL`, and `BUILT_IN_FORGE_API_KEY`. Never copy their values into a command, receipt, commit or chat. The Forge API must return stable public HTTPS URLs without query tokens. Backend code must be run using the project's installed `tsx` toolchain.

```sh
node --import tsx scripts/import-real-installations.ts \
  --release-root /absolute/path/to/release \
  --receipt /durable/private/path/real-installations-import.json \
  --apply
```

`--apply` uploads the 27 JPG derivatives to content-addressed keys. It substitutes returned URLs, journals the exact payload before each `createProject`, records returned database IDs and verifies every created row. All records stay unpublished. No technical source markers are added to customer-facing descriptions.

The receipt must be outside tracked/public paths and stored durably. Receipt files use restricted permissions. An existing receipt always blocks apply, whether successful, failed, partially written or interrupted. The script checks exact existing project titles before uploading and again before each insert; an existing title requires explicit reconciliation, not a guessed update. The schema has no unique import key, so use one authorized importer at a time. This is a fail-closed execution journal, not a claim of distributed exactly-once insertion.

## Read-only reconciliation and rollback

```sh
node --import tsx scripts/import-real-installations.ts \
  --receipt /durable/private/path/real-installations-import.json \
  --inspect-receipt
```

Inspection uses `DATABASE_URL` only and compares recorded IDs with live rows. It never resumes work. If a database response was lost, a pending create may exist without a returned ID; reconcile the pending payload and live database before running anything else. Do not remove or replace a failed receipt to force a retry. Uploaded orphan objects are listed in the receipt where responses were received; unknown-result uploads use content-addressed keys recorded before the request. `node --import tsx` avoids the standalone tsx CLI's IPC socket dependency in restricted environments.

Existing rows remain untouched and their before snapshot is retained. For rollback, leave created rows unpublished and review `idMap`/after snapshots; this importer deliberately has no destructive cleanup or publication command.

## Website connection

The inspected recovery branch's previous `Projects.tsx` hardcoded content rather than querying the database. Database insertion by itself is insufficient to update the public website. The paired frontend change must be reviewed, and Node/Express API runtime availability must be established separately. Static Cloudflare Pages hosting does not itself start the repository's Express server.
