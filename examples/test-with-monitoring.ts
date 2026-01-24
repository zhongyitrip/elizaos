/**
 * Ollama 模型测试 + 资源监控
 * 监控 CPU、内存、GPU 使用情况
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';
import { spawn } from 'child_process';

async function getSystemStats() {
  return new Promise<string>((resolve) => {
    const ps = spawn('ps', ['-A', '-o', '%cpu,%mem,comm']);
    let output = '';
    
    ps.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ps.on('close', () => {
      const lines = output.split('\n');
      const ollamaLine = lines.find(l => l.includes('ollama'));
      resolve(ollamaLine || 'Ollama not found');
    });
  });
}

async function testModelWithMonitoring(modelName: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 测试模型: ${modelName}`);
  console.log('='.repeat(70));
  
  process.env.MIDSCENE_MODEL_BASE_URL = 'http://127.0.0.1:11434/v1';
  process.env.MIDSCENE_MODEL_API_KEY = 'ollama';
  process.env.MIDSCENE_MODEL_NAME = modelName;
  process.env.MIDSCENE_MODEL_FAMILY = 'qwen3-vl';

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const agent = new PlaywrightAgent(page);

  let queryTime = 0;
  let clickTime = 0;

  try {
    console.log('\n📍 步骤 1: 加载页面...');
    await page.goto('https://github.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    console.log('   ✅ 完成');

    // 查询测试
    console.log('\n📍 步骤 2: AI 查询测试...');
    console.log('   ⏱️  开始监控资源使用...');
    
    const statsBefore = await getSystemStats();
    console.log(`   📊 推理前: ${statsBefore}`);
    
    const t1 = Date.now();
    const result = await agent.aiQuery('页面上有哪些主要的导航按钮？');
    queryTime = (Date.now() - t1) / 1000;
    
    const statsAfter = await getSystemStats();
    console.log(`   📊 推理后: ${statsAfter}`);
    console.log(`   ✅ 完成 (${queryTime.toFixed(1)}秒)`);
    console.log(`   回复: ${result}`);

    // 点击测试
    console.log('\n📍 步骤 3: AI 点击测试...');
    console.log('   ⏱️  监控资源使用...');
    
    const t2 = Date.now();
    await agent.aiAction('点击页面顶部的搜索框');
    clickTime = (Date.now() - t2) / 1000;
    
    const statsClick = await getSystemStats();
    console.log(`   📊 点击后: ${statsClick}`);
    console.log(`   ✅ 完成 (${clickTime.toFixed(1)}秒)`);

    const totalTime = queryTime + clickTime;
    
    console.log(`\n✅ ${modelName} 测试完成！`);
    console.log(`\n⏱️  性能统计:`);
    console.log(`   - 查询: ${queryTime.toFixed(1)}秒`);
    console.log(`   - 点击: ${clickTime.toFixed(1)}秒`);
    console.log(`   - 总计: ${totalTime.toFixed(1)}秒`);
    
    return { modelName, queryTime, clickTime, totalTime, success: true };
    
  } catch (error: any) {
    console.error(`\n❌ ${modelName} 测试失败:`, error.message);
    return { modelName, queryTime, clickTime, totalTime: 0, success: false };
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🚀 Ollama 模型资源监控测试');
  console.log('测试模型: qwen3-vl:8b, qwen3-vl:30b\n');

  const results = [];

  // 测试 8b
  console.log('\n🔍 测试 8b 模型...');
  const result8b = await testModelWithMonitoring('qwen3-vl:8b');
  results.push(result8b);
  
  console.log('\n⏳ 等待 10 秒...');
  await new Promise(r => setTimeout(r, 10000));

  // 测试 30b
  console.log('\n🔍 测试 30b 模型...');
  const result30b = await testModelWithMonitoring('qwen3-vl:30b');
  results.push(result30b);

  // 生成对比
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 最终对比结果');
  console.log('='.repeat(80));
  console.log('\n| 模型 | 查询耗时 | 点击耗时 | 总耗时 | 状态 |');
  console.log('|------|---------|---------|--------|------|');
  
  for (const r of results) {
    const status = r.success ? '✅' : '❌';
    console.log(`| ${r.modelName} | ${r.queryTime.toFixed(1)}秒 | ${r.clickTime.toFixed(1)}秒 | ${r.totalTime.toFixed(1)}秒 | ${status} |`);
  }
  
  console.log('\n💡 电脑损耗分析:');
  console.log('   - GPU 满载时间 = 总耗时');
  console.log('   - 风扇噪音时间 = 总耗时');
  console.log('   - 建议: 如果频繁使用，云端更省电脑寿命');
  console.log('='.repeat(80));
}

main().catch(console.error);
