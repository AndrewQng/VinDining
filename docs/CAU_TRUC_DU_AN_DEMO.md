# Tài Liệu Chi Tiết Cấu Trúc Dự Án VinDining (Sau Khi Bỏ Mock — Chạy Live SQL Server & SignalR)

Tài liệu mô tả theo từng dòng toàn bộ cấu trúc thư mục, chức năng từng file, dữ liệu/hàm bên trong và mối liên kết giữa các module của hệ thống **VinDining** (Backend ASP.NET Core .NET 9 + SQL Server + SignalR + Frontend React 19 + Mobile Android Capacitor).

---

## 1. Tổng Quan Kiến Trúc & Luồng Liên Kết

- Hệ thống vận hành theo kiến trúc MVC kết hợp RESTful API và đồng bộ thời gian thực qua SignalR, kết nối trực tiếp Microsoft SQL Server (đã bỏ hoàn toàn tầng Mock trên Frontend).
- Luồng gọi dữ liệu: Giao diện React (`frontend/src/pages/*`) sử dụng các hàm thuần trong `frontend/src/domain/*` và trạng thái từ `frontend/src/stores/*`, gọi HTTP JSON kèm JWT qua `frontend/src/services/api/*` tới `GlobalExceptionMiddleware` → `Controllers` → `Services` (kèm khóa đồng thời `TableConcurrencyLock`) → `ApplicationDbContext` (EF Core 9) → `SQL Server`.
- Luồng thời gian thực: Sau khi lưu CSDL, `Services` phát sự kiện qua `TableNotifier` / `KitchenNotifier` tới `TableHub` (`/hubs/tables`) và `KitchenHub` (`/hubs/kitchen`), đẩy WebSocket về `signalrRealtimeClient.ts` và hook `useRealtime.ts` trên Frontend để tự động làm mới dữ liệu.

---

## 2. Thư Mục & File Cấp Cao Nhất (Root Workspace)

- `backend/` — Chứa solution `Restaurant.sln`, project Web API chính (`backend/src/API/`) và project kiểm thử (`backend/tests/UnitTests/`); phục vụ RESTful API tại `http://localhost:5159/api` và SignalR tại `http://localhost:5159/hubs` cho `frontend/` và `mobile/`.
- `frontend/` — Ứng dụng React 19 SPA (TypeScript, Vite 8, Tailwind CSS v4, TanStack Query v5, Zustand v5); gọi HTTP và WebSocket tới `backend/`, đồng thời xuất bản build tĩnh `frontend/dist` cho `mobile/`.
- `mobile/` — Dự án Capacitor đóng gói giao diện React thành ứng dụng Android Hybrid (`.apk`); đọc gói build từ `../frontend/dist` và kết nối về `backend/`.
- `docs/` — Chứa tài liệu kiến trúc (`FRONTEND_ARCHITECTURE.md`, `CONCURRENCY_AND_LOCKING.md`, `CAU_TRUC_DU_AN_DEMO.md`), đặc tả API (`api.md`, `controllers.md`), ADR (`docs/adr/`) và sơ đồ (`docs/Diagram/`).
- `demo.md` — Kịch bản thuyết trình và demo trực tiếp 10–15 phút trên SQL Server thật, dẫn chiếu theo đúng các route của `frontend/` và `backend/`.
- `CONTEXT.md` — Định nghĩa ngôn ngữ nghiệp vụ thống nhất (Guest, Reservation, Deposit, Table, MenuItem, Order, Invoice, Staff) làm chuẩn đặt tên cho `Models/Entities`, `DTOs` (Backend) và `types/`, `domain/` (Frontend).
- `package.json` — Chứa các script chạy nhanh ở thư mục gốc (`npm run dev`, `build`, `lint`, `typecheck`), ủy quyền thực thi xuống `frontend/package.json`.
- `.env.example` — Mẫu biến môi trường gốc (`DB_CONNECTION_STRING`, `JWT_*`, `VITE_*`), làm mẫu cấu hình cho `backend/src/API/.env` và `frontend/.env`.

---

## 3. Chi Tiết Backend (`backend/src/API/` & `backend/tests/UnitTests/`)

### 3.1. Các file khởi tạo & cấu hình gốc (`backend/src/API/`)

- `Program.cs` — Điểm khởi chạy Backend: nạp `.env` bằng `DotNetEnv`, đăng ký `ApplicationDbContext` (SQL Server), ASP.NET Core Identity, xác thực JWT Bearer, CORS, Swagger, đăng ký 22 Services vào DI Container, khai báo `VinDiningEnumJsonConverter` và `VinDiningUtcDateTimeJsonConverter`, gọi `DatabaseSeeder.SeedAsync`, gắn `GlobalExceptionMiddleware`, map toàn bộ Controllers cùng `TableHub` và `KitchenHub`.
- `GlobalUsings.cs` — Khai báo `global using` cho EF Core và các namespace `API.Data`, `API.Models.*`, `API.DTOs.*`, `API.Services.*`, được nạp tự động vào mọi file `.cs` trong project `API`.
- `API.csproj` — Khai báo TargetFramework `net9.0` và các gói NuGet (`Microsoft.EntityFrameworkCore.SqlServer`, `Identity.EntityFrameworkCore`, `JwtBearer`, `DotNetEnv`, `Swashbuckle.AspNetCore`), được tham chiếu bởi `Restaurant.sln` và `UnitTests.csproj`.
- `.env` và `.env.example` — Lưu chuỗi kết nối SQL Server (`DB_CONNECTION_STRING`), cấu hình JWT (`JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_EXPIRY_MINUTES`) và cấu hình VNPAY (`VNPAY_*`), được `Program.cs` đọc khi khởi động để cấp cho `ApplicationDbContext`, `JwtTokenService`, `VnPayPaymentGateway`.
- `Properties/launchSettings.json` — Định nghĩa cổng chạy local `http://localhost:5159` và `https://localhost:7000`, khớp với `VITE_API_URL` và `VITE_SIGNALR_URL` bên `frontend/.env.development`.

### 3.2. Thư mục `backend/src/API/Data/` (Truy cập CSDL, Cấu hình EF Core & Seed)

