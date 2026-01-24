/**
 * Midscene.js + 阿里云 Qwen 视觉模型集成测试
 * 
 * 使用阿里云 DashScope 的 qwen3-vl-plus 模型进行 UI 自动化
 * 
 * 运行方式: bun run examples/midscene-qwen-test.ts
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

async function main() {
  console.log('🚀 Midscene + 阿里云 Qwen 视觉模型测试\n');
  
  // 配置阿里云 Qwen 模型
  process.env.MIDSCENE_MODEL_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  process.env.MIDSCENE_MODEL_API_KEY = 'sk-dcfffe8f7cab48ac879df24829ac282a';
  process.env.MIDSCENE_MODEL_NAME = 'qwen3-vl-plus';
  process.env.MIDSCENE_MODEL_FAMILY = 'qwen3-vl';

  console.log('✅ 配置完成:');
  console.log(`   - Provider: 阿里云 DashScope`);
  console.log(`   - Model: ${process.env.MIDSCENE_MODEL_NAME}`);
  console.log(`   - API Key: ${process.env.MIDSCENE_MODEL_API_KEY.slice(0, 15)}...`);
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
    console.log('   (Qwen 模型推理中，预计 3-10 秒...)');
    
    const result = await agent.aiQuery('页面上有哪些主要的导航按钮或链接？请列出 3-5 个');
    console.log('   ✅ 查询成功！');
    console.log('\n   AI 回复:');
    console.log('   ' + result);

    // 测试 3: 使用 AI 执行操作
    console.log('\n📍 步骤 3: AI 执行点击操作...');
    console.log('   (尝试点击搜索框)');
    
    await agent.aiAction('点击页面顶部的搜索框');
    console.log('   ✅ 点击成功！');
    
    await page.waitForTimeout(1000);
    
    // 测试 4: 输入文字
    console.log('\n📍 步骤 4: AI 输入文字...');
    await agent.aiAction('在搜索框中输入 "playwright automation"');
    console.log('   ✅ 输入成功！');
    
    await page.waitForTimeout(2000);
    
    // 测试 5: 复杂查询
    console.log('\n📍 步骤 5: AI 分析页面状态...');
    const searchState = await agent.aiQuery('搜索框中现在显示的内容是什么？');
    console.log('   查询结果:', searchState);
    console.log('   ✅ 分析成功！');

    console.log('\n🎉 所有测试完成！Midscene + Qwen 模型集成成功！');
    console.log('📊 Midscene 报告位置: midscene_run/report/');
    console.log('💡 提示: 打开报告可以看到 AI 的视觉分析过程');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.log('\n💡 故障排查:');
    console.log('   1. 检查阿里云 API Key 是否有效');
    console.log('   2. 检查网络连接到 dashscope.aliyuncs.com');
    console.log('   3. 检查模型名称是否正确: qwen3-vl-plus');
  } finally {
    console.log('\n⏳ 10秒后关闭浏览器...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

main().catch(console.error);
