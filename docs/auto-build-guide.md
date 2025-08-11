# Hướng Dẫn Tự Động Build

Dự án này đã được thiết lập với hệ thống tự động build mạnh mẽ, cho phép bạn build, watch và deploy một cách dễ dàng.

## 🚀 Các Script Build Cơ Bản

### Build Một Lần
```bash
# Build thông thường
npm run build

# Build admin version
npm run build:admin

# Build user version
npm run build:user
```

### Build Với Watch Mode
```bash
# Watch mode thông thường
npm run build:watch

# Watch mode cho admin
npm run build:admin:watch

# Watch mode cho user
npm run build:user:watch
```

## 🔥 Script Tự Động Build Nâng Cao

### Sử Dụng Node.js Script (Cross-platform)
```bash
# Build một lần
npm run auto:build

# Build admin với watch
npm run auto:build:admin:watch

# Build user với watch
npm run auto:build:user:watch

# Build admin và deploy
npm run auto:build:admin:deploy

# Build user và deploy
npm run auto:build:user:deploy

# Build admin với watch và deploy
npm run auto:build:admin:watch:deploy
```

### Sử Dụng Script Trực Tiếp

#### Windows (CMD)
```cmd
# Build một lần
scripts\auto-build.cmd

# Build admin với watch
scripts\auto-build.cmd --admin --watch

# Build user và deploy
scripts\auto-build.cmd --user --deploy

# Xem help
scripts\auto-build.cmd --help
```

#### Unix/Linux/macOS (Bash)
```bash
# Làm cho script có thể thực thi
chmod +x scripts/auto-build.sh

# Build một lần
./scripts/auto-build.sh

# Build admin với watch
./scripts/auto-build.sh --admin --watch

# Build user và deploy
./scripts/auto-build.sh --user --deploy

# Xem help
./scripts/auto-build.sh --help
```

## 🎯 Các Tùy Chọn Có Sẵn

| Tùy Chọn | Mô Tả |
|----------|-------|
| `--admin` | Build phiên bản admin |
| `--user` | Build phiên bản user |
| `--watch` | Watch file changes và tự động rebuild |
| `--clean` | Clean trước khi build (chỉ admin) |
| `--deploy` | Deploy lên Netlify sau khi build |
| `--help` hoặc `-h` | Hiển thị hướng dẫn sử dụng |

## 🔄 Chế Độ Watch

Chế độ watch sẽ theo dõi các thay đổi trong:
- `src/` - Source code
- `public/` - Public assets
- `index.html` - Entry point

Khi có file thay đổi, hệ thống sẽ tự động rebuild sau 1 giây (debounce).

## 🚀 Development với Auto Build

### Chạy Backend + Frontend + Auto Build
```bash
# Windows
npm run dev:all:auto

# Unix/Linux/macOS
npm run dev:all:auto
```

### Chạy Backend + Functions + Frontend + Auto Build
```bash
# Windows
npm run dev:all:morelogin:auto

# Unix/Linux/macOS
npm run dev:all:morelogin:auto
```

## 📁 Cấu Trúc Scripts

```
scripts/
├── auto-build.mjs          # Script Node.js chính (cross-platform)
├── auto-build.cmd          # Script Windows CMD
├── auto-build.sh           # Script Unix/Linux/macOS
└── ...                     # Các script khác
```

## 🎨 Tính Năng Đặc Biệt

### 1. **Preflight Checks**
- Kiểm tra dependencies
- Kiểm tra cấu hình
- Chạy trước mỗi build

### 2. **Admin Build Features**
- Clean admin build
- Purge legacy assets
- Verify admin assets
- Tối ưu hóa cho production

### 3. **User Build Features**
- Build cho user interface
- Tối ưu hóa cho user experience

### 4. **Deployment Integration**
- Tự động deploy lên Netlify
- Hỗ trợ cả admin và user builds

### 5. **Cross-Platform Support**
- Windows CMD
- Unix/Linux/macOS Bash
- Node.js (cross-platform)

## 🚨 Troubleshooting

### Lỗi Permission (Unix/Linux/macOS)
```bash
chmod +x scripts/auto-build.sh
```

### Lỗi Node.js Script
```bash
# Kiểm tra Node.js version
node --version

# Chạy với Node.js trực tiếp
node scripts/auto-build.mjs --help
```

### Lỗi Build
```bash
# Chạy preflight checks
npm run preflight

# Clean và rebuild
npm run clean:admin
npm run build:admin
```

### Lỗi Deploy
```bash
# Kiểm tra Netlify CLI
netlify --version

# Cài đặt Netlify CLI nếu chưa có
npm install -g netlify-cli

# Kiểm tra build trước khi deploy
npm run build:admin  # hoặc build:user
```

### Quick Test
```bash
# Test nhanh các script cơ bản
npm run quick-test

# Test toàn bộ hệ thống
npm run test:auto-build
```

## 🔧 Sửa Lỗi Thường Gặp

### 1. **Script "build:user" không tồn tại**
```bash
# Script đã được thêm vào package.json
npm run build:user
```

### 2. **Script "deploy:netlify:admin" không hoạt động**
```bash
# Script đã được chuyển sang Node.js
npm run deploy:netlify:admin
```

### 3. **Lỗi "scripts is not recognized" trên Windows**
```bash
# Sử dụng Node.js script thay vì .cmd
node scripts/auto-build.mjs --admin --deploy
```

### 4. **Lỗi "user/dist directory not found"**
```bash
# Script sẽ tự động tạo thư mục
npm run auto:build:user:deploy
```

## 📝 Ví Dụ Sử Dụng Thực Tế

### 1. **Development Workflow**
```bash
# Terminal 1: Backend
npm run backend:dev

# Terminal 2: Frontend + Auto Build
npm run dev:all:auto
```

### 2. **Production Build**
```bash
# Build admin và deploy
npm run auto:build:admin:deploy

# Build user và deploy
npm run auto:build:user:deploy
```

### 3. **Continuous Development**
```bash
# Build admin với watch (không deploy)
npm run auto:build:admin:watch
```

## 🔧 Tùy Chỉnh

Bạn có thể tùy chỉnh các script bằng cách:
1. Sửa đổi `scripts/auto-build.mjs`
2. Thêm tùy chọn mới vào package.json
3. Tạo script riêng cho workflow cụ thể

## 📚 Tham Khảo

- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [Concurrently Package](https://www.npmjs.com/package/concurrently)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)
