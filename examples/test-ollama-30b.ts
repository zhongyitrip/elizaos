/**
 * Midscene.js + Ollama qwen3-vl:30b 单独测试
 * 测试最大的本地模型是否稳定不卡顿
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

async function main() {
  console.log('🚀 Midscene + Ollama qwen3-vl:30b 测试\n');
  
  // 配置 30b 模型
  process.env.MIDSCENE_MODEL_BASE_URL = 'http://127.0.0.1:11434/v1';
  process.env.MIDSCENE_MODEL_API_KEY = 'ollama';
  process.env.MIDSCENE_MODEL_NAME = 'qwen3-vl:30b';
  process.env.MIDSCENE_MODEL_FAMILY = 'qwen3-vl';

  console.log('✅ 配置:');
  console.log(`   - Model: qwen3-vl:30b (19 GB)`);
  console.log(`   - 预期: 最快的本地模型`);
  console.log(`   - 💰 成本: 完全免费`);
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const agent = new PlaywrightAgent(page);

  try {
    console.log('📍 步骤 1: 访问 GitHub...');
    const t0 = Date.now();
    await page.goto('https://github.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    console.log(`   ✅ 完成 (${((Date.now() - t0) / 1000).toFixed(1)}秒)`);

    console.log('\n📍 步骤 2: AI 查询测试（计时）...');
    console.log('   (30b 模型推理中...)');
    const t1 = Date.now();
    const result = await agent.aiQuery('页面上有哪些主要的导航按钮？');
    const queryTime = ((Date.now() - t1) / 1000).toFixed(1);
    console.log(`   ✅ 完成 (${queryTime}秒)`);
    console.log(`   回复: ${result}`);

    console.log('\n📍 步骤 3: AI 点击操作（计时）...');
    console.log('   (测试是否会卡住...)');
    const t2 = Date.now();
    
    // 设置超时保护
    const timeout = setTimeout(() => {
      console.log('\n   ⚠️  超过 60 秒，可能卡住了...');
    }, 60000);
    
    await agent.aiAction('点击页面顶部的搜索框');
    clearTimeout(timeout);
    
    const clickTime = ((Date.now() - t2) / 1000).toFixed(1);
    console.log(`   ✅ 完成 (${clickTime}秒)`);

    const totalTime = (parseFloat(queryTime) + parseFloat(clickTime)).toFixed(1);
    
    console.log('\n🎉 测试完成！30b 模型运行稳定！');
    console.log('\n⏱️  性能统计:');
    console.log(`   - 查询耗时: ${queryTime}秒`);
    console.log(`   - 点击耗时: ${clickTime}秒`);
    console.log(`   - 总耗时: ${totalTime}秒`);
    
    console.log('\n💡 对比:');
    console.log(`   - 阿里云 Qwen: 6-10秒`);
    console.log(`   - Ollama 30b: ${totalTime}秒`);
    console.log(`   - 速度差距: ${(parseFloat(totalTime) / 8).toFixed(1)}倍`);
    
    console.log('\n✅ 结论:');
    if (parseFloat(totalTime) < 40) {
      console.log('   - 30b 模型性能优秀，适合本地使用！');
      console.log('   - 如果不介意等待，可以完全免费使用');
    } else {
      console.log('   - 30b 模型可用，但仍然比云端慢');
      console.log('   - 建议根据实际需求选择');
    }
    
  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('   1. 30b 模型需要大量内存（建议 32GB+）');
    console.log('   2. 模型推理时间过长导致超时');
    console.log('   3. Ollama 服务异常');
  } finally {
    console.log('\n⏳ 10秒后关闭浏览器...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

main().catch(console.error);
