/**
 * MarkdownV2 Helper Functions
 * Escapes special characters for Telegram's MarkdownV2
 */

/**
 * Escape text for Telegram MarkdownV2
 * Characters that need escaping: _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
function escapeMarkdownV2(text) {
  if (!text) return '';

  // Escape in order (most special first)
  return text
    .replace(/\\/g, '\\\\')  // Backslash first
    .replace(/_/g, '\\_')    // Underscore
    .replace(/\*/g, '\\*')    // Asterisk (escaped as \\*)
    .replace(/\[/g, '\\[')     // Opening bracket
    .replace(/\]/g, '\\]')     // Closing bracket
    .replace(/\(/g, '\\(')      // Opening parenthesis
    .replace(/\)/g, '\\)')      // Closing parenthesis
    .replace(/~/g, '\\~')     // Tilde
    .replace(/`/g, '\\`')      // Backtick
    .replace(/>/g, '\\>')      // Greater than
    .replace(/#/g, '\\#')      // Hash
    .replace(/\+/g, '\\+')      // Plus
    .replace(/-/g, '\\-')      // Minus
    .replace(/=/g, '\\=')      // Equals
    .replace(/\|/g, '\\|')      // Pipe
    .replace(/\{/g, '\\{')     // Opening brace
    .replace(/\}/g, '\\}')     // Closing brace
    .replace(/\./g, '\\.')      // Period
    .replace(/!/g, '\\!');    // Exclamation
}

/**
 * Bold text in MarkdownV2
 */
function bold(text) {
  return `*${escapeMarkdownV2(text)}*`;
}

/**
 * Italic text in MarkdownV2
 */
function italic(text) {
  return `_${escapeMarkdownV2(text)}_`;
}

/**
 * Code block in MarkdownV2
 */
function codeBlock(text, language = '') {
  return '\\`\\`\\`' + language + '\\n' + text + '\\n\\`\\`\\`';
}

/**
 * Inline code in MarkdownV2
 */
function inlineCode(text) {
  return `\`${escapeMarkdownV2(text)}\``;
}

/**
 * Monospace text in MarkdownV2
 */
function monospace(text) {
  return '\\`\\`\\`' + escapeMarkdownV2(text) + '\\`\\`\\`';
}

/**
 * URL in MarkdownV2
 */
function url(text, link) {
  return `[${escapeMarkdownV2(text)}](${link})`;
}

/**
 * User mention in MarkdownV2
 */
function mention(username) {
  return url(`@${username}`, `https://t.me/${username}`);
}

/**
 * Escape mermaid diagram code blocks
 * Mermaid diagrams use special characters that break Markdown
 */
function formatMermaidDiagram(title, code) {
  return `\n📊 *${bold(title)}*\n\n${inlineCode(code)}\n`;
}

/**
 * Safe formula formatting
 * Prevents special characters in chemical/math formulas from breaking
 */
function formatFormula(formula) {
  // For simple formulas, use inline code to preserve formatting
  return inlineCode(formula);
}

module.exports = {
  escapeMarkdownV2,
  bold,
  italic,
  codeBlock,
  inlineCode,
  monospace,
  url,
  mention,
  formatMermaidDiagram,
  formatFormula
};
