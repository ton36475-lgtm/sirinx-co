/**
 * Comprehensive OpenClaw Engine Test Suite
 * Tests all modules load + basic structural integrity
 */

import { createRequire } from 'module';
import assert from 'assert';

let passed = 0;
let failed = 0;
const errors = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    errors.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    errors.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

console.log('\n🧪 OpenClaw Engine Test Suite\n');

// ── Config ──
console.log('── Config ──');
let configMod;
await testAsync('config.js loads', async () => { configMod = await import('../config.js'); });
test('config exports PRICING or config object', () => {
  assert(configMod && (configMod.PRICING || configMod.config || configMod.logger || configMod.default));
});
test('config exports logger', () => {
  assert(configMod && configMod.logger, 'logger not exported');
});

// ── Model Registry ──
console.log('\n── Model Registry ──');
let registryMod;
await testAsync('model-registry.js loads', async () => { registryMod = await import('../model-registry.js'); });
test('has ModelRegistry or TASK_MODEL_MAP', () => {
  assert(registryMod && (registryMod.ModelRegistry || registryMod.TASK_MODEL_MAP || registryMod.getRegistry));
});

// ── Cost Optimizer ──
console.log('\n── Cost Optimizer ──');
let costMod;
await testAsync('cost-optimizer.js loads', async () => { costMod = await import('../cost-optimizer.js'); });
test('CostOptimizer exported', () => {
  assert(costMod && (costMod.CostOptimizer || costMod.default));
});

// ── Agent Definitions ──
console.log('\n── Agent Definitions ──');
let agentDefMod;
await testAsync('agent-definitions.js loads', async () => { agentDefMod = await import('../agent-definitions.js'); });
test('has 47+ agents', () => {
  const agents = agentDefMod.AGENTS || agentDefMod.agents || agentDefMod.RONIN_47 || agentDefMod.default;
  const count = Array.isArray(agents) ? agents.length : Object.keys(agents || {}).length;
  assert(count >= 47, `Expected 47+ agents, got ${count}`);
});
test('agents have required fields', () => {
  const agents = agentDefMod.AGENTS || agentDefMod.agents || agentDefMod.RONIN_47 || agentDefMod.default;
  const arr = Array.isArray(agents) ? agents : Object.values(agents || {});
  const sample = arr.slice(0, 5);
  for (const a of sample) {
    assert(a.codename || a.name || a.id, `Agent missing identifier: ${JSON.stringify(a)}`);
  }
});

// ── Agent Scheduler ──
console.log('\n── Agent Scheduler ──');
let schedulerMod;
await testAsync('agent-scheduler.js loads', async () => { schedulerMod = await import('../agent-scheduler.js'); });
test('AgentScheduler exported', () => {
  assert(schedulerMod && (schedulerMod.AgentScheduler || schedulerMod.default));
});

// ── Task Generator ──
console.log('\n── Task Generator ──');
let taskGenMod;
await testAsync('task-generator.js loads', async () => { taskGenMod = await import('../task-generator.js'); });
test('TaskGenerator exported', () => {
  assert(taskGenMod && (taskGenMod.TaskGenerator || taskGenMod.default));
});

// ── Model Adapters ──
console.log('\n── Model Adapters ──');
let baseModelMod, claudeMod, chatgptMod, geminiMod, qwenMod;
await testAsync('models/base-model.js loads', async () => { baseModelMod = await import('../models/base-model.js'); });
await testAsync('models/claude.js loads',      async () => { claudeMod    = await import('../models/claude.js'); });
await testAsync('models/chatgpt.js loads',     async () => { chatgptMod   = await import('../models/chatgpt.js'); });
await testAsync('models/gemini.js loads',      async () => { geminiMod    = await import('../models/gemini.js'); });
await testAsync('models/qwen.js loads',        async () => { qwenMod      = await import('../models/qwen.js'); });

test('BaseModel exported', () => {
  assert(baseModelMod && (baseModelMod.BaseModel || baseModelMod.default));
});
test('ClaudeModel exported', () => {
  assert(claudeMod && (claudeMod.ClaudeModel || claudeMod.default));
});
test('ChatGPTModel exported', () => {
  assert(chatgptMod && (chatgptMod.ChatGPTModel || chatgptMod.default));
});
test('GeminiModel exported', () => {
  assert(geminiMod && (geminiMod.GeminiModel || geminiMod.default));
});
test('QwenModel exported', () => {
  assert(qwenMod && (qwenMod.QwenModel || qwenMod.default));
});

// ── Workflows ──
console.log('\n── Workflows ──');
let critiqueMod, parallelMod, cascadeMod;
await testAsync('workflows/critique-loop.js loads', async () => { critiqueMod = await import('../workflows/critique-loop.js'); });
await testAsync('workflows/parallel-build.js loads', async () => { parallelMod = await import('../workflows/parallel-build.js'); });
await testAsync('workflows/cascade.js loads',         async () => { cascadeMod  = await import('../workflows/cascade.js'); });

test('CritiqueLoop exported', () => {
  assert(critiqueMod && (critiqueMod.CritiqueLoop || critiqueMod.default));
});
test('ParallelBuild exported', () => {
  assert(parallelMod && (parallelMod.ParallelBuild || parallelMod.default));
});
test('Cascade exported', () => {
  assert(cascadeMod && (cascadeMod.Cascade || cascadeMod.default));
});

