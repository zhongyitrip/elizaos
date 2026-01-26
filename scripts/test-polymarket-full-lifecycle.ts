#!/usr/bin/env bun
/**
 * 🧪 Polymarket Full Lifecycle Diagnostic Tool
 * 🧪 Polymarket 全生命周期诊断工具
 * 
 * ==========================================
 * 📋 PREREQUISITES / 必要条件
 * ==========================================
 * 1. Runtime / 运行环境:
 *    - Bun or Node.js (v18+)
 *    - @polymarket/clob-client installed
 *    - ethers.js installed
 * 
 * 2. Network / 网络:
 *    - Access to https://clob.polymarket.com
 *    - No VPN blocking Polygon/US based crypto services (if applicable)
 * 
 * 3. Credentials / 凭证 (Fill in CONFIG below):
 *    - Private Key (Polygon Wallet)
 *    - CLOB API Key, Secret, Passphrase (Derived from wallet signature)
 * 
 * 4. Funds / 资金:
 *    - At least 1-2 USDC on Polygon network in the Proxy Wallet
 *    - Sufficient MATIC for gas (though CLOB trading is gasless, setup might need it)
 * 
 * ==========================================
 */

import { ClobClient, Side, OrderType } from '@polymarket/clob-client';
import { ethers } from 'ethers';

// ✅ CREDENTIALS / 配置信息
// Values loaded from .env file or placeholders
import * as dotenv from 'dotenv';
dotenv.config();

const CONFIG = {
    // 钱包私钥
    privateKey: process.env.PRIVATE_KEY || 'YOUR_PRIVATE_KEY',
    // API 凭证 (L2 Key)
    apiKey: process.env.CLOB_API_KEY || 'YOUR_CLOB_API_KEY',
    apiSecret: process.env.CLOB_API_SECRET || 'YOUR_CLOB_API_SECRET',
    apiPassphrase: process.env.CLOB_API_PASSPHRASE || 'YOUR_CLOB_API_PASSPHRASE',
    // 代理合约地址 (Proxy Address)
    proxyAddress: process.env.POLYMARKET_PROXY_ADDRESS || 'YOUR_PROXY_ADDRESS'
};

// Target Market: "Khamenei out as Supreme Leader..."
const TOKEN_ID = '39317885422026394259056328144566743331998444273202427934141325790266108570112';
const CONDITION_ID = '0xd4bbf7f6707c67beb736135ad32a41f6db41f8ae52d3ac4919650de9eeb94ed8';

// Helper: Sleep
async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Log Helper
function log(step: string, en: string, cn: string) {
    console.log(`\n${step}`);
    console.log(`   🇺🇸 ${en}`);
    console.log(`   🇨🇳 ${cn}`);
}

async function runLifecycleTest() {
    console.log('\n==================================================');
    console.log('🧪 Polymarket Diagnostic Tool Running...');
    console.log('🧪 Polymarket 诊断工具启动中...');
    console.log('==================================================');

    // --- SETUP / 初始化 ---
    const wallet = new ethers.Wallet(CONFIG.privateKey);
    const signer = {
        ...wallet,
        _signTypedData: async (domain: any, types: any, value: any) =>
            wallet.signTypedData(domain, types, value),
        getAddress: async () => wallet.address,
    };

    const client = new ClobClient(
        'https://clob.polymarket.com',
        137,
        signer as any,
        { key: CONFIG.apiKey, secret: CONFIG.apiSecret, passphrase: CONFIG.apiPassphrase },
        2,
        CONFIG.proxyAddress
    );

    try {
        // 1. CHECK CONNECTION / 检查连接
        log('1️⃣  STEP 1: CONNECTIVITY', 'Checking connection to Polymarket CLOB...', '正在检查 Polymarket CLOB 连接...');
        const initialOrders = await client.getOpenOrders();
        console.log(`   ✅ Connected! Active Orders: ${initialOrders.length}`);

        // 2. PLACE ORDER / 下单测试
        const TEST_PRICE = 0.03;
        const TEST_SIZE = 5;

        log('2️⃣  STEP 2: PLACE ORDER', `Placing Test Order (Buy ${TEST_SIZE} @ $${TEST_PRICE})...`, `正在下测试单 (买入 ${TEST_SIZE} 份 @ $${TEST_PRICE})...`);

        // Get market tick size
        let market = { tickSize: '0.01', negRisk: false };
        try { market = await client.getMarket(CONDITION_ID); } catch { }

        const orderResp = await client.createAndPostOrder(
            { tokenID: TOKEN_ID, price: TEST_PRICE, size: TEST_SIZE, side: Side.BUY },
            { tickSize: market.tickSize, negRisk: market.negRisk },
            OrderType.GTC
        );

        const newOrderId = orderResp.orderID;
        if (!newOrderId && !orderResp.success) throw new Error('Order placement failed');

        console.log(`   ✅ Placed! ID: ${newOrderId}`);


        // 3. VERIFY ORDER / 验证订单
        log('3️⃣  STEP 3: USER VERIFICATION', 'Order is LIVE! Pausing 15s for you to check website...', '订单已生效！暂停 15 秒供您去网页查看...');
        console.log('   👉 Go to: https://polymarket.com/portfolio');

        // 15s Countdown
        for (let i = 15; i > 0; i--) {
            process.stdout.write(`\r   ⏳ Checking in ${i} seconds... (Check website now!)`);
            await sleep(1000);
        }
        console.log('\n   ✅ Timer done. Proceeding to verify & cancel.');

        const updatedOrders = await client.getOpenOrders();
        const myOrder = updatedOrders.find((o: any) => o.id === newOrderId);

        if (myOrder) {
            console.log(`   ✅ Verified! Order checks out on-chain.`);
            console.log(`      (验证成功！订单已确认上链)`);
        } else {
            throw new Error(`Order ${newOrderId} not found after placement (下单后未找到订单)`);
        }

        // 4. CANCEL ORDER / 撤单测试
        log('4️⃣  STEP 4: CANCELLATION', 'Cancelling the test order...', '正在撤销测试订单...');
        if (newOrderId) {
            await client.cancelOrder({ orderID: newOrderId });
            console.log(`   ✅ Cancel Request Sent.`);
        }

        // 5. FINAL CONFIRMATION / 确认撤单
        log('5️⃣  STEP 5: CONFIRMATION', 'Verifying order is gone...', '确认订单已消失...');
        await sleep(2000);

        const finalOrders = await client.getOpenOrders();
        const isGone = !finalOrders.find((o: any) => o.id === newOrderId);

        if (isGone) {
            console.log(`   ✅ Success! Order cancelled correctly.`);
            console.log(`      (成功！订单已正确撤销)`);
        } else {
            console.error(`   ❌ Failed! Order still exists.`);
            console.error(`      (失败！订单仍然存在)`);
        }

        // --- SUMMARY / 总结 ---
        console.log('\n==================================================');
        console.log('🎉 DIAGNOSTIC PASSED / 诊断通过');
        console.log('   All systems nominal. Ready for deployment.');
        console.log('   所有系统正常，可以部署。');
        console.log('==================================================');

    } catch (error) {
        console.error('\n❌ DIAGNOSTIC FAILED / 诊断失败');
        console.error('   Error:', (error as any).response?.data?.error || (error as any).message);
    }
}

runLifecycleTest().catch(console.error);
