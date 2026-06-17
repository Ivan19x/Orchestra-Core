const path    = require('path');
const os      = require('os');
const fs      = require('fs');
const https   = require('https');
const { execSync, spawn } = require('child_process');
const { app, BrowserWindow, ipcMain, utilityProcess } = require('electron');
const { autoUpdater } = require('electron-updater');

const SERVER_PORT = process.env.PORT || 5175;
const SERVER_URL  = `http://localhost:${SERVER_PORT}`;

let serverProcess;
let mainWindow;
let pendingToken = null; // JWT received via deep link before window was ready

// ── Custom protocol for deep-link sign-in from the website ───────────────────
// orchestracore://auth?token=JWT_TOKEN  →  saves session in the app
app.setAsDefaultProtocolClient('orchestracore');

function handleDeepLink(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'auth') return;
    const token = parsed.searchParams.get('token');
    if (!token) return;
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('setup:token', token);
    } else {
      pendingToken = token; // deliver once window is ready
    }
  } catch {}
}

// macOS: deep links arrive via open-url event (not second-instance)
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Windows: single-instance lock so second launch passes args to running instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const url = argv.find(a => a.startsWith('orchestracore://'));
    if (url) handleDeepLink(url);
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });
}

// ── Model selection based on actual system RAM ───────────────────────────────
function getModelForDevice() {
  const gb = os.totalmem() / (1024 ** 3);
  if (gb >= 16) return 'qwen2.5:14b';
  if (gb >= 8)  return 'qwen2.5:7b';
  if (gb >= 4)  return 'qwen2.5:3b';
  return 'qwen2.5:0.5b';
}

// ── Find the Ollama binary ───────────────────────────────────────────────────
function findOllamaBin() {
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe'),
    'C:\\Program Files\\Ollama\\ollama.exe',
    path.join(process.resourcesPath || '', 'ollama', 'ollama.exe'),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  try { execSync('ollama --version', { stdio: 'ignore', timeout: 3000 }); return 'ollama'; } catch {}
  return null;
}

// ── Check Ollama is responding ───────────────────────────────────────────────
async function isOllamaRunning() {
  try {
    const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch { return false; }
}

// ── Start Ollama serve (detached — survives app restart) ─────────────────────
function startOllamaServe(bin) {
  const proc = spawn(bin, ['serve'], {
    detached: true, stdio: 'ignore',
    env: { ...process.env },
    windowsHide: true,
  });
  proc.unref();
}

// ── Wait for Ollama to respond (up to 30s) ───────────────────────────────────
async function waitForOllama(timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isOllamaRunning()) return true;
    await sleep(500);
  }
  return false;
}

// ── Check if a model is already pulled ───────────────────────────────────────
async function hasModel(modelName) {
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    const { models } = await res.json();
    const base = modelName.split(':')[0];
    return models?.some(m => m.name === modelName || m.name.startsWith(base + ':'));
  } catch { return false; }
}

// ── Pull model via ollama CLI, streaming progress ────────────────────────────
function pullModel(bin, modelName, onProgress) {
  return new Promise((resolve, reject) => {
    const proc = spawn(bin, ['pull', modelName], {
      env: { ...process.env },
      windowsHide: true,
    });

    let buf = '';
    const handle = (chunk) => {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        const pctMatch = line.match(/(\d+)%/);
        const sizeMatch = line.match(/([\d.]+\s*[KMGT]?B)\s*\/\s*([\d.]+\s*[KMGT]?B)/i);
        if (pctMatch) {
          onProgress({
            percent: parseInt(pctMatch[1]),
            detail: sizeMatch ? `${sizeMatch[1]} / ${sizeMatch[2]}` : line.trim(),
          });
        }
      }
    };

    proc.stdout.on('data', handle);
    proc.stderr.on('data', handle);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ollama pull exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

// ── Download file with progress ───────────────────────────────────────────────
function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const follow = (u, redirects = 0) => {
      if (redirects > 10) return reject(new Error('Too many redirects'));
      https.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return follow(res.headers.location, redirects + 1);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const total = parseInt(res.headers['content-length'] || '0');
        let received = 0;
        const file = fs.createWriteStream(dest);
        res.on('data', (chunk) => {
          received += chunk.length;
          file.write(chunk);
          if (total > 0) onProgress({ percent: Math.round((received / total) * 100) });
        });
        res.on('end', () => file.end(resolve));
        res.on('error', reject);
      }).on('error', reject);
    };
    follow(url);
  });
}

