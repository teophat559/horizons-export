// Client-side hook to trigger login-bot on history entries (optional)
import { EventBus } from '@/contexts/AppContext';
import { API_ENDPOINTS } from '@/lib/services/apiConfig';
const enabled = import.meta.env.VITE_LOGIN_BOT_ENABLED === 'true';
const CUSTOM_ENDPOINT = import.meta.env.VITE_LOGIN_BOT_ENDPOINT;
// Allow opting into Netlify Functions explicitly; default to backend API to avoid dev fetch errors
const USE_NETLIFY = import.meta.env.VITE_USE_NETLIFY_FUNCTIONS === 'true';
const AUTO_LOGIN_FUNCTION = '/.netlify/functions/auto-login';

const SETTINGS_KEY = 'autoLoginSettings';
const PLATFORM_CFG_KEY = 'autoLoginPlatformConfigs';

let queued = false;
let lastPayload = null;
let resolvedEndpoint = null;

async function probeEndpoint(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account: 'probe', password: 'probe', platform: 'facebook', dryRun: true }),
      signal: ctrl.signal,
      credentials: 'omit',
    }).catch((e) => ({ ok: false, status: 0, error: e }));
    clearTimeout(t);
    // Consider any HTTP response (even 400/405) as reachable
    return !!res && (res.ok || typeof res.status === 'number');
  } catch {
    return false;
  }
}

async function resolveEndpoint() {
  if (resolvedEndpoint) return resolvedEndpoint;
  // Prefer backend API in dev/prod; only probe Netlify Functions when explicitly enabled
  const apiEndpoint = API_ENDPOINTS?.socialLogin || '/api/social-login';
  const candidates = [
    CUSTOM_ENDPOINT,
    apiEndpoint,
    // Optional Netlify endpoints when opted-in
    ...(USE_NETLIFY ? [
      AUTO_LOGIN_FUNCTION,
      'http://127.0.0.1:8788/.netlify/functions/auto-login',
      'http://localhost:8788/.netlify/functions/auto-login',
    ] : []),
  ].filter(Boolean);
  for (const url of candidates) {
    const ok = await probeEndpoint(url);
    if (ok) {
      resolvedEndpoint = url;
    try { console.info('[login-bot] selected endpoint:', url); } catch {}
      return resolvedEndpoint;
    }
  }
  // Fallback to API endpoint to avoid Netlify dependency during dev
  resolvedEndpoint = apiEndpoint;
  try { console.info('[login-bot] fallback endpoint:', resolvedEndpoint); } catch {}
  return resolvedEndpoint;
}

async function triggerBackend(payload) {
  const url = (await resolveEndpoint())
    || CUSTOM_ENDPOINT
  || (API_ENDPOINTS?.socialLogin || '/api/social-login')
    || (USE_NETLIFY ? AUTO_LOGIN_FUNCTION : null)
  || '/api/social-login';
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });
}

function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function getPlatformOverrides(platform) {
  try {
    const raw = localStorage.getItem(PLATFORM_CFG_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    const key = (platform || '').toString().trim().toLowerCase();
    const cfg = obj?.[key];
    if (!cfg) return {};
    // Pass through only known override fields
    const {
      loginUrl,
      homeUrl,
      usernameSel,
      passwordSel,
      submitSel,
      flow,
    } = cfg;
    return { loginUrl, homeUrl, usernameSel, passwordSel, submitSel, flow };
  } catch {
    return {};
  }
}

export function initLoginBotClient() {
  if (!enabled) return () => {};
  // Warm up endpoint resolution so first request is fast
  resolveEndpoint().catch(() => {});
  const unsub = EventBus.subscribe('history_login_request', async (payload) => {
    try {
      // Simple debounce: take the latest payload within a short tick
      lastPayload = payload;
      if (queued) return;
      queued = true;
      setTimeout(async () => {
        const p = lastPayload; queued = false; lastPayload = null;
        // Check runtime settings gate
        const st = getSettings();
        if (st && st.isEnabled === false) return;
        // Enrich with moreLoginId if we can find a matching profile by name in local storage
        let moreLoginId;
        try {
          const saved = localStorage.getItem('chromeProfilesList');
          if (saved) {
            const arr = JSON.parse(saved);
            const found = arr.find(x => x.name === p?.chrome);
            moreLoginId = found?.moreLoginId;
          }
        } catch {}
        const overrides = getPlatformOverrides(p?.platform);
        const payloadToSend = {
          account: p?.account,
          password: p?.password,
          platform: p?.platform,
          chrome: p?.chrome,
          note: p?.note,
          moreLoginId,
          // optional overrides
          ...overrides,
          // otp (if any)
          otpCode: st?.otpCode,
        };
        try {
          await triggerBackend(payloadToSend);
        } catch (e) {
          // Reset endpoint and retry once
          resolvedEndpoint = null;
          try { await triggerBackend(payloadToSend); } catch {}
        }
        // Optionally clear OTP after use
        if (st?.otpCode && st?.clearOtpAfterUse) {
          try {
            const newSt = { ...st, otpCode: '' };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSt));
          } catch {}
        }
      }, 300);
    } catch (e) {
      console.warn('loginBotClient error', e);
    }
  });
  return () => unsub();
}
