/**
 * Cursor Cloud Agents helper for the phone web app.
 * Talks to api.cursor.com through the Cloudflare Worker proxy.
 */
(function () {
  function authHeader(apiKey) {
    // Cloud Agents API accepts Bearer or Basic
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

  async function chatOnce({ apiKey, proxyUrl, model, userText, agentId, onStatus }) {
    const system =
      'You are CwayClient, the central AI assistant of a personal operating system, similar to JARVIS. ' +
      'Coordinate capabilities, understand intent, never invent functionality, never fabricate success. ' +
      'Live modules: Conversation and Voice (replies are spoken aloud). Session-only Memory. ' +
      'Calendar, Tasks, Notes, Search, Files, Automation, Device Control, Music, Email, Vision are not connected yet — say so and offer alternatives. ' +
      'Personality: professional, efficient, friendly, confident. Answer in short spoken-friendly plain sentences. No repo/code edits.';

    const promptText = `${system}\n\nUser said: ${userText}`;
    const modelId = !model || model === 'auto' ? undefined : model;

    let id = agentId;
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
        // Stale agent — create a fresh no-repo agent
        if (!/404|not found|expired|inactive|agent/i.test(String(err.message || err))) throw err;
        id = '';
      }
    }

    if (!id || !runId) {
      const body = {
        name: 'CwayClient Phone',
        prompt: { text: promptText }
      };
      if (modelId) body.model = { id: modelId };
      const created = await cursorFetch({
        apiKey,
        proxyUrl,
        path: '/v1/agents',
        method: 'POST',
        body
      });
      ({ id, runId } = extractRunIds(created));
    }

    if (!id || !runId) throw new Error('Cursor did not return an agent/run id — check API key plan access');

    let resultText = '';
    for (let i = 0; i < 120; i += 1) {
      await sleep(i < 10 ? 400 : 900);
      if (i === 0 || i % 4 === 0) onStatus?.(`Cursor working… (${i + 1})`);
      const run = await cursorFetch({
        apiKey,
        proxyUrl,
        path: `/v1/agents/${id}/runs/${runId}`,
        method: 'GET'
      });
      const status = run.status || run.run?.status;
      if (status === 'FINISHED') {
        resultText = String(extractResult(run) || 'Done.');
        break;
      }
      if (status === 'ERROR' || status === 'CANCELLED' || status === 'EXPIRED') {
        throw new Error(run.error?.message || run.message || `Cursor run ${status}`);
      }
    }
    if (!resultText) throw new Error('Cursor timed out — tap Test, then try a shorter message');

    return { ok: true, text: resultText, agentId: id, runId };
  }

  window.CwayCursorCloud = {
    async listModels({ apiKey, proxyUrl }) {
      const data = await cursorFetch({ apiKey, proxyUrl, path: '/v1/models', method: 'GET' });
      const items = data.models || data.items || data || [];
      return (Array.isArray(items) ? items : []).map((m) => ({
        id: m.id || m.modelId || m.name,
        displayName: m.displayName || m.name || m.id,
        description: m.description || ''
      }));
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
