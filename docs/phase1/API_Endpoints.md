# DANH MỤC TÀI LIỆU HỢP ĐỒNG API (API ENDPOINTS SPECIFICATION)
## Dự án: Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (VinDining)

---

### 1. Tổng quan Kiến trúc Giao tiếp API
Hệ thống Backend được xây dựng trên nền tảng **ASP.NET Core (.NET 9) Web API** theo chuẩn **RESTful Resource-Oriented Architecture**, kết hợp cơ chế kiểm soát truy cập theo vai trò (**Role-Based Access Control - RBAC**) thông qua **JWT Bearer Token**.

Toàn bộ các API Endpoints được chuẩn hóa và phân nhóm trực tiếp theo **4 Phân hệ Use Case** đã đặc tả:
1. **Phân hệ Khách hàng (Guest / Public APIs)** — Ánh xạ `UC-U1` $\rightarrow$ `UC-U4`
2. **Phân hệ Nghiệp vụ Nhân viên (Employee / Internal APIs)** — Ánh xạ `UC-E1` $\rightarrow$ `UC-E5`
3. **Phân hệ Quản lý & Quản trị (Admin & Manager APIs)** — Ánh xạ `UC-A1` $\rightarrow$ `UC-A5`
4. **Phân hệ Tự động Hệ thống (System Background Services)** — Ánh xạ `UC-S1`

---

### 2. Chi tiết các Phân hệ API Endpoints

#### 🟢 2.1 Phân hệ Khách hàng (Guest / Public APIs — `UC-U1` đến `UC-U4`)
> *Đặc điểm*: Dành cho thực khách truy cập qua Smartphone cá nhân hoặc màn hình Digital Display tại bàn. **Không yêu cầu xác thực tài khoản đăng nhập**.

| Phương thức | Endpoint URL                             | Chức năng nghiệp vụ                               | Ánh xạ Use Case  | Quyền hạn (Auth) | Mô tả Request / Response chính                                                                                                                       |
| :-----------:| :-----------------------------------------| :--------------------------------------------------| :----------------:| :----------------:| :-----------------------------------------------------------------------------------------------------------------------------------------------------|
| **POST**    | `/api/reservations`                      | Đặt bàn trực tuyến & Khóa bàn tạm 17 phút         | `UC-U1`          | Public (Guest)   | **Req**: `PartySize`, `ReservationTime`, `Zone`, `GuestName`, `Phone`, `Email`<br>**Res**: `BookingCode`, `PaymentUrl` (VNPAY QR, hạn 15p - `BR-01`) |
| **GET**     | `/api/reservations/{bookingCode}`        | Tra cứu thông tin đặt chỗ & trạng thái cọc        | `UC-U1`, `UC-U3` | Public (Guest)   | **Res**: Thông tin bàn, ngày giờ hẹn, số tiền cọc, trạng thái (`Reserved` / `AwaitingPayment`)                                                       |
| **POST**    | `/api/payments/vnpay-ipn`                | Webhook nhận tín hiệu IPN xác nhận cọc từ VNPAY   | `UC-U1`          | Server-to-Server | **Req**: Tham số giao dịch ký số từ VNPAY<br>**Res**: `RspCode: 00` (Xác nhận cọc thành công, bàn chuyển `Reserved`)                                 |
| **GET**     | `/api/payments/vnpay-return`             | Xử lý redirect trang kết quả thanh toán cho khách | `UC-U1`          | Public (Guest)   | **Res**: Điều hướng giao diện thông báo đặt bàn thành công kèm `BookingCode`                                                                         |
| **GET**     | `/api/menu`                              | Xem danh mục thực đơn A La Carte tại bàn          | `UC-U2`          | Public (Display) | **Res**: Danh sách món ăn kèm giá, hình ảnh, mô tả, nhãn cảnh báo dị ứng (`BR-02`)                                                                   |
| **GET**     | `/api/menu/categories`                   | Lấy danh sách nhóm món ăn (Khai vị, Món chính...) | `UC-U2`          | Public (Display) | **Res**: Danh sách phân loại thực đơn hiển thị trên Digital Display                                                                                  |
| **PATCH**   | `/api/reservations/{bookingCode}/cancel` | Khách chủ động hủy đặt bàn & Hoàn cọc tự động     | `UC-U3`          | Public (Guest)   | **Req**: `BookingCode`, `Reason`<br>**Res**: Hoàn cọc 100% nếu $\ge$ 4h; phạt 100% nếu < 4h (`BR-05`)                                                |
| **POST**    | `/api/feedbacks`                         | Gửi đánh giá sao & nhận xét sau bữa ăn            | `UC-U4`          | Public (Guest)   | **Req**: `BookingCode` / `TableId`, `Rating` (1–5 sao), `Comment`<br>**Res**: Ghi nhận đánh giá thành công                                           |

