/**
 * OpenRouter 免费模型速度测试
 * 测试所有免费模型的响应速度和性能
 */

interface ModelTestResult {
    model: string;
    success: boolean;
    responseTime: number; // milliseconds
    tokensPerSecond?: number;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    error?: string;
}

// 所有免费模型配置
const FREE_MODELS = {
    PRIMARY: [
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemma-3-27b-it:free',
    ],
    BACKUP_SMALL: [
        'google/gemma-3-12b-it:free',
        'qwen/qwen3-4b:free',
    ],
    BACKUP_LARGE: [
        'meta-llama/llama-3.1-405b-instruct:free',
        'deepseek/deepseek-r1-0528:free',
        'qwen/qwen3-next-80b-a3b-instruct:free',
    ],
    VISION: [
        'google/gemini-2.0-flash-exp:free',
        'qwen/qwen-2.5-vl-7b-instruct:free',
        'nvidia/nemotron-nano-12b-v2-vl:free',
    ],
    CODE: [
        'qwen/qwen3-coder:free',
        'mistralai/devstral-2512:free',
    ]
};

// 测试提示词
const TEST_PROMPT = '请用一句话解释什么是区块链技术';

/**
 * 测试单个模型
 */
async function testModel(apiKey: string, model: string): Promise<ModelTestResult> {
    const startTime = Date.now();

    try {
        console.log(`\n🔄 测试模型: ${model}`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/elizaos',
                'X-Title': 'ElizaOS Speed Test'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: TEST_PROMPT
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            return {
                model,
                success: false,
                responseTime,
                error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`
            };
        }

        const data = await response.json();
        const usage = data.usage || {};

        // 计算 tokens/second
        const tokensPerSecond = usage.completion_tokens
            ? (usage.completion_tokens / (responseTime / 1000)).toFixed(2)
            : undefined;

        console.log(`✅ 成功 - 响应时间: ${responseTime}ms, 速度: ${tokensPerSecond || 'N/A'} tokens/s`);

        return {
            model,
            success: true,
            responseTime,
            tokensPerSecond: tokensPerSecond ? parseFloat(tokensPerSecond) : undefined,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens
        };

    } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        console.log(`❌ 失败 - ${error instanceof Error ? error.message : String(error)}`);

        return {
            model,
            success: false,
            responseTime,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * 测试所有模型
 */
async function testAllModels() {
    console.log('🚀 OpenRouter 免费模型速度测试\n');
    console.log('='.repeat(80));

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error('❌ 错误: OPENROUTER_API_KEY 未配置');
        console.log('请在 .env 文件中设置 OPENROUTER_API_KEY');
        process.exit(1);
    }

    console.log(`✅ API Key: ${apiKey.slice(0, 15)}...`);
    console.log(`📝 测试提示词: "${TEST_PROMPT}"`);
    console.log('='.repeat(80));

    const results: ModelTestResult[] = [];

    // 测试所有模型类别
    for (const [category, models] of Object.entries(FREE_MODELS)) {
        console.log(`\n\n📊 测试类别: ${category}`);
        console.log('-'.repeat(80));

        for (const model of models) {
            const result = await testModel(apiKey, model);
            results.push(result);

            // 避免触发速率限制，每个请求之间等待2秒
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // 生成报告
    generateReport(results);
}

/**
 * 生成测试报告
 */
function generateReport(results: ModelTestResult[]) {
    console.log('\n\n');
    console.log('='.repeat(80));
    console.log('📊 测试报告');
    console.log('='.repeat(80));

    // 成功的模型
    const successResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    console.log(`\n✅ 成功: ${successResults.length} / ${results.length}`);
    console.log(`❌ 失败: ${failedResults.length} / ${results.length}`);

    if (successResults.length > 0) {
        console.log('\n\n🏆 成功模型排行榜 (按响应速度排序)');
        console.log('-'.repeat(80));

        // 按响应时间排序
        const sortedBySpeed = [...successResults].sort((a, b) => a.responseTime - b.responseTime);

        console.log('\n按响应时间排序:');
        console.log(String.fromCharCode(9484) + String.fromCharCode(9472).repeat(78) + String.fromCharCode(9488));
        console.log(`${String.fromCharCode(9474)} ${'排名'.padEnd(6)} ${'模型'.padEnd(45)} ${'响应时间'.padEnd(12)} ${'速度'.padEnd(12)} ${String.fromCharCode(9474)}`);
        console.log(String.fromCharCode(9500) + String.fromCharCode(9472).repeat(78) + String.fromCharCode(9508));

        sortedBySpeed.forEach((result, index) => {
            const rank = `#${index + 1}`;
            const model = result.model.length > 43 ? result.model.substring(0, 40) + '...' : result.model;
            const time = `${result.responseTime}ms`;
            const speed = result.tokensPerSecond ? `${result.tokensPerSecond} t/s` : 'N/A';

            console.log(`${String.fromCharCode(9474)} ${rank.padEnd(6)} ${model.padEnd(45)} ${time.padEnd(12)} ${speed.padEnd(12)} ${String.fromCharCode(9474)}`);
        });
        console.log(String.fromCharCode(9492) + String.fromCharCode(9472).repeat(78) + String.fromCharCode(9496));

        // 按 tokens/second 排序
        const withTokenSpeed = successResults.filter(r => r.tokensPerSecond);
        if (withTokenSpeed.length > 0) {
            const sortedByTokens = [...withTokenSpeed].sort((a, b) =>
                (b.tokensPerSecond || 0) - (a.tokensPerSecond || 0)
            );

            console.log('\n\n按生成速度排序 (tokens/second):');
            console.log(String.fromCharCode(9484) + String.fromCharCode(9472).repeat(78) + String.fromCharCode(9488));
            console.log(`${String.fromCharCode(9474)} ${'排名'.padEnd(6)} ${'模型'.padEnd(45)} ${'速度'.padEnd(15)} ${'响应时间'.padEnd(10)} ${String.fromCharCode(9474)}`);
            console.log(String.fromCharCode(9500) + String.fromCharCode(9472).repeat(78) + String.fromCharCode(9508));

            sortedByTokens.forEach((result, index) => {
                const rank = `#${index + 1}`;
                const model = result.model.length > 43 ? result.model.substring(0, 40) + '...' : result.model;
                const speed = `${result.tokensPerSecond} t/s`;
                const time = `${result.responseTime}ms`;

                console.log(`${String.fromCharCode(9474)} ${rank.padEnd(6)} ${model.padEnd(45)} ${speed.padEnd(15)} ${time.padEnd(10)} ${String.fromCharCode(9474)}`);
            });
            console.log(String.fromCharCode(9492) + String.fromCharCode(9472).repeat(78) + String.fromCharCode(9496));
        }

        // 统计信息
        console.log('\n\n📈 统计信息');
        console.log('-'.repeat(80));

        const avgResponseTime = (successResults.reduce((sum, r) => sum + r.responseTime, 0) / successResults.length).toFixed(2);
        const minResponseTime = Math.min(...successResults.map(r => r.responseTime));
        const maxResponseTime = Math.max(...successResults.map(r => r.responseTime));

        console.log(`平均响应时间: ${avgResponseTime}ms`);
        console.log(`最快响应时间: ${minResponseTime}ms`);
        console.log(`最慢响应时间: ${maxResponseTime}ms`);

        if (withTokenSpeed.length > 0) {
            const avgTokenSpeed = (withTokenSpeed.reduce((sum, r) => sum + (r.tokensPerSecond || 0), 0) / withTokenSpeed.length).toFixed(2);
            console.log(`平均生成速度: ${avgTokenSpeed} tokens/s`);
        }
    }

    if (failedResults.length > 0) {
        console.log('\n\n❌ 失败模型列表');
        console.log('-'.repeat(80));

        failedResults.forEach(result => {
            console.log(`\n模型: ${result.model}`);
            console.log(`错误: ${result.error}`);
            console.log(`尝试时间: ${result.responseTime}ms`);
        });
    }

    // 推荐配置
    console.log('\n\n💡 推荐配置');
    console.log('-'.repeat(80));

    if (successResults.length > 0) {
        const fastest = successResults.reduce((prev, curr) =>
            prev.responseTime < curr.responseTime ? prev : curr
        );

        console.log(`\n最快模型: ${fastest.model}`);
        console.log(`响应时间: ${fastest.responseTime}ms`);
        if (fastest.tokensPerSecond) {
            console.log(`生成速度: ${fastest.tokensPerSecond} tokens/s`);
        }

        console.log('\n建议在 .env 中配置:');
        console.log(`OPENROUTER_SMALL_MODEL=${fastest.model}`);
        console.log(`OPENROUTER_LARGE_MODEL=${fastest.model}`);
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('✅ 测试完成！');
    console.log('='.repeat(80));
}

// 运行测试
testAllModels().catch(console.error);
