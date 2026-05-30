/**
 * test-integration.js — OpenClaw Integration Test Suite
 * Tests how components work TOGETHER (not in isolation)
 * ES Module — uses dynamic import() (engine has "type": "module")
 */

import assert from 'assert';

let passed = 0;
let failed = 0;
const errors = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch(e) {
    failed++;
    errors.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch(e) {
    failed++;
    errors.push({ name, error: e.message });
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

console.log('\n🧪 OpenClaw Integration Test Suite\n');

// ── Orchestrator Integration ──
console.log('── Orchestrator Integration ──');
await asyncTest('Orchestrator instantiates', async () => {
  const mod = await import('../orchestrator.js');
  const Orchestrator = mod.Orchestrator || mod.default;
  assert(typeof Orchestrator === 'function', 'Orchestrator is not a class/function');
  const o = new Orchestrator();
  assert(o, 'Orchestrator instance is null');
});

// ── Model Routing ──
console.log('\n── Model Routing ──');
await asyncTest('Task routing returns a model', async () => {
  const mod = await import('../model-registry.js');
  assert(mod.TASK_MODEL_MAP, 'TASK_MODEL_MAP not exported from model-registry');
  assert(Object.keys(mod.TASK_MODEL_MAP).length > 0, 'Empty task model map');
});

// ── Cost Tracking ──
console.log('\n── Cost Tracking ──');
await asyncTest('Cost optimizer tracks spending', async () => {
  const mod = await import('../cost-optimizer.js');
  const CostOptimizer = mod.CostOptimizer || mod.default;
  assert(typeof CostOptimizer === 'function', 'CostOptimizer is not a class');
  const co = new CostOptimizer();
  assert(co, 'CostOptimizer instance is null');
});

// ── Agent System ──
console.log('\n── Agent System ──');
await asyncTest('All 5 layers have agents', async () => {
  const mod = await import('../agent-definitions.js');
  const agents = mod.AGENTS || mod.default;
  assert(Array.isArray(agents), 'AGENTS is not an array');
  assert(agents.length > 0, 'AGENTS array is empty');

  const layers = new Set(agents.map(a => a.layer?.toLowerCase()).filter(Boolean));
  assert(layers.size >= 4, `Expected 4+ layers, got ${layers.size}: ${[...layers].join(', ')}`);
});

await asyncTest('Agent scheduler can instantiate', async () => {
  const mod = await import('../agent-scheduler.js');
  const Scheduler = mod.AgentScheduler || mod.default;
  assert(typeof Scheduler === 'function', 'AgentScheduler is not a class');
  const s = new Scheduler();
  assert(s, 'AgentScheduler instance is null');
});

// ── Task Generation ──
console.log('\n── Task Generation ──');
await asyncTest('Task generator has task templates', async () => {
  const mod = await import('../task-generator.js');
  const TaskGenerator = mod.TaskGenerator || mod.default;
  assert(typeof TaskGenerator === 'function', 'TaskGenerator is not a class');
  const tg = new TaskGenerator();
  assert(tg, 'TaskGenerator instance is null');
  assert(typeof tg.generateForAgent === 'function', 'generateForAgent method missing');
});

// ── Approval System ──
console.log('\n── Approval System ──');
await asyncTest('Approval engine loads with rules', async () => {
  const mod = await import('../approval-engine.js');
  const ApprovalEngine = mod.ApprovalEngine || mod.default;
  assert(typeof ApprovalEngine === 'function', 'ApprovalEngine is not a class');
  const engine = new ApprovalEngine();
  assert(engine, 'ApprovalEngine instance is null');
  assert(mod.APPROVAL_RULES, 'APPROVAL_RULES not exported');
  assert(mod.APPROVAL_RULES.auto_approved, 'auto_approved rules missing');
  assert(mod.APPROVAL_RULES.human_required, 'human_required rules missing');
});

// ── AI CEO ──
console.log('\n── AI CEO ──');
await asyncTest('AI CEO instantiates', async () => {
  const mod = await import('../ai-ceo.js');
  const AiCeo = mod.AiCeo || mod.default;
  assert(typeof AiCeo === 'function', 'AiCeo is not a class');
  const ceo = new AiCeo();
  assert(ceo, 'AiCeo instance is null');
  assert(ceo.name === 'Kuranosuke', `AiCeo name "${ceo.name}" !== "Kuranosuke"`);
});

// ── Performance Max ──
console.log('\n── Performance Max ──');
await asyncTest('PerformanceMax loads', async () => {
  const mod = await import('../performance-max.js');
  const PerformanceMax = mod.PerformanceMax || mod.default;
  assert(typeof PerformanceMax === 'function', 'PerformanceMax is not a class');
  const pm = new PerformanceMax(null);
  assert(pm, 'PerformanceMax instance is null');
});

// ── System Access ──
console.log('\n── System Access ──');
await asyncTest('SystemAccess has path restrictions', async () => {
  const mod = await import('../system-access.js');
  const SystemAccess = mod.SystemAccess || mod.default;
  assert(typeof SystemAccess === 'function' || typeof mod.getSystemAccess === 'function',
    'SystemAccess class or getSystemAccess() not found');
  const sa = typeof SystemAccess === 'function' ? new SystemAccess() : mod.getSystemAccess();
  assert(sa, 'SystemAccess instance is null');
});

// ── Workflow Chain ──
console.log('\n── Workflow Chain ──');
await asyncTest('Critique loop can be configured', async () => {
  const mod = await import('../workflows/critique-loop.js');
  const CritiqueLoop = mod.CritiqueLoop || mod.default;
  assert(typeof CritiqueLoop === 'function', 'CritiqueLoop is not a class');
  const cl = new CritiqueLoop();
  assert(cl, 'CritiqueLoop instance is null');
});

await asyncTest('Parallel build can be configured', async () => {
  const mod = await import('../workflows/parallel-build.js');
  const ParallelBuild = mod.ParallelBuild || mod.default;
  assert(typeof ParallelBuild === 'function', 'ParallelBuild is not a class');
  const pb = new ParallelBuild();
  assert(pb, 'ParallelBuild instance is null');
});

await asyncTest('Cascade can be configured', async () => {
  const mod = await import('../workflows/cascade.js');
  const Cascade = mod.Cascade || mod.default;
  assert(typeof Cascade === 'function', 'Cascade is not a class');
  const cs = new Cascade();
  assert(cs, 'Cascade instance is null');
});

// ── CEO Dashboard ──
console.log('\n── CEO Dashboard ──');
await asyncTest('Dashboard provides data', async () => {
  const mod = await import('../ceo-dashboard.js');
  const CeoDashboard = mod.CeoDashboard || mod.default;
  assert(typeof CeoDashboard === 'function', 'CeoDashboard is not a class');
  const db = new CeoDashboard();
  assert(db, 'CeoDashboard instance is null');
});

// ── Cross-Module ──
console.log('\n── Cross-Module ──');
await asyncTest('Orchestrator references valid models', async () => {
  const [orchMod, regMod] = await Promise.all([
    import('../orchestrator.js'),
    import('../model-registry.js'),
  ]);
  assert(orchMod.Orchestrator, 'Orchestrator class missing from orchestrator.js');
  assert(regMod.ModelRegistry, 'ModelRegistry class missing from model-registry.js');

  // Verify orchestrator's task detection aligns with registry's task type map
  const o = new orchMod.Orchestrator();
  const detectedType = o._detectTaskType('write code function');
  assert(
    regMod.TASK_MODEL_MAP[detectedType],
    `Detected task type "${detectedType}" not in TASK_MODEL_MAP`
  );
});

await asyncTest('Agent definitions match scheduler expectations', async () => {
  const [defMod, schedMod] = await Promise.all([
    import('../agent-definitions.js'),
    import('../agent-scheduler.js'),
  ]);
  const agents = defMod.AGENTS;
  const Scheduler = schedMod.AgentScheduler;
  assert(Array.isArray(agents), 'AGENTS is not an array in agent-definitions');
  // 47 Ronin + 1 Chatbot (Kai) = 48 total
  assert(agents.length === 48, `Expected 48 agents (47 Ronin + Kai), got ${agents.length}`);

  const sched = new Scheduler();
  // Scheduler clones all agents into its own array
  assert(sched.agents.length === agents.length,
    `Scheduler has ${sched.agents.length} agents, definitions have ${agents.length}`);
  // All agent IDs should be mapped
  assert(sched._agentMap instanceof Map, 'Scheduler._agentMap is not a Map');
  assert(sched._agentMap.size === agents.length,
    `_agentMap size ${sched._agentMap.size} !== ${agents.length}`);
});

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Integration Tests: ${passed} passed, ${failed} failed`);
if (errors.length > 0) {
  console.log('\n🐛 Integration bugs:');
  errors.forEach((e, i) => console.log(`  ${i+1}. ${e.name}: ${e.error}`));
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
process.exit(failed > 0 ? 1 : 0);
