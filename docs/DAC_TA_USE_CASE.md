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
| **Khách hàng** *(Guest)* | Tác nhân chính *(Primary)* | Điện thoại thông minh *(Mobile Web Responsive)* | Tra cứu sơ đồ phân khu bàn ăn, chọn chỗ và đặt bàn trực tuyến; thanh toán tiền cọc qua cổng VNPAY; xem thực đơn ẩm thực qua E-Menu tại bàn; đánh giá phản hồi chất lượng dịch vụ sau bữa ăn. |
| **Nhân viên Phục vụ** *(Waitstaff)* | Tác nhân chính *(Primary)* | Thiết bị di động / Tablet *(Mobile/Tablet Web POS)* | Theo dõi sơ đồ bàn thời gian thực để đón khách, check-in hoặc đổi bàn; tư vấn món, tạo đơn gọi món đồng bộ xuống KDS Bếp; chủ động bấm kích hoạt nấu đợt món tiếp theo *(Course Firing)* và gắn nhãn ưu tiên *(Priority)*; nhận món từ quầy Pass ra bàn; xuất phiếu tạm tính cấn trừ tiền cọc và chuyển bàn sang chờ dọn dẹp. |
| **Nhân viên Điều phối** *(Expediter / Checkfood)* | Tác nhân chính *(Primary)* | Tablet cố định tại quầy Pass | Tiếp nhận đĩa món hoàn thiện từ nhà bếp; đối chiếu hình thức trình bày và tiêu chuẩn món ăn với màn hình điều phối; bấm xác nhận hoàn thành món để thông báo tức thời đến nhân viên phục vụ phụ trách bàn; từ chối và đẩy lệnh làm lại khẩn cấp nếu món không đạt tiêu chuẩn. |
| **Quản lý Nhà hàng** *(Manager)* | Tác nhân chính *(Primary)* | Máy tính cá nhân *(Laptop/PC Web Admin)* | Thiết lập danh mục thực đơn, giá bán và cấu hình định mức thời gian chế biến *(Prep SLA)*; thiết lập bố cục sơ đồ phân khu bàn ăn trên Canvas 2D; theo dõi báo cáo doanh thu, tỷ lệ lấp đầy bàn thời gian thực; phê duyệt lệnh hoàn tiền cọc thủ công ngoại lệ khi xảy ra sự cố bất khả kháng. |
| **Quản trị viên** *(System Admin)* | Tác nhân chính *(Primary)* | Máy tính cá nhân *(Laptop/PC Web Admin)* | Khởi tạo, phân bổ và quản trị tài khoản người dùng nội bộ theo mô hình phân quyền vai trò *(RBAC)*; khóa tài khoản nhân sự nghỉ việc; giám sát nhật ký vận hành và nhật ký kiểm toán *(Audit Log)*. |
| **Cổng thanh toán** *(VNPAY Gateway)* | Tác nhân phụ *(Secondary)* | Máy chủ thanh toán *(Payment Server)* | Tiếp nhận yêu cầu khởi tạo giao dịch đặt cọc từ máy chủ; cung cấp giao diện quét VietQR hoặc nhập thông tin thẻ bảo mật cho khách; gửi tín hiệu phản hồi kết quả giao dịch qua IPN callback; xử lý lệnh hoàn tiền cọc tự động hoặc thủ công. |
| **Hệ thống tự động** *(Background Worker)* | Tác nhân phụ *(Secondary)* | Tiến trình dịch vụ ngầm *(Background Service)* | Định kỳ quét cơ sở dữ liệu mỗi 60 giây để phát hiện các phiên đặt cọc quá hạn 17 phút; tự động hủy phiên giao dịch, giải phóng bàn về trạng thái sẵn sàng và đồng bộ sơ đồ sàn qua SignalR. |

### 1.2 Ma trận Phân quyền Chức năng (RBAC Matrix)

| Phân hệ chức năng | Nghiệp vụ chi tiết | Khách hàng | Phục vụ | Điều phối | Quản lý | Quản trị |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Tài khoản & Phân quyền** | Đăng nhập hệ thống nội bộ | ✗ | ✓ | ✓ | ✓ | ✓ |
| | Quản lý thông tin hồ sơ cá nhân | ✗ | ✓ | ✓ | ✓ | ✓ |
| | Khởi tạo tài khoản & Phân quyền nhân viên | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Đặt bàn & Đặt cọc** | Tra cứu sơ đồ bàn & Đặt chỗ trực tuyến | ✓ | ✓ | ✗ | ✓ | ✗ |
| | Thanh toán khoản tiền cọc giữ chỗ qua VNPAY | ✓ | ✓ | ✗ | ✓ | ✗ |
| | Hủy đặt bàn trực tuyến trước giờ hẹn từ 4 tiếng | ✓ | ✓ | ✗ | ✓ | ✗ |
| | Phê duyệt lệnh hoàn cọc thủ công ngoại lệ | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Sơ đồ bàn & Hiển thị** | Theo dõi sơ đồ bàn trực quan thời gian thực | ✗ | ✓ | ✓ | ✓ | ✓ |
| | Check-in khách vào bàn ăn thực tế | ✗ | ✓ | ✗ | ✓ | ✗ |
| | Đổi bàn / Chuyển bàn phục vụ cho khách | ✗ | ✓ | ✗ | ✓ | ✗ |
| | Cấu hình sơ đồ mặt bằng bàn ăn trên Canvas 2D | ✗ | ✗ | ✗ | ✓ | ✓ |
| | Chuyển trạng thái bàn sang sẵn sàng sau khi dọn | ✗ | ✓ | ✗ | ✓ | ✗ |
| **Gọi món & Phục vụ** | Xem thực đơn điện tử E-Menu tại bàn | ✓ | ✓ | ✓ | ✓ | ✓ |
| | Tạo đơn gọi món & Điều phối KDS Bếp theo Course | ✗ | ✓ | ✗ | ✓ | ✗ |
| | Kích hoạt nấu đợt món tiếp theo *(Course Firing)* | ✗ | ✓ | ✗ | ✓ | ✗ |
| | Kiểm đồ & Xác nhận ra món tại quầy Pass *(Served)* | ✗ | ✗ | ✓ | ✓ | ✗ |
| **Hóa đơn & Doanh thu** | Gửi yêu cầu tính tiền tại bàn | ✓ | ✓ | ✗ | ✓ | ✗ |
| | Xuất hóa đơn tạm tính tự động cấn trừ tiền cọc | ✗ | ✓ | ✗ | ✓ | ✗ |
| | Xác nhận hoàn tất thanh toán & Đóng bàn | ✗ | ✓ | ✗ | ✓ | ✗ |
| | Xem báo cáo doanh thu & Thống kê hiệu suất | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Đánh giá dịch vụ** | Khách gửi chấm điểm và nhận xét sau bữa ăn | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## 2. DANH MỤC 15 USE CASE HỆ THỐNG

