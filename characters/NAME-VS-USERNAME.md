# Character 字段说明: `name` vs `username`

## 官方定义

根据 ElizaOS Web 界面的官方说明：

### `name` (必填) *
> **"The primary identifier for this agent"**
- **主要标识符**
- 用于识别agent的核心名称
- 必填字段

### `username` (可选)
> **"Used in URLs and API endpoints"**
- **用于URL和API端点**
- 系统路由和API调用时使用
- 可选字段

---

## TypeScript 接口定义

```typescript
export interface Character {
  /** Character name */
  name: string;  // 必填

  /** Optional username */
  username?: string;  // 可选
  
  // ... 其他字段
}
```

## 详细说明

### `name` - 主要标识符
- **官方定义**: "The primary identifier for this agent"
- **用途**: 
  - Agent的主要身份标识
  - 在系统中唯一识别agent
  - 显示在界面、日志等位置
- **特点**: 
  - 必填
  - 应该具有唯一性和准确性
  - 可以是完整的标识符

### `username` - URL/API标识
- **官方定义**: "Used in URLs and API endpoints"
- **用途**:
  - API路径: `/api/agents/{username}`
  - URL路由
  - RESTful端点标识
- **特点**:
  - 可选
  - 应该URL友好（简短、小写、无特殊字符）
  - 便于API调用

---

## 针对 EOA 场景的最佳实践

### 推荐方案: 完整EOA作为name + URL友好的username

基于官方定义，对于30,000个EOA地址的场景：

```json
{
  "name": "0x2e5D0a4072cee407642F45ffeB2F7c6494c2caFe",
  "username": "hunter_0x2e5d0a"
}
```

**优点**:
- ✅ `name` 使用完整EOA地址作为"主要标识符"
  - 唯一性：每个EOA地址天然唯一
  - 准确性：直接对应钱包地址
  - 可追溯：可以直接查询链上记录
  
- ✅ `username` 使用简短URL友好格式
  - API友好：`/api/agents/hunter_0x2e5d0a`
  - 简洁：比完整地址短得多
  - 可读：`hunter_` 前缀 + 地址前10位
  
- ✅ 符合官方设计理念
  - `name` = 主要标识符（完整准确）
  - `username` = URL/API标识（简短友好）

**实际使用示例**:

```typescript
// 场景1: 通过 name 精确查找 agent
const agent = agents.find(a => a.character.name === eoaAddress);

// 场景2: 通过 username 构建 API 路径
const apiUrl = `/api/agents/${agent.character.username}/tasks`;
// 结果: /api/agents/hunter_0x2e5d0a/tasks

// 场景3: 日志显示（显示完整地址）
console.log(`[${character.name}] Processing airdrop task`);
// 输出: [0x2e5D0a4072cee407642F45ffeB2F7c6494c2caFe] Processing airdrop task
```

---

## 实际使用示例

### 场景1: 日志输出
```typescript
// 使用 name 作为显示标识
console.log(`[${character.name}] Processing airdrop task`);
// 输出: [AirdropHunter_0x123456] Processing airdrop task

// 而不是:
// 输出: [0x1234567890123456789012345678901234567890] Processing airdrop task
```

### 场景2: 数据库查询
```typescript
// 使用 username 作为唯一标识查询
const agent = agents.find(a => a.character.username === eoaAddress);

// 或者从数据库加载对应的 EOA 配置
const { data } = await supabase
  .from('eoa_accounts')
  .select('*')
  .eq('address', agent.character.username);
```

### 场景3: API 调用
```typescript
// 使用 username 作为 API 参数
await executeAirdropTask({
  agentId: character.username,  // 使用完整地址
  task: 'lens-login'
});
```

---

## 其他可选方案

### 方案2: 都使用完整地址
```json
{
  "name": "0x1234567890123456789012345678901234567890",
  "username": "0x1234567890123456789012345678901234567890"
}
```
- ✅ 完全一致，不会混淆
- ❌ 日志显示太长，不易阅读

### 方案3: 自定义编号
```json
{
  "name": "Hunter_001",
  "username": "0x1234567890123456789012345678901234567890"
}
```
- ✅ `name` 更简洁
- ❌ 需要维护编号映射关系

---

## 总结

对于 30,000 个 EOA 地址的场景：

| 字段 | 值 | 用途 |
|------|-----|------|
| `name` | `AirdropHunter_0x123456` | 显示名称（日志、界面） |
| `username` | `0x1234567890...` | 唯一标识（查询、引用） |

这样既保证了**可读性**（name），又保证了**唯一性和可追溯性**（username）。
