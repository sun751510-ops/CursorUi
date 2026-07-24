# CwayClient

Dexter / Jarvis-style AI copilot — iPhone Home Screen UI + desktop Electron with Cursor.

## iPhone → Cursor **without Vercel**

Your phone talks to the **CwayClient desktop app on your computer** over Wi‑Fi. Cursor runs on the PC; the phone is the mic + UI.

### On your computer
```bash
npm install
npm start
```
1. Desktop Settings → paste your [Cursor API key](https://cursor.com/dashboard/api)  
2. Pick a model  
3. Note the **Phone relay** URL shown in Settings (like `http://192.168.1.20:3847`)

### On your iPhone
1. Open https://litter.catbox.moe/kzu1me.html in **Safari** → Add to Home Screen  
2. Settings → **Desktop relay URL** = that `http://IP:3847`  
3. Tap **Test** (must be on the **same Wi‑Fi**)  
4. Tap the mic (on-device speech) or type — replies come from Cursor on your PC

Flow: **iPhone mic → speech-to-text → Wi‑Fi relay → Cursor on desktop → reply back to phone**

> iOS may ask to allow **Local Network** access for the Home Screen app — allow it.

## Desktop only

```bash
npm start
```

Uses `@cursor/sdk` locally for chat + OS commands.

## Layout

```
electron/   desktop app, Cursor SDK, Wi‑Fi phone relay (:3847)
web/        UI (phone Home Screen + desktop)
android/ ios/   optional Capacitor shells
```
