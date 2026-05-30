// OpenClaw AI Multi-Agent Pixel Office — Electron Main Process
// Auto-detects OpenClaw config, starts gateway + web server, shows tray

const { app, BrowserWindow, Tray, Menu, shell, ipcMain, nativeImage } = require('electron')
const { spawn, exec }  = require('child_process')
const { promisify }    = require('util')
const path             = require('path')
const fs               = require('fs')
const os               = require('os')

const execAsync = promisify(exec)

// ─── Config ──────────────────────────────────────────────────────────────────
const OPENCLAW_CMD   = path.join(os.homedir(), 'AppData', 'Roaming', 'npm', 'openclaw.cmd')
const OPENCLAW_DIR   = path.join(os.homedir(), '.openclaw')
const OPENCLAW_CFG   = path.join(OPENCLAW_DIR, 'openclaw.json')
const WEB_PORT       = 3002
const WEB_APP_DIR    = path.join(__dirname, '..', 'sirinx-web')
const WEB_URL        = `http://localhost:${WEB_PORT}`
const IS_DEV         = process.argv.includes('--dev')

// ─── State ───────────────────────────────────────────────────────────────────
let mainWindow    = null
let tray          = null
let webServerProc = null
let gatewayProc   = null
let statusState   = { gateway: 'stopped', webServer: 'stopped', openclaw: false }
let logBuffer     = []

function log(msg) {
  const entry = `[${new Date().toLocaleTimeString()}] ${msg}`
  logBuffer.push(entry)
  if (logBuffer.length > 200) logBuffer.shift()
  console.log(entry)
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('log', entry)
  }
}

function sendStatus() {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send('status-update', statusState)
  }
}

// ─── Auto-detect OpenClaw ─────────────────────────────────────────────────────
function detectOpenClaw() {
  const exists = fs.existsSync(OPENCLAW_CMD)
  let config = null
  let lastProject = null

  if (fs.existsSync(OPENCLAW_CFG)) {
    try { config = JSON.parse(fs.readFileSync(OPENCLAW_CFG, 'utf8')) } catch {}
  }

  // Find last modified project in ~/.openclaw/agents/
  const agentsDir = path.join(OPENCLAW_DIR, 'agents')
  if (fs.existsSync(agentsDir)) {
    const agents = fs.readdirSync(agentsDir)
      .map(name => ({ name, mtime: fs.statSync(path.join(agentsDir, name)).mtime }))
      .sort((a, b) => b.mtime - a.mtime)
    if (agents.length > 0) lastProject = agents[0].name
  }

  // Also check AI-WarRoom project sessions
  const claudeDir = path.join(os.homedir(), '.claude', 'projects')
  let lastSession = null
  if (fs.existsSync(claudeDir)) {
    const projects = fs.readdirSync(claudeDir)
      .map(name => {
        try {
          const files = fs.readdirSync(path.join(claudeDir, name))
            .filter(f => f.endsWith('.jsonl'))
            .map(f => ({ f, mtime: fs.statSync(path.join(claudeDir, name, f)).mtime }))
            .sort((a, b) => b.mtime - a.mtime)
          return { name, lastFile: files[0], mtime: files[0]?.mtime ?? new Date(0) }
        } catch { return null }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime)
    if (projects[0]) lastSession = { project: projects[0].name, file: projects[0].lastFile?.f }
  }

  return { exists, config, lastProject, lastSession, cmdPath: OPENCLAW_CMD }
}

// ─── Gateway Control ──────────────────────────────────────────────────────────
async function startGateway() {
  if (statusState.gateway === 'running') return { ok: true, msg: 'Already running' }

  log('Starting OpenClaw Gateway...')
  statusState.gateway = 'starting'
  sendStatus()

  try {
    // Check if already running
    const { stdout } = await execAsync(`"${OPENCLAW_CMD}" health`, { timeout: 5000 })
      .catch(() => ({ stdout: '' }))

    if (stdout.includes('Agents:')) {
      log('Gateway already running ✓')
      statusState.gateway = 'running'
      sendStatus()
      return { ok: true, msg: 'Already running' }
    }
  } catch {}

  // Start gateway process
  gatewayProc = spawn('cmd.exe', ['/c', OPENCLAW_CMD, 'gateway', '--force'], {
    detached: true,
    stdio: 'pipe',
    env: { ...process.env, PATH: `${path.dirname(OPENCLAW_CMD)};${process.env.PATH}` },
  })

  gatewayProc.stdout?.on('data', d => log(`[gateway] ${d.toString().trim()}`))
  gatewayProc.stderr?.on('data', d => log(`[gateway:err] ${d.toString().trim()}`))
  gatewayProc.on('exit', code => {
    log(`Gateway exited (code ${code})`)
    statusState.gateway = 'stopped'
    sendStatus()
  })

  // Poll until ready
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1500))
    try {
      const { stdout } = await execAsync(`"${OPENCLAW_CMD}" health`, { timeout: 4000 })
      if (stdout.includes('Agents:')) {
        log('Gateway ready ✓')
        statusState.gateway = 'running'
        sendStatus()
        return { ok: true, msg: 'Gateway started' }
      }
    } catch {}
  }

  statusState.gateway = 'error'
  sendStatus()
  return { ok: false, msg: 'Gateway failed to start' }
}

