# Luna - Llama.cpp 模型管理工具

<div align="center">
  <img src="public/icon.svg" width="128" alt="Luna Logo" />
  <p>
    <strong>基于 llama.cpp 的本地大模型管理工具</strong>
  </p>
</div>

## 功能特点

- **多源下载支持**: 自动检测网络状况，选择最佳下载源
  - Hugging Face
  - ModelScope (魔搭社区)
  - AI Colle (国内镜像)
  - 本地文件导入

- **智能网络检测**: 启动时自动测试各源站点的连通性和延迟

- **模型管理**: 便捷的本地模型管理界面

- **一键启动**: 快速启动 llama-server 推理服务

- **参数配置**: 灵活配置上下文大小、线程数、GPU 层数等参数

- **实时日志**: 监控服务器运行状态

## 界面预览

深色主题设计，现代化 UI 体验

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **React 18** - UI 渲染
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **Zustand** - 状态管理
- **Vite** - 构建工具

## 开始使用

### 环境要求

- Node.js 18+
- npm / pnpm / yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
npm run build
```

构建完成后，应用将输出到 `release` 目录。

### 直接运行 Electron

```bash
npm run electron:dev
```

## 项目结构

```
luna/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── index.ts   # 入口
│   │   ├── downloader.ts  # 下载管理
│   │   ├── llama.ts   # llama-server 管理
│   │   └── fileManager.ts # 文件管理
│   ├── renderer/      # React 渲染进程
│   │   ├── components/   # 组件
│   │   ├── pages/    # 页面
│   │   ├── stores/   # 状态管理
│   │   └── App.tsx   # 主应用
│   └── preload/      # 预加载脚本
├── public/           # 静态资源
├── package.json
└── vite.config.ts
```

## 下载源配置

Luna 支持以下模型下载源：

| 源名称 | 说明 | 适用场景 |
|--------|------|----------|
| Hugging Face | 官方源 | 国际用户 |
| ModelScope | 魔搭社区 | 国内用户首选 |
| AI Colle | 镜像站 | 国内备选 |

系统会自动检测各源站点的延迟，自动选择最快的源。

## llama-server

启动推理服务需要先安装 llama.cpp 的 llama-server 可执行文件：

1. 从 [llama.cpp releases](https://github.com/ggerganov/llama.cpp/releases) 下载
2. 放入用户数据目录或系统 PATH

## License

MIT
