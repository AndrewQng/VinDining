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
npm run e2e
```

## Đường dẫn thử nghiệm Khách hàng (chế độ Mock)

- **Trang chủ (G0):** `/`
- **Đặt bàn & cọc (G1):** `/dat-ban` (hỗ trợ `?set=set-thuong-hang` và `?zone=VIP`)
- **Tra cứu & hủy đặt bàn (G2):** `/tra-cuu` — mã mẫu `VD-7K3Q`, SĐT `0901 234 567` (bàn B05, < 4 tiếng)
- **QR E-Menu tại bàn (G3):**
  - Bàn đang phục vụ (hợp lệ): `/menu/VD-QR-B03` (Bàn B03), `/menu/VD-QR-B08` (Bàn B08)
  - Bàn đã đặt chưa check-in (trạng thái chờ): `/menu/VD-QR-B05` (Bàn B05 — hoạt động sau khi check-in `VD-7K3Q`)
  - Bàn khác theo quy ước `/menu/VD-QR-<MÃ_BÀN>` (`B01`–`B08`, `V01`–`V03`, `C01`–`C04`)
- **Đánh giá dịch vụ (G4):** `/danh-gia/survey-demo-b01` (token hợp lệ chưa gửi)
- **KDS Bếp (K1) & Quầy Pass (E1):**
  - KDS Bếp (không cần đăng nhập): `/kds`
  - Chế độ nhiều ticket mẫu (Mock, kiểm thử phân trang `Trang 1 / 2` và cảnh báo SLA): `/kds?demo=full` và `/dieu-phoi?demo=full`

## Tài khoản demo (chế độ Mock)

Nguồn dữ liệu duy nhất: `src/services/mock/seed.ts` (`DEMO_STAFF_ACCOUNTS`).

| Họ tên | Vai trò | Tên đăng nhập | Mật khẩu | Điều hướng sau đăng nhập |
| :--- | :--- | :--- | :--- | :--- |
| Trần Thị Mai | Phục vụ (`Waitstaff`) | `mai.tt` | `VinDining@2026` | `/phuc-vu` |
| Lê Minh Quân | Điều phối (`Expediter`) | `quan.lm` | `VinDining@2026` | `/dieu-phoi` |
| Phạm Thu Hà | Thu ngân (`Cashier`) | `ha.pt` | `VinDining@2026` | `/thu-ngan` |
| Đỗ Hoàng Long | Quản lý (`Manager`) | `long.dh` | `VinDining@2026` | `/quan-ly` |

Trong chế độ Mock, đường dẫn `/dev/ui` hiển thị thư viện thành phần giao diện và toàn bộ huy hiệu trạng thái trên cả hai giao diện tối và sáng.
