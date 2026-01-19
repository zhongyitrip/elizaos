#!/bin/bash

# ElizaOS Agent PM2 管理脚本
# 使用方法: ./pm2-agent.sh [start|stop|restart|status|logs] [EOA_ADDRESS]

ACTION=$1
EOA_ADDRESS=$2

# 默认 EOA 地址
DEFAULT_EOA="0x2e5d0a4072cee407642f45ffeb2f7c6494c2cafe"

if [ -z "$EOA_ADDRESS" ]; then
    EOA_ADDRESS=$DEFAULT_EOA
fi

CHARACTER_FILE="characters/${EOA_ADDRESS}.character.json"

# 检查 character 文件是否存在
if [ ! -f "$CHARACTER_FILE" ]; then
    echo "❌ 错误: Character 文件不存在: $CHARACTER_FILE"
    exit 1
fi

case "$ACTION" in
    start)
        echo "🚀 启动 Agent: $EOA_ADDRESS"
        pm2 start bun --name "eliza-${EOA_ADDRESS:0:10}" -- packages/cli/dist/index.js start --character "$CHARACTER_FILE"
        ;;
    stop)
        echo "🛑 停止 Agent"
        pm2 stop "eliza-${EOA_ADDRESS:0:10}"
        ;;
    restart)
        echo "🔄 重启 Agent"
        pm2 restart "eliza-${EOA_ADDRESS:0:10}"
        ;;
    delete)
        echo "🗑️  删除 Agent"
        pm2 delete "eliza-${EOA_ADDRESS:0:10}"
        ;;
    status)
        echo "📊 Agent 状态"
        pm2 list
        ;;
    logs)
        echo "📝 查看日志"
        pm2 logs "eliza-${EOA_ADDRESS:0:10}"
        ;;
    *)
        echo "使用方法: $0 [start|stop|restart|delete|status|logs] [EOA_ADDRESS]"
        echo ""
        echo "示例:"
        echo "  $0 start                    # 启动默认 Agent"
        echo "  $0 start 0xABCD...          # 启动指定 EOA 的 Agent"
        echo "  $0 status                   # 查看所有 Agent 状态"
        echo "  $0 logs                     # 查看日志"
        echo "  $0 stop                     # 停止 Agent"
        exit 1
        ;;
esac
