# CwayClient

Dexter / Jarvis-style AI copilot — iPhone Home Screen UI + desktop Electron with Cursor.

## iPhone on holiday (no computer) — Cloudflare Worker

Safari can’t call Cursor’s API directly (CORS). A free **Cloudflare Worker** bridges that — no Vercel, no PC.

### Live Worker (already deployed)

**Proxy URL:** https://cwayclient-cursor-proxy.tame-fly.workers.dev  

**Claim into your Cloudflare account (required — do this within 1 hour or the preview expires):**  
https://dash.cloudflare.com/claim-preview?claimToken=QZzFiIxwjVPuhloTft5zM2etmoUaVABtq6zv8wo_Vd8  

Open that claim link on your phone → sign in / create a free Cloudflare account → keep the Worker.

### On your iPhone
1. Open the CwayClient phone UI in **Safari** → Share → **Add to Home Screen**  
   https://cdn.jsdelivr.net/gh/sun751510-ops/CursorUi@cursor/cwayclient-jarvis-2fc8/web/phone.html
2. Settings → **Proxy URL** = `https://cwayclient-cursor-proxy.tame-fly.workers.dev`
3. Paste your [Cursor API key](https://cursor.com/dashboard/api)
4. Tap **Test** → mic or type

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
