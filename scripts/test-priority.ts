
import { getModelPool, FREE_MODEL_POOLS, reportRateLimit } from '../packages/plugin-openrouter/src/utils/free-model-rotating.ts';

/**
 * Test script to verify Smart Prioritization logic
 * 
 * Scenario:
 * 1. Initial Call -> Should get Top Priority Model (Gemma 27B)
 * 2. Simulate Rate Limit -> Should switch to Backup (Gemini)
 * 3. Immediate Second Call -> Should still use Backup (Top model in cool-down)
 * 4. Wait for Cool-down -> Should switch BACK to Top Priority Model
 */
async function testPriority() {
    console.log('🔄 Testing Smart Prioritization Logic');
    console.log('=====================================\n');

    const poolType = 'SMALL';

    // 1. Initial Check
    console.log('1️⃣  Initial Request:');
    let pool = getModelPool(poolType);
    let topModel = pool[0];
    console.log(`   Top Model: ${topModel.split(':')[0]}`);

    const expectedTop = FREE_MODEL_POOLS[poolType][0];
    if (topModel !== expectedTop) {
        console.error(`   ❌ Error: Expected ${expectedTop}, got ${topModel}`);
        process.exit(1);
    }
    console.log('   ✅ Valid: Top priority model selected first.');
    console.log('');

    // 2. Simulate Rate Limit
    console.log(`2️⃣  Simulating Rate Limit on [${topModel.split(':')[0]}]...`);
    reportRateLimit(topModel);

    pool = getModelPool(poolType);
    let nextModel = pool[0];
    console.log(`   New Top Model: ${nextModel.split(':')[0]}`);

    if (nextModel === topModel) {
        console.error(`   ❌ Error: Model should have been filtered out!`);
        process.exit(1);
    }
    console.log('   ✅ Valid: Top model filtered out. Backup selected.');
    console.log('');

    // 3. Rate Limit Second Model too
    console.log(`3️⃣  Simulating Rate Limit on Backup [${nextModel.split(':')[0]}]...`);
    reportRateLimit(nextModel);

    pool = getModelPool(poolType);
    let thirdModel = pool[0];
    console.log(`   New Top Model: ${thirdModel.split(':')[0]}`);

    if (thirdModel === topModel || thirdModel === nextModel) {
        console.error(`   ❌ Error: Both limited models should be filtered!`);
        process.exit(1);
    }
    console.log('   ✅ Valid: Both limited models filtered out.');
    console.log('');

    console.log('✨ Smart Prioritization Logic Verified!');
    console.log('   (Note: We verify cool-down expiration logic in unit tests or by waiting 60s manually)');
}

testPriority();
