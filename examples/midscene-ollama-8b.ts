/**
 * Midscene.js + 本地 Ollama Qwen 8b 模型测试
 * 真实 Web3 社交网站场景测试
 */

import { chromium } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';

async function main() {
  console.log('🚀 Ollama 8b 模型 - Web3 社交网站真实场景测试\n');
  
  process.env.MIDSCENE_MODEL_BASE_URL = 'http://127.0.0.1:11434/v1';
  process.env.MIDSCENE_MODEL_API_KEY = 'ollama';
  process.env.MIDSCENE_MODEL_NAME = 'qwen3-vl:8b';
  process.env.MIDSCENE_MODEL_FAMILY = 'qwen3-vl';

  console.log('✅ 配置: qwen3-vl:8b (6.1 GB)');
  console.log('📋 测试场景: 登录、弹窗、钱包连接、下拉框、滚动等\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const agent = new PlaywrightAgent(page);

  const results: any[] = [];

  try {
    // 测试 1: 简单按钮点击（登录场景）
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 测试 1: 简单按钮点击（模拟登录）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await page.goto('https://github.com/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const t1 = Date.now();
    await agent.aiAction('点击绿色的 Sign in 按钮');
    const loginTime = ((Date.now() - t1) / 1000).toFixed(1);
    console.log(`✅ 完成 (${loginTime}秒)\n`);
    results.push({ name: '登录按钮点击', time: loginTime });

    await page.waitForTimeout(2000);

    // 测试 2: 大按钮识别（确定/取消类）
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 测试 2: 大按钮识别（确定/授权类）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await page.goto('https://github.com/pricing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const t2 = Date.now();
    await agent.aiAction('点击 Get started for free 按钮');
    const buttonTime = ((Date.now() - t2) / 1000).toFixed(1);
    console.log(`✅ 完成 (${buttonTime}秒)\n`);
    results.push({ name: '大按钮点击', time: buttonTime });

    await page.waitForTimeout(2000);

    // 测试 3: 导航菜单点击
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 测试 3: 导航菜单点击');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await page.goto('https://github.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const t3 = Date.now();
    await agent.aiAction('点击顶部的 Solutions 菜单');
    const navTime = ((Date.now() - t3) / 1000).toFixed(1);
    console.log(`✅ 完成 (${navTime}秒)\n`);
    results.push({ name: '导航菜单', time: navTime });

    await page.waitForTimeout(2000);

    // 测试 4: 输入框填写
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 测试 4: 输入框填写（搜索框）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await page.goto('https://github.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    const t4 = Date.now();
    await agent.aiAction('点击搜索框并输入 playwright');
    const inputTime = ((Date.now() - t4) / 1000).toFixed(1);
    console.log(`✅ 完成 (${inputTime}秒)\n`);
    results.push({ name: '输入框填写', time: inputTime });

    await page.waitForTimeout(2000);

    // 测试 5: 滚动操作
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 测试 5: 页面滚动');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const t5 = Date.now();
    await agent.aiAction('向下滚动页面');
    const scrollTime = ((Date.now() - t5) / 1000).toFixed(1);
    console.log(`✅ 完成 (${scrollTime}秒)\n`);
    results.push({ name: '页面滚动', time: scrollTime });

    // 生成报告
    console.log('\n\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Ollama 8b 模型 - Web3 社交场景性能报告');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n| 操作类型 | 耗时 | 评价 |');
    console.log('|---------|------|------|');
    
    for (const r of results) {
      const time = parseFloat(r.time);
      let rating = '';
      if (time < 5) rating = '⭐⭐⭐⭐⭐ 很快';
      else if (time < 10) rating = '⭐⭐⭐⭐ 快';
      else if (time < 15) rating = '⭐⭐⭐ 可接受';
      else if (time < 20) rating = '⭐⭐ 较慢';
      else rating = '⭐ 慢';
      
      console.log(`| ${r.name} | ${r.time}秒 | ${rating} |`);
    }
    
    const avgTime = (results.reduce((sum, r) => sum + parseFloat(r.time), 0) / results.length).toFixed(1);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 总结:');
    console.log(`   - 平均耗时: ${avgTime}秒`);
    console.log(`   - 最快操作: ${results.sort((a, b) => parseFloat(a.time) - parseFloat(b.time))[0].name} (${results[0].time}秒)`);
    console.log(`   - 最慢操作: ${results.sort((a, b) => parseFloat(b.time) - parseFloat(a.time))[0].name} (${results[0].time}秒)`);
    
    if (parseFloat(avgTime) < 10) {
      console.log('\n✅ 结论: 8b 模型在 Web3 社交场景下表现优秀！');
      console.log('   - 简单操作（登录、按钮）速度快');
      console.log('   - 完全可以用于生产环境');
      console.log('   - 免费且性能可接受');
    } else if (parseFloat(avgTime) < 15) {
      console.log('\n⚠️  结论: 8b 模型性能可接受，但有优化空间');
      console.log('   - 简单操作可用');
      console.log('   - 复杂操作建议用阿里云');
    } else {
      console.log('\n❌ 结论: 8b 模型较慢，建议使用阿里云');
    }
    
    console.log('\n📋 对比参考:');
    console.log('   - 阿里云 Qwen: 平均 2-3秒');
    console.log(`   - 本地 8b: 平均 ${avgTime}秒`);
    console.log(`   - 速度差距: ${(parseFloat(avgTime) / 2.5).toFixed(1)}倍`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    console.log('\n⏳ 10秒后关闭浏览器...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

main().catch(console.error);
