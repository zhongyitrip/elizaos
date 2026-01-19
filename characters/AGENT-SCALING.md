# ElizaOS Agent 数量限制与扩展策略

## 🎯 核心问题解答

### Q1: Agent 有数量限制吗？
**答案：理论上没有硬性限制，但受限于系统资源。**

- ✅ **30,000 个 Agent 定义**：完全可以
- ⚠️ **同时运行 30,000 个**：取决于硬件资源

### Q2: 同时运行有限制吗？
**答案：受限于内存、CPU、数据库连接等资源。**

实际限制因素：
- **内存**：每个 Agent Runtime 占用内存
- **CPU**：AI 推理和任务执行占用 CPU
- **数据库连接**：Supabase 连接池限制
- **Ollama 并发**：本地模型推理能力

### Q3: 可以共享 Plugin、Action、Provider 吗？
**答案：完全可以！这正是 ElizaOS 的设计优势。**

- ✅ **Plugin 共享**：所有 Agent 使用同一个 `@elizaos/plugin-airdrop`
- ✅ **Action 共享**：所有 Agent 共享 `LOGIN_LENS`、`INTERACT_UNISWAP` 等
- ✅ **Provider 共享**：代码共享，但数据个性化

---

## 📊 资源消耗分析

### **方案对比**

| 组件 | 存储方式 | 内存占用 | 是否共享 |
|------|---------|---------|---------|
| **Character** | 每个 Agent 独立 | 极小（JSON 配置） | ❌ 不共享 |
| **Plugin** | 代码级别 | 一次加载 | ✅ 完全共享 |
| **Action** | Plugin 内部 | 一次加载 | ✅ 完全共享 |
| **Provider** | Plugin 内部 | 一次加载 | ✅ 代码共享 |
| **Runtime** | 每个 Agent 独立 | 较大（运行时状态） | ❌ 不共享 |

### **内存估算**

假设单个 Agent Runtime 占用 **50MB** 内存：

| Agent 数量 | 总内存占用 | 可行性 |
|-----------|-----------|--------|
| 1 个 | 50 MB | ✅ 轻松 |
| 10 个 | 500 MB | ✅ 轻松 |
| 100 个 | 5 GB | ✅ 可行 |
| 1,000 个 | 50 GB | ⚠️ 需要服务器 |
| 30,000 个 | 1,500 GB (1.5 TB) | ❌ 不现实 |

**结论**：不能同时运行 30,000 个 Agent Runtime。

---

## 🎯 推荐方案：分批运行

### **策略 1: 按需激活（推荐）**

不是同时运行 30,000 个 Agent，而是：

```typescript
// 1. 定义 30,000 个 Character 配置（轻量级）
const allCharacters = await loadAllEOACharacters(); // 30,000 个

// 2. 按需激活部分 Agent（例如 100 个）
const activeAgents = await activateAgents(allCharacters.slice(0, 100));

// 3. 执行任务
await executeAirdropTasks(activeAgents);

// 4. 释放资源，激活下一批
await deactivateAgents(activeAgents);
const nextBatch = await activateAgents(allCharacters.slice(100, 200));
```

**优点**：
- ✅ 资源可控（只运行 100 个 Runtime）
- ✅ 所有 30,000 个 EOA 都有 Character 定义
- ✅ 按需激活，轮流执行

### **策略 2: 任务队列模式**

```typescript
// 1. 所有 EOA 的任务放入队列
const taskQueue = await createTaskQueue(30000);

// 2. 固定数量的 Worker Agents（例如 100 个）
const workerAgents = await createWorkerPool(100);

// 3. Worker 从队列取任务执行
while (taskQueue.hasNext()) {
    const task = taskQueue.next();
    const agent = workerAgents.getAvailable();
    await agent.execute(task);
}
```

**优点**：
- ✅ 固定资源消耗（100 个 Worker）
- ✅ 高效利用资源
- ✅ 类似线程池模式

### **策略 3: 无状态 Agent（最轻量）**

```typescript
// 不创建持久的 Agent Runtime
// 每次执行任务时临时创建，执行完销毁

async function executeTask(eoaAddress: string, task: Task) {
    // 1. 临时创建 Agent
    const character = generateCharacterForEOA(eoaAddress);
    const agent = await createAgent(character);
    
    // 2. 执行任务
    const result = await agent.execute(task);
    
    // 3. 销毁 Agent，释放资源
    await agent.destroy();
    
    return result;
}

// 并发控制：同时最多 100 个
const results = await pMap(
    eoaTasks,
    (task) => executeTask(task.eoaAddress, task),
    { concurrency: 100 }
);
```

**优点**：
- ✅ 内存占用最小
- ✅ 可以处理 30,000 个 EOA
- ✅ 并发可控

---

