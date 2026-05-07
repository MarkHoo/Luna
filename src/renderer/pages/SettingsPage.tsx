import { useState, useEffect } from 'react'
import { useAppStore, LunaSettings } from '../stores/appStore'
import { Save, RotateCcw, ExternalLink, Globe, Cpu, HardDrive, Info } from 'lucide-react'

export default function SettingsPage() {
  const { settings, setSettings, sources } = useAppStore()
  const [localSettings, setLocalSettings] = useState<LunaSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [systemInfo, setSystemInfo] = useState<any>(null)

  useEffect(() => {
    setLocalSettings(settings)
    window.luna.system.getInfo().then(setSystemInfo)
  }, [settings])

  const handleSave = async () => {
    await window.luna.file.saveSettings(localSettings)
    setSettings(localSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setLocalSettings({
      defaultSource: 'huggingface',
      contextSize: 4096,
      threads: 8,
      gpuLayers: 99,
      serverPort: 8080,
      modelSavePath: '',
      autoStartServer: false,
      theme: 'dark'
    })
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-luna-text">设置</h1>
        <p className="text-sm text-luna-text-secondary mt-1">配置 Luna 的运行参数</p>
      </div>

      {/* 下载设置 */}
      <div className="bg-luna-bg-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-luna-primary" />
          <h2 className="text-sm font-medium text-luna-text">下载设置</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-luna-text-secondary mb-2">默认下载源</label>
            <select
              value={localSettings.defaultSource}
              onChange={(e) => setLocalSettings({ ...localSettings, defaultSource: e.target.value })}
              className="w-full px-3 py-2 bg-luna-bg-secondary border border-luna-border rounded-lg text-sm focus:outline-none focus:border-luna-primary"
            >
              {sources.filter(s => s.available && s.id !== 'local').map((source) => (
                <option key={source.id} value={source.id}>
                  {source.nameCn || source.name} {source.latency ? `(${source.latency}ms)` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-luna-text-secondary mt-1">系统会自动检测最快的源</p>
          </div>

          <div>
            <label className="block text-sm text-luna-text-secondary mb-2">模型保存路径</label>
            <input
              type="text"
              value={localSettings.modelSavePath}
              onChange={(e) => setLocalSettings({ ...localSettings, modelSavePath: e.target.value })}
              placeholder="留空使用默认路径"
              className="w-full px-3 py-2 bg-luna-bg-secondary border border-luna-border rounded-lg text-sm focus:outline-none focus:border-luna-primary"
            />
          </div>
        </div>
      </div>

      {/* 推理设置 */}
      <div className="bg-luna-bg-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-luna-secondary" />
          <h2 className="text-sm font-medium text-luna-text">推理设置</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-luna-text-secondary mb-2">上下文大小</label>
            <input
              type="number"
              value={localSettings.contextSize}
              onChange={(e) => setLocalSettings({ ...localSettings, contextSize: parseInt(e.target.value) || 4096 })}
              className="w-full px-3 py-2 bg-luna-bg-secondary border border-luna-border rounded-lg text-sm focus:outline-none focus:border-luna-primary"
            />
            <p className="text-xs text-luna-text-secondary mt-1">越大越耗内存</p>
          </div>
          <div>
            <label className="block text-sm text-luna-text-secondary mb-2">线程数</label>
            <input
              type="number"
              value={localSettings.threads}
              onChange={(e) => setLocalSettings({ ...localSettings, threads: parseInt(e.target.value) || 8 })}
              className="w-full px-3 py-2 bg-luna-bg-secondary border border-luna-border rounded-lg text-sm focus:outline-none focus:border-luna-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-luna-text-secondary mb-2">GPU 层数</label>
            <input
              type="number"
              value={localSettings.gpuLayers}
              onChange={(e) => setLocalSettings({ ...localSettings, gpuLayers: parseInt(e.target.value) || 99 })}
              className="w-full px-3 py-2 bg-luna-bg-secondary border border-luna-border rounded-lg text-sm focus:outline-none focus:border-luna-primary"
            />
            <p className="text-xs text-luna-text-secondary mt-1">99 表示使用全部 GPU 层</p>
          </div>
          <div>
            <label className="block text-sm text-luna-text-secondary mb-2">服务端口</label>
            <input
              type="number"
              value={localSettings.serverPort}
              onChange={(e) => setLocalSettings({ ...localSettings, serverPort: parseInt(e.target.value) || 8080 })}
              className="w-full px-3 py-2 bg-luna-bg-secondary border border-luna-border rounded-lg text-sm focus:outline-none focus:border-luna-primary"
            />
          </div>
        </div>
      </div>

      {/* 自动启动 */}
      <div className="bg-luna-bg-card rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-luna-text">自动启动服务器</h2>
            <p className="text-xs text-luna-text-secondary mt-1">启动应用时自动启动 llama-server</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localSettings.autoStartServer}
              onChange={(e) => setLocalSettings({ ...localSettings, autoStartServer: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-luna-bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-luna-primary"></div>
          </label>
        </div>
      </div>

      {/* 系统信息 */}
      <div className="bg-luna-bg-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-luna-text-secondary" />
          <h2 className="text-sm font-medium text-luna-text">系统信息</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-luna-text-secondary">平台</span>
            <span className="text-luna-text">{systemInfo?.platform || '...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-luna-text-secondary">架构</span>
            <span className="text-luna-text">{systemInfo?.arch || '...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-luna-text-secondary">Electron</span>
            <span className="text-luna-text">{systemInfo?.electronVersion || '...'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-luna-text-secondary">Node</span>
            <span className="text-luna-text">{systemInfo?.nodeVersion || '...'}</span>
          </div>
        </div>
      </div>

      {/* 链接 */}
      <div className="bg-luna-bg-card rounded-xl p-5">
        <h2 className="text-sm font-medium text-luna-text mb-4">相关链接</h2>
        <div className="space-y-2">
          <button
            onClick={() => window.luna.shell.openExternal('https://github.com/ggerganov/llama.cpp')}
            className="flex items-center gap-2 text-sm text-luna-text-secondary hover:text-luna-primary transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            llama.cpp GitHub
          </button>
          <button
            onClick={() => window.luna.shell.openExternal('https://huggingface.co/models?pipeline_tag=text-generation&library=gguf')}
            className="flex items-center gap-2 text-sm text-luna-text-secondary hover:text-luna-primary transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Hugging Face GGUF 模型
          </button>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2.5 bg-luna-bg-card hover:bg-luna-border rounded-lg transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-luna-primary hover:bg-luna-primary/80 text-white rounded-lg transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          {saved ? '已保存!' : '保存设置'}
        </button>
      </div>
    </div>
  )
}
