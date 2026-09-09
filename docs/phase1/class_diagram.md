# SƠ ĐỒ LỚP MIỀN THỰC THỂ (DOMAIN CLASS DIAGRAM)
## Dự án: Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (VinDining)

---

### 1. Giới thiệu tổng quan
Sơ đồ lớp miền thực thể (Domain Class Diagram) mô tả cấu trúc dữ liệu cốt lõi, thuộc tính, các mối quan hệ quan trọng (Aggregation, Composition, Association, Inheritance) và các kiểu liệt kê (Enums) của hệ thống VinDining.

Mô hình được thiết kế bám sát theo:
* Kiến trúc **Clean Architecture** (.NET 9 Domain Layer).
* Bộ quy tắc nghiệp vụ bất biến (`BR-01` đến `BR-05`) trong [CONTEXT.md](../../CONTEXT.md).
* Hệ thống 15 Use Case chuẩn hóa: **Khách hàng (`UC-U1`..`UC-U4`) $\rightarrow$ Nhân viên nội bộ (`UC-E1`..`UC-E5`) $\rightarrow$ Quản trị & Quản lý (`UC-A1`..`UC-A5`) $\rightarrow$ Tự động Hệ thống (`UC-S1`)**.

---

### 2. Sơ đồ Class Diagram (Mermaid)

```mermaid
classDiagram
    %% Base Entity
    class BaseEntity {
        <<Abstract>>
        +Guid Id
        +DateTime CreatedAtUtc
        +DateTime? UpdatedAtUtc
    }

    %% Enums
    class StaffRole {
        <<Enumeration>>
        Waitstaff
        Expediter
        Manager
        Admin
    }

    class TableStatus {
        <<Enumeration>>
        Available
        LockedForPayment
        Reserved
        Occupied
        Cleaning
    }

    class TableZone {
        <<Enumeration>>
        MainHall
        VIP
        Balcony
    }

    class ReservationStatus {
        <<Enumeration>>
        AwaitingPayment
        Confirmed
        Completed
        Cancelled
        Expired
    }

    class DepositStatus {
        <<Enumeration>>
        Pending
        Paid
        Refunded
        Forfeited
    }

    class OrderStatus {
        <<Enumeration>>
        Processing
        Completed
        Cancelled
    }

    class OrderItemStatus {
        <<Enumeration>>
        Preparing
        Served
        Cancelled
    }

    class PaymentMethod {
        <<Enumeration>>
        Cash
        Card
        BankTransfer
        DepositCovered
        VNPAY
    }

    %% Entities
    class Guest {
        +string FullName
        +string PhoneNumber
        +string Email
        +string? Address
    }

    class Staff {
        +string FullName
        +string Username
        +string Email
        +string PasswordHash
        +StaffRole Role
        +bool IsActive
    }

    class Table {
        +string TableNumber
        +int Capacity
        +TableZone Zone
        +TableStatus Status
        +string? PairingCode
        +string? DeviceId
        +bool IsActive
    }

    class Reservation {
        +string BookingCode
        +Guid GuestId
        +Guid TableId
        +DateTime ReservationTime
        +string DiningShift
        +int PartySize
        +ReservationStatus Status
        +string? SpecialNotes
        +DateTime? CancelledAt
        +string? CancellationReason
    }

    class Deposit {
        +Guid ReservationId
        +decimal Amount
        +string TransactionId
        +PaymentMethod PaymentMethod
        +DepositStatus Status
        +DateTime? PaidAt
        +decimal? RefundAmount
        +DateTime? RefundedAt
        +string? RefundReason
        +Guid? ApprovedByStaffId
    }

    class Category {
        +string Name
        +string Description
        +int DisplayOrder
        +bool IsActive
    }

    class MenuItem {
        +Guid CategoryId
        +string Name
        +string Description
        +decimal Price
        +string? ImageUrl
        +bool IsAvailable
        +string? AllergyInfo
    }

    class Order {
        +Guid TableId
        +Guid? ReservationId
        +Guid CreatedByStaffId
        +OrderStatus Status
        +DateTime OpenedAt
        +DateTime? ClosedAt
    }

    class OrderItem {
        +Guid OrderId
        +Guid MenuItemId
        +int Quantity
        +decimal UnitPrice
        +string? Note
        +OrderItemStatus Status
        +Guid? ServedByStaffId
        +DateTime? ServedAt
    }

    class Invoice {
        +Guid OrderId
        +Guid SettledByStaffId
        +decimal Subtotal
        +decimal ServiceCharge
        +decimal VatAmount
        +decimal DeductedDeposit
        +decimal AmountPayable
        +PaymentMethod PaymentMethod
        +DateTime IssuedAt
        +bool IsPaid
    }

    class Feedback {
        +Guid GuestId
        +Guid? ReservationId
        +int Rating
        +string? Comment
        +DateTime CreatedAtUtc
    }

    %% Kế thừa BaseEntity
    BaseEntity <|-- Guest
    BaseEntity <|-- Staff
    BaseEntity <|-- Table
    BaseEntity <|-- Reservation
    BaseEntity <|-- Deposit
    BaseEntity <|-- Category
    BaseEntity <|-- MenuItem
    BaseEntity <|-- Order
    BaseEntity <|-- OrderItem
    BaseEntity <|-- Invoice
    BaseEntity <|-- Feedback

    %% Quan hệ giữa các thực thể
    Guest "1" --> "0..*" Reservation : Makes
    Guest "1" --> "0..*" Feedback : Submits
    Table "1" --> "0..*" Reservation : Hosted at
    Table "1" --> "0..*" Order : Has active
    Reservation "1" *-- "1" Deposit : Guaranteed by
    Reservation "0..1" <-- "0..*" Order : Inherits deposit
    Reservation "0..1" --> "0..1" Feedback : Reviewed by

    Category "1" *-- "0..*" MenuItem : Classifies
    Order "1" *-- "1..*" OrderItem : Composes
    MenuItem "1" <-- "0..*" OrderItem : Refers to
    Order "1" --> "0..1" Invoice : Billed as

    %% Quan hệ Nhân sự (Staff Interactions)
    Staff "1" --> "0..*" Order : Waitstaff Creates
    Staff "1" --> "0..*" OrderItem : Expediter Confirms
    Staff "1" --> "0..*" Invoice : Waitstaff Settles
    Staff "0..1" --> "0..*" Deposit : Manager Overrides
```

