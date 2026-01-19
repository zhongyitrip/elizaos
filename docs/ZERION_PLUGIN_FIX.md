# Zerion Plugin Authentication Fix

## 问题描述

`@elizaos/plugin-zerion` 插件的认证方式不正确，直接使用了 API Key 而没有进行 Base64 编码，导致所有 API 请求返回 401 Unauthorized 错误。

## 根本原因

根据 [Zerion API 官方文档](https://developers.zerion.io/reference/authentication)，API 认证需要：

1. 将 API Key 加上冒号 `:`
2. 进行 Base64 编码
3. 使用 `Authorization: Basic <base64_encoded_key>` 头部

**错误的方式**（插件原始代码）：

```javascript
"Authorization": `Basic ${process.env.ZERION_API_KEY}`
```

**正确的方式**：

```javascript
const base64Auth = Buffer.from(`${process.env.ZERION_API_KEY}:`).toString('base64');
"Authorization": `Basic ${base64Auth}`
```

## 修复内容

已修复的文件：`node_modules/@elizaos/plugin-zerion/dist/index.js`

### 修改 1：Portfolio 端点（第 18 行）

```javascript
// 添加 Base64 编码
const base64Auth = Buffer.from(`${process.env.ZERION_API_KEY}:`).toString('base64');
const response = await fetch(`${baseUrl}/wallets/${address}/portfolio`, {
  method: 'GET',
  headers: {
    Accept: 'application/json',
    Authorization: `Basic ${base64Auth}`, // 使用编码后的值
  },
});
```

### 修改 2：Positions 端点（第 55 行）

```javascript
// 添加 Base64 编码
const base64Auth = Buffer.from(`${process.env.ZERION_API_KEY}:`).toString('base64');
const response = await fetch(`https://api.zerion.io/v1/wallets/${address}/positions?...`, {
  headers: {
    Accept: 'application/json',
    Authorization: `Basic ${base64Auth}`, // 使用编码后的值
  },
});
```

## 测试方法

修复后，可以使用以下脚本测试：

```bash
# 测试修复后的插件
bun run examples/test-zerion-plugin.ts
```

## 注意事项

⚠️ **重要**：由于修改的是 `node_modules` 中的文件，每次运行 `bun install` 后都需要重新应用此修复。

### 自动化修复方案

1. **使用 patch-package**（推荐）：

   ```bash
   bun add -D patch-package
   bun patch-package @elizaos/plugin-zerion
   ```

2. **使用 postinstall 脚本**：
   在 `package.json` 中添加：
   ```json
   {
     "scripts": {
       "postinstall": "bash scripts/patch-zerion-plugin.sh"
     }
   }
   ```

## 验证结果

修复后，API 请求应该返回 200 OK 状态码，并能成功获取钱包数据：

```
✅ 状态码: 200 OK
💼 投资组合概览:
   总价值: $XXX.XX
   24h 变化: X.XX%
```

## 相关文件

- 修复脚本：`scripts/patch-zerion-plugin.sh`
- 测试脚本：`examples/test-zerion-plugin.ts`
- 正确认证示例：`examples/query-zerion-correct-auth.ts`

## 上游修复

建议向 ElizaOS 团队提交 PR 修复此问题：

- 仓库：https://github.com/elizaos/eliza
- 插件路径：`packages/plugin-zerion/src/providers/index.ts`
