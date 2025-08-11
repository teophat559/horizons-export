// Lightweight Telegram notifier wired to the global EventBus
// Prefers settings from localStorage (webAppSettings); falls back to Vite envs
import { EventBus } from '@/contexts/AppContext';

const SETTINGS_STORAGE_KEY = 'webAppSettings';

function readSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

function resolveConfig() {
  const s = readSettings();
  const enabledLocal = s.telegramEnabled;
  const enabledEnv = import.meta.env.VITE_TELEGRAM_NOTIF_ENABLED === 'true';
  const token = s.telegramToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = s.telegramChatId || import.meta.env.VITE_TELEGRAM_CHAT_ID;
  const rateWindowSec = Number(s.telegramRateWindowSec ?? 60);
  const maxPerWindow = Number(s.telegramMaxPerWindow ?? 10);
  return {
    enabled: Boolean(enabledLocal ?? enabledEnv),
    token,
    chatId,
    rateWindowMs: Math.max(1000, rateWindowSec * 1000),
    maxPerWindow: Math.max(1, maxPerWindow),
  };
}

// Simple windowed rate limiter (client-side)
let windowStart = 0;
let sentCount = 0;

function canSend(now, cfg) {
  if (now - windowStart > cfg.rateWindowMs) {
    windowStart = now;
    sentCount = 0;
  }
  if (sentCount < cfg.maxPerWindow) {
    sentCount += 1;
    return true;
  }
  return false;
}

async function send(text, cfg) {
  try {
    if (!cfg.token || !cfg.chatId) return;
    const now = Date.now();
    if (!canSend(now, cfg)) {
      // Drop silently to avoid spam
      return;
    }
    const url = `https://api.telegram.org/bot${cfg.token}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: cfg.chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch (e) {
    console.warn('Telegram notifier error:', e);
  }
}

export function initTelegramNotifier() {
  const cfg = resolveConfig();
  if (!cfg.enabled) return () => {};

  const unsub1 = EventBus.subscribe('user_login', (u) => {
    send(`✅ User login: <b>${u?.email || u?.username || 'unknown'}</b>`, cfg);
  });
  const unsub2 = EventBus.subscribe('user_logout', (u) => {
    send(`🚪 User logout: <b>${u?.email || u?.username || 'unknown'}</b>`, cfg);
  });
  const unsub3 = EventBus.subscribe('admin_login_success', (info) => {
    send(`🛡️ Admin login success from ${info?.ip || 'unknown ip'}`, cfg);
  });
  const unsub4 = EventBus.subscribe('admin_login_failed', (info) => {
    send(`⛔ Admin login failed from ${info?.ip || 'unknown ip'} reason: ${info?.reason || 'unknown'}`, cfg);
  });

  return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
}
