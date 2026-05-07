import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'

export interface DownloadSource {
  id: string
  name: string
  nameCn: string
  baseUrl: string
  priority: number
  latency: number | null
  available: boolean
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

class NetworkDetector {
  private static sources: DownloadSource[] = [
    { id: 'huggingface', name: 'Hugging Face', nameCn: 'Hugging Face', baseUrl: 'https://huggingface.co', priority: 1, latency: null, available: false },
    { id: 'modelscope', name: 'ModelScope', nameCn: '魔搭社区', baseUrl: 'https://modelscope.cn', priority: 2, latency: null, available: false },
    { id: 'aicolle', name: 'AI Colle', nameCn: 'AI收藏家', baseUrl: 'https://www.aicolle.com', priority: 3, latency: null, available: false },
    { id: 'local', name: 'Local', nameCn: '本地文件', baseUrl: '', priority: 4, latency: null, available: true }
  ]

  static async detectAll(): Promise<DownloadSource[]> {
    const results = await Promise.all(
      this.sources.map(async (source) => {
        if (source.id === 'local') {
          return { ...source, available: true, latency: 0 }
        }
        try {
          const start = Date.now()
          await axios.head(source.baseUrl, { timeout: 5000 })
          const latency = Date.now() - start
          return { ...source, latency, available: true }
        } catch {
          return { ...source, latency: null, available: false }
        }
      })
    )

    return results.sort((a, b) => {
      if (!a.available && !b.available) return a.priority - b.priority
      if (!a.available) return 1
      if (!b.available) return -1
      return (a.latency || 9999) - (b.latency || 9999)
    })
  }

  static async testSource(sourceId: string): Promise<{ latency: number; available: boolean }> {
    const source = this.sources.find(s => s.id === sourceId)
    if (!source || sourceId === 'local') {
      return { latency: 0, available: true }
    }

    try {
      const start = Date.now()
      await axios.head(source.baseUrl, { timeout: 5000 })
      return { latency: Date.now() - start, available: true }
    } catch {
      return { latency: -1, available: false }
    }
  }

  static getSourceById(id: string): DownloadSource | undefined {
    return this.sources.find(s => s.id === id)
  }

  static getDefaultSource(sources: DownloadSource[]): string {
    const available = sources.find(s => s.available && s.id !== 'local')
    return available?.id || 'local'
  }
}

class DownloadManager {
  private tasks: Map<string, DownloadTask> = new Map()
  private activeDownloads: Map<string, { abort: () => void }> = new Map()
  private modelsDir: string

  constructor() {
    this.modelsDir = path.join(app.getPath('userData'), 'models')
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true })
    }
  }

  async startDownload(
    modelId: string,
    source: string,
    url: string,
    onProgress: (progress: DownloadTask) => void
  ): Promise<string> {
    const taskId = uuidv4()
    const fileName = url.split('/').pop() || `${modelId}.gguf`
    const savePath = path.join(this.modelsDir, fileName)

    const task: DownloadTask = {
      id: taskId,
      modelId,
      source,
      url,
      savePath,
      status: 'downloading',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      speed: 0
    }

    this.tasks.set(taskId, task)
    onProgress(task)

    try {
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Luna/1.0'
        }
      })

      const totalBytes = parseInt(response.headers['content-length'] || '0', 10)
      task.totalBytes = totalBytes

      const writer = fs.createWriteStream(savePath)
      let downloadedBytes = 0
      let lastTime = Date.now()
      let lastBytes = 0

      const controller = new AbortController()
      this.activeDownloads.set(taskId, { abort: () => controller.abort() })

      response.data.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length
        const now = Date.now()
        const timeDiff = (now - lastTime) / 1000
        if (timeDiff >= 1) {
          task.speed = (downloadedBytes - lastBytes) / timeDiff
          lastBytes = downloadedBytes
          lastTime = now
        }
        task.downloadedBytes = downloadedBytes
        task.progress = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0
        onProgress({ ...task })
      })

      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on('finish', () => {
          task.status = 'completed'
          task.progress = 100
          onProgress({ ...task })
          resolve(null)
        })
        writer.on('error', (err) => {
          task.status = 'failed'
          task.error = err.message
          onProgress({ ...task })
          reject(err)
        })
        response.data.on('error', (err: Error) => {
          task.status = 'failed'
          task.error = err.message
          onProgress({ ...task })
          reject(err)
        })
      })
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        task.status = 'failed'
        task.error = error.message
        onProgress({ ...task })
      }
    } finally {
      this.activeDownloads.delete(taskId)
    }

    return taskId
  }

  async pauseDownload(taskId: string): Promise<boolean> {
    const download = this.activeDownloads.get(taskId)
    if (download) {
      download.abort()
      const task = this.tasks.get(taskId)
      if (task) {
        task.status = 'paused'
      }
      return true
    }
    return false
  }

  async resumeDownload(taskId: string): Promise<boolean> {
    return false
  }

  async cancelDownload(taskId: string): Promise<boolean> {
    const download = this.activeDownloads.get(taskId)
    if (download) {
      download.abort()
    }
    const task = this.tasks.get(taskId)
    if (task) {
      task.status = 'cancelled'
      if (fs.existsSync(task.savePath)) {
        fs.unlinkSync(task.savePath)
      }
    }
    this.tasks.delete(taskId)
    return true
  }

  getTask(taskId: string): DownloadTask | undefined {
    return this.tasks.get(taskId)
  }

  getModelsDir(): string {
    return this.modelsDir
  }
}

export { NetworkDetector }
export const downloader = new DownloadManager()
