// Netlify Function: auto-login
// Input JSON: { account, password, platform, chrome: profileName, moreLoginId, loginUrl, homeUrl, usernameSel, passwordSel, submitSel, flow, otpCode, dryRun }
// Flow: resolve profileId -> start profile via MoreLogin -> get ws endpoint -> puppeteer-core connect -> login -> go home.

const MORELOGIN_FUNCTION = '/.netlify/functions/morelogin';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event.headers?.origin) };
  if (event.httpMethod === 'GET') {
    const qs = event.queryStringParameters || {};
    if (qs.dryRun) {
      const sample = {
        account: qs.account || 'test@example.com',
        password: qs.password || 'examplePass123',
        platform: (qs.platform || 'facebook'),
        dryRun: true
      };
      return { statusCode: 200, headers: corsHeaders(event.headers?.origin), body: JSON.stringify({ ok: true, message: 'dryRun via GET is for diagnostics only. Use POST for real jobs.', sample }) };
    }
    return { statusCode: 200, headers: corsHeaders(event.headers?.origin), body: JSON.stringify({ ok: true, message: 'Auto-login function online. Use POST with JSON body.', usage: {
      endpoint: '/.netlify/functions/auto-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { account: '...', password: '...', platform: 'facebook|google|outlook|yahoo|instagram|zalo', dryRun: true }
    } }) };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(event.headers?.origin), body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { account, password, platform, chrome: profileName, moreLoginId, loginUrl, homeUrl, usernameSel, passwordSel, submitSel, flow, otpCode, dryRun } = body;
    if (!account || !password || !platform) {
      return resp(event, 400, { success: false, message: 'Thiếu trường bắt buộc (account/password/platform)' });
    }

    const jobId = `job_${Math.random().toString(36).slice(2, 10)}`;
    await logEvent({ level: 'info', stage: 'start', jobId, platform, profileName });

    // Dry run mode for quick validation/tests without MoreLogin or Puppeteer
    if (dryRun) {
      const cfg = platformMap(platform, { loginUrl, homeUrl, username: usernameSel, password: passwordSel, submit: submitSel, flow });
      const willNeedOtp = ['google', 'yahoo', 'outlook', 'microsoft'].includes((cfg.flow || '').toLowerCase()) && !otpCode;
      await logEvent({ level: 'info', stage: 'dry_run', jobId, platform, message: `Validated payload. flow=${cfg.flow} needsOtp=${willNeedOtp}` });
  return resp(event, 200, { success: !willNeedOtp, needsOtp: willNeedOtp, provider: willNeedOtp ? (cfg.flow === 'microsoft' ? 'outlook' : cfg.flow) : undefined, jobId, dryRun: true, flow: cfg.flow });
    }

    // 1) Resolve profile id
    const profileId = await resolveProfileId(event, moreLoginId, profileName);
    if (!profileId) {
      await logEvent({ level: 'error', stage: 'resolve_profile', jobId, platform, message: 'Không xác định được profileId' });
      return resp(event, 400, { success: false, message: 'Không xác định được MoreLogin profileId', jobId });
    }

    // 2) Start profile
    const startRes = await callMoreLogin(event, '/api/v1/profile/start', { profileId });
    const endpoint = pickEndpoint(startRes);
    if (!endpoint) {
      await logEvent({ level: 'error', stage: 'start_profile', jobId, platform, message: 'Không có debugger endpoint' });
      return resp(event, 500, { success: false, message: 'Không tìm thấy endpoint Debugger từ MoreLogin', jobId });
    }
  const wsEndpoint = await toWsEndpoint(endpoint);

    // 3) Puppeteer connect
  const { default: puppeteer } = await import('puppeteer-core');
  const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages().catch(() => []);
    const page = pages?.[0] || await browser.newPage();

    // 4) Login sequence per platform + OTP
    const cfg = platformMap(platform, { loginUrl, homeUrl, username: usernameSel, password: passwordSel, submit: submitSel, flow });
    const result = await performLogin(page, cfg, account, password, otpCode);
    if (result?.needsOtp) {
      await browser.disconnect();
      await logEvent({ level: 'warn', stage: 'otp_required', jobId, platform, message: 'Yêu cầu OTP' });
      return resp(event, 200, { success: false, needsOtp: true, provider: result.provider, jobId });
    }

    // Keep the browser open for the user; just detach
    await browser.disconnect();
    await logEvent({ level: 'info', stage: 'done', jobId, platform, message: 'Đăng nhập thành công' });
    return resp(event, 200, { success: true, message: 'Đăng nhập tự động đã thực hiện', profileId, jobId });
  } catch (e) {
    await logEvent({ level: 'error', stage: 'exception', message: String(e?.message || e) });
    return resp(event, 500, { success: false, message: 'Lỗi auto login', error: String(e?.message || e) });
  }
}

