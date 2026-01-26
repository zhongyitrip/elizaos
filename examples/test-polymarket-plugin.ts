/**
 * Comprehensive Test Suite for Polymarket Plugin
 * 
 * This script tests all available features of the @elizaos/plugin-polymarket
 * to verify functionality and identify missing features.
 */

import { elizaLogger } from "@elizaos/core";
import type { IAgentRuntime } from "@elizaos/core";

// Import all actions from the plugin
import {
    retrieveAllMarketsAction,
    getSimplifiedMarketsAction,
    getClobMarkets,
    getOpenMarkets,
    getPriceHistory,
    getMarketDetailsAction,
    getOrderBookSummaryAction,
    getOrderBookDepthAction,
    getBestPriceAction,
    getMidpointPriceAction,
    getSpreadAction,
    placeOrderAction,
    createApiKeyAction,
    getAllApiKeysAction,
} from "@elizaos/plugin-polymarket";

// Test configuration
// To use test credentials, run: export $(cat packages/plugin-polymarket/.env.test | xargs)
const TEST_CONFIG = {
    CLOB_API_URL: process.env.CLOB_API_URL || "https://clob.polymarket.com",
    WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY || process.env.POLYMARKET_PRIVATE_KEY,
    TEST_EOA_ADDRESS: "0x954Dd23A8e23244f28bc587D9F13EBb2a072155C",
    // We'll test with public endpoints first (no auth required)
    SKIP_AUTH_TESTS: !process.env.POLYMARKET_PRIVATE_KEY && !process.env.WALLET_PRIVATE_KEY,
};

// Mock runtime for testing
const createMockRuntime = (): Partial<IAgentRuntime> => ({
    getSetting: (key: string) => {
        const settings: Record<string, string> = {
            CLOB_API_URL: TEST_CONFIG.CLOB_API_URL,
            WALLET_PRIVATE_KEY: TEST_CONFIG.WALLET_PRIVATE_KEY || "",
            POLYMARKET_PRIVATE_KEY: TEST_CONFIG.WALLET_PRIVATE_KEY || "",
            PRIVATE_KEY: TEST_CONFIG.WALLET_PRIVATE_KEY || "",
        };
        return settings[key];
    },
});

// Mock message and state
const createMockMessage = (text: string) => ({
    userId: "test-user",
    agentId: "test-agent",
    roomId: "test-room",
    content: { text },
});

const createMockState = () => ({});

// Test results tracking
interface TestResult {
    name: string;
    category: string;
    status: "✅ PASS" | "❌ FAIL" | "⚠️ SKIP" | "🔧 PARTIAL";
    message: string;
    error?: string;
    data?: any;
}

const testResults: TestResult[] = [];

// Helper function to run a test
async function runTest(
    name: string,
    category: string,
    testFn: () => Promise<any>
): Promise<void> {
    elizaLogger.info(`\n🧪 Testing: ${name}`);
    try {
        const result = await testFn();
        testResults.push({
            name,
            category,
            status: "✅ PASS",
            message: "Test completed successfully",
            data: result,
        });
        elizaLogger.success(`✅ ${name} - PASSED`);
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        testResults.push({
            name,
            category,
            status: "❌ FAIL",
            message: "Test failed",
            error: errorMsg,
        });
        elizaLogger.error(`❌ ${name} - FAILED: ${errorMsg}`);
    }
}

// ============================================================================
// PHASE 1: Market Data Tests (Read-Only, No Auth Required)
// ============================================================================

async function testMarketDataRetrieval() {
    elizaLogger.info("\n" + "=".repeat(80));
    elizaLogger.info("📊 PHASE 1: MARKET DATA RETRIEVAL TESTS");
    elizaLogger.info("=".repeat(80));

    const runtime = createMockRuntime() as IAgentRuntime;

    // Test 1: Retrieve All Markets
    await runTest(
        "Retrieve All Markets",
        "Market Data",
        async () => {
            const message = createMockMessage("Show me all markets");
            const state = createMockState();
            const result = await retrieveAllMarketsAction.handler(runtime, message, state);
            elizaLogger.info(`Found ${result.data?.markets?.length || 0} markets`);
            return result;
        }
    );

    // Test 2: Get Simplified Markets
    await runTest(
        "Get Simplified Markets",
        "Market Data",
        async () => {
            const message = createMockMessage("Get simplified markets");
            const state = createMockState();
            const result = await getSimplifiedMarketsAction.handler(runtime, message, state);
            elizaLogger.info(`Found ${result.data?.markets?.length || 0} simplified markets`);
            return result;
        }
    );

    // Test 3: Get CLOB Markets
    await runTest(
        "Get CLOB Markets",
        "Market Data",
        async () => {
            const message = createMockMessage("Show CLOB markets");
            const state = createMockState();
            const result = await getClobMarkets.handler(runtime, message, state);
            elizaLogger.info(`Found ${result.data?.count || 0} CLOB markets`);
            return result;
        }
    );

    // Test 4: Get Open Markets
    await runTest(
        "Get Open Markets",
        "Market Data",
        async () => {
            const message = createMockMessage("Show open markets");
            const state = createMockState();
            const result = await getOpenMarkets.handler(runtime, message, state);
            elizaLogger.info(`Found ${result.data?.markets?.length || 0} open markets`);
            return result;
        }
    );
}