// ── Artifacts ──
console.log('\n── Artifacts ──');
let artifactStoreMod, schemasMod;
await testAsync('artifacts/artifact-store.js loads', async () => { artifactStoreMod = await import('../artifacts/artifact-store.js'); });
await testAsync('artifacts/schemas.js loads',         async () => { schemasMod        = await import('../artifacts/schemas.js'); });

test('ArtifactStore exported', () => {
  assert(artifactStoreMod && (artifactStoreMod.ArtifactStore || artifactStoreMod.default));
});
test('schemas has at least one export', () => {
  assert(schemasMod && Object.keys(schemasMod).length > 0);
});

// ── Orchestrator ──
console.log('\n── Orchestrator ──');
let orchestratorMod;
await testAsync('orchestrator.js loads', async () => { orchestratorMod = await import('../orchestrator.js'); });
test('Orchestrator exported', () => {
  assert(orchestratorMod && (orchestratorMod.Orchestrator || orchestratorMod.default));
});

// ── AI CEO System ──
console.log('\n── AI CEO System ──');
let aiCeoMod, approvalMod, perfMaxMod, sysAccessMod, improveMod, ceoDashMod;
await testAsync('ai-ceo.js loads',          async () => { aiCeoMod    = await import('../ai-ceo.js'); });
await testAsync('approval-engine.js loads', async () => { approvalMod = await import('../approval-engine.js'); });
await testAsync('performance-max.js loads', async () => { perfMaxMod  = await import('../performance-max.js'); });
await testAsync('system-access.js loads',   async () => { sysAccessMod = await import('../system-access.js'); });
await testAsync('improvement-plan.js loads',async () => { improveMod  = await import('../improvement-plan.js'); });
await testAsync('ceo-dashboard.js loads',   async () => { ceoDashMod  = await import('../ceo-dashboard.js'); });

test('AiCeo exported', () => {
  assert(aiCeoMod && (aiCeoMod.AiCeo || aiCeoMod.default));
});
test('ApprovalEngine exported', () => {
  assert(approvalMod && (approvalMod.ApprovalEngine || approvalMod.default));
});
test('PerformanceMax exported', () => {
  assert(perfMaxMod && (perfMaxMod.PerformanceMax || perfMaxMod.default));
});
test('SystemAccess exported', () => {
  assert(sysAccessMod && (sysAccessMod.SystemAccess || sysAccessMod.getSystemAccess || sysAccessMod.default));
});
test('ImprovementPlanner exported', () => {
  assert(improveMod && (improveMod.ImprovementPlanner || improveMod.default));
});
test('CeoDashboard exported', () => {
  assert(ceoDashMod && (ceoDashMod.CeoDashboard || ceoDashMod.default));
});

// ── CeoDashboard instantiation ──
console.log('\n── CeoDashboard Instantiation ──');
test('CeoDashboard instantiates with no args', () => {
  const Cls = ceoDashMod.CeoDashboard || ceoDashMod.default;
  const inst = new Cls();
  assert(inst instanceof Cls);
});
test('CeoDashboard.formatQuickSummary() runs without throwing', () => {
  const Cls = ceoDashMod.CeoDashboard || ceoDashMod.default;
  const inst = new Cls();
  const result = inst.formatQuickSummary();
  assert(typeof result === 'string');
});
test('CeoDashboard.getSystemHealthSection() runs without throwing', () => {
  const Cls = ceoDashMod.CeoDashboard || ceoDashMod.default;
  const inst = new Cls();
  const result = inst.getSystemHealthSection();
  assert(result && typeof result === 'object');
});

// ── AgentScheduler instantiation ──
console.log('\n── AgentScheduler Instantiation ──');
test('AgentScheduler instantiates and loads 47+ agents', () => {
  const Cls = schedulerMod.AgentScheduler || schedulerMod.default;
  const sched = new Cls();
  const all = sched.getAllAgents?.() || [];
  assert(all.length >= 47, `Expected 47+ agents in scheduler, got ${all.length}`);
});
test('AgentScheduler.getStatusReport() returns valid structure', () => {
  const Cls = schedulerMod.AgentScheduler || schedulerMod.default;
  const sched = new Cls();
  const report = sched.getStatusReport?.();
  assert(report && report.summary, 'Missing summary in status report');
  assert(typeof report.summary.totalAgents === 'number');
});

// ── Telegram Bridge ──
console.log('\n── Telegram Bridge ──');
let telegramMod;
await testAsync('telegram-bridge.js loads', async () => { telegramMod = await import('../telegram-bridge.js'); });
test('TelegramBridge exported', () => {
  assert(telegramMod && (telegramMod.TelegramBridge || telegramMod.default));
});

// ── Index/CLI ──
console.log('\n── Index/CLI ──');
// We don't require index.js because it auto-runs; just verify it exists
import { existsSync } from 'fs';
test('index.js file exists', () => {
  assert(existsSync(new URL('../index.js', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')));
});

// ══════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Results: ${passed} passed, ${failed} failed`);
if (errors.length > 0) {
  console.log('\n🐛 Bugs found:');
  errors.forEach((e, i) => console.log(`  ${i + 1}. ${e.name}\n     → ${e.error}`));
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
process.exit(failed > 0 ? 1 : 0);
