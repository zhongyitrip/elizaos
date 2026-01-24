# Midscene 自定义 Agents

这个目录包含专门为 Midscene.js 设计的自定义 Agent，用于阿里云和智谱视觉模型的智能回退策略。

## 文件说明

### OptimalFallbackAgent.ts

最优回退策略 Agent，专门用于 Web3 自动化场景。

**特性：**

- ✅ 免费优先：优先使用免费模型
- ✅ 速度优先：在免费模型中选择最快的
- ✅ 智能回退：失败时自动切换到下一个模型
- ✅ 限流检测：检测到 429 错误立即跳过，避免长时间等待
- ✅ 成本追踪：统计每个模型的使用情况和成本

**回退顺序：免费优先 → 免费的快的优先 → 付费保底（全部启用缓存）**

1. 阿里云 qwen2-vl-2b (免费额度, 5.2秒缓存, 100%, 缓存加速32%)
2. 智谱 GLM-4.6V-Flash (免费, 7.8秒缓存, 100%, 缓存有效)
3. 智谱 GLM-4.1V-Thinking (免费, 备选, 缓存有效)
4. 阿里云 qwen2-vl-7b (¥0.001, 8秒, 90%, 缓存有效)
5. 阿里云 qwen-vl-plus (¥0.008, 3-5秒, 95%+, 缓存有效)

**缓存功能：** 所有模型统一使用 Midscene 缓存，加速 30-50%，节省 80% API 调用
**注：** Ollama 本地模型已注释（Mac CPU 损耗成本 > API 成本）

## 使用方法

### 基础用法

```typescript
import { chromium } from 'playwright';
import { OptimalFallbackAgent } from './custom-agents/midscene/OptimalFallbackAgent';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

const agent = new OptimalFallbackAgent(page);

// 智能执行操作，自动回退
await agent.smartAction('点击 Login 按钮');

// 打印统计报告
agent.printStats();
```

### 启用缓存（推荐）

```typescript
// 启用缓存可以大幅提升执行效率
const agent = new OptimalFallbackAgent(page, {
  cache: {
    enabled: true,
    id: 'my-cache-id', // 缓存 ID
    strategy: 'read-write', // 读写模式
  },
});

// 执行操作
await agent.smartAction('点击 Login 按钮');

// 刷新缓存到文件（清理未使用的缓存）
await agent.flushCache({ cleanUnused: true });
```

### 缓存策略

- **read-write**（默认）：自动读取和写入缓存
- **read-only**：只读缓存，需手动调用 `flushCache()`
- **write-only**：只写缓存，不读取已有缓存

### 缓存效果

- ✅ **大幅减少 API 调用**：相同操作第二次执行时直接使用缓存
- ✅ **显著提升速度**：执行时间可降低 50% 以上
- ✅ **降低成本**：减少云端 API 调用次数
- ✅ **适合高频场景**：批量自动化任务效果显著

缓存文件保存在 `./midscene_run/cache/` 目录

## 为什么放在这里？

- ❌ 不修改 ElizaOS 核心代码（`packages/core`）
- ✅ 独立维护，方便升级 ElizaOS
- ✅ 专门用于阿里云和智谱模型
- ✅ 易于自定义和扩展

## 测试

参考 `examples/test-optimal-strategy.ts` 查看完整测试示例。
