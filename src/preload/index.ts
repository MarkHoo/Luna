import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface DownloadProgress {
  id: string
  modelId: string
  source: string
  url: string
  savePath: string
  status: string
  progress: number
  downloadedBytes: number
  totalBytes: number
  speed: number
  error?: string
}

export interface LlamaLog {
  type: 'info' | 'error' | 'warning'
  message: string
  timestamp: string
}

const api = {
  network: {
    detect: () => ipcRenderer.invoke('network:detect'),
    selectSource: (source: string) => ipcRenderer.invoke('network:select-source', source)
  },
  download: {
    start: (modelId: string, source: string, url: string) =>
      ipcRenderer.invoke('download:start', modelId, source, url),
    pause: (taskId: string) => ipcRenderer.invoke('download:pause', taskId),
    resume: (taskId: string) => ipcRenderer.invoke('download:resume', taskId),
    cancel: (taskId: string) => ipcRenderer.invoke('download:cancel', taskId),
    onProgress: (callback: (progress: DownloadProgress) => void) => {
      const handler = (_: IpcRendererEvent, progress: DownloadProgress) => callback(progress)
      ipcRenderer.on('download:progress', handler)
      return () => ipcRenderer.removeListener('download:progress', handler)
    }
  },
  llama: {
    start: (modelPath: string, params: any) =>
      ipcRenderer.invoke('llama:start', modelPath, params),
    stop: () => ipcRenderer.invoke('llama:stop'),
    status: () => ipcRenderer.invoke('llama:status'),
    onLog: (callback: (log: LlamaLog) => void) => {
      const handler = (_: IpcRendererEvent, log: LlamaLog) => callback(log)
      ipcRenderer.on('llama:log', handler)
      return () => ipcRenderer.removeListener('llama:log', handler)
    }
  },
  file: {
    getModels: () => ipcRenderer.invoke('file:get-models'),
    deleteModel: (modelPath: string) => ipcRenderer.invoke('file:delete-model', modelPath),
    getSettings: () => ipcRenderer.invoke('file:get-settings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('file:save-settings', settings),
    selectPath: () => ipcRenderer.invoke('file:select-path')
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url)
  },
  system: {
    getInfo: () => ipcRenderer.invoke('system:get-info')
  }
}

contextBridge.exposeInMainWorld('luna', api)

declare global {
  interface Window {
    luna: typeof api
  }
}
