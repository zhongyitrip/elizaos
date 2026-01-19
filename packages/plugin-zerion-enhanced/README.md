# @elizaos/plugin-zerion-enhanced

增强版 Zerion 插件，提供更详细的钱包信息和链筛选功能。

## 功能特性

### ✅ 相比官方插件的改进

1. **详细的代币信息**
   - 显示代币数量
   - 显示代币符号
   - 按链分组显示
   - 显示合约地址（可选）

2. **链筛选功能**
   - 支持查询特定链上的代币
   - 例如："Show me tokens on Polygon"

3. **更好的格式化输出**
   - 清晰的层级结构
   - 按价值排序
   - 区分有价值和无价值代币

## 安装

```bash
# 在 ElizaOS 项目根目录
bun install
bun run build
```

## 使用

在 character 配置文件中添加：

```json
{
  "plugins": ["@elizaos/plugin-zerion-enhanced"],
  "settings": {
    "ZERION_API_KEY": "your_api_key_here"
  }
}
```

## Actions

### 1. getwallet_portfolio

获取钱包投资组合概览

**示例**：

```
Check the balance of 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### 2. getwallet_positions

获取详细的代币持仓信息

**示例**：

```
Show me all positions for 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### 3. getwallet_positions_by_chain (新增)

获取特定链上的代币持仓

**示例**：

```
What tokens do I have on Polygon? 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

## 开发

```bash
# 开发模式（自动编译）
bun run dev

# 构建
bun run build
```

## 与官方插件的区别

| 功能         | 官方插件 | 增强版插件 |
| ------------ | -------- | ---------- |
| 显示代币数量 | ❌       | ✅         |
| 按链分组     | ❌       | ✅         |
| 链筛选       | ❌       | ✅         |
| 合约地址     | ❌       | ✅         |
| 智能排序     | 基础     | 增强       |

## 许可证

MIT
