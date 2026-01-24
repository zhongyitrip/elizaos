/**
 * Midscene.js + Ollama 本地视觉模型集成测试
 * 
 * 使用本地 Ollama qwen3-vl:4b 模型进行 UI 自动化
 * 
 * 运行前准备:
 * 1. 启动 Ollama: ollama serve
 * 2. 拉取视觉模型: ollama pull qwen3-vl:4b
 * 3. 运行测试: bun run examples/midscene-ollama-test.ts
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

async function main() {
  console.log('🚀 启动 Midscene + Ollama 本地模型测试...\n');
  
  // 配置 Ollama 端点
  const ollamaEndpoint = process.env.OLLAMA_API_ENDPOINT || 'http://127.0.0.1:11434/api';
  const visionModel = process.env.OLLAMA_VISION_MODEL || 'qwen3-vl:4b';
  
  console.log('✅ Ollama 配置:');
  console.log(`   - Endpoint: ${ollamaEndpoint}`);
  console.log(`   - Vision Model: ${visionModel}`);
  console.log('');

  // 设置 Midscene 使用 Ollama (OpenAI 兼容格式)
  process.env.MIDSCENE_MODEL_BASE_URL = ollamaEndpoint.replace('/api', '/v1');
  process.env.MIDSCENE_MODEL_API_KEY = 'ollama'; // Ollama 不需要真实 API Key
  process.env.MIDSCENE_MODEL_NAME = visionModel;
  process.env.MIDSCENE_MODEL_FAMILY = 'qwen3-vl';

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
    // ========== 测试 1: 访问简单网站 ==========
    console.log('📍 测试 1: 访问 Bing 搜索页面...');
    await page.goto('https://www.bing.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // ========== 测试 2: AI 视觉定位搜索框 ==========
    console.log('📍 测试 2: 使用 AI 视觉在搜索框输入文字...');
    console.log('   (Ollama 本地推理中，可能需要 10-30 秒...)');
    
    await agent.aiAction('在搜索框中输入 "Midscene AI automation"');
    console.log('   ✅ 输入成功！');
    
    // ========== 测试 3: AI 视觉点击按钮 ==========
    console.log('📍 测试 3: 使用 AI 视觉点击搜索按钮...');
    await agent.aiAction('点击搜索按钮');
    console.log('   ✅ 点击成功！');
    
    // 等待搜索结果
    await page.waitForTimeout(3000);
    
    // ========== 测试 4: AI 查询页面内容 ==========
    console.log('📍 测试 4: 使用 AI 查询页面信息...');
    const queryResult = await agent.aiQuery('当前页面显示的是什么内容？');
    console.log('   查询结果:', queryResult);
    console.log('   ✅ AI 查询成功！');

    console.log('\n🎉 所有测试完成！Midscene + Ollama 本地模型集成成功！');
    console.log('📊 查看详细报告: midscene_run/report/');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.log('\n💡 故障排查:');
    console.log('   1. 确认 Ollama 服务运行: curl http://127.0.0.1:11434/api/tags');
    console.log('   2. 确认模型已安装: ollama list | grep qwen3-vl');
    console.log('   3. 测试模型推理: ollama run qwen3-vl:4b "describe this image"');
  } finally {
    console.log('\n⏳ 5秒后关闭浏览器...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

main().catch(console.error);
