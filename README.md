# JEE Crash Bot - AI-Powered JEE Main Tutor

🔥 **Transform JEE Main preparation with AI-powered diagnostics and personalized study plans**

## Features

- ✅ **AI-Generated Diagnostic Tests** - 10 questions based on Session 1 trends
- ✅ **Multi-Agent System** - Researcher, Analyst, and Planner agents
- ✅ **Weakness Analysis** - Identify exact problem areas
- ✅ **Personalized 7-Day Plans** - 210 targeted questions
- ✅ **GLM-4.7 Powered** - State-of-the-art AI
- ✅ **Telegram Integration** - Easy to use, accessible anywhere

---

## Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- npm installed
- Telegram account
- API keys (see below)

### Get API Keys

**1. Telegram Bot Token:**
1. Open Telegram and search @BotFather
2. Send `/newbot`
3. Name: `JEE Crash Bot`
4. Username: `yourjeecrashbot` (must end with "bot")
5. Copy the bot token

**2. GLM-4.7 API Key:**
1. Go to https://platform.z.ai/
2. Sign up/login
3. Go to Dashboard → API Keys
4. Create new key
5. Copy the key

**3. Razorpay Keys (Optional for production):**
1. Go to https://dashboard.razorpay.com/signup/
2. Create account (Test mode)
3. Go to Settings → API Keys
4. Copy key_id and key_secret

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
TELEGRAM_TOKEN=your_telegram_bot_token_here
GLM_API_KEY=your_glm_api_key_here
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
BOT_NAME=JEE Crash Bot
SUPPORT_USERNAME=your_telegram_username
```

### 3. Start the Bot

```bash
npm start
```

You should see:
```
🚀 JEE Crash Bot is LIVE!
📊 Bot: @your_bot_username
✅ Waiting for users...
```

### 4. Test the Bot

1. Open Telegram
2. Search for your bot (e.g., `@yourjeecrashbot`)
3. Send `/start`
4. Try `/test` to take a diagnostic test

---

## Project Structure

```
jee-bot/
├── bot.js              # Main bot code with 3 AI agents
├── package.json         # Dependencies and scripts
├── .env               # Your API keys (never commit this!)
├── .env.example        # Template for environment variables
├── question_bank.json   # Stored questions (auto-generated)
└── README.md           # This file
```

---

## How It Works

### Phase 1: Researcher Agent
- Generates 10 diagnostic questions (4 Physics, 3 Math, 3 Chemistry)
- Focus on high-weightage topics (Mechanics, Calculus, Organic)
- Mixes difficulty levels (3 easy, 4 medium, 3 hard)
- Saves questions to `question_bank.json`

### Phase 2: User Takes Test
- Bot sends questions one by one
- User selects answers via inline keyboard
- All 10 questions stored with user's responses

### Phase 3: Analyst Agent
- Analyzes test results
- Calculates subject-wise scores
- Identifies 3 weakest chapters (score < 60%)
- Detects error patterns (conceptual/calculation/silly)
- Estimates Session 2 marks impact

### Phase 4: Payment (Simulated for Now)
- User pays ₹99 to unlock full plan
- Razorpay integration coming soon
- For now: `/paid` command simulates payment

### Phase 5: Planner Agent
- Creates personalized 7-day crash plan
- Daily 30 targeted questions (not random)
- Includes Mermaid diagrams for concepts
- Uses LaTeX for equations
- Focuses Day 1-3 on weakest chapters
- Includes Session 2 percentile predictor
- Adds motivational quotes

---

## Deployment Options

### Option 1: Replit (FREE, Easiest)

1. Go to https://replit.com
2. Sign up → Create Repl → Node.js
3. Upload all files (drag & drop)
4. Go to "Secrets" tab → Add all `.env` variables
5. Click "Run" → Bot goes LIVE
6. Keep Replit running (always on with free plan)

### Option 2: VPS (₹400/month, Most Reliable)

**DigitalOcean:**
```bash
# Create droplet (Ubuntu 22.04)
ssh root@your_droplet_ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pm2 (process manager)
npm install -g pm2

# Clone/upload your bot
git clone your-repo-url
cd jee-bot
npm install

# Start with pm2
pm2 start bot.js --name jee-bot
pm2 startup
pm2 save
```

### Option 3: Render (FREE, Always On)

1. Go to https://render.com
2. Create "Web Service" → Connect GitHub
3. Push code to GitHub
4. Render detects Node.js → Deploy
5. Add environment variables in dashboard
6. Bot runs 24/7 for free

---

## Marketing & Getting Users

### Day 1: Launch (100 users)
- **Telegram Groups:** Search "JEE 2026", "JEE Session 2" (10K+ members)
- **Post this message:**
  ```
  🔥 FREE JEE Session 2 Diagnostic AI Bot!

  Session 1 done? See exact weaknesses in 10 mins.
  • AI analyzes your mistakes
  • Identifies weak chapters
  • Creates personalized crash plan

  t.me/yourjeecrashbot?start
  ```
- **Instagram:** Post Reel - "AI found my JEE weak spot in 10 mins 😱"

### Expected Results:
- Day 1: 10 tests, 3 payments = ₹297
- Day 3: 100 tests, 30 payments = ₹2,970
- Day 7: 1,000 tests, 300 payments = ₹29,700

---

## Troubleshooting

### "Error: module not found"
```bash
npm install
```

### "Error: Invalid token"
- Check `.env` file
- Verify TELEGRAM_TOKEN is correct
- Re-copy token from @BotFather

### "Error: 401 Unauthorized" (GLM API)
- Check GLM_API_KEY in `.env`
- Verify key is correct
- Check if API key has credits

### "JSON parse error"
- Check `bot.js` syntax
- Verify `callGLM` is not returning extra text
- Look at console logs for parsing error

### "Bot not responding"
- Check if bot is running (`pm2 status` or check Replit logs)
- Verify Telegram token is correct
- Check if `.env` file is loaded correctly

### Polling errors
- Network issues (check internet)
- Telegram API down (check @TelegramStatus)
- Multiple instances running (kill old ones)

---

## Payment Integration (Future)

To add real Razorpay payments:

1. Install Razorpay SDK:
```bash
npm install razorpay
```

2. Update `/pay99` command:
```javascript
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create payment link
const paymentLink = await razorpay.paymentLink.create({
  amount: 9900,  // ₹99 in paise
  currency: "INR",
  description: "7-Day JEE Crash Plan",
  customer: {
    name: "Student Name",
    email: "student@email.com"
  }
});

bot.sendMessage(chatId, `💳 Pay here: ${paymentLink.short_url}`);
```

3. Handle webhook (Razorpay calls your server on payment success)

---

## Scaling Tips

### Week 1:
- Fix all bugs from user feedback
- Improve question quality
- Add more subjects (optional)
- Get 50+ payments

### Week 2:
- Add payment integration (Razorpay)
- Add referral system
- Create Instagram/Twitter content
- Get 200+ payments

### Week 3:
- Launch full marketing campaign
- Partner with JEE coaching centers
- Create WhatsApp version
- Get 500+ payments

---

## License

MIT License - Use freely

---

## Support

For issues or questions:
- Telegram: @your_support_username
- Email: your@email.com

---

**Made with ❤️ for JEE aspirants**
