# BÁO CÁO PHÂN TÍCH HỆ THỐNG

## ĐỀ TÀI DỰ ÁN: HỆ THỐNG QUẢN LÝ VÀ ĐẶT BÀN NHÀ HÀNG (VINDINING)

---


| Thông tin | Chi tiết |
| :--- | :--- |
| Giảng viên hướng dẫn: | ThS. Phạm Hữu Tùng |
| Sinh viên thực hiện 1: | Nguyễn Mạnh Quyền |
| Sinh viên thực hiện 2: | Đặng Quốc Khánh |
| Sinh viên thực hiện 3: | Nguyễn Hoàng Đạt |
| Giai đoạn đồ án: | Phase 1: Phân tích Yêu cầu & Thiết kế Hệ thống |


---

# CHƯƠNG 1: TỔNG QUAN TÁC NHÂN & MA TRẬN PHÂN QUYỀN


## 1.1 Danh mục Tác nhân Hệ thống

Hệ thống phân định 5 tác nhân chính và 2 tác nhân phụ:


| Tác nhân (Actor) | Phân loại | Thiết bị | Phạm vi quyền hạn |
| :--- | :--- | :--- | :--- |
| Khách hàng (Guest) | Tác nhân chính | Điện thoại thông minh (Mobile Web) | Tra cứu sơ đồ bàn, đặt bàn trực tuyến, thanh toán cọc qua VNPAY, xem thực đơn tại bàn và gửi yêu cầu phục vụ. |
| Nhân viên Phục vụ (Waitstaff) | Tác nhân chính | Điện thoại di động (Mobile Web) | Check-in bàn, tạo order gọi món, kích hoạt nấu theo đợt (Course Firing), chuyển bàn và gửi yêu cầu tính tiền về quầy. |
| Nhân viên Điều phối (Expediter) | Tác nhân chính | Máy tính bảng (Tablet Web) | Kiểm tra đĩa món tại quầy Pass và bấm xác nhận đi món cho bàn. |
| Nhân viên Thu ngân (Cashier) | Tác nhân chính | Máy tính / POS tại quầy (Web POS) | Tiếp nhận yêu cầu tính tiền, kiểm tra và in phiếu tạm tính cấn trừ cọc, thu tiền (tiền mặt/thẻ/VietQR), xác nhận hoàn tất thanh toán và đóng bàn. |
| Quản lý Nhà hàng (Manager) | Tác nhân chính | Laptop / PC | Thiết lập thực đơn, giá và sơ đồ bàn; xem báo cáo doanh thu; duyệt hoàn cọc ngoại lệ; quản trị tài khoản và phân quyền. |
| Cổng thanh toán (VNPAY Gateway) | Tác nhân phụ | Máy chủ thanh toán | Cung cấp cổng thanh toán cọc, phản hồi kết quả giao dịch qua IPN webhook và xử lý lệnh hoàn cọc tự động. |
| Background Worker | Tác nhân phụ | Tiến trình chạy ngầm (.NET IHostedService) | Thực thi tự động các tác vụ nền định kỳ: giải phóng bàn hết hạn cọc, gửi khảo sát CSAT, gửi thông báo nhắc hẹn và cảnh báo thời gian chế biến món trễ SLA. |


## 1.2 Ma trận Phân quyền Chức năng (RBAC)


| Phân hệ chức năng | Chức năng chi tiết (Use Case) | Khách hàng | Phục vụ | Điều phối | Thu ngân | Quản lý |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Tài khoản & Phân quyền | Đăng nhập & Xác thực (UC-E8) | ✗ | ✓ | ✓ | ✓ | ✓ |
|  | Quản trị Tài khoản (UC-A4) | ✗ | ✗ | ✗ | ✗ | ✓ |
| Đặt bàn & Đặt cọc | Đặt bàn & Đặt cọc trực tuyến (UC-U1) | ✓ | ✗ | ✗ | ✗ | ✗ |
|  | Hủy đặt bàn (UC-U3) | ✓ | ✗ | ✗ | ✗ | ✗ |
|  | Duyệt hoàn cọc thủ công (UC-A3) | ✗ | ✗ | ✗ | ✗ | ✓ |
| Sơ đồ bàn & Trạng thái | Check in nhận bàn (UC-E6) | ✗ | ✓ | ✗ | ✓ | ✓ |
|  | Đổi bàn (UC-E5) | ✗ | ✓ | ✗ | ✗ | ✓ |
|  | Cấu hình sơ đồ bàn ăn (UC-A2) | ✗ | ✗ | ✗ | ✗ | ✓ |
| Gọi món & Phục vụ | Yêu cầu phục vụ thông qua QR menu (UC-U2) | ✓ | ✓ | ✗ | ✗ | ✗ |
|  | Tạo Order (UC-E1) | ✗ | ✓ | ✗ | ✗ | ✓ |
|  | Cập nhật Order (UC-E2) | ✗ | ✓ | ✗ | ✗ | ✓ |
|  | Xác nhận đi món (UC-E3) | ✗ | ✗ | ✓ | ✗ | ✓ |
|  | Quản trị Danh mục & Thực đơn (UC-A1) | ✗ | ✗ | ✗ | ✗ | ✓ |
| Hóa đơn & Đánh giá | Yêu cầu thanh toán (UC-E4) | ✗ | ✓ | ✗ | ✗ | ✓ |
|  | Thanh toán hóa đơn (UC-E7) | ✗ | ✗ | ✗ | ✓ | ✓ |
|  | Gửi đánh giá dịch vụ (UC-U4) | ✓ | ✗ | ✗ | ✗ | ✗ |
|  | Báo cáo Thống kê & Doanh thu (UC-A5) | ✗ | ✗ | ✗ | ✗ | ✓ |
| Tác vụ chạy ngầm | Giải phóng bàn hết hạn cọc (UC-S1) | ✗ | ✗ | ✗ | ✗ | Worker: ✓ |
|  | Gửi biểu mẫu đánh giá chất lượng (UC-S2) | ✗ | ✗ | ✗ | ✗ | Worker: ✓ |
|  | Gửi thông báo nhắc hẹn đặt bàn (UC-S3) | ✗ | ✗ | ✗ | ✗ | Worker: ✓ |
|  | Theo dõi & cảnh báo thời gian order (UC-S4) | ✗ | ✗ | ✗ | ✗ | Worker: ✓ |


