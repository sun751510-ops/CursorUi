const { app, BrowserWindow, ipcMain, shell, Notification, clipboard, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile, spawn } = require('child_process');
const Store = require('electron-store');
const { runAiTurn } = require('./ai');
const { CursorBridge, publicSettings } = require('./cursor-bridge');
const { createRelayServer, DEFAULT_PORT } = require('./relay');

let relayInfo = null;

const store = new Store({
  name: 'cwayclient',
  defaults: {
    settings: {
      provider: 'cursor',
      cursorApiKey: '',
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'auto',
      confirmShell: true,
      voiceEnabled: true,
      voiceName: '',
      workspacePath: ''
    },
    customCommands: [],
    chatHistory: []
  }
});

function getSettings() {
  return store.get('settings');
}

const cursorBridge = new CursorBridge({
  getSettings,
  getCommands: () => getAllCommands(),
  executeCommand: (id, args) => executeCommand(id, args),
  addCommand: (payload) => addCustomCommand(payload)
});

const BUILTIN_COMMANDS = [
  {
    id: 'open_url',
    name: 'Open URL',
    description: 'Open a website in the default browser',
    category: 'system',
    params: [{ key: 'url', label: 'URL', type: 'string', required: true }],
    builtin: true
  },
  {
    id: 'open_path',
    name: 'Open Path',
    description: 'Open a file or folder with the default app',
    category: 'files',
    params: [{ key: 'path', label: 'Path', type: 'string', required: true }],
    builtin: true
  },
  {
    id: 'reveal_path',
    name: 'Reveal in File Manager',
    description: 'Show a path in the system file manager',
    category: 'files',
    params: [{ key: 'path', label: 'Path', type: 'string', required: true }],
    builtin: true
  },
  {
    id: 'list_dir',
    name: 'List Directory',
    description: 'List files in a directory',
    category: 'files',
    params: [
      { key: 'path', label: 'Path', type: 'string', required: true },
      { key: 'limit', label: 'Limit', type: 'number', required: false }
    ],
    builtin: true
  },
  {
    id: 'read_file',
    name: 'Read File',
    description: 'Read a text file (truncated for large files)',
    category: 'files',
    params: [
      { key: 'path', label: 'Path', type: 'string', required: true },
      { key: 'maxBytes', label: 'Max bytes', type: 'number', required: false }
    ],
    builtin: true
  },
  {
    id: 'write_file',
    name: 'Write File',
    description: 'Write text content to a file',
    category: 'files',
    params: [
      { key: 'path', label: 'Path', type: 'string', required: true },
      { key: 'content', label: 'Content', type: 'string', required: true }
    ],
    builtin: true
  },
  {
    id: 'run_shell',
    name: 'Run Shell',
    description: 'Run a shell command (may require confirmation)',
    category: 'system',
    params: [
      { key: 'command', label: 'Command', type: 'string', required: true },
      { key: 'cwd', label: 'Working directory', type: 'string', required: false }
    ],
    builtin: true
  },
  {
    id: 'open_app',
    name: 'Open App',
    description: 'Launch an application by name or path',
    category: 'system',
    params: [{ key: 'target', label: 'App name or path', type: 'string', required: true }],
    builtin: true
  },
  {
    id: 'system_info',
    name: 'System Info',
    description: 'Get basic host system information',
    category: 'system',
    params: [],
    builtin: true
  },
  {
    id: 'clipboard_read',
    name: 'Read Clipboard',
    description: 'Read text from the clipboard',
    category: 'util',
    params: [],
    builtin: true
  },
  {
    id: 'clipboard_write',
    name: 'Write Clipboard',
    description: 'Write text to the clipboard',
    category: 'util',
    params: [{ key: 'text', label: 'Text', type: 'string', required: true }],
    builtin: true
  },
  {
    id: 'notify',
    name: 'Notify',
    description: 'Show a desktop notification',
    category: 'util',
    params: [
      { key: 'title', label: 'Title', type: 'string', required: true },
      { key: 'body', label: 'Body', type: 'string', required: true }
    ],
    builtin: true
  },
  {
    id: 'open_home',
    name: 'Open Home Folder',
    description: 'Open the user home directory',
    category: 'files',
    params: [],
    builtin: true
  }
];

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 920,
    minHeight: 640,
    backgroundColor: '#071018',
    title: 'CwayClient',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'web', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function getAllCommands() {
  const custom = store.get('customCommands') || [];
  return [...BUILTIN_COMMANDS, ...custom];
}

