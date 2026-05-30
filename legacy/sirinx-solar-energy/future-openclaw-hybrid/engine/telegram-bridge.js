/**
 * telegram-bridge.js — Bridge ระหว่าง Orchestrator กับ Telegram Bot
 * Commands:
 *   /orchestrate [task]  — Auto-route task ไปยัง best model
 *   /critique [task]     — Run critique loop (Claude drafts, ChatGPT reviews)
 *   /parallel [json]     — Run parallel tasks
 *   /cascade [task]      — Run cascade (cheapest → best)
 *   /status              — แสดงสถานะ engine และ costs
 *   /agents              — แสดงสถานะ 47 Ronin agents ทั้งหมด
 *   /cost                — สรุป cost ประจำ session
 */

import { logger, API_KEYS } from './config.js';

export class TelegramBridge {
  /**
   * @param {Orchestrator} orchestrator
   * @param {AgentScheduler} [agentScheduler] — Optional 47 Ronin scheduler
   */
  constructor(orchestrator, agentScheduler = null) {
    this.orchestrator    = orchestrator;
    this.agentScheduler  = agentScheduler;
    this.bot             = null;
    this.chatId          = API_KEYS.telegram.chatId;
    this._running        = false;
  }

  /**
   * เริ่มต้น Telegram bot
   */
  async start() {
    if (!API_KEYS.telegram.token) {
      logger.warn('[telegram] TELEGRAM_BOT_TOKEN ไม่มี — Telegram bridge ไม่ทำงาน');
      return false;
    }

    try {
      const { default: TelegramBot } = await import('node-telegram-bot-api').catch(() => {
        throw new Error('กรุณาติดตั้ง: npm install node-telegram-bot-api');
      });

      this.bot      = new TelegramBot(API_KEYS.telegram.token, { polling: true });
      this._running = true;

      this._registerCommands();
      logger.info('[telegram] Bot started — listening for commands');

      await this._send('🤖 *OpenClaw Multi-Model Engine* เริ่มทำงานแล้ว\n\nCommands:\n/orchestrate [task]\n/critique [task]\n/parallel [tasks JSON]\n/cascade [task]\n/status\n/agents\n/cost');
      return true;

    } catch (err) {
      logger.error(`[telegram] start failed: ${err.message}`);
      return false;
    }
  }

  /**
   * หยุด bot
   */
  async stop() {
    if (this.bot && this._running) {
      await this.bot.stopPolling();
      this._running = false;
      logger.info('[telegram] Bot stopped');
    }
  }

  /**
   * ลงทะเบียน command handlers
   */
  _registerCommands() {
    const bot = this.bot;

    // /orchestrate — Auto-route
    bot.onText(/^\/orchestrate\s+(.+)$/is, async (msg, match) => {
      const chatId = msg.chat.id;
      const task   = match[1].trim();
      await this._handleOrchestrate(chatId, task);
    });

    // /critique — Critique loop
    bot.onText(/^\/critique(?:\s+(.+))?$/is, async (msg, match) => {
      const chatId = msg.chat.id;
      const task   = match?.[1]?.trim();
      if (!task) {
        await bot.sendMessage(chatId, '❌ Usage: /critique [task description]');
        return;
      }
      await this._handleCritique(chatId, task);
    });

    // /parallel — Parallel execution
    bot.onText(/^\/parallel(?:\s+(.+))?$/is, async (msg, match) => {
      const chatId = msg.chat.id;
      const input  = match?.[1]?.trim();
      if (!input) {
        await bot.sendMessage(chatId, '❌ Usage: /parallel [tasks as JSON array or description]\n\nExample:\n/parallel สร้าง marketing copy และ API code พร้อมกัน');
        return;
      }
      await this._handleParallel(chatId, input);
    });

    // /cascade — Cascade/escalation
    bot.onText(/^\/cascade(?:\s+(.+))?$/is, async (msg, match) => {
      const chatId = msg.chat.id;
      const task   = match?.[1]?.trim();
      if (!task) {
        await bot.sendMessage(chatId, '❌ Usage: /cascade [task description]');
        return;
      }
      await this._handleCascade(chatId, task);
    });

    // /status
    bot.onText(/^\/status$/, async (msg) => {
      await this._handleStatus(msg.chat.id);
    });

    // /agents
    bot.onText(/^\/agents$/, async (msg) => {
      await this._handleAgents(msg.chat.id);
    });

    // /cost
    bot.onText(/^\/cost$/, async (msg) => {
      await this._handleCost(msg.chat.id);
    });

    // Unknown commands
    bot.on('message', async (msg) => {
      if (msg.text && msg.text.startsWith('/') &&
          !msg.text.match(/^\/(orchestrate|critique|parallel|cascade|status|agents|cost)/)) {
        await bot.sendMessage(msg.chat.id, '❓ ไม่รู้จัก command นี้\n\nCommands ที่ใช้ได้:\n/orchestrate /critique /parallel /cascade /status /agents /cost');
      }
    });

    // Error handler
    bot.on('polling_error', (err) => {
      logger.error(`[telegram] polling error: ${err.message}`);
    });
  }

