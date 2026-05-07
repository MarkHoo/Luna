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
  type: 'info' | 'error' | 'warning' | 'success'
  message: string
  timestamp: string
}

export interface LlamaStatus {
  running: boolean
  modelPath: string | null
  port: number | null
  pid: number | null
}

export interface LunaAPI {
  network: {
    detect: () => Promise<any[]>
    selectSource: (source: string) => Promise<any>
  }
  download: {
    start: (modelId: string, source: string, url: string) => Promise<string>
    pause: (taskId: string) => Promise<boolean>
    resume: (taskId: string) => Promise<boolean>
    cancel: (taskId: string) => Promise<boolean>
    onProgress: (callback: (progress: DownloadProgress) => void) => () => void
  }
  llama: {
    start: (modelPath: string, params: any) => Promise<boolean>
    stop: () => Promise<boolean>
    status: () => Promise<LlamaStatus>
    onLog: (callback: (log: LlamaLog) => void) => () => void
  }
  file: {
    getModels: () => Promise<any[]>
    deleteModel: (modelPath: string) => Promise<boolean>
    getSettings: () => Promise<any>
    saveSettings: (settings: any) => Promise<boolean>
    selectPath: () => Promise<string | null>
  }
  shell: {
    openExternal: (url: string) => Promise<void>
  }
  system: {
    getInfo: () => Promise<any>
  }
}

declare global {
  interface Window {
    luna: LunaAPI
  }
}

export {}
