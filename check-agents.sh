#!/bin/bash

echo "=========================================="
echo "🔍 ElizaOS Agent 运行状态检查"
echo "=========================================="
echo ""

# 检查 bun 进程
echo "📊 运行中的 Bun 进程："
ps aux | grep "[b]un.*dist/index.js" | awk '{printf "  PID: %s, CPU: %s%%, MEM: %s%%\n", $2, $3, $4}'

echo ""
echo "🌐 端口占用情况："

# 检查常用端口
for port in 3000 3001 3002 3003; do
    result=$(lsof -i :$port 2>/dev/null | grep "bun.*LISTEN")
    if [ -n "$result" ]; then
        pid=$(echo "$result" | awk '{print $2}')
        echo "  ✅ 端口 $port: 运行中 (PID: $pid)"
    else
        echo "  ⭕ 端口 $port: 空闲"
    fi
done

echo ""
echo "📈 总结："
agent_count=$(ps aux | grep "[b]un.*dist/index.js" | wc -l | tr -d ' ')
echo "  当前运行的 Agent 数量: $agent_count"

if [ "$agent_count" -gt 1 ]; then
    echo "  ⚠️  警告：检测到多个 Agent 在运行！"
    echo ""
    echo "💡 建议操作："
    echo "  1. 查看所有进程: ps aux | grep bun"
    echo "  2. 停止指定进程: kill <PID>"
    echo "  3. 停止所有 ElizaOS: killall -9 bun"
elif [ "$agent_count" -eq 1 ]; then
    echo "  ✅ 正常：只有 1 个 Agent 在运行"
else
    echo "  ℹ️  没有 Agent 在运行"
fi

echo ""
echo "=========================================="
