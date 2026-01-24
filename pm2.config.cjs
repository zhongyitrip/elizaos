/**
 * PM2 配置：管理 10 个并发 ElizaOS Agent 实例
 * 
 * 架构：
 * - 每个实例运行 1 个 Agent，处理 1 个 EOA
 * - 工人模式：从数据库领取任务 → 执行 → 标记完成 → 循环
 * - 同时最多 10 个实例并发运行
 * 
 * 使用方式：
 *   pm2 start ecosystem-airdrop.config.cjs          # 启动所有实例
 *   pm2 stop ecosystem-airdrop.config.cjs           # 停止所有实例
 *   pm2 restart ecosystem-airdrop.config.cjs        # 重启所有实例
 *   pm2 logs                                        # 查看日志
 *   pm2 monit                                       # 监控面板
 */

const path = require('path');

// 配置参数
const CONFIG = {
    // 并发实例数量
    instances: 10,

    // 基础端口号 (依次递增: 3000, 3001, ..., 3009)
    basePort: 3000,

    // 项目路径
    projectRoot: '/Users/zy/elizaos',

    // Character 文件目录
    characterDir: 'agents',  // 相对于 projectRoot

    // Chrome 用户数据目录
    chromeDataDir: '/Users/zy/elizaos/chrome-data',

    // 日志目录
    logDir: '/Users/zy/.pm2/logs/airdrop',
};

/**
 * 生成单个实例配置
 * @param {number} index - 实例索引 (0-9)
 */
function createAppConfig(index) {
    const instanceId = index.toString().padStart(2, '0');
    const port = CONFIG.basePort + index;

    return {
        // 实例名称
        name: `airdrop-worker-${instanceId}`,

        // 工作目录 (CLI 所在目录)
        cwd: path.join(CONFIG.projectRoot, 'packages/cli'),

        // 启动脚本
        script: 'dist/index.js',

        // 启动参数 - 使用 Worker 模式，不指定固定 character
        // Agent 会从数据库动态领取任务
        args: 'start --isWorker',

        // 使用 bun 运行
        interpreter: 'bun',

        // 不监视文件变化
        watch: false,

        // 自动重启配置
        autorestart: true,
        max_restarts: 10,
        min_uptime: '30s',
        restart_delay: 5000,  // 重启延迟 5 秒

        // 日志配置
        error_file: path.join(CONFIG.logDir, `worker-${instanceId}-error.log`),
        out_file: path.join(CONFIG.logDir, `worker-${instanceId}-out.log`),
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // 环境变量
        env: {
            NODE_ENV: 'production',

            // 服务端口 (每个实例不同)
            SERVER_PORT: port.toString(),

            // Worker 标识
            WORKER_ID: instanceId,
            WORKER_INDEX: index.toString(),

            // Chrome 用户数据目录 (每个实例独立)
            CHROME_USER_DATA_DIR: path.join(CONFIG.chromeDataDir, `worker-${instanceId}`),

            // 禁用 headless 调试端口冲突
            PLAYWRIGHT_CHROMIUM_DEBUG_PORT: (9222 + index).toString(),
        },

        // 开发环境配置
        env_development: {
            NODE_ENV: 'development',
            SERVER_PORT: port.toString(),
            WORKER_ID: instanceId,
        },
    };
}

// 生成所有实例配置
const apps = [];
for (let i = 0; i < CONFIG.instances; i++) {
    apps.push(createAppConfig(i));
}

module.exports = {
    apps,
};
