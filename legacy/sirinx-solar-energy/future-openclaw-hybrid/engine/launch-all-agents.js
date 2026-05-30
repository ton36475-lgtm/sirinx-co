#!/usr/bin/env node
/**
 * launch-all-agents.js — สั่งให้ Agent ทุกตัวทำงานทันที
 * แต่ละ agent รันงาน priority สูงสุดของตัวเอง
 * รัน 3 agents พร้อมกัน (Ollama 7b sequential internally)
 * รายงานผลแต่ละ agent ไป Telegram real-time
 */

import { Orchestrator }     from './orchestrator.js';
import { AGENTS }           from './agent-definitions.js';
import { TaskGenerator }    from './task-generator.js';
import { logger }           from './config.js';

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID    = process.env.TELEGRAM_CHAT_ID;
const CONCURRENCY = 3;

// ===== Telegram =====
async function tg(text) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch {}
}

// ===== Concurrency limiter =====
async function runWithConcurrency(items, fn, limit) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

// ===== Layer emoji =====
const LAYER_EMOJI = { L1: '📡', L2: '🔬', L3: '⚖️', L4: '🎯', L5: '🔭', Chatbot: '💬' };

// ===== Main =====
async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  47 Ronin — LAUNCH ALL AGENTS NOW        ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Init engine
  const engine = new Orchestrator();
  await engine.init();

  const gen = new TaskGenerator();

  // Build task list — top priority task สำหรับแต่ละ agent
  const agentTasks = [];
  for (const agent of AGENTS) {
    const templates = gen.generateForAgent(agent);
    if (!templates || templates.length === 0) continue;
    const top = templates.sort((a, b) => {
      const p = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (p[a.priority] || 2) - (p[b.priority] || 2);
    })[0];
    agentTasks.push({ agent, task: top });
  }

  const total = agentTasks.length;
  console.log(`\n🚀 Starting ${total} agents...\n`);

  // Telegram: start broadcast
  await tg(
`⚔️ <b>47 Ronin — ALL AGENTS LAUNCHING</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Agents: <b>${total} ตัว</b>
🖥️ Engine: Ollama qwen2.5-coder:7b (Local)
⚡ Concurrency: ${CONCURRENCY} agents พร้อมกัน
━━━━━━━━━━━━━━━━━━━━━━━━━━
เริ่มแล้ว! รายงานผลทุก agent...`
  );

  let completed = 0;
  let failed    = 0;
  let totalCost = 0;
  const results = [];

  // Run all agents
  await runWithConcurrency(agentTasks, async ({ agent, task }, idx) => {
    const emoji = LAYER_EMOJI[agent.layer] || '🤖';
    const startedAt = Date.now();

    try {
      console.log(`▶ [${idx + 1}/${total}] ${agent.codename} — ${task.task.slice(0, 60)}...`);

      const result = await engine.route(task.task, {
        taskType:     agent.taskType,
        costOptimize: ['L1', 'L2'].includes(agent.layer),
      });

      const latencyMs = Date.now() - startedAt;
      const costTHB   = result.cost?.thb || 0;
      totalCost      += costTHB;
      completed++;

      const preview = result.content?.slice(0, 200).replace(/</g, '&lt;').replace(/>/g, '&gt;');

      console.log(`  ✅ ${agent.codename} | ${result.routedTo} | ${latencyMs}ms | ${costTHB.toFixed(4)} THB`);

      await tg(
`${emoji} <b>#${agent.number} ${agent.codename}</b> ✅
📋 <b>งาน:</b> ${task.task.slice(0, 80)}
🤖 <b>Model:</b> ${result.routedTo} | ⏱ ${(latencyMs/1000).toFixed(1)}s | 💰 ${costTHB.toFixed(4)} THB

📝 <b>ผลลัพธ์:</b>
${preview}...
[${completed}/${total}]`
      );

      results.push({ agent, task, result, latencyMs, costTHB, success: true });

    } catch (err) {
      failed++;
      console.error(`  ❌ ${agent.codename}: ${err.message}`);
      await tg(`${emoji} <b>#${agent.number} ${agent.codename}</b> ❌\n${err.message.slice(0, 100)}`);
      results.push({ agent, task, error: err.message, success: false });
    }
  }, CONCURRENCY);

  // Final summary
  const totalRevenue = agentTasks.reduce((s, { task }) => s + (task.estimatedRevenueTHB || 0), 0);

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Completed: ${completed}/${total} | ❌ Failed: ${failed}`);
  console.log(`💰 Total Cost: ${totalCost.toFixed(4)} THB`);
  console.log(`📈 Revenue Potential: ${totalRevenue.toLocaleString()} THB`);
  console.log(`${'═'.repeat(50)}\n`);

  await tg(
`🎌 <b>47 Ronin — ALL AGENTS COMPLETED</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ สำเร็จ: <b>${completed}/${total}</b>
❌ ล้มเหลว: <b>${failed}</b>

💰 Engine Cost: <b>${totalCost.toFixed(4)} THB</b>
📈 Revenue Potential: <b>${totalRevenue.toLocaleString()} THB</b>
🖥️ Model Used: Ollama qwen2.5-coder:7b

⚔️ ภารกิจ 47 Ronin สำเร็จ!`
  );
}

main().catch(err => {
  logger.error(`Fatal: ${err.message}`);
  process.exit(1);
});
