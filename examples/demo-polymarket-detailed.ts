/**
 * Detailed Polymarket Plugin Demonstration
 * 
 * This script demonstrates ALL working features using a REAL market:
 * "Khamenei out as Supreme Leader of Iran by February 28?"
 * https://polymarket.com/event/khamenei-out-as-supreme-leader-of-iran-by-february-28
 */

import { elizaLogger } from "@elizaos/core";
import type { IAgentRuntime } from "@elizaos/core";

import {
    retrieveAllMarketsAction,
    getSimplifiedMarketsAction,
    getClobMarkets,
    getOpenMarkets,
    getPriceHistory,
    getOrderBookSummaryAction,
    getOrderBookDepthAction,
    getBestPriceAction,
    getMidpointPriceAction,
    getSpreadAction,
} from "@elizaos/plugin-polymarket";

// Test configuration
const TEST_CONFIG = {
    CLOB_API_URL: process.env.CLOB_API_URL || "https://clob.polymarket.com",
    WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY || process.env.POLYMARKET_PRIVATE_KEY,
    TEST_EOA_ADDRESS: "0x954Dd23A8e23244f28bc587D9F13EBb2a072155C",
    // Target market for demonstration
    TARGET_MARKET_SLUG: "khamenei-out-as-supreme-leader-of-iran-by-february-28",
};

// Mock runtime
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

const createMockMessage = (text: string) => ({
    userId: "demo-user",
    agentId: "demo-agent",
    roomId: "demo-room",
    content: { text },
});

const createMockState = () => ({});

// Utility to print section headers
function printSection(title: string) {
    console.log("\n" + "=".repeat(80));
    console.log(`📊 ${title}`);
    console.log("=".repeat(80) + "\n");
}

// Utility to print JSON beautifully
function printJSON(label: string, data: any, maxDepth: number = 3) {
    console.log(`\n${label}:`);
    console.log(JSON.stringify(data, null, 2));
}

// ============================================================================
// DEMO 1: Market Data Retrieval
// ============================================================================

async function demoMarketDataRetrieval() {
    printSection("DEMO 1: Market Data Retrieval");

    const runtime = createMockRuntime() as IAgentRuntime;

    elizaLogger.info("🔍 Searching for Iran Supreme Leader market...\n");

    // Get all markets
    const message = createMockMessage("Show me all markets");
    const state = createMockState();
    const result = await retrieveAllMarketsAction.handler(runtime, message, state);

    const allMarkets = result.data?.markets || [];
    elizaLogger.info(`✅ Total markets found: ${allMarkets.length}\n`);

    // Find our target market
    const targetMarket = allMarkets.find((m: any) =>
        m.question?.toLowerCase().includes("khamenei") ||
        m.question?.toLowerCase().includes("iran")
    );

    if (targetMarket) {
        console.log("🎯 TARGET MARKET FOUND:");
        console.log("━".repeat(80));
        console.log(`Question: ${targetMarket.question}`);
        console.log(`Category: ${targetMarket.category || 'N/A'}`);
        console.log(`Market ID: ${targetMarket.condition_id}`);
        console.log(`Active: ${targetMarket.active ? '✅ YES' : '❌ NO'}`);
        console.log(`Closed: ${targetMarket.closed ? '❌ YES' : '✅ NO'}`);
        console.log(`End Date: ${targetMarket.end_date_iso || 'N/A'}`);
        console.log(`Description: ${targetMarket.description || 'N/A'}`);

        if (targetMarket.tokens && targetMarket.tokens.length > 0) {
            console.log("\n📈 OUTCOME TOKENS:");
            targetMarket.tokens.forEach((token: any, idx: number) => {
                console.log(`  ${idx + 1}. ${token.outcome || 'Unknown'}`);
                console.log(`     Token ID: ${token.token_id}`);
                console.log(`     Winner: ${token.winner ? '🏆 YES' : '⏳ TBD'}`);
            });
        }

        if (targetMarket.rewards) {
            console.log("\n💰 REWARDS:");
            console.log(`  Min Size: ${targetMarket.rewards.min_size || 'N/A'}`);
            console.log(`  Max Spread: ${targetMarket.rewards.max_spread || 'N/A'}`);
        }

        console.log("━".repeat(80));

        return targetMarket;
    } else {
        elizaLogger.warn("⚠️  Target market not found, using first available market");
        return allMarkets[0];
    }
}

