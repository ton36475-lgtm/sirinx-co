#!/usr/bin/env node
// =============================================================================
// Validate every config/**/*.json against the schema declared for it.
//
//   node scripts/validate-config.mjs            # human table, exit 1 on failure
//   node scripts/validate-config.mjs --json     # machine receipt
//   node scripts/validate-config.mjs --root=DIR # validate another tree (tests)
//
// The contract this enforces, and nothing beyond it:
//   1. config/config-index.v1.json lists every config file exactly once, every
//      entry points at a schema that exists, and every schema is accounted for
//      exactly once: either bound to a config (entries) or declared as an
//      artifact schema (artifactSchemas) that validates generated receipts.
//   2. A config filename is <stem>.v<N>.json; its schema is a .v<N>.schema.json
//      with the same N. A v1 document can never be checked against a v2 schema.
//   3. The document carries schemaVersion "<major>.<minor>[-label]" whose major
//      equals N (the one header field that varies today is normalised: a bare
//      numeric `version` is not accepted).
//   4. The document validates against that schema with Ajv 2020-12 strict-mode
//      off (several repository schemas predate strict keyword support), formats
//      on, all errors reported.
//
// Read-only: this script never rewrites a config or a schema.
// =============================================================================
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export const INDEX_PATH = 'config/config-index.v1.json';

const CONFIG_FILE = /^[a-z0-9][a-z0-9._-]*\.v(\d+)\.json$/;
const SCHEMA_FILE = /^[a-z0-9][a-z0-9._-]*\.v(\d+)\.schema\.json$/;
const SCHEMA_VERSION = /^(\d+)(?:\.\d+)?(?:-[a-z0-9-]+)?$/;

const posix = (p) => p.split(sep).join('/');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function errorLine(error) {
  const where = error.instancePath || '/';
  const params = error.params && Object.keys(error.params).length
    ? ` ${JSON.stringify(error.params)}`
    : '';
  return `${where} ${error.message}${params}`;
}

/**
 * Validate a repository tree (or a fixture tree) against the config contract.
 * Pure: returns a receipt instead of throwing, so tests can assert on it.
 */
