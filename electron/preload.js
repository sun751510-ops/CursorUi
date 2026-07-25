const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cway', {
  mode: 'desktop',
  getBootstrap: () => ipcRenderer.invoke('cway:getBootstrap'),
  getCommands: () => ipcRenderer.invoke('cway:getCommands'),
  runCommand: (id, args) => ipcRenderer.invoke('cway:runCommand', { id, args }),
  addCommand: (payload) => ipcRenderer.invoke('cway:addCommand', payload),
  removeCommand: (id) => ipcRenderer.invoke('cway:removeCommand', id),
  saveSettings: (partial) => ipcRenderer.invoke('cway:saveSettings', partial),
  saveHistory: (history) => ipcRenderer.invoke('cway:saveHistory', history),
  chat: (payload) => ipcRenderer.invoke('cway:chat', payload),
  listModels: (payload) => ipcRenderer.invoke('cway:listModels', payload || {}),
  testCursor: () => ipcRenderer.invoke('cway:testCursor'),
  onStatus: (handler) => {
    const listener = (_e, text) => handler(text);
    ipcRenderer.on('cway:status', listener);
    return () => ipcRenderer.removeListener('cway:status', listener);
  }
});
