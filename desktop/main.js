const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron');

const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;
let mainWindow = null;

const BACKEND_URL =
  'http://127.0.0.1:3000';

const HEALTH_URL =
  `${BACKEND_URL}/health`;

const PYTHON_EXE =
  'C:\\Users\\karta\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';


/* =========================================
   NOVA BACKEND
========================================= */

function startBackend() {
  const projectRoot =
    path.resolve(
      __dirname,
      '..'
    );

  const tsxCli =
    path.join(
      projectRoot,
      'node_modules',
      'tsx',
      'dist',
      'cli.mjs'
    );

  backendProcess =
    spawn(
      'node',
      [
        tsxCli,
        'src/index.ts'
      ],
      {
        cwd:
          projectRoot,

        windowsHide:
          true,

        stdio: [
          'ignore',
          'pipe',
          'pipe'
        ]
      }
    );


  backendProcess.stdout.on(
    'data',
    (data) => {
      console.log(
        `[NOVA BACKEND] ${data.toString()}`
      );
    }
  );


  backendProcess.stderr.on(
    'data',
    (data) => {
      console.error(
        `[NOVA BACKEND ERROR] ${data.toString()}`
      );
    }
  );


  backendProcess.on(
    'error',
    (error) => {
      console.error(
        'Failed to start NOVA backend:',
        error
      );
    }
  );


  backendProcess.on(
    'close',
    (code) => {
      console.log(
        `NOVA backend exited with code ${code}`
      );

      backendProcess = null;
    }
  );
}


/* =========================================
   BACKEND HEALTH
========================================= */

async function backendIsReady() {
  try {
    const response =
      await fetch(
        HEALTH_URL
      );

    if (!response.ok) {
      return false;
    }

    const data =
      await response.json();

    return (
      data?.status ===
      'ok'
    );

  } catch {
    return false;
  }
}


async function waitForBackend(
  timeoutMs = 12000,
  intervalMs = 250
) {
  const startedAt =
    Date.now();

  while (
    Date.now() -
    startedAt <
    timeoutMs
  ) {
    if (
      await backendIsReady()
    ) {
      return true;
    }

    await new Promise(
      (resolve) => {
        setTimeout(
          resolve,
          intervalMs
        );
      }
    );
  }

  return false;
}


/* =========================================
   STOP BACKEND
========================================= */

function stopBackend() {
  if (
    !backendProcess ||
    backendProcess.killed
  ) {
    return;
  }

  try {
    backendProcess.kill();

  } catch (error) {
    console.error(
      'Failed to stop NOVA backend:',
      error
    );
  }

  backendProcess = null;
}


/* =========================================
   WHISPER
   Kept for compatibility even though
   voice input is currently hidden.
========================================= */

function recognizeSpeechWithWhisper() {
  return new Promise(
    (resolve, reject) => {

      const whisperScript =
        path.join(
          __dirname,
          'whisper_test.py'
        );

      const whisperProcess =
        spawn(
          PYTHON_EXE,
          [whisperScript],
          {
            cwd:
              __dirname,

            windowsHide:
              true
          }
        );

      let output = '';
      let errorOutput = '';


      whisperProcess.stdout.on(
        'data',
        (data) => {
          output +=
            data.toString();
        }
      );


      whisperProcess.stderr.on(
        'data',
        (data) => {
          errorOutput +=
            data.toString();
        }
      );


      whisperProcess.on(
        'error',
        (error) => {
          reject(error);
        }
      );


      whisperProcess.on(
        'close',
        (code) => {

          if (
            code !== 0
          ) {
            reject(
              new Error(
                errorOutput ||
                `Whisper exited with code ${code}`
              )
            );

            return;
          }

          const match =
            output.match(
              /You said:\s*(.+)/i
            );

          const text =
            match?.[1]?.trim()
            || '';

          resolve(text);
        }
      );
    }
  );
}


/* =========================================
   IPC
========================================= */

ipcMain.handle(
  'nova:recognize-speech',
  async () => {

    try {
      const text =
        await recognizeSpeechWithWhisper();

      return {
        success: true,
        text
      };

    } catch (error) {

      console.error(
        'Whisper recognition error:',
        error
      );

      return {
        success: false,

        error:
          error?.message ||
          'Whisper recognition failed.'
      };
    }
  }
);


/* =========================================
   WINDOW
========================================= */

function createWindow() {
  mainWindow =
    new BrowserWindow({

      width:
        1600,

      height:
        1000,

      minWidth:
        1200,

      minHeight:
        720,

      backgroundColor:
        '#020006',

      show:
        false,

      fullscreen:
        true,

      autoHideMenuBar:
        true,

      webPreferences: {

        preload:
          path.join(
            __dirname,
            'preload.js'
          ),

        contextIsolation:
          true,

        nodeIntegration:
          false
      }
    });


  mainWindow.loadFile(
    'index.html'
  );


  mainWindow.once(
    'ready-to-show',
    () => {

      mainWindow.show();

      mainWindow.setFullScreen(
        true
      );
    }
  );


  mainWindow.on(
    'closed',
    () => {
      mainWindow =
        null;
    }
  );
}


/* =========================================
   START NOVA
========================================= */

async function launchNova() {
  const alreadyRunning =
    await backendIsReady();


  if (!alreadyRunning) {

    startBackend();

    const ready =
      await waitForBackend();


    if (!ready) {
      console.error(
        'NOVA backend did not become ready within the startup timeout.'
      );
    }
  }


  createWindow();
}


/* =========================================
   ELECTRON STARTUP
========================================= */

app.whenReady().then(
  async () => {

    await launchNova();

  }
);


/* =========================================
   SHUTDOWN
========================================= */

app.on(
  'window-all-closed',
  () => {

    stopBackend();

    if (
      process.platform !==
      'darwin'
    ) {
      app.quit();
    }
  }
);


app.on(
  'before-quit',
  () => {

    stopBackend();

  }
);