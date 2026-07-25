(() => {
  const SUGGESTIONS = [
    'What can you do?',
    'Connect me through Cursor',
    'Show system info',
    'Open https://github.com',
    'Create a command to open Downloads'
  ];
  const SUGGESTIONS_MOBILE = [
    'What can you do?',
    'Help me get started',
    'Show system info'
  ];

  const DEMO_MODELS = [
    { id: 'auto', displayName: 'auto (Cursor default)' },
    { id: 'composer-2.5', displayName: 'Composer 2.5' },
    { id: 'claude-4.6-sonnet-medium-thinking', displayName: 'Claude 4.6 Sonnet' },
    { id: 'gpt-5.3-codex', displayName: 'GPT-5.3 Codex' },
    { id: 'gemini-3.1-pro', displayName: 'Gemini 3.1 Pro' }
  ];

  const DEMO_BUILTINS = [
    { id: 'open_url', name: 'Open URL', description: 'Open a website in the default browser', category: 'system', params: [{ key: 'url', label: 'URL', type: 'string', required: true }], builtin: true },
    { id: 'open_path', name: 'Open Path', description: 'Open a file or folder', category: 'files', params: [{ key: 'path', label: 'Path', type: 'string', required: true }], builtin: true },
    { id: 'reveal_path', name: 'Reveal in File Manager', description: 'Show a path in the file manager', category: 'files', params: [{ key: 'path', label: 'Path', type: 'string', required: true }], builtin: true },
    { id: 'list_dir', name: 'List Directory', description: 'List files in a directory', category: 'files', params: [{ key: 'path', label: 'Path', type: 'string', required: true }], builtin: true },
    { id: 'read_file', name: 'Read File', description: 'Read a text file', category: 'files', params: [{ key: 'path', label: 'Path', type: 'string', required: true }], builtin: true },
    { id: 'write_file', name: 'Write File', description: 'Write text to a file', category: 'files', params: [{ key: 'path', label: 'Path', type: 'string', required: true }, { key: 'content', label: 'Content', type: 'string', required: true }], builtin: true },
    { id: 'run_shell', name: 'Run Shell', description: 'Run a shell command', category: 'system', params: [{ key: 'command', label: 'Command', type: 'string', required: true }], builtin: true },
    { id: 'open_app', name: 'Open App', description: 'Launch an application', category: 'system', params: [{ key: 'target', label: 'App', type: 'string', required: true }], builtin: true },
    { id: 'system_info', name: 'System Info', description: 'Get host system information', category: 'system', params: [], builtin: true },
    { id: 'clipboard_read', name: 'Read Clipboard', description: 'Read clipboard text', category: 'util', params: [], builtin: true },
    { id: 'clipboard_write', name: 'Write Clipboard', description: 'Write clipboard text', category: 'util', params: [{ key: 'text', label: 'Text', type: 'string', required: true }], builtin: true },
    { id: 'notify', name: 'Notify', description: 'Show a notification', category: 'util', params: [{ key: 'title', label: 'Title', type: 'string', required: true }, { key: 'body', label: 'Body', type: 'string', required: true }], builtin: true },
    { id: 'open_home', name: 'Open Home Folder', description: 'Open the user home directory', category: 'files', params: [], builtin: true }
  ];

  const els = {
    app: document.getElementById('app'),
    rail: document.getElementById('rail'),
    menuBtn: document.getElementById('menuBtn'),
    railClose: document.getElementById('railClose'),
    modeBadge: document.getElementById('modeBadge'),
    statusLine: document.getElementById('statusLine'),
    fineprint: document.getElementById('fineprint'),
    heroStrip: document.getElementById('heroStrip'),
    heroEyebrow: document.getElementById('heroEyebrow'),
    orb: document.getElementById('orb'),
    orbBtn: document.getElementById('orbBtn'),
    chat: document.getElementById('chat'),
    composer: document.getElementById('composer'),
    prompt: document.getElementById('prompt'),
    sendBtn: document.getElementById('sendBtn'),
    micBtn: document.getElementById('micBtn'),
    suggestions: document.getElementById('suggestions'),
    cmdList: document.getElementById('cmdList'),
    cmdFilter: document.getElementById('cmdFilter'),
    btnClearChat: document.getElementById('btnClearChat'),
    btnSettings: document.getElementById('btnSettings'),
    btnAddCommand: document.getElementById('btnAddCommand'),
    settingsModal: document.getElementById('settingsModal'),
    commandModal: document.getElementById('commandModal'),
    runModal: document.getElementById('runModal'),
    answerModeModal: document.getElementById('answerModeModal'),
    speechPermModal: document.getElementById('speechPermModal'),
    settingsForm: document.getElementById('settingsForm'),
    commandForm: document.getElementById('commandForm'),
    runForm: document.getElementById('runForm'),
    answerModeForm: document.getElementById('answerModeForm'),
    speechPermForm: document.getElementById('speechPermForm'),
    runFields: document.getElementById('runFields'),
    runTitle: document.getElementById('runTitle'),
    runDesc: document.getElementById('runDesc'),
    modelSelect: document.getElementById('modelSelect'),
    cursorDot: document.getElementById('cursorDot'),
    cursorStatus: document.getElementById('cursorStatus'),
    btnRefreshModels: document.getElementById('btnRefreshModels'),
    btnTestCursor: document.getElementById('btnTestCursor'),
    setProvider: document.getElementById('setProvider'),
    cursorSettings: document.getElementById('cursorSettings'),
    openaiSettings: document.getElementById('openaiSettings')
  };

  const state = {
    mode: 'demo',
    commands: [],
    messages: [],
    models: [],
    settings: {
      provider: 'cursor',
      cursorApiKey: '',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'auto',
      confirmShell: true,
      voiceEnabled: true,
      hasCursorKey: false,
      hasApiKey: false,
      workspacePath: '',
      elevenLabsKey: '',
      elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
      hasElevenKey: false
    },
    pendingRun: null,
    pendingAnswerMode: null,
    busy: false,
    recognition: null,
    ttsAudio: null
  };

  function loadDemoStore() {
    try {
      return JSON.parse(localStorage.getItem('cwayclient-demo') || '{}');
    } catch {
      return {};
    }
  }

  function saveDemoStore(partial) {
    const cur = loadDemoStore();
    const next = { ...cur, ...partial };
    localStorage.setItem('cwayclient-demo', JSON.stringify(next));
    return next;
  }

  function looksLikeCursorKey(value) {
    return typeof value === 'string' && /^crsr_[A-Za-z0-9]+/.test(value.trim());
  }

  function applyBuiltInDefaults(store) {
    const defaults = window.CWAY_DEFAULTS || {};
    const patch = {};
    const defaultCursor = String(defaults.cursorApiKey || '').trim();
    // Re-seed whenever local key is missing/invalid so Settings + chat both see it
    if (defaultCursor && !looksLikeCursorKey(store.cursorApiKey)) {
      patch.cursorApiKey = defaultCursor;
    }
    if (!store.elevenLabsKey && defaults.elevenLabsKey) {
      patch.elevenLabsKey = String(defaults.elevenLabsKey).trim();
    }
    if (!store.elevenLabsVoiceId && defaults.elevenLabsVoiceId) {
      patch.elevenLabsVoiceId = String(defaults.elevenLabsVoiceId).trim();
    }
    if (!store.proxyUrl && defaults.proxyUrl) {
      patch.proxyUrl = String(defaults.proxyUrl).trim();
    }
    if (
      !store.proxyUrl &&
      !patch.proxyUrl &&
      typeof location !== 'undefined' &&
      /\.workers\.dev$/i.test(location.hostname)
    ) {
      patch.proxyUrl = location.origin;
    }
    if (Object.keys(patch).length) saveDemoStore(patch);
    return { ...store, ...patch };
  }

  function createDemoBridge() {
    const store = applyBuiltInDefaults(loadDemoStore());
    let custom = store.customCommands || [];
    const defaultProxy =
      store.proxyUrl ||
      (typeof location !== 'undefined' && /\.workers\.dev$/i.test(location.hostname)
        ? location.origin
        : '');
    let settings = {
      provider: store.provider || 'cursor',
      cursorApiKey: store.cursorApiKey || '',
      apiKey: store.apiKey || '',
      baseUrl: store.baseUrl || 'https://api.openai.com/v1',
      model: store.model || 'auto',
      proxyUrl: defaultProxy,
      confirmShell: store.confirmShell !== false,
      voiceEnabled: store.voiceEnabled !== false,
      workspacePath: store.workspacePath || '',
      elevenLabsKey: store.elevenLabsKey || '',
      elevenLabsVoiceId: store.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM',
      hasCursorKey: Boolean(store.cursorApiKey),
      hasApiKey: Boolean(store.apiKey || store.cursorApiKey),
      hasElevenKey: Boolean(store.elevenLabsKey)
    };
    if (defaultProxy && !store.proxyUrl) {
      saveDemoStore({ proxyUrl: defaultProxy });
    }
    let history = store.history || [];
    let agentId = store.cursorAgentId || '';
    const allCommands = () => [...DEMO_BUILTINS, ...custom];

    function rawCursorKey() {
      const s = loadDemoStore();
      return s.cursorApiKey || '';
    }

    function rawProxyUrl() {
      const s = loadDemoStore();
      return s.proxyUrl || settings.proxyUrl || '';
    }

    let statusListener = null;

    async function detectProxyKind(base) {
      if (!base) return 'none';
      // Same Worker that hosts the app
      try {
        if (typeof location !== 'undefined' && base.replace(/\/$/, '') === location.origin) {
          return 'cloud';
        }
      } catch {
        /* ignore */
      }
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch(`${base}/health`, { signal: ctrl.signal });
        clearTimeout(timer);
        const raw = await res.text();
        if (raw.trimStart().startsWith('<!')) {
          if (/workers\.dev|cloudflare/i.test(base)) return 'cloud';
          return 'none';
        }
        const data = JSON.parse(raw);
        if (data.service === 'cwayclient-relay') return 'relay';
        if (data.service === 'cwayclient-cf-proxy') return 'cloud';
      } catch {
        /* ignore */
      }
      if (/workers\.dev|cloudflare/i.test(base)) return 'cloud';
      if (/:3847\b/.test(base) || /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|localhost|127\.)/i.test(base)) {
        return 'relay';
      }
      return 'cloud';
    }

    async function demoChat({ messages }) {
      const last = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      const proxy = rawProxyUrl().replace(/\/$/, '');
      const key = rawCursorKey();

      if ((settings.provider || 'cursor') === 'cursor' && proxy) {
        const kind = await detectProxyKind(proxy);

        // Home: phone → desktop Wi‑Fi relay
        if (kind === 'relay') {
          try {
            const res = await fetch(`${proxy}/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages, model: settings.model || 'auto' })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.ok === false) {
              throw new Error(data.error || `Relay error ${res.status}`);
            }
            return {
              ok: true,
              message: data.message || { role: 'assistant', content: data.text || 'Done.' },
              commands: data.commands || allCommands(),
              provider: 'cursor-relay',
              model: data.model || settings.model
            };
          } catch (err) {
            return {
              ok: false,
              error:
                (err.message || String(err)) +
                ' — Is CwayClient running on your computer? Same Wi‑Fi? Check the relay URL.'
            };
          }
        }

        // Holiday / no PC: phone → Cloudflare Worker → Cursor Cloud Agents
        if (!key) {
          return {
            ok: false,
            error: 'Add your Cursor API key in Settings (needed with the Cloudflare Worker proxy).'
          };
        }
        if (!window.CwayCursorCloud) {
          return { ok: false, error: 'Cursor cloud helper missing — reload the page.' };
        }
        try {
          statusListener?.('Talking to Cursor… (can take up to a minute)');
          const result = await window.CwayCursorCloud.chat({
            apiKey: key,
            proxyUrl: proxy,
            model: settings.model || 'auto',
            userText: last,
            agentId,
            onStatus: (s) => statusListener?.(s)
          });
          if (result.agentId) {
            agentId = result.agentId;
            saveDemoStore({ cursorAgentId: agentId });
          }
          return {
            ok: true,
            message: { role: 'assistant', content: result.text || 'Done.' },
            commands: allCommands(),
            provider: 'cursor-cloud',
            model: settings.model
          };
        } catch (err) {
          // Drop bad cached agent id so the next send creates a fresh one
          if (/404|not found|expired|inactive/i.test(String(err.message || err))) {
            agentId = '';
            saveDemoStore({ cursorAgentId: '' });
          }
          return {
            ok: false,
            error:
              (err.message || String(err)) +
              ' — Open Settings → check Cursor API key + Proxy URL, tap Test. Replies can take ~30–90s.'
          };
        }
      }

      await sleep(400);
      return {
        ok: true,
        message: {
          role: 'assistant',
          content:
            `Got “${last.slice(0, 120)}”.\n\n` +
            `**On holiday (no computer):**\n` +
            `1. Deploy \`cloudflare/worker.js\` on Cloudflare Workers (free)\n` +
            `2. Settings → Proxy URL = \`https://YOUR-NAME.workers.dev\`\n` +
            `3. Paste your Cursor API key → **Test** → mic / type\n\n` +
            `**At home:** run desktop \`npm start\` and use the Wi‑Fi relay URL instead.`
        },
        commands: allCommands(),
        provider: 'cursor-demo'
      };
    }

    return {
      mode: 'demo',
      getBootstrap: async () => ({
        mode: 'demo',
        platform: 'web',
        commands: allCommands(),
        settings: {
          ...settings,
          cursorApiKey: settings.hasCursorKey ? '••••••••' : '',
          apiKey: settings.apiKey ? '••••••••' : '',
          elevenLabsKey: settings.hasElevenKey ? '••••••••' : '',
          elevenLabsVoiceId: settings.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM',
          proxyUrl: settings.proxyUrl || ''
        },
        history
      }),
      getCommands: async () => allCommands(),
      runCommand: async (id, args) => {
        await sleep(250);
        return { ok: true, result: { demo: true, id, args } };
      },
      addCommand: async (payload) => {
        const id = String(payload.id || `custom_${Date.now()}`).replace(/[^a-z0-9_]/gi, '_').toLowerCase();
        if (!payload.shell && !payload.url && !payload.path) return { ok: false, error: 'Provide shell, url, or path' };
        const entry = { ...payload, id, builtin: false, category: payload.category || 'custom' };
        custom = [...custom, entry];
        saveDemoStore({ customCommands: custom });
        return { ok: true, command: entry, commands: allCommands() };
      },
      removeCommand: async (id) => {
        custom = custom.filter((c) => c.id !== id);
        saveDemoStore({ customCommands: custom });
        return { ok: true, commands: allCommands() };
      },
      saveSettings: async (partial) => {
        settings = { ...settings, ...partial };
        if (partial.clearCursorKey) settings.cursorApiKey = '';
        if (partial.clearApiKey) settings.apiKey = '';
        if (partial.clearElevenKey) settings.elevenLabsKey = '';
        const prev = loadDemoStore();
        saveDemoStore({
          provider: settings.provider,
          cursorApiKey: settings.cursorApiKey === '••••••••' ? prev.cursorApiKey : settings.cursorApiKey,
          apiKey: settings.apiKey === '••••••••' ? prev.apiKey : settings.apiKey,
          elevenLabsKey:
            settings.elevenLabsKey === '••••••••' ? prev.elevenLabsKey : settings.elevenLabsKey,
          elevenLabsVoiceId: settings.elevenLabsVoiceId || prev.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM',
          baseUrl: settings.baseUrl,
          model: settings.model,
          proxyUrl: settings.proxyUrl,
          confirmShell: settings.confirmShell,
          voiceEnabled: settings.voiceEnabled,
          workspacePath: settings.workspacePath
        });
        const saved = loadDemoStore();
        settings.hasCursorKey = Boolean(saved.cursorApiKey);
        settings.hasApiKey = Boolean(saved.apiKey || saved.cursorApiKey);
        settings.hasElevenKey = Boolean(saved.elevenLabsKey);
        settings.elevenLabsVoiceId = saved.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM';
        settings.proxyUrl = saved.proxyUrl || '';
        return {
          ok: true,
          settings: {
            ...settings,
            cursorApiKey: settings.hasCursorKey ? '••••••••' : '',
            apiKey: saved.apiKey ? '••••••••' : '',
            elevenLabsKey: settings.hasElevenKey ? '••••••••' : '',
            proxyUrl: settings.proxyUrl
          }
        };
      },
      saveHistory: async (h) => {
        history = Array.isArray(h) ? h.slice(-80) : [];
        saveDemoStore({ history });
        return { ok: true };
      },
      listModels: async () => {
        const proxy = rawProxyUrl().replace(/\/$/, '');
        const key = rawCursorKey();
        if (proxy) {
          const kind = await detectProxyKind(proxy);
          if (kind === 'relay') {
            try {
              const res = await fetch(`${proxy}/models`);
              const data = await res.json();
              if (res.ok && data.models?.length) return { ok: true, models: data.models };
            } catch {
              /* fall through */
            }
          } else if (key && window.CwayCursorCloud) {
            try {
              const models = await window.CwayCursorCloud.listModels({ apiKey: key, proxyUrl: proxy });
              if (models?.length) return { ok: true, models };
            } catch {
              /* fall through */
            }
          }
        }
        return { ok: true, models: DEMO_MODELS };
      },
      testCursor: async () => {
        const proxy = rawProxyUrl().replace(/\/$/, '');
        const key = rawCursorKey();
        if (!proxy) {
          return {
            ok: false,
            error: 'Set Proxy URL (Cloudflare Worker on holiday, or desktop relay at home)',
            models: DEMO_MODELS
          };
        }
        const kind = await detectProxyKind(proxy);
        if (kind === 'relay') {
          try {
            const res = await fetch(`${proxy}/health`);
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Relay unhealthy');
            const modelsRes = await fetch(`${proxy}/models`);
            const modelsData = await modelsRes.json().catch(() => ({}));
            return {
              ok: true,
              message: `Relay OK · ${data.ips?.[0] || 'desktop'} · model ${data.model || 'auto'}`,
              models: modelsData.models || DEMO_MODELS
            };
          } catch (err) {
            return {
              ok: false,
              error: `${err.message || err} — start CwayClient on your PC (same Wi‑Fi)`,
              models: DEMO_MODELS
            };
          }
        }
        if (!key) {
          return {
            ok: false,
            error: 'Add Cursor API key (required for Cloudflare Worker)',
            models: DEMO_MODELS
          };
        }
        if (!window.CwayCursorCloud) {
          return { ok: false, error: 'Reload the page — cloud helper missing', models: DEMO_MODELS };
        }
        try {
          const tested = window.CwayCursorCloud.test
            ? await window.CwayCursorCloud.test({ apiKey: key, proxyUrl: proxy })
            : { models: await window.CwayCursorCloud.listModels({ apiKey: key, proxyUrl: proxy }) };
          const models = tested.models || [];
          return {
            ok: true,
            message: `Cursor OK via Worker · ${models.length} models — type a message (Cloud Agents can take ~30–90s)`,
            models: models.length ? models : DEMO_MODELS
          };
        } catch (err) {
          return {
            ok: false,
            error: `${err.message || err} — check Cursor API key + Proxy URL (claim Worker if link died)`,
            models: DEMO_MODELS
          };
        }
      },
      chat: demoChat,
      onStatus: (cb) => {
        statusListener = typeof cb === 'function' ? cb : null;
        return () => {
          statusListener = null;
        };
      }
    };
  }

  const api = window.cway || createDemoBridge();

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function setStatus(text) {
    els.statusLine.textContent = text;
  }

  function setOrb(stateName) {
    els.orb.dataset.state = stateName || 'idle';
  }

  function openRail(open) {
    els.rail.classList.toggle('open', open);
    document.body.classList.toggle('drawer-open', open);
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function formatMarkdownLite(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function rawElevenKey() {
    try {
      const store = JSON.parse(localStorage.getItem('cwayclient-demo') || '{}');
      if (store.elevenLabsKey) return store.elevenLabsKey;
    } catch {
      /* ignore */
    }
    const fromState = state.settings?.elevenLabsKey;
    if (fromState && fromState !== '••••••••') return fromState;
    return '';
  }

  function proxyBase() {
    const fromSettings = (state.settings.proxyUrl || '').replace(/\/$/, '');
    if (fromSettings) return fromSettings;
    if (typeof location !== 'undefined' && /\.workers\.dev$/i.test(location.hostname)) {
      return location.origin;
    }
    return '';
  }

  function askDialogChoice(modal, allowedValues, fallback) {
    return new Promise((resolve) => {
      if (!modal) {
        resolve(fallback);
        return;
      }
      const onClose = () => {
        modal.removeEventListener('close', onClose);
        const val = String(modal.returnValue || '');
        resolve(allowedValues.includes(val) ? val : fallback);
      };
      modal.addEventListener('close', onClose);
      try {
        modal.returnValue = fallback;
        modal.showModal();
      } catch {
        resolve(fallback);
      }
    });
  }

  function askAnswerMode() {
    return askDialogChoice(els.answerModeModal, ['typed', 'spoken'], 'typed');
  }

  function speechConsent() {
    return localStorage.getItem('cway-speech-perm');
  }

  function setSpeechConsent(value) {
    localStorage.setItem('cway-speech-perm', value);
  }

  function denySpeechMessage() {
    setStatus('Speech off — type instead');
    appendMessage({
      role: 'system',
      content:
        'No problem — type below. Tap the mic again anytime and choose **Allow** for speech recognition.'
    });
  }

  /**
   * Ask once for in-app speech consent. On Allow, starts listening inside that tap
   * (iOS requires SpeechRecognition.start / getUserMedia in the same user gesture).
   */
  function ensureSpeechPermissionThen(startListening) {
    const saved = speechConsent();
    if (saved === 'allow') {
      startListening();
      return;
    }
    if (saved === 'deny') {
      denySpeechMessage();
      return;
    }
    if (!els.speechPermModal || !els.speechPermForm) {
      setSpeechConsent('allow');
      startListening();
      return;
    }

    setStatus('Allow speech recognition?');
    const onClick = (e) => {
      const btn = e.target.closest('button[value]');
      if (!btn) return;
      const choice = btn.value === 'allow' ? 'allow' : 'deny';
      setSpeechConsent(choice);
      els.speechPermForm.removeEventListener('click', onClick, true);
      if (choice === 'allow') {
        // Still inside the Allow tap — start before the dialog closes.
        startListening();
      } else {
        denySpeechMessage();
      }
    };
    els.speechPermForm.addEventListener('click', onClick, true);
    try {
      els.speechPermModal.returnValue = 'deny';
      els.speechPermModal.showModal();
    } catch {
      setSpeechConsent('allow');
      startListening();
    }
  }

  async function sendAfterVoice(text) {
    const content = String(text || '').trim();
    if (!content || state.busy) return;
    setStatus('How should I answer?');
    const mode = await askAnswerMode();
    state.pendingAnswerMode = mode;
    setStatus(mode === 'spoken' ? 'Got it — answering out loud…' : 'Got it — typing reply…');
    await handleSend(content);
  }

  function speakBrowser(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*`#_]/g, ' ').slice(0, 500));
    u.rate = 1.05;
    setOrb('speaking');
    u.onend = () => setOrb(state.busy ? 'thinking' : 'idle');
    u.onerror = () => setOrb('idle');
    window.speechSynthesis.speak(u);
  }

  async function speakElevenLabs(text) {
    const key = rawElevenKey();
    const proxy = proxyBase();
    const voiceId = state.settings.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM';
    if (!key) {
      setStatus('Add ElevenLabs API key in Settings for spoken answers');
      speakBrowser(text);
      return;
    }
    if (!proxy) {
      setStatus('Set Proxy URL for ElevenLabs voice');
      speakBrowser(text);
      return;
    }
    try {
      setStatus('Speaking…');
      setOrb('speaking');
      const res = await fetch(`${proxy}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-elevenlabs-key': key
        },
        body: JSON.stringify({
          text: String(text || '').replace(/[*`#_]/g, ' ').slice(0, 4500),
          voiceId
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `ElevenLabs ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (state.ttsAudio) {
        try {
          state.ttsAudio.pause();
        } catch {
          /* ignore */
        }
      }
      const audio = new Audio(url);
      state.ttsAudio = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setOrb(state.busy ? 'thinking' : 'idle');
        setStatus('Standing by');
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setOrb('idle');
        setStatus('Voice playback failed');
      };
      await audio.play();
    } catch (err) {
      setStatus(err.message || 'ElevenLabs failed — using device voice');
      speakBrowser(text);
    }
  }

  async function deliverReply(text) {
    const mode = state.pendingAnswerMode;
    state.pendingAnswerMode = null;
    if (mode === 'spoken') {
      await speakElevenLabs(text);
      return;
    }
    // typed (or keyboard send) — show text only
    setOrb('idle');
  }

  function speak(text) {
    if (!state.settings.voiceEnabled) return;
    if (rawElevenKey()) {
      speakElevenLabs(text);
      return;
    }
    speakBrowser(text);
  }

  function renderSuggestions() {
    els.suggestions.innerHTML = '';
    const mobile = window.matchMedia('(max-width: 900px)').matches;
    const list = mobile ? SUGGESTIONS_MOBILE : SUGGESTIONS;
    list.forEach((text) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.addEventListener('click', () => {
        els.prompt.value = text;
        autoGrow();
        handleSend(text);
      });
      els.suggestions.appendChild(b);
    });
  }

  function renderCommands(filter = '') {
    const q = filter.trim().toLowerCase();
    const list = state.commands.filter((c) => {
      if (!q) return true;
      return `${c.name} ${c.description} ${c.id} ${c.category}`.toLowerCase().includes(q);
    });
    els.cmdList.innerHTML = '';
    list.forEach((cmd) => {
      const btn = document.createElement('button');
      btn.className = 'cmd-item';
      btn.type = 'button';
      btn.innerHTML = `<strong>${escapeHtml(cmd.name)}</strong><span>${escapeHtml(cmd.description)}</span><span class="tag">${escapeHtml(cmd.category || 'cmd')}</span>`;
      btn.addEventListener('click', () => openRunModal(cmd));
      els.cmdList.appendChild(btn);
    });
  }

  function renderModels(models) {
    state.models = models || [];
    const current = state.settings.model || 'auto';
    const opts = [{ id: 'auto', displayName: 'auto (Cursor default)' }, ...state.models.filter((m) => m.id !== 'auto')];
    const seen = new Set();
    els.modelSelect.innerHTML = '';
    opts.forEach((m) => {
      if (seen.has(m.id)) return;
      seen.add(m.id);
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = m.displayName || m.id;
      if (m.id === current) o.selected = true;
      els.modelSelect.appendChild(o);
    });
    if (![...els.modelSelect.options].some((o) => o.value === current)) {
      const o = document.createElement('option');
      o.value = current;
      o.textContent = current;
      o.selected = true;
      els.modelSelect.appendChild(o);
    }
  }

  function updateCursorCard() {
    const connected = Boolean(state.settings.hasCursorKey) && (state.settings.provider || 'cursor') === 'cursor';
    els.cursorDot.classList.toggle('ok', connected);
    els.cursorDot.classList.toggle('bad', !connected && state.mode === 'desktop');
    els.cursorStatus.textContent = connected
      ? `Cursor key saved · model ${state.settings.model || 'auto'}`
      : 'Settings → paste Cursor API key';
  }

  function fillSecretInputs() {
    const cursorEl = document.getElementById('setCursorKey');
    const apiEl = document.getElementById('setApiKey');
    const elevenEl = document.getElementById('setElevenKey');
    if (cursorEl) {
      cursorEl.value = state.settings.hasCursorKey ? '••••••••' : '';
      cursorEl.placeholder = state.settings.hasCursorKey
        ? 'Saved on this phone — tap to replace'
        : 'From cursor.com/dashboard/api';
    }
    if (apiEl) {
      apiEl.value = state.settings.hasApiKey && state.settings.provider === 'openai' ? '••••••••' : '';
    }
    if (elevenEl) {
      elevenEl.value = state.settings.hasElevenKey ? '••••••••' : '';
      elevenEl.placeholder = state.settings.hasElevenKey
        ? 'Saved — tap to replace'
        : 'From elevenlabs.io → Profile → API key';
    }
    const hint = document.getElementById('cursorHint');
    if (hint) {
      hint.innerHTML = state.settings.hasCursorKey
        ? `<strong>Cursor API key is saved</strong> on this phone (shown as dots above). Proxy URL should be this site. Tap <strong>Test</strong> if chat fails.`
        : `<strong>Holiday (no PC):</strong> paste your Cursor API key above (or open the deployed Worker URL that pre-fills it) → set Proxy URL → <strong>Test</strong>.` +
          `<br /><strong>At home:</strong> desktop <code>npm start</code> relay like <code>http://192.168.x.x:3847</code>.`;
    }
  }

  function wireSecretClearOnEdit() {
    ['setCursorKey', 'setApiKey', 'setElevenKey'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.clearWired === '1') return;
      el.dataset.clearWired = '1';
      el.addEventListener('focus', () => {
        if (el.value === '••••••••') el.value = '';
      });
    });
  }

  function lockViewport() {
    const apply = () => {
      const vv = window.visualViewport;
      const h = Math.round(vv?.height || window.innerHeight || document.documentElement.clientHeight || 0);
      if (!h) return;
      document.documentElement.style.setProperty('--vvh', `${h}px`);
      // Keep fixed app pinned to the visual viewport (iOS Safari)
      if (document.body.classList.contains('is-phone') && els.app) {
        const top = Math.round(vv?.offsetTop || 0);
        els.app.style.top = `${top}px`;
        els.app.style.height = `${h}px`;
      }
    };
    apply();
    if (!lockViewport._bound) {
      lockViewport._bound = true;
      window.visualViewport?.addEventListener('resize', apply);
      window.visualViewport?.addEventListener('scroll', apply);
      window.addEventListener('resize', apply);
      window.addEventListener('orientationchange', () => setTimeout(apply, 150));
    }
  }

  function appendMessage(msg, opts = {}) {
    const div = document.createElement('div');
    div.className = `msg ${msg.role}`;
    let content = msg.content || '';
    // Keep phone DOM light — huge past dumps break the layout
    if (document.body.classList.contains('is-phone') && content.length > 1200) {
      content = `${content.slice(0, 1200)}…`;
    }
    if (msg.role === 'assistant') {
      div.innerHTML = `<span class="meta">CwayClient</span>${formatMarkdownLite(content)}`;
    } else if (msg.role === 'user') {
      div.textContent = content;
    } else if (msg.role === 'tool') {
      if (document.body.classList.contains('is-phone')) return; // skip tool dumps on phone
      div.innerHTML = `<span class="meta">tool · ${escapeHtml(msg.name || 'action')}</span>${escapeHtml(content)}`;
    } else {
      div.textContent = content;
    }
    els.chat.appendChild(div);
    if (!opts.skipScroll) {
      requestAnimationFrame(() => {
        els.chat.scrollTop = els.chat.scrollHeight;
        lockViewport();
      });
    }
    els.heroStrip.classList.add('collapsed');
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'msg assistant';
    div.id = 'typing';
    div.innerHTML = `<span class="meta">CwayClient</span><span class="typing"><i></i><i></i><i></i></span>`;
    els.chat.appendChild(div);
    els.chat.scrollTop = els.chat.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('typing')?.remove();
  }

  function openRunModal(cmd) {
    state.pendingRun = cmd;
    els.runTitle.textContent = cmd.name;
    els.runDesc.textContent = cmd.description;
    els.runFields.innerHTML = '';
    (cmd.params || []).forEach((p) => {
      const label = document.createElement('label');
      label.innerHTML = `<span>${escapeHtml(p.label || p.key)}${p.required ? ' *' : ''}</span>`;
      const input = document.createElement('input');
      input.name = p.key;
      input.dataset.key = p.key;
      input.required = Boolean(p.required);
      input.placeholder = p.key;
      label.appendChild(input);
      els.runFields.appendChild(label);
    });
    openRail(false);
    els.runModal.showModal();
  }

  async function persistHistory() {
    let slim = state.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: String(m.content || '') }));
    if (document.body.classList.contains('is-phone')) {
      slim = slim
        .map((m) => ({ ...m, content: m.content.slice(0, 500) }))
        .slice(-4);
    } else {
      slim = slim.slice(-80);
    }
    await api.saveHistory(slim);
  }

  async function refreshModels(force = false) {
    const res = await api.listModels({ force });
    if (res.ok) renderModels(res.models);
    return res;
  }

  async function handleSend(text) {
    const content = text.trim();
    if (!content || state.busy) return;
    state.busy = true;
    els.sendBtn.disabled = true;
    setOrb('thinking');
    setStatus('Thinking…');

    const userMsg = { role: 'user', content };
    state.messages.push(userMsg);
    appendMessage(userMsg);
    els.prompt.value = '';
    autoGrow();
    showTyping();

    const offStatus = api.onStatus?.((s) => setStatus(s));

    try {
      const history = state.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));
      const result = await api.chat({ messages: history });
      hideTyping();

      if (!result.ok) {
        const err = { role: 'assistant', content: result.error || 'Request failed.' };
        state.messages.push(err);
        appendMessage(err);
        setOrb('idle');
      } else {
        if (result.trace?.length) {
          result.trace.forEach((t) => {
            appendMessage({
              role: 'tool',
              name: t.tool,
              content: JSON.stringify(t.result, null, 2).slice(0, 1200)
            });
          });
        }
        if (result.commands) {
          state.commands = result.commands;
          renderCommands(els.cmdFilter.value);
        }
        state.messages.push(result.message);
        appendMessage(result.message);
        await deliverReply(result.message.content);
      }
      await persistHistory();
      if (!state.ttsAudio || state.ttsAudio.paused) {
        setStatus(state.mode === 'demo' ? 'Demo mode · UI preview' : 'Standing by');
      }
    } catch (err) {
      hideTyping();
      const msg = { role: 'assistant', content: err.message || String(err) };
      state.messages.push(msg);
      appendMessage(msg);
      setStatus('Error');
      setOrb('idle');
    } finally {
      offStatus?.();
      state.busy = false;
      els.sendBtn.disabled = false;
      els.prompt.focus();
    }
  }

  function autoGrow() {
    const el = els.prompt;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  function setupVoice() {
    state.listening = false;
    const idleStatus = () =>
      setStatus(
        window.CwayNative?.isNative?.()
          ? 'App mode · standing by'
          : state.mode === 'demo'
            ? 'Demo mode · UI preview'
            : 'Standing by'
      );

    const setListeningUi = (on) => {
      state.listening = on;
      els.micBtn.classList.toggle('hot', on);
      els.orbBtn.classList.toggle('hot', on);
      if (on) {
        setOrb('listening');
        setStatus('Listening… tap again to send');
      } else if (!state.busy) {
        setOrb('idle');
      }
    };

    // Prefer native Capacitor speech inside the real mobile app WebView
    if (window.CwayNative?.isNative?.()) {
      let finalText = '';
      let hadResult = false;
      let removePartial = null;
      let removeListening = null;

      async function toggleNative(e) {
        e.preventDefault();
        e.stopPropagation();
        if (state.busy) return;

        if (state.listening) {
          await window.CwayNative.speech.stop();
          setListeningUi(false);
          const text = (finalText || els.prompt.value).trim();
          if (text && hadResult) handleSend(text);
          else idleStatus();
          return;
        }

        const available = await window.CwayNative.speech.available();
        if (!available) {
          setStatus('Speech not available on this device — type instead');
          return;
        }
        const permitted = await window.CwayNative.speech.requestPermissions();
        if (!permitted) {
          setStatus('Allow mic + speech in phone Settings → CwayClient');
          return;
        }

        finalText = '';
        hadResult = false;
        removePartial?.();
        removeListening?.();
        removePartial = await window.CwayNative.speech.addPartialListener((text) => {
          if (!text) return;
          hadResult = true;
          finalText = text;
          els.prompt.value = text;
          autoGrow();
        });
        removeListening = await window.CwayNative.speech.addListeningListener((status) => {
          if (status === 'stopped') {
            setListeningUi(false);
            const text = (finalText || els.prompt.value).trim();
            if (!state.busy && text && hadResult) handleSend(text);
            else if (!state.busy) idleStatus();
          }
        });

        try {
          setListeningUi(true);
          const result = await window.CwayNative.speech.start();
          const match = result?.matches?.[0];
          if (match) {
            hadResult = true;
            finalText = match;
            els.prompt.value = match;
            autoGrow();
          }
          // iOS often resolves start() when utterance finishes
          if (!state.listening) return;
          setListeningUi(false);
          const text = (finalText || els.prompt.value).trim();
          if (text && hadResult) handleSend(text);
          else idleStatus();
        } catch (err) {
          setListeningUi(false);
          setStatus(err?.message || 'Native mic failed — type instead');
        }
      }

      els.micBtn.title = 'Tap to talk (native app mic)';
      els.orbBtn.title = 'Tap to talk (native app mic)';
      els.micBtn.classList.remove('disabled');
      els.micBtn.addEventListener('click', toggleNative);
      els.orbBtn.addEventListener('click', toggleNative);
      state.voiceSupported = true;
      return;
    }

    // Browser / iPhone — prefer MediaRecorder+STT on iOS (Web Speech often false-blocks)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    const canRecord =
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined' &&
      (window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    function pickMime() {
      const types = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
      return types.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
    }

    async function transcribeWithEleven(blob) {
      const key = rawElevenKey();
      const proxy = proxyBase();
      if (!key || !proxy) return null;
      const ext = (blob.type || '').includes('webm')
        ? 'webm'
        : (blob.type || '').includes('ogg')
          ? 'ogg'
          : 'm4a';
      const form = new FormData();
      form.append('file', blob, `cway.${ext}`);
      form.append('model_id', 'scribe_v1');
      const res = await fetch(`${proxy}/stt`, {
        method: 'POST',
        headers: { 'x-elevenlabs-key': key },
        body: form
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.detail?.message || `STT failed (${res.status})`);
      return String(data.text || '').trim();
    }

    // Shared MediaRecorder engine (reliable on iPhone once Microphone is allowed)
    let mediaStream = null;
    let recorder = null;
    let chunks = [];
    let mime = '';
    let forceRecorder = false;

    async function finishRecording() {
      const blob = new Blob(chunks, { type: mime || 'audio/mp4' });
      chunks = [];
      mediaStream?.getTracks().forEach((t) => t.stop());
      mediaStream = null;
      recorder = null;
      if (!blob.size) {
        setStatus('No audio captured — try again');
        return;
      }
      if (!rawElevenKey()) {
        setStatus('Add ElevenLabs key for iPhone mic');
        appendMessage({
          role: 'system',
          content:
            'Safari blocked on-device speech, so CwayClient records your voice instead. Settings → paste your **ElevenLabs API key** → Save, then tap the mic again. Or just **type**.'
        });
        return;
      }
      if (!proxyBase()) {
        setStatus('Set Proxy URL for voice');
        return;
      }
      setStatus('Transcribing…');
      setOrb('thinking');
      try {
        const text = await transcribeWithEleven(blob);
        if (text) {
          els.prompt.value = text;
          autoGrow();
          await sendAfterVoice(text);
        } else {
          setStatus('Heard nothing — try again');
          idleStatus();
        }
      } catch (err) {
        setStatus('Transcription failed — type instead');
        appendMessage({
          role: 'system',
          content: `${err?.message || 'Could not transcribe'}. Check ElevenLabs key, or **type** your message.`
        });
        idleStatus();
      }
    }

    function stopRecording() {
      if (!recorder) {
        setListeningUi(false);
        return;
      }
      try {
        if (recorder.state !== 'inactive') recorder.stop();
      } catch {
        setListeningUi(false);
        finishRecording();
      }
    }

    function startRecordingFromGesture() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('Mic unavailable — type instead');
        return;
      }
      // Must invoke getUserMedia in this turn (iOS user-gesture).
      const gum = navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      setListeningUi(true);
      setStatus('Listening… speak, then tap mic again');
      gum
        .then((stream) => {
          mediaStream = stream;
          chunks = [];
          mime = pickMime();
          recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
          mime = recorder.mimeType || mime || 'audio/mp4';
          recorder.ondataavailable = (ev) => {
            if (ev.data?.size) chunks.push(ev.data);
          };
          recorder.onerror = () => {
            setListeningUi(false);
            setStatus('Mic error — type instead');
          };
          recorder.onstop = () => {
            setListeningUi(false);
            finishRecording();
          };
          recorder.start(250);
        })
        .catch(() => {
          setListeningUi(false);
          setStatus('Allow Microphone, then tap mic again');
          appendMessage({
            role: 'system',
            content:
              'Microphone permission denied. iOS Settings → Safari (or CwayClient) → Microphone → Allow, then reload and try again. You can also type.'
          });
        });
    }

    function useRecorderNow() {
      return Boolean(
        canRecord && (forceRecorder || (isIOS && rawElevenKey() && proxyBase()))
      );
    }

    if (SR) {
      const rec = new SR();
      rec.continuous = !isIOS;
      rec.interimResults = true;
      rec.lang = navigator.language || 'en-US';
      let finalText = '';
      let hadResult = false;
      let ignoreErrors = false;
      let restartTimer = null;

      const clearRestart = () => {
        if (restartTimer) {
          clearTimeout(restartTimer);
          restartTimer = null;
        }
      };

      rec.onstart = () => {
        setListeningUi(true);
        setStatus('Listening… speak, then tap mic again');
      };
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i += 1) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalText += `${t} `;
            hadResult = true;
          } else {
            interim += t;
            hadResult = true;
          }
        }
        els.prompt.value = (finalText || interim).trim();
        autoGrow();
      };
      rec.onerror = (e) => {
        const code = e?.error || '';
        if (code === 'aborted' || ignoreErrors) return;
        if (code === 'no-speech') {
          setListeningUi(false);
          setStatus('No speech heard — tap mic and try again');
          return;
        }
        setListeningUi(false);
        clearRestart();
        if (isIOS && canRecord && (code === 'not-allowed' || code === 'service-not-allowed')) {
          forceRecorder = true;
          setStatus('Safari blocked speech — using recorder');
          appendMessage({
            role: 'system',
            content:
              'Safari blocked on-device speech recognition (this happens often even when Microphone is **Allow**). ' +
              'Tap the mic again — CwayClient will **record** your voice instead. Add an **ElevenLabs API key** in Settings to transcribe, or **type**.'
          });
          return;
        }
        setStatus('Speech blocked — type instead');
        appendMessage({
          role: 'system',
          content:
            (code === 'not-allowed' || code === 'service-not-allowed'
              ? 'Safari blocked speech recognition. '
              : `Speech error (${code}). `) +
            (isStandalone
              ? 'Open this site in **Safari** (not only the Home Screen icon), then try again — or **type**.'
              : 'Add ElevenLabs in Settings for a reliable iPhone mic, or **type**.')
        });
      };
      rec.onend = () => {
        if (state.listening && !ignoreErrors && isIOS) {
          clearRestart();
          restartTimer = setTimeout(() => {
            if (!state.listening || ignoreErrors) return;
            try {
              rec.start();
            } catch {
              /* ignore */
            }
          }, 280);
          return;
        }
        if (state.listening && !ignoreErrors && !isIOS) {
          try {
            rec.start();
            return;
          } catch {
            /* fall through */
          }
        }
        const wasListening = state.listening;
        setListeningUi(false);
        clearRestart();
        if (state.busy || ignoreErrors || !wasListening) return;
        const text = (finalText || els.prompt.value).trim();
        if (text && hadResult) sendAfterVoice(text);
        else idleStatus();
      };

      function startWebSpeechFromGesture() {
        // CRITICAL: no await before rec.start() — iOS otherwise reports not-allowed
        // even when Microphone permission is already granted.
        ignoreErrors = false;
        finalText = '';
        hadResult = false;
        clearRestart();
        try {
          setListeningUi(true);
          setStatus('Listening… speak, then tap mic again');
          rec.start();
        } catch {
          setListeningUi(false);
          if (canRecord) {
            forceRecorder = true;
            startRecordingFromGesture();
            return;
          }
          setStatus('Mic busy — tap again');
        }
      }

      function stopWebSpeech() {
        ignoreErrors = true;
        clearRestart();
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        setListeningUi(false);
        const text = (finalText || els.prompt.value).trim();
        if (text && hadResult) sendAfterVoice(text);
        else idleStatus();
        setTimeout(() => {
          ignoreErrors = false;
        }, 300);
      }

      function startFromGesture() {
        if (useRecorderNow()) startRecordingFromGesture();
        else startWebSpeechFromGesture();
      }

      function toggleVoice(e) {
        e.preventDefault();
        e.stopPropagation();
        if (state.busy) return;
        if (state.listening) {
          if (recorder && recorder.state !== 'inactive') stopRecording();
          else stopWebSpeech();
          return;
        }
        ensureSpeechPermissionThen(startFromGesture);
      }

      els.micBtn.classList.remove('disabled');
      els.micBtn.title = 'Tap to talk · asks for speech recognition';
      els.orbBtn.title = 'Tap to talk · asks for speech recognition';
      els.micBtn.addEventListener('click', toggleVoice);
      els.orbBtn.addEventListener('click', toggleVoice);
      state.voiceSupported = true;
      return;
    }

    if (canRecord) {
      function toggleRecordOnly(e) {
        e.preventDefault();
        e.stopPropagation();
        if (state.busy) return;
        if (state.listening) {
          stopRecording();
          return;
        }
        ensureSpeechPermissionThen(startRecordingFromGesture);
      }
      els.micBtn.classList.remove('disabled');
      els.micBtn.title = 'Tap to talk · records audio';
      els.orbBtn.title = 'Tap to talk · records audio';
      els.micBtn.addEventListener('click', toggleRecordOnly);
      els.orbBtn.addEventListener('click', toggleRecordOnly);
      state.voiceSupported = true;
      return;
    }

    els.micBtn.classList.remove('disabled');
    els.micBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setStatus('Type your message — speech not available here');
      appendMessage({
        role: 'system',
        content:
          'On-device speech isn’t available in this browser. **Type** below — with Cursor API key + Proxy URL it still answers.'
      });
    });
  }

  function syncProviderFields() {
    const p = els.setProvider.value;
    els.cursorSettings.hidden = p !== 'cursor';
    els.openaiSettings.hidden = p !== 'openai';
  }

  function setupInstallPrompt() {
    const banner = document.getElementById('installBanner');
    const btn = document.getElementById('installBtn');
    const dismiss = document.getElementById('installDismiss');
    const copy = document.getElementById('installCopy');
    if (!banner || !btn) return;

    let deferred = null;
    const dismissed = localStorage.getItem('cway-install-dismissed') === '1';
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferred = e;
      if (!dismissed && !standalone) banner.classList.add('show');
    });

    btn.addEventListener('click', async () => {
      if (deferred) {
        deferred.prompt();
        await deferred.userChoice.catch(() => {});
        deferred = null;
        banner.classList.remove('show');
        return;
      }
      appendMessage({
        role: 'system',
        content: isIOS
          ? '**iPhone install (no Mac needed)**\n1. Open this page in **Safari**\n2. Tap Share (square with ↑)\n3. Tap **Add to Home Screen** → Add\n4. Deploy `cloudflare/worker.js` on Cloudflare (free) from your phone\n5. Settings → Proxy URL = `https://YOUR-NAME.workers.dev` + Cursor API key → Test'
          : 'Use your browser menu → Install app / Add to Home Screen.'
      });
      openRail(false);
    });

    dismiss?.addEventListener('click', () => {
      localStorage.setItem('cway-install-dismissed', '1');
      banner.classList.remove('show');
    });

    if (standalone) {
      banner.classList.remove('show');
    } else if (isIOS && !dismissed) {
      if (copy) {
        copy.innerHTML =
          '<strong>iPhone: make it an app</strong><br />Safari → Share (□↑) → Add to Home Screen';
      }
      btn.textContent = 'How';
      banner.classList.add('show');
    }

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  async function boot() {
    const isNativeApp = Boolean(window.CwayNative?.isNative?.());
    const isPhone = window.matchMedia('(max-width: 900px)').matches;
    if (isNativeApp) {
      await window.CwayNative.ready();
      document.getElementById('installBanner')?.classList.remove('show');
    }

    // Phone: start compact so composer is never cut off
    if (isPhone) {
      document.body.classList.add('is-phone');
      els.heroStrip.classList.add('collapsed');
      lockViewport();
    }

    renderSuggestions();
    setupVoice();
    if (!isNativeApp) setupInstallPrompt();
    const bootData = await api.getBootstrap();
    state.mode = isNativeApp ? 'app' : bootData.mode || (window.cway ? 'desktop' : 'demo');
    state.commands = bootData.commands || [];
    state.settings = { ...state.settings, ...(bootData.settings || {}) };
    state.messages = [];

    if (isNativeApp) {
      els.modeBadge.textContent = `App · ${window.CwayNative.platform()}`;
      els.fineprint.textContent = 'Native WebView app · mic uses device speech APIs';
      els.heroEyebrow.textContent = 'App mode · microphone ready';
      setStatus('App mode · standing by');
    } else {
      els.modeBadge.textContent = state.mode === 'demo' ? 'Mobile demo' : 'Desktop';
      els.fineprint.textContent =
        state.mode === 'demo'
          ? 'Phone UI · Cloudflare Worker proxy or desktop Wi‑Fi relay'
          : `Desktop · Cursor SDK · model ${state.settings.model || 'auto'}`;
      els.heroEyebrow.textContent =
        state.mode === 'demo' ? 'Demo · phone preview' : 'Cursor-linked · standing by';
      setStatus(state.mode === 'demo' ? 'Demo mode · UI preview' : 'Standing by');
    }
    updateCursorCard();
    renderCommands();

    document.getElementById('setProvider').value = state.settings.provider || 'cursor';
    document.getElementById('setBaseUrl').value = state.settings.baseUrl || '';
    document.getElementById('setModel').value = state.settings.model || 'auto';
    document.getElementById('setWorkspace').value = state.settings.workspacePath || '';
    document.getElementById('setProxyUrl').value = state.settings.proxyUrl || '';
    document.getElementById('setElevenVoice').value =
      state.settings.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM';
    document.getElementById('setConfirmShell').checked = state.settings.confirmShell !== false;
    document.getElementById('setVoice').checked = state.settings.voiceEnabled !== false;
    // Phone defaults to Cursor settings visible
    if (isPhone) {
      document.getElementById('setProvider').value = 'cursor';
      syncProviderFields();
    } else {
      syncProviderFields();
    }
    wireSecretClearOnEdit();
    fillSecretInputs();
    if (state.settings.hasCursorKey) {
      setStatus('Cursor key ready');
    }

    await refreshModels(false);
    updateCursorCard();

    // Desktop: show Wi‑Fi relay URL for the iPhone
    const relayEl = document.getElementById('relayInfo');
    if (relayEl && bootData.relay?.urls?.length) {
      relayEl.hidden = false;
      relayEl.innerHTML = `<strong>Phone relay (same Wi‑Fi):</strong> ${bootData.relay.urls
        .map((u) => `<code>${u}</code>`)
        .join(' · ')} — paste one into the iPhone app Settings.`;
      els.cursorStatus.textContent = `Relay · ${bootData.relay.urls[0]}`;
      els.cursorDot.classList.add('ok');
    }

    // Phone: past chats were breaking the layout — start clean / keep history tiny
    let history = Array.isArray(bootData.history) ? bootData.history : [];
    if (isPhone) {
      const slim = history
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
        .map((m) => ({
          role: m.role,
          content: String(m.content || '').slice(0, 500)
        }))
        .slice(-4);
      const tooHeavy =
        history.length > 8 ||
        history.some((m) => String(m?.content || '').length > 1500);
      if (tooHeavy || localStorage.getItem('cway-phone-fresh') !== '1') {
        history = [];
        state.messages = [];
        await api.saveHistory([]);
        localStorage.setItem('cway-phone-fresh', '1');
      } else {
        history = slim;
        if (slim.length !== (bootData.history || []).length) {
          await api.saveHistory(slim);
        }
      }
    }

    history.forEach((m) => {
      state.messages.push(m);
      appendMessage(m, { skipScroll: true });
    });
    if (history.length) {
      requestAnimationFrame(() => {
        els.chat.scrollTop = els.chat.scrollHeight;
        lockViewport();
      });
    }

    if (!history.length) {
      if (isNativeApp) {
        appendMessage({
          role: 'system',
          content:
            'CwayClient app ready. Tap the mic or type below.'
        });
        if (!localStorage.getItem('cway-native-perm-asked')) {
          localStorage.setItem('cway-native-perm-asked', '1');
          window.CwayNative.speech
            .requestPermissions()
            .then((ok) => {
              setStatus(ok ? 'Mic permission ready' : 'Enable mic in phone Settings → CwayClient');
            })
            .catch(() => {});
        }
      } else {
        appendMessage({
          role: 'system',
          content: isPhone
            ? (state.settings.proxyUrl || '').trim()
              ? 'Ready — mic / type goes to Cursor through your proxy.'
              : '**On holiday:** deploy `cloudflare/worker.js` → Settings → Proxy URL + Cursor API key → **Test**. (At home you can use the desktop Wi‑Fi relay instead.)'
            : state.mode === 'demo'
              ? 'Website demo (mic often blocked). Type to chat.'
              : 'Connect Cursor in Settings, pick a model, then talk or type. Phone relay URL is shown below for your iPhone.'
        });
      }
    }

    if (isPhone) {
      lockViewport();
      setTimeout(lockViewport, 50);
      setTimeout(lockViewport, 300);
    }
  }

  els.menuBtn.addEventListener('click', () => openRail(true));
  els.railClose.addEventListener('click', () => openRail(false));
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('drawer-open')) return;
    if (els.rail.contains(e.target) || els.menuBtn.contains(e.target)) return;
    openRail(false);
  });

  els.cmdFilter.addEventListener('input', () => renderCommands(els.cmdFilter.value));
  els.composer.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSend(els.prompt.value);
  });
  els.prompt.addEventListener('input', autoGrow);
  els.prompt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(els.prompt.value);
    }
  });

  els.btnClearChat.addEventListener('click', async () => {
    state.messages = [];
    els.chat.innerHTML = '';
    // Keep compact on phones so the composer stays on-screen
    if (!document.body.classList.contains('is-phone')) {
      els.heroStrip.classList.remove('collapsed');
    }
    window.speechSynthesis?.cancel();
    await api.saveHistory([]);
    appendMessage({ role: 'system', content: 'Chat cleared.' });
  });

  function openSettings() {
    openRail(false);
    syncProviderFields();
    document.getElementById('setProxyUrl').value = state.settings.proxyUrl || '';
    document.getElementById('setProvider').value = state.settings.provider || 'cursor';
    document.getElementById('setModel').value = state.settings.model || 'auto';
    document.getElementById('setElevenVoice').value =
      state.settings.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM';
    fillSecretInputs();
    els.settingsModal.showModal();
  }
  els.btnSettings.addEventListener('click', openSettings);
  document.getElementById('btnSettingsTop')?.addEventListener('click', openSettings);
  els.btnAddCommand.addEventListener('click', () => {
    openRail(false);
    els.commandForm.reset();
    els.commandModal.showModal();
  });
  els.setProvider.addEventListener('change', syncProviderFields);

  els.modelSelect.addEventListener('change', async () => {
    const model = els.modelSelect.value;
    const res = await api.saveSettings({ model });
    if (res.ok) state.settings = res.settings;
    document.getElementById('setModel').value = model;
    updateCursorCard();
    setStatus(`Model → ${model}`);
  });

  els.btnRefreshModels.addEventListener('click', async () => {
    setStatus('Refreshing Cursor models…');
    const res = await refreshModels(true);
    setStatus(res.ok ? `${res.models.length} models` : res.error || 'Failed');
  });

  els.btnTestCursor.addEventListener('click', async () => {
    setStatus('Testing Cursor…');
    const res = await api.testCursor();
    if (res.ok && res.models) renderModels(res.models);
    updateCursorCard();
    setStatus(res.message || (res.ok ? 'Connected' : res.error || 'Failed'));
    appendMessage({
      role: 'system',
      content: res.message || res.error || 'Cursor test finished'
    });
  });

  els.settingsForm.addEventListener('submit', async (e) => {
    const submitter = e.submitter;
    if (submitter && submitter.value === 'cancel') return;
    e.preventDefault();
    const cursorApiKey = document.getElementById('setCursorKey').value.trim();
    const apiKey = document.getElementById('setApiKey').value.trim();
    const elevenLabsKey = document.getElementById('setElevenKey').value.trim();
    const payload = {
      provider: document.getElementById('setProvider').value,
      baseUrl: document.getElementById('setBaseUrl').value.trim() || 'https://api.openai.com/v1',
      model: document.getElementById('setModel').value.trim() || 'auto',
      workspacePath: document.getElementById('setWorkspace').value.trim(),
      proxyUrl: document.getElementById('setProxyUrl').value.trim(),
      elevenLabsVoiceId:
        document.getElementById('setElevenVoice').value.trim() || '21m00Tcm4TlvDq8ikWAM',
      confirmShell: document.getElementById('setConfirmShell').checked,
      voiceEnabled: document.getElementById('setVoice').checked
    };
    if (cursorApiKey) payload.cursorApiKey = cursorApiKey;
    if (apiKey) payload.apiKey = apiKey;
    if (elevenLabsKey) payload.elevenLabsKey = elevenLabsKey;
    const res = await api.saveSettings(payload);
    if (res.ok) state.settings = res.settings;
    els.settingsModal.close();
    fillSecretInputs();
    updateCursorCard();
    await refreshModels(true);
    setStatus(state.settings.hasCursorKey ? 'Settings saved · Cursor key ready' : 'Settings saved');
  });

  els.commandForm.addEventListener('submit', async (e) => {
    const submitter = e.submitter;
    if (submitter && submitter.value === 'cancel') return;
    e.preventDefault();
    const payload = {
      id: document.getElementById('cmdId').value.trim(),
      name: document.getElementById('cmdName').value.trim(),
      description: document.getElementById('cmdDesc').value.trim(),
      shell: document.getElementById('cmdShell').value.trim() || undefined,
      url: document.getElementById('cmdUrl').value.trim() || undefined,
      path: document.getElementById('cmdPath').value.trim() || undefined,
      category: 'custom',
      params: []
    };
    const res = await api.addCommand(payload);
    if (!res.ok) {
      alert(res.error || 'Could not add command');
      return;
    }
    state.commands = res.commands;
    renderCommands(els.cmdFilter.value);
    els.commandModal.close();
    appendMessage({ role: 'system', content: `Command added: ${payload.name}` });
  });

  els.runForm.addEventListener('submit', async (e) => {
    const submitter = e.submitter;
    if (submitter && submitter.value === 'cancel') return;
    e.preventDefault();
    const cmd = state.pendingRun;
    if (!cmd) return;
    const args = {};
    els.runFields.querySelectorAll('input').forEach((input) => {
      if (input.value !== '') args[input.dataset.key] = input.value;
    });
    els.runModal.close();
    setStatus(`Running ${cmd.name}…`);
    setOrb('thinking');
    const res = await api.runCommand(cmd.id, args);
    appendMessage({
      role: 'tool',
      name: cmd.id,
      content: JSON.stringify(res, null, 2).slice(0, 1500)
    });
    const reply = res.ok ? `Done — ${cmd.name}.` : `Failed — ${res.error || 'unknown error'}`;
    appendMessage({ role: 'assistant', content: reply });
    speak(reply);
    setStatus(state.mode === 'demo' ? 'Demo mode · UI preview' : 'Standing by');
  });

  boot().catch((err) => {
    setStatus('Boot failed');
    appendMessage({ role: 'assistant', content: String(err) });
  });
})();