---

# CHƯƠNG 2: MÔ HÌNH HÓA USE CASE


## 2.1 Sơ đồ Use Case tổng quát toàn hệ thống

![Sơ đồ Use Case tổng quát toàn hệ thống](images/use_case_overall.png)


## 2.2 Danh mục Use Case hệ thống


| STT | Mã Use Case | Tên Use Case | Phân hệ | Mức độ ưu tiên |
| :--- | :--- | :--- | :--- | :--- |
| 1 | UC-U1 | Đặt bàn & Đặt cọc trực tuyến | Khách hàng (Guest) | Bắt buộc (Must Have) |
| 2 | UC-U2 | Yêu cầu phục vụ thông qua QR menu | Khách hàng (Guest) | Bắt buộc (Must Have) |
| 3 | UC-U3 | Hủy đặt bàn | Khách hàng (Guest) | Bắt buộc (Must Have) |
| 4 | UC-U4 | Gửi đánh giá dịch vụ | Khách hàng (Guest) | Bổ sung (Could Have) |
| 5 | UC-E1 | Tạo Order | Nhân viên Nội bộ (Staff) | Bắt buộc (Must Have) |
| 6 | UC-E2 | Cập nhật Order | Nhân viên Nội bộ (Staff) | Bắt buộc (Must Have) |
| 7 | UC-E3 | Xác nhận đi món | Nhân viên Nội bộ (Staff) | Bắt buộc (Must Have) |
| 8 | UC-E4 | Yêu cầu thanh toán | Nhân viên Nội bộ (Staff) | Bắt buộc (Must Have) |
| 9 | UC-E5 | Đổi bàn | Nhân viên Nội bộ (Staff) | Quan trọng (Should Have) |
| 10 | UC-E6 | Check in nhận bàn | Nhân viên Nội bộ (Staff) | Bắt buộc (Must Have) |
| 11 | UC-E7 | Thanh toán hóa đơn | Nhân viên Nội bộ (Staff) | Bắt buộc (Must Have) |
| 12 | UC-E8 | Đăng nhập & Xác thực | Nhân viên Nội bộ (Staff) | Bắt buộc (Must Have) |
| 13 | UC-A1 | Quản trị Danh mục & Thực đơn | Quản lý (Manager) | Quan trọng (Should Have) |
| 14 | UC-A2 | Cấu hình sơ đồ bàn ăn | Quản lý (Manager) | Quan trọng (Should Have) |
| 15 | UC-A3 | Duyệt hoàn cọc thủ công | Quản lý (Manager) | Quan trọng (Should Have) |
| 16 | UC-A4 | Quản trị Tài khoản | Quản lý (Manager) | Quan trọng (Should Have) |
| 17 | UC-A5 | Báo cáo Thống kê & Doanh thu | Quản lý (Manager) | Bổ sung (Could Have) |
| 18 | UC-S1 | Giải phóng bàn hết hạn cọc | Background Worker | Bắt buộc (Must Have) |
| 19 | UC-S2 | Gửi biểu mẫu đánh giá chất lượng sau phục vụ | Background Worker | Bổ sung (Could Have) |
| 20 | UC-S3 | Gửi thông báo nhắc hẹn đặt bàn | Background Worker | Quan trọng (Should Have) |
| 21 | UC-S4 | Theo dõi & cảnh báo thời gian order | Background Worker | Quan trọng (Should Have) |


## 2.3 Đặc tả chi tiết từng Use Case


### 2.3.1 Phân hệ Khách hàng


### Đặc tả UC-U1: Đặt bàn & Đặt cọc trực tuyến


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-U1 |
| Tên Use Case | Đặt bàn & Đặt cọc trực tuyến |
| Tác nhân | Khách hàng (Chính), Cổng thanh toán VNPAY (Phụ) |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Khách hàng truy cập website đặt bàn và chọn khung giờ nhà hàng mở phục vụ. |
| Điều kiện kết thúc | Bàn chuyển sang trạng thái Đã đặt (Reserved), cọc được ghi nhận và mã đặt bàn được gửi cho khách. |


**Luồng sự kiện chính:**
1. Khách hàng chọn ngày, giờ dùng bữa, số lượng khách và khu vực ngồi trên giao diện web.
2. Hệ thống hiển thị danh sách bàn còn trống trên sơ đồ mặt bằng.
3. Khách hàng chọn bàn và chọn trước Set Menu (tùy chọn).
4. Khách hàng nhập thông tin liên hệ và xác nhận đặt cọc.
5. Hệ thống tính số tiền cọc theo BR-06, khóa giữ bàn tạm thời 17 phút (bàn: Locked; đơn: Chờ đặt cọc) và chuyển hướng đến cổng thanh toán VNPAY.
6. Khách hàng thực hiện thanh toán tiền cọc qua mã VietQR hoặc thẻ ngân hàng.
7. Cổng VNPAY phản hồi giao dịch thành công; hệ thống chuyển trạng thái bàn sang Reserved và gửi thông tin xác nhận qua SMS/Email.

**Luồng ngoại lệ:**
* 2a. Khung giờ hết bàn: Hệ thống gợi ý chuyển sang ca phục vụ hoặc khu vực khác.
* 6a. Quá 17 phút chưa hoàn tất thanh toán: Hệ thống tự động hủy phiên và mở lại bàn về trạng thái sẵn sàng.

### Đặc tả UC-U2: Yêu cầu phục vụ thông qua QR menu


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-U2 |
| Tên Use Case | Yêu cầu phục vụ thông qua QR menu |
| Tác nhân | Khách hàng (Chính), Nhân viên Phục vụ (Phụ) |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Khách hàng đang ngồi tại bàn ăn đã hoàn tất thủ tục check-in. |
| Điều kiện kết thúc | Yêu cầu được ghi nhận vào hệ thống và hiển thị lên thiết bị phục vụ phụ trách. |


**Luồng sự kiện chính:**
1. Khách hàng quét mã QR tại bàn để truy cập E-Menu trên điện thoại cá nhân.
2. Hệ thống hiển thị giao diện thực đơn cùng danh mục các nút yêu cầu dịch vụ (gọi phục vụ, châm nước, đổi dụng cụ).
3. Khách hàng chọn yêu cầu dịch vụ cần hỗ trợ và bấm gửi.
4. Hệ thống ghi nhận yêu cầu vào cơ sở dữ liệu và gửi thông báo tức thời đến thiết bị của nhân viên phục vụ bàn.
5. Nhân viên phục vụ đến hỗ trợ khách và bấm xác nhận hoàn tất trên thiết bị.

