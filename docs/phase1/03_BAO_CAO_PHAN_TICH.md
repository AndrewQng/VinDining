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
CHƯƠNG 7: DANH MỤC TÀI LIỆU THAM KHẢO (REFERENCES)	57
 
CHƯƠNG 1: TỔNG QUAN TÁC NHÂN & MA TRẬN PHÂN QUYỀN (STAKEHOLDER & RBAC)
1.1 Danh mục Tác nhân Hệ thống (System Actors)
Hệ thống phân định 5 tác nhân chính thuộc nhóm người dùng trực tiếp và 2 tác nhân phụ đóng vai trò là các hệ thống dịch vụ tích hợp bên ngoài:
Tác nhân (Actor)	Phân loại	Thiết bị / Nền tảng	Phạm vi quyền hạn
Khách hàng
(Guest)	Tác nhân chính
(Primary Actor)	Điện thoại thông minh cá nhân
(Mobile Web Responsive)	Khách hàng chủ động tra cứu sơ đồ phân khu bàn ăn, chọn vị trí và đặt bàn trực tuyến; thực hiện thanh toán khoản tiền cọc cố định qua cổng thanh toán VNPAY; quét mã QR tại bàn để xem thực đơn E-Menu trên điện thoại cá nhân (BYOD) hoặc mượn Tablet dùng chung; gửi yêu cầu phục vụ hoặc thanh toán hóa đơn.
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
Phân hệ chức năng	Chức năng chi tiết	Khách hàng	Phục vụ	Quản lý
Tài khoản & Phân quyền	Đăng nhập hệ thống nội bộ	✗	✓	✓
	Quản lý thông tin hồ sơ nhân sự	✗	✓	✓
	Quản trị tài khoản & Cấp quyền người dùng	✗	✗	✗
Đặt bàn & Đặt cọc	Tra cứu sơ đồ bàn & Đặt bàn trước	✓	✓	✓
	Thanh toán tiền cọc giữ chỗ trực tuyến qua VNPAY	✓	✗	✗
	Hủy đặt bàn tự động khi trước giờ hẹn từ 4 tiếng	✓	✗	✗
	Phê duyệt lệnh hoàn cọc thủ công ngoại lệ	✗	✗	✓
Sơ đồ bàn & Hiển thị	Theo dõi sơ đồ bàn trực quan theo thời gian thực	✗	✓	✓
	Check-in khách vào bàn ăn thực tế	✗	✓	✓
	Cấu hình sơ đồ mặt bằng	✗	✗	✓
	Chuyển trạng thái bàn sang sẵn sàng sau khi dọn dẹp	✗	✓	✓
Gọi món & Phục vụ	Xem thực đơn qua E-Menu	✓	✗	✗
	Nhân viên tạo đơn gọi món	✗	✓	✓
	Xác nhận hoàn thành món ăn tại quầy điều phối Pass	✗	Expediter: ✓	✓
Hóa đơn & Doanh thu	Gửi yêu cầu tính tiền	✗	✓	✗
	Xuất hóa đơn tạm tính tự động cấn trừ tiền cọc	✗	✓	✓
	Xác nhận hoàn tất thanh toán & Đóng bàn	✗	✓	✓
	Báo cáo thống kê doanh thu & Hiệu suất kinh doanh	✗	✗	✓

 
CHƯƠNG 2: MÔ HÌNH HÓA USE CASE (USE CASE MODELING)
2.1 Sơ đồ Use Case tổng quát toàn hệ thống (Overall Use Case Diagram)
 
Hình 2.1: Sơ đồ Use Case tổng quát toàn hệ thống VinDining
2.3 Đặc tả chi tiết 15 Use Case hệ thống (Use Case Specifications)
Phần này cung cấp bảng đặc tả chuẩn kỹ thuật phần mềm cho toàn bộ 15 Use Case của dự án, bao gồm bảng thuộc tính, luồng sự kiện chính và các luồng xử lý ngoại lệ theo đúng nguyên tắc không sử dụng các tiền tố viết tắt.
2.3.1 Phân hệ Khách hàng
Đặc tả UC-U1: Đặt bàn trực tuyến & Đặt cọc giữ chỗ (Table Reservation & Deposit)
Mã Use Case	UC-U1
Tên Use Case	Đặt bàn trực tuyến & Đặt cọc giữ chỗ \
Tác nhân tham gia	Khách hàng (Chính), Cổng thanh toán VNPAY (Phụ), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have)
Mối quan hệ	Bao gồm tương tác cổng VNPAY để thanh toán; Mở rộng tác vụ nền giải phóng bàn UC-S1 khi quá hạn giữ chỗ 17 phút
Mục tiêu chức năng	Cho phép khách hàng truy cập website, tra cứu sơ đồ bàn theo thời gian thực, lựa chọn thời điểm và vị trí bàn mong muốn, sau đó thanh toán tiền cọc cố định qua VNPAY để xác nhận giữ chỗ chắc chắn.
Điều kiện tiên quyết	Khách hàng truy cập hệ thống website đặt chỗ; sơ đồ mặt bằng bàn ăn của nhà hàng đang trong trạng thái hoạt động.
Điều kiện kết thúc	Vị trí bàn ăn chuyển sang trạng thái Đã đặt chỗ (Reserved); hệ thống ghi nhận khoản cọc thành công và tự động gửi mã đặt bàn BookingCode kèm chi tiết xác nhận đến khách hàng.

• Luồng sự kiện chính tuần tự:
1.  Khách hàng truy cập giao diện đặt bàn, lựa chọn Ngày hẹn, Ca phục vụ, Số lượng khách tham dự và Khu vực bàn ăn mong muốn như Phòng VIP, Sảnh chính hoặc Ban công.
2.  Hệ thống kiểm tra trạng thái sơ đồ bàn thời gian thực và hiển thị trực quan danh sách các vị trí bàn ăn khả dụng tương ứng.
3.  Khách hàng điền thông tin liên hệ cá nhân gồm Họ tên, Số điện thoại, Email, ghi chú chi tiết các yêu cầu đặc biệt về khẩu vị hoặc cảnh báo dị ứng thực phẩm và bấm chọn xác nhận đặt cọc.
4.  Hệ thống khóa giữ chỗ tạm thời vị trí bàn đã chọn trong thời gian tối đa 17 phút (bao gồm 15 phút hiệu lực mã QR VNPAY cộng thêm 2 phút xử lý mạng), đồng thời chuyển hướng sang giao diện thanh toán của cổng VNPAY.
5.  Khách hàng thực hiện thao tác quét mã VietQR ngân hàng hoặc điền thông tin thẻ thanh toán trên cổng VNPAY trong thời hạn 15 phút.
6.  Cổng VNPAY xử lý giao dịch thành công và phát tín hiệu thông báo thanh toán tức thời (IPN callback) về máy chủ hệ thống.
7.  Hệ thống cập nhật trạng thái bàn ăn sang Đã đặt chỗ (Reserved), tự động sinh mã đặt bàn BookingCode duy nhất và gửi thông báo xác nhận thành công tới khách hàng qua tin nhắn và thư điện tử.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi khách hàng chủ động hủy thao tác thanh toán hoặc giao dịch qua VNPAY thất bại, hệ thống ghi nhận trạng thái chưa hoàn tất và hiển thị thông báo mời khách thao tác lại. Trường hợp quá thời hạn quy định mà chưa thanh toán, hệ thống tự động giải phóng vị trí bàn về trạng thái sẵn sàng đón khách.
•  Khi phát sinh phản hồi thanh toán thành công trễ từ cổng VNPAY sau khi bàn đã được giải phóng do vượt quá 17 phút, hệ thống tự động quét tìm bàn ăn trống có vị trí và sức chứa tương đương để bố trí cho khách. Nếu nhà hàng đã kín chỗ, hệ thống ghi nhận trạng thái chờ xử lý và kích hoạt cảnh báo tới Quản lý để trực tiếp liên hệ hỗ trợ đổi ngày hoặc hoàn tiền.
•  Khi toàn bộ các bàn ăn trong khung giờ hoặc phân khu mong muốn đã kín chỗ, hệ thống thông báo trạng thái hết chỗ và tự động gợi ý các khung giờ hoặc phân khu lân cận còn khả dụng.
•  Khi khách hàng thực hiện hủy đặt bàn trước giờ hẹn từ 4 tiếng trở lên, hệ thống tự động kích hoạt thủ tục hoàn lại tiền cọc qua cổng VNPAY và đưa vị trí bàn về trạng thái sẵn sàng phục vụ.
•  Khi khách hàng yêu cầu hủy đặt bàn trong vòng dưới 4 tiếng trước giờ hẹn, hệ thống ghi nhận việc hủy bàn, giải phóng bàn ăn nhưng giữ lại toàn bộ số tiền cọc theo đúng cam kết chính sách.

Đặc tả UC-U2: Xem E-Menu tại bàn (Table E-Menu)
Mã Use Case	UC-U2
Tên Use Case	Xem E-Menu tại bàn (Table E-Menu)
Tác nhân tham gia	Khách hàng (Chính)
Mức độ ưu tiên	Trọng yếu (Must Have)
Mối quan hệ	Độc lập
Mục tiêu chức năng	Cho phép khách hàng tại bàn chiêm ngưỡng hình ảnh thực đơn chất lượng cao, thành phần món ăn và cảnh báo dị ứng qua Web E-Menu trên Smartphone cá nhân (quét mã QR tại bàn) hoặc mượn Tablet dùng chung; hỗ trợ gửi yêu cầu phục vụ hoặc thanh toán kín đáo.
Điều kiện tiên quyết	Khách hàng đã ngồi tại bàn ăn thực tế tại nhà hàng.
Điều kiện kết thúc	Khách hàng nắm bắt toàn diện thông tin món ăn và sẵn sàng trao đổi trực tiếp với nhân viên phục vụ để gọi món.

