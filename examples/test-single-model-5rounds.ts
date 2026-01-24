/**
 * 单模型测试脚本 - 支持限流快速跳过
 * 用法: 修改 MODEL_CONFIG 来测试不同模型
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

// 🔧 配置要测试的模型
const MODEL_CONFIG = {
  name: 'Ollama qwen3-vl:4b (本地)',
  baseUrl: 'http://localhost:11434/v1',
  apiKey: 'ollama',
  modelName: 'qwen3-vl:4b',
  family: 'qwen3-vl',
  cost: 0,
  description: '本地部署, 永久免费, 无限速, 无隐私风险'
};

// 可选配置：
// GLM-4.6V-Flash:
// {
//   name: 'GLM-4.6V-Flash',
//   baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
//   apiKey: '0c17e7b44dc048568befbe0b40203a5e.XQF4hEsbGUDHJTi5',
//   modelName: 'glm-4.6v-flash',
//   family: 'glm-v',
//   cost: 0,
//   description: '免费, 稳定'
// }

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

const ROUNDS = 5;

interface TestResult {
  site: string;
  round: number;
  success: boolean;
  duration: number;
  error?: string;
  isRateLimit?: boolean;
}

/**
 * 检测是否为限流错误 - 来自 OptimalFallbackAgent 的成熟经验
 */
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

/**
 * 带超时和限流检测的模型调用
 */
async function tryModelWithTimeout(
  agent: PlaywrightAgent,
  action: string,
  timeout: number = 30000
): Promise<{ success: boolean; duration: number; error?: string; isRateLimit: boolean }> {
  const startTime = Date.now();
  
  try {
    await Promise.race([
      agent.aiAction(action),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`超时 ${timeout}ms`)), timeout)
      )
    ]);
    
    return {
      success: true,
      duration: Date.now() - startTime,
      isRateLimit: false
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMsg = error.message || '';
    const isLimit = isRateLimitError(errorMsg);
    
    return {
      success: false,
      duration,
      error: errorMsg,
      isRateLimit: isLimit
    };
  }
}

