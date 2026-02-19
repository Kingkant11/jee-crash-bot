#!/bin/bash
# Quick fix for bot.js - Remove broken markdown function calls

echo "🔧 Fixing bot.js markdown formatting..."

# Remove all broken markdown function calls that create comments
sed -i \
  -e 's|/\*markdown\.bold([^*)]\*\*/*|*\\1\*|g' \
  -e 's|/markdown\.italic([^_])\_/*|_\\1\_|g' \
  -e 's|/markdown\.inlineCode([^)]\)/*|inlineCode("\\1")|g' \
  -e 's|/markdown\.formatFormula([^)]\)/*|formatFormula("\\1")|g' \
  bot.js

echo "✅ bot.js fixed!"
echo "📊 Now commit and push to GitHub..."
