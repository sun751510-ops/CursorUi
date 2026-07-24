/**
 * CwayClient — Cloudflare Worker proxy for Cursor API
 * Lets the iPhone Safari app call api.cursor.com (CORS).
 *
 * Deploy (phone-friendly):
 * 1. https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Paste this file → Deploy
 * 3. Copy the *.workers.dev URL into CwayClient Settings → Proxy URL
 * 4. Paste your Cursor API key in Settings
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-cursor-path, x-cursor-method',
  'Access-Control-Max-Age': '86400'
};

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const pathName = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'GET' && (pathName === '/' || pathName === '/health')) {
      return json(200, {
        ok: true,
        service: 'cwayclient-cf-proxy',
        routes: ['/health', 'proxy via x-cursor-path → api.cursor.com']
      });
    }

    const auth = request.headers.get('Authorization') || '';
    if (!auth) {
      return json(401, { error: 'Missing Authorization header (Cursor API key)' });
    }

    const path =
      request.headers.get('x-cursor-path') ||
      url.searchParams.get('path') ||
      '/v1/models';
    if (!String(path).startsWith('/v1/')) {
      return json(400, { error: 'path must start with /v1/' });
    }

    const method = (
      request.headers.get('x-cursor-method') ||
      request.method ||
      'GET'
    ).toUpperCase();

    const target = `https://api.cursor.com${path}`;
    let body;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text();
    }

    try {
      const upstream = await fetch(target, {
        method,
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: body || undefined
      });
      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: {
          ...CORS,
          'Content-Type': upstream.headers.get('content-type') || 'application/json'
        }
      });
    } catch (err) {
      return json(502, { error: err.message || 'Proxy failed' });
    }
  }
};
