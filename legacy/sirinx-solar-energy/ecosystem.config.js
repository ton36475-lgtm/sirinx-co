module.exports = {
  apps: [
    // ── Telegram Bot — Main control interface ──
    {
      name: 'sirinx-bot',
      script: 'scripts/sirinx-bot-v3.js',
      cwd: 'C:\\Users\\Ton36\\AI-WarRoom',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: 'production' },
      log_file: 'logs/bot.log',
      error_file: 'logs/bot-error.log',
      out_file: 'logs/bot-out.log',
      time: true,
    },

    // ── LINE Bot — LINE messaging interface ──
    {
      name: 'sirinx-line-bot',
      script: 'scripts/sirinx-line-bot.js',
      cwd: 'C:\\Users\\Ton36\\AI-WarRoom',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: 'production' },
      log_file: 'logs/line-bot.log',
      error_file: 'logs/line-bot-error.log',
      out_file: 'logs/line-bot-out.log',
      time: true,
    },

    // ── Agent Scheduler — Cron-based agent triggers ──
    {
      name: 'sirinx-scheduler',
      script: 'scripts/agent-scheduler.js',
      cwd: 'C:\\Users\\Ton36\\AI-WarRoom',
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 5000,
      env: { NODE_ENV: 'production' },
      log_file: 'logs/scheduler.log',
      error_file: 'logs/scheduler-error.log',
      out_file: 'logs/scheduler-out.log',
      time: true,
    },

    // ── Event Engine — Real-time event processing ──
    {
      name: 'sirinx-events',
      script: 'scripts/agent-event-engine.js',
      cwd: 'C:\\Users\\Ton36\\AI-WarRoom',
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 5000,
      env: { NODE_ENV: 'production' },
      log_file: 'logs/events.log',
      error_file: 'logs/events-error.log',
      out_file: 'logs/events-out.log',
      time: true,
    },

    // ── Automation Orchestrator — Master coordinator ──
    {
      name: 'sirinx-automation',
      script: 'scripts/sirinx-automation.js',
      cwd: 'C:\\Users\\Ton36\\AI-WarRoom',
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 5000,
      env: { NODE_ENV: 'production' },
      log_file: 'logs/automation.log',
      error_file: 'logs/automation-error.log',
      out_file: 'logs/automation-out.log',
      time: true,
    },

    // ── Next.js Web Dashboard (port 3002) ──
    {
      name: 'sirinx-web',
      script: 'npx',
      args: 'next dev --turbopack -p 3002 -H 0.0.0.0',
      cwd: 'C:\\Users\\Ton36\\AI-WarRoom\\sirinx-app',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'development',
        PORT: '3002',
        HOSTNAME: '0.0.0.0',
      },
      log_file: 'C:\\Users\\Ton36\\AI-WarRoom\\logs\\web.log',
      error_file: 'C:\\Users\\Ton36\\AI-WarRoom\\logs\\web-error.log',
      out_file: 'C:\\Users\\Ton36\\AI-WarRoom\\logs\\web-out.log',
      time: true,
    },
  ],
};
