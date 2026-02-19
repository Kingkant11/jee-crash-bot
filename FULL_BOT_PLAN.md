# 🚀 JEE Crash Bot - Full-Fledged Bot Development Plan

## 📋 PHASE 1: PLANNING

---

## 1.1 Current Status Assessment

✅ **Working:**
- Telegram bot integration
- Groq API (Llama 3.3 70B)
- Express health check server
- `/start` command
- `/test` command - generates 10 diagnostic questions
- Question delivery with inline keyboard
- Test completion and scoring
- Basic analysis
- JSON parsing

❌ **Missing:**
- Database (user persistence)
- User accounts & authentication
- Progress tracking
- Payment integration (Razorpay)
- 7-day personalized plan generation
- Session management
- Error handling & recovery
- Analytics & monitoring
- Admin panel
- Referral system
- Multiple test difficulty levels

---

## 1.2 Core Features to Build

### Essential (MVP - Week 1)

| # | Feature | Priority | Complexity |
|---|----------|-----------|------------|
| 1 | **Database Integration** | 🔴 Critical | Medium |
| 2 | **User Sessions & Persistence** | 🔴 Critical | Medium |
| 3 | **Progress Tracking** | 🔴 Critical | Medium |
| 4 | **Enhanced Analysis** | 🔴 Critical | Medium |
| 5 | **7-Day Plan Generator** | 🔴 Critical | High |
| 6 | **Payment Integration (Razorpay)** | 🟡 High | High |
| 7 | **Error Handling & Logging** | 🟡 High | Medium |

### Important (Growth - Week 2)

| # | Feature | Priority | Complexity |
|---|----------|-----------|------------|
| 8 | **Multiple Difficulty Levels** | 🟡 High | Low |
| 9 | **Question Bank Management** | 🟡 High | Medium |
| 10 | **Admin Commands** | 🟡 High | Medium |
| 11 | **Analytics Dashboard** | 🟡 High | Medium |
| 12 | **Email Notifications** | 🟢 Medium | Medium |

### Nice to Have (Polish - Week 3)

| # | Feature | Priority | Complexity |
|---|----------|-----------|------------|
| 13 | Referral System | 🟢 Medium | High |
| 14 | Leaderboard | 🟢 Medium | Medium |
| 15 | Daily Practice Questions | 🟢 Medium | Low |
| 16 | Mock Test with Timer | 🟢 Medium | Medium |
| 17 | Subject-wise Plans | 🟢 Medium | High |
| 18 | WhatsApp Version | 🟢 Low | High |

---

## 1.3 Tech Stack

### Current
- Runtime: Node.js 22.22.0
- Bot Framework: node-telegram-bot-api
- LLM Provider: Groq (Llama 3.3 70B)
- Web Server: Express
- Deployment: Render (Free Web Service)

### New Additions
| Component | Technology | Purpose |
|-----------|-------------|---------|
| Database | SQLite3 (or MongoDB) | User data, tests, progress |
| ORM | Better-SQLite3 | Database queries |
| Payment | Razorpay SDK | ₹99 payment flow |
| Scheduling | node-cron | Daily questions, reminders |
| Analytics | custom | Track usage, revenue |
| Logging | Winston | Structured logging |

---

## 🏗️ PHASE 2: DESIGN

---

## 2.1 Database Schema

### users table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP,
  total_tests INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT 0,
  payment_date TIMESTAMP,
  referral_code TEXT UNIQUE,
  referred_by INTEGER
);
```

### tests table
```sql
CREATE TABLE tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  test_type TEXT DEFAULT 'diagnostic',
  questions JSON,
  answers JSON,
  score INTEGER,
  total_questions INTEGER,
  percentage REAL,
  analysis JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### progress table
```sql
CREATE TABLE progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject TEXT,
  chapter TEXT,
  questions_completed INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_attempted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, subject, chapter)
);
```

### question_bank table
```sql
CREATE TABLE question_bank (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  options JSON NOT NULL,
  correct_answer INTEGER NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  year INTEGER,  -- Year if PYQ
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### payments table
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 2.2 API Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Express Server                    │
│  (Health checks, future web admin panel)           │
└──────────────┬──────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌───▼────────────┐
│  Telegram   │  │  Razorpay     │
│     Bot     │  │  Webhooks     │
└──────┬──────┘  └───────────────┘
       │
┌──────▼──────┐
│    Groq     │
│     API     │
└──────┬──────┘
       │
┌──────▼──────┐
│   SQLite    │
│  Database   │
└─────────────┘
```

