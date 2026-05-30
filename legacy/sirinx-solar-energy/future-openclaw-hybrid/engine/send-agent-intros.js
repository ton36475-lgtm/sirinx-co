#!/usr/bin/env node
/**
 * send-agent-intros.js — ส่ง agent intros ทุกตัวไปยัง Telegram
 * แต่ละ agent แนะนำตัวพร้อม role และหน้าที่โดยละเอียด
 *
 * Usage: node engine/send-agent-intros.js
 */

import { AGENTS } from './agent-definitions.js';
import { logger } from './config.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;
const DELAY_MS  = 800;  // หน่วงระหว่าง messages เพื่อไม่โดน rate limit

// ===== Layer metadata =====
const LAYER_META = {
  L1:      { emoji: '📡', title: 'Layer 1 — Perception (รับรู้ข้อมูล)',      budget: '4K tokens' },
  L2:      { emoji: '🔬', title: 'Layer 2 — Analysis (วิเคราะห์)',           budget: '8K tokens' },
  L3:      { emoji: '⚖️',  title: 'Layer 3 — Decision (ตัดสินใจ)',            budget: '16K tokens' },
  L4:      { emoji: '🎯', title: 'Layer 4 — Coordination (ประสานงาน)',       budget: '32K tokens' },
  L5:      { emoji: '🔭', title: 'Layer 5 — R&D Bunker (วิจัยและพัฒนา)',     budget: '128K tokens' },
  Chatbot: { emoji: '💬', title: 'Chatbot — Customer Interface',              budget: '16K tokens' },
};

const MODEL_LABEL = {
  claude:  'Claude (Anthropic)',
  chatgpt: 'ChatGPT (OpenAI)',
  gemini:  'Gemini (Google)',
  qwen:    'Qwen (Alibaba)',
  ollama:  'Ollama (Local)',
};

// ===== Telegram API =====
async function sendMessage(text, parseMode = 'HTML') {
  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error('TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID ไม่มีใน .env');
  }
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: parseMode, disable_web_page_preview: true }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram error: ${data.description}`);
  return data;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ===== Format agent intro =====
function formatAgentIntro(agent) {
  const layer  = LAYER_META[agent.layer] || { emoji: '🤖', title: agent.layer, budget: '-' };
  const model  = MODEL_LABEL[agent.model] || agent.model;
  const skills = agent.skills.map(s => `• ${s.replace(/_/g, ' ')}`).join('\n');

  return `${layer.emoji} <b>Agent #${String(agent.number).padStart(2, '0')} — ${agent.codename}</b>
━━━━━━━━━━━━━━━━━━━━
🏷️ <b>Role:</b> ${agent.role}
🏛️ <b>Layer:</b> ${layer.title}
🤖 <b>Model:</b> ${model} (${agent.tier})

📋 <b>หน้าที่หลัก:</b>
${agent.specialization}

⚡ <b>ทักษะ:</b>
${skills}

💾 <b>Token Budget:</b> ${layer.budget}
🎯 <b>Task Type:</b> ${agent.taskType}`;
}

// ===== Main =====
async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  SIRINX 47 Ronin — Agent Intro Broadcast ║');
  console.log('╚══════════════════════════════════════════╝\n');

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ ไม่พบ TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID ใน .env');
    process.exit(1);
  }

  // 1. Header message
  await sendMessage(
`🏯 <b>SIRINX AI-WarRoom เปิดทำการ!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
⚔️ ระบบ <b>47 Ronin Multi-Agent</b> พร้อมแล้ว
🤖 Agents ทุกตัวจะแนะนำตัวตามลำดับ

🏗️ <b>โครงสร้าง:</b>
📡 L1 Perception — 16 agents (สแกนข้อมูล)
🔬 L2 Analysis — 9 agents (วิเคราะห์)
⚖️ L3 Decision — 10 agents (ตัดสินใจ)
🎯 L4 Coordination — 8 agents (ประสานงาน)
🔭 L5 R&D Bunker — 4 agents (วิจัย)
💬 Chatbot — Kai (ดูแลลูกค้า)

✅ Model หลัก: <b>Ollama qwen2.5-coder:7b</b> (Local/Free)
💰 ค่าใช้จ่าย: <b>0 THB</b>`
  );
  console.log('✅ Header sent');
  await sleep(DELAY_MS);

  // 2. Group by layer and send each group header + agents
  const layers = ['L1', 'L2', 'L3', 'L4', 'L5', 'Chatbot'];

  for (const layerKey of layers) {
    const layerAgents = AGENTS.filter(a => a.layer === layerKey);
    if (!layerAgents.length) continue;

    const meta = LAYER_META[layerKey];

    // Layer header
    await sendMessage(`${meta.emoji} <b>━━ ${meta.title} ━━</b>\n${layerAgents.length} agents | ${meta.budget} per agent`);
    console.log(`\n📂 Layer ${layerKey} (${layerAgents.length} agents)`);
    await sleep(DELAY_MS);

    // Each agent
    for (const agent of layerAgents) {
      try {
        const msg = formatAgentIntro(agent);
        await sendMessage(msg);
        console.log(`  ✅ #${agent.number} ${agent.codename}`);
        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`  ❌ #${agent.number} ${agent.codename}: ${err.message}`);
        await sleep(DELAY_MS * 2);
      }
    }
  }

  // 3. Footer
  await sendMessage(
`🎌 <b>47 Ronin พร้อมรับคำสั่ง!</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Agents ทั้งหมด: 47 + Kai = 48 ตัว
🆓 Engine: Ollama Local (qwen2.5-coder:7b)
💾 Backup: Gemini Free Tier

⚔️ พิมพ์คำสั่งผ่าน Telegram Bridge:
/orchestrate &lt;task&gt; — ส่งงาน
/critique &lt;task&gt;    — Draft → Review
/status             — ดูสถานะ
/agents             — สรุป agents
/cost               — ดูค่าใช้จ่าย`
  );

  console.log('\n🎌 เสร็จสิ้น! ส่ง intros ครบทุก agent แล้ว\n');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
