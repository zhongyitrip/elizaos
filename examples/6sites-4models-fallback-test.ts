/**
 * 最优回退策略实战测试
 * 策略：阿里云2b(免费最快) → 智谱Flash(免费) → 阿里云7b(便宜) → 阿里云plus(强)
 * 测试多个 Web3 网站
 */

import { chromium } from 'playwright';
import { OptimalFallbackAgent } from '../custom-agents/midscene/OptimalFallbackAgent';

const WEB3_TEST_SCENARIOS = [
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
  },
  {
    site: 'GitHub Pricing',
    url: 'https://github.com/pricing',
    action: '点击 Get started for free 按钮'
  }
];

async function main() {
  console.log('🚀 最优回退策略实战测试\n');
  console.log('策略顺序:');
  console.log('   1️⃣ 阿里云 2b (免费, 最快 13.2秒)');
  console.log('   2️⃣ 智谱 Flash (免费, 稍慢 15.8秒)');
  console.log('   3️⃣ 阿里云 7b (便宜 ¥0.001, 快 8秒)');
  console.log('   4️⃣ 阿里云 plus (付费 ¥0.008, 很快 3-5秒)');
  console.log('\n测试网站: ' + WEB3_TEST_SCENARIOS.length + ' 个\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // 启用缓存功能，大幅提升执行效率
  const agent = new OptimalFallbackAgent(page, {
    cache: {
      enabled: true,
      id: 'web3-fallback-cache',
      strategy: 'read-write'
    }
  });

  for (let i = 0; i < WEB3_TEST_SCENARIOS.length; i++) {
    const scenario = WEB3_TEST_SCENARIOS[i];
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`测试 ${i + 1}/${WEB3_TEST_SCENARIOS.length}: ${scenario.site}`);
    console.log('='.repeat(70));
    console.log(`URL: ${scenario.url}`);
    
    try {
      await page.goto(scenario.url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      await page.waitForTimeout(3000);
      
      await agent.smartAction(scenario.action);
      
      console.log(`✅ ${scenario.site} 测试成功`);
      
    } catch (error: any) {
      console.log(`❌ ${scenario.site} 测试失败: ${error.message}`);
    }
    
    await page.waitForTimeout(2000);
  }

  // 刷新缓存到文件（清理未使用的缓存）
  await agent.flushCache({ cleanUnused: true });

  await browser.close();

  console.log('\n\n');
  agent.printStats();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 策略验证结论');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const stats = agent.getStats();
  const freeSuccessRate = parseFloat(stats['阿里云2b'].rate) + parseFloat(stats['智谱4.6V'].rate);
  
  console.log(`\n免费模型使用率: ${freeSuccessRate.toFixed(1)}%`);
  console.log(`总成本: ¥${stats.totalCost}`);
  
  if (freeSuccessRate >= 70) {
    console.log('\n✅ 策略验证成功！');
    console.log('   - 大部分操作使用免费模型');
    console.log('   - 成本控制优秀');
    console.log('   - 建议在生产环境使用');
  } else if (freeSuccessRate >= 50) {
    console.log('\n⚠️  策略表现一般');
    console.log('   - 免费模型使用率偏低');
    console.log('   - 可能需要调整超时时间');
  } else {
    console.log('\n❌ 策略需要优化');
    console.log('   - 免费模型成功率过低');
    console.log('   - 建议直接使用付费模型');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
