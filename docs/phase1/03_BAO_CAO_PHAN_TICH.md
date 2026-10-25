BỘ GIÁO DỤC VÀ ĐÀO TẠO — HỆ THỐNG ĐÀO TẠO CÔNG NGHỆ
KHOA CÔNG NGHỆ THÔNG TIN — BỘ MÔN KỸ THUẬT PHẦN MỀM
――――――――――――――――――――――――――――
BÁO CÁO PHÂN TÍCH YÊU CẦU & MÔ HÌNH HÓA HỆ THỐNG
SYSTEM REQUIREMENTS ANALYSIS & MODELING REPORT
ĐỀ TÀI DỰ ÁN:
VINDINING — HỆ THỐNG QUẢN LÝ VÀ ĐẶT BÀN
NHÀ HÀNG FINE DINING CAO CẤP

Giảng viên hướng dẫn:	ThS. Phạm Hữu Tùng
Sinh viên thực hiện 1:	Nguyễn Mạnh Quyền
Sinh viên thực hiện 2:	Đặng Quốc Khánh
Sinh viên thực hiện 3:	Nguyễn Hoàng Đạt
Giai đoạn đồ án:	Phase 1: Phân tích Yêu cầu & Thiết kế Hệ thống
 
MỤC LỤC BÁO CÁO PHÂN TÍCH HỆ THỐNG
CHƯƠNG 1: TỔNG QUAN TÁC NHÂN & MA TRẬN PHÂN QUYỀN (STAKEHOLDER & RBAC)	3
1.1 Danh mục Tác nhân Hệ thống (System Actors)	3
1.2 Ma trận Phân quyền Chức năng (Role-Based Access Control - RBAC)	4
CHƯƠNG 2: MÔ HÌNH HÓA USE CASE (USE CASE MODELING)	6
2.1 Sơ đồ Use Case tổng quát toàn hệ thống (Overall Use Case Diagram)	6
2.2 Sơ đồ Use Case phân rã theo Phân hệ (Subsystem Use Case Diagrams)	7
2.3 Đặc tả chi tiết 15 Use Case hệ thống (Use Case Specifications)	8
2.3.1 Nhóm Use Case Khách hàng (UC-U1 đến UC-U4)	8
2.3.2 Nhóm Use Case Nhân viên Nội bộ (UC-E1 đến UC-E5)	13
2.3.3 Nhóm Use Case Quản trị & Quản lý (UC-A1 đến UC-A5)	19
2.3.4 Nhóm Use Case Hệ thống Tự động (UC-S1)	25
CHƯƠNG 3: MÔ HÌNH HÓA QUY TRÌNH NGHIỆP VỤ (SWIMLANE ACTIVITY DIAGRAMS)	27
3.1 AD-01: Quy trình Đặt bàn trực tuyến & Đặt cọc VNPAY	27
3.2 AD-02: Quy trình Nhân viên Order trực tiếp & In Bếp	29
3.3 AD-03: Quy trình Kiểm đồ (Checkfood) & Xác nhận hoàn thành món tại quầy Pass	31
3.4 AD-04: Quy trình Thanh toán, Cấn trừ tiền cọc & Đóng bàn	33
3.5 AD-05: Quy trình Hủy đặt bàn & Hoàn phạt tiền cọc VNPAY	35
3.6 AD-06: Quy trình Đăng nhập & Xác thực nhân viên nội bộ	37
3.7 AD-07: Quy trình Chuyển bàn / Đổi bàn phục vụ	39
3.8 AD-08: Quy trình Quản trị & Cấu hình Sơ đồ bàn ăn	41
3.9 AD-09: Quy trình Duyệt hoàn cọc thủ công ngoại lệ	43
3.10 AD-10: Quy trình Tự động quét & Giải phóng bàn hết hạn giữ cọc	45
3.11 AD-11: Quy trình Quản trị Thực đơn & Trạng thái món	47
3.12 AD-12: Quy trình Khách hàng đánh giá & Phản hồi dịch vụ CSAT	49
CHƯƠNG 4: MÔ HÌNH HÓA TƯƠNG TÁC HỆ THỐNG (SEQUENCE DIAGRAMS)	40
4.1 SD-01: Đặt bàn trực tuyến & Thanh toán cọc qua VNPAY	40
4.2 SD-02: Nhân viên tạo Order trực tiếp & In phiếu Bếp	42
4.3 SD-03: Kiểm đồ (Checkfood) & Xác nhận hoàn thành món tại quầy Pass	44
4.4 SD-04: Thanh toán hóa đơn, Cấn trừ cọc & Đóng bàn	46
4.5 SD-05: Hủy đặt bàn & Hoàn tiền cọc VNPAY	48
4.6 SD-06: Đăng nhập & Xác thực JWT Token nhân viên nội bộ	50
4.7 SD-07: Chuyển bàn / Đổi bàn trực tiếp tại nhà hàng	52
4.8 SD-08: Quản trị & Cấu hình Sơ đồ bàn ăn	54
4.9 SD-09: Quản lý duyệt hoàn tiền cọc thủ công ngoại lệ	56
4.10 SD-10: Tự động giải phóng bàn hết hạn giữ cọc & Xử lý Late IPN	58
4.11 SD-11: Quản trị Thực đơn & Cập nhật trạng thái Còn/Hết món	60
4.12 SD-12: Khách hàng đánh giá dịch vụ & Tự động gửi Email CSAT	62
CHƯƠNG 5: QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES MATRIX)	53
CHƯƠNG 6: MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU (RTM MATRIX)	55
 
CHƯƠNG 1: TỔNG QUAN TÁC NHÂN & MA TRẬN PHÂN QUYỀN (STAKEHOLDER & RBAC)
1.1 Danh mục Tác nhân Hệ thống (System Actors)
Hệ thống phân định 5 tác nhân chính thuộc nhóm người dùng trực tiếp và 2 tác nhân phụ đóng vai trò là các hệ thống dịch vụ tích hợp bên ngoài:
Tác nhân (Actor)	Phân loại	Thiết bị / Nền tảng	Phạm vi quyền hạn
Khách hàng
(Guest)	Tác nhân chính
(Primary Actor)	Điện thoại thông minh cá nhân
(Mobile Web Responsive)	Khách hàng chủ động tra cứu sơ đồ phân khu bàn ăn, chọn vị trí và đặt bàn trực tuyến; thực hiện thanh toán khoản tiền cọc cố định qua cổng thanh toán VNPAY; xem thực đơn ẩm thực qua màn hình Digital Display thụ động tại bàn.
Nhân viên Phục vụ
(Waitstaff)	Tác nhân chính
(Primary Actor)	Điện thoại di động / Máy tính bảng
(Mobile/Tablet Web POS)	Nhân viên theo dõi sơ đồ mặt bằng bàn ăn thời gian thực để đón tiếp và check-in khách vào bàn; tư vấn chi tiết các món ăn và ghi nhận ghi chú; tạo đơn gọi món trực tiếp trên thiết bị cầm tay kích hoạt lệnh in Bếp tự động; phục vụ món ăn từ quầy Pass; xuất phiếu tạm tính cấn trừ tiền cọc kẹp sổ da và chuyển trạng thái bàn sang chờ dọn dẹp.
Nhân viên Điều phối
(Expediter / Checkfood)	Tác nhân chính
	Máy tính bảng cố định tại quầy Pass	Nhân viên tiếp nhận các đĩa món hoàn thiện từ nhà bếp đặt ra quầy Pass; đối chiếu hình thức trình bày và thành phần món ăn với phiếu in Bếp; bấm xác nhận hoàn thành món trên màn hình điều phối; kích hoạt thông báo tức thời đến điện thoại của nhân viên phục vụ phụ trách bàn.
