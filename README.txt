Hướng dẫn nhanh

1) Sao chép thư mục 'public' vào gốc dự án frontend (Vite/React). File 'public/_headers' sẽ được Netlify áp cho toàn site.
2) Sao chép 'admin/.env.production' vào thư mục app admin và 'user/.env.production' vào app user.
3) Sao chép 'backend/.env.example' sang '.env' trong thư mục backend và điền giá trị thật (DATABASE_URL, JWT_SECRET, ...).

Thông số đã cài sẵn:

Lưu ý:
Horizons export — deployment layout

- Frontend (single site): `public/_headers`, `public/_redirects` control headers and SPA routing.
- Frontend split (optional): `admin/.env.production`, `admin/public/_headers`; `user/.env.production`, `user/public/_headers`.
- Backend: source in `backend/src`, process config at `backend/ecosystem.config.cjs`, secrets in `backend/.env` (not committed).
- Shared libraries: `shared/` for common code; import via `@shared/*` alias.
- Proxy: `nginx/missudsinhvien2025.conf` routes `/api` and `/socket.io` to backend and serves SPA fallbacks.
