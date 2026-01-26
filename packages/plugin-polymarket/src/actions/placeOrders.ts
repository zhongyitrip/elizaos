import {
    type Action,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    logger,
} from '@elizaos/core';
import { callLLMWithTimeout } from '../utils/llmHelpers';
import { initializeClobClientWithCreds } from '../utils/clobClient';
import type { ClobClient } from '@polymarket/clob-client';
import { placeOrdersTemplate } from '../templates';

interface OrderItem {
    tokenId: string;
    side: 'buy' | 'sell';
    price: number;
    size: number;
    orderType?: 'limit' | 'market';
}

interface PlaceOrdersParams {
    orders?: OrderItem[];
}

export const placeOrdersAction: Action = {
    name: 'POLYMARKET_PLACE_ORDERS',
    similes: ['BATCH_BUY', 'BATCH_SELL', 'PLACE_MULTIPLE_TRADES', 'MULTI_ORDER'],
    description: 'Places multiple limit or market orders on Polymarket in a single batch.',

    validate: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
        const clobApiUrl = runtime.getSetting('CLOB_API_URL');
        if (!clobApiUrl) return false;
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<any> => {
        logger.info('[placeOrdersAction] Handler called');

        let params: PlaceOrdersParams = {};
        try {
            params = await callLLMWithTimeout<PlaceOrdersParams>(
                runtime,
                state || {} as any,
                placeOrdersTemplate,
                'placeOrdersAction'
            );
        } catch (error) {
            logger.error('[placeOrdersAction] LLM extraction failed:', error);
        }

        const { orders } = params;

        if (!orders || orders.length === 0) {
            const errorMessage = 'No valid orders provided to place.';
            const errorContent = {
                text: errorMessage,
                actions: ['POLYMARKET_PLACE_ORDERS'],
                success: false,
                data: { error: errorMessage },
            };
            if (callback) await callback(errorContent);
            return errorContent;
        }

        try {
            const client = (await initializeClobClientWithCreds(runtime)) as ClobClient;
            const proxyAddress = runtime.getSetting('POLYMARKET_PROXY_ADDRESS');

            const signedOrders = await Promise.all(orders.map(async (item) => {
                return client.createOrder({
                    tokenID: item.tokenId,
                    price: item.price,
                    side: item.side.toUpperCase() as any,
                    size: item.size,
                    feeRateBps: 0,
                    nonce: Date.now() + Math.floor(Math.random() * 1000), // Unique nonce for batch
                    maker: proxyAddress as string || undefined
                } as any);
            }));

            logger.info(`[placeOrdersAction] Posting ${signedOrders.length} orders...`);

            const result = await client.postOrders(signedOrders as any);

            const responseText = `✅ **Batch Order Placement Successful**\n\n` +
                `**Total Orders Submitted**: ${signedOrders.length}\n` +
                `Check your active orders to see fulfillment status.`;

            const responseContent = {
                text: responseText,
                actions: ['POLYMARKET_PLACE_ORDERS'],
                success: true,
                data: {
                    count: signedOrders.length,
                    results
                },
            };

            if (callback) await callback(responseContent);
            return responseContent;
        } catch (error) {
            logger.error('[placeOrdersAction] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to place batch orders';
            const errorContent = {
                text: `❌ Error: ${errorMessage}`,
                actions: ['POLYMARKET_PLACE_ORDERS'],
                success: false,
                data: { error: errorMessage, orderCount: orders?.length },
            };
            if (callback) await callback(errorContent);
            return errorContent;
        }
    },

    examples: [
        [
            { name: '{{user1}}', content: { text: "Buy 10 shares of 0x123 at 0.5 and sell 5 shares of 0x456 at 0.8" } },
            {
                name: '{{user2}}',
                content: {
                    text: "Placing your batch orders for tokens 0x123 and 0x456.",
                    action: "POLYMARKET_PLACE_ORDERS"
                }
            }
        ]
    ],
};
