# @elizaos/plugin-airdrop-web

ElizaOS plugin for **web-based** airdrop hunting with browser automation.

## 🎯 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      PM2 进程管理器                          │
│                    启动 10 个实例                            │
└─────────────────────────────────────────────────────────────┘
                              │
    ┌─────────┬─────────┬─────────┬─────────┬─────────┐
    │ pm2-0   │ pm2-1   │ pm2-2   │ ...     │ pm2-9   │
    │ Agent   │ Agent   │ Agent   │         │ Agent   │
    └────┬────┴────┬────┴────┬────┴─────────┴────┬────┘
         │         │         │                   │
         └─────────┴────┬────┴───────────────────┘
                        ▼
    ┌─────────────────────────────────────────────────────┐
    │              PostgreSQL / Supabase                  │
    │  UPDATE eoa_tasks SET status='running', worker=?    │
    │  WHERE status='pending' LIMIT 1 RETURNING *         │
    └─────────────────────────────────────────────────────┘
```

- **每个 EOA 是独立进程**
- **分批次运行**：同时最多 10 个进程
- **工人视角**：每个 Agent 只管干活，干完一个拿一个

## 📦 Structure

```
packages/plugin-airdrop-web/
├── src/                          # Source code
│   ├── index.ts                  # Plugin entry point
│   ├── character-template.ts     # Character template
│   └── services/                 # Services
│       ├── character-generator.ts
│       └── batch-processor.ts
├── scripts/                      # Executable scripts
│   ├── generate-eoa-addresses.ts
│   └── process-airdrops.ts
├── __tests__/                    # Tests
│   └── character-generator.test.ts
├── characters/                   # Character templates
│   └── airdrop-hunter-template.json
├── database-schema.sql           # Database setup
├── package.json
└── README.md
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd /Users/zy/elizaos
bun install
```

### 2. Setup Database

Run `database-schema.sql` in your Supabase SQL Editor.

### 3. Configure Environment

Add to `/Users/zy/elizaos/.env`:
```bash
HD_WALLET_MNEMONIC="your mnemonic"
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

### 4. Generate EOA Addresses

```bash
cd packages/plugin-airdrop-web
bun run generate-eoa
```

### 5. Process Airdrops

```bash
cd packages/plugin-airdrop-web
bun run process-airdrops
```

## 🧪 Testing

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch
```

## 🔧 Development

```bash
# Build
bun run build

# Watch mode
bun run dev

# Clean
bun run clean
```

## 📚 Usage in Character

```json
{
  "name": "0xabc123...def",
  "plugins": [
    "@elizaos/plugin-sql",
    "@elizaos/plugin-bootstrap",
    "@elizaos/plugin-airdrop-web"
  ],
  "settings": {
    "secrets": {
      "EOA_ADDRESS": "0xabc123...def",
      "EOA_PRIVATE_KEY": "..."
    }
  }
}
```

## 📄 License

Part of ElizaOS
