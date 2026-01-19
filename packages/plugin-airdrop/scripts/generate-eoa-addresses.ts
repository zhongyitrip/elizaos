import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';

/**
 * Generate 30,000 EOA addresses from HD wallet mnemonic
 * 
 * This script derives EOA addresses using the standard Ethereum derivation path:
 * m/44'/60'/0'/0/{index}
 * 
 * Usage:
 *   bun run scripts/generate-eoa-addresses.ts
 * 
 * Environment variables required:
 *   - HD_WALLET_MNEMONIC: 12 or 24 word mnemonic phrase
 *   - SUPABASE_URL: Supabase project URL
 *   - SUPABASE_KEY: Supabase service role key
 */

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

async function generateEOAAddresses() {
    console.log('🚀 Starting EOA address generation\n');

    // Validate environment variables
    if (!process.env.HD_WALLET_MNEMONIC) {
        throw new Error('HD_WALLET_MNEMONIC environment variable is required');
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
        throw new Error('SUPABASE_URL and SUPABASE_KEY environment variables are required');
    }

    const mnemonic = process.env.HD_WALLET_MNEMONIC;
    const totalAddresses = parseInt(process.env.TOTAL_ADDRESSES || '30000');
    const batchSize = 1000;

    console.log(`Configuration:`);
    console.log(`  - Total addresses: ${totalAddresses.toLocaleString()}`);
    console.log(`  - Batch size: ${batchSize}`);
    console.log(`  - Derivation path: m/44'/60'/0'/0/{index}`);
    console.log('');

    // Validate mnemonic
    try {
        ethers.Wallet.fromMnemonic(mnemonic);
        console.log('✅ Mnemonic validated');
    } catch (error) {
        throw new Error('Invalid mnemonic phrase');
    }

    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    const totalBatches = Math.ceil(totalAddresses / batchSize);

    console.log(`\n📦 Processing ${totalBatches} batches...\n`);

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
        const startIndex = batchNum * batchSize;
        const endIndex = Math.min(startIndex + batchSize, totalAddresses);
        const batch = [];

        console.log(`Batch ${batchNum + 1}/${totalBatches}: Generating addresses ${startIndex} to ${endIndex - 1}...`);

        // Generate addresses for this batch
        for (let i = startIndex; i < endIndex; i++) {
            const derivationPath = `m/44'/60'/0'/0/${i}`;
            const derivedWallet = wallet.derivePath(derivationPath);

            batch.push({
                derivation_index: i,
                eoa_address: derivedWallet.address,
                private_key: derivedWallet.privateKey,
                metadata: {
                    derivation_path: derivationPath,
                    generated_at: new Date().toISOString()
                }
            });

            // Progress indicator
            if ((i - startIndex + 1) % 100 === 0) {
                process.stdout.write('.');
            }
        }

        console.log(''); // New line after progress dots

        // Insert batch into database
        try {
            const { error } = await supabase
                .from('eoa_accounts')
                .insert(batch);

            if (error) {
                console.error(`❌ Error inserting batch ${batchNum + 1}:`, error);
                throw error;
            }

            console.log(`✅ Batch ${batchNum + 1} inserted successfully (${batch.length} addresses)`);
        } catch (error) {
            console.error(`❌ Failed to insert batch ${batchNum + 1}`);
            throw error;
        }

        // Small delay between batches to avoid overwhelming the database
        if (batchNum < totalBatches - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ Successfully generated ${totalAddresses.toLocaleString()} EOA addresses`);
    console.log('='.repeat(60));

    // Display sample addresses
    const { data: sampleData } = await supabase
        .from('eoa_accounts')
        .select('derivation_index, eoa_address')
        .limit(5);

    if (sampleData && sampleData.length > 0) {
        console.log('\n📝 Sample addresses:');
        for (const sample of sampleData) {
            console.log(`  [${sample.derivation_index}] ${sample.eoa_address}`);
        }
    }

    // Display statistics
    const { count } = await supabase
        .from('eoa_accounts')
        .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Database statistics:`);
    console.log(`  - Total addresses in database: ${count?.toLocaleString()}`);
    console.log(`  - Status: All set to 'pending'`);
    console.log('');
}

// Run the script
generateEOAAddresses()
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
