# 🚀 OpenRouter 免费模型池 - 使用指南

## 📋 目录
- [核心特性](#核心特性)
- [快速开始](#快速开始)
- [配置方式](#配置方式)
- [工作原理](#工作原理)
- [常见问题](#常见问题)
- [高级用法](#高级用法)

---

## 🎯 核心特性

### 为什么需要免费模型池？

在 Web3 空投自动化场景中，你需要：
- ✅ **永不停机**：即使某个模型限流，自动切换到下一个
- ✅ **完全免费**：使用 OpenRouter 的 `:free` 后缀模型
- ✅ **智能 Fallback**：自动检测 429 错误并重试
- ✅ **零配置**：不设置环境变量即可使用

### 已实现的功能

```typescript
// ✅ 文本生成（TEXT_SMALL / TEXT_LARGE）
// ✅ 对象生成（OBJECT_SMALL / OBJECT_LARGE）
// ✅ 图像分析（IMAGE_DESCRIPTION）
// ✅ 自动重试机制
// ✅ 详细日志输出
```

---

## 🚀 快速开始

### 步骤 1：获取 OpenRouter API Key

1. 访问 [OpenRouter](https://openrouter.ai/keys)
2. 注册账号（支持 Google 登录）
3. 创建 API Key（免费）

### 步骤 2：配置环境变量

```bash
# 复制示例配置
cp .env.openrouter-free-pool.example .env

# 编辑 .env，填入你的 API Key
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 步骤 3：启动 ElizaOS

```bash
# 安装依赖
bun install

# 构建
bun run build

# 启动
bun run start
```

### 步骤 4：观察日志

```bash
# 你会看到类似的日志：
[OpenRouter Free Pool] Trying text generation with model: google/gemini-2.0-flash-exp:free
[OpenRouter Free Pool] ✅ Success with model: google/gemini-2.0-flash-exp:free

# 如果遇到限流：
[OpenRouter Free Pool] ⚠️ Model google/gemini-2.0-flash-exp:free failed: 429 Too Many Requests
[OpenRouter Free Pool] Rate limit hit on google/gemini-2.0-flash-exp:free, trying next...
[OpenRouter Free Pool] Trying text generation with model: deepseek/deepseek-r1:free
[OpenRouter Free Pool] ✅ Success with model: deepseek/deepseek-r1:free
```

---

## ⚙️ 配置方式

### 方式 1：零配置（推荐）

**不设置任何模型环境变量**，系统自动使用免费模型池：

```bash
# .env 中只需要：
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**效果：**
- SMALL 模型池：`google/gemini-2.0-flash-exp:free` → `qwen/qwen-2.5-72b-instruct:free` → `meta-llama/llama-3.3-70b-instruct:free`
- LARGE 模型池：`deepseek/deepseek-r1:free` → `google/gemini-2.0-flash-exp:free` → `meta-llama/llama-3.3-70b-instruct:free` → `qwen/qwen-2.5-72b-instruct:free`
- VISION 模型池：`google/gemini-2.0-flash-exp:free` → `qwen/qwen-2-vl-72b-instruct:free`

---

### 方式 2：手动指定（简单但不灵活）

```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_SMALL_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_LARGE_MODEL=deepseek/deepseek-r1:free
```

**效果：**
- 只使用你指定的模型
- **没有自动 Fallback**
- 遇到限流会直接报错

---

### 方式 3：混合模式（推荐高级用户）

```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_LARGE_MODEL=deepseek/deepseek-r1:free
```

**效果：**
- 优先使用 `deepseek/deepseek-r1:free`
- 失败后自动切换到其他免费模型
- **最佳平衡：性能 + 可靠性**

---

## 🔧 工作原理

### 核心逻辑

```typescript
// packages/plugin-openrouter/src/utils/free-model-pool.ts

export async function tryModelsFromPool<T>(
  runtime: IAgentRuntime,
  modelPool: string[],
  attemptFn: (modelName: string) => Promise<T>,
  context: string = 'operation'
): Promise<{ result: T; modelUsed: string }> {
  for (const modelName of modelPool) {
    try {
      logger.debug(`[OpenRouter Free Pool] Trying ${context} with model: ${modelName}`);
      const result = await attemptFn(modelName);
      logger.log(`[OpenRouter Free Pool] ✅ Success with model: ${modelName}`);
      return { result, modelUsed: modelName };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // 检测限流错误
      if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        logger.warn(`[OpenRouter Free Pool] Rate limit hit on ${modelName}, trying next...`);
        continue; // 尝试下一个模型
      }
      
      continue; // 其他错误也尝试下一个
    }
  }
  
  // 所有模型都失败
  throw new Error(`All free models exhausted for ${context}`);
}
```

### 模型池配置

```typescript
// packages/plugin-openrouter/src/utils/free-model-pool.ts

export const FREE_MODEL_POOLS = {
  SMALL: [
    'google/gemini-2.0-flash-exp:free',      // 首选：速度快
    'qwen/qwen-2.5-72b-instruct:free',       // 次选：中文友好
    'meta-llama/llama-3.3-70b-instruct:free', // 备选
  ],
  
  LARGE: [
    'deepseek/deepseek-r1:free',             // 首选：推理强
    'google/gemini-2.0-flash-exp:free',      // 次选：速度快
    'meta-llama/llama-3.3-70b-instruct:free', // 备选
    'qwen/qwen-2.5-72b-instruct:free',       // 备选
  ],
  
  VISION: [
    'google/gemini-2.0-flash-exp:free',      // 首选：视觉能力强
    'qwen/qwen-2-vl-72b-instruct:free',      // 备选：通义千问 VL
  ],
};
```

---

## ❓ 常见问题

### Q1: 为什么需要 Fork 源码？

**A:** 官方插件不支持模型池和自动 Fallback。你需要：
1. Fork `plugin-openrouter` 到 `packages/`
2. 修改源码实现轮询逻辑
3. 确保 Web3 自动化永不停机

---

### Q2: 免费模型有什么限制？

**A:** OpenRouter 免费模型的限制：
- ⚠️ **Rate Limit**：每分钟请求数限制（通常 10-20 次）
- ⚠️ **排队等待**：高峰期可能需要等待
- ✅ **无需信用卡**：完全免费
- ✅ **质量保证**：与付费版本相同的模型

**解决方案：** 使用模型池自动切换！

---

### Q3: 如何调整模型池顺序？

**A:** 编辑 `packages/plugin-openrouter/src/utils/free-model-pool.ts`：

```typescript
export const FREE_MODEL_POOLS = {
  LARGE: [
    'your-preferred-model:free',  // 把你喜欢的放第一个
    'deepseek/deepseek-r1:free',
    // ...
  ],
};
```

---

### Q4: 如何添加新的免费模型？

**A:** 
1. 访问 [OpenRouter Models](https://openrouter.ai/models)
2. 找到带 `:free` 后缀的模型
3. 添加到 `FREE_MODEL_POOLS`：

```typescript
export const FREE_MODEL_POOLS = {
  SMALL: [
    'google/gemini-2.0-flash-exp:free',
    'new-free-model:free',  // 新增
    // ...
  ],
};
```

---

### Q5: 流式输出（Streaming）支持模型池吗？

**A:** **部分支持**。当前实现：
- ✅ 非流式模式：完全支持模型池
- ⚠️ 流式模式：只使用第一个模型（技术限制）

**原因：** 流式输出一旦开始就无法中断重试，实现复杂。

---

## 🔥 高级用法

### 1. 自定义重试逻辑

编辑 `packages/plugin-openrouter/src/utils/free-model-pool.ts`：

```typescript
export async function tryModelsFromPool<T>(
  runtime: IAgentRuntime,
  modelPool: string[],
  attemptFn: (modelName: string) => Promise<T>,
  context: string = 'operation',
  maxRetries: number = 3  // 新增：每个模型重试次数
): Promise<{ result: T; modelUsed: string }> {
  for (const modelName of modelPool) {
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        logger.debug(`[OpenRouter Free Pool] Trying ${context} with model: ${modelName} (attempt ${retry + 1}/${maxRetries})`);
        const result = await attemptFn(modelName);
        logger.log(`[OpenRouter Free Pool] ✅ Success with model: ${modelName}`);
        return { result, modelUsed: modelName };
      } catch (error: unknown) {
        if (retry < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒
          continue;
        }
        // 最后一次重试失败，尝试下一个模型
      }
    }
  }
  throw new Error(`All free models exhausted for ${context}`);
}
```

---

### 2. 监控模型使用情况

```typescript
// 在你的代码中监听模型使用事件
runtime.on('model:usage', (event) => {
  console.log(`Model used: ${event.modelName}`);
  console.log(`Tokens: ${event.usage.totalTokens}`);
});
```

---

### 3. 动态调整模型池

```typescript
// 根据时间段调整模型池
function getModelPoolByTime(poolType: 'SMALL' | 'LARGE' | 'VISION'): string[] {
  const hour = new Date().getHours();
  
  // 高峰期（9-18 点）：优先使用 DeepSeek
  if (hour >= 9 && hour <= 18) {
    return [
      'deepseek/deepseek-r1:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'google/gemini-2.0-flash-exp:free',
    ];
  }
  
  // 低峰期：优先使用 Gemini
  return [
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-r1:free',
    'qwen/qwen-2.5-72b-instruct:free',
  ];
}
```

---

## 📊 性能对比

| 模型 | 速度 | 推理能力 | 中文支持 | 推荐场景 |
|------|------|---------|---------|---------|
| `google/gemini-2.0-flash-exp:free` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 快速响应 |
| `deepseek/deepseek-r1:free` | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 复杂推理 |
| `qwen/qwen-2.5-72b-instruct:free` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 中文任务 |
| `meta-llama/llama-3.3-70b-instruct:free` | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 通用任务 |

---

## 🎯 最佳实践

### 对于 Web3 空投自动化

```bash
# .env 配置
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# 不设置任何模型变量，让系统自动选择
```

**原因：**
- ✅ 最大化可用性
- ✅ 自动避开限流
- ✅ 零维护成本

---

### 对于代码生成任务

```bash
# .env 配置
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_LARGE_MODEL=deepseek/deepseek-r1:free
```

**原因：**
- ✅ DeepSeek R1 推理能力强
- ✅ 仍有自动 Fallback
- ✅ 代码质量高

---

### 对于快速原型开发

```bash
# .env 配置
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_SMALL_MODEL=google/gemini-2.0-flash-exp:free
```

**原因：**
- ✅ Gemini Flash 速度最快
- ✅ 响应延迟低
- ✅ 适合快速迭代

---

## 📝 总结

| 特性 | 官方插件 | 你的定制版 |
|------|---------|-----------|
| 免费模型支持 | ✅ | ✅ |
| 自动 Fallback | ❌ | ✅ |
| 限流处理 | ❌ | ✅ |
| 模型池轮询 | ❌ | ✅ |
| Web3 永不停机 | ❌ | ✅ |

**你的优势：**
- 🚀 完全免费
- 🔄 自动重试
- 📊 详细日志
- 🛠️ 完全可定制

---

## 🔗 相关资源

- [OpenRouter 官网](https://openrouter.ai/)
- [OpenRouter 模型列表](https://openrouter.ai/models)
- [ElizaOS 文档](https://github.com/elizaOS/eliza)
- [你的 Fork 仓库](https://github.com/zhongyitrip/elizaos)

---

**祝你撸空投顺利！💰**
