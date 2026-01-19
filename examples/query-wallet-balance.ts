// 使用公开 API 查询钱包余额
async function queryWalletBalance() {
    const address = "0x6cbE62c9Eb937dd5D6Ed630A386581b840889Ae7";
    
    console.log(`正在查询地址: ${address}`);
    console.log("=".repeat(60));
    
    try {
        // 使用 Etherscan API (无需 API Key 的公开端点)
        console.log("\n📊 正在获取以太坊主网余额...\n");
        
        const ethBalanceUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`;
        const ethResponse = await fetch(ethBalanceUrl);
        const ethData = await ethResponse.json();
        
        if (ethData.status === "1") {
            const ethBalance = parseFloat(ethData.result) / 1e18;
            console.log(`💰 ETH 余额: ${ethBalance.toFixed(6)} ETH`);
        }
        
        // 获取 ERC20 代币余额
        console.log("\n📈 正在获取 ERC20 代币余额...\n");
        
        const tokenUrl = `https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&page=1&offset=100&sort=desc`;
        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();
        
        if (tokenData.status === "1" && tokenData.result.length > 0) {
            // 统计代币
            const tokens = new Map<string, any>();
            
            tokenData.result.forEach((tx: any) => {
                const symbol = tx.tokenSymbol;
                if (!tokens.has(symbol)) {
                    tokens.set(symbol, {
                        name: tx.tokenName,
                        symbol: symbol,
                        contractAddress: tx.contractAddress,
                        decimals: parseInt(tx.tokenDecimal)
                    });
                }
            });
            
            console.log(`找到 ${tokens.size} 种代币交易记录:\n`);
            
            let index = 1;
            for (const [symbol, info] of tokens) {
                console.log(`${index}. ${info.name} (${symbol})`);
                console.log(`   合约地址: ${info.contractAddress}`);
                index++;
            }
        } else {
            console.log("未找到 ERC20 代币交易记录");
        }
        
        // 使用 DeBank API (公开端点)
        console.log("\n" + "=".repeat(60));
        console.log("\n🔍 正在使用 DeBank API 获取完整资产信息...\n");
        
        const debankUrl = `https://pro-openapi.debank.com/v1/user/total_balance?id=${address}`;
        const debankResponse = await fetch(debankUrl);
        
        if (debankResponse.ok) {
            const debankData = await debankResponse.json();
            console.log("💼 DeBank 资产概览:");
            console.log(`   总价值: $${debankData.total_usd_value?.toFixed(2) || 'N/A'}`);
            console.log(`   链数量: ${debankData.chain_num || 'N/A'}`);
        } else {
            console.log("DeBank API 暂时不可用");
        }
        
        console.log("\n" + "=".repeat(60));
        console.log("\n✅ 查询完成！");
        console.log("\n💡 提示: 要获取更详细的资产信息，请:");
        console.log("1. 访问 https://developers.zerion.io 获取 Zerion API Key");
        console.log("2. 在 .env 文件添加: ZERION_API_KEY=your_key");
        console.log("3. 运行: bun run examples/query-zerion-balance.ts");
        
    } catch (error) {
        console.error("❌ 查询失败:", error);
        if (error instanceof Error) {
            console.error("错误详情:", error.message);
        }
    }
}

// 执行查询
queryWalletBalance().catch(console.error);
