// Fix all console.log statements with broken markdown
const fs = require('fs');

const botPath = './bot.js';
let content = fs.readFileSync(botPath, 'utf8');

console.log('🔧 Fixing console.log statements...');

// Fix: Remove markdown.inlineCode wrapper from console.log calls
// Pattern: console.log(markdown.inlineCode("text")) → console.log("text")
content = content.replace(/console\.log\(markdown\.inlineCode\("([^"]+)"\)\);/g, 'console.log("$1");');

// Fix: Remove markdown.bold wrapper
// Pattern: console.log(markdown.bold("text")) → console.log("text") (if any)
content = content.replace(/console\.log\(markdown\.bold\("([^"]+)"\)\);/g, 'console.log("$1");');

// Fix: Remove markdown.italic wrapper
// Pattern: console.log(markdown.italic("text")) → console.log("text") (if any)
content = content.replace(/console\.log\(markdown\.italic\("([^"]+)"\)\);/g, 'console.log("$1");');

const count = (content.match(/console\.log\("\1"\);/g) || []).length;

fs.writeFileSync(botPath, content);
console.log(`✅ Fixed ${count} console.log statements`);
console.log('⚠️  Next steps:');
console.log('  1. git add bot.js');
console.log('  2. git commit -m "fix: Remove broken markdown wrappers from console.log"');
console.log('  3. git push origin main');
