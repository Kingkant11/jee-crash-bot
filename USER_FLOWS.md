# JEE Crash Bot - User Flows Documentation

## Overview

This document details the complete user flows and interactions within the JEE Crash Bot system. Each flow describes the user journey from initiation to completion.

---

## 1. New User Onboarding Flow

### Flow Diagram
```
User → /start → Bot Welcome → User Profile Created → Welcome Message
```

### Detailed Steps

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User sends `/start` | Bot processes command |
| 2 | Bot checks if user exists | If no: Create new user record |
| 3 | Generate unique referral code | 8-character alphanumeric code |
| 4 | Capture user metadata | Telegram ID, username, first name, last name |
| 5 | Store in database | Users table with timestamp |
| 6 | Send welcome message | Personalized greeting with user info |

### Welcome Message Components
- Greeting with user name
- User status (Free/Premium)
- Feature overview
- Quick start guide
- Statistics (0 tests, 0% best score)
- Available commands list
- Premium upgrade CTA (if free user)

### Edge Cases
- **Existing user**: Updates last_active timestamp, shows existing stats
- **Referral code in /start**: Logs referral (not yet implemented)
- **Missing user data**: Uses default values for missing fields

### Database Operations
```sql
-- Check if user exists
SELECT * FROM users WHERE telegram_id = ?;

-- Insert new user
INSERT INTO users (telegram_id, username, first_name, last_name, referral_code)
VALUES (?, ?, ?, ?, ?);
```

---

## 2. Diagnostic Test Flow

### Flow Diagram
```
User → /test → Check Active Test → Generate Questions → Display Test Start → 
Answer Questions 1-10 → Calculate Results → Analyze Performance → Display Results
```

### Detailed Steps

#### 2.1 Test Initiation

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User sends `/test` | Bot validates user |
| 2 | Check for active test | If active: Show error |
| 3 | Show loading message | "Researcher AI generating test..." |
| 4 | Call Researcher Agent | Generate 10 questions via Groq API |
| 5 | Save questions to DB | question_bank table |
| 6 | Create session object | Store in memory (activeSessions) |
| 7 | Update loading message | "Test ready! 10 questions - 10 minutes" |
| 8 | Send start button | Inline keyboard with "🚀 Start Test" |

#### 2.2 Test Taking

| Step | Action | System Response |
|------|--------|-----------------|
| 9 | User clicks "Start Test" | bot.on('callback_query') triggered |
| 10 | Send Question 1 | Format with options and inline keyboard |
| 11 | User selects option | Callback received |
| 12 | Save answer to session | Store in session.answers |
| 13 | Send Question 2 | Continue pattern |
| 14-20 | Repeat for Questions 3-10 | Same process |
| 21 | After Q10: Trigger completeTest() | Calculate and analyze |

#### 2.3 Question Display Format
```
📌 Question X/10

[Question text]

`Physics | Mechanics | Kinematics`

[Option A] [Option B] [Option C] [Option D]
```

#### 2.4 Test Completion & Analysis

| Step | Action | System Response |
|------|--------|-----------------|
| 22 | Calculate results | Correct answers, percentage |
| 23 | Track time taken | End time - Start time |
| 24 | Get user progress history | Last 5 tests |
| 25 | Call Analyst Agent | Analyze via Groq API |
| 26 | Save test to DB | tests table |
| 27 | Update progress | progress table (batch update) |
| 28 | Clear session | Remove from activeSessions |
| 29 | Send results message | Formatted analysis with upgrade CTA |

### Results Message Components
- **Subject-wise Performance**: Physics, Math, Chemistry scores
- **Weakest Chapters**: Top 3 weak areas with accuracy
- **Error Patterns**: Conceptual, Calculation, Silly Mistakes counts
- **Session 2 Impact**: Estimated score, potential score, marks at risk
- **Recommendations**: 3-5 actionable study tips
- **Time Taken**: Minutes and seconds
- **Upgrade CTA**: "Unlock Full 7-Day Crash Plan - ₹99"

