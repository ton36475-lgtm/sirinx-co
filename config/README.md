# config/ — one contract for every file here

Every `.json` under `config/` is bound to exactly one JSON Schema under `schemas/`
and is validated on every `npm run check`.

| Rule | What it means |
| --- | --- |
| `config/<domain>/<stem>.v<N>.json` | filename carries the major version |
| `schemas/<domain>/<stem>.v<N>.schema.json` | schema carries the same `N`; a v1 document is never checked against a v2 schema |
| `schemaVersion: "<major>.<minor>[-label]"` | the one header field every document shares; its major must equal `N` |
| `config/config-index.v1.json` | the only place a config file is bound to its schema — add an entry in the same change that adds a file |
| `artifactSchemas[]` in the index | every schema that validates a generated receipt/evidence artifact instead of a config document; a schema listed in neither `entries` nor `artifactSchemas` fails the check |

```bash
npm run config:validate   # table + exit 1 on any violation
npm run config:test       # the validator's own fixtures
node scripts/validate-config.mjs --json
```

The validator refuses: an unlisted config, an index entry with no file, a
dangling or version-skewed schema reference, a malformed filename or
`schemaVersion`, a duplicate `$id`, a schema that is neither bound nor declared
an artifact (and the reverse: a schema declared twice, or as both), and any
document Ajv rejects. It is
read-only — it never rewrites a config or a schema to make a check pass.

`config/config-index.v1.json` is the index itself and is exempt from the
`<stem>.v<N>.json` binding; its own `schemaVersion` is still checked.
