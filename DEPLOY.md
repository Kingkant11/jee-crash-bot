# JEE Bot Deployment Guide

## Quick Deployment (Choose One)

---

## Option 1: Replit (FREE, Recommended for Testing)

### Step 1: Create Replit Account
1. Go to https://replit.com
2. Sign up (Google/GitHub/Email)

### Step 2: Create Node.js Repl
1. Click "Create Repl"
2. Choose "Node.js" template
3. Name it: `jee-crash-bot`

### Step 3: Upload Files
1. Upload all files from jee-bot folder:
   - `package.json`
   - `bot.js`
   - `question_bank.json`
   - `.env.example`
   - README.md
2. **Do NOT upload `.env`** - we'll create it

### Step 4: Add Environment Variables
1. Click "Secrets" (lock icon) in left sidebar
2. Add each variable:
   - Name: `TELEGRAM_TOKEN` → Value: `your_bot_token`
   - Name: `GLM_API_KEY` → Value: `your_glm_key`
   - Name: `RAZORPAY_KEY_ID` → Value: `rzp_test_...`
   - Name: `RAZORPAY_KEY_SECRET` → Value: `your_secret`
   - Name: `BOT_NAME` → Value: `JEE Crash Bot`
   - Name: `SUPPORT_USERNAME` → Value: `your_username`

### Step 5: Install & Run
1. Click "Run" (green play button)
2. Wait for dependencies to install
3. See: `🚀 JEE Crash Bot is LIVE!`
4. Bot is now running 24/7 for FREE

### Step 6: Test
1. Open Telegram
2. Search for your bot
3. Send `/start`

---

## Option 2: VPS (DigitalOcean, ₹400/month, Most Reliable)

### Step 1: Create DigitalOcean Droplet
1. Go to https://digitalocean.com
2. Sign up → Create Droplet
3. Choose:
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic ($6/month or similar)
   - Region: Closest to India (Singapore/Bangalore)

### Step 2: SSH into Droplet
```bash
ssh root@your_droplet_ip
```

### Step 3: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:
```bash
node -v  # Should show v20.x.x
npm -v  # Should show 10.x.x
```

### Step 4: Create Project Directory
```bash
mkdir ~/jee-bot
cd ~/jee-bot
```

### Step 5: Upload Files
**Option A: Git (Recommended)**
```bash
# On your local machine
cd jee-bot
git init
git add .
git commit -m "Initial commit"
git remote add origin your_github_repo_url
git push -u origin main

# On VPS
git clone your_github_repo_url .
```

**Option B: SCP (If no Git)**
```bash
# On your local machine
scp -r ~/jee-bot/* root@your_droplet_ip:~/jee-bot/
```

### Step 6: Install Dependencies
```bash
cd ~/jee-bot
npm install
```

### Step 7: Create .env File
```bash
nano .env
```

Add your keys:
```env
TELEGRAM_TOKEN=your_token_here
GLM_API_KEY=your_key_here
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your_secret
BOT_NAME=JEE Crash Bot
SUPPORT_USERNAME=your_username
```

Save: `Ctrl + X`, `Y`, `Enter`

### Step 8: Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### Step 9: Start Bot with PM2
```bash
pm2 start bot.js --name jee-bot
```

### Step 10: Setup PM2 Startup (Auto-restart on reboot)
```bash
pm2 startup
```
Follow the command it shows (copy-paste the last line)

### Step 11: Save PM2 Configuration
```bash
pm2 save
```

### Verify It's Running
```bash
pm2 status
```

Should show:
```
┌─────┬──────────┬───────┬─────────┬───────────┬─────────┬──────────┐
│ id  │ name     │ mode  │ status  │ cpu      │ memory   │ pid      │
├─────┼──────────┼───────┼─────────┼───────────┼─────────┼──────────┤
│ 0   │ jee-bot  │ fork  │ online  │ 0%       │ 80MB     │ 12345    │
└─────┴──────────┴───────┴─────────┴───────────┴─────────┴──────────┘
```

### Monitor Logs
```bash
pm2 logs jee-bot
```

---

## Option 3: Render (FREE, Always On)

### Step 1: Push Code to GitHub
```bash
cd jee-bot
git init
git add .
git commit -m "JEE Bot"
git remote add origin your_github_repo
git push -u origin main
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up (GitHub login is easiest)

### Step 3: Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repo
3. Render auto-detects Node.js
4. Configure:
   - Root Directory: `.` (leave empty)
   - Build Command: `npm install`
   - Start Command: `npm start`

### Step 4: Add Environment Variables
1. Scroll down to "Environment Variables"
2. Add same variables as Replit:
   - `TELEGRAM_TOKEN`
   - `GLM_API_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `BOT_NAME`
   - `SUPPORT_USERNAME`

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait 2-3 minutes
3. Bot is now LIVE 24/7 for FREE

---

## Testing Your Bot

After deployment, test all commands:

### 1. Basic Commands
```
/start  - Should show welcome message
/help   - Should show help
/test   - Should generate 10 questions
```

### 2. Take a Full Test
- Answer all 10 questions
- Check if analysis is shown
- Check if weak chapters are identified

### 3. Payment Flow (Test Mode)
```
/pay99  - Should show payment info
/paid    - Should generate 7-day plan
```

### 4. Check Logs
```bash
# Replit: Check console
# VPS (PM2): pm2 logs jee-bot
# Render: Check logs tab in dashboard
```

---

## Common Issues & Fixes

### Bot not responding
- Check if process is running
- Verify Telegram token is correct
- Check network connection

### "GLM API Error"
- Verify GLM_API_KEY is correct
- Check if API key has credits
- Try regenerating key

### Question generation failing
- Check `callGLM` function
- Verify JSON parsing is working
- Check console logs for specific error

### PM2 won't start
```bash
pm2 delete all
pm2 start bot.js --name jee-bot
pm2 save
```

### Port already in use (Render)
- This shouldn't happen (Telegram bot uses polling)
- If using webhooks, kill old processes

---

## Updating the Bot

### Replit
1. Edit files in Replit
2. Click "Run" again (restarts automatically)

### VPS (PM2)
```bash
cd ~/jee-bot
git pull  # If using Git
# OR upload new files
pm2 restart jee-bot
```

### Render
1. Push to GitHub
2. Render auto-deploys (usually within 1-2 minutes)

---

## Monitoring

### PM2 Monitor
```bash
pm2 monit
```

### PM2 Logs in Real-time
```bash
pm2 logs jee-bot --lines 100
```

### Check Bot Status
```bash
curl https://api.telegram.org/bot<TOKEN>/getMe
```

---

## Security Tips

1. **Never commit `.env` file** to Git
2. **Rotate API keys** if leaked
3. **Use strong bot username** (not easily guessable)
4. **Monitor logs** for suspicious activity
5. **Keep dependencies updated** (npm audit fix)

---

## Costs

| Platform | Cost | Uptime | Best For |
|----------|-------|---------|------------|
| **Replit** | FREE | 99%+ | Testing, development |
| **DigitalOcean** | ₹400-500/mo | 99.9% | Production, high traffic |
| **Render** | FREE | 99%+ | Free production |

---

**Choose based on your budget and reliability needs!**

For production with many users: VPS (DigitalOcean)
For testing/learning: Replit or Render