---

### 3. Bảng Từ điển Thực thể & Ánh xạ Quy tắc Nghiệp vụ

| STT | Thực thể (Entity) | Vai trò trong hệ thống | Ánh xạ Use Case | Quy tắc nghiệp vụ liên quan |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Guest** | Lưu trữ thông tin định danh liên lạc của khách đặt bàn (Họ tên, SĐT, Email). Khách hàng **không có tài khoản** trong hệ thống. | `UC-U1`, `UC-U3`, `UC-U4` | Định danh phiên giao dịch và nhận SMS/Email xác nhận `BookingCode`. |
| 2 | **Staff** | Đại diện nhân sự nội bộ có tài khoản đăng nhập (Waitstaff, Expediter, Manager, Admin). | `UC-E5`, `UC-A4` | Quản lý phiên làm việc bằng JWT Token và phân quyền RBAC. |
| 3 | **Table** | Đại diện vị trí bàn ăn vật lý, khu vực (VIP, Sảnh, Ban công), sức chứa và liên kết thiết bị Digital Display. | `UC-E1`, `UC-E4`, `UC-A2`, `UC-S1` | `BR-01` (Khóa 17p), `BR-02` (Ghép nối PairingCode với Tablet). |
| 4 | **Reservation** | Đơn đặt bàn trước của khách, quản lý mã `BookingCode`, ca phục vụ và trạng thái giữ chỗ. | `UC-U1`, `UC-U3`, `UC-S1` | `BR-01` (Hết hạn 17p hủy tự động), `BR-05` (Chính sách hủy trước $\ge$ 4h). |
| 5 | **Deposit** | Giao dịch đặt cọc giữ chỗ qua cổng VNPAY. Lưu trữ lịch sử thu cọc, hoàn tiền tự động hoặc hoàn tiền thủ công. | `UC-U1`, `UC-U3`, `UC-A3` | `BR-01` (Giao dịch VNPAY IPN), `BR-05` (Hoàn cọc 100% hoặc phạt 100%). |
| 6 | **Category** | Danh mục phân loại thực đơn (Khai vị, Món chính, Tráng miệng, Đồ uống cao cấp). | `UC-U2`, `UC-A1` | Sắp xếp thứ tự hiển thị (`DisplayOrder`) trên giao diện E-Menu. |
| 7 | **MenuItem** | Món ăn hoặc thức uống trong thực đơn A La Carte, kèm giá bán và cảnh báo dị ứng thực phẩm. | `UC-U2`, `UC-E1`, `UC-A1` | In đậm thông tin dị ứng (`AllergyInfo`) trên phiếu in nhiệt Bếp. |
| 8 | **Order** | Đơn gọi món tại bàn của khách đang dùng bữa (`Occupied`), do nhân viên phục vụ tạo. | `UC-E1`, `UC-E4` | Chỉ tạo khi bàn `Occupied`. Có thể kế thừa `ReservationId` để đối soát cọc. |
| 9 | **OrderItem** | Từng món ăn chi tiết trong đơn hàng. Lưu trạng thái chế biến và mốc thời gian hoàn thành tại Pass. | `UC-E1`, `UC-E2` | `BR-04` (Chỉ Expediter/Manager mới được xác nhận `Served` tại quầy Pass). |
| 10 | **Invoice** | Hóa đơn thanh toán tài chính sau bữa ăn, tự động cấn trừ tiền cọc đã trả trước. | `UC-E3` | `BR-03` (Công thức Subtotal + 5% Phí PV + 10% VAT - Tiền cọc). |
| 11 | **Feedback** | Đánh giá sao (1–5 sao) và phản hồi dịch vụ của khách hàng sau khi dùng bữa. | `UC-U4` | Tổng hợp báo cáo mức độ hài lòng khách hàng tại Dashboard quản trị (`UC-A5`). |
| 12 | **BaseEntity** | Lớp trừu tượng cung cấp các thuộc tính kiểm toán cơ sở (`Id`, `CreatedAtUtc`, `UpdatedAtUtc`) cho toàn bộ Entity. | Toàn hệ thống | Đảm bảo tính nhất quán của Clean Architecture. |
