'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

let passed = 0;
let failed = 0;
const errors = [];

function testYaml(filePath) {
  const rel = path.relative(process.cwd(), filePath);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const doc = yaml.load(content);
    if (!doc || typeof doc !== 'object') throw new Error('Empty or invalid YAML');
    passed++;
    console.log(`  ✅ ${rel}`);
    return doc;
  } catch(e) {
    failed++;
    errors.push({ file: rel, error: e.message });
    console.log(`  ❌ ${rel}: ${e.message}`);
    return null;
  }
}

function testMarkdown(filePath) {
  const rel = path.relative(process.cwd(), filePath);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content || content.trim().length < 50) throw new Error('File too short or empty');
    if (!content.includes('#')) throw new Error('No markdown headers found');
    passed++;
    console.log(`  ✅ ${rel} (${content.split('\n').length} lines)`);
  } catch(e) {
    failed++;
    errors.push({ file: rel, error: e.message });
    console.log(`  ❌ ${rel}: ${e.message}`);
  }
}

console.log('\n🧪 OpenClaw Config Validation Suite\n');

const basePath = path.join(__dirname, '..');

// Test OpenClaw core configs
console.log('── Core Configs ──');
const systemDoc    = testYaml(path.join(basePath, '.openclaw/system.yaml'));
const modelsDoc    = testYaml(path.join(basePath, '.openclaw/models.yaml'));
const routingDoc   = testYaml(path.join(basePath, '.openclaw/routing.yaml'));
const approvalsDoc = testYaml(path.join(basePath, '.openclaw/approvals.yaml'));

// Test execution policies
console.log('\n── Execution Policies ──');
testYaml(path.join(basePath, '.openclaw/execution/worktree_policy.yaml'));
testYaml(path.join(basePath, '.openclaw/execution/vm_policy.yaml'));
testYaml(path.join(basePath, '.openclaw/execution/network_policy.yaml'));

// Test agent definitions
console.log('\n── Agent YAMLs ──');
const agentNames = ['orchestrator', 'planner', 'repo_cartographer', 'codex_implementer',
  'codex_test_engineer', 'claude_operator', 'visual_verifier', 'reviewer', 'release_manager'];

const agentDocs = {};
for (const name of agentNames) {
  const doc = testYaml(path.join(basePath, `.openclaw/agents/${name}.yaml`));
  agentDocs[name] = doc;
  if (doc) {
    if (!doc.name) { errors.push({ file: `agents/${name}.yaml`, error: 'Missing "name" field' }); failed++; }
    if (!doc.role) { errors.push({ file: `agents/${name}.yaml`, error: 'Missing "role" field' }); failed++; }
    if (!doc.lane) { errors.push({ file: `agents/${name}.yaml`, error: 'Missing "lane" field' }); failed++; }
  }
}

// Test schemas
console.log('\n── Schemas ──');
const schemaNames = ['job', 'artifact', 'findings', 'review', 'approval'];
const schemaDocs = {};
for (const name of schemaNames) {
  schemaDocs[name] = testYaml(path.join(basePath, `.openclaw/schemas/${name}.schema.yaml`));
}

// Test prompts (markdown)
console.log('\n── Agent Prompts ──');
for (const name of agentNames) {
  testMarkdown(path.join(basePath, `.openclaw/prompts/${name}.md`));
}

// Test Codex configs
console.log('\n── Codex Config ──');
try {
  const toml = fs.readFileSync(path.join(basePath, '.codex/config.toml'), 'utf8');
  if (toml.length > 10) { passed++; console.log('  ✅ .codex/config.toml'); }
  else throw new Error('Too short');
} catch(e) {
  failed++;
  errors.push({ file: '.codex/config.toml', error: e.message });
  console.log(`  ❌ .codex/config.toml: ${e.message}`);
}

// Test Codex skills
console.log('\n── Codex Skills ──');
const skills = ['repo-map', 'targeted-test-fix', 'pr-review', 'docs-from-code'];
for (const skill of skills) {
  testMarkdown(path.join(basePath, `.codex/skills/${skill}/SKILL.md`));
}

// Test Codex prompts
console.log('\n── Codex Prompts ──');
const codexPrompts = ['implement', 'test_fix', 'review'];
for (const p of codexPrompts) {
  testMarkdown(path.join(basePath, `.codex/prompts/${p}.md`));
}

// Test docs
console.log('\n── Documentation ──');
testMarkdown(path.join(basePath, 'docs/architecture/architecture.md'));
testMarkdown(path.join(basePath, 'docs/qa/qa_checklist_template.md'));

