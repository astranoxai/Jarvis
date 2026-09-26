const {
  contextBridge,
  ipcRenderer
} = require('electron');


contextBridge.exposeInMainWorld(
  'novaAPI',
  {
    /* =========================================
       EXISTING NOVA FUNCTIONS
    ========================================= */

    listMedia:
      () =>
        ipcRenderer.invoke(
          'nova:list-media'
        ),

    openExternal:
      url =>
        ipcRenderer.invoke(
          'nova:open-external',
          url
        ),

    getStartup:
      () =>
        ipcRenderer.invoke(
          'nova:get-startup'
        ),

    setStartup:
      enabled =>
        ipcRenderer.invoke(
          'nova:set-startup',
          enabled
        ),

    setTray:
      enabled =>
        ipcRenderer.invoke(
          'nova:set-tray',
          enabled
        ),

    showNotification:
      payload =>
        ipcRenderer.invoke(
          'nova:show-notification',
          payload
        ),


    /* =========================================
       NOVA BROWSER
    ========================================= */

    openBrowser:
      url =>
        ipcRenderer.invoke(
          'nova:open-browser',
          url
        ),

    browserNavigate:
      url =>
        ipcRenderer.invoke(
          'nova:browser-navigate',
          url
        ),

    browserBack:
      () =>
        ipcRenderer.invoke(
          'nova:browser-back'
        ),

    browserForward:
      () =>
        ipcRenderer.invoke(
          'nova:browser-forward'
        ),

    browserReload:
      () =>
        ipcRenderer.invoke(
          'nova:browser-reload'
        ),

    browserHome:
      () =>
        ipcRenderer.invoke(
          'nova:browser-home'
        ),

    onBrowserState:
      callback => {

        ipcRenderer.on(
          'nova:browser-state',

          (
            event,
            state
          ) => {

            callback(
              state
            );
          }
        );
      }
  }
);