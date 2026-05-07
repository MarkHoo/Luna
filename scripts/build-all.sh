#!/bin/bash
# Luna 多平台构建脚本

set -e

echo "=========================================="
echo "  Luna 多平台打包工具"
echo "=========================================="
echo ""

# 安装依赖
echo "[1/3] 安装依赖..."
npm install

# 清理旧的构建
echo "[2/3] 清理旧构建..."
rm -rf release dist dist-electron

# 构建当前平台
echo "[3/3] 开始构建..."
echo ""

case "$(uname -s)" in
  Linux*)
    echo "检测到平台: Linux"
    npm run build -- --linux
    echo ""
    echo "✓ Linux 构建完成！"
    echo "  输出: release/Luna-*.AppImage"
    ;;
  Darwin*)
    echo "检测到平台: macOS"
    npm run build -- --mac
    echo ""
    echo "✓ macOS 构建完成！"
    echo "  输出: release/Luna-*.dmg"
    ;;
  MINGW*|CYGWIN*|MSYS*)
    echo "检测到平台: Windows"
    npm run build -- --win
    echo ""
    echo "✓ Windows 构建完成！"
    echo "  输出: release/Luna-*-Setup.exe"
    ;;
esac

echo ""
echo "=========================================="
echo "  构建完成！"
echo "=========================================="
ls -la release/
