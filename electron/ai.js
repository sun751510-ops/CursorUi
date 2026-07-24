/**
 * OpenAI-compatible chat + tool calling for CwayClient.
 * Works with OpenAI, OpenRouter, local proxies, etc.
 */

const SYSTEM_PROMPT = `You are CwayClient, a capable desktop Jarvis assistant.
You help the user by answering clearly and by using tools to perform real OS actions.

Rules:
- Prefer using existing commands via run_command when they fit.
- When the user asks to create a reusable action, use add_command with a clear id, name, description, and either shell, url, or path.
- For shell templates, use {{param}} placeholders matching params[].key.
- Be concise. Confirm destructive actions in plain language before running dangerous shell.
- If a tool fails, explain briefly and suggest a fix.
- You are named CwayClient. Be warm, sharp, and efficient — not overly theatrical.`;

function commandCatalog(commands) {
  return commands
    .map((c) => {
      const params = (c.params || [])
        .map((p) => `${p.key}${p.required ? '*' : ''}:${p.type || 'string'}`)
        .join(', ');
      return `- ${c.id}: ${c.name} — ${c.description}${params ? ` [${params}]` : ''}`;
    })
    .join('\n');
}

function buildTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'list_commands',
        description: 'List available CwayClient commands',
        parameters: { type: 'object', properties: {}, additionalProperties: false }
      }
    },
    {
      type: 'function',
      function: {
        name: 'run_command',
        description: 'Execute a registered CwayClient command on the host OS',
        parameters: {
          type: 'object',
          properties: {
            command_id: { type: 'string' },
            args: { type: 'object', additionalProperties: true }
          },
          required: ['command_id'],
          additionalProperties: false
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'add_command',
        description:
          'Create a new reusable command. Provide shell and/or url and/or path. Use {{param}} placeholders in shell/url.',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            params: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string' },
                  required: { type: 'boolean' }
                }
              }
            },
            shell: { type: 'string' },
            url: { type: 'string' },
            path: { type: 'string' },
            cwd: { type: 'string' }
          },
          required: ['id', 'name', 'description'],
          additionalProperties: false
        }
      }
    }
  ];
}

async function chatCompletion({ baseUrl, apiKey, model, messages, tools }) {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.4
    })
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`AI API returned non-JSON (${res.status}): ${text.slice(0, 240)}`);
  }
  if (!res.ok) {
    throw new Error(data.error?.message || `AI API error ${res.status}`);
  }
  return data;
}

async function runAiTurn({ settings, messages, commands, tools }) {
  if (!settings.apiKey) {
    return {
      ok: false,
      error:
        'No API key configured. Open Settings and add an OpenAI-compatible key (OpenAI, OpenRouter, etc.).',
      demoHint: true
    };
  }

  const toolsSchema = buildTools();
  const working = [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\nAvailable commands:\n${commandCatalog(commands)}`
    },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      ...(m.name ? { name: m.name } : {}),
      ...(m.tool_calls ? { tool_calls: m.tool_calls } : {})
    }))
  ];

  const trace = [];
  let guard = 0;

  while (guard < 6) {
    guard += 1;
    const data = await chatCompletion({
      baseUrl: settings.baseUrl || 'https://api.openai.com/v1',
      apiKey: settings.apiKey,
      model: settings.model || 'gpt-4o',
      messages: working,
      tools: toolsSchema
    });

    const choice = data.choices?.[0]?.message;
    if (!choice) throw new Error('Empty AI response');

    if (choice.tool_calls?.length) {
      working.push({
        role: 'assistant',
        content: choice.content || '',
        tool_calls: choice.tool_calls
      });

      for (const call of choice.tool_calls) {
        const name = call.function?.name;
        let args = {};
        try {
          args = JSON.parse(call.function?.arguments || '{}');
        } catch {
          args = {};
        }
        const fn = tools[name];
        let result;
        if (!fn) {
          result = { ok: false, error: `Unknown tool ${name}` };
        } else {
          result = await fn(args);
        }
        trace.push({ tool: name, args, result });
        working.push({
          role: 'tool',
          tool_call_id: call.id,
          name,
          content: JSON.stringify(result)
        });
      }
      continue;
    }

    return {
      ok: true,
      message: {
        role: 'assistant',
        content: choice.content || '(no response)'
      },
      trace,
      commands
    };
  }

  return {
    ok: true,
    message: {
      role: 'assistant',
      content: 'I hit the tool-call limit for this turn. Try a narrower request.'
    },
    trace,
    commands
  };
}

module.exports = { runAiTurn, commandCatalog };