• Luồng sự kiện chính tuần tự:
1.  Khách hàng ngồi vào vị trí bàn ăn, dùng Smartphone quét mã QR định danh bàn (hoặc mượn Tablet dùng chung từ nhân viên phục vụ) để mở trang Web E-Menu.
2.  Khách hàng thực hiện thao tác lướt xem các danh mục món ăn như Khai vị, Món chính, Tráng miệng, Đồ uống và khám phá câu chuyện ẩm thực cùng hình ảnh chất lượng cao.
3.  Khách hàng tham khảo kỹ lưỡng các thông tin cảnh báo dị ứng thực phẩm và bảng thành phần đính kèm cho từng món ăn.
4.  Khách hàng thảo luận cùng những người đi cùng và đưa ra quyết định lựa chọn món ăn.
5.  Khách hàng trao đổi trực tiếp nguyện vọng gọi món với nhân viên phục vụ đang túc trực tại phân khu để nhân viên tạo đơn; trong bữa ăn, khách có thể nhấn nút gửi yêu cầu phục vụ hoặc yêu cầu thanh toán trên E-Menu.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi khách hàng không mang theo điện thoại thông minh hoặc điện thoại hết pin, nhân viên phục vụ chủ động cung cấp Tablet từ kho dùng chung (Floating Pool) hoặc cuốn thực đơn bìa da truyền thống cho khách.

Đặc tả UC-U3: Hủy đặt bàn trực tuyến & Hoàn cọc tự động (Cancel Reservation & Refund)
Mã Use Case	UC-U3
Tên Use Case	Hủy đặt bàn trực tuyến & Hoàn cọc tự động (Cancel Reservation & Refund)
Tác nhân tham gia	Khách hàng (Chính), Cổng thanh toán VNPAY (Phụ), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Bao gồm (include) tương tác cổng VNPAY để xử lý lệnh hoàn tiền cọc tự động qua API
Mục tiêu chức năng	Cho phép khách hàng chủ động hủy lịch đặt bàn trực tuyến trên hệ thống website; hệ thống tự động kiểm tra mốc thời gian đối chiếu chính sách để thực hiện hoàn tiền hoặc phạt cọc hoàn toàn tự động.
Điều kiện tiên quyết	Khách hàng sở hữu một mã đặt bàn BookingCode đang ở trạng thái hợp lệ Đã đặt chỗ (Reserved).
Điều kiện kết thúc	Trạng thái lịch đặt bàn chuyển sang Đã hủy (Cancelled); vị trí bàn ăn được giải phóng về trạng thái Sẵn sàng (Available); giao dịch hoàn tiền hoặc giữ cọc được ghi nhận minh bạch vào hệ thống.

• Luồng sự kiện chính tuần tự:
1.  Khách hàng truy cập trang Tra cứu đặt bàn trên website, điền Số điện thoại và mã đặt bàn BookingCode đã được cấp.
2.  Hệ thống truy xuất dữ liệu, hiển thị chi tiết lịch hẹn cùng nút chức năng Hủy đặt bàn.
3.  Khách hàng nhấn nút Hủy đặt bàn và xác nhận đồng ý với các điều khoản xử lý.
4.  Hệ thống thực hiện kiểm tra chênh lệch thời gian giữa thời điểm hiện tại và giờ hẹn dùng bữa thực tế.
5.  Xác nhận thời gian còn cách giờ hẹn từ 4 tiếng trở lên, hệ thống tự động gửi yêu cầu gọi API hoàn tiền sang cổng VNPAY để hoàn lại 100% khoản cọc cho khách hàng.
6.  Hệ thống cập nhật trạng thái đặt bàn sang Đã hủy (Cancelled) và đưa trạng thái bàn ăn về Sẵn sàng đón khách (Available).
7.  Hệ thống gửi thư điện tử và tin nhắn thông báo xác nhận hủy đặt bàn cùng chứng từ hoàn tiền thành công tới khách hàng.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi khách hàng thực hiện hủy lịch đặt bàn khi thời gian còn cách giờ hẹn dưới 4 tiếng, hệ thống hiển thị thông báo cảnh báo khách hàng sẽ bị giữ lại 100% tiền cọc do vi phạm chính sách cam kết thời gian chuẩn bị nguyên liệu. Sau khi khách hàng xác nhận đồng ý, hệ thống ghi nhận trạng thái hủy bàn, giải phóng vị trí bàn về trạng thái sẵn sàng đón khách và giữ lại khoản cọc theo đúng quy định.

Đặc tả UC-U4: Gửi đánh giá và phản hồi chất lượng dịch vụ (Submit Guest Feedback & Review)
Mã Use Case	UC-U4
Tên Use Case	Gửi đánh giá và phản hồi chất lượng dịch vụ (Submit Guest Feedback & Review)
Tác nhân tham gia	Khách hàng (Chính), Hệ thống quản trị (Phụ)
Mức độ ưu tiên	Bổ sung (Could Have - Giá trị gia tăng)
Mối quan hệ	Độc lập (Kênh thu thập khảo sát mức độ hài lòng khách hàng sau trải nghiệm ẩm thực)
Mục tiêu chức năng	Thu thập ý kiến đánh giá định lượng và đóng góp chất lượng từ khách hàng sau bữa ăn nhằm nâng cao tiêu chuẩn phục vụ của nhà hàng.
Điều kiện tiên quyết	Khách hàng đã dùng bữa xong và hoàn tất thủ tục thanh toán hóa đơn.
Điều kiện kết thúc	Dữ liệu khảo sát và chấm điểm được lưu trữ an toàn vào cơ sở dữ liệu và hiển thị trên bảng điều khiển thống kê của Quản lý.

• Luồng sự kiện chính tuần tự:
1.  Khách hàng nhận thư điện tử cảm ơn kèm đường dẫn đánh giá hoặc quét mã QR khảo sát được in trên phiếu hóa đơn thanh toán.
2.  Khách hàng truy cập biểu mẫu khảo sát trực tuyến, lựa chọn mức độ hài lòng theo thang điểm từ 1 đến 5 sao cho từng hạng mục gồm chất lượng món ăn, không gian và thái độ phục vụ.
3.  Khách hàng nhập các ý kiến phản hồi chi tiết hoặc đề xuất cải tiến và nhấn nút Gửi đánh giá.
4.  Hệ thống xác thực tính hợp lệ, lưu trữ dữ liệu khảo sát vào cơ sở dữ liệu và cập nhật chỉ số đo lường mức độ hài lòng khách hàng (CSAT) trên bảng điều khiển quản trị.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi khách hàng gửi đánh giá kèm phản ánh mức độ hài lòng dưới 3 sao, hệ thống tự động gắn nhãn cảnh báo ưu tiên và chuyển tiếp thông báo đến hộp thư của Quản lý nhà hàng để kịp thời tiếp thu và xử lý.

2.3.2 Phân hệ Nhân viên Nội bộ
Đặc tả UC-E1: Nhân viên tạo Order trực tiếp & Điều phối KDS Bếp (Waitstaff Order Creation & Kitchen Dispatching)
Mã Use Case	UC-E1
Tên Use Case	Nhân viên tạo Order trực tiếp & Điều phối KDS Bếp (Waitstaff Order Creation & Kitchen Dispatching)
Tác nhân tham gia	Nhân viên Phục vụ (Chính), Màn hình KDS Bếp (Phụ), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5; Tương tác thời gian thực SignalR Hub với KDS
Mục tiêu chức năng	Cho phép nhân viên phục vụ đứng tại bàn tiếp nhận yêu cầu gọi món từ thực khách, ghi nhận cảnh báo dị ứng và nhập đơn hàng trên thiết bị di động, kích hoạt tự động điều phối vé điện tử lên màn hình KDS Bếp.
Điều kiện tiên quyết	Vị trí bàn ăn đã được check-in ở trạng thái Đang phục vụ (Occupied) và khách hàng đã hoàn thành việc chọn món.
Điều kiện kết thúc	Đơn hàng mới được tạo thành công ở trạng thái Đang chế biến (Processing); các màn hình KDS tại trạm Bếp nóng, Bếp lạnh và Quầy bar tự động hiển thị vé món kèm đồng hồ đếm ngược SLA và cảnh báo dị ứng.

• Luồng sự kiện chính tuần tự:
1.  Khách hàng trao đổi trực tiếp danh sách các món ăn và đồ uống mong muốn gọi với nhân viên phục vụ.
2.  Nhân viên phục vụ mở ứng dụng Web POS trên thiết bị di động, chọn đúng vị trí bàn ăn đang túc trực.
3.  Nhân viên tìm kiếm và thêm các món ăn vào giỏ hàng, đồng thời nhập chi tiết các ghi chú đặc biệt và cảnh báo dị ứng thực phẩm theo yêu cầu của khách hàng.
4.  Nhân viên kiểm tra lại toàn bộ danh mục đơn hàng và nhấn nút Tạo đơn & Gửi Bếp.
5.  Hệ thống khởi tạo thực thể đơn hàng mới với trạng thái Đang chế biến (Processing) và ghi nhận mốc thời gian bắt đầu.
6.  Hệ thống tự động phát tín hiệu SignalR thời gian thực đẩy vé điện tử lên màn hình KDS tại trạm Bếp tương ứng với thông tin số bàn, tên món, đồng hồ SLA và bôi đậm nội dung cảnh báo dị ứng.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi khách hàng có nhu cầu gọi bổ sung món ăn trong quá trình dùng bữa, nhân viên phục vụ thực hiện mở lại bàn ăn trên ứng dụng và tạo một lượt gọi món mới; hệ thống sẽ gom chung các món mới vào đơn hàng hiện hữu của bàn và chỉ đẩy vé chế biến cho những món vừa bổ sung lên KDS.

Đặc tả UC-E2: Phục vụ món & Xác nhận hoàn thành tại quầy Pass (Expediter Serving Confirmation)
Mã Use Case	UC-E2
Tên Use Case	Phục vụ món & Xác nhận hoàn thành tại quầy Pass (Expediter Serving Confirmation)
Tác nhân tham gia	Nhân viên Điều phối / Checkfood (Chính), Nhân viên Phục vụ (Phụ), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5
Mục tiêu chức năng	Nhân viên Checkfood tại quầy Pass tiếp nhận món ăn hoàn thành từ đầu bếp, kiểm tra tiêu chuẩn chất lượng và lưu ý dị ứng, bấm xác nhận hoàn thành trên thiết bị để kích hoạt thông báo điều phối nhân viên bưng món ra bàn.
Điều kiện tiên quyết	Món ăn đã được nhà bếp hoàn thành chế biến và chuyển ra đặt tại quầy Pass có đèn sưởi nhiệt.
Điều kiện kết thúc	Trạng thái món ăn chuyển sang Đã phục vụ (Served); hệ thống lưu mốc thời gian hoàn thành thực tế và gửi tín hiệu thông báo tức thời đến điện thoại của nhân viên phục vụ.