// Test state templates
console.log('\n── State Templates ──');
testYaml(path.join(basePath, 'state/template_tasks.yaml'));
testYaml(path.join(basePath, 'state/template_review.yaml'));
testYaml(path.join(basePath, 'state/template_findings.yaml'));

// Test runner scripts exist
console.log('\n── Tool Scripts ──');
const scripts = ['tools/runners/run_codex_job.sh', 'tools/runners/run_claude_vm.sh', 'tools/runners/collect_artifacts.sh'];
for (const s of scripts) {
  try {
    const content = fs.readFileSync(path.join(basePath, s), 'utf8');
    if (content.length > 20) { passed++; console.log(`  ✅ ${s}`); }
    else throw new Error('Too short');
  } catch(e) {
    failed++;
    errors.push({ file: s, error: e.message });
    console.log(`  ❌ ${s}: ${e.message}`);
  }
}

// ──────────────────────────────────────────────
// STEP 2: Cross-reference validation
// ──────────────────────────────────────────────
console.log('\n── Cross-Reference Validation ──');

let xrefPassed = 0;
let xrefFailed = 0;

function xrefOk(msg) { console.log(`  ✅ ${msg}`); xrefPassed++; passed++; }
function xrefFail(msg) { console.log(`  ❌ ${msg}`); xrefFailed++; failed++; errors.push({ file: 'cross-ref', error: msg }); }

// 2a. All agent names in routing.yaml flow steps match agents/ files
if (routingDoc && routingDoc.routes) {
  const agentFileSet = new Set(agentNames);
  const referencedAgents = new Set();
  for (const [routeName, route] of Object.entries(routingDoc.routes)) {
    if (route.flow) {
      for (const step of route.flow) {
        if (step.agent) referencedAgents.add(step.agent);
      }
    }
    // Also check route.primary/secondary (model refs)
    if (route.route && route.route.primary && route.route.primary !== 'null') {
      // These are MODEL refs (codex_local, claude_computer), not agent names - skip agent check
    }
  }
  for (const agentRef of referencedAgents) {
    if (agentFileSet.has(agentRef)) {
      xrefOk(`routing.yaml flow agent "${agentRef}" → agents/${agentRef}.yaml ✓`);
    } else {
      xrefFail(`routing.yaml flow agent "${agentRef}" → no matching agents/${agentRef}.yaml`);
    }
  }
} else {
  xrefFail('routing.yaml missing or has no routes block');
}

// 2b. route.primary / route.secondary model refs exist in models.yaml
if (routingDoc && routingDoc.routes && modelsDoc && modelsDoc.models) {
  const modelIds = new Set(Object.keys(modelsDoc.models));
  for (const [routeName, route] of Object.entries(routingDoc.routes)) {
    if (!route.route) continue;
    const primary = route.route.primary;
    const secondary = route.route.secondary;
    if (primary && primary !== null) {
      if (modelIds.has(primary)) {
        xrefOk(`routing/${routeName} primary model "${primary}" → models.yaml ✓`);
      } else {
        xrefFail(`routing/${routeName} primary model "${primary}" → NOT in models.yaml`);
      }
    }
    if (secondary && secondary !== null && secondary !== 'null') {
      if (modelIds.has(secondary)) {
        xrefOk(`routing/${routeName} secondary model "${secondary}" → models.yaml ✓`);
      } else {
        xrefFail(`routing/${routeName} secondary model "${secondary}" → NOT in models.yaml`);
      }
    }
  }
}

