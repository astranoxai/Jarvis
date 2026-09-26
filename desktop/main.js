const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  shell,
  Notification,
  session
} = require('electron');

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const BACKEND_URL =
  'http://127.0.0.1:3000';

const HEALTH_URL =
  `${BACKEND_URL}/health`;

const PYTHON_EXE =
  'C:\\Users\\karta\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';

let backendProcess =
  null;

let mainWindow =
  null;

let tray =
  null;

let trayEnabled =
  true;

let isQuitting =
  false;


/* =========================================
   BACKEND
========================================= */

async function backendIsReady() {
  try {
    const response =
      await fetch(
        HEALTH_URL
      );

    return response.ok;

  } catch {
    return false;
  }
}


async function waitForBackend() {
  const timeout =
    12000;

  const start =
    Date.now();

  while (
    Date.now() - start <
    timeout
  ) {
    if (
      await backendIsReady()
    ) {
      return true;
    }

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          250
        )
    );
  }

  return false;
}


function startBackend() {
  if (
    backendProcess
  ) {
    return;
  }

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

        shell:
          false,

        stdio: [
          'ignore',
          'pipe',
          'pipe'
        ]
      }
    );

  backendProcess
    .stdout
    ?.on(
      'data',
      data => {
        console.log(
          `[NOVA BACKEND] ${data}`
        );
      }
    );

  backendProcess
    .stderr
    ?.on(
      'data',
      data => {
        console.error(
          `[NOVA BACKEND] ${data}`
        );
      }
    );

  backendProcess.on(
    'exit',
    () => {
      backendProcess =
        null;
    }
  );
}


function stopBackend() {
  if (
    !backendProcess
  ) {
    return;
  }

  try {
    backendProcess.kill();
  } catch {}

  backendProcess =
    null;
}


/* =========================================
   TRAY
========================================= */

function makeTrayIcon() {
  const svg =
    `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="32"
         height="32"
         viewBox="0 0 32 32">

      <rect
        width="32"
        height="32"
        rx="8"
        fill="#12030a"
      />

      <circle
        cx="16"
        cy="16"
        r="10"
        fill="none"
        stroke="#ff2a55"
        stroke-width="2"
      />

      <circle
        cx="16"
        cy="16"
        r="5"
        fill="#9d174d"
      />

    </svg>
    `;

  const dataUrl =
    'data:image/svg+xml;base64,' +
    Buffer
      .from(svg)
      .toString('base64');

  return nativeImage
    .createFromDataURL(
      dataUrl
    )
    .resize({
      width: 16,
      height: 16
    });
}


