#!/usr/bin/env bun
/**
 * Comprehensive Free Model Testing Script
 * Tests each model multiple times with various prompts
 */

import { config } from 'dotenv';

config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

if (!OPENROUTER_API_KEY) {
    console.error('❌ Error: OPENROUTER_API_KEY not found in .env');
    console.error('💡 Please add your API key to .env file:');
    console.error('   OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    process.exit(1);
}

// All free models to test
const FREE_MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-3-27b-it:free',
    'google/gemma-3-12b-it:free',
    'meta-llama/llama-3.1-405b-instruct:free'
];

// Test prompts with varying complexity
const TEST_PROMPTS = [
    {
        name: 'Simple Greeting',
        prompt: 'Say "Hello, World!" in one sentence.',
        expectedTokens: 10,
    },
    {
        name: 'Medium Explanation',
        prompt: 'Explain what blockchain is in 2-3 sentences.',
        expectedTokens: 50,
    },
    {
        name: 'Code Generation',
        prompt: 'Write a simple JavaScript function to calculate the sum of an array.',
        expectedTokens: 100,
    },
    {
        name: 'Complex Reasoning',
        prompt: 'Explain the difference between async/await and Promises in JavaScript, with examples.',
        expectedTokens: 200,
    },
    {
        name: 'Chinese Task',
        prompt: '用中文解释什么是区块链，2-3句话。',
        expectedTokens: 50,
    },
];

interface TestResult {
    model: string;
    modelShortName: string;
    prompt: string;
    promptName: string;
    attempt: number;
    success: boolean;
    latency: number;
    tokensGenerated?: number;
    error?: string;
    rateLimitHit: boolean;
    timestamp: string;
}

/**
 * Test a single model with a prompt
 */
async function testModelOnce(
    modelName: string,
    prompt: string,
    promptName: string,
    attempt: number
): Promise<TestResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    const modelShortName = modelName.split('/')[1]?.split(':')[0] || modelName;

    try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/zhongyitrip/elizaos',
                'X-Title': 'ElizaOS Free Model Pool Test',
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        const latency = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            const isRateLimit = response.status === 429 || errorText.includes('rate limit');

            return {
                model: modelName,
                modelShortName,
                prompt,
                promptName,
                attempt,
                success: false,
                latency,
                error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
                rateLimitHit: isRateLimit,
                timestamp,
            };
        }

        const data = await response.json();

        if (data.error) {
            const isRateLimit = data.error.message?.includes('rate limit') || data.error.code === 429;
            return {
                model: modelName,
                modelShortName,
                prompt,
                promptName,
                attempt,
                success: false,
                latency,
                error: data.error.message || JSON.stringify(data.error).substring(0, 100),
                rateLimitHit: isRateLimit,
                timestamp,
            };
        }

        const tokensGenerated = data.choices?.[0]?.message?.content?.split(' ').length || 0;

        return {
            model: modelName,
            modelShortName,
            prompt,
            promptName,
            attempt,
            success: true,
            latency,
            tokensGenerated,
            rateLimitHit: false,
            timestamp,
        };
    } catch (error) {
        const latency = Date.now() - startTime;
        return {
            model: modelName,
            modelShortName,
            prompt,
            promptName,
            attempt,
            success: false,
            latency,
            error: error instanceof Error ? error.message : String(error),
            rateLimitHit: false,
            timestamp,
        };
    }
}

/**
 * Test a model with all prompts, multiple attempts each
 */
