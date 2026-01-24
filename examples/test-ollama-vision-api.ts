/**
 * 测试 Ollama 视觉模型的 OpenAI 兼容 API
 * 诊断为什么 Midscene 会卡住
 */

async function testOllamaVisionAPI() {
  console.log('🔍 测试 Ollama 视觉模型 API...\n');
  
  const baseURL = 'http://127.0.0.1:11434/v1';
  const model = 'qwen3-vl:4b';
  
  // 使用一个简单的 base64 图片（1x1 红色像素）
  const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  console.log(`   - Endpoint: ${baseURL}`);
  console.log(`   - Model: ${model}`);
  console.log('   - 测试: 发送图片 + 文本');
  console.log('');

  try {
    console.log('📤 发送视觉请求（10秒超时）...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
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
                text: '这是什么颜色？'
              },
              {
                type: 'image_url',
                image_url: {
                  url: testImage
                }
              }
            ]
          }
        ],
        max_tokens: 50
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Ollama 视觉 API 响应成功！\n');
    console.log('🤖 模型回复:');
    console.log('   ' + data.choices[0].message.content);
    
    console.log('\n🎉 Ollama 视觉 API 工作正常！');
    console.log('💡 可以用于 Midscene 集成');
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('\n❌ 请求超时（10秒）');
      console.log('\n💡 可能的原因:');
      console.log('   1. Ollama 的 /v1 端点不支持视觉输入');
      console.log('   2. qwen3-vl 模型需要使用原生 Ollama API');
      console.log('   3. 图片格式不被支持');
      console.log('\n🔧 解决方案:');
      console.log('   - Midscene 可能需要使用阿里云或 OpenRouter');
      console.log('   - 或者等待 Ollama 完善 OpenAI 兼容 API');
    } else {
      console.error('\n❌ 测试失败:', error.message);
    }
  }
}

testOllamaVisionAPI().catch(console.error);
