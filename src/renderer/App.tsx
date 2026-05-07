import { useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import Sidebar from './components/Sidebar'
import ModelsPage from './pages/ModelsPage'
import LaunchPage from './pages/LaunchPage'
import SettingsPage from './pages/SettingsPage'
import StatusBar from './components/StatusBar'
import { Moon, Settings, Minimize, Maximize, X } from 'lucide-react'

function App() {
  const { activeTab, setSources, setLocalModels, setSettings, setLlamaStatus, addLlamaLog } = useAppStore()

  useEffect(() => {
    const init = async () => {
      try {
        const [sources, models, settings] = await Promise.all([
          window.luna.network.detect(),
          window.luna.file.getModels(),
          window.luna.file.getSettings()
        ])
        setSources(sources)
        setLocalModels(models)
        setSettings(settings)

        const status = await window.luna.llama.status()
        setLlamaStatus(status)
      } catch (error) {
        console.error('Failed to initialize:', error)
      }
    }

    init()

    const unsubscribeProgress = window.luna.download.onProgress((progress) => {
      const { addDownloadTask, updateDownloadTask, removeDownloadTask } = useAppStore.getState()
      if (progress.status === 'completed' || progress.status === 'cancelled') {
        removeDownloadTask(progress.id)
      } else {
        updateDownloadTask(progress as any)
      }
    })

    const unsubscribeLog = window.luna.llama.onLog((log) => {
      addLlamaLog(log)
    })

    return () => {
      unsubscribeProgress()
      unsubscribeLog()
    }
  }, [])

  const renderPage = () => {
    switch (activeTab) {
      case 'models':
        return <ModelsPage />
      case 'launch':
        return <LaunchPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <ModelsPage />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-luna-bg">
      <header className="h-14 flex items-center justify-between px-4 bg-luna-bg-secondary border-b border-luna-border">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-luna-primary rounded-lg animate-pulse-ring opacity-30"></div>
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-luna-primary to-purple-900 rounded-lg">
              <Moon className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="text-lg font-semibold text-luna-text">Luna</span>
          <span className="text-xs text-luna-text-secondary bg-luna-bg-card px-2 py-0.5 rounded">v1.0.0</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-luna-bg-card transition-colors text-luna-text-secondary hover:text-luna-text">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-luna-bg-card transition-colors text-luna-text-secondary hover:text-luna-text">
            <Minimize className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-luna-bg-card transition-colors text-luna-text-secondary hover:text-luna-text">
            <Maximize className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-luna-text-secondary hover:text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          {renderPage()}
        </main>
      </div>

      <StatusBar />
    </div>
  )
}

export default App
