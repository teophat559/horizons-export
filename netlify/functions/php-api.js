// Netlify Function: php-api (DISABLED IN PRODUCTION)
// This dev-only shim for legacy PHP endpoints is disabled for security.
// It now always returns 410 Gone. Remove this file if not needed.

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders() };
  return { statusCode: 410, headers: corsHeaders(), body: JSON.stringify({ success: false, message: 'Deprecated. Use real API at /api/*.' }) };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': 'https://missudsinhvien2025.online',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json; charset=utf-8',
  };
}
// Note: this function is intentionally disabled in production.