**Luồng ngoại lệ:**
* 1a. Mã QR không hợp lệ hoặc bàn chưa check-in: Hệ thống thông báo lỗi và yêu cầu liên hệ nhân viên.

### Đặc tả UC-U3: Hủy đặt bàn


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-U3 |
| Tên Use Case | Hủy đặt bàn |
| Tác nhân | Khách hàng (Chính), Cổng thanh toán VNPAY (Phụ) |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Đơn đặt bàn đang ở trạng thái Reserved và chưa đến giờ phục vụ. |
| Điều kiện kết thúc | Đơn hủy thành công, bàn giải phóng về Available, tiền cọc hoàn lại theo quy định. |


**Luồng sự kiện chính:**
1. Khách hàng nhập mã đặt bàn và số điện thoại để tra cứu thông tin đặt bàn.
2. Hệ thống hiển thị chi tiết đặt bàn kèm chính sách hoàn cọc.
3. Khách hàng chọn lý do và bấm xác nhận hủy đặt bàn.
4. Hệ thống kiểm tra thời gian hủy: nếu trước giờ hẹn từ 4 tiếng trở lên, gửi yêu cầu hoàn 100% tiền cọc sang cổng VNPAY.
5. Cổng VNPAY xác nhận giao dịch hoàn tiền thành công.
6. Hệ thống chuyển đơn sang trạng thái Đã hủy, chuyển bàn về trạng thái sẵn sàng và gửi thông báo hoàn tất cho khách.

**Luồng ngoại lệ:**
* 4a. Hủy trước giờ hẹn dưới 4 tiếng: Hệ thống thông báo chính sách phạt không hoàn cọc và chỉ hủy giữ chỗ nếu khách đồng ý.

### Đặc tả UC-U4: Gửi đánh giá dịch vụ


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-U4 |
| Tên Use Case | Gửi đánh giá dịch vụ |
| Tác nhân | Khách hàng (Chính) |
| Mức độ ưu tiên | Bổ sung (Could Have) |
| Điều kiện tiên quyết | Bàn ăn đã hoàn tất thanh toán hóa đơn. |
| Điều kiện kết thúc | Đánh giá được lưu vào cơ sở dữ liệu và tổng hợp vào báo cáo chất lượng dịch vụ. |


**Luồng sự kiện chính:**
1. Khách hàng truy cập liên kết đánh giá nhận được qua tin nhắn hoặc quét mã QR trên phiếu thanh toán.
2. Hệ thống hiển thị biểu mẫu khảo sát chất lượng món ăn, không gian và thái độ phục vụ.
3. Khách hàng chấm điểm sao, nhập ý kiến đóng góp và bấm gửi đánh giá.
4. Hệ thống lưu kết quả đánh giá và hiển thị thông điệp cảm ơn khách hàng.

**Luồng ngoại lệ:** Không có.

### 2.3.2 Phân hệ Nhân viên Nội bộ


### Đặc tả UC-E1: Tạo Order


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-E1 |
| Tên Use Case | Tạo Order |
| Tác nhân | Nhân viên Phục vụ (Chính), Quản lý Nhà hàng (Phụ) |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Bàn ăn đang ở trạng thái Đang phục vụ (Occupied) sau khi check-in. |
| Điều kiện kết thúc | Order được tạo thành công và chuyển thông tin món vào bếp. |


**Luồng sự kiện chính:**
1. Nhân viên phục vụ chọn bàn đang phục vụ trên ứng dụng và chọn Tạo Order.
2. Nhân viên nhập số lượng khách và thêm các món ăn theo từng Course (Khai vị, Món chính, Tráng miệng).
3. Nhân viên kiểm tra danh mục món, nhập ghi chú nếu có và bấm Gửi đơn.
4. Hệ thống lưu Order và chuyển thông tin món vào bếp theo từng đợt phục vụ.

**Luồng ngoại lệ:**
* 2a. Món ăn trong thực đơn tạm thời hết nguyên liệu: Hệ thống khóa nút chọn món và cảnh báo nhân viên phục vụ tư vấn món khác.

### Đặc tả UC-E2: Cập nhật Order


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-E2 |
| Tên Use Case | Cập nhật Order |
| Tác nhân | Nhân viên Phục vụ (Chính), Quản lý Nhà hàng (Phụ) |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Bàn ăn đã có Order đang hoạt động (Active). |
| Điều kiện kết thúc | Các món gọi thêm hoặc lệnh nấu đợt tiếp theo được ghi nhận vào Order. |


**Luồng sự kiện chính:**
1. Nhân viên phục vụ mở Order đang hoạt động của bàn trên ứng dụng.
2. Khi khách gọi thêm món hoặc đồ uống, nhân viên chọn Gọi thêm món và chọn mặt hàng cần bổ sung.
3. Nhân viên phục vụ bấm kích hoạt nấu đợt món tiếp theo khi khách có nhu cầu.
4. Hệ thống cập nhật Order và chuyển lệnh nấu đợt tiếp theo vào bếp.

**Luồng ngoại lệ:**
* 1a. Bàn đã chuyển sang trạng thái Chờ thanh toán: Hệ thống khóa chức năng cập nhật và yêu cầu mở lại trạng thái phục vụ trước khi thêm món.

### Đặc tả UC-E3: Xác nhận đi món


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-E3 |
| Tên Use Case | Xác nhận đi món |
| Tác nhân | Nhân viên Điều phối (Expediter - Chính), Quản lý Nhà hàng (Phụ) |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Bếp đã chế biến xong món ăn và đặt lên quầy Pass. |
| Điều kiện kết thúc | Món ăn được chuyển trạng thái sang Đã ra món (Served). |


**Luồng sự kiện chính:**
1. Đầu bếp đặt đĩa món hoàn chỉnh lên quầy Pass.
2. Nhân viên điều phối kiểm tra đĩa món so với thông tin đơn hàng trên màn hình quầy Pass.
3. Nhân viên điều phối bấm nút Xác nhận đi món (Served) trên màn hình.
4. Hệ thống cập nhật trạng thái món ăn sang Đã ra món (Served).
5. Đĩa món được chuyển đi phục vụ tại bàn cho khách.

