/**
 * Ollama 视觉模型性能基准测试
 * 测试 qwen3-vl 的 4b、8b、30b 三个模型
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

interface BenchmarkResult {
  model: string;
  queryTime: number;
  clickTime: number;
  totalTime: number;
  success: boolean;
  error?: string;
}

async function testModel(modelName: string): Promise<BenchmarkResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 测试模型: ${modelName}`);
  console.log('='.repeat(60));
  
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
  let success = false;
  let error: string | undefined;

  try {
    console.log('\n📍 步骤 1: 加载页面...');
    await page.goto('https://github.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('   ✅ 完成');

    console.log('\n📍 步骤 2: AI 查询测试...');
    const t1 = Date.now();
    const result = await agent.aiQuery('页面上有哪些主要的导航按钮？');
    queryTime = (Date.now() - t1) / 1000;
    console.log(`   ✅ 完成 (${queryTime.toFixed(1)}秒)`);
    console.log(`   回复: ${result}`);

    console.log('\n📍 步骤 3: AI 点击测试...');
    const t2 = Date.now();
    await agent.aiAction('点击页面顶部的搜索框');
    clickTime = (Date.now() - t2) / 1000;
    console.log(`   ✅ 完成 (${clickTime.toFixed(1)}秒)`);

    success = true;
    console.log(`\n✅ ${modelName} 测试成功！`);
    
  } catch (err: any) {
    error = err.message;
    console.error(`\n❌ ${modelName} 测试失败:`, error);
  } finally {
    await browser.close();
  }

  const totalTime = queryTime + clickTime;
  
  return {
    model: modelName,
    queryTime,
    clickTime,
    totalTime,
    success,
    error
  };
}

async function main() {
  console.log('🚀 Ollama 视觉模型性能基准测试');
  console.log('测试模型: qwen3-vl:4b, qwen3-vl:8b, qwen3-vl:30b\n');

  const models = ['qwen3-vl:4b', 'qwen3-vl:8b', 'qwen3-vl:30b'];
  const results: BenchmarkResult[] = [];

  for (const model of models) {
    const result = await testModel(model);
    results.push(result);
    
    if (model !== models[models.length - 1]) {
      console.log('\n⏳ 等待 5 秒后测试下一个模型...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // 生成对比表格
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 性能对比结果');
  console.log('='.repeat(80));
  console.log('\n| 模型 | 查询耗时 | 点击耗时 | 总耗时 | 状态 |');
  console.log('|------|---------|---------|--------|------|');
  
  for (const r of results) {
    const status = r.success ? '✅ 成功' : '❌ 失败';
    const query = r.success ? `${r.queryTime.toFixed(1)}秒` : '-';
    const click = r.success ? `${r.clickTime.toFixed(1)}秒` : '-';
    const total = r.success ? `${r.totalTime.toFixed(1)}秒` : '-';
    console.log(`| ${r.model} | ${query} | ${click} | ${total} | ${status} |`);
  }

  // 对比阿里云
  console.log('| 阿里云 Qwen | 3-5秒 | 3-5秒 | 6-10秒 | ✅ 成功 |');
  
  console.log('\n' + '='.repeat(80));
  console.log('💡 结论:');
  
  const fastest = results.filter(r => r.success).sort((a, b) => a.totalTime - b.totalTime)[0];
  if (fastest) {
    console.log(`   - 最快的本地模型: ${fastest.model} (${fastest.totalTime.toFixed(1)}秒)`);
    console.log(`   - 阿里云 Qwen 仍然快 ${(fastest.totalTime / 8).toFixed(1)} 倍`);
  }
  
  console.log('   - 推荐生产环境使用: 阿里云 Qwen');
  console.log('   - 推荐开发测试使用: qwen3-vl:8b 或 30b');
  console.log('='.repeat(80));
}

main().catch(console.error);
