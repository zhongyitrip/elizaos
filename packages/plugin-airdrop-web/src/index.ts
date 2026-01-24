import type { Plugin } from '@elizaos/core';
import { AirdropBatchProcessor } from './services/batch-processor';
import { createCharacter, createCharacters } from './services/character-generator';

/**
 * ElizaOS Airdrop Web Plugin
 * 
 * This plugin provides web-based airdrop hunting with browser automation.
 * 
 * Architecture:
 * - PM2 manages 10 concurrent instances
 * - Each instance runs 1 Agent for 1 EOA
 * - Worker pattern: fetch task → execute → mark done → repeat
 * 
 * Usage:
 *   Add to your character configuration:
 *   {
 *     "plugins": ["@elizaos/plugin-airdrop-web"]
 *   }
 */

export const airdropWebPlugin: Plugin = {
    name: '@elizaos/plugin-airdrop-web',
    description: 'Web-based airdrop hunting with browser automation',

    // Services provided by this plugin
    services: [],

    // Actions provided by this plugin
    actions: [],

    // Providers for model integration
    providers: [],

    // Evaluators for decision making
    evaluators: [],
};

// Export utilities
export { AirdropBatchProcessor, createCharacter, createCharacters };

// Export types
export type { EOAAccount } from './services/character-generator';

// Default export
export default airdropWebPlugin;