### Edge Cases
- **User cancels mid-test**: `/cancel` command removes session
- **AI fails to generate questions**: Returns error, suggests retry
- **AI fails to analyze**: Uses fallback rule-based analysis
- **Multiple test attempts**: Each test saved separately

### Database Operations
```sql
-- Save test result
INSERT INTO tests (user_id, test_type, questions, answers, score, 
                   total_questions, percentage, analysis)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- Update progress for each question
UPDATE progress SET questions_attempted = questions_attempted + 1,
                   questions_correct = questions_correct + 1
WHERE user_id = ? AND subject = ? AND chapter = ?;
```

---

## 3. Payment & Premium Flow

### Flow Diagram
```
User → /pay99 → Show Payment Info → User pays (/paid) → Update Payment Status → 
Unlock Premium → Generate Plan → Send Plan
```

### Detailed Steps

#### 3.1 Payment Information

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User sends `/pay99` | Check if user already paid |
| 2 | If paid: Show message | "You already have premium!" |
| 3 | If not paid: Display payment info | Benefits list, price, payment gateway info |
| 4 | Show testing instruction | "Reply /paid to simulate payment" |

#### 3.2 Payment Processing

| Step | Action | System Response |
|------|--------|-----------------|
| 5 | User sends `/paid` | Check if already paid |
| 6 | If paid: Show error | "Already have premium" |
| 7 | If not: Update DB | Set is_paid = 1, payment_date = NOW() |
| 8 | Send success message | "✅ Payment Successful! Premium unlocked." |
| 9 | Trigger plan generation | After 2-second delay |
| 10 | Call Planner Agent | Generate 7-day plan via Groq API |
| 11 | Format plan message | Split if needed for Telegram limit |
| 12 | Send plan to user | Edit initial message, send additional if needed |

### Payment Message Components
```
💳 Upgrade to Premium - ₹99

What you get:
📅 Personalized 7-day crash plan
🎯 210 questions based on YOUR weaknesses
📊 Daily schedule (30 questions/day)
📐 Mermaid diagrams for concepts
📋 Formula sheets
📈 Session 2 percentile predictor

Payment Gateway Coming Soon...

⚠️ For Testing:
Reply /paid to simulate payment
```

### Study Plan Message Components (Day X)
```
━━━ DAY X ━━━
📌 [Focus Area]
📊 30 questions:
📘Physics: 10 📐Math: 10 🧪Chemistry: 10

📚 Key Topics: [Chapter1] [Chapter2] [Chapter3]

📐 Formulas: [formula1], [formula2], [formula3]

💡 [Study tip for the day]
```

### Edge Cases
- **User already paid**: Redirects to /myplan
- **Payment simulation only**: No real money processing
- **Plan generation fails**: Uses fallback rule-based plan
- **Long plan message**: Splits into multiple messages

### Database Operations
```sql
-- Update payment status
UPDATE users SET is_paid = 1, payment_date = CURRENT_TIMESTAMP
WHERE id = ?;
```

---

## 4. Study Plan View Flow

### Flow Diagram
```
User → /myplan → Check Payment Status → If paid: Fetch Data → Generate/Retrieve Plan → Display Plan
```

### Detailed Steps

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User sends `/myplan` | Check if user is paid |
| 2 | If not paid: Show error | "Premium feature. Send /pay99 to upgrade." |
| 3 | If paid: Get user stats | From users table |
| 4 | Get recent tests | Last 3 tests from tests table |
| 5 | Get weakest chapters | Top 5 from progress table |
| 6 | Build analysis object | From latest test or defaults |
| 7 | Call Planner Agent | Generate plan via Groq API |
| 8 | Format plan message | Telegram-ready with MarkdownV2 |
| 9 | Split if needed | Handle 4096 char limit |
| 10 | Send plan message | Edit loading message, send additional |

