#!/usr/bin/env bun
/**
 * OpenRouter Free Model Pool - Performance & Availability Test
 * 
 * Tests all free models in the pool for:
 * - Response speed (latency)
 * - Availability (success rate)
 * - Rate limits (requests per minute)
 */

import { config } from 'dotenv';

config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in .env');
    process.exit(1);
}

// Free models to test
const FREE_MODELS = {
    SMALL: [
        'google/gemini-2.0-flash-exp:free',
        'qwen/qwen-2.5-72b-instruct:free',
        'meta-llama/llama-3.3-70b-instruct:free',
    ],
    LARGE: [
        'deepseek/deepseek-r1:free',
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'qwen/qwen-2.5-72b-instruct:free',
    ],
    VISION: [
        'google/gemini-2.0-flash-exp:free',
        'qwen/qwen-2-vl-72b-instruct:free',
    ],
};

// Test prompts
const TEST_PROMPTS = {
    simple: 'Say "Hello, World!" in one sentence.',
    medium: 'Explain what blockchain is in 2-3 sentences.',
    complex: 'Write a simple JavaScript function to calculate fibonacci numbers.',
};

interface TestResult {
    model: string;
    category: string;
    available: boolean;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    successRate: number;
    errorMessage?: string;
    rateLimitHit: boolean;
    estimatedRPM?: number;
}

/**
 * Test a single model with a prompt
 */
async function testModel(
    modelName: string,
    prompt: string,
    retries: number = 3
): Promise<{ success: boolean; latency: number; error?: string; rateLimitHit: boolean }> {
    const startTime = Date.now();

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
                max_tokens: 100,
                temperature: 0.7,
            }),
        });

        const latency = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            const isRateLimit = response.status === 429 || errorText.includes('rate limit');
            return {
                success: false,
                latency,
                error: `HTTP ${response.status}: ${errorText}`,
                rateLimitHit: isRateLimit,
            };
        }

        const data = await response.json();

        if (data.error) {
            const isRateLimit = data.error.message?.includes('rate limit') || data.error.code === 429;
            return {
                success: false,
                latency,
                error: data.error.message || JSON.stringify(data.error),
                rateLimitHit: isRateLimit,
            };
        }

        return {
            success: true,
            latency,
            rateLimitHit: false,
        };
    } catch (error) {
        const latency = Date.now() - startTime;
        return {
            success: false,
            latency,
            error: error instanceof Error ? error.message : String(error),
            rateLimitHit: false,
        };
    }
}

/**
 * Test a model multiple times to get average performance
 */
async function testModelPerformance(
    modelName: string,
    category: string,
    testCount: number = 5
): Promise<TestResult> {
    console.log(`\n🧪 Testing ${modelName}...`);

    const results: Array<{ success: boolean; latency: number; rateLimitHit: boolean }> = [];
    let rateLimitHit = false;

    for (let i = 0; i < testCount; i++) {
        console.log(`  Attempt ${i + 1}/${testCount}...`);
        const result = await testModel(modelName, TEST_PROMPTS.simple);
        results.push(result);

        if (result.rateLimitHit) {
            rateLimitHit = true;
            console.log(`  ⚠️ Rate limit hit, stopping test`);
            break;
        }

        if (result.success) {
            console.log(`  ✅ Success (${result.latency}ms)`);
        } else {
            console.log(`  ❌ Failed: ${result.error}`);
        }

        // Wait 2 seconds between requests to avoid rate limits
        if (i < testCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    const successfulResults = results.filter(r => r.success);
    const latencies = successfulResults.map(r => r.latency);

    return {
        model: modelName,
        category,
        available: successfulResults.length > 0,
        avgLatency: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
        minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
        maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
        successRate: Math.round((successfulResults.length / results.length) * 100),
        errorMessage: results.find(r => !r.success)?.error,
        rateLimitHit,
        estimatedRPM: rateLimitHit ? 5 : undefined, // Conservative estimate
    };
}

/**
 * Main test function
 */
async function runTests() {
    console.log('🚀 OpenRouter Free Model Pool - Performance Test');
    console.log('================================================\n');
    console.log(`Testing ${Object.values(FREE_MODELS).flat().length} models...`);
    console.log(`Test started at: ${new Date().toLocaleString()}\n`);

    const allResults: TestResult[] = [];

    // Test SMALL models
    console.log('\n📊 Testing SMALL models...');
    for (const model of FREE_MODELS.SMALL) {
        const result = await testModelPerformance(model, 'SMALL', 3);
        allResults.push(result);
    }

    // Test LARGE models (skip duplicates)
    console.log('\n📊 Testing LARGE models...');
    const uniqueLargeModels = FREE_MODELS.LARGE.filter(
        m => !FREE_MODELS.SMALL.includes(m)
    );
    for (const model of uniqueLargeModels) {
        const result = await testModelPerformance(model, 'LARGE', 3);
        allResults.push(result);
    }

    // Test VISION models (skip duplicates)
    console.log('\n📊 Testing VISION models...');
    const uniqueVisionModels = FREE_MODELS.VISION.filter(
        m => !FREE_MODELS.SMALL.includes(m) && !FREE_MODELS.LARGE.includes(m)
    );
    for (const model of uniqueVisionModels) {
        const result = await testModelPerformance(model, 'VISION', 3);
        allResults.push(result);
    }

    // Print results
    console.log('\n\n📊 Test Results Summary');
    console.log('======================\n');

    // Sort by availability and speed
    const sortedResults = allResults.sort((a, b) => {
        if (a.available !== b.available) return b.available ? 1 : -1;
        return a.avgLatency - b.avgLatency;
    });

    // Print table
    console.log('| Model | Category | Available | Avg Latency | Success Rate | Rate Limit |');
    console.log('|-------|----------|-----------|-------------|--------------|------------|');

    for (const result of sortedResults) {
        const modelShort = result.model.split('/')[1]?.split(':')[0] || result.model;
        const available = result.available ? '✅' : '❌';
        const latency = result.avgLatency > 0 ? `${result.avgLatency}ms` : 'N/A';
        const successRate = `${result.successRate}%`;
        const rateLimit = result.rateLimitHit ? '⚠️ Yes' : '✅ No';

        console.log(`| ${modelShort} | ${result.category} | ${available} | ${latency} | ${successRate} | ${rateLimit} |`);
    }

    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.json`;
    await Bun.write(filename, JSON.stringify(sortedResults, null, 2));
    console.log(`\n💾 Results saved to: ${filename}`);

    // Print recommendations
    console.log('\n\n🎯 Recommendations');
    console.log('==================\n');

    const fastestModel = sortedResults.find(r => r.available);
    if (fastestModel) {
        console.log(`⚡ Fastest model: ${fastestModel.model} (${fastestModel.avgLatency}ms)`);
    }

    const mostReliable = sortedResults
        .filter(r => r.available)
        .sort((a, b) => b.successRate - a.successRate)[0];
    if (mostReliable) {
        console.log(`🛡️  Most reliable: ${mostReliable.model} (${mostReliable.successRate}% success)`);
    }

    const noRateLimit = sortedResults.filter(r => r.available && !r.rateLimitHit);
    if (noRateLimit.length > 0) {
        console.log(`\n✅ Models without rate limits (${noRateLimit.length}):`);
        noRateLimit.forEach(r => console.log(`   - ${r.model}`));
    }

    console.log('\n✨ Test completed!');
}

// Run tests
runTests().catch(console.error);
