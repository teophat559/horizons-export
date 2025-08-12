# VPS Deployment Quick Start

Đây là hướng dẫn nhanh để deploy ứng dụng Horizons Export lên VPS của bạn.

## Yêu cầu

- VPS Ubuntu 20.04+ với quyền root/sudo
- Domain name (tùy chọn, nhưng khuyến khích)
- SSH access tới VPS

## Các bước deploy

### 1. Chuẩn bị VPS

```bash
# Thiết lập VPS với tất cả dependencies cần thiết
npm run setup:vps -- --host=IP_VPS_CUA_BAN --domain=domain_cua_ban.com

# Ví dụ:
npm run setup:vps -- --host=192.168.1.100 --domain=mysite.com
```

### 2. Cấu hình environment

SSH vào VPS và cấu hình file environment:

```bash
ssh root@IP_VPS_CUA_BAN
cd /opt/horizons-backend
cp .env.template .env
nano .env  # Chỉnh sửa các giá trị cần thiết
```

Cập nhật những giá trị quan trọng:
- `JWT_SECRET` - Đổi thành chuỗi bảo mật
- `ADMIN_KEY` - Đổi thành khóa admin bảo mật  
- `DATABASE_URL` - Cập nhật mật khẩu database
- `ALLOWED_ORIGINS` - Cập nhật domain của bạn

### 3. Deploy ứng dụng

```bash
# Deploy cả admin và user interface
npm run deploy:vps:full -- --host=IP_VPS_CUA_BAN

# Hoặc deploy từng phần
npm run deploy:vps:admin -- --host=IP_VPS_CUA_BAN
npm run deploy:vps:user -- --host=IP_VPS_CUA_BAN
```

### 4. Kiểm tra deployment

```bash
# Xác minh mọi thứ hoạt động chính xác
npm run verify:vps -- --host=IP_VPS_CUA_BAN --domain=domain_cua_ban.com
```

## Sử dụng environment variables

Để tránh phải gõ đi gõ lại, bạn có thể set environment variables:

```bash
export VPS_HOST="192.168.1.100"
export VPS_DOMAIN="mysite.com"
export VPS_USER="root"

# Sau đó chỉ cần chạy:
npm run deploy:vps:full
npm run verify:vps
```

## Truy cập ứng dụng

Sau khi deploy thành công:

- **Giao diện người dùng**: `https://domain_cua_ban.com/`
- **Giao diện admin**: `https://domain_cua_ban.com/admin/`
- **API endpoint**: `https://domain_cua_ban.com/api/health`

## Troubleshooting

Nếu gặp lỗi, kiểm tra:

1. **SSH connection**: Đảm bảo có thể SSH vào VPS
2. **Domain DNS**: Đảm bảo domain trỏ đúng IP VPS
3. **Firewall**: Đảm bảo port 80, 443, 22 được mở
4. **Services**: Kiểm tra nginx, postgresql, pm2 đang chạy

```bash
# SSH vào VPS và kiểm tra:
systemctl status nginx postgresql
pm2 status
pm2 logs horizons-backend
```

## Cập nhật ứng dụng

Để cập nhật ứng dụng sau khi có thay đổi:

```bash
# Pull code mới từ git
git pull origin main

# Deploy lại
npm run deploy:vps:full -- --host=IP_VPS_CUA_BAN
```

## Thông tin thêm

Xem [VPS_DEPLOYMENT.md](docs/VPS_DEPLOYMENT.md) để có hướng dẫn chi tiết hơn.