- `IApplicationDbContext.cs` — Interface khai báo 13 `DbSet<T>` và `SaveChangesAsync`, được inject vào tất cả các class trong `Services/` để tách biệt logic nghiệp vụ khỏi lớp `DbContext` cụ thể.
- `ApplicationDbContext.cs` — Kế thừa `IdentityDbContext<ApplicationUser, ApplicationRole, Guid>` và hiện thực hóa `IApplicationDbContext`: quản lý 13 bảng nghiệp vụ, tự nạp 14 file cấu hình Fluent API trong `Data/Configurations/`, chuẩn hóa mọi trường `DateTime` về UTC và tự động gán `CreatedAt` cho các thực thể `IHasCreatedAt`.
- `DatabaseSeeder.cs` — Tự động chạy `Database.MigrateAsync()` khi khởi động và seed dữ liệu nền vào SQL Server gồm 4 tài khoản nhân viên (`mai.tt`, `quan.lm`, `ha.pt`, `long.dh` dùng mật khẩu `VinDining@2026`), 4 danh mục (`Categories`), 9 món ăn (`MenuItems`), 4 thực đơn Set Menu (`TastingMenus` + `TastingMenuItems`), và 15 bàn (`Tables` ở trạng thái `Available`); được gọi từ `Program.cs` và kiểm thử bởi `DatabaseSeederTests.cs`.
- `Configurations/ApplicationUserConfiguration.cs` — Cấu hình bảng tài khoản Identity liên kết với `ApplicationDbContext`.
- `Configurations/CategoryConfiguration.cs` — Cấu hình khóa chính, độ dài tên và thứ tự hiển thị cho thực thể `Category`, liên kết `1-N` với `MenuItem`.
- `Configurations/DepositConfiguration.cs` — Cấu hình bảng `Deposits` với kiểu tiền tệ `decimal(18,2)` và quan hệ `1-1` với `Reservation`.
- `Configurations/FeedbackConfiguration.cs` — Cấu hình bảng `Feedbacks`, ràng buộc điểm đánh giá và quan hệ với `Reservation`.
- `Configurations/GuestConfiguration.cs` — Cấu hình bảng `Guests`, chỉ mục tìm kiếm theo `PhoneNumber` và quan hệ `1-N` với `Reservation`.
- `Configurations/InvoiceConfiguration.cs` — Cấu hình bảng `Invoices`, các cột tiền tệ `decimal(18,2)`, chỉ mục `SurveyToken` và quan hệ `1-1` với `Order`, `N-1` với `Staff`.
- `Configurations/MenuItemConfiguration.cs` — Cấu hình bảng `MenuItems`, giá bán `decimal(18,2)`, thời gian chế biến và khóa ngoại tới `Category`.
- `Configurations/OrderConfiguration.cs` — Cấu hình bảng `Orders`, khóa ngoại tới `Table`, `Reservation`, `Staff` và quan hệ `1-N` với `OrderItem`.
- `Configurations/OrderItemConfiguration.cs` — Cấu hình bảng `OrderItems`, đơn giá, trạng thái món theo Course và khóa ngoại tới `Order`, `MenuItem`, `TastingMenu`, `Staff`.
- `Configurations/ReservationConfiguration.cs` — Cấu hình bảng `Reservations`, chỉ mục duy nhất cho `BookingCode`, concurrency token và khóa ngoại tới `Guest`, `Table`, `TastingMenu`.
- `Configurations/StaffConfiguration.cs` — Cấu hình bảng `Staffs`, chỉ mục duy nhất cho `Username`/`Email`, các trường khóa đăng nhập (`FailedLoginAttempts`, `LockedUntil`).
- `Configurations/TableConfiguration.cs` — Cấu hình bảng `Tables`, chỉ mục duy nhất cho `TableNumber` và `QrCode`, tọa độ `PosX`/`PosY`, concurrency token.
- `Configurations/TastingMenuConfiguration.cs` và `TastingMenuItemConfiguration.cs` — Cấu hình bảng Set Menu (`TastingMenus`) và bảng chi tiết món trong Set Menu (`TastingMenuItems`) nối với `MenuItem`.
- `Migrations/*.cs` (8 bản migration + `ApplicationDbContextModelSnapshot.cs`) — Lưu lịch sử tiến hóa schema SQL Server từ `InitialCreate` đến `AddReservationPreOrderedTastingMenu`, được EF Core thực thi khi nâng cấp CSDL.

### 3.3. Thư mục `backend/src/API/Models/` (Thực thể, Enum, Identity & Dùng chung)

#### `Models/Entities/` (13 thực thể CSDL)
- `Staff.cs` — Lưu thông tin nhân sự nội bộ (`FullName`, `Username`, `Email`, `PhoneNumber`, `PasswordHash`, `Role`, `IsActive`, `FailedLoginAttempts`, `LockedUntil`), liên kết với `Order`, `OrderItem`, `Invoice` và được sử dụng bởi `AuthService`, `StaffService`.
- `Guest.cs` — Lưu thông tin khách đặt bàn (`FullName`, `PhoneNumber`, `Email`), liên kết `1-N` với `Reservation` và được sử dụng bởi `ReservationService`.
- `Table.cs` — Lưu thông tin bàn ăn (`TableNumber`, `Capacity`, `Zone`, `Status`, `QrCode`, `PosX`, `PosY`, `CurrentGuestCount`, `CheckoutRequestedAt`, `IsActive`), liên kết với `Reservation`, `Order` và được xử lý trong `TableService`, `AdminTableService`, `ReservationService`, `OrderService`, `InvoiceService`.
- `Category.cs` — Lưu nhóm thực đơn (`Name`, `Description`, `DisplayOrder`, `IsActive`), liên kết `1-N` với `MenuItem` và dùng bởi `MenuService`, `AdminMenuService`.
- `MenuItem.cs` — Lưu món ăn/đồ uống lẻ (`CategoryId`, `Name`, `Description`, `Price`, `CourseType`, `Status`, `ImageUrl`, `PrepTimeMinutes`, `IsFeatured`), liên kết với `Category`, `TastingMenuItem`, `OrderItem` và dùng bởi `MenuService`, `AdminMenuService`, `OrderService`.
- `TastingMenu.cs` — Lưu thực đơn Set Menu (`Name`, `Description`, `Price`, `ImageUrl`, `IsActive`), liên kết `1-N` với `TastingMenuItem` và `Reservation.PreOrderedTastingMenuId`.
- `TastingMenuItem.cs` — Thực thể trung gian nối `TastingMenu` với `MenuItem` kèm thứ tự `CourseOrder` và `CourseType`.
- `Reservation.cs` — Lưu đơn đặt bàn (`BookingCode`, `GuestId`, `TableId`, `PreOrderedTastingMenuId`, `ReservationTime`, `PartySize`, `DurationMinutes`, `Status`, `Note`, `CheckedInAt`, `CancelledAt`, `CancelledReason`), liên kết với `Guest`, `Table`, `TastingMenu`, `Deposit`, `Order`, `Feedback` và được xử lý bởi `ReservationService`, `TableService`, `RefundService`, `ExpiredReservationLockService`.
- `Deposit.cs` — Lưu khoản tiền cọc (`ReservationId`, `Amount`, `PaymentMethod`, `Status`, `TransactionCode`, `PaidAt`, `RefundAmount`, `RefundedAt`, `RefundReason`), liên kết `1-1` với `Reservation`, dùng để cấn trừ trong `InvoiceService` và xét duyệt hoàn tiền trong `RefundService`.
- `Order.cs` — Lưu đơn phục vụ tại bàn (`TableId`, `ReservationId`, `CreateById`, `Status`, `OpenedAt`, `ClosedAt`), liên kết với `Table`, `Reservation`, `Staff`, `OrderItem`, `Invoice` và được xử lý bởi `OrderService`, `InvoiceService`.
- `OrderItem.cs` — Lưu từng món đã gọi trong đơn (`OrderId`, `MenuItemId`, `TastingMenuId`, `CourseType`, `Quantity`, `UnitPrice`, `Status`, `Note`, `IsPriority`, `IsRush`, `FiredAt`, `ServedAt`, `ServedById`), được điều phối bởi `OrderService` và quét SLA bởi `OrderSlaMonitorWorker`.
- `Invoice.cs` — Lưu hóa đơn quyết toán (`OrderId`, `SettleById`, `Subtotal`, `ServiceCharge`, `VatAmount`, `DeductedDeposit`, `TotalAmount`, `AmountDue`, `PaymentMethod`, `IsPaid`, `PaidAt`, `SurveyToken`, `SurveySentAt`), liên kết với `Order`, `Staff` và dùng bởi `InvoiceService`, `ReportService`, `FeedbackService`, `DiningSurveyWorker`.
- `Feedback.cs` — Lưu đánh giá sau bữa ăn (`ReservationId`, `OverallRating`, `FoodRating`, `ServiceRating`, `AmbianceRating`, `Comment`), liên kết với `Reservation` và dùng bởi `FeedbackService`.

