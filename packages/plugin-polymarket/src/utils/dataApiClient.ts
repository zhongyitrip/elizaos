import fetch from 'node-fetch';
import { logger } from '@elizaos/core';

const DATA_API_URL = 'https://data-api.polymarket.com';

export interface Position {
    market: string;
    condition_id: string;
    asset_id: string;
    token_id: string;
    outcome: string;
    size: string;
    value: string;
    pnl?: string;
    entry_price?: string;
    current_price?: string;
}

export interface Activity {
    id: string;
    market: string;
    asset_id: string;
    type: string; // 'BUY' | 'SELL' | 'MINT' | 'BURN'
    size: string;
    price: string;
    timestamp: number;
    transaction_hash?: string;
}

/**
 * Client for Polymarket Data API
 * Provides access to user positions, activity, and other data
 */
export class DataApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = DATA_API_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Get user positions
     * @param userAddress - User's Ethereum address
     * @returns Array of positions
     */
    async getPositions(userAddress: string): Promise<Position[]> {
        try {
            const url = `${this.baseUrl}/positions?user=${userAddress}`;
            logger.info(`[DataApiClient] Fetching positions for ${userAddress}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch positions: ${response.statusText}`);
            }

            const data = (await response.json()) as Position[] | { positions: Position[] };
            const positions = Array.isArray(data) ? data : data.positions || [];
            logger.info(`[DataApiClient] Retrieved ${positions.length} positions`);

            return positions;
        } catch (error) {
            logger.error('[DataApiClient] Error fetching positions:', error);
            throw error;
        }
    }

    /**
     * Get user activity/trade history
     * @param userAddress - User's Ethereum address
     * @returns Array of activities
     */
    async getActivity(userAddress: string): Promise<Activity[]> {
        try {
            const url = `${this.baseUrl}/activity?user=${userAddress}`;
            logger.info(`[DataApiClient] Fetching activity for ${userAddress}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch activity: ${response.statusText}`);
            }

            const data = (await response.json()) as Activity[] | { activities: Activity[] };
            const activities = Array.isArray(data) ? data : data.activities || [];
            logger.info(`[DataApiClient] Retrieved ${activities.length} activities`);

            return activities;
        } catch (error) {
            logger.error('[DataApiClient] Error fetching activity:', error);
            throw error;
        }
    }
}
