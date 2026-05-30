#!/usr/bin/env node
/**
 * index.js — Main Entry Point & CLI for OpenClaw Multi-Model Engine
 *
 * Usage:
 *   node engine/index.js route "สร้าง SEO content สำหรับ solar พิษณุโลก"
 *   node engine/index.js critique "Write SEO content" --drafter=claude --reviewer=chatgpt
 *   node engine/index.js parallel --tasks=tasks.yaml
 *   node engine/index.js cascade "Write investment proposal" --chain=qwen,claude
 *   node engine/index.js status
 *   node engine/index.js agents
 *   node engine/index.js serve          (start Telegram bot + scheduler)
 */

import { Orchestrator }       from './orchestrator.js';
import { AgentScheduler }     from './agent-scheduler.js';
import { TelegramBridge }     from './telegram-bridge.js';
import { AiCeo, getAiCeo }   from './ai-ceo.js';
import { PerformanceMax }     from './performance-max.js';
import { CeoDashboard }       from './ceo-dashboard.js';
import { ImprovementPlanner } from './improvement-plan.js';
import { logger }             from './config.js';
import { readFileSync }       from 'fs';

// ===== Parse CLI Arguments =====
const args    = process.argv.slice(2);
const command = args[0];
const options = parseArgs(args.slice(1));

function parseArgs(rawArgs) {
  const opts    = { _positional: [] };
  for (const arg of rawArgs) {
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=');
      opts[key] = val === undefined ? true : val;
    } else {
      opts._positional.push(arg);
    }
  }
  return opts;
}

