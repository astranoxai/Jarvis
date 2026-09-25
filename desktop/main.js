const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;

function startBackend() {
  const projectRoot = path.resolve(__dirname, '..');

  backendProcess = spawn(
    'npx',
    ['tsx', 'src/index.ts'],
    {
      cwd: projectRoot,
      shell: true,
      windowsHide: true
    }
  );

  backendProcess.stdout.on('data', (data) => {
    console.log(`[JARVIS BACKEND] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[JARVIS BACKEND ERROR] ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`JARVIS backend exited with code ${code}`);
    backendProcess = null;
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: '#02040b',

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  startBackend();

  setTimeout(() => {
    createWindow();
  }, 1500);
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});