---

#### 🟡 2.2 Phân hệ Nghiệp vụ Nhân viên (Employee / Internal APIs — `UC-E1` đến `UC-E5`)
> *Đặc điểm*: Dành cho nhân viên phục vụ (Waitstaff) và điều phối (Expediter) thao tác trên thiết bị Tablet cầm tay. **Bắt buộc đính kèm JWT Bearer Token** (`Authorization: Bearer <token>`).

| Phương thức | Endpoint URL | Chức năng nghiệp vụ | Ánh xạ Use Case | Quyền hạn (Auth) | Mô tả Request / Response chính |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **POST** | `/api/auth/login` | Nhân viên đăng nhập hệ thống cấp JWT Token | `UC-E5` | Public (Nội bộ) | **Req**: `Username`, `Password`<br>**Res**: `AccessToken` (JWT), `Role`, `FullName`, `ExpiresIn` |
| **GET** | `/api/auth/me` | Lấy thông tin tài khoản và ca trực của nhân viên | `UC-E5` | Waitstaff, Expediter, Manager | **Res**: Hồ sơ nhân sự, danh sách quyền hạn RBAC |
| **GET** | `/api/tables` | Tra cứu sơ đồ bàn và trạng thái thực tế | `UC-E1`, `UC-E4` | Waitstaff, Manager | **Res**: Danh sách bàn ăn kèm trạng thái thời gian thực (Available, Reserved, Occupied, Cleaning) |
| **PATCH** | `/api/tables/{id}/check-in` | Check-in đón khách vào bàn (`Occupied`) | `UC-E1` | Waitstaff | **Req**: `BookingCode` (nếu có đặt trước) hoặc trực tiếp<br>**Res**: Bàn chuyển sang `Occupied`, sẵn sàng gọi món |
| **POST** | `/api/orders` | Tạo đơn gọi món trực tiếp & Kích hoạt in Bếp | `UC-E1` | Waitstaff | **Req**: `TableId`, Danh sách `MenuItemId`, `Quantity`, `AllergyNotes`<br>**Res**: Tạo Order `Processing`, tự động xuất lệnh in nhiệt Bếp (`BR-04`) |
| **GET** | `/api/orders/active` | Xem danh sách các món đang chế biến tại quầy Pass | `UC-E2` | Expediter, Manager | **Res**: Danh sách các `OrderItem` trạng thái `Preparing` chờ ra món |
| **PATCH** | `/api/orders/{orderId}/items/{itemId}/serve` | Bấm xác nhận hoàn thành món tại quầy Pass | `UC-E2` | Expediter, Manager | **Res**: Chuyển món sang `Served`, ghi nhận thời điểm phục vụ thực tế (`BR-04`) |
| **GET** | `/api/invoices/preview/{tableId}` | Xem trước hóa đơn tạm tính kèm cấn trừ cọc | `UC-E3` | Waitstaff, Manager | **Res**: Bảng kê Subtotal, 5% Phí PV, 10% VAT, Tiền cọc đã cấn trừ, Số tiền phải trả (`BR-03`) |
| **POST** | `/api/invoices/settle` | Hoàn tất thanh toán, đóng bàn sang `Cleaning` | `UC-E3` | Waitstaff, Manager | **Req**: `TableId`, `PaymentMethod` (Tiền mặt, Thẻ, QR, Cọc bù trừ)<br>**Res**: Hóa đơn tài chính, bàn chuyển sang `Cleaning` |
| **PATCH** | `/api/tables/{id}/clean-complete` | Xác nhận dọn bàn xong, mở bàn về `Available` | `UC-E3` | Waitstaff | **Res**: Bàn ăn chuyển về trạng thái `Available` trên sơ đồ SignalR |
| **POST** | `/api/tables/{id}/transfer` | Đổi bàn / Chuyển toàn bộ đơn hàng sang bàn mới | `UC-E4` | Waitstaff, Manager | **Req**: `SourceTableId`, `TargetTableId`, `Reason`<br>**Res**: Chuyển Order & tiền cọc sang bàn mới, bàn cũ sang `Cleaning` |
| **POST** | `/api/tables/merge` | Ghép nhiều bàn ăn lại thành một nhóm đơn hàng | `UC-E4` | Waitstaff, Manager | **Req**: Danh sách `TableIds` cần ghép, `PrimaryTableId`<br>**Res**: Hợp nhất Order và quản lý hóa đơn chung |

