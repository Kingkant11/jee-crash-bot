// Quick script to update bot.js markdown formatting
const fs = require('fs');
const path = require('path');

const botPath = path.join(__dirname, 'bot.js');
let content = fs.readFileSync(botPath, 'utf8');

console.log('🔧 Updating bot.js Markdown formatting...');

// Replace *text* with markdown.bold(text)
const replacements = [
  {
    pattern: /\*([^*]+)\*/g,
    replacement: 'markdown.bold("$1")',
    description: 'Bold: *text* → markdown.bold(text)',
    count: 0
  },
  {
    pattern: /_([^_]+)_/g,
    replacement: 'markdown.italic("$1")',
    description: 'Italic: _text_ → markdown.italic(text)',
    count: 0
  },
  {
    pattern: /`([^`]+)`/g,
    replacement: 'markdown.inlineCode("$1")',
    description: 'Inline code: `text` → markdown.inlineCode(text)',
    count: 0
  }
];

replacements.forEach(({ pattern, replacement, description, count }) => {
  const matches = content.match(pattern);
  if (matches) {
    content = content.replace(pattern, replacement);
    console.log(`  ✓ ${description}: ${matches.length} occurrences`);
  }
});

// Write updated content
fs.writeFileSync(botPath, content);
console.log('✅ bot.js updated successfully!');
console.log('⚠️  Next steps:');
console.log('  1. git add bot.js');
console.log('  2. git commit -m "fix: Use markdown helper throughout bot.js"');
console.log('  3. git push origin main');