Quản lý Nhà hàng
(Manager)	Tác nhân chính
	Laptop/PC	Quản lý thiết lập danh mục thực đơn, giá bán món ăn và định lượng nguyên liệu; cấu hình sơ đồ phân khu bàn ăn; theo dõi báo cáo doanh thu, tỷ lệ lấp đầy bàn và hiệu suất phục vụ thời gian thực; thực hiện phê duyệt lệnh hoàn tiền cọc thủ công ngoại lệ khi xảy ra sự cố bất khả kháng.
Quản trị viên
(System Admin)	Tác nhân chính
	Laptop/PC	Quản trị viên khởi tạo, phân bổ và quản lý danh sách tài khoản người dùng nội bộ theo mô hình phân quyền dựa trên vai trò (RBAC); thiết lập các tham số hệ thống như thời gian khóa giữ bàn, tỷ lệ thuế VAT và phí dịch vụ; giám sát nhật ký vận hành hệ thống và thực hiện sao lưu dữ liệu định kỳ.
Cổng thanh toán
(VNPAY Gateway)	Tác nhân phụ
	Hệ thống máy chủ dịch vụ thanh toán
(VNPAY Payment Server)	Tiếp nhận các yêu cầu khởi tạo giao dịch thanh toán tiền cọc trực tuyến từ Backend; cung cấp giao diện thanh toán bảo mật cho khách hàng quét mã VietQR hoặc nhập thẻ ngân hàng; gửi tín hiệu phản hồi kết quả giao dịch tức thời qua kênh IPN callback về máy chủ hệ thống; xử lý các yêu cầu hoàn trả tiền cọc theo chỉ định tự động hoặc thủ công.

1.2 Ma trận Phân quyền Chức năng (Role-Based Access Control - RBAC)
Ma trận phân quyền chi tiết thiết lập ranh giới thẩm quyền nghiêm ngặt giữa Khách hàng, Nhân viên Phục vụ, Quản lý Nhà hàng và Quản trị viên hệ thống:
Phân hệ chức năng	Chức năng chi tiết	Khách hàng	Phục vụ	Quản lý	Quản trị
Tài khoản & Phân quyền	Đăng nhập hệ thống nội bộ	✗	✓	✓	✓
	Quản lý thông tin hồ sơ nhân sự	✗	✓	✓	✓
	Quản trị tài khoản & Cấp quyền người dùng	✗	✗	✗	✓
Đặt bàn & Đặt cọc	Tra cứu sơ đồ bàn & Đặt bàn trước	✓	✓	✓	✗
	Thanh toán / Thu nhận tiền cọc giữ chỗ	✓	✓	✓	✗
	Hủy đặt bàn trước giờ hẹn từ 4 tiếng	✓	✓	✓	✗
	Phê duyệt lệnh hoàn cọc thủ công ngoại lệ	✗	✗	✓	✓
Sơ đồ bàn & Hiển thị	Theo dõi sơ đồ bàn trực quan theo thời gian thực	✗	✓	✓	✓
	Check-in khách vào bàn ăn thực tế	✗	✓	✓	✗
	Cấu hình sơ đồ mặt bằng & Quản lý mã QR bàn	✗	✗	✓	✓
	Chuyển trạng thái bàn sang sẵn sàng sau khi dọn dẹp	✗	✓	✓	✗
Gọi món & Phục vụ	Xem thực đơn qua E-Menu	✓	✓	✓	✓
	Nhân viên tạo đơn gọi món & Điều phối KDS Bếp	✗	✓	✓	✗
	Xác nhận hoàn thành món ăn tại quầy điều phối Pass	✗	Expediter: ✓	✓	✗
Hóa đơn & Doanh thu	Gửi yêu cầu tính tiền	✓	✓	✓	✗
	Xuất hóa đơn tạm tính tự động cấn trừ tiền cọc	✗	✓	✓	✗
	Xác nhận hoàn tất thanh toán & Đóng bàn	✗	✓	✓	✗
	Báo cáo thống kê doanh thu & Hiệu suất kinh doanh	✗	✗	✓	✓

 
CHƯƠNG 2: MÔ HÌNH HÓA USE CASE (USE CASE MODELING)
2.1 Sơ đồ Use Case tổng quát toàn hệ thống (Overall Use Case Diagram)

Sơ đồ Use Case tổng quát phản ánh toàn bộ 15 trường hợp sử dụng (Use Cases) được phân bổ theo 4 phân hệ chức năng chính, tương tác cùng 5 tác nhân chính (Primary Actors) và 3 tác nhân phụ/hệ thống tích hợp bên ngoài (Secondary / External Actors).

