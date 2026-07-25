# Live app

**Open in Safari:**  
https://cwayclient-cursor-proxy.half-periwinkle.workers.dev

**Claim now (do this — temporary Workers die if left unclaimed):**  
https://dash.cloudflare.com/claim-preview?claimToken=HKquRVE8tV_hyy2-wgNrrbahiEK84At488-lAFG0cbM

Cursor + ElevenLabs keys pre-filled. JARVIS coordinator system prompt live.

**Instant replies:** answers stream word-by-word (Workers AI SSE) on the `llama-3.1-8b-instruct-fast` model, and the proxy health probe is cached so no round-trips happen before the AI call.

**English:** replies and speech recognition are locked to English unless you explicitly ask for another language.

**Cursor Cloud:** pick Fable 5 / Grok 4.5 / Composer in the rail after pasting a `crsr_` API key (see `docs/CURSOR_SETUP.md`). Agent replies stream over SSE. Model `instant` keeps the ultra-fast Workers AI path.

**Realtime mic:** ElevenLabs `scribe_v2_realtime` via `/stt-token` (live partials while you speak); batch `scribe_v2` fallback.

**New OS shell:** Home dashboard with greeting + quick actions, Chat, Memory, Tasks, Notes and Settings views, bottom navigation with a floating voice orb, full-screen voice mode (glowing sphere, waveform, live transcript), command palette (Ctrl/Cmd + K), desktop sidebar + live system panel, particle backdrop, Inter typography, matte-black glassmorphism design. Memories saved on the Memory screen are sent to the AI with every fast-chat request.