#### `Models/Enums/` (9 file Enum)
- `CourseType.cs`, `DepositStatus.cs`, `OrderItemStatus.cs`, `OrderStatus.cs`, `PaymentMethod.cs`, `ReservationStatus.cs`, `StaffRole.cs`, `TableStatus.cs`, `TableZone.cs` — Định nghĩa tập giá trị trạng thái/phân loại cho toàn bộ Entities và DTOs, được `VinDiningEnumJsonConverter` trong `Program.cs` chuyển đổi hai chiều sang chuỗi JSON khớp với `frontend/src/types/`.

#### `Models/Common/` & `Models/Identity/`
- `BaseEntity.cs`, `IHasCreatedAt.cs`, `IDomainEvent.cs` — Lớp cơ sở cung cấp `Id (Guid)` và `CreatedAt (DateTime)` cho tất cả các thực thể trong `Models/Entities/`.
- `ApiResponse.cs` — Cấu trúc JSON trả về thống nhất (`success`, `statusCode`, `message`, `data`, `timestamp`) dùng bởi `ApiControllerBase.cs` và được `frontend/src/services/api/client.ts` tự động bóc vỏ.
- `Result.cs`, `DomainExceptions.cs` (`ConflictException`, `ForbiddenException`), `ValidationException.cs` — Các lớp kết quả và ngoại lệ nghiệp vụ, được ném từ `Services/` và được `GlobalExceptionMiddleware.cs` bắt để trả về HTTP status code tương ứng.
- `ApplicationUser.cs` và `ApplicationRole.cs` — Các lớp người dùng và vai trò của ASP.NET Core Identity gắn với `ApplicationDbContext`.

### 3.4. Thư mục `backend/src/API/DTOs/` (Hợp đồng dữ liệu Request/Response)

- `Auth/AuthDtos.cs` — Chứa `LoginRequestDto`, `LoginResponseDto`, `CurrentUserDto`; dùng bởi `AuthController`, `AuthService` và liên kết với `frontend/src/types/auth.ts`.
- `Reservations/ReservationDtos.cs` — Chứa `CreateReservationDto`, `CreateReservationResultDto`, `ReservationDetailDto`, `SlotAvailabilityDto`, `VnPayCallbackDto`, `CancelReservationDto`; dùng bởi `ReservationController`, `ReservationService` và liên kết với `frontend/src/types/reservation.ts`.
- `Menus/MenuDtos.cs` — Chứa `CategoryDto`, `MenuItemDto`, `TastingMenuDto`, `PublicMenuResponseDto`; dùng bởi `MenuController`, `MenuService` và liên kết với `frontend/src/types/menu.ts`.
- `Tables/TableDtos.cs` — Chứa `TableDto`, `FloorPlanResponseDto`, `CheckInRequestDto`, `WalkInRequestDto`, `TransferTableDto`, `MergeTablesDto`, `UpdateTableStatusDto`; dùng bởi `TableController`, `TableService` và liên kết với `frontend/src/types/table.ts`.
- `Orders/OrderDtos.cs` — Chứa `CreateOrderDto`, `OrderItemRequestDto`, `AddItemsDto`, `FireCourseDto`, `RemakeItemDto`, `OrderDetailDto`, `OrderItemDetailDto`, `PassHistoryItemDto`; dùng bởi `OrderController`, `OrderService` và liên kết với `frontend/src/types/order.ts`.
- `Invoices/InvoiceDtos.cs` — Chứa `InvoicePreviewDto`, `CheckoutRequestDto`, `InvoiceDetailDto`, `CashierQueueItemDto`; dùng bởi `InvoiceController`, `InvoiceService` và liên kết với `frontend/src/types/invoice.ts`.
- `ServiceCalls/ServiceCallDtos.cs` — Chứa `CreateServiceCallDto`, `ServiceCallDto`; dùng bởi `ServiceCallController`, `ServiceCallService` và liên kết với `frontend/src/types/serviceRequest.ts`.
- `Feedbacks/FeedbackDtos.cs` — Chứa `CreateFeedbackDto`, `FeedbackDetailDto`, `FeedbackEligibilityDto`; dùng bởi `FeedbackController`, `FeedbackService` và liên kết với `frontend/src/types/feedback.ts`.
- `Admin/AdminDtos.cs` — Chứa các DTO tạo/cập nhật món ăn, Set Menu, bàn ăn, tọa độ sơ đồ bàn và duyệt hoàn cọc; dùng bởi `AdminMenuController`, `AdminTableController`, `AdminRefundController`.
- `Staff/StaffDtos.cs` — Chứa `StaffDto`, `CreateStaffDto`, `UpdateStaffDto`, `StaffCredentialResultDto`; dùng bởi `AdminStaffController`, `StaffService` và liên kết với `frontend/src/types/staff.ts`.
- `Reports/ReportDtos.cs` — Chứa `RevenueReportDto`, `DailyRevenuePointDto`, `PopularDishDto`; dùng bởi `ReportController`, `ReportService` và liên kết với `frontend/src/types/report.ts`.

### 3.5. Thư mục `backend/src/API/Controllers/` (17 RESTful Controllers)