• Luồng sự kiện chính tuần tự:
1.  Đầu bếp nấu xong đĩa món chuẩn mực, đặt ra quầy chuyển món Pass bên dưới đèn giữ nhiệt kèm phiếu chế biến tương ứng.
2.  Nhân viên Điều phối (Expediter) tại quầy Pass kiểm tra đối chiếu đĩa món với thông tin hiển thị trên máy tính bảng điều phối, rà soát cẩn thận độ chuẩn xác của các yêu cầu loại trừ dị ứng.
3.  Nhân viên Điều phối nhấn nút Xác nhận hoàn thành món (Served) trên giao diện thiết bị tại quầy Pass.
4.  Hệ thống cập nhật trạng thái món ăn thành Đã phục vụ (Served), ghi nhận mốc thời gian hoàn thành và phát sự kiện thông báo qua SignalR làm rung nhẹ thiết bị di động của nhân viên phục vụ phụ trách bàn.
5.  Nhân viên Điều phối bàn giao đĩa món cho nhân viên phục vụ mang ra bàn đặt cho khách bằng hai tay.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi nhân viên Điều phối phát hiện đĩa món chế biến sai yêu cầu hoặc quên loại bỏ thành phần dị ứng đã ghi chú, nhân viên từ chối bấm xác nhận và yêu cầu đầu bếp lập tức chế biến lại đĩa mới.

Đặc tả UC-E3: Thanh toán, Cấn trừ tiền cọc & Đóng bàn (Checkout, Deposit Deduction & Turnover)
Mã Use Case	UC-E3
Tên Use Case	Thanh toán, Cấn trừ tiền cọc & Đóng bàn (Checkout, Deposit Deduction & Turnover)
Tác nhân tham gia	Nhân viên Phục vụ (Chính), Khách hàng (Chính), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5; Áp dụng công thức cấn trừ tiền cọc theo quy tắc tài chính BR-03
Mục tiêu chức năng	Tự động tổng hợp chi phí toàn bộ món ăn thực tế đã dùng, tính toán 5% phí phục vụ, 10% thuế VAT, tự động cấn trừ chính xác số tiền cọc đã thu trước đó, xuất hóa đơn tạm tính và đóng bàn phục vụ.
Điều kiện tiên quyết	Vị trí bàn ăn đang ở trạng thái Đang phục vụ (Occupied) và toàn bộ các món ăn đã được nhân viên điều phối xác nhận hoàn thành (Served).
Điều kiện kết thúc	Hóa đơn được thanh toán thành công; đơn hàng được đóng lại; trạng thái bàn ăn chuyển sang Chờ dọn dẹp (Cleaning) và sau đó về Sẵn sàng (Available).

• Luồng sự kiện chính tuần tự:
1.  Khách hàng thông báo yêu cầu tính tiền trực tiếp với nhân viên phục vụ hoặc nhấn nút yêu cầu thanh toán trên màn hình E-Menu.
2.  Nhân viên phục vụ mở chức năng Thanh toán bàn ăn tương ứng trên ứng dụng di động.
3.  Hệ thống tự động thực hiện tính toán tài chính tuần tự: Tổng tiền món dùng thực tế, Phí phục vụ bằng 5% tổng tiền món, Thuế VAT bằng 10% của tổng tiền món cộng phí phục vụ, và Số tiền phải thu bằng tổng chi phí trừ đi số tiền cọc đã nộp với cận dưới tối thiểu bằng 0 đồng.
4.  Hệ thống gửi lệnh in phiếu Hóa đơn tạm tính ra máy in nhiệt tại quầy thu ngân; nhân viên kẹp phiếu vào sổ da trang trọng mang ra bàn cho khách kiểm tra đối chiếu.
5.  Khách hàng kiểm tra các mục tiền và thực hiện thanh toán phần chênh lệch còn lại qua tiền mặt, thẻ POS hoặc quét mã VietQR in sẵn trên phiếu.
6.  Nhân viên phục vụ bấm nút Xác nhận hoàn tất thanh toán trên ứng dụng di động.
7.  Hệ thống lưu trữ hóa đơn tài chính cuối cùng và tự động chuyển trạng thái bàn ăn sang Chờ dọn dẹp (Cleaning) để chuẩn bị đón đợt khách kế tiếp.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi tổng chi phí bữa ăn thấp hơn số tiền cọc đã thanh toán, hệ thống tự động áp dụng chính sách tiền cọc là mức chi tiêu tối thiểu (Minimum Spend) và thiết lập số tiền phải thu bằng 0 đồng, đồng thời hiển thị thông báo để nhân viên gợi ý khách gọi thêm đồ uống hoặc món tráng miệng mang về.
•  Khi khách hàng có thắc mắc về số tiền cọc được khấu trừ, nhân viên tra cứu trực tiếp lịch sử giao dịch cọc gắn với mã BookingCode trên ứng dụng để giải thích minh bạch cho khách.

Đặc tả UC-E4: Đổi bàn / Chuyển bàn phục vụ (Change & Merge Tables)
Mã Use Case	UC-E4
Tên Use Case	Đổi bàn / Chuyển bàn phục vụ (Change & Merge Tables)
Tác nhân tham gia	Nhân viên Phục vụ (Chính), Quản lý (Phụ)
Mức độ ưu tiên	Quan trọng (Should Have - Rất cần thiết)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5
Mục tiêu chức năng	Cho phép nhân viên phục vụ chuyển toàn bộ đơn hàng và khoản tiền cọc liên kết từ bàn hiện tại sang một bàn ăn trống khác khi khách hàng có nhu cầu thay đổi chỗ ngồi.
Điều kiện tiên quyết	Bàn ăn ban đầu đang ở trạng thái Đang phục vụ (Occupied); vị trí bàn mới mong muốn chuyển đến phải đang ở trạng thái Sẵn sàng (Available).
Điều kiện kết thúc	Toàn bộ dữ liệu đơn hàng và tiền cọc được di chuyển trọn vẹn sang bàn mới; bàn ăn cũ chuyển trạng thái sang Chờ dọn dẹp (Cleaning); bàn ăn mới chuyển sang Đang phục vụ (Occupied).

• Luồng sự kiện chính tuần tự:
1.  Khách hàng đề đạt nguyện vọng chuyển sang vị trí bàn khác thuận tiện hơn.
2.  Nhân viên phục vụ chọn chức năng Đổi bàn trên ứng dụng di động đối với bàn ăn hiện tại.
3.  Hệ thống hiển thị sơ đồ mặt bằng các bàn ăn đang trống khả dụng trong cùng ca phục vụ.
4.  Nhân viên chọn vị trí bàn mới mục tiêu và nhấn nút Xác nhận chuyển bàn.
5.  Hệ thống thực thi giao dịch cơ sở dữ liệu chuyển toàn bộ đơn hàng, các món ăn và giá trị đặt cọc sang mã bàn mới.
6.  Hệ thống chuyển trạng thái bàn cũ sang Chờ dọn dẹp (Cleaning), chuyển bàn mới sang Đang phục vụ (Occupied) và gửi thông báo cập nhật sơ đồ bàn đến quầy Điều phối Pass.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi khách hàng có nhu cầu ghép thêm bạn và gộp hai bàn ăn lại với nhau, nhân viên sử dụng chức năng Ghép bàn để liên kết hai mã bàn thành một nhóm phục vụ chung và hợp nhất hóa đơn.

Đặc tả UC-E5: Đăng nhập & Xác thực hệ thống nội bộ (Staff Authentication & Authorization)
Mã Use Case	UC-E5
Tên Use Case	Đăng nhập & Xác thực hệ thống nội bộ (Staff Authentication & Authorization)
Tác nhân tham gia	Nhân viên Phục vụ, Điều phối viên, Quản lý, Quản trị viên (Chính)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Use Case nền tảng cơ sở (Base Use Case) được bao gồm bởi toàn bộ các Use Case nghiệp vụ nội bộ của hệ thống
Mục tiêu chức năng	Cung cấp cơ chế xác thực danh tính an toàn và phân quyền truy cập dựa trên vai trò cho toàn bộ cán bộ nhân viên nhà hàng.
Điều kiện tiên quyết	Tài khoản nhân sự đã được Quản trị viên khởi tạo và cấp quyền trên hệ thống.
Điều kiện kết thúc	Người dùng được cấp mã thông báo JWT Bearer Token hợp lệ và được điều hướng tới giao diện màn hình làm việc tương ứng với quyền hạn.

• Luồng sự kiện chính tuần tự:
1.  Nhân viên truy cập trang Đăng nhập hệ thống trên trình duyệt máy tính hoặc thiết bị di động.
2.  Nhân viên nhập Tên đăng nhập hoặc Email và Mật khẩu cá nhân đã được cấp.
3.  Nhân viên nhấn nút Đăng nhập.
4.  Hệ thống thực hiện kiểm tra tính hợp lệ của thông tin tài khoản và kiểm tra trạng thái kích hoạt.
5.  Hệ thống sinh mã thông báo JWT chứa thông tin định danh và danh mục quyền (Roles), sau đó điều hướng người dùng tới giao diện làm việc phù hợp.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi người dùng nhập sai mật khẩu quá 5 lần liên tiếp, hệ thống tự động tạm khóa tài khoản trong 15 phút nhằm phòng chống các cuộc tấn công dò quét mật khẩu tự động.
•  Khi mã thông báo JWT hết hạn trong phiên làm việc, hệ thống tự động yêu cầu làm mới phiên hoặc chuyển hướng người dùng về trang đăng nhập để bảo mật dữ liệu.

2.3.3 Phân hệ Quản lý & Quản trị
Đặc tả UC-A1: Quản trị Danh mục & Thực đơn món ăn (Menu & Category Management)
Mã Use Case	UC-A1
Tên Use Case	Quản trị Danh mục & Thực đơn món ăn (Menu & Category Management)
Tác nhân tham gia	Quản lý Nhà hàng (Chính), Quản trị viên (Phụ)
Mức độ ưu tiên	Quan trọng (Should Have - Rất cần thiết)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5
Mục tiêu chức năng	Cung cấp công cụ cho Quản lý thêm mới, chỉnh sửa, cập nhật giá bán, hình ảnh và quản lý trạng thái Còn món hoặc Hết món cho toàn bộ thực đơn ẩm thực.
Điều kiện tiên quyết	Quản lý đã đăng nhập thành công vào hệ thống với quyền hạn phù hợp.
Điều kiện kết thúc	Thông tin thực đơn được cập nhật đồng bộ trong cơ sở dữ liệu và hiển thị tức thời trên các thiết bị E-Menu và ứng dụng phục vụ.

