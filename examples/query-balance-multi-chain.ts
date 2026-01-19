// 多链余额查询工具（无需 API Key）
// 支持：Ethereum, Polygon, Arbitrum, Optimism, Base

interface ChainConfig {
    name: string;
    rpcUrl: string;
    explorer?: string;
}

const CHAINS: Record<string, ChainConfig> = {
    ethereum: {
        name: "Ethereum",
        rpcUrl: "https://eth.llamarpc.com",
        explorer: "https://api.etherscan.io/api"
    },
    polygon: {
        name: "Polygon",
        rpcUrl: "https://polygon-rpc.com",
    },
    arbitrum: {
        name: "Arbitrum",
        rpcUrl: "https://arb1.arbitrum.io/rpc",
    },
    optimism: {
        name: "Optimism",
        rpcUrl: "https://mainnet.optimism.io",
    },
    base: {
        name: "Base",
        rpcUrl: "https://mainnet.base.org",
    }
};

async function getBalance(address: string, rpcUrl: string): Promise<string> {
    const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, 'latest'],
            id: 1
        })
    });
    
    const data = await response.json();
    if (data.result) {
        const balanceWei = BigInt(data.result);
        const balanceEth = Number(balanceWei) / 1e18;
        return balanceEth.toFixed(6);
    }
    return '0';
}

async function getEthPrice(): Promise<number> {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        return data.ethereum?.usd || 0;
    } catch {
        return 0;
    }
}

async function queryMultiChainBalance() {
    const address = "0x6cbE62c9Eb937dd5D6Ed630A386581b840889Ae7";
    
    console.log(`\n🔍 查询地址: ${address}`);
    console.log("=".repeat(70));
    
    // 获取 ETH 价格
    console.log("\n💰 获取 ETH 价格...");
    const ethPrice = await getEthPrice();
    console.log(`   当前 ETH 价格: $${ethPrice.toFixed(2)}`);
    
    console.log("\n📊 查询各链余额:\n");
    
    let totalValueUSD = 0;
    const results: Array<{ chain: string; balance: string; valueUSD: number }> = [];
    
    for (const [chainId, config] of Object.entries(CHAINS)) {
        try {
            console.log(`🔗 ${config.name}...`);
            const balance = await getBalance(address, config.rpcUrl);
            const balanceNum = parseFloat(balance);
            const valueUSD = balanceNum * ethPrice;
            
            results.push({
                chain: config.name,
                balance,
                valueUSD
            });
            
            totalValueUSD += valueUSD;
            
            if (balanceNum > 0) {
                console.log(`   ✅ 余额: ${balance} ETH ($${valueUSD.toFixed(2)})`);
            } else {
                console.log(`   ⚪ 余额: 0 ETH`);
            }
        } catch (error) {
            console.log(`   ❌ 查询失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    // 汇总
    console.log("\n" + "=".repeat(70));
    console.log("\n📈 余额汇总:\n");
    
    const nonZeroBalances = results.filter(r => parseFloat(r.balance) > 0);
    
    if (nonZeroBalances.length === 0) {
        console.log("   该地址在所有查询的链上余额均为 0");
    } else {
        nonZeroBalances.forEach(r => {
            console.log(`   ${r.chain.padEnd(15)} ${r.balance.padStart(12)} ETH  ($${r.valueUSD.toFixed(2)})`);
        });
    }
    
    console.log("\n" + "=".repeat(70));
    console.log(`\n💵 总价值: $${totalValueUSD.toFixed(2)} USD`);
    
    // 查询 ERC20 代币（仅 Ethereum）
    if (CHAINS.ethereum.explorer) {
        console.log("\n" + "=".repeat(70));
        console.log("\n🪙 查询 ERC20 代币（Ethereum 主网）...\n");
        
        try {
            const tokenUrl = `${CHAINS.ethereum.explorer}?module=account&action=tokentx&address=${address}&page=1&offset=10&sort=desc`;
            const tokenResponse = await fetch(tokenUrl);
            const tokenData = await tokenResponse.json();
            
            if (tokenData.status === "1" && tokenData.result?.length > 0) {
                const uniqueTokens = new Map<string, any>();
                
                tokenData.result.forEach((tx: any) => {
                    if (!uniqueTokens.has(tx.contractAddress)) {
                        uniqueTokens.set(tx.contractAddress, {
                            name: tx.tokenName,
                            symbol: tx.tokenSymbol,
                            contract: tx.contractAddress
                        });
                    }
                });
                
                console.log(`   找到 ${uniqueTokens.size} 种代币的交易记录:\n`);
                
                let index = 1;
                for (const token of uniqueTokens.values()) {
                    console.log(`   ${index}. ${token.name} (${token.symbol})`);
                    console.log(`      合约: ${token.contract}`);
                    index++;
                }
            } else {
                console.log("   未找到 ERC20 代币交易记录");
            }
        } catch (error) {
            console.log(`   ❌ 代币查询失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("\n✅ 查询完成！\n");
    
    console.log("💡 提示:");
    console.log("   - 此工具使用公开 RPC 节点，无需 API Key");
    console.log("   - 仅显示原生代币余额（ETH/MATIC 等）");
    console.log("   - 要查询完整资产（包括 DeFi 持仓），需要配置 Zerion API Key");
}

queryMultiChainBalance().catch(console.error);
