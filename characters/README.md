# Characters 文件夹

这个文件夹用于存放所有自定义的 Agent Character 配置文件。

## 文件说明

### 当前使用的 Character
- **`eliza-ollama.character.json`** - 使用本地 Ollama 模型的 Eliza agent
  - 模型: gemma3:4b (文本) + qwen3-vl:4b (视觉)
  - 插件: SQL, Bootstrap, Ollama

- **`eliza-hybrid.character.json`** - 混合使用 Ollama + OpenRouter 的配置
  - 本地模型 + 云端模型的混合方案

### 模板文件
- **`airdrop-hunter-template.json`** - Airdrop Hunter agent 模板

## 如何使用

在 `eliza.config.ts` 中引用 character 文件：

```typescript
export default {
    agents: [
        {
            characterPath: './characters/eliza-ollama.character.json',
        },
        {
            characterPath: './characters/airdrop-hunter.character.json',
        },
    ],
};
```

## 与根目录文件的区别

- **根目录的 `*.character.json`**: ElizaOS 官方提供的示例文件，保留用于参考
- **`characters/` 文件夹**: 你的自定义配置，与官方文件分离，升级时不会冲突

## 添加新 Agent

1. 在此文件夹创建新的 `.character.json` 文件
2. 在 `eliza.config.ts` 中添加对应的 `characterPath`
3. 重启 ElizaOS: `bun run dev`
