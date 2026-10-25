# BÁO CÁO ĐẶC TẢ USE CASE HỆ THỐNG VINDINING

**Đề tài:** Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (VinDining)  
**Giai đoạn:** Phase 1 — Phân tích Yêu cầu & Thiết kế Hệ thống  
**Giảng viên hướng dẫn:** ThS. Phạm Hữu Tùng  
**Sinh viên thực hiện:**
- Nguyễn Mạnh Quyền
- Đặng Quốc Khánh
- Nguyễn Hoàng Đạt

---

## 1. TỔNG QUAN TÁC NHÂN & MA TRẬN PHÂN QUYỀN (STAKEHOLDERS & RBAC)

### 1.1 Danh mục Tác nhân Hệ thống

| Tác nhân (Actor) | Phân loại | Thiết bị / Nền tảng | Phạm vi quyền hạn |
| :--- | :--- | :--- | :--- |
| **Khách hàng** *(Guest)* | Tác nhân chính | Mobile Web | Xem sơ đồ bàn, đặt bàn và thanh toán cọc VNPAY; quét QR xem thực đơn, gửi yêu cầu phục vụ tại bàn; gửi đánh giá dịch vụ. |
| **Nhân viên Phục vụ** *(Waitstaff)* | Tác nhân chính | Điện thoại / Máy tính bảng | Đón khách, check-in, đổi bàn; tạo order, điều phối Course Firing xuống Bếp; nhận món từ quầy Pass ra bàn; xuất hóa đơn tạm tính cấn trừ cọc. |
| **Nhân viên Điều phối** *(Expediter)* | Tác nhân chính | Máy tính bảng quầy Pass | Tiếp nhận món từ bếp, kiểm tra tiêu chuẩn và bấm xác nhận hoàn thành món để phục vụ mang ra bàn; yêu cầu làm lại nếu lỗi. |
| **Quản lý & Quản trị viên** *(Manager & Admin)* | Tác nhân chính | Web Admin (PC/Laptop) | Quản trị thực đơn, giá bán, Prep SLA; cấu hình sơ đồ bàn; xem báo cáo doanh thu; duyệt hoàn cọc ngoại lệ; quản trị tài khoản, phân quyền và nhật ký kiểm toán. |
| **Cổng thanh toán** *(VNPAY)* | Tác nhân phụ | Payment Server | Xử lý thanh toán cọc qua QR / thẻ ngân hàng; gửi kết quả giao dịch; xử lý lệnh hoàn cọc. |
| **Hệ thống tự động** | Tác nhân phụ | Tiến trình chạy ngầm | Định kỳ quét và tự động hủy đặt bàn, giải phóng bàn khi quá hạn cọc 17 phút; đồng bộ sơ đồ sàn thời gian thực. |

### 1.2 Ma trận Phân quyền Chức năng (RBAC Matrix)

| Phân hệ chức năng | Nghiệp vụ chi tiết | Khách hàng | Phục vụ | Điều phối | Quản lý & Quản trị |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Tài khoản & Phân quyền** | Đăng nhập hệ thống nội bộ | ✗ | ✓ | ✓ | ✓ |
| | Quản lý thông tin hồ sơ cá nhân | ✗ | ✓ | ✓ | ✓ |
| | Khởi tạo tài khoản & Phân quyền nhân viên | ✗ | ✗ | ✗ | ✓ |
| **Đặt bàn & Đặt cọc** | Tra cứu sơ đồ bàn & Đặt chỗ trực tuyến | ✓ | ✓ | ✗ | ✓ |
| | Thanh toán khoản tiền cọc giữ chỗ qua VNPAY | ✓ | ✓ | ✗ | ✓ |
| | Hủy đặt bàn trực tuyến trước giờ hẹn từ 4 tiếng | ✓ | ✓ | ✗ | ✓ |
| | Phê duyệt lệnh hoàn cọc thủ công ngoại lệ | ✗ | ✗ | ✗ | ✓ |
| **Sơ đồ bàn & Hiển thị** | Theo dõi sơ đồ bàn trực quan thời gian thực | ✗ | ✓ | ✓ | ✓ |
| | Check-in khách vào bàn ăn thực tế | ✗ | ✓ | ✗ | ✓ |
| | Đổi bàn / Chuyển bàn phục vụ cho khách | ✗ | ✓ | ✗ | ✓ |
| | Cấu hình sơ đồ mặt bằng bàn ăn trực quan | ✗ | ✗ | ✗ | ✓ |
| | Chuyển trạng thái bàn sang sẵn sàng sau khi dọn | ✗ | ✓ | ✗ | ✓ |
| **Gọi món & Phục vụ** | Xem thực đơn điện tử QR-Menu & Gửi yêu cầu | ✓ | ✓ | ✓ | ✓ |
| | Tạo đơn gọi món & Điều phối KDS Bếp theo Course | ✗ | ✓ | ✗ | ✓ |
| | Kích hoạt nấu đợt món tiếp theo *(Course Firing)* | ✗ | ✓ | ✗ | ✓ |
| | Kiểm đồ & Xác nhận ra món tại quầy Pass *(Served)* | ✗ | ✗ | ✓ | ✓ |
| **Hóa đơn & Doanh thu** | Gửi yêu cầu tính tiền tại bàn qua QR-Menu | ✓ | ✓ | ✗ | ✓ |
| | Xuất hóa đơn tạm tính tự động cấn trừ tiền cọc | ✗ | ✓ | ✗ | ✓ |
| | Xác nhận hoàn tất thanh toán & Đóng bàn | ✗ | ✓ | ✗ | ✓ |
| | Xem báo cáo doanh thu & Thống kê hiệu suất | ✗ | ✗ | ✗ | ✓ |
| **Đánh giá dịch vụ** | Khách gửi chấm điểm và nhận xét sau bữa ăn | ✓ | ✗ | ✗ | ✗ |

---

## 2. DANH MỤC 19 USE CASE HỆ THỐNG

