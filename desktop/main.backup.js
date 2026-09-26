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
   IMPORTANT: KEEP RENDERER ACTIVE IN BACKGROUND
============================================================ */

/*
  This prevents Chromium from heavily throttling
  NOVA's microphone / MediaRecorder / AudioContext
  when another app is in front.
*/

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
   UTILITIES
============================================================ */

function sleep(
  milliseconds
) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        milliseconds
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

      let done =
        false;


      const finish =
        value => {

          if (
            done
          ) {
            return;
          }

          done =
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
        '[NOVA] Backend process error:',
        error
      );
    }
  );


  backendProcess.on(
    'exit',
    code => {

      console.log(
        `[NOVA] Backend exited: ${code}`
      );

      backendProcess =
        null;
    }
  );


  return true;
}


/* ============================================================
   WHISPER
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
        '[VOICE] Process error:',
        error
      );
    }
  );


  voiceProcess.on(
    'exit',
    code => {

      console.log(
        `[VOICE] Server exited: ${code}`
      );

      voiceProcess =
        null;
    }
  );


  return true;
}


/* ============================================================
   LIVE STATE HELPERS
============================================================ */

async function getRendererLiveState() {

  if (
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {
    return {
      voice:
        false,

      vision:
        false
    };
  }


  try {

    return await mainWindow
      .webContents
      .executeJavaScript(
        `
        (() => {

          const voiceButton =
            document.getElementById(
              'liveVoiceButton'
            );

          const visionButton =
            document.getElementById(
              'liveVisionButton'
            );


          return {
            voice:
              Boolean(
                voiceButton &&
                (
                  voiceButton.classList.contains(
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
              ),

            vision:
              Boolean(
                visionButton &&
                (
                  visionButton.classList.contains(
                    'active'
                  ) ||

                  String(
                    visionButton.textContent ||
                    ''
                  )
                    .toUpperCase()
                    .includes(
                      'STOP VISION'
                    )
                )
              )
          };

        })()
        `,
        true
      );


  } catch {

    return {
      voice:
        false,

      vision:
        false
    };
  }
}


/* ============================================================
   AUTO START LIVE VOICE + LIVE VISION
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

    console.log(
      '[AUTO LIVE] Starting foreground Voice + Vision...'
    );


    const [
      backendReady,
      whisperReady
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
      !whisperReady
    ) {

      console.error(
        '[AUTO LIVE] Required services are not ready.'
      );

      return;
    }


    const result =
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
              650
            );


            /* =====================================
               LIVE VISION
            ===================================== */

            let visionReady =
              active(
                'liveVisionButton'
              );


            if (
              !visionReady
            ) {

              const button =
                get(
                  'liveVisionButton'
                );


              if (
                button
              ) {

                button.click();


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
            }


            await sleep(
              400
            );


            /* =====================================
               LIVE VOICE
            ===================================== */

            let voiceReady =
              active(
                'liveVoiceButton'
              );


            if (
              !voiceReady
            ) {

              const button =
                get(
                  'liveVoiceButton'
                );


              if (
                button
              ) {

                button.click();


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
            }


            if (
              voiceReady &&
              visionReady
            ) {

              const status =
                get(
                  'statusText'
                );


              const task =
                get(
                  'currentTask'
                );


              if (
                status
              ) {

                status.textContent =
                  'LISTENING + WATCHING';
              }


              if (
                task
              ) {

                task.textContent =
                  'VOICE + VISION';
              }
            }


            return {
              voice:
                voiceReady,

              vision:
                visionReady
            };

          })()
          `,
          true
        );


    console.log(
      '[AUTO LIVE] State:',
      result
    );


    if (
      result?.voice &&
      result?.vision
    ) {

      console.log(
        '[AUTO LIVE] ✓ VOICE ACTIVE'
      );

      console.log(
        '[AUTO LIVE] ✓ VISION ACTIVE'
      );

      console.log(
        '[AUTO LIVE] ✓ NOVA READY'
      );
    }


  } catch (
    error
  ) {

    console.error(
      '[AUTO LIVE] Error:',
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

/*
  IMPORTANT:

  When you switch to another app:

    MIC / LIVE VOICE = stays active
    CAMERA / LIVE VISION = pauses

  This gives NOVA background conversation
  without leaving the webcam running invisibly.
*/

async function enterBackgroundMode() {

  if (
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

            let voiceActive =
              false;


            const voiceButton =
              document.getElementById(
                'liveVoiceButton'
              );


            if (
              voiceButton
            ) {

              voiceActive =
                (
                  voiceButton.classList.contains(
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
                );
            }


            /*
              Pause webcam only.
              Do NOT stop microphone.
            */

            try {

              if (
                typeof stopCamera ===
                  'function'
              ) {

                await stopCamera();

              } else {

                const visionButton =
                  document.getElementById(
                    'liveVisionButton'
                  );


                if (
                  visionButton
                    ?.classList
                    ?.contains(
                      'active'
                    )
                ) {

                  visionButton.click();
                }
              }

            } catch (
              error
            ) {

              console.error(
                error
              );
            }


            /*
              Voice remains active.
            */

            if (
              voiceActive
            ) {

              const status =
                document.getElementById(
                  'statusText'
                );


              const task =
                document.getElementById(
                  'currentTask'
                );


              if (
                status
              ) {

                status.textContent =
                  'BACKGROUND LISTENING';
              }


              if (
                task
              ) {

                task.textContent =
                  'LIVE VOICE';
              }
            }


            return {
              voiceActive:
                voiceActive
            };

          })()
          `,
          true
        );


    if (
      result?.voiceActive
    ) {

      console.log(
        '[BACKGROUND] ✓ Live Voice remains active.'
      );


      if (
        tray
      ) {

        tray.setToolTip(
          'NOVA — Live Voice Active'
        );
      }


      /*
        Visible Windows notice so background
        microphone use is never silent/hidden.
      */

      if (
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
              'NOVA is still listening while running in the background. The webcam is paused.'
          }
        ).show();
      }


    } else {

      console.log(
        '[BACKGROUND] Live Voice is not active.'
      );


      if (
        tray
      ) {

        tray.setToolTip(
          'NOVA'
        );
      }
    }


  } catch (
    error
  ) {

    console.error(
      '[BACKGROUND] Error:',
      error
    );
  }
}