• Luồng sự kiện chính tuần tự:
1.  Quản lý truy cập phân hệ Quản lý Thực đơn trên cổng thông tin quản trị.
2.  Hệ thống hiển thị danh sách toàn bộ các món ăn được phân loại theo danh mục ẩm thực.
3.  Quản lý lựa chọn thao tác Thêm món mới hoặc chọn một món hiện có để Chỉnh sửa.
4.  Quản lý nhập hoặc điều chỉnh Tên món, Mô tả câu chuyện ẩm thực, Đơn giá, Phân loại món, Đính kèm hình ảnh và khai báo chi tiết các thành phần gây dị ứng.
5.  Quản lý nhấn nút Lưu thay đổi.
6.  Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào, lưu vào cơ sở dữ liệu và phát sự kiện cập nhật thời gian thực xuống toàn bộ thiết bị hiển thị tại nhà hàng.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi nhà bếp thông báo hết nguyên liệu đột xuất trong ca phục vụ, Quản lý sử dụng chức năng Bật/Tắt trạng thái Còn hàng nhanh trên ứng dụng để ngay lập tức ẩn món ăn đó trên E-Menu của khách.

Đặc tả UC-A2: Quản trị & Cấu hình Sơ đồ bàn ăn (Floor Plan Configuration & Canvas)
Mã Use Case	UC-A2
Tên Use Case	Quản trị & Cấu hình Sơ đồ bàn ăn (Floor Plan Configuration & Canvas)
Tác nhân tham gia	Quản lý Nhà hàng (Chính), Quản trị viên (Phụ)
Mức độ ưu tiên	Quan trọng (Should Have - Rất cần thiết)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5
Mục tiêu chức năng	Quản lý thiết lập bố cục không gian bàn ăn trực quan theo từng phân khu, định vị tọa độ hiển thị 2D và quản lý mã QR định danh bàn ăn.
Điều kiện tiên quyết	Quản lý đã đăng nhập thành công với quyền quản trị sơ đồ mặt bằng.
Điều kiện kết thúc	Bố cục sơ đồ mặt bằng bàn ăn được lưu trữ an toàn và đồng bộ hóa tức thời qua SignalR tới ứng dụng di động của toàn bộ nhân viên.

• Luồng sự kiện chính tuần tự:
1.  Quản lý mở giao diện Quản trị Sơ đồ bàn trên cổng quản trị.
2.  Hệ thống hiển thị màn hình thiết kế mặt bằng trực quan dạng 2D Canvas.
3.  Quản lý lựa chọn phân khu cần thao tác hoặc tạo phân khu mới, sau đó thực hiện kéo thả vị trí bàn, điều chỉnh tên bàn, sức chứa tối đa và hướng hiển thị khớp với thực tế nhà hàng.
4.  Hệ thống tự động khởi tạo mã định danh và mã QR tương ứng với vị trí bàn ăn để phục vụ in đặt tại bàn.
5.  Quản lý kiểm tra tính hợp lý của không gian và nhấn nút Lưu cấu hình sơ đồ bàn.
6.  Hệ thống xác thực tính hợp lệ, lưu trữ các thay đổi vào cơ sở dữ liệu và tự động phát tín hiệu đồng bộ sơ đồ mới tới toàn bộ nhân viên phục vụ đang trong ca trực.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi Quản lý thực hiện thay đổi thông số sức chứa của một bàn ăn đang trong trạng thái Đang phục vụ, hệ thống sẽ đưa ra cảnh báo ngăn chặn để tránh gây sai lệch dữ liệu phục vụ hiện hành.

Đặc tả UC-A3: Duyệt hoàn tiền cọc thủ công ngoại lệ (Manager Manual Refund Override)
Mã Use Case	UC-A3
Tên Use Case	Duyệt hoàn tiền cọc thủ công ngoại lệ (Manager Manual Refund Override)
Tác nhân tham gia	Quản lý Nhà hàng (Chính), Cổng thanh toán VNPAY (Phụ), Hệ thống tự động (Phụ)
Mức độ ưu tiên	Quan trọng (Should Have - Rất cần thiết)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5; Tương tác API hoàn tiền cổng VNPAY
Mục tiêu chức năng	Cung cấp thẩm quyền cho Quản lý xử lý hoàn lại tiền cọc cho khách hàng trong các tình huống phát sinh ngoại lệ hoặc sự cố bất khả kháng ngoài quy tắc hoàn tiền tự động.
Điều kiện tiên quyết	Lịch đặt bàn đang ở trạng thái Đã hủy nhưng chưa được hoàn tiền cọc, hoặc có đơn khiếu nại chính đáng từ phía khách hàng.
Điều kiện kết thúc	Khoản tiền cọc được hoàn trả về tài khoản khách hàng thông qua cổng VNPAY; hệ thống lưu vết nhật ký kiểm toán danh tính người phê duyệt.

• Luồng sự kiện chính tuần tự:
1.  Quản lý tiếp nhận khiếu nại từ khách hàng và tra cứu mã đặt bàn BookingCode trên cổng quản trị.
2.  Hệ thống hiển thị chi tiết lịch sử giao dịch đặt cọc và lý do chưa được hoàn tiền tự động.
3.  Quản lý kiểm tra xác minh sự việc và bấm chọn chức năng Hoàn cọc thủ công (Override Refund).
4.  Quản lý nhập bắt buộc nội dung lý do giải trình phê duyệt hoàn tiền vào hệ thống.
5.  Hệ thống gọi API hoàn tiền sang cổng thanh toán VNPAY để thực hiện chuyển khoản lại cho khách hàng.
6.  Hệ thống cập nhật trạng thái đơn đặt cọc thành Đã hoàn cọc ngoại lệ và tự động ghi nhật ký kiểm toán (Audit Log) lưu vết mã định danh của Quản lý đã ký duyệt.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi kết nối API hoàn tiền sang cổng VNPAY gặp trục trặc mạng gián đoạn, hệ thống ghi nhận trạng thái Chờ xử lý hoàn cọc và tự động thử lại định kỳ, đồng thời thông báo cho Quản lý nắm bắt tiến độ.

Đặc tả UC-A4: Quản trị Tài khoản & Phân quyền nhân viên (Account & RBAC Administration)
Mã Use Case	UC-A4
Tên Use Case	Quản trị Tài khoản & Phân quyền nhân viên (Account & RBAC Administration)
Tác nhân tham gia	Quản trị viên - Admin (Chính)
Mức độ ưu tiên	Quan trọng (Should Have - Rất cần thiết)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5
Mục tiêu chức năng	Quản trị viên quản lý danh sách nhân sự, khởi tạo tài khoản, phân bổ vai trò nghiệp vụ và khóa tài khoản khi nhân viên nghỉ việc.
Điều kiện tiên quyết	Quản trị viên đăng nhập với quyền hạn cao nhất trong hệ thống.
Điều kiện kết thúc	Thông tin nhân sự và quyền hạn truy cập được cập nhật chính xác và có hiệu lực ngay lập tức.

• Luồng sự kiện chính tuần tự:
1.  Quản trị viên truy cập phân hệ Quản lý Nhân sự trên cổng quản trị.
2.  Hệ thống hiển thị danh sách toàn bộ cán bộ nhân viên cùng vai trò được phân công.
3.  Quản trị viên nhấn nút Tạo tài khoản mới hoặc chọn tài khoản hiện có để điều chỉnh.
4.  Quản trị viên nhập thông tin nhân sự gồm Họ tên, Số điện thoại, Email và gán vai trò tương ứng gồm Phục vụ, Điều phối viên, Quản lý hoặc Quản trị viên.
5.  Quản trị viên nhấn nút Lưu tài khoản.
6.  Hệ thống tạo mã định danh, lưu trữ thông tin an toàn và tự động gửi thư điện tử kích hoạt kèm mật khẩu mặc định tới nhân viên.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi nhân viên nghỉ việc, Quản trị viên thực hiện kích hoạt chức năng Khóa tài khoản; hệ thống ngay lập tức vô hiệu hóa phiên làm việc hiện hành của tài khoản đó trên toàn bộ các thiết bị.

Đặc tả UC-A5: Xem Báo cáo Thống kê & Dashboard doanh thu (Analytics & Executive Reporting)
Mã Use Case	UC-A5
Tên Use Case	Xem Báo cáo Thống kê & Dashboard doanh thu (Analytics & Executive Reporting)
Tác nhân tham gia	Quản lý Nhà hàng, Quản trị viên (Chính)
Mức độ ưu tiên	Bổ sung (Could Have - Giá trị gia tăng)
Mối quan hệ	Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5
Mục tiêu chức năng	Cung cấp bảng điều khiển trực quan tổng hợp doanh thu, tỷ lệ lấp đầy bàn ăn, số lượng hủy cọc và xếp hạng các món ăn bán chạy nhất theo thời gian thực.
Điều kiện tiên quyết	Quản lý hoặc Quản trị viên đã đăng nhập thành công vào cổng thông tin quản trị.
Điều kiện kết thúc	Các biểu đồ phân tích và bảng số liệu thống kê được hiển thị trực quan và hỗ trợ xuất báo cáo định dạng chuẩn.

• Luồng sự kiện chính tuần tự:
1.  Quản lý chọn phân hệ Báo cáo Thống kê trên thanh điều hướng.
2.  Quản lý chọn khung thời gian cần phân tích theo Ngày, Tuần, Tháng hoặc khoảng thời gian tùy chỉnh.
3.  Hệ thống tổng hợp dữ liệu từ các phân hệ Hóa đơn, Đặt bàn và Đơn hàng trong cơ sở dữ liệu.
4.  Hệ thống hiển thị bảng điều khiển trực quan gồm biểu đồ đường biến động doanh thu, biểu đồ tròn phân bổ món ăn bán chạy và các chỉ số vận hành trọng yếu.
5.  Quản lý có thể nhấn nút Xuất báo cáo để tải tệp dữ liệu chi tiết phục vụ công tác đối soát.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi hệ thống phát hiện tỷ lệ hủy bàn hoặc không đến dùng bữa tăng cao bất thường trong một ca phục vụ, bảng điều khiển tự động hiển thị biểu tượng cảnh báo để Quản lý kịp thời rà soát nguyên nhân.