- `ApiControllerBase.cs` — Lớp controller cơ sở chứa helper `OkResponse` và `CreatedResponse` bọc dữ liệu vào `ApiResponse<T>`, được toàn bộ 16 controller bên dưới kế thừa.
- `AuthController.cs` — Cung cấp `POST /api/auth/login` và `GET /api/auth/me` để đăng nhập và lấy thông tin nhân sự từ JWT; gọi `IAuthService` và nhận request từ `authApi` (`frontend/src/services/api/index.ts`).
- `MenuController.cs` — Cung cấp `GET /api/menus`, `/categories`, `/tasting-menus`, `/qr/{qrCode}`; gọi `IMenuService` và phục vụ dữ liệu cho `HomePage`, `BookingPage`, `EMenuPage`, `OrderMenuPicker`.
- `ReservationController.cs` — Cung cấp các endpoint kiểm tra bàn trống theo khung giờ, tạo đơn giữ chỗ, nhận callback IPN thanh toán cọc VNPAY (`POST /api/payments/vnpay-ipn`), tra cứu và hủy đặt bàn; gọi `IReservationService` và nhận request từ `BookingPage`, `VnPayMockPage`, `LookupReservationPage`.
- `TableController.cs` — Cung cấp các endpoint lấy sơ đồ bàn, check-in đơn đặt trước, mở bàn walk-in, đổi bàn, gộp bàn và đổi trạng thái bàn; gọi `ITableService` và nhận request từ `FloorPlanPage`, `CheckInLookupPage`, `CashierCheckInPage`, `TransferTablePage`.
- `OrderController.cs` — Cung cấp các endpoint tạo đơn gọi món, lấy đơn theo bàn, gọi thêm món, bắn Course tiếp theo, xác nhận đã phục vụ, yêu cầu làm lại, hủy món, lấy hàng đợi bếp KDS và lịch sử quầy Pass; gọi `IOrderService` và nhận request từ `CreateOrderPage`, `ActiveOrderPage`, `AddItemsPage`, `KdsBoardPage`, `ExpediterPassPage`.
- `InvoiceController.cs` — Cung cấp các endpoint gửi yêu cầu thanh toán, lấy hàng đợi thu ngân, xem tạm tính cấn trừ cọc, chốt thanh toán và xem hóa đơn trong ngày; gọi `IInvoiceService` và nhận request từ `ActiveOrderPage`, `CashierQueuePage`, `InvoicePreviewPage`, `InvoicesTodayPage`.
- `ServiceCallController.cs` — Cung cấp các endpoint tạo yêu cầu gọi phục vụ từ QR E-Menu tại bàn và đánh dấu hoàn tất; gọi `IServiceCallService` và nhận request từ `EMenuPage`, `NotificationsPage`.
- `FeedbackController.cs` — Cung cấp các endpoint kiểm tra token khảo sát và gửi đánh giá sau bữa ăn; gọi `IFeedbackService` và nhận request từ `FeedbackPage`.
- `AdminMenuController.cs` — Cung cấp CRUD món ăn, Set Menu và đổi trạng thái hết món cho Quản lý; gọi `IAdminMenuService` và nhận request từ `ManagerMenuPage`.
- `AdminTableController.cs` — Cung cấp CRUD bàn ăn, lưu tọa độ sơ đồ bàn và tạo lại mã QR; gọi `IAdminTableService` và nhận request từ `ManagerFloorPlanPage`.
- `AdminRefundController.cs` — Cung cấp danh sách yêu cầu hoàn cọc ngoại lệ và phê duyệt/từ chối hoàn tiền; gọi `IRefundService` và nhận request từ `ManagerRefundsPage`.
- `AdminStaffController.cs` — Cung cấp CRUD tài khoản nhân viên, khóa/mở khóa và cấp lại mật khẩu; gọi `IStaffService` và nhận request từ `ManagerStaffPage`.
- `ReportController.cs` — Cung cấp dữ liệu báo cáo doanh thu, phương thức thanh toán và món bán chạy; gọi `IReportService` và nhận request từ `ManagerReportsPage`.
- `HealthController.cs` — Cung cấp `GET /api/health` kiểm tra trạng thái hoạt động của API và kết nối SQL Server.
- `TestingController.cs` — Cung cấp endpoint hỗ trợ kiểm thử tự động trong môi trường Development/Testing.

### 3.6. Thư mục `backend/src/API/Services/` & `Services/Interfaces/` (Xử lý Nghiệp vụ)

- `Services/Interfaces/*.cs` (20 files) — Khai báo hợp đồng interface cho từng Service tương ứng, được đăng ký DI trong `Program.cs` để đảm bảo nguyên lý Dependency Inversion.
- `TableConcurrencyLock.cs` — Singleton quản lý `ConcurrentDictionary<Guid, SemaphoreSlim(1, 1)>` thực hiện Pessimistic Lock theo từng `TableId` (timeout 5 giây) và sắp xếp danh sách `TableId` tăng dần khi khóa nhiều bàn để chống Deadlock; được dùng chung bởi `ReservationService`, `TableService`, `OrderService`, `InvoiceService`, `ExpiredReservationLockService`.
- `AuthService.cs` — Kiểm tra mật khẩu băm (`IPasswordHasher<Staff>`), tăng bộ đếm khi sai mật khẩu, khóa tài khoản 15 phút khi sai 5 lần liên tiếp (`423 Locked`) và gọi `IJwtTokenService` cấp token; liên kết với `ApplicationDbContext` và `AuthController`.
- `JwtTokenService.cs` — Ký và phát hành chuỗi JWT Bearer chứa `Id`, `Username`, `Role` dựa trên khóa `JWT_SECRET`; được gọi bởi `AuthService`.
- `CurrentUserService.cs` — Trích xuất `StaffId`, `Username`, `Role` từ `IHttpContextAccessor`; được dùng bởi `OrderService`, `InvoiceService`, `RefundService`, `StaffService`.
- `ReservationService.cs` — Xử lý toàn bộ nghiệp vụ đặt bàn: kiểm tra xung đột khung giờ 120 phút, tính tiền cọc (`500.000đ/khách` hoặc `30%` giá Set Menu), chuyển bàn sang `LockedForPayment` giữ chỗ 17 phút, xác nhận thanh toán cọc qua IPN, tra cứu và hủy đơn (trước 4 giờ hoàn cọc, sát giờ chuyển yêu cầu sang Manager); liên kết với `ITableConcurrencyLock`, `IPaymentGateway`, `ITableNotifier`, `ApplicationDbContext`.
- `ReservationGuestStatus.cs` — Chứa các hàm chuẩn hóa lý do hủy đơn, đánh dấu hết hạn giữ chỗ và suy luận trạng thái hiển thị cho khách; được gọi bởi `ReservationService`, `ExpiredReservationLockService`, `RefundService`, `TableService`.
- `VnPayPaymentGateway.cs` và `MockPaymentGateway.cs` — Hiện thực hóa `IPaymentGateway` để sinh đường dẫn thanh toán cọc và kiểm tra chữ ký giao dịch VNPAY; được inject vào `ReservationService`.
- `ExpiredReservationLockService.cs` — Quét các đơn đặt bàn `Pending` quá 17 phút chưa thanh toán cọc để hủy đơn và giải phóng bàn từ `LockedForPayment` về `Available`; được gọi bởi `ReleaseExpiredLocksWorker` và `ReservationService`.
- `TableService.cs` — Xử lý sơ đồ bàn thời gian thực, Check-in khách đặt trước (tự động tạo Order nếu khách đã chọn trước Set Menu), xếp bàn khách vãng lai (Walk-in), đổi bàn (`TransferTable`), gộp bàn (`MergeTables`) và cập nhật trạng thái bàn; liên kết với `ITableConcurrencyLock`, `ITableNotifier`, `ApplicationDbContext`.
- `OrderService.cs` — Xử lý tạo đơn gọi món theo cơ chế Course Firing (lượt 1 chuyển `Preparing`, các lượt sau giữ `Hold`), gọi thêm món, bắn lượt món tiếp theo (`FireNextCourseAsync`), xác nhận đã phục vụ tại quầy Pass (`ConfirmServedAsync`), yêu cầu bếp làm lại (`RemakeOrderItemAsync`), hủy món chưa phục vụ (`CancelOrderItemAsync`), lấy danh sách món đang nấu cho KDS và lịch sử quầy Pass; liên kết với `ITableConcurrencyLock`, `IKitchenNotifier`, `ITableNotifier`, `ApplicationDbContext`.
- `InvoiceService.cs` — Xử lý yêu cầu gọi thanh toán, lấy hàng đợi thu ngân, tính tạm tính (`Subtotal` + 5% phí dịch vụ + 10% VAT − tiền cọc `DeductedDeposit`), chốt thanh toán, sinh `SurveyToken` đánh giá và chuyển bàn sang `Cleaning`; liên kết với `ITableConcurrencyLock`, `ITableNotifier`, `ApplicationDbContext`.
- `MenuService.cs` — Truy vấn danh mục, món ăn, Set Menu và thông tin thực đơn theo mã QR của bàn; liên kết với `ApplicationDbContext` và `MenuController`.
- `ServiceCallService.cs` — Ghi nhận yêu cầu gọi phục vụ từ trang QR E-Menu tại bàn và phát thông báo thời gian thực cho nhân viên phục vụ; liên kết với `ITableNotifier` và `ServiceCallController`.
- `FeedbackService.cs` — Xác thực `SurveyToken` từ hóa đơn đã thanh toán và lưu điểm đánh giá 4 tiêu chí của khách; liên kết với `ApplicationDbContext` và `FeedbackController`.
- `AdminMenuService.cs` — Xử lý thêm/sửa/xóa món lẻ và Set Menu, bật/tắt trạng thái còn món/hết món và phát SignalR cập nhật tức thời sang máy phục vụ; liên kết với `ITableNotifier`, `ApplicationDbContext`, `AdminMenuController`.
- `AdminTableService.cs` — Xử lý thêm/sửa/vô hiệu hóa bàn ăn, lưu tọa độ kéo-thả sơ đồ bàn và cấp lại mã QR; liên kết với `ITableNotifier`, `ApplicationDbContext`, `AdminTableController`.
- `RefundService.cs` — Xử lý danh sách yêu cầu hoàn cọc ngoại lệ, cho phép Manager phê duyệt hoàn cọc hoặc từ chối (tịch thu cọc); liên kết với `ITableNotifier`, `ApplicationDbContext`, `AdminRefundController`.
- `StaffService.cs` — Quản lý danh sách nhân sự, tạo tài khoản mới kèm mật khẩu tạm, phân quyền vai trò, khóa/mở khóa và đặt lại mật khẩu; liên kết với `IPasswordHasher<Staff>`, `ApplicationDbContext`, `AdminStaffController`.
- `ReportService.cs` — Tổng hợp số liệu doanh thu thực thu, tiền cọc tịch thu, biểu đồ doanh thu theo ngày, cơ cấu phương thức thanh toán và top món bán chạy; liên kết với `ApplicationDbContext` và `ReportController`.
- `TableNotifier.cs` và `KitchenNotifier.cs` — Bọc `IHubContext<TableHub>` và `IHubContext<KitchenHub>` để phát sự kiện WebSocket từ các Service nghiệp vụ xuống các client Frontend đang kết nối.