// ===== Main =====
async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  OpenClaw Multi-Model Orchestration Engine ║');
  console.log('║  SIRINX AI-WarRoom v1.0.0                  ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');

  const engine    = new Orchestrator();
  const initResult = await engine.init({ verbose: command === 'status' });

  if (!command || command === 'help') {
    printHelp();
    return;
  }

  switch (command) {

    // ===== route — Auto-route task to best model =====
    case 'route': {
      const task = options._positional.join(' ') || options.task;
      if (!task) { console.error('❌ Usage: node index.js route "your task"'); process.exit(1); }

      console.log(`🔀 Auto-routing: "${task}"\n`);
      const result = await engine.route(task, {
        taskType:     options.type,
        costOptimize: options.cheap === true || options.cheap === 'true',
      });

      printResult(result);
      break;
    }

    // ===== critique — Draft→Review→Refine loop =====
    case 'critique': {
      const task = options._positional.join(' ') || options.task;
      if (!task) { console.error('❌ Usage: node index.js critique "your task"'); process.exit(1); }

      const drafter   = options.drafter   || 'claude';
      const reviewer  = options.reviewer  || 'chatgpt';
      const maxRounds = parseInt(options.rounds || '3');
      const threshold = parseInt(options.threshold || '75');

      console.log(`🔄 Critique Loop: "${task}"`);
      console.log(`   Drafter: ${drafter} → Reviewer: ${reviewer}`);
      console.log(`   Max rounds: ${maxRounds} | Quality threshold: ${threshold}\n`);

      let lastRound = 0;
      const result = await engine.critique(task, {
        drafter, reviewer, maxRounds,
        qualityThreshold: threshold,
        onProgress: ({ phase, round, score }) => {
          if (round && round !== lastRound) {
            console.log(`  Round ${round}: ${phase}${score ? ` — ${score}/100` : ''}`);
            lastRound = round;
          }
        },
      });

      printResult(result);
      break;
    }

    // ===== parallel — Run multiple tasks simultaneously =====
    case 'parallel': {
      let subTasks;

      if (options.tasks) {
        // Load from YAML file
        const { parse } = await import('yaml');
        const content   = readFileSync(options.tasks, 'utf-8');
        subTasks = parse(content);
      } else {
        // Default demo
        const task = options._positional.join(' ') || 'Demo task';
        subTasks = [
          { id: 'content', task, taskType: 'creative_content_th', model: 'claude' },
          { id: 'analysis', task: `วิเคราะห์: ${task}`, taskType: 'data_analysis', model: 'chatgpt' },
        ];
      }

      console.log(`⚡ Parallel Execution: ${subTasks.length} tasks\n`);
      const result = await engine.parallel(subTasks);
      printResult(result);
      break;
    }

    // ===== cascade — Cost-optimized escalation =====
    case 'cascade': {
      const task = options._positional.join(' ') || options.task;
      if (!task) { console.error('❌ Usage: node index.js cascade "your task"'); process.exit(1); }

      const chain     = options.chain?.split(',');
      const threshold = parseInt(options.threshold || '70');

      console.log(`📈 Cascade: "${task}"`);
      console.log(`   Chain: ${chain?.join(' → ') || 'auto (cheapest first)'}`);
      console.log(`   Threshold: ${threshold}\n`);

      let levelCount = 0;
      const result = await engine.cascade(task, {
        chain,
        qualityThreshold: threshold,
        onProgress: ({ phase, model }) => {
          if (phase === 'generating') console.log(`  Level ${++levelCount}: ${model}`);
          if (phase === 'escalating') console.log(`  ⬆️ Escalating...`);
          if (phase === 'accepted')   console.log(`  ✅ Quality accepted at ${model}`);
        },
      });

      printResult(result);
      break;
    }

    // ===== status — Show engine status =====
    case 'status': {
      const status = engine.getStatus();
      console.log('\n📊 Engine Status:\n');

      for (const [name, info] of Object.entries(status.models)) {
        const icon = info.available ? '✅' : '❌';
        const caps = info.capabilities?.slice(0, 3).join(', ') || '';
        console.log(`  ${icon} ${name.padEnd(12)} | ${info.available ? 'ready' : 'unavailable'} | ${caps}`);
      }

      const cost = status.cost;
      console.log(`\n💰 Session Cost: ${cost.totalTHB || 0} THB (${cost.totalCalls || 0} calls)`);
      console.log(`📅 Monthly Budget: ${status.budget.monthlyTHB} THB`);
      console.log(`   ${status.budget.note}`);
      break;
    }

    // ===== agents — Show 47 Ronin agent status =====
    case 'agents': {
      const scheduler = new AgentScheduler(engine);
      const report    = scheduler.getStatusReport();

      console.log('\n🤖 47 Ronin Agent Status:\n');
      console.log(`Active: ${report.summary.active} | Idle: ${report.summary.idle} | Blocked: ${report.summary.blocked}`);
      console.log(`Revenue potential: ${report.summary.totalRevenuePotentialTHB.toLocaleString()} THB\n`);

      for (const [layer, agents] of Object.entries(report.byLayer)) {
        if (agents.length === 0) continue;
        console.log(`${layer} (${agents.length} agents):`);
        for (const a of agents) {
          const icon   = a.status === 'active' ? '🟢' : '⚪';
          const status = a.currentTask ? `→ ${a.currentTask}` : `idle ${a.idleMinutes}m`;
          console.log(`  ${icon} #${String(agents.indexOf(a)+1).padStart(2)} ${a.codename.padEnd(20)} ${status}`);
        }
        console.log('');
      }
      break;
    }

    // ===== serve — Start Telegram bot + scheduler + AI CEO =====
    case 'serve': {
      console.log('🚀 Starting server mode...\n');

      // Build component chain
      const scheduler = new AgentScheduler(engine);

      const perfMax   = new PerformanceMax(scheduler, ({ agentId, type, message }) => {
        logger.warn(`[perf-max alert] ${type} | ${agentId} | ${message}`);
      });

      const bridge    = new TelegramBridge(engine, scheduler);

      const aiCeo     = getAiCeo({
        scheduler,
        orchestrator:  engine,
        perfMax,
        telegramBridge: bridge,
      });

      const dashboard = new CeoDashboard({ orchestrator: engine, scheduler, perfMax, aiCeo });
      const planner   = new ImprovementPlanner(engine, scheduler, perfMax);

      // Attach perfMax to scheduler
      scheduler.attachPerformanceMax(perfMax);

      // Start all
      aiCeo.start();
      scheduler.start();
      const telegramOk = await bridge.start();

      if (!telegramOk) {
        console.log('ℹ️  Telegram bot not started (no token) — running scheduler only');
      }

      // Register /ceo command on Telegram bridge
      if (bridge.bot) {
        bridge.bot.onText(/^\/ceo$/, async (msg) => {
          try {
            const text = dashboard.formatTelegramDashboard();
            await bridge._sendLong(msg.chat.id, text);
          } catch (err) {
            await bridge.bot.sendMessage(msg.chat.id, `❌ Dashboard error: ${err.message}`);
          }
        });

        bridge.bot.onText(/^\/analyze$/, async (msg) => {
          try {
            await bridge.bot.sendMessage(msg.chat.id, '🔍 Analyzing system...');
            const analysis = await planner.analyzeCurrentSystem();
            await bridge._sendLong(msg.chat.id, planner.formatReport());
          } catch (err) {
            await bridge.bot.sendMessage(msg.chat.id, `❌ Analysis error: ${err.message}`);
          }
        });

        // Update help message to include new commands
        console.log('   New commands: /ceo /analyze');
      }

      // Log status every 5 minutes
      setInterval(() => {
        const summary = dashboard.formatQuickSummary();
        logger.info(`[status] ${summary}`);
      }, 5 * 60 * 1000);

      console.log('✅ Engine running. Press Ctrl+C to stop.');
      console.log('   Telegram commands: /orchestrate /critique /parallel /cascade /status /agents /cost /ceo /analyze\n');

      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        aiCeo.stop();
        scheduler.stop();
        await bridge.stop();
        console.log('Goodbye!');
        process.exit(0);
      });

      // Keep alive
      await new Promise(() => {});
      break;
    }

    default: {
      console.error(`❌ Unknown command: "${command}"`);
      printHelp();
      process.exit(1);
    }
  }
}

