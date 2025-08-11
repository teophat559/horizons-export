// Centralized API endpoints
// Prefer VITE_API_URL (recommended), then fallback VITE_API_BASE (legacy), else '/api' (dev proxy)
function ensureApiBase(v) {
  const val = (v || '').toString();
  if (!val) return '/api';
  if (val.endsWith('/api')) return val;
  if (val.endsWith('/api/')) return val.replace(/\/+$/, '');
  return val.replace(/\/+$/, '') + '/api';
}

export const API_BASE = ensureApiBase(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '/api'
);

export const API_PUBLIC = `${API_BASE}/public`;
export const API_ADMIN = `${API_BASE}/admin`;

const ADMIN_VERIFY_OVERRIDE = import.meta.env.VITE_ADMIN_VERIFY_ENDPOINT;
const IS_DEV = import.meta.env.DEV;
const ADMIN_VERIFY_DEFAULT = `${API_ADMIN}/verify-key`;

export const API_ENDPOINTS = {
  socialLogin: `${API_BASE}/social-login`,
  sessionStatus: `${API_BASE}/session`,
  contests: `${API_PUBLIC}/contests`,
  contestants: `${API_PUBLIC}/contestants`,
  rankings: `${API_PUBLIC}/rankings`,
  vote: `${API_BASE}/vote`,
  adminBlockedIps: `${API_ADMIN}/blocked-ips`,
  adminVerifyKey: ADMIN_VERIFY_OVERRIDE || ADMIN_VERIFY_DEFAULT,
  adminNotifications: `${API_ADMIN}/notifications`,
  adminAuditList: `${API_ADMIN}/audit-list`,
};