### 3.7. Thư mục `Hubs/`, `Workers/` & `Middlewares/`

- `Hubs/TableHub.cs` — SignalR Hub tại `/hubs/tables` truyền tải sự kiện thay đổi trạng thái bàn, yêu cầu thanh toán, hoàn tất hóa đơn, yêu cầu phục vụ từ QR và trạng thái hết món; liên kết với `TableNotifier.cs` và `signalrRealtimeClient.ts` (Frontend).
- `Hubs/KitchenHub.cs` — SignalR Hub tại `/hubs/kitchen` truyền tải sự kiện đơn mới, bắn Course mới, yêu cầu làm lại, xác nhận ra món và cảnh báo SLA bếp; liên kết với `KitchenNotifier.cs` và các màn hình `KdsBoardPage.tsx`, `ExpediterPassPage.tsx`, `ActiveOrderPage.tsx`.
- `Workers/ReleaseExpiredLocksWorker.cs` — Dịch vụ chạy nền (`BackgroundService`) mỗi 60 giây gọi `IExpiredReservationLockService` để hủy đơn giữ bàn quá hạn 17 phút và mở khóa bàn.
- `Workers/OrderSlaMonitorWorker.cs` — Dịch vụ chạy nền giám sát thời gian chế biến của các `OrderItem` đang `Preparing`, phát cảnh báo sắp trễ/quá hạn SLA qua `IKitchenNotifier`.
- `Workers/ReservationReminderWorker.cs` — Dịch vụ chạy nền kiểm tra các đơn đặt bàn `Confirmed` sắp tới giờ ăn để phát thông báo nhắc lịch.
- `Workers/DiningSurveyWorker.cs` — Dịch vụ chạy nền kiểm tra các hóa đơn đã thanh toán để sinh `SurveyToken` khảo sát sau bữa ăn.
- `Middlewares/GlobalExceptionMiddleware.cs` — Middleware chặn ở đầu HTTP pipeline trong `Program.cs`, bắt mọi ngoại lệ từ Controllers/Services (bao gồm `ConflictException` và `DbUpdateConcurrencyException`) để trả về JSON lỗi chuẩn hóa.

### 3.8. Thư mục `backend/tests/UnitTests/` (9 file kiểm thử xUnit)

- `AuthServiceTests.cs` — Kiểm thử đăng nhập, sai mật khẩu và khóa tài khoản tạm thời trong `AuthService`.
- `DatabaseSeederTests.cs` — Kiểm thử `DatabaseSeeder.SeedAsync` chỉ tạo dữ liệu nền (15 bàn `Available`, 9 món, 4 Set Menu, 4 nhân viên, 0 đơn mẫu).
- `DbContextCrudTests.cs` và `DbContextModelTests.cs` — Kiểm thử cấu hình bảng, ràng buộc khóa ngoại và thao tác CRUD trên `ApplicationDbContext`.
- `DomainEntityTests.cs` — Kiểm thử khởi tạo các thực thể trong `Models/Entities/`.
- `GlobalExceptionMiddlewareTests.cs` — Kiểm thử `GlobalExceptionMiddleware` chuyển đổi đúng mã HTTP cho từng loại lỗi.
- `ReservationAndPaymentTests.cs` — Kiểm thử luồng đặt bàn, khóa đồng thời `TableConcurrencyLock`, thanh toán VNPAY IPN, hủy đặt bàn và nhả khóa quá hạn.
- `OperationsOrderAndBillingTests.cs` — Kiểm thử luồng check-in, tạo Order, Course Firing, làm lại món, xác nhận ra món và tính hóa đơn cấn trừ cọc.
- `ClosedLoopIntegrationTests.cs` — Kiểm thử tích hợp khép kín toàn bộ quy trình từ đặt bàn đến quyết toán hóa đơn và báo cáo.

---

## 4. Chi Tiết Frontend (`frontend/src/` & `frontend/e2e/`)

### 4.1. Các file gốc trong `frontend/src/`

- `main.tsx` — Khởi tạo React Root, bọc `QueryClientProvider` (TanStack Query) và nạp `index.css` để render `App.tsx`.
- `App.tsx` — Khai báo toàn bộ hệ thống định tuyến (`BrowserRouter`, `Routes`, `Route`) với `React.lazy`, gắn `ProtectedRoute` kiểm tra quyền cho các nhánh `/phuc-vu`, `/dieu-phoi`, `/thu-ngan`, `/quan-ly`, nối 5 `layouts/` với tất cả các trang trong `pages/`.
- `index.css` và `styles/theme.css` — Cấu hình Tailwind CSS v4 và bộ biến màu giao diện Sáng / Tối; được điều khiển bởi `useThemeStore.ts`.
- `vite-env.d.ts` — Khai báo kiểu TypeScript cho `VITE_API_URL` và `VITE_SIGNALR_URL` đọc từ `frontend/.env.development`.

### 4.2. Thư mục `frontend/src/services/` (Kết nối RESTful API & SignalR)

