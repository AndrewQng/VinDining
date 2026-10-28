# Đặc tả UC-E3: Yêu cầu thanh toán

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-E3 |
| **Tên Use Case** | Yêu cầu thanh toán *(Billing Request / Checkout Request)* |
| **Tác nhân tham gia** | Nhân viên Phục vụ *(Chính)*, Khách hàng *(Đồng tham gia)*, Thu ngân *(Người tiếp nhận)*, Hệ thống tự động *(Phụ)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5; Làm tiền điều kiện kích hoạt UC-E8 (Thanh toán hóa đơn) |
| **Mục tiêu chức năng** | Nhân viên phục vụ gửi thông báo yêu cầu tính tiền của bàn ăn từ ứng dụng di động về quầy thu ngân; hệ thống ghi nhận trạng thái bàn chờ thanh toán và gửi tín hiệu cảnh báo thời gian thực qua SignalR. |
| **Điều kiện tiên quyết** | Bàn ăn đang ở trạng thái Đang phục vụ *(Occupied)* và có đơn hàng hoạt động. |
| **Điều kiện kết thúc** | Bàn ăn chuyển sang trạng thái Chờ thanh toán *(PaymentPending)*; màn hình Web POS của Thu ngân nhận chuông báo và thông tin bàn yêu cầu. |

## Luồng sự kiện chính (Main Flow)
1. Khách hàng thông báo yêu cầu tính tiền trực tiếp với nhân viên phục vụ tại bàn ăn hoặc bấm nút Yêu cầu thanh toán trên giao diện E-Menu.
2. Nhân viên phục vụ chọn bàn trên ứng dụng di động và bấm nút Yêu cầu tính tiền.
3. Hệ thống kiểm tra điều kiện hợp lệ của bàn ăn và đơn hàng đang hoạt động trong cơ sở dữ liệu.
4. Hệ thống cập nhật trạng thái bàn ăn sang Chờ thanh toán *(PaymentPending)*.
5. Hệ thống gửi thông báo thời gian thực kèm chuông báo qua SignalR đến giao diện Web POS của Thu ngân tại quầy.
6. Ứng dụng di động của phục vụ hiển thị thông báo đã gửi yêu cầu thành công đến quầy thu ngân.

## Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Khi bàn ăn chưa có món nào được phục vụ hoặc đơn hàng đang bị khóa, hệ thống hiển thị thông báo lỗi trên ứng dụng di động và không phát thông báo về quầy thu ngân.

## Sơ đồ tuần tự (Sequence Diagram)

### Phục vụ gửi yêu cầu tính tiền về quầy
```plantuml
!include ../puml/sequences/SD_UC_E3_1_Request_Checkout.puml
```