* **Tệp thiết kế sơ đồ:** [`docs/phase1/drawio/use_case_overall.drawio`](file:///d:/Doanandroid/Đồ%20án%20CDTH/VinDining/docs/phase1/drawio/use_case_overall.drawio)
* **Quy chuẩn kiến trúc:** 
  - Toàn bộ 15 Use Case nằm trọn vẹn trong ranh giới hệ thống (System Boundary: `VinDining System`).
  - Các hệ thống ngoại vi (`Cổng thanh toán VNPAY`, `Màn hình KDS Bếp`, `Hệ thống tự động - Background Worker`) được đặt ngoài biên giới hệ thống theo đúng chuẩn UML 2.5.
  - Phân tách quyền lực chặt chẽ giữa `Quản lý Nhà hàng (Manager)` và `Quản trị viên (System Admin)` (RBAC).
  - Tích hợp quan hệ mở rộng `<<extend>>` từ `UC-S1` vào `UC-U1` khi phát sinh điều kiện quá hạn khóa bàn 17 phút.

2.2 Danh mục Phân hệ & Phạm vi Use Case
* **Phân hệ Khách hàng (Guest Subsystem):** Gồm 4 Use Case (`UC-U1` đến `UC-U4`) phục vụ trải nghiệm thực khách từ đặt bàn, tra cứu thực đơn, hủy đặt chỗ đến đánh giá dịch vụ.
* **Phân hệ Nhân viên Nội bộ (Staff Subsystem):** Gồm 5 Use Case (`UC-E1` đến `UC-E5`) phục vụ nhân viên phục vụ (Waitstaff) và điều phối (Expediter) vận hành đón tiếp, gọi món, điều phối bếp và thanh toán.
* **Phân hệ Quản trị & Quản lý (Management Subsystem):** Gồm 5 Use Case (`UC-A1` đến `UC-A5`) phân định rõ quyền hạn vận hành món, sơ đồ bàn, doanh thu của Manager và quyền quản trị người dùng tối cao của System Admin.
* **Phân hệ Tác vụ Tự động (Background Processing):** Gồm `UC-S1` quét nền chu kỳ 1 phút để giải phóng bàn ăn hết hạn giữ cọc.

2.3 Đặc tả chi tiết 15 Use Case hệ thống 
Phần này cung cấp bảng đặc tả chuẩn kỹ thuật phần mềm cho toàn bộ 15 Use Case của dự án, bao gồm bảng thuộc tính, luồng sự kiện chính và các luồng xử lý ngoại lệ theo đúng nguyên tắc không sử dụng các tiền tố viết tắt.
2.3.1 Phân hệ Khách hàng
Đặc tả UC-U1: Đặt bàn trực tuyến & Đặt cọc giữ chỗ
Mã Use Case	UC-U1
Tên Use Case	Đặt bàn trực tuyến & Đặt cọc giữ chỗ \
Tác nhân tham gia	Khách hàng (Chính), Cổng thanh toán VNPAY (Phụ), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have)
Mối quan hệ	Bao gồm tương tác cổng VNPAY để thanh toán; Mở rộng tác vụ nền giải phóng bàn UC-S1 khi quá hạn giữ chỗ 17 phút
Mục tiêu chức năng	Cho phép khách hàng truy cập website, tra cứu sơ đồ bàn theo thời gian thực, lựa chọn thời điểm và vị trí bàn mong muốn, sau đó thanh toán tiền cọc cố định qua VNPAY để xác nhận giữ chỗ chắc chắn.
Điều kiện tiên quyết	Khách hàng truy cập hệ thống website đặt chỗ; sơ đồ mặt bằng bàn ăn của nhà hàng đang trong trạng thái hoạt động.
Điều kiện kết thúc	Vị trí bàn ăn chuyển sang trạng thái Đã đặt chỗ (Reserved); hệ thống ghi nhận khoản cọc thành công và tự động gửi mã đặt bàn BookingCode kèm chi tiết xác nhận đến khách hàng.

Luồng chính:
1.	Khách chọn Ngày, Ca, Số khách và Khu vực (VIP, Sảnh, Ban công).
2.	Hệ thống hiển thị các bàn trống theo thời gian thực.
3.	Khách nhập Họ tên, SĐT, Email, ghi chú (nếu có) và bấm xác nhận đặt cọc.
4.	Hệ thống khóa bàn 17 phút (15 phút hạn QR + 2 phút ân hạn) và chuyển sang VNPAY.
5.	Khách quét VietQR hoặc nhập thông tin thẻ trong 15 phút.
6.	VNPAY gửi tín hiệu IPN xác nhận thanh toán thành công về hệ thống.
7.	Hệ thống chuyển bàn sang Reserved, tạo mã BookingCode và gửi SMS/Email xác nhận.
Luồng ngoại lệ:
2a. Hết bàn hoặc hết khung giờ: Hệ thống gợi ý giờ/khu vực khác; khách chọn lại hoặc dừng.
3a. Thiếu hoặc sai định dạng SĐT/Email: Hệ thống báo lỗi tại ô nhập và chặn thanh toán.
5a. Hủy hoặc lỗi thanh toán: Giữ khóa bàn nếu còn trong 17 phút để khách thao tác lại.
5b. Quá 17 phút chưa thanh toán: Hệ thống hủy phiên đặt, trả bàn về Available.
6a. Thanh toán thành công trễ (>17 phút) khi bàn đã có bên khác đặt: hoàn 100% cọc.
7a. Lỗi gửi SMS/Email: Đẩy vào hàng đợi gửi bù; hiển thị trực tiếp BookingCode trên màn hình.

Đặc tả UC-U2: Yêu cầu phục vụ thông qua QR menu
Mã Use Case	UC-U2
Tên Use Case	Yêu cầu phục vụ thông qua QR menu (Guest Service Request via QR-Menu)
Tác nhân tham gia	Khách hàng (Chính), Nhân viên Phục vụ (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have)
Mối quan hệ	Độc lập; Tương tác thời gian thực với thiết bị POS của Nhân viên Phục vụ qua SignalR Hub
Mục tiêu chức năng	Cho phép khách hàng đang ngồi dùng bữa quét mã QR tại bàn để truy cập QR-Menu, tra cứu thực đơn và gửi các yêu cầu phục vụ tức thời (gọi nhân viên hỗ trợ, châm thêm nước/rượu vang, đổi dao nĩa/đĩa mới, yêu cầu in phiếu tạm tính thanh toán) trực tiếp đến nhân viên phục vụ phụ trách.
Điều kiện tiên quyết	Khách hàng đã ngồi tại bàn ăn thực tế có gắn mã QR định danh bàn đang hoạt động trong ca phục vụ.
Điều kiện kết thúc	Yêu cầu phục vụ được lưu trữ an toàn vào cơ sở dữ liệu ở trạng thái Chờ xử lý (Pending) và phát thông báo tức thời qua SignalR tới thiết bị POS của nhân viên phục vụ; nhân viên tiếp nhận, xử lý trực tiếp tại bàn và xác nhận hoàn tất.
Luồng chính:
1.	Khách hàng quét mã QR gắn cố định tại bàn bằng điện thoại cá nhân (hoặc sử dụng tablet của nhà hàng) để mở ứng dụng QR-Menu trên trình duyệt web.
2.	Hệ thống tải thông tin định danh bàn ăn, danh mục thực đơn ẩm thực và trung tâm yêu cầu dịch vụ tại bàn.
3.	Khách hàng lựa chọn dịch vụ cần yêu cầu: Gọi nhân viên phục vụ, Châm thêm nước/rượu vang, Thay mới dụng cụ ăn (dao nĩa/đĩa), hoặc Yêu cầu thanh toán (kèm ghi chú yêu cầu riêng nếu có).
4.	Khách hàng nhấn nút Gửi yêu cầu phục vụ trên giao diện QR-Menu.
5.	Hệ thống xác thực mã bàn, lưu bản ghi yêu cầu vào cơ sở dữ liệu ở trạng thái Chờ xử lý (Pending).
6.	Hệ thống gửi thông báo đẩy thời gian thực qua SignalR Hub kèm chuông cảnh báo tới thiết bị POS di động của nhân viên phục vụ phụ trách khu vực.
7.	Giao diện QR-Menu trên điện thoại của khách hàng hiển thị thông báo đã gửi yêu cầu thành công và chuyển trạng thái sang Đang xử lý.
8.	Nhân viên phục vụ tiếp nhận thông báo trên POS, đến bàn đáp ứng yêu cầu cho khách và nhấn Xác nhận hoàn tất hỗ trợ.
Luồng ngoại lệ:
•	1a. Khách quét mã QR của bàn chưa kích hoạt check-in hoặc ngoài giờ phục vụ: Hệ thống hiển thị thông báo bàn chưa sẵn sàng và hướng dẫn liên hệ trực tiếp nhân viên sảnh.
•	4a. Cùng một bàn gửi yêu cầu lặp lại trong vòng 60 giây: Hệ thống hiển thị cảnh báo yêu cầu trước đó đang được xử lý nhằm tránh trùng lặp.
•	6a. Kết nối SignalR tạm thời gián đoạn: Hệ thống tự động lưu yêu cầu vào hàng đợi CSDL và kích hoạt cơ chế gửi lại ngay khi khôi phục kết nối.