### Edge Cases
- **No tests taken**: Uses default analysis
- **First-time paid user**: Generates new plan
- **Returning paid user**: Regenerates plan (no caching yet)
- **Plan too long**: Splits into multiple messages

---

## 5. Test History Flow

### Flow Diagram
```
User → /history → Fetch Tests → Format List → Display History
```

### Detailed Steps

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User sends `/history` | Get user ID |
| 2 | Fetch last 10 tests | From tests table, ordered DESC |
| 3 | Check if tests exist | If none: "No tests taken yet" |
| 4 | Format each test entry | Date, score, type |
| 5 | Send history message | List of all tests |

### History Message Format
```
📊 Your Test History

Test 3: 22/02/2026
   Score: 7/10 (70%)
   Type: diagnostic

Test 2: 20/02/2026
   Score: 5/10 (50%)
   Type: diagnostic

Test 1: 18/02/2026
   Score: 6/10 (60%)
   Type: diagnostic
```

---

## 6. Progress Tracking Flow

### Flow Diagram
```
User → /progress → Fetch Progress Data → Group by Subject → Calculate Accuracy → Display Progress
```

### Detailed Steps

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User sends `/progress` | Get user ID |
| 2 | Fetch all progress records | From progress table |
| 3 | Check if data exists | If none: "No progress data yet" |
| 4 | Group by subject | Physics, Math, Chemistry |
| 5 | Calculate totals per subject | Questions attempted, correct |
| 6 | Calculate accuracy | Percentage per subject |
| 7 | Identify weakest chapters | Top 2 per subject |
| 8 | Format message | With emojis and formatting |
| 9 | Send progress message | Subject-wise breakdown |

### Progress Message Format
```
📈 Subject-wise Progress

✅ Physics: 75%
   20 questions attempted
   Weakest: Thermodynamics, Waves

📊 Math: 60%
   15 questions attempted
   Weakest: Calculus, Algebra

⚠️ Chemistry: 50%
   18 questions attempted
   Weakest: Organic, Physical
```

---

## 7. Statistics Flow

### Flow Diagram
```
User → /stats → Fetch User Data → Get Best Score → Format Stats → Display
```

### Detailed Steps

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User sends `/stats` | Get user ID |
| 2 | Fetch user record | From users table |
| 3 | Get best score | Calculate from tests table |
| 4 | Format statistics message | With user info and performance |
| 5 | Send stats message | Comprehensive user overview |

### Stats Message Format
```
📊 Your Statistics

👤 User: Aman (@aman_kant)

📈 Performance:
• Tests Taken: 5
• Best Score: 80%
• All-time Best: 85%

💎 Status: ✅ Premium User

Joined: 01/02/2026
Last Active: 22/02/2026
```

---

## 8. Help Command Flow

### Flow Diagram
```
User → /help → Display Help Message
```

### Detailed Steps

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User sends `/help` | N/A |
| 2 | Format help message | Commands list and descriptions |
| 3 | Send help message | Static content |

### Help Message Format
```
🔥 JEE Session 2 AI Tutor - Help

Commands:
/start - Start the bot and get info
/test - Take FREE diagnostic test (10 questions)
/history - View your test history
/progress - Check subject-wise progress
/stats - Your statistics
/myplan - View your 7-day study plan (Premium)
/pay99 - Upgrade to Premium for ₹99
/help - Show this help message

How it works:
1. Take the diagnostic test (10 Qs, 10 mins)
2. AI analyzes your exact weaknesses
3. Upgrade to get personalized 7-day crash plan
4. Ace JEE Session 2!

Questions? Contact support
```

---

## 9. Cancel Test Flow

### Flow Diagram
```
User → /cancel → Check Active Session → If exists: Remove → Send Confirmation
```

### Detailed Steps

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | User sends `/cancel` | Check activeSessions for user |
| 2 | If session exists | Delete from activeSessions |
| 3 | Send confirmation | "Test cancelled. Send /test to start a new one." |
| 4 | If no session exists | Send message: "No active test to cancel." |

---

## 10. Error Handling Flow