| STT | Mã Use Case | Tên Use Case | Phân hệ | Mức độ ưu tiên |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **UC-U1** | Đặt bàn trực tuyến & Đặt cọc giữ chỗ | Khách hàng *(Guest)* | Trọng yếu *(Must Have)* |
| 2 | **UC-U2** | Xem E-Menu tại bàn | Khách hàng *(Guest)* | Trọng yếu *(Must Have)* |
| 3 | **UC-U3** | Hủy đặt bàn trực tuyến & Hoàn cọc tự động | Khách hàng *(Guest)* | Trọng yếu *(Must Have)* |
| 4 | **UC-U4** | Gửi đánh giá và phản hồi chất lượng dịch vụ | Khách hàng *(Guest)* | Bổ sung *(Could Have)* |
| 5 | **UC-E1** | Nhân viên tạo Order trực tiếp & Điều phối KDS Bếp theo Course | Nhân viên Nội bộ *(Staff)* | Trọng yếu *(Must Have)* |
| 6 | **UC-E2** | Kiểm đồ tại quầy Pass, Phục vụ món & Kích hoạt Pacing Course kế tiếp | Nhân viên Nội bộ *(Staff)* | Trọng yếu *(Must Have)* |
| 7 | **UC-E3** | Thanh toán, Cấn trừ tiền cọc & Đóng bàn | Nhân viên Nội bộ *(Staff)* | Trọng yếu *(Must Have)* |
| 8 | **UC-E4** | Đổi bàn / Chuyển bàn phục vụ | Nhân viên Nội bộ *(Staff)* | Quan trọng *(Should Have)* |
| 9 | **UC-E5** | Đăng nhập & Xác thực hệ thống nội bộ | Nhân viên Nội bộ *(Staff)* | Trọng yếu *(Must Have)* |
| 10 | **UC-A1** | Quản trị Danh mục, Thực đơn & Cấu hình Prep SLA món ăn | Quản lý & Quản trị *(Admin)* | Quan trọng *(Should Have)* |
| 11 | **UC-A2** | Quản trị & Cấu hình Sơ đồ bàn ăn | Quản lý & Quản trị *(Admin)* | Quan trọng *(Should Have)* |
| 12 | **UC-A3** | Duyệt hoàn tiền cọc thủ công ngoại lệ | Quản lý & Quản trị *(Admin)* | Quan trọng *(Should Have)* |
| 13 | **UC-A4** | Quản trị Tài khoản & Phân quyền nhân viên | Quản lý & Quản trị *(Admin)* | Quan trọng *(Should Have)* |
| 14 | **UC-A5** | Xem Báo cáo Thống kê & Dashboard doanh thu | Quản lý & Quản trị *(Admin)* | Bổ sung *(Could Have)* |
| 15 | **UC-S1** | Tự động giải phóng bàn hết hạn giữ cọc | Hệ thống Tự động *(System)* | Trọng yếu *(Must Have)* |

---

## 3. ĐẶC TẢ CHI TIẾT 15 USE CASE HỆ THỐNG

### 3.1 Phân hệ Khách hàng (Guest Subsystem)

#### Đặc tả UC-U1: Đặt bàn trực tuyến & Đặt cọc giữ chỗ

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-U1 |
| **Tên Use Case** | Đặt bàn trực tuyến & Đặt cọc giữ chỗ *(Online Reservation & Deposit Settlement)* |
| **Tác nhân tham gia** | Khách hàng *(Chính)*, Cổng thanh toán VNPAY *(Phụ)*, Hệ thống tự động *(Phụ)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Bao gồm tương tác cổng VNPAY để thanh toán; Mở rộng tác vụ nền giải phóng bàn UC-S1 khi quá hạn giữ chỗ 17 phút |
| **Mục tiêu chức năng** | Cho phép khách hàng truy cập website, tra cứu sơ đồ bàn theo thời gian thực, lựa chọn thời điểm và vị trí bàn mong muốn, sau đó thanh toán tiền cọc cố định qua VNPAY để xác nhận giữ chỗ chắc chắn. |
| **Điều kiện tiên quyết** | Khách hàng truy cập website đặt chỗ của nhà hàng; sơ đồ mặt bằng bàn ăn đang trong trạng thái hoạt động. |
| **Điều kiện kết thúc** | Vị trí bàn ăn chuyển sang trạng thái Đã đặt chỗ *(Reserved)*; hệ thống ghi nhận khoản cọc thành công và tự động tạo mã BookingCode gửi qua SMS/Email xác nhận. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng lựa chọn ngày dùng bữa, ca phục vụ (khung giờ chia theo mốc 15 phút kèm 15 phút đệm dọn bàn), số lượng khách và khu vực ngồi mong muốn (Sảnh chính, VIP, Ban công).
2. Hệ thống hiển thị các bàn còn trống theo thời gian thực tương ứng trên sơ đồ mặt bằng.
3. Khách hàng chọn vị trí bàn, nhập thông tin cá nhân (Họ tên, Số điện thoại, Email, ghi chú yêu cầu riêng nếu có) và nhấn nút xác nhận đặt cọc.
4. Hệ thống khóa giữ bàn tạm thời trong 17 phút (15 phút hiệu lực mã QR thanh toán VNPAY + 2 phút ân hạn bù độ trễ mạng) và chuyển hướng khách hàng sang cổng thanh toán VNPAY.
5. Khách hàng thực hiện quét mã VietQR hoặc nhập thông tin thẻ ngân hàng trong thời hạn 15 phút.
6. Cổng thanh toán VNPAY gửi tín hiệu IPN callback xác nhận thanh toán thành công về máy chủ hệ thống.
7. Hệ thống chuyển trạng thái bàn ăn sang Đã đặt chỗ *(Reserved)*, tạo mã đặt bàn BookingCode và gửi thông báo xác nhận kèm chi tiết lịch hẹn qua SMS/Email cho khách hàng.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 2a. Khi hết bàn trống hoặc hết khung giờ, hệ thống hiển thị thông báo gợi ý khung giờ hoặc khu vực khác; khách hàng chọn lại hoặc dừng thao tác.
* 3a. Khi thiếu hoặc sai định dạng số điện thoại/email, hệ thống báo lỗi trực tiếp tại ô nhập liệu và tạm khóa thao tác tiếp tục.
* 5a. Khi giao dịch thanh toán bị hủy hoặc phát sinh lỗi mạng, hệ thống duy trì khóa giữ bàn nếu vẫn còn trong thời hạn 17 phút để khách hàng thao tác lại.
* 5b. Khi quá 17 phút chưa hoàn tất thanh toán, hệ thống tự động hủy phiên đặt bàn và giải phóng bàn về trạng thái Sẵn sàng *(Available)*.
* 6a. Khi nhận được tín hiệu thanh toán thành công trễ (>17 phút) mà bàn đó đã được khách hàng khác đặt trước, hệ thống chuyển giao dịch sang trạng thái ngoại lệ và hoàn trả 100% tiền cọc cho khách.
* 7a. Khi hệ thống gửi tin nhắn SMS/Email xác nhận thất bại, hệ thống đẩy yêu cầu vào hàng đợi gửi bù và hiển thị trực tiếp mã BookingCode trên màn hình trình duyệt.

