require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// Storage files
const questionBankFile = 'question_bank.json';
let questionBank = [];

// Load existing question bank
if (fs.existsSync(questionBankFile)) {
  try {
    questionBank = JSON.parse(fs.readFileSync(questionBankFile, 'utf8'));
  } catch (e) {
    console.log('⚠️  Warning: question_bank.json corrupted, starting fresh');
    questionBank = [];
  }
}

// User sessions
let users = {};

// ============================================
// GLM-4.7 LLM API Wrapper
// ============================================

async function callGLM(prompt, systemPrompt = "You are JEE Main expert tutor for Session 2") {
  try {
    const response = await axios.post(
      'https://api.z.ai/api/paas/v4/chat/completions',
      {
        model: 'glm-4.7',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GLM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('🔴 GLM API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return 'AI temporarily unavailable. Score logged.';
  }
}

// ============================================
// AGENT 1: RESEARCHER - Generates Diagnostic Questions
// ============================================

async function researcherAgentGenerateQuestions() {
  console.log('🔬 Researcher Agent: Generating diagnostic questions...');

  const researcherPrompt = `
Generate 10 JEE Main diagnostic questions for Session 2 preparation:
- 4 Physics, 3 Math, 3 Chemistry
- Focus on high-weightage topics: Mechanics, Calculus, Organic Chemistry
- Mix difficulty: 3 easy, 4 medium, 3 hard
- Include topics likely repeated from Session 1
- Make questions JEE-style (conceptual, not just formula application)

RETURN ONLY valid JSON in this exact format:
[
  {
    "q": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "ans": 0,
    "subject": "Physics",
    "chapter": "Mechanics",
    "topic": "Kinematics",
    "difficulty": "medium"
  }
]

Do NOT include any explanation or text outside the JSON.
`;

  try {
    const response = await callGLM(
      researcherPrompt,
      "You are a JEE Main exam researcher. Generate high-quality diagnostic questions in JSON format only."
    );

    // Clean and parse JSON - Improved parser
    let jsonStr = response.trim();
    
    console.log('🔍 Raw LLM response (first 500 chars):', jsonStr.substring(0, 500));
    
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '');
    
    // Find JSON array
    const jsonStart = jsonStr.indexOf('[');
    const jsonEnd = jsonStr.lastIndexOf(']');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('🔴 No JSON array found in response');
      throw new Error('LLM did not return valid JSON array');
    }
    
    // Extract just the JSON part
    jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    
    console.log('🔍 Extracted JSON (first 300 chars):', jsonStr.substring(0, 300));

    const questions = JSON.parse(jsonStr);

    // Validate it's an array
    if (!Array.isArray(questions)) {
      console.error('🔴 Response is not an array:', typeof questions);
      throw new Error('LLM returned invalid format');
    }

    // Save to bank
    questionBank.push(...questions);
    fs.writeFileSync(questionBankFile, JSON.stringify(questionBank, null, 2));

    console.log(`✅ Researcher Agent: Generated ${questions.length} questions`);
    return questions;
  } catch (e) {
    console.error('🔴 Researcher Agent Error:', e.message);
    console.error('Failed to parse questions');
    console.error('Response that failed:', jsonStr);
    throw new Error('Failed to generate questions. Please try again.');
  }
}

// ============================================
// AGENT 2: ANALYST - Processes Test Results
// ============================================

async function analystAgentAnalyze(testData) {
  console.log('📊 Analyst Agent: Analyzing test results...');

  const analystPrompt = `
You are a JEE Main expert analyst. Analyze this student's test data:

STUDENT TEST DATA:
${JSON.stringify(testData, null, 2)}

JEE ANALYST TASK:
1. Calculate subject-wise scores (Physics/Math/Chemistry) out of 10
2. Identify the 3 WEAKEST chapters (score < 60%)
3. Detect error patterns (conceptual / calculation / silly mistake)
4. Estimate Session 2 marks impact if these weaknesses are fixed

OUTPUT FORMAT:
*📊 SCORE BREAKDOWN*
• Physics: X/10 (XX%)
• Mathematics: X/10 (XX%)
• Chemistry: X/10 (XX%)

*📉 WEAK CHAPTERS*
• Physics: [Chapter Name] - XX% (Error Pattern: concept/calc/silly)
• Mathematics: [Chapter Name] - XX% (Error Pattern: ...)
• Chemistry: [Chapter Name] - XX% (Error Pattern: ...)

*🎯 SESSION 2 IMPACT*
Fixing these weaknesses could add +18-25 marks to your JEE Main score.

Make the tone URGENT and CONVINCING. Use emojis. Make them want to upgrade for ₹99.

Return in Markdown format.
`;

  try {
    const analysis = await callGLM(
      analystPrompt,
      "You are a JEE Main performance analyst. Provide urgent, convincing analysis with clear recommendations."
    );

    console.log('✅ Analyst Agent: Analysis complete');
    return analysis;
  } catch (e) {
    console.error('🔴 Analyst Agent Error:', e.message);
    return 'Analysis temporarily unavailable. Please try again.';
  }
}

// ============================================
// AGENT 3: PLANNER - Creates Custom Study Plan
// ============================================

async function plannerAgentCreatePlan(analysis) {
  console.log('📅 Planner Agent: Creating 7-day crash plan...');

  const plannerPrompt = `
Based on this JEE student's analysis, create a PERSONALIZED 7-DAY JEE SESSION 2 CRASH PLAN:

STUDENT ANALYSIS:
${analysis}

CRASH PLAN REQUIREMENTS:
• Daily schedule: 30 targeted questions (not random)
• Include Mermaid diagrams for difficult concepts
• Use LaTeX for all equations
• Day 1-3: Focus on weakest chapters
• Day 4-5: Practice + mock tests
• Day 6: Revision + formula sheets
• Day 7: Full mock test
• Include estimated Session 2 percentile after completion
• Add motivational quotes

OUTPUT FORMAT:
*📅 DAY 1 - [Focus Chapter]*

🎯 Targets:
• 30 questions on [Topic]
• 2 Mermaid diagrams for [Concept]
• Formula sheet

📖 Resources:
• NCERT Exercise X.Y
• Previous Year Questions: 20XX Q12, Q25

*💡 Motivation*
"Quote"

[Repeat for all 7 days]

*📈 Expected Session 2 Percentile*
XX.XX percentile if plan followed

Return in Markdown format with emojis.
`;

  try {
    const plan = await callGLM(
      plannerPrompt,
      "You are a JEE Main study planner. Create actionable, day-by-day study plans with clear targets and resources."
    );

    console.log('✅ Planner Agent: 7-day plan created');
    return plan;
  } catch (e) {
    console.error('🔴 Planner Agent Error:', e.message);
    return 'Plan generation temporarily unavailable. Please try again.';
  }
}

// ============================================
// TELEGRAM BOT COMMANDS
// ============================================

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  users[chatId] = { step: 'welcome' };

  const welcomeMessage = `
🔥 *JEE Session 2 AI Tutor* 🔥

*AI-Powered JEE Main Preparation*

🎯 *What I do:*
• AI analyzes your exact mistakes from Session 1
• Creates personalized 7-day crash plan
• Predicts your Session 2 percentile
• Focuses on high-weightage topics

🚀 *Get Started:*
Send /test for a FREE diagnostic test (10 questions, 10 mins)

📊 *After the test:*
• Get detailed analysis of weak chapters
• See your error patterns
• Understand Session 2 marks impact
• Unlock full 7-day crash plan for ₹99

*Powered by GLM-4.7 AI*
  `;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// /test command - Researcher Agent generates questions
bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, '🧠 *Researcher AI* is scanning Session 1 syllabus + PYQs...\nGenerating your diagnostic test...', { parse_mode: 'Markdown' });

  try {
    const questions = await researcherAgentGenerateQuestions();

    users[chatId] = {
      step: 'test',
      questions: questions,
      qIndex: 0,
      answers: {},
      startTime: Date.now()
    };

    // Send first question
    sendQuestion(chatId, 0);
  } catch (e) {
    console.error('Error generating test:', e);
    bot.sendMessage(chatId, '❌ Error generating test. Please try again with /test');
  }
});

