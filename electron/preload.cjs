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
});