| STT | Mã Use Case | Tên Use Case | Phân hệ | Mức độ ưu tiên |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **UC-U1** | Đặt bàn trực tuyến & Đặt cọc giữ chỗ | Khách hàng *(Guest)* | Bắt buộc *(Must Have)* |
| 2 | **UC-U2** | Yêu cầu phục vụ thông qua QR menu | Khách hàng *(Guest)* | Bắt buộc *(Must Have)* |
| 3 | **UC-U3** | Hủy đặt bàn trực tuyến & Hoàn cọc tự động | Khách hàng *(Guest)* | Bắt buộc *(Must Have)* |
| 4 | **UC-U4** | Gửi đánh giá và phản hồi chất lượng dịch vụ | Khách hàng *(Guest)* | Bổ sung *(Could Have)* |
| 5 | **UC-E1** | Quản lý Order & Điều phối lượt món (Course Firing & Priority) | Nhân viên Nội bộ *(Staff)* | Bắt buộc *(Must Have)* |
| 6 | **UC-E2** | Kiểm đồ tại quầy Pass, Phục vụ món & Pacing Course | Nhân viên Nội bộ *(Staff)* | Bắt buộc *(Must Have)* |
| 7 | **UC-E3** | Thanh toán, Cấn trừ tiền cọc & Đóng bàn | Nhân viên Nội bộ *(Staff)* | Bắt buộc *(Must Have)* |
| 8 | **UC-E4** | Đổi bàn / Chuyển bàn phục vụ | Nhân viên Nội bộ *(Staff)* | Quan trọng *(Should Have)* |
| 9 | **UC-E5** | Đăng nhập & Xác thực hệ thống nội bộ | Nhân viên Nội bộ *(Staff)* | Bắt buộc *(Must Have)* |
| 10 | **UC-E6** | Check-in nhận bàn & Hoàn tất dọn bàn | Nhân viên Nội bộ *(Staff)* | Bắt buộc *(Must Have)* |
| 11 | **UC-A1** | Quản trị Danh mục, Thực đơn & Cấu hình Prep SLA món ăn | Quản lý & Quản trị *(Admin)* | Quan trọng *(Should Have)* |
| 12 | **UC-A2** | Quản trị & Cấu hình Sơ đồ bàn ăn | Quản lý & Quản trị *(Admin)* | Quan trọng *(Should Have)* |
| 13 | **UC-A3** | Duyệt hoàn tiền cọc thủ công ngoại lệ | Quản lý & Quản trị *(Admin)* | Quan trọng *(Should Have)* |
| 14 | **UC-A4** | Quản trị Tài khoản & Phân quyền nhân viên | Quản lý & Quản trị *(Admin)* | Quan trọng *(Should Have)* |
| 15 | **UC-A5** | Xem Báo cáo Thống kê & Dashboard doanh thu | Quản lý & Quản trị *(Admin)* | Bổ sung *(Could Have)* |
| 16 | **UC-S1** | Tự động giải phóng bàn hết hạn giữ cọc | Hệ thống Tự động *(System)* | Bắt buộc *(Must Have)* |
| 17 | **UC-S2** | Tự động gửi thông báo nhắc lịch hẹn | Hệ thống Tự động *(System)* | Quan trọng *(Should Have)* |
| 18 | **UC-S3** | Tự động kiểm soát & cảnh báo trễ SLA chế biến món ăn | Hệ thống Tự động *(System)* | Bắt buộc *(Must Have)* |
| 19 | **UC-S4** | Tự động gửi email cảm ơn & link khảo sát CSAT sau bữa ăn | Hệ thống Tự động *(System)* | Bổ sung *(Could Have)* |

---

## 3. ĐẶC TẢ CHI TIẾT 19 USE CASE HỆ THỐNG

### 3.1 Phân hệ Khách hàng (Guest Subsystem)

#### Đặc tả UC-U1: Đặt bàn trực tuyến & Đặt cọc giữ chỗ

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-U1 |
| **Tên Use Case** | Đặt bàn trực tuyến & Đặt cọc giữ chỗ |
| **Tác nhân** | Khách hàng (Chính), Cổng thanh toán VNPAY (Phụ), Hệ thống tự động (Phụ) |
| **Mức độ ưu tiên** | Bắt buộc (Must Have) |
| **Mối quan hệ** | Tương tác VNPAY thanh toán cọc; kết hợp UC-S1 tự động giải phóng bàn quá hạn |
| **Mục tiêu** | Khách chọn bàn trên sơ đồ và thanh toán cọc qua VNPAY để xác nhận giữ chỗ. |
| **Điều kiện tiên quyết** | Sơ đồ bàn đang mở nhận khách. |
| **Điều kiện kết thúc** | Bàn chuyển sang Reserved, hệ thống ghi nhận cọc và gửi BookingCode cho khách. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng chọn ngày, ca phục vụ, số khách và khu vực trên website.
2. Hệ thống hiển thị các bàn trống theo thời gian thực trên sơ đồ mặt bằng.
3. Khách hàng chọn vị trí bàn, nhập thông tin liên hệ và bấm xác nhận đặt cọc.
4. Hệ thống khóa giữ bàn tạm thời 17 phút và chuyển hướng sang cổng thanh toán VNPAY.
5. Khách hàng quét mã VietQR hoặc nhập thẻ ngân hàng để thanh toán cọc trong hạn 15 phút.
6. Cổng thanh toán VNPAY gửi phản hồi xác nhận giao dịch thành công về hệ thống.
7. Hệ thống chuyển bàn sang Reserved, sinh BookingCode và gửi thông báo xác nhận qua SMS/Email.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 2a. Hết bàn: Hệ thống gợi ý khung giờ hoặc khu vực khác.
* 3a. Sai thông tin liên hệ: Hệ thống báo lỗi tại ô nhập liệu.
* 5a. Lỗi thanh toán: Hệ thống duy trì khóa bàn trong hạn 17 phút để khách thử lại.
* 5b. Quá 17 phút: Hệ thống tự động hủy phiên và giải phóng bàn về Available.
* 6a. Phản hồi thanh toán trễ (>17 phút) khi bàn đã có khách khác đặt: Hệ thống chuyển trạng thái ngoại lệ và hoàn 100% cọc cho khách.
* 7a. Lỗi gửi SMS/Email: Đẩy vào hàng đợi gửi bù và hiển thị BookingCode trực tiếp trên màn hình.

---

