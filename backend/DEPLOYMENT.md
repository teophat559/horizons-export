# Triển khai Production

Hướng dẫn triển khai Backend (Render) và Frontend (Netlify) cho dự án này.

## 1) Backend trên Render (Web Service)

- New → Web Service → Kết nối repo thư mục `backend/` → Chọn môi trường Node.
- Build Command: `npm ci && npm run build` (nếu không có build step, có thể để trống)
- Start Command: `node src/index.js` hoặc `npm start`

PM2 (tự quản lý server):

- File PM2: `backend/ecosystem.config.cjs`
- `.env` đặt trong `backend/.env` (KHÔNG COMMIT). Quyền đọc dành cho user chạy tiến trình.

Biến môi trường cần thiết (NODE_ENV=production):

- ADMIN_KEY: khóa admin bí mật
- JWT_SECRET: bí mật JWT
- DATABASE_URL hoặc NEON_DATABASE_URL
- ALLOWED_ORIGINS: danh sách origin, phân tách bởi dấu phẩy (ví dụ: `https://admin.yourdomain.com,https://yourdomain.com`). Hỗ trợ wildcard `https://*.yourdomain.com`.

Lưu ý khi tự host (nginx):

- Cấu hình nằm tại `nginx/missudsinhvien2025.conf` để reverse proxy `/api` và `/socket.io` về backend.

Lưu ý cổng và WebSocket:

- Render cung cấp PORT qua env `PORT`. Server đã lắng nghe biến này.
- Socket.IO dùng cùng host với backend; CORS đã ràng buộc theo `ALLOWED_ORIGINS`.

## 2) Frontend trên Netlify (tách 2 site: admin, user)

Tạo 2 site riêng (admin.yourdomain.com và yourdomain.com) trỏ tới repo này. Cấu hình form build như sau:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variables: nên đặt `VITE_API_URL=https://api.yourdomain.com`. `VITE_BASE_PATH` và `VITE_OUT_DIR` chỉ dùng khi cần override.
- Admin build: dùng `npm run build:admin` khi cần tách logic UI quản trị (thiết lập `BUILD_TARGET=admin`).

SPA fallback:

- Dùng file `_redirects` trong `public/` (Vite sẽ copy sang `dist/`). Tránh khai báo thêm redirect tương tự trong `netlify.toml` để không xung đột.

## 3) Kết nối Frontend ↔ Backend

- Đặt `VITE_API_URL` ở cả admin và user.
- Backend: cấu hình `ALLOWED_ORIGINS` chứa đúng 2 origin của 2 site Netlify để API và Socket.IO hoạt động.

## 4) Kiểm thử nhanh

- Gọi `GET https://api.yourdomain.com/api/health` phải trả `{ ok: true }`.
- Mở admin at `https://admin.yourdomain.com` và quan sát log realtime (Socket.IO) hiển thị.
