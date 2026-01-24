/**
 * Midscene.js + 本地 Ollama Qwen 视觉模型（修复版）
 * 
 * 问题修复：Ollama 要求图片尺寸 > 32 像素
 * 
 * 运行: bun run examples/midscene-ollama-fixed.ts
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

async function main() {
  console.log('🚀 Midscene + 本地 Ollama Qwen 测试（修复版）\n');
  
  // 配置本地 Ollama
  process.env.MIDSCENE_MODEL_BASE_URL = 'http://127.0.0.1:11434/v1';
  process.env.MIDSCENE_MODEL_API_KEY = 'ollama';
  process.env.MIDSCENE_MODEL_NAME = 'qwen3-vl:4b';
  process.env.MIDSCENE_MODEL_FAMILY = 'qwen3-vl';

  console.log('✅ 配置完成:');
  console.log(`   - Provider: 本地 Ollama`);
  console.log(`   - Model: ${process.env.MIDSCENE_MODEL_NAME}`);
  console.log(`   - 💰 成本: 完全免费！`);
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const agent = new PlaywrightAgent(page);

  try {
    console.log('📍 步骤 1: 访问 GitHub...');
    await page.goto('https://github.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    console.log('   ✅ 页面加载完成');

    console.log('\n📍 步骤 2: 本地 AI 查询...');
    console.log('   (本地模型推理中，预计 10-30 秒...)');
    
    const result = await agent.aiQuery('页面上有哪些主要的导航按钮？');
    console.log('   ✅ 查询成功！');
    console.log('\n   AI 回复:', result);

    console.log('\n📍 步骤 3: 本地 AI 点击操作...');
    await agent.aiAction('点击页面顶部的搜索框');
    console.log('   ✅ 点击成功！');

    console.log('\n🎉 Midscene + 本地 Ollama 完全成功！');
    console.log('\n💡 优势:');
    console.log('   ✅ 完全免费');
    console.log('   ✅ 数据隐私');
    console.log('   ✅ 无限流');
    
  } catch (error) {
    console.error('\n❌ 失败:', error);
  } finally {
    console.log('\n⏳ 10秒后关闭...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

main().catch(console.error);
