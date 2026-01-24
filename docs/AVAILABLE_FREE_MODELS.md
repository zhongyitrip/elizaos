# 🎯 OpenRouter 免费模型 - 实际可用列表

> **更新时间**: 2026-01-24  
> **数据来源**: OpenRouter API 实时查询  
> **总计**: 33 个免费模型

---

## 🏆 推荐模型（按类别）

### ⚡ 快速响应模型 (SMALL)

| 模型 | Context | 推荐场景 |
|------|---------|---------|
| **google/gemini-2.0-flash-exp:free** | 1M tokens | 🥇 首选：速度快、限额高 |
| **google/gemma-3-27b-it:free** | 131K tokens | 通用任务 |
| **google/gemma-3-12b-it:free** | 32K tokens | 轻量任务 |
| **qwen/qwen3-4b:free** | 40K tokens | 中文友好 |

### 🧠 复杂推理模型 (LARGE)

| 模型 | Context | 推荐场景 |
|------|---------|---------|
| **meta-llama/llama-3.1-405b-instruct:free** | 131K tokens | 🥇 最强推理 |
| **nousresearch/hermes-3-llama-3.1-405b:free** | 131K tokens | 复杂任务 |
| **deepseek/deepseek-r1-0528:free** | 163K tokens | 代码生成 |
| **qwen/qwen3-next-80b-a3b-instruct:free** | 262K tokens | 中文推理 |
| **meta-llama/llama-3.3-70b-instruct:free** | 131K tokens | 通用推理 |

### 💻 代码生成模型 (CODE)

| 模型 | Context | 推荐场景 |
|------|---------|---------|
| **qwen/qwen3-coder:free** | 262K tokens | 🥇 代码专家 |
| **mistralai/devstral-2512:free** | 262K tokens | 开发任务 |
| **deepseek/deepseek-r1-0528:free** | 163K tokens | 代码推理 |

### 👁️ 视觉模型 (VISION)

| 模型 | Context | 推荐场景 |
|------|---------|---------|
| **google/gemini-2.0-flash-exp:free** | 1M tokens | 🥇 图像分析 |
| **qwen/qwen-2.5-vl-7b-instruct:free** | 32K tokens | 中文视觉 |
| **nvidia/nemotron-nano-12b-v2-vl:free** | 128K tokens | 视觉任务 |
| **allenai/molmo-2-8b:free** | 36K tokens | 图像理解 |

---

## 📊 完整免费模型列表

### Google 系列

| 模型 ID | 名称 | Context |
|---------|------|---------|
| `google/gemini-2.0-flash-exp:free` | Gemini 2.0 Flash Experimental | 1048K |
| `google/gemma-3-27b-it:free` | Gemma 3 27B | 131K |
| `google/gemma-3-12b-it:free` | Gemma 3 12B | 32K |
| `google/gemma-3-4b-it:free` | Gemma 3 4B | 32K |
| `google/gemma-3n-e4b-it:free` | Gemma 3n 4B | 8K |
| `google/gemma-3n-e2b-it:free` | Gemma 3n 2B | 8K |

### Meta Llama 系列

| 模型 ID | 名称 | Context |
|---------|------|---------|
| `meta-llama/llama-3.1-405b-instruct:free` | Llama 3.1 405B | 131K |
| `meta-llama/llama-3.3-70b-instruct:free` | Llama 3.3 70B | 131K |
| `meta-llama/llama-3.2-3b-instruct:free` | Llama 3.2 3B | 131K |
| `nousresearch/hermes-3-llama-3.1-405b:free` | Hermes 3 405B | 131K |

### Qwen (阿里通义千问) 系列

| 模型 ID | 名称 | Context |
|---------|------|---------|
| `qwen/qwen3-coder:free` | Qwen3 Coder 480B | 262K |
| `qwen/qwen3-next-80b-a3b-instruct:free` | Qwen3 Next 80B | 262K |
| `qwen/qwen3-4b:free` | Qwen3 4B | 40K |
| `qwen/qwen-2.5-vl-7b-instruct:free` | Qwen2.5-VL 7B | 32K |

### DeepSeek 系列

