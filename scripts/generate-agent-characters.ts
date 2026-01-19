/**
 * 动态生成 Agent Character 配置
 * 
 * 从数据库读取 EOA 地址，为每个地址生成对应的 character 配置
 * 这样避免手动创建 30,000 个 character 文件
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 基础 character 模板路径
const BASE_TEMPLATE_PATH = join(process.cwd(), 'characters', 'base-airdrop-hunter.json');

/**
 * 为指定的 EOA 地址生成 character 配置
 */
export function generateCharacterForEOA(eoaAddress: string, customSettings?: Record<string, any>) {
    // 读取基础模板
    const baseTemplate = JSON.parse(readFileSync(BASE_TEMPLATE_PATH, 'utf-8'));

    // 自定义配置
    const character = {
        ...baseTemplate,

        // name: 主要标识符（官方定义："The primary identifier for this agent"）
        // 使用完整的 EOA 地址作为唯一标识，简单直接
        name: eoaAddress,

        // username 是可选字段，这里不填，让系统使用 name 作为标识
        // 优点：更简单，减少复杂度，EOA地址本身就是完美的唯一标识

        settings: {
            ...baseTemplate.settings,
            EOA_ADDRESS: eoaAddress, // 关联的 EOA 地址
            ...customSettings, // 允许每个 agent 有自定义配置
        },
    };

    return character;
}

/**
 * 批量生成多个 EOA 的 character 配置
 */
export function generateCharactersForEOAs(eoaAddresses: string[]) {
    return eoaAddresses.map(address => generateCharacterForEOA(address));
}

/**
 * 示例：从数据库加载 EOA 并生成配置
 * 
 * 在实际使用时，你可以：
 * 1. 从 Supabase 查询需要激活的 EOA 地址
 * 2. 动态生成对应的 character 配置
 * 3. 在 eliza.config.ts 中使用这些配置
 */
export async function loadEOAsFromDatabase() {
    // TODO: 实现从 Supabase 查询 EOA 的逻辑
    // 示例：
    // const { data } = await supabase
    //     .from('eoa_accounts')
    //     .select('address')
    //     .eq('status', 'active')
    //     .limit(100); // 可以分批加载

    // 临时示例数据
    return [
        '0x1234567890123456789012345678901234567890',
        '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    ];
}

// CLI 使用示例
if (require.main === module) {
    (async () => {
        const eoaAddresses = await loadEOAsFromDatabase();
        const characters = generateCharactersForEOAs(eoaAddresses);

        console.log(`Generated ${characters.length} character configurations`);
        console.log('Sample character:', JSON.stringify(characters[0], null, 2));

        // 可选：将生成的配置写入文件
        // writeFileSync(
        //     join(process.cwd(), 'characters', 'generated-agents.json'),
        //     JSON.stringify(characters, null, 2)
        // );
    })();
}