#### Đặc tả UC-U2: Yêu cầu phục vụ thông qua QR menu

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-U2 |
| **Tên Use Case** | Yêu cầu phục vụ thông qua QR menu |
| **Tác nhân** | Khách hàng (Chính), Nhân viên Phục vụ (Phụ) |
| **Mức độ ưu tiên** | Bắt buộc (Must Have) |
| **Mối quan hệ** | Độc lập; gửi thông báo tức thời tới thiết bị của nhân viên phục vụ |
| **Mục tiêu** | Khách quét mã QR tại bàn để xem thực đơn và gửi yêu cầu phục vụ (gọi nhân viên, thêm nước, đổi dụng cụ, yêu cầu thanh toán). |
| **Điều kiện tiên quyết** | Khách ngồi tại bàn đã check-in. |
| **Điều kiện kết thúc** | Yêu cầu được ghi nhận vào hệ thống, nhân viên nhận thông báo trên thiết bị và xác nhận hoàn tất tại bàn. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng quét mã QR tại bàn để mở QR-Menu.
2. Hệ thống hiển thị thực đơn và danh mục yêu cầu phục vụ của bàn.
3. Khách hàng chọn dịch vụ (gọi phục vụ, châm nước, đổi dụng cụ, yêu cầu thanh toán) và bấm gửi.
4. Hệ thống ghi nhận yêu cầu ở trạng thái Chờ xử lý (Pending).
5. Hệ thống gửi cảnh báo thời gian thực đến thiết bị của nhân viên phục vụ phụ trách bàn.
6. Hệ thống phản hồi xác nhận đang xử lý trên màn hình khách.
7. Nhân viên phục vụ đến bàn hỗ trợ và bấm hoàn tất trên thiết bị.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 1a. Bàn chưa check-in hoặc ngoài ca: Hệ thống báo bàn chưa sẵn sàng.
* 3a. Gửi lặp lại dưới 60 giây: Hệ thống cảnh báo yêu cầu đang xử lý để tránh trùng.
* 5a. Mất kết nối mạng: Hệ thống tạm lưu yêu cầu và tự động đồng bộ lại ngay khi có kết nối.

---

#### Đặc tả UC-U3: Hủy đặt bàn trực tuyến & Hoàn cọc tự động

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-U3 |
| **Tên Use Case** | Hủy đặt bàn trực tuyến & Hoàn cọc tự động |
| **Tác nhân** | Khách hàng (Chính), VNPAY (Phụ) |
| **Mức độ ưu tiên** | Bắt buộc (Must Have) |
| **Mối quan hệ** | Tương tác cổng VNPAY để hoàn tiền |
| **Mục tiêu** | Khách chủ động hủy lịch đặt bàn; hệ thống đối chiếu thời gian để hoàn cọc hoặc phạt cọc tự động. |
| **Điều kiện tiên quyết** | Lịch đặt bàn đang ở trạng thái Reserved hợp lệ. |
| **Điều kiện kết thúc** | Lịch chuyển sang Cancelled, bàn về Available, giao dịch hoàn tiền hoặc giữ cọc được ghi nhận. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng tra cứu đặt bàn bằng Số điện thoại và mã BookingCode trên website.
2. Hệ thống hiển thị chi tiết lịch hẹn kèm nút Hủy đặt bàn.
3. Khách hàng bấm Hủy đặt bàn và xác nhận điều khoản hoàn hủy.
4. Hệ thống kiểm tra khoảng cách thời gian từ lúc hủy đến giờ hẹn dùng bữa.
5. Hủy trước giờ hẹn từ 4 tiếng: Hệ thống gửi lệnh sang cổng VNPAY hoàn 100% tiền cọc cho khách.
6. Hệ thống chuyển đặt bàn sang Cancelled và giải phóng bàn về Available.
7. Hệ thống gửi thông báo xác nhận hủy và chứng từ hoàn cọc qua SMS/Email.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 1a. Sai mã BookingCode: Hệ thống báo không tìm thấy lịch hẹn.
* 5a. Hủy dưới 4 tiếng: Hệ thống cảnh báo phạt 100% cọc; khách xác nhận tiếp tục thì hủy bàn, giữ lại cọc và giải phóng bàn về Available.

---

#### Đặc tả UC-U4: Gửi đánh giá và phản hồi chất lượng dịch vụ

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-U4 |
| **Tên Use Case** | Gửi đánh giá và phản hồi chất lượng dịch vụ |
| **Tác nhân** | Khách hàng (Chính), Quản lý & Quản trị viên (Phụ) |
| **Mức độ ưu tiên** | Bổ sung (Could Have) |
| **Mối quan hệ** | Độc lập |
| **Mục tiêu** | Thu thập phản hồi chấm điểm của khách sau bữa ăn để cải tiến chất lượng dịch vụ. |
| **Điều kiện tiên quyết** | Khách đã dùng bữa và thanh toán xong. |
| **Điều kiện kết thúc** | Đánh giá được lưu vào hệ thống và cập nhật chỉ số CSAT trên cổng quản trị. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng quét mã QR trên hóa đơn hoặc mở liên kết khảo sát trong email cảm ơn.
2. Khách hàng chấm điểm 1–5 sao theo tiêu chí (món ăn, không gian, thái độ phục vụ).
3. Khách hàng nhập nhận xét chi tiết (nếu có) và bấm gửi đánh giá.
4. Hệ thống lưu đánh giá và tự động cập nhật chỉ số CSAT lên cổng quản trị.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 1a. Liên kết quá 48 giờ: Hệ thống thông báo phiên đánh giá đã kết thúc.

---

### 3.2 Phân hệ Nhân viên Nội bộ (Staff Subsystem)

#### Đặc tả UC-E1: Quản lý Order & Điều phối lượt món (Course Firing & Priority)

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-E1 |
| **Tên Use Case** | Quản lý Order & Điều phối lượt món (Course Firing & Priority) |
| **Tác nhân** | Nhân viên Phục vụ (Chính), KDS Bếp (Phụ) |
| **Mức độ ưu tiên** | Bắt buộc (Must Have) |
| **Mối quan hệ** | Yêu cầu đăng nhập UC-E5; tương tác thời gian thực với KDS Bếp |
| **Mục tiêu** | Ghi nhận đơn món theo từng Course (Khai vị, Món chính, Tráng miệng), gắn nhãn ưu tiên và bấm Course Firing để kích hoạt nấu lượt tiếp theo. |
| **Điều kiện tiên quyết** | Bàn ăn ở trạng thái Occupied. |
| **Điều kiện kết thúc** | Đơn hàng lưu Processing; Course 1 chuyển sang Cooking trên KDS Bếp kèm Prep SLA; các Course tiếp theo ở trạng thái On Hold. |

