# ElizaOS Agent 完整架构解析

## 🏗️ Agent 的四大组成部分

一个完整的 ElizaOS Agent 由以下 **4个核心部分** 组成：

```
Agent = Character + Plugin + Action + Provider
```

---

## 1️⃣ Character（角色/人格）

### **定义**
> Agent 的"身份证"和"人格设定"

### **作用**
- 定义 Agent 是谁（name, bio）
- 定义 Agent 的行为方式（system prompt, style）
- 配置 Agent 使用的插件和模型

### **必填字段**
```typescript
{
  name: string;           // ✅ 必填：主要标识符
  system?: string;        // ✅ 推荐：行为定义
  bio: string | string[]; // ✅ 必填：角色简介
}
```

### **类比**
- 就像一个人的**身份证 + 性格特征**
- 定义了"我是谁"和"我的行为风格"

### **示例**
```json
{
  "name": "0x2e5D0a4072cee407642F45ffeB2F7c6494c2caFe",
  "system": "You are an airdrop hunting agent...",
  "bio": ["Specialized in Web3 DApp interactions"],
  "plugins": ["@elizaos/plugin-airdrop"]
}
```

---

## 2️⃣ Plugin（插件）

### **定义**
> 功能模块的集合，打包了 Actions、Providers、Services 等

### **作用**
- **组织和打包功能**：将相关的 Actions、Providers 组织在一起
- **模块化**：可以独立开发、测试、发布
- **可复用**：一个 Plugin 可以被多个 Agent 使用

### **结构**
```typescript
interface Plugin {
  name: string;
  description: string;
  
  // 插件可以包含：
  actions?: Action[];      // 可执行的动作
  providers?: Provider[];  // 数据提供者
  evaluators?: Evaluator[]; // 评估器
  services?: Service[];    // 服务
  // ... 其他组件
}
```

### **类比**
- 就像手机的 **App**
- 一个 App（Plugin）里包含多个功能（Actions）和数据源（Providers）

### **示例**
```typescript
// @elizaos/plugin-airdrop
export const airdropPlugin: Plugin = {
  name: "airdrop",
  description: "Airdrop hunting functionality",
  actions: [LOGIN_LENS, INTERACT_UNISWAP],  // 包含多个 Actions
  providers: [walletProvider, taskProvider], // 包含多个 Providers
};
```

---

## 3️⃣ Action（动作/行为）

### **定义**
> Agent 可以执行的**具体操作**

### **作用**
- **执行具体任务**：登录、交易、发帖等
- **响应用户指令**：当用户说"登录 Lens"时触发
- **自主决策执行**：AI 判断需要执行某个 Action

### **结构**
```typescript
interface Action {
  name: string;           // Action 名称
  description: string;    // 详细描述
  examples?: string[][];  // 触发示例
  
  validate: Validator;    // 验证是否应该执行
  handler: Handler;       // 执行逻辑
}
```

### **类比**
- 就像一个人的**技能**或**能力**
- "我会登录 Lens"、"我会执行交易"

### **示例**
```typescript
export const LOGIN_LENS: Action = {
  name: "LOGIN_LENS",
  description: "Login to Lens Protocol using wallet",
  
  validate: async (runtime, message) => {
    // 判断是否应该执行这个 Action
    return message.content.includes("login lens");
  },
  
  handler: async (runtime, message) => {
    // 执行登录逻辑
    await loginToLens(runtime.wallet);
    return { success: true };
  }
};
```

---

## 4️⃣ Provider（提供者/数据源）

### **定义**
> 为 Agent 提供**上下文信息**和**数据**

### **作用**
- **提供决策依据**：当前钱包余额、任务状态等
- **增强 AI 理解**：将数据注入到 AI 的上下文中
- **动态数据获取**：实时查询链上数据、数据库等

### **结构**
```typescript
interface Provider {
  name: string;
  description?: string;
  
  get: (runtime, message, state) => Promise<ProviderResult>;
}
```

### **类比**
- 就像一个人的**信息来源**或**知识库**
- "我知道当前钱包有多少钱"、"我知道今天的任务列表"

### **示例**
```typescript
export const walletProvider: Provider = {
  name: "wallet",
  description: "Provides current wallet balance and address",
  
  get: async (runtime, message, state) => {
    const balance = await getWalletBalance(runtime.wallet);
    
    return {
      text: `Current wallet: ${runtime.wallet.address}, Balance: ${balance} ETH`
    };
  }
};
```

---

## 🔗 四者的关系

