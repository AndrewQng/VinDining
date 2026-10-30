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
| 7 | `GET` | `/api/reservations` | Tra cứu danh sách đặt bàn theo ngày / trạng thái | Thu ngân, Quản lý |
| 8 | `GET` | `/api/reservations/{code}` | Xem chi tiết thông tin đơn đặt bàn | Khách hàng, Thu ngân |
| 9 | `GET` | `/api/reservations/available-slots` | Kiểm tra các khung giờ còn bàn trống | Public |
| 10 | `POST` | `/api/tables/{id}/check-in` | Check-in nhận bàn cho khách có đặt trước | Thu ngân, Phục vụ |
| 11 | `POST` | `/api/tables/{id}/walk-in` | Xếp bàn trực tiếp cho khách vãng lai | Thu ngân, Phục vụ |
| 12 | `POST` | `/api/tables/{sourceId}/transfer` | Điều chuyển bàn ăn sang bàn trống mới | Phục vụ, Quản lý |
| 13 | `POST` | `/api/tables/merge` | Gộp 2 hoặc nhiều bàn ăn phục vụ cùng đoàn | Phục vụ, Quản lý |
| 14 | `GET` | `/api/tables` | Lấy sơ đồ bàn ăn và trạng thái thời gian thực | Toàn bộ nhân viên |
| 15 | `GET` | `/api/tables/{id}` | Xem chi tiết bàn ăn và đơn order hiện tại | Toàn bộ nhân viên |
| 16 | `PATCH` | `/api/tables/{id}/status` | Đổi trạng thái bàn (Dọn dẹp xong sang Trống) | Phục vụ, Thu ngân |
| 17 | `POST` | `/api/orders` | Tạo đơn gọi món mới theo từng Course | Phục vụ |
| 18 | `POST` | `/api/orders/{id}/fire-course` | Kích hoạt bếp nấu đợt món tiếp theo (Fire) | Phục vụ, Quầy Pass |
| 19 | `POST` | `/api/orders/{id}/items` | Gọi thêm món phát sinh vào đơn đang mở | Phục vụ |
| 20 | `PATCH` | `/api/orders/{id}/items/{itemId}/serve` | Xác nhận đã hoàn tất ra món tại quầy Pass | Bếp trưởng, Quầy Pass |
| 21 | `GET` | `/api/orders/table/{tableId}` | Lấy đơn order đang hoạt động của một bàn | Phục vụ, Thu ngân |
| 22 | `GET` | `/api/orders/{id}` | Lấy thông tin chi tiết một đơn order | Phục vụ, Thu ngân |
| 23 | `DELETE` | `/api/orders/{id}/items/{itemId}` | Hủy món chưa qua chế biến khỏi đơn | Phục vụ, Quản lý |
| 24 | `GET` | `/api/orders/kitchen/pending` | Lấy danh sách món đang chờ nấu trên KDS | Bếp, Quầy Pass |
| 25 | `POST` | `/api/tables/{tableId}/request-checkout` | Gửi yêu cầu xin thanh toán từ bàn ăn | Phục vụ, Khách hàng |
| 26 | `GET` | `/api/invoices/preview/{tableId}` | Xem trước hóa đơn, tự cấn trừ cọc & thuế | Thu ngân, Quản lý |
| 27 | `POST` | `/api/invoices/{tableId}/print-preview` | In phiếu tạm tính bàn ăn gửi khách xem | Thu ngân |
| 28 | `POST` | `/api/invoices/{tableId}/settle` | Quyết toán hóa đơn, đóng bàn & in biên lai | Thu ngân |
| 29 | `GET` | `/api/invoices/{id}` | Tra cứu chi tiết hóa đơn đã quyết toán | Thu ngân, Quản lý |
| 30 | `GET` | `/api/invoices` | Danh sách lịch sử hóa đơn trong ca | Thu ngân, Quản lý |
| 31 | `GET` | `/api/menu/table/{id}` | Khách quét mã QR xem thực đơn tại bàn | Khách hàng |
| 32 | `GET` | `/api/menu/categories` | Lấy danh mục nhóm món phục vụ hiển thị | Public |
| 33 | `GET` | `/api/menu/items/{id}` | Xem chi tiết thông tin món ăn và dị ứng | Public |
| 34 | `POST` | `/api/tables/{id}/call-service` | Khách gửi tín hiệu gọi nhân viên phục vụ | Khách hàng |
| 35 | `PATCH` | `/api/service-calls/{id}/complete` | Xác nhận đã hỗ trợ xong yêu cầu tại bàn | Phục vụ |
| 36 | `GET` | `/api/service-calls/active` | Danh sách yêu cầu phục vụ đang chờ xử lý | Phục vụ |
| 37 | `POST` | `/api/feedbacks` | Gửi phiếu đánh giá chất lượng trải nghiệm | Khách hàng |
| 38 | `GET` | `/api/admin/feedbacks` | Tra cứu danh sách phản hồi từ thực khách | Quản lý |
| 39 | `POST` | `/api/admin/menu-items` | Tạo mới món ăn A La Carte | Quản lý |
| 40 | `PUT` | `/api/admin/menu-items/{id}` | Chỉnh sửa thông tin món ăn A La Carte | Quản lý |
| 41 | `PATCH` | `/api/admin/menu-items/{id}/availability` | Bật/tắt trạng thái hết món tạm thời | Quản lý, Bếp |
| 42 | `DELETE` | `/api/admin/menu-items/{id}` | Xóa món ăn khỏi danh mục phục vụ | Quản lý |
| 43 | `GET` | `/api/admin/menu-items` | Danh sách toàn bộ món ăn trong trang quản trị | Quản lý |
| 44 | `POST` | `/api/admin/tasting-menus` | Tạo Set Menu / Tasting Menu theo trình tự món | Quản lý |
| 45 | `PUT` | `/api/admin/tasting-menus/{id}` | Cập nhật thông tin Set Menu | Quản lý |
| 46 | `DELETE` | `/api/admin/tasting-menus/{id}` | Xóa Set Menu khỏi hệ thống | Quản lý |
| 47 | `GET` | `/api/admin/tasting-menus` | Danh sách toàn bộ Set Menu trong quản trị | Quản lý |
| 48 | `PUT` | `/api/admin/tables/layout` | Cập nhật tọa độ sơ đồ bàn ăn 2D | Quản lý |
| 49 | `POST` | `/api/admin/tables` | Tạo mới bàn ăn trong khu vực | Quản lý |
| 50 | `DELETE` | `/api/admin/tables/{id}` | Xóa bàn ăn khỏi sơ đồ | Quản lý |
| 51 | `POST` | `/api/admin/reservations/{id}/manual-refund` | Duyệt hoàn cọc thủ công ngoài chính sách | Quản lý |
| 52 | `GET` | `/api/admin/refunds` | Lấy danh sách yêu cầu hoàn cọc chờ xử lý | Quản lý |
| 53 | `POST` | `/api/admin/staff` | Tạo mới tài khoản nhân viên nội bộ | Quản lý |
| 54 | `PUT` | `/api/admin/staff/{id}` | Cập nhật hồ sơ, phân quyền nhân viên | Quản lý |
| 55 | `POST` | `/api/admin/staff/{id}/reset-password` | Khởi tạo lại mật khẩu tài khoản | Quản lý |
| 56 | `PATCH` | `/api/admin/staff/{id}/status` | Khóa hoặc kích hoạt tài khoản nhân viên | Quản lý |
| 57 | `GET` | `/api/admin/staff` | Lấy danh sách tất cả nhân viên nội bộ | Quản lý |
| 58 | `GET` | `/api/admin/staff/{id}` | Xem chi tiết hồ sơ một nhân viên | Quản lý |
| 59 | `GET` | `/api/admin/reports/dashboard` | Thống kê số liệu doanh thu, tỷ lệ lấp đầy | Quản lý |
| 60 | `GET` | `/api/admin/reports/export` | Xuất dữ liệu báo cáo sang file Excel / PDF | Quản lý |

