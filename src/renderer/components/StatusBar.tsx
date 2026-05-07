import { useEffect, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import { Circle, HardDrive, Cpu, Activity } from 'lucide-react'
import clsx from 'clsx'

export default function StatusBar() {
  const { llamaStatus, localModels } = useAppStore()
  const [memory, setMemory] = useState({ used: 0, total: 0 })

  useEffect(() => {
    const updateMemory = () => {
      if ('memory' in performance) {
        const mem = (performance as any).memory
        setMemory({
          used: Math.round(mem.usedJSHeapSize / 1024 / 1024),
          total: Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
        })
      }
    }
    updateMemory()
    const interval = setInterval(updateMemory, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="h-8 flex items-center justify-between px-4 bg-luna-bg-secondary border-t border-luna-border text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Circle
            className={clsx(
              'w-2 h-2',
              llamaStatus.running ? 'fill-green-500 text-green-500' : 'fill-gray-500 text-gray-500'
            )}
          />
          <span className="text-luna-text-secondary">
            {llamaStatus.running
              ? `运行中 (端口 ${llamaStatus.port})`
              : '未运行'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-luna-text-secondary">
          <HardDrive className="w-3 h-3" />
          <span>{localModels.length} 个模型</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-luna-text-secondary">
          <Activity className="w-3 h-3" />
          <span>内存: {memory.used}MB / {memory.total}MB</span>
        </div>
        <div className="flex items-center gap-1.5 text-luna-text-secondary">
          <Cpu className="w-3 h-3" />
          <span>Electron</span>
        </div>
      </div>
    </footer>
  )
}