### **层级关系**
```
Agent (运行时实例)
  ├─ Character (身份和配置)
  │   └─ plugins: ["@elizaos/plugin-airdrop"]  // 声明使用哪些 Plugin
  │
  └─ Runtime (运行时环境)
      ├─ Plugins (加载的插件)
      │   └─ @elizaos/plugin-airdrop
      │       ├─ Actions (可执行的动作)
      │       │   ├─ LOGIN_LENS
      │       │   └─ INTERACT_UNISWAP
      │       └─ Providers (数据提供者)
      │           ├─ walletProvider
      │           └─ taskProvider
```

### **工作流程**

```mermaid
graph TD
    A[用户消息: "登录 Lens"] --> B[Agent Runtime]
    B --> C{查询 Providers}
    C --> D[walletProvider: 获取钱包信息]
    C --> E[taskProvider: 获取任务状态]
    D --> F[AI 决策]
    E --> F
    F --> G{选择 Action}
    G --> H[LOGIN_LENS.validate]
    H -->|通过| I[LOGIN_LENS.handler]
    I --> J[执行登录]
    J --> K[返回结果]
```

### **协作关系**

| 组件 | 职责 | 何时使用 |
|------|------|----------|
| **Character** | 定义"我是谁" | Agent 初始化时 |
| **Plugin** | 打包功能模块 | 开发和分发功能时 |
| **Provider** | 提供上下文数据 | AI 决策前，获取信息 |
| **Action** | 执行具体任务 | AI 决策后，执行操作 |

---

## 📝 实际案例：Airdrop Hunter Agent

### **1. Character 配置**
```json
{
  "name": "0x2e5D0a4072cee407642F45ffeB2F7c6494c2caFe",
  "system": "You are an airdrop hunting agent...",
  "plugins": ["@elizaos/plugin-airdrop"]
}
```

### **2. Plugin 定义**
```typescript
// @elizaos/plugin-airdrop/src/index.ts
export const airdropPlugin: Plugin = {
  name: "airdrop",
  actions: [LOGIN_LENS, INTERACT_UNISWAP],
  providers: [walletProvider, taskProvider]
};
```

### **3. Provider 提供数据**
```typescript
// 提供钱包信息
export const walletProvider: Provider = {
  name: "wallet",
  get: async (runtime) => ({
    text: `Wallet: ${runtime.wallet.address}, Balance: 1.5 ETH`
  })
};
```

### **4. Action 执行任务**
```typescript
// 登录 Lens
export const LOGIN_LENS: Action = {
  name: "LOGIN_LENS",
  validate: async (runtime, message) => {
    return message.content.includes("login lens");
  },
  handler: async (runtime) => {
    await loginToLens(runtime.wallet);
    return { success: true };
  }
};
```

### **5. 完整流程**
```
1. 用户: "帮我登录 Lens"
2. Agent 加载 Character 配置
3. Agent 加载 @elizaos/plugin-airdrop
4. Provider 提供钱包信息给 AI
5. AI 决策: 需要执行 LOGIN_LENS
6. Action.validate: 验证通过
7. Action.handler: 执行登录
8. 返回结果: "已成功登录 Lens"
```

---

## 🎯 总结对比

| 组件 | 类比 | 作用 | 数量 |
|------|------|------|------|
| **Character** | 身份证 + 性格 | 定义"我是谁" | 每个 Agent 1个 |
| **Plugin** | 手机 App | 打包功能模块 | 每个 Agent 可用多个 |
| **Action** | 技能/能力 | 执行具体任务 | 每个 Plugin 包含多个 |
| **Provider** | 信息来源 | 提供决策数据 | 每个 Plugin 包含多个 |

### **记忆口诀**
```
Character 是"谁"（身份）
Plugin 是"包"（功能包）
Provider 是"知"（知道什么）
Action 是"做"（做什么）
```

---

## 💡 针对你的 30,000 EOA 场景

### **Character**
- 每个 EOA 一个 Character
- `name` = EOA 地址

### **Plugin**
- 所有 EOA 共享 `@elizaos/plugin-airdrop`
- 一次开发，30,000 个 Agent 复用

### **Action**
- `LOGIN_LENS`, `INTERACT_UNISWAP` 等
- 所有 Agent 共享相同的 Actions

### **Provider**
- `walletProvider`: 每个 Agent 获取自己的钱包信息
- `taskProvider`: 每个 Agent 获取自己的任务列表

**优势**：
- ✅ Character 简单（只有 name 不同）
- ✅ Plugin 复用（所有 Agent 共享）
- ✅ Action 统一（行为一致）
- ✅ Provider 动态（数据个性化）
