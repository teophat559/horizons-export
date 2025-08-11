// E2E smoke test: health → version → csrf → contests → rankings → session(before)
// → login → session(after) → vote(dryRun) → logout
// Env: BASE_URL (default http://127.0.0.1:4000), USERNAME, PASSWORD, DRY_RUN=true

const base = process.env.BASE_URL || 'http://127.0.0.1:4000';
const USERNAME = process.env.USERNAME || 'admin';
const PASSWORD = process.env.PASSWORD || 'admin123';
const DRY_RUN = String(process.env.DRY_RUN ?? 'true').toLowerCase() === 'true';

function assert(cond, msg) { if (!cond) throw new Error('ASSERT: ' + msg); }

function extractSid(setCookie) {
  if (!setCookie) return null;
  const m = /(?:^|;\s*)sid=([^;]+)/i.exec(setCookie);
  return m ? m[1] : null;
}

async function get(path, cookies) {
  const res = await fetch(base + path, { headers: { 'accept': 'application/json', ...(cookies ? { 'cookie': cookies } : {}) } });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch {}
  return { res, json, text };
}

async function post(path, body, cookies) {
  const res = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'accept': 'application/json', ...(cookies ? { 'cookie': cookies } : {}) },
    body: JSON.stringify(body || {})
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch {}
  return { res, json, text };
}

(async () => {
  const out = {};

  out.health = await get('/api/health');
  assert(out.health.res.status === 200 && out.health.text.includes('ok'), 'health ok');

  out.version = await get('/api/version');
  assert(out.version.res.status === 200, 'version ok');

  out.csrf = await get('/api/csrf');
  assert(out.csrf.res.status === 200 && out.csrf.json?.success === true, 'csrf ok');

  out.contests = await get('/api/public/contests');
  assert(out.contests.res.status === 200 && Array.isArray(out.contests.json?.data), 'contests array');

  out.rankings = await get('/api/public/rankings');
  assert(out.rankings.res.status === 200 && Array.isArray(out.rankings.json?.data), 'rankings array');

  out.sessionBefore = await get('/api/session');
  assert(out.sessionBefore.res.status === 200 && typeof out.sessionBefore.json?.data?.isAuthenticated === 'boolean', 'session before ok');

  const login = await post('/api/login', { username: USERNAME, password: PASSWORD });
  const setCookie = login.res.headers.get('set-cookie');
  const sid = extractSid(setCookie);
  assert(login.res.status === 200 && login.json?.success === true && sid, 'login ok & sid set');
  const cookieHeader = `sid=${sid}`;

  out.sessionAfter = await get('/api/session', cookieHeader);
  assert(out.sessionAfter.res.status === 200 && out.sessionAfter.json?.data?.isAuthenticated === true, 'session after ok');

  // Choose a contestant from rankings (fallback to 1:1)
  const first = Array.isArray(out.rankings.json?.data) && out.rankings.json.data[0];
  const contestId = first?.contest_id || 1;
  const contestantId = first?.id || 1;

  const vote = await post('/api/vote', { contestId, contestantId, dryRun: DRY_RUN }, cookieHeader);
  assert(vote.res.status === 200 && vote.json?.success === true, 'vote ok');
  out.vote = vote.json;

  const logout = await post('/api/logout', {}, cookieHeader);
  assert(logout.res.status === 200 && logout.json?.success === true, 'logout ok');

  console.log('E2E smoke PASS');
  console.log(JSON.stringify({ base, DRY_RUN, contestId, contestantId, out: {
    health: out.health.text,
    version: out.version.json,
    csrf: out.csrf.json,
    contests: Array.isArray(out.contests.json?.data) ? out.contests.json.data.length : null,
    rankings: Array.isArray(out.rankings.json?.data) ? out.rankings.json.data.length : null,
    sessionBefore: out.sessionBefore.json,
    sessionAfter: out.sessionAfter.json,
    vote: out.vote,
  } }, null, 2));
})().catch((e) => { console.error('E2E smoke FAIL:', e?.stack || e); process.exit(1); });
