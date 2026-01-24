/**
 * 测试 Ollama 的 OpenAI 兼容 API 是否正常工作
 */

async function testOllamaAPI() {
  console.log('🔍 测试 Ollama OpenAI 兼容 API...\n');
  
  const baseURL = 'http://127.0.0.1:11434/v1';
  const model = 'qwen3-vl:4b';
  
  console.log(`   - Endpoint: ${baseURL}`);
  console.log(`   - Model: ${model}`);
  console.log('');

  try {
    console.log('📤 发送测试请求...');
    
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请简单介绍一下你自己'
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Ollama API 响应成功！\n');
    console.log('🤖 模型回复:');
    console.log('   ' + data.choices[0].message.content);
    console.log('\n📊 使用统计:');
    console.log(`   - Prompt Tokens: ${data.usage?.prompt_tokens || 'N/A'}`);
    console.log(`   - Completion Tokens: ${data.usage?.completion_tokens || 'N/A'}`);
    console.log(`   - Total Tokens: ${data.usage?.total_tokens || 'N/A'}`);
    
    console.log('\n🎉 Ollama OpenAI 兼容 API 工作正常！');
    console.log('💡 现在可以用于 Midscene 集成了');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.log('\n💡 故障排查:');
    console.log('   1. 确认 Ollama 服务运行: ollama serve');
    console.log('   2. 确认模型已安装: ollama list | grep qwen3-vl');
    console.log('   3. 检查端口: curl http://127.0.0.1:11434/api/tags');
  }
}

testOllamaAPI().catch(console.error);