async function testModelComprehensive(
    modelName: string,
    attemptsPerPrompt: number = 3
): Promise<TestResult[]> {
    const modelShortName = modelName.split('/')[1]?.split(':')[0] || modelName;
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 Testing Model: ${modelShortName}`);
    console.log(`${'='.repeat(80)}\n`);

    const results: TestResult[] = [];
    let consecutiveRateLimits = 0;

    for (const testPrompt of TEST_PROMPTS) {
        console.log(`\n📝 Prompt: ${testPrompt.name}`);
        console.log(`   "${testPrompt.prompt.substring(0, 50)}..."`);

        for (let attempt = 1; attempt <= attemptsPerPrompt; attempt++) {
            // Check if we hit too many rate limits
            if (consecutiveRateLimits >= 2) {
                console.log(`   ⚠️  Skipping remaining tests due to consecutive rate limits`);
                break;
            }

            process.stdout.write(`   Attempt ${attempt}/${attemptsPerPrompt}... `);

            const result = await testModelOnce(
                modelName,
                testPrompt.prompt,
                testPrompt.name,
                attempt
            );

            results.push(result);

            if (result.success) {
                console.log(`✅ ${result.latency}ms (${result.tokensGenerated} tokens)`);
                consecutiveRateLimits = 0;
            } else if (result.rateLimitHit) {
                console.log(`⚠️  Rate limit hit`);
                consecutiveRateLimits++;
            } else {
                console.log(`❌ ${result.error?.substring(0, 50)}`);
                consecutiveRateLimits = 0;
            }

            // Wait between requests to avoid rate limits
            if (attempt < attemptsPerPrompt) {
                const waitTime = 3000; // 3 seconds
                process.stdout.write(`   Waiting ${waitTime / 1000}s... `);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                console.log('✓');
            }
        }

        // If we hit rate limits, stop testing this model
        if (consecutiveRateLimits >= 2) {
            break;
        }

        // Wait longer between different prompts
        if (TEST_PROMPTS.indexOf(testPrompt) < TEST_PROMPTS.length - 1) {
            const waitTime = 5000; // 5 seconds
            console.log(`\n   ⏳ Waiting ${waitTime / 1000}s before next prompt...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    return results;
}

/**
 * Generate summary statistics
 */
