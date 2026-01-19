module.exports = {
  apps: [
    {
      name: 'elizaos',
      cwd: '/Users/zy/elizaos/packages/cli',
      script: 'dist/index.js',
      args: 'start --character ../../characters/0x2e5d0a4072cee407642f45ffeb2f7c6494c2cafe.character.json',
      interpreter: 'bun',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      error_file: '/Users/zy/.pm2/logs/elizaos-error.log',
      out_file: '/Users/zy/.pm2/logs/elizaos-out.log',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
