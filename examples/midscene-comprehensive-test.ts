/**
 * Midscene.js 综合测试 - 纯视觉模型驱动的 UI 自动化
 * 
 * 测试场景:
 * 1. 基础视觉查询 - 识别页面元素
 * 2. AI 驱动操作 - 点击、输入、导航
 * 3. 复杂场景 - 多步骤自动化流程
 * 4. 性能测试 - 响应时间和准确性
 * 
 * 运行: bun run examples/midscene-comprehensive-test.ts
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

interface TestResult {
    name: string;
    success: boolean;
    duration: number;
    error?: string;
    details?: string;
}

async function main() {
    console.log('🚀 Midscene.js 综合 UI 自动化测试\n');
    console.log('='.repeat(80));

    // 检查配置
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error('❌ 错误: OPENROUTER_API_KEY 未配置');
        console.log('请在 .env 文件中设置 OPENROUTER_API_KEY');
        process.exit(1);
    }

    // 配置 Midscene 使用 OpenRouter
    // 使用最快的视觉模型
    const visionModel = process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.0-flash-exp:free';

    process.env.MIDSCENE_MODEL_BASE_URL = 'https://openrouter.ai/api/v1';
    process.env.MIDSCENE_MODEL_API_KEY = apiKey;
    process.env.MIDSCENE_MODEL_NAME = visionModel;

    console.log('✅ 配置信息:');
    console.log(`   - 视觉模型: ${visionModel}`);
    console.log(`   - API Key: ${apiKey.slice(0, 15)}...`);
    console.log(`   - 报告目录: midscene_run/report/`);
    console.log('='.repeat(80));
    console.log('');

    const results: TestResult[] = [];

    // 启动浏览器
    console.log('🌐 启动浏览器...\n');
    const browser = await chromium.launch({
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security'
        ]
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });

    const page = await context.newPage();
    const agent = new PlaywrightAgent(page);

    try {
        // ========== 测试 1: 基础页面访问 ==========
        await runTest(results, '基础页面访问', async () => {
            console.log('📍 访问 GitHub 首页...');
            await page.goto('https://github.com', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            await page.waitForTimeout(2000);
            return '成功加载 GitHub 首页';
        });

        // ========== 测试 2: 视觉元素识别 ==========
        await runTest(results, '视觉元素识别', async () => {
            console.log('📍 使用 AI 视觉识别页面元素...');
            const result = await agent.aiQuery('页面顶部有哪些主要的导航链接？请列出3-5个');
            return `识别成功: ${result.substring(0, 100)}...`;
        });

        // ========== 测试 3: 页面状态判断 ==========
        await runTest(results, '页面状态判断', async () => {
            console.log('📍 判断用户登录状态...');
            const result = await agent.aiQuery('用户当前是否已登录？请回答是或否');
            return `状态判断: ${result}`;
        });

        // ========== 测试 4: AI 驱动点击操作 ==========
        await runTest(results, 'AI 驱动点击操作', async () => {
            console.log('📍 使用 AI 定位并点击搜索框...');
            await agent.aiAction('点击页面顶部的搜索框');
            await page.waitForTimeout(1000);
            return '成功点击搜索框';
        });

        // ========== 测试 5: AI 驱动输入操作 ==========
        await runTest(results, 'AI 驱动输入操作', async () => {
            console.log('📍 使用 AI 在搜索框输入文字...');
            await agent.aiAction('在搜索框中输入 "playwright automation"');
            await page.waitForTimeout(1500);
            return '成功输入搜索关键词';
        });

        // ========== 测试 6: 复杂多步骤操作 ==========
        await runTest(results, '复杂多步骤操作', async () => {
            console.log('📍 执行搜索并分析结果...');

            // 触发搜索
            await page.keyboard.press('Enter');
            await page.waitForTimeout(3000);

            // 分析搜索结果
            const result = await agent.aiQuery('搜索结果页面显示了哪些仓库？请列出前2个仓库名称');
            return `搜索完成，结果: ${result.substring(0, 100)}...`;
        });

        // ========== 测试 7: 元素定位准确性 ==========
        await runTest(results, '元素定位准确性', async () => {
            console.log('📍 测试精确元素定位...');
            await page.goto('https://github.com/features', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            const result = await agent.aiQuery('页面上有多少个功能卡片或特性介绍？');
            return `定位结果: ${result}`;
        });

        // ========== 测试 8: 视觉内容提取 ==========
        await runTest(results, '视觉内容提取', async () => {
            console.log('📍 提取页面关键信息...');
            const result = await agent.aiQuery('页面主标题是什么？请只返回标题文字');
            return `提取内容: ${result}`;
        });

        // ========== 测试 9: 条件判断与决策 ==========
        await runTest(results, '条件判断与决策', async () => {
            console.log('📍 测试 AI 条件判断能力...');
            const hasSignUp = await agent.aiQuery('页面上是否有"Sign up"或"注册"按钮？请只回答是或否');

            if (hasSignUp.toLowerCase().includes('是') || hasSignUp.toLowerCase().includes('yes')) {
                return `条件判断成功: 检测到注册按钮`;
            } else {
                return `条件判断成功: 未检测到注册按钮`;
            }
        });

        // ========== 测试 10: 性能压力测试 ==========
        await runTest(results, '性能压力测试', async () => {
            console.log('📍 连续执行多个查询...');
            const queries = [
                '页面背景颜色是什么？',
                '页面上有几个按钮？',
                '页面布局是单列还是多列？'
            ];

            const queryResults = [];
            for (const query of queries) {
                const result = await agent.aiQuery(query);
                queryResults.push(result.substring(0, 30));
            }

            return `完成 ${queries.length} 个连续查询`;
        });

    } catch (error) {
        console.error('\n❌ 测试过程中发生错误:', error);
    } finally {
        // 生成测试报告
        generateReport(results);

        console.log('\n⏳ 10秒后关闭浏览器...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

/**
 * 运行单个测试
 */