##### Luồng sự kiện chính (Main Flow)
1. Nhân viên phục vụ mở ứng dụng trên thiết bị, chọn bàn và thêm món theo từng Course (Khai vị, Món chính, Tráng miệng).
2. Nhân viên gắn nhãn ưu tiên (VIP, Rush, Dị ứng) và ghi chú chế biến nếu có.
3. Nhân viên bấm Gửi Bếp.
4. Hệ thống lưu đơn hàng (Processing), chuyển Course 1 sang Cooking và đặt các Course sau ở trạng thái On Hold.
5. Hệ thống hiển thị vé món Course 1 lên KDS Bếp kèm đếm ngược Prep SLA.
6. Khi khách dùng được 60%–70% Course hiện tại, nhân viên bấm Course Firing trên thiết bị để chuyển Course tiếp theo từ On Hold sang Cooking.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 1a. Gọi thêm món giữa bữa: Nhân viên thêm món vào đơn hiện hành và bấm Cập nhật Order để đẩy bổ sung xuống Bếp.
* 6a. Khách yêu cầu hoãn lên món: Nhân viên bấm Hold Course trên thiết bị để tạm dừng kích hoạt.

---

#### Đặc tả UC-E2: Kiểm đồ tại quầy Pass, Phục vụ món & Pacing Course

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-E2 |
| **Tên Use Case** | Kiểm đồ tại quầy Pass, Phục vụ món & Pacing Course |
| **Tác nhân** | Nhân viên Điều phối (Chính), Nhân viên Phục vụ (Phụ) |
| **Mức độ ưu tiên** | Bắt buộc (Must Have) |
| **Mối quan hệ** | Yêu cầu đăng nhập UC-E5; tương tác quầy Pass và KDS Bếp |
| **Mục tiêu** | Điều phối viên kiểm tra chất lượng món tại quầy Pass, bấm xác nhận hoàn thành (Served) để phục vụ mang ra bàn. |
| **Điều kiện tiên quyết** | Món ăn trong Course đã chế biến xong tại quầy Pass. |
| **Điều kiện kết thúc** | Món chuyển sang Served; thông báo gửi đến thiết bị của nhân viên phục vụ để bưng đồ ra bàn. |

##### Luồng sự kiện chính (Main Flow)
1. Bếp đặt món hoàn thiện lên quầy Pass.
2. Nhân viên Điều phối đối chiếu hình thức và tiêu chuẩn món ăn với màn hình quầy Pass.
3. Nhân viên Điều phối bấm Xác nhận hoàn thành (Served).
4. Hệ thống chuyển món sang Served, so khớp thời gian Prep SLA thực tế và gửi thông báo thời gian thực tới thiết bị của nhân viên phục vụ.
5. Nhân viên phục vụ nhận đĩa món từ quầy Pass và mang ra bàn cho khách.
6. Nhân viên phục vụ theo dõi tiến độ bàn và bấm Course Firing khi đến thời điểm phù hợp.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 2a. Món không đạt chuẩn: Điều phối bấm Từ chối (Reject); hệ thống đẩy vé món với nhãn Remake Priority lên đầu KDS Bếp để làm lại ngay.
* 6a. Khách cần ra món gấp: Nhân viên gạt nhãn Rush Priority khi bấm Course Firing.

---

#### Đặc tả UC-E3: Thanh toán, Cấn trừ tiền cọc & Đóng bàn

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-E3 |
| **Tên Use Case** | Thanh toán, Cấn trừ tiền cọc & Đóng bàn |
| **Tác nhân** | Nhân viên Phục vụ (Chính), Khách hàng (Chính) |
| **Mức độ ưu tiên** | Bắt buộc (Must Have) |
| **Mối quan hệ** | Yêu cầu đăng nhập UC-E5 |
| **Mục tiêu** | Tính tổng chi phí bữa ăn, tự động cấn trừ 100% tiền cọc VNPAY, xuất hóa đơn tạm tính và đóng bàn. |
| **Điều kiện tiên quyết** | Bàn ở trạng thái Occupied và tất cả món đã Served. |
| **Điều kiện kết thúc** | Hóa đơn Paid, bàn chuyển sang Cleaning rồi về Available. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng yêu cầu thanh toán trực tiếp hoặc qua QR-Menu.
2. Nhân viên phục vụ mở giao diện thanh toán bàn trên thiết bị.
3. Hệ thống tính: Subtotal món đã phục vụ + 5% Phí phục vụ + 10% VAT; khấu trừ 100% tiền cọc để ra số tiền còn phải trả.
4. Hệ thống in phiếu tạm tính; nhân viên mang ra bàn cho khách đối chiếu.
5. Khách hàng thanh toán phần chênh lệch bằng tiền mặt, thẻ ngân hàng hoặc quét VietQR trên phiếu.
6. Nhân viên bấm Xác nhận thanh toán trên thiết bị.
7. Hệ thống chuyển hóa đơn sang Paid, lưu dữ liệu và chuyển bàn sang Cleaning.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Tổng chi phí nhỏ hơn tiền cọc: Áp dụng nguyên tắc tiền cọc là mức chi tiêu tối thiểu không hoàn lại; số tiền phải trả thêm là 0 VNĐ.

---

