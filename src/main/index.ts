import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { downloader, NetworkDetector } from './downloader'
import { llamaManager } from './llama'
import { fileManager } from './fileManager'

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0D1117',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('network:detect', async () => {
  return await NetworkDetector.detectAll()
})

ipcMain.handle('network:select-source', async (_, source: string) => {
  return await NetworkDetector.testSource(source)
})

ipcMain.handle('download:start', async (event, modelId: string, source: string, url: string) => {
  return await downloader.startDownload(modelId, source, url, (progress) => {
    mainWindow?.webContents.send('download:progress', progress)
  })
})

ipcMain.handle('download:pause', async (_, taskId: string) => {
  return await downloader.pauseDownload(taskId)
})

ipcMain.handle('download:resume', async (_, taskId: string) => {
  return await downloader.resumeDownload(taskId)
})

ipcMain.handle('download:cancel', async (_, taskId: string) => {
  return await downloader.cancelDownload(taskId)
})

ipcMain.handle('llama:start', async (_, modelPath: string, params: any) => {
  return await llamaManager.startServer(modelPath, params, (log) => {
    mainWindow?.webContents.send('llama:log', log)
  })
})

ipcMain.handle('llama:stop', async () => {
  return await llamaManager.stopServer()
})

ipcMain.handle('llama:status', async () => {
  return llamaManager.getStatus()
})

ipcMain.handle('file:get-models', async () => {
  return fileManager.getLocalModels()
})

ipcMain.handle('file:delete-model', async (_, modelPath: string) => {
  return fileManager.deleteModel(modelPath)
})

ipcMain.handle('file:get-settings', async () => {
  return fileManager.getSettings()
})

ipcMain.handle('file:save-settings', async (_, settings: any) => {
  return fileManager.saveSettings(settings)
})

ipcMain.handle('file:select-path', async () => {
  return await fileManager.selectModelPath()
})

ipcMain.handle('shell:open-external', async (_, url: string) => {
  await shell.openExternal(url)
})

ipcMain.handle('system:get-info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron
  }
})
