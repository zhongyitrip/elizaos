// 测试 Zerion API Key 的正确使用方式
// 根据官方文档: https://developers.zerion.io/reference/authentication

async function testZerionKey() {
    const apiKey = process.env.ZERION_API_KEY;
    
    if (!apiKey) {
        console.error("❌ 未设置 ZERION_API_KEY");
        process.exit(1);
    }
    
    console.log("🔑 测试 Zerion API 认证");
    console.log("API Key 前缀:", apiKey.substring(0, 15) + "...");
    console.log("=".repeat(60));
    
    const address = "0x6cbE62c9Eb937dd5D6Ed630A386581b840889Ae7";
    
    // 根据 Zerion 文档，API Key 应该作为 Bearer token 传递
    // 或者作为查询参数
    
    const testCases: Array<{ name: string; url: string; headers: Record<string, string> }> = [
        {
            name: "方法 1: Authorization Bearer",
            url: `https://api.zerion.io/v1/wallets/${address}/portfolio`,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json',
            }
        },
        {
            name: "方法 2: 查询参数 api_key",
            url: `https://api.zerion.io/v1/wallets/${address}/portfolio?api_key=${apiKey}`,
            headers: {
                'accept': 'application/json',
            }
        },
        {
            name: "方法 3: X-API-Key Header",
            url: `https://api.zerion.io/v1/wallets/${address}/portfolio`,
            headers: {
                'X-API-Key': apiKey,
                'accept': 'application/json',
            }
        },
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🧪 ${testCase.name}`);
        console.log(`   URL: ${testCase.url.substring(0, 80)}...`);
        
        try {
            const response = await fetch(testCase.url, {
                method: 'GET',
                headers: testCase.headers
            });
            
            console.log(`   状态: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                console.log("   ✅ 认证成功！");
                const data = await response.json();
                
                if (data.data?.attributes) {
                    const attrs = data.data.attributes;
                    console.log("\n   📊 投资组合数据:");
                    console.log(`      总价值: $${attrs.total?.usd?.toFixed(2) || 'N/A'}`);
                    console.log(`      24h 变化: ${attrs.changes?.percent_1d ? (attrs.changes.percent_1d * 100).toFixed(2) + '%' : 'N/A'}`);
                }
                
                console.log("\n   ✅ 找到正确的认证方式！");
                return testCase.name;
            } else {
                const errorText = await response.text();
                console.log(`   ❌ 失败`);
                
                // 只显示错误的前100个字符
                if (errorText.length > 100) {
                    console.log(`   错误: ${errorText.substring(0, 100)}...`);
                } else {
                    console.log(`   错误: ${errorText}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ 请求异常:`, error instanceof Error ? error.message : String(error));
        }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("\n❌ 所有认证方式都失败了");
    console.log("\n💡 可能的原因:");
    console.log("1. API Key 格式不正确或已过期");
    console.log("2. 需要从 https://developers.zerion.io 重新生成 API Key");
    console.log("3. API Key 可能需要激活或验证");
    console.log("\n建议:");
    console.log("- 登录 https://developers.zerion.io");
    console.log("- 检查 API Key 状态");
    console.log("- 如有必要，重新生成新的 API Key");
}

testZerionKey().catch(console.error);
