import { useState, useEffect, useRef } from 'react'
import { useAppStore, LocalModel } from '../stores/appStore'
import { Rocket, Square, ExternalLink, Trash2, Settings, Terminal, AlertCircle, CheckCircle, XCircle, FolderOpen } from 'lucide-react'
import clsx from 'clsx'

export default function LaunchPage() {
  const { localModels, llamaStatus, llamaLogs, setLlamaStatus, addLlamaLog, clearLlamaLogs, setLocalModels, settings } = useAppStore()
  const [selectedModel, setSelectedModel] = useState<LocalModel | null>(null)
  const [starting, setStarting] = useState(false)
  const [serverUrl, setServerUrl] = useState('')
  const [customPath, setCustomPath] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [launchParams, setLaunchParams] = useState({
    contextSize: settings.contextSize || 4096,
    threads: settings.threads || 8,
    gpuLayers: settings.gpuLayers || 99,
    port: settings.serverPort || 8080
  })
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (llamaStatus.running) {
      setServerUrl(`http://localhost:${llamaStatus.port}`)
    }
  }, [llamaStatus])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [llamaLogs])

  const handleSelectLocalFile = async () => {
    const path = await window.luna.file.selectPath()
    if (path) {
      setCustomPath(path)
    }
  }

  const handleStart = async () => {
    if (!selectedModel && !customPath) return

    setStarting(true)
    clearLlamaLogs()

    try {
      addLlamaLog({
        type: 'info',
        message: '正在启动 llama-server...',
        timestamp: new Date().toISOString()
      })

      const modelPath = customPath || selectedModel?.path
      if (!modelPath) return

      const success = await window.luna.llama.start(modelPath, launchParams)

      if (success) {
        const status = await window.luna.llama.status()
        setLlamaStatus(status)
        setServerUrl(`http://localhost:${status.port}`)
        addLlamaLog({
          type: 'success',
          message: '服务器启动成功！',
          timestamp: new Date().toISOString()
        })
      }
    } catch (error: any) {
      addLlamaLog({
        type: 'error',
        message: `启动失败: ${error.message}`,
        timestamp: new Date().toISOString()
      })
    } finally {
      setStarting(false)
    }
  }

  const handleStop = async () => {
    addLlamaLog({
      type: 'info',
      message: '正在停止服务器...',
      timestamp: new Date().toISOString()
    })

    await window.luna.llama.stop()
    setLlamaStatus({
      running: false,
      modelPath: null,
      port: null,
      pid: null
    })
    setServerUrl('')
  }

  const handleOpenBrowser = () => {
    if (serverUrl) {
      window.luna.shell.openExternal(serverUrl)
    }
  }

  const handleDeleteModel = async (model: LocalModel) => {
    if (confirm(`确定要删除模型 "${model.name}" 吗？`)) {
      await window.luna.file.deleteModel(model.path)
      setLocalModels(localModels.filter(m => m.id !== model.id))
      if (selectedModel?.id === model.id) {
        setSelectedModel(null)
      }
    }
  }

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-luna-success" />
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-luna-error" />
      default:
        return <Terminal className="w-3.5 h-3.5 text-luna-text-secondary" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-luna-text">启动推理服务</h1>
        <p className="text-sm text-luna-text-secondary mt-1">运行 llama-server 并启动 WebUI</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <div className="space-y-4">
          <div className="bg-luna-bg-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-luna-text">选择模型</h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  showSettings ? 'bg-luna-primary/20 text-luna-primary' : 'hover:bg-luna-bg-secondary text-luna-text-secondary'
                )}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {showSettings && (
              <div className="mb-4 p-3 bg-luna-bg-secondary rounded-lg space-y-3">
                <div>
                  <label className="text-xs text-luna-text-secondary block mb-1">上下文大小</label>
                  <input
                    type="number"
                    value={launchParams.contextSize}
                    onChange={(e) => setLaunchParams({ ...launchParams, contextSize: parseInt(e.target.value) || 4096 })}
                    className="w-full px-3 py-1.5 bg-luna-bg-card border border-luna-border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-luna-text-secondary block mb-1">线程数</label>
                  <input
                    type="number"
                    value={launchParams.threads}
                    onChange={(e) => setLaunchParams({ ...launchParams, threads: parseInt(e.target.value) || 8 })}
                    className="w-full px-3 py-1.5 bg-luna-bg-card border border-luna-border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-luna-text-secondary block mb-1">GPU 层数 (0=只用CPU)</label>
                  <input
                    type="number"
                    value={launchParams.gpuLayers}
                    onChange={(e) => setLaunchParams({ ...launchParams, gpuLayers: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 bg-luna-bg-card border border-luna-border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-luna-text-secondary block mb-1">端口</label>
                  <input
                    type="number"
                    value={launchParams.port}
                    onChange={(e) => setLaunchParams({ ...launchParams, port: parseInt(e.target.value) || 8080 })}
                    className="w-full px-3 py-1.5 bg-luna-bg-card border border-luna-border rounded text-sm"
                  />
                </div>
              </div>
            )}

            {localModels.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {localModels.map((model) => (
                  <div
                    key={model.id}
                    className={clsx(
                      'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
                      selectedModel?.id === model.id
                        ? 'border-luna-primary bg-luna-primary/10'
                        : 'border-luna-border hover:border-luna-primary/50'
                    )}
                    onClick={() => {
                      setSelectedModel(model)
                      setCustomPath('')
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-luna-text truncate">{model.name}</div>
                      <div className="text-xs text-luna-text-secondary">{model.sizeFormatted}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteModel(model)
                      }}
                      className="p-1.5 hover:bg-red-500/20 rounded text-luna-text-secondary hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-luna-text-secondary">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无本地模型</p>
                <p className="text-xs mt-1">请先下载模型</p>
              </div>
            )}
          </div>

          <div className="bg-luna-bg-card rounded-xl p-4">
            <h2 className="text-sm font-medium text-luna-text mb-3">或使用自定义路径</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入模型文件路径..."
                value={customPath}
                onChange={(e) => {
                  setCustomPath(e.target.value)
                  setSelectedModel(null)
                }}
                className="flex-1 px-3 py-2 bg-luna-bg-secondary border border-luna-border rounded-lg text-sm"
              />
              <button
                onClick={handleSelectLocalFile}
                className="px-3 py-2 bg-luna-bg-secondary hover:bg-luna-border border border-luna-border rounded-lg transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-luna-text-secondary" />
              </button>
            </div>
          </div>

          {!llamaStatus.running ? (
            <button
              onClick={handleStart}
              disabled={(!selectedModel && !customPath) || starting}
              className={clsx(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all',
                (!selectedModel && !customPath) || starting
                  ? 'bg-luna-bg-secondary text-luna-text-secondary cursor-not-allowed'
                  : 'bg-gradient-to-r from-luna-primary to-purple-600 text-white hover:shadow-lg hover:shadow-luna-primary/30'
              )}
            >
              {starting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  启动中...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5" />
                  启动服务
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-medium transition-colors"
            >
              <Square className="w-5 h-5" />
              停止服务
            </button>
          )}

          {llamaStatus.running && serverUrl && (
            <div className="bg-luna-success/10 border border-luna-success/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-luna-success rounded-full animate-pulse" />
                  <span className="text-sm text-luna-success font-medium">服务运行中</span>
                </div>
                <button
                  onClick={handleOpenBrowser}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-luna-success/20 hover:bg-luna-success/30 text-luna-success rounded-lg text-sm transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  打开浏览器
                </button>
              </div>
              <div className="mt-2 font-mono text-xs text-luna-text-secondary">{serverUrl}</div>
            </div>
          )}
        </div>

        <div className="bg-luna-bg-card rounded-xl p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-luna-text">运行日志</h2>
            {llamaLogs.length > 0 && (
              <button
                onClick={clearLlamaLogs}
                className="text-xs text-luna-text-secondary hover:text-luna-text transition-colors"
              >
                清空
              </button>
            )}
          </div>
          <div className="flex-1 bg-luna-bg-secondary rounded-lg p-3 overflow-y-auto font-mono text-xs">
            {llamaLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-luna-text-secondary/50">
                <div className="text-center">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>暂无日志输出</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {llamaLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 py-0.5">
                    <span className="text-luna-text-secondary/50 flex-shrink-0">{formatTime(log.timestamp)}</span>
                    {getLogIcon(log.type)}
                    <span className={clsx(
                      log.type === 'error' && 'text-luna-error',
                      log.type === 'success' && 'text-luna-success',
                      log.type === 'warning' && 'text-luna-warning',
                      log.type === 'info' && 'text-luna-text'
                    )}>
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
