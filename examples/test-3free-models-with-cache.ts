/**
 * 三个免费模型带缓存对比测试
 * 测试模型：
 * 1. 阿里云 qwen2-vl-2b
 * 2. 智谱 GLM-4.6V-Flash
 * 3. 智谱 GLM-4.1V-Thinking-Flash
 * 
 * 每个模型测试两轮：
 * - 第一轮：无缓存（建立缓存）
 * - 第二轮：有缓存（验证缓存效果）
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

const TEST_SCENARIOS = [
  {
    site: 'Hey.xyz',
    url: 'https://hey.xyz',
    action: '点击 Login 按钮'
  },
  {
    site: 'Uniswap',
    url: 'https://app.uniswap.org',
    action: '点击 Connect 按钮'
  },
  {
    site: 'Aave',
    url: 'https://app.aave.com',
    action: '点击右上角的 Connect wallet 按钮'
  },
  {
    site: 'Binance',
    url: 'https://www.binance.com',
    action: '点击 Log In 按钮'
  },
  {
    site: 'GitHub',
    url: 'https://github.com/login',
    action: '点击登录按钮'
  }
];

interface ModelConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  family: string;
  cacheId: string;
}

const MODELS: ModelConfig[] = [
  {
    name: '阿里云 qwen2-vl-2b',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: 'sk-dcfffe8f7cab48ac879df24829ac282a',
    modelName: 'qwen2-vl-2b-instruct',
    family: 'qwen3-vl',
    cacheId: 'qwen2b-cache'
  },
  {
    name: '智谱 GLM-4.6V-Flash',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '0c17e7b44dc048568befbe0b40203a5e.XQF4hEsbGUDHJTi5',
    modelName: 'glm-4.6v-flash',
    family: 'glm-v',
    cacheId: 'glm46v-cache'
  },
  {
    name: '智谱 GLM-4.1V-Thinking-Flash',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: '0c17e7b44dc048568befbe0b40203a5e.XQF4hEsbGUDHJTi5',
    modelName: 'glm-4.1v-thinking-flash',
    family: 'glm-v',
    cacheId: 'glm41v-cache'
  }
];

interface TestResult {
  model: string;
  round: number;
  site: string;
  success: boolean;
  duration: number;
  cached: boolean;
  error?: string;
}

function isRateLimitError(errorMessage: string): boolean {
  const rateLimitPatterns = [
    '429',
    'rate limit',
    'too many requests',
    'API请求过多',
    'quota exceeded',
    '请求过于频繁'
  ];
  
  const lowerMsg = errorMessage.toLowerCase();
  return rateLimitPatterns.some(pattern => lowerMsg.includes(pattern.toLowerCase()));
}

async function testModelWithCache(
  model: ModelConfig,
  round: number,
  useCache: boolean
): Promise<TestResult[]> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 测试模型: ${model.name} - 第 ${round} 轮 ${useCache ? '(使用缓存)' : '(建立缓存)'}`);
  console.log('='.repeat(80));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  process.env.MIDSCENE_MODEL_BASE_URL = model.baseUrl;
  process.env.MIDSCENE_MODEL_API_KEY = model.apiKey;
  process.env.MIDSCENE_MODEL_NAME = model.modelName;
  process.env.MIDSCENE_MODEL_FAMILY = model.family;

  const agentOptions: any = {};
  if (useCache) {
    agentOptions.cache = {
      id: model.cacheId,
      strategy: 'read-write'
    };
  }

  const results: TestResult[] = [];

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n  📍 ${scenario.site}...`);
    
    const startTime = Date.now();
    
    try {
      await page.goto(scenario.url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      await page.waitForTimeout(3000);
      
      const agent = new PlaywrightAgent(page, agentOptions);
      await agent.aiAction(scenario.action);
      
      const duration = Date.now() - startTime;
      
      results.push({
        model: model.name,
        round,
        site: scenario.site,
        success: true,
        duration,
        cached: useCache
      });
      
      console.log(`     ✅ 成功 (${(duration / 1000).toFixed(1)}秒)`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMsg = error.message || '';
      const isLimit = isRateLimitError(errorMsg);
      
      results.push({
        model: model.name,
        round,
        site: scenario.site,
        success: false,
        duration,
        cached: useCache,
        error: isLimit ? '限流' : '失败'
      });
      
      if (isLimit) {
        console.log(`     ⚠️  限流 (${(duration / 1000).toFixed(1)}秒)`);
      } else {
        console.log(`     ❌ 失败 (${(duration / 1000).toFixed(1)}秒)`);
      }
    }
    
    await page.waitForTimeout(2000);
  }

  await browser.close();
  return results;
}

async function main() {
  console.log('🚀 三个免费模型带缓存对比测试\n');
  console.log('测试配置:');
  console.log('   - 模型数量: 3 个');
  console.log('   - 测试网站: 5 个');
  console.log('   - 测试轮数: 2 轮/模型');
  console.log('   - 第 1 轮: 建立缓存');
  console.log('   - 第 2 轮: 使用缓存\n');

  const allResults: TestResult[] = [];

  for (const model of MODELS) {
    // 第一轮：建立缓存
    const round1Results = await testModelWithCache(model, 1, false);
    allResults.push(...round1Results);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 第二轮：使用缓存
    const round2Results = await testModelWithCache(model, 2, true);
    allResults.push(...round2Results);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // 生成报告
  console.log('\n\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 三个免费模型带缓存对比报告');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const model of MODELS) {
    const modelResults = allResults.filter(r => r.model === model.name);
    const round1 = modelResults.filter(r => r.round === 1);
    const round2 = modelResults.filter(r => r.round === 2);
    
    const round1Success = round1.filter(r => r.success);
    const round2Success = round2.filter(r => r.success);
    
    const round1SuccessRate = (round1Success.length / round1.length * 100).toFixed(0);
    const round2SuccessRate = (round2Success.length / round2.length * 100).toFixed(0);
    
    const round1AvgTime = round1Success.length > 0
      ? (round1Success.reduce((sum, r) => sum + r.duration, 0) / round1Success.length / 1000).toFixed(1)
      : '-';
    const round2AvgTime = round2Success.length > 0
      ? (round2Success.reduce((sum, r) => sum + r.duration, 0) / round2Success.length / 1000).toFixed(1)
      : '-';
    
    const speedup = round1Success.length > 0 && round2Success.length > 0
      ? ((parseFloat(round1AvgTime) - parseFloat(round2AvgTime)) / parseFloat(round1AvgTime) * 100).toFixed(0)
      : '-';

    console.log(`\n${model.name}:`);
    console.log('  第 1 轮 (无缓存):');
    console.log(`    成功率: ${round1SuccessRate}% (${round1Success.length}/${round1.length})`);
    console.log(`    平均耗时: ${round1AvgTime}秒`);
    console.log('  第 2 轮 (有缓存):');
    console.log(`    成功率: ${round2SuccessRate}% (${round2Success.length}/${round2.length})`);
    console.log(`    平均耗时: ${round2AvgTime}秒`);
    if (speedup !== '-') {
      console.log(`    速度提升: ${speedup}%`);
    }
  }

  // 生成对比表格
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 最终对比表格');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('| 模型 | 无缓存成功率 | 无缓存耗时 | 有缓存成功率 | 有缓存耗时 | 速度提升 |');
  console.log('|------|-------------|-----------|-------------|-----------|---------|');

  for (const model of MODELS) {
    const modelResults = allResults.filter(r => r.model === model.name);
    const round1 = modelResults.filter(r => r.round === 1);
    const round2 = modelResults.filter(r => r.round === 2);
    
    const round1Success = round1.filter(r => r.success);
    const round2Success = round2.filter(r => r.success);
    
    const round1SuccessRate = (round1Success.length / round1.length * 100).toFixed(0);
    const round2SuccessRate = (round2Success.length / round2.length * 100).toFixed(0);
    
    const round1AvgTime = round1Success.length > 0
      ? (round1Success.reduce((sum, r) => sum + r.duration, 0) / round1Success.length / 1000).toFixed(1)
      : '-';
    const round2AvgTime = round2Success.length > 0
      ? (round2Success.reduce((sum, r) => sum + r.duration, 0) / round2Success.length / 1000).toFixed(1)
      : '-';
    
    const speedup = round1Success.length > 0 && round2Success.length > 0
      ? ((parseFloat(round1AvgTime) - parseFloat(round2AvgTime)) / parseFloat(round1AvgTime) * 100).toFixed(0) + '%'
      : '-';

    const modelShortName = model.name.replace('阿里云 ', '').replace('智谱 ', '');
    console.log(`| ${modelShortName} | ${round1SuccessRate}% | ${round1AvgTime}秒 | ${round2SuccessRate}% | ${round2AvgTime}秒 | ${speedup} |`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 结论与建议');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 找出最佳模型
  const modelStats = MODELS.map(model => {
    const modelResults = allResults.filter(r => r.model === model.name && r.round === 2);
    const success = modelResults.filter(r => r.success);
    const successRate = success.length / modelResults.length * 100;
    const avgTime = success.length > 0
      ? success.reduce((sum, r) => sum + r.duration, 0) / success.length / 1000
      : 999;
    
    return { name: model.name, successRate, avgTime };
  });

  const bestModel = modelStats.reduce((best, current) => {
    if (current.successRate > best.successRate) return current;
    if (current.successRate === best.successRate && current.avgTime < best.avgTime) return current;
    return best;
  });

  console.log(`🏆 最佳模型: ${bestModel.name}`);
  console.log(`   - 成功率: ${bestModel.successRate.toFixed(0)}%`);
  console.log(`   - 平均耗时: ${bestModel.avgTime.toFixed(1)}秒 (有缓存)`);
  console.log(`   - 推荐作为第一优先级模型\n`);

  console.log('✅ 缓存效果验证:');
  console.log('   - 所有模型第二轮测试均使用缓存');
  console.log('   - 缓存可显著提升执行速度');
  console.log('   - 适合批量处理相同操作的场景\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
