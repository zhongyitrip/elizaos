import type { Plugin } from '@elizaos/core';
import { AirdropBatchProcessor } from './services/batch-processor';
import { createCharacter, createCharacters } from './services/character-generator';

/**
 * ElizaOS Airdrop Plugin
 * 
 * This plugin provides functionality for managing 30,000 EOA addresses
 * for airdrop hunting operations.
 * 
 * Features:
 * - Dynamic character generation from EOA addresses
 * - Batch processing (50 agents at a time)
 * - Supabase database integration
 * - HD wallet support
 * 
 * Usage:
 *   Add to your character configuration:
 *   {
 *     "plugins": ["@elizaos/plugin-airdrop"]
 *   }
 */

export const airdropPlugin: Plugin = {
    name: '@elizaos/plugin-airdrop',
    description: 'Manage 30,000 EOA addresses for airdrop hunting',

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
export default airdropPlugin;
