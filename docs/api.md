# VinDining — Danh mục API & Controller

## Bảng 1: Danh mục API Hệ thống

| STT | Phương thức | Endpoint (Route) | Chức năng / Nghiệp vụ | Quyền truy cập |
| :---: | :---: | :--- | :--- | :--- |
| 1 | `POST` | `/api/auth/login` | Đăng nhập tài khoản nhân viên & nhận JWT | Public |
| 2 | `GET` | `/api/auth/me` | Lấy thông tin tài khoản đang đăng nhập | Nhân viên |
| 3 | `POST` | `/api/auth/logout` | Đăng xuất & hủy phiên làm việc | Nhân viên |
| 4 | `POST` | `/api/reservations` | Đặt bàn trực tuyến & tạo link cọc VNPAY | Khách hàng |
| 5 | `POST` | `/api/payments/vnpay-ipn` | Tiếp nhận Webhook IPN xử lý cọc thành công | Cổng VNPAY |
| 6 | `POST` | `/api/reservations/cancel` | Hủy đặt bàn và tự động hoàn cọc theo mốc | Khách hàng |
| 7 | `GET` | `/api/reservations` | Tra cứu danh sách đặt bàn (`date`, `status`, `search`) | Phục vụ, Điều phối, Thu ngân, Quản lý |
| 8 | `GET` | `/api/reservations/{code}` | Xem chi tiết thông tin đơn đặt bàn | Khách hàng, Thu ngân |
| 9 | `GET` | `/api/reservations/available-slots` | Kiểm tra các khung giờ còn bàn trống | Public |
| 10 | `POST` | `/api/tables/{id}/check-in` | Check-in nhận bàn cho khách có đặt trước | Phục vụ, Thu ngân, Quản lý |
| 11 | `POST` | `/api/tables/{id}/walk-in` | Xếp bàn trực tiếp cho khách vãng lai | Phục vụ, Thu ngân, Quản lý |
| 12 | `POST` | `/api/tables/{sourceId}/transfer` | Điều chuyển bàn ăn sang bàn trống mới | Phục vụ, Quản lý |
| 13 | `GET` | `/api/tables` | Lấy sơ đồ bàn ăn và trạng thái thời gian thực | Toàn bộ nhân viên |
| 14 | `GET` | `/api/tables/{id}` | Xem chi tiết bàn ăn và đơn order hiện tại | Toàn bộ nhân viên |
| 15 | `PATCH` | `/api/tables/{id}/status` | Đổi trạng thái bàn (Dọn dẹp xong sang Trống) | Phục vụ, Thu ngân |
| 16 | `POST` | `/api/orders` | Tạo đơn gọi món mới theo từng Course | Phục vụ, Quản lý |
| 17 | `POST` | `/api/orders/{id}/fire-course` | Kích hoạt bếp nấu đợt món tiếp theo (Fire) | Phục vụ, Quản lý |
| 18 | `POST` | `/api/orders/{id}/items` | Gọi thêm món phát sinh vào đơn đang mở | Phục vụ, Quản lý |
| 19 | `PATCH` | `/api/orders/{id}/items/{itemId}/serve` | Xác nhận đi món (Served) tại quầy Pass (BR-03) | Điều phối, Quản lý |
| 20 | `POST` | `/api/orders/{id}/items/{itemId}/remake` | Yêu cầu bếp làm lại món không đạt (UC-E3, 2a) | Điều phối, Quản lý |
| 21 | `GET` | `/api/orders/table/{tableId}` | Lấy đơn order đang hoạt động của một bàn | Phục vụ, Thu ngân |
| 22 | `GET` | `/api/orders/{id}` | Lấy thông tin chi tiết một đơn order | Phục vụ, Thu ngân |
| 23 | `GET` | `/api/orders/kitchen/pending` | Lấy danh sách món đang chờ nấu trên KDS | KDS Bếp, Điều phối |
| 24 | `POST` | `/api/tables/{tableId}/request-checkout` | Gửi yêu cầu xin thanh toán từ bàn ăn | Phục vụ, Quản lý |
| 25 | `GET` | `/api/invoices/preview/{tableId}` | Xem trước hóa đơn, tự cấn trừ cọc & thuế | Thu ngân, Quản lý |
| 26 | `POST` | `/api/invoices/{tableId}/print-preview` | In phiếu tạm tính bàn ăn gửi khách xem | Thu ngân, Quản lý |
| 27 | `POST` | `/api/invoices/{tableId}/settle` | Quyết toán hóa đơn, đóng bàn & in biên lai | Thu ngân, Quản lý |
| 28 | `GET` | `/api/invoices/{id}` | Tra cứu chi tiết hóa đơn đã quyết toán | Thu ngân, Quản lý |
| 29 | `GET` | `/api/invoices` | Danh sách lịch sử hóa đơn trong ca | Thu ngân, Quản lý |
| 30 | `GET` | `/api/menu/table/{id}` | Khách quét mã QR xem thực đơn tại bàn | Khách hàng |
| 31 | `GET` | `/api/menu/categories` | Lấy danh mục nhóm món phục vụ hiển thị | Public |
| 32 | `GET` | `/api/menu/items/{id}` | Xem chi tiết thông tin món ăn | Public |
| 33 | `POST` | `/api/tables/{id}/call-service` | Khách gửi tín hiệu gọi nhân viên phục vụ | Khách hàng |
| 34 | `PATCH` | `/api/service-calls/{id}/complete` | Xác nhận đã hỗ trợ xong yêu cầu tại bàn | Phục vụ |
| 35 | `GET` | `/api/service-calls/active` | Danh sách yêu cầu phục vụ đang chờ xử lý | Phục vụ |
| 36 | `POST` | `/api/feedbacks` | Gửi phiếu đánh giá chất lượng trải nghiệm | Khách hàng |
| 37 | `GET` | `/api/manager/feedbacks` | Tra cứu danh sách phản hồi từ thực khách | Quản lý |
| 38 | `POST` | `/api/manager/menu-items` | Tạo mới món ăn A La Carte | Quản lý |
| 39 | `PUT` | `/api/manager/menu-items/{id}` | Chỉnh sửa thông tin món ăn A La Carte | Quản lý |
| 40 | `PATCH` | `/api/manager/menu-items/{id}/availability` | Bật/tắt trạng thái hết món tạm thời | Quản lý |
| 41 | `DELETE` | `/api/manager/menu-items/{id}` | Xóa món ăn khỏi danh mục phục vụ | Quản lý |
| 42 | `GET` | `/api/manager/menu-items` | Danh sách toàn bộ món ăn trong trang quản trị | Quản lý |
| 43 | `POST` | `/api/manager/tasting-menus` | Tạo Set Menu / Tasting Menu theo trình tự món | Quản lý |
| 44 | `PUT` | `/api/manager/tasting-menus/{id}` | Cập nhật thông tin Set Menu | Quản lý |
| 45 | `DELETE` | `/api/manager/tasting-menus/{id}` | Xóa Set Menu khỏi hệ thống | Quản lý |
| 46 | `GET` | `/api/manager/tasting-menus` | Danh sách toàn bộ Set Menu trong quản trị | Quản lý |
| 47 | `PUT` | `/api/manager/tables/layout` | Cập nhật tọa độ sơ đồ bàn ăn 2D | Quản lý |
| 48 | `POST` | `/api/manager/tables` | Tạo mới bàn ăn trong khu vực | Quản lý |
| 49 | `DELETE` | `/api/manager/tables/{id}` | Xóa bàn ăn khỏi sơ đồ | Quản lý |
| 50 | `POST` | `/api/manager/reservations/{id}/manual-refund` | Duyệt hoặc từ chối hoàn cọc thủ công (UC-A3) | Quản lý |
| 51 | `GET` | `/api/manager/refunds` | Lấy danh sách yêu cầu hoàn cọc chờ xử lý | Quản lý |
| 52 | `POST` | `/api/manager/staff` | Tạo mới tài khoản nhân viên nội bộ | Quản lý |
| 53 | `PUT` | `/api/manager/staff/{id}` | Cập nhật hồ sơ, phân quyền nhân viên | Quản lý |
| 54 | `POST` | `/api/manager/staff/{id}/reset-password` | Khởi tạo lại mật khẩu tài khoản | Quản lý |
| 55 | `PATCH` | `/api/manager/staff/{id}/status` | Khóa hoặc kích hoạt tài khoản nhân viên | Quản lý |
| 56 | `GET` | `/api/manager/staff` | Lấy danh sách tất cả nhân viên nội bộ | Quản lý |
| 57 | `GET` | `/api/manager/staff/{id}` | Xem chi tiết hồ sơ một nhân viên | Quản lý |
| 58 | `GET` | `/api/manager/reports/dashboard` | Thống kê số liệu doanh thu, tỷ lệ lấp đầy | Quản lý |
| 59 | `GET` | `/api/manager/reports/export` | Xuất dữ liệu báo cáo sang file Excel / PDF | Quản lý |
| 60 | `GET` | `/api/menu/tasting-menus` | Lấy danh sách Set Menu công khai (đặt bàn & E-Menu) | Public |
| 61 | `GET` | `/api/orders/pass/history` | Lịch sử các món đã xác nhận ra món trong ngày tại quầy Pass | Điều phối, Quản lý |
| 62 | `GET` | `/api/feedbacks/validate/{token}` | Kiểm tra tính hợp lệ của mã/token khảo sát trước khi đánh giá | Public |
| 63 | `POST` | `/api/auth/refresh-token` | Làm mới Access Token bằng Refresh Token | Public |
| 64 | `GET` | `/api/payments/vnpay-ipn` | Tiếp nhận callback IPN dạng query từ VNPAY (`vnpay-return` alias) | Cổng VNPAY |
| 65 | `POST` | `/api/reservations/confirm-deposit` | Xác nhận thủ công thanh toán cọc cho đơn giữ chỗ | Public |
| 66 | `PATCH` | `/api/reservations/{code}/cancel` | Hủy đặt bàn theo mã (alias của `POST /api/reservations/cancel`) | Khách hàng |
| 67 | `POST` | `/api/reservations/{code}/no-show` | Đánh dấu khách vắng mặt quá giờ giữ bàn | Phục vụ, Điều phối, Thu ngân, Quản lý |
| 68 | `POST` | `/api/tables/merge` | Gộp nhiều bàn thành một nhóm phục vụ | Phục vụ, Quản lý |
| 69 | `DELETE` | `/api/orders/{id}/items/{itemId}` | Hủy món chưa phục vụ trong đơn (`PATCH .../cancel` alias) | Phục vụ, Quản lý |
| 70 | `POST` | `/api/invoices/settle` | Quyết toán hóa đơn theo `OrderId` trong payload | Thu ngân, Quản lý |
| 71 | `POST` | `/api/service-calls` | Gửi yêu cầu phục vụ từ bàn ăn (alias của `/api/tables/{id}/call-service`) | Khách hàng |
| 72 | `GET` | `/api/feedbacks` | Danh sách phản hồi khách hàng (alias của `/api/manager/feedbacks`) | Quản lý |
| 73 | `POST` | `/api/manager/categories` | Tạo mới danh mục nhóm món | Quản lý |
| 74 | `GET` | `/api/manager/categories` | Lấy danh sách danh mục nhóm món trong quản trị | Quản lý |
| 75 | `PUT` | `/api/manager/tables/{id}` | Cập nhật thông tin bàn ăn (số bàn, sức chứa, khu vực, tọa độ) | Quản lý |
| 76 | `GET` | `/api/health` | Kiểm tra trạng thái sống của API và kết nối CSDL | Public |
| 77 | `POST` | `/api/testing/seed` | Khởi tạo dữ liệu mẫu kiểm thử (môi trường Dev/Test) | Public (Dev/Test) |
| 78 | `GET` | `/api/testing/overview` | Xem tổng quan dữ liệu kiểm thử hiện có | Public (Dev/Test) |

