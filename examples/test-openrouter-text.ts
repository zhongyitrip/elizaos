/**
 * OpenRouter 文本模型测试
 * 测试普通文本生成能力
 */

async function testOpenRouterText() {
  console.log('🚀 测试 OpenRouter 文本模型...\n');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_LARGE_MODEL || 'google/gemini-2.0-flash-exp:free';
  
  if (!apiKey) {
    console.error('❌ 错误: OPENROUTER_API_KEY 未配置');
    process.exit(1);
  }
  
  console.log('✅ 配置信息:');
  console.log(`   - Model: ${model}`);
  console.log(`   - API Key: ${apiKey.slice(0, 15)}...`);
  console.log('');

  try {
    console.log('📤 发送请求到 OpenRouter...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/elizaos',
        'X-Title': 'ElizaOS Test'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: '请用一句话介绍什么是 AI 自动化测试'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ 响应成功！');
    console.log('\n📝 AI 回复:');
    console.log('   ' + data.choices[0].message.content);
    console.log('\n📊 使用统计:');
    console.log(`   - Prompt Tokens: ${data.usage?.prompt_tokens || 'N/A'}`);
    console.log(`   - Completion Tokens: ${data.usage?.completion_tokens || 'N/A'}`);
    console.log(`   - Total Tokens: ${data.usage?.total_tokens || 'N/A'}`);
    
    console.log('\n🎉 OpenRouter 文本模型测试成功！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.log('\n💡 故障排查:');
    console.log('   1. 检查 API Key 是否正确');
    console.log('   2. 检查余额: https://openrouter.ai/credits');
    console.log('   3. 检查模型是否可用: https://openrouter.ai/models');
  }
}

testOpenRouterText().catch(console.error);
