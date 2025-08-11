// Automated test: backend health + social-login pending -> approve -> status
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const ADMIN_KEY = process.env.ADMIN_KEY || 'dev-admin-key';

function httpRequest(url, { method='GET', headers={}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const opts = {
      method,
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + (u.search || ''),
      headers: { ...headers },
      timeout: 3000,
    };
    const req = lib.request(opts, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = { raw: data }; }
        resolve({ status: res.statusCode || 0, ok: (res.statusCode||0) >= 200 && (res.statusCode||0) < 300, json, text: data });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function detectBase() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const candidates = [];
  for (let p = 4000; p <= 4010; p++) candidates.push(`http://127.0.0.1:${p}`);
  for (const base of candidates) {
    try {
  const r = await httpRequest(base + '/api/health');
  if (!r.ok) continue;
  // Verify a real route exists to avoid matching unrelated services
  const c = await httpRequest(base + '/api/public/contests');
  if (c.status === 200) return base;
    } catch {}
  }
  throw new Error('Backend not reachable on 4000-4010');
}

async function httpJson(base, method, path, body, headers={}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  return await httpRequest(base + path, { method, headers: h, body });
}

(async () => {
  const out = {};
  try {
    const BASE = await detectBase();
    out.base = BASE;
    // 1) Health
  const h = await httpJson(BASE, 'GET', '/api/health');
    out.health = h;

    // 2) Submit social-login (credentials) -> pending with loginId
    const payload = { platform: 'google', username: 'test@example.com', password: 'secret123' };
  const post = await httpJson(BASE, 'POST', '/api/social-login', payload);
    out.submit = post;
    const loginId = post?.json?.loginId;
    if (!loginId) throw new Error('No loginId returned');

    // 3) List pending
  const pending = await httpJson(BASE, 'GET', '/api/social-login/pending?status=pending');
    out.pending = pending;

    // 4) Approve current loginId
  const approve = await httpJson(BASE, 'POST', '/api/social-login/approve', { id: loginId }, { 'x-admin-key': ADMIN_KEY });
    out.approve = approve;

    // 5) Check status
  const status = await httpJson(BASE, 'GET', `/api/social-login/status?id=${encodeURIComponent(loginId)}`);
    out.status = status;

  console.info(JSON.stringify({ ok: true, out }, null, 2));
  } catch (e) {
  console.info(JSON.stringify({ ok: false, error: String(e?.message || e), out }, null, 2));
    process.exit(1);
  }
})();
