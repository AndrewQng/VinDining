# Đặc tả UC-E3: Thanh toán, Cấn trừ tiền cọc & Đóng bàn

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-E3 |
| **Tên Use Case** | Thanh toán, Cấn trừ tiền cọc & Đóng bàn *(Settlement, Deposit Deduction & Table Closing)* |
| **Tác nhân tham gia** | Nhân viên Phục vụ *(Chính)*, Khách hàng *(Chính)*, Hệ thống tự động *(Phụ)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5; Tự động đồng bộ số liệu thanh toán với hóa đơn |
| **Mục tiêu chức năng** | Tự động tổng hợp chi phí toàn bộ món ăn thực tế đã dùng, tự động cấn trừ chính xác số tiền cọc đã thu trước đó qua VNPAY, xuất hóa đơn tạm tính và đóng bàn phục vụ. |
| **Điều kiện tiên quyết** | Vị trí bàn ăn đang ở trạng thái Đang phục vụ *(Occupied)* và toàn bộ các món ăn đã được xác nhận hoàn thành *(Served)*. |
| **Điều kiện kết thúc** | Hóa đơn được thanh toán thành công; đơn hàng được đóng lại; trạng thái bàn ăn chuyển sang Chờ dọn dẹp *(Cleaning)* và sau đó về Sẵn sàng *(Available)*. |

## Luồng sự kiện chính (Main Flow)
1. Khách hàng thông báo yêu cầu tính tiền trực tiếp với nhân viên phục vụ hoặc nhấn nút Yêu cầu thanh toán trên giao diện E-Menu.
2. Nhân viên phục vụ mở giao diện thanh toán của bàn tương ứng trên ứng dụng POS di động.
3. Hệ thống tự động tổng hợp tiền các món ăn thực tế đã phục vụ (Subtotal), cộng 5% phí phục vụ, cộng 10% thuế VAT trên tổng tiền gồm phí phục vụ, sau đó tự động khấu trừ 100% khoản tiền cọc đã thu trước đó qua VNPAY để xác định số tiền khách phải trả thêm.
4. Hệ thống gửi lệnh in phiếu tạm tính ra máy in quầy thu ngân; nhân viên mang phiếu ra bàn cho khách hàng đối chiếu chi tiết.
5. Khách hàng thanh toán phần tiền chênh lệch bằng tiền mặt, thẻ ngân hàng POS hoặc quét mã VietQR in trực tiếp trên phiếu.
6. Nhân viên phục vụ bấm nút Xác nhận thanh toán trên ứng dụng POS sau khi thu tiền thành công.
7. Hệ thống chuyển trạng thái hóa đơn sang Đã thanh toán *(Paid)*, lưu trữ dữ liệu và chuyển trạng thái bàn ăn sang Chờ dọn dẹp *(Cleaning)*.

## Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Khi tổng chi phí bữa ăn thực tế nhỏ hơn số tiền cọc đã đóng trước đó, hệ thống áp dụng nguyên tắc tiền cọc là mức chi tiêu tối thiểu không hoàn lại, ghi nhận số tiền khách phải trả thêm là 0 VNĐ và khóa chức năng hoàn tiền cọc thừa.

## Sơ đồ tuần tự (Sequence Diagram)
```plantuml
@startuml SD_UC_E3_Settle_Invoice
autonumber
skinparam style strictuml
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam defaultFontName "Segoe UI", Arial, sans-serif
skinparam defaultFontSize 16
skinparam sequenceActorFontSize 16
skinparam sequenceParticipantFontSize 16
skinparam sequenceArrowFontSize 15
skinparam sequenceGroupFontSize 15
skinparam sequenceGroupHeaderFontSize 15

actor "Nhân viên Phục vụ" as Waitstaff
boundary "Giao diện Web" as UI
control "InvoiceController" as Controller
participant "InvoiceService" as Service
participant "InvoiceRepository" as Repo
database "SQL Server" as DB
participant "Printer" as Printer

Waitstaff -> UI: Chọn bàn & Xem tạm tính
UI -> Controller: GET /api/invoices/preview/{tableId}
Controller -> Service: CalculateInvoice(tableId)
Service -> Repo: GetOrderAndDeposit(tableId)
Repo -> DB: SELECT ServedItems & Deposit
DB --> Repo: RawData
Repo --> Service: Data
Service -> Service: Calculate(Subtotal, Phí, VAT, -Cọc)
Service --> Controller: InvoicePreviewDto
Controller --> UI: 200 OK
UI --> Waitstaff: Hiển thị tiền tạm tính

Waitstaff -> UI: Xác nhận thanh toán
UI -> Controller: POST /api/invoices/settle
Controller -> Service: SettleInvoice(dto)
Service -> Repo: SaveInvoice & SetTableCleaning
Repo -> DB: INSERT Invoices, UPDATE TableStatus
DB --> Repo: OK
Repo --> Service: Saved
Service -> Printer: PrintReceipt
Printer --> Service: OK
Service --> Controller: Result(Success)
Controller --> UI: 200 OK
UI --> Waitstaff: Thanh toán thành công
@enduml
```

