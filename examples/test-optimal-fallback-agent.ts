/**
 * Midscene OptimalFallbackAgent 综合测试
 * 
 * 使用免费模型池 + 智能回退策略
 * 测试场景: GitHub 自动化操作
 * 
 * 运行: bun run examples/test-optimal-fallback-agent.ts
 */

import { chromium } from 'playwright';
import { OptimalFallbackAgent } from '../custom-agents/midscene/OptimalFallbackAgent';

async function main() {
    console.log('🚀 Midscene OptimalFallbackAgent 综合测试\n');
    console.log('='.repeat(80));
    console.log('策略: 免费优先 → 速度优先 → 智能回退');
    console.log('='.repeat(80));

    // 启动浏览器
    console.log('\n🌐 启动浏览器...');
    const browser = await chromium.launch({
        headless: false,
        args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    // 创建 OptimalFallbackAgent (启用缓存)
    const agent = new OptimalFallbackAgent(page, {
        cache: {
            enabled: true,
            id: 'optimal-fallback-test',
            strategy: 'read-write'
        }
    });

    try {
        // ========== 测试 1: 访问页面 ==========
        console.log('\n📍 测试 1: 访问 GitHub 首页...');
        await page.goto('https://github.com', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(2000);
        console.log('✅ 页面加载完成\n');

        // ========== 测试 2: AI 视觉查询 ==========
        console.log('📍 测试 2: AI 视觉查询页面元素');
        await agent.smartAction('请告诉我页面顶部有哪些主要的导航链接');

        await page.waitForTimeout(2000);

        // ========== 测试 3: AI 驱动点击 ==========
        console.log('\n📍 测试 3: AI 驱动点击操作');
        await agent.smartAction('点击页面顶部的搜索框');

        await page.waitForTimeout(1500);

        // ========== 测试 4: AI 驱动输入 ==========
        console.log('\n📍 测试 4: AI 驱动输入操作');
        await agent.smartAction('在搜索框中输入 "playwright automation"');

        await page.waitForTimeout(1500);

        // ========== 测试 5: 触发搜索 ==========
        console.log('\n📍 测试 5: 触发搜索');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);

        // ========== 测试 6: 分析搜索结果 ==========
        console.log('\n📍 测试 6: 分析搜索结果');
        await agent.smartAction('请告诉我搜索结果页面显示了哪些仓库，列出前2个');

        await page.waitForTimeout(2000);

        // ========== 测试 7: 页面导航 ==========
        console.log('\n📍 测试 7: 页面导航');
        await page.goto('https://github.com/features', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        // ========== 测试 8: 复杂视觉理解 ==========
        console.log('\n📍 测试 8: 复杂视觉理解');
        await agent.smartAction('请描述页面的主要内容和布局');

        await page.waitForTimeout(2000);

        // ========== 测试 9: 条件判断 ==========
        console.log('\n📍 测试 9: 条件判断');
        await agent.smartAction('页面上是否有 Sign up 或注册按钮？');

        await page.waitForTimeout(2000);

        // ========== 测试 10: 元素定位 ==========
        console.log('\n📍 测试 10: 精确元素定位');
        await agent.smartAction('页面上有多少个功能卡片或特性介绍？');

        // 刷新缓存
        console.log('\n💾 刷新缓存到文件...');
        await agent.flushCache({ cleanUnused: true });

        // 打印统计报告
        agent.printStats();

        console.log('\n🎉 所有测试完成！');
        console.log('📊 查看详细报告: midscene_run/report/');
        console.log('💾 缓存文件: midscene_run/cache/');

    } catch (error) {
        console.error('\n❌ 测试失败:', error);
    } finally {
        console.log('\n⏳ 10秒后关闭浏览器...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
}

main().catch(console.error);