## 💡 你的场景最佳实践

### **架构设计**

```
30,000 个 EOA
  ├─ 30,000 个 Character 配置（存储在数据库或文件）
  ├─ 1 个共享的 @elizaos/plugin-airdrop
  │   ├─ Actions: LOGIN_LENS, INTERACT_UNISWAP, ...
  │   └─ Providers: walletProvider, taskProvider, ...
  │
  └─ 运行时：按需激活 100-500 个 Agent Runtime
```

### **实现方案**

#### **1. Character 配置（轻量级，30,000 个）**
```typescript
// 存储在数据库
const characters = await supabase
    .from('eoa_accounts')
    .select('address')
    .then(data => data.map(row => ({
        name: row.address,
        plugins: ['@elizaos/plugin-airdrop'],
        // ... 其他配置
    })));
```

#### **2. 共享资源（一次加载）**
```typescript
// 所有 Agent 共享同一个 Plugin
import { airdropPlugin } from '@elizaos/plugin-airdrop';

// Plugin 只加载一次，包含所有 Actions 和 Providers
```

#### **3. 分批运行（资源可控）**
```typescript
// 每批 100 个 Agent
const BATCH_SIZE = 100;

for (let i = 0; i < characters.length; i += BATCH_SIZE) {
    const batch = characters.slice(i, i + BATCH_SIZE);
    
    // 创建 Agent Runtime
    const agents = await Promise.all(
        batch.map(char => createAgent(char))
    );
    
    // 执行任务
    await Promise.all(
        agents.map(agent => agent.executeAirdropTasks())
    );
    
    // 销毁释放资源
    await Promise.all(
        agents.map(agent => agent.destroy())
    );
}
```

---

## 📈 性能优化建议

### **1. 资源共享最大化**
```typescript
// ✅ 好：所有 Agent 共享 Plugin
const sharedPlugin = airdropPlugin;

// ❌ 差：每个 Agent 加载自己的 Plugin
// 会导致内存浪费
```

### **2. 按需加载 Character**
```typescript
// ✅ 好：从数据库按需加载
const activeCharacters = await loadActiveEOAs({ limit: 100 });

// ❌ 差：一次性加载 30,000 个到内存
const allCharacters = await loadAllEOAs(); // 30,000 个
```

### **3. 并发控制**
```typescript
import pMap from 'p-map';

// ✅ 好：控制并发数
await pMap(tasks, executeTask, { concurrency: 100 });

// ❌ 差：无限并发
await Promise.all(tasks.map(executeTask)); // 可能崩溃
```

### **4. 资源池模式**
```typescript
// 创建 Agent 池
const agentPool = new AgentPool({
    size: 100,
    sharedPlugin: airdropPlugin
});

// 复用 Agent
const agent = await agentPool.acquire();
await agent.execute(task);
agentPool.release(agent);
```

---

## 🎯 硬件建议

### **同时运行 100 个 Agent**
- **内存**: 8-16 GB
- **CPU**: 8 核心
- **数据库**: Supabase（云端，无需担心）
- **Ollama**: 本地模型，建议 GPU 加速

### **同时运行 500 个 Agent**
- **内存**: 32-64 GB
- **CPU**: 16+ 核心
- **建议**: 服务器或高配 Mac

### **处理 30,000 个 EOA**
- **方案**: 分批运行（每批 100-500 个）
- **时间**: 假设每批 10 分钟，总共 10-50 小时
- **可行性**: ✅ 完全可行

---

## ✅ 总结回答

### **Q: Agent 有数量限制吗？**
- **定义 30,000 个 Character**：✅ 完全可以
- **同时运行 30,000 个 Runtime**：❌ 不现实

### **Q: 同时运行 100 个可以吗？**
- ✅ **完全可以**，内存需求约 5-10 GB

### **Q: 30,000 个 Agent 可以共享 Plugin/Action/Provider 吗？**
- ✅ **完全可以**，这是最佳实践
- 代码只加载一次，所有 Agent 共享

### **Q: 组合有限制吗？**
- ✅ **没有限制**
- 你可以灵活组合：
  - 30,000 个 Character（每个 EOA 一个）
  - 1 个 Plugin（所有 Agent 共享）
  - N 个 Action（所有 Agent 共享）
  - N 个 Provider（代码共享，数据个性化）

---

## 🚀 推荐实施路径

1. **定义 30,000 个 Character 配置**（存储在 Supabase）
2. **开发 1 个 `@elizaos/plugin-airdrop`**（包含所有 Actions 和 Providers）
3. **实现分批运行机制**（每批 100-500 个 Agent）
4. **监控资源使用**（内存、CPU、数据库连接）
5. **优化并发策略**（根据硬件调整批次大小）

**结论**：你的架构设计完全可行，资源共享策略正确！🎯
