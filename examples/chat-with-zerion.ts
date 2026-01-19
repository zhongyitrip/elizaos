// 演示如何在 ElizaOS 中使用自然语言查询钱包余额
import { zerionPlugin } from "@elizaos/plugin-zerion";

// 模拟用户发送自然语言消息查询余额
async function chatWithZerion() {
    console.log("💬 ElizaOS + Zerion 插件 - 自然语言查询演示");
    console.log("=".repeat(60));
    
    // 测试地址
    const testAddress = "0x6cbE62c9Eb937dd5D6Ed630A386581b840889Ae7";
    
    // 模拟不同的自然语言查询方式
    const naturalLanguageQueries = [
        `查询 ${testAddress} 的余额`,
        `Show me the balance of ${testAddress}`,
        `What's the portfolio for ${testAddress}?`,
        `Check wallet ${testAddress}`,
        `Get holdings for ${testAddress}`,
    ];
    
    console.log("\n📝 支持的自然语言查询示例:\n");
    naturalLanguageQueries.forEach((query, index) => {
        console.log(`   ${index + 1}. "${query}"`);
    });
    
    // 获取插件的 actions
    const portfolioAction = zerionPlugin.actions?.find(a => a.name === "getwallet_portfolio");
    const positionsAction = zerionPlugin.actions?.find(a => a.name === "getwallet_positions");
    
    if (!portfolioAction || !positionsAction) {
        console.error("\n❌ 插件 actions 未找到");
        return;
    }
    
    // 测试第一个查询
    console.log("\n" + "=".repeat(60));
    console.log(`\n🧪 测试查询: "${naturalLanguageQueries[0]}"\n`);
    
    // 创建模拟的 runtime 和 message
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
            text: naturalLanguageQueries[0]
        }
    } as any;
    
    const mockState = {} as any;
    
    // 1. 查询投资组合概览
    console.log("📊 步骤 1: 获取投资组合概览...\n");
    
    let portfolioResult: any = null;
    const portfolioCallback = (result: any) => {
        portfolioResult = result;
    };
    
    try {
        const success = await portfolioAction.handler(
            mockRuntime,
            mockMessage,
            mockState,
            {},
            portfolioCallback
        );
        
        if (success && portfolioResult) {
            console.log("✅ 查询成功！\n");
            console.log("🤖 AI 回复:");
            console.log(`   "${portfolioResult.text}"\n`);
            
            if (portfolioResult.content) {
                console.log("📈 详细数据:");
                console.log(`   总价值: $${portfolioResult.content.totalValue?.toFixed(2) || 'N/A'}`);
                console.log(`   24h 变化: ${portfolioResult.content.changes?.percent_1d ? (portfolioResult.content.changes.percent_1d * 100).toFixed(2) + '%' : 'N/A'}`);
                
                if (portfolioResult.content.chainDistribution) {
                    console.log("\n   链分布:");
                    for (const [chain, value] of Object.entries(portfolioResult.content.chainDistribution)) {
                        console.log(`   - ${chain}: $${(value as number).toFixed(2)}`);
                    }
                }
            }
        }
    } catch (error) {
        console.error("❌ 查询失败:", error instanceof Error ? error.message : String(error));
    }
    
    // 2. 查询详细持仓
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 步骤 2: 获取详细持仓信息...\n");
    
    let positionsResult: any = null;
    const positionsCallback = (result: any) => {
        positionsResult = result;
    };
    
    try {
        const success = await positionsAction.handler(
            mockRuntime,
            mockMessage,
            mockState,
            {},
            positionsCallback
        );
        
        if (success && positionsResult) {
            console.log("✅ 查询成功！\n");
            console.log("🤖 AI 回复:");
            console.log(positionsResult.text);
        }
    } catch (error) {
        console.error("❌ 查询失败:", error instanceof Error ? error.message : String(error));
    }
    
    // 使用说明
    console.log("\n" + "=".repeat(60));
    console.log("\n💡 在 ElizaOS Web UI 中使用:\n");
    console.log("1. 确保 Zerion 插件已加载（在 character 配置中添加）");
    console.log("2. 在聊天框中输入自然语言，例如：");
    console.log(`   "查询 ${testAddress} 的余额"`);
    console.log(`   "Show me the portfolio for ${testAddress}"`);
    console.log("3. AI 会自动识别地址并调用 Zerion 插件查询");
    console.log("4. 返回投资组合和持仓信息");
    
    console.log("\n📝 Character 配置示例:\n");
    console.log(`{
  "name": "Crypto Assistant",
  "plugins": ["@elizaos/plugin-zerion"],
  "settings": {
    "secrets": {
      "ZERION_API_KEY": "zk_dev_..."
    }
  }
}`);
}

chatWithZerion().catch(console.error);
