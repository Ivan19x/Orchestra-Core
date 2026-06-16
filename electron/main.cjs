// Electron main process for the packaged Orchestra-Core desktop app.
//
// Responsibilities:
// - Start the local server (server/index.mjs) as a Node sidecar process.
//   In production it both serves the built frontend (dist/) and handles the
//   Deep Dive /api/search endpoint. In dev it only handles /api routes —
//   the frontend itself is served by Vite at VITE_DEV_SERVER_URL.
// - Open a window pointing at whichever of those is the right entry point.
// - Local LLM (Ollama) is a separate, user-installed dependency — not
//   bundled here. See README/Download page for setup instructions.

const path = require('path');
const { app, BrowserWindow, utilityProcess } = require('electron');

const SERVER_PORT = process.env.PORT || 5175;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

let serverProcess;
let mainWindow;

function startServer() {
  serverProcess = utilityProcess.fork(
    path.join(__dirname, '..', 'server', 'index.mjs'),
    [],
    { env: { ...process.env, PORT: String(SERVER_PORT) } },
  );
}

async function waitForServer(url, { retries = 50, delayMs = 200 } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#FFFFFF',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    await waitForServer(SERVER_URL);
    mainWindow.loadURL(SERVER_URL);
  }
}

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  serverProcess?.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  serverProcess?.kill();
});
