# Torishin Revenue Sync

This project is a static frontend with an optional backend to sync daily revenue data across devices.

## Files

- `staff_daily.html` — staff daily revenue page.
- `api/sync.js` — Vercel serverless endpoint for sync.
- `server.js` — Node backend for Render/local use.
- `package.json` — start script for Node backend.
- `google_apps_script.gs` — legacy Google Sheets sync template (not required if using Render backend).

## Recommended deployment: Render

1. Create a new Render Web Service.
2. Connect your GitHub repo `torishin`.
3. Set the root directory to the repo root.
4. Set build command:
   ```bash
   npm install
   ```
5. Set start command:
   ```bash
   npm start
   ```
6. Deploy the service.
7. Copy the app URL, for example:
   ```text
   https://torishin-sync.onrender.com
   ```
8. Edit `staff_daily.html` and replace `<your-render-app>` with your app host:
   ```js
   const BACKEND_CONFIG = {
     url: 'https://torishin-sync.onrender.com/api/sync'
   };
   ```
9. Save and redeploy your frontend to GitHub Pages if needed.

## Local testing

Run the backend locally:
```bash
cd c:\torishin\torishin
npm start
```

Then open `staff_daily.html` locally and it will use `http://127.0.0.1:3000/api/sync`.

## How sync works

- `saveState()` writes to `localStorage` and also calls `saveToCloud()`.
- `saveToCloud()` POSTs the full state to the backend.
- `loadFromCloud()` GETs the latest saved state on page load and when the page becomes visible.

## Note

- GitHub Pages alone cannot sync data between browsers/devices because it only serves static files.
- Use the Render backend URL in `staff_daily.html` for real sync.

## Đặt bàn online (Google Maps)

- `booking.html` — trang cho khách đặt bàn (Tiếng Việt / 日本語 / English). Link công khai:
  `https://cungchiasetamtrangbuon-lang.github.io/torishin/booking.html`
- `booking_admin.html` — trang nhân viên xem / xác nhận / hủy đặt bàn (tự tải lại mỗi 30 giây, kêu "bíp" khi có đặt bàn mới). Có nút 📅 Đặt bàn trên trang quản lý chính.
- Dữ liệu lưu ở Firebase, nhánh `torishin_bookings`.

- `booking_email.gs` — (tùy chọn) Google Apps Script gửi email báo đặt bàn mới về Gmail của quán. Hướng dẫn cài ở đầu file; sau đó dán link Web App vào `EMAIL_WEBHOOK` trong `booking.html`.

Sửa địa chỉ, số điện thoại, giờ mở cửa, ngày nghỉ trong khối `SHOP` ở đầu phần `<script>` của `booking.html`.

### Gắn nút "Đặt bàn" lên Google Maps

1. Vào https://business.google.com (hoặc tìm "Torishin" trên Google khi đang đăng nhập tài khoản chủ quán).
2. Chọn **Chỉnh sửa hồ sơ** → **Đặt chỗ / Reservations** (hoặc mục **Đường liên kết** → **Đặt chỗ**).
3. Dán link `booking.html` ở trên → Lưu. Google duyệt xong, nút **Đặt bàn** sẽ hiện trên Google Maps.
