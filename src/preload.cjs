const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    search: (query) => ipcRenderer.invoke('search-movie', query),
    play: (item) => ipcRenderer.invoke('play-item', item),
    onStatus: (callback) => ipcRenderer.on('status-update', (event, msg) => callback(msg))
});