- `services/api/client.ts` — Khởi tạo Axios instance `apiClient` kết nối tới `http://localhost:5159/api`: tự gắn header `Authorization: Bearer <token>` từ `useAuthStore.ts`, tự bóc vỏ `ApiResponseEnvelope` từ Backend, tự gọi `logout()` khi gặp lỗi `401` và tính số phút khóa tài khoản khi gặp lỗi `423`.
- `services/api/normalize.ts` và `normalize.test.ts` — Chuẩn hóa dữ liệu DTO trả về từ Backend (đồng bộ tên trạng thái bàn, đơn món, đặt bàn, vé bếp, hóa đơn, báo cáo) trước khi đưa lên giao diện; được gọi bởi `services/api/index.ts`.
- `services/api/index.ts` — Xuất 9 đối tượng gọi API (`authApi`, `menuApi`, `reservationApi`, `tableApi`, `orderApi`, `invoiceApi`, `serviceRequestApi`, `feedbackApi`, `managerApi`); sử dụng `apiClient` và được toàn bộ các trang trong `pages/` gọi qua TanStack Query.
- `services/realtime/types.ts` — Định nghĩa kiểu dữ liệu cho 12 sự kiện SignalR và hợp đồng `RealtimeClient`.
- `services/realtime/signalrRealtimeClient.ts` — Thiết lập và duy trì 2 kết nối WebSocket (`@microsoft/signalr`) tới `/hubs/tables` và `/hubs/kitchen` của Backend, tự động kết nối lại khi rớt mạng và phát sự kiện về UI.
- `services/realtime/client.ts` — Khởi tạo singleton `realtimeClient` dùng `createSignalRRealtimeClient` kèm token đọc từ `localStorage`.
- `services/realtime/useRealtime.ts` — React hook cho phép các trang (`FloorPlanPage`, `ActiveOrderPage`, `NotificationsPage`, `KdsBoardPage`, `ExpediterPassPage`, `CashierQueuePage`) đăng ký lắng nghe sự kiện SignalR và tự hủy khi rời trang.

### 4.3. Thư mục `frontend/src/domain/` (Quy tắc Nghiệp vụ Thuần Frontend)

- `constants.ts` — Khai báo các hằng số chuẩn của nhà hàng (cọc `500.000đ/khách`, cọc Set Menu `30%`, phí dịch vụ `5%`, VAT `10%`, giữ chỗ `15 phút`, hủy miễn phí trước `4 giờ`); được import bởi các file trong `domain/` và `pages/`.
- `deposit.ts` — Chứa hàm tính tiền cọc đặt bàn theo số khách hoặc Set Menu; liên kết với `BookingPage.tsx`, `BookingStepSetMenu.tsx`, `BookingSummaryCard.tsx`.
- `cancellation.ts` — Chứa hàm kiểm tra điều kiện hủy đơn trước hay sát giờ ăn (ngưỡng 4 giờ); liên kết với `LookupReservationPage.tsx` và `ManagerRefundsPage.tsx`.
- `hold.ts` — Chứa hàm tính thời gian đếm ngược giữ bàn chờ thanh toán cọc; liên kết với `BookingPage.tsx`, `VnPayMockPage.tsx`, `Countdown.tsx`.
- `slotAvailability.ts` — Chứa hàm lọc ca dùng bữa hợp lệ và kiểm tra bàn trống theo sức chứa/khu vực; liên kết với `useBookingAvailability.ts`, `BookingStepTimeZone.tsx`, `BookingStepTable.tsx`.
- `courseFiring.ts` — Chứa hàm gom nhóm món ăn theo lượt (`Appetizer`, `MainCourse`, `Dessert`, `Beverage`) và xác định lượt món tiếp theo có thể bắn xuống bếp; liên kết với `CreateOrderPage.tsx`, `ActiveOrderPage.tsx`, `AddItemsPage.tsx`.
- `kitchenTickets.ts` — Chứa hàm gom các `OrderItem` thành thẻ vé bếp theo bàn/lượt món, chia 3 làn (`remake`, `cooking`, `waiting`) và tính số dòng phân trang theo chiều cao màn hình; liên kết với `KdsBoardPage.tsx` và `ExpediterPassPage.tsx`.
- `sla.ts` — Chứa hàm tính thời gian chế biến đã trôi qua và phân loại mức cảnh báo SLA (`normal`, `warning`, `overdue`); liên kết với `kitchenTickets.ts`, `KdsBoardPage.tsx`, `ExpediterPassPage.tsx`.
- `invoice.ts` — Chứa hàm tính tạm tính, phí dịch vụ 5%, VAT 10% và cấn trừ tiền cọc; liên kết với `InvoicePreviewPage.tsx` và `ReceiptSlip80mm.tsx`.
- `loginLock.ts` — Chứa hàm định dạng thông báo khóa tài khoản tạm thời; liên kết với `LoginPage.tsx`.
- `manager.ts` và `reports.ts` — Chứa hàm kiểm tra quyền thao tác tài khoản nhân sự và tổng hợp dữ liệu báo cáo doanh thu; liên kết với `ManagerStaffPage.tsx`, `ManagerReportsPage.tsx`.
- `datetime.ts`, `money.ts`, `phone.ts`, `labels.ts` — Chứa các hàm định dạng ngày giờ `UTC+7`, tiền tệ `VNĐ`, số điện thoại và bảng nhãn tiếng Việt cho mọi Enum; được sử dụng trên toàn bộ `pages/` và `components/`.
- `domain.test.ts` — Bộ 28 unit tests kiểm chứng toàn bộ các hàm nghiệp vụ trong thư mục `domain/`.

### 4.4. Thư mục `frontend/src/stores/` (Zustand Global State)

- `useAuthStore.ts` — Lưu JWT token và thông tin nhân viên đăng nhập vào `localStorage` (`vd-auth-storage`), cung cấp hàm điều hướng theo vai trò; liên kết với `LoginPage.tsx`, `ProtectedRoute.tsx`, `services/api/client.ts`, `services/realtime/client.ts`.
- `useThemeStore.ts` — Lưu và chuyển đổi chế độ giao diện Sáng / Tối cho khu vực Khách và Nhân viên; liên kết với `ThemeToggle.tsx` và các `layouts/`.
- `useToastStore.ts` — Quản lý danh sách thông báo nổi (`toast.success`, `toast.error`...); hiển thị qua `components/ui/Toast.tsx`.
- `useWaitstaffNotificationsStore.ts` — Lưu hàng đợi thông báo thời gian thực của nhân viên phục vụ (món ra tại quầy Pass, khách gọi từ QR E-Menu); liên kết với `StaffMobileLayout.tsx` và `NotificationsPage.tsx`.

### 4.5. Thư mục `frontend/src/layouts/` & `frontend/src/components/`

