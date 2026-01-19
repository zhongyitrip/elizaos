import type { Character } from '@elizaos/core';
import { generateCharacterForEOA, loadEOAsFromDatabase } from './scripts/generate-agent-characters';

/**
 * 动态配置示例
 * 
 * 方案1: 从数据库动态加载 EOA 并生成 agents
 * 方案2: 使用静态文件 + 动态补充
 */

// 方案1: 完全动态生成（适合大规模 agents）
async function generateDynamicConfig() {
    const eoaAddresses = await loadEOAsFromDatabase();

    return {
        agents: eoaAddresses.map(address => ({
            character: generateCharacterForEOA(address) as Character,
        })),
    };
}

// 方案2: 混合模式（静态 + 动态）
async function generateHybridConfig() {
    const eoaAddresses = await loadEOAsFromDatabase();

    return {
        agents: [
            // 静态配置的主 agent
            {
                characterPath: './characters/eliza-ollama.character.json',
            },
            // 动态生成的 airdrop hunter agents
            ...eoaAddresses.map(address => ({
                character: generateCharacterForEOA(address, {
                    // 可以为每个 agent 添加自定义配置
                    // 例如：不同的 DApp 偏好、风险等级等
                }) as Character,
            })),
        ],
    };
}

// 导出配置（需要使用 async）
export default generateHybridConfig();

/**
 * 使用说明：
 * 
 * 1. 如果需要完全动态配置，使用 generateDynamicConfig()
 * 2. 如果需要保留主 agent + 动态 airdrop agents，使用 generateHybridConfig()
 * 3. 在启动时，ElizaOS 会自动加载这个配置
 * 
 * 注意：由于配置是异步的，可能需要修改 ElizaOS 的启动逻辑
 * 或者在启动前预生成配置文件
 */
