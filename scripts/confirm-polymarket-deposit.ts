#!/usr/bin/env bun
/**
 * Automated script to confirm pending deposit on Polymarket
 * Uses browser automation to click the confirmation button
 */

import { chromium } from 'playwright';

async function confirmPendingDeposit() {
    console.log('🌐 Starting browser automation to confirm Polymarket deposit...\n');

    const browser = await chromium.launch({
        headless: false, // Show browser so you can see what's happening
        slowMo: 500, // Slow down actions for visibility
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        // 1. Navigate to Polymarket portfolio
        console.log('1️⃣ Navigating to Polymarket portfolio...');
        await page.goto('https://polymarket.com/portfolio?tab=positions');
        await page.waitForLoadState('networkidle');

        // 2. Wait for wallet connection (you may need to manually connect)
        console.log('2️⃣ Waiting for page to load...');
        await page.waitForTimeout(3000);

        // 3. Look for the "Confirm pending deposit" button
        console.log('3️⃣ Looking for confirmation button...');

        const confirmButton = page.locator('text=Confirm pending deposit').first();

        if (await confirmButton.isVisible({ timeout: 5000 })) {
            console.log('✅ Found "Confirm pending deposit" button!');
            console.log('4️⃣ Clicking confirmation button...');

            await confirmButton.click();

            console.log('⏳ Waiting for wallet popup...');
            console.log('   Please approve the transaction in your wallet (MetaMask/etc)');

            // Wait for the confirmation to process
            await page.waitForTimeout(5000);

            // Check if balance updated
            const balanceElement = page.locator('text=/\\$[0-9.]+/').first();
            if (await balanceElement.isVisible()) {
                const balance = await balanceElement.textContent();
                console.log(`\n✅ Success! Your balance should now show: ${balance}`);
            }

            console.log('\n🎉 Deposit confirmation process completed!');
            console.log('   Check your Polymarket portfolio to verify the balance.');

        } else {
            console.log('⚠️  No pending deposit found.');
            console.log('   Either the deposit is already confirmed, or you need to connect your wallet first.');
        }

        // Keep browser open for a few seconds so you can see the result
        console.log('\n⏳ Keeping browser open for 10 seconds...');
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('\n❌ Error:', error);
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Make sure you\'re logged into Polymarket in your default browser');
        console.log('   2. You may need to manually connect your wallet when the browser opens');
        console.log('   3. Approve any wallet transactions that pop up');
    } finally {
        await browser.close();
        console.log('\n✅ Browser closed.');
    }
}

confirmPendingDeposit().catch(console.error);
