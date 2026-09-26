const electron =
  require('electron');


const {
  app,
  BrowserWindow,
  WebContentsView,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  shell,
  Notification,
  session
} = electron;


const {
  spawn
} = require('child_process');


const fs =
  require('fs');


const path =
  require('path');


const net =
  require('net');


const {
  pathToFileURL
} = require('url');


/* ============================================================
   SCREEN
============================================================ */

let screen =
  null;


/* ============================================================
   BACKGROUND PERFORMANCE
============================================================ */

app.commandLine.appendSwitch(
  'disable-renderer-backgrounding'
);


/* ============================================================
   CONFIG
============================================================ */

const AUTO_START_LIVE_SESSION =
  true;


const AUTO_START_DELAY_MS =
  1200;


const MINI_WIDTH =
  92;


const MINI_HEIGHT =
  124;


const MINI_EDGE_GAP =
  10;


const BROWSER_TOOLBAR_HEIGHT =
  58;


const BROWSER_HOME =
  'https://www.google.com/';


/* ============================================================
   PATHS
============================================================ */

const DESKTOP_DIR =
  __dirname;


const ROOT_DIR =
  path.resolve(
    DESKTOP_DIR,
    '..'
  );


const BACKEND_ENTRY =
  path.join(
    ROOT_DIR,
    'src',
    'index.ts'
  );


const VOICE_SERVER =
  path.join(
    ROOT_DIR,
    'voice_server.py'
  );


const MINI_HTML =
  path.join(
    DESKTOP_DIR,
    'mini.html'
  );


const BROWSER_HTML =
  path.join(
    DESKTOP_DIR,
    'browser.html'
  );


const ROOT_TSX =
  path.join(
    ROOT_DIR,
    'node_modules',
    'tsx',
    'dist',
    'cli.mjs'
  );


const DESKTOP_TSX =
  path.join(
    DESKTOP_DIR,
    'node_modules',
    'tsx',
    'dist',
    'cli.mjs'
  );


const MEDIA_DIR =
  path.join(
    DESKTOP_DIR,
    'media'
  );


/* ============================================================
   STATE
============================================================ */

let mainWindow =
  null;


let miniWindow =
  null;


let browserWindow =
  null;


let browserView =
  null;


let tray =
  null;


let backendProcess =
  null;


let voiceProcess =
  null;


let quitting =
  false;


let trayEnabled =
  true;


let liveSessionStarting =
  false;


let backgroundVoiceNoticeShown =
  false;


/* ============================================================
   HELPERS
============================================================ */

function sleep(
  ms
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}


function isPortOpen(
  port,
  host = '127.0.0.1'
) {

  return new Promise(
    resolve => {

      const socket =
        new net.Socket();


      let finished =
        false;


      const finish =
        value => {

          if (
            finished
          ) {
            return;
          }


          finished =
            true;


          try {

            socket.destroy();

          } catch {}


          resolve(
            value
          );
        };


      socket.setTimeout(
        500
      );


      socket.once(
        'connect',
        () =>
          finish(
            true
          )
      );


      socket.once(
        'timeout',
        () =>
          finish(
            false
          )
      );


      socket.once(
        'error',
        () =>
          finish(
            false
          )
      );


      socket.connect(
        port,
        host
      );
    }
  );
}


async function waitForPort(
  port,
  timeout =
    15000
) {

  const started =
    Date.now();


  while (
    Date.now() -
      started <
      timeout
  ) {

    if (
      await isPortOpen(
        port
      )
    ) {

      return true;
    }


    await sleep(
      250
    );
  }


  return false;
}


/* ============================================================
   BACKEND
============================================================ */

