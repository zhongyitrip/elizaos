// 直接使用 Zerion API 查询地址余额（无需 API Key 的公开端点）
async function queryBalanceDirect() {
    const address = "0x6cbE62c9Eb937dd5D6Ed630A386581b840889Ae7";
    
    console.log(`正在查询地址: ${address}`);
    console.log("=".repeat(60));
    
    try {
        // Zerion API v1 端点
        const portfolioUrl = `https://api.zerion.io/v1/wallets/${address}/portfolio`;
        const positionsUrl = `https://api.zerion.io/v1/wallets/${address}/positions`;
        
        console.log("\n📊 正在获取投资组合数据...\n");
        
        const portfolioResponse = await fetch(portfolioUrl, {
            headers: {
                'accept': 'application/json',
            }
        });
        
        if (!portfolioResponse.ok) {
            throw new Error(`Portfolio API 请求失败: ${portfolioResponse.status} ${portfolioResponse.statusText}`);
        }
        
        const portfolioData = await portfolioResponse.json();
        
        console.log("💼 投资组合概览:");
        console.log(JSON.stringify(portfolioData, null, 2));
        
        console.log("\n" + "=".repeat(60));
        console.log("\n💰 正在获取持仓详情...\n");
        
        const positionsResponse = await fetch(positionsUrl, {
            headers: {
                'accept': 'application/json',
            }
        });
        
        if (!positionsResponse.ok) {
            throw new Error(`Positions API 请求失败: ${positionsResponse.status} ${positionsResponse.statusText}`);
        }
        
        const positionsData = await positionsResponse.json();
        
        console.log("📈 持仓列表:");
        if (positionsData.data && Array.isArray(positionsData.data)) {
            console.log(`\n找到 ${positionsData.data.length} 个持仓:\n`);
            
            positionsData.data.forEach((position: any, index: number) => {
                const fungible = position.attributes?.fungible_info;
                if (fungible) {
                    console.log(`${index + 1}. ${fungible.name} (${fungible.symbol})`);
                    console.log(`   数量: ${position.attributes?.quantity?.float || 'N/A'}`);
                    console.log(`   价值: $${position.attributes?.value || 'N/A'}`);
                    console.log(`   链: ${position.relationships?.chain?.data?.id || 'N/A'}`);
                    console.log("");
                }
            });
            
            // 计算总价值
            const totalValue = positionsData.data.reduce((sum: number, pos: any) => {
                return sum + (parseFloat(pos.attributes?.value) || 0);
            }, 0);
            
            console.log("=".repeat(60));
            console.log(`💵 总价值: $${totalValue.toFixed(2)}`);
        } else {
            console.log(JSON.stringify(positionsData, null, 2));
        }
        
    } catch (error) {
        console.error("❌ 查询失败:", error);
        if (error instanceof Error) {
            console.error("错误详情:", error.message);
        }
        
        console.log("\n💡 提示:");
        console.log("如果遇到 API 限制，请:");
        console.log("1. 访问 https://developers.zerion.io 获取免费 API Key");
        console.log("2. 在 .env 文件中添加: ZERION_API_KEY=your_api_key");
        console.log("3. 使用 query-zerion-balance.ts 脚本");
    }
}

// 执行查询
queryBalanceDirect().catch(console.error);