---

#### Đặc tả UC-U2: Xem E-Menu tại bàn

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-U2 |
| **Tên Use Case** | Xem E-Menu tại bàn *(In-Dining Digital E-Menu Browsing)* |
| **Tác nhân tham gia** | Khách hàng *(Chính)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Độc lập |
| **Mục tiêu chức năng** | Khách hàng quét mã QR tại bàn bằng điện thoại cá nhân hoặc sử dụng tablet của nhà hàng để xem thực đơn hình ảnh chất lượng cao, chi tiết thành phần món ăn, đơn giá và gửi yêu cầu phục vụ hoặc gọi thanh toán ngay tại bàn. |
| **Điều kiện tiên quyết** | Khách hàng đã ngồi tại bàn ăn thực tế tại nhà hàng. |
| **Điều kiện kết thúc** | Khách hàng nắm bắt thông tin món ăn và chuẩn bị sẵn sàng trao đổi trực tiếp với nhân viên phục vụ để gọi món. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng quét mã QR gắn cố định tại bàn bằng điện thoại cá nhân (hoặc sử dụng tablet của nhà hàng) để truy cập ứng dụng E-Menu.
2. Khách hàng duyệt xem danh mục món ăn phân loại theo Khai vị, Món chính, Tráng miệng, Đồ uống kèm hình ảnh trực quan, đơn giá niêm yết và câu chuyện ẩm thực của món.
3. Khách hàng kiểm tra chi tiết các nguyên liệu thành phần và thông tin cảnh báo dị ứng thực phẩm của món ăn.
4. Khách hàng trao đổi danh sách món đã lựa chọn cho nhân viên phục vụ ghi nhận trực tiếp lên hệ thống POS.
5. Khách hàng có thể nhấn nút gọi phục vụ hoặc yêu cầu thanh toán trên giao diện E-Menu khi phát sinh nhu cầu trong bữa ăn.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 1a. Khi khách hàng không mang điện thoại hoặc thiết bị hết pin, nhân viên phục vụ cung cấp tablet chuyên dụng của nhà hàng hoặc gửi thực đơn giấy.

---

#### Đặc tả UC-U3: Hủy đặt bàn trực tuyến & Hoàn cọc tự động

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-U3 |
| **Tên Use Case** | Hủy đặt bàn trực tuyến & Hoàn cọc tự động *(Online Reservation Cancellation & Auto-Refund)* |
| **Tác nhân tham gia** | Khách hàng *(Chính)*, Cổng thanh toán VNPAY *(Phụ)*, Hệ thống tự động *(Phụ)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Bao gồm tương tác cổng VNPAY để xử lý lệnh hoàn tiền cọc tự động qua API |
| **Mục tiêu chức năng** | Cho phép khách hàng chủ động hủy lịch đặt bàn trực tuyến trên hệ thống; hệ thống tự động kiểm tra mốc thời gian đối chiếu chính sách hoàn hủy để thực hiện hoàn cọc hoặc phạt cọc hoàn toàn tự động. |
| **Điều kiện tiên quyết** | Khách hàng sở hữu một mã đặt bàn BookingCode đang ở trạng thái hợp lệ Đã đặt chỗ *(Reserved)*. |
| **Điều kiện kết thúc** | Trạng thái lịch đặt bàn chuyển sang Đã hủy *(Cancelled)*; vị trí bàn ăn được giải phóng về trạng thái Sẵn sàng *(Available)*; giao dịch hoàn tiền hoặc giữ cọc được ghi nhận vào hệ thống. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng truy cập trang Tra cứu đặt bàn trên website, nhập Số điện thoại và mã BookingCode đã nhận.
2. Hệ thống kiểm tra thông tin và hiển thị chi tiết lịch hẹn kèm nút Hủy đặt bàn.
3. Khách hàng nhấn nút Hủy đặt bàn và xác nhận đồng ý với điều khoản chính sách hoàn hủy.
4. Hệ thống kiểm tra khoảng cách thời gian từ thời điểm yêu cầu hủy đến giờ hẹn dùng bữa thực tế.
5. Khi khoảng thời gian đến giờ hẹn còn từ 4 tiếng trở lên, hệ thống tự động gọi API sang cổng VNPAY để xử lý lệnh hoàn trả 100% tiền cọc cho khách hàng.
6. Hệ thống chuyển trạng thái đặt bàn sang Đã hủy *(Cancelled)* và đưa vị trí bàn ăn trở về trạng thái Sẵn sàng *(Available)*.
7. Hệ thống gửi thông báo xác nhận hủy bàn kèm chứng từ hoàn tiền qua SMS/Email cho khách hàng.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 1a. Khi nhập sai Số điện thoại hoặc mã BookingCode, hệ thống hiển thị thông báo không tìm thấy lịch hẹn và yêu cầu khách hàng kiểm tra lại thông tin.
* 5a. Khi khoảng thời gian đến giờ hẹn dưới 4 tiếng, hệ thống hiển thị cảnh báo phạt mất 100% tiền cọc; sau khi khách hàng xác nhận tiếp tục, hệ thống hủy lịch hẹn, giữ lại khoản tiền cọc và giải phóng bàn về trạng thái Sẵn sàng *(Available)*.

---