/* ============================================================
   FOREGROUND MODE
============================================================ */

async function returnToForeground() {

  if (
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {
    return;
  }


  if (
    tray
  ) {

    tray.setToolTip(
      'NOVA'
    );
  }


  /*
    Voice should still be running.

    startLiveSessionInRenderer()
    sees that Voice is already active
    and only restores Vision if needed.
  */

  setTimeout(
    () => {

      startLiveSessionInRenderer();

    },

    650
  );
}


/* ============================================================
   MANUAL VOICE CONTROL FROM TRAY
============================================================ */

async function stopBackgroundVoice() {

  if (
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {
    return;
  }


  try {

    await mainWindow
      .webContents
      .executeJavaScript(
        `
        (async () => {

          if (
            typeof stopLiveVoice ===
              'function'
          ) {

            await stopLiveVoice();

            return true;
          }


          return false;

        })()
        `,
        true
      );


    if (
      tray
    ) {

      tray.setToolTip(
        'NOVA'
      );
    }


    console.log(
      '[VOICE] Live Voice stopped from tray.'
    );


  } catch (
    error
  ) {

    console.error(
      error
    );
  }
}


async function startBackgroundVoice() {

  if (
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {
    return;
  }


  try {

    await mainWindow
      .webContents
      .executeJavaScript(
        `
        (async () => {

          if (
            typeof startLiveVoice ===
              'function'
          ) {

            await startLiveVoice();

            return true;
          }


          return false;

        })()
        `,
        true
      );


    if (
      tray
    ) {

      tray.setToolTip(
        'NOVA — Live Voice Active'
      );
    }


    console.log(
      '[VOICE] Live Voice started from tray.'
    );


  } catch (
    error
  ) {

    console.error(
      error
    );
  }
}


/* ============================================================
   WINDOW
============================================================ */

function createWindow() {

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

          /*
            Critical for background Live Voice.
          */

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

      if (
        !mainWindow
      ) {
        return;
      }


      mainWindow.show();

      mainWindow.maximize();


      setTimeout(
        () => {

          startLiveSessionInRenderer();

        },

        AUTO_START_DELAY_MS
      );
    }
  );


  /*
    If another app simply gains focus,
    NOVA stays running normally.

    No stop occurs on "blur".
  */


  mainWindow.on(
    'minimize',

    () => {

      enterBackgroundMode();
    }
  );


  mainWindow.on(
    'restore',

    () => {

      returnToForeground();
    }
  );


  mainWindow.on(
    'hide',

    () => {

      enterBackgroundMode();
    }
  );


  mainWindow.on(
    'show',

    () => {

      returnToForeground();
    }
  );


  mainWindow.on(
    'close',

    event => {

      if (
        !quitting &&
        trayEnabled
      ) {

        event.preventDefault();

        /*
          Voice continues.
          Camera pauses.
        */

        enterBackgroundMode();

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


/* ============================================================
   MEDIA PERMISSIONS
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


  const iconCandidates =
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
    of iconCandidates
  ) {

    if (
      fs.existsSync(
        candidate
      )
    ) {

      icon =
        nativeImage
          .createFromPath(
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
            () => {

              if (
                !mainWindow
              ) {

                createWindow();
              }


              mainWindow.show();

              mainWindow.focus();
            }
        },

        {
          type:
            'separator'
        },

        {
          label:
            'Start Live Voice',

          click:
            () => {

              startBackgroundVoice();
            }
        },

        {
          label:
            'Stop Live Voice',

          click:
            () => {

              stopBackgroundVoice();
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

  if (
    tray
  ) {

    tray.destroy();

    tray =
      null;
  }
}


/* ============================================================
   MEDIA LIST
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


    } catch (
      error
    ) {

      console.error(
        '[MEDIA]',
        error
      );


      return [];
    }
  }
);


/* ============================================================
   EXTERNAL LINKS
============================================================ */

ipcMain.handle(
  'nova:open-external',

  async (
    event,
    url
  ) => {

    if (
      typeof url !==
        'string'
    ) {

      return false;
    }


    try {

      const parsed =
        new URL(
          url
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
        parsed.toString()
      );


      return true;


    } catch {

      return false;
    }
  }
);


/* ============================================================
   WINDOWS STARTUP
============================================================ */

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


/* ============================================================
   TRAY SETTING
============================================================ */

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


/* ============================================================
   NOTIFICATIONS
============================================================ */

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


    new Notification(
      {
        title,
        body
      }
    ).show();


    return true;
  }
);


/* ============================================================
   FULL STOP FOR APP EXIT
============================================================ */

async function stopEverythingInRenderer() {

  if (
    !mainWindow ||
    mainWindow.isDestroyed()
  ) {
    return;
  }


  try {

    await mainWindow
      .webContents
      .executeJavaScript(
        `
        (async () => {

          try {

            if (
              typeof stopLiveVoice ===
                'function'
            ) {

              await stopLiveVoice();
            }

          } catch {}


          try {

            if (
              typeof stopCamera ===
                'function'
            ) {

              await stopCamera();
            }

          } catch {}


          return true;

        })()
        `,
        true
      );


  } catch {}
}


/* ============================================================
   CHILD PROCESS CLEANUP
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


      console.log(
        '[BOOT] Waiting for backend...'
      );


      const backendReady =
        await waitForPort(
          3000,
          15000
        );


      console.log(
        '[BOOT] Waiting for Whisper...'
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


      createWindow();


      if (
        trayEnabled
      ) {

        createTray();
      }


      app.on(
        'activate',

        () => {

          if (
            BrowserWindow
              .getAllWindows()
              .length ===
            0
          ) {

            createWindow();

          } else if (
            mainWindow
          ) {

            mainWindow.show();

            mainWindow.focus();
          }
        }
      );
    }
  );


/* ============================================================
   QUIT
============================================================ */

app.on(
  'before-quit',

  async () => {

    quitting =
      true;


    await stopEverythingInRenderer();


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