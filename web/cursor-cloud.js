/**
 * Cursor Cloud Agents helper for the phone web app.
 * Talks to api.cursor.com through the Cloudflare Worker proxy.
 * Prefer streaming run endpoints so replies appear as Cursor generates them.
 */
(function () {
  function authHeader(apiKey) {
    return `Bearer ${String(apiKey || '').trim()}`;
  }

  async function cursorFetch({ apiKey, proxyUrl, path, method = 'GET', body }) {
    const key = String(apiKey || '').trim();
    if (!key) throw new Error('Add your Cursor API key in Settings');

    const proxy = String(proxyUrl || '').trim().replace(/\/$/, '');
    if (!proxy) throw new Error('Set Proxy URL to your Cloudflare Worker');

    // Always POST to the Worker — custom headers are unreliable on GET through CDNs
    const res = await fetch(proxy, {
      method: 'POST',
      headers: {
        Authorization: authHeader(key),
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-cursor-path': path,
        'x-cursor-method': method
      },
      body: JSON.stringify(body || {})
    });

    const raw = await res.text();
    if (raw.trimStart().startsWith('<!')) {
      throw new Error(
        'Cloudflare blocked the request (challenge page). Re-open the Worker URL in Safari, claim the Worker, then try again.'
      );
    }

    let data = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(`Bad proxy response (${res.status}): ${raw.slice(0, 160)}`);
    }

    if (!res.ok) {
      const msg =
        data.error?.message ||
        data.message ||
        (typeof data.error === 'string' ? data.error : null) ||
        `Cursor API ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  async function cursorStream({ apiKey, proxyUrl, path, onEvent }) {
    const key = String(apiKey || '').trim();
    const proxy = String(proxyUrl || '').trim().replace(/\/$/, '');
    if (!key) throw new Error('Add your Cursor API key in Settings');
    if (!proxy) throw new Error('Set Proxy URL to your Cloudflare Worker');

    const res = await fetch(proxy, {
      method: 'POST',
      headers: {
        Authorization: authHeader(key),
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'x-cursor-path': path,
        'x-cursor-method': 'GET'
      },
      body: '{}'
    });

    if (!res.ok || !res.body) {
      const raw = await res.text().catch(() => '');
      if (raw.trimStart().startsWith('<!') || /Just a moment/i.test(raw)) {
        throw new Error(
          'Cloudflare blocked the request (challenge page). Re-open the Worker URL in Safari, claim the Worker, then try again.'
        );
      }
      throw new Error(raw.slice(0, 200) || `Cursor stream failed (${res.status})`);
    }
    const peekType = res.headers.get('content-type') || '';
    if (!peekType.includes('text/event-stream') && !peekType.includes('json')) {
      // Some challenge responses still return 200 HTML
      const raw = await res.clone().text().catch(() => '');
      if (raw.trimStart().startsWith('<!') || /Just a moment/i.test(raw)) {
        throw new Error(
          'Cloudflare blocked the request (challenge page). Re-open the Worker URL in Safari, claim the Worker, then try again.'
        );
      }
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalText = '';
    let status = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';
      for (const part of parts) {
        const lines = part.split('\n');
        let event = 'message';
        let data = '';
        for (const line of lines) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (!data) continue;
        let payload = {};
        try {
          payload = JSON.parse(data);
        } catch {
          continue;
        }
        if (event === 'assistant' && payload.text) {
          finalText += String(payload.text);
          onEvent?.({ type: 'assistant', text: finalText, delta: String(payload.text) });
        } else if (event === 'status') {
          status = payload.status || status;
          onEvent?.({ type: 'status', status });
        } else if (event === 'result') {
          status = payload.status || status;
          if (payload.text) finalText = String(payload.text);
          onEvent?.({ type: 'result', text: finalText, status });
        } else if (event === 'error') {
          throw new Error(payload.message || payload.code || 'Cursor stream error');
        } else if (event === 'done') {
          onEvent?.({ type: 'done', text: finalText });
        }
      }
    }
    return { text: finalText.trim(), status };
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function extractRunIds(created) {
    const id = created.agent?.id || created.id || created.agentId;
    const runId =
      created.run?.id ||
      created.latestRunId ||
      created.agent?.latestRunId ||
      created.runId;
    return { id, runId };
  }

  function extractResult(run) {
    return (
      run.result ||
      run.run?.result ||
      run.text ||
      run.run?.text ||
      run.output ||
      run.message ||
      ''
    );
  }

  function modelSelection(model) {
    if (!model || model === 'auto' || model === 'instant' || model === 'default') return undefined;
    const id = String(model);
    // Map friendly aliases onto real Cloud Agents model ids + params
    if (id === 'grok-4.5-fast') {
      return { id: 'grok-4.5', params: [{ id: 'fast', value: 'true' }, { id: 'effort', value: 'low' }] };
    }
    if (id === 'grok-4.5') {
      return { id: 'grok-4.5', params: [{ id: 'effort', value: 'high' }, { id: 'fast', value: 'true' }] };
    }
    return { id };
  }

  async function fetchRunResult({ apiKey, proxyUrl, id, runId }) {
    const run = await cursorFetch({
      apiKey,
      proxyUrl,
      path: `/v1/agents/${id}/runs/${runId}`,
      method: 'GET'
    });
    return {
      status: run.status || run.run?.status || '',
      text: String(extractResult(run) || '').trim(),
      run
    };
  }

  async function chatOnce({ apiKey, proxyUrl, model, userText, agentId, agentModel, onStatus, onToken }) {
    const system =
      'You are CwayClient, the central AI assistant of a personal operating system, similar to JARVIS. ' +
      'Coordinate capabilities, understand intent, never invent functionality, never fabricate success. ' +
      'Live modules: Conversation, Voice, Memory, Tasks, Notes. ' +
      'Calendar, Search, Files, Automation, Device Control, Music, Email, Vision are not connected yet — say so and offer alternatives. ' +
      'Personality: professional, efficient, friendly, confident. ALWAYS answer in English unless the user explicitly asks for another language. Answer in short spoken-friendly plain sentences. No repo/code edits.';

    const promptText = `${system}\n\nUser said: ${userText}`;
    let selection = modelSelection(model);

    // Recreate the agent when the user switches models so the new selection sticks.
    let id = agentId && (!agentModel || !selection || agentModel === selection.id) ? agentId : '';
    let runId;
    onStatus?.('Starting Cursor agent…');

    if (id) {
      try {
        const run = await cursorFetch({
          apiKey,
          proxyUrl,
          path: `/v1/agents/${id}/runs`,
          method: 'POST',
          body: { prompt: { text: promptText } }
        });
        runId = run.id || run.run?.id;
        id = run.agentId || run.run?.agentId || id;
      } catch (err) {
        if (!/404|not found|expired|inactive|agent/i.test(String(err.message || err))) throw err;
        id = '';
      }
    }

    if (!id || !runId) {
      const body = {
        name: 'CwayClient Phone',
        prompt: { text: promptText }
      };
      if (selection) body.model = selection;
      let created;
      try {
        created = await cursorFetch({
          apiKey,
          proxyUrl,
          path: '/v1/agents',
          method: 'POST',
          body
        });
      } catch (err) {
        // Invalid / unavailable model (e.g. Fable not enabled) → retry with account default
        if (selection && /model|not valid|not available|forbidden|400|422/i.test(String(err.message || err))) {
          onStatus?.('Model unavailable — using Cursor default…');
          selection = undefined;
          created = await cursorFetch({
            apiKey,
            proxyUrl,
            path: '/v1/agents',
            method: 'POST',
            body: { name: 'CwayClient Phone', prompt: { text: promptText } }
          });
        } else {
          throw err;
        }
      }
      ({ id, runId } = extractRunIds(created));

      // Create often returns FINISHED with no result body — fetch the run immediately.
      const createStatus = created?.run?.status || created?.status;
      if (createStatus === 'FINISHED' && id && runId) {
        onStatus?.('Cursor finishing…');
        const done = await fetchRunResult({ apiKey, proxyUrl, id, runId });
        if (done.text) {
          onToken?.('', done.text);
          return {
            ok: true,
            text: done.text,
            agentId: id,
            runId,
            agentModel: selection?.id || agentModel || ''
          };
        }
      }
    }

    if (!id || !runId) throw new Error('Cursor did not return an agent/run id — check API key plan access');

    // Prefer the SSE stream so the first tokens appear without waiting for FINISHED.
    try {
      onStatus?.('Cursor streaming…');
      const streamed = await cursorStream({
        apiKey,
        proxyUrl,
        path: `/v1/agents/${id}/runs/${runId}/stream`,
        onEvent: (ev) => {
          if (ev.type === 'assistant' && onToken) onToken(ev.delta || '', ev.text || '');
          if (ev.type === 'status') onStatus?.(`Cursor ${String(ev.status || '').toLowerCase()}…`);
        }
      });
      if (streamed.text) {
        return {
          ok: true,
          text: streamed.text,
          agentId: id,
          runId,
          agentModel: selection?.id || agentModel || ''
        };
      }
    } catch (err) {
      if (/Cloudflare blocked|challenge/i.test(String(err.message || err))) throw err;
      /* fall through to poll */
    }

    let resultText = '';
    for (let i = 0; i < 100; i += 1) {
      await sleep(i < 15 ? 250 : 700);
      if (i === 0 || i % 4 === 0) onStatus?.(`Cursor working… (${i + 1})`);
      const done = await fetchRunResult({ apiKey, proxyUrl, id, runId });
      if (done.status === 'FINISHED') {
        resultText = done.text || 'Done.';
        break;
      }
      if (done.status === 'ERROR' || done.status === 'CANCELLED' || done.status === 'EXPIRED') {
        throw new Error(done.run?.error?.message || done.run?.message || `Cursor run ${done.status}`);
      }
    }
    if (!resultText) throw new Error('Cursor timed out — tap Test, then try a shorter message');

    return {
      ok: true,
      text: resultText,
      agentId: id,
      runId,
      agentModel: selection?.id || agentModel || ''
    };
  }

  /** Curated Cloud Agents favorites — merged with live /v1/models. */
  const CURATED = [
    { id: 'claude-fable-5-high', displayName: 'Fable 5', description: 'Claude Fable 5 — top Cursor agent model' },
    {
      id: 'claude-fable-5-thinking-high',
      displayName: 'Fable 5 Thinking',
      description: 'Claude Fable 5 with deep reasoning'
    },
    { id: 'grok-4.5', displayName: 'Grok 4.5', description: 'Cursor × SpaceXAI Grok 4.5' },
    { id: 'grok-4.5-fast', displayName: 'Grok 4.5 Fast', description: 'Faster Grok 4.5 variant' },
    { id: 'composer-2.5', displayName: 'Composer 2.5', description: 'Cursor Composer' },
    {
      id: 'claude-4.6-sonnet-medium-thinking',
      displayName: 'Claude 4.6 Sonnet',
      description: 'Claude 4.6 Sonnet (thinking)'
    }
  ];

  function mergeModels(live) {
    const byId = new Map();
    CURATED.forEach((m) => byId.set(m.id, m));
    (live || []).forEach((m) => {
      if (!m?.id) return;
      const prev = byId.get(m.id);
      byId.set(m.id, {
        id: m.id,
        displayName: m.displayName || prev?.displayName || m.id,
        description: m.description || prev?.description || ''
      });
    });
    // Prefer curated order first, then remaining live models alphabetically.
    const curatedIds = new Set(CURATED.map((m) => m.id));
    const head = CURATED.map((m) => byId.get(m.id)).filter(Boolean);
    const rest = [...byId.values()]
      .filter((m) => !curatedIds.has(m.id))
      .sort((a, b) => String(a.displayName).localeCompare(String(b.displayName)));
    return [...head, ...rest];
  }

  window.CwayCursorCloud = {
    curatedModels: CURATED,

    async listModels({ apiKey, proxyUrl }) {
      try {
        const data = await cursorFetch({ apiKey, proxyUrl, path: '/v1/models', method: 'GET' });
        const items = data.models || data.items || data || [];
        const live = (Array.isArray(items) ? items : []).map((m) => ({
          id: m.id || m.modelId || m.name,
          displayName: m.displayName || m.name || m.id,
          description: m.description || ''
        }));
        return mergeModels(live);
      } catch {
        return mergeModels([]);
      }
    },

    async chat(args) {
      return chatOnce(args);
    },

    async test({ apiKey, proxyUrl }) {
      const me = await cursorFetch({ apiKey, proxyUrl, path: '/v1/me', method: 'GET' }).catch(() => null);
      const models = await this.listModels({ apiKey, proxyUrl });
      return { ok: true, me, models };
    }
  };
})();
