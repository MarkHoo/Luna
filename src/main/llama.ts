import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { app } from 'electron'

export interface LlamaParams {
  contextSize: number
  threads: number
  gpuLayers: number
  port: number
  modelPath: string
}

export interface LlamaStatus {
  running: boolean
  modelPath: string | null
  port: number | null
  pid: number | null
}

export interface LlamaLog {
  type: 'info' | 'error' | 'warning'
  message: string
  timestamp: string
}

class LlamaManager {
  private process: ChildProcess | null = null
  private status: LlamaStatus = {
    running: false,
    modelPath: null,
    port: null,
    pid: null
  }
  private logBuffer: LlamaLog[] = []
  private llamaBinaryPath: string | null = null

  constructor() {
    this.findLlamaBinary()
  }

  private findLlamaBinary() {
    const possiblePaths = [
      path.join(app.getPath('userData'), 'llama', 'llama-server'),
      path.join(app.getPath('userData'), 'llama', 'llama-server.exe'),
      '/usr/local/bin/llama-server',
      '/usr/bin/llama-server',
      'llama-server',
      'llama-server.exe'
    ]

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.llamaBinaryPath = p
        return
      }
    }

    this.llamaBinaryPath = 'llama-server'
  }

  async startServer(
    modelPath: string,
    params: Partial<LlamaParams>,
    onLog: (log: LlamaLog) => void
  ): Promise<boolean> {
    if (this.status.running) {
      this.addLog('warning', 'Server is already running', onLog)
      return false
    }

    if (!fs.existsSync(modelPath)) {
      this.addLog('error', `Model file not found: ${modelPath}`, onLog)
      return false
    }

    const port = params.port || 8080
    const contextSize = params.contextSize || 4096
    const threads = params.threads || os.cpus().length
    const gpuLayers = params.gpuLayers || 99

    const args = [
      '-m', modelPath,
      '-c', String(contextSize),
      '-t', String(threads),
      '-ngl', String(gpuLayers),
      '--port', String(port),
      '--host', '0.0.0.0'
    ]

    this.addLog('info', `Starting llama-server: ${this.llamaBinaryPath} ${args.join(' ')}`, onLog)

    try {
      this.process = spawn(this.llamaBinaryPath!, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      })

      this.status = {
        running: true,
        modelPath,
        port,
        pid: this.process.pid || null
      }

      this.process.stdout?.on('data', (data: Buffer) => {
        const message = data.toString().trim()
        if (message) {
          this.addLog('info', message, onLog)
        }
      })

      this.process.stderr?.on('data', (data: Buffer) => {
        const message = data.toString().trim()
        if (message) {
          this.addLog('error', message, onLog)
        }
      })

      this.process.on('exit', (code) => {
        this.addLog('info', `Server exited with code ${code}`, onLog)
        this.status.running = false
        this.status.pid = null
      })

      this.process.on('error', (err) => {
        this.addLog('error', `Server error: ${err.message}`, onLog)
        this.status.running = false
      })

      this.addLog('info', `Server started successfully on port ${port}`, onLog)
      return true
    } catch (error: any) {
      this.addLog('error', `Failed to start server: ${error.message}`, onLog)
      return false
    }
  }

  async stopServer(): Promise<boolean> {
    if (!this.process) {
      return false
    }

    return new Promise((resolve) => {
      this.process!.once('exit', () => {
        resolve(true)
      })

      this.process!.kill('SIGTERM')

      setTimeout(() => {
        if (this.status.running) {
          this.process?.kill('SIGKILL')
          resolve(true)
        }
      }, 3000)
    }).then(() => {
      this.status = {
        running: false,
        modelPath: null,
        port: null,
        pid: null
      }
      return true
    })
  }

  getStatus(): LlamaStatus {
    return { ...this.status }
  }

  getLogBuffer(): LlamaLog[] {
    return [...this.logBuffer]
  }

  clearLogBuffer(): void {
    this.logBuffer = []
  }

  private addLog(type: 'info' | 'error' | 'warning', message: string, callback?: (log: LlamaLog) => void): void {
    const log: LlamaLog = {
      type,
      message,
      timestamp: new Date().toISOString()
    }
    this.logBuffer.push(log)
    if (this.logBuffer.length > 1000) {
      this.logBuffer.shift()
    }
    if (callback) {
      callback(log)
    }
  }
}

export const llamaManager = new LlamaManager()