#### Đặc tả UC-E4: Đổi bàn / Chuyển bàn phục vụ

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-E4 |
| **Tên Use Case** | Đổi bàn / Chuyển bàn phục vụ |
| **Tác nhân** | Nhân viên Phục vụ (Chính), Quản lý & Quản trị viên (Phụ) |
| **Mức độ ưu tiên** | Quan trọng (Should Have) |
| **Mối quan hệ** | Yêu cầu đăng nhập UC-E5 |
| **Mục tiêu** | Chuyển đơn hàng từ bàn hiện tại sang bàn trống khác khi khách có nhu cầu đổi chỗ hoặc điều phối ca sau. |
| **Điều kiện tiên quyết** | Bàn cũ Occupied; bàn mới Available. |
| **Điều kiện kết thúc** | Đơn hàng chuyển sang bàn mới; bàn cũ chuyển Cleaning; bàn mới Occupied. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng yêu cầu đổi bàn hoặc Quản lý điều phối chuyển chỗ.
2. Nhân viên phục vụ chọn chức năng Đổi bàn trên thiết bị.
3. Hệ thống hiển thị các bàn đang Available trong cùng ca.
4. Nhân viên chọn bàn đích và bấm Xác nhận chuyển.
5. Hệ thống chuyển toàn bộ đơn hàng, món ăn và tiền cọc sang mã bàn mới.
6. Bàn cũ chuyển Cleaning, bàn mới chuyển Occupied; hệ thống đồng bộ sơ đồ sàn tức thời.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 4a. Ghép bàn cho nhóm đông: Nhân viên dùng chức năng Ghép bàn để liên kết các bàn vật lý và hợp nhất hóa đơn.
* 4b. Bàn đích bị chọn trùng: Hệ thống cảnh báo bàn không còn trống và yêu cầu chọn vị trí khác.

---

#### Đặc tả UC-E5: Đăng nhập & Xác thực hệ thống nội bộ

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-E5 |
| **Tên Use Case** | Đăng nhập & Xác thực hệ thống nội bộ |
| **Tác nhân** | Nhân viên Phục vụ, Nhân viên Điều phối, Quản lý & Quản trị viên |
| **Mức độ ưu tiên** | Bắt buộc (Must Have) |
| **Mối quan hệ** | Use Case cơ sở cho toàn bộ nghiệp vụ nội bộ |
| **Mục tiêu** | Xác thực danh tính và phân quyền truy cập theo vai trò. |
| **Điều kiện tiên quyết** | Tài khoản đã được kích hoạt trên hệ thống. |
| **Điều kiện kết thúc** | Xác thực thành công và điều hướng vào giao diện phù hợp với vai trò được phân quyền. |

##### Luồng sự kiện chính (Main Flow)
1. Nhân viên truy cập trang Đăng nhập trên trình duyệt hoặc thiết bị.
2. Nhân viên nhập Tên đăng nhập và Mật khẩu.
3. Nhân viên bấm Đăng nhập.
4. Hệ thống kiểm tra và xác thực thông tin tài khoản.
5. Hệ thống phân quyền truy cập theo vai trò và điều hướng đến màn hình làm việc tương ứng (Thiết bị phục vụ, Quầy Pass, Trang quản trị).

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 4a. Sai thông tin: Hệ thống báo lỗi và yêu cầu nhập lại.
* 4b. Sai mật khẩu quá 5 lần: Hệ thống tạm khóa tài khoản 15 phút.
* 5a. Phiên làm việc hết hạn: Hệ thống yêu cầu đăng nhập lại để tiếp tục thao tác.

---

#### Đặc tả UC-E6: Check-in nhận bàn & Hoàn tất dọn bàn

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-E6 |
| **Tên Use Case** | Check-in nhận bàn & Hoàn tất dọn bàn |
| **Tác nhân** | Nhân viên Phục vụ (Chính), Khách hàng (Phụ) |
| **Mức độ ưu tiên** | Bắt buộc (Must Have) |
| **Mối quan hệ** | Yêu cầu đăng nhập UC-E5; ngắt tiến trình tự động giải phóng bàn UC-S1 |
| **Mục tiêu** | Xác nhận khách đã đến nhận bàn đúng giờ để chuyển bàn sang Occupied; xác nhận hoàn tất dọn bàn (Cleaning -> Available). |
| **Điều kiện tiên quyết** | Bàn ở trạng thái Reserved hoặc Cleaning. |
| **Điều kiện kết thúc** | Bàn chuyển sang Occupied (khi khách đến) hoặc Available (khi dọn xong); sơ đồ bàn được cập nhật thời gian thực. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng đến nhà hàng và cung cấp mã BookingCode hoặc Số điện thoại.
2. Nhân viên phục vụ tra cứu trên thiết bị, đối chiếu thông tin đặt cọc.
3. Nhân viên bấm Check-in nhận bàn trên thiết bị.
4. Hệ thống cập nhật bàn sang Occupied và đặt bàn sang Seated.
5. Hệ thống cập nhật màu sắc sơ đồ bàn theo thời gian thực (ngắt tiến trình hủy tự động của UC-S1).
6. Nhân viên dẫn khách vào bàn và kích hoạt phiên gọi món.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 2a. Khách vãng lai (Walk-in): Nhân viên chọn bàn Available và bấm Check-in khách vãng lai để chuyển trực tiếp sang Occupied.
* 3a. Hoàn tất dọn bàn: Sau khi dọn sạch bàn Cleaning, nhân viên bấm Hoàn tất dọn bàn trên thiết bị; bàn chuyển về Available sẵn sàng đón lượt tiếp theo.

---

### 3.3 Phân hệ Quản lý & Quản trị (Manager & Administrator Subsystem)

#### Đặc tả UC-A1: Quản trị Danh mục, Thực đơn & Cấu hình Prep SLA món ăn

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-A1 |
| **Tên Use Case** | Quản trị Danh mục, Thực đơn & Cấu hình Prep SLA món ăn |
| **Tác nhân** | Quản lý & Quản trị viên (Chính) |
| **Mức độ ưu tiên** | Quan trọng (Should Have) |
| **Mối quan hệ** | Yêu cầu đăng nhập UC-E5 |
| **Mục tiêu** | Thiết lập danh mục món ăn, đơn giá, nhóm Course mặc định, định mức thời gian chế biến (Prep SLA) và trạng thái còn/hết món. |
| **Điều kiện tiên quyết** | Đã đăng nhập tài khoản Quản lý & Quản trị viên. |
| **Điều kiện kết thúc** | Dữ liệu thực đơn và định mức SLA được lưu trữ, đồng bộ tức thời tới QR-Menu, thiết bị phục vụ và KDS Bếp. |

