// MoreLogin API client (via Netlify Function proxy)
// Config via .env:
// - VITE_USE_MORELOGIN=true to enable
// - VITE_MORELOGIN_FUNCTION_URL to override the proxy URL (defaults to '/.netlify/functions/morelogin')

const USE_MORELOGIN = (import.meta.env.VITE_USE_MORELOGIN || 'false') === 'true';
const FUNCTION_URL = import.meta.env.VITE_MORELOGIN_FUNCTION_URL || '/.netlify/functions/morelogin';

export async function moreLoginCall(path, { method = 'POST', data, headers } = {}) {
  if (!USE_MORELOGIN) {
    throw new Error('MoreLogin is disabled. Set VITE_USE_MORELOGIN=true and configure VITE_MORELOGIN_FUNCTION_URL if needed.');
  }
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, method, data, headers }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MoreLogin proxy error ${res.status}: ${text}`);
  }
  return res.json();
}

export const moreLogin = {
  // Create a new browser profile
  createProfile(payload) {
  return moreLoginCall('/api/v1/profile/create', { method: 'POST', data: payload });
  },
  // Start a profile (returns a debugger/ws endpoint or app url)
  startProfile(profileId) {
  return moreLoginCall(`/api/v1/profile/start`, { method: 'POST', data: { profileId } });
  },
  stopProfile(profileId) {
  return moreLoginCall(`/api/v1/profile/stop`, { method: 'POST', data: { profileId } });
  },
  listProfiles(params = {}) {
  return moreLoginCall('/api/v1/profile/list', { method: 'POST', data: params });
  },
};

export default moreLogin;