function generateSummary(allResults: TestResult[]) {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 COMPREHENSIVE TEST RESULTS SUMMARY`);
    console.log(`${'='.repeat(80)}\n`);

    // Group by model
    const byModel = new Map<string, TestResult[]>();
    for (const result of allResults) {
        if (!byModel.has(result.modelShortName)) {
            byModel.set(result.modelShortName, []);
        }
        byModel.get(result.modelShortName)!.push(result);
    }

    // Print model-by-model summary
    console.log('## Model Performance Summary\n');
    console.log('| Model | Success Rate | Avg Latency | Min | Max | Rate Limits |');
    console.log('|-------|--------------|-------------|-----|-----|-------------|');

    const modelStats: Array<{
        model: string;
        successRate: number;
        avgLatency: number;
        minLatency: number;
        maxLatency: number;
        rateLimits: number;
    }> = [];

    for (const [modelName, results] of byModel) {
        const successful = results.filter(r => r.success);
        const latencies = successful.map(r => r.latency);
        const successRate = (successful.length / results.length) * 100;
        const avgLatency = latencies.length > 0
            ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
            : 0;
        const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
        const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
        const rateLimits = results.filter(r => r.rateLimitHit).length;

        modelStats.push({
            model: modelName,
            successRate,
            avgLatency,
            minLatency,
            maxLatency,
            rateLimits,
        });

        const successIcon = successRate >= 90 ? '✅' : successRate >= 70 ? '⚠️' : '❌';
        const rateLimitIcon = rateLimits === 0 ? '✅' : rateLimits < 3 ? '⚠️' : '❌';

        console.log(
            `| ${modelName.padEnd(20)} | ${successIcon} ${successRate.toFixed(0)}% | ` +
            `${avgLatency}ms | ${minLatency}ms | ${maxLatency}ms | ${rateLimitIcon} ${rateLimits} |`
        );
    }

    // Print prompt-by-prompt summary
    console.log('\n\n## Performance by Task Type\n');
    console.log('| Task | Best Model | Avg Latency | Success Rate |');
    console.log('|------|------------|-------------|--------------|');

    const byPrompt = new Map<string, TestResult[]>();
    for (const result of allResults) {
        if (!byPrompt.has(result.promptName)) {
            byPrompt.set(result.promptName, []);
        }
        byPrompt.get(result.promptName)!.push(result);
    }

    for (const [promptName, results] of byPrompt) {
        const successful = results.filter(r => r.success);
        const successRate = (successful.length / results.length) * 100;

        // Find best model for this prompt
        const byModelForPrompt = new Map<string, number[]>();
        for (const result of successful) {
            if (!byModelForPrompt.has(result.modelShortName)) {
                byModelForPrompt.set(result.modelShortName, []);
            }
            byModelForPrompt.get(result.modelShortName)!.push(result.latency);
        }

        let bestModel = 'N/A';
        let bestAvgLatency = Infinity;
        for (const [model, latencies] of byModelForPrompt) {
            const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
            if (avg < bestAvgLatency) {
                bestAvgLatency = avg;
                bestModel = model;
            }
        }

        const avgLatency = successful.length > 0
            ? Math.round(successful.reduce((a, b) => a + b.latency, 0) / successful.length)
            : 0;

        console.log(
            `| ${promptName.padEnd(20)} | ${bestModel.padEnd(20)} | ` +
            `${Math.round(bestAvgLatency)}ms | ${successRate.toFixed(0)}% |`
        );
    }

    // Print recommendations
    console.log('\n\n## 🎯 Recommendations\n');

    // Fastest model
    const fastestModel = modelStats.sort((a, b) => a.avgLatency - b.avgLatency)[0];
    if (fastestModel && fastestModel.successRate >= 70) {
        console.log(`⚡ **Fastest Model**: ${fastestModel.model} (${fastestModel.avgLatency}ms avg)`);
    }

    // Most reliable model
    const mostReliable = modelStats.sort((a, b) => b.successRate - a.successRate)[0];
    if (mostReliable) {
        console.log(`🛡️  **Most Reliable**: ${mostReliable.model} (${mostReliable.successRate.toFixed(0)}% success rate)`);
    }

    // Models without rate limits
    const noRateLimits = modelStats.filter(m => m.rateLimits === 0);
    if (noRateLimits.length > 0) {
        console.log(`\n✅ **Models Without Rate Limits**:`);
        noRateLimits.forEach(m => console.log(`   - ${m.model}`));
    }

    // Models with rate limits
    const withRateLimits = modelStats.filter(m => m.rateLimits > 0);
    if (withRateLimits.length > 0) {
        console.log(`\n⚠️  **Models With Rate Limits**:`);
        withRateLimits.forEach(m => console.log(`   - ${m.model} (${m.rateLimits} hits)`));
    }

    return modelStats;
}

/**
 * Main test runner
 */
async function runComprehensiveTests() {
    console.log('🚀 OpenRouter Free Model Pool - Comprehensive Testing');
    console.log('====================================================\n');
    console.log(`📅 Test started at: ${new Date().toLocaleString()}`);
    console.log(`🔑 API Key: ${OPENROUTER_API_KEY.substring(0, 20)}...`);
    console.log(`📊 Testing ${FREE_MODELS.length} models`);
    console.log(`📝 Using ${TEST_PROMPTS.length} different prompts`);
    console.log(`🔄 3 attempts per prompt\n`);

    const allResults: TestResult[] = [];

    for (const model of FREE_MODELS) {
        const results = await testModelComprehensive(model, 3);
        allResults.push(...results);

        // Wait between models
        if (FREE_MODELS.indexOf(model) < FREE_MODELS.length - 1) {
            const waitTime = 10000; // 10 seconds
            console.log(`\n⏳ Waiting ${waitTime / 1000}s before testing next model...\n`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    // Generate summary
    const stats = generateSummary(allResults);

    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = `test-results-comprehensive-${timestamp}.json`;

    await Bun.write(resultsFile, JSON.stringify({
        metadata: {
            testDate: new Date().toISOString(),
            modelsTest: FREE_MODELS.length,
            promptsUsed: TEST_PROMPTS.length,
            attemptsPerPrompt: 3,
            totalTests: allResults.length,
        },
        results: allResults,
        summary: stats,
    }, null, 2));

    console.log(`\n\n💾 Detailed results saved to: ${resultsFile}`);
    console.log(`\n✨ Test completed at: ${new Date().toLocaleString()}`);
}

// Run the comprehensive tests
runComprehensiveTests().catch(console.error);
