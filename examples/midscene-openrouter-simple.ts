/**
 * Midscene.js + OpenRouter 简单集成示例
 * 
 * 这个脚本展示如何使用 OpenRouter 的视觉模型配合 Midscene 进行浏览器自动化
 * 
 * 运行前准备:
 * 1. 确保 .env 中配置了 OPENROUTER_API_KEY
 * 2. 安装依赖: bun install @midscene/web playwright
 * 3. 运行: bun run examples/midscene-openrouter-simple.ts
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

async function main() {
  console.log('🚀 Midscene + OpenRouter 集成测试\n');
  
  // 检查配置
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ 错误: 请在 .env 中配置 OPENROUTER_API_KEY');
    process.exit(1);
  }

  // 配置 Midscene 使用 OpenRouter
  // Midscene 支持 OpenAI 兼容的 API
  process.env.MIDSCENE_MODEL_BASE_URL = 'https://openrouter.ai/api/v1';
  process.env.MIDSCENE_MODEL_API_KEY = apiKey;
  
  // 使用支持视觉的模型
  // 推荐: google/gemini-2.0-flash-exp:free (免费但可能限流)
  // 备选: anthropic/claude-3.5-sonnet (付费但稳定)
  process.env.MIDSCENE_MODEL_NAME = 'google/gemini-2.0-flash-exp:free';

  console.log('✅ 配置完成:');
  console.log(`   - API: OpenRouter`);
  console.log(`   - Model: ${process.env.MIDSCENE_MODEL_NAME}`);
  console.log(`   - Key: ${apiKey.slice(0, 15)}...`);
  console.log('');

  // 启动浏览器
  console.log('🌐 启动浏览器...');
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  
  const page = await context.newPage();
  
  // 创建 Midscene Agent
  const agent = new PlaywrightAgent(page);

  try {
    // 测试 1: 访问简单页面
    console.log('📍 步骤 1: 访问 GitHub...');
    await page.goto('https://github.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    console.log('   ✅ 页面加载完成');

    // 测试 2: 使用 AI 查询页面内容
    console.log('\n📍 步骤 2: AI 查询页面元素...');
    console.log('   (首次调用可能需要 5-15 秒，请耐心等待)');
    
    try {
      const result = await agent.aiQuery('页面上有哪些主要的导航按钮或链接？请列出 3-5 个');
      console.log('   ✅ 查询成功！');
      console.log('\n   AI 回复:');
      console.log('   ' + result);
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('rate')) {
        console.log('   ⚠️  模型被限流，这是正常的（免费模型限制）');
        console.log('   💡 解决方案:');
        console.log('      1. 等待 1-2 分钟后重试');
        console.log('      2. 或在 .env 中改用付费模型: anthropic/claude-3.5-sonnet');
      } else {
        throw error;
      }
    }

    // 测试 3: 使用 AI 执行操作
    console.log('\n📍 步骤 3: AI 执行点击操作...');
    console.log('   (尝试点击搜索框)');
    
    try {
      await agent.aiAction('点击页面顶部的搜索框');
      console.log('   ✅ 操作成功！');
      
      await page.waitForTimeout(1000);
      
      // 输入文字
      await agent.aiAction('在搜索框中输入 "playwright"');
      console.log('   ✅ 输入成功！');
      
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('rate')) {
        console.log('   ⚠️  模型被限流（免费模型限制）');
      } else {
        console.log('   ⚠️  操作失败:', error.message);
      }
    }

    console.log('\n🎉 测试完成！');
    console.log('\n📊 Midscene 报告位置: midscene_run/report/');
    console.log('💡 提示: 打开报告可以看到 AI 的视觉分析过程');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  } finally {
    console.log('\n⏳ 10秒后关闭浏览器...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

main().catch(console.error);
