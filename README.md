# CwayClient

Desktop AI copilot (Dexter / Jarvis-style) with a polished webview UI, real OS commands, voice, and **direct Cursor model access** via the official `@cursor/sdk`.

## Mobile UI demo (phone)

**Open on your phone:**  
https://litter.catbox.moe/3zg2ny.html

(Older snapshot — rebuild `web/phone.html` after UI changes, or use GitHub Pages after merge.)

**GitHub Pages (after merge):**  
https://sun751510-ops.github.io/CursorUi/

## Desktop (Cursor-powered)

```bash
npm install
npm start
```

1. Open **Settings**
2. Provider: **Cursor**
3. Paste your API key from [cursor.com/dashboard/api](https://cursor.com/dashboard/api)
4. Click **Test** / **Refresh models** in the left rail
5. Pick any model on your plan (Composer, Claude, GPT, Gemini, `auto`, …)

CwayClient creates a local Cursor Agent with custom tools (`run_cway_command`, `add_cway_command`, `list_cway_commands`) so the model you choose can control this machine.

## What it feels like

Inspired by streamer-copilot UIs (e.g. Dexter): reactive orb, hold-to-talk voice, command rail, live status while Cursor thinks/tools run.

## Prebuilt OS commands

Open URL/path/app, list/read/write files, shell (with confirm), clipboard, notify, system info, home folder — plus AI-invented custom commands.

## Fallback

Settings → provider **OpenAI-compatible** still works with any `/v1/chat/completions` endpoint if you are not using Cursor.

## Layout

```
electron/   main, preload, Cursor bridge, OS executors
web/        UI (desktop + mobile demo)
legacy/     previous Macro Studio
```