**Luồng ngoại lệ:**
* 2a. Món không đạt yêu cầu: Nhân viên điều phối yêu cầu bếp chế biến lại.

### Đặc tả UC-E4: Yêu cầu thanh toán


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-E4 |
| Tên Use Case | Yêu cầu thanh toán |
| Tác nhân | Nhân viên Phục vụ (Chính), Nhân viên Thu ngân (Phụ), Quản lý Nhà hàng (Phụ) |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Bàn ăn đang ở trạng thái Đang phục vụ (Occupied) và có đơn hàng hoạt động. |
| Điều kiện kết thúc | Bàn chuyển sang trạng thái Chờ thanh toán (PaymentPending); màn hình POS thu ngân nhận cảnh báo. |


**Luồng sự kiện chính:**
1. Khách hàng thông báo yêu cầu tính tiền tại bàn ăn.
2. Nhân viên phục vụ chọn bàn trên ứng dụng di động và bấm nút Yêu cầu tính tiền.
3. Hệ thống xác thực trạng thái bàn và cập nhật sang Chờ thanh toán (PaymentPending) trong cơ sở dữ liệu.
4. Hệ thống gửi chuông báo và thông tin bàn cần thanh toán sang màn hình Web POS của Thu ngân.
5. Ứng dụng di động của phục vụ hiển thị xác nhận đã gửi yêu cầu về quầy thành công.

**Luồng ngoại lệ:**
* 3a. Bàn ăn chưa có món nào được phục vụ: Hệ thống báo lỗi và không gửi yêu cầu về quầy.

### Đặc tả UC-E5: Đổi bàn


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-E5 |
| Tên Use Case | Đổi bàn |
| Tác nhân | Nhân viên Phục vụ (Chính), Nhân viên Thu ngân (Phụ), Quản lý Nhà hàng (Phụ) |
| Mức độ ưu tiên | Quan trọng (Should Have) |
| Điều kiện tiên quyết | Bàn nguồn đang Occupied và bàn đích đang ở trạng thái Available. |
| Điều kiện kết thúc | Toàn bộ dữ liệu đơn hàng và tiền cọc được chuyển sang bàn mới; bàn cũ chuyển sang Cleaning. |


**Luồng sự kiện chính:**
1. Nhân viên phục vụ chọn bàn đang phục vụ và chọn chức năng Đổi bàn.
2. Hệ thống hiển thị danh sách các bàn còn trống phù hợp với số lượng khách.
3. Nhân viên chọn bàn đích và xác nhận đổi bàn.
4. Hệ thống cập nhật toàn bộ món ăn, lịch sử gọi món và thông tin cọc sang mã bàn đích.
5. Hệ thống đổi trạng thái bàn đích sang Occupied và bàn nguồn sang Cleaning.

**Luồng ngoại lệ:**
* 3a. Bàn đích vừa có khách khác ngồi: Hệ thống khóa thao tác và yêu cầu chọn vị trí bàn khác.

### Đặc tả UC-E6: Check in nhận bàn


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-E6 |
| Tên Use Case | Check in nhận bàn |
| Tác nhân | Nhân viên Phục vụ (Chính), Nhân viên Thu ngân (Chính), Quản lý Nhà hàng (Phụ) |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Bàn ăn ở trạng thái Reserved (khách đặt trước) hoặc Available (khách vãng lai). |
| Điều kiện kết thúc | Bàn chuyển sang Occupied và sẵn sàng cho quy trình gọi món. |


**Luồng sự kiện chính:**
1. Khách hàng đến nhà hàng và đọc mã đặt bàn hoặc số điện thoại cho nhân viên lễ tân / phục vụ.
2. Nhân viên tra cứu đơn đặt bàn, đối chiếu số lượng khách và dẫn khách vào vị trí bàn.
3. Nhân viên bấm nút Check-in trên ứng dụng di động hoặc máy POS; hệ thống chuyển trạng thái bàn sang Occupied.

**Luồng ngoại lệ:**
* 1a. Khách vãng lai không đặt trước (Walk-in): Nhân viên chọn bàn trống trên sơ đồ và bấm Check-in vãng lai trực tiếp.

### Đặc tả UC-E7: Thanh toán hóa đơn


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-E7 |
| Tên Use Case | Thanh toán hóa đơn |
| Tác nhân | Nhân viên Thu ngân (Chính), Nhân viên Phục vụ (Phụ), Quản lý Nhà hàng (Phụ) |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Bàn ăn đang ở trạng thái PaymentPending hoặc Occupied. |
| Điều kiện kết thúc | Đơn hàng chuyển Paid; hóa đơn được lưu; bàn chuyển sang Cleaning và tự động chuyển về Available sau khi dọn dẹp; in hóa đơn thành công. |


**Luồng sự kiện chính:**
1. Thu ngân nhận thông báo yêu cầu tính tiền trên màn hình Web POS quầy, chọn bàn và bấm Xem chi tiết tạm tính.
2. Hệ thống tính toán tổng tiền các món đã dùng, cộng 5% phí phục vụ, 10% thuế VAT và cấn trừ 100% tiền cọc đã thu trước đó.
3. Thu ngân kiểm tra số liệu rồi bấm nút In phiếu tạm tính; máy in nhiệt tại quầy in phiếu chi tiết kèm mã VietQR.
4. Thu ngân kẹp phiếu vào sổ da giao cho phục vụ mang ra bàn cho khách đối soát.
5. Khách hàng thực hiện thanh toán tại bàn (quét VietQR, trả tiền mặt hoặc cà thẻ POS không dây).
6. Thu ngân kiểm tra kết quả thanh toán trên màn hình POS quầy, chọn phương thức thanh toán và bấm Xác nhận thanh toán.
7. Máy in xuất hóa đơn chính thức; phục vụ mang hóa đơn kẹp sổ da gửi lại khách; hệ thống chuyển trạng thái bàn sang Cleaning và tự động chuyển về Available khi hoàn tất quy trình phục vụ bàn.

