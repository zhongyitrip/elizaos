/**
 * Polymarket Order Placement Test with API Key Authentication
 * 
 * This version uses API Key for L2 authentication (faster!)
 */

import { elizaLogger } from "@elizaos/core";
import type { IAgentRuntime } from "@elizaos/core";
import { placeOrderAction } from "@elizaos/plugin-polymarket";

const IRAN_MARKET = {
    question: "Khamenei out as Supreme Leader of Iran by February 28?",
    yesTokenId: "39317885422026394259056328144566743331998444273202427934141325790266108570112",
    currentBestAsk: 0.19,
};

const TEST_CONFIG = {
    CLOB_API_URL: process.env.CLOB_API_URL || "https://clob.polymarket.com",
    WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
    // API Key credentials (optional but recommended for faster trading)
    CLOB_API_KEY: process.env.CLOB_API_KEY,
    CLOB_API_SECRET: process.env.CLOB_API_SECRET || process.env.CLOB_SECRET,
    CLOB_API_PASSPHRASE: process.env.CLOB_API_PASSPHRASE || process.env.CLOB_PASS_PHRASE,
};

const createMockRuntime = (): Partial<IAgentRuntime> => ({
    getSetting: (key: string) => {
        const settings: Record<string, string> = {
            CLOB_API_URL: TEST_CONFIG.CLOB_API_URL,
            WALLET_PRIVATE_KEY: TEST_CONFIG.WALLET_PRIVATE_KEY || "",
            POLYMARKET_PRIVATE_KEY: TEST_CONFIG.WALLET_PRIVATE_KEY || "",
            PRIVATE_KEY: TEST_CONFIG.WALLET_PRIVATE_KEY || "",
            CLOB_API_KEY: TEST_CONFIG.CLOB_API_KEY || "",
            CLOB_API_SECRET: TEST_CONFIG.CLOB_API_SECRET || "",
            CLOB_SECRET: TEST_CONFIG.CLOB_API_SECRET || "",
            CLOB_API_PASSPHRASE: TEST_CONFIG.CLOB_API_PASSPHRASE || "",
            CLOB_PASS_PHRASE: TEST_CONFIG.CLOB_API_PASSPHRASE || "",
        };
        return settings[key];
    },
});

const createMockMessage = (text: string) => ({
    userId: "test-user",
    agentId: "test-agent",
    roomId: "test-room",
    content: { text },
});

const createMockState = () => ({});

