# CwayClient

Dexter / Jarvis-style AI copilot UI with voice, Cursor desktop integration, and an iPhone home-screen app (no Mac required).

## iPhone only (no Mac)

Apple will not let us put a true App Store build on your phone without a Mac + Apple Developer account.  
On a standalone iPhone, CwayClient installs as a **Home Screen app** (Safari WebView shell):

1. Open in **Safari** (not TikTok / Instagram / Chrome in-app browser):  
   https://litter.catbox.moe/… *(latest link in PR)* or GitHub Pages after deploy
2. Tap **Share** (square with ↑ at the bottom)
3. Tap **Add to Home Screen** → **Add**
4. Launch **CwayClient** from your home screen (looks like a normal app)
5. **Voice on iPhone:** Settings → provider **OpenAI-compatible** → paste an [OpenAI API key](https://platform.openai.com/api-keys)  
   Mic recording uses Safari; speech-to-text uses Whisper. Typing always works without a key.

If iOS says mic is blocked: **Settings → Safari → Microphone → Allow**, or **Settings → CwayClient → Microphone**.

## Desktop (Cursor models + real OS actions)

```bash
npm install
npm start
```

Settings → Cursor API key from https://cursor.com/dashboard/api → pick any model.

## Android / iOS native (needs a computer)

```bash
npm run mobile:sync
npm run mobile:android   # Android Studio
npm run mobile:ios       # Xcode on a Mac
```

## Layout

```
web/        UI (iPhone Home Screen app + desktop UI)
electron/   desktop + Cursor SDK + OS commands
android/    Capacitor Android (optional)
ios/        Capacitor iOS (needs Mac)
```
