# VinDining Frontend

Ứng dụng web cho hệ thống đặt bàn và vận hành nhà hàng VinDining (React 19, TypeScript, Vite, Tailwind CSS v4), phục vụ Khách hàng (`/`), Phục vụ (`/phuc-vu`), Điều phối Pass (`/dieu-phoi`), KDS Bếp (`/kds`), Thu ngân (`/thu-ngan`) và Quản lý (`/quan-ly`).

## Cài đặt & chạy nhanh

```bash
cd frontend
npm ci
npm run dev
```

Mặc định môi trường phát triển chạy chế độ Mock (`VITE_USE_MOCK=true`), không cần backend.

## Chế độ Mock vs Backend thật

Mặc định `frontend/.env.development` đặt `VITE_USE_MOCK=true` để `npm run dev` chạy ở chế độ Demo/Mock. Để chuyển sang Backend thật (opt-in), tạo file không theo dõi bởi Git `frontend/.env.development.local` chứa `VITE_USE_MOCK=false` (`*.local` đã nằm trong `.gitignore`; tham khảo các biến khác tại `.env.example`):

| Biến | Mặc định (`.env.example`) | Ý nghĩa |
| :--- | :--- | :--- |
| `VITE_USE_MOCK` | `true` | `true`: bật Mock API (`axios` adapter, lưu state vận hành tại `localStorage` `vd-mock-db`, đồng bộ nhiều tab qua `BroadcastChannel('vd-realtime')`). Đặt `false` để gọi backend thật. |
| `VITE_API_URL` | `http://localhost:5159/api` | Base URL của REST API backend khi `VITE_USE_MOCK=false`. |
| `VITE_SIGNALR_URL` | `http://localhost:5159/hubs` | URL SignalR Hub khi `VITE_USE_MOCK=false`. |

## Scripts (`package.json`)

- `npm run dev`: chạy Vite dev server.
- `npm run build`: kiểm tra TypeScript (`tsc -b`) và đóng gói production (`vite build`).
- `npm run lint`: chạy `oxlint` trên toàn bộ mã nguồn.
- `npm test`: chạy toàn bộ unit và component tests với Vitest (`vitest run`).
- `npm run e2e`: chạy bộ kiểm thử Playwright E2E (bao gồm `a11y` `@axe-core/playwright` và `responsive` sweep). Đặt `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` nếu trình duyệt đã cài sẵn trên máy.
- `npm run preview`: xem trước bản build production.

## Tài khoản demo (Mock mode)

Định nghĩa tại `src/services/mock/seed.ts` (`DEMO_STAFF_ACCOUNTS`), mật khẩu chung: `VinDining@2026`.

| Họ tên | Vai trò | Tên đăng nhập | Route sau đăng nhập |
| :--- | :--- | :--- | :--- |
| Trần Thị Mai | Phục vụ (`Waitstaff`) | `mai.tt` | `/phuc-vu` |
| Lê Minh Quân | Điều phối (`Expediter`) | `quan.lm` | `/dieu-phoi` |
| Phạm Thu Hà | Thu ngân (`Cashier`) | `ha.pt` | `/thu-ngan` |
| Đỗ Hoàng Long | Quản lý (`Manager`) | `long.dh` | `/quan-ly` |

## Đường dẫn thử nghiệm nhanh

- **Khách hàng:** `/` (Trang chủ G0), `/dat-ban` (G1, hỗ trợ `?set=set-thuong-hang` hoặc `?zone=VIP`), `/tra-cuu` (G2 — thử `VD-7K3Q`, SĐT `0901 234 567`), `/danh-gia/survey-demo-b01` (G4 hợp lệ chưa gửi).
- **QR tại bàn (G3):** `/menu/VD-QR-B03` (B03 đang phục vụ), `/menu/VD-QR-B08` (B08 đang phục vụ), `/menu/VD-QR-B05` (hợp lệ sau khi check-in `VD-7K3Q`); quy ước `/menu/VD-QR-<MÃ_BÀN>` cho `B01`–`B08`, `V01`–`V03`, `C01`–`C04`.
- **Bếp & Quầy Pass nhiều ticket mẫu:** `/kds`, `/kds?demo=full`, `/dieu-phoi?demo=full`.
- **Thư viện UI (chỉ ở Mock mode):** `/dev/ui`.
- **Khôi phục dữ liệu demo:** mở `/dang-nhap` (chế độ Mock) và nhấn **"Khôi phục dữ liệu demo"** ở cuối trang để đặt lại `vd-mock-db` về trạng thái chuẩn §10.

