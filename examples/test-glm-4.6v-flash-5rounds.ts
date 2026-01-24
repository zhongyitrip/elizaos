/**
 * 测试智谱 GLM-4.6V-Flash 模型
 * 每个网站测试 5 遍，统计成功率和平均耗时
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

const ROUNDS = 5;

interface TestResult {
  site: string;
  round: number;
  success: boolean;
  duration: number;
  error?: string;
}

async function main() {
  console.log('🚀 智谱 GLM-4.6V-Flash 性能测试\n');
  console.log('模型配置:');
  console.log('   Model: glm-4.6v-flash');
  console.log('   Base URL: https://open.bigmodel.cn/api/paas/v4');
  console.log('   Family: glm-v');
  console.log('   成本: 免费\n');
  console.log(`测试网站: ${TEST_SCENARIOS.length} 个`);
  console.log(`每个网站测试: ${ROUNDS} 遍`);
  console.log(`总测试次数: ${TEST_SCENARIOS.length * ROUNDS} 次\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  process.env.MIDSCENE_MODEL_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
  process.env.MIDSCENE_MODEL_API_KEY = '0c17e7b44dc048568befbe0b40203a5e.XQF4hEsbGUDHJTi5';
  process.env.MIDSCENE_MODEL_NAME = 'glm-4.6v-flash';
  process.env.MIDSCENE_MODEL_FAMILY = 'glm-v';

  const allResults: TestResult[] = [];

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`测试网站: ${scenario.site}`);
    console.log('='.repeat(70));

    for (let round = 1; round <= ROUNDS; round++) {
      console.log(`\n第 ${round}/${ROUNDS} 轮:`);
      
      const startTime = Date.now();
      
      try {
        const agent = new PlaywrightAgent(page);
        
        await page.goto(scenario.url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 
        });
        await page.waitForTimeout(3000);
        
        await agent.aiAction(scenario.action);
        
        const duration = Date.now() - startTime;
        allResults.push({
          site: scenario.site,
          round,
          success: true,
          duration
        });
        
        console.log(`   ✅ 成功 (${(duration / 1000).toFixed(1)}秒)`);
        
      } catch (error: any) {
        const duration = Date.now() - startTime;
        allResults.push({
          site: scenario.site,
          round,
          success: false,
          duration,
          error: error.message
        });
        
        console.log(`   ❌ 失败 (${(duration / 1000).toFixed(1)}秒)`);
        console.log(`   错误: ${error.message.substring(0, 80)}...`);
      }
      
      await page.waitForTimeout(2000);
    }
  }

  await browser.close();

  console.log('\n\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 智谱 GLM-4.6V-Flash 测试报告');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const successResults = allResults.filter(r => r.success);
  const successCount = successResults.length;
  const totalCount = allResults.length;
  const successRate = (successCount / totalCount * 100).toFixed(1);
  const avgDuration = successCount > 0
    ? (successResults.reduce((sum, r) => sum + r.duration, 0) / successCount / 1000).toFixed(1)
    : '-';

  console.log(`\n总体统计:`);
  console.log(`   成功率: ${successRate}% (${successCount}/${totalCount})`);
  console.log(`   平均耗时: ${avgDuration}秒 (仅成功的)`);
  console.log(`   成本: 免费`);

  console.log(`\n各网站详细数据:`);
  for (const scenario of TEST_SCENARIOS) {
    const siteResults = allResults.filter(r => r.site === scenario.site);
    const siteSuccess = siteResults.filter(r => r.success);
    const siteRate = (siteSuccess.length / siteResults.length * 100).toFixed(0);
    const siteAvg = siteSuccess.length > 0
      ? (siteSuccess.reduce((sum, r) => sum + r.duration, 0) / siteSuccess.length / 1000).toFixed(1)
      : '-';
    
    console.log(`   ${scenario.site}: ${siteRate}% 成功 (${siteSuccess.length}/${siteResults.length}), ${siteAvg}秒平均`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 结论:');
  
  if (parseFloat(successRate) >= 90) {
    console.log('\n✅ GLM-4.6V-Flash 表现优秀！');
    console.log(`   - 成功率: ${successRate}%`);
    console.log(`   - 平均耗时: ${avgDuration}秒`);
    console.log('   - 完全免费');
    console.log('   - 推荐作为第二免费模型');
  } else if (parseFloat(successRate) >= 70) {
    console.log('\n⚠️  GLM-4.6V-Flash 表现良好');
    console.log(`   - 成功率: ${successRate}%`);
    console.log(`   - 平均耗时: ${avgDuration}秒`);
    console.log('   - 可以作为备用模型');
  } else {
    console.log('\n❌ GLM-4.6V-Flash 表现一般');
    console.log(`   - 成功率: ${successRate}%`);
    console.log('   - 不建议使用');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
