const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronSetup', {
  onProgress: (cb) => ipcRenderer.on('setup:progress', (_, data) => cb(data)),
  onComplete: (cb) => ipcRenderer.once('setup:complete', (_, data) => cb(data)),
  onError:    (cb) => ipcRenderer.on('setup:error',    (_, data) => cb(data)),
});
