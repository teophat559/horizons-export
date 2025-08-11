// Realtime admin audit test: connects to Socket.IO, triggers a user action,
// and verifies an 'audit_log' event arrives within a timeout.
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { io as ioClient } from 'socket.io-client';

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
      timeout: 5000,
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
      const c = await httpRequest(base + '/api/public/contests');
      if (c.status === 200) return base;
    } catch {}
  }
  throw new Error('Backend not reachable on 4000-4010');
}

async function main() {
  const out = { steps: [] };
  try {
    const BASE = await detectBase();
    out.base = BASE;
    out.steps.push({ step: 'health', ...(await httpRequest(BASE + '/api/health')) });

  const origin = (() => { try { return new URL(BASE).origin; } catch { return BASE; } })();
  console.info('[realtime-test] connecting socket to', origin);
  const sock = ioClient(origin, { transports: ['websocket'] });
  sock.on('connect', () => console.info('[realtime-test] socket connected'));
  sock.on('connect_error', (err) => console.info('[realtime-test] socket connect_error', String(err?.message || err)));

    const gotEvent = new Promise((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('timeout_waiting_event')), 7000);
      const handler = (row) => {
        // Accept any audit_log; filter later by action/path if provided
        clearTimeout(to);
        try { sock.off('audit_log', handler); sock.close(); } catch {}
        resolve(row);
      };
      sock.on('audit_log', handler);
    });

    // Trigger a user action that should generate an audit log immediately
    const username = `u_${Date.now()}@example.com`;
    const body = { platform: 'google', username, password: 'p' };
  console.info('[realtime-test] triggering user action /api/social-login');
  const submit = await httpRequest(BASE + '/api/social-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body
    });
    out.steps.push({ step: 'submit', ...submit });

  console.info('[realtime-test] waiting for audit_log event...');
  const event = await gotEvent;
    out.event = event;

    console.info(JSON.stringify({ ok: true, out }, null, 2));
  } catch (e) {
    console.info(JSON.stringify({ ok: false, error: String(e?.message || e), out }, null, 2));
    process.exit(1);
  }
}

main();
