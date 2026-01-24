/**
 * 测试使用更大上下文窗口的 Ollama 视觉模型
 */

async function testOllamaLargeContext() {
  console.log('🔍 测试 Ollama 视觉模型（大上下文窗口）...\n');
  
  const baseURL = 'http://127.0.0.1:11434';
  const model = 'qwen3-vl:4b';
  
  // 使用一个非常小的测试图片
  const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  console.log(`   - Model: ${model}`);
  console.log(`   - 设置: num_ctx=32768 (32k 上下文)`);
  console.log('');

  try {
    console.log('📤 发送请求（30秒超时）...');
    
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
        stream: false,
        options: {
          num_ctx: 32768,  // 设置 32k 上下文
          temperature: 0.7
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ HTTP ${response.status}:`, errorText);
      
      console.log('\n💡 建议:');
      console.log('   1. 在 Ollama 设置中将 Context length 滑块拉到最右边（128k）');
      console.log('   2. 或者使用阿里云 Qwen 方案（已验证成功）');
      return;
    }

    const data = await response.json();
    
    console.log('✅ 成功！\n');
    console.log('🤖 模型回复:', data.response);
    console.log('\n🎉 Ollama 视觉模型工作正常！');
    console.log('💡 可以用于 Midscene 集成了');
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('\n❌ 请求超时');
    } else {
      console.error('\n❌ 测试失败:', error.message);
    }
    
    console.log('\n💡 如果仍然失败:');
    console.log('   - 使用阿里云 Qwen 方案（完全稳定）');
    console.log('   - 成本: 约 ¥0.001-0.005/次操作');
  }
}

testOllamaLargeContext().catch(console.error);
