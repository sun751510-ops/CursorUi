# CwayClient

Dexter / Jarvis-style AI copilot — iPhone Home Screen UI + desktop Electron with Cursor.

## iPhone on holiday (no computer) — Cloudflare Worker

Safari can’t call Cursor’s API directly (CORS). A free **Cloudflare Worker** bridges that — no Vercel, no PC.

### Live app (already deployed)

**Open this in Safari** (real webpage — not GitHub source):  
https://cwayclient-cursor-proxy.respected-sardine.workers.dev  

If you see “Just a moment…”, wait a second — then CwayClient appears.  
Share → **Add to Home Screen**. Proxy URL + Cursor + ElevenLabs keys are auto-filled. Mic replies speak out loud.

**Claim into your Cloudflare account now** (preview dies if you don’t — this is why the last link broke):  
https://dash.cloudflare.com/claim-preview?claimToken=6fdGbpsKYFymeNwZjL5wHP0j-DywYBXuIyjt-Uj5W5Q  

**How I talk (living log):** [`sharing.md`](sharing.md) · live at `/sharing.md` on the Worker.  


**Cursor models (Fable 5 / Grok 4.5):** Settings → paste a `crsr_` key from [cursor.com/dashboard/api](https://cursor.com/dashboard/api) → **Test** → pick the model in the rail. Full steps: [`docs/CURSOR_SETUP.md`](docs/CURSOR_SETUP.md).

Mic: tap → **Allow** → speak (live transcript) → tap again → **Typed** or **Spoken**. Realtime Scribe (`scribe_v2_realtime`) when ElevenLabs is set; batch `scribe_v2` as fallback.

> Don’t open the GitHub/jsDelivr `.html` link — Safari shows the code (`text/plain`).

Flow: **iPhone mic → realtime STT → Cloudflare Worker → Cursor Cloud Agents (or Instant Workers AI) → streamed reply**

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
