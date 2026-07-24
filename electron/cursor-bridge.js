/**
 * Cursor SDK bridge — list models + chat via local Agent with CwayClient tools.
 */
const os = require('os');

let Agent;
let Cursor;

function loadSdk() {
  if (Agent && Cursor) return;
  ({ Agent, Cursor } = require('@cursor/sdk'));
}

function publicSettings(settings) {
  return {
    ...settings,
    cursorApiKey: settings.cursorApiKey ? '••••••••' : '',
    apiKey: settings.apiKey ? '••••••••' : '',
    hasCursorKey: Boolean(settings.cursorApiKey),
    hasApiKey: Boolean(settings.apiKey || settings.cursorApiKey)
  };
}

function buildInstruction(commands) {
  const catalog = commands
    .map((c) => {
      const params = (c.params || [])
        .map((p) => `${p.key}${p.required ? '*' : ''}`)
        .join(', ');
      return `- ${c.id}: ${c.name} — ${c.description}${params ? ` (${params})` : ''}`;
    })
    .join('\n');

  return `You are CwayClient — a sharp desktop AI copilot (Jarvis-style).
You help the user run their computer and workflows: open apps/files/URLs, shell, clipboard, notifications, and invent reusable commands.

Personality: warm, concise, capable. Speak like a trusted operator, not a chatbot.

Tools:
- list_cway_commands — list registered commands
- run_cway_command — run a command by id with args
- add_cway_command — create a reusable command (shell and/or url and/or path; use {{param}} placeholders)

Available commands:
${catalog}

Rules:
- Prefer tools for real actions.
- Confirm before dangerous shell.
- When inventing commands, pick clear ids and descriptions.
- Keep replies short unless the user asks for detail.`;
}

class CursorBridge {
  constructor({ getSettings, getCommands, executeCommand, addCommand }) {
    this.getSettings = getSettings;
    this.getCommands = getCommands;
    this.executeCommand = executeCommand;
    this.addCommand = addCommand;
    this.agent = null;
    this.agentKey = null;
    this.modelCache = null;
    this.modelCacheAt = 0;
    this.primed = false;
  }

  apiKey() {
    return this.getSettings().cursorApiKey || process.env.CURSOR_API_KEY || '';
  }

  async listModels({ force = false } = {}) {
    loadSdk();
    const key = this.apiKey();
    if (!key) {
      return { ok: false, error: 'Add your Cursor API key in Settings (cursor.com/dashboard/api).', models: [] };
    }
    const now = Date.now();
    if (!force && this.modelCache && now - this.modelCacheAt < 60_000) {
      return { ok: true, models: this.modelCache };
    }
    try {
      const models = await Cursor.models.list({ apiKey: key });
      this.modelCache = (models || []).map((m) => ({
        id: m.id,
        displayName: m.displayName || m.id,
        description: m.description || '',
        aliases: m.aliases || [],
        parameters: m.parameters || [],
        variants: m.variants || []
      }));
      this.modelCacheAt = now;
      return { ok: true, models: this.modelCache };
    } catch (err) {
      return { ok: false, error: err.message || String(err), models: [] };
    }
  }

  customTools() {
    return {
      list_cway_commands: {
        description: 'List all CwayClient OS commands available on this machine.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        execute: async () => {
          const commands = this.getCommands();
          return { ok: true, commands };
        }
      },
      run_cway_command: {
        description: 'Execute a CwayClient command on the host OS by command id.',
        inputSchema: {
          type: 'object',
          properties: {
            command_id: { type: 'string', description: 'Command id e.g. open_url, run_shell' },
            args: { type: 'object', description: 'Arguments for the command' }
          },
          required: ['command_id']
        },
        execute: async (args) => {
          const result = await this.executeCommand(String(args.command_id || ''), args.args || {});
          return result;
        }
      },
      add_cway_command: {
        description:
          'Create a reusable CwayClient command. Provide shell and/or url and/or path. Use {{param}} placeholders.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            shell: { type: 'string' },
            url: { type: 'string' },
            path: { type: 'string' },
            cwd: { type: 'string' },
            params: { type: 'array' }
          },
          required: ['id', 'name', 'description']
        },
        execute: async (args) => this.addCommand(args)
      }
    };
  }

  async ensureAgent() {
    loadSdk();
    const settings = this.getSettings();
    const key = this.apiKey();
    if (!key) {
      throw new Error(
        'Connect Cursor: open Settings and paste your Cursor API key from https://cursor.com/dashboard/api'
      );
    }

    const modelId = settings.model || 'auto';
    const agentKey = `${key.slice(0, 8)}::${modelId}`;
    if (this.agent && this.agentKey === agentKey) return this.agent;

    if (this.agent) {
      try {
        this.agent.close();
      } catch {
        /* ignore */
      }
      this.agent = null;
      this.primed = false;
    }

    const cwd = settings.workspacePath || os.homedir();
    this.agent = await Agent.create({
      apiKey: key,
      name: 'CwayClient',
      model: { id: modelId },
      local: {
        cwd,
        customTools: this.customTools()
      }
    });
    this.agentKey = agentKey;
    this.primed = false;
    return this.agent;
  }

  async chat({ messages, onStatus } = {}) {
    const lastUser = [...(messages || [])].reverse().find((m) => m.role === 'user');
    if (!lastUser?.content) {
      return { ok: false, error: 'Empty message' };
    }

    const setStatus = (s) => {
      try {
        onStatus?.(s);
      } catch {
        /* ignore */
      }
    };

    setStatus('Connecting to Cursor…');
    const agent = await this.ensureAgent();
    const commands = this.getCommands();

    if (!this.primed) {
      setStatus('Priming CwayClient…');
      const prime = await agent.send(
        `${buildInstruction(commands)}\n\nAcknowledge in one short sentence that you are online as CwayClient.`
      );
      await prime.wait();
      this.primed = true;
    }

    setStatus('Thinking with Cursor…');
    const trace = [];
    let assistantText = '';

    const run = await agent.send(lastUser.content, {
      local: { customTools: this.customTools() }
    });

    if (typeof run.stream === 'function') {
      try {
        for await (const event of run.stream()) {
          if (!event) continue;
          if (event.type === 'assistant' && event.message?.content) {
            for (const block of event.message.content) {
              if (block?.type === 'text' && block.text) assistantText += block.text;
            }
          } else if (event.type === 'thinking') {
            setStatus('Thinking…');
          } else if (event.type === 'tool_call') {
            setStatus(`Running ${event.name || 'tool'}…`);
            trace.push({
              tool: event.name || 'tool',
              args: event.args || {},
              result: { status: event.status || 'updated' }
            });
          } else if (event.type === 'status' && event.status) {
            setStatus(String(event.status));
          }
        }
      } catch {
        /* fall through to wait() */
      }
    }

    const result = await run.wait();
    if (result?.status === 'error') {
      return {
        ok: false,
        error: result.error?.message || 'Cursor run failed',
        provider: 'cursor',
        trace
      };
    }
    if (!assistantText && typeof result?.result === 'string') {
      assistantText = result.result;
    }
    if (!assistantText) assistantText = 'Done.';

    return {
      ok: true,
      message: { role: 'assistant', content: assistantText.trim() },
      trace,
      commands: this.getCommands(),
      provider: 'cursor',
      model: this.getSettings().model || 'auto'
    };
  }

  reset() {
    if (this.agent) {
      try {
        this.agent.close();
      } catch {
        /* ignore */
      }
    }
    this.agent = null;
    this.agentKey = null;
    this.primed = false;
  }
}

module.exports = { CursorBridge, publicSettings, buildInstruction };
