import { Router } from 'express';

export const integrationsRouter = Router();

// POST /api/webhook
// Forward payload tới LOG_WEBHOOK_URL nếu có; nếu không có thì echo lại.
integrationsRouter.post('/webhook', async (req, res) => {
  const target = process.env.LOG_WEBHOOK_URL;
  if (!target) {
    return res.json({ success: true, forwarded: false, message: 'No LOG_WEBHOOK_URL set', echo: req.body || null });
  }
  try {
    const fw = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: 'horizons-backend', ts: Date.now(), payload: req.body || null }),
    });
    const text = await fw.text();
    return res.json({ success: true, forwarded: true, status: fw.status, response: text.slice(0, 500) });
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e?.message || e) });
  }
});

// POST /api/telegram/send
// Gửi tin nhắn Telegram qua Bot API
integrationsRouter.post('/telegram/send', async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const defaultChatId = process.env.TELEGRAM_CHAT_ID;
  const { text, chat_id } = req.body || {};
  if (!token) return res.status(400).json({ success: false, message: 'Missing TELEGRAM_BOT_TOKEN' });
  const chatId = chat_id || defaultChatId;
  if (!chatId) return res.status(400).json({ success: false, message: 'Missing chat_id or TELEGRAM_CHAT_ID' });
  if (!text) return res.status(400).json({ success: false, message: 'Missing text' });

  const api = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const r = await fetch(api, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 4000) }),
    });
    const data = await r.json().catch(() => ({}));
    return res.json({ success: r.ok, status: r.status, data });
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e?.message || e) });
  }
});
