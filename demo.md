# Kịch Bản Demo & Thuyết Trình Hệ Thống VinDining (10–15 Phút)

Kịch bản chạy trực tiếp trên **Backend ASP.NET Core (.NET 9) + Microsoft SQL Server + SignalR + Frontend React** (dữ liệu thật, không dùng Mock).

---

## 0. Chuẩn Bị Trước Giờ Demo (2 phút)

1. Khởi chạy Backend và Frontend:
   - Terminal 1: `cd backend\src\API` rồi `dotnet run` (API tại `http://localhost:5159`, Swagger tại `http://localhost:5159/swagger`).
   - Terminal 2: `npm run dev` (Frontend tại `http://localhost:5173`).
2. Mở sẵn 3 cửa sổ / profile trình duyệt để tránh đăng xuất – đăng nhập lặp lại:
   - Cửa sổ 1 (khách + quản trị): tab 1 mở `/` (Khách hàng), tab 2 mở `/kds` (Màn hình bếp — không cần đăng nhập), tab 3 mở `/dang-nhap` để đăng nhập `ha.pt` / `long.dh`.
   - Cửa sổ 2 (ẩn danh hoặc profile 2): đăng nhập sẵn `mai.tt` (Phục vụ — `/phuc-vu`), thu hẹp khung ngang như màn hình điện thoại/tablet.
   - Cửa sổ 3 (profile 3): đăng nhập sẵn `quan.lm` (Điều phối viên — `/dieu-phoi`).
3. Bảng tài khoản đăng nhập (mật khẩu chung `VinDining@2026`):

| Username | Vai trò | Màn hình chính |
| :--- | :--- | :--- |
| `mai.tt` | Waitstaff (Phục vụ) | `/phuc-vu` |
| `quan.lm` | Expediter (Điều phối viên quầy Pass) | `/dieu-phoi` |
| `ha.pt` | Cashier (Thu ngân) | `/thu-ngan` |
| `long.dh` | Admin / Manager (Quản lý) | `/quan-ly` |

---

## 1. Mở Đầu & Kiến Trúc Tổng Thể (0:00 – 1:30)

- Giới thiệu bài toán: vận hành nhà hàng Fine Dining khép kín từ đặt bàn có cọc, check-in, gọi món theo lượt (Course Firing), điều phối bếp – quầy Pass theo thời gian thực đến thanh toán cấn trừ cọc và báo cáo quản trị.
- Nêu nhanh kiến trúc kỹ thuật:
  - Backend ASP.NET Core (.NET 9) theo mô hình MVC + RESTful API + Entity Framework Core 9 + SQL Server.
  - Real-time với 2 SignalR Hub tách biệt (`TableHub` cho sơ đồ bàn/thu ngân và `KitchenHub` cho bếp/quầy Pass).
  - Frontend React + TypeScript + Tailwind CSS, đóng gói thêm ứng dụng Android Hybrid bằng Capacitor (`mobile/`).
- Mở lướt `http://localhost:5159/swagger` (5–10 giây) để chứng minh toàn bộ API là thật.

---

## 2. Luồng Khách Hàng — Đặt Bàn, Cọc VNPAY & QR E-Menu (1:30 – 4:00)

1. Mở trang chủ `/` giới thiệu nhanh không gian, Set Menu và thực đơn A La Carte (khách không cần đăng ký tài khoản — Zero Onboarding).
2. Bấm **Đặt bàn** (`/dat-ban`):
   - Chọn ngày hôm nay, khung giờ sắp tới, số lượng khách (ví dụ 4 khách), khu vực **Sảnh chính**, chọn bàn `B03`.
   - Có thể chọn kèm Set Menu hoặc đặt bàn tiêu chuẩn (cọc `500.000đ/khách`).
   - Nhập họ tên, số điện thoại, email rồi bấm xác nhận.