async function stopGateway() {
  if (gatewayProc) {
    gatewayProc.kill()
    gatewayProc = null
  }
  statusState.gateway = 'stopped'
  sendStatus()
  return { ok: true }
}

// ─── Web Server Control ───────────────────────────────────────────────────────
async function startWebServer() {
  if (statusState.webServer === 'running') return { ok: true, msg: 'Already running' }

  // Check if port already in use
  try {
    const res = await fetch(`${WEB_URL}/api/openclaw/run`, { method: 'GET' })
      .catch(() => null)
    if (res?.ok) {
      log('Web server already running on :3002 ✓')
      statusState.webServer = 'running'
      sendStatus()
      return { ok: true, msg: 'Already running' }
    }
  } catch {}

  log('Starting SIRINX web server...')
  statusState.webServer = 'starting'
  sendStatus()

  const npmCmd = 'npm.cmd'
  webServerProc = spawn('cmd.exe', ['/c', npmCmd, 'run', 'dev'], {
    cwd: WEB_APP_DIR,
    stdio: 'pipe',
    env: { ...process.env },
  })

  webServerProc.stdout?.on('data', d => {
    const msg = d.toString().trim()
    if (msg) log(`[web] ${msg}`)
    if (msg.includes('Ready in') || msg.includes('ready')) {
      statusState.webServer = 'running'
      sendStatus()
    }
  })
  webServerProc.stderr?.on('data', d => log(`[web:err] ${d.toString().trim()}`))
  webServerProc.on('exit', code => {
    log(`Web server exited (code ${code})`)
    statusState.webServer = 'stopped'
    sendStatus()
  })

  // Poll until ready
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000))
    try {
      const res = await fetch(WEB_URL).catch(() => null)
      if (res?.ok || res?.status < 500) {
        log('Web server ready ✓')
        statusState.webServer = 'running'
        sendStatus()
        return { ok: true, msg: 'Web server started' }
      }
    } catch {}
  }

  return { ok: false, msg: 'Web server failed to start' }
}

async function stopWebServer() {
  if (webServerProc) {
    webServerProc.kill()
    webServerProc = null
  }
  statusState.webServer = 'stopped'
  sendStatus()
  return { ok: true }
}

// ─── Run OpenClaw Command ─────────────────────────────────────────────────────
function runOpenClawCommand(args) {
  return new Promise((resolve) => {
    const child = spawn('cmd.exe', ['/c', OPENCLAW_CMD, ...args], {
      shell: false,
      env: { ...process.env, PATH: `${path.dirname(OPENCLAW_CMD)};${process.env.PATH}` },
    })
    let stdout = '', stderr = ''
    child.stdout.on('data', d => { stdout += d.toString() })
    child.stderr.on('data', d => { stderr += d.toString() })
    child.on('close', code => {
      const stripAnsi = s => s.replace(/\x1B\[[0-9;]*[mGKHF]/g, '').trim()
      resolve({ stdout: stripAnsi(stdout), stderr: stripAnsi(stderr), code })
    })
    child.on('error', err => resolve({ stdout: '', stderr: err.message, code: 1 }))
  })
}

// ─── Tray Icon ────────────────────────────────────────────────────────────────
function createTrayIcon() {
  // Create a simple 16x16 pixel icon programmatically using nativeImage
  const iconData = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG header
  ])

  // Use a fallback empty icon if no PNG is available
  let icon
  const iconPath = path.join(__dirname, 'assets', 'icon.png')
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath)
  } else {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('OpenClaw Pixel Office')

  const updateTrayMenu = () => {
    const menu = Menu.buildFromTemplate([
      {
        label: '🏯 OpenClaw Pixel Office',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: `🦞 Gateway: ${statusState.gateway === 'running' ? '● ONLINE' : '○ OFFLINE'}`,
        enabled: false,
      },
      {
        label: `🌐 Web App: ${statusState.webServer === 'running' ? '● ONLINE' : '○ OFFLINE'}`,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: '⚔ Open Pixel Office',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.loadURL(`${WEB_URL}/agents`)
            mainWindow.show()
            mainWindow.focus()
          }
        },
      },
      {
        label: '🦞 OpenClaw Commander',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.loadURL(`${WEB_URL}/openclaw`)
            mainWindow.show()
            mainWindow.focus()
          }
        },
      },
      {
        label: '🏠 Dashboard',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.loadURL(WEB_URL)
            mainWindow.show()
            mainWindow.focus()
          }
        },
      },
      { type: 'separator' },
      {
        label: '▶ Start All',
        click: async () => {
          await startGateway()
          await startWebServer()
        },
      },
      {
        label: '⏹ Stop All',
        click: async () => {
          await stopGateway()
          await stopWebServer()
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true
          app.quit()
        },
      },
    ])
    tray.setContextMenu(menu)
  }

  updateTrayMenu()
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    }
  })

  // Update tray menu when status changes
  ipcMain.on('status-changed', updateTrayMenu)
  return tray
}