function addCustomCommand(payload) {
  const custom = store.get('customCommands') || [];
  const id = String(payload.id || `custom_${Date.now()}`).replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  if (getAllCommands().some((c) => c.id === id)) {
    return { ok: false, error: 'Command id already exists' };
  }
  const entry = {
    id,
    name: String(payload.name || id),
    description: String(payload.description || ''),
    category: String(payload.category || 'custom'),
    params: Array.isArray(payload.params) ? payload.params : [],
    shell: payload.shell ? String(payload.shell) : undefined,
    url: payload.url ? String(payload.url) : undefined,
    path: payload.path ? String(payload.path) : undefined,
    cwd: payload.cwd ? String(payload.cwd) : undefined,
    builtin: false
  };
  if (!entry.shell && !entry.url && !entry.path) {
    return { ok: false, error: 'Provide shell, url, or path for the command' };
  }
  custom.push(entry);
  store.set('customCommands', custom);
  return { ok: true, command: entry, commands: getAllCommands() };
}

function expandHome(p) {
  if (!p) return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

async function confirmShell(command) {
  const settings = store.get('settings');
  if (!settings.confirmShell) return true;
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Cancel', 'Run'],
    defaultId: 0,
    cancelId: 0,
    title: 'Confirm shell command',
    message: 'CwayClient wants to run a shell command',
    detail: command
  });
  return result.response === 1;
}

function runShell(command, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      cwd: cwd ? expandHome(cwd) : os.homedir(),
      env: process.env,
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    const max = 80_000;
    child.stdout.on('data', (d) => {
      if (stdout.length < max) stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      if (stderr.length < max) stderr += d.toString();
    });
    child.on('error', (err) => {
      resolve({ ok: false, error: err.message, stdout, stderr });
    });
    child.on('close', (code) => {
      resolve({
        ok: code === 0,
        code,
        stdout: stdout.slice(0, max),
        stderr: stderr.slice(0, max)
      });
    });
  });
}