##### Luồng sự kiện chính (Main Flow)
1. Quản lý & Quản trị viên vào mục Quản lý thực đơn trên trang quản trị.
2. Hệ thống hiển thị danh sách món theo danh mục và trạm bếp.
3. Quản lý chọn Thêm món mới hoặc chọn món hiện có để Chỉnh sửa.
4. Quản lý nhập thông tin: Tên món, đơn giá, hình ảnh, nhóm Course (Khai vị/Chính/Tráng miệng), trạm bếp và Prep SLA (phút).
5. Quản lý bấm Lưu thay đổi.
6. Hệ thống lưu thông tin và đồng bộ ngay tới QR-Menu, thiết bị phục vụ và KDS Bếp.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 6a. Hết món đột xuất: Quản lý gạt công tắc Tạm hết hàng (Out of Stock); hệ thống làm mờ món trên QR-Menu và khóa chọn món trên thiết bị của nhân viên.

---

#### Đặc tả UC-A2: Quản trị & Cấu hình Sơ đồ bàn ăn

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-A2 |
| **Tên Use Case** | Quản trị & Cấu hình Sơ đồ bàn ăn |
| **Tác nhân** | Quản lý & Quản trị viên (Chính) |
| **Mức độ ưu tiên** | Quan trọng (Should Have) |
| **Mối quan hệ** | Yêu cầu đăng nhập UC-E5 |
| **Mục tiêu** | Thiết lập bố cục bàn ăn trực quan, điều chỉnh vị trí, sức chứa và phân khu. |
| **Điều kiện tiên quyết** | Đã đăng nhập tài khoản Quản lý & Quản trị viên. |
| **Điều kiện kết thúc** | Sơ đồ mặt bằng được lưu và đồng bộ tức thời tới thiết bị của nhân viên. |

##### Luồng sự kiện chính (Main Flow)
1. Quản lý & Quản trị viên mở Quản lý sơ đồ bàn trên trang quản trị.
2. Hệ thống hiển thị giao diện thiết kế mặt bằng trực quan.
3. Quản lý kéo thả vị trí bàn, chỉnh sửa tên bàn, sức chứa và phân khu (Sảnh, VIP, Ban công).
4. Quản lý gán mã QR định danh bàn tương ứng.
5. Quản lý bấm Lưu cấu hình.
6. Hệ thống lưu cấu hình và cập nhật sơ đồ sàn mới tới thiết bị của nhân viên.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Trùng mã bàn hoặc vượt sức chứa: Hệ thống báo lỗi và yêu cầu điều chỉnh lại.

---

#### Đặc tả UC-A3: Duyệt hoàn tiền cọc thủ công ngoại lệ

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-A3 |
| **Tên Use Case** | Duyệt hoàn tiền cọc thủ công ngoại lệ |
| **Tác nhân** | Quản lý & Quản trị viên (Chính), VNPAY (Phụ) |
| **Mức độ ưu tiên** | Quan trọng (Should Have) |
| **Mối quan hệ** | Yêu cầu đăng nhập UC-E5; tương tác cổng VNPAY |
| **Mục tiêu** | Cho phép quản lý hoàn cọc cho khách trong tình huống ngoại lệ hoặc sự cố bất khả kháng. |
| **Điều kiện tiên quyết** | Lịch đặt bàn bị phạt cọc do hủy cận giờ (< 4 tiếng) hoặc có khiếu nại chính đáng. |
| **Điều kiện kết thúc** | Tiền cọc được hoàn qua VNPAY; hệ thống ghi nhật ký kiểm toán lưu vết người phê duyệt. |

##### Luồng sự kiện chính (Main Flow)
1. Quản lý & Quản trị viên tra cứu mã BookingCode trên trang quản trị.
2. Hệ thống hiển thị chi tiết giao dịch cọc, thời gian hủy và lý do chưa hoàn tự động.
3. Quản lý chọn Hoàn cọc ngoại lệ (Override Refund).
4. Quản lý nhập lý do giải trình và bấm Xác nhận.
5. Hệ thống gửi lệnh sang cổng VNPAY để hoàn tiền cho khách.
6. Hệ thống cập nhật trạng thái cọc sang Đã hoàn ngoại lệ và ghi nhật ký kiểm toán.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 5a. Lỗi kết nối cổng thanh toán: Hệ thống chuyển giao dịch sang Chờ hoàn tiền, tự động thử lại và gửi cảnh báo tới Quản lý.

---

#### Đặc tả UC-A4: Quản trị Tài khoản & Phân quyền nhân viên

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-A4 |
| **Tên Use Case** | Quản trị Tài khoản & Phân quyền nhân viên |
| **Tác nhân** | Quản lý & Quản trị viên (Chính) |
| **Mức độ ưu tiên** | Quan trọng (Should Have) |
| **Mối quan hệ** | Yêu cầu đăng nhập UC-E5 |
| **Mục tiêu** | Quản lý danh sách nhân sự, tạo tài khoản, phân quyền vai trò (Phục vụ, Điều phối, Quản lý & Quản trị) và khóa tài khoản khi nghỉ việc. |
| **Điều kiện tiên quyết** | Đăng nhập tài khoản Quản lý & Quản trị viên. |
| **Điều kiện kết thúc** | Tài khoản và quyền hạn được cập nhật có hiệu lực ngay lập tức. |

##### Luồng sự kiện chính (Main Flow)
1. Quản lý & Quản trị viên vào Quản lý nhân sự trên trang quản trị.
2. Hệ thống hiển thị danh sách nhân sự và vai trò tương ứng.
3. Quản lý chọn Tạo tài khoản mới hoặc chọn tài khoản cần sửa.
4. Quản lý nhập thông tin nhân viên và gán vai trò quyền hạn.
5. Quản lý bấm Lưu tài khoản.
6. Hệ thống lưu thông tin tài khoản và gửi email kích hoạt kèm mật khẩu tạm thời.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Khóa tài khoản nhân viên nghỉ việc: Quản lý bấm Khóa tài khoản; hệ thống lập tức thu hồi quyền truy cập và hủy phiên đăng nhập trên mọi thiết bị.

---

#### Đặc tả UC-A5: Xem Báo cáo Thống kê & Dashboard doanh thu

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-A5 |
| **Tên Use Case** | Xem Báo cáo Thống kê & Dashboard doanh thu |
| **Tác nhân** | Quản lý & Quản trị viên (Chính) |
| **Mức độ ưu tiên** | Bổ sung (Could Have) |
| **Mối quan hệ** | Yêu cầu đăng nhập UC-E5 |
| **Mục tiêu** | Tổng hợp trực quan doanh thu, tỷ lệ lấp đầy bàn, tỷ lệ hủy cọc và món ăn bán chạy theo thời gian thực. |
| **Điều kiện tiên quyết** | Đăng nhập tài khoản Quản lý & Quản trị viên. |
| **Điều kiện kết thúc** | Biểu đồ và bảng số liệu hiển thị trực quan; hỗ trợ xuất tệp báo cáo. |

