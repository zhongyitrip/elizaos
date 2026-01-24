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
export const FREE_MODEL_POOLS = {
    // Small/Fast models for quick responses
    SMALL: [
        'google/gemini-2.0-flash-exp:free',      // Google's flagship, 1M context, fastest
        'google/gemma-3-27b-it:free',            // Google Gemma 27B, stable
        'qwen/qwen3-4b:free',                    // Qwen 4B, Chinese-friendly
        'google/gemma-3-12b-it:free',            // Google Gemma 12B, balanced
    ],

    // Large/Reasoning models for complex tasks
    LARGE: [
        'meta-llama/llama-3.1-405b-instruct:free', // Meta's largest, 405B params, best reasoning
        'deepseek/deepseek-r1-0528:free',          // DeepSeek R1, strong reasoning
        'qwen/qwen3-next-80b-a3b-instruct:free',   // Qwen 80B, Chinese reasoning
        'meta-llama/llama-3.3-70b-instruct:free',  // Meta Llama 70B, general purpose
        'nousresearch/hermes-3-llama-3.1-405b:free', // Hermes 405B, alternative
    ],

    // Vision models for image analysis
    VISION: [
        'google/gemini-2.0-flash-exp:free',      // Gemini has vision support, 1M context
        'qwen/qwen-2.5-vl-7b-instruct:free',     // Qwen VL for vision, Chinese-friendly
        'nvidia/nemotron-nano-12b-v2-vl:free',   // NVIDIA Nemotron VL
        'allenai/molmo-2-8b:free',               // AllenAI Molmo, image understanding
    ],
} as const;

/**
 * Get model pool based on model type
 */
export function getModelPool(modelType: 'SMALL' | 'LARGE' | 'VISION'): string[] {
    return [...FREE_MODEL_POOLS[modelType]]; // Return a copy
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