**Luồng ngoại lệ:**
* 2a. Tổng tiền bữa ăn nhỏ hơn tiền cọc đã đóng: Hệ thống ghi nhận số tiền khách phải trả thêm là 0 VNĐ theo nguyên tắc tiền cọc là mức chi tiêu tối thiểu không hoàn lại.

### Đặc tả UC-E8: Đăng nhập & Xác thực


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-E8 |
| Tên Use Case | Đăng nhập & Xác thực |
| Tác nhân | Toàn bộ nhân viên nội bộ (Phục vụ, Thu ngân, Điều phối), Quản lý Nhà hàng |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Nhân viên đã được cấp tài khoản hoạt động trong hệ thống. |
| Điều kiện kết thúc | Nhân viên đăng nhập thành công và truy cập đúng giao diện theo vai trò phân quyền. |


**Luồng sự kiện chính:**
1. Nhân viên truy cập hệ thống và nhập tên đăng nhập cùng mật khẩu.
2. Hệ thống mã hóa thông tin và đối soát với cơ sở dữ liệu người dùng.
3. Hệ thống tạo phiên làm việc bảo mật (JWT Token) và điều hướng nhân viên đến giao diện tương ứng theo vai trò.

**Luồng ngoại lệ:**
* 2a. Sai tên đăng nhập hoặc mật khẩu: Hệ thống thông báo lỗi; nếu sai quá 5 lần liên tiếp sẽ khóa tài khoản tạm thời 15 phút.

### 2.3.3 Phân hệ Quản lý


### Đặc tả UC-A1: Quản trị Danh mục & Thực đơn


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-A1 |
| Tên Use Case | Quản trị Danh mục & Thực đơn |
| Tác nhân | Quản lý Nhà hàng (Chính) |
| Mức độ ưu tiên | Quan trọng (Should Have) |
| Điều kiện tiên quyết | Quản lý đăng nhập thành công với quyền hạn quản trị danh mục. |
| Điều kiện kết thúc | Thông tin món ăn, giá bán và định mức thời gian chế biến được cập nhật vào hệ thống. |


**Luồng sự kiện chính:**
1. Quản lý mở danh mục thực đơn trên giao diện quản trị.
2. Quản lý thực hiện thêm mới, chỉnh sửa thông tin món ăn (tên, mô tả, đơn giá, nhóm danh mục, định mức thời gian Prep SLA).
3. Quản lý thiết lập trạng thái còn món hoặc tạm hết món cho từng mặt hàng.
4. Quản lý bấm Lưu; hệ thống cập nhật thực đơn và áp dụng ngay lập tức cho các giao diện đặt món.

**Luồng ngoại lệ:**
* 2a. Trùng tên món ăn hoặc đơn giá không hợp lệ: Hệ thống hiển thị cảnh báo và yêu cầu chỉnh sửa thông tin.

### Đặc tả UC-A2: Cấu hình sơ đồ bàn ăn


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-A2 |
| Tên Use Case | Cấu hình sơ đồ bàn ăn |
| Tác nhân | Quản lý Nhà hàng (Chính) |
| Mức độ ưu tiên | Quan trọng (Should Have) |
| Điều kiện tiên quyết | Quản lý đăng nhập tài khoản có thẩm quyền quản trị mặt bằng. |
| Điều kiện kết thúc | Sơ đồ vị trí, số hiệu bàn và mã QR bàn ăn được lưu vào hệ thống. |


**Luồng sự kiện chính:**
1. Quản lý truy cập giao diện thiết kế sơ đồ mặt bằng nhà hàng.
2. Quản lý thực hiện thêm bàn, xóa bàn, kéo thả định vị tọa độ và cấu hình số lượng ghế ngồi cho từng khu vực (Sảnh chính, VIP, Ban công).
3. Hệ thống tự động sinh mã QR định danh duy nhất cho từng bàn ăn mới.
4. Quản lý bấm Lưu cấu hình; hệ thống cập nhật sơ đồ bàn cho toàn bộ ứng dụng đặt bàn và phục vụ.

**Luồng ngoại lệ:**
* 2a. Xóa bàn đang có khách ngồi hoặc đã được đặt trước: Hệ thống từ chối thao tác và yêu cầu chuyển khách trước khi xóa.

### Đặc tả UC-A3: Duyệt hoàn cọc thủ công


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-A3 |
| Tên Use Case | Duyệt hoàn cọc thủ công |
| Tác nhân | Quản lý Nhà hàng (Chính), Cổng thanh toán VNPAY (Phụ) |
| Mức độ ưu tiên | Quan trọng (Should Have) |
| Điều kiện tiên quyết | Đơn đặt bàn bị phạt cọc do hủy trễ hoặc sự cố đột xuất từ phía nhà hàng. |
| Điều kiện kết thúc | Lệnh hoàn tiền được gửi sang VNPAY và ghi nhật ký kiểm toán. |


**Luồng sự kiện chính:**
1. Quản lý mở danh sách các yêu cầu hoàn cọc ngoại lệ cần xem xét.
2. Quản lý kiểm tra thông tin chi tiết đơn đặt bàn và lý do hủy bàn của khách.
3. Quản lý nhập lý do phê duyệt và bấm nút Chấp thuận hoàn cọc.
4. Hệ thống kích hoạt lệnh hoàn tiền sang cổng thanh toán VNPAY và ghi nhận nhật ký kiểm toán quản trị.
5. Cổng VNPAY phản hồi thành công; hệ thống cập nhật trạng thái đơn và gửi thông báo cho khách.

**Luồng ngoại lệ:**
* 3a. Quản lý từ chối hoàn cọc: Nhập lý do từ chối; hệ thống chuyển trạng thái đơn sang Bác bỏ hoàn cọc và gửi thông báo đến khách.

### Đặc tả UC-A4: Quản trị Tài khoản


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-A4 |
| Tên Use Case | Quản trị Tài khoản |
| Tác nhân | Quản lý Nhà hàng (Chính) |
| Mức độ ưu tiên | Quan trọng (Should Have) |
| Điều kiện tiên quyết | Quản lý đăng nhập thành công vào hệ thống. |
| Điều kiện kết thúc | Hồ sơ tài khoản nhân viên được tạo, chỉnh sửa quyền hạn hoặc khóa hoạt động. |


