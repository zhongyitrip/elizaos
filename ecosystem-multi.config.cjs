// PM2 配置：管理多个 Agent
module.exports = {
  apps: [
    {
      name: 'agent-0x2e5d',
      cwd: '/Users/zy/elizaos/packages/cli',
      script: 'dist/index.js',
      args: 'start --character ../../characters/0x2e5d0a4072cee407642f45ffeb2f7c6494c2cafe.character.json',
      interpreter: 'bun',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        PORT: '3000'
      }
    },
    // 添加更多 Agent 配置
    // {
    //   name: 'agent-0xABCD',
    //   cwd: '/Users/zy/elizaos/packages/cli',
    //   script: 'dist/index.js',
    //   args: 'start --character ../../characters/0xABCD....character.json',
    //   interpreter: 'bun',
    //   watch: false,
    //   autorestart: true,
    //   max_restarts: 10,
    //   min_uptime: '10s',
    //   env: {
    //     NODE_ENV: 'production',
    //     PORT: '3001'
    //   }
    // },
    // ... 继续添加到 10 个
  ]
};
