/**
 * Local Wi‑Fi relay so an iPhone can use this computer's Cursor connection.
 * No Vercel / cloud proxy required — phone and PC on the same network.
 */
const http = require('http');
const os = require('os');

const DEFAULT_PORT = 3847;

function lanIPv4s() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const list of Object.values(nets || {})) {
    for (const net of list || []) {
      const fam = net.family;
      if ((fam === 'IPv4' || fam === 4) && !net.internal) out.push(net.address);
    }
  }
  return out;
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-cursor-path, x-cursor-method'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function createRelayServer({ cursorBridge, getSettings, getAllCommands, port = DEFAULT_PORT }) {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-cursor-path, x-cursor-method',
          'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
      }

      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathName = url.pathname.replace(/\/+$/, '') || '/';

      if (req.method === 'GET' && (pathName === '/' || pathName === '/health')) {
        const settings = getSettings();
        sendJson(res, 200, {
          ok: true,
          service: 'cwayclient-relay',
          port,
          ips: lanIPv4s(),
          urls: lanIPv4s().map((ip) => `http://${ip}:${port}`),
          model: settings.model || 'auto',
          hasCursorKey: Boolean(settings.cursorApiKey || process.env.CURSOR_API_KEY),
          commands: (getAllCommands() || []).length
        });
        return;
      }

      if (req.method === 'GET' && (pathName === '/models' || pathName === '/v1/models')) {
        const listed = await cursorBridge.listModels({ force: true });
        if (!listed.ok) {
          sendJson(res, 400, listed);
          return;
        }
        sendJson(res, 200, { ok: true, models: listed.models });
        return;
      }

      if (req.method === 'POST' && (pathName === '/chat' || pathName === '/v1/chat')) {
        const body = await readBody(req);
        const messages = body.messages || [];
        const result = await cursorBridge.chat({
          messages,
          onStatus: () => {}
        });
        sendJson(res, result.ok ? 200 : 400, result);
        return;
      }

      sendJson(res, 404, { error: 'Not found', routes: ['/health', '/models', '/chat'] });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err.message || String(err) });
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '0.0.0.0', () => {
      const ips = lanIPv4s();
      resolve({
        server,
        port,
        ips,
        urls: ips.map((ip) => `http://${ip}:${port}`),
        close: () =>
          new Promise((resClose) => {
            server.close(() => resClose());
          })
      });
    });
  });
}

module.exports = { createRelayServer, lanIPv4s, DEFAULT_PORT };
