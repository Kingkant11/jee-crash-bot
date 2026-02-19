// Manual fix for bot.js markdown formatting
const fs = require('fs');

const botPath = './bot.js';
let content = fs.readFileSync(botPath, 'utf8');

console.log('🔧 Fixing bot.js markdown formatting...');

// Fix 1: Remove broken bold() patterns that create comments
// Pattern: /*markdown.bold("text")* → markdown.bold("text")
content = content.replace(/\/\*markdown\.bold\([^)]+\)\*\*\//g, 'markdown.bold("$1")');

console.log('  ✓ Fixed broken bold() patterns');

// Fix 2: Remove broken italic() patterns
// Pattern: /markdown.italic("text")_/ → markdown.italic("text")
content = content.replace(/\/markdown\.italic\([^)]+\)_\//g, 'markdown.italic("$1")');

console.log('  ✓ Fixed broken italic() patterns');

// Fix 3: Remove broken inlineCode() patterns  
// Pattern: /markdown.inlineCode("text")*/ → inlineCode("text")
content = content.replace(/\/markdown\.inlineCode\([^)]+\)\*\*\//g, 'inlineCode("$1")');

console.log('  ✓ Fixed broken inlineCode() patterns');

// Fix 4: Remove broken formatFormula() patterns
// Pattern: /markdown.formatFormula("text")*/ → formatFormula("text")
content = content.replace(/\/markdown\.formatFormula\([^)]+\)\*\*\//g, 'formatFormula("$1")');

console.log('  ✓ Fixed broken formatFormula() patterns');

// Write back
fs.writeFileSync(botPath, content);
console.log('✅ bot.js fixed successfully!');
console.log('⚠️  Next steps:');
console.log('  1. git add bot.js');
console.log('  2. git commit -m "fix: Manually fix broken markdown patterns"');
console.log('  3. git push origin main');
