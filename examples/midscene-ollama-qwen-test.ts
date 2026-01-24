/**
 * Midscene.js + 本地 Ollama Qwen 视觉模型集成测试
 * 
 * 使用本地 Ollama 的 qwen3-vl:4b 模型进行 UI 自动化
 * 完全免费，无需调用云端 API
 * 
 * 运行前准备:
 * 1. 启动 Ollama: ollama serve
 * 2. 确认模型已安装: ollama list | grep qwen3-vl
 * 3. 运行测试: bun run examples/midscene-ollama-qwen-test.ts
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

async function main() {
  console.log('🚀 Midscene + 本地 Ollama Qwen 视觉模型测试\n');
  
  // 配置 Midscene 使用本地 Ollama
  // Ollama 提供 OpenAI 兼容的 API 端点
  process.env.MIDSCENE_MODEL_BASE_URL = 'http://127.0.0.1:11434/v1';
  process.env.MIDSCENE_MODEL_API_KEY = 'ollama'; // Ollama 不需要真实 API Key
  process.env.MIDSCENE_MODEL_NAME = 'qwen3-vl:4b';
  process.env.MIDSCENE_MODEL_FAMILY = 'qwen3-vl';

  console.log('✅ 配置完成:');
  console.log(`   - Provider: 本地 Ollama`);
  console.log(`   - Endpoint: ${process.env.MIDSCENE_MODEL_BASE_URL}`);
  console.log(`   - Model: ${process.env.MIDSCENE_MODEL_NAME}`);
  console.log(`   - 💰 成本: 完全免费！`);
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

    // 测试 2: 使用本地 AI 查询页面内容
    console.log('\n📍 步骤 2: 本地 AI 查询页面元素...');
    console.log('   (本地 Qwen 模型推理中，可能需要 10-30 秒...)');
    console.log('   (首次调用会加载模型到内存，后续会更快)');
    
    const result = await agent.aiQuery('页面上有哪些主要的导航按钮或链接？请列出 3-5 个');
    console.log('   ✅ 查询成功！');
    console.log('\n   本地 AI 回复:');
    console.log('   ' + result);

    // 测试 3: 使用本地 AI 执行操作
    console.log('\n📍 步骤 3: 本地 AI 执行点击操作...');
    console.log('   (尝试点击搜索框)');
    
    await agent.aiAction('点击页面顶部的搜索框');
    console.log('   ✅ 点击成功！');
    
    await page.waitForTimeout(1000);
    
    // 测试 4: 输入文字
    console.log('\n📍 步骤 4: 本地 AI 输入文字...');
    await agent.aiAction('在搜索框中输入 "playwright automation"');
    console.log('   ✅ 输入成功！');
    
    await page.waitForTimeout(2000);
    
    // 测试 5: 复杂查询
    console.log('\n📍 步骤 5: 本地 AI 分析页面状态...');
    const searchState = await agent.aiQuery('搜索框中现在显示的内容是什么？');
    console.log('   查询结果:', searchState);
    console.log('   ✅ 分析成功！');

    console.log('\n🎉 所有测试完成！Midscene + 本地 Ollama Qwen 集成成功！');
    console.log('\n💡 优势总结:');
    console.log('   ✅ 完全免费 - 无 API 调用费用');
    console.log('   ✅ 数据隐私 - 所有数据在本地处理');
    console.log('   ✅ 无限流 - 不受云端限流限制');
    console.log('   ✅ 离线可用 - 无需网络连接');
    console.log('\n📊 Midscene 报告位置: midscene_run/report/');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.log('\n💡 故障排查:');
    console.log('   1. 确认 Ollama 服务运行: curl http://127.0.0.1:11434/api/tags');
    console.log('   2. 确认模型已安装: ollama list | grep qwen3-vl');
    console.log('   3. 测试模型推理: ollama run qwen3-vl:4b "describe this"');
    console.log('   4. 检查端口是否正确: 11434');
  } finally {
    console.log('\n⏳ 10秒后关闭浏览器...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

main().catch(console.error);