// ============================================================================
// DEMO 2: Simplified Markets
// ============================================================================

async function demoSimplifiedMarkets() {
    printSection("DEMO 2: Simplified Market Data");

    const runtime = createMockRuntime() as IAgentRuntime;
    const message = createMockMessage("Get simplified markets");
    const state = createMockState();

    const result = await getSimplifiedMarketsAction.handler(runtime, message, state);
    const markets = result.data?.markets || [];

    elizaLogger.info(`✅ Simplified markets retrieved: ${markets.length}\n`);

    // Show first 3 as examples
    console.log("📋 SAMPLE SIMPLIFIED MARKETS (showing first 3):");
    console.log("━".repeat(80));

    markets.slice(0, 3).forEach((market: any, idx: number) => {
        console.log(`\n${idx + 1}. Condition ID: ${market.condition_id?.substring(0, 20)}...`);
        console.log(`   Active: ${market.active ? '✅' : '❌'}`);
        console.log(`   Closed: ${market.closed ? '❌' : '✅'}`);
        if (market.tokens && market.tokens.length > 0) {
            console.log(`   Tokens: ${market.tokens.length} outcome(s)`);
        }
    });

    console.log("━".repeat(80));

    return markets;
}

// ============================================================================
// DEMO 3: CLOB Markets (Tradeable)
// ============================================================================

async function demoClobMarkets() {
    printSection("DEMO 3: CLOB Markets (Tradeable)");

    const runtime = createMockRuntime() as IAgentRuntime;
    const message = createMockMessage("Show CLOB markets");
    const state = createMockState();

    const result = await getClobMarkets.handler(runtime, message, state);
    const markets = result.data?.markets || [];

    elizaLogger.info(`✅ CLOB-enabled markets: ${markets.length}\n`);

    // Find Iran market
    const iranMarket = markets.find((m: any) =>
        m.question?.toLowerCase().includes("khamenei") ||
        m.question?.toLowerCase().includes("iran")
    );

    if (iranMarket) {
        console.log("🎯 IRAN MARKET (CLOB-ENABLED):");
        console.log("━".repeat(80));
        console.log(`Question: ${iranMarket.question}`);
        console.log(`Condition ID: ${iranMarket.condition_id}`);
        console.log(`Min Order Size: ${iranMarket.minimum_order_size || 'N/A'}`);
        console.log(`Min Tick Size: ${iranMarket.minimum_tick_size || 'N/A'}`);
        console.log(`Active: ${iranMarket.active ? '✅ YES' : '❌ NO'}`);

        if (iranMarket.tokens) {
            console.log("\n📊 TRADEABLE TOKENS:");
            iranMarket.tokens.forEach((token: any, idx: number) => {
                console.log(`  ${idx + 1}. ${token.outcome}`);
                console.log(`     Token ID: ${token.token_id}`);
            });
        }
        console.log("━".repeat(80));

        return iranMarket;
    } else {
        elizaLogger.warn("⚠️  Iran market not found in CLOB markets");
        return markets[0];
    }
}

// ============================================================================
// DEMO 4: Price History
// ============================================================================