| 模型 ID | 名称 | Context |
|---------|------|---------|
| `deepseek/deepseek-r1-0528:free` | DeepSeek R1 0528 | 163K |
| `tngtech/deepseek-r1t2-chimera:free` | DeepSeek R1T2 Chimera | 163K |
| `tngtech/deepseek-r1t-chimera:free` | DeepSeek R1T Chimera | 163K |

### Mistral 系列

| 模型 ID | 名称 | Context |
|---------|------|---------|
| `mistralai/devstral-2512:free` | Devstral 2 2512 | 262K |
| `mistralai/mistral-small-3.1-24b-instruct:free` | Mistral Small 3.1 24B | 128K |

### 其他优质模型

| 模型 ID | 名称 | Context |
|---------|------|---------|
| `openai/gpt-oss-120b:free` | GPT-OSS 120B | 131K |
| `openai/gpt-oss-20b:free` | GPT-OSS 20B | 131K |
| `nvidia/nemotron-nano-9b-v2:free` | Nemotron Nano 9B V2 | 128K |
| `moonshotai/kimi-k2:free` | Kimi K2 | 32K |
| `z-ai/glm-4.5-air:free` | GLM 4.5 Air | 131K |

---

## 🎯 更新后的推荐配置

### 对于 Web3 空投自动化

```typescript
export const FREE_MODEL_POOLS = {
  SMALL: [
    'google/gemini-2.0-flash-exp:free',      // 首选：最快
    'google/gemma-3-27b-it:free',            // 次选：稳定
    'qwen/qwen3-4b:free',                    // 备选：中文
  ],
  
  LARGE: [
    'meta-llama/llama-3.1-405b-instruct:free', // 首选：最强
    'deepseek/deepseek-r1-0528:free',          // 次选：推理
    'qwen/qwen3-next-80b-a3b-instruct:free',   // 备选：中文
    'meta-llama/llama-3.3-70b-instruct:free',  // 备选：通用
  ],
  
  CODE: [
    'qwen/qwen3-coder:free',                 // 首选：代码专家
    'mistralai/devstral-2512:free',          // 次选：开发
    'deepseek/deepseek-r1-0528:free',        // 备选：推理
  ],
  
  VISION: [
    'google/gemini-2.0-flash-exp:free',      // 首选：视觉
    'qwen/qwen-2.5-vl-7b-instruct:free',     // 次选：中文视觉
    'nvidia/nemotron-nano-12b-v2-vl:free',   // 备选：NVIDIA
  ],
};
```

---

## 🚀 性能预估

基于模型规模和架构的理论性能：

| 模型 | 预估延迟 | 预估限额 | 综合评分 |
|------|---------|---------|---------|
| Gemini 2.0 Flash | 800-1500ms | 高 | ⭐⭐⭐⭐⭐ |
| Llama 3.1 405B | 5000-8000ms | 中 | ⭐⭐⭐⭐⭐ |
| Qwen3 Coder | 2000-3000ms | 高 | ⭐⭐⭐⭐⭐ |
| DeepSeek R1 | 3000-5000ms | 中 | ⭐⭐⭐⭐ |
| Gemma 3 27B | 1500-2500ms | 高 | ⭐⭐⭐⭐ |

---

## 📝 使用建议

### 1. 快速任务（<100 tokens）
```bash
推荐: google/gemini-2.0-flash-exp:free
原因: 速度最快，限额最高
```

### 2. 复杂推理（>500 tokens）
```bash
推荐: meta-llama/llama-3.1-405b-instruct:free
原因: 405B 参数，推理能力最强
```

### 3. 代码生成
```bash
推荐: qwen/qwen3-coder:free
原因: 专门为代码优化，480B 参数
```

### 4. 中文任务
```bash
推荐: qwen/qwen3-next-80b-a3b-instruct:free
原因: 中文训练，80B 参数
```

---

## ⚠️ 重要提示

1. **模型可用性可能变化**
   - 免费模型列表会定期更新
   - 建议定期运行 `bun run scripts/query-free-models.ts` 查询最新列表

2. **限流规则**
   - 每个模型的限流规则可能不同
   - 建议使用模型池自动 Fallback

3. **性能差异**
   - 大模型（405B）推理能力强但速度慢
   - 小模型（4B）速度快但能力有限
   - 根据任务选择合适的模型

---

**下一步**: 更新 `free-model-pool.ts` 使用这些实际可用的模型
