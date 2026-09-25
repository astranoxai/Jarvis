const {
  contextBridge,
  ipcRenderer
} = require('electron');

contextBridge.exposeInMainWorld(
  'novaAPI',
  {
    recognizeSpeech: () =>
      ipcRenderer.invoke(
        'nova:recognize-speech'
      )
  }
);