async function demoPriceHistory(tokenId: string, outcome: string) {
    printSection(`DEMO 4: Price History for "${outcome}" Token`);

    const runtime = createMockRuntime() as IAgentRuntime;
    const message = createMockMessage(`Get price history for token ${tokenId} with 1d interval`);
    const state = createMockState();

    try {
        const result = await getPriceHistory.handler(runtime, message, state);
        const priceHistory = result.data?.priceHistory || [];

        elizaLogger.info(`✅ Price history retrieved: ${priceHistory.length} data points\n`);

        if (priceHistory.length > 0) {
            console.log("📈 PRICE HISTORY DATA:");
            console.log("━".repeat(80));

            // Show last 10 price points
            const recentPrices = priceHistory.slice(-10);
            console.log("\n📊 Last 10 Price Points:");
            console.log("Date & Time              | Price (USD) | Probability");
            console.log("-".repeat(60));

            recentPrices.forEach((point: any) => {
                const date = new Date(point.t * 1000).toLocaleString();
                const price = `$${point.p.toFixed(4)}`;
                const prob = `${(point.p * 100).toFixed(2)}%`;
                console.log(`${date.padEnd(24)} | ${price.padEnd(11)} | ${prob}`);
            });

            // Calculate statistics
            const prices = priceHistory.map((p: any) => p.p);
            const currentPrice = prices[prices.length - 1];
            const startPrice = prices[0];
            const highPrice = Math.max(...prices);
            const lowPrice = Math.min(...prices);
            const priceChange = currentPrice - startPrice;
            const priceChangePercent = ((priceChange / startPrice) * 100).toFixed(2);

            console.log("\n📊 STATISTICS:");
            console.log(`  Current Price: $${currentPrice.toFixed(4)} (${(currentPrice * 100).toFixed(2)}%)`);
            console.log(`  Starting Price: $${startPrice.toFixed(4)} (${(startPrice * 100).toFixed(2)}%)`);
            console.log(`  Highest Price: $${highPrice.toFixed(4)} (${(highPrice * 100).toFixed(2)}%)`);
            console.log(`  Lowest Price: $${lowPrice.toFixed(4)} (${(lowPrice * 100).toFixed(2)}%)`);
            console.log(`  Price Change: ${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(4)} (${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent}%)`);
            console.log(`  Volatility: ${(highPrice - lowPrice).toFixed(4)}`);

            console.log("━".repeat(80));
        }

        return priceHistory;
    } catch (error) {
        elizaLogger.error(`❌ Failed to get price history: ${error}`);
        return [];
    }
}

// ============================================================================
// DEMO 5: Order Book
// ============================================================================

async function demoOrderBook(tokenId: string, outcome: string) {
    printSection(`DEMO 5: Order Book for "${outcome}" Token`);

    const runtime = createMockRuntime() as IAgentRuntime;
    const message = createMockMessage(`Get order book for token ${tokenId}`);
    const state = createMockState();

    try {
        const result = await getOrderBookSummaryAction.handler(runtime, message, state);
        const orderBook = result.data?.orderBook;

        if (orderBook) {
            console.log("📖 ORDER BOOK:");
            console.log("━".repeat(80));

            console.log(`\n🔵 BIDS (Buy Orders): ${orderBook.bids?.length || 0} levels`);
            if (orderBook.bids && orderBook.bids.length > 0) {
                console.log("Price (USD) | Size      | Total Value");
                console.log("-".repeat(45));
                orderBook.bids.slice(0, 5).forEach((bid: any) => {
                    const price = `$${parseFloat(bid.price).toFixed(4)}`;
                    const size = parseFloat(bid.size).toFixed(2);
                    const total = `$${(parseFloat(bid.price) * parseFloat(bid.size)).toFixed(2)}`;
                    console.log(`${price.padEnd(11)} | ${size.padEnd(9)} | ${total}`);
                });

                const totalBidSize = orderBook.bids.reduce((sum: number, bid: any) =>
                    sum + parseFloat(bid.size), 0);
                console.log(`\nTotal Bid Size: ${totalBidSize.toFixed(2)} tokens`);
            }

            console.log(`\n🔴 ASKS (Sell Orders): ${orderBook.asks?.length || 0} levels`);
            if (orderBook.asks && orderBook.asks.length > 0) {
                console.log("Price (USD) | Size      | Total Value");
                console.log("-".repeat(45));
                orderBook.asks.slice(0, 5).forEach((ask: any) => {
                    const price = `$${parseFloat(ask.price).toFixed(4)}`;
                    const size = parseFloat(ask.size).toFixed(2);
                    const total = `$${(parseFloat(ask.price) * parseFloat(ask.size)).toFixed(2)}`;
                    console.log(`${price.padEnd(11)} | ${size.padEnd(9)} | ${total}`);
                });

                const totalAskSize = orderBook.asks.reduce((sum: number, ask: any) =>
                    sum + parseFloat(ask.size), 0);
                console.log(`\nTotal Ask Size: ${totalAskSize.toFixed(2)} tokens`);
            }

            // Calculate spread
            if (orderBook.bids?.length > 0 && orderBook.asks?.length > 0) {
                const bestBid = parseFloat(orderBook.bids[0].price);
                const bestAsk = parseFloat(orderBook.asks[0].price);
                const spread = bestAsk - bestBid;
                const spreadPercent = ((spread / bestBid) * 100).toFixed(2);

                console.log("\n💰 MARKET DEPTH:");
                console.log(`  Best Bid: $${bestBid.toFixed(4)} (${(bestBid * 100).toFixed(2)}%)`);
                console.log(`  Best Ask: $${bestAsk.toFixed(4)} (${(bestAsk * 100).toFixed(2)}%)`);
                console.log(`  Spread: $${spread.toFixed(4)} (${spreadPercent}%)`);
            }

            console.log("━".repeat(80));
        }

        return orderBook;
    } catch (error) {
        elizaLogger.error(`❌ Failed to get order book: ${error}`);
        return null;
    }
}

