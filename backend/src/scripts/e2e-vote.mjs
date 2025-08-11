// E2E dev test: real vote flow (non-dry-run)
// - Detect backend base URL
// - Fetch contests -> pick first contest and one contestant
// - POST /api/vote and verify total_votes increments

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

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

async function httpJson(base, method, path, body, headers={}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  return await httpRequest(base + path, { method, headers: h, body });
}

(async () => {
  const out = {};
  try {
    const BASE = await detectBase();
    out.base = BASE;

    const contests = await httpJson(BASE, 'GET', '/api/public/contests');
    if (!contests.ok || !Array.isArray(contests.json?.data) || contests.json.data.length === 0) {
      throw new Error('no_contests');
    }
    const contest = contests.json.data[0];

    const contestants = await httpJson(BASE, 'GET', '/api/public/contestants');
    if (!contestants.ok || !Array.isArray(contestants.json?.data)) throw new Error('no_contestants');
    const list = contestants.json.data.filter(c => String(c.contest_id) === String(contest.id));
    if (list.length === 0) throw new Error('no_contestants_in_contest');
    const target = list[0];

    // Fetch current ranking snapshot for this contestant
    const rankings = await httpJson(BASE, 'GET', '/api/public/rankings');
    const before = (rankings.json?.data || []).find(r => String(r.id) === String(target.id));
    const beforeVotes = before?.total_votes ?? 0;

    // Real vote (non-dry-run)
    const voteRes = await httpJson(BASE, 'POST', '/api/vote', { contestId: contest.id, contestantId: target.id });
    if (!voteRes.ok || !voteRes.json?.success) throw new Error('vote_failed');

    // Fetch rankings again to see increment (allow a short delay for processing)
    await new Promise(r => setTimeout(r, 300));
    const rankings2 = await httpJson(BASE, 'GET', '/api/public/rankings');
    const after = (rankings2.json?.data || []).find(r => String(r.id) === String(target.id));
    const afterVotes = after?.total_votes ?? beforeVotes;

    out.vote = { contestantId: target.id, beforeVotes, afterVotes };
    const increased = afterVotes >= beforeVotes + 1;

    console.log(JSON.stringify({ ok: increased, out }, null, 2));
    process.exit(increased ? 0 : 1);
  } catch (e) {
    console.log(JSON.stringify({ ok: false, error: String(e?.message || e), out }, null, 2));
    process.exit(1);
  }
})();
