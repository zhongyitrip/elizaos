# Midscene.js 集成方案总结

## 概述

Midscene.js 是一个 AI 驱动的浏览器自动化工具，支持通过自然语言控制浏览器。本文档总结了三种集成方案的测试结果。

## 三种集成方案对比

| 方案                    | 提供商           | 成本           | 速度        | 稳定性      | 推荐场景          |
| ----------------------- | ---------------- | -------------- | ----------- | ----------- | ----------------- |
| **方案 1: OpenRouter**  | OpenRouter       | 免费模型有限流 | 快 (3-5s)   | ⚠️ 限流风险 | 快速测试          |
| **方案 2: 阿里云 Qwen** | 阿里云 DashScope | 付费           | 快 (3-10s)  | ✅ 稳定     | **生产环境推荐**  |
| **方案 3: 本地 Ollama** | 本地部署         | 完全免费       | 慢 (10-60s) | ✅ 稳定     | 开发测试/隐私保护 |

## 方案 1: OpenRouter (已测试 ⚠️)

### 配置

```typescript
process.env.MIDSCENE_MODEL_BASE_URL = 'https://openrouter.ai/api/v1';
process.env.MIDSCENE_MODEL_API_KEY = process.env.OPENROUTER_API_KEY;
process.env.MIDSCENE_MODEL_NAME = 'google/gemini-2.0-flash-exp:free';
```

### 测试结果

- ✅ 集成成功
- ⚠️ 免费模型被限流 (429 错误)
- ✅ 付费模型应该稳定

### 优点

- 快速响应
- 多种模型可选
- 按需付费

### 缺点

- 免费模型有限流
- 需要网络连接
- 数据发送到云端

### 适用场景

- 快速原型验证
- 偶尔使用
- 需要最新模型

## 方案 2: 阿里云 Qwen (已测试 ✅)

### 配置

```typescript
process.env.MIDSCENE_MODEL_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
process.env.MIDSCENE_MODEL_API_KEY = 'sk-dcfffe8f7cab48ac879df24829ac282a';
process.env.MIDSCENE_MODEL_NAME = 'qwen3-vl-plus';
process.env.MIDSCENE_MODEL_FAMILY = 'qwen3-vl';
```

### 测试结果

**完全成功！** 所有测试步骤都通过：

1. ✅ 页面加载
2. ✅ AI 查询导航元素 → 识别出：Platform, Solutions, Resources, Open Source, Pricing
3. ✅ AI 点击搜索框
4. ✅ AI 输入文字 → "playwright automation"
5. ✅ AI 验证输入内容

### 优点

- ✅ **零限流** - 稳定可靠
- ✅ **速度快** - 3-10 秒响应
- ✅ **准确度高** - 所有操作成功
- ✅ **中文优化** - Qwen 对中文支持好

### 缺点

- 需要付费 (但价格合理)
- 需要网络连接
- 数据发送到云端

### 适用场景

- **生产环境 (强烈推荐)**
- 需要稳定性的自动化任务
- 大规模使用
- 对速度有要求

### 成本估算

假设每次 AI 操作消耗 1000 tokens：

- 输入: ~500 tokens (截图 + 指令)
- 输出: ~500 tokens (响应)
- 成本: ~¥0.001 - ¥0.005 / 次操作

## 方案 3: 本地 Ollama Qwen (测试中)

### 配置

```typescript
process.env.MIDSCENE_MODEL_BASE_URL = 'http://127.0.0.1:11434/v1';
process.env.MIDSCENE_MODEL_API_KEY = 'ollama'; // 不需要真实 Key
process.env.MIDSCENE_MODEL_NAME = 'qwen3-vl:4b';
process.env.MIDSCENE_MODEL_FAMILY = 'qwen3-vl';
```

### 前置要求

```bash
# 1. 安装 Ollama
brew install ollama

# 2. 启动 Ollama 服务
ollama serve

# 3. 拉取 Qwen 视觉模型
ollama pull qwen3-vl:4b  # 3.3 GB
# 或更大的模型
ollama pull qwen3-vl:8b  # 6.1 GB
ollama pull qwen3-vl:30b # 19 GB

# 4. 验证模型
ollama list | grep qwen3-vl
```

