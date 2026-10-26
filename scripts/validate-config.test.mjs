import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { validateConfigTree, INDEX_PATH } from './validate-config.mjs';

const SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://example.test/schemas/core/thing.v1.schema.json',
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'name'],
  properties: {
    schemaVersion: { const: '1.0' },
    name: { type: 'string', minLength: 1 },
  },
};

const CONFIG = { schemaVersion: '1.0', name: 'fixture' };

function tree({ config = CONFIG, schema = SCHEMA, entries, files = {}, indexExtra = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'sirinx-config-'));
  const put = (rel, value) => {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, typeof value === 'string' ? value : JSON.stringify(value, null, 2));
  };
  put('config/core/thing.v1.json', config);
  put('schemas/core/thing.v1.schema.json', schema);
  put(
    INDEX_PATH,
    {
      schemaVersion: '1.0',
      status: 'STATIC_INDEX',
      entries: entries ?? [{ config: 'config/core/thing.v1.json', schema: 'schemas/core/thing.v1.schema.json' }],
      ...indexExtra,
    },
  );
  for (const [rel, value] of Object.entries(files)) put(rel, value);
  return root;
}

function check(root) {
  const receipt = validateConfigTree({ root });
  rmSync(root, { recursive: true, force: true });
  return receipt;
}

test('a bound config that satisfies its schema passes', () => {
  const receipt = check(tree());
  assert.equal(receipt.ok, true, receipt.errors.join('\n'));
  assert.equal(receipt.rows.length, 1);
  assert.equal(receipt.rows[0].ok, true);
});

test('a config file that the index does not list is refused', () => {
  const receipt = check(tree({ files: { 'config/core/extra.v1.json': { schemaVersion: '1.0' } } }));
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /config\/core\/extra\.v1\.json: not listed/);
});

test('an index entry whose file is missing is refused', () => {
  const receipt = check(
    tree({
      entries: [
        { config: 'config/core/thing.v1.json', schema: 'schemas/core/thing.v1.schema.json' },
        { config: 'config/core/ghost.v1.json', schema: 'schemas/core/ghost.v1.schema.json' },
      ],
    }),
  );
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /ghost\.v1\.json.*missing on disk/);
});

test('a dangling schema path is refused', () => {
  const receipt = check(
    tree({ entries: [{ config: 'config/core/thing.v1.json', schema: 'schemas/core/nope.v1.schema.json' }] }),
  );
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /does not exist/);
});

test('version skew between config and schema is refused', () => {
  const root = tree({
    files: { 'schemas/core/thing.v2.schema.json': { ...SCHEMA, $id: 'https://example.test/schemas/core/thing.v2.schema.json' } },
    entries: [{ config: 'config/core/thing.v1.json', schema: 'schemas/core/thing.v2.schema.json' }],
  });
  const receipt = check(root);
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /v1 document bound to v2 schema/);
});

test('schemaVersion must agree with the filename version', () => {
  const receipt = check(tree({ config: { schemaVersion: '2.0', name: 'fixture' } }));
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /disagrees with filename v1/);
});

test('a legacy numeric version field is not accepted as the header', () => {
  const receipt = check(tree({ config: { version: 1, name: 'fixture' } }));
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /schemaVersion must be a string/);
});

test('a document that violates its schema is refused with the Ajv detail', () => {
  const receipt = check(tree({ config: { schemaVersion: '1.0' } }));
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /validation error\(s\)/);
  assert.match(receipt.errors.join('\n'), /must have required property 'name'/);
});

test('a duplicate index entry is refused', () => {
  const receipt = check(
    tree({
      entries: [
        { config: 'config/core/thing.v1.json', schema: 'schemas/core/thing.v1.schema.json' },
        { config: 'config/core/thing.v1.json', schema: 'schemas/core/thing.v1.schema.json' },
      ],
    }),
  );
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /duplicates config\/core\/thing\.v1\.json/);
});

test('a config filename without a version segment is refused', () => {
  const receipt = check(
    tree({
      files: { 'config/core/unversioned.json': { schemaVersion: '1.0', name: 'x' } },
      entries: [
        { config: 'config/core/thing.v1.json', schema: 'schemas/core/thing.v1.schema.json' },
        { config: 'config/core/unversioned.json', schema: 'schemas/core/thing.v1.schema.json' },
      ],
    }),
  );
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /filename must be <stem>\.v<N>\.json/);
});

test('a schema that is neither bound to a config nor declared an artifact is refused', () => {
  const receipt = check(
    tree({
      files: {
        'schemas/core/orphan.v1.schema.json': {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.test/schemas/core/orphan.v1.schema.json',
          type: 'object',
        },
      },
    }),
  );
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /orphan\.v1\.schema\.json: neither bound to a config/);
});

test('a schema declared in artifactSchemas satisfies the coverage rule', () => {
  const receipt = check(
    tree({
      files: {
        'schemas/core/receipt.v1.schema.json': {
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          $id: 'https://example.test/schemas/core/receipt.v1.schema.json',
          type: 'object',
        },
      },
      indexExtra: { artifactSchemas: ['schemas/core/receipt.v1.schema.json'] },
    }),
  );
  assert.equal(receipt.ok, true, receipt.errors.join('\n'));
  assert.equal(receipt.counts.artifactSchemas, 1);
});

test('an artifact entry that names a missing schema is refused', () => {
  const receipt = check(tree({ indexExtra: { artifactSchemas: ['schemas/core/ghost.v1.schema.json'] } }));
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /artifact schema schemas\/core\/ghost\.v1\.schema\.json does not exist/);
});

test('a schema listed both as bound and as artifact is refused', () => {
  const receipt = check(tree({ indexExtra: { artifactSchemas: ['schemas/core/thing.v1.schema.json'] } }));
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), /both bound to a config and declared an artifact/);
});

test('a missing index is reported, not thrown', () => {
  const root = mkdtempSync(join(tmpdir(), 'sirinx-config-'));
  const receipt = validateConfigTree({ root });
  rmSync(root, { recursive: true, force: true });
  assert.equal(receipt.ok, false);
  assert.match(receipt.errors.join('\n'), new RegExp(`missing ${INDEX_PATH}`));
});
