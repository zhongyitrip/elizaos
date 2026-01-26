#!/usr/bin/env bun
/**
 * Adaptive Strategy Deep Verification Benchmark
 * 深度验证脚本：模拟各种故障场景，确保策略按预期进行故障转移
 */

import { config } from 'dotenv';
import path from 'path';
import { tryModelsFromPool, FREE_MODEL_POOLS } from '../packages/plugin-openrouter/src/utils/free-model-rotating';

config({ path: path.resolve(process.cwd(), '.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

if (!OPENROUTER_API_KEY) {
    console.error('❌ Error: OPENROUTER_API_KEY not found in .env');
    process.exit(1);
}

// Mock Runtime
const mockRuntime = {
    getSetting: (key: string) => process.env[key],
} as any;

// 🧪 MOCK FAULT INJECTION
// 用于模拟某些模型“挂了”的情况
const MOCK_FAILURES = new Set<string>();

async function attemptOpenRouterCall(modelName: string, prompt: string) {
    // 1. Check Mock Failures first
    if (MOCK_FAILURES.has(modelName)) {
        // Simulate a slight network delay before failing
        await new Promise(r => setTimeout(r, 200));
        throw new Error(`[MOCK] Rate limit exceeded (429) for ${modelName}`);
    }

    // 2. Real API Call
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/zhongyitrip/elizaos',
            'X-Title': 'ElizaOS Benchmark',
        },
        body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 100,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${(await response.text()).slice(0, 100)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

async function runTest() {
    console.log('🚀 Starting Deep Verification (Simulating Failures)');
    console.log('-------------------------------------------------');
    console.log('Primary Models:', FREE_MODEL_POOLS.SMALL.slice(0, 2));

    // Scenario 1: Normal Operation (Expect Primary A)
    console.log('\n🧪 SCENARIO 1: Normal Operation (Everything Healthy)');
    console.log('   Expected: Should use [google/gemma-3-27b-it:free]');
    MOCK_FAILURES.clear();
    try {
        const { result, modelUsed } = await tryModelsFromPool(
            mockRuntime,
            FREE_MODEL_POOLS.SMALL,
            (model) => attemptOpenRouterCall(model, "Say 'Scenario 1 OK'")
        );
        console.log(`✅ Result: Success using [${modelUsed}]`);
        // Verify response content briefly
        console.log(`   Response: "${result.slice(0, 30).replace(/\n/g, ' ')}..."`);
    } catch (e) { console.error("❌ Failed:", e); }

    // Scenario 2: Primary A Failed (Expect Primary B)
    console.log('\n🧪 SCENARIO 2: Primary A (Gemma) Fails (Expect Llama 70B)');
    console.log('   Expected: Should use [meta-llama/llama-3.3-70b-instruct:free]');
    MOCK_FAILURES.clear();
    MOCK_FAILURES.add('google/gemma-3-27b-it:free'); // Mock fail Gemma
    try {
        const { result, modelUsed } = await tryModelsFromPool(
            mockRuntime,
            FREE_MODEL_POOLS.SMALL,
            (model) => attemptOpenRouterCall(model, "Say 'Scenario 2 OK'")
        );
        console.log(`✅ Result: Success using [${modelUsed}]`);

        if (modelUsed.includes('llama')) {
            console.log("   ✨ VERIFIED: Correctly switched to Primary B!");
        } else {
            console.warn(`   ⚠️ Unexpected: Used ${modelUsed}`);
        }
    } catch (e) { console.error("❌ Failed:", e); }

    // Scenario 3: All Primaries Failed (Expect Backup)
    console.log('\n🧪 SCENARIO 3: Both Primaries Fail (Expect Backup Model)');
    console.log('   Expected: Should use [google/gemini-2.0-flash-exp:free] or similar');
    MOCK_FAILURES.clear();
    MOCK_FAILURES.add('google/gemma-3-27b-it:free');
    MOCK_FAILURES.add('meta-llama/llama-3.3-70b-instruct:free');
    try {
        const { result, modelUsed } = await tryModelsFromPool(
            mockRuntime,
            FREE_MODEL_POOLS.SMALL,
            (model) => attemptOpenRouterCall(model, "Say 'Scenario 3 OK'")
        );
        console.log(`✅ Result: Success using [${modelUsed}]`);

        if (!FREE_MODEL_POOLS.SMALL.slice(0, 2).includes(modelUsed)) {
            console.log("   ✨ VERIFIED: Correctly fell back to Backup Tier!");
        } else {
            console.warn(`   ⚠️ Unexpected: Still used Primary ${modelUsed}`);
        }
    } catch (e) { console.error("❌ Failed:", e); }

    console.log('\n✨ Deep Verification Complete.');
}

runTest().catch(console.error);
