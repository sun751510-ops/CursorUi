# CwayClient

Dexter / Jarvis-style AI copilot with a webview UI, voice, OS commands (desktop), and **Cursor model access** via `@cursor/sdk`.

## Real mobile app (recommended for mic)

The website mic is often blocked by browsers. Use the **native Capacitor app** (real WebView + device speech APIs).

```bash
npm install
npm run mobile:sync
```

### Android phone
1. Install [Android Studio](https://developer.android.com/studio)
2. Plug in your phone (USB debugging on) **or** use an emulator
3. From this repo:
   ```bash
   npm run mobile:android
   ```
   Or: `npm run mobile:run:android`
4. In Android Studio → **Run** ▶ on your device  
5. When prompted, **Allow microphone** + speech recognition

### iPhone
1. Needs a Mac with [Xcode](https://developer.apple.com/xcode/)
2. From this repo:
   ```bash
   npm run mobile:ios
   ```
3. In Xcode: select your iPhone → **Run** ▶  
4. Trust the developer certificate on the phone if asked  
5. Allow **Microphone** and **Speech Recognition**

Project folders: `android/` and `ios/` (Capacitor WebView hosts `web/`).

## Website demo (UI only)

https://litter.catbox.moe/77fen5.html  

Mic often fails here — that’s a browser limit, not the app. Use the native build above for voice.

## Desktop app

```bash
npm install
npm start              # Electron desktop
npm run dist:win       # .exe
npm run dist:mac       # .dmg
npm run dist:linux     # .AppImage
```

## Cursor AI (desktop)

1. Settings → provider **Cursor**
2. API key from https://cursor.com/dashboard/api
3. Refresh models → pick any model on your plan

## Layout

```
electron/   desktop app + Cursor bridge + OS commands
web/        UI loaded by Electron + Capacitor
android/    native Android WebView app
ios/        native iOS WebView app
legacy/     old Macro Studio
```
