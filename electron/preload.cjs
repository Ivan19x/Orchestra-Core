const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronSetup', {
  // Setup event listeners
  onProgress: (cb) => ipcRenderer.on('setup:progress', (_, data) => cb(data)),
  onComplete: (cb) => ipcRenderer.once('setup:complete', (_, data) => cb(data)),
  onError:    (cb) => ipcRenderer.on('setup:error',    (_, data) => cb(data)),

  // Signal to main that the React UI has mounted and is ready for events
  notifyReady: () => ipcRenderer.send('setup:ready'),

  // Receive a JWT token passed via orchestracore://auth?token=... deep link
  onToken: (cb) => ipcRenderer.on('setup:token', (_, token) => cb(token)),

  // Auto-update events
  onUpdateAvailable:  (cb) => ipcRenderer.on('update:available',  (_, data) => cb(data)),
  onUpdateProgress:   (cb) => ipcRenderer.on('update:progress',   (_, data) => cb(data)),
  onUpdateDownloaded: (cb) => ipcRenderer.once('update:downloaded', (_, data) => cb(data)),
  installUpdate: () => ipcRenderer.send('update:install'),
});