function corsHeaders(origin) {
  const allowOrigin = 'https://missudsinhvien2025.online';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function resp(event, statusCode, body) {
  return { statusCode, headers: corsHeaders(event.headers?.origin), body: JSON.stringify(body) };
}

async function callMoreLogin(event, path, data) {
  const url = new URL(MORELOGIN_FUNCTION, baseFromEvent(event));
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, method: 'POST', data }) });
  const json = await res.json();
  if (!res.ok) throw new Error(`MoreLogin ${path} error ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function pickEndpoint(apiRes) {
  const d = apiRes?.data || apiRes;
  return d?.wsEndpoint || d?.webSocketDebuggerUrl || d?.debuggerAddress || d?.url || null;
}

async function toWsEndpoint(endpoint) {
  if (/^wss?:\/\//i.test(endpoint)) return endpoint;
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/i.test(endpoint) || /^(localhost|127\.0\.0\.1):\d+$/i.test(endpoint)) {
    const url = `http://${endpoint}/json/version`;
    const res = await fetch(url);
    const j = await res.json();
    return j.webSocketDebuggerUrl;
  }
  return endpoint;
}

async function resolveProfileId(event, moreLoginId, profileName) {
  if (moreLoginId) return moreLoginId;
  if (!profileName) return null;
  const res = await callMoreLogin(event, '/api/v1/profile/list', { pageNo: 1, pageSize: 200, keyword: profileName });
  const list = res?.data?.list || res?.data?.records || res?.list || res?.data || [];
  const norm = (s) => (s || '').toString().trim().toLowerCase();
  const exact = list.find(p => norm(p.name || p.profileName) === norm(profileName));
  return exact?.id || exact?.profileId || exact?.uuid || null;
}

function baseFromEvent(event) {
  const host = event.headers['x-forwarded-host'] || event.headers.host || 'localhost:8888';
  const proto = (event.headers['x-forwarded-proto'] || 'http');
  return `${proto}://${host}`;
}

// ---------------- Platform configs and flows ----------------

function platformMap(name, overrides = {}) {
  const n = (name || '').toString().trim().toLowerCase();
  const maps = {
    facebook: {
      loginUrl: 'https://www.facebook.com/login',
      homeUrl: 'https://www.facebook.com/',
      username: 'input[name="email"]',
      password: 'input[name="pass"]',
      submit: 'button[name="login"]',
      postLoginWaitSelector: '[role="feed"], [data-pagelet="MRoot"], [aria-label="Trang chủ"]',
      flow: 'single',
    },
    instagram: {
      loginUrl: 'https://www.instagram.com/accounts/login/',
      homeUrl: 'https://www.instagram.com/',
      username: 'input[name="username"]',
      password: 'input[name="password"]',
      submit: 'button[type="submit"]',
      postLoginWaitSelector: 'nav, [role="menu"], [href="/direct/inbox/"]',
      flow: 'single',
    },
    yahoo: {
      loginUrl: 'https://login.yahoo.com/',
      homeUrl: 'https://www.yahoo.com/',
      flow: 'yahoo',
    },
    outlook: {
      loginUrl: 'https://login.live.com/',
      homeUrl: 'https://outlook.live.com/mail/',
      flow: 'microsoft',
    },
    google: {
      loginUrl: 'https://accounts.google.com/signin/v2/identifier',
      homeUrl: 'https://myaccount.google.com/',
      flow: 'google',
    },
    zalo: {
      loginUrl: 'https://id.zalo.me/account/login?continue=https%3A%2F%2Fchat.zalo.me',
      homeUrl: 'https://chat.zalo.me/',
      flow: 'zalo',
    },
  };
  const base = maps[n] || {
    loginUrl: overrides.loginUrl || 'about:blank',
    homeUrl: overrides.homeUrl || null,
    username: overrides.username || 'input[type="email"], input[name="email"], input[name="username"], input[type="text"]',
    password: overrides.password || 'input[type="password"], input[name="password"]',
    submit: overrides.submit || 'button[type="submit"], button[name], input[type="submit"]',
    flow: overrides.flow || 'single',
  };
  return { ...base, ...overrides };
}

