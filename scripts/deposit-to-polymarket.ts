#!/usr/bin/env bun
/**
 * Deposit USDC to Polymarket Proxy Wallet
 * This script transfers USDC from your EOA to the Polymarket Proxy contract
 */

import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config({ path: 'packages/plugin-polymarket/.env.test' });

// Polygon USDC Contract Address
const POLYGON_USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'; // USDC on Polygon PoS
const USDC_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function approve(address spender, uint256 amount) returns (bool)',
];

async function depositToPolymarket() {
    console.log('💰 Depositing USDC to Polymarket Proxy...\n');

    // Load config
    const privateKey = process.env.POLYMARKET_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY;
    const proxyAddress = process.env.POLYMARKET_PROXY_ADDRESS;
    // Use dRPC with API key
    const rpcUrl = process.env.POLYGON_RPC_URL || 'https://lb.drpc.live/polygon/Al9LLtcpNUysoem7maRqCBf0R4sw-qsR8JlvpjH_viVr';

    if (!privateKey || !proxyAddress) {
        console.error('❌ Missing required environment variables');
        console.error('   Required: POLYMARKET_PRIVATE_KEY, POLYMARKET_PROXY_ADDRESS');
        return;
    }

    console.log(`🔗 Connecting to Polygon RPC`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`📍 Your EOA: ${wallet.address}`);
    console.log(`📍 Proxy Address: ${proxyAddress}\n`);

    // Connect to USDC contract
    const usdc = new ethers.Contract(POLYGON_USDC_ADDRESS, USDC_ABI, wallet);

    try {
        // 1. Check balance
        console.log('1️⃣ Checking USDC balance...');
        const balance = await usdc.balanceOf(wallet.address);
        const decimals = await usdc.decimals();
        const balanceFormatted = ethers.formatUnits(balance, decimals);

        console.log(`   Balance: ${balanceFormatted} USDC`);

        if (parseFloat(balanceFormatted) < 1) {
            console.error('❌ Insufficient USDC balance. You need at least 1 USDC.');
            return;
        }

        // 2. Prepare transfer (1 USDC)
        const amount = ethers.parseUnits('1', decimals);
        console.log('\n2️⃣ Preparing transfer: 1 USDC');

        // 3. Estimate gas (simplified)
        console.log('3️⃣ Estimating gas...');
        const gasEstimate = await usdc.transfer.estimateGas(proxyAddress, amount);
        console.log(`   Estimated gas units: ${gasEstimate.toString()}`);

        // 4. Execute transfer
        console.log('\n4️⃣ Sending transaction...');
        const tx = await usdc.transfer(proxyAddress, amount);

        console.log(`   Transaction hash: ${tx.hash}`);
        console.log('   Waiting for confirmation...');

        const receipt = await tx.wait();

        if (receipt?.status === 1) {
            console.log('\n✅ Deposit successful!');
            console.log(`   Block: ${receipt.blockNumber}`);
            console.log(`   Gas used: ${receipt.gasUsed.toString()}`);

            // Verify balance
            const newBalance = await usdc.balanceOf(wallet.address);
            const newBalanceFormatted = ethers.formatUnits(newBalance, decimals);
            console.log(`   New balance: ${newBalanceFormatted} USDC`);

            console.log('\n🎉 1 USDC has been deposited to your Polymarket Proxy!');
            console.log('   You can now place orders on Polymarket.');
        } else {
            console.error('❌ Transaction failed');
        }
    } catch (error) {
        console.error('\n❌ Error:', error);
        if ((error as any).code === 'INSUFFICIENT_FUNDS') {
            console.error('   You may not have enough MATIC to pay for gas fees.');
        }
    }
}

depositToPolymarket().catch(console.error);
