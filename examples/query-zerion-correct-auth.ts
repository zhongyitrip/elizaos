// 使用正确的 Zerion API 认证方式（Base64 编码）
async function queryZerionWithCorrectAuth() {
    const apiKey = process.env.ZERION_API_KEY;
    
    if (!apiKey) {
        console.error("❌ 错误: 未设置 ZERION_API_KEY 环境变量");
        process.exit(1);
    }
    
    const address = "0x6cbE62c9Eb937dd5D6Ed630A386581b840889Ae7";
    
    console.log(`正在查询地址: ${address}`);
    console.log("=".repeat(60));
    
    // 🔑 关键：根据 Zerion 文档，需要将 API Key + ":" 进行 Base64 编码
    const base64Auth = Buffer.from(`${apiKey}:`).toString('base64');
    
    console.log("\n🔑 认证信息:");
    console.log(`   API Key: ${apiKey.substring(0, 15)}...`);
    console.log(`   Base64: ${base64Auth.substring(0, 30)}...`);
    
    try {
        // 查询投资组合
        console.log("\n📊 正在获取投资组合数据...\n");
        
        const portfolioUrl = `https://api.zerion.io/v1/wallets/${address}/portfolio`;
        const portfolioResponse = await fetch(portfolioUrl, {
            headers: {
                'Authorization': `Basic ${base64Auth}`,
                'accept': 'application/json',
            }
        });
        
        console.log(`   状态码: ${portfolioResponse.status} ${portfolioResponse.statusText}`);
        
        if (!portfolioResponse.ok) {
            const errorText = await portfolioResponse.text();
            console.error("   ❌ 错误:", errorText);
        } else {
            const portfolioData = await portfolioResponse.json();
            
            console.log("   ✅ 认证成功！\n");
            console.log("💼 投资组合概览:");
            
            if (portfolioData.data?.attributes) {
                const attrs = portfolioData.data.attributes;
                console.log(`   总价值: $${attrs.total?.usd?.toFixed(2) || 'N/A'}`);
                console.log(`   24h 变化: ${attrs.changes?.percent_1d ? (attrs.changes.percent_1d * 100).toFixed(2) + '%' : 'N/A'}`);
                
                if (attrs.positions_distribution_by_type) {
                    console.log("\n   持仓分布:");
                    for (const [type, count] of Object.entries(attrs.positions_distribution_by_type)) {
                        console.log(`   - ${type}: ${count}`);
                    }
                }
                
                if (attrs.positions_distribution_by_chain) {
                    console.log("\n   链分布:");
                    for (const [chain, value] of Object.entries(attrs.positions_distribution_by_chain)) {
                        console.log(`   - ${chain}: $${(value as number).toFixed(2)}`);
                    }
                }
            } else {
                console.log(JSON.stringify(portfolioData, null, 2));
            }
        }
        
        // 查询持仓详情
        console.log("\n" + "=".repeat(60));
        console.log("\n💰 正在获取持仓详情...\n");
        
        const positionsUrl = `https://api.zerion.io/v1/wallets/${address}/positions/?filter[positions]=only_simple&currency=usd&sort=value`;
        const positionsResponse = await fetch(positionsUrl, {
            headers: {
                'Authorization': `Basic ${base64Auth}`,
                'accept': 'application/json',
            }
        });
        
        console.log(`   状态码: ${positionsResponse.status} ${positionsResponse.statusText}`);
        
        if (!positionsResponse.ok) {
            const errorText = await positionsResponse.text();
            console.error("   ❌ 错误:", errorText);
        } else {
            const positionsData = await positionsResponse.json();
            
            console.log("   ✅ 查询成功！\n");
            console.log("📈 持仓列表:");
            
            if (positionsData.data && Array.isArray(positionsData.data)) {
                if (positionsData.data.length === 0) {
                    console.log("   该地址暂无持仓");
                } else {
                    console.log(`\n找到 ${positionsData.data.length} 个持仓:\n`);
                    
                    let totalValue = 0;
                    positionsData.data.forEach((position: any, index: number) => {
                        const attrs = position.attributes;
                        const fungible = attrs?.fungible_info;
                        
                        if (fungible) {
                            console.log(`${index + 1}. ${fungible.name} (${fungible.symbol})`);
                            console.log(`   数量: ${attrs.quantity?.float?.toFixed(6) || 'N/A'}`);
                            console.log(`   价值: $${attrs.value?.toFixed(2) || 'N/A'}`);
                            console.log(`   价格: $${attrs.price?.toFixed(6) || 'N/A'}`);
                            
                            if (attrs.changes?.percent_1d) {
                                const change = (attrs.changes.percent_1d * 100).toFixed(2);
                                const emoji = attrs.changes.percent_1d > 0 ? '📈' : '📉';
                                console.log(`   24h 变化: ${emoji} ${change}%`);
                            }
                            
                            const chain = position.relationships?.chain?.data?.id;
                            if (chain) {
                                console.log(`   链: ${chain}`);
                            }
                            
                            console.log("");
                            
                            totalValue += parseFloat(attrs.value || 0);
                        }
                    });
                    
                    console.log("=".repeat(60));
                    console.log(`💵 总价值: $${totalValue.toFixed(2)}`);
                }
            } else {
                console.log(JSON.stringify(positionsData, null, 2));
            }
        }
        
        console.log("\n" + "=".repeat(60));
        console.log("\n✅ 查询完成！");
        
    } catch (error) {
        console.error("❌ 查询失败:", error);
        if (error instanceof Error) {
            console.error("错误详情:", error.message);
        }
    }
}

queryZerionWithCorrectAuth().catch(console.error);