---

## 2.3 User Flow

### New User Flow
```
User sends /start
    ↓
Bot creates user record in DB
    ↓
Shows welcome message
    ↓
User sends /test
    ↓
Bot generates 10 questions (Groq)
    ↓
User answers all questions (inline keyboard)
    ↓
Bot calculates score
    ↓
Bot analyzes results (Groq Analyst Agent)
    ↓
Bot shows basic analysis (free tier)
    ↓
User sees upgrade prompt (₹99 for full plan)
    ↓
[If paid] User gets 7-day personalized plan (Groq Planner Agent)
```

---

## 2.4 Error Handling Strategy

| Error Type | Recovery Method |
|-----------|-----------------|
| Groq API timeout | Retry 3 times with exponential backoff |
| Database lock | Retry with 100ms delay, max 3 attempts |
| Telegram 400 error | Log user ID, skip message, notify admin |
| Telegram 409 conflict | Ignore (another instance handling) |
| Payment webhook failure | Store in DB, manual reconciliation |
| JSON parse failure | Fallback to rule-based analysis |

---

## 2.5 Logging Strategy

### Log Levels
- `ERROR`: Critical failures, payment failures
- `WARN`: API timeouts, retry attempts
- `INFO`: User actions, test completions
- `DEBUG`: Detailed API calls, DB queries

### Log Format (JSON)
```json
{
  "timestamp": "2026-02-19T21:00:00Z",
  "level": "INFO",
  "telegram_id": 123456789,
  "action": "test_completed",
  "score": 7,
  "percentage": 70
}
```

---

## 💻 PHASE 3: BUILD

---

## 3.1 Implementation Order

### Sprint 1 (Days 1-2): Database & Core

**Day 1:**
- [x] Set up SQLite database
- [x] Create all tables
- [x] Write database wrapper functions
- [ ] User registration on `/start`
- [ ] Test persistence across restarts

**Day 2:**
- [ ] Save test results to DB
- [ ] Fetch user test history
- [ ] Progress tracking per subject/chapter
- [ ] Update `researcherAgentGenerateQuestions` to save to DB

---

### Sprint 2 (Days 3-4): Enhanced Analysis & Planning

**Day 3:**
- [ ] Improve `analystAgentAnalyze` with DB context
- [ ] Track weak chapters over time
- [ ] Generate trend analysis
- [ ] Add percentile predictor

**Day 4:**
- [ ] Implement `plannerAgentGeneratePlan`
- [ ] Generate 7-day schedule
- [ ] Create mermaid diagrams for concepts
- [ ] Add formula sheets
- [ ] Include PYQ references

---

### Sprint 3 (Days 5-6): Payment & Webhooks

**Day 5:**
- [ ] Install Razorpay SDK
- [ ] Create payment order
- [ ] Generate payment link
- [ ] Set up webhook endpoint
- [ ] Verify payment signature

**Day 6:**
- [ ] Handle successful payment webhook
- [ ] Unlock 7-day plan on payment
- [ ] Store payment in DB
- [ ] Send confirmation to user
- [ ] Test refund handling

---

### Sprint 4 (Days 7-8): Polish & Testing

**Day 7:**
- [ ] Add error recovery
- [ ] Implement retry logic
- [ ] Add structured logging (Winston)
- [ ] Create admin commands
- [ ] Analytics dashboard (basic)

**Day 8:**
- [ ] End-to-end testing
- [ ] Test all user flows
- [ ] Test payment flow
- [ ] Load testing with 100+ users
- [ ] Bug fixes

---

## 3.2 File Structure

```
jee-bot/
├── bot.js                    # Main bot entry point
├── package.json
├── .env
├── .gitignore
├── README.md
│
├── src/
│   ├── database/
│   │   ├── db.js           # SQLite connection
│   │   ├── schema.sql       # Table definitions
│   │   └── queries.js      # Database queries
│   │
│   ├── agents/
│   │   ├── researcher.js    # Question generation
│   │   ├── analyst.js      # Test analysis
│   │   └── planner.js      # Study plan generation
│   │
│   ├── handlers/
│   │   ├── commands.js     # Telegram command handlers
│   │   ├── callbacks.js    # Inline button handlers
│   │   └── webhooks.js    # Razorpay webhook
│   │
│   ├── middleware/
│   │   ├── auth.js         # Payment verification
│   │   └── errors.js      # Error handling
│   │
│   ├── utils/
│   │   ├── logger.js       # Winston logging
│   │   ├── retry.js        # Retry logic
│   │   └── validators.js   # Input validation
│   │
│   └── config/
│       └── constants.js    # Bot messages, config
│
├── database/
│   └── jee-bot.db        # SQLite database file
│
├── logs/
│   ├── app.log
│   ├── error.log
│   └── payments.log
│
└── tests/
    ├── test-db.js
    ├── test-agents.js
    └── test-bot.js
```