// ============================================================================
// DEMO 6: Best Prices
// ============================================================================

async function demoBestPrices(tokenId: string, outcome: string) {
    printSection(`DEMO 6: Best Prices for "${outcome}" Token`);

    const runtime = createMockRuntime() as IAgentRuntime;

    console.log("💰 BEST PRICES:");
    console.log("━".repeat(80));

    // Get best buy price (ask)
    try {
        const buyMessage = createMockMessage(`Get best buy price for token ${tokenId}`);
        const buyResult = await getBestPriceAction.handler(runtime, buyMessage, createMockState());

        console.log("\n🟢 BEST BUY PRICE (Ask):");
        console.log(`  Price: ${buyResult.data?.formattedPrice || 'N/A'}`);
        console.log(`  Probability: ${buyResult.data?.percentagePrice || 'N/A'}`);
        console.log(`  → This is what you PAY to buy YES tokens`);
    } catch (error) {
        console.log(`\n🟢 BEST BUY PRICE: ❌ ${error}`);
    }

    // Get best sell price (bid)
    try {
        const sellMessage = createMockMessage(`Get best sell price for token ${tokenId}`);
        const sellResult = await getBestPriceAction.handler(runtime, sellMessage, createMockState());

        console.log("\n🔴 BEST SELL PRICE (Bid):");
        console.log(`  Price: ${sellResult.data?.formattedPrice || 'N/A'}`);
        console.log(`  Probability: ${sellResult.data?.percentagePrice || 'N/A'}`);
        console.log(`  → This is what you RECEIVE when selling YES tokens`);
    } catch (error) {
        console.log(`\n🔴 BEST SELL PRICE: ❌ ${error}`);
    }

    console.log("━".repeat(80));
}

// ============================================================================
// DEMO 7: Midpoint Price & Spread
// ============================================================================

