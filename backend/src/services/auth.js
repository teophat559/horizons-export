import crypto from 'node:crypto';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sid';

function resolveCookieOptions() {
  const crossSite = String(process.env.SESSION_COOKIE_CROSS_SITE || '').toLowerCase() === 'true';
  const reqSameSite = (process.env.SESSION_COOKIE_SAMESITE || '').toLowerCase(); // 'lax' | 'strict' | 'none'
  let sameSite = 'lax';
  if (crossSite || reqSameSite === 'none') sameSite = 'none';
  else if (reqSameSite === 'strict') sameSite = 'strict';
  else if (reqSameSite === 'lax') sameSite = 'lax';

  let secure = process.env.NODE_ENV === 'production';
  const secureEnv = (process.env.SESSION_COOKIE_SECURE || '').toLowerCase();
  if (secureEnv === 'true') secure = true; else if (secureEnv === 'false') secure = false;
  if (sameSite === 'none') secure = true; // required by browsers for cross-site

  const domain = process.env.SESSION_COOKIE_DOMAIN || undefined;
  const path = process.env.SESSION_COOKIE_PATH || '/';
  const httpOnly = String(process.env.SESSION_COOKIE_HTTPONLY || '').toLowerCase() !== 'false'; // default true

  return { sameSite, secure, domain, path, httpOnly };
}

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(payload, expSec = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expSec };
  const h = base64url(JSON.stringify(header));
  const b = base64url(JSON.stringify(body));
  const data = `${h}.${b}`;
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${sig}`;
}

function verify(token) {
  const [h, b, s] = token.split('.');
  if (!h || !b || !s) return null;
  const data = `${h}.${b}`;
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (expected !== s) return null;
  const body = JSON.parse(Buffer.from(b, 'base64').toString());
  if (body.exp && Math.floor(Date.now() / 1000) > body.exp) return null;
  return body;
}

export function setSessionCookie(res, user) {
  const token = sign({ sub: user.id, role: user.role, name: user.name });
  const opts = resolveCookieOptions();
  res.cookie(COOKIE_NAME, token, opts);
}

export function clearSessionCookie(res) {
  const opts = resolveCookieOptions();
  res.clearCookie(COOKIE_NAME, { path: opts.path, domain: opts.domain });
}

export function getUserFromRequest(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  return { id: payload.sub, role: payload.role, name: payload.name };
}

export const AuthConfig = {
  adminUser: {
    id: 'admin',
    name: 'Administrator',
    role: 'admin',
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
};
