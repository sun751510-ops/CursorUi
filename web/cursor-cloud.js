/**
 * Cursor Cloud Agents helper for the phone web app.
 * Talks to api.cursor.com through an optional CORS proxy.
 */
(function () {
  function authHeader(apiKey) {
    // Cursor accepts Basic (key as username) or Bearer
    return `Basic ${btoa(`${apiKey}:`)}`;
  }

  async function cursorFetch({ apiKey, proxyUrl, path, method = 'GET', body }) {
    const key = String(apiKey || '').trim();
    if (!key) throw new Error('Add your Cursor API key in Settings');

    const proxy = String(proxyUrl || '').trim().replace(/\/$/, '');
    if (proxy) {
      const res = await fetch(proxy, {
        method: method === 'GET' ? 'GET' : 'POST',
        headers: {
          Authorization: authHeader(key),
          'Content-Type': 'application/json',
          'x-cursor-path': path,
          'x-cursor-method': method
        },
        body: method === 'GET' ? undefined : JSON.stringify(body || {})
      });
      const data = await res.json().catch(async () => ({ raw: await res.text() }));
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || data.message || `Cursor proxy ${res.status}`);
      }
      return data;
    }

    // Direct (works if Cursor allows your origin; often blocked in Safari)
    const res = await fetch(`https://api.cursor.com${path}`, {
      method,
      headers: {
        Authorization: authHeader(key),
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: method === 'GET' ? undefined : JSON.stringify(body || {})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error?.message || `Cursor API ${res.status}`);
    }
    return data;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
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

    async chat({ apiKey, proxyUrl, model, userText, agentId }) {
      const system =
        'You are CwayClient, a concise helpful voice assistant on the user\'s iPhone. ' +
        'Answer clearly in short spoken-friendly sentences. No repo/code edits — just help.';

      const promptText = `${system}\n\nUser said: ${userText}`;
      const modelId = !model || model === 'auto' ? undefined : model;

      let id = agentId;
      let runId;

      if (id) {
        const run = await cursorFetch({
          apiKey,
          proxyUrl,
          path: `/v1/agents/${id}/runs`,
          method: 'POST',
          body: { prompt: { text: promptText } }
        });
        runId = run.id || run.run?.id;
        id = run.agentId || run.run?.agentId || id;
      } else {
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
        id = created.agent?.id || created.id;
        runId = created.run?.id || created.latestRunId;
      }

      if (!id || !runId) throw new Error('Cursor did not return an agent/run id');

      // Poll until finished (phone-friendly timeout)
      let resultText = '';
      for (let i = 0; i < 60; i += 1) {
        await sleep(i < 3 ? 800 : 1500);
        const run = await cursorFetch({
          apiKey,
          proxyUrl,
          path: `/v1/agents/${id}/runs/${runId}`,
          method: 'GET'
        });
        const status = run.status || run.run?.status;
        if (status === 'FINISHED') {
          resultText = run.result || run.run?.result || run.text || 'Done.';
          break;
        }
        if (status === 'ERROR' || status === 'CANCELLED' || status === 'EXPIRED') {
          throw new Error(run.error?.message || `Cursor run ${status}`);
        }
      }
      if (!resultText) throw new Error('Cursor timed out — try again');

      return { ok: true, text: resultText, agentId: id, runId };
    }
  };
})();
