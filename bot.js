/*
 * JEE Crash Bot - Main Bot File
 * Integrates database, agents, and Telegram bot
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// Import modules
const db = require('./src/database/db');
const researcherAgent = require('./src/agents/researcher');
const analystAgent = require('./src/agents/analyst');
const plannerAgent = require('./src/agents/planner');
const markdown = require('./src/utils/markdown');

// ============================================
// EXPRESS SERVER (Health Checks)
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 JEE Bot is running!');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Web server listening on port ${PORT}`);
  console.log('🤖 Telegram bot starting...');
});

// ============================================
// ============================================
// TELEGRAM BOT
// ============================================

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// In-memory user sessions (for active tests)
const activeSessions = {};

// ============================================
// COMMANDS
// ============================================

// /start command
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const referralCode = match[1] ? match[1].replace('ref_', '') : null;

  console.log(`👤 /start from user ${telegramId}, referral: ${referralCode}`);

  try {
    // Get or create user
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    });

    console.log(`✅ User ${user.id} ${user.is_paid ? '(paid)' : '(free)'}`);

    // Check for referral
    if (referralCode) {
      console.log(`📌 Referral code: ${referralCode}`);
      // TODO: Implement referral logic
    }

    // Send welcome message
    const welcomeMessage = `
${markdown.bold('🎉 Welcome to JEE Crash Bot!')}

${user.is_paid ? '✅ ' + markdown.bold('Premium User') + ' - Full access unlocked!' : '🆓 ' + markdown.bold('Free Tier') + ' - Upgrade for full features'}

${markdown.bold('📊 What I do:')}
🔬 Generate diagnostic tests
📊 Analyze your weaknesses
📅 Create personalized study plans
📈 Track your progress

${markdown.bold('🚀 Quick Start:')}
1. Send /test - Take FREE diagnostic test (10 questions, 10 mins)
2. Get analysis - See exact weaknesses
3. Upgrade (₹99) - Get 7-day personalized plan

${markdown.bold('📊 Stats:')}
📊 Tests taken: ${user.total_tests}
🏆 Best score: ${user.highest_score}%

${markdown.bold('📱 Commands:')}
/start - Start the bot
/test - Take diagnostic test
/history - See your test history
/progress - Check subject-wise progress
/myplan - View your study plan (if paid)
/stats - Your statistics
/help - Help message
${user.is_paid ? '/myplan' : '/pay99 - Upgrade for ₹99'}

${!user.is_paid ? '💎 ' + markdown.bold('Upgrade to Premium') + ' for personalized 7-day crash plan!' : ''}

${markdown.bold('🤖 Powered by Groq AI (Llama 3.3 70B)')}
    `;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'MarkdownV2' });
  } catch (e) {
    console.error('❌ Error in /start:', e);
    bot.sendMessage(chatId, '❌ Error initializing. Please try again.');
  }
});

// /test command - Start diagnostic test
bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  console.log(`📝 /test from user ${telegramId}`);

  try {
    // Get user
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    });

    // Check if there's an active test
    if (activeSessions[telegramId]) {
      bot.sendMessage(chatId, '⚠️  You already have an active test. Complete it first with /cancel', { parse_mode: 'MarkdownV2' });
      return;
    }

    // Show loading message
    const loadingMsg = await bot.sendMessage(
      chatId,
      `🧠 ${markdown.bold('Researcher AI')} is generating your diagnostic test...\n\nPlease wait 15-20 seconds...`,
      { parse_mode: 'MarkdownV2' }
    );

    // Generate questions
    const questions = await researcherAgent.researcherAgentGenerateQuestions();

    // Save to database
    await db.saveQuestionsToBank(questions);

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
    console.error('❌ Error generating test:', e);
    bot.sendMessage(chatId, '❌ Error generating test. Please try again.');
  }
});

// Handle test start button
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const telegramId = query.from.id;
  const data = query.data;

  console.log(`🔘 Callback: ${data} from user ${telegramId}`);

  try {
    if (data === 'start_test') {
      bot.answerCallbackQuery(query.id);
      sendQuestion(chatId, telegramId, 0);
    } else if (data.startsWith('ans_')) {
      bot.answerCallbackQuery(query.id);
      handleAnswer(chatId, telegramId, data);
    }
  } catch (e) {
    console.error('❌ Error handling callback:', e);
  }
});

// Send a question
async function sendQuestion(chatId, telegramId, qIndex) {
  const session = activeSessions[telegramId];

  if (!session || !session.questions || qIndex >= session.questions.length) {
    // Test complete
    await completeTest(chatId, telegramId);
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
}

// Handle answer
async function handleAnswer(chatId, telegramId, data) {
  const session = activeSessions[telegramId];

  if (!session) {
    bot.sendMessage(chatId, '❌ No active test. Send /test to start.', { parse_mode: 'MarkdownV2' });
    return;
  }

  const [, qIndexStr, answerIndex] = data.split('_');
  const qIndex = parseInt(qIndexStr);
  const answer = parseInt(answerIndex);

  // Save answer
  session.answers[qIndex] = answer;
  session.qIndex++;

  // Send next question or complete
  if (session.qIndex < session.questions.length) {
    sendQuestion(chatId, telegramId, session.qIndex);
  } else {
    await completeTest(chatId, telegramId);
  }
}

// Complete test and analyze
async function completeTest(chatId, telegramId) {
  const session = activeSessions[telegramId];

  if (!session) return;

  console.log(`✅ Test completed for user ${session.userId}`);

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

  } catch (e) {
    console.error('❌ Error completing test:', e);
    bot.sendMessage(chatId, '❌ Error analyzing test. Please try again.');
  }
}

// /pay99 command - Show payment info (will be implemented later)
bot.onText(/\/pay99/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    });

    if (user.is_paid) {
      bot.sendMessage(chatId, '✅ You already have premium access! Send /myplan to view your study plan.', { parse_mode: 'MarkdownV2' });
      return;
    }

    const paymentMessage = `
💳 Upgrade to Premium - ₹99

${markdown.bold('What you get:')}
📅 Personalized 7-day crash plan
🎯 210 questions based on YOUR weaknesses
📊 Daily schedule (30 questions/day)
📐 Mermaid diagrams for concepts
📋 Formula sheets
📈 Session 2 percentile predictor

${markdown.bold('Payment Gateway Coming Soon...')}

⚠️ For Testing:
Reply /paid to simulate payment
    `;

    bot.sendMessage(chatId, paymentMessage, { parse_mode: 'MarkdownV2' });
  } catch (e) {
    console.error('❌ Error in /pay99:', e);
  }
});

// /paid command - Simulate payment (for testing)
bot.onText(/\/paid/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  console.log(`💳 /paid from user ${telegramId}`);

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    });

    // Mark as paid
    await db.updateUserPayment(user.id);

    console.log(`✅ User ${user.id} marked as paid`);

    bot.sendMessage(chatId, `✅ ${markdown.bold('Payment Successful!')} Premium unlocked.`, { parse_mode: 'MarkdownV2' });

    // Generate and send plan
    setTimeout(async () => {
      await generateAndSendPlan(chatId, user.id);
    }, 2000);

  } catch (e) {
    console.error('❌ Error processing payment:', e);
    bot.sendMessage(chatId, '❌ Error processing payment.');
  }
});

// /myplan command - View study plan
bot.onText(/\/myplan/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  console.log(`📅 /myplan from user ${telegramId}`);

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    });

    if (!user.is_paid) {
      bot.sendMessage(chatId, '❌ Premium feature. Send /pay99 to upgrade.', { parse_mode: 'MarkdownV2' });
      return;
    }

    await generateAndSendPlan(chatId, user.id);

  } catch (e) {
    console.error('❌ Error showing plan:', e);
    bot.sendMessage(chatId, '❌ Error loading plan. Please try again.');
  }
});

// Generate and send study plan
async function generateAndSendPlan(chatId, userId) {
  try {
    const botMessage = await bot.sendMessage(
      chatId,
      `📅 ${markdown.bold('Planner Agent')} is creating your personalized 7-day crash plan...\n\nPlease wait 20-30 seconds...`,
      { parse_mode: 'MarkdownV2' }
    );

    // Get user data
    const userStats = await db.getUserStats(userId);
    const userTests = await db.getUserTests(userId, 3);
    const weakestChapters = await db.getWeakestChapters(userId, 5);

    // Build analysis from latest test
    const analysis = userTests.length > 0
      ? JSON.parse(userTests[0].analysis)
      : {
          subject_scores: {},
          weakest_chapters: weakestChapters.map(c => ({
            subject: c.subject,
            chapter: c.chapter,
            accuracy: c.accuracy,
            issues: 'Needs practice'
          })),
          error_patterns: { conceptual: 0, calculation: 0, silly_mistake: 0, dominant: 'practice' },
          session2_impact: { estimated_score: 150, potential_score: 200, loss: 50, recommendation: 'Practice daily' },
          recommendations: ['Focus on weak areas']
        };

    // Generate plan
    const plan = await plannerAgent.plannerAgentGeneratePlan(analysis, userStats);

    console.log(`✅ Plan generated for user ${userId}`);

    // Format plan message
    const planMessage = plannerAgent.formatPlanMessage(plan);

    // Split long message if needed (Telegram limit 4096 chars)
    const messages = splitLongMessage(planMessage);

    messages.forEach((msg, i) => {
      if (i === 0) {
        bot.editMessageText(botMessage.message_id, msg, { parse_mode: 'MarkdownV2' });
      } else {
        bot.sendMessage(chatId, msg, { parse_mode: 'MarkdownV2' });
      }
    });

  } catch (e) {
    console.error('❌ Error generating plan:', e);
    bot.sendMessage(chatId, '❌ Error generating plan. Please try again.');
  }
}

// Split long message into chunks
function splitLongMessage(message) {
  const chunks = [];
  let currentChunk = '';

  for (const line of message.split('\n')) {
    if ((currentChunk + line).length > 4000) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += line + '\n';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// /history command - Test history
bot.onText(/\/history/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  console.log(`📊 /history from user ${telegramId}`);

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    });

    const tests = await db.getUserTests(user.id, 10);

    if (tests.length === 0) {
      bot.sendMessage(chatId, '📊 No tests taken yet. Send /test to start!', { parse_mode: 'MarkdownV2' });
      return;
    }

    let message = `${markdown.bold('📊 Your Test History')}\n\n`;
    tests.forEach((test, i) => {
      const date = new Date(test.created_at).toLocaleDateString('en-IN');
      message += `${markdown.bold(`Test ${tests.length - i}:`)} ${date}\n`;
      message += `   Score: ${test.score}/${test.total_questions} (${test.percentage}%)\n`;
      message += `   Type: ${test.test_type}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });

  } catch (e) {
    console.error('❌ Error fetching history:', e);
    bot.sendMessage(chatId, '❌ Error fetching history.');
  }
});

// /progress command - Subject-wise progress
bot.onText(/\/progress/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  console.log(`📈 /progress from user ${telegramId}`);

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    });

    const progress = await db.getProgressReport(user.id);

    if (progress.length === 0) {
      bot.sendMessage(chatId, '📈 No progress data yet. Take a test first!', { parse_mode: 'MarkdownV2' });
      return;
    }

    let message = `${markdown.bold('📈 Subject-wise Progress')}\n\n`;

    // Group by subject
    const subjectProgress = {};
    progress.forEach(p => {
      if (!subjectProgress[p.subject]) {
        subjectProgress[p.subject] = { total: 0, correct: 0, chapters: [] };
      }
      subjectProgress[p.subject].total += p.total_attempted;
      subjectProgress[p.subject].correct += p.total_correct;
      subjectProgress[p.subject].chapters.push(p);
    });

    Object.entries(subjectProgress).forEach(([subject, data]) => {
      const accuracy = Math.round((data.correct / data.total) * 100);
      const emoji = accuracy >= 70 ? '✅' : accuracy >= 50 ? '📊' : '⚠️ ';
      message += `${emoji} ${markdown.bold(`${subject}:`)} ${accuracy}%\n`;
      message += `   ${data.total} questions attempted\n`;
      message += `   Weakest: ${data.chapters.slice(0, 2).map(c => c.chapter).join(', ')}\n\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });

  } catch (e) {
    console.error('❌ Error fetching progress:', e);
    bot.sendMessage(chatId, '❌ Error fetching progress.');
  }
});

// /stats command - User statistics
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  console.log(`📊 /stats from user ${telegramId}`);

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first_name: msg.from.first_name,
      last_name: msg.from.last_name
    });

    const bestScore = await db.getBestScore(user.id);

    const message = `
${markdown.bold('📊 Your Statistics')}

👤 ${markdown.bold('User:')} ${user.first_name || 'Student'} (@${user.username || 'N/A'})

📈 ${markdown.bold('Performance:')}
• Tests Taken: ${user.total_tests}
• Best Score: ${user.highest_score || 0}%
• All-time Best: ${bestScore}%

💎 ${markdown.bold('Status:')} ${user.is_paid ? '✅ Premium User' : '🆓 Free Tier'}

${!user.is_paid ? '\n💎 Upgrade to Premium for personalized plans!' : ''}

${markdown.bold('Joined:')} ${new Date(user.created_at).toLocaleDateString('en-IN')}
${markdown.bold('Last Active:')} ${new Date(user.last_active).toLocaleDateString('en-IN')}
    `;

    bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });

  } catch (e) {
    console.error('❌ Error fetching stats:', e);
    bot.sendMessage(chatId, '❌ Error fetching stats.');
  }
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
🔥 ${markdown.bold('JEE Session 2 AI Tutor - Help')}

${markdown.bold('Commands:')}
/start - Start the bot and get info
/test - Take FREE diagnostic test (10 questions)
/history - View your test history
/progress - Check subject-wise progress
/stats - Your statistics
/myplan - View your 7-day study plan (Premium)
/pay99 - Upgrade to Premium for ₹99
/help - Show this help message

${markdown.bold('How it works:')}
1. Take the diagnostic test (10 Qs, 10 mins)
2. AI analyzes your exact weaknesses
3. Upgrade to get personalized 7-day crash plan
4. Ace JEE Session 2!

${markdown.bold('Questions?')} Contact support
    `;

  bot.sendMessage(chatId, helpMessage, { parse_mode: 'MarkdownV2' });
});

// /cancel command - Cancel active test
bot.onText(/\/cancel/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  if (activeSessions[telegramId]) {
    delete activeSessions[telegramId];
    bot.sendMessage(chatId, '❌ Test cancelled. Send /test to start a new one.', { parse_mode: 'MarkdownV2' });
    console.log(`❌ Test cancelled by user ${telegramId}`);
  } else {
    bot.sendMessage(chatId, 'No active test to cancel.', { parse_mode: 'MarkdownV2' });
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('🔴 Polling error:', error.message);

  // Don't log 409 conflicts (multiple instances)
  if (!error.message.includes('409')) {
    console.error('🔴 Error details:', error);
  }
});

console.log('✅ JEE Crash Bot is READY!');
console.log(`📊 Bot: @${process.env.BOT_USERNAME || 'jee-crash-bot'}`);
console.log('✅ Waiting for users...');