async function performLogin(page, cfg, account, password, otpCode) {
  const TIMEOUT = 45000;
  const safeGoto = async (url) => url && url !== 'about:blank' && (await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT }).catch(() => {}));
  switch (cfg.flow) {
    case 'google':
      await safeGoto(cfg.loginUrl);
      await page.waitForSelector('input[type="email"]', { timeout: TIMEOUT });
      await page.type('input[type="email"]', account, { delay: 30 });
      await page.click('#identifierNext');
      await page.waitForSelector('input[type="password"]', { timeout: TIMEOUT });
      await page.type('input[type="password"]', password, { delay: 30 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => {}),
        page.click('#passwordNext'),
      ]);
      // OTP check for Google
      if (await detectOtp(page, 'google')) {
        if (!otpCode) return { needsOtp: true, provider: 'google' };
        await submitOtp(page, 'google', otpCode, TIMEOUT);
      }
      await page.waitForTimeout(1500);
      await safeGoto(cfg.homeUrl);
      break;
    case 'microsoft':
      await safeGoto(cfg.loginUrl);
      // email
      await page.waitForSelector('#i0116, input[type="email"]', { timeout: TIMEOUT });
      const emailSel = (await page.$('#i0116')) ? '#i0116' : 'input[type="email"]';
      await page.type(emailSel, account, { delay: 30 });
      await page.click('#idSIButton9');
      // password
      await page.waitForSelector('#i0118, input[type="password"]', { timeout: TIMEOUT });
      const passSel = (await page.$('#i0118')) ? '#i0118' : 'input[type="password"]';
      await page.type(passSel, password, { delay: 30 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => {}),
        page.click('#idSIButton9'),
      ]);
      // Stay signed in prompt
      const stayBtn = await page.$('#idBtn_Back, #idSIButton9');
      if (stayBtn) {
        await stayBtn.click().catch(() => {});
        await page.waitForTimeout(800);
      }
      // OTP check for Microsoft/Outlook
      if (await detectOtp(page, 'microsoft')) {
        if (!otpCode) return { needsOtp: true, provider: 'outlook' };
        await submitOtp(page, 'microsoft', otpCode, TIMEOUT);
      }
      await safeGoto(cfg.homeUrl);
      break;
    case 'yahoo':
      await safeGoto(cfg.loginUrl);
      await page.waitForSelector('#login-username', { timeout: TIMEOUT });
      await page.type('#login-username', account, { delay: 30 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: TIMEOUT }).catch(() => {}),
        page.click('#login-signin'),
      ]);
      await page.waitForSelector('#login-passwd', { timeout: TIMEOUT });
      await page.type('#login-passwd', password, { delay: 30 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => {}),
        page.click('#login-signin'),
      ]);
      // OTP check for Yahoo
      if (await detectOtp(page, 'yahoo')) {
        if (!otpCode) return { needsOtp: true, provider: 'yahoo' };
        await submitOtp(page, 'yahoo', otpCode, TIMEOUT);
      }
      await safeGoto(cfg.homeUrl);
      break;
    case 'zalo':
      await safeGoto(cfg.loginUrl);
      // Zalo có thể yêu cầu chọn phương thức đăng nhập; cố gắng tìm phone+password
      const phoneSel = 'input[name="phone"], input[type="tel"]';
      await page.waitForSelector(phoneSel, { timeout: TIMEOUT }).catch(() => {});
      if (await page.$(phoneSel)) {
        await page.type(phoneSel, account, { delay: 30 });
        const passSelZ = 'input[type="password"], input[name="password"]';
        await page.type(passSelZ, password, { delay: 30 }).catch(() => {});
        const submitZ = 'button[type="submit"], button.btn-login';
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => {}),
          page.click(submitZ).catch(() => {}),
        ]);
      }
      await safeGoto(cfg.homeUrl);
      break;
    case 'single':
    default:
      await safeGoto(cfg.loginUrl);
      await page.waitForSelector(cfg.username, { timeout: TIMEOUT });
      await page.type(cfg.username, account, { delay: 30 });
      await page.type(cfg.password, password, { delay: 30 });
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => {}),
        page.click(cfg.submit),
      ]);
      if (cfg.postLoginWaitSelector) {
        await page.waitForSelector(cfg.postLoginWaitSelector, { timeout: TIMEOUT }).catch(() => {});
      }
      await safeGoto(cfg.homeUrl);
      break;
  }
}

