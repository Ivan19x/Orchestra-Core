const path    = require('path');
const os      = require('os');
const fs      = require('fs');
const https   = require('https');
const { execSync, spawn } = require('child_process');
const { app, BrowserWindow, utilityProcess } = require('electron');

const SERVER_PORT = process.env.PORT || 5175;
const SERVER_URL  = `http://localhost:${SERVER_PORT}`;

let serverProcess;
let mainWindow;

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
      if (code === 0 || code === 1) resolve(); // 1 = already installed / restart pending
      else reject(new Error(`Installer exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

// ── Main setup orchestrator ───────────────────────────────────────────────────
async function runSetup() {
  const send = (stage, message, percent = null) => {
    if (!mainWindow?.webContents) return;
    mainWindow.webContents.send('setup:progress', { stage, message, percent });
  };

  const model = getModelForDevice();

  // ── Step 1: Check Ollama ──────────────────────────────────────────────────
  send('checking', 'Checking your device…');

  const running = await isOllamaRunning();
  if (!running) {
    let bin = findOllamaBin();

    if (bin) {
      // Installed but not running — start it
      send('ollama', 'Starting Ollama…');
      startOllamaServe(bin);
    } else {
      // Not installed — download and install it
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

    // Wait for Ollama to respond
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

  // ── Step 2: Pull model if needed ──────────────────────────────────────────
  const modelReady = await hasModel(model);
  if (!modelReady) {
    const bin = findOllamaBin() || 'ollama';
    send('model', `Downloading AI model (${model})…`, 0);
    try {
      await pullModel(bin, model, ({ percent, detail }) => {
        send('model', `Downloading AI model… ${detail || ''}`, percent);
      });
    } catch (err) {
      mainWindow?.webContents.send('setup:error', {
        message: `Could not download the AI model (${model}). Check your internet connection and reopen Orchestra-Core.`,
        detail: err.message,
      });
      return;
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
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
    minHeight: 640,
    backgroundColor: '#FBF1EE',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    // Dev mode — go straight to dashboard
    mainWindow.loadURL(devServerUrl + '/dashboard');
    return;
  }

  await waitForServer(SERVER_URL);

  // Check if setup is needed before showing the main UI
  const needsOllama = !(await isOllamaRunning());
  const model = getModelForDevice();
  const needsModel = needsOllama || !(await hasModel(model));

  if (needsOllama || needsModel) {
    mainWindow.loadURL(`${SERVER_URL}/setup`);
    // Run setup in background — sends IPC events to the setup page
    runSetup();
  } else {
    mainWindow.loadURL(`${SERVER_URL}/dashboard`);
  }
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
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
