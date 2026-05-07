"use strict";
const electron = require("electron");
const api = {
  network: {
    detect: () => electron.ipcRenderer.invoke("network:detect"),
    selectSource: (source) => electron.ipcRenderer.invoke("network:select-source", source)
  },
  download: {
    start: (modelId, source, url) => electron.ipcRenderer.invoke("download:start", modelId, source, url),
    pause: (taskId) => electron.ipcRenderer.invoke("download:pause", taskId),
    resume: (taskId) => electron.ipcRenderer.invoke("download:resume", taskId),
    cancel: (taskId) => electron.ipcRenderer.invoke("download:cancel", taskId),
    onProgress: (callback) => {
      const handler = (_, progress) => callback(progress);
      electron.ipcRenderer.on("download:progress", handler);
      return () => electron.ipcRenderer.removeListener("download:progress", handler);
    }
  },
  llama: {
    start: (modelPath, params) => electron.ipcRenderer.invoke("llama:start", modelPath, params),
    stop: () => electron.ipcRenderer.invoke("llama:stop"),
    status: () => electron.ipcRenderer.invoke("llama:status"),
    onLog: (callback) => {
      const handler = (_, log) => callback(log);
      electron.ipcRenderer.on("llama:log", handler);
      return () => electron.ipcRenderer.removeListener("llama:log", handler);
    }
  },
  file: {
    getModels: () => electron.ipcRenderer.invoke("file:get-models"),
    deleteModel: (modelPath) => electron.ipcRenderer.invoke("file:delete-model", modelPath),
    getSettings: () => electron.ipcRenderer.invoke("file:get-settings"),
    saveSettings: (settings) => electron.ipcRenderer.invoke("file:save-settings", settings),
    selectPath: () => electron.ipcRenderer.invoke("file:select-path")
  },
  shell: {
    openExternal: (url) => electron.ipcRenderer.invoke("shell:open-external", url)
  },
  system: {
    getInfo: () => electron.ipcRenderer.invoke("system:get-info")
  }
};
electron.contextBridge.exposeInMainWorld("luna", api);