Đặc tả UC-U3: Hủy đặt bàn trực tuyến & Hoàn cọc tự động 
Mã Use Case	UC-U3
Tên Use Case	Hủy đặt bàn trực tuyến & Hoàn cọc tự động
Tác nhân tham gia	Khách hàng (Chính), Cổng thanh toán VNPAY (Phụ), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Bao gồm tương tác cổng VNPAY để xử lý lệnh hoàn tiền cọc tự động qua API
Mục tiêu chức năng	Cho phép khách hàng chủ động hủy lịch đặt bàn trực tuyến trên hệ thống website; hệ thống tự động kiểm tra mốc thời gian đối chiếu chính sách để thực hiện hoàn tiền hoặc phạt cọc hoàn toàn tự động.
Điều kiện tiên quyết	Khách hàng sở hữu một mã đặt bàn BookingCode đang ở trạng thái hợp lệ Đã đặt chỗ (Reserved).
Điều kiện kết thúc	Trạng thái lịch đặt bàn chuyển sang Đã hủy (Cancelled); vị trí bàn ăn được giải phóng về trạng thái Sẵn sàng (Available); giao dịch hoàn tiền hoặc giữ cọc được ghi nhận vào hệ thống.

Luồng chính:
1.	Khách truy cập trang Tra cứu đặt bàn, nhập Số điện thoại và mã BookingCode.
2.	Hệ thống hiển thị chi tiết lịch hẹn cùng nút Hủy đặt bàn.
3.	Khách bấm Hủy đặt bàn và xác nhận điều khoản.
4.	Hệ thống kiểm tra khoảng cách thời gian đến giờ hẹn.
5.	Khi thời gian còn từ 4 tiếng trở lên, hệ thống gọi API VNPAY hoàn tiền cọc cho khách.
6.	Hệ thống chuyển trạng thái đặt bàn sang Cancelled và trả bàn về Available.
7.	Hệ thống gửi SMS/Email xác nhận hủy bàn kèm chứng từ hoàn tiền cho khách.
Luồng ngoại lệ:
•	1a. Khi sai Số điện thoại hoặc mã BookingCode, hệ thống báo không tìm thấy lịch hẹn và yêu cầu kiểm tra lại.
•	5a. Khi thời gian đến giờ hẹn dưới 4 tiếng, hệ thống cảnh báo mất toàn bộ tiền cọc; sau khi khách xác nhận, hệ thống hủy lịch hẹn, giữ lại tiền cọc và trả bàn về Available.

Đặc tả UC-U4: Gửi đánh giá và phản hồi chất lượng dịch vụ
Mã Use Case	UC-U4
Tên Use Case	Gửi đánh giá và phản hồi chất lượng dịch vụ
Tác nhân tham gia	Khách hàng (Chính), Hệ thống quản trị (Phụ)
Mức độ ưu tiên	Bổ sung (Could Have - Giá trị gia tăng)
Mối quan hệ	Độc lập (Kênh thu thập khảo sát mức độ hài lòng khách hàng sau trải nghiệm ẩm thực)
Mục tiêu chức năng	Thu thập ý kiến đánh giá định lượng và đóng góp chất lượng từ khách hàng sau bữa ăn.
Điều kiện tiên quyết	Khách hàng đã dùng bữa xong và hoàn tất thủ tục thanh toán hóa đơn.
Điều kiện kết thúc	Dữ liệu khảo sát và chấm điểm được lưu trữ an toàn vào cơ sở dữ liệu và hiển thị trên bảng điều khiển thống kê của Quản lý.
Luồng chính:
1.	Khách quét mã QR trên hóa đơn hoặc bấm liên kết đánh giá trong email cảm ơn.
2.	Khách chấm điểm 1–5 sao cho các hạng mục: món ăn, không gian và phục vụ.
3.	Khách nhập ý kiến phản hồi (nếu có) và bấm Gửi đánh giá.
4.	Hệ thống lưu kết quả đánh giá và cập nhật chỉ số hài lòng (CSAT) lên trang quản trị.

2.3.2 Phân hệ Nhân viên Nội bộ
Đặc tả UC-E1: Nhân viên tạo Order
Mã Use Case	UC-E1
Tên Use Case	Nhân viên tạo Order trực tiếp & Điều phối KDS Bếp
Tác nhân tham gia	Nhân viên Phục vụ (Chính), Màn hình KDS Bếp (Phụ), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Bao gồm Use Case cơ sở Đăng nhập UC-E5; Bao gồm tương tác Màn hình KDS Bếp
Mục tiêu chức năng	Cho phép nhân viên phục vụ đứng tại bàn tiếp nhận yêu cầu gọi món từ thực khách, ghi nhận và nhập đơn hàng trên thiết bị di động.
Điều kiện tiên quyết	Vị trí bàn ăn đã được check-in ở trạng thái Đang phục vụ (Occupied) và khách hàng đã hoàn thành việc chọn món.
Điều kiện kết thúc	Đơn hàng mới được tạo thành công ở trạng thái Đang chế biến (Processing); 

Luồng chính:
1.	Khách báo danh sách món cho nhân viên phục vụ.
2.	Nhân viên mở Web POS trên thiết bị cầm tay và chọn bàn tương ứng.
3.	Nhân viên chọn món vào đơn, nhập ghi chú theo yêu cầu.
4.	Nhân viên kiểm tra đơn và bấm Gửi Bếp.
5.	Hệ thống tạo đơn hàng với trạng thái Processing và bắt đầu tính thời gian phục vụ.
6.	Hệ thống gửi dữ liệu qua SignalR để hiển thị vé món lên màn hình KDS của trạm bếp liên quan kèm số bàn, thời gian SLA.
Luồng ngoại lệ:
•	6a. Khi khách gọi thêm món, nhân viên mở lại bàn trên POS để thêm món mới; hệ thống gộp vào đơn hiện tại.

