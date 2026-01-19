# @elizaos/plugin-airdrop

ElizaOS plugin for managing 30,000 EOA addresses for airdrop hunting.

## 📦 Structure

```
packages/plugin-airdrop/
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
cd packages/plugin-airdrop
bun run generate-eoa
```

### 5. Process Airdrops

```bash
cd packages/plugin-airdrop
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
  "name": "My Agent",
  "plugins": [
    "@elizaos/plugin-sql",
    "@elizaos/plugin-bootstrap",
    "@elizaos/plugin-airdrop"
  ]
}
```

## 📄 License

Part of ElizaOS
