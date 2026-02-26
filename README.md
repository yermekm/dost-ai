# Dost.AI 🤝

**Your friend in any situation** — AI legal & life assistant for Central Asia and Turkey.

## Stack
- Frontend: Pure HTML/CSS/JS (no framework needed)
- Backend: Vercel Serverless Functions
- AI: Anthropic Claude Sonnet 4

## Files
```
├── index.html      ← Landing page
├── app.html        ← Main application
├── api/
│   └── chat.js     ← API proxy (hides your Anthropic key)
└── vercel.json     ← Vercel routing config
```

## Deploy in 5 minutes

### 1. Fork / clone this repo to your GitHub

### 2. Go to vercel.com
- Click "Add New Project"
- Import your GitHub repo
- Click Deploy

### 3. Add your API key
- In Vercel dashboard → Settings → Environment Variables
- Add: `ANTHROPIC_API_KEY` = `sk-ant-...your key...`
- Redeploy

### 4. Done! 🎉
Your site is live at `your-project.vercel.app`

## Custom domain
- Buy domain at namecheap.com or reg.ru
- In Vercel → Settings → Domains → Add domain
- Follow DNS instructions (takes 5-60 min)

## Languages supported
🇰🇿 Kazakh/Russian · 🇺🇿 Uzbek/Russian · 🇷🇺 Russian · 🇹🇷 Turkish · 🇰🇬 Kyrgyz · 🇦🇿 Azerbaijani · 🇬🇧 English

## Modules
- ⚖️ **My Rights** — Legal help, fines, labor disputes, consumer rights
- 📋 **Documents** — Draft complaints, applications, official letters
- 👴 **Pension & Benefits** — ENPF, retirement, social benefits

## Cost estimate (Anthropic API)
- Claude Sonnet 4: ~$3 per 1,000 messages
- 100 users/day × 5 messages = ~$1.50/day
