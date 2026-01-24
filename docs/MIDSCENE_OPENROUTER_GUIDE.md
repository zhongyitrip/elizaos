# Midscene.js + OpenRouter 集成指南

## 概述

Midscene.js 是一个 AI 驱动的浏览器自动化工具，可以通过自然语言指令控制浏览器。本指南展示如何将其与 OpenRouter 集成，使用各种视觉模型进行自动化测试。

## 快速开始

### 1. 安装依赖

```bash
bun install @midscene/web playwright
```

### 2. 配置环境变量

在 `.env` 文件中添加：

```bash
# OpenRouter API Key (必需)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# 可选: 指定视觉模型
OPENROUTER_IMAGE_MODEL=google/gemini-2.0-flash-exp:free
```

### 3. 运行测试

```bash
# 简单集成测试
bun run examples/midscene-openrouter-simple.ts

# 完整功能测试
bun run examples/midscene-openrouter-test.ts
```

## 推荐模型

### 免费模型（有限流风险）

| 模型                               | 特点         | 适用场景   |
| ---------------------------------- | ------------ | ---------- |
| `google/gemini-2.0-flash-exp:free` | 免费，速度快 | 开发测试   |
| `google/gemini-flash-1.5:free`     | 免费，稳定   | 轻量级任务 |

### 付费模型（推荐生产环境）

| 模型                          | 特点           | 价格             |
| ----------------------------- | -------------- | ---------------- |
| `anthropic/claude-3.5-sonnet` | 最强视觉理解   | ~$3/1M tokens    |
| `openai/gpt-4o`               | 平衡性能和成本 | ~$2.5/1M tokens  |
| `google/gemini-pro-1.5`       | 性价比高       | ~$1.25/1M tokens |

## 核心 API

### 1. 创建 Agent

```typescript
import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
const agent = new PlaywrightAgent(page);
```

### 2. AI 查询（aiQuery）

用于获取页面信息，不执行操作。

```typescript
// 查询页面内容
const result = await agent.aiQuery('页面上有哪些按钮？');

// 提取特定信息
const price = await agent.aiQuery('商品的价格是多少？');

// 判断状态
const isLoggedIn = await agent.aiQuery('用户是否已登录？');
```

### 3. AI 操作（aiAction）

用于执行点击、输入等操作。

```typescript
// 点击元素
await agent.aiAction('点击登录按钮');

// 输入文字
await agent.aiAction('在搜索框中输入 "Playwright"');

// 复杂操作
await agent.aiAction('滚动到页面底部，然后点击"加载更多"按钮');
```

## 配置 Midscene 使用 OpenRouter

```typescript
// 设置 OpenRouter 端点
process.env.MIDSCENE_MODEL_BASE_URL = 'https://openrouter.ai/api/v1';
process.env.MIDSCENE_MODEL_API_KEY = process.env.OPENROUTER_API_KEY;
process.env.MIDSCENE_MODEL_NAME = 'google/gemini-2.0-flash-exp:free';

// 创建 agent 后会自动使用这些配置
const agent = new PlaywrightAgent(page);
```

## 常见问题

### Q1: 遇到 429 错误（限流）

**原因**: 免费模型有使用限制

**解决方案**:

1. 等待 1-2 分钟后重试
2. 切换到付费模型
3. 添加重试逻辑

```typescript
async function aiActionWithRetry(agent, instruction, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await agent.aiAction(instruction);
    } catch (error) {
      if (error.message?.includes('429') && i < maxRetries - 1) {
        console.log(`限流，等待 ${(i + 1) * 10} 秒后重试...`);
        await new Promise((r) => setTimeout(r, (i + 1) * 10000));
        continue;
      }
      throw error;
    }
  }
}
```

### Q2: AI 定位不准确

**解决方案**:

1. 使用更具体的描述
2. 切换到更强的模型
3. 结合传统 Playwright 选择器

```typescript
// ❌ 模糊描述
await agent.aiAction('点击按钮');

// ✅ 具体描述
await agent.aiAction('点击页面右上角的蓝色"登录"按钮');

// ✅ 混合使用
const button = await page.locator('button.login');
await button.click();
```

### Q3: 响应速度慢

**原因**: 视觉模型需要处理截图

**优化方案**:

1. 减少不必要的 AI 调用
2. 使用更快的模型（如 gemini-flash）
3. 关键路径使用传统选择器

```typescript
// ❌ 每个操作都用 AI
await agent.aiAction('点击搜索框');
await agent.aiAction('输入文字');
await agent.aiAction('点击搜索按钮');

// ✅ 只在难以定位时用 AI
await page.locator('input[type="search"]').fill('keyword');
await agent.aiAction('点击搜索按钮'); // 按钮位置动态变化时才用 AI
```

## 最佳实践

### 1. 混合使用策略

```typescript
// 传统选择器处理简单、稳定的元素
await page.goto('https://example.com');
await page.fill('input#username', 'user@example.com');

// AI 处理动态、难以定位的元素
await agent.aiAction('点击页面上的"继续"按钮');
```

### 2. 错误处理

```typescript
try {
  await agent.aiAction('点击提交按钮');
} catch (error) {
  if (error.message?.includes('429')) {
    console.log('模型限流，使用备用方案');
    await page.locator('button[type="submit"]').click();
  } else {
    throw error;
  }
}
```

### 3. 成本控制

```typescript
// 开发环境: 使用免费模型
const devModel = 'google/gemini-2.0-flash-exp:free';

// 生产环境: 使用付费模型
const prodModel = 'anthropic/claude-3.5-sonnet';

process.env.MIDSCENE_MODEL_NAME = process.env.NODE_ENV === 'production' ? prodModel : devModel;
```

## 查看执行报告

Midscene 会自动生成详细的执行报告：

```bash
# 报告位置
midscene_run/report/

# 打开最新报告
open midscene_run/report/latest.html
```

报告包含：

- 每个步骤的截图
- AI 的视觉分析过程
- 执行时间统计
- 错误详情

## 进阶用法

### 自定义超时

```typescript
const agent = new PlaywrightAgent(page, {
  timeout: 30000, // 30秒超时
});
```

### 批量操作

```typescript
const tasks = ['点击第一个商品', '点击第二个商品', '点击第三个商品'];

for (const task of tasks) {
  await agent.aiAction(task);
  await page.waitForTimeout(1000);
}
```

### 条件判断

```typescript
const hasLoginButton = await agent.aiQuery('页面上是否有登录按钮？');

if (hasLoginButton.includes('是') || hasLoginButton.includes('有')) {
  await agent.aiAction('点击登录按钮');
}
```

## 故障排查

### 检查 OpenRouter 连接

```bash
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"google/gemini-2.0-flash-exp:free","messages":[{"role":"user","content":"test"}]}'
```

### 检查余额

访问: https://openrouter.ai/credits

### 查看可用模型

访问: https://openrouter.ai/models?supported_parameters=vision

## 参考资源

- [Midscene.js 官方文档](https://midscenejs.com)
- [OpenRouter 模型列表](https://openrouter.ai/models)
- [Playwright 文档](https://playwright.dev)