function printResult(result) {
  console.log('\n════════════════════════════════════════\n');

  if (result.success === false) {
    console.error(`❌ Error: ${result.error}`);
    return;
  }

  // Workflow-specific stats
  if (result.workflow === 'critique_loop') {
    console.log(`✅ Score: ${result.quality?.finalScore}/100 | Rounds: ${result.totalRounds}`);
  } else if (result.workflow === 'parallel_build') {
    console.log(`✅ Parallel: ${result.successful}/${result.subTaskResults?.length} tasks`);
  } else if (result.workflow === 'cascade') {
    console.log(`✅ Score: ${result.quality?.finalScore}/100 | Levels: ${result.quality?.levels}`);
  } else {
    console.log(`✅ Routed to: ${result.routedTo || result.modelId}`);
  }

  const cost    = result.totalCost || result.cost;
  const tokens  = result.totalTokens || result.usage?.totalTokens;
  const latency = result.latencyMs;

  if (cost)    console.log(`💰 Cost: ${cost.thb?.toFixed(6)} THB (${cost.usd?.toFixed(6)} USD)`);
  if (tokens)  console.log(`📊 Tokens: ${tokens?.toLocaleString()}`);
  if (latency) console.log(`⏱️  Time: ${latency}ms`);

  console.log('\n--- Content ---\n');
  const content = result.content || '';
  console.log(content.slice(0, 3000));
  if (content.length > 3000) {
    console.log(`\n... [${content.length - 3000} more characters — redirect to file for full output]`);
  }
}

function printHelp() {
  console.log(`
Commands:
  route     "task"              Auto-route to best model
  critique  "task"              Claude drafts → ChatGPT reviews → Claude refines
  parallel  --tasks=file.yaml  Run multiple tasks simultaneously
  cascade   "task"             Qwen → Gemini → Claude (escalate on low quality)
  status                       Show model availability & costs
  agents                       Show all 47 Ronin agent statuses
  serve                        Start Telegram bot + agent scheduler

Options:
  --drafter=claude             Model to draft (critique mode)
  --reviewer=chatgpt           Model to review (critique mode)
  --rounds=3                   Max critique rounds
  --threshold=75               Quality threshold (0-100)
  --chain=qwen,gemini,claude   Custom cascade chain
  --type=seo_content           Override task type routing
  --cheap                      Prefer cost-optimized models

Examples:
  node index.js route "สร้าง SEO article สำหรับ solar พิษณุโลก"
  node index.js critique "Write investment proposal" --drafter=claude --rounds=2
  node index.js cascade "Write blog post" --chain=qwen,claude --threshold=80
  node index.js serve
`);
}

main().catch(err => {
  logger.error(`Fatal: ${err.message}`);
  if (process.env.ENGINE_LOG_LEVEL === 'debug') console.error(err.stack);
  process.exit(1);
});