---

## Bảng 2: Danh sách Controller & Các hàm (Action Methods)

| Tên Controller | Các hàm trong Controller (Action Methods) |
| :--- | :--- |
| `AuthController` | • `LoginAsync(LoginDto dto)`<br>• `GetCurrentUserAsync()`<br>• `LogoutAsync()` |
| `ReservationController` | • `CreateReservationAsync(CreateReservationDto dto)`<br>• `ProcessVnPayIpnAsync(VnPayIpnDto params)`<br>• `CancelReservationAsync(CancelReservationDto dto)`<br>• `GetReservationsAsync(ReservationFilterDto filter)`<br>• `GetReservationByCodeAsync(string code)`<br>• `GetAvailableTimeSlotsAsync(DateTime date, int partySize)` |
| `TableController` | • `CheckInReservationAsync(int id, CheckInDto dto)`<br>• `CheckInWalkInAsync(int id, WalkInDto dto)`<br>• `TransferTableAsync(int sourceId, TransferTableDto dto)`<br>• `MergeTablesAsync(MergeTablesDto dto)`<br>• `GetFloorPlanAsync()`<br>• `GetTableByIdAsync(int id)`<br>• `UpdateTableStatusAsync(int id, UpdateTableStatusDto dto)` |
| `OrderController` | • `CreateOrderWithCoursesAsync(CreateOrderDto dto)`<br>• `FireNextCourseAsync(int id, FireCourseDto dto)`<br>• `AddOrderItemsAsync(int id, AddItemsDto itemsDto)`<br>• `ConfirmServedAsync(int id, int itemId)`<br>• `GetActiveOrderByTableAsync(int tableId)`<br>• `GetOrderDetailsAsync(int id)`<br>• `CancelOrderItemAsync(int id, int itemId)`<br>• `GetKitchenPendingOrdersAsync()` |
| `InvoiceController` | • `RequestCheckoutAsync(int tableId)`<br>• `GetInvoicePreviewAsync(int tableId)`<br>• `PrintPreBillAsync(int tableId)`<br>• `SettleInvoiceAsync(int tableId, SettleInvoiceDto dto)`<br>• `GetInvoiceByIdAsync(int id)`<br>• `GetInvoicesAsync(InvoiceFilterDto filter)` |
| `MenuController` | • `GetTableMenuAsync(int id)`<br>• `GetCategoriesAsync()`<br>• `GetMenuItemByIdAsync(int id)` |
| `ServiceCallController` | • `CreateServiceCallAsync(int id, ServiceCallDto dto)`<br>• `CompleteServiceCallAsync(int id)`<br>• `GetActiveServiceCallsAsync()` |
| `FeedbackController` | • `SubmitFeedbackAsync(SubmitFeedbackDto dto)`<br>• `GetFeedbacksAsync(FeedbackFilterDto filter)` |
| `AdminMenuController` | • `CreateMenuItemAsync(CreateMenuItemDto dto)`<br>• `UpdateMenuItemAsync(int id, UpdateMenuItemDto dto)`<br>• `UpdateAvailabilityAsync(int id, ToggleAvailabilityDto dto)`<br>• `DeleteMenuItemAsync(int id)`<br>• `GetAllMenuItemsAsync(MenuFilterDto filter)`<br>• `CreateTastingMenuAsync(CreateTastingMenuDto dto)`<br>• `UpdateTastingMenuAsync(int id, UpdateTastingMenuDto dto)`<br>• `DeleteTastingMenuAsync(int id)`<br>• `GetAllTastingMenusAsync()` |
| `AdminTableController` | • `UpdateFloorPlanLayoutAsync(UpdateFloorPlanDto dto)`<br>• `CreateTableAsync(CreateTableDto dto)`<br>• `DeleteTableAsync(int id)` |
| `AdminRefundController` | • `OverrideRefundAsync(int id, ManualRefundDto dto)`<br>• `GetRefundRequestsAsync(RefundFilterDto filter)` |
| `AdminStaffController` | • `CreateStaffAsync(CreateStaffDto dto)`<br>• `UpdateStaffAsync(int id, UpdateStaffDto dto)`<br>• `ResetPasswordAsync(int id, ResetPasswordDto dto)`<br>• `UpdateStatusAsync(int id, ToggleStatusDto dto)`<br>• `GetStaffListAsync(StaffFilterDto filter)`<br>• `GetStaffByIdAsync(int id)` |
| `ReportController` | • `GetMetricsAsync(DateRangeDto range)`<br>• `ExportRevenueReportAsync(DateRangeDto range)` |
