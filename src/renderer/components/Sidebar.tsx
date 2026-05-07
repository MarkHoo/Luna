import { useAppStore } from '../stores/appStore'
import { Package, Rocket, Settings } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { id: 'models' as const, icon: Package, label: '模型', description: '下载管理' },
  { id: 'launch' as const, icon: Rocket, label: '启动', description: '运行推理' },
  { id: 'settings' as const, icon: Settings, label: '设置', description: '配置选项' }
]

export default function Sidebar() {
  const { activeTab, setActiveTab, llamaStatus } = useAppStore()

  return (
    <aside className="w-56 bg-luna-bg-secondary border-r border-luna-border flex flex-col">
      <nav className="flex-1 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const isDisabled = item.id === 'launch' && !llamaStatus.running && useAppStore.getState().localModels.length === 0

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && setActiveTab(item.id)}
              disabled={isDisabled}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-3 transition-all relative',
                isActive
                  ? 'bg-luna-bg-card text-luna-primary'
                  : isDisabled
                  ? 'text-luna-text-secondary/40 cursor-not-allowed'
                  : 'text-luna-text-secondary hover:bg-luna-bg-card hover:text-luna-text'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-luna-primary rounded-r-full" />
              )}
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-luna-text-secondary/60">{item.description}</div>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-luna-border">
        <div className="text-xs text-luna-text-secondary/60">
          基于 llama.cpp 构建
        </div>
      </div>
    </aside>
  )
}
