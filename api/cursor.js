/**
 * Serverless proxy so the iPhone web app can call Cursor's API
 * (browsers block api.cursor.com with CORS).
 *
 * Deploy this repo to Vercel — then set Settings → Cursor proxy URL to:
 *   https://YOUR-PROJECT.vercel.app/api/cursor
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-cursor-path, x-cursor-method');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const auth = req.headers.authorization || '';
  if (!auth) {
    res.status(401).json({ error: 'Missing Authorization header (Cursor API key)' });
    return;
  }

  const path = String(req.headers['x-cursor-path'] || req.query.path || '/v1/models');
  if (!path.startsWith('/v1/')) {
    res.status(400).json({ error: 'path must start with /v1/' });
    return;
  }

  const method = String(req.headers['x-cursor-method'] || req.method || 'GET').toUpperCase();
  const url = `https://api.cursor.com${path}`;

  try {
    const upstream = await fetch(url, {
      method,
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(req.body || {})
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: err.message || 'Proxy failed' });
  }
};
