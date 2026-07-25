# CwayClient

Dexter / Jarvis-style AI copilot — iPhone Home Screen UI + desktop Electron with Cursor.

## iPhone on holiday (no computer) — Cloudflare Worker

Safari can’t call Cursor’s API directly (CORS). A free **Cloudflare Worker** bridges that — no Vercel, no PC.

### Live app (already deployed)

**Open this in Safari** (real webpage — not GitHub source):  
https://cwayclient-cursor-proxy.almond-option.workers.dev  

If you see “Just a moment…”, wait a second — then CwayClient appears.  
Share → **Add to Home Screen**. Proxy URL + Cursor + ElevenLabs keys are auto-filled. Mic replies speak out loud; answers use fast Workers AI.

**Claim into your Cloudflare account now** (preview dies if you don’t):  
https://dash.cloudflare.com/claim-preview?claimToken=bUa0NnC_gGL7oFS0uoOBH5hp8oRpsBCZozK6qf3KjP8  

Mic: tap → **Allow** → speak → tap again → **Typed** or **Spoken**. If Safari blocks on-device speech, the mic records + transcribes via ElevenLabs.

> Don’t open the GitHub/jsDelivr `.html` link — Safari shows the code (`text/plain`).

Flow: **iPhone mic → speech-to-text → Cloudflare Worker → Cursor Cloud Agents → reply**

To redeploy later:
```bash
cd cloudflare
npx wrangler login
npx wrangler deploy
```


## iPhone at home (Wi‑Fi relay)

Your phone talks to the **CwayClient desktop app** on the same Wi‑Fi. Cursor runs on the PC.

### Computer
```bash
npm install
npm start
```
1. Desktop Settings → Cursor API key  
2. Note the **Phone relay** URL (`http://192.168.x.x:3847`)

### iPhone
1. Settings → **Proxy URL** = that relay URL  
2. Tap **Test** → mic / type  

## Desktop only

```bash
npm start
```

Uses `@cursor/sdk` locally for chat + OS commands.

## Layout

```
cloudflare/   free Worker proxy for phone-only Cursor (no Vercel)
electron/     desktop app, Cursor SDK, Wi‑Fi phone relay (:3847)
web/          UI (phone Home Screen + desktop)
```
