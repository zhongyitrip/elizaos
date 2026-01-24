#!/usr/bin/env bun
/**
 * Comprehensive Free Model Benchmark
 * 
 * Features:
 * - Multi-round testing (5 rounds per model per task)
 * - Cross-validation across different task types
 * - Speed & Quality matrix generation
 * - Statistical analysis (mean, median, std dev)
 * - Automatic retry on rate limits
 */

import { config } from 'dotenv';

config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

if (!OPENROUTER_API_KEY) {
    console.error('❌ Error: OPENROUTER_API_KEY not found in .env');
    process.exit(1);
}

// Test configuration
const ROUNDS_PER_TEST = 5;  // Number of rounds for each model-task combination
const WAIT_BETWEEN_REQUESTS = 8000;  // 8 seconds between requests
const WAIT_BETWEEN_MODELS = 15000;   // 15 seconds between models

// Free models organized by your custom priority
const MODEL_POOLS = {
    SMALL: [
        'google/gemini-2.0-flash-exp:free',
        'google/gemma-3-27b-it:free',
        'qwen/qwen3-4b:free',
        'google/gemma-3-12b-it:free',
    ],
    LARGE: [
        'meta-llama/llama-3.1-405b-instruct:free',
        'deepseek/deepseek-r1-0528:free',
        'qwen/qwen3-next-80b-a3b-instruct:free',
        'meta-llama/llama-3.3-70b-instruct:free',
        'nousresearch/hermes-3-llama-3.1-405b:free',
    ],
};

// Test tasks with quality evaluation criteria
const TEST_TASKS = [
    {
        id: 'simple_greeting',
        name: 'Simple Greeting',
        prompt: 'Say "Hello, World!" in exactly one sentence.',
        expectedTokens: 10,
        qualityCheck: (response: string) => {
            const hasHello = response.toLowerCase().includes('hello');
            const hasWorld = response.toLowerCase().includes('world');
            const isSingleSentence = (response.match(/[.!?]/g) || []).length === 1;
            return {
                score: (hasHello ? 40 : 0) + (hasWorld ? 40 : 0) + (isSingleSentence ? 20 : 0),
                details: { hasHello, hasWorld, isSingleSentence }
            };
        }
    },
    {
        id: 'code_simple',
        name: 'Simple Code Generation',
        prompt: 'Write a JavaScript function that adds two numbers. Just the function, no explanation.',
        expectedTokens: 50,
        qualityCheck: (response: string) => {
            const hasFunction = /function\s+\w+/.test(response) || /const\s+\w+\s*=/.test(response);
            const hasParameters = /\(\s*\w+\s*,\s*\w+\s*\)/.test(response);
            const hasReturn = /return/.test(response);
            const noExtraText = response.split('\n').length <= 5;
            return {
                score: (hasFunction ? 30 : 0) + (hasParameters ? 30 : 0) + (hasReturn ? 30 : 0) + (noExtraText ? 10 : 0),
                details: { hasFunction, hasParameters, hasReturn, noExtraText }
            };
        }
    },
    {
        id: 'reasoning',
        name: 'Simple Reasoning',
        prompt: 'If a train travels 60 km/h for 2 hours, how far does it go? Answer in one sentence with just the number and unit.',
        expectedTokens: 20,
        qualityCheck: (response: string) => {
            const has120 = response.includes('120');
            const hasKm = /km|kilometer/i.test(response);
            const isShort = response.length < 100;
            return {
                score: (has120 ? 50 : 0) + (hasKm ? 30 : 0) + (isShort ? 20 : 0),
                details: { has120, hasKm, isShort }
            };
        }
    },
    {
        id: 'chinese',
        name: 'Chinese Task',
        prompt: '用一句话解释什么是区块链。',
        expectedTokens: 30,
        qualityCheck: (response: string) => {
            const hasChinese = /[\u4e00-\u9fa5]/.test(response);
            const hasBlockchain = /区块链|blockchain/i.test(response);
            const isConcise = response.length < 200;
            return {
                score: (hasChinese ? 40 : 0) + (hasBlockchain ? 40 : 0) + (isConcise ? 20 : 0),
                details: { hasChinese, hasBlockchain, isConcise }
            };
        }
    },
];

interface TestResult {
    modelId: string;
    modelName: string;
    poolType: string;
    taskId: string;
    taskName: string;
    round: number;
    success: boolean;
    latency: number;
    qualityScore: number;
    qualityDetails: any;
    tokensGenerated: number;
    error?: string;
    rateLimitHit: boolean;
    timestamp: string;
}

/**
 * Test a single model with a single task
 */
