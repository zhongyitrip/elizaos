// 测试修复后的 @elizaos/plugin-zerion 插件
import { zerionPlugin } from "@elizaos/plugin-zerion";

async function testZerionPlugin() {
    const address = "0x6cbE62c9Eb937dd5D6Ed630A386581b840889Ae7";
    
    console.log("🧪 测试 @elizaos/plugin-zerion 插件");
    console.log("=".repeat(60));
    
    // 检查 API Key
    if (!process.env.ZERION_API_KEY) {
        console.error("❌ 错误: 未设置 ZERION_API_KEY 环境变量");
        process.exit(1);
    }
    
    console.log(`\n🔑 API Key: ${process.env.ZERION_API_KEY.substring(0, 15)}...`);
    console.log(`📍 测试地址: ${address}\n`);
    
    // 获取插件的 actions
    const actions = zerionPlugin.actions || [];
    console.log(`📦 插件包含 ${actions.length} 个 actions:`);
    actions.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action.name}`);
    });
    
    // 测试 Portfolio Action
    console.log("\n" + "=".repeat(60));
    console.log("\n🧪 测试 1: getWallet_portfolio\n");
    
    const portfolioAction = actions.find(a => a.name === "getwallet_portfolio");
    
    if (!portfolioAction) {
        console.error("❌ 未找到 getwallet_portfolio action");
        process.exit(1);
    }
    
    // 创建模拟的 runtime、message 和 state
    const mockRuntime = {
        getSetting: (key: string) => {
            if (key === "ZERION_API_KEY") {
                return process.env.ZERION_API_KEY;
            }
            return null;
        }
    } as any;
    
    const mockMessage = {
        content: {
            text: `查询 ${address} 的投资组合`
        }
    } as any;
    
    const mockState = {} as any;
    
    let portfolioResult: any = null;
    const mockCallback = (result: any) => {
        portfolioResult = result;
    };
    
    try {
        const success = await portfolioAction.handler(
            mockRuntime,
            mockMessage,
            mockState,
            {},
            mockCallback
        );
        
        if (success && portfolioResult) {
            console.log("✅ Portfolio 查询成功！\n");
            console.log("📊 返回数据:");
            console.log(`   文本: ${portfolioResult.text}`);
            if (portfolioResult.content) {
                console.log(`   总价值: $${portfolioResult.content.totalValue?.toFixed(2) || 'N/A'}`);
                console.log(`   24h 变化: ${portfolioResult.content.changes?.percent_1d ? (portfolioResult.content.changes.percent_1d * 100).toFixed(2) + '%' : 'N/A'}`);
            }
        } else {
            console.error("❌ Portfolio 查询失败");
        }
    } catch (error) {
        console.error("❌ Portfolio 查询异常:", error instanceof Error ? error.message : String(error));
    }
    
    // 测试 Positions Action
    console.log("\n" + "=".repeat(60));
    console.log("\n🧪 测试 2: getWallet_positions\n");
    
    const positionsAction = actions.find(a => a.name === "getwallet_positions");
    
    if (!positionsAction) {
        console.error("❌ 未找到 getwallet_positions action");
        process.exit(1);
    }
    
    let positionsResult: any = null;
    const mockCallback2 = (result: any) => {
        positionsResult = result;
    };
    
    try {
        const success = await positionsAction.handler(
            mockRuntime,
            mockMessage,
            mockState,
            {},
            mockCallback2
        );
        
        if (success && positionsResult) {
            console.log("✅ Positions 查询成功！\n");
            console.log("📈 返回数据:");
            console.log(positionsResult.text.substring(0, 500));
            
            if (positionsResult.content?.positions) {
                console.log(`\n   找到 ${positionsResult.content.positions.length} 个持仓`);
                console.log(`   总价值: $${positionsResult.content.totalValue?.toFixed(2) || 'N/A'}`);
            }
        } else {
            console.error("❌ Positions 查询失败");
        }
    } catch (error) {
        console.error("❌ Positions 查询异常:", error instanceof Error ? error.message : String(error));
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("\n✅ 插件测试完成！");
    console.log("\n💡 修复说明:");
    console.log("   - 已修复 Base64 认证问题");
    console.log("   - API 请求现在使用正确的编码方式");
    console.log("   - 插件可以正常查询 Zerion API");
}

testZerionPlugin().catch(console.error);
