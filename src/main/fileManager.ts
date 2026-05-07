import fs from 'fs'
import path from 'path'
import { app, dialog } from 'electron'

export interface LocalModel {
  id: string
  name: string
  path: string
  size: number
  sizeFormatted: string
  downloadedAt: string
  source: string
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

const DEFAULT_SETTINGS: LunaSettings = {
  defaultSource: 'huggingface',
  contextSize: 4096,
  threads: 8,
  gpuLayers: 99,
  serverPort: 8080,
  modelSavePath: '',
  autoStartServer: false,
  theme: 'dark'
}

class FileManager {
  private configPath: string
  private modelsConfigPath: string
  private modelsDir: string

  constructor() {
    const userDataPath = app.getPath('userData')
    this.configPath = path.join(userDataPath, 'config.json')
    this.modelsConfigPath = path.join(userDataPath, 'models.json')
    this.modelsDir = path.join(userDataPath, 'models')
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.modelsDir)) {
      fs.mkdirSync(this.modelsDir, { recursive: true })
    }
    if (!fs.existsSync(this.configPath)) {
      this.saveSettings(DEFAULT_SETTINGS)
    }
    if (!fs.existsSync(this.modelsConfigPath)) {
      fs.writeFileSync(this.modelsConfigPath, JSON.stringify({ models: [] }, null, 2))
    }
  }

  getLocalModels(): LocalModel[] {
    try {
      if (!fs.existsSync(this.modelsConfigPath)) {
        return []
      }
      const data = JSON.parse(fs.readFileSync(this.modelsConfigPath, 'utf-8'))
      return data.models || []
    } catch {
      return []
    }
  }

  saveLocalModel(model: Omit<LocalModel, 'id'>): LocalModel {
    const models = this.getLocalModels()
    const newModel: LocalModel = {
      ...model,
      id: `model_${Date.now()}`
    }
    models.push(newModel)
    fs.writeFileSync(this.modelsConfigPath, JSON.stringify({ models }, null, 2))
    return newModel
  }

  removeLocalModel(modelId: string): boolean {
    const models = this.getLocalModels()
    const index = models.findIndex(m => m.id === modelId)
    if (index !== -1) {
      models.splice(index, 1)
      fs.writeFileSync(this.modelsConfigPath, JSON.stringify({ models }, null, 2))
      return true
    }
    return false
  }

  async deleteModel(modelPath: string): Promise<boolean> {
    try {
      if (fs.existsSync(modelPath)) {
        fs.unlinkSync(modelPath)
      }
      const models = this.getLocalModels()
      const updated = models.filter(m => m.path !== modelPath)
      fs.writeFileSync(this.modelsConfigPath, JSON.stringify({ models: updated }, null, 2))
      return true
    } catch (error) {
      console.error('Failed to delete model:', error)
      return false
    }
  }

  getSettings(): LunaSettings {
    try {
      if (!fs.existsSync(this.configPath)) {
        return DEFAULT_SETTINGS
      }
      const data = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
      return { ...DEFAULT_SETTINGS, ...data }
    } catch {
      return DEFAULT_SETTINGS
    }
  }

  saveSettings(settings: Partial<LunaSettings>): boolean {
    try {
      const current = this.getSettings()
      const updated = { ...current, ...settings }
      fs.writeFileSync(this.configPath, JSON.stringify(updated, null, 2))
      return true
    } catch (error) {
      console.error('Failed to save settings:', error)
      return false
    }
  }

  async selectModelPath(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'GGUF Models', extensions: ['gguf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  }

  getModelsDirectory(): string {
    return this.modelsDir
  }

  getAvailableDiskSpace(): number {
    const stat = fs.statfsSync(this.modelsDir)
    return stat.bsize * stat.bfree
  }

  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }
}

export const fileManager = new FileManager()