async function testModelTask(
    modelId: string,
    task: typeof TEST_TASKS[0],
    round: number
): Promise<TestResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const modelName = modelId.split('/')[1]?.split(':')[0] || modelId;

    try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/zhongyitrip/elizaos',
                'X-Title': 'ElizaOS Free Model Benchmark',
            },
            body: JSON.stringify({
                model: modelId,
                messages: [{ role: 'user', content: task.prompt }],
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        const latency = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            const isRateLimit = response.status === 429 || errorText.includes('rate limit');

            return {
                modelId,
                modelName,
                poolType: '',
                taskId: task.id,
                taskName: task.name,
                round,
                success: false,
                latency,
                qualityScore: 0,
                qualityDetails: {},
                tokensGenerated: 0,
                error: `HTTP ${response.status}`,
                rateLimitHit: isRateLimit,
                timestamp,
            };
        }

        const data = await response.json();

        if (data.error) {
            const isRateLimit = data.error.message?.includes('rate limit');
            return {
                modelId,
                modelName,
                poolType: '',
                taskId: task.id,
                taskName: task.name,
                round,
                success: false,
                latency,
                qualityScore: 0,
                qualityDetails: {},
                tokensGenerated: 0,
                error: data.error.message || 'Unknown error',
                rateLimitHit: isRateLimit,
                timestamp,
            };
        }

        const responseText = data.choices?.[0]?.message?.content || '';
        const tokensGenerated = responseText.split(' ').length;
        const quality = task.qualityCheck(responseText);

        return {
            modelId,
            modelName,
            poolType: '',
            taskId: task.id,
            taskName: task.name,
            round,
            success: true,
            latency,
            qualityScore: quality.score,
            qualityDetails: quality.details,
            tokensGenerated,
            rateLimitHit: false,
            timestamp,
        };
    } catch (error) {
        const latency = Date.now() - startTime;
        return {
            modelId,
            modelName,
            poolType: '',
            taskId: task.id,
            taskName: task.name,
            round,
            success: false,
            latency,
            qualityScore: 0,
            qualityDetails: {},
            tokensGenerated: 0,
            error: error instanceof Error ? error.message : String(error),
            rateLimitHit: false,
            timestamp,
        };
    }
}

/**
 * Calculate statistics
 */
function calculateStats(values: number[]) {
    if (values.length === 0) return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
        mean: Math.round(mean),
        median: Math.round(median),
        stdDev: Math.round(stdDev),
        min: Math.min(...values),
        max: Math.max(...values),
    };
}

/**
 * Generate matrix report
 */
function generateMatrixReport(results: TestResult[]) {
    console.log('\n\n' + '='.repeat(100));
    console.log('📊 SPEED & QUALITY MATRIX');
    console.log('='.repeat(100) + '\n');

    // Group by model
    const byModel = new Map<string, TestResult[]>();
    for (const result of results) {
        if (!byModel.has(result.modelId)) {
            byModel.set(result.modelId, []);
        }
        byModel.get(result.modelId)!.push(result);
    }

    // Overall performance table
    console.log('## Overall Performance (All Tasks Combined)\n');
    console.log('| Model | Success Rate | Avg Speed | Speed StdDev | Avg Quality | Quality StdDev | Score |');
    console.log('|-------|--------------|-----------|--------------|-------------|----------------|-------|');

    const modelStats: Array<{
        model: string;
        successRate: number;
        speedStats: ReturnType<typeof calculateStats>;
        qualityStats: ReturnType<typeof calculateStats>;
        overallScore: number;
    }> = [];

    for (const [modelId, modelResults] of byModel) {
        const successful = modelResults.filter(r => r.success);
        const successRate = (successful.length / modelResults.length) * 100;

        const latencies = successful.map(r => r.latency);
        const qualities = successful.map(r => r.qualityScore);

        const speedStats = calculateStats(latencies);
        const qualityStats = calculateStats(qualities);

        // Overall score: 40% success rate + 30% speed + 30% quality
        const speedScore = speedStats.mean > 0 ? Math.max(0, 100 - (speedStats.mean / 100)) : 0;
        const qualityScore = qualityStats.mean;
        const overallScore = Math.round(
            (successRate * 0.4) + (speedScore * 0.3) + (qualityScore * 0.3)
        );

        modelStats.push({
            model: modelId.split('/')[1]?.split(':')[0] || modelId,
            successRate,
            speedStats,
            qualityStats,
            overallScore,
        });

        const modelShort = modelId.split('/')[1]?.split(':')[0] || modelId;
        console.log(
            `| ${modelShort.padEnd(25)} | ${successRate.toFixed(0)}% | ` +
            `${speedStats.mean}ms | ±${speedStats.stdDev}ms | ` +
            `${qualityStats.mean.toFixed(0)}/100 | ±${qualityStats.stdDev.toFixed(0)} | ` +
            `${overallScore}/100 |`
        );
    }

    // Task-specific performance
    console.log('\n\n## Performance by Task Type\n');

    for (const task of TEST_TASKS) {
        console.log(`### ${task.name}\n`);
        console.log('| Model | Success | Avg Speed | Avg Quality | Rounds |');
        console.log('|-------|---------|-----------|-------------|--------|');

        for (const [modelId, modelResults] of byModel) {
            const taskResults = modelResults.filter(r => r.taskId === task.id);
            const successful = taskResults.filter(r => r.success);

            if (taskResults.length === 0) continue;

            const successRate = (successful.length / taskResults.length) * 100;
            const avgSpeed = successful.length > 0
                ? Math.round(successful.reduce((sum, r) => sum + r.latency, 0) / successful.length)
                : 0;
            const avgQuality = successful.length > 0
                ? Math.round(successful.reduce((sum, r) => sum + r.qualityScore, 0) / successful.length)
                : 0;

            const modelShort = modelId.split('/')[1]?.split(':')[0] || modelId;
            console.log(
                `| ${modelShort.padEnd(25)} | ${successRate.toFixed(0)}% | ` +
                `${avgSpeed}ms | ${avgQuality}/100 | ${successful.length}/${taskResults.length} |`
            );
        }
        console.log('');
    }

    // Top performers
    console.log('\n## 🏆 Top Performers\n');

    const sortedByScore = [...modelStats].sort((a, b) => b.overallScore - a.overallScore);
    const sortedBySpeed = [...modelStats].sort((a, b) => a.speedStats.mean - b.speedStats.mean);
    const sortedByQuality = [...modelStats].sort((a, b) => b.qualityStats.mean - a.qualityStats.mean);

    console.log(`**Best Overall**: ${sortedByScore[0]?.model} (Score: ${sortedByScore[0]?.overallScore}/100)`);
    console.log(`**Fastest**: ${sortedBySpeed[0]?.model} (${sortedBySpeed[0]?.speedStats.mean}ms avg)`);
    console.log(`**Highest Quality**: ${sortedByQuality[0]?.model} (${sortedByQuality[0]?.qualityStats.mean.toFixed(0)}/100 avg)`);

    return modelStats;
}

