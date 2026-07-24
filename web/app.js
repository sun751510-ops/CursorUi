(() => {
  const SUGGESTIONS = [
    'What can you do?',
    'Connect me through Cursor',
    'Show system info',
    'Open https://github.com',
    'Create a command to open Downloads'
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
    settingsForm: document.getElementById('settingsForm'),
    commandForm: document.getElementById('commandForm'),
    runForm: document.getElementById('runForm'),
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
      workspacePath: ''
    },
    pendingRun: null,
    busy: false,
    recognition: null
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

  function createDemoBridge() {
    const store = loadDemoStore();
    let custom = store.customCommands || [];
    let settings = {
      provider: store.provider || 'cursor',
      cursorApiKey: store.cursorApiKey || '',
      apiKey: store.apiKey || '',
      baseUrl: store.baseUrl || 'https://api.openai.com/v1',
      model: store.model || 'auto',
      confirmShell: store.confirmShell !== false,
      voiceEnabled: store.voiceEnabled !== false,
      workspacePath: store.workspacePath || '',
      hasCursorKey: Boolean(store.cursorApiKey),
      hasApiKey: Boolean(store.apiKey || store.cursorApiKey)
    };
    let history = store.history || [];
    const allCommands = () => [...DEMO_BUILTINS, ...custom];

    async function demoChat({ messages }) {
      await sleep(500);
      const last = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      const lower = last.toLowerCase();
      if (/create|add|new command|invent/.test(lower)) {
        const entry = {
          id: `demo_${Date.now().toString(36)}`,
          name: 'Open Downloads (demo)',
          description: 'Demo command invented by AI',
          category: 'custom',
          params: [],
          path: '~/Downloads',
          builtin: false
        };
        custom = [...custom, entry];
        saveDemoStore({ customCommands: custom });
        return {
          ok: true,
          message: {
            role: 'assistant',
            content:
              `Created **${entry.name}**. On desktop (with your Cursor key) I invent and run real OS commands via Cursor models.`
          },
          trace: [{ tool: 'add_cway_command', args: entry, result: { ok: true } }],
          commands: allCommands(),
          provider: 'cursor-demo'
        };
      }
      if (/cursor|connect|model/.test(lower)) {
        return {
          ok: true,
          message: {
            role: 'assistant',
            content:
              'On desktop: open **Settings → paste your Cursor API key** from cursor.com/dashboard/api, then pick any model in the rail.\n\nThis phone page is UI-only — Cursor SDK runs inside the Electron app.'
          },
          commands: allCommands(),
          provider: 'cursor-demo'
        };
      }
      return {
        ok: true,
        message: {
          role: 'assistant',
          content:
            `Got it — “${last.slice(0, 140)}”\n\nPhone demo of the Dexter-style copilot UI. Desktop CwayClient talks to **your Cursor account** and any model you choose.`
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
          apiKey: settings.apiKey ? '••••••••' : ''
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
        saveDemoStore({
          provider: settings.provider,
          cursorApiKey: settings.cursorApiKey === '••••••••' ? store.cursorApiKey : settings.cursorApiKey,
          apiKey: settings.apiKey === '••••••••' ? store.apiKey : settings.apiKey,
          baseUrl: settings.baseUrl,
          model: settings.model,
          confirmShell: settings.confirmShell,
          voiceEnabled: settings.voiceEnabled,
          workspacePath: settings.workspacePath
        });
        const saved = loadDemoStore();
        settings.hasCursorKey = Boolean(saved.cursorApiKey);
        settings.hasApiKey = Boolean(saved.apiKey || saved.cursorApiKey);
        return {
          ok: true,
          settings: {
            ...settings,
            cursorApiKey: settings.hasCursorKey ? '••••••••' : '',
            apiKey: saved.apiKey ? '••••••••' : ''
          }
        };
      },
      saveHistory: async (h) => {
        history = Array.isArray(h) ? h.slice(-80) : [];
        saveDemoStore({ history });
        return { ok: true };
      },
      listModels: async () => ({ ok: true, models: DEMO_MODELS }),
      testCursor: async () => ({
        ok: Boolean(settings.hasCursorKey),
        message: settings.hasCursorKey
          ? 'Demo: key saved locally (real Cursor test needs desktop app)'
          : 'Add a Cursor API key in Settings (desktop for live connection)',
        models: DEMO_MODELS
      }),
      chat: demoChat,
      onStatus: () => () => {}
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

  function speak(text) {
    if (!state.settings.voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*`#_]/g, ' ').slice(0, 500));
    u.rate = 1.05;
    setOrb('speaking');
    u.onend = () => setOrb(state.busy ? 'thinking' : 'idle');
    u.onerror = () => setOrb('idle');
    window.speechSynthesis.speak(u);
  }

  function renderSuggestions() {
    els.suggestions.innerHTML = '';
    SUGGESTIONS.forEach((text) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.addEventListener('click', () => {
        els.prompt.value = text;
        els.prompt.focus();
        autoGrow();
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
      ? `Linked · model ${state.settings.model || 'auto'}`
      : state.mode === 'demo'
        ? 'Demo UI · connect on desktop'
        : 'Paste Cursor API key in Settings';
  }

  function appendMessage(msg) {
    const div = document.createElement('div');
    div.className = `msg ${msg.role}`;
    if (msg.role === 'assistant') {
      div.innerHTML = `<span class="meta">CwayClient</span>${formatMarkdownLite(msg.content)}`;
    } else if (msg.role === 'user') {
      div.textContent = msg.content;
    } else if (msg.role === 'tool') {
      div.innerHTML = `<span class="meta">tool · ${escapeHtml(msg.name || 'action')}</span>${escapeHtml(msg.content)}`;
    } else {
      div.textContent = msg.content;
    }
    els.chat.appendChild(div);
    els.chat.scrollTop = els.chat.scrollHeight;
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
    const slim = state.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));
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
        speak(result.message.content);
        setOrb(state.settings.voiceEnabled ? 'speaking' : 'idle');
      }
      await persistHistory();
      setStatus(state.mode === 'demo' ? 'Demo mode · UI preview' : 'Standing by');
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

    // Browser / PWA fallback
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const secure = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
    state.voiceSupported = Boolean(SR) && secure;

    if (!SR || !secure) {
      els.micBtn.title = 'Install the mobile app for working voice — or type here';
      els.micBtn.classList.add('disabled');
      els.orbBtn.title = 'Install the mobile app for working voice — or type here';
      els.micBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setStatus('Browser mic is blocked here — use the CwayClient app');
        appendMessage({
          role: 'system',
          content:
            'Website mic is unreliable. Install the **CwayClient mobile app** (Capacitor) for a real WebView + native microphone.'
        });
      });
      return;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || 'en-US';
    rec.maxAlternatives = 1;
    let finalText = '';
    let hadResult = false;
    let ignoreErrors = false;

    rec.onstart = () => {
      finalText = '';
      hadResult = false;
      setListeningUi(true);
    };
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += `${t} `;
          hadResult = true;
        } else interim += t;
      }
      els.prompt.value = (finalText || interim).trim();
      autoGrow();
    };
    rec.onerror = (e) => {
      const code = e?.error || 'unknown';
      if (code === 'aborted' || code === 'no-speech' || ignoreErrors) {
        setListeningUi(false);
        if (!hadResult) idleStatus();
        return;
      }
      setListeningUi(false);
      setStatus('Browser mic blocked — install the mobile app for voice');
    };
    rec.onend = () => {
      setListeningUi(false);
      if (state.busy) return;
      const text = (finalText || els.prompt.value).trim();
      if (text && hadResult) {
        els.prompt.value = text;
        handleSend(text);
      } else {
        idleStatus();
      }
    };
    state.recognition = rec;

    async function toggleListen(e) {
      e.preventDefault();
      e.stopPropagation();
      if (state.busy) return;
      if (state.listening) {
        ignoreErrors = true;
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        setTimeout(() => {
          ignoreErrors = false;
        }, 300);
        return;
      }
      try {
        finalText = '';
        hadResult = false;
        rec.start();
      } catch {
        setStatus('Mic busy — tap again');
        setListeningUi(false);
      }
    }

    els.micBtn.title = 'Tap to talk · tap again to send';
    els.orbBtn.title = 'Tap to talk · tap again to send';
    els.micBtn.addEventListener('click', toggleListen);
    els.orbBtn.addEventListener('click', toggleListen);
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
    if (!banner || !btn) return;

    let deferred = null;
    const dismissed = localStorage.getItem('cway-install-dismissed') === '1';

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferred = e;
      if (!dismissed) banner.classList.add('show');
    });

    btn.addEventListener('click', async () => {
      if (deferred) {
        deferred.prompt();
        await deferred.userChoice.catch(() => {});
        deferred = null;
        banner.classList.remove('show');
        return;
      }
      // iOS / browsers without beforeinstallprompt
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      appendMessage({
        role: 'system',
        content: isIOS
          ? 'Install on iPhone: Safari Share → Add to Home Screen.'
          : 'Install: use your browser menu → Install app / Add to Home Screen.'
      });
      banner.classList.remove('show');
    });

    dismiss?.addEventListener('click', () => {
      localStorage.setItem('cway-install-dismissed', '1');
      banner.classList.remove('show');
    });

    // Show manual tip on iOS Safari (no beforeinstallprompt)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (isIOS && !standalone && !dismissed) {
      banner.classList.add('show');
      btn.textContent = 'How';
    }

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  async function boot() {
    const isNativeApp = Boolean(window.CwayNative?.isNative?.());
    if (isNativeApp) {
      await window.CwayNative.ready();
      document.getElementById('installBanner')?.classList.remove('show');
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
          ? 'Website demo · for working mic install the mobile app'
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
    document.getElementById('setConfirmShell').checked = state.settings.confirmShell !== false;
    document.getElementById('setVoice').checked = state.settings.voiceEnabled !== false;
    syncProviderFields();

    await refreshModels(false);
    updateCursorCard();

    (bootData.history || []).forEach((m) => {
      state.messages.push(m);
      appendMessage(m);
    });

    if (!(bootData.history || []).length) {
      appendMessage({
        role: 'system',
        content:
          state.mode === 'demo'
            ? 'Phone UI demo — hold the orb/mic to talk (browser permitting). Connect Cursor on desktop.'
            : 'Connect Cursor in Settings, pick a model, then talk or type.'
      });
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
    els.heroStrip.classList.remove('collapsed');
    window.speechSynthesis?.cancel();
    await api.saveHistory([]);
    appendMessage({ role: 'system', content: 'Chat cleared.' });
  });

  els.btnSettings.addEventListener('click', () => {
    openRail(false);
    syncProviderFields();
    els.settingsModal.showModal();
  });
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
    const payload = {
      provider: document.getElementById('setProvider').value,
      baseUrl: document.getElementById('setBaseUrl').value.trim() || 'https://api.openai.com/v1',
      model: document.getElementById('setModel').value.trim() || 'auto',
      workspacePath: document.getElementById('setWorkspace').value.trim(),
      confirmShell: document.getElementById('setConfirmShell').checked,
      voiceEnabled: document.getElementById('setVoice').checked
    };
    if (cursorApiKey) payload.cursorApiKey = cursorApiKey;
    if (apiKey) payload.apiKey = apiKey;
    const res = await api.saveSettings(payload);
    if (res.ok) state.settings = res.settings;
    els.settingsModal.close();
    document.getElementById('setCursorKey').value = '';
    document.getElementById('setApiKey').value = '';
    updateCursorCard();
    await refreshModels(true);
    setStatus('Settings saved');
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
