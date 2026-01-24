/**
 * OpenRouter 视觉模型测试
 * 测试图像理解能力
 */

async function testOpenRouterVision() {
  console.log('🚀 测试 OpenRouter 视觉模型...\n');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_IMAGE_MODEL || 'x-ai/grok-2-vision-1212';
  
  if (!apiKey) {
    console.error('❌ 错误: OPENROUTER_API_KEY 未配置');
    process.exit(1);
  }
  
  console.log('✅ 配置信息:');
  console.log(`   - Vision Model: ${model}`);
  console.log(`   - API Key: ${apiKey.slice(0, 15)}...`);
  console.log('');

  // 使用一个公开的测试图片 URL
  const testImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/320px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg';

  try {
    console.log('📤 发送视觉请求到 OpenRouter...');
    console.log(`   测试图片: ${testImageUrl}`);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/elizaos',
        'X-Title': 'ElizaOS Vision Test'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请详细描述这张图片中的内容'
              },
              {
                type: 'image_url',
                image_url: {
                  url: testImageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ 响应成功！');
    console.log('\n🖼️ AI 视觉分析:');
    console.log('   ' + data.choices[0].message.content);
    console.log('\n📊 使用统计:');
    console.log(`   - Prompt Tokens: ${data.usage?.prompt_tokens || 'N/A'}`);
    console.log(`   - Completion Tokens: ${data.usage?.completion_tokens || 'N/A'}`);
    console.log(`   - Total Tokens: ${data.usage?.total_tokens || 'N/A'}`);
    
    console.log('\n🎉 OpenRouter 视觉模型测试成功！');
    console.log('💡 现在可以集成 Midscene.js 了！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.log('\n💡 故障排查:');
    console.log('   1. 检查 API Key 是否正确');
    console.log('   2. 检查余额: https://openrouter.ai/credits');
    console.log('   3. 尝试其他视觉模型:');
    console.log('      - google/gemini-2.0-flash-exp:free (免费)');
    console.log('      - anthropic/claude-3.5-sonnet (付费但更强)');
  }
}

testOpenRouterVision().catch(console.error);