// ============================================================================
// PHASE 2: Price & Order Book Tests (Read-Only, No Auth Required)
// ============================================================================

async function testPriceAndOrderBook() {
    elizaLogger.info("\n" + "=".repeat(80));
    elizaLogger.info("💰 PHASE 2: PRICE & ORDER BOOK TESTS");
    elizaLogger.info("=".repeat(80));

    const runtime = createMockRuntime() as IAgentRuntime;

    // First, get a sample token ID from markets
    let sampleTokenId: string | null = null;
    try {
        const message = createMockMessage("Get CLOB markets with limit 1");
        const state = createMockState();
        const marketsResult = await getClobMarkets.handler(runtime, message, state);

        if (marketsResult.data?.markets?.[0]?.tokens?.[0]?.token_id) {
            sampleTokenId = marketsResult.data.markets[0].tokens[0].token_id;
            elizaLogger.info(`📌 Using sample token ID: ${sampleTokenId}`);
        }
    } catch (error) {
        elizaLogger.warn("Could not fetch sample token ID, using fallback");
    }

    // Fallback token ID if we couldn't get one
    if (!sampleTokenId) {
        sampleTokenId = "21742633143463906290569050155826241533067272736897614950488156847949938836455";
        elizaLogger.info(`📌 Using fallback token ID: ${sampleTokenId}`);
    }

    // Test 5: Get Order Book Summary
    await runTest(
        "Get Order Book Summary",
        "Order Book",
        async () => {
            const message = createMockMessage(`Get order book for token ${sampleTokenId}`);
            const state = createMockState();
            const result = await getOrderBookSummaryAction.handler(runtime, message, state);
            elizaLogger.info(`Order book has ${result.data?.orderBook?.bids?.length || 0} bids and ${result.data?.orderBook?.asks?.length || 0} asks`);
            return result;
        }
    );

    // Test 6: Get Order Book Depth
    await runTest(
        "Get Order Book Depth",
        "Order Book",
        async () => {
            const message = createMockMessage(`Get order book depth for token ${sampleTokenId}`);
            const state = createMockState();
            const result = await getOrderBookDepthAction.handler(runtime, message, state);
            elizaLogger.info(`Found ${result.data?.orderBooks?.length || 0} order books`);
            return result;
        }
    );

    // Test 7: Get Best Price (Buy)
    await runTest(
        "Get Best Price (Buy)",
        "Pricing",
        async () => {
            const message = createMockMessage(`Get best buy price for token ${sampleTokenId}`);
            const state = createMockState();
            const result = await getBestPriceAction.handler(runtime, message, state);
            elizaLogger.info(`Best buy price: ${result.data?.formattedPrice || 'N/A'}`);
            return result;
        }
    );

    // Test 8: Get Best Price (Sell)
    await runTest(
        "Get Best Price (Sell)",
        "Pricing",
        async () => {
            const message = createMockMessage(`Get best sell price for token ${sampleTokenId}`);
            const state = createMockState();
            const result = await getBestPriceAction.handler(runtime, message, state);
            elizaLogger.info(`Best sell price: ${result.data?.formattedPrice || 'N/A'}`);
            return result;
        }
    );

    // Test 9: Get Midpoint Price
    await runTest(
        "Get Midpoint Price",
        "Pricing",
        async () => {
            const message = createMockMessage(`Get midpoint price for token ${sampleTokenId}`);
            const state = createMockState();
            const result = await getMidpointPriceAction.handler(runtime, message, state);
            elizaLogger.info(`Midpoint price: ${result.data?.formattedPrice || 'N/A'}`);
            return result;
        }
    );

    // Test 10: Get Spread
    await runTest(
        "Get Spread",
        "Pricing",
        async () => {
            const message = createMockMessage(`Get spread for token ${sampleTokenId}`);
            const state = createMockState();
            const result = await getSpreadAction.handler(runtime, message, state);
            elizaLogger.info(`Spread: ${result.data?.formattedSpread || 'N/A'}`);
            return result;
        }
    );

    // Test 11: Get Price History
    await runTest(
        "Get Price History",
        "Pricing",
        async () => {
            const message = createMockMessage(`Get price history for token ${sampleTokenId} with 1d interval`);
            const state = createMockState();
            const result = await getPriceHistory.handler(runtime, message, state);
            elizaLogger.info(`Price history has ${result.data?.pointsCount || 0} data points`);
            return result;
        }
    );
}

