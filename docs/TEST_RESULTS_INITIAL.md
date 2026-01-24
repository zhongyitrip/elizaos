# 🔍 OpenRouter 免费模型实测结果

> **测试时间**: 2026-01-24 19:56  
> **测试发现**: 部分模型名称需要更新

## ⚠️ 重要发现

### 模型可用性问题

测试过程中发现以下问题：

1. **Gemini 2.0 Flash** - ⚠️ 遇到限流
   - 模型名: `google/gemini-2.0-flash-exp:free`
   - 状态: 可用但已达到限流
   - 说明: 可能是之前测试导致的临时限流

2. **Qwen 2.5 72B** - ❌ 404 错误
   - 尝试的模型名: `qwen/qwen-2.5-72b-instruct:free`
   - 错误: "No endpoints found"
   - 可能原因: 模型名称不正确或已下线

3. **DeepSeek R1** - ❌ 404 错误
   - 尝试的模型名: `deepseek/deepseek-r1:free`
   - 错误: "No endpoints found"
   - 可能原因: 模型名称不正确或已下线

---

## 📝 建议的解决方案

### 1. 查询 OpenRouter 官方模型列表

访问 [OpenRouter Models](https://openrouter.ai/models?q=free) 查看当前可用的免费模型。

### 2. 更新模型池配置

根据实际可用的模型更新 `free-model-pool.ts` 中的配置。

### 3. 可能的正确模型名称

基于 OpenRouter 文档，免费模型可能的正确名称：

```typescript
// 可能需要更新为：
const FREE_MODELS = [
  // Google
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-flash-1.5:free',
  
  // Qwen (阿里通义千问)
  'qwen/qwen-2-72b-instruct:free',  // 可能是 2 而不是 2.5
  'qwen/qwen-2.5-7b-instruct:free', // 或者是 7B 版本
  
  // DeepSeek
  'deepseek/deepseek-chat:free',    // 可能是 chat 而不是 r1
  'deepseek/deepseek-coder:free',
  
  // Meta Llama
  'meta-llama/llama-3.1-8b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  
  // Microsoft
  'microsoft/phi-3-mini-128k-instruct:free',
  
  // Mistral
  'mistralai/mistral-7b-instruct:free',
];
```

---

## 🔧 下一步行动

1. **验证模型名称**
   ```bash
   # 使用 OpenRouter API 查询可用模型
   curl https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer $OPENROUTER_API_KEY"
   ```

2. **等待限流重置**
   - Gemini 的限流通常在 1 小时后重置
   - 建议在低峰期（凌晨）重新测试

3. **更新文档**
   - 根据实际可用模型更新所有文档
   - 移除不可用的模型
   - 添加新发现的免费模型

---

## 📊 临时建议

在验证正确的模型名称之前，建议：

1. **使用已知可用的模型**
   ```bash
   # .env
   OPENROUTER_API_KEY=sk-or-v1-xxx
   OPENROUTER_SMALL_MODEL=google/gemini-flash-1.5:free
   ```

2. **避免频繁测试**
   - 等待限流重置（1小时）
   - 使用更长的请求间隔（15-30秒）

3. **查阅官方文档**
   - [OpenRouter Models](https://openrouter.ai/models)
   - [OpenRouter API Docs](https://openrouter.ai/docs)

---

**状态**: 🔄 需要验证模型名称  
**下次更新**: 验证后更新所有配置文件
