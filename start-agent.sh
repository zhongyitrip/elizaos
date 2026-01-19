#!/bin/bash

# 使用方法: ./start-agent.sh 0x2e5d0a4072cee407642f45ffeb2f7c6494c2cafe

if [ -z "$1" ]; then
    echo "错误: 请提供 EOA 地址"
    echo "使用方法: ./start-agent.sh <EOA_ADDRESS>"
    exit 1
fi

EOA_ADDRESS="$1"
CHARACTER_FILE="characters/${EOA_ADDRESS}.character.json"

# 检查文件是否存在
if [ ! -f "$CHARACTER_FILE" ]; then
    echo "错误: Character 文件不存在: $CHARACTER_FILE"
    exit 1
fi

# ✅ 新增：检查是否已经在运行
RUNNING_COUNT=$(ps aux | grep "[b]un.*dist/index.js.*${EOA_ADDRESS}" | wc -l | tr -d ' ')
if [ "$RUNNING_COUNT" -gt 0 ]; then
    echo "⚠️  警告: 该 Agent 已经在运行！"
    echo "📊 运行中的进程数: $RUNNING_COUNT"
    echo ""
    echo "请选择操作:"
    echo "  1. 查看运行状态: ps aux | grep bun"
    echo "  2. 停止现有进程: killall bun"
    echo "  3. 查看端口占用: lsof -i :3000"
    exit 1
fi

echo "🚀 启动 Agent: $EOA_ADDRESS"
echo "📄 Character 文件: $CHARACTER_FILE"
echo ""

cd packages/cli
bun dist/index.js start --character "../../$CHARACTER_FILE"