#### Đặc tả UC-U4: Gửi đánh giá và phản hồi chất lượng dịch vụ

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-U4 |
| **Tên Use Case** | Gửi đánh giá và phản hồi chất lượng dịch vụ *(Guest Post-Dining Review & CSAT)* |
| **Tác nhân tham gia** | Khách hàng *(Chính)*, Quản lý Nhà hàng *(Phụ)* |
| **Mức độ ưu tiên** | Bổ sung *(Could Have)* |
| **Mối quan hệ** | Độc lập (Thu thập khảo sát mức độ hài lòng khách hàng sau trải nghiệm ẩm thực) |
| **Mục tiêu chức năng** | Thu thập ý kiến đánh giá định lượng và đóng góp nhận xét chất lượng từ khách hàng sau bữa ăn nhằm cải tiến chất lượng dịch vụ nhà hàng. |
| **Điều kiện tiên quyết** | Khách hàng đã dùng bữa xong và hoàn tất thủ tục thanh toán hóa đơn. |
| **Điều kiện kết thúc** | Dữ liệu đánh giá và chấm điểm được lưu trữ an toàn vào cơ sở dữ liệu và hiển thị trên bảng thống kê CSAT của Quản lý. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng quét mã QR in trên hóa đơn thanh toán hoặc bấm vào liên kết khảo sát trong email cảm ơn sau bữa ăn.
2. Khách hàng thực hiện chấm điểm thang 1–5 sao cho các hạng mục: Chất lượng món ăn, Không gian nhà hàng và Thái độ phục vụ.
3. Khách hàng nhập ý kiến nhận xét chi tiết (nếu có) và nhấn nút Gửi đánh giá.
4. Hệ thống lưu kết quả đánh giá vào cơ sở dữ liệu và tự động cập nhật chỉ số đo lường sự hài lòng (CSAT) lên cổng quản trị của Quản lý.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 1a. Khi khách hàng truy cập liên kết đánh giá đã hết hạn (quá 48 giờ kể từ thời điểm đóng bàn), hệ thống hiển thị thông báo phiên đánh giá đã kết thúc và gửi lời cảm ơn khách hàng.

---

### 3.2 Phân hệ Nhân viên Nội bộ (Staff Subsystem)

#### Đặc tả UC-E1: Nhân viên tạo Order trực tiếp & Điều phối KDS Bếp theo Course

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-E1 |
| **Tên Use Case** | Nhân viên tạo Order trực tiếp & Điều phối KDS Bếp theo Course *(Waitstaff Direct Ordering & Course Firing)* |
| **Tác nhân tham gia** | Nhân viên Phục vụ *(Chính)*, Màn hình KDS Bếp *(Phụ)*, Hệ thống tự động *(Phụ)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5; Tương tác thời gian thực với Màn hình KDS Bếp |
| **Mục tiêu chức năng** | Cho phép nhân viên phục vụ tiếp nhận yêu cầu gọi món tại bàn, phân chia thứ tự phục vụ theo Course và kích hoạt điều phối chế biến tự động xuống màn hình KDS Bếp. |
| **Điều kiện tiên quyết** | Vị trí bàn ăn đã được check-in ở trạng thái Đang phục vụ *(Occupied)* và khách hàng đã hoàn thành việc chọn món. |
| **Điều kiện kết thúc** | Đơn hàng mới được tạo ở trạng thái Đang chế biến *(Processing)*; các món thuộc Course 1 được mở sáng và đếm ngược Prep SLA trên KDS Bếp; các Course tiếp theo giữ ở trạng thái Chờ điều phối *(On Hold)*. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng trao đổi danh sách món ăn, số lượng và mức độ chín hoặc lưu ý dị ứng với nhân viên phục vụ.
2. Nhân viên mở ứng dụng Web POS trên thiết bị di động cầm tay và chọn bàn đang phục vụ tương ứng.
3. Nhân viên chọn món ăn vào đơn, nhập ghi chú chế biến riêng và xác nhận phân định thứ tự đợt món (Course 1: Khai vị, Course 2: Món chính, Course 3: Tráng miệng).
4. Nhân viên rà soát lại toàn bộ danh mục món đã chọn và nhấn nút Gửi Bếp.
5. Hệ thống lưu đơn hàng ở trạng thái Đang chế biến *(Processing)*, tự động chuyển các món thuộc Course 1 sang trạng thái Đang nấu *(Cooking)* và giữ các món thuộc Course 2, Course 3 ở trạng thái Chờ điều phối *(On Hold)*.
6. Hệ thống truyền dữ liệu thời gian thực qua SignalR để hiển thị vé món lên màn hình KDS Bếp chuyên trách của từng trạm chế biến kèm số bàn và kích hoạt đồng hồ đếm ngược thời gian chuẩn bị định mức (Prep SLA) cho từng món thuộc Course 1.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 6a. Khi khách hàng gọi thêm món trong quá trình dùng bữa, nhân viên mở lại đơn hàng của bàn trên POS để chọn thêm món và gán vào Course tương ứng; hệ thống tự động gộp vào đơn hiện hành và đồng bộ tức thời xuống KDS Bếp.

---

#### Đặc tả UC-E2: Kiểm đồ tại quầy Pass, Phục vụ món & Kích hoạt Pacing Course kế tiếp

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-E2 |
| **Tên Use Case** | Kiểm đồ tại quầy Pass, Phục vụ món & Kích hoạt Pacing Course kế tiếp *(Expediter Pass Verification, Serving & Pacing Next Course)* |
| **Tác nhân tham gia** | Nhân viên Điều phối / Checkfood *(Chính)*, Nhân viên Phục vụ *(Phụ)*, Hệ thống tự động *(Phụ)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5; Tương tác với màn hình điều phối quầy Pass và KDS Bếp |
| **Mục tiêu chức năng** | Nhân viên Điều phối tại quầy Pass kiểm tra chất lượng và hình thức món ăn, bấm xác nhận hoàn thành để gọi phục vụ mang ra bàn; Nhân viên Phục vụ theo dõi tiến độ dùng bữa của khách để chủ động bấm lệnh Course Firing kích hoạt nấu Course kế tiếp. |
| **Điều kiện tiên quyết** | Các món ăn trong cùng một Course của bàn đã được nhà bếp hoàn tất chế biến và đặt tại quầy Pass. |
| **Điều kiện kết thúc** | Trạng thái món hiện tại chuyển sang Đã phục vụ *(Served)*; thông báo gửi tới thiết bị của nhân viên phục vụ; Course kế tiếp được chuyển sang Đang nấu *(Cooking)* khi nhân viên bấm Course Firing. |

