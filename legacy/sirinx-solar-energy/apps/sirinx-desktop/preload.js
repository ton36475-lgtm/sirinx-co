// Electron preload — secure bridge between main and renderer
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // System info
  getSystemInfo:    ()       => ipcRenderer.invoke('get-system-info'),
  getOpenClawState: ()       => ipcRenderer.invoke('get-openclaw-state'),

  // Gateway control
  startGateway:     ()       => ipcRenderer.invoke('start-gateway'),
  stopGateway:      ()       => ipcRenderer.invoke('stop-gateway'),

  // Next.js server control
  startWebServer:   ()       => ipcRenderer.invoke('start-web-server'),
  stopWebServer:    ()       => ipcRenderer.invoke('stop-web-server'),

  // Open pixel office in main window
  openPixelOffice:  ()       => ipcRenderer.invoke('open-pixel-office'),
  openCommander:    ()       => ipcRenderer.invoke('open-commander'),

  // Run openclaw command
  runCommand:       (cmd)    => ipcRenderer.invoke('run-command', cmd),

  // Events from main → renderer
  onStatusUpdate:   (cb)     => ipcRenderer.on('status-update', (_, data) => cb(data)),
  onLog:            (cb)     => ipcRenderer.on('log', (_, msg) => cb(msg)),

  // Settings
  getSettings:      ()       => ipcRenderer.invoke('get-settings'),
  saveSettings:     (s)      => ipcRenderer.invoke('save-settings', s),

  // Window
  minimize:         ()       => ipcRenderer.send('window-minimize'),
  quit:             ()       => ipcRenderer.send('window-quit'),
})
