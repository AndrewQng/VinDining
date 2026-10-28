# Đặc tả UC-E8: Thanh toán hóa đơn

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-E8 |
| **Tên Use Case** | Thanh toán hóa đơn *(Invoice Settlement & Table Closing)* |
| **Tác nhân tham gia** | Nhân viên Thu ngân *(Chính)*, Nhân viên Phục vụ *(Hỗ trợ giao nhận)*, Khách hàng *(Thanh toán tại bàn)*, Hệ thống tự động *(Phụ)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5; Nhận điều kiện tiên quyết từ UC-E3 (Yêu cầu thanh toán) |
| **Mục tiêu chức năng** | Thu ngân xem chi tiết tạm tính cấn trừ 100% tiền cọc, in phiếu tạm tính kèm mã VietQR ra máy in nhiệt quầy để phục vụ mang ra bàn cho khách đối soát; tiếp nhận thanh toán, xác nhận đóng hóa đơn trên Web POS quầy, in hóa đơn chính thức và chuyển bàn sang trạng thái Chờ dọn dẹp. |
| **Điều kiện tiên quyết** | Bàn ăn đang ở trạng thái Chờ thanh toán *(PaymentPending)* sau khi nhận yêu cầu từ phục vụ (hoặc Thu ngân chủ động chọn bàn đang ở trạng thái *Occupied*). |
| **Điều kiện kết thúc** | Hóa đơn được thanh toán thành công và lưu vào CSDL; đơn hàng chuyển trạng thái Đã thanh toán *(Paid)*; bàn chuyển sang Chờ dọn dẹp *(Cleaning)* và SignalR đồng bộ sơ đồ bàn toàn nhà hàng. |

## Luồng sự kiện chính (Main Flow)
1. Thu ngân nhận thông báo bàn yêu cầu thanh toán trên màn hình Web POS quầy; chọn bàn và bấm Xem tạm tính.
2. Hệ thống tự động tính toán tổng tiền món ăn (Subtotal), cộng 5% phí phục vụ, cộng 10% thuế VAT, khấu trừ 100% khoản tiền cọc đã thu trước đó và hiển thị chi tiết lên màn hình Web POS quầy.
3. Thu ngân kiểm tra thông tin và bấm nút In phiếu tạm tính; hệ thống gửi lệnh ESC/POS in phiếu chi tiết kèm mã VietQR ra máy in nhiệt tại quầy.
4. Thu ngân kẹp phiếu tạm tính vào sổ da bàn giao cho nhân viên phục vụ mang ra tận bàn cho khách đối soát chi tiết.
5. Khách hàng kiểm tra tại bàn và thực hiện thanh toán: quét mã VietQR trên phiếu, kẹp tiền mặt vào sổ da, hoặc nhân viên phục vụ mang máy POS không dây đến cà thẻ trước mặt khách.
6. Thu ngân kiểm tra kết quả giao dịch trên Web POS quầy (hoặc nhận tiền mặt/biên lai cà thẻ từ phục vụ), chọn phương thức thanh toán tương ứng và bấm nút Xác nhận thanh toán.
7. Hệ thống lưu hóa đơn vào CSDL, in hóa đơn thanh toán chính thức ra máy in nhiệt quầy; phục vụ kẹp hóa đơn kèm tiền thừa/biên lai mang ra bàn gửi lại khách hàng.
8. Hệ thống chuyển trạng thái đơn hàng sang Đã thanh toán *(Paid)*, cập nhật trạng thái bàn sang Chờ dọn dẹp *(Cleaning)* và kích hoạt SignalR đồng bộ tức thì lên sơ đồ bàn của toàn bộ nhân viên.

## Luồng ngoại lệ (Alternative / Exception Flows)
* 2a. Khi tổng chi phí bữa ăn thực tế nhỏ hơn số tiền cọc đã đóng trước đó, hệ thống áp dụng nguyên tắc tiền cọc là mức chi tiêu tối thiểu không hoàn lại, ghi nhận số tiền khách phải trả thêm là 0 VNĐ và khóa chức năng hoàn tiền cọc thừa.

## Danh sách Sơ đồ tuần tự (Sequence Diagrams)

### 1. Thu ngân xem & In phiếu tạm tính
```plantuml
!include ../puml/sequences/SD_UC_E3_2_Preview_Invoice.puml
```

### 2. Thu ngân xác nhận thanh toán & Đóng đơn
```plantuml
!include ../puml/sequences/SD_UC_E3_3_Settle_Invoice.puml
```