## Cấu trúc thư mục (`src/`)

- `types/` — các kiểu DTO chuẩn hóa cho API và domain.
- `domain/` — quy tắc nghiệp vụ thuần TypeScript (không phụ thuộc React/DOM).
- `services/api/` — cấu hình `axios` client và các hàm gọi API theo phân hệ.
- `services/mock/` — Mock API adapter (59 routes), `db.ts`, `seed.ts`, bộ sinh lịch sử 120 ngày `historicalSeed.ts` và `backgroundJobs.ts`.
- `services/realtime/` — `BroadcastChannel` (`mockRealtimeClient.ts`), `@microsoft/signalr` (`signalrRealtimeClient.ts`) và hook `useRealtime`.
- `components/` — UI primitives theo design tokens (`ui/`), `auth/ProtectedRoute.tsx` và `ReceiptSlip80mm.tsx`.
- `layouts/` — 5 layout theo vai trò/thiết bị (`GuestLayout`, `StaffMobileLayout`, `StaffTabletLayout`, `StaffDesktopLayout`, `WallLayout`).
- `pages/` — các màn hình theo vai trò (`guest/`, `staff/`, `kds/`, `LoginPage.tsx`, `dev/UiGalleryPage.tsx`).
- `stores/` — Zustand stores (`useAuthStore`, `useThemeStore`, `useToastStore`, `useWaitstaffNotificationsStore`).

## Routes mở rộng đã đồng bộ với Backend & `docs/api.md`

Theo `docs/prototype/OPEN_QUESTIONS.md`, các route trước đây chỉ có ở Mock nay đã được Backend phục vụ và cập nhật trong `docs/api.md`:

- **#10 — `GET /api/menu/tasting-menus`:** cho phép khách truy cập danh sách Set Menu công khai trên G0/G1/G3.
- **#11 — `GET /api/reservations?search=...` (cho phép `Waitstaff`):** phục vụ tra cứu nhanh khi check-in tại bàn ở W2 bên cạnh Thu ngân/Quản lý.
- **#16 — `GET /api/orders/pass/history` (`Expediter`, `Manager`):** trả về lịch sử ra món trong ngày tại quầy Pass (E2).

## Quy tắc nghiệp vụ trong `src/domain/`

- `deposit.ts`, `cancellation.ts`, `hold.ts`: tính tiền cọc (30% Set Menu hoặc 500.000 ₫/khách; walk-in 0 ₫), hoàn 100% khi hủy >= 4 tiếng trước giờ hẹn, giữ chỗ 17 phút.
- `slotAvailability.ts`: kiểm tra trùng khung 120 phút và tình trạng bàn theo giờ đặt.
- `courseFiring.ts`: bắn món tuần tự Course 1 -> 2 -> 3 (`Beverage` đi cùng Course 1) và gán trạng thái món gọi thêm theo trạng thái Course hiện tại.
- `kitchenTickets.ts`, `sla.ts`: gom phiếu KDS theo Course (hạn SLA = max `PrepTimeMinutes` của Course, cảnh báo từ 80% và quá hạn >100%), phân trang KDS.
- `invoice.ts`: tạm tính chỉ tính các món đã `Served`, tách Set Menu theo đơn giá món lẻ khi chưa phục vụ hết, phí phục vụ 5%, VAT 10%, trừ cọc không hoàn phần dư (`amountDue >= 0`), `formatInvoiceCode(id)`.
- `reports.ts`, `manager.ts`: `calculateSeatingsPerTablePerEvening` (2 lượt/bàn/tối từ khung 18:00–20:00 và `DurationMinutes=120`), `calculateOccupancyRate`, `calculateCancellationRate`, kiểm tra Set Menu đủ 3 Course, tọa độ sơ đồ bàn và chặn Quản lý tự khóa/tự hạ quyền.
- `loginLock.ts`, `datetime.ts`, `money.ts`, `labels.ts`: khóa tài khoản 15 phút sau 5 lần đăng nhập sai, định dạng ngày giờ/tiền tệ Việt Nam và nhãn trạng thái.
