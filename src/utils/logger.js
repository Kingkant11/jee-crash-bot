/**
 * Logger Utility
 * Provides structured logging with different levels
 */

const fs = require('fs');
const path = require('path');

// Log levels
const LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Log directory
const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

/**
 * Write log to file
 */
function writeToLogFile(level, formattedMessage) {
  const logFile = path.join(LOG_DIR, `${level.toLowerCase()}.log`);
  fs.appendFileSync(logFile, formattedMessage + '\n', 'utf8');
}

/**
 * Logger class
 */
class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || LEVELS.INFO;
  }

  shouldLog(level) {
    const levelPriority = {
      [LEVELS.ERROR]: 0,
      [LEVELS.WARN]: 1,
      [LEVELS.INFO]: 2,
      [LEVELS.DEBUG]: 3
    };
    return levelPriority[level] <= levelPriority[this.level];
  }

  error(message, meta = {}) {
    if (this.shouldLog(LEVELS.ERROR)) {
      const formatted = formatMessage(LEVELS.ERROR, message, meta);
      console.error('\x1b[31m%s\x1b[0m', formatted);
      writeToLogFile(LEVELS.ERROR, formatted);
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog(LEVELS.WARN)) {
      const formatted = formatMessage(LEVELS.WARN, message, meta);
      console.warn('\x1b[33m%s\x1b[0m', formatted);
      writeToLogFile(LEVELS.WARN, formatted);
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog(LEVELS.INFO)) {
      const formatted = formatMessage(LEVELS.INFO, message, meta);
      console.log('\x1b[36m%s\x1b[0m', formatted);
      writeToLogFile(LEVELS.INFO, formatted);
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog(LEVELS.DEBUG)) {
      const formatted = formatMessage(LEVELS.DEBUG, message, meta);
      console.debug(formatted);
      writeToLogFile(LEVELS.DEBUG, formatted);
    }
  }
}

// Export singleton instance
module.exports = new Logger();
module.exports.LEVELS = LEVELS;