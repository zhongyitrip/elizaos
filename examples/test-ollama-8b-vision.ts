/**
 * 测试 Ollama qwen3-vl:8b 视觉模型
 * 看看更大的模型是否能解决崩溃问题
 */

async function testOllama8bVision() {
  console.log('🔍 测试 Ollama qwen3-vl:8b 视觉模型...\n');
  
  const baseURL = 'http://127.0.0.1:11434';
  const model = 'qwen3-vl:8b';
  
  // 使用一个非常小的测试图片
  const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  
  console.log(`   - Model: ${model} (更大的模型)`);
  console.log(`   - Size: 6.1 GB`);
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
        stream: false,
        options: {
          num_ctx: 32768,
          temperature: 0.7
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ qwen3-vl:8b 也失败了`);
      console.error(`   HTTP ${response.status}:`, errorText);
      
      console.log('\n💡 让我们试试其他视觉模型...');
      return false;
    }

    const data = await response.json();
    
    console.log('✅ qwen3-vl:8b 成功！\n');
    console.log('🤖 模型回复:', data.response);
    console.log('\n🎉 找到可用的 Ollama 视觉模型了！');
    console.log('💡 现在可以用 qwen3-vl:8b 配合 Midscene 了');
    return true;
    
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('\n❌ qwen3-vl:8b 超时');
    } else {
      console.error('\n❌ qwen3-vl:8b 失败:', error.message);
    }
    return false;
  }
}

testOllama8bVision().catch(console.error);
