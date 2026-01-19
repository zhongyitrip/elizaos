#!/bin/bash
# Patch script for @elizaos/plugin-zerion to fix Base64 authentication
# This script should be run after npm/bun install to apply the authentication fix

set -e

PLUGIN_FILE="node_modules/@elizaos/plugin-zerion/dist/index.js"

if [ ! -f "$PLUGIN_FILE" ]; then
    echo "❌ Error: Plugin file not found at $PLUGIN_FILE"
    exit 1
fi

echo "🔧 Patching @elizaos/plugin-zerion authentication..."

# Backup original file
cp "$PLUGIN_FILE" "$PLUGIN_FILE.backup"

# Apply patch for portfolio endpoint (line 18-24)
sed -i '' '18s|const baseUrl = ZERION_V1_BASE_URL;|const baseUrl = ZERION_V1_BASE_URL;\
      const base64Auth = Buffer.from(\`\${process.env.ZERION_API_KEY}:\`).toString('\''base64'\'');|' "$PLUGIN_FILE"

sed -i '' 's|"Authorization": `Basic ${process.env.ZERION_API_KEY}`|"Authorization": \`Basic \${base64Auth}\`|g' "$PLUGIN_FILE"

echo "✅ Patch applied successfully!"
echo "📝 Original file backed up to: $PLUGIN_FILE.backup"
