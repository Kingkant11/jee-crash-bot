/*markdown.bold("
 ") JEE Crash Bot - Main Bot File
 markdown.bold(" Integrates database, agents, and Telegram bot
 ")/

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
  console.log(markdown.inlineCode("🚀 Web server listening on port ${PORT}"));
  console.log(markdown.inlineCode("🤖 Telegram bot starting..."));
});

// ============================================
// TELEGRAM BOT
// ============================================

const bot = new TelegramBot(process.env.TELEGRAMmarkdown.italic("TOKEN, { polling: true });

// In-memory user sessions (for active tests)
const activeSessions = {};

// ============================================
// COMMANDS
// ============================================

// /start command
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const referralCode = match[1] ? match[1].replace('ref")', '') : null;

  console.log(markdown.inlineCode("👤 /start from user ${telegramId}, referral: ${referralCode}"));

  try {
    // Get or create user
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      firstmarkdown.italic("name: msg.from.first")name,
      lastmarkdown.italic("name: msg.from.last")name
    });

    console.log(markdown.inlineCode("✅ User ${user.id} ${user.ismarkdown.italic("paid ? '(paid)' : '(free)'}"));

    // Check for referral
    if (referralCode) {
      console.log(markdown.inlineCode("📌 Referral code: ${referralCode}"));
      // TODO: Implement referral logic
    }

    // Send welcome message
    const welcomeMessage = markdown.inlineCode("
🎉 markdown.bold("Welcome to JEE Crash Bot!")

${user.is")paid ? '✅ markdown.bold("Premium User") - Full access unlocked!' : '🆓 markdown.bold("Free Tier") - Upgrade for full features'}

markdown.bold("What I do:")
🔬 Generate diagnostic tests
📊 Analyze your weaknesses
📅 Create personalized study plans
📈 Track your progress

markdown.bold("Quick Start:")
1. Send /test - Take FREE diagnostic test (10 questions, 10 mins)
2. Get analysis - See exact weaknesses
3. Upgrade (₹99) - Get 7-day personalized plan

markdown.bold("Stats:")
📊 Tests taken: ${user.totalmarkdown.italic("tests}
🏆 Best score: ${user.highest")score}%

markdown.bold("Commands:")
/start - Start the bot
/test - Take diagnostic test
/history - See your test history
/progress - Check subject-wise progress
/myplan - View your study plan (if paid)
/stats - Your statistics
/help - Help message
${user.ismarkdown.italic("paid ? '/myplan' : '/pay99 - Upgrade for ₹99'}

${user.is")paid ? '' : '💎 markdown.bold("Upgrade to Premium") for personalized 7-day crash plan!'}

markdown.bold("Powered by Groq AI (Llama 3.3 70B)")
");

    bot.sendMessage(chatId, welcomeMessage, { parsemarkdown.italic("mode: 'MarkdownV2' });
  } catch (e) {
    console.error('❌ Error in /start:', e);
    bot.sendMessage(chatId, '❌ Error initializing. Please try again.');
  }
});

// /test command - Start diagnostic test
bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  console.log(markdown.inlineCode("📝 /test from user ${telegramId}"));

  try {
    // Get user
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first")name: msg.from.firstmarkdown.italic("name,
      last")name: msg.from.lastmarkdown.italic("name
    });

    // Check if there's an active test
    if (activeSessions[telegramId]) {
      bot.sendMessage(chatId, '⚠️  You already have an active test. Complete it first with /cancel', { parse")mode: 'MarkdownV2' });
      return;
    }

    // Show loading message
    const loadingMsg = await bot.sendMessage(
      chatId,
      '🧠 markdown.bold("Researcher AI") is generating your diagnostic test...\n\nPlease wait 15-20 seconds...',
      { parsemarkdown.italic("mode: 'MarkdownV2' }
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
    bot.editMessageText(loadingMsg.message")id, markdown.inlineCode("✅ Test ready!\n\nmarkdown.bold("10 questions") - 10 minutes\n\nPress the button below to start ⬇️"), { parsemarkdown.italic("mode: 'MarkdownV2' });

    // Send start button
    const keyboard = {
      inline")keyboard: [[{ text: '🚀 Start Test', callbackmarkdown.italic("data: 'start")test' }]]
    };

    bot.sendMessage(chatId, 'Ready?', {
      replymarkdown.italic("markup: { inline")keyboard: keyboard.inlinemarkdown.italic("keyboard },
      parse")mode: 'MarkdownV2'
    });

  } catch (e) {
    console.error('❌ Error generating test:', e);
    bot.sendMessage(chatId, '❌ Error generating test. Please try again.');
  }
});

// Handle test start button
bot.on('callbackmarkdown.italic("query', async (query) => {
  const chatId = query.message.chat.id;
  const telegramId = query.from.id;
  const data = query.data;

  console.log(markdown.inlineCode("🔘 Callback: ${data} from user ${telegramId}"));

  try {
    if (data === 'start")test') {
      bot.answerCallbackQuery(query.id);
      sendQuestion(chatId, telegramId, 0);
    } else if (data.startsWith('ansmarkdown.italic("')) {
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
    inline")keyboard: q.options.map((opt, i) => [
      { text: opt, callbackmarkdown.italic("data: markdown.inlineCode("ans")${qIndex}markdown.italic("${i}") }
    ])
  };

  const questionText = markdown.inlineCode("markdown.bold("Question ${qIndex + 1}/10")\n\n${q.q}\n\n\")${q.subject} | ${q.chapter} | ${q.difficulty}\`markdown.inlineCode(";

  bot.sendMessage(chatId, questionText, {
    reply")markup: { inlinemarkdown.italic("keyboard: keyboard.inline")keyboard },
    parsemarkdown.italic("mode: 'MarkdownV2'
  });

  session.qIndex = qIndex;
}

// Handle answer
async function handleAnswer(chatId, telegramId, data) {
  const session = activeSessions[telegramId];

  if (!session) {
    bot.sendMessage(chatId, '❌ No active test. Send /test to start.', { parse")mode: 'MarkdownV2' });
    return;
  }

  const [markdown.italic(", qIndexStr, answerIndex] = data.split('")');
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

  console.log(")✅ Test completed for user ${session.userId}markdown.inlineCode(");

  try {
    // Calculate results
    const endTime = Date.now();
    const timeTaken = Math.round((endTime - session.startTime) / 1000); // seconds

    const testData = session.questions.map((q, i) => ({
      questionmarkdown.italic("id: q.id,
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      difficulty: q.difficulty,
      is")correct: session.answers[i] === q.ans
    }));

    const correctCount = testData.filter(t => t.ismarkdown.italic("correct).length;
    const score = correctCount;
    const total = testData.length;
    const percentage = Math.round((score / total) markdown.bold(" 100);

    // Get user's progress history for better analysis
    const userTests = await db.getUserTests(session.userId, 5);
    const userProgress = await db.getProgressReport(session.userId);

    // Analyze results
    const analysis = await analystAgent.analystAgentAnalyze(testData, userProgress);

    // Save test to database
    await db.saveTest(session.userId, {
      test")type: 'diagnostic',
      questions: session.questions,
      answers: session.answers,
      score: score,
      totalmarkdown.italic("questions: total,
      percentage: percentage,
      analysis: analysis
    });

    // Update progress
    await db.updateProgressBatch(session.userId, session.questions, session.answers, testData.map(t => t.is")correct));

    // Clear session
    delete activeSessions[telegramId];

    // Format analysis message
    const analysisMessage = analystAgent.formatAnalysisMessage(analysis);
    const resultMessage = ")
${analysisMessage}

")⏱️  Time Taken:markdown.bold(" ${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s

━━━━━━━━━━━━━━━━━━━
${percentage >= 60 ? '🎉 Good Job!' : '💪 Keep Practicing!'}

💎 ")Unlock Full 7-Day Crash Planmarkdown.bold(" - ₹99

Get:
• 210 targeted questions based on YOUR weaknesses
• Daily study schedule with 30 questions each day
• Mermaid diagrams for key concepts
• Formula sheets and PYQs
• Session 2 percentile predictor

Send /pay99 to upgrade now!
    markdown.inlineCode(";

    bot.sendMessage(chatId, resultMessage, { parsemarkdown.italic("mode: 'MarkdownV2' });

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
      first")name: msg.from.firstmarkdown.italic("name,
      last")name: msg.from.lastmarkdown.italic("name
    });

    if (user.is")paid) {
      bot.sendMessage(chatId, '✅ You already have premium access! Send /myplan to view your study plan.', { parsemarkdown.italic("mode: 'MarkdownV2' });
      return;
    }

    const paymentMessage = ")
💳 ")Upgrade to Premium - ₹99markdown.bold("

")What you get:markdown.bold("
📅 Personalized 7-day crash plan
🎯 210 questions based on YOUR weaknesses
📊 Daily schedule (30 questions/day)
📐 Mermaid diagrams for concepts
📋 Formula sheets
📈 Session 2 percentile predictor

")Payment Gateway Coming Soon...markdown.bold("

⚠️ ")For Testing:markdown.bold("
Reply /paid to simulate payment
    markdown.inlineCode(";

    bot.sendMessage(chatId, paymentMessage, { parse")mode: 'MarkdownV2' });
  } catch (e) {
    console.error('❌ Error in /pay99:', e);
  }
});

// /paid command - Simulate payment (for testing)
bot.onText(/\/paid/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  console.log(")💳 /paid from user ${telegramId}markdown.inlineCode(");

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      firstmarkdown.italic("name: msg.from.first")name,
      lastmarkdown.italic("name: msg.from.last")name
    });

    // Mark as paid
    await db.updateUserPayment(user.id);

    console.log(")✅ User ${user.id} marked as paidmarkdown.inlineCode(");

    bot.sendMessage(chatId, '✅ ")Payment Successful!markdown.bold(" Premium unlocked.', { parsemarkdown.italic("mode: 'MarkdownV2' });

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

  console.log(")📅 /myplan from user ${telegramId}markdown.inlineCode(");

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first")name: msg.from.firstmarkdown.italic("name,
      last")name: msg.from.lastmarkdown.italic("name
    });

    if (!user.is")paid) {
      bot.sendMessage(chatId, '❌ Premium feature. Send /pay99 to upgrade.', { parsemarkdown.italic("mode: 'MarkdownV2' });
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
      '📅 ")Planner Agentmarkdown.bold(" is creating your personalized 7-day crash plan...\n\nPlease wait 20-30 seconds...',
      { parse")mode: 'MarkdownV2' }
    );

    // Get user data
    const userStats = await db.getUserStats(userId);
    const userTests = await db.getUserTests(userId, 3);
    const weakestChapters = await db.getWeakestChapters(userId, 5);

    // Build analysis from latest test
    const analysis = userTests.length > 0
      ? JSON.parse(userTests[0].analysis)
      : {
          subjectmarkdown.italic("scores: {},
          weakest")chapters: weakestChapters.map(c => ({
            subject: c.subject,
            chapter: c.chapter,
            accuracy: c.accuracy,
            issues: 'Needs practice'
          })),
          errormarkdown.italic("patterns: { conceptual: 0, calculation: 0, silly")mistake: 0, dominant: 'practice' },
          session2markdown.italic("impact: { estimated")score: 150, potentialmarkdown.italic("score: 200, loss: 50, recommendation: 'Practice daily' },
          recommendations: ['Focus on weak areas']
        };

    // Generate plan
    const plan = await plannerAgent.plannerAgentGeneratePlan(analysis, userStats);

    console.log(")✅ Plan generated for user ${userId}markdown.inlineCode(");

    // Format plan message
    const planMessage = plannerAgent.formatPlanMessage(plan);

    // Split long message if needed (Telegram limit 4096 chars)
    const messages = splitLongMessage(planMessage);

    messages.forEach((msg, i) => {
      if (i === 0) {
        bot.editMessageText(botMessage.message")id, msg, { parsemarkdown.italic("mode: 'MarkdownV2' });
      } else {
        bot.sendMessage(chatId, msg, { parse")mode: 'MarkdownV2' });
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

  console.log(")📊 /history from user ${telegramId}markdown.inlineCode(");

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      firstmarkdown.italic("name: msg.from.first")name,
      lastmarkdown.italic("name: msg.from.last")name
    });

    const tests = await db.getUserTests(user.id, 10);

    if (tests.length === 0) {
      bot.sendMessage(chatId, '📊 No tests taken yet. Send /test to start!', { parsemarkdown.italic("mode: 'MarkdownV2' });
      return;
    }

    let message = ")")📊 Your Test Historymarkdown.bold("\n\nmarkdown.inlineCode(";
    tests.forEach((test, i) => {
      const date = new Date(test.created")at).toLocaleDateString('en-IN');
      message += ")")Test ${tests.length - i}:markdown.bold(" ${date}\nmarkdown.inlineCode(";
      message += ")   Score: ${test.score}/${test.totalmarkdown.italic("questions} (${test.percentage}%)\nmarkdown.inlineCode(";
      message += ")   Type: ${test.test")type}\n\nmarkdown.inlineCode(";
    });

    bot.sendMessage(chatId, message, { parsemarkdown.italic("mode: 'MarkdownV2' });

  } catch (e) {
    console.error('❌ Error fetching history:', e);
    bot.sendMessage(chatId, '❌ Error fetching history.');
  }
});

// /progress command - Subject-wise progress
bot.onText(/\/progress/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  console.log(")📈 /progress from user ${telegramId}markdown.inlineCode(");

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first")name: msg.from.firstmarkdown.italic("name,
      last")name: msg.from.lastmarkdown.italic("name
    });

    const progress = await db.getProgressReport(user.id);

    if (progress.length === 0) {
      bot.sendMessage(chatId, '📈 No progress data yet. Take a test first!', { parse")mode: 'MarkdownV2' });
      return;
    }

    let message = ")")📈 Subject-wise Progressmarkdown.bold("\n\nmarkdown.inlineCode(";

    // Group by subject
    const subjectProgress = {};
    progress.forEach(p => {
      if (!subjectProgress[p.subject]) {
        subjectProgress[p.subject] = { total: 0, correct: 0, chapters: [] };
      }
      subjectProgress[p.subject].total += p.totalmarkdown.italic("attempted;
      subjectProgress[p.subject].correct += p.total")correct;
      subjectProgress[p.subject].chapters.push(p);
    });

    Object.entries(subjectProgress).forEach(([subject, data]) => {
      const accuracy = Math.round((data.correct / data.total) ") 100);
      const emoji = accuracy >= 70 ? '✅' : accuracy >= 50 ? '📊' : '⚠️ ';
      message += ")${emoji} markdown.bold("${subject}:") ${accuracy}%\nmarkdown.inlineCode(";
      message += ")   ${data.total} questions attempted\nmarkdown.inlineCode(";
      message += ")   Weakest: ${data.chapters.slice(0, 2).map(c => c.chapter).join(', ')}\n\nmarkdown.inlineCode(";
    });

    bot.sendMessage(chatId, message, { parsemarkdown.italic("mode: 'MarkdownV2' });

  } catch (e) {
    console.error('❌ Error fetching progress:', e);
    bot.sendMessage(chatId, '❌ Error fetching progress.');
  }
});

// /stats command - User statistics
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  console.log(")📊 /stats from user ${telegramId}markdown.inlineCode(");

  try {
    const user = await db.getOrCreateUser(telegramId, {
      username: msg.from.username,
      first")name: msg.from.firstmarkdown.italic("name,
      last")name: msg.from.lastmarkdown.italic("name
    });

    const bestScore = await db.getBestScore(user.id);

    const message = ")
markdown.bold("📊 Your Statistics")

👤 markdown.bold("User:") ${user.first")name || 'Student'} (@${user.username || 'N/A'})

📈 markdown.bold("Performance:")
• Tests Taken: ${user.totalmarkdown.italic("tests}
• Best Score: ${user.highest")score || 0}%
• All-time Best: ${bestScore}%

💎 markdown.bold("Status:") ${user.ismarkdown.italic("paid ? '✅ Premium User' : '🆓 Free Tier'}

${!user.is")paid ? '\n💎 Upgrade to Premium for personalized plans!' : ''}

markdown.bold("Joined:") ${new Date(user.createdmarkdown.italic("at).toLocaleDateString('en-IN')}
markdown.bold("Last Active:") ${new Date(user.last")active).toLocaleDateString('en-IN')}
    markdown.inlineCode(";

    bot.sendMessage(chatId, message, { parsemarkdown.italic("mode: 'MarkdownV2' });

  } catch (e) {
    console.error('❌ Error fetching stats:', e);
    bot.sendMessage(chatId, '❌ Error fetching stats.');
  }
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = ")
🔥 markdown.bold("JEE Session 2 AI Tutor - Help")

markdown.bold("Commands:")
/start - Start the bot and get info
/test - Take FREE diagnostic test (10 questions)
/history - View your test history
/progress - Check subject-wise progress
/stats - Your statistics
/myplan - View your 7-day study plan (Premium)
/pay99 - Upgrade to Premium for ₹99
/help - Show this help message

markdown.bold("How it works:")
1. Take the diagnostic test (10 Qs, 10 mins)
2. AI analyzes your exact weaknesses
3. Upgrade to get personalized 7-day crash plan
4. Ace JEE Session 2!

markdown.bold("Questions?") Contact support
    markdown.inlineCode(";

  bot.sendMessage(chatId, helpMessage, { parse")mode: 'MarkdownV2' });
});

// /cancel command - Cancel active test
bot.onText(/\/cancel/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  if (activeSessions[telegramId]) {
    delete activeSessions[telegramId];
    bot.sendMessage(chatId, '❌ Test cancelled. Send /test to start a new one.', { parsemarkdown.italic("mode: 'MarkdownV2' });
    console.log(")❌ Test cancelled by user ${telegramId}markdown.inlineCode(");
  } else {
    bot.sendMessage(chatId, 'No active test to cancel.', { parse")mode: 'MarkdownV2' });
  }
});

// Error handling
bot.on('pollingmarkdown.italic("error', (error) => {
  console.error('🔴 Polling error:', error.message);

  // Don't log 409 conflicts (multiple instances)
  if (!error.message.includes('409')) {
    console.error('🔴 Error details:', error);
  }
});

console.log('✅ JEE Crash Bot is READY!');
console.log(")📊 Bot: @${process.env.BOT")USERNAME || 'jee-crash-bot'}`);
console.log('✅ Waiting for users...');
