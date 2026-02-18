# JEE Bot Quick Reference

## Essential Commands

```bash
# Install dependencies
npm install

# Start bot locally
npm start

# Start with PM2 (production)
pm2 start bot.js --name jee-bot

# Check PM2 status
pm2 status

# View logs
pm2 logs jee-bot

# Restart bot
pm2 restart jee-bot

# Stop bot
pm2 stop jee-bot
```

---

## Environment Variables (.env)

```env
TELEGRAM_TOKEN=7777777777:AAE_your_token_here
GLM_API_KEY=sk-proj-your_key_here
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
BOT_NAME=JEE Crash Bot
SUPPORT_USERNAME=your_telegram_username
```

---

## Bot Commands (Telegram)

```
/start  - Start bot, show welcome message
/test   - Take FREE diagnostic test (10 questions)
/pay99  - Show payment flow (₹99)
/paid    - Simulate payment (for testing)
/help   - Show help message
```

---

## File Locations

- Main bot code: `bot.js`
- Dependencies: `package.json`
- Secrets: `.env` (NEVER commit to Git)
- Question storage: `question_bank.json`
- Documentation: `README.md`
- Deployment guide: `DEPLOY.md`
- Start here: `START_HERE.md`

---

## Common Errors & Fixes

### Error: "Cannot find module 'node-telegram-bot-api'"
```bash
npm install
```

### Error: "Invalid token"
- Check `.env` file
- Verify TELEGRAM_TOKEN is correct
- Re-copy from @BotFather

### Error: "GLM 401 Unauthorized"
- Check GLM_API_KEY in `.env`
- Verify key is correct
- Check if key has credits

### Error: "JSON parse error"
- Check `bot.js` syntax
- Look at console logs
- Verify LLM isn't returning extra text

### Bot not responding
- Check if running: `pm2 status`
- Check logs: `pm2 logs jee-bot`
- Verify internet connection
- Check Telegram API status

### PM2: "command not found"
```bash
npm install -g pm2
```

---

## Testing Checklist

- [ ] Bot starts successfully (`npm start` or `pm2 status`)
- [ ] See "🚀 JEE Crash Bot is LIVE!" message
- [ ] `/start` command works on Telegram
- [ ] `/test` generates questions
- [ ] Can answer all 10 questions
- [ ] Analysis shows after test
- [ ] `/pay99` shows payment info
- [ ] `/paid` generates 7-day plan (test mode)
- [ ] No errors in console/logs

---

## Marketing Message Templates

### Telegram Groups:
```
🔥 FREE JEE Session 2 Diagnostic AI Bot!

Session 1 done? See exact weaknesses in 10 mins.

• AI analyzes your mistakes
• Identifies weak chapters
• Creates personalized 7-day crash plan ₹99

t.me/your_bot_username?start
```

### Instagram Caption:
```
AI found my JEE weak spot in 10 mins 😱

Session 1 done? Get your personalized crash plan now.

Link in bio! 🔥

#JEEMain #JEE2026 #Session2
```

### WhatsApp Groups:
```
🎯 JEE Session 2 AI Tutor

Free diagnostic test → AI analysis → 7-day crash plan

Session 1 not great? Don't waste time guessing.

Try now: t.me/your_bot_username
```

---

## Revenue Targets

| Day | Tests | Payments | Revenue |
|------|--------|-----------|----------|
| 1 | 10 | 3 | ₹297 |
| 3 | 100 | 30 | ₹2,970 |
| 7 | 1,000 | 300 | ₹29,700 |
| 14 | 5,000 | 1,500 | ₹1,48,500 |
| 30 | 20,000 | 6,000 | ₹5,94,000 |

---

## Improvement Ideas (Week 2+)

- [ ] Add real Razorpay payment integration
- [ ] Add referral system
- [ ] Add multiple difficulty levels
- [ ] Add progress tracking
- [ ] Add mock tests with timer
- [ ] Add daily practice questions
- [ ] Add WhatsApp bot version
- [ ] Add leaderboards
- [ ] Add subject-wise plans
- [ ] Add video explanations

---

## Support

For help:
- Check `README.md` for full documentation
- Check `DEPLOY.md` for deployment guide
- Contact: @your_telegram_username

---

**Good luck! 🚀**
