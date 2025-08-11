// Netlify Function: admin-verify-key
// Receives JSON { key } and verifies against env or simple config

const ADMIN_KEY = process.env.ADMIN_KEY || 'horizon_admin_2025';

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
    const { key } = JSON.parse(event.body || '{}');
    const ok = typeof key === 'string' && key === ADMIN_KEY;
    return {
      statusCode: 200,
      headers: corsHeaders(event.headers?.origin),
      body: JSON.stringify({ success: ok })
    };
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders(event.headers?.origin),
      body: JSON.stringify({ success: false, message: 'Bad Request', error: String(e) })
    };
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
