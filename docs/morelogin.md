# MoreLogin integration (local API)

## Prerequisites

- MoreLogin client running locally with API enabled (see screenshot: status Connected, base URL `http://127.0.0.1:40000`, API ID/Key).

## Setup

1) Copy `.env.example` to `.env` and set:
   VITE_USE_MORELOGIN=true
   VITE_MORELOGIN_FUNCTION_URL=/.netlify/functions/morelogin

   Server-only vars for netlify dev or Netlify dashboard:

   MORELOGIN_BASE_URL=`http://127.0.0.1:40000`
   MORELOGIN_API_ID=YOUR_ID
   MORELOGIN_API_KEY=YOUR_KEY

2) Start with Netlify Dev so functions are available:
   netlify dev

## Usage

- Open Admin > Chrome management pages. When `VITE_USE_MORELOGIN=true`, the Open/Close buttons will call MoreLogin via the proxy function to start/stop profiles by name.
- Agent badge will show Connected if the MoreLogin API probe succeeds.


### Auto Login (experimental)

- Bật `VITE_LOGIN_BOT_ENABLED=true`.
- Gửi một yêu cầu đăng nhập từ user (đã có sẵn sự kiện `history_login_request`).
- Serverless `auto-login` sẽ:
   - Tìm profileId (ưu tiên moreLoginId đặt trong trang Profiles).
   - Start profile qua MoreLogin.
   - Kết nối Puppeteer vào Chrome của profile và nhập account/password theo nền tảng, sau đó chuyển về trang chủ.

## Notes

- Clear cookies and refresh actions are not yet implemented for MoreLogin and will be skipped.
