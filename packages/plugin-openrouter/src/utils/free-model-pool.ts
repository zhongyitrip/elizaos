import type { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';

/**
 * Free model pool configuration for OpenRouter
 * Models are ordered by priority (fastest/most reliable first)
 * 
 * ⚠️ Updated: 2026-01-24 - Verified with OpenRouter API
 * 📊 Total: 33 free models available
 * 📝 Run `bun run scripts/query-free-models.ts` to update
 */
/**
 * Free model pool configuration for OpenRouter
 * Models are ordered by priority (fastest/most reliable first)
 * 
 * ⚠️ Updated: 2026-01-24 - Optimized based on benchmark results
 * 📊 Total: 33 free models available
 * 📝 Run `bun run scripts/query-free-models.ts` to update
 */
export const FREE_MODEL_POOLS = {
    // Small/Fast models for quick responses
    // Optimized: Gemma 3 models are most reliable, Gemini has aggressive rate limits
    SMALL: [
        'google/gemma-3-27b-it:free',            // Priority 1: High reliability, good speed
        'google/gemma-3-12b-it:free',            // Priority 2: Reliable backup
        'google/gemini-2.0-flash-exp:free',      // Priority 3: Fastest but rate limited
        'qwen/qwen3-4b:free',                    // Priority 4: Chinese-friendly
    ],

    // Large/Reasoning models for complex tasks
    LARGE: [
        'meta-llama/llama-3.1-405b-instruct:free', // Priority 1: Best reasoning (405B)
        'meta-llama/llama-3.3-70b-instruct:free',  // Priority 2: General purpose reliable
        'deepseek/deepseek-r1-0528:free',          // Priority 3: DeepSeek reasoning
        'qwen/qwen3-next-80b-a3b-instruct:free',   // Priority 4: Chinese reasoning
        'nousresearch/hermes-3-llama-3.1-405b:free', // Priority 5: Alternative 405B
    ],

    // Vision models for image analysis
    VISION: [
        'google/gemini-2.0-flash-exp:free',      // Priority 1: Best vision context (1M)
        'qwen/qwen-2.5-vl-7b-instruct:free',     // Priority 2: Chinese vision
        'nvidia/nemotron-nano-12b-v2-vl:free',   // Priority 3: NVIDIA vision
        'allenai/molmo-2-8b:free',               // Priority 4: Standard vision
    ],

    // Code generation models
    CODE: [
        'qwen/qwen3-coder:free',                 // Priority 1: Code specialist
        'mistralai/devstral-2512:free',          // Priority 2: Development tasks
        'deepseek/deepseek-r1-0528:free',        // Priority 3: Code reasoning
    ],
} as const;

// Rotation state to track current index for each pool type
// This ensures we cycle through models even across different requests
const rotationState = {
    SMALL: 0,
    LARGE: 0,
    VISION: 0,
    CODE: 0,
};

/**
 * Get model pool based on model type with Round-Robin Rotation
 * 
 * Logic:
 * 1. Get the base pool
 * 2. Rotate the array based on current rotation index
 * 3. Increment rotation index for next call
 * 
 * Example: [A, B, C] -> Call 1: [A, B, C], Call 2: [B, C, A], Call 3: [C, A, B]
 */
export function getModelPool(modelType: 'SMALL' | 'LARGE' | 'VISION' | 'CODE'): string[] {
    const pool = FREE_MODEL_POOLS[modelType];
    if (!pool) return [];

    // Get current rotation offset
    const offset = rotationState[modelType] % pool.length;

    // Rotate the pool: [...pool.slice(offset), ...pool.slice(0, offset)]
    const rotatedPool = [
        ...pool.slice(offset),
        ...pool.slice(0, offset)
    ];

    // Increment for next time
    rotationState[modelType] = (rotationState[modelType] + 1) % pool.length;

    return rotatedPool;
}

/**
 * Try models from pool with automatic fallback
 * Returns the first successful model name
 */
export async function tryModelsFromPool<T>(
    runtime: IAgentRuntime,
    modelPool: string[],
    attemptFn: (modelName: string) => Promise<T>,
    context: string = 'operation'
): Promise<{ result: T; modelUsed: string }> {
    const errors: Array<{ model: string; error: string }> = [];

    for (const modelName of modelPool) {
        try {
            logger.debug(`[OpenRouter Free Pool] Trying ${context} with model: ${modelName}`);
            const result = await attemptFn(modelName);
            logger.log(`[OpenRouter Free Pool] ✅ Success with model: ${modelName}`);
            return { result, modelUsed: modelName };
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.warn(`[OpenRouter Free Pool] ⚠️ Model ${modelName} failed: ${errorMsg}`);
            errors.push({ model: modelName, error: errorMsg });

            // Check if it's a rate limit error (429) or quota error
            if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
                logger.warn(`[OpenRouter Free Pool] Rate limit hit on ${modelName}, trying next...`);
                continue;
            }

            // For other errors, still try next model but log more details
            logger.debug(`[OpenRouter Free Pool] Error details: ${errorMsg}`);
            continue;
        }
    }

    // All models failed
    const errorSummary = errors.map(e => `${e.model}: ${e.error}`).join('\n');
    throw new Error(
        `[OpenRouter Free Pool] All free models exhausted for ${context}.\n` +
        `Tried ${modelPool.length} models:\n${errorSummary}\n` +
        `Suggestion: Wait a few minutes or consider using paid API keys.`
    );
}

/**
 * Check if a model name is from the free pool
 */
export function isFreeModel(modelName: string): boolean {
    return modelName.endsWith(':free');
}

/**
 * Get custom model from env or use free pool
 */
export function getModelOrPool(
    customModel: string | undefined,
    poolType: 'SMALL' | 'LARGE' | 'VISION'
): string[] {
    // If custom model is specified and it's a free model, use it as first priority
    if (customModel && isFreeModel(customModel)) {
        const pool = getModelPool(poolType);
        // Put custom model first, then other pool models (excluding duplicates)
        return [customModel, ...pool.filter(m => m !== customModel)];
    }

    // If custom model is specified but not free, use only that model
    if (customModel) {
        return [customModel];
    }

    // No custom model, use full free pool
    return getModelPool(poolType);
}
