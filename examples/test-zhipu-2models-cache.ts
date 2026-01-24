/**
 * 智谱两个模型缓存测试（带快速限流检测）
 * 测试：GLM-4.6V-Flash 和 GLM-4.1V-Thinking-Flash
 * 每个模型2轮：第1轮建立缓存，第2轮使用缓存
 * 限流快速跳过：检测到429立即跳过，不等待
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

const MODELS = [
  {
    name: '智谱 GLM-4.1V-Thinking',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '0c17e7b44dc048568befbe0b40203a5e.XQF4hEsbGUDHJTi5',
    modelName: 'glm-4.1v-thinking-flash',
    family: 'glm-v',
    cacheId: 'glm41v-cache-test'
  }
];

const TEST_SITES = [
  { name: 'Hey.xyz', url: 'https://hey.xyz', action: '点击 Login 按钮' },
  { name: 'Uniswap', url: 'https://app.uniswap.org', action: '点击 Connect 按钮' },
  { name: 'GitHub', url: 'https://github.com/login', action: '点击登录按钮' }
];

interface TestResult {
  model: string;
  round: number;
  site: string;
  success: boolean;
  duration: number;
  cached: boolean;
  skipped?: boolean;
  reason?: string;
}

function isRateLimitError(error: string): boolean {
  const patterns = [
    '429',
    'rate limit',
    'too many requests',
    'quota exceeded',
    '请求过于频繁',
    'rate_limit_exceeded'
  ];
  return patterns.some(p => error.toLowerCase().includes(p.toLowerCase()));
}

async function testModelWithTimeout(
  model: any,
  round: number,
  useCache: boolean
): Promise<TestResult[]> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 ${model.name} - 第 ${round} 轮 ${useCache ? '(使用缓存)' : '(建立缓存)'}`);
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  process.env.MIDSCENE_MODEL_BASE_URL = model.baseUrl;
  process.env.MIDSCENE_MODEL_API_KEY = model.apiKey;
  process.env.MIDSCENE_MODEL_NAME = model.modelName;
  process.env.MIDSCENE_MODEL_FAMILY = model.family;

  const results: TestResult[] = [];
  let consecutiveRateLimits = 0;

  for (const site of TEST_SITES) {
    // 如果连续3次限流，跳过剩余测试
    if (consecutiveRateLimits >= 3) {
      console.log(`\n  ⚠️  连续限流 ${consecutiveRateLimits} 次，跳过剩余测试`);
      for (let i = TEST_SITES.indexOf(site); i < TEST_SITES.length; i++) {
        results.push({
          model: model.name,
          round,
          site: TEST_SITES[i].name,
          success: false,
          duration: 0,
          cached: useCache,
          skipped: true,
          reason: '连续限流跳过'
        });
      }
      break;
    }

    console.log(`\n  📍 ${site.name}...`);
    const startTime = Date.now();
    
    try {
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const agentOptions: any = {};
      if (useCache) {
        agentOptions.cache = { id: model.cacheId, strategy: 'read-write' };
      }
      
      const agent = new PlaywrightAgent(page, agentOptions);
      
      // 设置15秒超时，快速检测限流
      const actionPromise = agent.aiAction(site.action);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 15s')), 15000)
      );
      
      await Promise.race([actionPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      results.push({
        model: model.name,
        round,
        site: site.name,
        success: true,
        duration,
        cached: useCache
      });
      
      consecutiveRateLimits = 0; // 重置限流计数
      console.log(`     ✅ 成功 (${(duration / 1000).toFixed(1)}秒)`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMsg = error.message || '';
      const isLimit = isRateLimitError(errorMsg);
      
      if (isLimit) {
        consecutiveRateLimits++;
        results.push({
          model: model.name,
          round,
          site: site.name,
          success: false,
          duration,
          cached: useCache,
          reason: '限流'
        });
        console.log(`     ⚠️  限流 (${(duration / 1000).toFixed(1)}秒) - 连续 ${consecutiveRateLimits} 次`);
      } else {
        consecutiveRateLimits = 0;
        results.push({
          model: model.name,
          round,
          site: site.name,
          success: false,
          duration,
          cached: useCache,
          reason: '失败'
        });
        console.log(`     ❌ 失败 (${(duration / 1000).toFixed(1)}秒)`);
      }
    }
    
    await page.waitForTimeout(1000);
  }

  await browser.close();
  return results;
}

async function main() {
  console.log('🚀 智谱两个模型缓存测试（带快速限流检测）\n');
  console.log('测试配置:');
  console.log('   - 模型: GLM-4.6V-Flash 和 GLM-4.1V-Thinking');
  console.log('   - 网站: 3个测试网站');
  console.log('   - 轮数: 每个模型2轮');
  console.log('   - 限流策略: 连续3次限流自动跳过');
  console.log('   - 超时设置: 15秒快速检测\n');

  const allResults: TestResult[] = [];

  for (const model of MODELS) {
    // 第1轮：建立缓存
    const round1 = await testModelWithTimeout(model, 1, false);
    allResults.push(...round1);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 第2轮：使用缓存
    const round2 = await testModelWithTimeout(model, 2, true);
    allResults.push(...round2);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // 生成报告
  console.log('\n\n');
  console.log('━'.repeat(70));
  console.log('📊 智谱模型缓存测试报告');
  console.log('━'.repeat(70));

  for (const model of MODELS) {
    const modelResults = allResults.filter(r => r.model === model.name);
    const round1 = modelResults.filter(r => r.round === 1);
    const round2 = modelResults.filter(r => r.round === 2);
    
    const r1Success = round1.filter(r => r.success);
    const r1RateLimit = round1.filter(r => r.reason === '限流');
    const r1Skipped = round1.filter(r => r.skipped);
    
    const r2Success = round2.filter(r => r.success);
    const r2RateLimit = round2.filter(r => r.reason === '限流');
    const r2Skipped = round2.filter(r => r.skipped);
    
    const r1Rate = (r1Success.length / round1.length * 100).toFixed(0);
    const r2Rate = (r2Success.length / round2.length * 100).toFixed(0);
    
    const r1Time = r1Success.length > 0
      ? (r1Success.reduce((sum, r) => sum + r.duration, 0) / r1Success.length / 1000).toFixed(1)
      : '-';
    const r2Time = r2Success.length > 0
      ? (r2Success.reduce((sum, r) => sum + r.duration, 0) / r2Success.length / 1000).toFixed(1)
      : '-';

    console.log(`\n${model.name}:`);
    console.log(`  第1轮(无缓存):`);
    console.log(`    成功: ${r1Success.length}/${round1.length} (${r1Rate}%)`);
    console.log(`    限流: ${r1RateLimit.length} 次`);
    console.log(`    跳过: ${r1Skipped.length} 次`);
    console.log(`    平均耗时: ${r1Time}秒`);
    
    console.log(`  第2轮(有缓存):`);
    console.log(`    成功: ${r2Success.length}/${round2.length} (${r2Rate}%)`);
    console.log(`    限流: ${r2RateLimit.length} 次`);
    console.log(`    跳过: ${r2Skipped.length} 次`);
    console.log(`    平均耗时: ${r2Time}秒`);
    
    if (r1Success.length > 0 && r2Success.length > 0) {
      const speedup = ((parseFloat(r1Time) - parseFloat(r2Time)) / parseFloat(r1Time) * 100).toFixed(0);
      console.log(`    缓存加速: ${speedup}%`);
    }
  }

  // 对比表格
  console.log('\n\n━'.repeat(70));
  console.log('📋 智谱两模型对比表格');
  console.log('━'.repeat(70));
  console.log('\n| 模型 | 无缓存成功率 | 无缓存耗时 | 有缓存成功率 | 有缓存耗时 | 限流情况 |');
  console.log('|------|-------------|-----------|-------------|-----------|---------|');

  for (const model of MODELS) {
    const modelResults = allResults.filter(r => r.model === model.name);
    const round1 = modelResults.filter(r => r.round === 1);
    const round2 = modelResults.filter(r => r.round === 2);
    
    const r1Success = round1.filter(r => r.success);
    const r2Success = round2.filter(r => r.success);
    const totalRateLimit = modelResults.filter(r => r.reason === '限流').length;
    
    const r1Rate = (r1Success.length / round1.length * 100).toFixed(0);
    const r2Rate = (r2Success.length / round2.length * 100).toFixed(0);
    
    const r1Time = r1Success.length > 0
      ? (r1Success.reduce((sum, r) => sum + r.duration, 0) / r1Success.length / 1000).toFixed(1)
      : '-';
    const r2Time = r2Success.length > 0
      ? (r2Success.reduce((sum, r) => sum + r.duration, 0) / r2Success.length / 1000).toFixed(1)
      : '-';
    
    const modelShortName = model.name.replace('智谱 ', '');
    const rateLimitInfo = totalRateLimit > 0 ? `${totalRateLimit}次` : '无';
    
    console.log(`| ${modelShortName} | ${r1Rate}% | ${r1Time}秒 | ${r2Rate}% | ${r2Time}秒 | ${rateLimitInfo} |`);
  }

  console.log('\n━'.repeat(70));
  console.log('💡 结论');
  console.log('━'.repeat(70));
  
  const glm46Results = allResults.filter(r => r.model.includes('4.6V'));
  const glm41Results = allResults.filter(r => r.model.includes('4.1V'));
  
  const glm46Success = glm46Results.filter(r => r.success).length;
  const glm41Success = glm41Results.filter(r => r.success).length;
  
  const glm46RateLimit = glm46Results.filter(r => r.reason === '限流').length;
  const glm41RateLimit = glm41Results.filter(r => r.reason === '限流').length;
  
  console.log(`\n✅ GLM-4.6V-Flash: ${glm46Success}次成功, ${glm46RateLimit}次限流`);
  console.log(`✅ GLM-4.1V-Thinking: ${glm41Success}次成功, ${glm41RateLimit}次限流`);
  
  if (glm46Success > glm41Success) {
    console.log(`\n🏆 推荐: GLM-4.6V-Flash 更稳定，限流更少`);
  } else if (glm41Success > glm46Success) {
    console.log(`\n🏆 推荐: GLM-4.1V-Thinking 表现更好`);
  } else {
    console.log(`\n⚖️  两个模型表现相当`);
  }
  
  console.log('\n━'.repeat(70));
}

main().catch(console.error);
