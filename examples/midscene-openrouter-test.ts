/**
 * Midscene.js + OpenRouter 视觉模型集成测试
 * 
 * 使用 OpenRouter 的视觉模型进行 UI 自动化
 * 推荐模型: x-ai/grok-2-vision-1212 或 google/gemini-2.0-flash-exp:free
 * 
 * 运行方式: bun run examples/midscene-openrouter-test.ts
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

async function main() {
  console.log('🚀 启动 Midscene + OpenRouter 测试...\n');
  
  // 检查 OpenRouter API Key
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('❌ 错误: OPENROUTER_API_KEY 未配置');
    console.log('请在 .env 文件中配置: OPENROUTER_API_KEY=sk-or-v1-...');
    process.exit(1);
  }
  
  // 配置 OpenRouter 视觉模型
  const visionModel = process.env.OPENROUTER_IMAGE_MODEL || 'x-ai/grok-2-vision-1212';
  
  console.log('✅ OpenRouter 配置:');
  console.log(`   - Vision Model: ${visionModel}`);
  console.log(`   - API Key: ${apiKey.slice(0, 15)}...`);
  console.log('');

  // 设置 Midscene 使用 OpenRouter
  process.env.MIDSCENE_MODEL_BASE_URL = 'https://openrouter.ai/api/v1';
  process.env.MIDSCENE_MODEL_API_KEY = apiKey;
  process.env.MIDSCENE_MODEL_NAME = visionModel;

  // 启动浏览器
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  const page = await context.newPage();
  
  // 创建 Midscene Agent
  const agent = new PlaywrightAgent(page);

  try {
    // ========== 测试 1: 访问网站 ==========
    console.log('📍 测试 1: 访问 GitHub 首页...');
    await page.goto('https://github.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // ========== 测试 2: AI 视觉查询页面元素 ==========
    console.log('📍 测试 2: 使用 AI 视觉查询页面元素...');
    const elementsQuery = await agent.aiQuery('页面上有哪些主要的导航按钮？');
    console.log('   查询结果:', elementsQuery);
    console.log('   ✅ 查询成功！');
    
    // ========== 测试 3: AI 视觉定位搜索框 ==========
    console.log('📍 测试 3: 使用 AI 视觉在搜索框输入文字...');
    await agent.aiAction('在搜索框中输入 "playwright automation"');
    console.log('   ✅ 输入成功！');
    
    await page.waitForTimeout(2000);
    
    // ========== 测试 4: AI 视觉点击 ==========
    console.log('📍 测试 4: 使用 AI 视觉点击搜索按钮...');
    await agent.aiAction('点击搜索按钮或按回车键');
    console.log('   ✅ 点击成功！');
    
    // 等待结果加载
    await page.waitForTimeout(3000);
    
    // ========== 测试 5: 复杂查询 ==========
    console.log('📍 测试 5: 使用 AI 分析搜索结果...');
    const resultsQuery = await agent.aiQuery('搜索结果页面显示了哪些仓库？请列出前3个');
    console.log('   查询结果:', resultsQuery);
    console.log('   ✅ 分析成功！');

    console.log('\n🎉 所有测试完成！Midscene + OpenRouter 集成成功！');
    console.log('📊 查看详细报告: midscene_run/report/');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.log('\n💡 故障排查:');
    console.log('   1. 检查 API Key 是否有效');
    console.log('   2. 检查 OpenRouter 余额: https://openrouter.ai/credits');
    console.log('   3. 尝试切换模型 (如 google/gemini-2.0-flash-exp:free)');
  } finally {
    console.log('\n⏳ 5秒后关闭浏览器...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

main().catch(console.error);