Đặc tả UC-E2: Phục vụ món & Xác nhận hoàn thành tại quầy Pass 
Mã Use Case	UC-E2
Tên Use Case	Phục vụ món & Xác nhận hoàn thành tại quầy Pass
Tác nhân tham gia	Nhân viên Điều phối / Checkfood (Chính), Nhân viên Phục vụ (Phụ), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Bao gồm UC-E5
Mục tiêu chức năng	Nhân viên Checkfood tại quầy Pass tiếp nhận món ăn hoàn thành từ đầu bếp, kiểm tra tiêu chuẩn chất lượng, bấm xác nhận hoàn thành trên thiết bị để kích hoạt thông báo điều phối nhân viên.
Điều kiện tiên quyết	Món ăn đã được nhà bếp hoàn thành chế biến và chuyển ra đặt tại quầy Pass.
Điều kiện kết thúc	Trạng thái món ăn chuyển sang Đã phục vụ (Served); hệ thống lưu mốc thời gian hoàn thành thực tế và gửi tín hiệu thông báo phục vụ.

Luồng chính:
1.	Đầu bếp hoàn thành món, đặt ra quầy Pass.
2.	Expediter đối chiếu món ăn với thông tin trên màn hình điều phối và kiểm tra.
3.	Expediter bấm Xác nhận hoàn thành (Served) trên giao diện quầy Pass.
4.	Hệ thống chuyển trạng thái món sang Served, ghi nhận thời gian hoàn thành và gửi thông báo qua SignalR tới thiết bị của nhân viên phục vụ.
5.	Expediter giao món cho nhân viên phục vụ mang ra bàn cho khách.
Luồng ngoại lệ:
3a. Khi món làm sai yêu cầu hoặc chưa xử lý đúng, Expediter từ chối xác nhận và yêu cầu bếp làm lại.

Đặc tả UC-E3: Thanh toán, Cấn trừ tiền cọc & Đóng bàn 
Mã Use Case	UC-E3
Tên Use Case	Thanh toán, Cấn trừ tiền cọc & Đóng bàn 
Tác nhân tham gia	Nhân viên Phục vụ (Chính), Khách hàng (Chính), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Bao gồm UC-E5; Áp dụng BR-03
Mục tiêu chức năng	Tự động tổng hợp chi phí toàn bộ món ăn thực tế đã dùng,, tự động cấn trừ chính xác số tiền cọc đã thu trước đó, xuất hóa đơn tạm tính và đóng bàn phục vụ.
Điều kiện tiên quyết	Vị trí bàn ăn đang ở trạng thái Đang phục vụ (Occupied) và toàn bộ các món ăn đã được xác nhận hoàn thành (Served).
Điều kiện kết thúc	Hóa đơn được thanh toán thành công; đơn hàng được đóng lại; trạng thái bàn ăn chuyển sang Chờ dọn dẹp (Cleaning) và sau đó về Sẵn sàng (Available).

Luồng chính:
1.	Khách yêu cầu thanh toán trực tiếp với nhân viên hoặc bấm nút trên E-Menu qua QR.
2.	Nhân viên mở giao diện thanh toán của bàn trên ứng dụng POS.
3.	Hệ thống tính tiền.
4.	Hệ thống in phiếu tạm tính tại quầy; nhân viên mang phiếu ra bàn cho khách đối chiếu.
5.	Khách thanh toán phần tiền chênh lệch bằng tiền mặt, thẻ POS hoặc quét VietQR trên phiếu.
6.	Nhân viên bấm Xác nhận thanh toán trên ứng dụng.
7.	Hệ thống lưu hóa đơn và chuyển trạng thái bàn sang Cleaning.

Đặc tả UC-E4: Đổi bàn / Chuyển bàn phục vụ 
Mã Use Case	UC-E4
Tên Use Case	Đổi bàn / Chuyển bàn phục vụ 
Tác nhân tham gia	Nhân viên Phục vụ (Chính), Quản lý (Phụ)
Mức độ ưu tiên	Quan trọng (Should Have - Rất cần thiết)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5
Mục tiêu chức năng	Cho phép nhân viên phục vụ chuyển toàn bộ đơn hàng từ bàn hiện tại sang một bàn ăn trống khác khi khách hàng có nhu cầu thay đổi chỗ ngồi.
Điều kiện tiên quyết	Bàn ăn ban đầu đang ở trạng thái Đang phục vụ (Occupied); vị trí bàn mới mong muốn chuyển đến phải ở trạng thái Sẵn sàng (Available).
Điều kiện kết thúc	Toàn bộ dữ liệu đơn hàng được di chuyển sang bàn mới; bàn ăn cũ chuyển trạng thái sang Chờ dọn dẹp (Cleaning); bàn ăn mới chuyển sang Đang phục vụ (Occupied).

Luồng chính:
1.	Khách yêu cầu đổi sang bàn khác.
2.	Nhân viên chọn chức năng Đổi bàn tại bàn hiện tại.
3.	Hệ thống hiển thị sơ đồ các bàn đang trống trong cùng ca phục vụ.
4.	Nhân viên chọn bàn mới và bấm Xác nhận chuyển bàn.
5.	Hệ thống chuyển toàn bộ đơn hàng sang bàn mới.
6.	Hệ thống đổi bàn cũ sang Cleaning, bàn mới sang Occupied và cập nhật sơ đồ bàn tới quầy Pass.
Luồng ngoại lệ:
4a. Khi khách muốn gộp bàn, nhân viên dùng chức năng Ghép bàn để liên kết các bàn thành một nhóm và hợp nhất hóa đơn.

Đặc tả UC-E5: Đăng nhập & Xác thực hệ thống nội bộ
Mã Use Case	UC-E5
Tên Use Case	Đăng nhập & Xác thực hệ thống nội bộ
Tác nhân tham gia	Nhân viên Phục vụ, Điều phối viên, Quản lý, Quản trị viên (Chính)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Base Use Case
Mục tiêu chức năng	Cung cấp cơ chế xác thực danh tính và phân quyền truy cập dựa trên vai trò cho toàn bộ cán bộ nhân viên nhà hàng.
Điều kiện tiên quyết	Tài khoản nhân sự đã được Quản trị viên khởi tạo và cấp quyền trên hệ thống.
Điều kiện kết thúc	Người dùng được cấp mã thông báo JWT Bearer Token hợp lệ và được điều hướng tới giao diện màn hình làm việc tương ứng với quyền hạn.