// Send question with inline keyboard
function sendQuestion(chatId, qIndex) {
  const user = users[chatId];
  if (!user || !user.questions || qIndex >= user.questions.length) {
    return;
  }

  const q = user.questions[qIndex];
  const keyboard = {
    inline_keyboard: q.options.map((opt, i) => [
      { text: opt, callback_data: `ans_${qIndex}_${i}` }
    ])
  };

  bot.sendMessage(
    chatId,
    `*Q${qIndex + 1}/${user.questions.length}* (${q.subject} - ${q.chapter})\n\n${q.q}`,
    { reply_markup: keyboard, parse_mode: 'Markdown' }
  );
}

// Handle answer selection
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data.split('_');

  if (data[0] === 'ans') {
    const qIndex = parseInt(data[1]);
    const ansIndex = parseInt(data[2]);

    // Save answer
    if (users[chatId]) {
      users[chatId].answers[qIndex] = ansIndex;
    }

    // Answer callback
    await bot.answerCallbackQuery(query.id);

    // Check if more questions or show analysis
    if (qIndex < users[chatId].questions.length - 1) {
      // Send next question
      sendQuestion(chatId, qIndex + 1);
    } else {
      // All questions answered - analyze
      bot.sendMessage(chatId, '🤖 *AI Analyst* is processing your mistakes...\n\nThis may take 10-15 seconds...', { parse_mode: 'Markdown' });

      // Run Analyst Agent
      setTimeout(async () => {
        await analyzeTestAndShowResults(chatId);
      }, 1000);
    }
  }
});

