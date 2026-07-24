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
      proxyUrl: store.proxyUrl || '',
      confirmShell: store.confirmShell !== false,
      voiceEnabled: store.voiceEnabled !== false,
      workspacePath: store.workspacePath || '',
      hasCursorKey: Boolean(store.cursorApiKey),
      hasApiKey: Boolean(store.apiKey || store.cursorApiKey)
    };
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

    async function demoChat({ messages }) {
      const last = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      const relay = rawProxyUrl().replace(/\/$/, '');

      // Phone → desktop CwayClient Wi‑Fi relay (Cursor SDK on your computer)
      if ((settings.provider || 'cursor') === 'cursor' && relay) {
        try {
          const res = await fetch(`${relay}/chat`, {
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

      await sleep(400);
      return {
        ok: true,
        message: {
          role: 'assistant',
          content:
            `Got “${last.slice(0, 120)}”.\n\n` +
            `To use **Cursor from your iPhone**:\n` +
            `1. On your computer: \`npm start\` (CwayClient desktop)\n` +
            `2. Put your Cursor API key in the desktop Settings\n` +
            `3. On phone Settings → Desktop relay URL = \`http://YOUR-PC-IP:3847\`\n` +
            `4. Tap **Test**, then mic / type — replies come from Cursor on your PC`
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
        const prev = loadDemoStore();
        saveDemoStore({
          provider: settings.provider,
          cursorApiKey: settings.cursorApiKey === '••••••••' ? prev.cursorApiKey : settings.cursorApiKey,
          apiKey: settings.apiKey === '••••••••' ? prev.apiKey : settings.apiKey,
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
        settings.proxyUrl = saved.proxyUrl || '';
        return {
          ok: true,
          settings: {
            ...settings,
            cursorApiKey: settings.hasCursorKey ? '••••••••' : '',
            apiKey: saved.apiKey ? '••••••••' : '',
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
        const relay = rawProxyUrl().replace(/\/$/, '');
        if (relay) {
          try {
            const res = await fetch(`${relay}/models`);
            const data = await res.json();
            if (res.ok && data.models?.length) return { ok: true, models: data.models };
          } catch {
            /* fall through */
          }
        }
        return { ok: true, models: DEMO_MODELS };
      },
      testCursor: async () => {
        const relay = rawProxyUrl().replace(/\/$/, '');
        if (!relay) {
          return {
            ok: false,
            error: 'Set Desktop relay URL (http://YOUR-PC-IP:3847)',
            models: DEMO_MODELS
          };
        }
        try {
          const res = await fetch(`${relay}/health`);
          const data = await res.json();
          if (!res.ok || !data.ok) throw new Error(data.error || 'Relay unhealthy');
          const modelsRes = await fetch(`${relay}/models`);
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
      },
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
      ? `Linked · model ${state.settings.model || 'auto'}`
      : state.mode === 'demo'
        ? 'Demo UI · connect on desktop'
        : 'Paste Cursor API key in Settings';
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

    // Browser / iPhone PWA — MediaRecorder works on Safari; Web Speech often does not
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const canRecord =
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined' &&
      (window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost');

    function whisperKey() {
      try {
        const store = JSON.parse(localStorage.getItem('cwayclient-demo') || '{}');
        if (store.apiKey) return store.apiKey;
      } catch {
        /* ignore */
      }
      const fromState = state.settings?.apiKey;
      if (fromState && fromState !== '••••••••') return fromState;
      return '';
    }

    function pickMime() {
      const types = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'];
      return types.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
    }

    async function transcribeBlob(blob) {
      const key = whisperKey();
      if (!key) return null;
      const base = (state.settings.baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
      // Whisper lives on OpenAI; if user pointed baseUrl elsewhere, still try OpenAI default for audio
      const url = base.includes('openai.com')
        ? `${base}/audio/transcriptions`
        : 'https://api.openai.com/v1/audio/transcriptions';
      const ext = (blob.type || '').includes('mp4') ? 'mp4' : (blob.type || '').includes('webm') ? 'webm' : 'm4a';
      const form = new FormData();
      form.append('file', blob, `cway.${ext}`);
      form.append('model', 'whisper-1');
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}` },
        body: form
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error?.message || `Transcribe failed (${res.status})`);
      return (data.text || '').trim();
    }

    // iPhone / Safari: prefer on-device Web Speech (no OpenAI Whisper key)
    const SRPhone = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (isIOS || SRPhone) {
      if (SRPhone) {
        const rec = new SRPhone();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = navigator.language || 'en-US';
        let finalText = '';
        let hadResult = false;
        let ignoreErrors = false;

        rec.onstart = () => {
          finalText = '';
          hadResult = false;
          setListeningUi(true);
          setStatus('Listening… tap again when done');
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
          const code = e?.error || '';
          if (code === 'aborted' || code === 'no-speech' || ignoreErrors) {
            setListeningUi(false);
            if (!hadResult) idleStatus();
            return;
          }
          setListeningUi(false);
          // Fall through tip — still can type; Cursor replies need Cursor key + proxy
          setStatus('Speech unavailable — type your message');
          if (code === 'not-allowed' || code === 'service-not-allowed') {
            appendMessage({
              role: 'system',
              content:
                'Allow **Microphone** for Safari/CwayClient in iOS Settings. Voice uses on-device speech (no OpenAI key). Replies use your **Cursor** key + proxy.'
            });
          }
        };
        rec.onend = () => {
          setListeningUi(false);
          if (state.busy) return;
          const text = (finalText || els.prompt.value).trim();
          if (text && hadResult) handleSend(text);
          else idleStatus();
        };

        async function toggleSpeech(e) {
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
            }, 250);
            return;
          }
          try {
            rec.start();
          } catch {
            setStatus('Mic busy — tap again');
            setListeningUi(false);
          }
        }

        els.micBtn.classList.remove('disabled');
        els.micBtn.title = 'Tap to talk · sends to Cursor';
        els.orbBtn.title = 'Tap to talk · sends to Cursor';
        els.micBtn.addEventListener('click', toggleSpeech);
        els.orbBtn.addEventListener('click', toggleSpeech);
        state.voiceSupported = true;
        return;
      }

      // No Web Speech — last resort MediaRecorder (still no Whisper required; user can type)
      els.micBtn.classList.remove('disabled');
      els.micBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setStatus('This iOS version needs typing — Web Speech unavailable');
        appendMessage({
          role: 'system',
          content:
            'On-device speech isn’t available in this browser. Type your message — with a Cursor API key + proxy it still answers via your Cursor models.'
        });
      });
      return;
    }

    // Desktop Chrome etc. — Web Speech API
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !canRecord) {
      els.micBtn.classList.add('disabled');
      return;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = navigator.language || 'en-US';
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
      setStatus('Voice unavailable — type instead');
    };
    rec.onend = () => {
      setListeningUi(false);
      if (state.busy) return;
      const text = (finalText || els.prompt.value).trim();
      if (text && hadResult) handleSend(text);
      else idleStatus();
    };

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
          ? '**iPhone install (no Mac needed)**\n1. Open this page in **Safari**\n2. Tap Share (square with ↑)\n3. Tap **Add to Home Screen** → Add\n4. Open CwayClient from your home screen\n5. On your computer run `npm start`, paste Cursor API key, then on phone Settings → Desktop relay URL = `http://YOUR-PC-IP:3847`'
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
          ? 'Phone UI · pair Desktop relay URL to use Cursor on your PC'
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
    document.getElementById('setConfirmShell').checked = state.settings.confirmShell !== false;
    document.getElementById('setVoice').checked = state.settings.voiceEnabled !== false;
    // Phone defaults to Cursor settings visible
    if (isPhone) {
      document.getElementById('setProvider').value = 'cursor';
      syncProviderFields();
    } else {
      syncProviderFields();
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
              ? 'Ready — mic / type goes to Cursor on your computer via Wi‑Fi relay.'
              : '**Pair with your computer:** run `npm start` on the PC → Settings shows a Phone relay URL → paste it here under Settings → Desktop relay URL → tap **Test**.'
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
    const payload = {
      provider: document.getElementById('setProvider').value,
      baseUrl: document.getElementById('setBaseUrl').value.trim() || 'https://api.openai.com/v1',
      model: document.getElementById('setModel').value.trim() || 'auto',
      workspacePath: document.getElementById('setWorkspace').value.trim(),
      proxyUrl: document.getElementById('setProxyUrl').value.trim(),
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