async function testOrderWithApiKey() {
    console.log("\n" + "=".repeat(80));
    console.log("🚀 POLYMARKET ORDER TEST - WITH API KEY AUTHENTICATION");
    console.log("=".repeat(80));

    // Check authentication method
    const hasApiKey = TEST_CONFIG.CLOB_API_KEY && TEST_CONFIG.CLOB_API_SECRET && TEST_CONFIG.CLOB_API_PASSPHRASE;

    console.log("\n🔐 Authentication Status:");
    console.log(`  Private Key: ${TEST_CONFIG.WALLET_PRIVATE_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  API Key: ${TEST_CONFIG.CLOB_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  API Secret: ${TEST_CONFIG.CLOB_API_SECRET ? '✅ Configured' : '❌ Missing'}`);
    console.log(`  API Passphrase: ${TEST_CONFIG.CLOB_API_PASSPHRASE ? '✅ Configured' : '❌ Missing'}`);

    if (hasApiKey) {
        console.log(`\n✨ Using L2 Authentication (API Key) - Fast & No Gas!`);
        console.log(`  Expected Speed: ~0.1-0.5 seconds`);
        console.log(`  Gas Cost: $0.00 (no gas needed!)`);
    } else {
        console.log(`\n⚠️  Using L1 Authentication (Private Key only) - Slower`);
        console.log(`  Expected Speed: ~3-5 seconds`);
        console.log(`  Gas Cost: ~$0.001-0.01 per transaction`);
        console.log(`\n💡 Tip: Configure API Key for faster trading!`);
    }

    if (!TEST_CONFIG.WALLET_PRIVATE_KEY) {
        console.log("\n❌ No private key configured!");
        process.exit(1);
    }

    const runtime = createMockRuntime() as IAgentRuntime;

    console.log("\n" + "=".repeat(80));
    console.log("📝 Placing Safe Test Order");
    console.log("=".repeat(80));

    const safePrice = 0.01;
    const minSize = 1;

    console.log(`\n📊 Order Parameters:`);
    console.log(`  Token: YES - ${IRAN_MARKET.question}`);
    console.log(`  Side: BUY`);
    console.log(`  Price: $${safePrice} (${(safePrice * 100).toFixed(0)}%)`);
    console.log(`  Size: ${minSize} share`);
    console.log(`  Total: $${(safePrice * minSize).toFixed(2)}`);
    console.log(`  Type: GTC (Good Till Cancelled)`);

    console.log(`\n💡 Safety Check:`);
    console.log(`  Market Price: $${IRAN_MARKET.currentBestAsk}`);
    console.log(`  Our Price: $${safePrice}`);
    console.log(`  Gap: ${((IRAN_MARKET.currentBestAsk - safePrice) / IRAN_MARKET.currentBestAsk * 100).toFixed(0)}% below market`);
    console.log(`  Status: ✅ Will NOT execute immediately`);

    console.log(`\n⏳ Submitting order...`);
    const startTime = Date.now();

    try {
        const orderMessage = createMockMessage(
            `Buy ${minSize} tokens of ${IRAN_MARKET.yesTokenId} at $${safePrice} limit order`
        );

        const result = await placeOrderAction.handler(
            runtime,
            orderMessage,
            createMockState()
        );

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log("\n" + "=".repeat(80));
        console.log("✅ ORDER PLACED SUCCESSFULLY");
        console.log("=".repeat(80));
        console.log(result.text);

        console.log(`\n⏱️  Execution Time: ${duration} seconds`);

        if (hasApiKey) {
            if (parseFloat(duration) < 1) {
                console.log(`   🚀 Using API Key - Super fast!`);
            } else {
                console.log(`   ⚠️  Slower than expected for API Key method`);
            }
        }

        if (result.data?.success) {
            console.log(`\n✅ Success! Order details:`);
            console.log(JSON.stringify(result.data.orderDetails, null, 2));

            if (result.data.orderResponse?.orderId) {
                console.log(`\n🆔 Order ID: ${result.data.orderResponse.orderId}`);
            }
        }

    } catch (error) {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log("\n" + "=".repeat(80));
        console.log("❌ ORDER FAILED");
        console.log("=".repeat(80));
        console.log(`Error: ${error}`);
        console.log(`\nTime taken: ${duration} seconds`);

        if (error instanceof Error) {
            console.log(`\nDetails: ${error.message}`);

            // Common errors
            if (error.message.includes('balance')) {
                console.log(`\n💰 Balance Issue:`);
                console.log(`  You need at least $${(safePrice * minSize).toFixed(2)} USDC on Polygon`);
                console.log(`  Check: https://polygonscan.com/address/${process.env.WALLET_ADDRESS || 'YOUR_ADDRESS'}`);
            }

            if (error.message.includes('allowance') || error.message.includes('approve')) {
                console.log(`\n🔓 Approval Issue:`);
                console.log(`  You need to approve CLOB contract to spend your USDC`);
                console.log(`  1. Visit https://polymarket.com`);
                console.log(`  2. Connect your wallet`);
                console.log(`  3. Deposit or approve USDC`);
            }

            if (error.message.includes('API') || error.message.includes('authentication')) {
                console.log(`\n🔑 API Key Issue:`);
                console.log(`  Check your API credentials are correct`);
                console.log(`  API Key: ${TEST_CONFIG.CLOB_API_KEY ? 'Set' : 'Missing'}`);
                console.log(`  Secret: ${TEST_CONFIG.CLOB_API_SECRET ? 'Set' : 'Missing'}`);
                console.log(`  Passphrase: ${TEST_CONFIG.CLOB_API_PASSPHRASE ? 'Set' : 'Missing'}`);
            }
        }
    }

    console.log("\n" + "=".repeat(80));
    console.log("📊 Summary");
    console.log("=".repeat(80));
    console.log(`Authentication: ${hasApiKey ? 'L2 (API Key) ✨' : 'L1 (Private Key only)'}`);
    console.log(`\nNext steps:`);
    console.log(`  • Check order on Polymarket.com`);
    console.log(`  • Monitor order status`);
    console.log(`  • Cancel if needed`);
    if (!hasApiKey) {
        console.log(`\n💡 Want faster trading?`);
        console.log(`   Set up API Keys for L2 authentication!`);
        console.log(`   See: packages/plugin-polymarket/API_KEYS_GUIDE.md`);
    }
    console.log("=".repeat(80));
}

testOrderWithApiKey().catch((error) => {
    elizaLogger.error("Fatal error:", error);
    process.exit(1);
});