async function startBackend() {

  if (
    await isPortOpen(
      3000
    )
  ) {

    console.log(
      '[NOVA] Backend already running.'
    );


    return true;
  }


  const tsxCli =
    fs.existsSync(
      ROOT_TSX
    )

      ? ROOT_TSX

      : DESKTOP_TSX;


  if (
    !fs.existsSync(
      tsxCli
    )
  ) {

    console.error(
      '[NOVA] Could not find tsx.'
    );


    return false;
  }


  console.log(
    '[NOVA] Starting backend...'
  );


  backendProcess =
    spawn(
      'node',

      [
        tsxCli,
        BACKEND_ENTRY
      ],

      {
        cwd:
          ROOT_DIR,

        env: {
          ...process.env
        },

        windowsHide:
          true,

        stdio: [
          'ignore',
          'pipe',
          'pipe'
        ]
      }
    );


  backendProcess.stdout
    ?.on(
      'data',
      data => {

        const text =
          data
            .toString()
            .trim();


        if (
          text
        ) {

          console.log(
            `[BACKEND] ${text}`
          );
        }
      }
    );


  backendProcess.stderr
    ?.on(
      'data',
      data => {

        const text =
          data
            .toString()
            .trim();


        if (
          text
        ) {

          console.error(
            `[BACKEND] ${text}`
          );
        }
      }
    );


  backendProcess.on(
    'error',
    error => {

      console.error(
        '[BACKEND]',
        error
      );
    }
  );


  backendProcess.on(
    'exit',
    code => {

      console.log(
        `[BACKEND] exited: ${code}`
      );


      backendProcess =
        null;
    }
  );


  return true;
}


/* ============================================================
   LOCAL WHISPER
============================================================ */

function spawnPython(
  executable,
  args
) {

  return spawn(
    executable,
    args,

    {
      cwd:
        ROOT_DIR,

      env: {
        ...process.env,

        PYTHONUNBUFFERED:
          '1'
      },

      windowsHide:
        true,

      stdio: [
        'ignore',
        'pipe',
        'pipe'
      ]
    }
  );
}


async function startVoiceServer() {

  if (
    await isPortOpen(
      5001
    )
  ) {

    console.log(
      '[VOICE] Local Whisper already running.'
    );


    return true;
  }


  if (
    !fs.existsSync(
      VOICE_SERVER
    )
  ) {

    console.error(
      '[VOICE] voice_server.py not found.'
    );


    return false;
  }


  console.log(
    '[VOICE] Starting local Whisper...'
  );


  voiceProcess =
    spawnPython(
      'py',

      [
        '-3.12',
        VOICE_SERVER
      ]
    );


  voiceProcess.stdout
    ?.on(
      'data',
      data => {

        const text =
          data
            .toString()
            .trim();


        if (
          text
        ) {

          console.log(
            `[VOICE] ${text}`
          );
        }
      }
    );


  voiceProcess.stderr
    ?.on(
      'data',
      data => {

        const text =
          data
            .toString()
            .trim();


        if (
          text
        ) {

          console.error(
            `[VOICE] ${text}`
          );
        }
      }
    );


  voiceProcess.on(
    'error',
    error => {

      console.error(
        '[VOICE]',
        error
      );
    }
  );


  voiceProcess.on(
    'exit',
    code => {

      console.log(
        `[VOICE] exited: ${code}`
      );


      voiceProcess =
        null;
    }
  );


  return true;
}


/* ============================================================
   URL HANDLING
============================================================ */

function normalizeBrowserUrl(
  input
) {

  const value =
    String(
      input ||
      ''
    )
      .trim();


  if (
    !value
  ) {

    return BROWSER_HOME;
  }


  const aliases = {

    google:
      'https://www.google.com/',

    gmail:
      'https://mail.google.com/',

    youtube:
      'https://www.youtube.com/',

    github:
      'https://github.com/'
  };


  const lower =
    value.toLowerCase();


  if (
    aliases[lower]
  ) {

    return aliases[lower];
  }


  if (
    /^https?:\/\//i.test(
      value
    )
  ) {

    try {

      const parsed =
        new URL(
          value
        );


      if (
        parsed.protocol ===
          'http:' ||

        parsed.protocol ===
          'https:'
      ) {

        return parsed.toString();
      }


    } catch {}
  }


  if (
    /^[^\s]+\.[^\s]+$/.test(
      value
    )
  ) {

    try {

      return new URL(
        `https://${value}`
      ).toString();


    } catch {}
  }


  return (
    'https://www.google.com/search?q=' +
    encodeURIComponent(
      value
    )
  );
}


/* ============================================================
   BROWSER VIEW SIZE
============================================================ */

function resizeBrowserView() {

  if (
    !browserWindow ||
    browserWindow.isDestroyed() ||
    !browserView
  ) {

    return;
  }


  const bounds =
    browserWindow
      .getContentBounds();


  browserView.setBounds(
    {
      x:
        0,

      y:
        BROWSER_TOOLBAR_HEIGHT,

      width:
        Math.max(
          1,
          bounds.width
        ),

      height:
        Math.max(
          1,
          bounds.height -
          BROWSER_TOOLBAR_HEIGHT
        )
    }
  );
}


