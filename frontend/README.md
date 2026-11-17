# VinDining Frontend

Ứng dụng React + TypeScript + Vite + Tailwind CSS v4 cho hệ thống quản lý và đặt bàn nhà hàng VinDining.

## Chạy ở chế độ Mock (mặc định khi phát triển)

File `.env.development` bật sẵn `VITE_USE_MOCK=true`, sử dụng dữ liệu mẫu lưu trong `localStorage` (`vd-mock-db`) và đồng bộ thời gian thực giữa các tab qua `BroadcastChannel('vd-realtime')`.

```bash
npm install
npm run dev
```

Để kết nối backend thật, đặt `VITE_USE_MOCK=false` và cấu hình `VITE_API_URL` + `VITE_SIGNALR_URL` theo `.env.example`.

## Kiểm tra chất lượng

```bash
npm run build
npm run lint
npm test
```

## Tài khoản demo (chế độ Mock)

Nguồn dữ liệu duy nhất: `src/services/mock/seed.ts` (`DEMO_STAFF_ACCOUNTS`).

| Họ tên | Vai trò | Tên đăng nhập | Mật khẩu | Điều hướng sau đăng nhập |
| :--- | :--- | :--- | :--- | :--- |
| Trần Thị Mai | Phục vụ (`Waitstaff`) | `mai.tt` | `VinDining@2026` | `/phuc-vu` |
| Lê Minh Quân | Điều phối (`Expediter`) | `quan.lm` | `VinDining@2026` | `/dieu-phoi` |
| Phạm Thu Hà | Thu ngân (`Cashier`) | `ha.pt` | `VinDining@2026` | `/thu-ngan` |
| Đỗ Hoàng Long | Quản lý (`Manager`) | `long.dh` | `VinDining@2026` | `/quan-ly` |

Trong chế độ Mock, đường dẫn `/dev/ui` hiển thị thư viện thành phần giao diện và toàn bộ huy hiệu trạng thái trên cả hai giao diện tối và sáng.
