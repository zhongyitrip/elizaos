import { describe, it, expect } from 'bun:test';
import { createCharacter, validateCharacter } from '../src/services/character-generator';
import type { EOAAccount } from '../src/services/character-generator';

describe('CharacterGenerator', () => {
    const mockEOA: EOAAccount = {
        eoa_address: '0x1234567890123456789012345678901234567890',
        private_key: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        derivation_index: 0
    };

    describe('createCharacter', () => {
        it('should create a character from EOA account', () => {
            const character = createCharacter(mockEOA);

            expect(character).toBeDefined();
            expect(character.name).toContain('Agent-');
            expect(character.plugins).toContain('@elizaos/plugin-sql');
            expect(character.plugins).toContain('@elizaos/plugin-bootstrap');
        });

        it('should include EOA address in settings', () => {
            const character = createCharacter(mockEOA);

            expect(character.settings.EOA_ADDRESS).toBe(mockEOA.eoa_address);
            expect(character.settings.PRIVATE_KEY).toBe(mockEOA.private_key);
            expect(character.settings.DERIVATION_INDEX).toBe('0');
        });

        it('should include EOA info in bio', () => {
            const character = createCharacter(mockEOA);

            const bioString = character.bio.join(' ');
            expect(bioString).toContain(mockEOA.eoa_address);
            expect(bioString).toContain('0');
        });
    });

    describe('validateCharacter', () => {
        it('should validate a valid character', () => {
            const character = createCharacter(mockEOA);
            expect(() => validateCharacter(character)).not.toThrow();
        });

        it('should throw error if name is missing', () => {
            const invalidCharacter = { plugins: ['@elizaos/plugin-sql'] };
            expect(() => validateCharacter(invalidCharacter)).toThrow('must have a name');
        });

        it('should throw error if plugins are missing', () => {
            const invalidCharacter = { name: 'Test' };
            expect(() => validateCharacter(invalidCharacter)).toThrow('must have at least 2 plugins');
        });

        it('should throw error if plugin-sql is missing', () => {
            const invalidCharacter = {
                name: 'Test',
                plugins: ['@elizaos/plugin-bootstrap', '@elizaos/plugin-other']
            };
            expect(() => validateCharacter(invalidCharacter)).toThrow('must include @elizaos/plugin-sql');
        });

        it('should throw error if plugin-bootstrap is missing', () => {
            const invalidCharacter = {
                name: 'Test',
                plugins: ['@elizaos/plugin-sql', '@elizaos/plugin-other']
            };
            expect(() => validateCharacter(invalidCharacter)).toThrow('must include @elizaos/plugin-bootstrap');
        });
    });
});