/* ============================================================
   BROWSER STATE
============================================================ */

function sendBrowserState() {

  if (
    !browserWindow ||
    browserWindow.isDestroyed() ||
    !browserView
  ) {

    return;
  }


  const contents =
    browserView.webContents;


  let canGoBack =
    false;


  let canGoForward =
    false;


  try {

    canGoBack =
      contents
        .navigationHistory
        .canGoBack();


    canGoForward =
      contents
        .navigationHistory
        .canGoForward();


  } catch {}


  browserWindow
    .webContents
    .send(
      'nova:browser-state',

      {
        url:
          contents.getURL(),

        title:
          contents.getTitle(),

        canGoBack,

        canGoForward,

        loading:
          contents.isLoading()
      }
    );
}


/* ============================================================
   SHOW EXISTING BROWSER
============================================================ */

function showExistingBrowser() {

  if (
    !browserWindow ||
    browserWindow.isDestroyed()
  ) {

    return false;
  }


  if (
    browserWindow.isMinimized()
  ) {

    browserWindow.restore();
  }


  if (
    !browserWindow.isVisible()
  ) {

    browserWindow.show();
  }


  /*
    Briefly place it on top so Windows
    definitely brings it forward.
  */

  browserWindow.setAlwaysOnTop(
    true
  );


  browserWindow.moveTop();


  browserWindow.focus();


  setTimeout(
    () => {

      if (
        browserWindow &&
        !browserWindow.isDestroyed()
      ) {

        browserWindow.setAlwaysOnTop(
          false
        );
      }

    },

    300
  );


  return true;
}


/* ============================================================
   NOVA BROWSER
============================================================ */

async function createBrowserWindow(
  initialUrl =
    BROWSER_HOME
) {

  const target =
    normalizeBrowserUrl(
      initialUrl
    );


  /*
    Browser already exists.

    Instead of saying "already open",
    physically restore it and bring it
    to the front.
  */

  if (
    browserWindow &&
    !browserWindow.isDestroyed()
  ) {

    console.log(
      '[BROWSER] Reusing existing browser window.'
    );


    showExistingBrowser();


    if (
      browserView &&
      !browserView.webContents.isDestroyed()
    ) {

      try {

        await browserView
          .webContents
          .loadURL(
            target
          );

      } catch (
        error
      ) {

        console.error(
          '[BROWSER] Navigation failed:',
          error
        );
      }
    }


    return browserWindow;
  }


  console.log(
    '[BROWSER] Creating NOVA Browser...'
  );


  browserWindow =
    new BrowserWindow(
      {
        width:
          1400,

        height:
          900,

        minWidth:
          900,

        minHeight:
          600,

        title:
          'NOVA Browser',

        backgroundColor:
          '#020809',

        autoHideMenuBar:
          true,

        show:
          false,

        webPreferences: {

          preload:
            path.join(
              DESKTOP_DIR,
              'preload.js'
            ),

          contextIsolation:
            true,

          nodeIntegration:
            false,

          sandbox:
            false
        }
      }
    );


  await browserWindow.loadFile(
    BROWSER_HTML
  );


  /*
    Persistent website profile.

    This keeps cookies and signed-in sessions.
  */

  const browserSession =
    session.fromPartition(
      'persist:nova-browser'
    );


  browserView =
    new WebContentsView(
      {
        webPreferences: {

          session:
            browserSession,

          contextIsolation:
            true,

          nodeIntegration:
            false,

          sandbox:
            true
        }
      }
    );


  browserWindow
    .contentView
    .addChildView(
      browserView
    );


  browserView.setBackgroundColor(
    '#ffffff'
  );


  resizeBrowserView();


  browserWindow.on(
    'resize',
    resizeBrowserView
  );


  browserWindow.on(
    'maximize',
    resizeBrowserView
  );


  browserWindow.on(
    'unmaximize',
    resizeBrowserView
  );


  browserView
    .webContents
    .on(
      'did-start-loading',
      sendBrowserState
    );


  browserView
    .webContents
    .on(
      'did-stop-loading',
      sendBrowserState
    );


  browserView
    .webContents
    .on(
      'did-navigate',
      sendBrowserState
    );


  browserView
    .webContents
    .on(
      'did-navigate-in-page',
      sendBrowserState
    );


  browserView
    .webContents
    .on(
      'page-title-updated',
      sendBrowserState
    );


  browserView
    .webContents
    .on(
      'did-fail-load',
      (
        event,
        errorCode,
        errorDescription,
        validatedURL
      ) => {

        console.error(
          '[BROWSER] Load failed:',
          errorCode,
          errorDescription,
          validatedURL
        );
      }
    );


  /*
    Links that request a new window/tab
    will open inside the same NOVA Browser.
  */

  browserView
    .webContents
    .setWindowOpenHandler(
      details => {

        const popupUrl =
          details.url;


        if (
          /^https?:\/\//i.test(
            popupUrl
          )
        ) {

          setTimeout(
            () => {

              if (
                browserView &&
                !browserView.webContents.isDestroyed()
              ) {

                browserView
                  .webContents
                  .loadURL(
                    popupUrl
                  )
                  .catch(
                    error => {

                      console.error(
                        '[BROWSER] Popup navigation failed:',
                        error
                      );
                    }
                  );
              }

            },

            0
          );
        }


        return {
          action:
            'deny'
        };
      }
    );


  /*
    Browser websites do not automatically
    receive NOVA's microphone/camera.
  */

  browserSession
    .setPermissionRequestHandler(
      (
        webContents,
        permission,
        callback
      ) => {

        callback(
          false
        );
      }
    );


  browserWindow.on(
    'closed',
    () => {

      console.log(
        '[BROWSER] Browser window closed.'
      );


      try {

        if (
          browserView &&
          !browserView.webContents.isDestroyed()
        ) {

          browserView
            .webContents
            .close();
        }

      } catch {}


      browserView =
        null;


      browserWindow =
        null;
    }
  );


  browserWindow.once(
    'ready-to-show',
    () => {

      showExistingBrowser();
    }
  );


  /*
    Since browser.html has already loaded,
    explicitly show it now too.
  */

  browserWindow.show();


  browserWindow.center();


  browserWindow.moveTop();


  browserWindow.focus();


  try {

    await browserView
      .webContents
      .loadURL(
        target
      );

  } catch (
    error
  ) {

    console.error(
      '[BROWSER] Initial navigation failed:',
      error
    );
  }


  resizeBrowserView();


  sendBrowserState();


  console.log(
    '[BROWSER] NOVA Browser opened:',
    target
  );


  return browserWindow;
}


