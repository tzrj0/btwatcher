#!/bin/bash

echo "宝塔面板日志监控客户端启动中..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ] || [ ! -d "node_modules/electron" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 启动Electron应用
echo "启动应用..."
npm start