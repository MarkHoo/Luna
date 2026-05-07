import { useState, useEffect } from 'react'
import { useAppStore, DownloadSource, LocalModel } from '../stores/appStore'
import { Download, Trash2, Search, RefreshCw, ExternalLink, Check, AlertCircle, X, Loader2 } from 'lucide-react'
import clsx from 'clsx'

const POPULAR_MODELS = [
  { id: 'llama-3.1-8b', name: 'LLaMA 3.1 8B', size: '4.9GB', description: 'Meta 最新开源模型，小型高效', source: 'huggingface', url: 'https://huggingface.co/bartowski/Llama-3.1-8B-Instruct-GGUF' },
  { id: 'llama-3.2-3b', name: 'LLaMA 3.2 3B', size: '2.0GB', description: '最新小型版本，适合轻量使用', source: 'huggingface', url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF' },
  { id: 'qwen-2.5-7b', name: 'Qwen 2.5 7B', size: '4.4GB', description: '阿里通义千问，中文表现优秀', source: 'modelscope', url: 'https://modelscope.cn/Qwen/Qwen2.5-7B-Instruct-GGUF' },
  { id: 'qwen-2.5-3b', name: 'Qwen 2.5 3B', size: '2.0GB', description: '轻量版千问，资源友好', source: 'modelscope', url: 'https://modelscope.cn/Qwen/Qwen2.5-3B-Instruct-GGUF' },
  { id: 'phi-3.5-3b', name: 'Phi-3.5 3B', size: '2.3GB', description: '微软 Phi 系列，高质量小模型', source: 'huggingface', url: 'https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF' },
  { id: 'gemma-2-2b', name: 'Gemma 2 2B', size: '1.6GB', description: 'Google Gemma 2 最小版本', source: 'huggingface', url: 'https://huggingface.co/bartowski/gemma-2-2b-it-GGUF' },
  { id: 'mistral-7b', name: 'Mistral 7B', size: '4.1GB', description: 'Mistral AI 开源模型', source: 'huggingface', url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF' },
  { id: 'deepseek-7b', name: 'DeepSeek 7B', size: '4.0GB', description: '深度求索开源模型', source: 'huggingface', url: 'https://huggingface.co/TheBloke/deepseek-llm-7b-chat-GGUF' }
]

export default function ModelsPage() {
  const { sources, localModels, downloadTasks, setLocalModels, setSources, addDownloadTask, updateDownloadTask, removeDownloadTask } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedModel, setSelectedModel] = useState<typeof POPULAR_MODELS[0] | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const defaultSource = sources.find(s => s.available && s.id !== 'local')?.id || 'huggingface'
    setSelectedSource(defaultSource)
  }, [sources])

  const handleRefreshSources = async () => {
    setIsRefreshing(true)
    try {
      const newSources = await window.luna.network.detect()
      setSources(newSources)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDownload = async (model: typeof POPULAR_MODELS[0]) => {
    setSelectedModel(model)
    setShowDownloadModal(true)
  }

  const startDownload = async () => {
    if (!selectedModel) return
    setDownloading(true)

    const url = selectedModel.url
    try {
      const taskId = await window.luna.download.start(
        selectedModel.id,
        selectedModel.source,
        url
      )

      addDownloadTask({
        id: taskId,
        modelId: selectedModel.id,
        source: selectedModel.source,
        url,
        savePath: '',
        status: 'downloading',
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
        speed: 0
      })

      setShowDownloadModal(false)
      setSelectedModel(null)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setDownloading(false)
    }
  }

  const handleDeleteModel = async (model: LocalModel) => {
    if (confirm(`确定要删除模型 "${model.name}" 吗？`)) {
      await window.luna.file.deleteModel(model.path)
      setLocalModels(localModels.filter(m => m.id !== model.id))
    }
  }

  const filteredModels = POPULAR_MODELS.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getActiveTaskForModel = (modelId: string) => {
    for (const task of downloadTasks.values()) {
      if (task.modelId === modelId) {
        return task
      }
    }
    return null
  }

  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
    return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-luna-text">模型管理</h1>
          <p className="text-sm text-luna-text-secondary mt-1">下载和管理您的 GGUF 模型</p>
        </div>
        <button
          onClick={handleRefreshSources}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-luna-bg-card hover:bg-luna-border rounded-lg transition-colors text-sm"
        >
          <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
          刷新源
        </button>
      </div>

      {/* 下载源状态 */}
      <div className="bg-luna-bg-card rounded-xl p-4">
        <h2 className="text-sm font-medium text-luna-text mb-3">可用下载源</h2>
        <div className="flex flex-wrap gap-3">
          {sources.map((source) => (
            <div
              key={source.id}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                source.available
                  ? 'border-luna-success/30 bg-luna-success/10'
                  : 'border-luna-border bg-luna-bg-secondary'
              )}
            >
              <div className={clsx(
                'w-2 h-2 rounded-full',
                source.available ? 'bg-luna-success' : 'bg-gray-500'
              )} />
              <span className="text-sm">{source.nameCn || source.name}</span>
              {source.latency !== null && source.latency > 0 && (
                <span className="text-xs text-luna-text-secondary">{source.latency}ms</span>
              )}
              {source.id === selectedSource && source.available && (
                <Check className="w-3 h-3 text-luna-success" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-luna-text-secondary" />
          <input
            type="text"
            placeholder="搜索模型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-luna-bg-card border border-luna-border rounded-lg text-sm focus:outline-none focus:border-luna-primary transition-colors"
          />
        </div>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="px-4 py-2.5 bg-luna-bg-card border border-luna-border rounded-lg text-sm focus:outline-none focus:border-luna-primary"
        >
          {sources.filter(s => s.available && s.id !== 'local').map((source) => (
            <option key={source.id} value={source.id}>
              {source.nameCn || source.name}
            </option>
          ))}
        </select>
      </div>

      {/* 本地模型 */}
      {localModels.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-luna-text mb-3">本地模型</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localModels.map((model) => (
              <div
                key={model.id}
                className="bg-luna-bg-card rounded-xl p-4 border border-luna-border hover:border-luna-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-luna-text">{model.name}</h3>
                    <p className="text-xs text-luna-text-secondary mt-1 font-mono truncate max-w-[200px]">{model.path}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs px-2 py-0.5 bg-luna-success/20 text-luna-success rounded">
                        就绪
                      </span>
                      <span className="text-xs text-luna-text-secondary">{model.sizeFormatted}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteModel(model)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-luna-text-secondary hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 下载任务 */}
      {downloadTasks.size > 0 && (
        <div>
          <h2 className="text-lg font-medium text-luna-text mb-3">下载中</h2>
          <div className="space-y-3">
            {Array.from(downloadTasks.values()).map((task) => (
              <div
                key={task.id}
                className="bg-luna-bg-card rounded-xl p-4 border border-luna-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-luna-text">{task.modelId}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-luna-secondary">{formatSpeed(task.speed)}</span>
                    <button
                      onClick={() => removeDownloadTask(task.id)}
                      className="p-1 hover:bg-red-500/20 rounded text-luna-text-secondary hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-luna-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-luna-primary to-purple-400 transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-luna-text-secondary">
                  <span>{task.progress}%</span>
                  <span>{task.downloadedBytes > 0 ? `${(task.downloadedBytes / 1024 / 1024).toFixed(1)} MB` : '准备中...'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 推荐模型 */}
      <div>
        <h2 className="text-lg font-medium text-luna-text mb-3">推荐模型</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredModels.map((model) => {
            const task = getActiveTaskForModel(model.id)
            const isLocal = localModels.some(m => m.name.includes(model.name))

            return (
              <div
                key={model.id}
                className="bg-luna-bg-card rounded-xl p-4 border border-luna-border hover:border-luna-primary/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-luna-text group-hover:text-luna-primary transition-colors">
                      {model.name}
                    </h3>
                    <p className="text-xs text-luna-text-secondary mt-0.5">{model.size}</p>
                  </div>
                  {isLocal && (
                    <span className="flex items-center gap-1 text-xs text-luna-success bg-luna-success/20 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3" />
                      已下载
                    </span>
                  )}
                </div>
                <p className="text-xs text-luna-text-secondary line-clamp-2 mb-3">{model.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-luna-text-secondary">
                    源: {model.source === 'huggingface' ? 'Hugging Face' : 'ModelScope'}
                  </span>
                  {task ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-luna-bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-luna-secondary transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-luna-secondary">{task.progress}%</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDownload(model)}
                      disabled={isLocal}
                      className={clsx(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                        isLocal
                          ? 'bg-luna-bg-secondary text-luna-text-secondary cursor-not-allowed'
                          : 'bg-luna-primary text-white hover:bg-luna-primary/80'
                      )}
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 下载确认弹窗 */}
      {showDownloadModal && selectedModel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-luna-bg-card rounded-2xl p-6 w-full max-w-md mx-4 border border-luna-border">
            <h2 className="text-xl font-semibold text-luna-text mb-4">确认下载</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-luna-text-secondary">模型</span>
                <span className="text-luna-text">{selectedModel.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-luna-text-secondary">大小</span>
                <span className="text-luna-text">{selectedModel.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-luna-text-secondary">下载源</span>
                <span className="text-luna-text">{sources.find(s => s.id === selectedModel.source)?.nameCn || selectedModel.source}</span>
              </div>
            </div>
            <div className="bg-luna-bg-secondary rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-luna-warning mt-0.5" />
                <p className="text-xs text-luna-text-secondary">
                  下载时间取决于您的网络速度，请确保网络稳定。下载完成后模型将保存在本地。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDownloadModal(false)
                  setSelectedModel(null)
                }}
                className="flex-1 px-4 py-2.5 bg-luna-bg-secondary hover:bg-luna-border rounded-lg transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={startDownload}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-luna-primary hover:bg-luna-primary/80 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    下载中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    开始下载
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