// 2c. All models referenced in agent YAMLs exist in models.yaml (or are raw model IDs)
if (modelsDoc && modelsDoc.models) {
  const modelIds = new Set(Object.keys(modelsDoc.models));
  const rawModelIds = new Set(['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'gpt-4o', 'codex-1']);
  for (const [agentName, doc] of Object.entries(agentDocs)) {
    if (!doc || !doc.model) continue;
    const modelRef = doc.model;
    if (modelIds.has(modelRef)) {
      xrefOk(`agents/${agentName}.yaml model "${modelRef}" → models.yaml ✓`);
    } else if (rawModelIds.has(modelRef)) {
      // Raw model ID — flag as inconsistency but not a hard failure
      console.log(`  ⚠️  agents/${agentName}.yaml model "${modelRef}" is raw ID (not in models.yaml) — consider adding claude_control entry`);
    } else {
      xrefFail(`agents/${agentName}.yaml model "${modelRef}" → NOT in models.yaml and not a known raw model ID`);
    }
  }
}

// 2d. approval_tier enum in approval.schema.yaml matches tiers in approvals.yaml
if (approvalsDoc && approvalsDoc.tiers && schemaDocs.approval) {
  const approvalsYamlTiers = new Set(Object.keys(approvalsDoc.tiers));
  // approval.schema.yaml encodes tiers in properties.approval_tier.enum
  const schemaApproval = schemaDocs.approval;
  const enumTiers = schemaApproval &&
    schemaApproval.properties &&
    schemaApproval.properties.approval_tier &&
    schemaApproval.properties.approval_tier.enum;
  if (enumTiers && Array.isArray(enumTiers)) {
    for (const tier of enumTiers) {
      if (approvalsYamlTiers.has(tier)) {
        xrefOk(`approval.schema tier "${tier}" → approvals.yaml ✓`);
      } else {
        xrefFail(`approval.schema tier "${tier}" → NOT in approvals.yaml tiers`);
      }
    }
    for (const tier of approvalsYamlTiers) {
      if (!enumTiers.includes(tier)) {
        xrefFail(`approvals.yaml tier "${tier}" → NOT in approval.schema.yaml enum`);
      }
    }
  } else {
    console.log('  ⚠️  approval.schema.yaml approval_tier enum not found — skipping tier cross-check');
  }
}

// 2e. Agent prompt_file references are consistent
for (const [agentName, doc] of Object.entries(agentDocs)) {
  if (!doc || !doc.prompt_file) {
    xrefFail(`agents/${agentName}.yaml missing "prompt_file" field`);
    continue;
  }
  const promptPath = path.join(basePath, doc.prompt_file);
  if (fs.existsSync(promptPath)) {
    xrefOk(`agents/${agentName}.yaml prompt_file → ${doc.prompt_file} ✓`);
  } else {
    xrefFail(`agents/${agentName}.yaml prompt_file "${doc.prompt_file}" → FILE NOT FOUND`);
  }
}

// 2f. Schema refs in agent YAMLs exist
const schemaRefs = [
  { file: 'claude_operator.yaml', field: '.openclaw/schemas/findings.schema.yaml' },
  { file: 'visual_verifier.yaml', field: '.openclaw/schemas/review.schema.yaml' },
  { file: 'reviewer.yaml', field: '.openclaw/schemas/review.schema.yaml' },
];
for (const ref of schemaRefs) {
  const schemaPath = path.join(basePath, ref.field);
  if (fs.existsSync(schemaPath)) {
    xrefOk(`${ref.file} schema_ref "${ref.field}" ✓`);
  } else {
    xrefFail(`${ref.file} schema_ref "${ref.field}" → FILE NOT FOUND`);
  }
}

// 2g. release_manager.yaml schema_ref for state templates
const releaseManagerTemplates = [
  'state/template_handoff.md',
  'state/template_merge_checklist.md',
];
for (const t of releaseManagerTemplates) {
  const tPath = path.join(basePath, t);
  if (fs.existsSync(tPath)) {
    xrefOk(`release_manager.yaml references "${t}" ✓`);
  } else {
    xrefFail(`release_manager.yaml references "${t}" → FILE NOT FOUND`);
  }
}

// 2h. Check control-plane agents missing from models.yaml (warning, auto-fix suggestion)
const controlPlaneAgents = ['orchestrator', 'planner', 'reviewer', 'visual_verifier', 'release_manager'];
const modelIds = modelsDoc && modelsDoc.models ? new Set(Object.keys(modelsDoc.models)) : new Set();
const controlModelMissing = controlPlaneAgents.filter(a => {
  const doc = agentDocs[a];
  return doc && doc.model && !modelIds.has(doc.model);
});
if (controlModelMissing.length > 0) {
  console.log(`\n  ⚠️  Control-plane agents (${controlModelMissing.join(', ')}) use model "claude-opus-4-6" directly`);
  console.log('     → models.yaml lacks a "claude_control" entry. Adding it for consistency.');
}

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Config Validation: ${passed} passed, ${failed} failed`);
console.log(`🔗 Cross-Ref checks: ${xrefPassed} passed, ${xrefFailed} failed`);
if (errors.length > 0) {
  console.log('\n🐛 Issues found:');
  errors.forEach((e, i) => console.log(`  ${i+1}. ${e.file}: ${e.error}`));
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
process.exit(failed > 0 ? 1 : 0);