// ─── Main Window ──────────────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          820,
    minWidth:        900,
    minHeight:       600,
    titleBarStyle:   'hidden',
    titleBarOverlay: { color: '#0A1628', symbolColor: '#F5A623', height: 36 },
    backgroundColor: '#0A1628',
    show:            false,
    icon:            path.join(__dirname, 'assets', 'icon.png'),
    webPreferences:  {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  // Load splash while services start
  mainWindow.loadFile(path.join(__dirname, 'src', 'splash.html'))
  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.on('close', e => {
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return mainWindow
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
function registerIpc() {
  ipcMain.handle('get-system-info', () => ({
    platform:  process.platform,
    arch:      process.arch,
    nodeVer:   process.version,
    appVer:    app.getVersion(),
    webUrl:    WEB_URL,
    webAppDir: WEB_APP_DIR,
    openclawCmd: OPENCLAW_CMD,
    openclawExists: fs.existsSync(OPENCLAW_CMD),
  }))

  ipcMain.handle('get-openclaw-state', () => ({
    ...statusState,
    ...detectOpenClaw(),
    logs: logBuffer.slice(-50),
  }))

  ipcMain.handle('start-gateway',    () => startGateway())
  ipcMain.handle('stop-gateway',     () => stopGateway())
  ipcMain.handle('start-web-server', () => startWebServer())
  ipcMain.handle('stop-web-server',  () => stopWebServer())

  ipcMain.handle('open-pixel-office', () => {
    mainWindow.webContents.loadURL(`${WEB_URL}/agents`)
    mainWindow.show()
  })
  ipcMain.handle('open-commander', () => {
    mainWindow.webContents.loadURL(`${WEB_URL}/openclaw`)
    mainWindow.show()
  })

  ipcMain.handle('run-command', async (_, cmd) => {
    const CMDS = {
      health:  ['health'],
      status:  ['status'],
      version: ['--version'],
      agents:  ['agents', 'list', '--json'],
      models:  ['models', 'status', '--json'],
    }
    const args = CMDS[cmd]
    if (!args) return { error: 'Unknown command' }
    return runOpenClawCommand(args)
  })

  ipcMain.handle('get-settings', () => ({
    autostart:       isAutostartEnabled(),
    autoOpenGateway: true,
    autoOpenWebApp:  true,
    webPort:         WEB_PORT,
  }))

  ipcMain.handle('save-settings', (_, settings) => {
    if (settings.autostart !== undefined) {
      setAutostart(settings.autostart)
    }
    return { ok: true }
  })

  ipcMain.on('window-minimize', () => mainWindow?.minimize())
  ipcMain.on('window-quit',     () => { app.isQuitting = true; app.quit() })
}

// ─── Windows Autostart ────────────────────────────────────────────────────────
function isAutostartEnabled() {
  try {
    const loginItems = app.getLoginItemSettings()
    return loginItems.openAtLogin
  } catch { return false }
}

function setAutostart(enable) {
  app.setLoginItemSettings({
    openAtLogin: enable,
    name: 'OpenClaw Pixel Office',
    path: process.execPath,
    args: ['--autostart'],
  })
  log(`Autostart ${enable ? 'enabled' : 'disabled'}`)
}

// ─── App Lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  log('OpenClaw Pixel Office starting...')

  // Detect OpenClaw
  const detected = detectOpenClaw()
  log(`OpenClaw detected: ${detected.exists} | Last project: ${detected.lastProject ?? 'none'}`)
  statusState.openclaw = detected.exists

  // Create window and tray
  createMainWindow()
  createTrayIcon()
  registerIpc()

  // Auto-start services
  log('Auto-starting gateway and web server...')
  sendStatus()

  // Start gateway first (non-blocking)
  startGateway().then(() => {
    log('Gateway startup complete')
    sendStatus()
  })

  // Start web server
  const webResult = await startWebServer()
  if (webResult.ok) {
    log(`Web server ready → loading ${WEB_URL}/agents`)
    // Navigate to Pixel Office once ready
    setTimeout(() => {
      if (mainWindow && statusState.webServer === 'running') {
        mainWindow.webContents.loadURL(`${WEB_URL}/agents`)
      }
    }, 2000)
  } else {
    log('Web server failed — staying on splash')
  }
})

app.on('window-all-closed', () => {
  // Keep running in tray on Windows/Linux
  if (process.platform === 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})

app.on('before-quit', async () => {
  app.isQuitting = true
  await stopWebServer()
})
