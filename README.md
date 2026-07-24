# CwayClient

Desktop Jarvis assistant with a polished webview UI, prebuilt OS commands, and an AI that can run or invent new commands.

## Mobile UI demo (phone)

**Open on your phone now:**  
https://litter.catbox.moe/3zg2ny.html

Self-contained copy also lives at [`web/phone.html`](web/phone.html).

**GitHub Pages (after merge + Pages enabled):**  
https://sun751510-ops.github.io/CursorUi/

OS actions are simulated in the browser demo. Layout, chat, command rail, and “AI invents a command” all work on phone.

## Desktop app (real OS actions)

```bash
npm install
npm start
```

Requires Node.js 18+. Electron window loads the same UI via secure preload bridge.

### Settings

Open **Settings** in the app and set:

| Field | Recommendation |
| --- | --- |
| API base URL | `https://api.openai.com/v1` or OpenRouter `https://openrouter.ai/api/v1` |
| Model | **`gpt-4o`** (default) or **`anthropic/claude-sonnet-4`** on OpenRouter |
| API key | Your provider key |

**Best model for this project:** a strong **tool-calling** chat model. Prefer **GPT-4o** or **Claude Sonnet 4** — both reliably call `run_command` / `add_command`. Local models work via any OpenAI-compatible proxy, but cloud tool-calling models feel more Jarvis-like.

## What it can do

**Prebuilt commands:** open URL, open/reveal path, list/read/write files, run shell (with confirm), open app, system info, clipboard, notify, open home.

**AI tools:** `list_commands`, `run_command`, `add_command` (persist custom shell/url/path commands with `{{param}}` templates).

## Project layout

```
electron/     main process, preload, AI tool loop
web/          UI (also the mobile demo)
legacy/       previous Macro Studio single-file UI
```

## Local demo server

```bash
npm run demo
```

Then open the printed localhost URL on your phone if you’re on the same network.
