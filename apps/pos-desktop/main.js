const { app, BrowserWindow } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');

const POS_URL = process.env.POS_URL || 'https://pos.mings.az';
let agentProcess = null;

function startPrintAgent() {
  const agentDir = app.isPackaged
    ? path.join(process.resourcesPath, 'pos-print-agent')
    : path.join(__dirname, '..', 'pos-print-agent');
  const entry = path.join(agentDir, 'src', 'index.js');
  agentProcess = spawn(process.execPath, [entry], {
    cwd: agentDir,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
  });
  agentProcess.on('exit', (code) => {
    console.log('print agent exited', code);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  void win.loadURL(POS_URL);
}

app.whenReady().then(() => {
  startPrintAgent();
  createWindow();
});

app.on('window-all-closed', () => {
  if (agentProcess) agentProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (agentProcess) agentProcess.kill();
});
