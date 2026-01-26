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
import { cancelAllOrdersTemplate } from '../templates';
import { OpenOrder } from '../types';

interface CancelAllOrdersParams {
    confirm?: boolean;
    marketId?: string;
    tokenId?: string;
}

export const cancelAllOrdersAction: Action = {
    name: 'POLYMARKET_CANCEL_ALL_ORDERS',
    similes: ['CANCEL_EVERYTHING', 'KILL_ALL_ORDERS', 'REVOKE_ALL_ORDERS', 'CLEAR_MY_ORDERS', 'CANCEL_ALL'],
    description: 'Cancels all active orders for the user on Polymarket, with optional filters for market or token.',

    validate: async (runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<boolean> => {
        const clobApiUrl = runtime.getSetting('CLOB_API_URL');
        return !!clobApiUrl;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<any> => {
        logger.info('[cancelAllOrdersAction] Handler called');

        let params: CancelAllOrdersParams = {};
        try {
            params = await callLLMWithTimeout<CancelAllOrdersParams>(
                runtime,
                state || {} as any,
                cancelAllOrdersTemplate,
                'cancelAllOrdersAction'
            );
        } catch (error) {
            logger.error('[cancelAllOrdersAction] LLM extraction failed:', error);
        }

        const { marketId, tokenId } = params;

        try {
            const client = (await initializeClobClientWithCreds(runtime)) as ClobClient;

            // Fetch open orders with proper field names
            const openOrdersResponse: any = await client.getOpenOrders({
                market: marketId,
                asset_id: tokenId, // Correct field name for v2 client
            } as any);

            let ordersToCancel: string[] = [];
            if (Array.isArray(openOrdersResponse)) {
                ordersToCancel = openOrdersResponse.map(o => o.order_id);
            } else if (openOrdersResponse && Array.isArray(openOrdersResponse.data)) {
                ordersToCancel = openOrdersResponse.data.map((o: OpenOrder) => o.order_id);
            }

            if (ordersToCancel.length === 0) {
                const responseText = `No active orders found to cancel${marketId ? ` for market ${marketId}` : ''}${tokenId ? ` for token ${tokenId}` : ''}.`;
                const responseContent = {
                    text: responseText,
                    actions: ['POLYMARKET_CANCEL_ALL_ORDERS'],
                    success: true,
                    data: { count: 0 },
                };
                if (callback) await callback(responseContent);
                return responseContent;
            }

            logger.info(`[cancelAllOrdersAction] Cancelling ${ordersToCancel.length} orders...`);

            // Use cancelOrders for batch cancellation
            const result = await client.cancelOrders(ordersToCancel);

            const responseText = `✅ **Bulk Order Cancellation Successful**\n\n` +
                `**Total Cancelled**: ${ordersToCancel.length}\n` +
                `${marketId ? `**Market**: ${marketId}\n` : ''}` +
                `All matching active orders have been revoked.`;

            const responseContent = {
                text: responseText,
                actions: ['POLYMARKET_CANCEL_ALL_ORDERS'],
                success: true,
                data: {
                    count: ordersToCancel.length,
                    cancelledOrderIds: ordersToCancel,
                    result
                },
            };

            if (callback) await callback(responseContent);
            return responseContent;

        } catch (error) {
            logger.error('[cancelAllOrdersAction] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to cancel all orders';
            const errorContent = {
                text: `❌ Error: ${errorMessage}`,
                actions: ['POLYMARKET_CANCEL_ALL_ORDERS'],
                success: false,
                data: { error: errorMessage },
            };
            if (callback) await callback(errorContent);
            return errorContent;
        }
    },

    examples: [
        [
            { name: '{{user1}}', content: { text: "Cancel all my orders" } },
            {
                name: '{{user2}}',
                content: {
                    text: "I'll cancel all your active orders on Polymarket.",
                    action: "POLYMARKET_CANCEL_ALL_ORDERS"
                }
            }
        ]
    ],
};
