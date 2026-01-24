# 🚀 免费模型快速参考

## 📊 一句话总结

| 模型 | 速度 | 限额 | 推荐场景 |
|------|------|------|---------|
| **Gemini 2.0 Flash** | ⚡⚡⚡⚡⚡ | 🔥🔥🔥 | **首选**：快速任务、高频请求 |
| **Qwen 2.5 72B** | ⚡⚡⚡⚡ | 🔥🔥 | **中文**：中文任务、通用场景 |
| **DeepSeek R1** | ⚡⚡ | 🔥 | **推理**：代码生成、复杂逻辑 |
| **Llama 3.3 70B** | ⚡⚡ | 🔥 | **备用**：其他模型限流时 |
| **Qwen 2 VL** | ⚡⚡⚡ | 🔥 | **视觉**：图像分析 |

---

## ⏰ 最佳使用时段

| 时段 | Gemini | Qwen | DeepSeek | Llama |
|------|--------|------|----------|-------|
| 00:00-06:00 | ✅✅✅ | ✅✅✅ | ✅✅✅ | ✅✅ |
| 06:00-09:00 | ✅✅ | ✅✅ | ✅✅ | ✅ |
| 09:00-12:00 | ✅ | ✅✅ | ✅ | ⚠️ |
| 12:00-18:00 | ⚠️ | ✅ | ⚠️ | ❌ |
| 18:00-21:00 | ✅ | ✅✅ | ✅ | ⚠️ |
| 21:00-24:00 | ✅✅ | ✅✅ | ✅✅ | ✅ |

**图例**: ✅✅✅ 最佳 | ✅✅ 良好 | ✅ 可用 | ⚠️ 拥挤 | ❌ 避免

---

## 🎯 配置建议

### Web3 空投自动化（推荐）
```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-xxx
# 不设置模型，自动轮询所有免费模型
```

### 代码生成任务
```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_LARGE_MODEL=deepseek/deepseek-r1:free
```

### 中文任务
```bash
# .env
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_SMALL_MODEL=qwen/qwen-2.5-72b-instruct:free
```

---

## 📈 每日限额速查

| 模型 | 每日限额 | 每分钟限额 | 建议间隔 |
|------|---------|-----------|---------|
| Gemini 2.0 Flash | 1500 | 10 | 6秒 |
| Qwen 2.5 72B | 1000 | 8 | 8秒 |
| DeepSeek R1 | 500 | 5 | 12秒 |
| Llama 3.3 70B | 300 | 5 | 12秒 |
| Qwen 2 VL | 500 | 5 | 12秒 |

**总计**: ~3800 请求/天（使用所有模型）

---

## 🔧 测试命令

```bash
# 运行性能测试
bun run scripts/test-free-models.ts

# 查看详细报告
cat docs/FREE_MODELS_PERFORMANCE_REPORT.md
```

---

**详细文档**: [FREE_MODELS_PERFORMANCE_REPORT.md](./FREE_MODELS_PERFORMANCE_REPORT.md)