---

## 🧪 PHASE 4: TEST

---

## 4.1 Test Plan

### Unit Tests
- [ ] Database queries
- [ ] Agent functions (researcher, analyst, planner)
- [ ] Utility functions (retry, validators)
- [ ] Payment signature verification

### Integration Tests
- [ ] Complete user flow (start → test → analysis → payment → plan)
- [ ] Database persistence
- [ ] Payment webhook handling
- [ ] Error recovery

### Load Tests
- [ ] 10 concurrent users
- [ ] 50 concurrent users
- [ ] 100 concurrent users
- [ ] 1000 requests/minute

### Manual Testing
- [ ] All commands work
- [ ] Questions generate correctly
- [ ] Analysis is accurate
- [ ] Payment flow completes
- [ ] Plan unlocks after payment
- [ ] Error handling works

---

## 🔄 PHASE 5: REWORK

---

## 5.1 Rework Priorities

After testing, prioritize:

1. **Bug Fixes** (Critical)
   - Payment webhook signature issues
   - Database lock errors
   - Groq API rate limits

2. **User Experience** (High)
   - Better error messages
   - Faster question generation
   - Clearer instructions

3. **Performance** (Medium)
   - Optimize DB queries
   - Cache question bank
   - Reduce API calls

4. **Features** (Low)
   - Add more question types
   - Improve analysis depth
   - Add more subjects

---

## 5.2 Known Issues to Watch

| Issue | Impact | Mitigation |
|--------|---------|------------|
| Groq rate limits | Users can't generate tests | Add queue, show "busy" message |
| Telegram message length | Truncated plans | Split long messages |
| JSON parse failures | Test generation fails | Fallback to templates |
| Payment delays | Users wait too long | Async processing + notification |

---

## 🚀 PHASE 6: PUSH TO GITHUB

---

## 6.1 Git Strategy

### Branches
```
main (production)
├── develop (staging)
├── feature/database
├── feature/payment
└── feature/planner
```

### Commit Standards
```
feat: add database integration
fix: resolve payment webhook signature issue
refactor: organize code into modules
test: add unit tests for agents
docs: update API documentation
```

### Deployment Flow
```
feature branch → develop → test → merge to main → deploy
```

---

## 6.2 GitHub Setup

### Repository Actions
- [ ] CI/CD pipeline (automatic tests on push)
- [ ] Automatic deployment to Render on main merge
- [ ] Issue templates for bug reports
- [ ] Pull request template
- [ ] README update with new features

### Release Tags
- `v1.0.0` - MVP (diagnostic + analysis)
- `v1.1.0` - Payment + 7-day plan
- `v1.2.0` - Progress tracking
- `v2.0.0` - Full-fledged features

---

## 📊 MILESTONES

---

| Milestone | Date | Features | Users Target |
|-----------|-------|-----------|
| **MVP** | Day 8 | Diagnostic + Analysis | 50 |
| **Payment** | Day 10 | Razorpay integration | 100 |
| **Full Plan** | Day 15 | 7-day personalized plan | 500 |
| **Progress Tracking** | Day 20 | User dashboard | 1000 |
| **Polish** | Day 30 | Referrals, leaderboards | 5000 |

---

## 📝 NEXT STEPS

1. ✅ **Review this plan** - Confirm features and timeline
2. 🏗️ **Start Sprint 1** - Database setup (Day 1)
3. 💾 **Test persistence** - Verify data saves
4. 🔄 **Iterate quickly** - Test each sprint
5. 🚀 **Deploy progressively** - Ship features as ready

---

## 🆘 QUESTIONS?

Before starting implementation:
- Confirm database choice (SQLite vs MongoDB)
- Confirm payment timeline (immediate or after MVP?)
- Any specific features you want prioritized?
- Deployment timeline preference?

---

**Ready to build!** Let's start with Sprint 1 🦞