// Analyze test and show results
async function analyzeTestAndShowResults(chatId) {
  try {
    const user = users[chatId];
    if (!user || !user.questions) {
      return;
    }

    // Prepare test data for analyst
    const testData = user.questions.map((q, i) => ({
      question: q.q,
      given_ans: q.options[user.answers[i]],
      correct_ans: q.options[q.ans],
      is_correct: user.answers[i] === q.ans,
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      difficulty: q.difficulty
    }));

    // Calculate score
    const correctAnswers = testData.filter(t => t.is_correct).length;
    const score = correctAnswers;
    const percentage = Math.round((score / testData.length) * 100);

    user.testData = testData;
    user.score = score;
    user.percentage = percentage;

    // Generate analysis with Analyst Agent
    const analysis = await analystAgentAnalyze(testData);

    user.analysis = analysis;

    // Show results
    const resultMessage = `
*✅ TEST COMPLETE*

📊 *Your Score: ${score}/10 (${percentage}%)*

${analysis}

💎 *Unlock Full 7-Day Crash Plan* ₹99

Send /pay99 to get:
• 100+ targeted questions based on YOUR weaknesses
• Daily study schedule with mermaid diagrams
• Formula sheets and PYQs
• Session 2 percentile predictor

*Don't guess. Target exactly what you need.*
    `;

    bot.sendMessage(chatId, resultMessage, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error('Error analyzing test:', e);
    bot.sendMessage(chatId, '❌ Error analyzing your test. Please try again.');
  }
}

// /pay99 command - Payment flow
bot.onText(/\/pay99/, async (msg) => {
  const chatId = msg.chat.id;

  if (!users[chatId] || !users[chatId].analysis) {
    bot.sendMessage(chatId, '❌ Please complete the diagnostic test first with /test');
    return;
  }

  // For now, simulate payment
  const paymentMessage = `
💳 *Payment Gateway*

*7-Day JEE Session 2 Crash Plan*
Amount: ₹99

🔗 *Payment Link Coming Soon...*

⚠️ *For Testing:*
Reply /paid to simulate successful payment
  `;

  bot.sendMessage(chatId, paymentMessage, { parse_mode: 'Markdown' });
});

// /paid command - Simulated payment for testing
bot.onText(/\/paid/, async (msg) => {
  const chatId = msg.chat.id;

  if (!users[chatId] || !users[chatId].analysis) {
    bot.sendMessage(chatId, '❌ Please complete the diagnostic test first with /test');
    return;
  }

  bot.sendMessage(chatId, '📅 *Planner Agent* is creating your personalized 7-day crash plan...\n\nThis may take 15-20 seconds...', { parse_mode: 'Markdown' });

  // Generate plan with Planner Agent
  setTimeout(async () => {
    try {
      const plan = await plannerAgentCreatePlan(users[chatId].analysis);

      const finalMessage = `
*✅ UNLOCKED: Your 7-Day Crash Plan*

${plan}

💡 *Tips:*
• Follow the daily schedule religiously
• Solve all 210 questions in the plan
• Revise formula sheets daily
• Take the final mock on Day 7

📣 *Share with Friends:*
Share this bot: https://t.me/${process.env.BOT_USERNAME || 'your_bot'}?start=ref_${chatId}

Good luck for JEE Session 2! 🚀
      `;

      bot.sendMessage(chatId, finalMessage, { parse_mode: 'Markdown' });
    } catch (e) {
      console.error('Error generating plan:', e);
      bot.sendMessage(chatId, '❌ Error generating your plan. Please try again.');
    }
  }, 1500);
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const helpMessage = `
🔥 *JEE Session 2 AI Tutor - Help*

*Commands:*
/start - Start the bot and get info
/test - Take FREE diagnostic test (10 questions)
/pay99 - Unlock 7-day crash plan (₹99)
/help - Show this help message

*How it works:*
1. Take the diagnostic test (10 Qs, 10 mins)
2. AI analyzes your exact weaknesses
3. Get personalized 7-day crash plan
4. Ace JEE Session 2!

*Questions?* Contact: @${process.env.SUPPORT_USERNAME}
  `;

  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('🔴 Polling error:', error.message);
});

// Success message
console.log('🚀 JEE Crash Bot is LIVE!');
console.log(`📊 Bot: @${process.env.BOT_USERNAME || 'your_bot'}`);
console.log('✅ Waiting for users...');