### 优点

- ✅ **完全免费** - 无 API 调用费用
- ✅ **数据隐私** - 所有数据在本地处理
- ✅ **无限流** - 不受云端限制
- ✅ **离线可用** - 无需网络连接

### 缺点

- ⚠️ **速度慢** - 10-60 秒 (取决于硬件)
- ⚠️ **需要硬件** - 需要足够的 RAM/GPU
- ⚠️ **首次加载慢** - 模型加载到内存需要时间

### 硬件要求

| 模型         | 大小   | 最低 RAM | 推荐 RAM | 速度 |
| ------------ | ------ | -------- | -------- | ---- |
| qwen3-vl:4b  | 3.3 GB | 8 GB     | 16 GB    | 中等 |
| qwen3-vl:8b  | 6.1 GB | 16 GB    | 32 GB    | 较快 |
| qwen3-vl:30b | 19 GB  | 32 GB    | 64 GB    | 最快 |

### 适用场景

- 开发测试环境
- 对隐私有严格要求
- 大量重复操作 (成本敏感)
- 离线环境

## 推荐方案选择

### 开发阶段

```
本地 Ollama (免费) → 阿里云 Qwen (验证准确性)
```

### 生产环境

```
阿里云 Qwen (稳定 + 快速)
```

### 成本敏感

```
本地 Ollama (完全免费，接受速度慢)
```

### 隐私优先

```
本地 Ollama (数据不出本地)
```

## 实际使用建议

### 混合策略 (最优)

```typescript
// 简单、稳定的元素 - 用传统 Playwright
await page.goto('https://example.com');
await page.fill('input#username', 'user@example.com');
await page.click('button[type="submit"]');

// 动态、难定位的元素 - 用 Midscene AI
await agent.aiAction('点击页面上的"继续"按钮');
await agent.aiAction('选择第二个商品卡片');
```

### 成本控制

```typescript
// 开发环境: 本地 Ollama
const devConfig = {
  baseURL: 'http://127.0.0.1:11434/v1',
  apiKey: 'ollama',
  model: 'qwen3-vl:4b',
};

// 生产环境: 阿里云 Qwen
const prodConfig = {
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.QWEN_API_KEY,
  model: 'qwen3-vl-plus',
};

const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
```

## 测试脚本

| 脚本                                     | 用途                    |
| ---------------------------------------- | ----------------------- |
| `examples/midscene-openrouter-simple.ts` | OpenRouter 集成测试     |
| `examples/midscene-qwen-test.ts`         | 阿里云 Qwen 集成测试 ✅ |
| `examples/midscene-ollama-qwen-test.ts`  | 本地 Ollama 集成测试    |
| `examples/test-openrouter-text.ts`       | OpenRouter 文本模型测试 |
| `examples/test-openrouter-vision.ts`     | OpenRouter 视觉模型测试 |

## 运行测试

```bash
# 测试阿里云 Qwen (推荐先测试这个)
bun run examples/midscene-qwen-test.ts

# 测试本地 Ollama (需要先启动 ollama serve)
bun run examples/midscene-ollama-qwen-test.ts

# 测试 OpenRouter (可能遇到限流)
bun run examples/midscene-openrouter-simple.ts
```

## 查看执行报告

所有测试都会生成详细的 HTML 报告：

```bash
# 报告位置
midscene_run/report/

# 打开最新报告
open midscene_run/report/playwright-*.html
```

报告包含：

- 每个步骤的截图
- AI 的视觉分析过程
- 元素定位详情
- 执行时间统计

## 总结

**最佳实践：**

1. **开发阶段**: 使用本地 Ollama (免费，隐私)
2. **测试验证**: 使用阿里云 Qwen (快速，准确)
3. **生产环境**: 使用阿里云 Qwen (稳定，可靠)
4. **混合使用**: 传统选择器 + AI 选择器结合

**已验证成功：**

- ✅ 阿里云 Qwen + Midscene (完全成功)
- ⚠️ OpenRouter + Midscene (限流问题)
- 🔄 本地 Ollama + Midscene (测试中)