Luồng chính:
1.	Nhân viên truy cập trang Đăng nhập trên máy tính hoặc thiết bị di động.
2.	Nhân viên nhập Tên đăng nhập/Email và Mật khẩu.
3.	Nhân viên bấm Đăng nhập.
4.	Hệ thống xác thực tài khoản và kiểm tra trạng thái kích hoạt.
5.	Hệ thống cấp mã token JWT theo vai trò (Roles) và chuyển hướng tới màn hình làm việc tương ứng.
Luồng ngoại lệ:
•	4a. Khi sai thông tin đăng nhập, hệ thống hiển thị cảnh báo lỗi và yêu cầu nhập lại.
•	4b. Khi nhập sai mật khẩu quá 5 lần liên tiếp, hệ thống tạm khóa tài khoản trong 15 phút.
•	5a. Khi token JWT hết hạn, hệ thống tự động làm mới phiên làm việc hoặc chuyển về trang đăng nhập.
2.3.3 Phân hệ Quản lý & Quản trị
Đặc tả UC-A1: Quản trị Danh mục & Thực đơn món ăn 
Mã Use Case	UC-A1
Tên Use Case	Quản trị Danh mục & Thực đơn món ăn 
Tác nhân tham gia	Quản lý Nhà hàng (Chính), Quản trị viên (Phụ)
Mức độ ưu tiên	Quan trọng (Should Have - Rất cần thiết)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5
Mục tiêu chức năng	Cung cấp công cụ cho Quản lý thêm mới, chỉnh sửa, cập nhật giá bán, hình ảnh và quản lý trạng thái Còn món hoặc Hết món cho toàn bộ thực đơn ẩm thực.
Điều kiện tiên quyết	Quản lý đã đăng nhập thành công vào hệ thống với quyền hạn phù hợp.
Điều kiện kết thúc	Thông tin thực đơn được cập nhật đồng bộ trong cơ sở dữ liệu và hiển thị tức thời trên các thiết bị, ứng dụng phục vụ.

Luồng chính:
1.	Quản lý truy cập mục Quản lý thực đơn trên trang quản trị.
2.	Hệ thống hiển thị danh sách món ăn theo từng danh mục.
3.	Quản lý chọn Thêm món mới hoặc chọn món hiện có để Chỉnh sửa.
4.	Quản lý nhập thông tin: Tên món, Mô tả, Đơn giá, Danh mục, Hình ảnh và thành phần gây dị ứng.
5.	Quản lý bấm Lưu thay đổi.
6.	Hệ thống kiểm tra dữ liệu, lưu vào cơ sở dữ liệu và đồng bộ tức thời xuống E-Menu cùng hệ thống POS.
Luồng ngoại lệ:
•	6a. Khi bếp báo hết nguyên liệu, Quản lý chuyển nhanh trạng thái Hết hàng.

Đặc tả UC-A2: Quản trị & Cấu hình Sơ đồ bàn ăn
Mã Use Case	UC-A2
Tên Use Case	Quản trị & Cấu hình Sơ đồ bàn ăn
Tác nhân tham gia	Quản lý Nhà hàng (Chính), Quản trị viên (Phụ)
Mức độ ưu tiên	Quan trọng (Should Have - Rất cần thiết)
Mối quan hệ	Bao gồm UC-E5
Mục tiêu chức năng	Quản lý thiết lập bố cục không gian bàn ăn trực quan theo từng phân khu.
Điều kiện tiên quyết	Quản lý đã đăng nhập thành công với quyền quản trị.
Điều kiện kết thúc	Bố cục sơ đồ mặt bằng bàn ăn được lưu trữ an toàn và đồng bộ hóa tức thời qua SignalR tới ứng dụng di động của toàn bộ nhân viên.

• Luồng chính:
1.	Quản lý mở giao diện Quản lý sơ đồ bàn trên trang quản trị.
2.	Hệ thống hiển thị mặt bằng thiết kế dạng 2D Canvas.
3.	Quản lý chọn khu vực (hoặc tạo mới), kéo thả vị trí bàn, chỉnh sửa tên bàn, sức chứa và hướng xoay.
4.	Quản lý gán mã thiết bị Digital Display cho vị trí bàn tương ứng.
5.	Quản lý bấm Lưu cấu hình.
6.	Hệ thống kiểm tra dữ liệu, lưu vào cơ sở dữ liệu và đồng bộ sơ đồ mới tới toàn bộ thiết bị POS của nhân viên qua SignalR.
Đặc tả UC-A3: Duyệt hoàn tiền cọc thủ công ngoại lệ
Mã Use Case	UC-A3
Tên Use Case	Duyệt hoàn tiền cọc thủ công ngoại lệ
Tác nhân tham gia	Quản lý Nhà hàng (Chính), Cổng thanh toán VNPAY (Phụ), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Quan trọng (Should Have - Rất cần thiết)
Mối quan hệ	Bao gồm UC-E5;
Mục tiêu chức năng	Cho phép Quản lý xử lý hoàn lại tiền cọc cho khách hàng trong các tình huống phát sinh ngoại lệ hoặc sự cố bất khả kháng.
Điều kiện tiên quyết	Lịch đặt bàn đang ở trạng thái Đã hủy nhưng chưa được hoàn tiền cọc, hoặc có đơn khiếu nại chính đáng từ phía khách hàng.
Điều kiện kết thúc	Khoản tiền cọc được hoàn trả về tài khoản khách hàng thông qua cổng VNPAY; hệ thống lưu vết nhật ký danh tính người phê duyệt.

Luồng chính:
1.	Quản lý tra cứu mã BookingCode cần xử lý trên cổng quản trị.
2.	Hệ thống hiển thị lịch sử giao dịch cọc và lý do chưa hoàn tiền tự động.
3.	Quản lý chọn chức năng Hoàn cọc ngoại lệ (Override Refund).
4.	Quản lý nhập lý do giải trình phê duyệt và bấm xác nhận.
5.	Hệ thống gọi API sang cổng VNPAY để hoàn tiền cho khách.
6.	Hệ thống cập nhật trạng thái đặt cọc sang Đã hoàn ngoại lệ và ghi nhật ký kiểm toán (Audit Log) lưu vết người duyệt.
Luồng ngoại lệ:
•	5a. Khi kết nối API VNPAY gián đoạn, hệ thống lưu trạng thái Chờ hoàn tiền, tự động thử lại theo chu kỳ và thông báo cho Quản lý theo dõi.

Đặc tả UC-A4: Quản trị Tài khoản & Phân quyền nhân viên 
Mã Use Case	UC-A4
Tên Use Case	Quản trị Tài khoản & Phân quyền nhân viên 
Tác nhân tham gia	Quản trị viên - Admin (Chính)
Mức độ ưu tiên	Quan trọng (Should Have - Rất cần thiết)
Mối quan hệ	Bao gồm UC-E5
Mục tiêu chức năng	Quản trị viên quản lý danh sách nhân sự, khởi tạo tài khoản, phân bổ vai trò nghiệp vụ và khóa tài khoản khi nhân viên nghỉ việc.
Điều kiện tiên quyết	Quản trị viên đăng nhập với quyền hạn cao nhất trong hệ thống.
Điều kiện kết thúc	Thông tin nhân sự và quyền hạn truy cập được cập nhật chính xác và có hiệu lực ngay lập tức.