async function runTest(
    results: TestResult[],
    name: string,
    testFn: () => Promise<string>
): Promise<void> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 测试: ${name}`);
    console.log('-'.repeat(80));

    const startTime = Date.now();

    try {
        const details = await testFn();
        const duration = Date.now() - startTime;

        results.push({
            name,
            success: true,
            duration,
            details
        });

        console.log(`✅ 成功 - 耗时: ${duration}ms`);
        console.log(`   ${details}`);

    } catch (error: any) {
        const duration = Date.now() - startTime;
        const errorMsg = error.message || String(error);

        results.push({
            name,
            success: false,
            duration,
            error: errorMsg
        });

        console.log(`❌ 失败 - 耗时: ${duration}ms`);
        console.log(`   错误: ${errorMsg.substring(0, 100)}`);

        // 检查是否是速率限制
        if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
            console.log('   ⚠️  模型被限流 (免费模型限制)');
            console.log('   💡 建议: 等待1-2分钟或切换到付费模型');
        }
    }
}

/**
 * 生成测试报告
 */
function generateReport(results: TestResult[]): void {
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('📊 测试报告');
    console.log('='.repeat(80));

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / results.length;

    console.log(`\n总体统计:`);
    console.log(`  - 总测试数: ${results.length}`);
    console.log(`  - ✅ 成功: ${successCount} (${(successCount / results.length * 100).toFixed(1)}%)`);
    console.log(`  - ❌ 失败: ${failCount} (${(failCount / results.length * 100).toFixed(1)}%)`);
    console.log(`  - 总耗时: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`  - 平均耗时: ${avgDuration.toFixed(0)}ms/测试`);

    // 详细结果
    console.log('\n\n详细结果:');
    console.log('┌' + '─'.repeat(78) + '┐');
    console.log(`│ ${'测试名称'.padEnd(35)} ${'状态'.padEnd(8)} ${'耗时'.padEnd(12)} ${'备注'.padEnd(20)} │`);
    console.log('├' + '─'.repeat(78) + '┤');

    results.forEach(result => {
        const name = result.name.length > 33 ? result.name.substring(0, 30) + '...' : result.name;
        const status = result.success ? '✅ 成功' : '❌ 失败';
        const duration = `${result.duration}ms`;
        const note = result.success
            ? (result.details?.substring(0, 18) || '')
            : (result.error?.substring(0, 18) || '');

        console.log(`│ ${name.padEnd(35)} ${status.padEnd(8)} ${duration.padEnd(12)} ${note.padEnd(20)} │`);
    });

    console.log('└' + '─'.repeat(78) + '┘');

    // 性能分析
    const successResults = results.filter(r => r.success);
    if (successResults.length > 0) {
        const sortedBySpeed = [...successResults].sort((a, b) => a.duration - b.duration);

        console.log('\n\n性能排行 (最快的3个测试):');
        sortedBySpeed.slice(0, 3).forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.name}: ${result.duration}ms`);
        });

        console.log('\n最慢的3个测试:');
        sortedBySpeed.slice(-3).reverse().forEach((result, index) => {
            console.log(`  ${index + 1}. ${result.name}: ${result.duration}ms`);
        });
    }

    // 失败分析
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
        console.log('\n\n失败测试分析:');
        failedResults.forEach(result => {
            console.log(`\n  ❌ ${result.name}`);
            console.log(`     错误: ${result.error}`);
        });
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('📁 详细报告位置: midscene_run/report/');
    console.log('💡 提示: 打开 HTML 报告可以看到每个步骤的截图和 AI 分析过程');
    console.log('='.repeat(80));
}

main().catch(console.error);