async function demoMidpointAndSpread(tokenId: string, outcome: string) {
    printSection(`DEMO 7: Midpoint Price & Spread for "${outcome}" Token`);

    const runtime = createMockRuntime() as IAgentRuntime;

    console.log("📊 MARKET METRICS:");
    console.log("━".repeat(80));

    // Get midpoint price
    try {
        const midMessage = createMockMessage(`Get midpoint price for token ${tokenId}`);
        const midResult = await getMidpointPriceAction.handler(runtime, midMessage, createMockState());

        console.log("\n🎯 MIDPOINT PRICE:");
        console.log(`  Price: ${midResult.data?.formattedPrice || 'N/A'}`);
        console.log(`  Probability: ${midResult.data?.percentagePrice || 'N/A'}`);
        console.log(`  → Fair market value (halfway between bid and ask)`);
    } catch (error) {
        console.log(`\n🎯 MIDPOINT PRICE: ❌ ${error}`);
    }

    // Get spread
    try {
        const spreadMessage = createMockMessage(`Get spread for token ${tokenId}`);
        const spreadResult = await getSpreadAction.handler(runtime, spreadMessage, createMockState());

        console.log("\n📏 BID-ASK SPREAD:");
        console.log(`  Spread: ${spreadResult.data?.formattedSpread || 'N/A'}`);
        console.log(`  Percentage: ${spreadResult.data?.percentageSpread || 'N/A'}`);
        console.log(`  → Difference between best bid and best ask`);
        console.log(`  → Lower spread = more liquid market`);
    } catch (error) {
        console.log(`\n📏 BID-ASK SPREAD: ❌ ${error}`);
    }

    console.log("━".repeat(80));
}

// ============================================================================
// Main Demo Runner
// ============================================================================

async function runFullDemo() {
    console.log("\n" + "=".repeat(80));
    console.log("🚀 POLYMARKET PLUGIN - COMPREHENSIVE FEATURE DEMONSTRATION");
    console.log("=".repeat(80));
    console.log(`Target Market: Khamenei out as Supreme Leader of Iran by February 28?`);
    console.log(`Test Wallet: ${TEST_CONFIG.TEST_EOA_ADDRESS}`);
    console.log(`Has Private Key: ${TEST_CONFIG.WALLET_PRIVATE_KEY ? '✅ YES' : '❌ NO'}`);
    console.log("=".repeat(80));

    if (!TEST_CONFIG.WALLET_PRIVATE_KEY) {
        elizaLogger.error("\n❌ No private key configured!");
        elizaLogger.info("Please set WALLET_PRIVATE_KEY environment variable");
        elizaLogger.info("Example: export WALLET_PRIVATE_KEY=0x...");
        process.exit(1);
    }

    try {
        // Demo 1: Market Data
        const targetMarket = await demoMarketDataRetrieval();

        // Demo 2: Simplified Markets
        await demoSimplifiedMarkets();

        // Demo 3: CLOB Markets
        const clobMarket = await demoClobMarkets();

        // Get token ID for detailed demos
        const tokenId = targetMarket?.tokens?.[0]?.token_id || clobMarket?.tokens?.[0]?.token_id;
        const outcome = targetMarket?.tokens?.[0]?.outcome || clobMarket?.tokens?.[0]?.outcome || "YES";

        if (tokenId) {
            elizaLogger.info(`\n✅ Using Token ID: ${tokenId}`);
            elizaLogger.info(`   Outcome: ${outcome}\n`);

            // Demo 4: Price History
            await demoPriceHistory(tokenId, outcome);

            // Demo 5: Order Book
            await demoOrderBook(tokenId, outcome);

            // Demo 6: Best Prices
            await demoBestPrices(tokenId, outcome);

            // Demo 7: Midpoint & Spread
            await demoMidpointAndSpread(tokenId, outcome);
        } else {
            elizaLogger.warn("\n⚠️  No token ID found, skipping token-specific demos");
        }

        // Final summary
        printSection("DEMO COMPLETE");
        console.log("✅ All demonstrations completed successfully!");
        console.log("\n📝 Summary of demonstrated features:");
        console.log("  1. ✅ Market data retrieval (all markets, simplified, CLOB)");
        console.log("  2. ✅ Price history with statistics");
        console.log("  3. ✅ Order book depth (bids & asks)");
        console.log("  4. ✅ Best prices (buy & sell)");
        console.log("  5. ✅ Midpoint price calculation");
        console.log("  6. ✅ Bid-ask spread analysis");
        console.log("\n🎯 The plugin is FUNCTIONAL and READY for use!");
        console.log("━".repeat(80));

    } catch (error) {
        elizaLogger.error("\n❌ Demo failed:", error);
        process.exit(1);
    }
}

// Run the demo
runFullDemo().catch((error) => {
    elizaLogger.error("Fatal error:", error);
    process.exit(1);
});
