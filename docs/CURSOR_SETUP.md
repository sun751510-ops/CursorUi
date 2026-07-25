# Cursor Cloud setup for CwayClient

CwayClient talks to **Cursor Cloud Agents** through a Cloudflare Worker proxy (Safari cannot call `api.cursor.com` directly because of CORS). No desktop app is required on holiday — everything is cloud-connected.

## 1. Get a Cursor API key

1. Open [cursor.com/dashboard/api](https://cursor.com/dashboard/api) while signed in.
2. Create an API key.
3. Copy it — it starts with `crsr_`.

## 2. Paste it into CwayClient

1. Open the Worker URL in Safari (or the Home Screen app).
2. Settings → **Cursor API key** → paste → Save.
3. **Proxy URL** should already be this Worker (`https://….workers.dev`).
4. Tap **Test** in the rail. You should see model count and “Cursor OK”.

Keys can also be pre-filled at build time via gitignored `secrets.local.json`:

```json
{
  "cursorApiKey": "crsr_…",
  "elevenLabsKey": "sk_…",
  "proxyUrl": "https://your-worker.workers.dev"
}
```

## 3. Pick a model (Fable 5 / Grok 4.5)

In the left rail **Model** menu:

| Option | Engine |
| --- | --- |
| **Instant (Workers AI)** | Ultra-fast Cloudflare Llama — no Cursor usage |
| **auto (Cursor default)** | Your Cursor account default |
| **Fable 5** / **Fable 5 Thinking** | Claude Fable 5 via Cloud Agents |
| **Grok 4.5** / **Grok 4.5 Fast** | Cursor × SpaceXAI Grok |
| Other live models | Whatever `GET /v1/models` returns for your plan |

Selecting Fable 5 or Grok 4.5 routes chat through **Cursor Cloud Agents** (streamed). Instant stays on Workers AI.

### Fable 5 enablement

Fable 5 may require acknowledging Anthropic’s data-retention policy in the Cursor dashboard before it appears / works:

- [Enable Fable 5](https://cursor.com/dashboard/restricted_models/claude-fable-5)

If create-agent fails with a model error, switch to Grok 4.5 or Instant, or enable Fable in the dashboard.

## 4. How auth works under the hood

```
iPhone / desktop browser
   │  Authorization: Bearer crsr_…
   │  x-cursor-path: /v1/agents | /v1/models | …/stream
   ▼
Cloudflare Worker (this app)
   │  forwards Authorization
   ▼
https://api.cursor.com
```

- The Worker never stores your key; it only proxies the request.
- Agent runs use the streaming endpoint `/v1/agents/{id}/runs/{runId}/stream` so tokens appear as Cursor generates them.
- If Cursor fails, Instant (Workers AI) is used as a safety net.

## 5. Voice (near real-time)

With an ElevenLabs key:

1. Mic opens a **realtime** Scribe session (`scribe_v2_realtime`) via a single-use token from `POST /stt-token`.
2. Partials appear in the prompt as you speak (~150 ms class latency).
3. Tap mic again → commit → send to Cursor / Instant.
4. If realtime is unavailable, falls back to batch `scribe_v2` MediaRecorder upload.

## 6. Claim the Worker

Temporary `*.workers.dev` previews **expire** if you don’t claim them. Use the claim link in `cloudflare/DEPLOYED.md` so the URL stays permanent.