2.3.4 Phân hệ Hệ thống Tự động
Đặc tả UC-S1: Tự động giải phóng bàn hết hạn giữ cọc (Auto-Release Expired Reservation Lock)
Mã Use Case	UC-S1
Tên Use Case	Tự động giải phóng bàn hết hạn giữ cọc (Auto-Release Expired Reservation Lock)
Tác nhân tham gia	Hệ thống tự động / Background Worker (Chính)
Mức độ ưu tiên	Trọng yếu (Must Have - Bắt buộc hoàn thành)
Mối quan hệ	Mở rộng (extend) cho Use Case Đặt bàn UC-U1 khi phát sinh quá hạn thời gian
Mục tiêu chức năng	Tiến trình chạy ngầm định kỳ quét cơ sở dữ liệu mỗi 60 giây, tự động phát hiện và hủy các phiên đặt bàn quá 17 phút mà chưa nhận được thanh toán cọc, giải phóng bàn về trạng thái sẵn sàng và đồng bộ sơ đồ qua SignalR.
Điều kiện tiên quyết	Tồn tại các bản ghi đặt bàn ở trạng thái Chờ thanh toán (PendingPayment) có thời gian khởi tạo vượt quá 17 phút.
Điều kiện kết thúc	Vị trí bàn ăn được giải phóng về trạng thái Sẵn sàng (Available); phiên đặt bàn chuyển sang Hết hạn (Expired); sơ đồ bàn trên thiết bị của nhân viên được cập nhật màu sắc thời gian thực.

• Luồng sự kiện chính tuần tự:
1.  Tiến trình dịch vụ nền (Background Worker) được kích hoạt tự động theo chu kỳ mỗi 60 giây một lần.
2.  Hệ thống thực hiện truy vấn cơ sở dữ liệu để tìm kiếm tất cả các đơn đặt chỗ đang ở trạng thái Chờ thanh toán có mốc thời gian tạo đã vượt quá 17 phút.
3.  Hệ thống cập nhật trạng thái các đơn đặt chỗ thỏa mãn điều kiện sang Đã hết hạn giữ chỗ (Expired_Cancelled).
4.  Hệ thống cập nhật trạng thái các vị trí bàn ăn tương ứng từ trạng thái Khóa giữ chỗ (Locked) trở về trạng thái Sẵn sàng đón khách (Available).
5.  Hệ thống phát thông điệp sự kiện qua kênh SignalR Hub để lập tức đổi màu trạng thái bàn ăn thành màu xanh lá cây trên màn hình làm việc của toàn bộ nhân viên và quản lý.
6.  Hệ thống ghi nhận thông tin chi tiết vào nhật ký kiểm toán hệ thống để lưu vết lịch sử giải phóng bàn tự động.
• Các luồng sự kiện phụ và xử lý tình huống ngoại lệ:
•  Khi cổng VNPAY phản hồi tín hiệu thanh toán thành công nhưng bị trễ sau 17 phút và vị trí bàn cũ đã được cấp cho khách hàng khác, hệ thống tự động kích hoạt tiến trình tìm kiếm bàn trống tương đương để bố trí cho khách; trường hợp nhà hàng đã kín chỗ, hệ thống chuyển giao dịch sang trạng thái ngoại lệ và kích hoạt cảnh báo ưu tiên cao tới Quản lý để gọi điện hỗ trợ.

 
CHƯƠNG 3: MÔ HÌNH HÓA QUY TRÌNH NGHIỆP VỤ (SWIMLANE ACTIVITY DIAGRAMS)
Chương này mô hình hóa chi tiết 12 quy trình nghiệp vụ trọng yếu của hệ thống VinDining thông qua sơ đồ hoạt động phân làn (Swimlane Activity Diagrams). Mô hình phân làn giúp phân định tuyệt đối ranh giới trách nhiệm và chuỗi tương tác phối hợp tuần tự giữa Khách hàng, Nhân viên Phục vụ, Điều phối viên, Quản lý, Nhà bếp cùng các dịch vụ kỹ thuật hạ tầng.
3.1 AD-01: Quy trình Đặt bàn trực tuyến & Đặt cọc VNPAY
• Phân làn trách nhiệm tham gia: Khách hàng | Hệ thống VinDining | Cổng thanh toán VNPAY
 
Hình 3.1: Sơ đồ hoạt động Quy trình Đặt bàn trực tuyến & Đặt cọc VNPAY
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Khách hàng chủ động truy cập hệ thống website đặt chỗ, lựa chọn thời gian dùng bữa, ca phục vụ, số lượng người tham dự và phân khu bàn ăn mong muốn.
•  Hệ thống tiếp nhận thông số, thực hiện tra cứu trạng thái khả dụng trên sơ đồ mặt bằng thời gian thực và phản hồi danh sách các vị trí bàn ăn phù hợp.
•  Khách hàng điền đầy đủ thông tin định danh cá nhân, nhập các ghi chú đặc biệt hoặc lưu ý dị ứng thực phẩm và bấm chọn phương thức thanh toán tiền cọc.
•  Hệ thống thiết lập trạng thái khóa giữ chỗ tạm thời cho vị trí bàn ăn trong thời gian tối đa 17 phút và khởi tạo phiên giao dịch chuyển tiếp sang cổng VNPAY.
•  Khách hàng thực hiện thao tác quét mã VietQR hoặc nhập thông tin thanh toán trên giao diện bảo mật của cổng VNPAY trong vòng 15 phút.
•  Cổng VNPAY xử lý trừ tiền và phát tín hiệu thông báo tức thời (IPN callback) về máy chủ hệ thống VinDining.
•  Hệ thống cập nhật trạng thái bàn ăn sang Đã đặt chỗ (Reserved), lưu trữ thông tin cọc và phát thông báo xác nhận thành công tới khách hàng.

3.2 AD-02: Quy trình Nhân viên Order trực tiếp & Điều phối KDS Bếp
• Phân làn trách nhiệm tham gia: Khách hàng | Nhân viên Phục vụ (Waitstaff) | Hệ thống VinDining & Màn hình KDS Bếp
 
Hình 3.2: Sơ đồ hoạt động Quy trình Nhân viên Order trực tiếp & Điều phối KDS Bếp
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Khách hàng xem hình ảnh và chi tiết món ăn qua Web E-Menu trên điện thoại cá nhân (quét mã QR tại bàn) hoặc mượn Tablet dùng chung, sau đó trao đổi trực tiếp nguyện vọng gọi món với nhân viên phục vụ.
•  Nhân viên phục vụ mở ứng dụng di động Web POS, lựa chọn đúng số bàn đang phục vụ và thực hiện thêm các món ăn vào đơn gọi món.
•  Nhân viên ghi nhận kỹ lưỡng các cảnh báo dị ứng thực phẩm và ghi chú khẩu vị riêng biệt của từng vị khách theo từng món ăn cụ thể.
•  Nhân viên phục vụ rà soát lại toàn bộ đơn hàng và bấm chọn xác nhận Tạo đơn & Gửi Bếp trên thiết bị di động.
•  Hệ thống ghi nhận đơn hàng mới vào cơ sở dữ liệu với trạng thái Đang chế biến và tự động truyền tải vé điện tử qua SignalR đến màn hình KDS tại các trạm Bếp tương ứng.
•  Màn hình KDS tại các phân khu Bếp nóng, Bếp lạnh và Quầy bar hiển thị vé món kèm đồng hồ đếm ngược SLA và cảnh báo dị ứng được bôi đậm rõ nét.

3.3 AD-03: Quy trình Kiểm đồ (Checkfood) & Xác nhận hoàn thành món tại quầy Pass
• Phân làn trách nhiệm tham gia: Nhà bếp (Kitchen/Chef) | Điều phối viên (Expediter / Checkfood) | Hệ thống VinDining
 
Hình 3.3: Sơ đồ hoạt động Quy trình Kiểm đồ (Checkfood) & Xác nhận hoàn thành món tại quầy Pass
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Đầu bếp căn cứ theo nội dung phiếu in nhiệt để tiến hành chế biến món ăn chuẩn mực và đặt đĩa món hoàn chỉnh ra quầy chuyển món Pass dưới hệ thống đèn sưởi nhiệt.
•  Nhân viên Điều phối tại quầy Pass tiếp nhận đĩa món, đối chiếu cẩn thận hình thức trình bày và thành phần chế biến với phiếu in và thông tin trên máy tính bảng điều phối.
•  Nhân viên Điều phối kiểm tra nghiêm ngặt tính tuân thủ đối với các cảnh báo dị ứng thực phẩm của thực khách.
•  Nhân viên Điều phối nhấn nút Xác nhận hoàn thành món trên giao diện máy tính bảng tại quầy Pass theo đúng thẩm quyền được phân công.
•  Hệ thống ghi nhận trạng thái món ăn thành Đã phục vụ (Served), lưu mốc thời gian thực hiện và phát tín hiệu thông báo tức thời qua SignalR tới điện thoại của nhân viên phục vụ phụ trách bàn.
•  Nhân viên phục vụ tiếp nhận món ăn từ quầy Pass và bưng ra phục vụ tại bàn cho khách hàng bằng hai tay trang trọng.

3.4 AD-04: Quy trình Thanh toán, Cấn trừ tiền cọc & Đóng bàn
• Phân làn trách nhiệm tham gia: Khách hàng | Nhân viên Phục vụ / Thu ngân | Hệ thống VinDining
 
Hình 3.4: Sơ đồ hoạt động Quy trình Thanh toán, Cấn trừ tiền cọc & Đóng bàn
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Khách hàng đưa ra yêu cầu tính tiền bữa ăn trực tiếp với nhân viên phục vụ hoặc qua thao tác trên màn hình hiển thị tại bàn.
•  Nhân viên phục vụ mở chức năng Thanh toán bàn ăn tương ứng trên thiết bị di động cá nhân.
•  Hệ thống tự động tính toán tổng tiền món thực tế, cộng thêm 5% phí phục vụ và 10% thuế VAT, sau đó tự động cấn trừ chính xác số tiền cọc đã thanh toán từ trước.
•  Hệ thống in phiếu Hóa đơn tạm tính hiển thị minh bạch toàn bộ các dòng tiền cấn trừ ra máy in thu ngân; nhân viên kẹp phiếu vào sổ da mang ra bàn cho khách đối chiếu.
•  Khách hàng kiểm tra chứng từ và thực hiện thanh toán phần chênh lệch còn lại qua tiền mặt, thẻ POS hoặc quét mã VietQR in trên phiếu.
•  Nhân viên phục vụ bấm nút xác nhận Hoàn tất thanh toán trên ứng dụng di động.
•  Hệ thống lưu trữ hóa đơn thanh toán hoàn tất và tự động chuyển trạng thái bàn ăn sang Chờ dọn dẹp (Cleaning) để chuẩn bị đón đợt khách tiếp theo.

