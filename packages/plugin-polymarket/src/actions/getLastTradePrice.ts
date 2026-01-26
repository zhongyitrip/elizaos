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
import { getLastTradePriceTemplate } from '../templates';

interface GetLastTradePriceParams {
    tokenId?: string;
    query?: string;
}

export const getLastTradePriceAction: Action = {
    name: 'POLYMARKET_GET_LAST_TRADE_PRICE',
    similes: ['LAST_PRICE', 'LATEST_PRICE', 'CURRENT_PRICE', 'TRADE_PRICE', 'GET_LAST_PRICE'],
    description: 'Retrieves the last executed trade price for a specific token ID on Polymarket.',

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
        logger.info('[getLastTradePriceAction] Handler called');

        let params: GetLastTradePriceParams = {};
        try {
            params = await callLLMWithTimeout<GetLastTradePriceParams>(
                runtime,
                state || {} as any,
                getLastTradePriceTemplate,
                'getLastTradePriceAction'
            );
        } catch (error) {
            logger.error('[getLastTradePriceAction] LLM extraction failed:', error);
        }

        const { tokenId } = params;

        if (!tokenId) {
            const errorMessage = 'Token ID is required to get the last trade price.';
            const errorContent = {
                text: errorMessage,
                actions: ['POLYMARKET_GET_LAST_TRADE_PRICE'],
                success: false,
                data: { error: errorMessage },
            };
            if (callback) await callback(errorContent);
            return errorContent;
        }

        try {
            const client = (await initializeClobClientWithCreds(runtime)) as ClobClient;

            // Type-safe approach to get last trade
            const tradesResponse: any = await client.getTradesPaginated({
                asset_id: tokenId,
                limit: 1,
            } as any);

            // Access trades safely depending on API response structure
            const trades = tradesResponse?.trades || tradesResponse?.data || [];

            if (trades && trades.length > 0) {
                const lastTrade = trades[0];
                const price = lastTrade.price;
                const timestamp = lastTrade.timestamp;

                const responseText = `📈 **Last Trade Price**\n\n` +
                    `**Token ID**: ${tokenId}\n` +
                    `**Price**: $${price}\n` +
                    `**Time**: ${timestamp ? new Date(timestamp).toLocaleString() : 'Recent'}\n\n` +
                    `This is the most recently executed trade on Polymarket.`;

                const responseContent = {
                    text: responseText,
                    actions: ['POLYMARKET_GET_LAST_TRADE_PRICE'],
                    success: true,
                    data: {
                        tokenId,
                        price,
                        timestamp,
                        trade: lastTrade
                    },
                };

                if (callback) await callback(responseContent);
                return responseContent;
            } else {
                const responseText = `No trades found for token ID: ${tokenId}. This market might not have any activity yet.`;
                const responseContent = {
                    text: responseText,
                    actions: ['POLYMARKET_GET_LAST_TRADE_PRICE'],
                    success: true,
                    data: { tokenId, trades: [] },
                };
                if (callback) await callback(responseContent);
                return responseContent;
            }
        } catch (error) {
            logger.error('[getLastTradePriceAction] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch last trade price';
            const errorContent = {
                text: `❌ Error: ${errorMessage}`,
                actions: ['POLYMARKET_GET_LAST_TRADE_PRICE'],
                success: false,
                data: { error: errorMessage, tokenId },
            };
            if (callback) await callback(errorContent);
            return errorContent;
        }
    },

    examples: [
        [
            { name: '{{user1}}', content: { text: "What's the last price for token 0x123?" } },
            {
                name: '{{user2}}',
                content: {
                    text: "Checking the last trade price for token 0x123.",
                    action: "POLYMARKET_GET_LAST_TRADE_PRICE"
                }
            }
        ]
    ],
};
