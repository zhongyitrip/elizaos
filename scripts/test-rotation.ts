
import { getModelPool, FREE_MODEL_POOLS } from '../packages/plugin-openrouter/src/utils/free-model-pool.ts';

/**
 * Test script to verify model rotation logic
 */
function testRotation() {
    console.log('🔄 Testing Free Model Pool Rotation Logic');
    console.log('=========================================\n');

    const testPools = ['SMALL', 'LARGE', 'VISION', 'CODE'] as const;

    for (const poolType of testPools) {
        console.log(`\n🧪 Testing Pool: ${poolType}`);
        const originalPool = FREE_MODEL_POOLS[poolType];
        console.log(`   Original Order: ${originalPool.map(m => m.split(':')[0]).join(' -> ')}`);

        // Simulate 5 calls (more than pool length to verify wrapping)
        for (let i = 1; i <= 5; i++) {
            const rotated = getModelPool(poolType);
            const firstModel = rotated[0];
            const shortName = firstModel.split(':')[0];

            console.log(`   Call ${i}: [${shortName}, ...]`);

            // Verification: The first model should match the expected rotation
            const expectedIndex = (i - 1) % originalPool.length;
            const expectedModel = originalPool[expectedIndex];

            if (firstModel !== expectedModel) {
                console.error(`   ❌ Error: Expected ${expectedModel}, got ${firstModel}`);
                process.exit(1);
            }
        }
        console.log('   ✅ Rotation verified');
    }

    console.log('\n✨ All rotation tests passed!');
}

testRotation();
