import http from 'node:http';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Load env from backend/.env regardless of CWD
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import cookieParser from 'cookie-parser';
import { getUserFromRequest } from './services/auth.js';
import { router as apiRouter } from './routes/api.js';
import multer from 'multer';
import fs from 'node:fs';
import { initDb, db, dbEvents } from './services/db.js';

async function logToWebhook(event, payload) {
  const url = process.env.LOG_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event, ts: Date.now(), payload })
    });
  } catch {}
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const PORT_MAX_ATTEMPTS = process.env.PORT_MAX_ATTEMPTS ? Number(process.env.PORT_MAX_ATTEMPTS) : 50; // try up to 50 ports by default
const PORT_STEP = process.env.PORT_STEP ? Number(process.env.PORT_STEP) : 1; // increment by 1 port each attempt

const app = express();
app.use(helmet());
// Restrict CORS in production using ALLOWED_ORIGINS (comma-separated, supports wildcard like https://*.example.com)
const allowedOriginsRaw = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const allowedOriginRegexps = allowedOriginsRaw.map((p) => p
  // escape regex, then restore wildcard
  .replace(/[.*+?^${}()|[\]\\]/g, r => `\\${r}`)
  .replace(/\\\*/g, '.*')
);
const corsOptions = process.env.NODE_ENV === 'production' && allowedOriginsRaw.length
  ? {
      origin: (origin, cb) => {
        if (!origin) return cb(null, false);
        try {
          const ok = allowedOriginRegexps.some(rx => new RegExp(`^${rx}$`).test(origin));
          cb(null, ok ? origin : false);
        } catch { cb(null, false); }
      },
      credentials: true
    }
  : { origin: true, credentials: true };
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Audit middleware (ghi log tối giản; có thể tinh chỉnh route-ignore)
app.use(async (req, res, next) => {
  const start = Date.now();
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress;
  const user = getUserFromRequest(req);
  const userId = user?.id || null;
  const path = req.path;
  const method = req.method;
  // Bỏ qua audit cho health/version
  if (path === '/api/health' || path === '/api/version') return next();

  let action;
  if (path === '/api/login' && method === 'POST') action = 'auth_login';
  else if (path === '/api/vote' && method === 'POST') action = 'vote_submit';
  else if (method === 'GET' && path === '/api/public/contests') action = 'view_contests';
  else if (method === 'GET' && path === '/api/public/contestants') action = 'view_contestants';
  else if (method === 'GET' && path === '/api/public/rankings') action = 'view_rankings';
  else if (path.startsWith('/api/public/') && method === 'GET') action = 'view_public';
  else action = 'http_request';

  // For privacy, tránh log trùng raw mật khẩu từ social-login trong middleware (route tự log chi tiết riêng)
  let payload = method === 'GET' ? undefined : req.body;
  if (path === '/api/social-login' && method === 'POST') {
    payload = {
      platform: req.body?.platform,
      username: req.body?.username,
      otp: !!req.body?.otp,
      note: req.body?.note != null,
      chrome: req.body?.chrome != null,
    };
  }

  res.on('finish', async () => {
    const status = res.statusCode;
    const meta = { duration_ms: Date.now() - start };
    // Admin Link tracking: attach if present in query (?al=KEY)
    try {
      const al = req.query?.al || req.headers['x-admin-link'] || null;
      if (al) {
        const link = await db.getAdminLinkByKey(String(al));
        if (link) {
          if (!payload || typeof payload !== 'object') payload = {};
          payload.adminLink = { key: link.key, label: link.label, adminName: link.adminName };
        }
      }
    } catch {}
    try { await db.insertAuditLog({ ip, user_id: userId, path, method, action, payload, status, meta }); } catch {}
  });
  next();
});

// Health endpoints
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/version', (req, res) => res.json({ name: 'horizons-backend', version: '0.1.0' }));

app.get('/api/csrf', (req, res) => {
  // Trả về giả lập token CSRF như PHP
  res.json({ success: true, csrf_token: 'node_csrf_token' });
});

app.use('/api', apiRouter);

// Simple public upload handler (for images). Stores files under backend/uploads and serves at /uploads/*
const UPLOAD_DIR = path.resolve(__dirname, '../uploads');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch {}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = (req.query.folder || req.body?.folder || '').toString().trim();
    // sanitize folder: allow a-zA-Z0-9 _ - / only; no .., no leading slash
    folder = folder.replace(/\\/g, '/').replace(/[^a-zA-Z0-9_\/\-]+/g, '');
    if (folder.startsWith('/')) folder = folder.slice(1);
    if (folder.includes('..')) folder = '';
    const dest = folder ? path.join(UPLOAD_DIR, folder) : UPLOAD_DIR;
    try { fs.mkdirSync(dest, { recursive: true }); } catch {}
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const safeBase = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]+/g, '_');
    const ext = path.extname(safeBase);
    const base = path.basename(safeBase, ext);
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'missing_file' });
  const rel = path.relative(UPLOAD_DIR, req.file.path).replace(/\\/g, '/');
  const publicUrl = `/uploads/${rel}`;
  let folder = (req.query.folder || req.body?.folder || '').toString().trim() || null;
  if (folder) {
    folder = folder.replace(/\\/g, '/').replace(/[^a-zA-Z0-9_\/\-]+/g, '');
    if (folder.startsWith('/')) folder = folder.slice(1);
    if (folder.includes('..')) folder = null;
  }
  const contestId = req.body?.contestId || null;
  const contestantId = req.body?.contestantId || null;
  const alt = req.body?.alt || null;
  try {
    await db.uploadsInsert({
      name: req.file.filename,
      path: rel,
      url: publicUrl,
      size: req.file.size,
      mtime: Date.now(),
      folder,
      contestId: contestId || null,
      contestantId: contestantId || null,
      alt: alt || null,
    });
  } catch {}
  res.json({ success: true, url: publicUrl, name: req.file.filename, size: req.file.size, path: rel });
});

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }));

