# JEE Bot - API & Deployment Issues

---

## 🔴 Issue #1: GLM API Error 429 - No Balance

### Error Message:
```
GLM API Error: Request failed with status code 429
Response status: 429
Response data: { error: { code: '1113', message: 'Insufficient balance or no resource package. Please recharge.' } }
```

### What This Means:
- Your GLM API key has **0 credits or balance**
- API is rejecting all requests
- This is a payment/billing issue, not code issue

### Solutions:

#### Option A: Add Credits to Z.ai (Paid)
1. Go to: https://platform.z.ai/
2. Login to your account
3. Go to **Billing** or **API** section
4. Check current balance
5. Add credits (requires payment)

#### Option B: Use OpenRouter (Alternative)
OpenRouter supports GLM-4.7 model:
1. Go to: https://openrouter.ai/
2. Sign up (free)
3. Add small credits ($5-10)
4. Get API key
5. Update bot.js to use OpenRouter endpoint

**OpenRouter Configuration:**
```javascript
// Update callGLM function to use OpenRouter
const response = await axios.post(
  'https://openrouter.ai/api/v1/chat/completions',
  {
    model: 'zai/glm-4.7',  // GLM via OpenRouter
    messages: [...],
    temperature: 0.3,
    max_tokens: 2000
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
);
```

#### Option C: Use Free Alternative Model
Change from `glm-4.7` to a free model:
- `gpt-3.5-turbo` (OpenRouter free tier)
- `claude-3-haiku` (Anthropic)
- Other free models available

---

## 🔧 Issue #2: JSON Parse Error - LLM Returning Bad Format

### Error Message:
```
🔴 Researcher Agent Error: Unexpected token 'A', "AI tempora"... is not valid JSON
Failed to parse questions
```

### What This Means:
- LLM is adding **text before/after** the JSON
- Breaking the JSON.parse() function
- LLM is being "chatty" instead of strict JSON

### What I Fixed:
I've improved the JSON parser in bot.js:
- ✅ Better cleaning of markdown code blocks
- ✅ Extracts only JSON array portion
- ✅ Added debug logging (first 500 chars)
- ✅ Validates response is array before parsing

### If Still Failing:

1. Check Render logs for "Raw LLM response" line
2. See what the LLM is actually returning
3. The debug output will show:
   ```
   🔍 Raw LLM response (first 500 chars): [actual response]
   🔍 Extracted JSON (first 300 chars): [extracted JSON]
   ```

4. If LLM keeps adding text, the model prompt may need adjustment

---

## 🚫 Issue #3: Telegram Polling Error 409 - Conflict

### Error Message:
```
🔴 Polling error: ETELEGRAM: 409 Conflict: terminated by other getUpdates request; make sure that only one bot instance is running
```

### What This Means:
- **Another bot instance is running**
- Old instance didn't shut down properly
- Or multiple deployments are active with same token

### Solutions:

#### Solution A: Stop All Other Instances (Render)

1. Go to: https://dashboard.render.com
2. Click on **"jee-crash-bot"** service
3. Click **"Stop service"** (if running)
4. Wait 30 seconds
5. Click **"Start service"** (to restart cleanly)

#### Solution B: Use Different Bot Token for Testing

If testing locally and on Render simultaneously:

1. Create a **test bot** with different token:
   ```
   @BotFather → /newbot → Name: "JEE Test Bot"
   ```
2. Use that token for local testing
3. Keep Render bot for production only

#### Solution C: Check for Duplicate Deployments

1. Go to Render dashboard
2. Check if you have multiple services with same bot
3. Delete duplicates
4. Keep only one service running

---

## 🔧 Step-by-Step Fix All 3 Issues:

### Step 1: Fix GLM API (Choose One)

**Option A - Add Credits:**
1. Go to https://platform.z.ai/
2. Login → Billing
3. Add credits
4. Test with `/test` command

**Option B - Switch to OpenRouter:**
1. Sign up at https://openrouter.ai/ (free)
2. Add $5-10 credits
3. Get API key
4. Update `.env` with `OPENROUTER_API_KEY`
5. Update `bot.js` endpoint to OpenRouter
6. Push to GitHub
7. Render auto-deploys

### Step 2: Deploy Fixed Code

I've already improved the JSON parser in bot.js. Deploy it:

```bash
# Push the improved parser
cd /home/aman-kant/.openclaw/workspace/jee-bot
git add bot.js
git commit -m "Fix: Improved JSON parser + debug logging"
git push
```

### Step 3: Stop Conflicting Bot Instances

1. Go to Render dashboard
2. Stop "jee-crash-bot" service
3. Wait 30 seconds
4. Start service again

---

## ✅ Verification Checklist:

After fixing all issues:

- [ ] GLM API has credits (or switched to OpenRouter)
- [ ] `/test` generates questions successfully
- [ ] No "JSON parse error" in logs
- [ ] No "Conflict 409" error in logs
- [ ] Bot responds to /start
- [ ] Bot responds to /test
- [ ] Can take full diagnostic test
- [ ] Analysis shows after test
- [ ] No errors in console

---

## 📋 Debug Commands:

### Check Render Logs:
```
Go to: https://dashboard.render.com
Click: jee-crash-bot → Logs tab
```

### Test Locally (if you want):
```bash
cd /home/aman-kant/.openclaw/workspace/jee-bot
npm start
```

### Check Bot Status on Telegram:
```
Go to: https://api.telegram.org/bot<TOKEN>/getMe
Replace <TOKEN> with your actual bot token
```

---

## 💡 Priority Fixes:

1. **HIGH PRIORITY:** Fix GLM API balance (or switch to OpenRouter)
2. **MEDIUM:** Stop conflicting bot instances
3. **LOW:** JSON parser should be better now (I improved it)

---

## 🆘 Still Stuck?

Tell me:
- Which error still shows up
- Paste exact error message
- What you see in logs

I'll help fix it! 🦞
