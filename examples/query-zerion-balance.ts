import { zerionPlugin } from "@elizaos/plugin-zerion";

// 查询地址余额示例
async function queryBalance() {
    const address = "0x6cbE62c9Eb937dd5D6Ed630A386581b840889Ae7";
    
    console.log(`正在查询地址: ${address}`);
    console.log("=".repeat(60));
    
    // 检查 API Key
    if (!process.env.ZERION_API_KEY) {
        console.error("❌ 错误: 未设置 ZERION_API_KEY 环境变量");
        console.log("\n请按以下步骤配置:");
        console.log("1. 访问 https://developers.zerion.io 获取 API Key");
        console.log("2. 在 .env 文件中添加: ZERION_API_KEY=your_api_key");
        process.exit(1);
    }
    
    try {
        // 获取插件的 actions
        const actions = zerionPlugin.actions || [];
        
        // 查找 portfolio 和 positions actions
        const portfolioAction = actions.find(a => a.name === "getwallet_portfolio");
        const positionsAction = actions.find(a => a.name === "getwallet_positions");
        
        if (!portfolioAction || !positionsAction) {
            console.error("❌ 未找到 Zerion 插件的 actions");
            console.log("可用的 actions:", actions.map(a => a.name));
            process.exit(1);
        }
        
        // 创建模拟的 runtime 和 message 对象
        const mockRuntime = {
            getSetting: (key: string) => {
                if (key === "ZERION_API_KEY") {
                    return process.env.ZERION_API_KEY;
                }
                return null;
            }
        };
        
        const mockMessage = {
            content: {
                text: `查询 ${address} 的余额`
            }
        };
        
        const mockState = {
            walletAddress: address
        };
        
        const mockCallback = null;
        
        console.log("\n📊 正在获取投资组合数据...\n");
        
        // 调用 portfolio action
        const portfolioResult = await portfolioAction.handler(
            mockRuntime as any,
            mockMessage as any,
            mockState as any,
            {},
            mockCallback as any
        );
        
        console.log("💼 投资组合概览:");
        console.log(JSON.stringify(portfolioResult, null, 2));
        
        console.log("\n" + "=".repeat(60));
        console.log("\n💰 正在获取持仓详情...\n");
        
        // 调用 positions action
        const positionsResult = await positionsAction.handler(
            mockRuntime as any,
            mockMessage as any,
            mockState as any,
            {},
            mockCallback as any
        );
        
        console.log("📈 持仓列表:");
        console.log(JSON.stringify(positionsResult, null, 2));
        
    } catch (error) {
        console.error("❌ 查询失败:", error);
        if (error instanceof Error) {
            console.error("错误详情:", error.message);
            console.error("堆栈:", error.stack);
        }
        process.exit(1);
    }
}

// 执行查询
queryBalance().catch(console.error);