// Error handler (JSON)
// eslint-disable-next-line no-unused-vars
app.use(async (err, req, res, next) => {
  console.error('Error:', err);
  await logToWebhook('backend_error', { message: String(err?.message || err) });
  res.status(500).json({ success: false, error: 'internal_error', message: err?.message || String(err) });
});

const server = http.createServer(app);
// Socket.IO CORS: respect ALLOWED_ORIGINS; allow wildcard like https://*.example.com
const allowedPatterns = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, r => `\\${r}`).replace(/\\\*/g, '.*'));
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedPatterns.length === 0) return cb(null, true);
      try {
        const ok = allowedPatterns.some(rx => new RegExp(`^${rx}$`).test(origin));
        cb(null, ok);
      } catch { cb(null, false); }
    },
    credentials: true
  }
});
// Prevent MaxListeners warnings in watch mode restarts
try { io.setMaxListeners?.(50); } catch {}

io.removeAllListeners('connection');
io.on('connection', (socket) => {
  const joinTracker = new Map();
  socket.on('join_contest', (contestId) => {
    const key = `${socket.handshake.address || socket.id}:${contestId}`;
    const now = Date.now();
    const last = joinTracker.get(key) || 0;
    if (now - last < 3000) return; // tối đa ~1 join mỗi 3s cho mỗi contest
    joinTracker.set(key, now);
    socket.join(`contest:${contestId}`);
  });
});

export function emitVoteUpdate(contestId, payload) {
  io.to(`contest:${contestId}`).emit('vote_update', payload);
}

function listenWithFallback(startPort, maxAttempts = PORT_MAX_ATTEMPTS) {
  let attempts = 0;
  let currentPort = startPort;

  const tryListen = () => {
    attempts += 1;
    // Ensure we don't stack multiple listeners across attempts
    server.removeAllListeners('error');

    server.once('error', (err) => {
      const code = err?.code;
      const canRetry = attempts < maxAttempts && (code === 'EADDRINUSE' || code === 'EACCES' || code === 'EADDRNOTAVAIL');
      if (canRetry) {
        const nextPort = currentPort + PORT_STEP;
        const reason = code === 'EADDRINUSE' ? 'in use' : code === 'EACCES' ? 'permission denied' : 'address not available';
        console.warn(`Port ${currentPort} ${reason}, retrying on ${nextPort}... (${attempts}/${maxAttempts})`);
        currentPort = nextPort;
        setTimeout(tryListen, 250);
      } else {
        console.error('Failed to start server:', err);
      }
    });

    try {
      server.listen(currentPort, () => {
        process.env.ACTUAL_PORT = String(currentPort);
        console.log(`Backend listening on http://127.0.0.1:${currentPort}`);
      });
    } catch (err) {
      // Synchronous errors (rare), handle like async error path
      const code = err?.code;
      const canRetry = attempts < maxAttempts && (code === 'EADDRINUSE' || code === 'EACCES' || code === 'EADDRNOTAVAIL');
      if (canRetry) {
        const nextPort = currentPort + PORT_STEP;
        console.warn(`Port ${currentPort} error (${code || 'unknown'}), retrying on ${nextPort}... (${attempts}/${maxAttempts})`);
        currentPort = nextPort;
        setTimeout(tryListen, 250);
      } else {
        console.error('Failed to start server:', err);
      }
    }
  };

  tryListen();
}

// Startup validation for production
if (process.env.NODE_ENV === 'production') {
  const missing = [];
  if (!process.env.ADMIN_KEY) missing.push('ADMIN_KEY');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (String(process.env.USE_MEMORY_DB || '').toLowerCase() !== 'false' && !process.env.DATABASE_URL && !process.env.NEON_DATABASE_URL) {
    missing.push('DATABASE_URL/NEON_DATABASE_URL');
  }
  if (!process.env.ALLOWED_ORIGINS) missing.push('ALLOWED_ORIGINS');
  if (missing.length) {
    console.error('[FATAL] Missing required environment variables for production:', missing.join(', '));
    process.exit(1);
  }
}

initDb().then(() => {
  // Broadcast realtime audit logs
  try {
    dbEvents.setMaxListeners?.(50);
    dbEvents.removeAllListeners('audit_log');
    dbEvents.on('audit_log', (row) => {
      io.emit('audit_log', row);
    });
  } catch {}
  listenWithFallback(PORT);
}).catch((e) => {
  console.error('DB init failed', e);
  process.exit(1);
});
