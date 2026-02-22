/**
 * Test Handler
 * Handles test-related commands and callbacks
 */

const db = require('../../database/db');
const researcherAgent = require('../../agents/researcher');
const analystAgent = require('../../agents/analyst');
const markdown = require('../../utils/markdown');
const logger = require('../../utils/logger');
const validator = require('../../utils/validator');

// In-memory user sessions (TODO: Move to Redis)
const activeSessions = {};

/**
 * Handle /test command
 */
async function handleTestCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  logger.info('Test command received', { telegramId });

  try {
    // Validate user
    if (!validator.validateTelegramId(telegramId)) {
      bot.sendMessage(chatId, '❌ Invalid user ID', { parse_mode: 'MarkdownV2' });
      return;
    }

    // Get or create user
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    });

    // Check for active test
    if (activeSessions[telegramId]) {
      bot.sendMessage(
        chatId,
        '⚠️  You already have an active test. Complete it first with /cancel',
        { parse_mode: 'MarkdownV2' }
      );
      return;
    }

    // Show loading message
    const loadingMsg = await bot.sendMessage(
      chatId,
      `🧠 ${markdown.bold('Researcher AI')} is generating your diagnostic test...\n\nPlease wait 15-20 seconds...`,
      { parse_mode: 'MarkdownV2' }
    );

    // Generate questions
    logger.info('Generating test questions', { userId: user.id });
    const questions = await researcherAgent.researcherAgentGenerateQuestions();

    // Save to database
    await db.saveQuestionsToBank(questions);
    logger.info('Questions saved to bank', { count: questions.length });

    // Create active session
    activeSessions[telegramId] = {
      userId: user.id,
      questions: questions,
      answers: {},
      qIndex: 0,
      startTime: Date.now(),
      testType: 'diagnostic'
    };

    // Update loading message
    bot.editMessageText(
      loadingMsg.message_id,
      `${markdown.inlineCode('✅ Test ready!')}\n\n${markdown.bold('10 questions')} - 10 minutes\n\nPress the button below to start ⬇️`,
      { parse_mode: 'MarkdownV2' }
    );

    // Send start button
    const keyboard = {
      inline_keyboard: [[{ text: '🚀 Start Test', callback_data: 'start_test' }]]
    };

    bot.sendMessage(chatId, 'Ready?', {
      reply_markup: { inline_keyboard: keyboard.inline_keyboard },
      parse_mode: 'MarkdownV2'
    });

  } catch (e) {
    logger.error('Error generating test', { error: e.message, telegramId });
    bot.sendMessage(chatId, '❌ Error generating test. Please try again.', { parse_mode: 'MarkdownV2' });
  }
}

/**
 * Handle test start callback
 */
async function handleStartTestCallback(bot, query) {
  const chatId = query.message.chat.id;
  const telegramId = query.from.id;

  logger.info('Test start callback', { telegramId });

  try {
    bot.answerCallbackQuery(query.id);
    sendQuestion(bot, chatId, telegramId, 0);
  } catch (e) {
    logger.error('Error starting test', { error: e.message, telegramId });
  }
}

/**
 * Handle answer callback
 */
async function handleAnswerCallback(bot, query, data) {
  const chatId = query.message.chat.id;
  const telegramId = query.from.id;

  logger.debug('Answer callback', { telegramId, data });

  try {
    bot.answerCallbackQuery(query.id);
    await handleAnswer(bot, chatId, telegramId, data);
  } catch (e) {
    logger.error('Error handling answer', { error: e.message, telegramId });
  }
}

/**
 * Send a question to user
 */
async function sendQuestion(bot, chatId, telegramId, qIndex) {
  const session = activeSessions[telegramId];

  if (!session || !session.questions || qIndex >= session.questions.length) {
    // Test complete
    await completeTest(bot, chatId, telegramId);
    return;
  }

  const q = session.questions[qIndex];
  const keyboard = {
    inline_keyboard: q.options.map((opt, i) => [
      { text: opt, callback_data: `ans_${qIndex}_${i}` }
    ])
  };

  const questionText = `${markdown.bold(`Question ${qIndex + 1}/10`)}\n\n${q.q}\n\n\`${q.subject} | ${q.chapter} | ${q.difficulty}\``;

  bot.sendMessage(chatId, questionText, {
    reply_markup: { inline_keyboard: keyboard.inline_keyboard },
    parse_mode: 'MarkdownV2'
  });

  session.qIndex = qIndex;
  logger.debug('Question sent', { telegramId, questionIndex: qIndex + 1 });
}

/**
 * Handle user answer
 */