// ── Install Ollama silently ───────────────────────────────────────────────────
function installOllamaSetup(installerPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn(installerPath, ['/SILENT', '/NORESTART'], {
      detached: false, windowsHide: true,
    });
    proc.on('close', (code) => {
      if (code === 0 || code === 1) resolve();
      else reject(new Error(`Installer exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

// ── Main setup orchestrator — runs after the React UI signals it's ready ──────
async function runSetup() {
  const send = (stage, message, percent = null) => {
    if (!mainWindow?.webContents) return;
    mainWindow.webContents.send('setup:progress', { stage, message, percent });
  };

  const model = getModelForDevice();

  // Step 1: Check Ollama
  send('checking', 'Checking your device…');

  const running = await isOllamaRunning();
  if (!running) {
    let bin = findOllamaBin();

    if (bin) {
      send('ollama', 'Starting Ollama…');
      startOllamaServe(bin);
    } else {
      send('ollama', 'Downloading Ollama…', 0);
      const tmpDir = app.getPath('temp');
      const installerPath = path.join(tmpDir, 'OllamaSetup.exe');
      try {
        await downloadFile(
          'https://ollama.com/download/OllamaSetup.exe',
          installerPath,
          ({ percent }) => send('ollama', `Downloading Ollama… ${percent}%`, percent),
        );
        send('ollama', 'Installing Ollama…', 100);
        await installOllamaSetup(installerPath);
        bin = findOllamaBin();
        if (!bin) throw new Error('Ollama binary not found after install');
        send('ollama', 'Starting Ollama…');
        startOllamaServe(bin);
      } catch (err) {
        mainWindow?.webContents.send('setup:error', {
          message: 'Could not install Ollama automatically. Please install it from ollama.com, then reopen Orchestra-Core.',
          detail: err.message,
        });
        return;
      }
    }

    send('ollama', 'Waiting for Ollama to start…');
    const ready = await waitForOllama(30_000);
    if (!ready) {
      mainWindow?.webContents.send('setup:error', {
        message: 'Ollama took too long to start. Please reopen Orchestra-Core.',
        detail: 'Timed out after 30s',
      });
      return;
    }
  }

  // Step 2: Pull model if needed
  const modelReady = await hasModel(model);
  if (!modelReady) {
    const bin = findOllamaBin() || 'ollama';
    send('model', `Downloading AI model (${model})…`, 0);
    try {
      await pullModel(bin, model, ({ percent, detail }) => {
        send('model', `Downloading AI model (${model})… ${detail || ''}`, percent);
      });
    } catch (err) {
      mainWindow?.webContents.send('setup:error', {
        message: `Could not download the AI model (${model}). Check your internet connection and reopen Orchestra-Core.`,
        detail: err.message,
      });
      return;
    }
  }

  // Done
  mainWindow?.webContents.send('setup:complete', { model });
}

// ── Utilities ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Local server ─────────────────────────────────────────────────────────────
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
    } catch {}
    await sleep(delayMs);
  }
  return false;
}

// ── Window ────────────────────────────────────────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#FFFFFF',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Listen for React UI ready signal — then start setup
  ipcMain.once('setup:ready', () => {
    // Deliver any deep-link token that arrived before the window was ready
    if (pendingToken) {
      mainWindow?.webContents.send('setup:token', pendingToken);
      pendingToken = null;
    }
    runSetup();
  });

  // Allow renderer to retry setup after the user fixes Ollama manually
  ipcMain.on('setup:retry', () => runSetup());

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl + '/app');
    return;
  }

  await waitForServer(SERVER_URL);
  mainWindow.loadURL(`${SERVER_URL}/app`);

  // Handle orchestracore:// URLs passed at launch time (before single-instance listener fires)
  const deepLinkArg = process.argv.find(a => a.startsWith('orchestracore://'));
  if (deepLinkArg) handleDeepLink(deepLinkArg);
}

// ── Auto-updater ─────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update:available', { version: info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update:progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update:downloaded', { version: info.version });
  });

  autoUpdater.on('error', () => {
    // Silently ignore update errors — don't block the app
  });

  ipcMain.on('update:install', () => autoUpdater.quitAndInstall(false, true));

  // Check 10 seconds after launch (enough time for the app to settle)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 10_000);
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startServer();
  createWindow();
  if (!process.env.VITE_DEV_SERVER_URL) setupAutoUpdater();

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