3. Trên trang `/thanh-toan/vnpay/:code`:
   - Chỉ cho hội đồng thấy lúc này hệ thống đã khóa bàn `B03` sang trạng thái giữ chỗ chờ thanh toán (`LockedForPayment`) trong **17 phút** (15 phút thanh toán + 2 phút đệm) để chống đặt trùng.
   - Bấm xác nhận thanh toán thành công (gọi thật `POST /api/payments/vnpay-ipn`) → hệ thống trả về mã đặt bàn `VD-...`.
4. Vào `/tra-cuu`, nhập mã `VD-...` để chứng minh đơn đã chuyển trạng thái **Đã xác nhận** kèm số tiền cọc đã ghi nhận trong SQL Server.
5. Mở nhanh `/menu/VD-QR-B03` để giới thiệu QR E-Menu tại bàn (chỉ xem thực đơn trên điện thoại, việc gọi món chuẩn Fine Dining do nhân viên phục vụ thao tác trên POS).

---

## 3. Luồng Phục Vụ (Waitstaff) — Check-in & Course Firing (4:00 – 7:00)

1. Chuyển sang cửa sổ `mai.tt` (`/phuc-vu`), chỉ bàn `B03` đã tự cập nhật trạng thái đặt trước qua SignalR.
2. Vào `/phuc-vu/check-in`, tìm mã đặt bàn `VD-...` vừa tạo và bấm **Check-in** → bàn `B03` chuyển sang **Đang phục vụ** (`Occupied`).
3. Mở chi tiết bàn `B03` → **Tạo Order**:
   - Chọn 1 món khai vị (Appetizer), 1 món chính (Main Course) và 1 món tráng miệng (Dessert) kèm ghi chú chế biến.
   - Bấm gửi đơn: món khai vị (Course 1) được bắn ngay xuống bếp (`Preparing`), món chính và tráng miệng giữ ở trạng thái chờ (`Hold`) đúng quy trình **Course Firing**.
4. Thao tác nhanh **Gọi thêm món** (bổ sung thêm 1 món vào đơn đang mở) và giới thiệu tính năng **Đổi bàn** (`/phuc-vu/doi-ban/:tableId` — khóa đồng thời cả bàn nguồn và bàn đích chống deadlock).

---

## 4. Luồng Bếp (KDS) & Quầy Pass (Expediter) Real-time (7:00 – 9:30)

1. Đặt cạnh nhau (hoặc chuyển nhanh) giữa tab `/kds` và cửa sổ `quan.lm` (`/dieu-phoi`):
   - Trên `/kds`: chỉ phiếu món Course 1 của bàn `B03` vừa nhảy lên màn hình bếp theo thời gian thực cùng thanh đếm thời gian chế biến (SLA).
   - Trên `/dieu-phoi`: Expediter thấy ngay phiếu món tương ứng tại quầy Pass.
2. Demo tình huống kiểm soát chất lượng Fine Dining:
   - Bấm **Yêu cầu làm lại** (Remake) 1 món và nhập lý do → phiếu trên `/kds` lập tức nhảy sang làn ưu tiên **Làm lại** có nhãn cảnh báo.
   - Sau đó bấm **Xác nhận đi món** (Served) → món biến mất khỏi hàng đợi đang nấu và chuyển sang tab **Lịch sử**.
3. Quay lại cửa sổ Waitstaff (`mai.tt`), vào đơn bàn `B03` bấm **Bắn lượt tiếp theo (Fire Course 2)** → chỉ cho hội đồng thấy món chính đang `Hold` lập tức bắn xuống `/kds` và `/dieu-phoi`.
4. Trên `/dieu-phoi`, bấm **Xác nhận đi món** cho toàn bộ món còn lại để sẵn sàng thanh toán.

---

## 5. Luồng Thu Ngân (Cashier) — Tạm Tính, Cấn Trừ Cọc & Quyết Toán (9:30 – 11:30)

