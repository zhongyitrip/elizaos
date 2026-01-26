import {
    type Action,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    logger,
    ModelType,
} from '@elizaos/core';
import { initializeClobClientWithCreds } from '../utils/clobClient';
import { callLLMWithTimeout } from '../utils/llmHelpers';
import { cancelOrderTemplate } from '../templates';

interface CancelOrderParams {
    orderId: string;
}

/**
 * Cancel order action for Polymarket
 * Cancels a single order via CLOB API
 * 
 * @author Enhanced fork
 * @date 2026-01-26
 * @enhancement Added order cancellation to address P0 missing feature
 */
export const cancelOrderAction: Action = {
    name: 'CANCEL_ORDER',
    similes: [
        'CANCEL_ORDER',
        'REVOKE_ORDER',
        'DELETE_ORDER',
        'REMOVE_ORDER',
        'CANCEL',
        'STOP_ORDER',
        'CANCEL_TRADE',
        'ABORT_ORDER',
    ],
    description: 'Cancel a single order on Polymarket',

    validate: async (runtime: IAgentRuntime, message: Memory, state?: State): Promise<boolean> => {
        logger.info(`[cancelOrderAction] Validate called for message: "${message.content?.text}"`);

        const clobApiUrl = runtime.getSetting('CLOB_API_URL');

        if (!clobApiUrl) {
            logger.warn('[cancelOrderAction] CLOB_API_URL is required but not provided');
            return false;
        }

        logger.info('[cancelOrderAction] Validation passed');
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<any> => {
        logger.info('[cancelOrderAction] Handler called!');

        const clobApiUrl = runtime.getSetting('CLOB_API_URL');

        if (!clobApiUrl) {
            const errorMessage = 'CLOB_API_URL is required in configuration.';
            logger.error(`[cancelOrderAction] Configuration error: ${errorMessage}`);
            const errorContent = {
                text: errorMessage,
                actions: ['CANCEL_ORDER'],
                success: false,
                data: { error: errorMessage },
            };

            if (callback) {
                await callback(errorContent);
            }
            throw new Error(errorMessage);
        }

        let orderId: string;

        try {
            // Use LLM to extract order ID
            const llmResult = await callLLMWithTimeout<CancelOrderParams & { error?: string }>(
                runtime,
                state,
                cancelOrderTemplate,
                'cancelOrderAction'
            );

            logger.info('[cancelOrderAction] LLM result:', JSON.stringify(llmResult));

            if (llmResult?.error) {
                throw new Error('Required order ID not found');
            }

            orderId = llmResult?.orderId || '';

            if (!orderId) {
                throw new Error('Invalid order ID');
            }
        } catch (error) {
            logger.warn('[cancelOrderAction] LLM extraction failed, trying regex fallback');

            // Fallback to regex extraction
            const text = message.content?.text || '';

            // Extract order ID - try multiple patterns
            const orderMatch =
                text.match(/(?:order|id)[\s:]+([a-zA-Z0-9_-]{8,})/i) ||
                text.match(/([a-zA-Z0-9_-]{20,})/i) || // Long alphanumeric ID
                text.match(/\b([a-zA-Z0-9]{8,})\b/i); // Any alphanumeric 8+ chars

            orderId = orderMatch?.[1] || '';

            if (!orderId) {
                const errorMessage =
                    'Please provide a valid order ID. Example: "Cancel order abc123def456"';
                logger.error(`[cancelOrderAction] Order ID extraction failed`);

                const errorContent = {
                    text: `❌ **Error**: ${errorMessage}

Please provide the order ID you want to cancel. Examples:
• "Cancel order abc123def456"
• "Cancel abc123def456"
• "Revoke order xyz789"

**How to find your order ID:**
Use "Show me my active orders" to see all your open orders and their IDs.`,
                    actions: ['CANCEL_ORDER'],
                    success: false,
                    data: { error: errorMessage },
                };

                if (callback) {
                    await callback(errorContent);
                }
                throw new Error(errorMessage);
            }
        }

        try {
            const client = await initializeClobClientWithCreds(runtime);

            // Cancel the order using CLOB client
            logger.info(`[cancelOrderAction] Cancelling order: ${orderId}`);

            const result = await client.cancelOrder({
                orderID: orderId,
            });

            logger.info(`[cancelOrderAction] Order cancelled successfully`);

            // Format success response
            const responseText = `✅ **Order Cancelled Successfully**

**Order Details:**
• **Order ID**: ${orderId}
• **Status**: Cancellation submitted

Your order has been cancelled and will no longer be filled. The cancellation has been submitted to the order book.`;

            const responseData = {
                success: true,
                orderId,
                result,
                timestamp: new Date().toISOString(),
            };

            const responseContent: Content = {
                text: responseText,
                actions: ['POLYMARKET_CANCEL_ORDER'],
                success: true,
                data: responseData,
            };

            if (callback) {
                await callback(responseContent);
            }

            return responseContent;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error occurred while cancelling order';
            logger.error(`[cancelOrderAction] Order cancellation error:`, error);

            const errorContent = {
                text: `❌ **Order Cancellation Failed**

**Order ID**: ${orderId}
**Error**: ${errorMessage}

Please verify:
• The order ID is correct
• The order exists and is still active
• You have permission to cancel this order
• Network connection is stable

You can check your active orders with: "Show me my active orders"`,
                actions: ['POLYMARKET_CANCEL_ORDER'],
                success: false,
                data: {
                    error: errorMessage,
                    orderId,
                },
            };

            if (callback) {
                await callback(errorContent);
            }
            throw new Error(errorMessage);
        }
    },

    examples: [
        [
            {
                name: '{{user1}}',
                content: {
                    text: 'Cancel order 0x1234567890abcdef1234567890abcdef12345678',
                },
            },
            {
                name: '{{user2}}',
                content: {
                    text: "I'll cancel that order for you...",
                    action: 'POLYMARKET_CANCEL_ORDER',
                },
            },
        ],
        [
            {
                name: '{{user1}}',
                content: {
                    text: 'Revoke my order abc123def456',
                },
            },
            {
                name: '{{user2}}',
                content: {
                    text: 'Cancelling order abc123def456...',
                    action: 'POLYMARKET_CANCEL_ORDER',
                },
            },
        ],
    ],
};