export function validateConfigTree({ root = process.cwd(), maxErrors = 12 } = {}) {
  const errors = [];
  const warnings = [];
  const rows = [];
  const abs = (p) => join(root, p);

  // --- 1. the index -------------------------------------------------------
  const indexPath = abs(INDEX_PATH);
  if (!existsSync(indexPath)) {
    return { ok: false, errors: [`missing ${INDEX_PATH}`], warnings, rows, counts: { configs: 0, schemas: 0 } };
  }

  let index;
  try {
    index = readJson(indexPath);
  } catch (err) {
    return { ok: false, errors: [`${INDEX_PATH}: invalid JSON (${err.message})`], warnings, rows, counts: { configs: 0, schemas: 0 } };
  }

  if (!index || typeof index !== 'object' || !Array.isArray(index.entries)) {
    return { ok: false, errors: [`${INDEX_PATH}: entries must be an array`], warnings, rows, counts: { configs: 0, schemas: 0 } };
  }

  const indexVersion = typeof index.schemaVersion === 'string' ? index.schemaVersion.match(SCHEMA_VERSION) : null;
  if (!indexVersion) errors.push(`${INDEX_PATH}: schemaVersion must look like "1.0"`);

  const bindings = new Map();
  index.entries.forEach((entry, i) => {
    const label = `${INDEX_PATH}: entries[${i}]`;
    if (!entry || typeof entry.config !== 'string' || typeof entry.schema !== 'string') {
      errors.push(`${label} needs string "config" and "schema"`);
      return;
    }
    if (bindings.has(entry.config)) errors.push(`${label} duplicates ${entry.config}`);
    bindings.set(entry.config, entry.schema);
  });

  const artifacts = new Set();
  if (index.artifactSchemas !== undefined) {
    if (!Array.isArray(index.artifactSchemas)) {
      errors.push(`${INDEX_PATH}: artifactSchemas must be an array of schema paths`);
    } else {
      index.artifactSchemas.forEach((value, i) => {
        if (typeof value !== 'string' || !value.endsWith('.schema.json')) {
          errors.push(`${INDEX_PATH}: artifactSchemas[${i}] must be a .schema.json path`);
          return;
        }
        if (artifacts.has(value)) errors.push(`${INDEX_PATH}: artifactSchemas[${i}] duplicates ${value}`);
        artifacts.add(value);
      });
    }
  }

  // --- 2. schema pool (preloaded so relative $refs resolve) ---------------
  const schemaFiles = walk(abs('schemas'));
  const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: true });
  addFormats(ajv);

  const schemaById = new Map();
  const schemaRelPaths = new Set(schemaFiles.map((file) => posix(relative(root, file))));
  const boundSchemas = new Set(bindings.values());

  for (const rel of artifacts) {
    if (!schemaRelPaths.has(rel)) errors.push(`${INDEX_PATH}: artifact schema ${rel} does not exist`);
    if (boundSchemas.has(rel)) errors.push(`${INDEX_PATH}: ${rel} is both bound to a config and declared an artifact schema`);
  }
  for (const rel of schemaRelPaths) {
    if (!boundSchemas.has(rel) && !artifacts.has(rel)) {
      errors.push(`${rel}: neither bound to a config (entries) nor declared in artifactSchemas`);
    }
  }

  for (const file of schemaFiles) {
    const rel = posix(relative(root, file));
    if (!SCHEMA_FILE.test(basename(file))) {
      errors.push(`${rel}: schema filename must match <stem>.v<N>.schema.json`);
      continue;
    }
    let doc;
    try {
      doc = readJson(file);
    } catch (err) {
      errors.push(`${rel}: invalid JSON (${err.message})`);
      continue;
    }
    if (typeof doc.$id !== 'string') {
      warnings.push(`${rel}: no $id, cross-file $refs cannot resolve to it`);
      continue;
    }
    if (schemaById.has(doc.$id)) {
      errors.push(`${rel}: duplicate $id ${doc.$id} (also ${schemaById.get(doc.$id).rel})`);
      continue;
    }
    schemaById.set(doc.$id, { rel, doc });
    try {
      ajv.addSchema(doc);
    } catch (err) {
      errors.push(`${rel}: Ajv rejects this schema (${err.message})`);
    }
  }

  // --- 3. every config file, listed and valid -----------------------------
  const configFiles = walk(abs('config'))
    .map((file) => posix(relative(root, file)))
    .filter((rel) => rel !== INDEX_PATH)
    .sort();

  for (const rel of configFiles) {
    if (!bindings.has(rel)) errors.push(`${rel}: not listed in ${INDEX_PATH}`);
  }

  for (const [configRel, schemaRel] of bindings) {
    const row = { config: configRel, schema: schemaRel, ok: false, problems: [] };

    if (!existsSync(abs(configRel))) {
      row.problems.push('listed but the file does not exist');
      errors.push(`${configRel}: listed in ${INDEX_PATH} but missing on disk`);
      rows.push(row);
      continue;
    }
    if (!configFiles.includes(configRel)) {
      row.problems.push('outside config/');
      errors.push(`${configRel}: index entries must point inside config/`);
    }

    const configMatch = CONFIG_FILE.exec(basename(configRel));
    const schemaMatch = SCHEMA_FILE.exec(basename(schemaRel));
    if (!configMatch) {
      row.problems.push('config filename must be <stem>.v<N>.json');
      errors.push(`${configRel}: filename must be <stem>.v<N>.json`);
    }
    if (!schemaMatch) {
      row.problems.push('schema filename must be <stem>.v<N>.schema.json');
      errors.push(`${schemaRel}: filename must be <stem>.v<N>.schema.json`);
    }
    if (configMatch && schemaMatch && configMatch[1] !== schemaMatch[1]) {
      row.problems.push(`version skew: config v${configMatch[1]} vs schema v${schemaMatch[1]}`);
      errors.push(`${configRel}: v${configMatch[1]} document bound to v${schemaMatch[1]} schema`);
    }
    if (!existsSync(abs(schemaRel))) {
      row.problems.push('schema file missing');
      errors.push(`${configRel}: schema ${schemaRel} does not exist`);
      rows.push(row);
      continue;
    }

    let doc;
    try {
      doc = readJson(abs(configRel));
    } catch (err) {
      row.problems.push('invalid JSON');
      errors.push(`${configRel}: invalid JSON (${err.message})`);
      rows.push(row);
      continue;
    }
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
      row.problems.push('document must be a JSON object');
      errors.push(`${configRel}: document must be a JSON object`);
      rows.push(row);
      continue;
    }

    const version = typeof doc.schemaVersion === 'string' ? doc.schemaVersion.match(SCHEMA_VERSION) : null;
    if (!version) {
      row.problems.push('schemaVersion missing or malformed');
      errors.push(`${configRel}: schemaVersion must be a string like "1.0" (legacy numeric "version" is not accepted)`);
    } else if (configMatch && version[1] !== configMatch[1]) {
      row.problems.push(`schemaVersion ${doc.schemaVersion} vs filename v${configMatch[1]}`);
      errors.push(`${configRel}: schemaVersion ${doc.schemaVersion} disagrees with filename v${configMatch[1]}`);
    }

    let validate;
    try {
      const schemaDoc = existsSync(abs(schemaRel)) ? readJson(abs(schemaRel)) : null;
      const id = schemaDoc && typeof schemaDoc.$id === 'string' ? schemaDoc.$id : undefined;
      validate = (id && ajv.getSchema(id)) || ajv.compile(schemaDoc);
    } catch (err) {
      row.problems.push('schema cannot be compiled');
      errors.push(`${configRel}: cannot compile ${schemaRel} (${err.message})`);
      rows.push(row);
      continue;
    }

    if (!validate(doc)) {
      const problems = (validate.errors || []).map(errorLine);
      row.problems.push(...problems.slice(0, maxErrors));
      errors.push(`${configRel}: ${problems.length} validation error(s) against ${schemaRel}`);
      for (const problem of problems.slice(0, maxErrors)) errors.push(`    ${problem}`);
    } else {
      row.ok = true;
    }
    rows.push(row);
  }

  const ok = errors.length === 0;
  return {
    ok,
    errors,
    warnings,
    rows,
    counts: {
      configs: bindings.size,
      schemas: schemaFiles.length,
      boundSchemas: boundSchemas.size,
      artifactSchemas: artifacts.size,
    },
  };
}

