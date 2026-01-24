import type { IAgentRuntime } from '@elizaos/core';
import { logger } from '@elizaos/core';

/**
 * Free model pool configuration for OpenRouter
 * Models are ordered by priority (fastest/most reliable first)
 * 
 * ⚠️ Updated: 2026-01-24 - Optimized for Quality Priority & Smart Fallback
 * 
 * Strategy: "Quality First, Speed Second" (质量优先，兼顾速度)
 * 1. Always prioritize the BEST model (e.g. Gemma 27B) - 永远优先尝试最好的模型
 * 2. Only fallback if the best model is currently Rate Limited (Cool-down) - 只有最好的模型限流了才降级
 * 3. Automatically retry the best model after cool-down expires - 冷却结束后立刻切回最好的模型
 * 
 * 📊 Total: 33 free models available
 * 📝 Run `bun run scripts/query-free-models.ts` to update
 */
export const FREE_MODEL_POOLS = {
    // Small/Fast models for quick responses
    // Priority Order:
    // 1. Gemma 3 27B (Best Balance)
    // 2. Gemini 2.0 Flash (Fastest, High Quality, but strict rate limits)
    // 3. Gemma 3 12B (Safe Backup)
    // 4. Large Models (Power Backup)
    SMALL: [
        'google/gemma-3-27b-it:free',            // Priority 1: High reliability, good speed (主力)
        'google/gemini-2.0-flash-exp:free',      // Priority 2: Fastest but rate limited (极速)
        'google/gemma-3-12b-it:free',            // Priority 3: Reliable backup (稳定备份)
        'qwen/qwen3-4b:free',                    // Priority 4: Chinese-friendly (中文友好)

        // 🚀 FALLBACK TO HEAVY HITTERS (Why waste free quota? Use them!)
        // 当小模型全挂了，用大模型顶上
        'meta-llama/llama-3.1-405b-instruct:free', // Priority 5: The Beast (Slow but free)
        'meta-llama/llama-3.3-70b-instruct:free',  // Priority 6: Solid & Reliable
        'deepseek/deepseek-r1-0528:free',          // Priority 7: DeepSeek
        'qwen/qwen3-next-80b-a3b-instruct:free',   // Priority 8: Qwen Large
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

// Rate Limit Tracker (限流追踪器)
// Maps modelName -> timestamp (when it was last rate limited)
// 记录每个模型最后一次报错的时间
const rateLimitCoolDowns: Record<string, number> = {};

// Cool-down duration in milliseconds (e.g., 60 seconds)
// After this time, we will try the model again even if it failed before
// 冷却时间：60秒。60秒后会尝试“复活”该模型。
const COOLDOWN_DURATION = 60 * 1000;

/**
 * Get model pool based on model type with Smart Prioritization (智能优先级)
 * 
 * Logic:
 * 1. Get the base pool (Already sorted by Quality/Priority)
 * 2. Filter out models that are currently in "Cool-down" (剔除还在冷却的模型)
 * 3. Return the filtered list (返回可用模型列表)
 * 4. If ALL models are in cool-down, return the full list (Force retry) (如果全挂了，强制重试)
 */
export function getModelPool(modelType: 'SMALL' | 'LARGE' | 'VISION' | 'CODE'): string[] {
    const pool = FREE_MODEL_POOLS[modelType];
    if (!pool) return [];

    const now = Date.now();

    // 1. Filter out models that are in cool-down
    // 过滤掉还在“冷却期”的模型
    const availableModels = pool.filter(model => {
        const lastFailure = rateLimitCoolDowns[model];
        // If never failed OR cool-down expired, it's available
        // 如果没挂过，或者已经过了冷却期，就可用
        if (!lastFailure) return true;

        const timeSinceFailure = now - lastFailure;
        if (timeSinceFailure > COOLDOWN_DURATION) {
            // Cool-down expired, remove from blacklist
            delete rateLimitCoolDowns[model];
            return true;
        }

        return false;
    });

    // 2. If we have available models, use them (They preserve the original priority order)
    // 如果有可用模型，按优先级顺序返回
    if (availableModels.length > 0) {
        return availableModels;
    }

    // 3. If ALL models are in cool-down, reset everyone and return full pool
    // This prevents complete blockage if everything is failing temporarily
    // 紧急情况：所有人都挂了，那就死马当活马医，全部重试
    return [...pool];
}

/**
 * Report a Rate Limit failure for a model
 * Call this when a model returns 429 or 402
 * 报告限流：把模型关进“小黑屋”冷却
 */
export function reportRateLimit(modelName: string) {
    rateLimitCoolDowns[modelName] = Date.now();
    logger.warn(`⚠️ [OpenRouter Pool] Model [${modelName}] marked rate-limited (Cool-down for ${COOLDOWN_DURATION / 1000}s)`);
}

/**
 * Try models from pool with automatic fallback
 * Returns the first successful model name
 * 尝试模型池：自动处理回退
 */
export async function tryModelsFromPool<T>(
    runtime: IAgentRuntime,
    modelPool: string[],
    attemptFn: (modelName: string) => Promise<T>,
    context: string = 'operation'
): Promise<{ result: T; modelUsed: string }> {
    const errors: Array<{ model: string; error: string }> = [];

    // Smart logic: We don't rotate blindly. We try models in priority order.
    // If a model fails with Rate Limit, we mark it for cool-down.

    // Refresh pool to exclude cooled-down models (if this list came from getModelPool, it might be stale if we iterate long)
    // For now, we trust the input pool is fresh.

    for (const modelName of modelPool) {
        try {
            // Skip if recently marked as rate-limited (double check)
            // 二次检查：防止在循环过程中被其他请求标记
            const lastFailure = rateLimitCoolDowns[modelName];
            if (lastFailure && (Date.now() - lastFailure < COOLDOWN_DURATION)) {
                continue;
            }

            logger.debug(`[OpenRouter Free Pool] Trying ${context} with model: ${modelName}`);
            const result = await attemptFn(modelName);
            logger.log(`[OpenRouter Free Pool] ✅ Success with model: ${modelName}`);

            // Success! Remove from cool-down if it was there (early parole)
            if (rateLimitCoolDowns[modelName]) {
                delete rateLimitCoolDowns[modelName];
            }

            return { result, modelUsed: modelName };
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger.warn(`[OpenRouter Free Pool] ⚠️ Model ${modelName} failed: ${errorMsg}`);
            errors.push({ model: modelName, error: errorMsg });

            // Check if it's a rate limit error (429) or quota error
            // 检查是否是限流错误
            if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('quota') || errorMsg.includes('402')) {
                logger.warn(`[OpenRouter Free Pool] Rate limit hit on ${modelName}, marking for cool-down...`);
                reportRateLimit(modelName); // Mark for cool-down
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