// ============================================================================
// PHASE 3: Authentication & Trading Tests (Requires Private Key)
// ============================================================================

async function testAuthenticationAndTrading() {
    elizaLogger.info("\n" + "=".repeat(80));
    elizaLogger.info("🔐 PHASE 3: AUTHENTICATION & TRADING TESTS");
    elizaLogger.info("=".repeat(80));

    if (TEST_CONFIG.SKIP_AUTH_TESTS) {
        elizaLogger.warn("⚠️  Skipping authentication tests - No private key configured");
        testResults.push({
            name: "Authentication & Trading Tests",
            category: "Trading",
            status: "⚠️ SKIP",
            message: "No POLYMARKET_PRIVATE_KEY or WALLET_PRIVATE_KEY configured",
        });
        return;
    }

    const runtime = createMockRuntime() as IAgentRuntime;

    // Test 12: Get All API Keys
    await runTest(
        "Get All API Keys",
        "Authentication",
        async () => {
            const message = createMockMessage("Show all my API keys");
            const state = createMockState();
            const result = await getAllApiKeysAction.handler(runtime, message, state);
            elizaLogger.info(`Found ${result.data?.apiKeys?.length || 0} API keys`);
            return result;
        }
    );

    // Note: We won't test actual order placement to avoid real trades
    elizaLogger.info("⚠️  Skipping actual order placement tests to avoid real trades");
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
    elizaLogger.info("\n" + "=".repeat(80));
    elizaLogger.info("🚀 POLYMARKET PLUGIN COMPREHENSIVE TEST SUITE");
    elizaLogger.info("=".repeat(80));
    elizaLogger.info(`CLOB API URL: ${TEST_CONFIG.CLOB_API_URL}`);
    elizaLogger.info(`Test EOA Address: ${TEST_CONFIG.TEST_EOA_ADDRESS}`);
    elizaLogger.info(`Has Private Key: ${TEST_CONFIG.WALLET_PRIVATE_KEY ? "✅ YES" : "❌ NO"}`);
    elizaLogger.info(`Auth Tests: ${TEST_CONFIG.SKIP_AUTH_TESTS ? "DISABLED" : "ENABLED"}`);
    elizaLogger.info("=".repeat(80));

    const startTime = Date.now();

    // Run all test phases
    await testMarketDataRetrieval();
    await testPriceAndOrderBook();
    await testAuthenticationAndTrading();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Print summary
    elizaLogger.info("\n" + "=".repeat(80));
    elizaLogger.info("📊 TEST SUMMARY");
    elizaLogger.info("=".repeat(80));

    const categories = [...new Set(testResults.map(r => r.category))];

    for (const category of categories) {
        elizaLogger.info(`\n📁 ${category}:`);
        const categoryResults = testResults.filter(r => r.category === category);

        for (const result of categoryResults) {
            elizaLogger.info(`  ${result.status} ${result.name}`);
            if (result.error) {
                elizaLogger.error(`      Error: ${result.error}`);
            }
        }
    }

    const passed = testResults.filter(r => r.status === "✅ PASS").length;
    const failed = testResults.filter(r => r.status === "❌ FAIL").length;
    const skipped = testResults.filter(r => r.status === "⚠️ SKIP").length;
    const total = testResults.length;

    elizaLogger.info("\n" + "=".repeat(80));
    elizaLogger.info(`✅ Passed: ${passed}/${total}`);
    elizaLogger.info(`❌ Failed: ${failed}/${total}`);
    elizaLogger.info(`⚠️  Skipped: ${skipped}/${total}`);
    elizaLogger.info(`⏱️  Duration: ${duration}s`);
    elizaLogger.info("=".repeat(80));

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
    elizaLogger.error("Fatal error running tests:", error);
    process.exit(1);
});