/**
 * Main benchmark runner
 */
async function runBenchmark() {
    console.log('🚀 OpenRouter Free Model Benchmark');
    console.log('==================================\n');
    console.log(`📅 Started: ${new Date().toLocaleString()}`);
    console.log(`🔄 Rounds per test: ${ROUNDS_PER_TEST}`);
    console.log(`📝 Tasks: ${TEST_TASKS.length}`);
    console.log(`⏱️  Wait between requests: ${WAIT_BETWEEN_REQUESTS}ms`);
    console.log(`⏱️  Wait between models: ${WAIT_BETWEEN_MODELS}ms\n`);

    const allResults: TestResult[] = [];
    const allModels = [...MODEL_POOLS.SMALL, ...MODEL_POOLS.LARGE];

    let modelIndex = 0;
    for (const modelId of allModels) {
        modelIndex++;
        const modelName = modelId.split('/')[1]?.split(':')[0] || modelId;
        const poolType = MODEL_POOLS.SMALL.includes(modelId) ? 'SMALL' : 'LARGE';

        console.log(`\n${'='.repeat(80)}`);
        console.log(`🧪 Testing Model ${modelIndex}/${allModels.length}: ${modelName} (${poolType})`);
        console.log(`${'='.repeat(80)}\n`);

        let consecutiveRateLimits = 0;

        for (const task of TEST_TASKS) {
            if (consecutiveRateLimits >= 2) {
                console.log(`⚠️  Skipping remaining tasks due to rate limits\n`);
                break;
            }

            console.log(`📝 Task: ${task.name}`);

            for (let round = 1; round <= ROUNDS_PER_TEST; round++) {
                process.stdout.write(`   Round ${round}/${ROUNDS_PER_TEST}... `);

                const result = await testModelTask(modelId, task, round);
                result.poolType = poolType;
                allResults.push(result);

                if (result.success) {
                    console.log(`✅ ${result.latency}ms | Quality: ${result.qualityScore}/100`);
                    consecutiveRateLimits = 0;
                } else if (result.rateLimitHit) {
                    console.log(`⚠️  Rate limit`);
                    consecutiveRateLimits++;
                } else {
                    console.log(`❌ ${result.error}`);
                    consecutiveRateLimits = 0;
                }

                // Wait between requests
                if (round < ROUNDS_PER_TEST) {
                    await new Promise(resolve => setTimeout(resolve, WAIT_BETWEEN_REQUESTS));
                }
            }

            console.log('');
        }

        // Wait between models
        if (modelIndex < allModels.length) {
            console.log(`⏳ Waiting ${WAIT_BETWEEN_MODELS / 1000}s before next model...\n`);
            await new Promise(resolve => setTimeout(resolve, WAIT_BETWEEN_MODELS));
        }
    }

    // Generate reports
    const stats = generateMatrixReport(allResults);

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = `benchmark-results-${timestamp}.json`;

    await Bun.write(resultsFile, JSON.stringify({
        metadata: {
            testDate: new Date().toISOString(),
            roundsPerTest: ROUNDS_PER_TEST,
            totalModels: allModels.length,
            totalTasks: TEST_TASKS.length,
            totalTests: allResults.length,
        },
        results: allResults,
        statistics: stats,
    }, null, 2));

    console.log(`\n\n💾 Detailed results saved to: ${resultsFile}`);
    console.log(`\n✨ Benchmark completed at: ${new Date().toLocaleString()}`);
}

// Run the benchmark
runBenchmark().catch(console.error);
