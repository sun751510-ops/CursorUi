/**
 * CwayClient OS shell — router, home, memory/tasks/notes modules,
 * voice-mode overlay, command palette, live system panel.
 * Runs on top of app.js (chat / voice / settings plumbing).
 */
(() => {
  const $ = (id) => document.getElementById(id);

  /* ---------------- storage-backed modules ---------------- */
  function readStore(key) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  function writeStore(key, list) {
    localStorage.setItem(key, JSON.stringify(list));
  }

  const Memory = {
    key: 'cway-memories',
    all() {
      return readStore(this.key);
    },
    add(text) {
      const list = this.all();
      list.unshift({ id: Date.now(), text: String(text).trim(), at: new Date().toISOString() });
      writeStore(this.key, list.slice(0, 200));
    },
    remove(id) {
      writeStore(this.key, this.all().filter((m) => m.id !== id));
    },
    text() {
      return this.all()
        .slice(0, 30)
        .map((m) => m.text)
        .join(' | ')
        .slice(0, 1200);
    }
  };
  window.CwayMemory = Memory;

  const Tasks = {
    key: 'cway-tasks',
    all() {
      return readStore(this.key);
    },
    add(raw) {
      let text = String(raw).trim();
      let pri = 'normal';
      if (/!high/i.test(text)) { pri = 'high'; text = text.replace(/!high/gi, '').trim(); }
      if (/!low/i.test(text)) { pri = 'low'; text = text.replace(/!low/gi, '').trim(); }
      if (!text) return;
      const list = this.all();
      list.unshift({ id: Date.now(), text, pri, done: false });
      writeStore(this.key, list.slice(0, 300));
    },
    toggle(id) {
      writeStore(this.key, this.all().map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    },
    remove(id) {
      writeStore(this.key, this.all().filter((t) => t.id !== id));
    }
  };

  const Notes = {
    key: 'cway-notes',
    all() {
      return readStore(this.key);
    },
    add(text) {
      const list = this.all();
      list.unshift({ id: Date.now(), text: String(text).trim(), at: new Date().toISOString() });
      writeStore(this.key, list.slice(0, 300));
    },
    update(id, text) {
      writeStore(this.key, this.all().map((n) => (n.id === id ? { ...n, text } : n)));
    },
    remove(id) {
      writeStore(this.key, this.all().filter((n) => n.id !== id));
    }
  };

  /* ---------------- renderers ---------------- */
  function esc(s) {
    return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  }

  function renderMemory() {
    const wrap = $('memoryList');
    if (!wrap) return;
    const items = Memory.all();
    wrap.innerHTML = items.length
      ? ''
      : '<p class="empty" style="color:var(--muted)">Nothing saved yet. Tell me “remember …” or add one above.</p>';
    items.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'mem-card';
      card.innerHTML = `<p>${esc(m.text)}</p><time>${new Date(m.at).toLocaleDateString()}</time>
        <div class="card-actions"><button data-del="${m.id}">Forget</button></div>`;
      card.querySelector('[data-del]').addEventListener('click', () => {
        Memory.remove(m.id);
        renderMemory();
        renderHomeWidgets();
      });
      wrap.appendChild(card);
    });
  }

  function renderTasks() {
    const wrap = $('taskList');
    if (!wrap) return;
    const items = Tasks.all();
    const done = items.filter((t) => t.done).length;
    const prog = $('taskProgress');
    if (prog) {
      prog.hidden = items.length === 0;
      $('taskBarFill').style.width = items.length ? `${Math.round((done / items.length) * 100)}%` : '0%';
      $('taskBarLabel').textContent = `${done} of ${items.length} done`;
    }
    wrap.innerHTML = items.length ? '' : '<p class="empty" style="color:var(--muted)">No tasks. Add one above.</p>';
    items.forEach((t) => {
      const row = document.createElement('div');
      row.className = `task-item${t.done ? ' done' : ''}`;
      row.innerHTML = `<button class="task-check" aria-label="Toggle">✓</button>
        <span class="task-title">${esc(t.text)}</span>
        ${t.pri !== 'normal' ? `<span class="task-pri ${t.pri}">${t.pri}</span>` : ''}
        <button class="task-del" aria-label="Delete">✕</button>`;
      row.querySelector('.task-check').addEventListener('click', () => {
        Tasks.toggle(t.id);
        renderTasks();
        renderHomeWidgets();
      });
      row.querySelector('.task-del').addEventListener('click', () => {
        Tasks.remove(t.id);
        renderTasks();
        renderHomeWidgets();
      });
      wrap.appendChild(row);
    });
  }

  function renderNotes() {
    const wrap = $('noteList');
    if (!wrap) return;
    const items = Notes.all();
    wrap.innerHTML = items.length ? '' : '<p class="empty" style="color:var(--muted)">No notes yet.</p>';
    items.forEach((n) => {
      const card = document.createElement('div');
      card.className = 'mem-card';
      card.innerHTML = `<p contenteditable="true" spellcheck="false">${esc(n.text)}</p>
        <time>${new Date(n.at).toLocaleDateString()}</time>
        <div class="card-actions"><button data-del="${n.id}">Delete</button></div>`;
      const p = card.querySelector('p');
      p.addEventListener('blur', () => Notes.update(n.id, p.textContent.trim()));
      card.querySelector('[data-del]').addEventListener('click', () => {
        Notes.remove(n.id);
        renderNotes();
      });
      wrap.appendChild(card);
    });
  }

  function renderHomeWidgets() {
    const t = $('homeTasks');
    if (t) {
      const open = Tasks.all().filter((x) => !x.done).slice(0, 4);
      t.innerHTML = open.length ? '' : '<p class="empty">No open tasks.</p>';
      open.forEach((x) => {
        const d = document.createElement('div');
        d.className = 'widget-item';
        d.textContent = x.text;
        t.appendChild(d);
      });
    }
    const m = $('homeMemory');
    if (m) {
      const mem = Memory.all().slice(0, 3);
      m.innerHTML = mem.length ? '' : '<p class="empty">Nothing saved yet.</p>';
      mem.forEach((x) => {
        const d = document.createElement('div');
        d.className = 'widget-item';
        d.textContent = x.text.slice(0, 70);
        m.appendChild(d);
      });
    }
  }

  /* ---------------- router ---------------- */
  const VIEWS = ['home', 'chat', 'memory', 'tasks', 'notes', 'settings'];
  let currentView = 'home';

  function go(view) {
    if (!VIEWS.includes(view)) return;
    currentView = view;
    VIEWS.forEach((v) => {
      $(`view-${v}`)?.classList.toggle('active', v === view);
    });
    document.querySelectorAll('.nav-item[data-view]').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === view);
    });
    document.querySelectorAll('.bn-item[data-view]').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === view);
    });
    if (view === 'memory') renderMemory();
    if (view === 'tasks') renderTasks();
    if (view === 'notes') renderNotes();
    if (view === 'home') renderHomeWidgets();
    if (view === 'chat') {
      const chat = $('chat');
      if (chat) chat.scrollTop = chat.scrollHeight;
    }
    document.body.classList.remove('drawer-open');
    $('rail')?.classList.remove('open');
  }
  window.CwayGo = go;

  document.querySelectorAll('.nav-item[data-view], .bn-item[data-view]').forEach((b) => {
    b.addEventListener('click', () => go(b.dataset.view));
  });
  document.querySelectorAll('.nav-item.soon').forEach((b) => {
    b.addEventListener('click', () => {
      const name = b.dataset.soon || 'This module';
      window.CwayToast?.(`${name} isn’t connected yet.`);
      const status = $('statusLine');
      if (status) status.textContent = `${name} module — coming soon`;
    });
  });
  document.querySelectorAll('[data-goto]').forEach((b) => {
    b.addEventListener('click', () => go(b.dataset.goto));
  });

  /* ---------------- home greeting ---------------- */
  function greet() {
    const h = new Date().getHours();
    const part = h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const eyebrow = $('homeEyebrow');
    const title = $('homeGreeting');
    if (eyebrow) eyebrow.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    if (title) title.textContent = `${part}. I’m online.`;
  }

  /* ---------------- forms ---------------- */
  $('memoryForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('memoryInput');
    if (input.value.trim()) {
      Memory.add(input.value);
      input.value = '';
      renderMemory();
      renderHomeWidgets();
    }
  });
  $('taskForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('taskInput');
    if (input.value.trim()) {
      Tasks.add(input.value);
      input.value = '';
      renderTasks();
      renderHomeWidgets();
    }
  });
  $('noteForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('noteInput');
    if (input.value.trim()) {
      Notes.add(input.value);
      input.value = '';
      renderNotes();
    }
  });

  $('openSettingsModal')?.addEventListener('click', () => $('btnSettings')?.click());
  $('btnClearChatMobile')?.addEventListener('click', () => $('btnClearChat')?.click());
  $('btnWipeLocal')?.addEventListener('click', () => {
    if (!confirm('Erase all local memories, tasks and notes?')) return;
    [Memory.key, Tasks.key, Notes.key].forEach((k) => localStorage.removeItem(k));
    renderMemory();
    renderTasks();
    renderNotes();
    renderHomeWidgets();
  });

  /* ---------------- voice overlay ---------------- */
  const overlay = $('voiceOverlay');
  const voSphere = $('voSphere');
  const voStatus = $('voStatus');
  const voTranscript = $('voTranscript');
  let overlayOpen = false;
  let idleTimer = null;

  function openOverlay() {
    overlayOpen = true;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    syncOverlay();
  }
  function closeOverlay() {
    overlayOpen = false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    clearTimeout(idleTimer);
  }
  $('voClose')?.addEventListener('click', () => {
    closeOverlay();
    go('chat');
  });
  $('voStop')?.addEventListener('click', () => {
    // Delegate to the real mic toggle (stop = transcribe + send + speak)
    $('micBtn')?.click();
  });

  function syncOverlay() {
    if (!overlayOpen) return;
    const orb = $('orb');
    const mic = $('micBtn');
    const listening = mic?.classList.contains('hot');
    const orbState = orb?.dataset.state || 'idle';
    const stateName = listening ? 'listening' : orbState;
    voSphere.dataset.state = stateName;
    overlay.classList.toggle('listening', stateName === 'listening');
    overlay.classList.toggle('speaking', stateName === 'speaking');
    const stopBtn = $('voStop');
    if (stateName === 'listening') {
      voStatus.textContent = 'Listening… tap Stop & send when done';
      stopBtn.style.display = '';
    } else if (stateName === 'thinking') {
      voStatus.textContent = 'Thinking…';
      stopBtn.style.display = 'none';
    } else if (stateName === 'speaking') {
      voStatus.textContent = 'Speaking…';
      stopBtn.style.display = 'none';
    } else {
      voStatus.textContent = 'Tap Stop & send, or ✕ to close';
      stopBtn.style.display = 'none';
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (overlayOpen && voSphere.dataset.state === 'idle') {
          closeOverlay();
          go('chat');
        }
      }, 2600);
    }
    const prompt = $('prompt');
    if (prompt && stateName === 'listening') voTranscript.textContent = prompt.value;
    const status = $('statusLine');
    if (status && stateName !== 'listening') voTranscript.textContent = status.textContent;
  }

  // observe orb + mic state to drive overlay animations
  const orbEl = $('orb');
  const micEl = $('micBtn');
  if (orbEl) new MutationObserver(syncOverlay).observe(orbEl, { attributes: true, attributeFilter: ['data-state'] });
  if (micEl) new MutationObserver(syncOverlay).observe(micEl, { attributes: true, attributeFilter: ['class'] });
  setInterval(() => {
    if (overlayOpen) syncOverlay();
  }, 500);

  // floating orb opens overlay (app.js also binds it to start voice)
  $('orbBtn')?.addEventListener('click', () => {
    openOverlay();
  });
  document.querySelectorAll('[data-action="voice"]').forEach((b) => {
    b.addEventListener('click', () => {
      openOverlay();
      $('micBtn')?.click();
    });
  });

  /* ---------------- command palette ---------------- */
  const palette = $('palette');
  const paletteInput = $('paletteInput');
  const paletteList = $('paletteList');
  const ACTIONS = [
    { label: 'Go to Home', ico: '◈', run: () => go('home') },
    { label: 'Go to Chat', ico: '💬', run: () => go('chat') },
    { label: 'Voice mode', ico: '🎙', run: () => { openOverlay(); $('micBtn')?.click(); } },
    { label: 'Go to Memory', ico: '🧠', run: () => go('memory') },
    { label: 'Go to Tasks', ico: '☑', run: () => go('tasks') },
    { label: 'Go to Notes', ico: '📝', run: () => go('notes') },
    { label: 'Open Settings', ico: '⚙', run: () => $('btnSettings')?.click() },
    { label: 'New chat (clear)', ico: '🧹', run: () => $('btnClearChat')?.click() }
  ];
  function openPalette() {
    palette.classList.add('open');
    renderPalette('');
    setTimeout(() => paletteInput.focus(), 30);
  }
  function closePalette() {
    palette.classList.remove('open');
    paletteInput.value = '';
  }
  function renderPalette(q) {
    const query = q.toLowerCase();
    paletteList.innerHTML = '';
    ACTIONS.filter((a) => a.label.toLowerCase().includes(query)).forEach((a, i) => {
      const b = document.createElement('button');
      b.className = `palette-item${i === 0 ? ' sel' : ''}`;
      b.innerHTML = `<span>${a.ico}</span> ${a.label}`;
      b.addEventListener('click', () => {
        closePalette();
        a.run();
      });
      paletteList.appendChild(b);
    });
  }
  $('paletteBtn')?.addEventListener('click', openPalette);
  paletteInput?.addEventListener('input', () => renderPalette(paletteInput.value));
  paletteInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      paletteList.querySelector('.palette-item')?.click();
    }
    if (e.key === 'Escape') closePalette();
  });
  palette?.addEventListener('click', (e) => {
    if (e.target === palette) closePalette();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      palette.classList.contains('open') ? closePalette() : openPalette();
    }
    if (e.key === 'Escape' && overlayOpen) closeOverlay();
  });

  /* ---------------- system panel ---------------- */
  function fmtBytes(n) {
    return n > 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
  }
  function updateSys() {
    const clock = $('sysClock');
    if (clock) clock.textContent = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const net = $('sysNet');
    if (net) net.textContent = navigator.onLine ? 'Connected' : 'Offline';
    const pill = $('netPill');
    if (pill) pill.classList.toggle('off', !navigator.onLine);
    const api = $('sysApi');
    if (api) api.textContent = $('cursorStatus')?.textContent?.slice(0, 26) || '—';
    const model = $('sysModel');
    if (model) model.textContent = $('modelSelect')?.value || 'auto';
    const store = $('sysStore');
    if (store) {
      let bytes = 0;
      try {
        for (let i = 0; i < localStorage.length; i += 1) {
          const k = localStorage.key(i);
          bytes += (localStorage.getItem(k) || '').length + k.length;
        }
      } catch {
        /* ignore */
      }
      store.textContent = fmtBytes(bytes);
    }
    const ai = $('sysAi');
    if (ai) {
      const s = $('orb')?.dataset.state || 'idle';
      ai.textContent = s === 'idle' ? 'Idle' : s[0].toUpperCase() + s.slice(1);
    }
  }
  setInterval(updateSys, 2000);
  window.addEventListener('online', updateSys);
  window.addEventListener('offline', updateSys);

  /* ---------------- particles ---------------- */
  function particles() {
    const canvas = $('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let pts = [];
    function resize() {
      canvas.width = innerWidth * devicePixelRatio;
      canvas.height = innerHeight * devicePixelRatio;
      const n = Math.min(46, Math.floor(innerWidth / 34));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: (Math.random() * 1.4 + 0.4) * devicePixelRatio,
        vx: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.12 * devicePixelRatio,
        a: Math.random() * 0.5 + 0.1
      }));
    }
    resize();
    window.addEventListener('resize', resize);
    (function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(86, 214, 255, ${p.a * 0.35})`;
        ctx.fill();
      });
      requestAnimationFrame(tick);
    })();
  }

  /* ---------------- boot ---------------- */
  greet();
  renderHomeWidgets();
  updateSys();
  particles();
  // land on chat when a conversation already exists
  try {
    const store = JSON.parse(localStorage.getItem('cwayclient-demo') || '{}');
    if (Array.isArray(store.history) && store.history.length) go('chat');
  } catch {
    /* ignore */
  }
})();
