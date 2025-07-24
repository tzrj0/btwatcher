#!/bin/bash

echo "开始打包 macOS 应用..."

# 确保依赖已安装
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 清理之前的构建
echo "清理之前的构建..."
rm -rf dist

# 打包
echo "开始打包..."
npm run build -- --mac

echo "打包完成！"
echo "应用文件位置: dist/"
echo ""
echo "你可以在 dist 目录中找到："
echo "- .app 文件：可以直接运行的应用"
echo "- .dmg 文件：可以分发的安装包"