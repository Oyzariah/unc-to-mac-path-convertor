const { contextBridge, ipcRenderer } = require('electron');

// This matches the "window.electronAPI.openPath" we wrote in script.js
contextBridge.exposeInMainWorld('electronAPI', {
    openPath: (path, type) => ipcRenderer.send('open-path', path)
});