async function handleAnswer(bot, chatId, telegramId, data) {
  const session = activeSessions[telegramId];

  if (!session) {
    bot.sendMessage(chatId, '❌ No active test. Send /test to start.', { parse_mode: 'MarkdownV2' });
    return;
  }

  const [, qIndexStr, answerIndex] = data.split('_');
  const qIndex = parseInt(qIndexStr);
  const answer = parseInt(answerIndex);

  // Validate answer index
  if (!validator.validateAnswerIndex(answerIndex)) {
    logger.warn('Invalid answer index', { telegramId, answerIndex });
    return;
  }

  // Save answer
  session.answers[qIndex] = answer;
  session.qIndex++;

  // Send next question or complete
  if (session.qIndex < session.questions.length) {
    await sendQuestion(bot, chatId, telegramId, session.qIndex);
  } else {
    await completeTest(bot, chatId, telegramId);
  }
}

/**
 * Complete test and analyze results
 */
async function completeTest(bot, chatId, telegramId) {
  const session = activeSessions[telegramId];

  if (!session) return;

  logger.info('Test completed', { telegramId, userId: session.userId });

  try {
    // Calculate results
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - session.startTime) / 1000); // seconds

    const testData = session.questions.map((q, i) => ({
      question_id: q.id,
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      difficulty: q.difficulty,
      is_correct: session.answers[i] === q.ans
    }));

    const correctCount = testData.filter(t => t.is_correct).length;
    const score = correctCount;
    const total = testData.length;
    const percentage = Math.round((score / total) * 100);

    // Get user's progress history for better analysis
    const userTests = await db.getUserTests(session.userId, 5);
    const userProgress = await db.getProgressReport(session.userId);

    // Analyze results
    logger.info('Analyzing test results', { userId: session.userId, score, percentage });
    const analysis = await analystAgent.analystAgentAnalyze(testData, userProgress);

    // Save test to database
    await db.saveTest(session.userId, {
      test_type: 'diagnostic',
      questions: session.questions,
      answers: session.answers,
      score: score,
      total_questions: total,
      percentage: percentage,
      analysis: analysis
    });

    // Update progress
    await db.updateProgressBatch(session.userId, session.questions, session.answers, testData.map(t => t.is_correct));

    // Clear session
    delete activeSessions[telegramId];

    // Format analysis message
    const analysisMessage = analystAgent.formatAnalysisMessage(analysis);
    const resultMessage = `
${analysisMessage}

⏱️  Time Taken: ${markdown.bold(`${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`)}

━━━━━━━━━━━━━━━━━━━
${percentage >= 60 ? '🎉 Good Job!' : '💪 Keep Practicing!'}

💎 Unlock Full 7-Day Crash Plan - ₹99

Get:
• 210 targeted questions based on YOUR weaknesses
• Daily study schedule with 30 questions each day
• Mermaid diagrams for key concepts
• Formula sheets and PYQs
• Session 2 percentile predictor

Send /pay99 to upgrade now!
    `;

    bot.sendMessage(chatId, resultMessage, { parse_mode: 'MarkdownV2' });
    logger.info('Results sent', { telegramId, percentage });

  } catch (e) {
    logger.error('Error completing test', { error: e.message, telegramId });
    bot.sendMessage(chatId, '❌ Error analyzing test. Please try again.', { parse_mode: 'MarkdownV2' });
  }
}

/**
 * Handle /cancel command
 */
function handleCancelCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  if (activeSessions[telegramId]) {
    delete activeSessions[telegramId];
    bot.sendMessage(chatId, '❌ Test cancelled. Send /test to start a new one.', { parse_mode: 'MarkdownV2' });
    logger.info('Test cancelled', { telegramId });
  } else {
    bot.sendMessage(chatId, 'No active test to cancel.', { parse_mode: 'MarkdownV2' });
  }
}

/**
 * Get active sessions (for monitoring)
 */
function getActiveSessions() {
  return activeSessions;
}

/**
 * Clean up inactive sessions
 */
function cleanupInactiveSessions(maxAge = 3600000) { // 1 hour default
  const now = Date.now();
  let cleaned = 0;

  for (const [telegramId, session] of Object.entries(activeSessions)) {
    if (now - session.startTime > maxAge) {
      delete activeSessions[telegramId];
      cleaned++;
      logger.warn('Inactive session cleaned up', { telegramId, age: now - session.startTime });
    }
  }

  if (cleaned > 0) {
    logger.info('Session cleanup completed', { cleanedCount: cleaned, remainingCount: Object.keys(activeSessions).length });
  }

  return cleaned;
}

module.exports = {
  handleTestCommand,
  handleStartTestCallback,
  handleAnswerCallback,
  handleCancelCommand,
  getActiveSessions,
  cleanupInactiveSessions
};