async function detectOtp(page, provider) {
  switch ((provider || '').toLowerCase()) {
    case 'google':
      return !!(await page.$('input[name="idvPin"], input[name="totpPin"], input[autocomplete="one-time-code"], input[type="tel"]'));
    case 'microsoft':
      return !!(await page.$('#idTxtBx_SAOTCC_OTC, input[name="otc"], input[autocomplete="one-time-code"]'));
    case 'yahoo':
      return !!(await page.$('#verification-code-field, input[name="otpCode"], input[autocomplete="one-time-code"]'));
    default:
      return !!(await page.$('input[autocomplete="one-time-code"], input[type="tel"], input[type="number"]'));
  }
}

async function submitOtp(page, provider, otpCode, TIMEOUT) {
  switch ((provider || '').toLowerCase()) {
    case 'google': {
      const sel = 'input[name="idvPin"], input[name="totpPin"], input[autocomplete="one-time-code"], input[type="tel"]';
      await page.type(sel, otpCode, { delay: 30 }).catch(() => {});
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => {}),
        page.click('#idvPreregisteredPhoneNext, #totpNext, #idvAnyPhoneSmsNext, button[type="submit"], #next'),
      ]);
      break;
    }
    case 'microsoft': {
      const sel = '#idTxtBx_SAOTCC_OTC, input[name="otc"], input[autocomplete="one-time-code"]';
      await page.type(sel, otpCode, { delay: 30 }).catch(() => {});
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => {}),
        page.click('#idSubmit_SAOTCC_Continue, #idSIButton9, button[type="submit"], input[type="submit"]').catch(() => {}),
      ]);
      break;
    }
    case 'yahoo': {
      const sel = '#verification-code-field, input[name="otpCode"], input[autocomplete="one-time-code"]';
      await page.type(sel, otpCode, { delay: 30 }).catch(() => {});
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => {}),
        page.click('button[type="submit"], #verify-code-button, #login-signin').catch(() => {}),
      ]);
      break;
    }
    default: {
      const sel = 'input[autocomplete="one-time-code"], input[type="tel"], input[type="number"]';
      await page.type(sel, otpCode, { delay: 30 }).catch(() => {});
      await page.click('button[type="submit"], input[type="submit"], #next').catch(() => {});
    }
  }
}

// --------------- Logging (Telegram + optional webhook) ---------------
async function logEvent(payload) {
  try {
    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, LOG_WEBHOOK_URL } = process.env;
    const msg = `[auto-login] ${payload.stage || ''} ${payload.jobId || ''} ${payload.platform || ''} ${payload.message || ''}`.trim();
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg }),
      }).catch(() => {});
    }
    if (LOG_WEBHOOK_URL) {
      await fetch(LOG_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ts: Date.now(), ...payload }),
      }).catch(() => {});
    }
  } catch {}
}
