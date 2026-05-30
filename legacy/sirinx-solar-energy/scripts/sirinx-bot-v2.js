/**
 * SIRINX Solar Bot v2 - Clean Telegram Bot
 *
 * Features:
 * - Responds to user commands (/start, /help, /status, /solar, /contact)
 * - Event-driven only (NO setInterval spam)
 * - Pure Node.js (no npm dependencies)
 * - Thai UTF-8 support
 * - Single instance polling
 */

const https = require('https');

// Config
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8719485384:AAEq_gdr0WdhYje_5k4ZlirKKCV37KrlFfs';
const TONY_CHAT_ID = '5320654632';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;
const POLL_TIMEOUT = 30; // Long polling timeout in seconds

let lastUpdateId = 0;
let isRunning = true;

// ===== API Helper =====
function apiCall(method, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}/${method}`);
    const options = {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(35000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ===== Send Message =====
async function sendMessage(chatId, text, options = {}) {
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    ...options,
  };

  try {
    const result = await apiCall('sendMessage', body);
    if (!result.ok) {
      console.error(`[ERROR] sendMessage failed:`, result.description);
    }
    return result;
  } catch (err) {
    console.error(`[ERROR] sendMessage error:`, err.message);
    return null;
  }
}

// ===== Command Handlers =====
const commands = {
  '/start': async (msg) => {
    const name = msg.from?.first_name || 'คุณ';
    await sendMessage(msg.chat.id,
      `สวัสดีครับ ${name}! ยินดีต้อนรับสู่ <b>SIRINX Solar Bot</b> 🌞\n\n` +
      `ผมช่วยให้ข้อมูลเกี่ยวกับโซลาร์เซลล์ได้ครับ\n` +
      `พิมพ์ /help เพื่อดูคำสั่งทั้งหมด`
    );
  },

  '/help': async (msg) => {
    await sendMessage(msg.chat.id,
      `<b>คำสั่งที่ใช้ได้:</b>\n\n` +
      `/start - เริ่มต้นใช้งาน\n` +
      `/help - แสดงคำสั่งทั้งหมด\n` +
      `/status - ตรวจสอบสถานะระบบ\n` +
      `/solar - ข้อมูลโซลาร์เซลล์ SIRINX\n` +
      `/price - ราคาและโปรโมชั่น\n` +
      `/contact - ติดต่อเรา\n` +
      `/tax - ข้อมูลลดหย่อนภาษี`
    );
  },

  '/status': async (msg) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);

    await sendMessage(msg.chat.id,
      `<b>สถานะระบบ SIRINX</b>\n\n` +
      `✅ Bot: ออนไลน์\n` +
      `⏱ Uptime: ${hours}ชม. ${mins}นาที\n` +
      `📅 วันที่: ${new Date().toLocaleDateString('th-TH')}\n` +
      `🕐 เวลา: ${new Date().toLocaleTimeString('th-TH')}`
    );
  },

  '/solar': async (msg) => {
    await sendMessage(msg.chat.id,
      `<b>🌞 SIRINX โซลาร์เซลล์</b>\n\n` +
      `✅ ประหยัดค่าไฟ <b>สูงสุด 80%</b>\n` +
      `✅ ลดหย่อนภาษีได้สูงสุด <b>200,000 บาท</b> (มาตรการ 150%)\n` +
      `✅ คืนทุนภายใน <b>3-5 ปี</b>\n` +
      `✅ รับประกัน <b>25 ปี</b>\n` +
      `✅ ค่าไฟ <b>0 บาท</b> ด้วย Net Metering\n` +
      `✅ ทีมช่างมืออาชีพ ใบอนุญาต กฟภ./กฟน.\n` +
      `✅ บริการครอบคลุม <b>77 จังหวัดทั่วประเทศ</b>\n\n` +
      `สนใจติดตั้ง? พิมพ์ /contact เพื่อติดต่อเรา`
    );
  },

  '/price': async (msg) => {
    await sendMessage(msg.chat.id,
      `<b>💰 ราคาและโปรโมชั่น SIRINX</b>\n\n` +
      `📦 แพ็กเกจยอดนิยม:\n` +
      `• On-Grid 3kW — เหมาะสำหรับบ้านขนาดเล็ก\n` +
      `• On-Grid 5kW — เหมาะสำหรับบ้านขนาดกลาง\n` +
      `• On-Grid 10kW — เหมาะสำหรับบ้านขนาดใหญ่/ธุรกิจ\n` +
      `• Hybrid — มีแบตเตอรี่สำรอง ไฟไม่ดับ\n\n` +
      `🎁 โปรโมชั่นพิเศษ: ฟรีสำรวจพื้นที่ + ออกแบบระบบ\n\n` +
      `📞 สอบถามราคาจริง: พิมพ์ /contact`
    );
  },

  '/contact': async (msg) => {
    await sendMessage(msg.chat.id,
      `<b>📞 ติดต่อ SIRINX Solar</b>\n\n` +
      `🏢 SIRINX โซลาร์เซลล์ทุกระบบ\n` +
      `📍 พิษณุโลก และทั่วประเทศ\n` +
      `📱 โทร/Line: ติดต่อผ่าน Facebook Page\n` +
      `🌐 Facebook: SIRINX Solar\n\n` +
      `💬 พิมพ์ข้อความถึงเราได้เลยครับ!`
    );
  },

  '/tax': async (msg) => {
    await sendMessage(msg.chat.id,
      `<b>🏛 ลดหย่อนภาษีด้วยโซลาร์เซลล์</b>\n\n` +
      `มาตรการภาษี 150% หมายถึง:\n` +
      `• ค่าติดตั้งโซลาร์เซลล์ นำไปลดหย่อนภาษีได้ 1.5 เท่า\n` +
      `• สูงสุด <b>200,000 บาท</b>\n` +
      `• ทั้งบุคคลธรรมดาและนิติบุคคล\n\n` +
      `ตัวอย่าง: ติดตั้ง 200,000 บาท → ลดหย่อนได้ 300,000 บาท\n\n` +
      `สนใจรายละเอียดเพิ่มเติม? พิมพ์ /contact`
    );
  },
};

// ===== Handle Message =====
async function handleMessage(msg) {
  if (!msg || !msg.chat) return;

  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  console.log(`[MSG] From ${msg.from?.first_name || 'Unknown'} (${chatId}): ${text}`);

  // Check if it's a command
  const command = text.split(' ')[0].split('@')[0].toLowerCase();

  if (commands[command]) {
    await commands[command](msg);
  } else if (text.startsWith('/')) {
    // Unknown command
    await sendMessage(chatId,
      `ไม่รู้จักคำสั่ง "${text}" ครับ\nพิมพ์ /help เพื่อดูคำสั่งทั้งหมด`
    );
  } else if (text.length > 0) {
    // Regular message — acknowledge and provide help
    await sendMessage(chatId,
      `ขอบคุณที่ติดต่อ SIRINX ครับ! 🙏\n\n` +
      `ข้อความของคุณ: "${text.substring(0, 100)}"\n\n` +
      `ทีมงานจะติดต่อกลับโดยเร็ว\nพิมพ์ /help เพื่อดูคำสั่งที่ใช้ได้`
    );
  }
}

// ===== Polling Loop =====
async function poll() {
  while (isRunning) {
    try {
      const result = await apiCall('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: POLL_TIMEOUT,
        allowed_updates: ['message'],
      });

      if (result.ok && result.result && result.result.length > 0) {
        for (const update of result.result) {
          lastUpdateId = update.update_id;

          if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (err) {
      if (err.message === 'Request timeout') {
        // Normal long-poll timeout, just retry
        continue;
      }
      console.error(`[POLL ERROR] ${err.message}`);
      // Wait before retry on error
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

// ===== Startup =====
async function start() {
  console.log('====================================');
  console.log('  SIRINX Solar Bot v2');
  console.log('  Starting...');
  console.log('====================================');

  // Verify bot
  const me = await apiCall('getMe');
  if (!me.ok) {
    console.error('[FATAL] Bot token invalid:', me.description);
    process.exit(1);
  }
  console.log(`[OK] Bot: @${me.result.username} (${me.result.first_name})`);

  // Clear pending updates
  try {
    await apiCall('getUpdates', { offset: -1 });
    const check = await apiCall('getUpdates', { offset: -1 });
    if (check.ok && check.result.length > 0) {
      lastUpdateId = check.result[check.result.length - 1].update_id;
    }
    console.log('[OK] Cleared pending updates');
  } catch (e) {
    console.log('[WARN] Could not clear updates:', e.message);
  }

  // Notify Tony
  await sendMessage(TONY_CHAT_ID,
    `🤖 <b>SIRINX Bot v2 ออนไลน์แล้ว!</b>\n\n` +
    `📅 ${new Date().toLocaleString('th-TH')}\n` +
    `✅ พร้อมรับคำสั่งจากผู้ใช้\n` +
    `💬 พิมพ์ /help เพื่อดูคำสั่ง`
  );
  console.log('[OK] Startup notification sent to Tony');

  // Start polling
  console.log('[OK] Starting long-poll loop...');
  await poll();
}

// ===== Graceful Shutdown =====
process.on('SIGINT', () => {
  console.log('\n[STOP] Shutting down...');
  isRunning = false;
  sendMessage(TONY_CHAT_ID, '🔴 Bot กำลังปิดตัว...').then(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[STOP] SIGTERM received');
  isRunning = false;
  process.exit(0);
});

// Run
start().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