// --- CLI --------------------------------------------------------------------
function isMain() {
  if (!process.argv[1]) return false;
  try {
    return fileURLToPath(import.meta.url) === process.argv[1];
  } catch {
    return false;
  }
}

if (isMain()) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const quiet = args.includes('--quiet');
  const rootArg = args.find((a) => a.startsWith('--root='));
  const root = rootArg ? rootArg.slice('--root='.length) : process.cwd();

  const receipt = validateConfigTree({ root });

  if (json) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    if (!quiet) {
      const width = receipt.rows.reduce((n, r) => Math.max(n, r.config.length), 0);
      for (const row of receipt.rows) {
        const status = row.ok ? 'OK  ' : 'FAIL';
        console.log(`${status} ${row.config.padEnd(width)} -> ${row.schema}`);
        for (const problem of row.problems) console.log(`       ${problem}`);
      }
      console.log('');
    }
    for (const warning of receipt.warnings) console.log(`WARN ${warning}`);
    for (const error of receipt.errors) console.log(`ERR  ${error}`);
    const { configs, schemas, boundSchemas, artifactSchemas } = receipt.counts;
    console.log(`${receipt.ok ? 'PASS' : 'FAIL'} config contract: ${configs} config(s), ${schemas} schema(s) = ${boundSchemas} bound + ${artifactSchemas} artifact, ${receipt.errors.length} error(s), ${receipt.warnings.length} warning(s)`);
  }

  process.exit(receipt.ok ? 0 : 1);
}
