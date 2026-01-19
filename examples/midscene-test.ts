/**
 * Midscene.js + Playwright 测试脚本
 * 
 * 使用 Qwen3-VL 视觉模型进行 UI 自动化测试
 * 
 * 运行方式: bun run examples/midscene-test.ts
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

async function main() {
  console.log('🚀 启动 Midscene + Playwright 测试...\n');
  
  // 检查环境变量配置
  const apiKey = process.env.MIDSCENE_MODEL_API_KEY;
  const modelName = process.env.MIDSCENE_MODEL_NAME;
  
  if (!apiKey) {
    console.error('❌ 错误: MIDSCENE_MODEL_API_KEY 未配置');
    console.log('请在 .env 文件中配置 Midscene 环境变量');
    process.exit(1);
  }
  
  console.log('✅ Midscene 配置:');
  console.log(`   - Model: ${modelName || '未设置'}`);
  console.log(`   - API Key: ${apiKey.slice(0, 10)}...`);
  console.log('');

  // 启动浏览器
  const browser = await chromium.launch({ 
    headless: false,  // 设置为 false 可以看到浏览器操作
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
  
  const page = await context.newPage();
  
  // 创建 Midscene Agent
  const agent = new PlaywrightAgent(page);

  try {
    // ========== 测试 1: 访问网站 ==========
    console.log('📍 测试 1: 访问 Bing 搜索页面...');
    await page.goto('https://www.bing.com');
    await page.waitForLoadState('domcontentloaded');
    
    // ========== 测试 2: 使用 AI 视觉定位并输入 ==========
    console.log('📍 测试 2: 使用 AI 视觉在搜索框输入文字...');
    await agent.aiAction('在搜索框中输入 "Midscene.js AI automation"');
    
    // ========== 测试 3: 使用 AI 视觉点击按钮 ==========
    console.log('📍 测试 3: 使用 AI 视觉点击搜索按钮...');
    await agent.aiAction('点击搜索按钮');
    
    // 等待搜索结果加载
    await page.waitForTimeout(3000);
    
    // ========== 测试 4: 使用 AI 查询页面内容 ==========
    console.log('📍 测试 4: 使用 AI 查询页面信息...');
    const queryResult = await agent.aiQuery('当前页面的标题是什么？页面上有哪些主要元素？');
    console.log('   查询结果:', queryResult);
    console.log('   ✅ AI 查询成功！');

    console.log('\n🎉 所有测试完成！Midscene + Qwen 模型集成成功！');
    console.log('📊 查看详细报告: midscene_run/report/');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  } finally {
    // 等待一会儿让用户看到结果
    console.log('\n⏳ 5秒后关闭浏览器...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

main().catch(console.error);