3.5 AD-05: Quy trình Hủy đặt bàn & Hoàn phạt tiền cọc VNPAY
• Phân làn trách nhiệm tham gia: Khách hàng / Quản lý | Hệ thống VinDining | Cổng thanh toán VNPAY
 
Hình 3.5: Sơ đồ hoạt động Quy trình Hủy đặt bàn & Hoàn phạt tiền cọc VNPAY
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Khách hàng hoặc Quản lý gửi yêu cầu hủy lịch đặt bàn qua trang tra cứu trực tuyến hoặc cổng thông tin quản trị.
•  Hệ thống tiếp nhận yêu cầu và tự động tính toán khoảng chênh lệch thời gian từ thời điểm hiện tại đến giờ hẹn dùng bữa thực tế.
•  Trường hợp thời gian hủy trước giờ hẹn từ 4 tiếng trở lên, hệ thống tự động gửi lệnh gọi API hoàn tiền 100% sang cổng thanh toán VNPAY.
•  Cổng VNPAY tiếp nhận lệnh, hoàn trả tiền cọc về tài khoản của khách và phản hồi xác nhận cho hệ thống.
•  Hệ thống cập nhật trạng thái lịch đặt bàn sang Đã hủy và giải phóng vị trí bàn ăn về trạng thái Sẵn sàng đón khách.
•  Trường hợp thời gian hủy dưới 4 tiếng trước giờ hẹn, hệ thống ghi nhận hủy lịch, đưa bàn về trạng thái sẵn sàng nhưng giữ lại toàn bộ tiền cọc làm phí phạt bồi hoàn chi phí chuẩn bị nguyên liệu.

3.6 AD-06: Quy trình Đăng nhập & Xác thực nhân viên nội bộ
• Phân làn trách nhiệm tham gia: Nhân viên nội bộ | Ứng dụng Web POS / Portal | Backend API & Cơ sở dữ liệu
 
Hình 3.6: Sơ đồ hoạt động Quy trình Đăng nhập & Xác thực nhân viên nội bộ
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Nhân viên nhập Tên đăng nhập hoặc Email và Mật khẩu cá nhân vào biểu mẫu đăng nhập hệ thống.
•  Ứng dụng thực hiện kiểm tra tính hợp lệ cơ bản của dữ liệu và gửi yêu cầu xác thực bảo mật tới máy chủ Backend API.
•  Hệ thống Backend truy vấn cơ sở dữ liệu, kiểm tra tính khớp của mật khẩu đã được mã hóa bảo mật và trạng thái hoạt động của tài khoản.
•  Hệ thống xác thực thành công, đóng gói thông tin vai trò người dùng và sinh mã thông báo JWT Bearer Token có thời hạn.
•  Ứng dụng lưu trữ token bảo mật và tự động điều hướng nhân viên tới giao diện màn hình chức năng tương ứng với vai trò được giao.

3.7 AD-07: Quy trình Chuyển bàn / Đổi bàn phục vụ
• Phân làn trách nhiệm tham gia: Nhân viên Phục vụ | Hệ thống VinDining & CSDL | Màn hình Khách & Bếp
 
Hình 3.7: Sơ đồ hoạt động Quy trình Chuyển bàn / Đổi bàn phục vụ
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Khách hàng đề đạt nguyện vọng chuyển đổi chỗ ngồi sang một khu vực hoặc vị trí bàn khác trong nhà hàng.
•  Nhân viên phục vụ mở chức năng Đổi bàn trên thiết bị di động và tra cứu danh sách các bàn ăn đang trống khả dụng.
•  Nhân viên chọn vị trí bàn mới mục tiêu và xác nhận thực hiện thao tác chuyển đổi.
•  Hệ thống thực thi giao dịch cơ sở dữ liệu chuyển toàn bộ đơn hàng, danh mục món ăn và khoản tiền cọc liên kết sang mã bàn mới.
•  Hệ thống chuyển trạng thái bàn cũ sang Chờ dọn dẹp và chuyển bàn mới sang trạng thái Đang phục vụ.
•  Hệ thống tự động phát thông báo qua SignalR cập nhật số bàn mới tới quầy điều phối Pass để nhân viên giao đúng vị trí.

3.8 AD-08: Quy trình Quản trị & Cấu hình Sơ đồ bàn ăn
• Phân làn trách nhiệm tham gia: Quản lý Nhà hàng | Hệ thống API & CSDL | Ứng dụng Nhân viên phục vụ
 
Hình 3.8: Sơ đồ hoạt động Quy trình Quản trị & Cấu hình Sơ đồ bàn ăn
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Quản lý truy cập giao diện Quản trị Sơ đồ bàn ăn trên cổng thông tin quản trị.
•  Hệ thống hiển thị không gian thiết kế mặt bằng trực quan dạng 2D Canvas tương ứng với từng phân khu nhà hàng.
•  Quản lý thực hiện thêm mới phân khu, kéo thả định vị tọa độ các bàn ăn, cập nhật sức chứa tối đa và cấu hình mã kết nối thiết bị hiển thị.
•  Quản lý nhấn nút Lưu thay đổi sơ đồ mặt bằng.
•  Hệ thống kiểm tra tính hợp lệ của cấu hình, lưu trữ dữ liệu vào cơ sở dữ liệu và phát sự kiện đồng bộ qua SignalR Hub.
•  Ứng dụng của toàn bộ nhân viên phục vụ tự động cập nhật và hiển thị giao diện sơ đồ mặt bằng mới theo thời gian thực.

3.9 AD-09: Quy trình Duyệt hoàn cọc thủ công ngoại lệ
• Phân làn trách nhiệm tham gia: Quản lý Nhà hàng | Hệ thống API & Audit Log | Cổng thanh toán VNPAY
 
Hình 3.9: Sơ đồ hoạt động Quy trình Duyệt hoàn cọc thủ công ngoại lệ
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Quản lý tiếp nhận khiếu nại hoặc thông tin sự cố bất khả kháng từ khách hàng và tra cứu mã đặt bàn BookingCode trên hệ thống.
•  Hệ thống hiển thị chi tiết lịch sử giao dịch và lý do khoản tiền cọc chưa được xử lý hoàn trả tự động.
•  Quản lý chọn chức năng Phê duyệt hoàn cọc thủ công ngoại lệ và nhập bắt buộc lý do giải trình phê duyệt.
•  Hệ thống gửi yêu cầu gọi API hoàn trả tiền cọc sang cổng thanh toán VNPAY.
•  Cổng VNPAY xử lý giao dịch hoàn tiền về tài khoản của khách hàng và phản hồi kết quả thành công.
•  Hệ thống cập nhật trạng thái đơn đặt cọc và tự động ghi nhật ký kiểm toán lưu vết mã định danh Quản lý đã ký duyệt.

3.10 AD-10: Quy trình Tự động quét & Giải phóng bàn hết hạn giữ cọc
• Phân làn trách nhiệm tham gia: Tiến trình chạy ngầm (Hangfire) | Cơ sở dữ liệu SQL Server | Kênh SignalR Hub
 
Hình 3.10: Sơ đồ hoạt động Quy trình Tự động quét & Giải phóng bàn hết hạn giữ cọc
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Tiến trình dịch vụ nền tự động kích hoạt chu kỳ quét định kỳ mỗi 60 giây một lần.
•  Hệ thống thực hiện truy vấn cơ sở dữ liệu để tìm kiếm các bản ghi đặt chỗ ở trạng thái Chờ thanh toán đã vượt quá thời hạn 17 phút.
•  Hệ thống cập nhật trạng thái các đơn đặt chỗ thỏa mãn sang Đã hết hạn giữ cọc.
•  Hệ thống đưa trạng thái vị trí bàn ăn tương ứng từ trạng thái Khóa giữ chỗ trở về trạng thái Sẵn sàng đón khách.
•  Hệ thống phát thông điệp sự kiện qua SignalR Hub để cập nhật tức thời màu sắc trạng thái bàn trên màn hình của nhân viên phục vụ.
•  Trường hợp phát sinh phản hồi thanh toán thành công trễ sau khi bàn đã được giải phóng, hệ thống tự động quét tìm bàn ăn trống tương đương hoặc gửi cảnh báo ưu tiên tới Quản lý để xử lý ngoại lệ.

3.11 AD-11: Quy trình Quản trị Thực đơn & Trạng thái món
• Phân làn trách nhiệm tham gia: Quản lý Ẩm thực / Bếp | Hệ thống Web API | Màn hình Khách & POS Phục vụ
 
Hình 3.11: Sơ đồ hoạt động Quy trình Quản trị Thực đơn & Trạng thái món
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Quản lý mở giao diện Quản trị Thực đơn trên cổng thông tin quản trị.
•  Quản lý thực hiện thêm món mới hoặc điều chỉnh giá bán, hình ảnh, mô tả thành phần và các thông tin cảnh báo dị ứng thực phẩm.
•  Khi xảy ra tình trạng hết nguyên liệu chế biến đột xuất, Quản lý thao tác bật/tắt nhanh trạng thái Còn món hoặc Hết món.
•  Quản lý bấm nút Lưu thay đổi dữ liệu thực đơn.
•  Hệ thống xác thực dữ liệu, cập nhật cơ sở dữ liệu và phát tín hiệu đồng bộ thời gian thực.
•  Trang Web E-Menu và ứng dụng di động của nhân viên phục vụ tự động cập nhật danh mục món ăn mới ngay lập tức qua SignalR.

3.12 AD-12: Quy trình Khách hàng đánh giá & Phản hồi dịch vụ CSAT
• Phân làn trách nhiệm tham gia: Khách hàng | Hệ thống Backend API | Bảng điều khiển Quản trị
 
