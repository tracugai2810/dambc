# Blog Cá Nhân & Kho Lưu Trữ Nghiệm Lý — Bùi Công Đam

Website cá nhân lưu trữ thông tin giới thiệu, kho ảnh feedback thực chứng từ các hội nhóm và bài viết nghiệm lý cho hai mảng **Lục Hào** & **Tử Vi**.

## Kiến trúc Tách biệt Code (GitHub) & Dữ liệu (Botkeep Hosting)

- **GitHub (Lưu mã nguồn):** Chứa `server.js`, giao diện `public/` và file mẫu ban đầu `data/seed.json`.
- **Botkeep Hosting (Lưu dữ liệu thật):** Chứa `data/data.json` và toàn bộ ảnh feedback nén `.webp` trong `data/uploads/feedbacks/`.
- Nhờ tệp `.gitignore` đã loại trừ `data/data.json` và `data/uploads/feedbacks/*`, mỗi khi bạn cập nhật code giao diện trên GitHub và kéo (`git pull`) về Botkeep, **dữ liệu thật và ảnh của bạn trên Hosting tuyệt đối không bị mất hay ghi đè**.
- Không dùng thư viện ngoài (`node_modules` = 0 MB) nên tiết kiệm tối đa dung lượng ổ cứng `2 GB` của gói **Botkeep Founder Free**.

---

## Cấu trúc thư mục

```text
dambc/ (D:\Github-code-all\dambc)
├── server.js                 # Máy chủ Node.js thuần (không cần npm install)
├── package.json              # Khai báo lệnh start: node server.js
├── package-lock.json         # File lock cho Botkeep nhận diện Node.js
├── .gitignore                # Bảo vệ data thật khỏi bị Git ghi đè
├── .env.example              # Mẫu biến môi trường (PORT, ADMIN_PASSWORD)
├── public/
│   ├── index.html            # Trang chủ (Hồ sơ, Lọc Lục Hào/Tử Vi, Masonry Feedback, Lightbox)
│   ├── admin.html            # Trang quản trị (/admin)
│   ├── css/styles.css        # Giao diện Đông Phương Tối Giản (Sáng/Tối)
│   ├── js/main.js            # Logic trang chủ
│   ├── js/admin.js           # Dán ảnh Ctrl+V, cọ che tên khách, nén WebP, Backup/Restore
│   └── demo/                 # Ảnh minh họa mẫu ban đầu
└── data/
    ├── seed.json             # Dữ liệu khởi tạo lần đầu
    └── uploads/feedbacks/    # Thư mục lưu toàn bộ ảnh feedback thật (.webp)
```

---

## Quy trình chạy & Triển khai từng bước

### Bước 1: Chạy thử trên máy tính cá nhân
1. Mở terminal tại `D:\Github-code-all\dambc`
2. Chạy lệnh:
   ```bash
   node server.js
   ```
3. Mở trình duyệt:
   - Trang chủ: `http://localhost:3000`
   - Trang quản trị: `http://localhost:3000/admin` (mật khẩu mặc định ở máy: `dambc123`).

### Bước 2: Đẩy mã nguồn lên GitHub (Dùng GitHub Desktop)
1. Mở phần mềm **GitHub Desktop**, chọn repository `dambc`.
2. Gõ nội dung tóm tắt ở ô Summary -> bấm **Commit to main** -> bấm **Push origin**.

### Bước 3: Triển khai lên Botkeep.cloud (Gói Founder Free)
1. Trong bảng điều khiển Botkeep (`botkeep.cloud`), tạo Server **Node.js**.
2. Chọn nguồn **GitHub**, điền Repository là `tracugai2810/dambc`, Branch là `main`.
3. Lệnh khởi chạy (Start Command): `npm start`.
4. Trong phần **Environment Variables** của Botkeep, thêm biến:
   - `ADMIN_PASSWORD` = `<mat-khau-manh-cua-rieng-ban>`
   - `AUTH_SECRET` = `<chuoi-ky-tu-ngau-nhien-dai>`
5. Bấm **Deploy server**.

### Bước 4: Quy trình sử dụng hằng ngày & Sao lưu an toàn
- **Đăng feedback mới:** Vào `/admin`, chụp màn hình trên Facebook/Zalo rồi ấn **`Ctrl + V`** (hoặc chọn ảnh từ điện thoại), dùng **Cọ che tên khách** nếu muốn giấu danh tính, hệ thống tự nén sang `.webp` (~60–100KB) và lưu vào `data/uploads/feedbacks/`.
- **Nếu tự chép nhiều ảnh vào thư mục `data/uploads/feedbacks/`:** Vào `/admin` -> tab **Quản lý Feedback** -> bấm **"Quét thư mục uploads/feedbacks"**.
- **Sao lưu định kỳ về máy tính:** Vào `/admin` -> tab **Hồ sơ & Sao lưu** -> bấm **"Tải Gói Sao Lưu Toàn Bộ (.json)"** để lưu cả dữ liệu lẫn toàn bộ ảnh về ổ `D:\dambc`.