async function executeCommand(id, args = {}) {
  const commands = getAllCommands();
  const cmd = commands.find((c) => c.id === id);
  if (!cmd) return { ok: false, error: `Unknown command: ${id}` };

  try {
    switch (id) {
      case 'open_url': {
        const url = String(args.url || '');
        if (!/^https?:\/\//i.test(url)) throw new Error('URL must start with http:// or https://');
        await shell.openExternal(url);
        return { ok: true, result: `Opened ${url}` };
      }
      case 'open_path': {
        const p = expandHome(String(args.path || ''));
        const err = await shell.openPath(p);
        if (err) throw new Error(err);
        return { ok: true, result: `Opened ${p}` };
      }
      case 'reveal_path': {
        const p = expandHome(String(args.path || ''));
        shell.showItemInFolder(p);
        return { ok: true, result: `Revealed ${p}` };
      }
      case 'list_dir': {
        const p = expandHome(String(args.path || ''));
        const limit = Math.min(Number(args.limit) || 200, 500);
        const entries = fs.readdirSync(p, { withFileTypes: true }).slice(0, limit).map((e) => ({
          name: e.name,
          type: e.isDirectory() ? 'dir' : 'file'
        }));
        return { ok: true, result: entries };
      }
      case 'read_file': {
        const p = expandHome(String(args.path || ''));
        const maxBytes = Math.min(Number(args.maxBytes) || 40_000, 200_000);
        const buf = fs.readFileSync(p);
        const truncated = buf.length > maxBytes;
        return {
          ok: true,
          result: {
            path: p,
            bytes: buf.length,
            truncated,
            content: buf.slice(0, maxBytes).toString('utf8')
          }
        };
      }
      case 'write_file': {
        const p = expandHome(String(args.path || ''));
        fs.mkdirSync(path.dirname(p), { recursive: true });
        fs.writeFileSync(p, String(args.content ?? ''), 'utf8');
        return { ok: true, result: `Wrote ${p}` };
      }
      case 'run_shell': {
        const command = String(args.command || '');
        if (!command.trim()) throw new Error('Command is required');
        const allowed = await confirmShell(command);
        if (!allowed) return { ok: false, error: 'Cancelled by user' };
        const result = await runShell(command, args.cwd);
        return { ok: result.ok, result };
      }
      case 'open_app': {
        const target = String(args.target || '');
        if (process.platform === 'darwin') {
          await new Promise((resolve, reject) => {
            execFile('open', ['-a', target], (err) => (err ? reject(err) : resolve()));
          });
        } else if (process.platform === 'win32') {
          await new Promise((resolve, reject) => {
            execFile('cmd', ['/c', 'start', '', target], { windowsHide: true }, (err) =>
              err ? reject(err) : resolve()
            );
          });
        } else {
          spawn(target, { shell: true, detached: true, stdio: 'ignore' }).unref();
        }
        return { ok: true, result: `Launched ${target}` };
      }
      case 'system_info': {
        return {
          ok: true,
          result: {
            platform: process.platform,
            arch: process.arch,
            hostname: os.hostname(),
            release: os.release(),
            homedir: os.homedir(),
            tmpdir: os.tmpdir(),
            cpus: os.cpus()?.[0]?.model || 'unknown',
            totalMem: os.totalmem(),
            freeMem: os.freemem(),
            uptime: os.uptime()
          }
        };
      }
      case 'clipboard_read':
        return { ok: true, result: clipboard.readText() };
      case 'clipboard_write':
        clipboard.writeText(String(args.text ?? ''));
        return { ok: true, result: 'Clipboard updated' };
      case 'notify': {
        const title = String(args.title || 'CwayClient');
        const body = String(args.body || '');
        if (Notification.isSupported()) {
          new Notification({ title, body }).show();
        }
        return { ok: true, result: 'Notification sent' };
      }
      case 'open_home': {
        const err = await shell.openPath(os.homedir());
        if (err) throw new Error(err);
        return { ok: true, result: `Opened ${os.homedir()}` };
      }
      default: {
        if (cmd.shell) {
          let command = String(cmd.shell);
          for (const [key, value] of Object.entries(args || {})) {
            command = command.replaceAll(`{{${key}}}`, String(value));
          }
          const allowed = await confirmShell(command);
          if (!allowed) return { ok: false, error: 'Cancelled by user' };
          const result = await runShell(command, cmd.cwd);
          return { ok: result.ok, result };
        }
        if (cmd.url) {
          let url = String(cmd.url);
          for (const [key, value] of Object.entries(args || {})) {
            url = url.replaceAll(`{{${key}}}`, encodeURIComponent(String(value)));
          }
          await shell.openExternal(url);
          return { ok: true, result: `Opened ${url}` };
        }
        if (cmd.path) {
          const p = expandHome(String(cmd.path));
          const err = await shell.openPath(p);
          if (err) throw new Error(err);
          return { ok: true, result: `Opened ${p}` };
        }
        return { ok: false, error: 'Custom command has no action defined' };
      }
    }
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

function registerIpc() {
  ipcMain.handle('cway:getBootstrap', () => ({
    mode: 'desktop',
    platform: process.platform,
    commands: getAllCommands(),
    settings: publicSettings(getSettings()),
    history: store.get('chatHistory') || [],
    relay: relayInfo
      ? { port: relayInfo.port, ips: relayInfo.ips, urls: relayInfo.urls }
      : null
  }));

  ipcMain.handle('cway:getRelay', () =>
    relayInfo
      ? { ok: true, port: relayInfo.port, ips: relayInfo.ips, urls: relayInfo.urls }
      : { ok: false, error: 'Relay not running' }
  );

  ipcMain.handle('cway:getCommands', () => getAllCommands());

  ipcMain.handle('cway:runCommand', async (_e, payload) => {
    const { id, args } = payload || {};
    return executeCommand(id, args || {});
  });

  ipcMain.handle('cway:addCommand', (_e, payload) => addCustomCommand(payload || {}));

  ipcMain.handle('cway:removeCommand', (_e, id) => {
    const custom = (store.get('customCommands') || []).filter((c) => c.id !== id);
    store.set('customCommands', custom);
    return { ok: true, commands: getAllCommands() };
  });

  ipcMain.handle('cway:saveSettings', (_e, partial) => {
    const current = getSettings();
    const next = { ...current, ...partial };
    if (partial.apiKey === '••••••••' || partial.apiKey === undefined) {
      next.apiKey = current.apiKey;
    }
    if (partial.cursorApiKey === '••••••••' || partial.cursorApiKey === undefined) {
      next.cursorApiKey = current.cursorApiKey;
    }
    if (partial.clearApiKey) next.apiKey = '';
    if (partial.clearCursorKey) next.cursorApiKey = '';
    store.set('settings', next);
    if (
      partial.cursorApiKey ||
      partial.clearCursorKey ||
      partial.model ||
      partial.provider ||
      partial.workspacePath
    ) {
      cursorBridge.reset();
    }
    return { ok: true, settings: publicSettings(next) };
  });

  ipcMain.handle('cway:listModels', async (_e, payload) => {
    const settings = getSettings();
    if ((settings.provider || 'cursor') === 'cursor') {
      return cursorBridge.listModels({ force: Boolean(payload?.force) });
    }
    return {
      ok: true,
      models: [
        { id: 'gpt-4o', displayName: 'GPT-4o' },
        { id: 'gpt-4.1', displayName: 'GPT-4.1' },
        { id: 'o3-mini', displayName: 'o3-mini' }
      ]
    };
  });

  ipcMain.handle('cway:testCursor', async () => {
    const listed = await cursorBridge.listModels({ force: true });
    if (!listed.ok) return listed;
    return {
      ok: true,
      message: `Connected to Cursor · ${listed.models.length} models available`,
      models: listed.models
    };
  });

  ipcMain.handle('cway:saveHistory', (_e, history) => {
    store.set('chatHistory', Array.isArray(history) ? history.slice(-80) : []);
    return { ok: true };
  });

  ipcMain.handle('cway:chat', async (event, payload) => {
    const settings = getSettings();
    const messages = payload?.messages || [];
    const commands = getAllCommands();
    const provider = settings.provider || 'cursor';

    const sendStatus = (text) => {
      try {
        event.sender.send('cway:status', text);
      } catch {
        /* ignore */
      }
    };

    if (provider === 'cursor') {
      try {
        return await cursorBridge.chat({ messages, onStatus: sendStatus });
      } catch (err) {
        return { ok: false, error: err.message || String(err), provider: 'cursor' };
      }
    }

    const tools = {
      run_command: async (args) => executeCommand(args.command_id, args.args || {}),
      add_command: async (args) => addCustomCommand(args),
      list_commands: async () => ({ ok: true, commands })
    };

    return runAiTurn({
      settings,
      messages,
      commands,
      tools
    });
  });
}

app.setName('CwayClient');

app.whenReady().then(async () => {
  registerIpc();
  try {
    relayInfo = await createRelayServer({
      cursorBridge,
      getSettings,
      getAllCommands,
      port: Number(process.env.CWAY_RELAY_PORT) || DEFAULT_PORT
    });
    console.log(
      '[CwayClient] Phone relay on',
      relayInfo.urls.join(', ') || `http://localhost:${relayInfo.port}`
    );
  } catch (err) {
    console.error('[CwayClient] Relay failed to start:', err.message || err);
    relayInfo = null;
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  try {
    relayInfo?.server?.close?.();
  } catch {
    /* ignore */
  }
});
