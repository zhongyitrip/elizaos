import { characterTemplate } from '../character-template';

/**
 * EOA Account interface
 */
export interface EOAAccount {
    eoa_address: string;
    private_key: string;
    derivation_index: number;
}

/**
 * Create a character configuration for a specific EOA
 * 
 * This function takes the base template and customizes it for each EOA address.
 * All 30,000 agents will share the same plugins and settings, but have unique
 * EOA addresses and private keys.
 * 
 * @param eoa - EOA account information
 * @returns Character configuration for ElizaOS
 */
export function createCharacter(eoa: EOAAccount) {
    return {
        // Inherit all template properties
        ...characterTemplate,

        // Customize name with EOA address
        name: `Agent-${eoa.eoa_address.slice(0, 10)}`,
        username: `agent_${eoa.eoa_address.slice(2, 10).toLowerCase()}`,

        // Merge settings with EOA-specific configuration
        settings: {
            ...characterTemplate.settings,

            // EOA-specific settings
            EOA_ADDRESS: eoa.eoa_address,
            PRIVATE_KEY: eoa.private_key,
            DERIVATION_INDEX: eoa.derivation_index.toString(),

            // Agent identifier
            AGENT_ID: `eoa-${eoa.derivation_index}`
        },

        // Add EOA info to bio
        bio: [
            ...characterTemplate.bio,
            `EOA Address: ${eoa.eoa_address}`,
            `Derivation Index: ${eoa.derivation_index}`
        ]
    };
}

/**
 * Create multiple characters from EOA list
 * 
 * @param eoaList - Array of EOA accounts
 * @returns Array of character configurations
 */
export function createCharacters(eoaList: EOAAccount[]) {
    return eoaList.map(eoa => createCharacter(eoa));
}

/**
 * Validate character configuration
 * 
 * @param character - Character configuration to validate
 * @returns true if valid, throws error otherwise
 */
export function validateCharacter(character: any): boolean {
    if (!character.name) {
        throw new Error('Character must have a name');
    }

    if (!character.plugins || character.plugins.length < 2) {
        throw new Error('Character must have at least 2 plugins (sql and bootstrap)');
    }

    if (!character.plugins.includes('@elizaos/plugin-sql')) {
        throw new Error('Character must include @elizaos/plugin-sql');
    }

    if (!character.plugins.includes('@elizaos/plugin-bootstrap')) {
        throw new Error('Character must include @elizaos/plugin-bootstrap');
    }

    return true;
}
