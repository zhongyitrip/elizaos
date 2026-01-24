#!/usr/bin/env bun
/**
 * Query OpenRouter for available free models
 */

import { config } from 'dotenv';

config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in .env');
    process.exit(1);
}

async function queryAvailableModels() {
    console.log('🔍 Querying OpenRouter for available models...\n');

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        // Filter for free models
        const freeModels = data.data.filter((model: any) =>
            model.id.includes(':free') ||
            model.pricing?.prompt === '0' ||
            model.pricing?.prompt === 0
        );

        console.log(`📊 Found ${freeModels.length} free models:\n`);
        console.log('| Model ID | Name | Context | Pricing |');
        console.log('|----------|------|---------|---------|');

        for (const model of freeModels) {
            const id = model.id;
            const name = model.name || 'N/A';
            const context = model.context_length || 'N/A';
            const pricing = model.pricing?.prompt === '0' || model.pricing?.prompt === 0 ? 'Free' : 'Unknown';

            console.log(`| ${id} | ${name} | ${context} | ${pricing} |`);
        }

        // Save to file
        await Bun.write('available-free-models.json', JSON.stringify(freeModels, null, 2));
        console.log(`\n💾 Full list saved to: available-free-models.json`);

        // Print recommended models
        console.log('\n\n🎯 Recommended Free Models:\n');

        const recommended = freeModels.filter((m: any) =>
            m.id.includes('gemini') ||
            m.id.includes('qwen') ||
            m.id.includes('deepseek') ||
            m.id.includes('llama')
        );

        for (const model of recommended) {
            console.log(`✅ ${model.id}`);
            console.log(`   Name: ${model.name}`);
            console.log(`   Context: ${model.context_length} tokens`);
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

queryAvailableModels();