**Luồng sự kiện chính:**
1. Quản lý truy cập danh mục quản lý người dùng và phân quyền.
2. Quản lý thực hiện tạo tài khoản mới (họ tên, email, chức vụ: Phục vụ, Điều phối, Thu ngân, Quản lý).
3. Quản lý gán vai trò quyền hạn tương ứng cho tài khoản.
4. Hệ thống tạo tài khoản bảo mật và gửi thông tin đăng nhập ban đầu về email nhân viên.

**Luồng ngoại lệ:**
* 2a. Trùng địa chỉ email hoặc tên đăng nhập: Hệ thống hiển thị thông báo lỗi và yêu cầu đổi thông tin.

### Đặc tả UC-A5: Báo cáo Thống kê & Doanh thu


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-A5 |
| Tên Use Case | Báo cáo Thống kê & Doanh thu |
| Tác nhân | Quản lý Nhà hàng (Chính) |
| Mức độ ưu tiên | Bổ sung (Could Have) |
| Điều kiện tiên quyết | Quản lý đăng nhập thành công vào hệ thống. |
| Điều kiện kết thúc | Báo cáo số liệu kinh doanh được tổng hợp và hiển thị trực quan dưới dạng biểu đồ. |


**Luồng sự kiện chính:**
1. Quản lý mở phân hệ Báo cáo & Thống kê.
2. Quản lý chọn khoảng thời gian (ngày, tuần, tháng, quý) và bộ lọc khu vực/ca phục vụ.
3. Hệ thống truy vấn cơ sở dữ liệu và hiển thị các chỉ số kinh doanh chính: tổng doanh thu, số lượt khách, tỷ lệ lấp đầy bàn, món ăn bán chạy nhất và tỷ lệ hủy cọc.
4. Quản lý có thể chọn xuất dữ liệu báo cáo ra file Excel hoặc PDF.

**Luồng ngoại lệ:**
* 2a. Khoảng thời gian lọc không có dữ liệu phát sinh: Hệ thống hiển thị bảng trống cùng thông báo không có số liệu.

### 2.3.4 Phân hệ Tác vụ Nền (Background Worker)


### Đặc tả UC-S1: Giải phóng bàn hết hạn cọc


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-S1 |
| Tên Use Case | Giải phóng bàn hết hạn cọc |
| Tác nhân | Background Worker |
| Mức độ ưu tiên | Bắt buộc (Must Have) |
| Điều kiện tiên quyết | Bàn ăn ở trạng thái Khóa tạm thời (Locked) trong quá trình thanh toán cọc. |
| Điều kiện kết thúc | Bàn hết hạn thanh toán được giải phóng về trạng thái Trống (Available); đơn cọc bị hủy. |


**Luồng sự kiện chính:**
1. Background Worker kích hoạt tiến trình quét định kỳ mỗi 60 giây.
2. Hệ thống kiểm tra các đơn đặt bàn có trạng thái Chờ đặt cọc (PendingDeposit) đã vượt quá thời hạn giữ chỗ (17 phút).
3. Hệ thống cập nhật trạng thái các đơn này sang Hết hạn hủy (Expired_Cancelled).
4. Hệ thống mở khóa bàn ăn, chuyển trạng thái bàn từ Locked về Available trên sơ đồ mặt bằng.
5. Hệ thống hoàn tất lượt quét và ghi nhật ký xử lý.

**Luồng ngoại lệ:** Không có.

### Đặc tả UC-S2: Gửi biểu mẫu đánh giá chất lượng sau phục vụ


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-S2 |
| Tên Use Case | Gửi biểu mẫu đánh giá chất lượng sau phục vụ |
| Tác nhân | Background Worker |
| Mức độ ưu tiên | Bổ sung (Could Have) |
| Điều kiện tiên quyết | Bàn ăn đã hoàn tất thanh toán hóa đơn (Paid). |
| Điều kiện kết thúc | Lời mời khảo sát chất lượng dịch vụ được gửi đến email của khách hàng. |


**Luồng sự kiện chính:**
1. Background Worker kích hoạt tiến trình quét định kỳ mỗi 5 phút.
2. Hệ thống kiểm tra các hóa đơn đã thanh toán thành công nhưng chưa được gửi link đánh giá.
3. Hệ thống tạo mã khảo sát bảo mật gắn liền với đơn dùng bữa.
4. Hệ thống gửi tin nhắn/email chứa liên kết đánh giá đến khách hàng.
5. Hệ thống đánh dấu hóa đơn đã gửi khảo sát để tránh gửi lặp lại.

**Luồng ngoại lệ:** Không có.

### Đặc tả UC-S3: Gửi thông báo nhắc hẹn đặt bàn


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-S3 |
| Tên Use Case | Gửi thông báo nhắc hẹn đặt bàn |
| Tác nhân | Background Worker |
| Mức độ ưu tiên | Quan trọng (Should Have) |
| Điều kiện tiên quyết | Đơn đặt bàn đã xác nhận đặt cọc (Reserved) và sắp đến giờ dùng bữa. |
| Điều kiện kết thúc | Thông báo nhắc lịch được gửi tới khách hàng; ghi nhận trạng thái đã nhắc. |


**Luồng sự kiện chính:**
1. Background Worker kích hoạt tiến trình quét định kỳ mỗi 15 phút.
2. Hệ thống kiểm tra các đơn đặt bàn có giờ hẹn trong khoảng 2 tiếng sắp tới và chưa được gửi thông báo nhắc.
3. Hệ thống tạo nội dung thông báo kèm thông tin bàn, thời gian và địa chỉ nhà hàng.
4. Hệ thống gửi tin nhắn/email nhắc hẹn đến khách hàng.
5. Hệ thống đánh dấu đơn đặt bàn đã được gửi thông báo nhắc.

**Luồng ngoại lệ:** Không có.

### Đặc tả UC-S4: Theo dõi & cảnh báo thời gian order


| Thuộc tính | Chi tiết |
| :--- | :--- |
| Mã Use Case | UC-S4 |
| Tên Use Case | Theo dõi & cảnh báo thời gian order |
| Tác nhân | Background Worker |
| Mức độ ưu tiên | Quan trọng (Should Have) |
| Điều kiện tiên quyết | Bếp đang chế biến các món ăn thuộc đơn hàng đang phục vụ (Cooking). |
| Điều kiện kết thúc | Trạng thái trễ hạn SLA của các món ăn được phát hiện và cảnh báo kịp thời lên màn hình Bếp và Trạm Pass. |


