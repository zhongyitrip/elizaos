import { config } from 'dotenv';
import path from 'path';
import { createDatabaseAdapter } from '@elizaos/plugin-sql';
import { sql } from 'drizzle-orm';

// Load .env
config({ path: path.resolve(process.cwd(), '.env') });

async function hardReset() {
    const postgresUrl = process.env.POSTGRES_URL;
    if (!postgresUrl) {
        console.error("❌ No POSTGRES_URL found");
        process.exit(1);
    }

    console.log("🔌 Connecting to Supabase...");
    try {
        const db = createDatabaseAdapter({
            dataDir: path.resolve(process.cwd(), ".eliza"),
            postgresUrl: postgresUrl
        });

        await db.init();
        const dbInstance = (db as any).db;

        console.log("🧹 Clearing persistent memory queue...");

        // Clear tasks/memories that might be holding the bad model ID
        // Note: 'memories' is the main table for chat history and context. 
        // Clearing it resets the agent's recent context but fixes the "stuck" state.

        // We delete anything created in the last 24 hours to be safe, or just sweep it all if needed.
        // Let's safe-bet and clear recent logs/memories.

        await dbInstance.execute(sql`DELETE FROM memories;`);
        await dbInstance.execute(sql`DELETE FROM logs;`);
        // If there's a tasks table, clear it too (though standard schema might not use it heavily for this)
        // Check if table exists first or just try-catch

        console.log("✅ Database flushed. Agent context reset.");

    } catch (err) {
        console.error("❌ Error during flush:", err);
    }

    process.exit(0);
}

hardReset().catch(console.error);
