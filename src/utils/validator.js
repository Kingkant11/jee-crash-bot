/**
 * Input Validation Utility
 * Sanitizes and validates user inputs
 */

const validator = require('validator');
const xss = require('xss');

/**
 * Sanitize text input for Telegram
 * Removes HTML tags, escapes special characters, limits length
 */
function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return input;
  
  // Trim whitespace
  input = input.trim();
  
  // Remove HTML tags
  input = xss(input);
  
  // Escape special characters for Telegram MarkdownV2
  input = input.replace(/[_*~`>#+=\|{}.!-]/g, '\\$&');
  
  // Limit length
  input = input.substring(0, maxLength);
  
  return input;
}

/**
 * Validate Telegram ID
 */
function validateTelegramId(id) {
  return validator.isInt(String(id), { 
    min: 1, 
    max: 2147483647 
  });
}

/**
 * Validate username
 */
function validateUsername(username) {
  if (!username) return true; // Username is optional
  return validator.isAlphanumeric(username, { 
    allowUnderscores: true,
    allowHyphens: false 
  });
}

/**
 * Validate message text
 */
function validateMessageText(text, maxLength = 4096) {
  if (typeof text !== 'string') return false;
  return text.length > 0 && text.length <= maxLength;
}

/**
 * Validate phone number (for payment)
 */
function validatePhone(phone) {
  if (!phone) return true; // Phone is optional
  return validator.isMobilePhone(phone, 'en-IN');
}

/**
 * Validate email address
 */
function validateEmail(email) {
  if (!email) return true; // Email is optional
  return validator.isEmail(email);
}

/**
 * Validate test answer index
 */
function validateAnswerIndex(index, maxOptions = 4) {
  const numIndex = parseInt(index);
  return !isNaN(numIndex) && numIndex >= 0 && numIndex < maxOptions;
}

/**
 * Validate question count
 */
function validateQuestionCount(count) {
  const numCount = parseInt(count);
  return !isNaN(numCount) && numCount > 0 && numCount <= 100;
}

/**
 * Validate subject name
 */
function validateSubject(subject) {
  const validSubjects = ['Physics', 'Math', 'Chemistry'];
  return validSubjects.includes(subject);
}

/**
 * Validate difficulty level
 */
function validateDifficulty(difficulty) {
  const validDifficulties = ['easy', 'medium', 'hard'];
  return validDifficulties.includes(difficulty);
}

/**
 * Validate payment amount
 */
function validatePaymentAmount(amount, expectedAmount = 99) {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount === expectedAmount;
}

/**
 * Validate referral code format
 */
function validateReferralCode(code) {
  if (!code) return false;
  // 8-character alphanumeric code
  return /^[A-Z0-9]{8}$/.test(code);
}

/**
 * Validate JSON data
 */
function validateJSON(jsonString) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Sanitize and validate user data from Telegram
 */
function validateUserData(userData) {
  const errors = [];
  
  if (!validateTelegramId(userData.id)) {
    errors.push('Invalid Telegram ID');
  }
  
  if (!validateUsername(userData.username)) {
    errors.push('Invalid username format');
  }
  
  if (userData.first_name && !validateMessageText(userData.first_name, 100)) {
    errors.push('Invalid first name');
  }
  
  if (userData.last_name && !validateMessageText(userData.last_name, 100)) {
    errors.push('Invalid last name');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  sanitizeInput,
  validateTelegramId,
  validateUsername,
  validateMessageText,
  validatePhone,
  validateEmail,
  validateAnswerIndex,
  validateQuestionCount,
  validateSubject,
  validateDifficulty,
  validatePaymentAmount,
  validateReferralCode,
  validateJSON,
  validateUserData
};