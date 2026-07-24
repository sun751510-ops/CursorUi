# CwayClient

Dexter / Jarvis-style AI copilot — iPhone Home Screen app + desktop Electron with Cursor models.

## iPhone: voice → your Cursor AI (no OpenAI Whisper key)

**Demo:** https://litter.catbox.moe/kzu1me.html  

1. Open in **Safari** → Share → **Add to Home Screen**
2. Mic uses **on-device speech** (no Whisper / OpenAI key)
3. Replies use **your Cursor API key** + chosen model

### One-time Cursor proxy (required on iPhone)
Safari blocks calling Cursor’s API directly, so deploy the included proxy:

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import `sun751510-ops/CursorUi`
2. Deploy
3. In CwayClient **Settings**:
   - Provider: **Cursor**
   - Cursor API key: from https://cursor.com/dashboard/api  
   - Proxy URL: `https://YOUR-PROJECT.vercel.app/api/cursor`
4. Tap **Test**, pick a model, then talk or type

Flow: **You speak → phone speech-to-text → Cursor Cloud Agent (your model) → reply (spoken)**

## Desktop

```bash
npm install
npm start
```

Uses `@cursor/sdk` locally — no Vercel proxy needed.

## Layout

```
web/        phone + desktop UI
api/        Vercel Cursor CORS proxy
electron/   desktop app + OS commands
android/ ios/   optional Capacitor shells
```
