#!/bin/bash

echo "=================================="
echo "🎙️  启动 Azure TTS Generator"
echo "=================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    echo ""
fi

# Start the server
echo "🚀 启动服务器..."
echo ""
npm run tts
