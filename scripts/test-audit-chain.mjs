// E2E: Verify audit chain: request -> DB persisted -> realtime socket -> admin listing
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { io as ioClient } from 'socket.io-client';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4000';

function httpRequest(url, { method='GET', headers={}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const opts = { method, hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname + (u.search || ''), headers: { ...headers }, timeout: 4000 };
    const req = lib.request(opts, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        let json; try { json = JSON.parse(data); } catch { json = { raw: data }; }
        resolve({ status: res.statusCode || 0, ok: (res.statusCode||0) >= 200 && (res.statusCode||0) < 300, json, text: data });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const out = { base: BASE };
  try {
    // 1) Health
    out.health = await httpRequest(BASE + '/api/health');
    if (!out.health.ok) throw new Error('health_not_ok');

    // 2) Connect socket and wait for an audit_log of view_contests
    const sock = ioClient(BASE, { transports: ['websocket'], timeout: 4000 });
    const gotEvent = new Promise((resolve, reject) => {
      const timer = setTimeout(()=> reject(new Error('socket_timeout')), 6000);
      sock.on('connect', () => {
        // console.log('socket connected');
      });
      sock.on('audit_log', (row) => {
        if (row?.action === 'view_contests') {
          clearTimeout(timer);
          resolve(row);
          sock.close();
        }
      });
      sock.on('connect_error', (e) => { /* ignore allow retry */ });
    });

    // 3) Trigger a public request that gets audited and broadcast
    const rContests = await httpRequest(BASE + '/api/public/contests');
    out.contests = rContests;
    if (!rContests.ok) throw new Error('contests_not_ok');

    const eventRow = await gotEvent;
    out.socketEvent = eventRow;

    // 4) Verify admin listing returns recent logs
    const list = await httpRequest(BASE + '/api/admin/audit-list?limit=10');
    out.adminList = list;
    const actions = Array.isArray(list?.json?.data) ? list.json.data.map(x=>x.action) : [];
    if (!actions.includes('view_contests')) throw new Error('admin_list_missing_view_contests');

  console.info(JSON.stringify({ ok: true, out }, null, 2));
  } catch (e) {
  console.info(JSON.stringify({ ok: false, error: String(e?.message || e), out }, null, 2));
    process.exit(1);
  }
}

main();