/* ============================================================
   BROWSER IPC
============================================================ */

ipcMain.handle(
  'nova:open-browser',

  async (
    event,
    url
  ) => {

    await createBrowserWindow(
      url ||
      BROWSER_HOME
    );


    return {
      success:
        true
    };
  }
);


ipcMain.handle(
  'nova:browser-navigate',

  async (
    event,
    input
  ) => {

    const target =
      normalizeBrowserUrl(
        input
      );


    if (
      !browserWindow ||
      browserWindow.isDestroyed() ||
      !browserView
    ) {

      await createBrowserWindow(
        target
      );


      return true;
    }


    showExistingBrowser();


    try {

      await browserView
        .webContents
        .loadURL(
          target
        );


      return true;


    } catch (
      error
    ) {

      console.error(
        '[BROWSER]',
        error
      );


      return false;
    }
  }
);


ipcMain.handle(
  'nova:browser-home',

  async () => {

    await createBrowserWindow(
      BROWSER_HOME
    );


    return true;
  }
);


ipcMain.handle(
  'nova:browser-back',

  async () => {

    if (
      browserView &&
      !browserView.webContents.isDestroyed()
    ) {

      try {

        if (
          browserView
            .webContents
            .navigationHistory
            .canGoBack()
        ) {

          browserView
            .webContents
            .navigationHistory
            .goBack();
        }

      } catch {}
    }


    return true;
  }
);


ipcMain.handle(
  'nova:browser-forward',

  async () => {

    if (
      browserView &&
      !browserView.webContents.isDestroyed()
    ) {

      try {

        if (
          browserView
            .webContents
            .navigationHistory
            .canGoForward()
        ) {

          browserView
            .webContents
            .navigationHistory
            .goForward();
        }

      } catch {}
    }


    return true;
  }
);


ipcMain.handle(
  'nova:browser-reload',

  async () => {

    if (
      browserView &&
      !browserView.webContents.isDestroyed()
    ) {

      browserView
        .webContents
        .reload();
    }


    return true;
  }
);


