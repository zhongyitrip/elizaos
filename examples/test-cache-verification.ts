/**
 * 缓存验证测试 - 验证 Midscene 缓存是否真的在工作
 * 使用相同的 cacheId，测试同一个网站多次，观察缓存效果
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

const TEST_CONFIG = {
  model: {
    name: '阿里云 qwen2-vl-2b',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: 'sk-dcfffe8f7cab48ac879df24829ac282a',
    modelName: 'qwen2-vl-2b-instruct',
    family: 'qwen3-vl'
  },
  cacheId: 'cache-verification-test',
  site: {
    name: 'GitHub',
    url: 'https://github.com/login',
    action: '点击登录按钮'
  }
};

async function testWithCache(round: number, useCache: boolean): Promise<number> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`第 ${round} 轮 - ${useCache ? '使用缓存' : '不使用缓存'}`);
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  process.env.MIDSCENE_MODEL_BASE_URL = TEST_CONFIG.model.baseUrl;
  process.env.MIDSCENE_MODEL_API_KEY = TEST_CONFIG.model.apiKey;
  process.env.MIDSCENE_MODEL_NAME = TEST_CONFIG.model.modelName;
  process.env.MIDSCENE_MODEL_FAMILY = TEST_CONFIG.model.family;

  const startTime = Date.now();

  try {
    await page.goto(TEST_CONFIG.site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const agentOptions: any = {};
    if (useCache) {
      agentOptions.cache = {
        id: TEST_CONFIG.cacheId,
        strategy: 'read-write'
      };
    }

    const agent = new PlaywrightAgent(page, agentOptions);
    await agent.aiAction(TEST_CONFIG.site.action);

    const duration = Date.now() - startTime;
    console.log(`✅ 成功 - 耗时: ${(duration / 1000).toFixed(1)}秒`);

    await browser.close();
    return duration;

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.log(`❌ 失败 - 耗时: ${(duration / 1000).toFixed(1)}秒`);
    console.log(`错误: ${error.message}`);

    await browser.close();
    return duration;
  }
}

async function main() {
  console.log('🧪 Midscene 缓存验证测试\n');
  console.log(`模型: ${TEST_CONFIG.model.name}`);
  console.log(`网站: ${TEST_CONFIG.site.name}`);
  console.log(`操作: ${TEST_CONFIG.site.action}`);
  console.log(`缓存ID: ${TEST_CONFIG.cacheId}\n`);

  const results: { round: number; cached: boolean; duration: number }[] = [];

  // 第1轮：不使用缓存（基准测试）
  const r1 = await testWithCache(1, false);
  results.push({ round: 1, cached: false, duration: r1 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 第2轮：使用缓存（建立缓存）
  const r2 = await testWithCache(2, true);
  results.push({ round: 2, cached: true, duration: r2 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 第3轮：使用缓存（应该命中缓存）
  const r3 = await testWithCache(3, true);
  results.push({ round: 3, cached: true, duration: r3 });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 第4轮：使用缓存（再次验证）
  const r4 = await testWithCache(4, true);
  results.push({ round: 4, cached: true, duration: r4 });

  // 生成报告
  console.log('\n\n');
  console.log('━'.repeat(60));
  console.log('📊 缓存验证测试报告');
  console.log('━'.repeat(60));

  console.log('\n| 轮次 | 缓存状态 | 耗时(秒) | 对比第1轮 |');
  console.log('|------|---------|---------|----------|');

  const baseline = results[0].duration;
  results.forEach(r => {
    const time = (r.duration / 1000).toFixed(1);
    const diff = ((r.duration - baseline) / baseline * 100).toFixed(0);
    const diffStr = diff === '0' ? '-' : (diff.startsWith('-') ? `${diff}%` : `+${diff}%`);
    const cached = r.cached ? '使用缓存' : '不使用缓存';
    console.log(`| ${r.round} | ${cached} | ${time} | ${diffStr} |`);
  });

  console.log('\n━'.repeat(60));
  console.log('💡 结论');
  console.log('━'.repeat(60));

  const cachedResults = results.filter(r => r.cached);
  const avgCached = cachedResults.reduce((sum, r) => sum + r.duration, 0) / cachedResults.length;
  const speedup = ((baseline - avgCached) / baseline * 100).toFixed(0);

  console.log(`\n无缓存基准: ${(baseline / 1000).toFixed(1)}秒`);
  console.log(`有缓存平均: ${(avgCached / 1000).toFixed(1)}秒`);

  if (avgCached < baseline) {
    console.log(`\n✅ 缓存有效！平均加速 ${speedup}%`);
  } else if (avgCached === baseline) {
    console.log(`\n⚠️  缓存无效！耗时完全一致`);
  } else {
    console.log(`\n❌ 缓存反而变慢！平均慢了 ${Math.abs(parseInt(speedup))}%`);
  }

  console.log('\n━'.repeat(60));
}

main().catch(console.error);