- `layouts/GuestLayout.tsx` — Khung giao diện công khai cho khách hàng (Header, menu điều hướng, nút Đặt bàn, Footer), bọc các route `/`, `/dat-ban`, `/thanh-toan/vnpay/:code`, `/tra-cuu`, `/danh-gia/:token`.
- `layouts/StaffMobileLayout.tsx` — Khung giao diện di động cho Phục vụ (`/phuc-vu/*`), tích hợp thanh điều hướng đáy, chuông báo (`bellSound.ts`) và huy hiệu số thông báo từ `useWaitstaffNotificationsStore.ts`.
- `layouts/StaffTabletLayout.tsx` — Khung giao diện máy tính bảng cho Điều phối viên quầy Pass (`/dieu-phoi`).
- `layouts/StaffDesktopLayout.tsx` — Khung giao diện máy tính để bàn có Sidebar cho Thu ngân (`/thu-ngan/*`) và Quản lý (`/quan-ly/*`).
- `layouts/WallLayout.tsx` — Khung giao diện toàn màn hình không thanh điều hướng cho màn hình Bếp KDS (`/kds`).
- `components/auth/ProtectedRoute.tsx` — Kiểm tra trạng thái đăng nhập và vai trò từ `useAuthStore.ts`; chặn truy cập trái phép vào các route nội bộ trong `App.tsx`.
- `components/floor-plan/FloorPlanCanvas.tsx`, `GuestRoomPlan.tsx`, `floorPlanGeometry.ts`, `guestRoomLayout.ts`, `guestRoomLayout.test.ts` — Bộ dựng sơ đồ bàn SVG theo 3 khu vực (`MainHall`, `VIP`, `Balcony`), tự động vẽ số ghế theo sức chứa, xoay dọc trên màn hình điện thoại và hỗ trợ kéo-thả vị trí bàn; liên kết với `BookingStepTable.tsx`, `FloorPlanPage.tsx`, `ManagerFloorPlanPage.tsx`.
- `components/guest/GuestPhotoBackground.tsx` — Hiển thị ảnh nền không gian nhà hàng theo chế độ Sáng/Tối trên các trang khách hàng.
- `components/ReceiptSlip80mm.tsx` — Hiển thị mẫu phiếu hóa đơn in nhiệt khổ 80mm kèm mã VietQR thanh toán và mã QR khảo sát sau bữa ăn; liên kết với `InvoicePreviewPage.tsx` và `InvoicesTodayPage.tsx`.
- `components/ui/*.tsx` (21 files: `Button`, `Card`, `Countdown`, `Drawer`, `EmptyState`, `Input`, `Modal`, `Money`, `NumberStepper`, `PageHeader`, `Select`, `Skeleton`, `StatusBadge`, `Tabs`, `Textarea`, `ThemedImage`, `ThemeToggle`, `Toast`, `Wordmark`, `useDialogBehavior`, `index`) — Bộ component giao diện cơ sở dùng chung cho mọi trang trong `pages/`.

### 4.6. Thư mục `frontend/src/pages/` (Các màn hình chức năng)

#### Trang Khách hàng (`pages/guest/`)
- `HomePage.tsx` (route `/`) — Trang chủ giới thiệu không gian, Set Menu và thực đơn A La Carte; lấy dữ liệu từ `menuApi.getPublicMenu()` và dẫn sang `/dat-ban`.
- `BookingPage.tsx` và `bookingState.ts` (route `/dat-ban`) — Điều phối quy trình đặt bàn nhiều bước, lưu trạng thái nháp vào `sessionStorage` và gọi `reservationApi.create()` để tạo đơn giữ chỗ.
- `booking/BookingProgressStepper.tsx` và `BookingNav.tsx` — Hiển thị bước hiện tại và thanh điều hướng Quay lại / Tiếp tục trong `BookingPage.tsx`.
- `booking/BookingStepSetMenu.tsx` — Cho khách chọn đặt bàn tiêu chuẩn hoặc đặt kèm Set Menu (cọc 30%); liên kết với `deposit.ts` và `menuApi`.
- `booking/BookingStepTimeZone.tsx` — Cho khách chọn ngày, số người, khung giờ và khu vực bàn; gọi `useBookingAvailability.ts` để kiểm tra chỗ trống.
- `booking/BookingStepTable.tsx` — Hiển thị sơ đồ phòng ăn (`GuestRoomPlan.tsx`) để khách chọn bàn cụ thể và nhập họ tên, SĐT, email.
- `booking/BookingSummaryCard.tsx` — Tóm tắt thông tin bàn, thời gian, Set Menu và số tiền cọc phải thanh toán trong `BookingPage.tsx`.
- `booking/useBookingAvailability.ts` và `useStableViewportHeight.ts` — Gọi `reservationApi.getAvailability()` lấy danh sách bàn trống theo khung giờ và giữ ổn định chiều cao khung nhìn trên thiết bị di động.
- `VnPayMockPage.tsx` (route `/thanh-toan/vnpay/:code`) — Giao diện cổng thanh toán tiền cọc VNPAY Sandbox, đếm ngược thời gian giữ bàn và gọi `reservationApi.processVnPayIpn()` (`POST /api/payments/vnpay-ipn`) để xác nhận đặt cọc vào SQL Server.
- `LookupReservationPage.tsx` (route `/tra-cuu`) — Tra cứu đơn đặt bàn theo Mã đặt bàn + SĐT, kiểm tra chính sách hủy 4 giờ (`cancellation.ts`) và gọi `reservationApi.cancel()`.
- `EMenuPage.tsx` (route `/menu/:qrCode`) — Trang thực đơn điện tử khi khách quét mã QR tại bàn: chỉ mở khóa khi bàn đã Check-in (`Occupied`/`PaymentPending`, tự động mở khóa tức thời qua SignalR `table:status-changed` ngay khi nhân viên bấm Check-in, hoặc gợi ý danh sách bàn đang phục vụ nếu quét nhầm bàn chưa mở); hiển thị Set Menu và món lẻ (chỉ xem, đồng bộ trạng thái Hết món qua `menu:updated`), cung cấp 3 nút gọi hỗ trợ (`Gọi nhân viên`, `Châm nước`, `Đổi dụng cụ ăn`) gọi `menuApi.callService()` phát chuông thông báo sang máy Waitstaff và tự động đặt lại nút khi nhận sự kiện `service-request:completed`.
- `FeedbackPage.tsx` (route `/danh-gia/:token`) — Trang khảo sát sau bữa ăn, xác thực token qua `feedbackApi.verifyToken()` và gửi điểm đánh giá qua `feedbackApi.submit()`.

#### Trang Đăng nhập & Bếp KDS (`pages/LoginPage.tsx` & `pages/kds/`)
- `LoginPage.tsx` (route `/dang-nhap`) — Form đăng nhập nhân sự nội bộ, gọi `authApi.login()`, lưu JWT vào `useAuthStore.ts` và điều hướng về đúng phân hệ theo vai trò.
- `kds/KdsBoardPage.tsx` (route `/kds`) — Màn hình Bếp KDS treo tường hiển thị 3 làn vé món (`Làm lại`, `Đang chế biến`, `Chờ bắn Course`) kèm đồng hồ SLA; lấy dữ liệu từ `orderApi.getKitchenPending()` và cập nhật tức thời qua `KitchenHub` (`useRealtime.ts`).