---

#### 🔵 2.3 Phân hệ Quản lý & Quản trị (Admin & Manager APIs — `UC-A1` đến `UC-A5`)
> *Đặc điểm*: Dành cho Quản lý nhà hàng và Quản trị viên hệ thống truy cập qua cổng Web Portal trên máy tính. **Yêu cầu quyền Manager hoặc Admin**.

| Phương thức | Endpoint URL | Chức năng nghiệp vụ | Ánh xạ Use Case | Quyền hạn (Auth) | Mô tả Request / Response chính |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **POST** | `/api/admin/menu-items` | Thêm món ăn mới vào thực đơn A La Carte | `UC-A1` | Manager, Admin | **Req**: `Name`, `Price`, `CategoryId`, `ImageUrl`, `AllergyInfo`<br>**Res**: Món mới được tạo và cập nhật tức thời trên E-Menu |
| **PUT** | `/api/admin/menu-items/{id}` | Cập nhật thông tin chi tiết, đơn giá món ăn | `UC-A1` | Manager, Admin | **Req**: Các trường thông tin món cần chỉnh sửa<br>**Res**: Trạng thái cập nhật thành công |
| **PATCH** | `/api/admin/menu-items/{id}/availability` | Bật / Tắt trạng thái còn món hoặc tạm hết hàng | `UC-A1` | Manager | **Req**: `IsAvailable: true/false`<br>**Res**: Đồng bộ trạng thái món lên Digital Display |
| **DELETE** | `/api/admin/menu-items/{id}` | Xóa hoặc vô hiệu hóa món ăn khỏi thực đơn | `UC-A1` | Manager, Admin | **Res**: Món bị ẩn khỏi menu phục vụ |
| **POST** | `/api/admin/categories` | Quản trị danh mục món ăn (Khai vị, Rượu vang...) | `UC-A1` | Manager, Admin | **Req**: `Name`, `DisplayOrder`<br>**Res**: Danh mục mới được thiết lập |
| **POST** | `/api/admin/tables` | Thêm vị trí bàn ăn mới vào sơ đồ nhà hàng | `UC-A2` | Manager, Admin | **Req**: `TableNumber`, `Capacity`, `Zone`<br>**Res**: Bàn mới được thêm vào CSDL |
| **PUT** | `/api/admin/tables/{id}` | Chỉnh sửa sức chứa, khu vực hoặc tên bàn | `UC-A2` | Manager, Admin | **Req**: `TableNumber`, `Capacity`, `Zone`<br>**Res**: Trạng thái cập nhật thành công |
| **PUT** | `/api/admin/tables/layout` | Cập nhật tọa độ bố trí sơ đồ bàn ăn (Floor Plan) | `UC-A2` | Manager, Admin | **Req**: Danh sách `{TableId, CoordX, CoordY, Zone}`<br>**Res**: Lưu tọa độ và phát SignalR đồng bộ sơ đồ mới (`UC-A2`) |
| **POST** | `/api/admin/reservations/{id}/manual-refund` | Duyệt hoàn tiền cọc thủ công ngoại lệ | `UC-A3` | Manager, Admin | **Req**: `ReservationId`, `RefundReason`, `OverrideNotes`<br>**Res**: Kích hoạt VNPAY Refund API và lưu vết Audit Log (`BR-05`) |
| **GET** | `/api/admin/staff` | Lấy danh sách tài khoản nhân viên và vai trò | `UC-A4` | Admin | **Res**: Danh sách nhân sự nội bộ kèm trạng thái hoạt động |
| **POST** | `/api/admin/staff` | Tạo tài khoản nhân viên mới và gán quyền RBAC | `UC-A4` | Admin | **Req**: `FullName`, `Username`, `Email`, `Role`<br>**Res**: Cấp tài khoản và gửi thông tin kích hoạt qua Email |
| **PATCH** | `/api/admin/staff/{id}/status` | Khóa hoặc kích hoạt lại tài khoản nhân viên | `UC-A4` | Admin | **Req**: `IsActive: true/false`<br>**Res**: Thu hồi token đăng nhập nếu bị khóa |
| **GET** | `/api/admin/reports/dashboard` | Xem dữ liệu thống kê tổng quan thời gian thực | `UC-A5` | Manager, Admin | **Res**: Doanh thu trong ngày, tỷ lệ lấp đầy bàn, số lượt đặt bàn |
| **GET** | `/api/admin/reports/revenue` | Báo cáo chi tiết doanh thu và cơ cấu thanh toán | `UC-A5` | Manager, Admin | **Req**: `FromDate`, `ToDate`, `GroupBy` (Ngày/Tháng)<br>**Res**: Báo cáo tài chính chi tiết (Tiền món, Phí DV, VAT, Cọc) |

