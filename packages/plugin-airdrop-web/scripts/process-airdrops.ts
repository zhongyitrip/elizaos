import { AirdropBatchProcessor } from '../src/services/batch-processor';

/**
 * Process all pending EOA addresses in batches
 * 
 * This script runs the batch processor to handle all 30,000 EOA addresses.
 * It processes them in batches of 50, with each batch taking approximately 10 minutes.
 * 
 * Usage:
 *   cd packages/plugin-airdrop-web
 *   bun run scripts/process-airdrops.ts
 * 
 * Environment variables required:
 *   - SUPABASE_URL: Supabase project URL
 *   - SUPABASE_KEY: Supabase service role key
 */

async function main() {
    console.log('🎯 Airdrop Batch Processor\n');

    // Create processor with custom configuration
    const processor = new AirdropBatchProcessor({
        batchSize: parseInt(process.env.BATCH_SIZE || '50'),
        taskDuration: parseInt(process.env.TASK_DURATION || '600000') // 10 minutes in ms
    });

    try {
        // Display current progress before starting
        await processor.displayProgress();

        // Process all batches
        await processor.processAll();

        // Display final progress
        console.log('\n');
        await processor.displayProgress();

    } catch (error) {
        console.error('\n❌ Processing failed:', error);
        process.exit(1);
    }
}

// Run the script
main()
    .then(() => {
        console.log('\n✅ All processing completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