  async _handleOrchestrate(chatId, task) {
    try {
      await this.bot.sendMessage(chatId, `🔀 *Auto-routing task...*\n\n"${task.slice(0, 100)}${task.length > 100 ? '...' : ''}"`, { parse_mode: 'Markdown' });

      const result = await this.orchestrator.route(task);

      const response = [
        `✅ *Result*`,
        `Model: ${result.routedTo} (${result.modelId})`,
        `Cost: ${result.cost?.thb?.toFixed(4) || 0} THB`,
        `Time: ${result.latencyMs}ms`,
        ``,
        result.content?.slice(0, 3000) || '(no content)',
      ].join('\n');

      await this._sendLong(chatId, response);
    } catch (err) {
      await this.bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  }

  async _handleCritique(chatId, task) {
    try {
      await this.bot.sendMessage(chatId, `🔄 *Starting Critique Loop...*\n\n${task.slice(0, 100)}...\n\nDrafter: Claude → Reviewer: ChatGPT`, { parse_mode: 'Markdown' });

      let lastUpdate = '';
      const onProgress = async ({ phase, round, score }) => {
        const msg = `📊 Round ${round || ''}: ${phase}${score ? ` (score: ${score})` : ''}`;
        if (msg !== lastUpdate) {
          await this.bot.sendMessage(chatId, msg);
          lastUpdate = msg;
        }
      };

      const result = await this.orchestrator.critique(task, {
        drafter:  'claude',
        reviewer: 'chatgpt',
        onProgress,
      });

      const response = [
        `✅ *Critique Complete*`,
        `Score: ${result.quality.finalScore}/100 | Rounds: ${result.totalRounds}`,
        `Cost: ${result.totalCost.thb.toFixed(4)} THB`,
        ``,
        result.content?.slice(0, 3000) || '(no content)',
      ].join('\n');

      await this._sendLong(chatId, response);
    } catch (err) {
      await this.bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  }

  async _handleParallel(chatId, input) {
    try {
      // Parse JSON หรือสร้าง default parallel tasks จาก description
      let subTasks;
      try {
        subTasks = JSON.parse(input);
      } catch {
        // ไม่ใช่ JSON — สร้าง 2 tasks อัตโนมัติ
        subTasks = [
          { id: 'content', task: input, taskType: 'creative_content_th', model: 'claude' },
          { id: 'analysis', task: `วิเคราะห์: ${input}`, taskType: 'data_analysis', model: 'chatgpt' },
        ];
      }

      await this.bot.sendMessage(chatId, `⚡ *Running ${subTasks.length} tasks in parallel...*`, { parse_mode: 'Markdown' });

      const result = await this.orchestrator.parallel(subTasks);

      const response = [
        `✅ *Parallel Complete*`,
        `Success: ${result.successful}/${subTasks.length}`,
        `Cost: ${result.totalCost.thb.toFixed(4)} THB | Time: ${result.latencyMs}ms`,
        ``,
        result.content?.slice(0, 3000) || '(no content)',
      ].join('\n');

      await this._sendLong(chatId, response);
    } catch (err) {
      await this.bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  }

  async _handleCascade(chatId, task) {
    try {
      await this.bot.sendMessage(chatId, `📈 *Starting Cascade...*\n\nChain: Qwen → Gemini → Claude\n\n${task.slice(0, 100)}`, { parse_mode: 'Markdown' });

      let levelCount = 0;
      const onProgress = async ({ phase, model, score }) => {
        if (phase === 'generating') {
          await this.bot.sendMessage(chatId, `🔗 Level ${++levelCount}: ${model}`);
        } else if (phase === 'escalating') {
          await this.bot.sendMessage(chatId, `⬆️ Score insufficient — escalating...`);
        } else if (phase === 'accepted') {
          await this.bot.sendMessage(chatId, `✅ Accepted at ${model} (score: ${score})`);
        }
      };

      const result = await this.orchestrator.cascade(task, {
        chainPreset: 'general',
        onProgress,
      });

      const response = [
        `✅ *Cascade Complete*`,
        `Score: ${result.quality.finalScore}/100 | Levels: ${result.quality.levels}`,
        `Cost: ${result.totalCost.thb.toFixed(4)} THB`,
        ``,
        result.content?.slice(0, 3000) || '(no content)',
      ].join('\n');

      await this._sendLong(chatId, response);
    } catch (err) {
      await this.bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  }

  async _handleStatus(chatId) {
    try {
      const status = this.orchestrator.getStatus();
      const lines  = [`🔧 *Engine Status*\n`];

      for (const [name, info] of Object.entries(status.models)) {
        const icon = info.available && !info.disabled ? '✅' : '❌';
        lines.push(`${icon} ${name}: ${info.available ? 'ready' : 'unavailable'}`);
      }

      lines.push(`\n💰 Budget: ${ENGINE?.budgetTHB || 1400} THB/month`);
      lines.push(`Session cost: ${status.cost.totalTHB?.toFixed(4) || 0} THB`);

      await this.bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' });
    } catch (err) {
      await this.bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  }

  async _handleAgents(chatId) {
    if (!this.agentScheduler) {
      await this.bot.sendMessage(chatId, '❌ Agent Scheduler ไม่ได้เชื่อมต่อ');
      return;
    }

    try {
      const report = this.agentScheduler.getStatusReport();
      const msg    = this.agentScheduler.formatTelegramReport(report);
      await this._sendLong(chatId, msg);
    } catch (err) {
      await this.bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  }

  async _handleCost(chatId) {
    try {
      const summary = this.orchestrator.costOptimizer.getSessionSummary();
      const lines   = [
        `💰 *Cost Summary*`,
        `Total: ${summary.totalTHB} THB (${summary.totalUSD} USD)`,
        `Calls: ${summary.totalCalls} | Tokens: ${summary.totalTokens?.toLocaleString()}`,
        `Budget used: ${summary.budgetUsedPct}%`,
        ``,
        `*By Tier:*`,
        `Premium: ${summary.byTier.premium.spent.toFixed(2)} THB (${summary.byTier.premium.pct}%)`,
        `Standard: ${summary.byTier.standard.spent.toFixed(2)} THB (${summary.byTier.standard.pct}%)`,
        `Economy: ${summary.byTier.economy.spent.toFixed(2)} THB (${summary.byTier.economy.pct}%)`,
      ];
      await this.bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' });
    } catch (err) {
      await this.bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  }

  /**
   * ส่งข้อความ (helper)
   */
  async _send(text) {
    if (this.bot && this.chatId) {
      try {
        await this.bot.sendMessage(this.chatId, text, { parse_mode: 'Markdown' });
      } catch (err) {
        logger.warn(`[telegram] send failed: ${err.message}`);
      }
    }
  }

  /**
   * ส่งข้อความยาว — แบ่งถ้าเกิน 4000 chars
   */
  async _sendLong(chatId, text) {
    const MAX = 4000;
    if (text.length <= MAX) {
      await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' }).catch(() =>
        this.bot.sendMessage(chatId, text)  // retry without markdown if parse fails
      );
      return;
    }

    const parts = [];
    for (let i = 0; i < text.length; i += MAX) {
      parts.push(text.slice(i, i + MAX));
    }

    for (const part of parts) {
      await this.bot.sendMessage(chatId, part).catch(() => {});
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

export default TelegramBridge;
