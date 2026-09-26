const {
  contextBridge,
  ipcRenderer
} = require('electron');

contextBridge.exposeInMainWorld(
  'novaAPI',
  {
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

    setStartup:
      enabled =>
        ipcRenderer.invoke(
          'nova:set-startup',
          enabled
        ),

    getStartup:
      () =>
        ipcRenderer.invoke(
          'nova:get-startup'
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

    recognizeSpeech:
      () =>
        ipcRenderer.invoke(
          'nova:recognize-speech'
        )
  }
);