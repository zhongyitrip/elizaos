import { createClient } from '@supabase/supabase-js';
import { createCharacters } from './character-generator';
import type { EOAAccount } from './character-generator';

/**
 * Batch Processor for 30,000 EOA Agents
 * 
 * This processor handles batching of EOA addresses to avoid overwhelming
 * the system. It processes 50 agents at a time, with configurable duration.
 */
export class AirdropBatchProcessor {
    private supabase;
    private batchSize: number;
    private taskDuration: number;

    constructor(config?: {
        batchSize?: number;
        taskDuration?: number;
    }) {
        this.supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_KEY!
        );

        this.batchSize = config?.batchSize || 50;
        this.taskDuration = config?.taskDuration || 10 * 60 * 1000; // 10 minutes
    }

    /**
     * Get pending EOA accounts from database
     */
    async getPendingEOAs(): Promise<EOAAccount[]> {
        const { data, error } = await this.supabase
            .from('eoa_accounts')
            .select('*')
            .eq('status', 'pending')
            .limit(this.batchSize);

        if (error) {
            console.error('Error fetching pending EOAs:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Update EOA status in database
     */
    async updateEOAStatus(
        eoaAddresses: string[],
        status: 'pending' | 'processing' | 'completed' | 'failed',
        errorMessage?: string
    ) {
        const updateData: any = {
            status,
            last_processed_at: new Date().toISOString()
        };

        if (errorMessage) {
            updateData.error_message = errorMessage;
        }

        const { error } = await this.supabase
            .from('eoa_accounts')
            .update(updateData)
            .in('eoa_address', eoaAddresses);

        if (error) {
            console.error('Error updating EOA status:', error);
            throw error;
        }
    }

    /**
     * Log task execution
     */
    async logTask(
        eoaAddress: string,
        taskType: string,
        status: string,
        details?: any
    ) {
        const { error } = await this.supabase
            .from('task_logs')
            .insert({
                eoa_address: eoaAddress,
                task_type: taskType,
                status,
                details
            });

        if (error) {
            console.error('Error logging task:', error);
        }
    }

    /**
     * Process a single batch of EOAs
     */
    async processBatch(): Promise<boolean> {
        try {
            // 1. Get pending EOAs
            const eoaList = await this.getPendingEOAs();

            if (eoaList.length === 0) {
                console.log('✅ No pending EOAs found');
                return false;
            }

            console.log(`\n📦 Processing batch of ${eoaList.length} EOAs`);
            console.log(`   First EOA: ${eoaList[0].eoa_address}`);
            console.log(`   Last EOA: ${eoaList[eoaList.length - 1].eoa_address}`);

            // 2. Generate characters
            const characters = createCharacters(eoaList);
            console.log(`✅ Generated ${characters.length} character configurations`);

            // 3. Update status to processing
            const eoaAddresses = eoaList.map(e => e.eoa_address);
            await this.updateEOAStatus(eoaAddresses, 'processing');
            console.log('✅ Updated status to processing');

            // 4. Run agents
            // TODO: Integrate with ElizaOS to actually load and run agents
            // For now, we'll simulate the process
            console.log(`🚀 Running ${characters.length} agents...`);
            console.log(`⏱️  Task duration: ${this.taskDuration / 1000 / 60} minutes`);

            // Simulate agent execution
            await this.simulateAgentExecution(eoaList);

            // 5. Wait for completion
            await this.waitForCompletion(this.taskDuration);

            // 6. Update status to completed
            await this.updateEOAStatus(eoaAddresses, 'completed');
            console.log('✅ Batch completed successfully');

            return true;
        } catch (error) {
            console.error('❌ Error processing batch:', error);
            throw error;
        }
    }

    /**
     * Simulate agent execution (replace with actual ElizaOS integration)
     */
    private async simulateAgentExecution(eoaList: EOAAccount[]) {
        for (const eoa of eoaList) {
            await this.logTask(
                eoa.eoa_address,
                'airdrop_task',
                'started',
                { derivation_index: eoa.derivation_index }
            );
        }
    }

    /**
     * Wait for task completion
     */
    private async waitForCompletion(duration: number): Promise<void> {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                process.stdout.write('.');
            }, 5000);

            setTimeout(() => {
                clearInterval(interval);
                console.log('');
                resolve();
            }, duration);
        });
    }

    /**
     * Process all pending EOAs in batches
     */
    async processAll(): Promise<void> {
        console.log('🚀 Starting batch processing for all EOAs\n');
        console.log(`Configuration:`);
        console.log(`  - Batch size: ${this.batchSize}`);
        console.log(`  - Task duration: ${this.taskDuration / 1000 / 60} minutes`);
        console.log('');

        let batchCount = 0;
        let hasMore = true;

        while (hasMore) {
            batchCount++;
            console.log(`\n${'='.repeat(60)}`);
            console.log(`Batch #${batchCount}`);
            console.log('='.repeat(60));

            try {
                hasMore = await this.processBatch();

                if (hasMore) {
                    console.log('\n⏸️  Waiting 5 seconds before next batch...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            } catch (error) {
                console.error(`\n❌ Batch #${batchCount} failed:`, error);

                // Optionally continue with next batch or stop
                const shouldContinue = false; // Set to true to continue on error
                if (!shouldContinue) {
                    throw error;
                }
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ All batches completed! Total batches: ${batchCount}`);
        console.log('='.repeat(60));
    }

    /**
     * Get processing statistics
     */
    async getStats() {
        const { data, error } = await this.supabase
            .from('eoa_progress')
            .select('*');

        if (error) {
            console.error('Error fetching stats:', error);
            return null;
        }

        return data;
    }

    /**
     * Display current progress
     */
    async displayProgress() {
        const stats = await this.getStats();

        if (!stats) {
            console.log('Unable to fetch statistics');
            return;
        }

        console.log('\n📊 Current Progress:');
        console.log('─'.repeat(50));

        for (const stat of stats) {
            const bar = '█'.repeat(Math.floor(stat.percentage / 2));
            const empty = '░'.repeat(50 - bar.length);
            console.log(`${stat.status.padEnd(12)} │${bar}${empty}│ ${stat.percentage}% (${stat.count})`);
        }

        console.log('─'.repeat(50));
    }
}

// Export for use in scripts
export default AirdropBatchProcessor;
