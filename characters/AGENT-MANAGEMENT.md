# Agent 管理方案

## 概述

针对 30,000 个 EOA 地址的 Agent 管理，采用**动态生成**而非静态文件的方式。

## 核心设计

### 1. **EOA 地址作为 Agent 标识**

每个 Agent 的命名规则：
- **name**: `AirdropHunter_0x123456` (地址前8位)
- **username**: `0x1234567890123456789012345678901234567890` (完整地址)
- **settings.EOA_ADDRESS**: 完整的 EOA 地址

### 2. **基础插件配置**

所有 Airdrop Hunter Agents 共享的基础插件：
```json
{
  "plugins": [
    "@elizaos/plugin-sql",         // 数据库访问
    "@elizaos/plugin-bootstrap",   // 核心功能
    "@elizaos/plugin-ollama",      // 本地 AI 模型
    "@elizaos/plugin-airdrop"      // 你的自定义插件
  ]
}
```

### 3. **动态配置生成**

**文件结构**：
```
characters/
├── base-airdrop-hunter.json       # 基础模板
├── eliza-ollama.character.json    # 主 Agent
└── README.md

scripts/
└── generate-agent-characters.ts   # 动态生成工具
```

## 使用方式

### 方案A: 分批加载（推荐）

适合大规模场景，按需加载部分 agents：

```typescript
// eliza.config.ts
import { generateCharactersForEOAs } from './scripts/generate-agent-characters';

// 从数据库查询当前需要激活的 EOA（例如：100个）
const activeEOAs = await queryActiveEOAs({ limit: 100 });

export default {
    agents: [
        { characterPath: './characters/eliza-ollama.character.json' },
        ...activeEOAs.map(address => ({
            character: generateCharacterForEOA(address)
        }))
    ]
};
```

### 方案B: 预生成配置文件

适合固定数量的 agents：

```bash
# 生成配置文件
bun run scripts/generate-agent-characters.ts

# 在 eliza.config.ts 中引用
{
    characterPath: './characters/generated/agent-0x1234.json'
}
```

## 自定义配置

每个 Agent 可以有不同的配置：

```typescript
generateCharacterForEOA('0x123...', {
    // 自定义插件（在基础插件之上）
    CUSTOM_PLUGINS: ['@elizaos/plugin-lens', '@elizaos/plugin-uniswap'],
    
    // DApp 偏好
    PREFERRED_DAPPS: ['lens', 'uniswap', 'aave'],
    
    // 风险等级
    RISK_LEVEL: 'medium',
    
    // 每日交互次数
    DAILY_INTERACTIONS: 5,
});
```

## 插件管理

### 基础插件（所有 agents 必需）
- `@elizaos/plugin-sql` - 数据库访问
- `@elizaos/plugin-bootstrap` - 核心功能
- `@elizaos/plugin-ollama` - AI 模型

### 功能插件（按需添加）
- `@elizaos/plugin-airdrop` - Airdrop 核心功能
- `@elizaos/plugin-lens` - Lens Protocol
- `@elizaos/plugin-uniswap` - Uniswap 交互
- 其他自定义插件...

## 数据库集成

在 `generate-agent-characters.ts` 中实现：

```typescript
export async function loadEOAsFromDatabase() {
    const { data } = await supabase
        .from('eoa_accounts')
        .select('address, settings')
        .eq('status', 'active')
        .limit(100);
    
    return data.map(row => ({
        address: row.address,
        customSettings: row.settings
    }));
}
```

## 性能考虑

- **分批加载**: 不要一次加载 30,000 个 agents
- **按需激活**: 根据任务队列动态激活 agents
- **资源限制**: 考虑内存和 CPU 限制，建议单次运行 100-500 个 agents

## 升级兼容性

- ✅ 基础模板 `base-airdrop-hunter.json` 可以随时更新
- ✅ 动态生成逻辑与官方文件分离
- ✅ ElizaOS 升级不会影响你的配置生成逻辑