**Luồng sự kiện chính:**
1. Background Worker kích hoạt tiến trình kiểm soát SLA định kỳ mỗi 15 giây.
2. Hệ thống truy vấn danh sách các món ăn đang trong trạng thái Chế biến (Cooking).
3. Hệ thống tính toán thời gian chế biến thực tế so với định mức thời gian Prep SLA của từng món.
4. Khi thời gian chế biến vượt ngưỡng 80% hoặc quá hạn định mức, hệ thống phát tín hiệu đổi màu cảnh báo lên màn hình KDS Bếp và trạm Pass.
5. Hệ thống hoàn tất chu kỳ kiểm soát.

**Luồng ngoại lệ:** Không có.

## 2.4 Quy tắc nghiệp vụ bắt buộc


| Mã quy tắc | Tên quy tắc | Nội dung nghiệp vụ chi phối | Áp dụng tại |
| :--- | :--- | :--- | :--- |
| BR-01 | Thời hạn khóa giữ bàn tạm thời | Khóa giữ bàn tối đa 17 phút (15 phút thanh toán mã QR và 2 phút ân hạn). Quá thời hạn chưa có phản hồi thanh toán thành công, hệ thống tự động hủy đơn và giải phóng bàn về Available. | UC-U1, UC-S1 |
| BR-02 | Công thức tính Hóa đơn & Cấn trừ cọc | Subtotal = Tổng tiền món Served; Phí phục vụ = Subtotal × 5%; Thuế VAT = (Subtotal + Phí phục vụ) × 10%; Tổng cộng = Subtotal + Phí phục vụ + Thuế VAT; Số tiền thanh toán thêm = MAX(0, Tổng cộng − Tiền cọc). Tiền cọc là mức chi tiêu tối thiểu không hoàn lại. | UC-E7 |
| BR-03 | Thẩm quyền xác nhận đi món tại quầy Pass | Thao tác xác nhận đi món (Served) tại quầy Pass chỉ dành riêng cho Nhân viên Điều phối (Expediter) và Quản lý Nhà hàng. Đầu bếp và Khách hàng không có quyền thực hiện. | UC-E3 |
| BR-04 | Chính sách hủy đặt bàn & Hoàn tiền cọc | Hủy trước giờ hẹn từ 4 tiếng trở lên: Tự động hoàn trả 100% tiền cọc qua cổng thanh toán VNPAY. Hủy dưới 4 tiếng hoặc vắng mặt: Phạt giữ 100% tiền cọc. Quản lý có quyền xem xét duyệt hoàn cọc ngoại lệ trong trường hợp bất khả kháng. | UC-U3, UC-A3 |
| BR-05 | Điều phối Course Firing & Prep SLA | Mỗi món ăn có định mức thời gian chế biến Prep SLA. Khi gửi đơn, Course 1 chuyển sang Cooking; các Course tiếp theo ở trạng thái On Hold. Khi khách dùng khoảng 60%–70% Course hiện tại, phục vụ bấm nút Course Firing để kích hoạt bếp nấu Course tiếp theo. | UC-E1, UC-E2, UC-A1 |
| BR-06 | Mức tiền cọc giữ chỗ | Đặt bàn có chọn trước Set Menu: Tiền cọc = 30% × Giá Set Menu × Số khách. Đặt bàn không chọn trước Set Menu (gọi món tại nhà hàng): Tiền cọc = 500.000 VNĐ × Số khách. Khách vãng lai không đặt trước không phải đặt cọc. | UC-U1, UC-U3, UC-E7 |


---

# CHƯƠNG 3: MÔ HÌNH HÓA QUY TRÌNH NGHIỆP VỤ (ACTIVITY DIAGRAMS)


## 3.1 AD-01: Quy trình Đặt bàn trực tuyến & Đặt cọc VNPAY

![AD-01: Đặt bàn trực tuyến & Đặt cọc VNPAY](images/ad01.png)


## 3.2 AD-02: Quy trình Nhân viên Order trực tiếp tại bàn

![AD-02: Phục vụ Order tại bàn](images/ad02.png)


## 3.3 AD-03: Quy trình Kiểm đồ tại quầy Pass & Xác nhận đi món

![AD-03: Xác nhận đi món tại quầy Pass](images/ad03.png)


## 3.4 AD-04: Quy trình Thanh toán, Cấn trừ tiền cọc & Đóng bàn

![AD-04: Thanh toán, Cấn trừ tiền cọc & Đóng bàn](images/ad04.png)


## 3.5 AD-05: Quy trình Hủy đặt bàn & Hoàn tiền cọc VNPAY

![AD-05: Hủy đặt bàn & Hoàn cọc VNPAY](images/ad05.png)


## 3.6 AD-06: Quy trình Đăng nhập & Xác thực nhân viên nội bộ

![AD-06: Đăng nhập nhân viên](images/ad06.png)


## 3.7 AD-07: Quy trình Chuyển bàn / Đổi bàn phục vụ

![AD-07: Chuyển bàn / Đổi bàn phục vụ](images/ad07.png)


## 3.8 AD-08: Quy trình Quản trị & Cấu hình Sơ đồ bàn ăn

![AD-08: Quản trị & Cấu hình Sơ đồ bàn ăn](images/ad08.png)


## 3.9 AD-09: Quy trình Duyệt hoàn cọc thủ công ngoại lệ

![AD-09: Duyệt hoàn cọc thủ công ngoại lệ](images/ad09.png)


## 3.10 AD-10: Quy trình Tự động quét & Giải phóng bàn hết hạn giữ cọc

![AD-10: Tự động quét & Giải phóng bàn hết hạn giữ cọc](images/ad10.png)


## 3.11 AD-11: Quy trình Quản trị Thực đơn & Trạng thái món

![AD-11: Quản trị Thực đơn & Trạng thái món](images/ad11.png)


## 3.12 AD-12: Quy trình Khách hàng đánh giá & Phản hồi dịch vụ

![AD-12: Khách hàng đánh giá & Phản hồi dịch vụ](images/ad12.png)


---

## 3.13 AD-13: Quy trình Yêu cầu phục vụ qua QR Menu

![AD-13: Yêu cầu phục vụ qua QR Menu](images/ad13.png)


## 3.14 AD-14: Quy trình Check-in nhận bàn