#### Trang Phục vụ (`pages/staff/waitstaff/`)
- `FloorPlanPage.tsx` (route `/phuc-vu`) — Sơ đồ bàn thời gian thực cho nhân viên phục vụ, lọc theo khu vực/trạng thái, mở `CheckInSheet.tsx` hoặc đi tới chi tiết đơn của bàn; gọi `tableApi.getFloorPlan()` và lắng nghe `TableHub`.
- `CheckInSheet.tsx` — Ngăn kéo thao tác nhanh Check-in đơn đặt trước hoặc mở bàn khách vãng lai (Walk-in) qua `tableApi.checkIn()` và `tableApi.walkIn()`.
- `CheckInLookupPage.tsx` (route `/phuc-vu/check-in`) — Tra cứu danh sách khách đặt bàn trong ngày theo mã, tên hoặc SĐT để thực hiện Check-in.
- `TableCheckInDetailPage.tsx` (route `/phuc-vu/ban/:tableId`) — Hiển thị chi tiết bàn, thông tin khách đặt trước và dẫn sang tạo Order hoặc xem Order đang mở.
- `CreateOrderPage.tsx` và `OrderMenuPicker.tsx` (route `/phuc-vu/tao-order/:tableId`) — Giao diện chọn món lẻ / Set Menu phân theo Course, thêm ghi chú chế biến và gọi `orderApi.create()`.
- `ActiveOrderPage.tsx` (route `/phuc-vu/order/:tableId`) — Quản lý đơn đang phục vụ tại bàn: theo dõi trạng thái từng món, bấm bắn lượt món tiếp theo (`orderApi.fireCourse()`), hủy món chưa nấu (`orderApi.cancelItem()`), hoặc gửi yêu cầu thanh toán (`invoiceApi.requestCheckout()`).
- `AddItemsPage.tsx` (route `/phuc-vu/goi-them/:tableId`) — Chọn thêm món bổ sung vào đơn đang mở qua `orderApi.addItems()`.
- `TransferTablePage.tsx` (route `/phuc-vu/doi-ban/:tableId`) — Chọn bàn trống mới và gọi `tableApi.transfer()` để chuyển khách cùng Order sang bàn khác.
- `NotificationsPage.tsx` (route `/phuc-vu/thong-bao`) — Hiển thị danh sách yêu cầu hỗ trợ từ khách quét QR tại bàn và thông báo ra món từ quầy Pass; gọi `serviceRequestApi.getPending()` và `serviceRequestApi.complete()`.

#### Trang Điều phối viên Quầy Pass (`pages/staff/expediter/`)
- `ExpediterPassPage.tsx` (route `/dieu-phoi`) — Màn hình điều phối ra món tại quầy Pass: hiển thị danh sách món đang chế biến theo thứ tự ưu tiên SLA, cho phép bấm **Xác nhận đi món** (`orderApi.confirmServed()`) hoặc **Yêu cầu làm lại** (`orderApi.remakeItem()`) và xem tab lịch sử món đã ra (`orderApi.getPassHistory()`).

#### Trang Thu ngân (`pages/staff/cashier/`)
- `CashierQueuePage.tsx` (route `/thu-ngan`) — Hiển thị hàng đợi các bàn yêu cầu thanh toán (`PaymentPending`) và các bàn đang dùng bữa (`Occupied`); gọi `invoiceApi.getQueue()` và lắng nghe `TableHub`.
- `CashierCheckInPage.tsx` (route `/thu-ngan/check-in`) — Hỗ trợ thu ngân/lễ tân tra cứu đơn đặt bàn và Check-in hoặc xếp bàn Walk-in tại quầy.
- `InvoicePreviewPage.tsx` (route `/thu-ngan/tam-tinh/:tableId`) — Hiển thị bảng tính tiền món, phí dịch vụ 5%, VAT 10%, cấn trừ tiền cọc, bản xem trước phiếu in 80mm (`ReceiptSlip80mm.tsx`) và gọi `invoiceApi.checkout()` để hoàn tất thanh toán.
- `InvoicesTodayPage.tsx` (route `/thu-ngan/hoa-don`) — Tra cứu danh sách hóa đơn đã thu tiền trong ngày (`invoiceApi.getToday()`), in lại phiếu 80mm và mở link khảo sát đánh giá.

#### Trang Quản lý (`pages/staff/manager/`)
- `ManagerMenuPage.tsx` (route `/quan-ly`) — Quản lý thêm/sửa/xóa món lẻ, Set Menu và gạt công tắc Còn món / Hết món thời gian thực qua `managerApi`.
- `ManagerFloorPlanPage.tsx` (route `/quan-ly/so-do-ban`) — Kéo-thả sắp xếp vị trí bàn trên sơ đồ (`FloorPlanCanvas.tsx`), thêm/sửa bàn và tạo/tải mã QR E-Menu cho từng bàn qua `managerApi`.
- `ManagerRefundsPage.tsx` (route `/quan-ly/hoan-coc`) — Duyệt hoàn tiền hoặc từ chối các yêu cầu hoàn cọc ngoại lệ qua `managerApi`.
- `ManagerStaffPage.tsx` (route `/quan-ly/tai-khoan`) — Tạo tài khoản nhân viên mới, phân quyền vai trò, khóa/mở khóa và đặt lại mật khẩu qua `managerApi`.
- `ManagerReportsPage.tsx` (route `/quan-ly/bao-cao`) — Xem biểu đồ doanh thu, tiền cọc tịch thu, tỷ lệ phương thức thanh toán, top món bán chạy từ `managerApi.getRevenueReport()` và xuất báo cáo ra file Excel (`.xlsx`) bằng `write-excel-file`.

### 4.7. Các file Hỗ trợ, Kiểu dữ liệu & Kiểm thử E2E (`hooks/`, `lib/`, `types/`, `e2e/`)

- `hooks/useDocumentTitle.ts` — Hook đổi tiêu đề tab trình duyệt theo từng trang.
- `lib/utils.ts` — Chứa hàm `cn()` gộp class Tailwind CSS và `isStaffAppMode()` kiểm tra chế độ chạy app nhân sự.
- `lib/bellSound.ts` — Phát âm thanh chuông báo bằng Web Audio API khi có thông báo mới cho nhân viên phục vụ.
- `types/*.ts` (13 files: `api.ts`, `auth.ts`, `feedback.ts`, `invoice.ts`, `menu.ts`, `order.ts`, `refund.ts`, `report.ts`, `reservation.ts`, `serviceRequest.ts`, `staff.ts`, `table.ts`, `index.ts`) — Khai báo toàn bộ kiểu dữ liệu TypeScript khớp với các DTO trong `backend/src/API/DTOs/`.
- `frontend/e2e/*.spec.ts` (9 files: `guest.spec.ts`, `bookingPicker.spec.ts`, `bookingStability.spec.ts`, `waitstaff.spec.ts`, `passAndKds.spec.ts`, `cashier.spec.ts`, `manager.spec.ts`, `a11y.spec.ts`, `responsive.spec.ts`) — Các kịch bản kiểm thử tự động Playwright E2E theo từng phân hệ, kiểm tra trợ năng và hiển thị đa kích thước màn hình.

---

## 5. Chi Tiết Thư Mục Mobile Hybrid (`mobile/`)

- `mobile/package.json` — Khai báo phụ thuộc `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` và các lệnh `prepare:android`, `open:android`; gọi sang `../frontend` để build gói giao diện web.
- `mobile/capacitor.config.ts` — Cấu hình `appId: 'vn.vindining.app'`, `appName: 'VinDining'` và trỏ `webDir` về `../frontend/dist`.
- `mobile/android/` — Dự án Android gốc (`MainActivity.java`, `AndroidManifest.xml`, cấu hình Gradle) dùng để mở trong Android Studio và xuất file cài đặt `.apk`.
- `mobile/README.md` — Hướng dẫn cấu hình `VITE_API_URL`, `VITE_SIGNALR_URL` theo IP LAN và các bước đóng gói file `.apk`.