Luồng chính:
1.	Quản trị viên truy cập mục Quản lý nhân sự trên cổng quản trị.
2.	Hệ thống hiển thị danh sách nhân viên cùng vai trò tương ứng.
3.	Quản trị viên chọn Tạo tài khoản mới hoặc chọn tài khoản cần chỉnh sửa.
4.	Quản trị viên nhập Họ tên, SĐT, Email và gán vai trò: Phục vụ, Điều phối, Quản lý hoặc Quản trị viên.
5.	Quản trị viên bấm Lưu tài khoản.
6.	Hệ thống lưu dữ liệu và tự động gửi email kích hoạt kèm mật khẩu tạm thời cho nhân viên.
Luồng ngoại lệ:
•	3a. Khi nhân viên nghỉ việc, Quản trị viên chọn Khóa tài khoản; hệ thống lập tức thu hồi quyền truy cập và hủy toàn bộ phiên làm việc của tài khoản trên mọi thiết bị.

Đặc tả UC-A5: Xem Báo cáo Thống kê & Dashboard doanh thu
Mã Use Case	UC-A5
Tên Use Case	Xem Báo cáo Thống kê & Dashboard doanh thu 
Tác nhân tham gia	Quản lý Nhà hàng, Quản trị viên (Chính)
Mức độ ưu tiên	Bổ sung (Could Have - Giá trị gia tăng)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5
Mục tiêu chức năng	Cung cấp bảng điều khiển trực quan tổng hợp doanh thu, tỷ lệ lấp đầy bàn ăn, số lượng hủy cọc và xếp hạng các món ăn bán chạy nhất theo thời gian thực.
Điều kiện tiên quyết	Quản lý hoặc Quản trị viên đã đăng nhập thành công vào cổng thông tin quản trị.
Điều kiện kết thúc	Các biểu đồ phân tích và bảng số liệu thống kê được hiển thị trực quan và hỗ trợ xuất báo cáo.

Luồng chính:
1.	Quản lý truy cập mục Báo cáo thống kê trên cổng quản trị.
2.	Quản lý chọn khoảng thời gian cần xem (Ngày, Tuần, Tháng hoặc Tùy chỉnh).
3.	Hệ thống tổng hợp dữ liệu từ Hóa đơn, Đặt bàn và Đơn hàng.
4.	Hệ thống hiển thị biểu đồ biến động doanh thu, cơ cấu món bán chạy và các chỉ số vận hành chính.
5.	Quản lý có thể bấm Xuất báo cáo để tải tệp dữ liệu chi tiết (Excel/PDF).

2.3.4 Phân hệ Hệ thống Tự động
Đặc tả UC-S1: Tự động giải phóng bàn hết hạn giữ cọc
Mã Use Case	UC-S1
Tên Use Case	Tự động giải phóng bàn hết hạn giữ cọc (Auto-Release Expired Reservation Lock)
Tác nhân tham gia	Hệ thống tự động / Background Worker (Chính)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Mở rộng UC-U1 khi phát sinh quá hạn thời gian
Mục tiêu chức năng	Tiến trình chạy ngầm định kỳ quét cơ sở dữ liệu mỗi 60 giây, tự động phát hiện và hủy các phiên đặt bàn quá 17 phút mà chưa nhận được thanh toán cọc, giải phóng bàn về trạng thái sẵn sàng và đồng bộ sơ đồ qua SignalR.
Điều kiện tiên quyết	Tồn tại các bản ghi đặt bàn ở trạng thái Chờ thanh toán (PendingPayment) có thời gian khởi tạo vượt quá 17 phút.
Điều kiện kết thúc	Vị trí bàn ăn được giải phóng về trạng thái Sẵn sàng (Available); phiên đặt bàn chuyển sang Hết hạn (Expired); sơ đồ bàn trên thiết bị của nhân viên được cập nhật màu sắc thời gian thực.

Luồng chính:
1.	Background Worker tự động chạy định kỳ mỗi 60 giây.
2.	Hệ thống quét cơ sở dữ liệu tìm các đơn đặt bàn Pending quá 17 phút chưa thanh toán.
3.	Hệ thống chuyển trạng thái các đơn này sang Expired_Cancelled.
4.	Hệ thống chuyển trạng thái bàn từ Locked về Available.
5.	Hệ thống gửi sự kiện qua SignalR để đồng bộ sơ đồ bàn thời gian thực tới toàn bộ nhân viên và quản lý.
6.	Hệ thống ghi nhật ký kiểm toán (Audit Log) lưu vết giải phóng bàn tự động.
Luồng ngoại lệ:
•	2a. Khi nhận IPN thành công trễ (>17 phút) mà bàn cũ đã có khách khác,hệ thống chuyển đơn sang trạng thái ngoại lệ và hoàn cọc.
 
CHƯƠNG 3: MÔ HÌNH HÓA QUY TRÌNH NGHIỆP VỤ
3.1 AD-01: Quy trình Đặt bàn trực tuyến & Đặt cọc VNPAY
 

3.2 AD-02: Quy trình Nhân viên Order trực tiếp 
3.3 AD-03: Quy trình Kiểm đồ (Checkfood) & Xác nhận hoàn thành món tại quầy Pass
3.4 AD-04: Quy trình Thanh toán, Cấn trừ tiền cọc & Đóng bàn

3.5 AD-05: Quy trình Hủy đặt bàn & Hoàn phạt tiền cọc VNPAY

3.6 AD-06: Quy trình Đăng nhập & Xác thực nhân viên nội bộ
3.7 AD-07: Quy trình Chuyển bàn / Đổi bàn phục vụ

3.8 AD-08: Quy trình Quản trị & Cấu hình Sơ đồ bàn ăn
3.9 AD-09: Quy trình Duyệt hoàn cọc thủ công ngoại lệ

3.10 AD-10: Quy trình Tự động quét & Giải phóng bàn hết hạn giữ cọc

3.11 AD-11: Quy trình Quản trị Thực đơn & Trạng thái món
3.12 AD-12: Quy trình Khách hàng đánh giá & Phản hồi dịch vụ CSAT
CHƯƠNG 4: MÔ HÌNH HÓA TƯƠNG TÁC HỆ THỐNG (SEQUENCE DIAGRAMS)
4.1 SD-01: Đặt bàn trực tuyến & Thanh toán cọc qua VNPAY

4.2 SD-02: Nhân viên tạo Order trực tiếp & In phiếu Bếp
4.3 SD-03: Kiểm đồ (Checkfood) & Xác nhận hoàn thành món tại quầy Pass
4.4 SD-04: Thanh toán hóa đơn, Cấn trừ cọc & Đóng bàn
4.5 SD-05: Hủy đặt bàn & Hoàn tiền cọc VNPAY