function createTray() {
  if (
    tray ||
    !trayEnabled
  ) {
    return;
  }

  tray =
    new Tray(
      makeTrayIcon()
    );

  tray.setToolTip(
    'NOVA'
  );

  const menu =
    Menu.buildFromTemplate([
      {
        label:
          'Open NOVA',

        click:
          () => {
            if (
              mainWindow
            ) {
              mainWindow.show();

              mainWindow.focus();
            }
          }
      },

      {
        type:
          'separator'
      },

      {
        label:
          'Quit NOVA',

        click:
          () => {
            isQuitting =
              true;

            app.quit();
          }
      }
    ]);

  tray.setContextMenu(
    menu
  );

  tray.on(
    'double-click',
    () => {
      if (
        mainWindow
      ) {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  );
}


function destroyTray() {
  if (!tray) {
    return;
  }

  tray.destroy();
  tray = null;
}


function setTrayEnabled(
  enabled
) {
  trayEnabled =
    Boolean(enabled);

  if (
    trayEnabled
  ) {
    createTray();
  } else {
    destroyTray();
  }
}


/* =========================================
   MEDIA
========================================= */

function getMediaDirectory() {
  return path.join(
    __dirname,
    'media'
  );
}


async function listMediaFiles() {
  const mediaDirectory =
    getMediaDirectory();

  try {
    await fs.promises.mkdir(
      mediaDirectory,
      {
        recursive: true
      }
    );

    const entries =
      await fs.promises.readdir(
        mediaDirectory,
        {
          withFileTypes: true
        }
      );

    const extensions =
      new Set([
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.gif'
      ]);

    return entries
      .filter(
        entry =>
          entry.isFile()
      )
      .filter(
        entry =>
          extensions.has(
            path
              .extname(
                entry.name
              )
              .toLowerCase()
          )
      )
      .map(
        entry => {
          const fullPath =
            path.join(
              mediaDirectory,
              entry.name
            );

          return {
            name:
              entry.name,

            url:
              pathToFileURL(
                fullPath
              ).href
          };
        }
      );

  } catch (error) {
    console.error(
      'Media scan failed:',
      error
    );

    return [];
  }
}


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
        1100,

      minHeight:
        700,

      fullscreen:
        true,

      autoHideMenuBar:
        true,

      backgroundColor:
        '#050208',

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
    path.join(
      __dirname,
      'index.html'
    )
  );


  mainWindow.on(
    'close',
    event => {
      if (
        trayEnabled &&
        !isQuitting
      ) {
        event.preventDefault();

        mainWindow.hide();
      }
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
   IPC
========================================= */

ipcMain.handle(
  'nova:list-media',
  async () => {
    return listMediaFiles();
  }
);


ipcMain.handle(
  'nova:open-external',
  async (
    _event,
    url
  ) => {
    try {
      const parsed =
        new URL(
          String(url)
        );

      if (
        parsed.protocol !==
          'https:' &&
        parsed.protocol !==
          'http:'
      ) {
        return false;
      }

      await shell.openExternal(
        parsed.href
      );

      return true;

    } catch {
      return false;
    }
  }
);


ipcMain.handle(
  'nova:set-startup',
  async (
    _event,
    enabled
  ) => {
    const openAtLogin =
      Boolean(enabled);

    app.setLoginItemSettings({
      openAtLogin,

      path:
        process.execPath,

      args:
        process.defaultApp
          ? [
              app.getAppPath()
            ]
          : []
    });

    return app
      .getLoginItemSettings()
      .openAtLogin;
  }
);


ipcMain.handle(
  'nova:get-startup',
  async () => {
    return app
      .getLoginItemSettings()
      .openAtLogin;
  }
);


ipcMain.handle(
  'nova:set-tray',
  async (
    _event,
    enabled
  ) => {
    setTrayEnabled(
      enabled
    );

    return trayEnabled;
  }
);


ipcMain.handle(
  'nova:show-notification',
  async (
    _event,
    payload
  ) => {
    if (
      !Notification
        .isSupported()
    ) {
      return false;
    }

    const title =
      String(
        payload?.title ||
        'NOVA'
      );

    const body =
      String(
        payload?.body ||
        ''
      );

    const notification =
      new Notification({
        title,
        body
      });

    notification.show();

    return true;
  }
);


/* =========================================
   EXISTING WHISPER IPC
========================================= */

ipcMain.handle(
  'nova:recognize-speech',
  async () => {
    return {
      success: false,
      error:
        'Voice input is disabled.'
    };
  }
);


/* =========================================
   START NOVA
========================================= */

async function launchNova() {
  const alreadyRunning =
    await backendIsReady();

  if (
    !alreadyRunning
  ) {
    startBackend();

    const ready =
      await waitForBackend();

    if (
      !ready
    ) {
      console.error(
        'NOVA backend did not start in time.'
      );
    }
  }

  createWindow();

  createTray();
}


/* =========================================
   APP
========================================= */

app.whenReady()
  .then(
    async () => {

      session
        .defaultSession
        .setPermissionRequestHandler(
          (
            _webContents,
            permission,
            callback
          ) => {

            if (
              permission ===
              'media'
            ) {
              callback(true);
              return;
            }

            callback(false);
          }
        );

      await launchNova();

      app.on(
        'activate',
        () => {
          if (
            BrowserWindow
              .getAllWindows()
              .length === 0
          ) {
            createWindow();
          } else {
            mainWindow
              ?.show();
          }
        }
      );
    }
  );


app.on(
  'before-quit',
  () => {
    isQuitting =
      true;

    stopBackend();
  }
);


app.on(
  'window-all-closed',
  () => {
    if (
      process.platform !==
        'darwin' &&
      !trayEnabled
    ) {
      app.quit();
    }
  }
);