##### Luồng sự kiện chính (Main Flow)
1. Đầu bếp hoàn tất chế biến các đĩa ăn của Course hiện tại và đặt lên quầy Pass dưới đèn giữ nhiệt.
2. Nhân viên Điều phối (Expediter) đối chiếu hình thức trình bày và thành phần đĩa món thực tế với thông tin trên màn hình điều phối tại quầy Pass.
3. Nhân viên Điều phối bấm nút Xác nhận hoàn thành *(Served)* cho đợt món trên giao diện màn hình cảm ứng quầy Pass.
4. Hệ thống chuyển trạng thái các món trong Course hiện tại sang Đã phục vụ *(Served)*, ghi nhận thời gian hoàn thành thực tế so với định mức Prep SLA, gửi thông báo tức thời qua SignalR tới thiết bị cầm tay của nhân viên phục vụ và cập nhật trạng thái món sắp ra lên màn hình TableDisplay tại bàn.
5. Nhân viên phục vụ tiếp nhận đĩa ăn từ quầy Pass và mang món ăn ra phục vụ chính xác tại bàn cho khách.
6. Khi khách dùng được khoảng 60%–70% Course hiện tại, nhân viên phục vụ bấm nút Course Firing trên thiết bị cầm tay; hệ thống gửi sự kiện qua SignalR mở sáng các món thuộc Course kế tiếp từ trạng thái Chờ *(On Hold)* sang Đang nấu *(Cooking)* trên KDS Bếp và bắt đầu đếm ngược Prep SLA.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 2a. Khi món ăn trình bày sai quy cách, sai nhiệt độ hoặc sai ghi chú yêu cầu, Nhân viên Điều phối bấm nút Từ chối *(Reject)* tại quầy Pass; hệ thống đẩy lại thẻ món với nhãn Ưu tiên khẩn cấp *(Remake Priority)* lên đầu màn hình KDS Bếp để bếp chế biến lại ngay lập tức.
* 6a. Khi bàn ăn có nguy cơ trễ giờ ca đặt kế tiếp hoặc khách có nhu cầu lên món gấp, nhân viên phục vụ bật nút gạt Ưu tiên *(Priority)* khi bấm Course Firing để đẩy vé món lên vị trí đầu tiên trên KDS Bếp.

---

#### Đặc tả UC-E3: Thanh toán, Cấn trừ tiền cọc & Đóng bàn

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

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng thông báo yêu cầu tính tiền trực tiếp với nhân viên phục vụ hoặc nhấn nút Yêu cầu thanh toán trên giao diện E-Menu.
2. Nhân viên phục vụ mở giao diện thanh toán của bàn tương ứng trên ứng dụng POS di động.
3. Hệ thống tự động tổng hợp tiền các món ăn thực tế đã phục vụ (Subtotal), cộng 5% phí phục vụ, cộng 10% thuế VAT trên tổng tiền gồm phí phục vụ, sau đó tự động khấu trừ 100% khoản tiền cọc đã thu trước đó qua VNPAY để xác định số tiền khách phải trả thêm.
4. Hệ thống gửi lệnh in phiếu tạm tính ra máy in quầy thu ngân; nhân viên mang phiếu ra bàn cho khách hàng đối chiếu chi tiết.
5. Khách hàng thanh toán phần tiền chênh lệch bằng tiền mặt, thẻ ngân hàng POS hoặc quét mã VietQR in trực tiếp trên phiếu.
6. Nhân viên phục vụ bấm nút Xác nhận thanh toán trên ứng dụng POS sau khi thu tiền thành công.
7. Hệ thống chuyển trạng thái hóa đơn sang Đã thanh toán *(Paid)*, lưu trữ dữ liệu và chuyển trạng thái bàn ăn sang Chờ dọn dẹp *(Cleaning)*.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Khi tổng chi phí bữa ăn thực tế nhỏ hơn số tiền cọc đã đóng trước đó, hệ thống áp dụng nguyên tắc tiền cọc là mức chi tiêu tối thiểu không hoàn lại, ghi nhận số tiền khách phải trả thêm là 0 VNĐ và khóa chức năng hoàn tiền cọc thừa.

---

