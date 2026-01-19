import { elizaLogger } from "@elizaos/core";

const ZERION_API_KEY = "zk_dev_4e494b52cd4c4f46aacfb1530a24d6a6";
const address = "0x6cbE62c9Eb937dd5D6Ed630A386581b840889Ae7";

async function queryPolygonTokens() {
    console.log("🔍 查询 Polygon 链上的代币持仓");
    console.log("=" .repeat(60));
    console.log(`📍 地址: ${address}`);
    console.log("");

    try {
        const base64Auth = Buffer.from(`${ZERION_API_KEY}:`).toString('base64');
        
        // 查询详细持仓信息
        const response = await fetch(
            `https://api.zerion.io/v1/wallets/${address}/positions/?filter[positions]=only_simple&currency=usd&filter[trash]=only_non_trash&sort=value`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Basic ${base64Auth}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.statusText}`);
        }

        const data = await response.json();
        
        // 筛选 Polygon 链上的代币
        const polygonTokens = data.data.filter((position: any) => {
            const chainId = position.relationships?.chain?.data?.id;
            return chainId === 'polygon';
        });

        console.log(`\n📊 在 Polygon 链上找到 ${polygonTokens.length} 个代币:\n`);

        if (polygonTokens.length === 0) {
            console.log("❌ 没有在 Polygon 链上找到任何代币");
            return;
        }

        polygonTokens.forEach((position: any, index: number) => {
            const attrs = position.attributes;
            const fungible = attrs.fungible_info;
            
            console.log(`${index + 1}. ${fungible.name} (${fungible.symbol})`);
            console.log(`   💰 数量: ${attrs.quantity.float}`);
            console.log(`   💵 价值: $${attrs.value?.toFixed(4) || 'N/A'}`);
            console.log(`   📈 24h 变化: ${attrs.changes?.percent_1d?.toFixed(2) || 'N/A'}%`);
            console.log(`   🔗 合约: ${fungible.implementations?.[0]?.address || 'N/A'}`);
            console.log("");
        });

        // 计算总价值
        const totalValue = polygonTokens.reduce((sum: number, pos: any) => {
            return sum + (pos.attributes.value || 0);
        }, 0);

        console.log("=" .repeat(60));
        console.log(`💎 Polygon 链总价值: $${totalValue.toFixed(4)}`);
        console.log("=" .repeat(60));

    } catch (error) {
        console.error("❌ 查询失败:", error);
    }
}

queryPolygonTokens();