---

#### 🟣 2.4 Phân hệ Tự động Hệ thống (System Services — `UC-S1`)
> *Đặc điểm*: Dành cho các tác vụ nền ngầm (Background Workers / Cron Jobs) chạy tự động bảo toàn trạng thái dữ liệu.

| Phương thức | Endpoint / Job Trigger | Chức năng nghiệp vụ | Ánh xạ Use Case | Cơ chế thực thi | Mô tả xử lý logic |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **POST** | `/api/system/cleanup-expired-locks` | Tự động quét và giải phóng bàn hết hạn giữ cọc | `UC-S1` | Hangfire Job (Mỗi 60s) hoặc Webhook nội bộ | Quét các đơn đặt bàn có trạng thái `PendingPayment` tạo quá **17 phút** (`BR-01`). Tự động cập nhật `Expired_Cancelled`, trả bàn về `Available` và bắn SignalR Hub thông báo. |
| **GET** | `/api/system/health` | Kiểm tra trạng thái kết nối các thành phần nền tảng | Toàn hệ thống | Public (Monitoring) | Kiểm tra kết nối SQL Server, SignalR Hub, Cổng VNPAY và các Máy in nhiệt ESC/POS qua mạng LAN. |

---

### 3. Chuẩn hóa Mã trạng thái HTTP & Cấu trúc Phản hồi (Standard Response Format)

Tất cả các API tuân thủ cấu trúc phản hồi đồng nhất theo mô hình `Result<T>` của Clean Architecture:

```json
{
  "isSuccess": true,
  "statusCode": 200,
  "message": "Thao tác thành công",
  "data": { ... },
  "errors": []
}
```

* **200 OK**: Truy vấn hoặc cập nhật dữ liệu thành công.
* **201 Created**: Tạo mới tài nguyên (Order, Reservation, Invoice) thành công.
* **400 Bad Request**: Lỗi dữ liệu đầu vào hoặc vi phạm quy tắc nghiệp vụ (`BR-01`..`BR-05`).
* **401 Unauthorized**: Chưa đăng nhập hoặc JWT Token hết hạn.
* **403 Forbidden**: Không có quyền truy cập theo vai trò RBAC (Ví dụ Waitstaff gọi API của Manager).
* **404 Not Found**: Không tìm thấy tài nguyên theo ID hoặc BookingCode.
* **409 Conflict**: Xung đột tranh chấp đặt bàn hoặc bàn đang được phục vụ.
