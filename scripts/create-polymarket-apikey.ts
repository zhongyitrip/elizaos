#!/usr/bin/env bun
/**
 * Create a new Polymarket API Key for the current wallet
 * This will generate credentials that match your EOA wallet
 */

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { ClobClient } from '@polymarket/clob-client';

dotenv.config({ path: 'packages/plugin-polymarket/.env.test' });

async function createNewApiKey() {
    console.log('🔑 Creating new Polymarket API Key...\n');

    const privateKey = process.env.POLYMARKET_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY;
    const clobApiUrl = process.env.CLOB_API_URL || 'https://clob.polymarket.com';
    const proxyAddress = process.env.POLYMARKET_PROXY_ADDRESS;

    if (!privateKey) {
        console.error('❌ Missing POLYMARKET_PRIVATE_KEY');
        return;
    }

    const wallet = new ethers.Wallet(privateKey);

    // Add compatibility wrapper for ethers v6
    const enhancedWallet = {
        ...wallet,
        _signTypedData: async (domain: any, types: any, value: any) =>
            wallet.signTypedData(domain, types, value),
        getAddress: async () => wallet.address,
    };

    console.log(`📍 Wallet: ${wallet.address}`);
    console.log(`📍 Proxy: ${proxyAddress || 'Not configured'}\n`);

    try {
        // Create client WITHOUT existing API credentials
        const client = new ClobClient(
            clobApiUrl,
            137, // Polygon
            enhancedWallet as any,
            undefined, // No existing creds
            0, // SignatureType.EOA
            proxyAddress as string | undefined
        );

        console.log('1️⃣ Generating new API Key...');
        console.log('   This will create credentials for your wallet.');

        // Create new API key
        const apiCreds = await client.createApiKey();

        console.log('\n✅ API Key created successfully!\n');
        console.log('📋 Your new credentials:');
        console.log('─'.repeat(60));
        console.log(`CLOB_API_KEY=${apiCreds.key}`);
        console.log(`CLOB_API_SECRET=${apiCreds.secret}`);
        console.log(`CLOB_API_PASSPHRASE=${apiCreds.passphrase}`);
        console.log('─'.repeat(60));

        console.log('\n💡 Next steps:');
        console.log('1. Copy the above credentials');
        console.log('2. Update packages/plugin-polymarket/.env.test');
        console.log('3. Run the test script again: bun scripts/test-polymarket-live.ts');

    } catch (error) {
        console.error('\n❌ Error:', error);

        if ((error as any).message?.includes('already exists')) {
            console.log('\n💡 You already have an API Key for this wallet.');
            console.log('   Trying to derive the existing key...\n');

            try {
                const client = new ClobClient(
                    clobApiUrl,
                    137,
                    enhancedWallet as any,
                    undefined,
                    0,
                    proxyAddress as string | undefined
                );

                const apiCreds = await client.deriveApiKey();

                console.log('✅ Derived existing API Key!\n');
                console.log('📋 Your credentials:');
                console.log('─'.repeat(60));
                console.log(`CLOB_API_KEY=${apiCreds.key}`);
                console.log(`CLOB_API_SECRET=${apiCreds.secret}`);
                console.log(`CLOB_API_PASSPHRASE=${apiCreds.passphrase}`);
                console.log('─'.repeat(60));

            } catch (deriveError) {
                console.error('❌ Failed to derive key:', deriveError);
            }
        }
    }
}

createNewApiKey().catch(console.error);