#### Đặc tả UC-E4: Đổi bàn / Chuyển bàn phục vụ

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-E4 |
| **Tên Use Case** | Đổi bàn / Chuyển bàn phục vụ *(Table Transfer & Table Merge)* |
| **Tác nhân tham gia** | Nhân viên Phục vụ *(Chính)*, Quản lý Nhà hàng *(Phụ)* |
| **Mức độ ưu tiên** | Quan trọng *(Should Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5 |
| **Mục tiêu chức năng** | Cho phép nhân viên phục vụ hoặc quản lý chuyển toàn bộ đơn hàng hiện hành sang bàn trống khác khi khách hàng có nhu cầu đổi chỗ hoặc cần giải phóng bàn quá giờ cho ca đặt tiếp theo. |
| **Điều kiện tiên quyết** | Bàn ăn ban đầu đang ở trạng thái Đang phục vụ *(Occupied)*; vị trí bàn mới mong muốn chuyển đến phải ở trạng thái Sẵn sàng *(Available)*. |
| **Điều kiện kết thúc** | Toàn bộ dữ liệu đơn hàng được di chuyển sang bàn mới; bàn ăn cũ chuyển trạng thái sang Chờ dọn dẹp *(Cleaning)*; bàn ăn mới chuyển sang Đang phục vụ *(Occupied)*. |

##### Luồng sự kiện chính (Main Flow)
1. Khách hàng yêu cầu đổi vị trí bàn hoặc Quản lý sảnh yêu cầu điều phối chuyển bàn để kịp đón lượt khách đặt ca sau.
2. Nhân viên phục vụ chọn chức năng Đổi bàn tại giao diện bàn hiện tại trên ứng dụng POS.
3. Hệ thống hiển thị sơ đồ các bàn đang ở trạng thái Sẵn sàng *(Available)* trong cùng ca phục vụ.
4. Nhân viên chọn vị trí bàn mới mong muốn và bấm Xác nhận chuyển bàn.
5. Hệ thống tự động di chuyển toàn bộ dữ liệu đơn hàng, danh mục món ăn và khoản tiền cọc sang mã bàn mới.
6. Hệ thống chuyển trạng thái bàn cũ sang Chờ dọn dẹp *(Cleaning)*, bàn mới sang Đang phục vụ *(Occupied)* và gửi thông báo cập nhật sơ đồ bàn thời gian thực tới quầy Pass và POS.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 4a. Khi khách đi nhóm đông muốn gộp bàn, nhân viên sử dụng chức năng Ghép bàn để liên kết các bàn vật lý thành một nhóm và hợp nhất hóa đơn thanh toán chung.
* 4b. Khi bàn đích vừa được nhân viên khác chọn cùng thời điểm, hệ thống cảnh báo xung đột trạng thái bàn không còn trống và yêu cầu nhân viên chọn vị trí khác.

---

#### Đặc tả UC-E5: Đăng nhập & Xác thực hệ thống nội bộ

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-E5 |
| **Tên Use Case** | Đăng nhập & Xác thực hệ thống nội bộ *(Staff Authentication & RBAC Authorization)* |
| **Tác nhân tham gia** | Nhân viên Phục vụ, Nhân viên Điều phối, Quản lý Nhà hàng, Quản trị viên *(Chính)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Use Case nền tảng *(Base Use Case)* cho toàn bộ các chức năng nội bộ |
| **Mục tiêu chức năng** | Cung cấp cơ chế xác thực danh tính an toàn và phân quyền truy cập dựa trên vai trò chức danh cho toàn bộ cán bộ nhân viên nhà hàng. |
| **Điều kiện tiên quyết** | Tài khoản nhân sự đã được Quản trị viên khởi tạo, phân bổ vai trò và kích hoạt trên hệ thống. |
| **Điều kiện kết thúc** | Người dùng được cấp mã thông báo JWT Bearer Token hợp lệ và được điều hướng tới giao diện màn hình làm việc tương ứng với quyền hạn. |

##### Luồng sự kiện chính (Main Flow)
1. Nhân viên truy cập trang Đăng nhập trên trình duyệt máy tính hoặc thiết bị di động cầm tay.
2. Nhân viên nhập Tên đăng nhập (hoặc Email) và Mật khẩu bảo mật.
3. Nhân viên nhấn nút Đăng nhập.
4. Hệ thống xác thực danh tính tài khoản qua ASP.NET Core Identity và kiểm tra trạng thái kích hoạt của tài khoản.
5. Hệ thống cấp mã định danh JWT Bearer Token theo vai trò quyền hạn *(Roles)* và chuyển hướng người dùng tới màn hình làm việc tương ứng (POS Phục vụ, Quầy Pass, Trang quản trị).

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 4a. Khi thông tin đăng nhập không chính xác, hệ thống hiển thị cảnh báo lỗi và yêu cầu nhập lại.
* 4b. Khi nhập sai mật khẩu quá 5 lần liên tiếp, hệ thống tạm khóa tài khoản trong 15 phút để bảo vệ an toàn hệ thống.
* 5a. Khi mã JWT Bearer Token hết hạn trong phiên làm việc, hệ thống tự động làm mới phiên thông qua Refresh Token hoặc điều hướng về trang đăng nhập nếu phiên hết hạn hoàn toàn.

---

### 3.3 Phân hệ Quản lý & Quản trị (Manager & Administrator Subsystem)

#### Đặc tả UC-A1: Quản trị Danh mục, Thực đơn & Cấu hình Prep SLA món ăn

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-A1 |
| **Tên Use Case** | Quản trị Danh mục, Thực đơn & Cấu hình Prep SLA món ăn *(Menu Engineering, Pricing & Prep SLA Configuration)* |
| **Tác nhân tham gia** | Quản lý Nhà hàng *(Chính)*, Quản trị viên *(Phụ)* |
| **Mức độ ưu tiên** | Quan trọng *(Should Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5 |
| **Mục tiêu chức năng** | Cung cấp công cụ cho Quản lý thiết lập thực đơn, đơn giá, phân nhóm Course mặc định, cấu hình thời gian chế biến tiêu chuẩn (Prep SLA) và cập nhật trạng thái Còn món hoặc Hết món theo thời gian thực. |
| **Điều kiện tiên quyết** | Quản lý đã đăng nhập thành công vào hệ thống với quyền hạn phù hợp. |
| **Điều kiện kết thúc** | Thông tin thực đơn và cấu hình SLA được lưu trữ đồng bộ trong cơ sở dữ liệu, hiển thị tức thời trên E-Menu, TableDisplay, POS và màn hình KDS Bếp. |

##### Luồng sự kiện chính (Main Flow)
1. Quản lý truy cập mục Quản lý thực đơn trên cổng thông tin quản trị.
2. Hệ thống hiển thị danh sách món ăn phân loại theo nhóm thực đơn và trạm bếp phụ trách.
3. Quản lý chọn chức năng Thêm món mới hoặc chọn một món ăn hiện có để Chỉnh sửa.
4. Quản lý nhập hoặc cập nhật bộ thông số chuẩn cho món ăn, bao gồm: Tên món, Mô tả nghệ thuật, Đơn giá niêm yết, Hình ảnh độ phân giải cao, Nhóm Course mặc định (Khai vị / Món chính / Tráng miệng), Trạm bếp chế biến (Bếp Lạnh / Bếp Nóng / Bếp Bánh) và Thời gian chuẩn bị định mức Prep SLA (tính bằng phút).
5. Quản lý bấm nút Lưu thay đổi.
6. Hệ thống kiểm tra tính hợp lệ của dữ liệu, lưu vào cơ sở dữ liệu và phát tín hiệu qua SignalR để đồng bộ tức thời xuống E-Menu, màn hình TableDisplay, thiết bị POS và bộ đếm SLA trên KDS Bếp.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 6a. Khi bếp báo hết nguyên liệu đột xuất trong ca phục vụ, Quản lý (hoặc Nhân viên Điều phối) gạt nhanh công tắc chuyển trạng thái món sang Tạm hết hàng *(Out of Stock)*; hệ thống lập tức làm mờ món ăn trên E-Menu và chặn thao tác chọn món đó trên ứng dụng POS của nhân viên phục vụ.

---

#### Đặc tả UC-A2: Quản trị & Cấu hình Sơ đồ bàn ăn

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-A2 |
| **Tên Use Case** | Quản trị & Cấu hình Sơ đồ bàn ăn *(Floor Plan Layout & Table Mapping Configuration)* |
| **Tác nhân tham gia** | Quản lý Nhà hàng *(Chính)*, Quản trị viên *(Phụ)* |
| **Mức độ ưu tiên** | Quan trọng *(Should Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5 |
| **Mục tiêu chức năng** | Quản lý thiết lập bố cục không gian bàn ăn trực quan theo từng phân khu trên nền Canvas 2D, điều chỉnh vị trí, sức chứa và liên kết thiết bị hiển thị. |
| **Điều kiện tiên quyết** | Quản lý đã đăng nhập thành công với quyền hạn quản lý cấu hình mặt bằng. |
| **Điều kiện kết thúc** | Bố cục sơ đồ mặt bằng bàn ăn được lưu trữ an toàn và đồng bộ hóa tức thời qua SignalR tới ứng dụng di động của toàn bộ nhân viên. |

##### Luồng sự kiện chính (Main Flow)
1. Quản lý mở giao diện Quản lý sơ đồ bàn trên trang quản trị.
2. Hệ thống hiển thị mặt bằng thiết kế dạng 2D Canvas trực quan.
3. Quản lý chọn phân khu bàn ăn (hoặc tạo phân khu mới), kéo thả vị trí bàn, chỉnh sửa tên bàn, sức chứa và hướng xoay không gian.
4. Quản lý gán mã thiết bị Digital Display hoặc Tablet tương ứng cho vị trí bàn.
5. Quản lý nhấn nút Lưu cấu hình.
6. Hệ thống kiểm tra dữ liệu, lưu vào cơ sở dữ liệu và đồng bộ sơ đồ mới tới toàn bộ thiết bị POS của nhân viên qua SignalR.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Khi số lượng ghế vượt quá quy chuẩn diện tích khu vực hoặc trùng lặp mã bàn, hệ thống hiển thị cảnh báo lỗi và yêu cầu điều chỉnh lại thông số.

---

#### Đặc tả UC-A3: Duyệt hoàn tiền cọc thủ công ngoại lệ

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-A3 |
| **Tên Use Case** | Duyệt hoàn tiền cọc thủ công ngoại lệ *(Manual Override Deposit Refund Approval)* |
| **Tác nhân tham gia** | Quản lý Nhà hàng *(Chính)*, Cổng thanh toán VNPAY *(Phụ)*, Hệ thống tự động *(Phụ)* |
| **Mức độ ưu tiên** | Quan trọng *(Should Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5; Tương tác cổng thanh toán VNPAY |
| **Mục tiêu chức năng** | Cho phép Quản lý xử lý hoàn lại tiền cọc cho khách hàng trong các tình huống phát sinh ngoại lệ hoặc sự cố bất khả kháng ngoài quy định tự động. |
| **Điều kiện tiên quyết** | Lịch đặt bàn đang ở trạng thái Đã hủy nhưng bị phạt cọc do hủy cận giờ (< 4 tiếng), hoặc khách hàng gửi khiếu nại chính đáng có căn cứ xác thực. |
| **Điều kiện kết thúc** | Khoản tiền cọc được hoàn trả về tài khoản khách hàng thông qua cổng VNPAY; hệ thống lưu vết nhật ký kiểm toán *(Audit Log)* ghi nhận danh tính người phê duyệt. |

##### Luồng sự kiện chính (Main Flow)
1. Quản lý tra cứu mã đặt bàn BookingCode cần xử lý trên cổng thông tin quản trị.
2. Hệ thống hiển thị chi tiết lịch sử giao dịch cọc, mốc thời gian hủy và lý do chưa hoàn tiền tự động.
3. Quản lý chọn chức năng Hoàn cọc ngoại lệ *(Override Refund)*.
4. Quản lý nhập lý do giải trình phê duyệt (sự cố bất khả kháng, lỗi hệ thống) và bấm xác nhận.
5. Hệ thống gọi API sang cổng VNPAY để kích hoạt lệnh hoàn tiền cho khách hàng.
6. Hệ thống cập nhật trạng thái đặt cọc sang Đã hoàn ngoại lệ và ghi nhật ký kiểm toán *(Audit Log)* lưu vết người duyệt và thời gian thao tác.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 5a. Khi kết nối API VNPAY bị gián đoạn, hệ thống lưu trạng thái giao dịch sang Chờ hoàn tiền, tự động thử lại theo chu kỳ và thông báo cho Quản lý theo dõi tiến độ.

---

#### Đặc tả UC-A4: Quản trị Tài khoản & Phân quyền nhân viên

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-A4 |
| **Tên Use Case** | Quản trị Tài khoản & Phân quyền nhân viên *(Staff Account & RBAC Role Provisioning)* |
| **Tác nhân tham gia** | Quản trị viên - System Admin *(Chính)* |
| **Mức độ ưu tiên** | Quan trọng *(Should Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5 |
| **Mục tiêu chức năng** | Quản trị viên quản lý danh sách nhân sự, khởi tạo tài khoản, phân bổ vai trò nghiệp vụ (Phục vụ, Điều phối, Quản lý) và khóa tài khoản khi nhân viên nghỉ việc. |
| **Điều kiện tiên quyết** | Quản trị viên đăng nhập với quyền hạn cao nhất trong hệ thống *(System Admin)*. |
| **Điều kiện kết thúc** | Thông tin nhân sự và quyền hạn truy cập được cập nhật chính xác và có hiệu lực ngay lập tức. |

##### Luồng sự kiện chính (Main Flow)
1. Quản trị viên truy cập mục Quản lý nhân sự trên cổng thông tin quản trị.
2. Hệ thống hiển thị danh sách toàn bộ cán bộ nhân viên cùng vai trò quyền hạn tương ứng.
3. Quản trị viên chọn tính năng Tạo tài khoản mới hoặc chọn tài khoản cần chỉnh sửa.
4. Quản trị viên nhập Họ tên, Số điện thoại, Email và gán vai trò: Nhân viên Phục vụ, Nhân viên Điều phối, Quản lý Nhà hàng hoặc Quản trị viên.
5. Quản trị viên nhấn Lưu tài khoản.
6. Hệ thống lưu dữ liệu vào cơ sở dữ liệu ASP.NET Core Identity và tự động gửi email kích hoạt kèm mật khẩu tạm thời cho nhân viên.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Khi nhân viên nghỉ việc hoặc có yêu cầu đình chỉ, Quản trị viên chọn Khóa tài khoản; hệ thống lập tức thu hồi toàn bộ quyền truy cập và hủy toàn bộ phiên làm việc của tài khoản trên mọi thiết bị.

---

#### Đặc tả UC-A5: Xem Báo cáo Thống kê & Dashboard doanh thu

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-A5 |
| **Tên Use Case** | Xem Báo cáo Thống kê & Dashboard doanh thu *(Analytics Dashboard & Revenue Reporting)* |
| **Tác nhân tham gia** | Quản lý Nhà hàng, Quản trị viên *(Chính)* |
| **Mức độ ưu tiên** | Bổ sung *(Could Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5 |
| **Mục tiêu chức năng** | Cung cấp bảng điều khiển trực quan tổng hợp doanh thu, tỷ lệ lấp đầy bàn ăn, số lượng hủy cọc và xếp hạng các món ăn bán chạy nhất theo thời gian thực. |
| **Điều kiện tiên quyết** | Quản lý hoặc Quản trị viên đã đăng nhập thành công vào cổng thông tin quản trị. |
| **Điều kiện kết thúc** | Các biểu đồ phân tích và bảng số liệu thống kê được hiển thị trực quan và hỗ trợ xuất báo cáo định kỳ. |

##### Luồng sự kiện chính (Main Flow)
1. Quản lý truy cập mục Báo cáo thống kê trên cổng thông tin quản trị.
2. Quản lý chọn khoảng thời gian cần xem (Ngày, Tuần, Tháng hoặc Khoảng ngày tùy chỉnh).
3. Hệ thống tổng hợp dữ liệu từ các phân hệ Hóa đơn, Đặt bàn và Đơn hàng đã hoàn thành.
4. Hệ thống hiển thị biểu đồ biến động doanh thu, cơ cấu món bán chạy, tỷ lệ sử dụng bàn và các chỉ số vận hành chính.
5. Quản lý có thể nhấn nút Xuất báo cáo để tải tệp dữ liệu chi tiết dưới định dạng Excel hoặc PDF.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 3a. Khi khoảng thời gian chọn không có dữ liệu giao dịch phát sinh, hệ thống hiển thị thông báo không có dữ liệu phù hợp và giữ nguyên giao diện biểu đồ mặc định.

---

### 3.4 Phân hệ Hệ thống Tự động (Automated Background System)

#### Đặc tả UC-S1: Tự động giải phóng bàn hết hạn giữ cọc

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-S1 |
| **Tên Use Case** | Tự động giải phóng bàn hết hạn giữ cọc *(Auto-Release Expired Reservation Lock)* |
| **Tác nhân tham gia** | Hệ thống tự động / Background Worker *(Chính)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Mở rộng UC-U1 khi phát sinh quá hạn thời gian thanh toán |
| **Mục tiêu chức năng** | Tiến trình chạy ngầm định kỳ quét cơ sở dữ liệu mỗi 60 giây, tự động phát hiện và hủy các phiên đặt bàn quá 17 phút mà chưa nhận được thanh toán cọc, giải phóng bàn về trạng thái sẵn sàng và đồng bộ sơ đồ qua SignalR. |
| **Điều kiện tiên quyết** | Tồn tại các bản ghi đặt bàn ở trạng thái Chờ thanh toán *(Pending Payment)* có thời gian khởi tạo vượt quá 17 phút. |
| **Điều kiện kết thúc** | Vị trí bàn ăn được giải phóng về trạng thái Sẵn sàng *(Available)*; phiên đặt bàn chuyển sang Hết hạn *(Expired_Cancelled)*; sơ đồ bàn trên thiết bị của nhân viên được cập nhật màu sắc thời gian thực. |

##### Luồng sự kiện chính (Main Flow)
1. Tiến trình Background Worker tự động chạy ngầm định kỳ mỗi 60 giây một lần.
2. Hệ thống quét cơ sở dữ liệu tìm các đơn đặt bàn ở trạng thái Chờ thanh toán *(Pending Payment)* có thời gian khóa vượt quá 17 phút.
3. Hệ thống chuyển trạng thái các đơn đặt bàn này sang Đã hủy do hết hạn *(Expired_Cancelled)*.
4. Hệ thống chuyển trạng thái vị trí bàn ăn từ Khóa giữ bàn *(Locked)* về Sẵn sàng *(Available)*.
5. Hệ thống gửi sự kiện qua SignalR để đồng bộ sơ đồ mặt bằng bàn ăn thời gian thực tới toàn bộ nhân viên và quản lý.
6. Hệ thống ghi nhật ký kiểm toán *(Audit Log)* lưu vết sự kiện giải phóng bàn tự động.

##### Luồng ngoại lệ (Alternative / Exception Flows)
* 2a. Khi nhận được tín hiệu IPN thanh toán thành công trễ (>17 phút) từ VNPAY mà bàn cũ đã có khách hàng khác đặt thành công, hệ thống chuyển đơn sang trạng thái xử lý ngoại lệ và tự động hoàn trả 100% tiền cọc cho khách.

---

## 4. MA TRẬN QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES MATRIX)

Hệ thống thiết lập 5 quy tắc nghiệp vụ cốt lõi chi phối toàn bộ luồng xử lý của 15 Use Case:

| Mã quy tắc | Tên quy tắc | Nội dung nghiệp vụ chi phối | Áp dụng tại Use Case |
| :---: | :--- | :--- | :--- |
| **BR-01** | Thời hạn khóa giữ bàn tạm thời *(Temporary Locking)* | Khóa giữ vị trí bàn tạm thời tối đa 17 phút (15 phút hiệu lực mã QR VNPAY + 02 phút ân hạn bù độ trễ mạng) ngay khi khách nhấn xác nhận đặt bàn. Nếu quá 17 phút chưa có tín hiệu IPN thành công, Background Worker sẽ tự động hủy phiên và giải phóng bàn về trạng thái Sẵn sàng *(Available)*. | UC-U1, UC-S1 |
| **BR-02** | Công thức tính Hóa đơn & Cấn trừ 100% tiền cọc | Tự động tính toán chi phí bữa ăn theo công thức: (1) Tiền món *(Subtotal)* = Tổng giá trị các món ở trạng thái Đã phục vụ *(Served)*; (2) Phí phục vụ = Subtotal × 5%; (3) Thuế GTGT = (Subtotal + Phí phục vụ) × 10%; (4) Tổng chi phí = Subtotal + Phí phục vụ + Thuế VAT; (5) Số tiền khách thanh toán thêm = MAX(0, Tổng chi phí − Tiền cọc đã thu qua VNPAY). Tiền cọc đóng vai trò là hạn mức chi tiêu tối thiểu không hoàn lại. | UC-E3 |
| **BR-03** | Thẩm quyền kiểm đồ & Xác nhận phục vụ tại quầy Pass | Thao tác xác nhận hoàn thành món ăn *(Served)* trên màn hình quầy Pass chỉ được cấp quyền cho Nhân viên Điều phối *(Expediter / Checkfood)* và Quản lý Nhà hàng *(Manager)*. Đầu bếp và Khách hàng tuyệt đối không có quyền thao tác nhằm đảm bảo chất lượng độc lập trước khi món ra sảnh. | UC-E2, UC-E1 |
| **BR-04** | Chính sách hủy đặt bàn & Hoàn tiền cọc tự động | Khách hàng chủ động hủy lịch đặt bàn trước giờ hẹn từ 04 tiếng trở lên được tự động hoàn trả 100% tiền cọc qua API VNPAY. Hủy trong vòng dưới 04 tiếng hoặc không đến *(No-show)* sẽ bị phạt giữ lại 100% tiền cọc. Quản lý có thẩm quyền duyệt hoàn cọc thủ công ngoại lệ kèm lý do lưu vào Audit Log khi gặp sự cố bất khả kháng. | UC-U1, UC-U3, UC-A3 |
| **BR-05** | Điều phối Course Firing tuần tự & Đếm ngược Prep SLA | Mỗi món ăn có định mức thời gian chế biến chuẩn *(Prep SLA)*. Khi gửi đơn, chỉ Course 1 được mở sáng ở trạng thái Đang nấu *(Cooking)*; các Course sau khóa mờ ở trạng thái Chờ điều phối *(On Hold)*. KDS Bếp đếm ngược Prep SLA qua SignalR và đổi màu: Xanh (> 30% thời gian) $\rightarrow$ Vàng ($\le$ 30% thời gian) $\rightarrow$ Đỏ nhấp nháy (< 00:00). Khi khách dùng được 60%–70% Course hiện tại, Phục vụ bấm Course Firing để chuyển Course kế tiếp sang Cooking. | UC-E1, UC-E2, UC-A1 |
