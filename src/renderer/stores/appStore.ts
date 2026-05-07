import { create } from 'zustand'

export interface DownloadSource {
  id: string
  name: string
  nameCn: string
  baseUrl: string
  priority: number
  latency: number | null
  available: boolean
}

export interface LocalModel {
  id: string
  name: string
  path: string
  size: number
  sizeFormatted: string
  downloadedAt: string
  source: string
}

export interface DownloadTask {
  id: string
  modelId: string
  source: string
  url: string
  savePath: string
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled'
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

export interface LunaSettings {
  defaultSource: string
  contextSize: number
  threads: number
  gpuLayers: number
  serverPort: number
  modelSavePath: string
  autoStartServer: boolean
  theme: 'dark' | 'light'
}

interface AppState {
  activeTab: 'models' | 'launch' | 'settings'
  sources: DownloadSource[]
  localModels: LocalModel[]
  downloadTasks: Map<string, DownloadTask>
  llamaStatus: LlamaStatus
  llamaLogs: LlamaLog[]
  settings: LunaSettings
  loading: boolean
  error: string | null

  setActiveTab: (tab: 'models' | 'launch' | 'settings') => void
  setSources: (sources: DownloadSource[]) => void
  setLocalModels: (models: LocalModel[]) => void
  addDownloadTask: (task: DownloadTask) => void
  updateDownloadTask: (task: DownloadTask) => void
  removeDownloadTask: (taskId: string) => void
  setLlamaStatus: (status: LlamaStatus) => void
  addLlamaLog: (log: LlamaLog) => void
  clearLlamaLogs: () => void
  setSettings: (settings: LunaSettings) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'models',
  sources: [],
  localModels: [],
  downloadTasks: new Map(),
  llamaStatus: {
    running: false,
    modelPath: null,
    port: null,
    pid: null
  },
  llamaLogs: [],
  settings: {
    defaultSource: 'huggingface',
    contextSize: 4096,
    threads: 8,
    gpuLayers: 99,
    serverPort: 8080,
    modelSavePath: '',
    autoStartServer: false,
    theme: 'dark'
  },
  loading: false,
  error: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSources: (sources) => set({ sources }),
  setLocalModels: (models) => set({ localModels: models }),
  addDownloadTask: (task) => set((state) => {
    const tasks = new Map(state.downloadTasks)
    tasks.set(task.id, task)
    return { downloadTasks: tasks }
  }),
  updateDownloadTask: (task) => set((state) => {
    const tasks = new Map(state.downloadTasks)
    tasks.set(task.id, task)
    return { downloadTasks: tasks }
  }),
  removeDownloadTask: (taskId) => set((state) => {
    const tasks = new Map(state.downloadTasks)
    tasks.delete(taskId)
    return { downloadTasks: tasks }
  }),
  setLlamaStatus: (status) => set({ llamaStatus: status }),
  addLlamaLog: (log) => set((state) => ({
    llamaLogs: [...state.llamaLogs.slice(-999), log]
  })),
  clearLlamaLogs: () => set({ llamaLogs: [] }),
  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}))