4.6 SD-06: Đăng nhập & Xác thực JWT Token nhân viên nội bộ

4.7 SD-07: Chuyển bàn / Đổi bàn trực tiếp tại nhà hàng
4.8 SD-08: Quản trị & Cấu hình Sơ đồ bàn ăn
4.9 SD-09: Quản lý duyệt hoàn tiền cọc thủ công ngoại lệ
4.10 SD-10: Tự động giải phóng bàn hết hạn giữ cọc & Xử lý Late IPN
4.11 SD-11: Quản trị Thực đơn & Cập nhật trạng thái Còn/Hết món
4.12 SD-12: Khách hàng đánh giá dịch vụ & Tự động gửi Email CSAT

CHƯƠNG 5: QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES MATRIX)
Các quy tắc nghiệp vụ cốt lõi (Core Business Rules) đóng vai trò định hình logic vận hành và được đóng gói trực tiếp bên trong các thực thể nghiệp vụ tầng Domain. Điều này bảo đảm các quy tắc tài chính, thời gian khóa giữ chỗ và quyền hạn xác nhận món ăn không bị phá vỡ bởi bất kỳ thay đổi nào từ tầng giao diện hay cơ sở dữ liệu.
Mã quy tắc	Tên quy tắc	Nội dung logic nghiệp vụ bắt buộc	Tầng kiểm soát
BR-01	Thời hạn giữ cọc tạm thời
(Reservation Lock Timeout)	Khi khách hàng lựa chọn vị trí bàn và nhấn nút đặt cọc, hệ thống kích hoạt cơ chế khóa giữ chỗ tạm thời trên sơ đồ mặt bằng trong thời gian tối đa 17 phút (bao gồm 15 phút thời hạn thanh toán mã QR VNPAY cộng thêm 02 phút ân hạn trễ mạng). Quá thời hạn 17 phút nếu không nhận được tín hiệu xác nhận thanh toán thành công (IPN) từ cổng VNPAY, hệ thống dịch vụ nền sẽ tự động giải phóng vị trí bàn ăn về trạng thái Sẵn sàng đón khách.	Dịch vụ nền chạy ngầm
(Hangfire Background Worker)
BR-02	Công thức tính Hóa đơn chuẩn
(Financial Calculation Formula)	Hệ thống áp dụng công thức tính toán tài chính bắt buộc theo trình tự tuần tự:
1. Tổng tiền món dùng thực tế (Subtotal) bằng tổng giá trị các món ăn đã phục vụ.
2. Phí phục vụ (5%) bằng Subtotal nhân với 0.05.
3. Thuế VAT (10%) bằng tổng của Subtotal và Phí phục vụ nhân với 0.10.
4. Số tiền phải thu bằng tổng chi phí bữa ăn trừ đi số tiền cọc đã nộp, với điều kiện giá trị tối thiểu bằng 0 đồng (không hoàn lại phần chênh lệch khi tổng chi phí thấp hơn tiền cọc tối thiểu).	Tầng Dịch vụ Ứng dụng &
Thực thể Nghiệp vụ Miền (Domain)
BR-03	Thẩm quyền xác nhận phục vụ
(Service Confirmation Privilege)	Chỉ có tài khoản thuộc vai trò Nhân viên Điều phối (Expediter / Checkfood) tại quầy Pass hoặc Quản lý nhà hàng (Manager) mới có quyền bấm nút xác nhận hoàn thành món ăn trên thiết bị điều phối. Đầu bếp và Khách hàng hoàn toàn không được phân quyền thực hiện thao tác này nhằm bảo đảm quy trình kiểm soát chất lượng độc lập và ngăn chặn tình trạng báo khống tiến độ phục vụ.	Tầng Phân quyền Xác thực Token
(Backend JWT Role Authorization)
BR-04	Chính sách hủy bàn & Hoàn cọc
(Cancellation & Refund Policy)	Khách hàng được hoàn trả tự động 100% số tiền cọc qua cổng thanh toán VNPAY nếu thực hiện thao tác hủy đặt bàn trước giờ hẹn dùng bữa tối thiểu từ 04 tiếng trở lên. Mọi giao dịch hủy lịch hẹn trong vòng dưới 04 tiếng sẽ bị giữ lại toàn bộ số tiền cọc làm phí bồi hoàn chuẩn bị nguyên liệu tươi sống. Quản lý có thẩm quyền đặc cách sử dụng tính năng duyệt hoàn cọc thủ công trong các tình huống bất khả kháng.	Tầng Dịch vụ Ứng dụng &
Tích hợp Cổng thanh toán VNPAY
 
CHƯƠNG 6: MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU (RTM MATRIX)
Mã Y/C	Tên yêu cầu nghiệp vụ	Use Case	Activity	Sequence	Quy tắc
REQ-01	Đặt bàn trực tuyến & Đặt cọc VNPAY	UC-U1	AD-01	SD-01	BR-01, BR-05
REQ-02	Yêu cầu phục vụ qua QR-Menu	UC-U2	AD-02	SD-02	BR-02
REQ-03	Hủy đặt bàn trực tuyến & Hoàn cọc tự động	UC-U3	AD-05	SD-05	BR-05
REQ-04	Khách hàng đánh giá chất lượng dịch vụ	UC-U4	AD-12	SD-12	BR-03
REQ-05	Nhân viên tạo Order trực tiếp & In phiếu Bếp	UC-E1	AD-02	SD-02	BR-04
REQ-06	Phục vụ món & Xác nhận hoàn thành tại Pass	UC-E2	AD-03	SD-03	BR-04
REQ-07	Xuất hóa đơn, Cấn trừ tiền cọc & Đóng bàn	UC-E3	AD-04	SD-04	BR-03
REQ-08	Chuyển bàn / Đổi bàn phục vụ	UC-E4	AD-07	SD-07	BR-02
REQ-09	Đăng nhập & Xác thực tài khoản nội bộ	UC-E5	AD-06	SD-06	BR-04
REQ-10	Quản trị Danh mục & Thực đơn món ăn	UC-A1	AD-11	SD-11	BR-04
REQ-11	Quản trị & Cấu hình Sơ đồ bàn ăn	UC-A2	AD-08	SD-08	BR-02
REQ-12	Duyệt hoàn tiền cọc thủ công ngoại lệ	UC-A3	AD-09	SD-09	BR-05
REQ-13	Quản trị Tài khoản nhân viên & Phân quyền	UC-A4	AD-06	SD-06	BR-04
REQ-14	Báo cáo Thống kê Doanh thu & Dashboard	UC-A5	AD-12	SD-12	BR-03
REQ-15	Tự động quét & Giải phóng bàn hết hạn cọc	UC-S1	AD-10	SD-10	BR-01

 

