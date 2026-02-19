// Fix: Replace all parse_mode: 'Markdown' with parse_mode: 'MarkdownV2' in bot.js
// This resolves Telegram entity parsing errors

const fs = require('fs');
const path = require('path');

const botPath = path.join(__dirname, 'bot.js');
let content = fs.readFileSync(botPath, 'utf8');

// Replace all occurrences of parse_mode: 'Markdown' with MarkdownV2
const originalCount = (content.match(/parse_mode: 'Markdown'/g) || []).length;
content = content.replace(/parse_mode: 'Markdown'/g, "parse_mode: 'MarkdownV2'");

console.log(`✅ Replaced ${originalCount} occurrences of parse_mode: 'Markdown' with 'MarkdownV2'`);

fs.writeFileSync(botPath, content);
console.log('✅ File updated successfully!');