![AD-14: Check-in nhận bàn](images/ad14.png)


## 3.15 AD-15: Quy trình Cập nhật Order & Course Firing

![AD-15: Cập nhật Order & Course Firing](images/ad15.png)


## 3.16 AD-16: Quy trình Quản trị Tài khoản nhân viên

![AD-16: Quản trị Tài khoản nhân viên](images/ad16.png)


## 3.17 AD-17: Quy trình Báo cáo Thống kê & Doanh thu

![AD-17: Báo cáo Thống kê & Doanh thu](images/ad17.png)

---

# CHƯƠNG 4: MÔ HÌNH HÓA TƯƠNG TÁC HỆ THỐNG (SEQUENCE DIAGRAMS)


## 4.1 SD-U1: Đặt bàn & Đặt cọc trực tuyến

![SD-U1: Đặt bàn & Đặt cọc trực tuyến](images/sd_u1.png)


## 4.2 SD-U2: Yêu cầu phục vụ thông qua QR menu

![SD-U2: Yêu cầu phục vụ thông qua QR menu](images/sd_u2.png)


## 4.3 SD-U3: Hủy đặt bàn

![SD-U3: Hủy đặt bàn](images/sd_u3.png)


## 4.4 SD-U4: Gửi đánh giá dịch vụ

![SD-U4: Gửi đánh giá dịch vụ](images/sd_u4.png)


## 4.5 SD-E1: Tạo Order

![SD-E1: Tạo Order](images/sd_e1_1.png)


## 4.6 SD-E2: Cập nhật Order


### SD-E2-1: Kích hoạt nấu Course tiếp theo (Fire Course)

![SD-E2-1: Kích hoạt nấu Course tiếp theo](images/sd_e1_2.png)


### SD-E2-2: Thêm món ăn vào Order

![SD-E2-2: Thêm món ăn vào Order](images/sd_e1_3.png)


## 4.7 SD-E3: Xác nhận đi món

![SD-E3: Xác nhận đi món](images/sd_e2.png)


## 4.8 SD-E4: Yêu cầu thanh toán

![SD-E4: Yêu cầu thanh toán](images/sd_e3_1.png)


## 4.9 SD-E5: Đổi bàn

![SD-E5: Đổi bàn](images/sd_e4_1.png)


## 4.10 SD-E6: Check in nhận bàn


### SD-E6-1: Check-in khách đặt trước

![SD-E6-1: Check-in khách đặt trước](images/sd_e6_1.png)


### SD-E6-2: Check-in khách vãng lai

![SD-E6-2: Check-in khách vãng lai](images/sd_e6_2.png)


## 4.11 SD-E7: Thanh toán hóa đơn


### SD-E7-1: Xuất phiếu tạm tính cấn trừ cọc

![SD-E7-1: Xuất phiếu tạm tính cấn trừ cọc](images/sd_e7_1.png)


### SD-E7-2: Thu ngân xác nhận thanh toán & Đóng đơn

![SD-E7-2: Thu ngân xác nhận thanh toán & Đóng đơn](images/sd_e7_2.png)


## 4.12 SD-E8: Đăng nhập & Xác thực

![SD-E8: Đăng nhập & Xác thực](images/sd_e8.png)


## 4.13 SD-A1: Quản trị Danh mục & Thực đơn


### SD-A1-1: Tạo món ăn mới

![SD-A1-1: Tạo món ăn mới](images/sd_a1_1.png)


### SD-A1-2: Chỉnh sửa thông tin món ăn

![SD-A1-2: Chỉnh sửa thông tin món ăn](images/sd_a1_2.png)


### SD-A1-3: Bật / Tắt trạng thái món ăn

![SD-A1-3: Bật / Tắt trạng thái món ăn](images/sd_a1_3.png)


### SD-A1-4: Xóa món ăn khỏi thực đơn

![SD-A1-4: Xóa món ăn khỏi thực đơn](images/sd_a1_4.png)


### SD-A1-5: Tạo Set Menu mới

![SD-A1-5: Tạo Set Menu mới](images/sd_a1_5.png)


### SD-A1-6: Chỉnh sửa Set Menu

![SD-A1-6: Chỉnh sửa Set Menu](images/sd_a1_6.png)


### SD-A1-7: Xóa Set Menu

![SD-A1-7: Xóa Set Menu](images/sd_a1_7.png)


## 4.14 SD-A2: Cấu hình sơ đồ bàn ăn

![SD-A2: Cấu hình sơ đồ bàn ăn](images/sd_a2.png)


## 4.15 SD-A3: Duyệt hoàn cọc thủ công

![SD-A3: Duyệt hoàn cọc thủ công](images/sd_a3.png)


## 4.16 SD-A4: Quản trị Tài khoản


### SD-A4-1: Tạo tài khoản nhân viên

![SD-A4-1: Tạo tài khoản nhân viên](images/sd_a4_1.png)


### SD-A4-2: Chỉnh sửa thông tin tài khoản

![SD-A4-2: Chỉnh sửa thông tin tài khoản](images/sd_a4_2.png)


### SD-A4-3: Đặt lại mật khẩu

![SD-A4-3: Đặt lại mật khẩu](images/sd_a4_3.png)


### SD-A4-4: Khóa / Mở khóa tài khoản nhân viên

![SD-A4-4: Khóa / Mở khóa tài khoản nhân viên](images/sd_a4_4.png)


## 4.17 SD-A5: Báo cáo Thống kê & Doanh thu

![SD-A5: Báo cáo Thống kê & Doanh thu](images/sd_a5.png)


## 4.18 SD-S1: Giải phóng bàn hết hạn cọc

![SD-S1: Giải phóng bàn hết hạn cọc](images/sd_s1.png)


## 4.19 SD-S2: Gửi biểu mẫu đánh giá chất lượng sau phục vụ

![SD-S2: Gửi biểu mẫu đánh giá chất lượng sau phục vụ](images/sd_s2.png)


## 4.20 SD-S3: Gửi thông báo nhắc hẹn đặt bàn

![SD-S3: Gửi thông báo nhắc hẹn đặt bàn](images/sd_s3.png)


## 4.21 SD-S4: Theo dõi & cảnh báo thời gian order

![SD-S4: Theo dõi & cảnh báo thời gian order](images/sd_s4.png)