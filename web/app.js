(() => {
  const SUGGESTIONS = [
    'What can you do?',
    'Show system info',
    'Open https://github.com',
    'Create a command to open my Downloads folder',
    'List commands'
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
    chat: document.getElementById('chat'),
    composer: document.getElementById('composer'),
    prompt: document.getElementById('prompt'),
    sendBtn: document.getElementById('sendBtn'),
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
    runDesc: document.getElementById('runDesc')
  };

  const state = {
    mode: 'demo',
    commands: [],
    messages: [],
    settings: {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      confirmShell: true,
      hasApiKey: false
    },
    pendingRun: null,
    busy: false
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
      apiKey: store.apiKey || '',
      baseUrl: store.baseUrl || 'https://api.openai.com/v1',
      model: store.model || 'gpt-4o',
      confirmShell: store.confirmShell !== false,
      hasApiKey: Boolean(store.apiKey)
    };
    let history = store.history || [];

    const allCommands = () => [...DEMO_BUILTINS, ...custom];

    async function demoChat({ messages }) {
      await sleep(450 + Math.random() * 350);
      const last = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
      const lower = last.toLowerCase();

      if (/create|add|new command|invent/.test(lower)) {
        const id = `demo_${Date.now().toString(36)}`;
        const entry = {
          id,
          name: 'Open Downloads (demo)',
          description: 'Demo command invented by AI — opens Downloads on desktop',
          category: 'custom',
          params: [],
          path: '~/Downloads',
          builtin: false
        };
        custom = [...custom.filter((c) => c.id !== id), entry];
        saveDemoStore({ customCommands: custom });
        return {
          ok: true,
          message: {
            role: 'assistant',
            content:
              `I created a demo command **${entry.name}** (\`${entry.id}\`).\n\n` +
              `On phone this is UI-only — in the desktop Electron app it would open your Downloads folder.\n\n` +
              `You can also say: “create a command that opens https://news.ycombinator.com”.`
          },
          trace: [{ tool: 'add_command', args: entry, result: { ok: true, command: entry } }],
          commands: allCommands()
        };
      }

      if (/system info|host|platform/.test(lower)) {
        return {
          ok: true,
          message: {
            role: 'assistant',
            content:
              'Demo system info (mobile preview):\n' +
              '• platform: web-demo\n' +
              '• device: your phone browser\n' +
              '• note: real OS stats appear in the desktop app'
          },
          trace: [{ tool: 'run_command', args: { command_id: 'system_info' }, result: { ok: true, result: { platform: 'web-demo' } } }],
          commands: allCommands()
        };
      }

      if (/list command|what can you|help|commands/.test(lower)) {
        const names = allCommands()
          .slice(0, 8)
          .map((c) => `• ${c.name}`)
          .join('\n');
        return {
          ok: true,
          message: {
            role: 'assistant',
            content:
              `I'm CwayClient. On desktop I run real OS actions via tools.\n\n` +
              `Sample commands:\n${names}\n\n` +
              `This phone page is a live UI demo — actions are simulated.`
          },
          commands: allCommands()
        };
      }

      if (/http|open .*github|website|url/.test(lower)) {
        return {
          ok: true,
          message: {
            role: 'assistant',
            content:
              'In desktop mode I would call `open_url` now.\nOn this phone demo I’ll just confirm the intent — UI looks the same.'
          },
          trace: [
            {
              tool: 'run_command',
              args: { command_id: 'open_url', args: { url: 'https://github.com' } },
              result: { ok: true, result: 'Simulated open' }
            }
          ],
          commands: allCommands()
        };
      }

      return {
        ok: true,
        message: {
          role: 'assistant',
          content:
            `Got it — “${last.slice(0, 140)}”\n\n` +
            `You're on the **mobile UI demo**. Chat, command rail, and layouts work here.\n` +
            `Real shell / files / apps need the desktop CwayClient (Electron).\n\n` +
            `Try: “Create a command…” or tap a command in the sidebar.`
        },
        commands: allCommands()
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
          apiKey: settings.apiKey ? '••••••••' : '',
          hasApiKey: Boolean(settings.apiKey)
        },
        history
      }),
      getCommands: async () => allCommands(),
      runCommand: async (id, args) => {
        await sleep(280);
        const cmd = allCommands().find((c) => c.id === id);
        if (!cmd) return { ok: false, error: 'Unknown command' };
        return {
          ok: true,
          result: {
            demo: true,
            message: `Simulated ${cmd.name}`,
            args: args || {}
          }
        };
      },
      addCommand: async (payload) => {
        const id = String(payload.id || `custom_${Date.now()}`)
          .replace(/[^a-z0-9_]/gi, '_')
          .toLowerCase();
        if (allCommands().some((c) => c.id === id)) return { ok: false, error: 'Command id already exists' };
        if (!payload.shell && !payload.url && !payload.path) {
          return { ok: false, error: 'Provide shell, url, or path' };
        }
        const entry = {
          id,
          name: payload.name || id,
          description: payload.description || '',
          category: payload.category || 'custom',
          params: payload.params || [],
          shell: payload.shell,
          url: payload.url,
          path: payload.path,
          builtin: false
        };
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
        if (partial.clearApiKey) settings.apiKey = '';
        if (partial.apiKey === '••••••••') {
          /* keep */
        }
        saveDemoStore({
          apiKey: settings.apiKey === '••••••••' ? store.apiKey : settings.apiKey,
          baseUrl: settings.baseUrl,
          model: settings.model,
          confirmShell: settings.confirmShell
        });
        settings.hasApiKey = Boolean(loadDemoStore().apiKey);
        return {
          ok: true,
          settings: {
            ...settings,
            apiKey: settings.hasApiKey ? '••••••••' : '',
            hasApiKey: settings.hasApiKey
          }
        };
      },
      saveHistory: async (h) => {
        history = Array.isArray(h) ? h.slice(-80) : [];
        saveDemoStore({ history });
        return { ok: true };
      },
      chat: demoChat
    };
  }

  const api = window.cway || createDemoBridge();

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function setStatus(text) {
    els.statusLine.textContent = text;
  }

  function openRail(open) {
    els.rail.classList.toggle('open', open);
    document.body.classList.toggle('drawer-open', open);
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
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'msg system';
      empty.textContent = 'No commands match';
      els.cmdList.appendChild(empty);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
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

  function formatMarkdownLite(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
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

  async function handleSend(text) {
    const content = text.trim();
    if (!content || state.busy) return;
    state.busy = true;
    els.sendBtn.disabled = true;
    setStatus('Thinking…');

    const userMsg = { role: 'user', content };
    state.messages.push(userMsg);
    appendMessage(userMsg);
    els.prompt.value = '';
    autoGrow();
    showTyping();

    try {
      const history = state.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await api.chat({ messages: history });
      hideTyping();

      if (!result.ok) {
        const err = {
          role: 'assistant',
          content: result.error || 'Something went wrong talking to the model.'
        };
        state.messages.push(err);
        appendMessage(err);
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
      }
      await persistHistory();
      setStatus(state.mode === 'demo' ? 'Demo mode · UI preview' : 'Standing by');
    } catch (err) {
      hideTyping();
      const msg = { role: 'assistant', content: err.message || String(err) };
      state.messages.push(msg);
      appendMessage(msg);
      setStatus('Error');
    } finally {
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

  async function boot() {
    renderSuggestions();
    const boot = await api.getBootstrap();
    state.mode = boot.mode || (window.cway ? 'desktop' : 'demo');
    state.commands = boot.commands || [];
    state.settings = boot.settings || state.settings;
    state.messages = [];

    els.modeBadge.textContent = state.mode === 'demo' ? 'Mobile demo' : 'Desktop';
    els.fineprint.textContent =
      state.mode === 'demo'
        ? 'Mobile demo · OS actions simulated · layout matches desktop'
        : `Desktop · ${boot.platform || 'host'} · OS actions enabled`;
    els.heroEyebrow.textContent =
      state.mode === 'demo' ? 'Demo · phone preview' : 'Online · OS linked';
    setStatus(state.mode === 'demo' ? 'Demo mode · UI preview' : 'Standing by');

    renderCommands();

    (boot.history || []).forEach((m) => {
      state.messages.push(m);
      appendMessage(m);
    });

    if (!(boot.history || []).length) {
      appendMessage({
        role: 'system',
        content:
          state.mode === 'demo'
            ? 'Phone UI demo loaded — try the suggestions or open the command rail.'
            : 'CwayClient ready. Ask me anything or run a command from the rail.'
      });
    }

    document.getElementById('setBaseUrl').value = state.settings.baseUrl || '';
    document.getElementById('setModel').value = state.settings.model || 'gpt-4o';
    document.getElementById('setApiKey').value = '';
    document.getElementById('setConfirmShell').checked = state.settings.confirmShell !== false;
  }

  // Events
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
    await api.saveHistory([]);
    appendMessage({
      role: 'system',
      content: 'Chat cleared.'
    });
  });

  els.btnSettings.addEventListener('click', () => {
    openRail(false);
    els.settingsModal.showModal();
  });

  els.btnAddCommand.addEventListener('click', () => {
    openRail(false);
    els.commandForm.reset();
    els.commandModal.showModal();
  });

  els.settingsForm.addEventListener('submit', async (e) => {
    const submitter = e.submitter;
    if (submitter && submitter.value === 'cancel') return;
    e.preventDefault();
    const apiKey = document.getElementById('setApiKey').value.trim();
    const payload = {
      baseUrl: document.getElementById('setBaseUrl').value.trim() || 'https://api.openai.com/v1',
      model: document.getElementById('setModel').value.trim() || 'gpt-4o',
      confirmShell: document.getElementById('setConfirmShell').checked
    };
    if (apiKey) payload.apiKey = apiKey;
    const res = await api.saveSettings(payload);
    if (res.ok) state.settings = res.settings;
    els.settingsModal.close();
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
    appendMessage({
      role: 'system',
      content: `Command added: ${payload.name}`
    });
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
    const res = await api.runCommand(cmd.id, args);
    appendMessage({
      role: 'tool',
      name: cmd.id,
      content: JSON.stringify(res, null, 2).slice(0, 1500)
    });
    appendMessage({
      role: 'assistant',
      content: res.ok
        ? `Done — ${cmd.name}.`
        : `Failed — ${res.error || 'unknown error'}`
    });
    setStatus(state.mode === 'demo' ? 'Demo mode · UI preview' : 'Standing by');
  });

  boot().catch((err) => {
    setStatus('Boot failed');
    appendMessage({ role: 'assistant', content: String(err) });
  });
})();
