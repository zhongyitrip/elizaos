import {
    type Action,
    type IAgentRuntime,
    type Memory,
    type State,
    logger,
    type HandlerCallback,
} from '@elizaos/core';
import { DataApiClient } from '../utils/dataApiClient';
import { initializeClobClientWithCreds } from '../utils/clobClient';
import { ethers } from 'ethers';

/**
 * Get user positions action for Polymarket
 * Retrieves all open positions for the user's wallet
 */
export const getPositionsAction: Action = {
    name: 'POLYMARKET_GET_POSITIONS',
    similes: [
        'GET_POSITIONS',
        'SHOW_MY_PORTFOLIO',
        'LIST_MY_POSITIONS',
        'CHECK_MY_HOLDINGS',
        'MY_POLYMARTKET_POSITIONS',
    ],
    description: 'Get all open positions for your wallet on Polymarket',

    validate: async (runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<boolean> => {
        const privateKey = runtime.getSetting('POLYMARKET_PRIVATE_KEY') ||
            runtime.getSetting('WALLET_PRIVATE_KEY') ||
            runtime.getSetting('PRIVATE_KEY');
        return !!privateKey;
    },

    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<any> => {
        logger.info('[getPositionsAction] Handler called!');

        try {
            const privateKey = runtime.getSetting('POLYMARKET_PRIVATE_KEY') ||
                runtime.getSetting('WALLET_PRIVATE_KEY') ||
                runtime.getSetting('PRIVATE_KEY');

            if (!privateKey) {
                throw new Error('Private key not found in configuration');
            }

            // Standardized client initialization to ensure auth if needed
            await initializeClobClientWithCreds(runtime);

            const wallet = new ethers.Wallet(privateKey as string);
            const userAddress = wallet.address;

            logger.info(`[getPositionsAction] Fetching positions for ${userAddress}`);

            const dataClient = new DataApiClient();
            const positions = await dataClient.getPositions(userAddress);

            if (positions.length === 0) {
                const responseContent = {
                    text: `📊 **Your Positions**\n\nYou currently have no open positions on Polymarket.\n\n**Wallet**: ${userAddress}\n\nStart trading to build your portfolio!`,
                    actions: ['POLYMARKET_GET_POSITIONS'],
                    success: true,
                    data: { positions: [], userAddress, count: 0 },
                };
                if (callback) await callback(responseContent);
                return responseContent;
            }

            let responseText = `📊 **Your Positions** (${positions.length} total)\n\n**Wallet**: ${userAddress}\n\n`;

            const displayPositions = positions.slice(0, 10);
            displayPositions.forEach((pos, index) => {
                responseText += `${index + 1}. **Market**: ${pos.market || pos.condition_id}\n`;
                responseText += `   • **Outcome**: ${pos.outcome}\n`;
                responseText += `   • **Size**: ${pos.size} shares\n`;
                responseText += `   • **Value**: $${pos.value}\n`;
                if (pos.entry_price) responseText += `   • **Entry Price**: $${pos.entry_price}\n`;
                if (pos.pnl) {
                    const pnlNum = parseFloat(pos.pnl);
                    responseText += `   • **P&L**: ${pnlNum >= 0 ? '+' : ''}$${pos.pnl}\n`;
                }
                responseText += '\n';
            });

            if (positions.length > 10) {
                responseText += `... and ${positions.length - 10} more positions\n\n`;
            }

            const totalValue = positions.reduce((sum, pos) => sum + (parseFloat(pos.value) || 0), 0);
            responseText += `**Total Portfolio Value**: $${totalValue.toFixed(2)}`;

            const responseContent = {
                text: responseText,
                actions: ['POLYMARKET_GET_POSITIONS'],
                success: true,
                data: { wallet: userAddress, positions, totalValue, count: positions.length },
            };

            if (callback) await callback(responseContent);
            return responseContent;
        } catch (error) {
            logger.error('[getPositionsAction] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch positions';
            const errorContent = {
                text: `❌ Error: ${errorMessage}`,
                actions: ['POLYMARKET_GET_POSITIONS'],
                success: false,
                data: { error: errorMessage },
            };
            if (callback) await callback(errorContent);
            return errorContent;
        }
    },

    examples: [
        [
            { name: '{{user1}}', content: { text: 'Show my positions' } },
            { name: '{{user2}}', content: { text: 'Fetching your portfolio...', action: 'POLYMARKET_GET_POSITIONS' } },
        ],
    ],
};