> **Lưu ý route alias:** Các endpoint quản trị `/api/manager/*` đồng thời hỗ trợ tiền tố `/api/admin/*`; `/api/reservations` hỗ trợ `/api/reservation`; `/api/reservations/available-slots` hỗ trợ `/api/reservations/available-tables`; `/api/orders` hỗ trợ `/api/order`; `/api/invoices` hỗ trợ `/api/invoice`; `POST /api/orders/{id}/items/{itemId}/remake` đồng thời hỗ trợ phương thức `PATCH`; `GET /api/payments/vnpay-ipn` đồng thời hỗ trợ `/api/payments/vnpay-return`.

---

## Bảng 2: Danh sách Controller & Các hàm (Action Methods)

| Tên Controller | Các hàm trong Controller (Action Methods) |
| :--- | :--- |
| `AuthController` | • `LoginAsync(LoginDto dto)`<br>• `RefreshTokenAsync(RefreshTokenDto dto)`<br>• `GetCurrentUserAsync()`<br>• `LogoutAsync()` |
| `ReservationController` | • `CreateReservationAsync(CreateReservationDto dto)`<br>• `ProcessVnPayIpnPostAsync()`<br>• `ProcessVnPayQueryCallbackAsync(VnPayIpnDto paramsDto)`<br>• `ConfirmDepositAsync(ConfirmDepositDto dto)`<br>• `CancelReservationAsync(CancelReservationDto dto)`<br>• `CancelReservationByCodeAsync(string code, CancelReservationBodyDto? body)`<br>• `MarkNoShowAsync(string code, NoShowReservationDto? dto)`<br>• `GetReservationsAsync(DateTime? date, string? status, string? search)`<br>• `GetReservationByCodeAsync(string code, string? phoneNumber, string? phone)`<br>• `GetAvailableTimeSlotsAsync(DateTime? reservationTime, string? date, int partySize, TableZone? zone)` |
| `TableController` | • `CheckInReservationAsync(Guid id, CheckInDto dto)`<br>• `CheckInWalkInAsync(Guid id, WalkInDto dto)`<br>• `TransferTableAsync(Guid sourceId, TransferTableDto dto)`<br>• `MergeTablesAsync(MergeTablesDto dto)`<br>• `GetFloorPlanAsync()`<br>• `GetTableByIdAsync(Guid id)`<br>• `UpdateTableStatusAsync(Guid id, UpdateTableStatusDto dto)` |
| `OrderController` | • `CreateOrderWithCoursesAsync(CreateOrderDto dto)`<br>• `FireNextCourseAsync(Guid id, FireCourseDto dto)`<br>• `AddOrderItemsAsync(Guid id, AddItemsDto itemsDto)`<br>• `ConfirmServedAsync(Guid id, Guid itemId)`<br>• `RequestRemakeAsync(Guid id, Guid itemId, RemakeItemDto? dto)`<br>• `GetActiveOrderByTableAsync(Guid tableId)`<br>• `GetOrderDetailsAsync(Guid id)`<br>• `CancelOrderItemAsync(Guid id, Guid itemId, CancelOrderItemDto? dto)`<br>• `GetKitchenPendingOrdersAsync()`<br>• `GetPassHistoryAsync(string? tableNumber)` |
| `InvoiceController` | • `RequestCheckoutAsync(Guid tableId)`<br>• `GetInvoicePreviewAsync(Guid tableId)`<br>• `PrintPreBillAsync(Guid tableId)`<br>• `SettleInvoiceByOrderAsync(SettleInvoiceDto dto)`<br>• `SettleInvoiceAsync(Guid tableId, SettleInvoiceDto dto)`<br>• `GetInvoiceByIdAsync(Guid id)`<br>• `GetInvoicesAsync(DateTime? date, string? paymentMethod)` |
| `MenuController` | • `GetTableMenuAsync(string id)`<br>• `GetCategoriesAsync()`<br>• `GetTastingMenusAsync()`<br>• `GetMenuItemByIdAsync(Guid id)` |
| `ServiceCallController` | • `CreateServiceCallDirectAsync(ServiceCallDto dto)`<br>• `CreateServiceCallAsync(Guid id, ServiceCallDto dto)`<br>• `CompleteServiceCallAsync(Guid id)`<br>• `GetActiveServiceCallsAsync()` |
| `FeedbackController` | • `ValidateFeedbackTokenAsync(string token)`<br>• `SubmitFeedbackAsync(SubmitFeedbackDto dto)`<br>• `GetFeedbacksAsync()` |
| `AdminMenuController` | • `CreateCategoryAsync(CreateCategoryDto dto)`<br>• `GetCategoriesAsync()`<br>• `CreateMenuItemAsync(CreateMenuItemDto dto)`<br>• `UpdateMenuItemAsync(Guid id, UpdateMenuItemDto dto)`<br>• `UpdateAvailabilityAsync(Guid id, ToggleAvailabilityDto dto)`<br>• `DeleteMenuItemAsync(Guid id)`<br>• `GetAllMenuItemsAsync(string? search)`<br>• `CreateTastingMenuAsync(CreateTastingMenuDto dto)`<br>• `UpdateTastingMenuAsync(Guid id, UpdateTastingMenuDto dto)`<br>• `DeleteTastingMenuAsync(Guid id)`<br>• `GetAllTastingMenusAsync()` |
| `AdminTableController` | • `UpdateFloorPlanLayoutAsync(UpdateFloorPlanLayoutDto dto)`<br>• `CreateTableAsync(CreateTableDto dto)`<br>• `UpdateTableAsync(Guid id, UpdateTableDto dto)`<br>• `DeleteTableAsync(Guid id)` |
| `AdminRefundController` | • `OverrideRefundAsync(Guid id, ManualRefundDto dto)`<br>• `GetRefundRequestsAsync()` |
| `AdminStaffController` | • `CreateStaffAsync(CreateStaffDto dto)`<br>• `UpdateStaffAsync(Guid id, UpdateStaffDto dto)`<br>• `ResetPasswordAsync(Guid id, ResetPasswordDto dto)`<br>• `UpdateStatusAsync(Guid id, ToggleStatusDto dto)`<br>• `GetStaffListAsync(StaffRole? role, string? search)`<br>• `GetStaffByIdAsync(Guid id)` |
| `ReportController` | • `GetMetricsAsync(DateRangeDto range)`<br>• `ExportRevenueReportAsync(DateRangeDto range)` |
| `HealthController` | • `Get()` |
| `TestingController` | • `SeedSampleData()`<br>• `GetOverview()` |
