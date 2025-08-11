import { Router } from 'express';
import { db } from '../services/db.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const adminRouter = Router();

// Optional admin key guard; if ADMIN_KEY not set, allow (dev)
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_KEY || process.env.ADMIN_TOKEN || '';
  const incoming = req.headers['x-admin-key'] || req.headers['x-admin-token'] || req.query.admin_key || req.body?.admin_key;
  const prod = process.env.NODE_ENV === 'production';
  if (!adminKey && !prod) return next(); // allow in dev if not configured
  if (!incoming || String(incoming) !== String(adminKey)) return res.status(401).json({ success: false, message: 'unauthorized' });
  next();
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// POST /api/admin/verify-key
adminRouter.post('/verify-key', (req, res) => {
  const { key } = req.body || {};
  const adminKey = process.env.ADMIN_KEY || 'dev-admin-key';
  const ok = key && key === adminKey;
  res.json({ success: ok, message: ok ? 'verified' : 'invalid_key' });
});

// GET /api/admin/blocked-ips
adminRouter.get('/blocked-ips', (req, res) => {
  res.json({ success: true, data: [{ id: 1, ip: '127.0.0.1', reason: 'DEV ONLY', created_at: new Date().toISOString() }] });
});

// GET /api/admin/notifications
adminRouter.get('/notifications', (req, res) => {
  const defaultNotifications = [
    { id: 'admin_login', label: 'Admin Login', sound: '/sounds/admin_login.mp3' },
    { id: 'user_login', label: 'User Login', sound: '/sounds/user_login.mp3' },
    { id: 'default', label: 'Mặc định', sound: '/sounds/notification.mp3' },
  ];
  res.json({ success: true, data: defaultNotifications });
});

// GET /api/admin/audit-list
// query: limit, offset, action, ip, user_id
adminRouter.get('/audit-list', async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
  const offset = Math.max(0, Number(req.query.offset || 0));
  const action = req.query.action || undefined;
  const ip = req.query.ip || undefined;
  const user_id = req.query.user_id || undefined;
  const rows = await db.listAuditLogs({ limit, offset, action, ip, user_id });
  res.json({ success: true, data: rows });
});

// --- Admin Links management ---
// POST /api/admin/links { label, adminName }
adminRouter.post('/links', requireAdminKey, async (req, res) => {
  try {
    const { label, adminName } = req.body || {};
    const row = await db.createAdminLink({ label, adminName });
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(500).json({ success: false, message: 'create_failed', error: String(e?.message || e) });
  }
});

// GET /api/admin/links?limit=&offset=
adminRouter.get('/links', requireAdminKey, async (req, res) => {
  try {
    const limit = Math.min(500, Math.max(1, Number(req.query.limit || 200)));
    const offset = Math.max(0, Number(req.query.offset || 0));
  const withCounts = String(req.query.withCounts || 'false').toLowerCase() === 'true';
  const rows = withCounts ? await db.listAdminLinksWithCounts({ limit, offset }) : await db.listAdminLinks({ limit, offset });
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'list_failed', error: String(e?.message || e) });
  }
});

// DELETE /api/admin/links/:key
adminRouter.delete('/links/:key', requireAdminKey, async (req, res) => {
  try {
    const { key } = req.params;
    if (!key) return res.status(400).json({ success: false, message: 'missing_key' });
    await db.deleteAdminLinkByKey(key);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'delete_failed', error: String(e?.message || e) });
  }
});

// GET /api/admin/uploads → list uploaded files (with metadata)
// query: contestId, contestantId, folder, search, limit, offset
adminRouter.get('/uploads', async (req, res) => {
  try {
    const { contestId, contestantId, folder, search } = req.query || {};
    const limit = Math.min(500, Math.max(1, Number(req.query.limit || 200)));
    const offset = Math.max(0, Number(req.query.offset || 0));
    const rows = await db.uploadsList({ contestId, contestantId, folder, search, limit, offset });
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'list_failed', error: String(e?.message || e) });
  }
});

// DELETE /api/admin/uploads?name=filename → delete a file
// DELETE /api/admin/uploads?path=rel/path or name=filename (legacy)
adminRouter.delete('/uploads', requireAdminKey, async (req, res) => {
  const rel = req.query.path || req.body?.path || req.query.name || req.body?.name;
  if (!rel) return res.status(400).json({ success: false, message: 'missing_path' });
  const safeRel = String(rel).replace(/\\/g, '/');
  if (safeRel.includes('..')) return res.status(400).json({ success: false, message: 'invalid_path' });
  const fp = path.join(UPLOAD_DIR, safeRel);
  try {
    fs.unlinkSync(fp);
  } catch (e) {
    // ignore if not found
  }
  try { await db.uploadsDeleteByPath(safeRel); } catch {}
  res.json({ success: true });
});

// POST /api/admin/uploads-rename { oldPath, newName }
adminRouter.post('/uploads-rename', requireAdminKey, async (req, res) => {
  try {
    let { oldPath, newName } = req.body || {};
    if (!oldPath || !newName) return res.status(400).json({ success: false, message: 'missing_params' });
    oldPath = String(oldPath).replace(/\\/g, '/');
    if (oldPath.includes('..')) return res.status(400).json({ success: false, message: 'invalid_old_path' });
    // sanitize newName: keep base + ext, no slashes
    newName = String(newName).replace(/[^a-zA-Z0-9._-]+/g, '_');
    if (!newName || /\//.test(newName) || /\\/.test(newName)) return res.status(400).json({ success: false, message: 'invalid_new_name' });

    const oldAbs = path.join(UPLOAD_DIR, oldPath);
    const exists = fs.existsSync(oldAbs);
    if (!exists) return res.status(404).json({ success: false, message: 'not_found' });
    const folder = path.dirname(oldPath);
    const newRel = folder && folder !== '.' ? `${folder}/${newName}` : newName;
    const newAbs = path.join(UPLOAD_DIR, newRel);
    if (fs.existsSync(newAbs)) return res.status(409).json({ success: false, message: 'target_exists' });

    // ensure target folder exists
    const targetDir = path.dirname(newAbs);
    try { fs.mkdirSync(targetDir, { recursive: true }); } catch {}

    fs.renameSync(oldAbs, newAbs);
    const stat = fs.statSync(newAbs);
    const newUrl = `/uploads/${newRel.replace(/\\/g, '/')}`;
    const row = await db.uploadsRenamePath(oldPath, newRel.replace(/\\/g, '/'), newName, newUrl, stat.mtimeMs);
    res.json({ success: true, data: row || { path: newRel, name: newName, url: newUrl, size: stat.size, mtime: stat.mtimeMs } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'rename_failed', error: String(e?.message || e) });
  }
});