Hình 3.12: Sơ đồ hoạt động Quy trình Khách hàng đánh giá & Phản hồi dịch vụ CSAT
Diễn giải các bước thực thi chi tiết trong quy trình:
•  Sau khi hoàn tất thanh toán hóa đơn, khách hàng nhận đường dẫn khảo sát qua thư điện tử hoặc quét mã QR trên phiếu tính tiền.
•  Khách hàng truy cập biểu mẫu khảo sát, thực hiện chấm điểm hài lòng theo thang điểm từ 1 đến 5 sao và đóng góp ý kiến nhận xét.
•  Khách hàng nhấn nút Gửi đánh giá dịch vụ.
•  Hệ thống Backend tiếp nhận dữ liệu, kiểm tra tính hợp lệ và lưu trữ phản hồi vào cơ sở dữ liệu.
•  Hệ thống tự động tính toán chỉ số đo lường mức độ hài lòng khách hàng (CSAT) và cập nhật số liệu lên bảng điều khiển quản trị.
•  Trường hợp phản hồi có mức đánh giá thấp dưới chuẩn, hệ thống tự động phát cảnh báo ưu tiên tới Quản lý để kịp thời liên hệ giải quyết.

 
CHƯƠNG 4: MÔ HÌNH HÓA TƯƠNG TÁC HỆ THỐNG (SEQUENCE DIAGRAMS)
Chương này trình bày 12 sơ đồ tuần tự (Sequence Diagrams) thể hiện chuỗi trao đổi thông điệp theo trục thời gian giữa các thành phần kiến trúc Clean Architecture: Tác nhân người dùng, Lớp trình diễn (Frontend SPA / Web POS), Bộ điều khiển tiếp nhận (API Controller), Trạm điều phối trung gian (MediatR Handler), Thực thể nghiệp vụ miền (Domain Entities) và Cơ sở dữ liệu.
4.1 SD-01: Đặt bàn trực tuyến & Thanh toán cọc qua VNPAY
• Các thành phần tham gia tương tác: Guest | WebBookingSPA | ReservationAPI | VNPAYGateway | Database | SignalRHub
 
Hình 4.1: Sơ đồ tuần tự Đặt bàn trực tuyến & Thanh toán cọc qua VNPAY
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Khách hàng thực hiện gửi yêu cầu tra cứu bàn trống và chọn vị trí bàn trên giao diện WebBookingSPA.
•  Giao diện SPA gửi lệnh HTTP POST khởi tạo phiên đặt cọc tới ReservationAPI.
•  API kiểm tra trạng thái khả dụng, thực hiện khóa giữ chỗ tạm thời bàn ăn trong 17 phút và gọi dịch vụ cổng VNPAY tạo liên kết thanh toán.
•  Khách hàng được chuyển hướng sang giao diện VNPAY và tiến hành quét mã VietQR hoàn tất trừ tiền trong thời hạn 15 phút.
•  Cổng VNPAY phát tín hiệu IPN callback bất đồng bộ về ReservationAPI để xác nhận kết quả thanh toán thành công.
•  API cập nhật trạng thái bàn sang Reserved trong Database, sinh mã BookingCode và phát sự kiện qua SignalRHub để đồng bộ giao diện sơ đồ bàn.

4.2 SD-02: Nhân viên tạo Order trực tiếp & In phiếu Bếp
• Các thành phần tham gia tương tác: Waitstaff | POSClient | OrderAPI | Database | PrintWorker | KitchenPrinter
 
Hình 4.2: Sơ đồ tuần tự Nhân viên tạo Order trực tiếp & In phiếu Bếp
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Nhân viên phục vụ nhập danh sách món ăn cùng các ghi chú cảnh báo dị ứng trên ứng dụng di động POSClient và nhấn nút Gửi đơn.
•  Ứng dụng POSClient gửi yêu cầu HTTP POST đóng gói đơn hàng tới OrderAPI.
•  OrderAPI thực hiện kiểm tra tính hợp lệ của dữ liệu đầu vào qua FluentValidation Pipeline.
•  API lưu trữ đơn hàng mới với trạng thái Processing vào Database thông qua Unit of Work Pattern.
•  API gửi thông điệp sự kiện bất đồng bộ tới PrintWorker để định tuyến phiếu chế biến theo phân khu Bếp tương ứng.
•  PrintWorker kết nối mạng nội bộ và kích hoạt máy in KitchenPrinter tự động nhả phiếu in với nội dung cảnh báo dị ứng được bôi đậm.

4.3 SD-03: Kiểm đồ (Checkfood) & Xác nhận hoàn thành món tại quầy Pass
• Các thành phần tham gia tương tác: Chef | Expediter | PassTablet | KitchenHub | Database | WaitstaffDevice
 
Hình 4.3: Sơ đồ tuần tự Kiểm đồ (Checkfood) & Xác nhận hoàn thành món tại quầy Pass
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Đầu bếp đặt đĩa món hoàn chỉnh ra quầy chuyển món Pass bên dưới hệ thống đèn giữ nhiệt.
•  Nhân viên Điều phối kiểm tra đối chiếu đĩa món trên PassTablet và nhấn nút Xác nhận hoàn thành (Served).
•  Thiết bị PassTablet gửi yêu cầu cập nhật trạng thái món ăn kèm mốc thời gian hoàn thành tới Backend API.
•  Backend API cập nhật trạng thái món ăn thành Served trong Database.
•  Backend API kích hoạt sự kiện thời gian thực thông qua KitchenHub gửi tới WaitstaffDevice của nhân viên phụ trách bàn.
•  Thiết bị di động của nhân viên phục vụ phát tín hiệu rung thông báo đĩa món đã sẵn sàng để bưng ra bàn cho thực khách.

4.4 SD-04: Thanh toán hóa đơn, Cấn trừ cọc & Đóng bàn
• Các thành phần tham gia tương tác: Guest | Waitstaff | BillingAPI | CashierPrinter | Database | TableHub
 
Hình 4.4: Sơ đồ tuần tự Thanh toán hóa đơn, Cấn trừ cọc & Đóng bàn
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Khách hàng thông báo yêu cầu tính tiền bữa ăn với nhân viên phục vụ.
•  Nhân viên phục vụ chọn chức năng Thanh toán trên ứng dụng di động gửi yêu cầu tới BillingAPI.
•  BillingAPI truy vấn toàn bộ các món ăn đã dùng, tự động tính 5% phí phục vụ, 10% thuế VAT và cấn trừ chính xác số tiền cọc đã thu trước đó.
•  BillingAPI phát lệnh in phiếu Hóa đơn tạm tính kèm mã VietQR động ra thiết bị CashierPrinter để nhân viên kẹp sổ da mang ra bàn.
•  Khách hàng hoàn tất thanh toán phần tiền chênh lệch còn lại và nhân viên phục vụ bấm xác nhận trên ứng dụng.
•  BillingAPI lưu trữ giao dịch hóa đơn thành công vào Database và gửi sự kiện qua TableHub chuyển trạng thái bàn sang Cleaning.

4.5 SD-05: Hủy đặt bàn & Hoàn tiền cọc VNPAY
• Các thành phần tham gia tương tác: Guest | BookingPortal | CancelAPI | VNPAYRefundService | Database | NotificationService
 
Hình 4.5: Sơ đồ tuần tự Hủy đặt bàn & Hoàn tiền cọc VNPAY
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Khách hàng nhập mã BookingCode và gửi yêu cầu hủy đặt chỗ trên giao diện BookingPortal.
•  Giao diện gửi yêu cầu HTTP POST hủy đặt bàn tới CancelAPI.
•  CancelAPI tính toán khoảng cách thời gian giữa thời điểm hiện tại và giờ hẹn dùng bữa.
•  Xác nhận thời gian hủy trước giờ hẹn từ 4 tiếng trở lên, CancelAPI gọi dịch vụ VNPAYRefundService thực hiện lệnh hoàn tiền 100%.
•  VNPAYRefundService chuyển tiền cọc về tài khoản khách hàng và phản hồi kết quả thành công cho hệ thống.
•  CancelAPI cập nhật trạng thái đặt bàn sang Cancelled, giải phóng bàn về Available trong Database và kích hoạt NotificationService gửi thông báo xác nhận.

4.6 SD-06: Đăng nhập & Xác thực JWT Token nhân viên nội bộ
• Các thành phần tham gia tương tác: StaffUser | AuthClient | IdentityAPI | SecurityService | Database | SessionStorage
 
Hình 4.6: Sơ đồ tuần tự Đăng nhập & Xác thực JWT Token nhân viên nội bộ
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Nhân viên nhập thông tin định danh gồm Tên đăng nhập và Mật khẩu trên giao diện AuthClient.
•  AuthClient gửi yêu cầu xác thực bảo mật tới IdentityAPI.
•  IdentityAPI truy vấn thông tin tài khoản và đối chiếu mật khẩu băm bảo mật trong Database.
•  Hệ thống xác thực thành công, SecurityService khởi tạo mã thông báo JWT Bearer Token chứa thông tin vai trò và danh mục quyền hạn.
•  IdentityAPI phản hồi token về cho AuthClient lưu trữ an toàn trong SessionStorage để đính kèm vào các yêu cầu tiếp theo.

4.7 SD-07: Chuyển bàn / Đổi bàn trực tiếp tại nhà hàng
• Các thành phần tham gia tương tác: Guest | Waitstaff | TableAPI | UnitOfWork | Database | FloorPlanHub
 
Hình 4.7: Sơ đồ tuần tự Chuyển bàn / Đổi bàn trực tiếp tại nhà hàng
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Khách hàng đề đạt nguyện vọng chuyển đổi chỗ ngồi sang vị trí bàn ăn khác thuận tiện hơn.
•  Nhân viên phục vụ chọn bàn mới trên ứng dụng di động và gửi yêu cầu đổi bàn tới TableAPI.
•  TableAPI kiểm tra trạng thái bàn mới mục tiêu đảm bảo đang ở trạng thái Available.
•  API thực thi giao dịch UnitOfWork chuyển giao toàn bộ đơn hàng, danh mục món ăn và tiền cọc sang mã bàn mới trong Database.
•  Hệ thống cập nhật trạng thái bàn cũ sang Cleaning và bàn mới sang Occupied.
•  TableAPI phát sự kiện qua FloorPlanHub để đồng bộ tức thời trạng thái bàn mới tới toàn bộ nhân viên và quầy Pass.

