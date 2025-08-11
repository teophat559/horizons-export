// Netlify Function: morelogin (proxy to MoreLogin local API)
// Env:
//   MORELOGIN_BASE_URL (default: http://127.0.0.1:40000)
//   MORELOGIN_API_ID
//   MORELOGIN_API_KEY
// Request body JSON: { path: string, method?: 'GET'|'POST'|'PUT'|'DELETE', data?: any, headers?: Record<string,string> }

const BASE = process.env.MORELOGIN_BASE_URL || 'http://127.0.0.1:40000';
const API_ID = process.env.MORELOGIN_API_ID || '';
const API_KEY = process.env.MORELOGIN_API_KEY || '';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(event.headers?.origin) };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(event.headers?.origin),
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
    };
  }

  try {
    const { path, method = 'POST', data, headers = {} } = JSON.parse(event.body || '{}');
    if (!path || typeof path !== 'string') {
      return { statusCode: 400, headers: corsHeaders(event.headers?.origin), body: JSON.stringify({ success:false, message: 'Missing path' }) };
    }

    const url = combineUrl(BASE, path);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (API_ID && !reqHeaders['X-API-ID'] && !reqHeaders['x-api-id']) reqHeaders['x-api-id'] = API_ID;
    if (API_KEY && !reqHeaders['X-API-KEY'] && !reqHeaders['x-api-key']) reqHeaders['x-api-key'] = API_KEY;

    const requestData = typeof data === 'object' && data !== null ? { ...data } : data;
    if (API_ID && requestData && requestData.apiId == null) requestData.apiId = API_ID;
    if (API_KEY && requestData && requestData.apiKey == null) requestData.apiKey = API_KEY;

    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: method === 'GET' ? undefined : JSON.stringify(requestData ?? {}),
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    return {
      statusCode: res.status,
      headers: corsHeaders(event.headers?.origin),
      body: JSON.stringify(json),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: corsHeaders(event.headers?.origin),
      body: JSON.stringify({ success: false, message: 'Proxy error', error: String(e) })
    };
  }
}

function combineUrl(base, path) {
  if (path.startsWith('http')) return path;
  if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
  if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
  return base + path;
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
