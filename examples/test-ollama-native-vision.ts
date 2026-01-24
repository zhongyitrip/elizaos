/**
 * 测试 Ollama 原生 API 的视觉能力
 * 使用 /api/generate 而不是 /v1/chat/completions
 */

async function testOllamaNativeVision() {
  console.log('🔍 测试 Ollama 原生 API 视觉能力...\n');
  
  const baseURL = 'http://127.0.0.1:11434';
  const model = 'qwen3-vl:4b';
  
  // 使用一个简单的 base64 图片（1x1 红色像素）
  const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  console.log(`   - Endpoint: ${baseURL}/api/generate`);
  console.log(`   - Model: ${model}`);
  console.log('   - 测试: 发送图片 + 文本');
  console.log('');

  try {
    console.log('📤 发送视觉请求（30秒超时）...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`${baseURL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: '这是什么颜色？',
        images: [testImage],
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Ollama 原生 API 视觉功能正常！\n');
    console.log('🤖 模型回复:');
    console.log('   ' + data.response);
    
    console.log('\n🎉 Ollama 视觉模型工作正常！');
    console.log('\n⚠️  但是:');
    console.log('   - Ollama 原生 API (/api/generate) ✅ 支持视觉');
    console.log('   - Ollama OpenAI API (/v1) ❌ 不支持视觉');
    console.log('   - Midscene 只支持 OpenAI 格式 API');
    console.log('\n💡 结论:');
    console.log('   Midscene 暂时无法使用本地 Ollama 视觉模型');
    console.log('   需要等待 Ollama 完善 /v1 API 的视觉支持');
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('\n❌ 请求超时（30秒）');
    } else {
      console.error('\n❌ 测试失败:', error.message);
    }
  }
}

testOllamaNativeVision().catch(console.error);