4.8 SD-08: Quản trị & Cấu hình Sơ đồ bàn ăn
• Các thành phần tham gia tương tác: Manager | AdminPortal | FloorPlanAPI | Database | FloorPlanHub | StaffClients
 
Hình 4.8: Sơ đồ tuần tự Quản trị & Cấu hình Sơ đồ bàn ăn
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Quản lý điều chỉnh tọa độ bố trí bàn ăn và cấu hình mã định danh bàn trên giao diện 2D Canvas của AdminPortal.
•  AdminPortal gửi dữ liệu cấu hình mặt bằng mới tới FloorPlanAPI.
•  FloorPlanAPI kiểm tra các ràng buộc nghiệp vụ đảm bảo không có sự trùng lặp mã bàn hoặc thay đổi bàn đang phục vụ.
•  API lưu trữ toàn bộ cấu hình sơ đồ mặt bằng mới vào Database.
•  FloorPlanAPI phát sự kiện cập nhật cấu hình qua FloorPlanHub.
•  Tất cả các ứng dụng StaffClients của nhân viên phục vụ nhận sự kiện và tự động vẽ lại sơ đồ mặt bằng theo thời gian thực.

4.9 SD-09: Quản lý duyệt hoàn tiền cọc thủ công ngoại lệ
• Các thành phần tham gia tương tác: Manager | AdminPortal | RefundAPI | VNPAYGateway | AuditLogService | Database
 
Hình 4.9: Sơ đồ tuần tự Quản lý duyệt hoàn tiền cọc thủ công ngoại lệ
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Quản lý tra cứu đơn đặt bàn phát sinh khiếu nại và nhập nội dung giải trình phê duyệt trên AdminPortal.
•  AdminPortal gửi yêu cầu phê duyệt hoàn tiền thủ công ngoại lệ tới RefundAPI.
•  RefundAPI xác thực thẩm quyền Quản lý và kích hoạt lệnh gọi API sang cổng VNPAYGateway.
•  Cổng VNPAY tiếp nhận và hoàn trả khoản tiền cọc về tài khoản của khách hàng thành công.
•  RefundAPI cập nhật trạng thái giao dịch đặt cọc thành công trong Database.
•  AuditLogService tự động ghi nhận nhật ký kiểm toán lưu vết mã định danh Quản lý, mốc thời gian và lý do phê duyệt hoàn cọc.

4.10 SD-10: Tự động giải phóng bàn hết hạn giữ cọc & Xử lý Late IPN
• Các thành phần tham gia tương tác: HangfireWorker | Database | TableStateService | SignalRHub | LateIPNHandler | ManagerAlertQueue
 
Hình 4.10: Sơ đồ tuần tự Tự động giải phóng bàn hết hạn giữ cọc & Xử lý Late IPN
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Tiến trình HangfireWorker định kỳ mỗi 60 giây gửi lệnh quét Database tìm các đơn đặt cọc PendingPayment quá 17 phút.
•  TableStateService cập nhật trạng thái các đơn quá hạn sang Expired và đưa vị trí bàn ăn về Available trong Database.
•  Hệ thống phát sự kiện qua SignalRHub đồng bộ màu sắc bàn ăn xanh lá cây trên sơ đồ của nhân viên phục vụ.
•  Trường hợp cổng thanh toán gửi tín hiệu IPN thành công trễ sau khi bàn đã bị giải phóng, LateIPNHandler tiếp nhận xử lý.
•  LateIPNHandler quét tìm bàn ăn trống tương đương trong cùng phân khu để tự động gán cho khách hàng.
•  Trường hợp nhà hàng đã kín chỗ, LateIPNHandler đẩy bản ghi vào ManagerAlertQueue để Quản lý chủ động gọi điện xử lý ngoại lệ.

4.11 SD-11: Quản trị Thực đơn & Cập nhật trạng thái Còn/Hết món
• Các thành phần tham gia tương tác: Manager | AdminPortal | MenuAPI | Database | MenuHub | EMenuClients
 
Hình 4.11: Sơ đồ tuần tự Quản trị Thực đơn & Cập nhật trạng thái Còn/Hết món
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Quản lý cập nhật giá bán, hình ảnh hoặc thao tác bật/tắt trạng thái Còn món hoặc Hết món trên AdminPortal.
•  AdminPortal gửi yêu cầu cập nhật thông tin thực đơn tới MenuAPI.
•  MenuAPI thực hiện xác thực tính hợp lệ của dữ liệu đầu vào và lưu trữ các thay đổi vào Database.
•  MenuAPI phát sự kiện cập nhật thực đơn thời gian thực thông qua MenuHub.
•  Toàn bộ các thiết bị hiển thị EMenuClients tại các bàn ăn và ứng dụng POS của nhân viên phục vụ tự động làm mới danh mục thực đơn.

4.12 SD-12: Khách hàng đánh giá dịch vụ & Tự động gửi Email CSAT
• Các thành phần tham gia tương tác: Guest | FeedbackSPA | FeedbackAPI | AnalyticsEngine | Database | ManagerDashboard
 
Hình 4.12: Sơ đồ tuần tự Khách hàng đánh giá dịch vụ & Tự động gửi Email CSAT
Diễn giải chuỗi thông điệp và cơ chế bảo đảm an toàn dữ liệu:
•  Khách hàng truy cập liên kết khảo sát trên FeedbackSPA, lựa chọn thang điểm đánh giá và nhập nhận xét chất lượng phục vụ.
•  Giao diện FeedbackSPA gửi dữ liệu khảo sát tới FeedbackAPI.
•  FeedbackAPI kiểm tra tính hợp lệ và lưu trữ bản ghi đánh giá vào Database.
•  AnalyticsEngine tự động tính toán lại chỉ số mức độ hài lòng khách hàng (CSAT) theo thời gian thực.
•  Hệ thống phát thông báo cập nhật chỉ số CSAT trực tiếp lên giao diện theo dõi của ManagerDashboard.
•  Trường hợp phản hồi có điểm đánh giá thấp dưới 3 sao, hệ thống tự động gửi thư điện tử cảnh báo ưu tiên cao tới Quản lý nhà hàng.

 
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

Phân tích chuyên sâu về Công thức Tài chính Hóa đơn
Công thức tính toán tài chính của VinDining tuân thủ nguyên tắc tính toán tuần tự nghiêm ngặt nhằm tránh các sai lệch về thuế suất và bảo toàn quyền lợi của nhà hàng:
•  Tổng tiền món ăn thực tế được tính bằng tổng đơn giá nhân số lượng của tất cả các món ăn đã được xác nhận phục vụ hoàn tất.
•  Phí phục vụ tiêu chuẩn nhà hàng cao cấp được ấn định mức 5% trên tổng tiền món ăn thực tế.
•  Thuế giá trị gia tăng VAT được tính mức 10% áp dụng trên tổng chi phí bao gồm cả tiền món ăn và phí phục vụ theo đúng quy định hiện hành.
•  Khoản tiền cọc đã thanh toán được khấu trừ trực tiếp vào tổng chi phí sau thuế, trong đó số tiền phải thu cuối cùng có cận dưới bằng 0 đồng để thực thi chính sách tiền cọc đóng vai trò là mức chi tiêu tối thiểu không hoàn lại.
 
CHƯƠNG 6: MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU (RTM MATRIX)
Ma trận truy xuất nguồn gốc yêu cầu (Requirements Traceability Matrix - RTM) bảo đảm tính nhất quán hai chiều, kết nối xuyên suốt từ yêu cầu nghiệp vụ cấp cao (REQ) tới các trường hợp sử dụng (Use Case), quy trình hoạt động (Activity Diagram), tương tác hệ thống (Sequence Diagram), quy tắc nghiệp vụ (Business Rules) và các kịch bản kiểm thử (Test Cases).
Mã Y/C	Tên yêu cầu nghiệp vụ	Use Case	Activity	Sequence	Quy tắc	Test Case
REQ-01	Đặt bàn trực tuyến & Đặt cọc VNPAY	UC-U1	AD-01	SD-01	BR-01, BR-05	TC-RES-01, TC-RES-02
REQ-02	Xem E-Menu tại bàn (Mã QR & Tablet mượn)	UC-U2	AD-02	SD-02	BR-02	TC-ORD-01, TC-ORD-02
REQ-03	Hủy đặt bàn trực tuyến & Hoàn cọc tự động	UC-U3	AD-05	SD-05	BR-05	TC-RES-03
REQ-04	Khách hàng đánh giá chất lượng dịch vụ	UC-U4	AD-12	SD-12	BR-03	TC-FB-01
REQ-05	Nhân viên tạo Order trực tiếp & Điều phối KDS Bếp	UC-E1	AD-02	SD-02	BR-04	TC-KIT-01, TC-KIT-02
REQ-06	Phục vụ món & Xác nhận hoàn thành tại Pass	UC-E2	AD-03	SD-03	BR-04	TC-SER-01
REQ-07	Xuất hóa đơn, Cấn trừ tiền cọc & Đóng bàn	UC-E3	AD-04	SD-04	BR-03	TC-INV-01, TC-INV-02
REQ-08	Chuyển bàn / Đổi bàn phục vụ	UC-E4	AD-07	SD-07	BR-02	TC-TBL-03
REQ-09	Đăng nhập & Xác thực tài khoản nội bộ	UC-E5	AD-06	SD-06	BR-04	TC-SEC-01, TC-SEC-02
REQ-10	Quản trị Danh mục & Thực đơn món ăn	UC-A1	AD-11	SD-11	BR-04	TC-MNU-01
REQ-11	Quản trị & Cấu hình Sơ đồ bàn ăn	UC-A2	AD-08	SD-08	BR-02	TC-TBL-01, TC-TBL-02
REQ-12	Duyệt hoàn tiền cọc thủ công ngoại lệ	UC-A3	AD-09	SD-09	BR-05	TC-REF-01
REQ-13	Quản trị Tài khoản nhân viên & Phân quyền	UC-A4	AD-06	SD-06	BR-04	TC-SEC-03
REQ-14	Báo cáo Thống kê Doanh thu & Dashboard	UC-A5	AD-12	SD-12	BR-03	TC-REP-01
REQ-15	Tự động quét & Giải phóng bàn hết hạn cọc	UC-S1	AD-10	SD-10	BR-01	TC-SYS-01

 

