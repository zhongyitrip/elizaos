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
import { cancelOrdersTemplate } from '../templates';

interface CancelOrdersParams {
    orderIds?: string[];
}

export const cancelOrdersAction: Action = {
    name: 'POLYMARKET_CANCEL_ORDERS',
    similes: ['BATCH_CANCEL', 'CANCEL_MULTIPLE_ORDERS', 'REVOKE_ORDERS', 'DELETE_ORDERS'],
    description: 'Cancels multiple specific orders on Polymarket by their order IDs.',

    validate: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
        const clobApiUrl = runtime.getSetting('CLOB_API_URL');
        if (!clobApiUrl) return false;
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<Content> => {
        logger.info('[cancelOrdersAction] Handler called');

        let params: CancelOrdersParams = {};
        try {
            params = await callLLMWithTimeout<CancelOrdersParams>(
                runtime,
                state || {} as any,
                cancelOrdersTemplate,
                'cancelOrdersAction'
            );
        } catch (error) {
            logger.error('[cancelOrdersAction] LLM extraction failed:', error);
        }

        const { orderIds } = params;

        if (!orderIds || orderIds.length === 0) {
            const errorMessage = 'No order IDs provided to cancel.';
            const errorContent = {
                text: errorMessage,
                actions: ['POLYMARKET_CANCEL_ORDERS'],
                success: false,
                data: { error: errorMessage },
            };
            if (callback) await callback(errorContent);
            return errorContent;
        }

        try {
            const client = (await initializeClobClientWithCreds(runtime)) as ClobClient;

            logger.info(`[cancelOrdersAction] Cancelling ${orderIds.length} orders: ${orderIds.join(', ')}`);

            const result = await client.deleteOrders(orderIds);

            const responseText = `✅ **Batch Cancellation Successful**\n\n` +
                `**Cancelled Orders**: ${orderIds.length}\n` +
                `IDs: ${orderIds.map(id => `\`${id.substring(0, 8)}...\``).join(', ')}`;

            const responseContent = {
                text: responseText,
                actions: ['POLYMARKET_CANCEL_ORDERS'],
                success: true,
                data: {
                    count: orderIds.length,
                    orderIds: orderIds,
                    result
                },
            };

            if (callback) await callback(responseContent);
            return responseContent;
        } catch (error) {
            logger.error('[cancelOrdersAction] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to cancel orders';
            const errorContent = {
                text: `❌ Error: ${errorMessage}`,
                actions: ['POLYMARKET_CANCEL_ORDERS'],
                success: false,
                data: { error: errorMessage, orderIds },
            };
            if (callback) await callback(errorContent);
            return errorContent;
        }
    },

    examples: [
        [
            { name: '{{user1}}', content: { text: "Cancel orders 0x123 and 0x456" } },
            {
                name: '{{user2}}',
                content: {
                    text: "Okay, I'll cancel orders 0x123 and 0x456 for you.",
                    action: "POLYMARKET_CANCEL_ORDERS"
                }
            }
        ]
    ],
};