1. Từ Waitstaff bấm yêu cầu thanh toán cho bàn `B03` (bàn chuyển `PaymentPending`), hoặc đăng nhập `ha.pt` vào `/thu-ngan` chọn bàn `B03`.
2. Mở màn hình tạm tính (`/thu-ngan/tam-tinh/:tableId`) và chỉ rõ 4 dòng tiền tính tự động ở Backend:
   - Tạm tính món ăn (`Subtotal`).
   - Phí dịch vụ **5%** (`ServiceCharge`).
   - Thuế VAT **10%** (`VatAmount`).
   - **Cấn trừ tiền cọc** đúng bằng số tiền khách đã đóng ở bước 2 → ra số tiền thực thu còn lại (`AmountDue`).
3. Chọn phương thức thanh toán, bấm **Xác nhận thanh toán** và xem mẫu phiếu in nhiệt 80mm.
4. Vào `/thu-ngan/hoa-don` để kiểm tra hóa đơn vừa quyết toán đã lưu vào SQL Server, đồng thời bàn `B03` trên sơ đồ chuyển sang **Đang dọn dẹp** (`Cleaning`).
5. Nếu còn thời gian (~20 giây), mở đường link khảo sát `/danh-gia/:token` từ hóa đơn để gửi đánh giá sau bữa ăn.

---

## 6. Luồng Quản Lý (Manager) — Vận Hành & Báo Cáo (11:30 – 13:30)

Đăng nhập `long.dh` vào `/quan-ly` và lướt nhanh các phân hệ quản trị:

1. Thực đơn (`/quan-ly`): bật/tắt trạng thái còn món – hết món (đồng bộ trực tiếp với POS gọi món).
2. Sơ đồ bàn (`/quan-ly/so-do-ban`): kéo thả / quản lý sức chứa và khu vực bàn ăn.
3. Hoàn cọc ngoại lệ (`/quan-ly/hoan-coc`): giải thích quy trình hủy bàn sát giờ/bất khả kháng cần Manager duyệt có lưu vết.
4. Nhân sự (`/quan-ly/tai-khoan`): phân quyền 4 vai trò nội bộ, khóa/mở khóa tài khoản.
5. Báo cáo doanh thu (`/quan-ly/bao-cao`): chỉ doanh thu vừa tăng đúng bằng hóa đơn bàn `B03` mới thanh toán ở bước 5 và xuất file Excel.

---

## 7. Chốt Kỹ Thuật & Trả Lời Câu Hỏi Phản Biện (13:30 – 15:00)

Tóm tắt nhanh 3 điểm kỹ thuật nổi bật nếu hội đồng hỏi sâu (chi tiết xem thêm tại `docs/CONCURRENCY_AND_LOCKING.md`):

1. **Chống đặt trùng bàn (Concurrency Control)**:
   - Pessimistic Lock tầng ứng dụng bằng `ConcurrentDictionary<Guid, SemaphoreSlim(1, 1)>` theo từng `TableId` (`TableConcurrencyLock.cs`), sắp xếp danh sách `TableId` tăng dần khi khóa nhiều bàn để chống Deadlock.
   - Soft Lock giữ chỗ `LockedForPayment` trong 17 phút, có Background Worker (`ExpiredReservationLockService`) tự quét hủy đơn quá hạn và giải phóng bàn.
   - Optimistic Concurrency tầng EF Core (`.IsConcurrencyToken()` + `DbUpdateConcurrencyException`).
2. **Kiến trúc Real-time & Đa nền tảng**:
   - Tách riêng `TableHub` và `KitchenHub` để cô lập lưu lượng sự kiện giữa khu vực phục vụ và khu vực bếp.
   - Tái sử dụng cùng một codebase React đóng gói sang Android Hybrid qua Capacitor (`mobile/`).
3. **Bảo mật & Toàn vẹn dữ liệu**:
   - JWT Bearer + RBAC theo vai trò, tự động khóa tạm tài khoản khi đăng nhập sai nhiều lần (`423 Locked`), bí mật cấu hình tách ra file `.env` không commit lên Git.
