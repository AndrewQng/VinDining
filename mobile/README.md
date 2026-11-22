# VinDining Mobile (Hybrid — Capacitor)

Thư mục này đóng gói trực tiếp giao diện React (`../frontend/dist`) thành ứng dụng **Android (`.apk`)** bằng **Capacitor** mà không cần sửa hay viết lại UI.

## Cách hoạt động của Hybrid (Capacitor)
1. `frontend` được build ra file tĩnh (`frontend/dist`).
2. `npx cap sync android` sao chép `frontend/dist` vào `mobile/android/app/src/main/assets/public/`.
3. Ứng dụng Android mở một WebView nội bộ (origin `http://localhost`) nạp trực tiếp gói giao diện đó, đồng thời cho phép gắn plugin native (Camera quét QR, in nhiệt Bluetooth, Push Notification...).

## Cấu hình kết nối Backend
Build `frontend` với biến môi trường trỏ về IP LAN máy chạy Backend (hoặc domain HTTPS):
```powershell
$env:VITE_API_URL="http://192.168.10.103:5159/api"
$env:VITE_SIGNALR_URL="http://192.168.10.103:5159/hubs"
npm --prefix ../frontend run build
npx cap sync android
```
*(Nếu chạy trên Android Emulator dùng `10.0.2.2:5159` thay cho IP LAN.)*

## Xuất file `.apk`
1. Cài **Android Studio** (có sẵn JDK & Android SDK).
2. Chạy `npm run open:android` trong thư mục `mobile/` (hoặc mở trực tiếp thư mục `mobile/android` trong Android Studio).
3. Chọn **Build → Build Bundle(s) / APK(s) → Build APK(s)** để lấy file `.apk` cài lên điện thoại.
