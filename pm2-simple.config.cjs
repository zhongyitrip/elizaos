/**
 * PM2 简化配置：只运行一个 ElizaOS 实例
 * 
 * 使用方式：
 *   pm2 start pm2-simple.config.cjs    # 启动
 *   pm2 stop elizaos                   # 停止
 *   pm2 restart elizaos                # 重启
 *   pm2 logs elizaos                   # 查看日志
 *   pm2 monit                          # 监控面板
 */

module.exports = {
    apps: [
        {
            // 实例名称
            name: 'elizaos',

            // 工作目录
            cwd: '/Users/zy/elizaos',

            // 启动脚本 - 使用 bun start
            script: 'bun',
            args: 'run start',

            // 不监视文件变化
            watch: false,

            // 自动重启配置
            autorestart: true,
            max_restarts: 10,
            min_uptime: '10s',
            restart_delay: 3000,

            // 日志配置
            error_file: '/Users/zy/.pm2/logs/elizaos-error.log',
            out_file: '/Users/zy/.pm2/logs/elizaos-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            merge_logs: true,

            // 环境变量（从 .env 文件自动加载）
            env: {
                NODE_ENV: 'development',
            },

            env_production: {
                NODE_ENV: 'production',
            },
        },
    ],
};
