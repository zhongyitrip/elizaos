import type { Character } from '@elizaos/core';

/**
 * ElizaOS Configuration
 * 
 * 从 characters/ 文件夹加载 character 配置
 * 这样可以将自定义配置与官方示例分离，便于管理和升级
 */
export default {
    agents: [
        {
            // 从文件加载 character 配置
            characterPath: './characters/0x2e5d0a4072cee407642f45ffeb2f7c6494c2cafe.character.json',
        },
        // 如果需要添加更多 agents，在这里继续添加：
        // {
        //     characterPath: './characters/airdrop-hunter.character.json',
        // },
    ],
};