/* ============================================================
   MINI WINDOW POSITION
============================================================ */

function positionMiniWindow() {

  if (
    !screen ||
    !miniWindow ||
    miniWindow.isDestroyed()
  ) {

    return;
  }


  let display;


  try {

    if (
      mainWindow &&
      !mainWindow.isDestroyed()
    ) {

      display =
        screen.getDisplayMatching(
          mainWindow.getBounds()
        );

    } else {

      display =
        screen.getPrimaryDisplay();
    }


  } catch {

    return;
  }


  const area =
    display.workArea;


  const x =
    area.x +
    area.width -
    MINI_WIDTH -
    MINI_EDGE_GAP;


  const y =
    area.y +
    Math.round(
      (
        area.height -
        MINI_HEIGHT
      ) /
      2
    );


  miniWindow.setBounds(
    {
      x,
      y,

      width:
        MINI_WIDTH,

      height:
        MINI_HEIGHT
    },

    false
  );
}


/* ============================================================
   MINI WINDOW
============================================================ */

function createMiniWindow() {

  if (
    miniWindow &&
    !miniWindow.isDestroyed()
  ) {

    return;
  }


  if (
    !fs.existsSync(
      MINI_HTML
    )
  ) {

    console.error(
      '[MINI] mini.html not found.'
    );


    return;
  }


  miniWindow =
    new BrowserWindow(
      {
        width:
          MINI_WIDTH,

        height:
          MINI_HEIGHT,

        frame:
          false,

        transparent:
          true,

        resizable:
          false,

        movable:
          false,

        minimizable:
          false,

        maximizable:
          false,

        fullscreenable:
          false,

        alwaysOnTop:
          true,

        skipTaskbar:
          true,

        show:
          false,

        hasShadow:
          false,

        backgroundColor:
          '#00000000',

        webPreferences: {

          contextIsolation:
            true,

          nodeIntegration:
            false,

          sandbox:
            true,

          backgroundThrottling:
            false
        }
      }
    );


  miniWindow.loadFile(
    MINI_HTML
  );


  miniWindow.setAlwaysOnTop(
    true,
    'floating'
  );


  positionMiniWindow();


  miniWindow.on(
    'focus',
    () => {

      if (
        quitting
      ) {

        return;
      }


      openFullNova();
    }
  );


  miniWindow.on(
    'closed',
    () => {

      miniWindow =
        null;
    }
  );
}


function showMiniWindow() {

  if (
    quitting
  ) {

    return;
  }


  if (
    !miniWindow ||
    miniWindow.isDestroyed()
  ) {

    createMiniWindow();
  }


  if (
    !miniWindow ||
    miniWindow.isDestroyed()
  ) {

    return;
  }


  positionMiniWindow();


  if (
    !miniWindow.isVisible()
  ) {

    miniWindow.showInactive();
  }
}


function hideMiniWindow() {

  if (
    miniWindow &&
    !miniWindow.isDestroyed()
  ) {

    miniWindow.hide();
  }
}


/* ============================================================
   FULL NOVA
============================================================ */

