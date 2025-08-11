import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Load .env variables if present (for MORELOGIN_* etc.)
try {
  const dotenvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
  if (fs.existsSync(dotenvPath)) {
    const content = fs.readFileSync(dotenvPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  console.info('[functions] Loaded .env for functions');
  }
} catch {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const functionsDir = path.join(root, 'netlify', 'functions');
const port = process.env.FN_PORT ? Number(process.env.FN_PORT) : 8788;

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function toEvent(req, body) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  return {
    httpMethod: req.method,
    path: url.pathname,
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    headers: req.headers,
    body,
  };
}

async function loadHandler(funcName) {
  const filePath = path.join(functionsDir, `${funcName}.js`);
  const fileUrl = pathToFileURL(filePath).href;
  const mod = await import(fileUrl);
  if (!mod || typeof mod.handler !== 'function') {
    throw new Error(`Function ${funcName} does not export handler()`);
  }
  return mod.handler;
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);
    const pathname = u.pathname || '';
    if (!pathname.startsWith('/.netlify/functions/')) {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
      return;
    }
    const rest = pathname.slice('/.netlify/functions/'.length);
    const funcName = (rest.split('/')[0] || '').trim();
    if (!/^[A-Za-z0-9_-]+$/.test(funcName)) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: `Invalid function name: ${funcName}` }));
      return;
    }
    const body = await parseBody(req);
    const event = toEvent(req, body);

    // Force origin headers to your Vite dev origin when known
    if (!event.headers['x-forwarded-proto']) event.headers['x-forwarded-proto'] = 'http';

  const handler = await loadHandler(funcName);
    const result = await handler(event);

    const headers = result.headers || { 'content-type': 'application/json' };
    res.writeHead(result.statusCode || 200, headers);
    res.end(result.body || '');
  } catch (e) {
    res.writeHead(500, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: String(e?.message || e) }));
  }
});

server.listen(port, () => {
  console.info(`Functions server listening at http://127.0.0.1:${port}/.netlify/functions/<name>`);
});
