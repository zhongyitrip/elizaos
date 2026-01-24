/**
 * 智谱 GLM 所有视觉模型完整测试
 * 测试免费和付费模型的性能、速度、成功率
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

interface ModelConfig {
  name: string;
  apiName: string;
  family: string;
  cost: string;
  description: string;
}

interface TestResult {
  model: string;
  scenario: string;
  success: boolean;
  duration: number;
  error?: string;
}

const ZHIPU_MODELS: ModelConfig[] = [
  {
    name: 'GLM-4V-Flash',
    apiName: 'glm-4v-flash',
    family: 'glm-v',
    cost: '免费',
    description: '免费多模态模型'
  },
  {
    name: 'GLM-4.6V',
    apiName: 'glm-4.6v',
    family: 'glm-v',
    cost: '¥0.01/千tokens',
    description: '最新视觉模型'
  },
  {
    name: 'GLM-4V',
    apiName: 'glm-4v',
    family: 'glm-v',
    cost: '¥0.01/千tokens',
    description: '标准视觉模型'
  },
  {
    name: 'GLM-4V-Plus',
    apiName: 'glm-4v-plus',
    family: 'glm-v',
    cost: '¥0.05/千tokens',
    description: '高级视觉模型'
  }
];

const TEST_SCENARIOS = [
  {
    name: '登录按钮',
    url: 'https://github.com/login',
    action: '点击登录按钮'
  },
  {
    name: '大按钮',
    url: 'https://github.com/pricing',
    action: '点击 Get started for free 按钮'
  },
  {
    name: '导航菜单',
    url: 'https://github.com',
    action: '点击 Solutions 菜单'
  },
  {
    name: '搜索框',
    url: 'https://github.com',
    action: '点击搜索框'
  }
];

async function testModelScenario(
  page: any,
  model: ModelConfig,
  scenario: any
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    process.env.MIDSCENE_MODEL_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
    process.env.MIDSCENE_MODEL_API_KEY = '0c17e7b44dc048568befbe0b40203a5e.XQF4hEsbGUDHJTi5';
    process.env.MIDSCENE_MODEL_NAME = model.apiName;
    process.env.MIDSCENE_MODEL_FAMILY = model.family;
    
    const agent = new PlaywrightAgent(page);
    
    await page.goto(scenario.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    await agent.aiAction(scenario.action);
    
    const duration = Date.now() - startTime;
    return {
      model: model.name,
      scenario: scenario.name,
      success: true,
      duration
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      model: model.name,
      scenario: scenario.name,
      success: false,
      duration,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 智谱 GLM 视觉模型完整测试\n');
  console.log('测试模型:');
  for (const model of ZHIPU_MODELS) {
    console.log(`   - ${model.name} (${model.cost})`);
  }
  console.log('');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const allResults: TestResult[] = [];

  for (const model of ZHIPU_MODELS) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`测试模型: ${model.name} (${model.cost})`);
    console.log('='.repeat(70));

    for (let i = 0; i < TEST_SCENARIOS.length; i++) {
      const scenario = TEST_SCENARIOS[i];
      console.log(`\n[${i + 1}/${TEST_SCENARIOS.length}] ${scenario.name}: ${scenario.action}`);
      
      const result = await testModelScenario(page, model, scenario);
      allResults.push(result);
      
      if (result.success) {
        console.log(`   ✅ 成功 (${(result.duration / 1000).toFixed(1)}秒)`);
      } else {
        console.log(`   ❌ 失败 (${(result.duration / 1000).toFixed(1)}秒)`);
        console.log(`   错误: ${result.error?.substring(0, 100)}...`);
      }
      
      await page.waitForTimeout(2000);
    }
  }

  await browser.close();

  console.log('\n\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 智谱 GLM 视觉模型完整测试报告');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const model of ZHIPU_MODELS) {
    const modelResults = allResults.filter(r => r.model === model.name);
    const successCount = modelResults.filter(r => r.success).length;
    const totalCount = modelResults.length;
    const successRate = (successCount / totalCount * 100).toFixed(1);
    const avgDuration = (modelResults.reduce((sum, r) => sum + r.duration, 0) / modelResults.length / 1000).toFixed(1);
    
    console.log(`\n${model.name} (${model.cost})`);
    console.log(`   成功率: ${successRate}% (${successCount}/${totalCount})`);
    console.log(`   平均耗时: ${avgDuration}秒`);
    
    console.log('   详细结果:');
    for (const r of modelResults) {
      const status = r.success ? '✅' : '❌';
      const time = (r.duration / 1000).toFixed(1) + '秒';
      console.log(`      ${status} ${r.scenario}: ${time}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 对比总结:');
  console.log('\n| 模型 | 成功率 | 平均耗时 | 成本 | 推荐度 |');
  console.log('|------|--------|---------|------|--------|');
  
  for (const model of ZHIPU_MODELS) {
    const modelResults = allResults.filter(r => r.model === model.name);
    const successCount = modelResults.filter(r => r.success).length;
    const totalCount = modelResults.length;
    const successRate = (successCount / totalCount * 100).toFixed(1);
    const avgDuration = (modelResults.reduce((sum, r) => sum + r.duration, 0) / modelResults.length / 1000).toFixed(1);
    
    let rating = '';
    const rate = parseFloat(successRate);
    if (rate >= 90) rating = '⭐⭐⭐⭐⭐';
    else if (rate >= 75) rating = '⭐⭐⭐⭐';
    else if (rate >= 60) rating = '⭐⭐⭐';
    else if (rate >= 40) rating = '⭐⭐';
    else rating = '⭐';
    
    console.log(`| ${model.name} | ${successRate}% | ${avgDuration}秒 | ${model.cost} | ${rating} |`);
  }
  
  console.log('\n参考对比:');
  console.log('| 阿里云 2b | 50% | 10秒 | 免费 | ⭐⭐ |');
  console.log('| 阿里云 7b | ~90% | 8秒 | ¥0.001 | ⭐⭐⭐⭐ |');
  console.log('| 阿里云 plus | 95%+ | 3-5秒 | ¥0.008 | ⭐⭐⭐⭐⭐ |');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const freeModels = ZHIPU_MODELS.filter(m => m.cost === '免费');
  if (freeModels.length > 0) {
    const freeResults = allResults.filter(r => freeModels.some(m => m.name === r.model));
    const freeSuccessRate = (freeResults.filter(r => r.success).length / freeResults.length * 100).toFixed(1);
    
    console.log('\n🎯 免费模型推荐:');
    if (parseFloat(freeSuccessRate) > 70) {
      console.log(`   ✅ 智谱 GLM-4V-Flash 表现优秀！`);
      console.log(`   - 成功率: ${freeSuccessRate}%`);
      console.log(`   - 建议: 优先使用智谱免费模型`);
    } else if (parseFloat(freeSuccessRate) > 50) {
      console.log(`   ⚠️  智谱 GLM-4V-Flash 表现一般`);
      console.log(`   - 成功率: ${freeSuccessRate}%`);
      console.log(`   - 建议: 与阿里云混合使用`);
    } else {
      console.log(`   ❌ 智谱免费模型表现较差`);
      console.log(`   - 成功率: ${freeSuccessRate}%`);
      console.log(`   - 建议: 使用阿里云方案`);
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