async function main() {
  console.log(`🚀 ${MODEL_CONFIG.name} 性能测试\n`);
  console.log('模型配置:');
  console.log(`   Model: ${MODEL_CONFIG.modelName}`);
  console.log(`   Base URL: ${MODEL_CONFIG.baseUrl}`);
  console.log(`   Family: ${MODEL_CONFIG.family}`);
  console.log(`   描述: ${MODEL_CONFIG.description}\n`);
  console.log(`测试网站: ${TEST_SCENARIOS.length} 个`);
  console.log(`每个网站测试: ${ROUNDS} 遍`);
  console.log(`总测试次数: ${TEST_SCENARIOS.length * ROUNDS} 次\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  process.env.MIDSCENE_MODEL_BASE_URL = MODEL_CONFIG.baseUrl;
  process.env.MIDSCENE_MODEL_API_KEY = MODEL_CONFIG.apiKey;
  process.env.MIDSCENE_MODEL_NAME = MODEL_CONFIG.modelName;
  process.env.MIDSCENE_MODEL_FAMILY = MODEL_CONFIG.family;

  const allResults: TestResult[] = [];

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`测试网站: ${scenario.site}`);
    console.log('='.repeat(70));

    for (let round = 1; round <= ROUNDS; round++) {
      console.log(`\n第 ${round}/${ROUNDS} 轮:`);
      
      try {
        await page.goto(scenario.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 
        });
        await page.waitForTimeout(3000);
        
        const agent = new PlaywrightAgent(page);
        const result = await tryModelWithTimeout(agent, scenario.action, 30000);
        
        allResults.push({
          site: scenario.site,
          round,
          ...result
        });
        
        if (result.success) {
          console.log(`   ✅ 成功 (${(result.duration / 1000).toFixed(1)}秒)`);
        } else if (result.isRateLimit) {
          console.log(`   ⚠️  限流错误 (429)，立即跳过 (${(result.duration / 1000).toFixed(1)}秒)`);
        } else {
          console.log(`   ❌ 失败 (${(result.duration / 1000).toFixed(1)}秒)`);
          console.log(`   错误: ${result.error?.substring(0, 80)}...`);
        }
        
      } catch (error: any) {
        console.log(`   ❌ 页面加载失败: ${error.message}`);
      }
      
      await page.waitForTimeout(2000);
    }
  }

  await browser.close();

  console.log('\n\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 ${MODEL_CONFIG.name} 测试报告`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const successResults = allResults.filter(r => r.success);
  const failedResults = allResults.filter(r => !r.success);
  const rateLimitResults = failedResults.filter(r => r.isRateLimit);
  
  const successCount = successResults.length;
  const totalCount = allResults.length;
  const rateLimitCount = rateLimitResults.length;
  
  const successRate = (successCount / totalCount * 100).toFixed(1);
  const rateLimitRate = (rateLimitCount / totalCount * 100).toFixed(1);
  
  const avgDuration = successCount > 0
    ? (successResults.reduce((sum, r) => sum + r.duration, 0) / successCount / 1000).toFixed(1)
    : '-';
  
  const avgRateLimitDuration = rateLimitCount > 0
    ? (rateLimitResults.reduce((sum, r) => sum + r.duration, 0) / rateLimitCount / 1000).toFixed(1)
    : '-';

  console.log(`\n总体统计:`);
  console.log(`   成功率: ${successRate}% (${successCount}/${totalCount})`);
  console.log(`   限流率: ${rateLimitRate}% (${rateLimitCount}/${totalCount})`);
  console.log(`   平均耗时: ${avgDuration}秒 (仅成功的)`);
  if (rateLimitCount > 0) {
    console.log(`   限流平均检测时间: ${avgRateLimitDuration}秒 ⚡️ (快速跳过)`);
  }
  console.log(`   成本: ${MODEL_CONFIG.cost === 0 ? '免费' : '¥' + MODEL_CONFIG.cost}`);

  console.log(`\n各网站详细数据:`);
  for (const scenario of TEST_SCENARIOS) {
    const siteResults = allResults.filter(r => r.site === scenario.site);
    const siteSuccess = siteResults.filter(r => r.success);
    const siteRateLimit = siteResults.filter(r => r.isRateLimit);
    
    const siteRate = (siteSuccess.length / siteResults.length * 100).toFixed(0);
    const siteAvg = siteSuccess.length > 0
      ? (siteSuccess.reduce((sum, r) => sum + r.duration, 0) / siteSuccess.length / 1000).toFixed(1)
      : '-';
    
    const limitInfo = siteRateLimit.length > 0 ? `, ${siteRateLimit.length}次限流` : '';
    console.log(`   ${scenario.site}: ${siteRate}% 成功 (${siteSuccess.length}/${siteResults.length}), ${siteAvg}秒平均${limitInfo}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 结论:');
  
  if (rateLimitCount > totalCount * 0.3) {
    console.log(`\n⚠️  ${MODEL_CONFIG.name} 限流严重`);
    console.log(`   - 限流率: ${rateLimitRate}% (${rateLimitCount}次)`);
    console.log(`   - 成功率: ${successRate}%`);
    console.log(`   - 限流检测平均: ${avgRateLimitDuration}秒 (已优化)`);
    console.log('   - 不适合高频自动化场景');
    console.log('   - 建议仅用于复杂推理任务或作为备用');
  } else if (parseFloat(successRate) >= 80) {
    console.log(`\n✅ ${MODEL_CONFIG.name} 表现优秀！`);
    console.log(`   - 成功率: ${successRate}%`);
    console.log(`   - 限流率: ${rateLimitRate}%`);
    console.log(`   - 平均耗时: ${avgDuration}秒`);
    console.log(`   - 成本: ${MODEL_CONFIG.cost === 0 ? '免费' : '¥' + MODEL_CONFIG.cost}`);
    console.log('   - 推荐使用');
  } else {
    console.log(`\n⚠️  ${MODEL_CONFIG.name} 表现一般`);
    console.log(`   - 成功率: ${successRate}%`);
    console.log(`   - 限流率: ${rateLimitRate}%`);
    console.log('   - 建议谨慎使用');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