##### Luồng sự kiện chính (Main Flow)
1. Quản lý & Quản trị viên vào Báo cáo thống kê trên trang quản trị.
2. Quản lý chọn khoảng thời gian cần xem (Ngày, Tuần, Tháng hoặc Tùy chỉnh).
3. Hệ thống tổng hợp dữ liệu từ Hóa đơn, Đặt bàn và Đơn hàng.
4. Hệ thống hiển thị biểu đồ doanh thu, món bán chạy, tỷ lệ sử dụng bàn và chỉ số vận hành.
5. Quản lý có thể bấm Xuất báo cáo (Excel/PDF) để tải tệp chi tiết.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Không có dữ liệu trong khoảng thời gian: Hệ thống thông báo không có dữ liệu và giữ nguyên mẫu biểu đồ mặc định.

---

### 3.4 Phân hệ Hệ thống Tự động (Automated Background System)

#### Đặc tả UC-S1: Tự động giải phóng bàn hết hạn giữ cọc

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-S1 |
| **Tên Use Case** | Tự động giải phóng bàn hết hạn giữ cọc |
| **Tác nhân** | Hệ thống tự động (Chính) |
| **Mức độ ưu tiên** | Bắt buộc (Must Have) |
| **Mối quan hệ** | Tự động kích hoạt khi UC-U1 quá hạn thanh toán |
| **Mục tiêu** | Tiến trình ngầm quét mỗi 60 giây để tự động hủy các phiên đặt bàn quá hạn 17 phút chưa cọc, giải phóng bàn về Available và đồng bộ sơ đồ bàn. |
| **Điều kiện tiên quyết** | Tồn tại đặt bàn Pending Payment quá 17 phút. |
| **Điều kiện kết thúc** | Bàn về Available, đơn đặt bàn chuyển Expired_Cancelled, sơ đồ sàn cập nhật theo thời gian thực. |

##### Luồng sự kiện chính (Main Flow)
1. Hệ thống tự động kích hoạt tiến trình kiểm tra định kỳ mỗi 60 giây.
2. Hệ thống quét dữ liệu tìm các đơn Pending Payment quá 17 phút.
3. Hệ thống chuyển trạng thái đơn sang Expired_Cancelled.
4. Hệ thống chuyển trạng thái bàn từ Locked về Available.
5. Hệ thống cập nhật trạng thái bàn trên sơ đồ mặt bằng tới thiết bị của nhân viên và màn hình quản trị.
6. Hệ thống ghi nhật ký kiểm toán lưu vết sự kiện giải phóng bàn.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 2a. Phản hồi thanh toán trễ (>17 phút) khi bàn đã có khách khác đặt: Hệ thống chuyển đơn sang trạng thái ngoại lệ và hoàn 100% tiền cọc cho khách.

#### Đặc tả UC-S2: Tự động gửi thông báo nhắc lịch hẹn

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-S2 |
| **Tên Use Case** | Tự động gửi thông báo nhắc lịch hẹn |
| **Tác nhân** | Hệ thống tự động (Chính), Khách hàng (Phụ), Cổng SMS/Email (Phụ) |
| **Mức độ ưu tiên** | Quan trọng (Should Have) |
| **Mối quan hệ** | Kết hợp dữ liệu từ đặt bàn trực tuyến UC-U1 |
| **Mục tiêu** | Quét các đơn đặt bàn trước giờ hẹn 2 tiếng, tự động phát lệnh gửi SMS/Email/Zalo ZNS nhắc khách nhớ giờ đến kèm mã đặt bàn BookingCode. |
| **Điều kiện tiên quyết** | Đơn đặt bàn Confirmed, thời gian cách thời điểm hiện tại 2 tiếng và chưa gửi nhắc nhở. |
| **Điều kiện kết thúc** | Thông báo được phát đi; cập nhật trạng thái đã gửi nhắc nhở kèm thời gian gửi. |

##### Luồng sự kiện chính (Main Flow)
1. Hệ thống tự động kích hoạt tiến trình kiểm tra định kỳ mỗi 5 phút.
2. Hệ thống quét dữ liệu tìm các đơn đặt bàn Confirmed cách giờ ăn 2 tiếng mà chưa gửi nhắc nhở.
3. Hệ thống kết xuất nội dung thông báo chứa mã BookingCode, thời gian dùng bữa và chỉ đường.
4. Hệ thống gọi cổng SMS/Email/Zalo ZNS để gửi tin nhắn đến khách hàng.
5. Cổng gửi tin phản hồi chuyển phát thành công; hệ thống cập nhật cờ IsReminderSent và lưu thời điểm gửi.
6. Hệ thống ghi nhật ký kiểm toán phiên gửi tin.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 4a. Cổng gửi tin gặp lỗi kết nối: Hệ thống tăng bộ đếm thử lại và lên lịch tái gửi ở chu kỳ tiếp theo.

#### Đặc tả UC-S3: Tự động kiểm soát & cảnh báo trễ SLA chế biến món ăn

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-S3 |
| **Tên Use Case** | Tự động kiểm soát & cảnh báo trễ SLA chế biến món ăn |
| **Tác nhân** | Hệ thống tự động (Chính), Điều phối viên (Phụ), Đầu bếp KDS (Phụ) |
| **Mức độ ưu tiên** | Bắt buộc (Must Have) |
| **Mối quan hệ** | Hỗ trợ điều phối lượt món UC-E1 và kiểm đồ quầy Pass UC-E2 theo quy định thời gian chế biến |
| **Mục tiêu** | Liên tục đếm ngược thời gian nấu của từng món ăn; kích hoạt cảnh báo đổi màu vé đỏ nhấp nháy và phát chuông âm thanh tới màn hình KDS Bếp và trạm Điều phối khi vượt Prep SLA. |
| **Điều kiện tiên quyết** | Tồn tại món ăn đang trong trạng thái Cooking. |
| **Điều kiện kết thúc** | Cờ quá hạn được bật; tín hiệu âm thanh và thị giác được truyền phát qua SignalR tới màn hình Bếp và trạm Pass. |

