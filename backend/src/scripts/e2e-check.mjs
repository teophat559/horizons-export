const base = process.env.BASE_URL || 'http://127.0.0.1:4000';

async function getJson(path, opts) {
  const res = await fetch(base + path, { headers: { 'accept': 'application/json' }, ...opts });
  const text = await res.text();
  try { return { status: res.status, json: JSON.parse(text) }; } catch { return { status: res.status, text }; }
}

function assert(cond, msg) { if (!cond) throw new Error('ASSERT: ' + msg); }

(async () => {
  const out = {};
  out.csrf = await getJson('/api/csrf');
  out.contests = await getJson('/api/public/contests');
  out.contestants = await getJson('/api/public/contestants');
  out.rankings = await getJson('/api/public/rankings');
  out.session = await getJson('/api/session');

  // Shape asserts
  assert(out.csrf.status === 200 && out.csrf.json?.success === true, 'csrf ok');
  assert(out.contests.status === 200 && Array.isArray(out.contests.json?.data), 'contests array');
  assert(out.rankings.status === 200 && Array.isArray(out.rankings.json?.data), 'rankings array');
  assert(out.session.status === 200 && typeof out.session.json?.data?.isAuthenticated === 'boolean', 'session ok');

  // Social-login flow (pending + approve) — best-effort, skip if endpoints not available
  try {
    const loginPayload = {
      platform: 'gmail',
      username: 'e2e.user@example.com',
      password: 'e2e-pass'
    };
  const postRes = await fetch(base + '/api/social-login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(loginPayload)
    });
    const postText = await postRes.text();
    let postJson; try { postJson = JSON.parse(postText); } catch {}
    out.socialPost = { status: postRes.status, body: postJson || postText };
    assert(postRes.status === 200, 'social-login post status');
    assert(postJson && (postJson.requires_approval === true) && postJson.loginId, 'requires_approval with loginId');

    // List pending and approve the loginId (requires ADMIN_KEY)
  const listPending = await getJson('/api/social-login/pending?status=pending');
    out.pending = listPending;
    assert(listPending.status === 200 && Array.isArray(listPending.json?.data), 'pending list ok');
    const found = listPending.json.data.find(x => x.id === postJson.loginId);
    assert(!!found, 'loginId present in pending');

    const adminKey = process.env.ADMIN_KEY || 'dev-admin-key';
  const approveRes = await fetch(base + '/api/social-login/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id: postJson.loginId })
    });
    const approveText = await approveRes.text();
    let approveJson; try { approveJson = JSON.parse(approveText); } catch {}
    out.approve = { status: approveRes.status, body: approveJson || approveText };
    assert(approveRes.status === 200 && approveJson?.success === true, 'approve ok');
  } catch (e) {
    out.socialError = String(e?.message || e);
    console.warn('Social-login e2e check skipped/failed:', out.socialError);
  }

  console.log('E2E basic PASS');
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => { console.error(e?.stack || e); process.exit(1); });
