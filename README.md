# CwayClient

Dexter / Jarvis-style AI copilot — iPhone Home Screen UI + desktop Electron with Cursor.

## iPhone on holiday (no computer) — Cloudflare Worker

Safari can’t call Cursor’s API directly (CORS). A free **Cloudflare Worker** bridges that — no Vercel, no PC.

### Live app (already deployed)

**Open this in Safari** (real webpage — not GitHub source):  
https://cwayclient-cursor-proxy.snow-paw.workers.dev  

If you see “Just a moment…”, wait a second — then CwayClient appears.  
Share → **Add to Home Screen**. Proxy URL is auto-filled to this same site.

**Claim into your Cloudflare account now** (preview dies if you don’t):  
https://dash.cloudflare.com/claim-preview?claimToken=GkiU1lWSnGgFRVHcWQ_hYOEoXVzSi5l2AZvT0QVyjyM  

Then paste your [Cursor API key](https://cursor.com/dashboard/api) → **Test** → type a short message (Cloud Agents can take 30–90s). Mic: tap → speak → tap again (prefer Safari if Home Screen blocks speech).

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