##### Luồng sự kiện chính (Main Flow)
1. Hệ thống tự động quét kiểm soát định kỳ mỗi 10 giây một lần.
2. Hệ thống lấy danh sách các món ăn đang trong trạng thái Cooking.
3. Hệ thống tính thời gian nấu thực tế so với định mức Prep SLA của từng món.
4. Khi thời gian chế biến vượt ngưỡng Prep SLA, hệ thống đánh dấu cờ IsOverdue cho món ăn.
5. Hệ thống gửi sự kiện cảnh báo qua kênh SignalR tới màn hình KDS Bếp và trạm Điều phối Pass.
6. Màn hình KDS Bếp và trạm Pass đổi màu vé món sang Đỏ nhấp nháy đồng thời kích hoạt chuông âm thanh cảnh báo.
7. Hệ thống ghi nhật ký sự kiện trễ SLA món ăn.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Bếp bấm hoàn thành món (Ready) trước thời điểm quét: Hệ thống chuyển trạng thái món sang Ready và hủy đếm ngược SLA.

#### Đặc tả UC-S4: Tự động gửi email cảm ơn & link khảo sát CSAT sau bữa ăn

| Thuộc tính | Chi tiết |
| :--- | :--- |
| **Mã Use Case** | UC-S4 |
| **Tên Use Case** | Tự động gửi email cảm ơn & link khảo sát CSAT sau bữa ăn |
| **Tác nhân** | Hệ thống tự động (Chính), Khách hàng (Phụ), Cổng Email (Phụ) |
| **Mức độ ưu tiên** | Bổ sung (Could Have) |
| **Mối quan hệ** | Kích hoạt ngay sau khi đóng bàn UC-E3; cung cấp dữ liệu cho khảo sát UC-U4 |
| **Mục tiêu** | Tự động tạo mã khảo sát trực tuyến và gửi thư cảm ơn kèm liên kết đánh giá mức độ hài lòng CSAT tới hòm thư của khách hàng ngay sau khi đóng bàn. |
| **Điều kiện tiên quyết** | Bàn ăn đã hoàn tất thanh toán đóng bàn tại UC-E3 và có địa chỉ email hợp lệ của khách hàng. |
| **Điều kiện kết thúc** | Bản ghi khảo sát được khởi tạo với token hiệu lực 24 giờ; email cảm ơn kèm liên kết khảo sát được gửi tới khách hàng. |

##### Luồng sự kiện chính (Main Flow)
1. Hệ thống tiếp nhận sự kiện đóng bàn thành công từ nghiệp vụ thanh toán hóa đơn.
2. Hệ thống kiểm tra địa chỉ email của khách hàng liên kết với bàn ăn.
3. Hệ thống tạo mã bảo mật khảo sát gắn liền với bữa ăn có hiệu lực trong 24 giờ.
4. Hệ thống khởi tạo bản ghi khảo sát trong cơ sở dữ liệu ở trạng thái Pending.
5. Hệ thống định dạng thư cảm ơn kèm liên kết truy cập trang khảo sát CSAT.
6. Hệ thống gửi email tới hòm thư của khách hàng qua dịch vụ Email Gateway.
7. Hệ thống cập nhật bản ghi khảo sát sang Đã gửi và ghi nhận thời điểm hoàn tất.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 2a. Khách hàng vãng lai không cung cấp email: Hệ thống bỏ qua bước phát thư khảo sát và kết thúc phiên đóng bàn.
* 6a. Dịch vụ gửi email gặp lỗi kết nối: Hệ thống chuyển bản ghi sang trạng thái chờ gửi lại để hàng đợi tự động tái phát lệnh sau 5 phút.

---

## 4. MA TRẬN QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES MATRIX)

| Mã quy tắc | Tên quy tắc | Nội dung nghiệp vụ chi phối | Áp dụng tại Use Case |
| :---: | :--- | :--- | :--- |
| **BR-01** | Thời hạn khóa giữ bàn tạm thời | Khóa giữ bàn tạm 17 phút (15 phút hiệu lực mã QR + 2 phút ân hạn). Quá 17 phút chưa thanh toán thành công, hệ thống tự động hủy phiên và giải phóng bàn về Available. | UC-U1, UC-S1 |
| **BR-02** | Công thức tính Hóa đơn & Cấn trừ cọc | Subtotal = Tổng tiền món Served; Phí phục vụ = Subtotal × 5%; Thuế VAT = (Subtotal + Phí phục vụ) × 10%; Tổng cộng = Subtotal + Phí phục vụ + Thuế VAT; Tiền thanh toán thêm = MAX(0, Tổng cộng − Tiền cọc). Tiền cọc là mức chi tiêu tối thiểu không hoàn lại. | UC-E3, UC-S4 |
| **BR-03** | Thẩm quyền xác nhận phục vụ tại quầy Pass | Thao tác xác nhận hoàn thành món (Served) chỉ dành cho Nhân viên Điều phối (Expediter) và Quản lý & Quản trị viên. Đầu bếp và Khách hàng không có quyền thao tác. | UC-E2, UC-E1 |
| **BR-04** | Chính sách hủy đặt bàn & Hoàn tiền cọc | Hủy trước giờ hẹn từ 4 tiếng: Tự động hoàn 100% cọc qua VNPAY. Hủy dưới 4 tiếng hoặc vắng mặt (No-show): Phạt giữ 100% cọc. Quản lý có quyền duyệt hoàn cọc ngoại lệ kèm lý do lưu nhật ký kiểm toán. | UC-U1, UC-U3, UC-A3, UC-S2 |
| **BR-05** | Điều phối Course Firing & Prep SLA | Mỗi món có định mức Prep SLA. Gửi đơn thì Course 1 chuyển sang Cooking; các Course sau ở trạng thái On Hold. KDS Bếp đếm ngược SLA và đổi màu (Xanh > 30% $\rightarrow$ Vàng $\le$ 30% $\rightarrow$ Đỏ nhấp nháy < 00:00). Khi khách dùng 60%–70%, Phục vụ bấm Course Firing để kích hoạt Course tiếp theo. | UC-E1, UC-E2, UC-A1, UC-S3 |