### Common Error Scenarios

#### 10.1 API Errors
```
User Action → Bot attempts API call → API fails → 
Log error → Show user-friendly message → Suggest retry
```

**User Message**: "❌ Error generating test. Please try again."

#### 10.2 Database Errors
```
User Action → DB operation fails → 
Log error → Show error message → Attempt recovery or notify support
```

**User Message**: "❌ Error saving data. Please try again or contact support."

#### 10.3 Telegram API Errors
```
Bot attempts to send message → Telegram API fails → 
Log error (ignore 409 conflicts) → Retry or skip
```

#### 10.4 Parsing Errors
```
AI returns invalid JSON → 
Log error → Attempt JSON extraction → 
If fails: Use fallback logic → Log fallback usage
```

### Error Recovery Strategies
1. **AI API Failure**: Use rule-based fallbacks
2. **Database Connection**: Retry with backoff
3. **Telegram Rate Limit**: Queue messages, respect limits
4. **Invalid User Input**: Show help, guide correct usage

---

## 11. Admin/Monitoring Flow

### Health Check Flow
```
External Service → GET /health → Return JSON status → Service OK/Error
```

### Health Response Format
```json
{
  "status": "ok",
  "timestamp": "2024-02-22T10:30:00.000Z",
  "uptime": 3600
}
```

---

## 12. Data Flow Summary

### 12.1 User Data Flow
```
Telegram User → Bot → Database (Users Table) → Bot Response
```

### 12.2 Test Data Flow
```
User → /test → Bot → Researcher Agent → Groq API → 
Questions → DB (Question Bank) → Bot → User (Interactive)
→ User Answers → Bot → Analyst Agent → Groq API → 
Analysis → DB (Tests + Progress) → Bot → User (Results)
```

### 12.3 Payment Data Flow
```
User → /pay99 → Bot → Display Info → User → /paid → 
Bot → DB (Users: is_paid = 1) → Planner Agent → Groq API → 
Plan → Bot → User (7-Day Plan)
```

---

## 13. State Management

### In-Memory State (activeSessions)
```javascript
{
  [telegramId]: {
    userId: 123,
    questions: [/* 10 questions */],
    answers: { 0: 1, 1: 2, /* ... */ },
    qIndex: 3,
    startTime: 1708624200000,
    testType: 'diagnostic'
  }
}
```

### Database State
- **Users**: Persistent user profiles
- **Tests**: Complete test history with analysis
- **Progress**: Chapter-wise performance metrics
- **Question Bank**: Generated questions library

---

## 14. Integration Points

### 14.1 Groq API
- **Researcher Agent**: Question generation
- **Analyst Agent**: Performance analysis
- **Planner Agent**: Study plan creation

### 14.2 Telegram Bot API
- **Polling**: Continuous message retrieval
- **Messages**: Send text, inline keyboards
- **Callbacks**: Handle button interactions

### 14.3 SQLite Database
- **CRUD Operations**: All user/test data persistence
- **JSON Storage**: Questions, answers, analysis
- **Indexes**: Performance optimization

---

## 15. Performance Considerations

### Response Time Targets
- `/start`: < 500ms
- `/test` (generation): < 20s
- `/test` (questions): < 2s each
- Analysis: < 10s
- Plan generation: < 30s

### Optimization Strategies
- Database indexes for queries
- In-memory caching for active tests
- Parallel processing where possible
- Fallback logic for AI failures

---

## 16. User Experience Guidelines

### 16.1 Message Formatting
- Use MarkdownV2 for rich text
- Include emojis for visual appeal
- Keep messages concise and scannable
- Use bullet points for lists
- Bold key information

### 16.2 Error Messages
- Clear and actionable
- Include suggested next steps
- Avoid technical jargon
- Provide help command reference

### 16.3 Progressive Disclosure
- Show essentials first
- Provide "Show more" options
- Don't overwhelm new users
- Guide through features gradually

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-02-22 | Initial user flows documentation |