function openFullNova() {

  if (
    quitting
  ) {

    return;
  }


  hideMiniWindow();


  if (
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {

    createWindow();


    return;
  }


  if (
    mainWindow.isMinimized()
  ) {

    mainWindow.restore();
  }


  if (
    !mainWindow.isVisible()
  ) {

    mainWindow.show();
  }


  mainWindow.maximize();


  mainWindow.focus();


  setTimeout(
    startLiveSessionInRenderer,
    550
  );
}


/* ============================================================
   LIVE VOICE + VISION
============================================================ */

async function startLiveSessionInRenderer() {

  if (
    !AUTO_START_LIVE_SESSION ||
    liveSessionStarting
  ) {

    return;
  }


  if (
    !mainWindow ||
    mainWindow.isDestroyed() ||
    !mainWindow.isVisible()
  ) {

    return;
  }


  liveSessionStarting =
    true;


  try {

    const [
      backendReady,
      voiceReady
    ] =
      await Promise.all(
        [
          waitForPort(
            3000,
            10000
          ),

          waitForPort(
            5001,
            30000
          )
        ]
      );


    if (
      !backendReady ||
      !voiceReady
    ) {

      return;
    }


    await mainWindow
      .webContents
      .executeJavaScript(
        `
        (async () => {

          const sleep =
            ms =>
              new Promise(
                resolve =>
                  setTimeout(
                    resolve,
                    ms
                  )
              );


          const get =
            id =>
              document.getElementById(
                id
              );


          const active =
            id => {

              const button =
                get(
                  id
                );


              if (
                !button
              ) {

                return false;
              }


              return (
                button.classList.contains(
                  'active'
                ) ||

                String(
                  button.textContent ||
                  ''
                )
                  .toUpperCase()
                  .includes(
                    'STOP'
                  )
              );
            };


          const waitUntil =
            async (
              check,
              timeout =
                10000
            ) => {

              const started =
                Date.now();


              while (
                Date.now() -
                  started <
                  timeout
              ) {

                try {

                  if (
                    check()
                  ) {

                    return true;
                  }

                } catch {}


                await sleep(
                  150
                );
              }


              return false;
            };


          await sleep(
            500
          );


          let visionReady =
            active(
              'liveVisionButton'
            );


          if (
            !visionReady
          ) {

            get(
              'liveVisionButton'
            )
              ?.click();


            visionReady =
              await waitUntil(
                () => {

                  const camera =
                    String(
                      get(
                        'cameraHeaderStatus'
                      )
                        ?.textContent ||
                      ''
                    )
                      .trim()
                      .toUpperCase();


                  const vision =
                    String(
                      get(
                        'visionHeaderStatus'
                      )
                        ?.textContent ||
                      ''
                    )
                      .trim()
                      .toUpperCase();


                  return (
                    active(
                      'liveVisionButton'
                    ) &&

                    camera ===
                      'ACTIVE' &&

                    vision ===
                      'WATCHING'
                  );
                },

                12000
              );
          }


          await sleep(
            350
          );


          let voiceReady =
            active(
              'liveVoiceButton'
            );


          if (
            !voiceReady
          ) {

            get(
              'liveVoiceButton'
            )
              ?.click();


            voiceReady =
              await waitUntil(
                () => {

                  const mic =
                    String(
                      get(
                        'micHeaderStatus'
                      )
                        ?.textContent ||
                      ''
                    )
                      .trim()
                      .toUpperCase();


                  return (
                    active(
                      'liveVoiceButton'
                    ) &&

                    mic ===
                      'ACTIVE'
                  );
                },

                10000
              );
          }


          return {
            vision:
              visionReady,

            voice:
              voiceReady
          };

        })()
        `,
        true
      );


  } catch (
    error
  ) {

    console.error(
      '[AUTO LIVE]',
      error
    );


  } finally {

    liveSessionStarting =
      false;
  }
}


/* ============================================================
   BACKGROUND MODE
============================================================ */

async function enterBackgroundMode() {

  if (
    quitting ||
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {

    return;
  }


  try {

    const result =
      await mainWindow
        .webContents
        .executeJavaScript(
          `
          (async () => {

            const voiceButton =
              document.getElementById(
                'liveVoiceButton'
              );


            const voiceActive =
              Boolean(
                voiceButton &&
                (
                  voiceButton
                    .classList
                    .contains(
                      'active'
                    ) ||

                  String(
                    voiceButton.textContent ||
                    ''
                  )
                    .toUpperCase()
                    .includes(
                      'STOP VOICE'
                    )
                )
              );


            try {

              if (
                typeof stopCamera ===
                  'function'
              ) {

                await stopCamera();
              }

            } catch {}


            return {
              voiceActive
            };

          })()
          `,
          true
        );


    if (
      result?.voiceActive &&
      tray
    ) {

      tray.setToolTip(
        'NOVA — Live Voice Active'
      );
    }


    if (
      result?.voiceActive &&
      !backgroundVoiceNoticeShown &&
      Notification.isSupported()
    ) {

      backgroundVoiceNoticeShown =
        true;


      new Notification(
        {
          title:
            'NOVA Live Voice',

          body:
            'Live Voice remains active. Webcam vision is paused while NOVA is in the background.'
        }
      ).show();
    }


  } catch (
    error
  ) {

    console.error(
      '[BACKGROUND]',
      error
    );
  }
}


/* ============================================================
   FOREGROUND
============================================================ */

function returnToForeground() {

  if (
    quitting
  ) {

    return;
  }


  hideMiniWindow();


  if (
    tray
  ) {

    tray.setToolTip(
      'NOVA'
    );
  }


  setTimeout(
    startLiveSessionInRenderer,
    550
  );
}


/* ============================================================
   MAIN WINDOW
============================================================ */

function createWindow() {

  if (
    mainWindow &&
    !mainWindow.isDestroyed()
  ) {

    openFullNova();


    return;
  }


  mainWindow =
    new BrowserWindow(
      {
        width:
          1500,

        height:
          920,

        minWidth:
          1050,

        minHeight:
          680,

        backgroundColor:
          '#020809',

        show:
          false,

        autoHideMenuBar:
          true,

        webPreferences: {

          preload:
            path.join(
              DESKTOP_DIR,
              'preload.js'
            ),

          contextIsolation:
            true,

          nodeIntegration:
            false,

          sandbox:
            false,

          backgroundThrottling:
            false
        }
      }
    );


  mainWindow.loadFile(
    path.join(
      DESKTOP_DIR,
      'index.html'
    )
  );


  mainWindow.once(
    'ready-to-show',
    () => {

      mainWindow.show();


      mainWindow.maximize();


      setTimeout(
        startLiveSessionInRenderer,
        AUTO_START_DELAY_MS
      );
    }
  );


  mainWindow.on(
    'blur',
    () => {

      if (
        quitting
      ) {

        return;
      }


      enterBackgroundMode();


      showMiniWindow();
    }
  );


  mainWindow.on(
    'focus',
    returnToForeground
  );


  mainWindow.on(
    'minimize',
    () => {

      enterBackgroundMode();


      showMiniWindow();
    }
  );


  mainWindow.on(
    'restore',
    returnToForeground
  );


  mainWindow.on(
    'hide',
    () => {

      if (
        quitting
      ) {

        return;
      }


      enterBackgroundMode();


      showMiniWindow();
    }
  );


  mainWindow.on(
    'show',
    returnToForeground
  );


  mainWindow.on(
    'close',
    event => {

      if (
        !quitting &&
        trayEnabled
      ) {

        event.preventDefault();


        enterBackgroundMode();


        mainWindow.hide();


        showMiniWindow();
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


/* ============================================================
   PERMISSIONS
============================================================ */

function setupPermissions() {

  session
    .defaultSession
    .setPermissionRequestHandler(
      (
        webContents,
        permission,
        callback
      ) => {

        if (
          permission ===
            'media'
        ) {

          callback(
            true
          );


          return;
        }


        callback(
          false
        );
      }
    );


  session
    .defaultSession
    .setPermissionCheckHandler(
      (
        webContents,
        permission
      ) => {

        return (
          permission ===
            'media'
        );
      }
    );
}


/* ============================================================
   TRAY
============================================================ */

function createTray() {

  if (
    tray
  ) {

    return;
  }


  let icon =
    nativeImage.createEmpty();


  const candidates =
    [
      path.join(
        DESKTOP_DIR,
        'icon.ico'
      ),

      path.join(
        DESKTOP_DIR,
        'icon.png'
      ),

      path.join(
        DESKTOP_DIR,
        'assets',
        'icon.png'
      )
    ];


  for (
    const candidate
    of candidates
  ) {

    if (
      fs.existsSync(
        candidate
      )
    ) {

      icon =
        nativeImage.createFromPath(
          candidate
        );


      break;
    }
  }


  tray =
    new Tray(
      icon
    );


  tray.setToolTip(
    'NOVA'
  );


  tray.setContextMenu(
    Menu.buildFromTemplate(
      [
        {
          label:
            'Open NOVA',

          click:
            openFullNova
        },


        {
          label:
            'Open NOVA Browser',

          click:
            () => {

              createBrowserWindow(
                BROWSER_HOME
              );
            }
        },


        {
          type:
            'separator'
        },


        {
          label:
            'Google',

          click:
            () => {

              createBrowserWindow(
                'https://www.google.com/'
              );
            }
        },


        {
          label:
            'Gmail',

          click:
            () => {

              createBrowserWindow(
                'https://mail.google.com/'
              );
            }
        },


        {
          label:
            'YouTube',

          click:
            () => {

              createBrowserWindow(
                'https://www.youtube.com/'
              );
            }
        },


        {
          label:
            'GitHub',

          click:
            () => {

              createBrowserWindow(
                'https://github.com/'
              );
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

              quitting =
                true;


              app.quit();
            }
        }
      ]
    )
  );


  tray.on(
    'double-click',
    openFullNova
  );
}


function destroyTray() {

  if (
    tray
  ) {

    tray.destroy();


    tray =
      null;
  }
}


/* ============================================================
   EXISTING IPC
============================================================ */

ipcMain.handle(
  'nova:list-media',

  async () => {

    try {

      await fs.promises.mkdir(
        MEDIA_DIR,

        {
          recursive:
            true
        }
      );


      const files =
        await fs.promises.readdir(
          MEDIA_DIR,

          {
            withFileTypes:
              true
          }
        );


      const allowed =
        new Set(
          [
            '.png',
            '.jpg',
            '.jpeg',
            '.webp',
            '.gif'
          ]
        );


      return files

        .filter(
          item =>
            item.isFile()
        )

        .filter(
          item =>
            allowed.has(
              path
                .extname(
                  item.name
                )
                .toLowerCase()
            )
        )

        .map(
          item => {

            const fullPath =
              path.join(
                MEDIA_DIR,
                item.name
              );


            return {

              name:
                item.name,

              url:
                pathToFileURL(
                  fullPath
                ).href
            };
          }
        );


    } catch {

      return [];
    }
  }
);


ipcMain.handle(
  'nova:open-external',

  async (
    event,
    url
  ) => {

    try {

      const parsed =
        new URL(
          String(
            url
          )
        );


      if (
        parsed.protocol !==
          'http:' &&

        parsed.protocol !==
          'https:'
      ) {

        return false;
      }


      await shell.openExternal(
        parsed.toString()
      );


      return true;


    } catch {

      return false;
    }
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
  'nova:set-startup',

  async (
    event,
    enabled
  ) => {

    app.setLoginItemSettings(
      {
        openAtLogin:
          Boolean(
            enabled
          ),

        path:
          process.execPath
      }
    );


    return app
      .getLoginItemSettings()
      .openAtLogin;
  }
);


ipcMain.handle(
  'nova:set-tray',

  async (
    event,
    enabled
  ) => {

    trayEnabled =
      Boolean(
        enabled
      );


    if (
      trayEnabled
    ) {

      createTray();

    } else {

      destroyTray();
    }


    return trayEnabled;
  }
);


ipcMain.handle(
  'nova:show-notification',

  async (
    event,
    payload
  ) => {

    if (
      !Notification.isSupported()
    ) {

      return false;
    }


    new Notification(
      {
        title:
          String(
            payload?.title ||
            'NOVA'
          ),

        body:
          String(
            payload?.body ||
            ''
          )
      }
    ).show();


    return true;
  }
);


/* ============================================================
   CHILD CLEANUP
============================================================ */

function stopChildren() {

  if (
    backendProcess &&
    !backendProcess.killed
  ) {

    try {

      backendProcess.kill();

    } catch {}
  }


  if (
    voiceProcess &&
    !voiceProcess.killed
  ) {

    try {

      voiceProcess.kill();

    } catch {}
  }
}


/* ============================================================
   APP START
============================================================ */

app.whenReady()
  .then(
    async () => {

      screen =
        electron.screen;


      screen.on(
        'display-metrics-changed',
        positionMiniWindow
      );


      screen.on(
        'display-added',
        positionMiniWindow
      );


      screen.on(
        'display-removed',
        positionMiniWindow
      );


      setupPermissions();


      console.log(
        ''
      );


      console.log(
        '=============================================='
      );


      console.log(
        'NOVA BOOT SEQUENCE'
      );


      console.log(
        '=============================================='
      );


      await Promise.all(
        [
          startBackend(),
          startVoiceServer()
        ]
      );


      const backendReady =
        await waitForPort(
          3000,
          15000
        );


      const voiceReady =
        await waitForPort(
          5001,
          40000
        );


      console.log(
        `[BOOT] Backend: ${
          backendReady
            ? 'READY'
            : 'FAILED'
        }`
      );


      console.log(
        `[BOOT] Whisper: ${
          voiceReady
            ? 'READY'
            : 'FAILED'
        }`
      );


      createMiniWindow();


      createWindow();


      if (
        trayEnabled
      ) {

        createTray();
      }


      app.on(
        'activate',
        openFullNova
      );
    }
  );


/* ============================================================
   QUIT
============================================================ */

app.on(
  'before-quit',
  () => {

    quitting =
      true;


    hideMiniWindow();


    stopChildren();
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