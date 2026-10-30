# VinDining — Danh mục Hàm trong Controller (Controller Specifications)

Tài liệu đặc tả toàn bộ danh mục các lớp Controller và các hàm xử lý (Action Methods) thuộc tầng Web API của hệ thống VinDining, phục vụ giao tiếp RESTful giữa các ứng dụng Client (Web Khách hàng, Mobile POS Phục vụ, Tablet Pass Expediter, Web Quản trị) và hệ thống Backend (.NET 9 Clean Architecture).

> **Ghi chú Kiến trúc**: Các tác vụ chạy ngầm hệ thống (`UC-S1` đến `UC-S4`) được triển khai theo mô hình **In-Process Background Worker** (`IHostedService` / Background Queue), thực thi trực tiếp vào tầng Service nghiệp vụ mà không đi qua tầng HTTP Controller nhằm đảm bảo hiệu năng và đúng chuẩn kiến trúc phần mềm.

---

## Bảng 1: Tổng hợp Toàn bộ Controller & Action Method trong Hệ thống

| STT | Tên Controller | Tên Action Method (C#) | HTTP Method & Route | Service / Handler được gọi | Nguồn Sequence Diagram |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | `AuthController` | `LoginAsync` | `POST /api/auth/login` | `_authService.Authenticate(dto)` | [SD_UC_E5_Staff_Authentication.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E5_Staff_Authentication.puml) |
| 2 | `ReservationController` | `CreateReservationAsync` | `POST /api/reservations` | `_reservationService.CreateReservation(dto)` | [SD_UC_U1_Reservation_Deposit.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U1_Reservation_Deposit.puml) |
| 3 | `ReservationController` | `ProcessVnPayIpnAsync` | `POST /api/payments/vnpay-ipn` | `_reservationService.ProcessIpn(params)` | [SD_UC_U1_Reservation_Deposit.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U1_Reservation_Deposit.puml) |
| 4 | `ReservationController` | `CancelReservationAsync` | `POST /api/reservations/cancel` | `_reservationService.CancelReservation(code)` | [SD_UC_U3_Cancel_Reservation.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U3_Cancel_Reservation.puml) |
| 5 | `TableController` | `CheckInReservationAsync` | `POST /api/tables/{id}/check-in` | `_tableService.CheckInTable(dto)` | [SD_UC_E6_1_CheckIn_Reservation.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E6_1_CheckIn_Reservation.puml) |
| 6 | `TableController` | `CheckInWalkInAsync` | `POST /api/tables/{id}/walk-in` | `_tableService.CheckInWalkIn(dto)` | [SD_UC_E6_2_CheckIn_WalkIn.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E6_2_CheckIn_WalkIn.puml) |
| 7 | `TableController` | `TransferTableAsync` | `POST /api/tables/{sourceId}/transfer` | `_tableService.TransferTable(sourceId, dto)` | [SD_UC_E4_1_Transfer_Table.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E4_1_Transfer_Table.puml) |
| 8 | `TableController` | `MergeTablesAsync` | `POST /api/tables/merge` | `_tableService.MergeTables(dto)` | [SD_UC_E4_2_Merge_Table.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E4_2_Merge_Table.puml) |
| 9 | `InvoiceController` | `RequestCheckoutAsync` | `POST /api/tables/{tableId}/request-checkout` | `_invoiceService.RequestCheckout(tableId)` | [SD_UC_E3_1_Request_Checkout.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E3_1_Request_Checkout.puml) |
| 10 | `OrderController` | `CreateOrderWithCoursesAsync` | `POST /api/orders` | `_orderService.CreateOrderWithCourses(dto)` | [SD_UC_E1_1_Create_Order.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E1_1_Create_Order.puml) |
| 11 | `OrderController` | `FireNextCourseAsync` | `POST /api/orders/{id}/fire-course` | `_orderService.FireNextCourse(id, courseNo)` | [SD_UC_E1_2_Fire_Next_Course.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E1_2_Fire_Next_Course.puml) |
| 12 | `OrderController` | `AddOrderItemsAsync` | `POST /api/orders/{id}/items` | `_orderService.AddOrderItems(id, itemsDto)` | [SD_UC_E1_3_Add_Order_Items.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E1_3_Add_Order_Items.puml) |
| 13 | `OrderController` | `ConfirmServedAsync` | `PATCH /api/orders/{id}/items/{itemId}/serve` | `_orderService.ConfirmServed(id, itemId)` | [SD_UC_E2_Expediter_Serve_CourseFiring.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E2_Expediter_Serve_CourseFiring.puml) |
| 14 | `InvoiceController` | `GetInvoicePreviewAsync` | `GET /api/invoices/preview/{tableId}` | `_invoiceService.CalculateInvoice(tableId)` | [SD_UC_E3_2_Preview_Invoice.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E3_2_Preview_Invoice.puml) |
| 15 | `InvoiceController` | `PrintPreBillAsync` | `POST /api/invoices/{tableId}/print-preview` | `_invoiceService.PrintPreBill(tableId)` | [SD_UC_E3_2_Preview_Invoice.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E3_2_Preview_Invoice.puml) |
| 16 | `InvoiceController` | `SettleInvoiceAsync` | `POST /api/invoices/{tableId}/settle` | `_invoiceService.SettleInvoice(dto)` | [SD_UC_E3_3_Settle_Invoice.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E3_3_Settle_Invoice.puml) |
| 17 | `ServiceCallController` | `GetTableMenuAsync` | `GET /api/menu/table/{id}` | `_menuService.GetMenuByTableId(id)` | [SD_UC_U2_View_Menu.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U2_View_Menu.puml) |
| 18 | `ServiceCallController` | `CreateServiceCallAsync` | `POST /api/tables/{id}/call-service` | `_serviceCallService.CreateRequest(dto)` | [SD_UC_U2_Call_Service_QR.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U2_Call_Service_QR.puml) |
| 19 | `ServiceCallController` | `CompleteServiceCallAsync` | `PATCH /api/service-calls/{id}/complete` | `_serviceCallService.CompleteRequest(id)` | [SD_UC_U2_Call_Service_QR.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U2_Call_Service_QR.puml) |
| 20 | `FeedbackController` | `SubmitFeedbackAsync` | `POST /api/feedbacks` | `_feedbackService.SubmitFeedback(dto)` | [SD_UC_U4_Submit_Feedback.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U4_Submit_Feedback.puml) |
| 21 | `AdminMenuController` | `CreateMenuItemAsync` | `POST /api/admin/menu-items` | `_menuService.Create(dto)` | [SD_UC_A1_1_Create_MenuItem.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_1_Create_MenuItem.puml) |
| 22 | `AdminMenuController` | `UpdateMenuItemAsync` | `PUT /api/admin/menu-items/{id}` | `_menuService.Update(id, dto)` | [SD_UC_A1_2_Update_MenuItem.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_2_Update_MenuItem.puml) |
| 23 | `AdminMenuController` | `UpdateAvailabilityAsync` | `PATCH /api/admin/menu-items/{id}/availability` | `_menuService.UpdateAvailability(dto)` | [SD_UC_A1_3_Toggle_Availability.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_3_Toggle_Availability.puml) |
| 24 | `AdminMenuController` | `DeleteMenuItemAsync` | `DELETE /api/admin/menu-items/{id}` | `_menuService.Delete(id)` | [SD_UC_A1_4_Delete_MenuItem.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_4_Delete_MenuItem.puml) |
| 25 | `AdminMenuController` | `CreateTastingMenuAsync` | `POST /api/admin/tasting-menus` | `_menuService.CreateTastingMenu(dto)` | [SD_UC_A1_5_Create_SetMenu.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_5_Create_SetMenu.puml) |
| 26 | `AdminMenuController` | `UpdateTastingMenuAsync` | `PUT /api/admin/tasting-menus/{id}` | `_menuService.UpdateTastingMenu(id, dto)` | [SD_UC_A1_6_Update_SetMenu.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_6_Update_SetMenu.puml) |
| 27 | `AdminMenuController` | `DeleteTastingMenuAsync` | `DELETE /api/admin/tasting-menus/{id}` | `_menuService.DeleteTastingMenu(id)` | [SD_UC_A1_7_Delete_SetMenu.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_7_Delete_SetMenu.puml) |
| 28 | `AdminTableController` | `UpdateFloorPlanLayoutAsync` | `PUT /api/admin/tables/layout` | `_tableService.UpdateFloorPlan(dto)` | [SD_UC_A2_Floor_Plan_Layout.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A2_Floor_Plan_Layout.puml) |
| 29 | `AdminRefundController` | `OverrideRefundAsync` | `POST /api/admin/reservations/{id}/manual-refund` | `_refundService.OverrideRefund(id, dto)` | [SD_UC_A3_Manual_Refund_Approval.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A3_Manual_Refund_Approval.puml) |
| 30 | `AdminStaffController` | `CreateStaffAsync` | `POST /api/admin/staff` | `_staffService.CreateStaff(dto)` | [SD_UC_A4_1_Create_Staff.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A4_1_Create_Staff.puml) |
| 31 | `AdminStaffController` | `UpdateStaffAsync` | `PUT /api/admin/staff/{id}` | `_staffService.UpdateStaff(id, dto)` | [SD_UC_A4_2_Update_Staff.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A4_2_Update_Staff.puml) |
| 32 | `AdminStaffController` | `ResetPasswordAsync` | `POST /api/admin/staff/{id}/reset-password` | `_staffService.ResetPassword(id)` | [SD_UC_A4_3_Reset_Password.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A4_3_Reset_Password.puml) |
| 33 | `AdminStaffController` | `UpdateStatusAsync` | `PATCH /api/admin/staff/{id}/status` | `_staffService.UpdateStatus(id, isActive)` | [SD_UC_A4_4_Toggle_Staff_Status.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A4_4_Toggle_Staff_Status.puml) |
| 34 | `ReportController` | `GetMetricsAsync` | `GET /api/admin/reports/dashboard` | `_reportService.GetMetrics(range)` | [SD_UC_A5_Analytics_Dashboard.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A5_Analytics_Dashboard.puml) |

---

## Bảng 2: Đặc tả Chi tiết Các Hàm trong `AuthController`

* **Đường dẫn cơ sở (Route Base)**: `/api/auth`
* **Mô tả**: Tiếp nhận yêu cầu xác thực đăng nhập của nhân viên nội bộ và sinh JWT Token.

| Tên Action Method | Route & Method | Quyền hạn | Tham số đầu vào (C#) | Lệnh gọi tầng Service / Handler | Kiểu trả về & Trạng thái HTTP | Sequence Diagram |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `LoginAsync` | `POST /api/auth/login` | Public | `[FromBody] LoginDto dto` | `_authService.Authenticate(dto)` | `Task<IActionResult>`<br>• `200 OK (Token, Roles)`<br>• `401 Unauthorized`<br>• `423 Locked (khóa 15p)` | [SD_UC_E5_Staff_Authentication.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E5_Staff_Authentication.puml) |

---

## Bảng 3: Đặc tả Chi tiết Các Hàm trong `ReservationController`

* **Đường dẫn cơ sở (Route Base)**: `/api/reservations`, `/api/payments`
* **Mô tả**: Xử lý tạo đơn đặt bàn giữ chỗ, tiếp nhận IPN từ cổng thanh toán VNPAY và hủy bàn hoàn cọc tự động.

| Tên Action Method | Route & Method | Quyền hạn | Tham số đầu vào (C#) | Lệnh gọi tầng Service / Handler | Kiểu trả về & Trạng thái HTTP | Sequence Diagram |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CreateReservationAsync` | `POST /api/reservations` | Public | `[FromBody] CreateReservationDto dto` | `_reservationService.CreateReservation(dto)` | `Task<IActionResult>`<br>• `201 Created (paymentUrl, code)`<br>• `400 BadRequest` | [SD_UC_U1_Reservation_Deposit.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U1_Reservation_Deposit.puml) |
| `ProcessVnPayIpnAsync` | `POST /api/payments/vnpay-ipn` | Public (VNPAY IPN) | `[FromForm] VnPayIpnDto params` | `_reservationService.ProcessIpn(params)` | `Task<IActionResult>`<br>• `200 OK (RspCode: 00)`<br>• `400 BadRequest` | [SD_UC_U1_Reservation_Deposit.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U1_Reservation_Deposit.puml) |
| `CancelReservationAsync` | `POST /api/reservations/cancel` | Public | `[FromBody] CancelReservationDto dto` | `_reservationService.CancelReservation(code)` | `Task<IActionResult>`<br>• `200 OK (CancelResult)`<br>• `400 BadRequest` | [SD_UC_U3_Cancel_Reservation.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U3_Cancel_Reservation.puml) |

---

## Bảng 4: Đặc tả Chi tiết Các Hàm trong `TableController`

* **Đường dẫn cơ sở (Route Base)**: `/api/tables`
* **Mô tả**: Quản lý tiếp đón khách (Check-in đặt trước, Walk-in) và điều chuyển, gộp bàn ăn thực tế.

| Tên Action Method | Route & Method | Quyền hạn | Tham số đầu vào (C#) | Lệnh gọi tầng Service / Handler | Kiểu trả về & Trạng thái HTTP | Sequence Diagram |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CheckInReservationAsync` | `POST /api/tables/{id}/check-in` | Cashier, Waiter, Manager | `[FromRoute] int id`, `[FromBody] CheckInDto dto` | `_tableService.CheckInTable(dto)` | `Task<IActionResult>`<br>• `200 OK (Occupied)`<br>• `400 BadRequest` | [SD_UC_E6_1_CheckIn_Reservation.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E6_1_CheckIn_Reservation.puml) |
| `CheckInWalkInAsync` | `POST /api/tables/{id}/walk-in` | Cashier, Waiter, Manager | `[FromRoute] int id`, `[FromBody] WalkInDto dto` | `_tableService.CheckInWalkIn(dto)` | `Task<IActionResult>`<br>• `200 OK (Occupied)`<br>• `400 BadRequest` | [SD_UC_E6_2_CheckIn_WalkIn.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E6_2_CheckIn_WalkIn.puml) |
| `TransferTableAsync` | `POST /api/tables/{sourceId}/transfer` | Waiter, Manager | `[FromRoute] int sourceId`, `[FromBody] TransferTableDto dto` | `_tableService.TransferTable(sourceId, dto)` | `Task<IActionResult>`<br>• `200 OK (Success)`<br>• `400 BadRequest (bàn đích bận)` | [SD_UC_E4_1_Transfer_Table.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E4_1_Transfer_Table.puml) |
| `MergeTablesAsync` | `POST /api/tables/merge` | Waiter, Manager | `[FromBody] MergeTablesDto dto` | `_tableService.MergeTables(dto)` | `Task<IActionResult>`<br>• `200 OK (Merged)`<br>• `400 BadRequest` | [SD_UC_E4_2_Merge_Table.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E4_2_Merge_Table.puml) |

---

## Bảng 5: Đặc tả Chi tiết Các Hàm trong `OrderController`

* **Đường dẫn cơ sở (Route Base)**: `/api/orders`
* **Mô tả**: Tiếp nhận đơn gọi món tại bàn, kích hoạt nấu theo đợt (Course Firing), gọi thêm món và xác nhận đi món (Served) tại quầy Pass.

| Tên Action Method | Route & Method | Quyền hạn | Tham số đầu vào (C#) | Lệnh gọi tầng Service / Handler | Kiểu trả về & Trạng thái HTTP | Sequence Diagram |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CreateOrderWithCoursesAsync` | `POST /api/orders` | Waiter, Manager | `[FromBody] CreateOrderDto dto` | `_orderService.CreateOrderWithCourses(dto)` | `Task<IActionResult>`<br>• `201 Created (orderId, orderNo)`<br>• `400 BadRequest` | [SD_UC_E1_1_Create_Order.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E1_1_Create_Order.puml) |
| `FireNextCourseAsync` | `POST /api/orders/{id}/fire-course` | Waiter, Expediter, Manager | `[FromRoute] int id`, `[FromBody] FireCourseDto dto` | `_orderService.FireNextCourse(id, dto.CourseNo)` | `Task<IActionResult>`<br>• `200 OK (courseFired)`<br>• `400 BadRequest` | [SD_UC_E1_2_Fire_Next_Course.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E1_2_Fire_Next_Course.puml) |
| `AddOrderItemsAsync` | `POST /api/orders/{id}/items` | Waiter, Manager | `[FromRoute] int id`, `[FromBody] AddItemsDto itemsDto` | `_orderService.AddOrderItems(id, itemsDto)` | `Task<IActionResult>`<br>• `200 OK (addedItemIds)`<br>• `400 BadRequest` | [SD_UC_E1_3_Add_Order_Items.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E1_3_Add_Order_Items.puml) |
| `ConfirmServedAsync` | `PATCH /api/orders/{id}/items/{itemId}/serve` | Expediter, Chef, Manager | `[FromRoute] int id`, `[FromRoute] int itemId` | `_orderService.ConfirmServed(id, itemId)` | `Task<IActionResult>`<br>• `200 OK (Status: Served)`<br>• `400 BadRequest` | [SD_UC_E2_Expediter_Serve_CourseFiring.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E2_Expediter_Serve_CourseFiring.puml) |

---

## Bảng 6: Đặc tả Chi tiết Các Hàm trong `InvoiceController`

* **Đường dẫn cơ sở (Route Base)**: `/api/invoices`, `/api/tables`
* **Mô tả**: Xử lý yêu cầu tính tiền từ bàn ăn, xuất phiếu tạm tính cấn trừ cọc và quyết toán đóng bàn.

| Tên Action Method | Route & Method | Quyền hạn | Tham số đầu vào (C#) | Lệnh gọi tầng Service / Handler | Kiểu trả về & Trạng thái HTTP | Sequence Diagram |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RequestCheckoutAsync` | `POST /api/tables/{tableId}/request-checkout` | Waiter, Cashier, Manager | `[FromRoute] int tableId` | `_invoiceService.RequestCheckout(tableId)` | `Task<IActionResult>`<br>• `200 OK (PaymentPending)`<br>• `400 BadRequest` | [SD_UC_E3_1_Request_Checkout.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E3_1_Request_Checkout.puml) |
| `GetInvoicePreviewAsync` | `GET /api/invoices/preview/{tableId}` | Cashier, Manager | `[FromRoute] int tableId` | `_invoiceService.CalculateInvoice(tableId)` | `Task<IActionResult>`<br>• `200 OK (InvoicePreviewDto)`<br>• `404 NotFound` | [SD_UC_E3_2_Preview_Invoice.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E3_2_Preview_Invoice.puml) |
| `PrintPreBillAsync` | `POST /api/invoices/{tableId}/print-preview` | Cashier, Manager | `[FromRoute] int tableId` | `_invoiceService.PrintPreBill(tableId)` | `Task<IActionResult>`<br>• `200 OK (PreBillPrinted)`<br>• `400 BadRequest` | [SD_UC_E3_2_Preview_Invoice.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E3_2_Preview_Invoice.puml) |
| `SettleInvoiceAsync` | `POST /api/invoices/{tableId}/settle` | Cashier, Manager | `[FromRoute] int tableId`, `[FromBody] SettleInvoiceDto dto` | `_invoiceService.SettleInvoice(dto)` | `Task<IActionResult>`<br>• `200 OK (InvoiceId, Paid)`<br>• `400 BadRequest` | [SD_UC_E3_3_Settle_Invoice.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_E3_3_Settle_Invoice.puml) |

---

## Bảng 7: Đặc tả Chi tiết Các Hàm trong `ServiceCallController` & `FeedbackController`

* **Đường dẫn cơ sở (Route Base)**: `/api/menu`, `/api/tables`, `/api/service-calls`, `/api/feedbacks`
* **Mô tả**: Xem E-Menu tại bàn, gửi/hoàn tất yêu cầu phục vụ và tiếp nhận đánh giá chất lượng từ khách hàng.

| Tên Action Method | Route & Method | Quyền hạn | Tham số đầu vào (C#) | Lệnh gọi tầng Service / Handler | Kiểu trả về & Trạng thái HTTP | Sequence Diagram |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GetTableMenuAsync` | `GET /api/menu/table/{id}` | Public (Khách tại bàn) | `[FromRoute] int id` | `_menuService.GetMenuByTableId(id)` | `Task<IActionResult>`<br>• `200 OK (MenuCategories)`<br>• `404 NotFound` | [SD_UC_U2_View_Menu.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U2_View_Menu.puml) |
| `CreateServiceCallAsync` | `POST /api/tables/{id}/call-service` | Public (Khách tại bàn) | `[FromRoute] int id`, `[FromBody] ServiceCallDto dto` | `_serviceCallService.CreateRequest(dto)` | `Task<IActionResult>`<br>• `201 Created (callId)`<br>• `400 BadRequest` | [SD_UC_U2_Call_Service_QR.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U2_Call_Service_QR.puml) |
| `CompleteServiceCallAsync` | `PATCH /api/service-calls/{id}/complete` | Waiter, Cashier, Manager | `[FromRoute] int id` | `_serviceCallService.CompleteRequest(id)` | `Task<IActionResult>`<br>• `200 OK (Completed)`<br>• `404 NotFound` | [SD_UC_U2_Call_Service_QR.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U2_Call_Service_QR.puml) |
| `SubmitFeedbackAsync` | `POST /api/feedbacks` | Public (Khách sau ăn) | `[FromBody] SubmitFeedbackDto dto` | `_feedbackService.SubmitFeedback(dto)` | `Task<IActionResult>`<br>• `201 Created (feedbackId)`<br>• `400 BadRequest` | [SD_UC_U4_Submit_Feedback.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_U4_Submit_Feedback.puml) |

---

## Bảng 8: Đặc tả Chi tiết Các Hàm trong `AdminMenuController`

* **Đường dẫn cơ sở (Route Base)**: `/api/admin/menu-items`, `/api/admin/tasting-menus`
* **Mô tả**: Quản lý danh mục món ăn A La Carte, Tasting Set Menu và bật tắt khả dụng phục vụ.

| Tên Action Method | Route & Method | Quyền hạn | Tham số đầu vào (C#) | Lệnh gọi tầng Service / Handler | Kiểu trả về & Trạng thái HTTP | Sequence Diagram |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CreateMenuItemAsync` | `POST /api/admin/menu-items` | Manager | `[FromBody] CreateMenuItemDto dto` | `_menuService.Create(dto)` | `Task<IActionResult>`<br>• `201 Created (item)`<br>• `400 BadRequest` | [SD_UC_A1_1_Create_MenuItem.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_1_Create_MenuItem.puml) |
| `UpdateMenuItemAsync` | `PUT /api/admin/menu-items/{id}` | Manager | `[FromRoute] int id`, `[FromBody] UpdateMenuItemDto dto` | `_menuService.Update(id, dto)` | `Task<IActionResult>`<br>• `200 OK (updated)`<br>• `400 BadRequest`<br>• `404 NotFound` | [SD_UC_A1_2_Update_MenuItem.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_2_Update_MenuItem.puml) |
| `UpdateAvailabilityAsync` | `PATCH /api/admin/menu-items/{id}/availability` | Manager, Chef | `[FromRoute] int id`, `[FromBody] ToggleAvailabilityDto dto` | `_menuService.UpdateAvailability(dto)` | `Task<IActionResult>`<br>• `200 OK (isAvailable)`<br>• `400 BadRequest` | [SD_UC_A1_3_Toggle_Availability.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_3_Toggle_Availability.puml) |
| `DeleteMenuItemAsync` | `DELETE /api/admin/menu-items/{id}` | Manager | `[FromRoute] int id` | `_menuService.Delete(id)` | `Task<IActionResult>`<br>• `200 OK (deleted)`<br>• `400 BadRequest` | [SD_UC_A1_4_Delete_MenuItem.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_4_Delete_MenuItem.puml) |
| `CreateTastingMenuAsync` | `POST /api/admin/tasting-menus` | Manager, Chef | `[FromBody] CreateTastingMenuDto dto` | `_menuService.CreateTastingMenu(dto)` | `Task<IActionResult>`<br>• `201 Created (setId)`<br>• `400 BadRequest` | [SD_UC_A1_5_Create_SetMenu.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_5_Create_SetMenu.puml) |
| `UpdateTastingMenuAsync` | `PUT /api/admin/tasting-menus/{id}` | Manager, Chef | `[FromRoute] int id`, `[FromBody] UpdateTastingMenuDto dto` | `_menuService.UpdateTastingMenu(id, dto)` | `Task<IActionResult>`<br>• `200 OK (updated)`<br>• `400 BadRequest` | [SD_UC_A1_6_Update_SetMenu.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_6_Update_SetMenu.puml) |
| `DeleteTastingMenuAsync` | `DELETE /api/admin/tasting-menus/{id}` | Manager, Chef | `[FromRoute] int id` | `_menuService.DeleteTastingMenu(id)` | `Task<IActionResult>`<br>• `200 OK (deleted)`<br>• `400 BadRequest` | [SD_UC_A1_7_Delete_SetMenu.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A1_7_Delete_SetMenu.puml) |

---

## Bảng 9: Đặc tả Chi tiết Các Hàm trong `AdminTableController` & `AdminRefundController`

* **Đường dẫn cơ sở (Route Base)**: `/api/admin/tables`, `/api/admin/reservations`
* **Mô tả**: Quản trị cấu hình sơ đồ bàn 2D và xét duyệt lệnh hoàn cọc thủ công ngoại lệ.

| Tên Action Method | Route & Method | Quyền hạn | Tham số đầu vào (C#) | Lệnh gọi tầng Service / Handler | Kiểu trả về & Trạng thái HTTP | Sequence Diagram |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `UpdateFloorPlanLayoutAsync` | `PUT /api/admin/tables/layout` | Manager | `[FromBody] UpdateFloorPlanDto dto` | `_tableService.UpdateFloorPlan(dto)` | `Task<IActionResult>`<br>• `200 OK (updatedCount)`<br>• `400 BadRequest` | [SD_UC_A2_Floor_Plan_Layout.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A2_Floor_Plan_Layout.puml) |
| `OverrideRefundAsync` | `POST /api/admin/reservations/{id}/manual-refund` | Manager | `[FromRoute] int id`, `[FromBody] ManualRefundDto dto` | `_refundService.OverrideRefund(id, dto)` | `Task<IActionResult>`<br>• `200 OK (refundTxnId, status: SUCCESS)`<br>• `400 BadRequest`<br>• `404 NotFound` | [SD_UC_A3_Manual_Refund_Approval.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A3_Manual_Refund_Approval.puml) |

---

## Bảng 10: Đặc tả Chi tiết Các Hàm trong `AdminStaffController` & `ReportController`

* **Đường dẫn cơ sở (Route Base)**: `/api/admin/staff`, `/api/admin/reports`
* **Mô tả**: Quản lý tài khoản, phân quyền, cấp mật khẩu nhân viên và thống kê báo cáo Dashboard doanh thu.

| Tên Action Method | Route & Method | Quyền hạn | Tham số đầu vào (C#) | Lệnh gọi tầng Service / Handler | Kiểu trả về & Trạng thái HTTP | Sequence Diagram |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CreateStaffAsync` | `POST /api/admin/staff` | Manager | `[FromBody] CreateStaffDto dto` | `_staffService.CreateStaff(dto)` | `Task<IActionResult>`<br>• `201 Created (staffId, username, role)`<br>• `400 BadRequest`<br>• `409 Conflict` | [SD_UC_A4_1_Create_Staff.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A4_1_Create_Staff.puml) |
| `UpdateStaffAsync` | `PUT /api/admin/staff/{id}` | Manager | `[FromRoute] int id`, `[FromBody] UpdateStaffDto dto` | `_staffService.UpdateStaff(id, dto)` | `Task<IActionResult>`<br>• `200 OK (staffId)`<br>• `400 BadRequest`<br>• `404 NotFound` | [SD_UC_A4_2_Update_Staff.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A4_2_Update_Staff.puml) |
| `ResetPasswordAsync` | `POST /api/admin/staff/{id}/reset-password` | Manager | `[FromRoute] int id`, `[FromBody] ResetPasswordDto dto` | `_staffService.ResetPassword(id)` | `Task<IActionResult>`<br>• `200 OK (Result.Success)`<br>• `400 BadRequest`<br>• `404 NotFound` | [SD_UC_A4_3_Reset_Password.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A4_3_Reset_Password.puml) |
| `UpdateStatusAsync` | `PATCH /api/admin/staff/{id}/status` | Manager | `[FromRoute] int id`, `[FromBody] ToggleStatusDto dto` | `_staffService.UpdateStatus(id, dto.IsActive)` | `Task<IActionResult>`<br>• `200 OK (staffId, isActive)`<br>• `400 BadRequest`<br>• `404 NotFound` | [SD_UC_A4_4_Toggle_Staff_Status.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A4_4_Toggle_Staff_Status.puml) |
| `GetMetricsAsync` | `GET /api/admin/reports/dashboard` | Manager | `[FromQuery] DateRangeDto range` | `_reportService.GetMetrics(range)` | `Task<IActionResult>`<br>• `200 OK (DashboardDto: summary, topSelling)`<br>• `400 BadRequest` | [SD_UC_A5_Analytics_Dashboard.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_A5_Analytics_Dashboard.puml) |

---

## Bảng 11: Đặc tả Chi tiết Phân hệ Tác vụ Nền Nội bộ (In-Process Background Worker)

* **Kiến trúc triển khai**: Sử dụng tiến trình nội bộ máy chủ (`IHostedService` / Background Queue trong .NET 9).
* **Đặc tính kỹ thuật**: Worker định kỳ gọi trực tiếp vào tầng Service / Repository qua Dependency Injection, không qua Controller HTTP.

| Mã Use Case | Tên Tác vụ Nền (Background Task) | Chu kỳ thực thi | Lệnh gọi Service xử lý | Kết quả thực thi | Sơ đồ Sequence Diagram |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `UC-S1` | `ReleaseExpiredLocksTask` | Mỗi 60 giây | `_cleanupLockService.ReleaseExpiredLocks()` | Tự động mở khóa bàn giữ chỗ quá 17 phút về trạng thái Available và hủy đơn cọc | [SD_UC_S1_Giai_Phong_Ban_Het_Han_Coc.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_S1_Giai_Phong_Ban_Het_Han_Coc.puml) |
| `UC-S2` | `DispatchDiningSurveysTask` | Mỗi 5 phút | `_surveyDispatcherService.DispatchSurveys()` | Tự động gửi link khảo sát chất lượng dịch vụ cho khách sau khi hóa đơn được thanh toán (Paid) | [SD_UC_S2_Gui_Bieu_Mau_Danh_Gia_Chat_Luong.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_S2_Gui_Bieu_Mau_Danh_Gia_Chat_Luong.puml) |
| `UC-S3` | `SendReservationRemindersTask` | Mỗi 15 phút | `_reservationReminderService.ScanAndSendReminders()` | Tự động gửi tin nhắn / email nhắc hẹn cho khách trước giờ dùng bữa 2 tiếng | [SD_UC_S3_Gui_Thong_Bao_Nhac_Hen_Dat_Ban.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_S3_Gui_Thong_Bao_Nhac_Hen_Dat_Ban.puml) |
| `UC-S4` | `MonitorOrderSlaTask` | Mỗi 15 giây | `_kitchenOrderService.CheckCookingSlaStatus()` | Kiểm soát thời gian chế biến của từng món, phát tín hiệu cảnh báo trễ hạn lên KDS Bếp và Trạm Pass | [SD_UC_S4_Theo_Doi_Canh_Bao_Thoi_Gian_Order.puml](file:///d:/Doanandroid/Đồ án CDTH/VinDining/docs/puml/sequences/SD_UC_S4_Theo_Doi_Canh_Bao_Thoi_Gian_Order.puml) |
