# -*- coding: utf-8 -*-
"""
Data definitions for VinDining System Analysis Report
Contains:
- Chapter 1: Stakeholders & RBAC tables
- Chapter 2: Specifications for all 15 Use Cases
- Chapter 3: Narratives for all 12 Activity Diagrams
- Chapter 4: Narratives for all 12 Sequence Diagrams
- Chapter 5: Business Rules Matrix data
- Chapter 6: Requirements Traceability Matrix data
- Chapter 7: References list

Strictly adheres to:
- No abbreviated prefix formatting like -a:aA -B:BBB.
- All bullet points start directly with complete sentences (- BBB).
"""

# =============================================================================
# CHƯƠNG 1: TỔNG QUAN TÁC NHÂN & MA TRẬN PHÂN QUYỀN
# =============================================================================

ACTORS_DATA = [
    [
        "Khách hàng\n(Guest)",
        "Tác nhân chính\n(Primary Actor)",
        "Điện thoại thông minh cá nhân\n(Mobile Web Responsive)",
        "Khách hàng chủ động tra cứu sơ đồ phân khu bàn ăn, chọn vị trí và đặt bàn trực tuyến; thực hiện thanh toán khoản tiền cọc cố định qua cổng thanh toán VNPAY; quét mã QR tại bàn để xem thực đơn E-Menu trên điện thoại cá nhân (BYOD) hoặc mượn Tablet dùng chung; theo dõi tiến độ phục vụ món ăn và gửi yêu cầu phục vụ hoặc thanh toán hóa đơn.",
        "Trải nghiệm đặt chỗ tiện lợi, minh bạch chính sách tiền cọc; thưởng lãm thực đơn trực quan tại bàn mà không bị gián đoạn; được đảm bảo tuyệt đối các yêu cầu về dị ứng và an toàn thực phẩm."
    ],
    [
        "Nhân viên Phục vụ\n(Waitstaff)",
        "Tác nhân chính\n(Primary Actor)",
        "Điện thoại di động / Máy tính bảng\n(Mobile/Tablet Web POS)",
        "Nhân viên theo dõi sơ đồ mặt bằng bàn ăn thời gian thực để đón tiếp và check-in khách vào bàn; tư vấn chi tiết các món ăn và ghi nhận cảnh báo dị ứng; tạo đơn gọi món trực tiếp trên thiết bị cầm tay điều phối vé điện tử lên Màn hình KDS Bếp qua SignalR; bưng phục vụ món ăn từ quầy Pass ra bàn bằng hai tay; xuất phiếu tạm tính cấn trừ tiền cọc kẹp sổ da và chuyển trạng thái bàn sang chờ dọn dẹp.",
        "Quy trình phục vụ chu đáo, chuyên nghiệp chuẩn Fine Dining; loại bỏ hoàn toàn sai sót ghi chép giấy thủ công; hỗ trợ thao tác nhanh chóng và chính xác tại bàn."
    ],
    [
        "Nhân viên Điều phối\n(Expediter / Checkfood)",
        "Tác nhân chính\n(Primary Actor)",
        "Máy tính bảng cố định tại quầy Pass\n(Pass Counter Tablet)",
        "Nhân viên tiếp nhận các đĩa món hoàn thiện từ nhà bếp đặt ra quầy Pass; đối chiếu hình thức trình bày và thành phần món ăn với thông tin điều phối trên KDS Pass; kiểm tra nghiêm ngặt các cảnh báo dị ứng thực phẩm; bấm xác nhận hoàn thành món trên màn hình điều phối; kích hoạt thông báo tức thời đến điện thoại của nhân viên phục vụ phụ trách bàn.",
        "Đảm bảo 100% món ăn ra bàn chuẩn xác về chất lượng, đúng bàn, đúng vị trí khách và tuân thủ tuyệt đối lưu ý dị ứng; kiểm soát chặt chẽ nhịp độ ra món."
    ],
    [
        "Quản lý Nhà hàng\n(Manager)",
        "Tác nhân chính\n(Primary Actor)",
        "Máy tính xách tay / Để bàn\n(Desktop Web Portal)",
        "Quản lý thiết lập danh mục thực đơn, giá bán món ăn và định lượng nguyên liệu; cấu hình sơ đồ phân khu bàn ăn và quản lý mã QR định danh bàn; theo dõi báo cáo doanh thu, tỷ lệ lấp đầy bàn và hiệu suất phục vụ thời gian thực; thực hiện phê duyệt lệnh hoàn tiền cọc thủ công ngoại lệ khi xảy ra sự cố bất khả kháng.",
        "Giám sát toàn diện và điều hành trơn tru mọi hoạt động vận hành của nhà hàng; kiểm soát doanh thu chặt chẽ và xử lý linh hoạt các khiếu nại phát sinh từ khách hàng."
    ],
    [
        "Quản trị viên\n(System Admin)",
        "Tác nhân chính\n(Primary Actor)",
        "Máy tính xách tay / Để bàn\n(Desktop Web Portal)",
        "Quản trị viên khởi tạo, phân bổ và quản lý danh sách tài khoản người dùng nội bộ theo mô hình phân quyền dựa trên vai trò (RBAC); thiết lập các tham số hệ thống như thời gian khóa giữ bàn, tỷ lệ thuế VAT và phí dịch vụ; giám sát nhật ký vận hành hệ thống và thực hiện sao lưu dữ liệu định kỳ.",
        "Duy trì tính toàn vẹn dữ liệu, đảm bảo tiêu chuẩn an toàn bảo mật và sự vận hành liên tục, ổn định của toàn bộ nền tảng phần mềm."
    ],
    [
        "Cổng thanh toán\n(VNPAY Gateway)",
        "Tác nhân phụ\n(Secondary Actor)",
        "Hệ thống máy chủ dịch vụ thanh toán\n(VNPAY Payment Server)",
        "Tiếp nhận các yêu cầu khởi tạo giao dịch thanh toán tiền cọc trực tuyến từ Backend; cung cấp giao diện thanh toán bảo mật cho khách hàng quét mã VietQR hoặc nhập thẻ ngân hàng; gửi tín hiệu phản hồi kết quả giao dịch tức thời qua kênh IPN callback về máy chủ hệ thống; xử lý các yêu cầu hoàn trả tiền cọc theo chỉ định tự động hoặc thủ công.",
        "Đảm bảo quy trình xử lý giao dịch tài chính diễn ra an toàn, chính xác tuyệt đối, bảo mật thông tin tài khoản và đối soát minh bạch."
    ],
    [
        "Màn hình KDS Bếp\n(Kitchen Display System)",
        "Tác nhân phụ\n(Secondary Actor)",
        "Màn hình KDS / Tablet gắn tường\n(Hands-free KDS Screen)",
        "Tự động tiếp nhận và hiển thị vé điều phối gọi món điện tử từ hệ thống Backend qua SignalR theo thời gian thực; phân luồng hiển thị rảnh tay theo từng trạm Bếp nóng, Bếp lạnh và Quầy bar; hiển thị đồng hồ đếm ngược SLA chuẩn bị và bôi đậm rõ nét các cảnh báo dị ứng thực phẩm cùng ghi chú đặc biệt của từng món ăn.",
        "Cung cấp giao diện trực quan, rảnh tay (Hands-free) giúp đầu bếp theo dõi món cần nấu mà không cần chạm tay vào màn hình, loại bỏ triệt để nguy cơ bám dính dầu mỡ, thất lạc phiếu in giấy và đảm bảo nhịp độ ra món chuẩn xác theo Course."
    ]
]

RBAC_MODULES = [
    {
        "module": "Tài khoản & Phân quyền",
        "features": [
            ("Đăng nhập hệ thống nội bộ", ["✗", "✓", "✓", "✓"]),
            ("Quản lý thông tin hồ sơ nhân sự", ["✗", "✓", "✓", "✓"]),
            ("Quản trị tài khoản & Cấp quyền người dùng", ["✗", "✗", "✗", "✓"])
        ]
    },
    {
        "module": "Đặt bàn & Đặt cọc",
        "features": [
            ("Tra cứu sơ đồ bàn & Đặt bàn trước", ["✓", "✓", "✓", "✗"]),
            ("Thanh toán / Thu nhận tiền cọc giữ chỗ", ["✓", "✓", "✓", "✗"]),
            ("Hủy đặt bàn trước giờ hẹn từ 4 tiếng", ["✓", "✓", "✓", "✗"]),
            ("Phê duyệt lệnh hoàn cọc thủ công ngoại lệ", ["✗", "✗", "✓", "✓"])
        ]
    },
    {
        "module": "Sơ đồ bàn & Hiển thị",
        "features": [
            ("Theo dõi sơ đồ bàn trực quan theo thời gian thực", ["✗", "✓", "✓", "✓"]),
            ("Check-in khách vào bàn ăn thực tế", ["✗", "✓", "✓", "✗"]),
            ("Cấu hình sơ đồ mặt bằng & Quản lý mã QR bàn", ["✗", "✗", "✓", "✓"]),
            ("Chuyển trạng thái bàn sang sẵn sàng sau khi dọn dẹp", ["✗", "✓", "✓", "✗"])
        ]
    },
    {
        "module": "Gọi món & Phục vụ",
        "features": [
            ("Thưởng lãm thực đơn qua Web E-Menu (Mã QR / Tablet mượn)", ["✓", "✗", "✗", "✗"]),
            ("Nhân viên tạo đơn gọi món & Điều phối KDS Bếp", ["✗", "✓", "✓", "✗"]),
            ("Xác nhận hoàn thành món ăn tại quầy điều phối Pass", ["✗", "Expediter: ✓", "✓", "✗"])
        ]
    },
    {
        "module": "Hóa đơn & Doanh thu",
        "features": [
            ("Gửi yêu cầu tính tiền từ giao diện E-Menu", ["✓", "✗", "✗", "✗"]),
            ("Xuất hóa đơn tạm tính tự động cấn trừ tiền cọc", ["✗", "✓", "✓", "✗"]),
            ("Xác nhận hoàn tất thanh toán & Đóng bàn", ["✗", "✓", "✓", "✗"]),
            ("Báo cáo thống kê doanh thu & Hiệu suất kinh doanh", ["✗", "✗", "✓", "✓"])
        ]
    }
]

# =============================================================================
# CHƯƠNG 2: ĐẶC TẢ CHI TIẾT 15 USE CASE
# =============================================================================

USE_CASES_DATA = [
    # 2.3.1 Nhóm Khách hàng
    {
        "id": "UC-U1",
        "name": "Đặt bàn trực tuyến & Đặt cọc giữ chỗ (Table Reservation & Deposit)",
        "subsystem": "Khách hàng",
        "actors": "Khách hàng (Chính), Cổng thanh toán VNPAY (Phụ), Hệ thống tự động (Phụ)",
        "priority": "Trọng yếu (Must Have - Bắt buộc hoàn thành)",
        "relations": "Bao gồm (include) tương tác cổng VNPAY để thanh toán; Mở rộng (extend) tác vụ nền giải phóng bàn UC-S1 khi quá hạn giữ chỗ 17 phút",
        "objective": "Cho phép khách hàng truy cập website, tra cứu sơ đồ bàn theo thời gian thực, lựa chọn thời điểm và vị trí bàn mong muốn, sau đó thanh toán tiền cọc cố định qua VNPAY để xác nhận giữ chỗ chắc chắn.",
        "preconditions": "Khách hàng truy cập hệ thống website đặt chỗ; sơ đồ mặt bằng bàn ăn của nhà hàng đang trong trạng thái hoạt động.",
        "postconditions": "Vị trí bàn ăn chuyển sang trạng thái Đã đặt chỗ (Reserved); hệ thống ghi nhận khoản cọc thành công và tự động gửi mã đặt bàn BookingCode kèm chi tiết xác nhận đến khách hàng.",
        "basic_flow": [
            "Khách hàng truy cập giao diện đặt bàn, lựa chọn Ngày hẹn, Ca phục vụ, Số lượng khách tham dự và Khu vực bàn ăn mong muốn như Phòng VIP, Sảnh chính hoặc Ban công.",
            "Hệ thống kiểm tra trạng thái sơ đồ bàn thời gian thực và hiển thị trực quan danh sách các vị trí bàn ăn khả dụng tương ứng.",
            "Khách hàng điền thông tin liên hệ cá nhân gồm Họ tên, Số điện thoại, Email, ghi chú chi tiết các yêu cầu đặc biệt về khẩu vị hoặc cảnh báo dị ứng thực phẩm và bấm chọn xác nhận đặt cọc.",
            "Hệ thống khóa giữ chỗ tạm thời vị trí bàn đã chọn trong thời gian tối đa 17 phút (bao gồm 15 phút hiệu lực mã QR VNPAY cộng thêm 2 phút ân hạn xử lý mạng), đồng thời chuyển hướng sang giao diện thanh toán của cổng VNPAY.",
            "Khách hàng thực hiện thao tác quét mã VietQR ngân hàng hoặc điền thông tin thẻ thanh toán trên cổng VNPAY trong thời hạn 15 phút.",
            "Cổng VNPAY xử lý giao dịch thành công và phát tín hiệu thông báo thanh toán tức thời (IPN callback) về máy chủ hệ thống.",
            "Hệ thống cập nhật trạng thái bàn ăn sang Đã đặt chỗ (Reserved), tự động sinh mã đặt bàn BookingCode duy nhất và gửi thông báo xác nhận thành công tới khách hàng qua tin nhắn và thư điện tử."
        ],
        "alt_flow": [
            "2a. Phân khu hoặc khung giờ mong muốn đã kín chỗ: Khi toàn bộ các bàn ăn trong khung giờ hoặc phân khu mong muốn đã kín chỗ, hệ thống thông báo trạng thái hết chỗ và tự động gợi ý các khung giờ hoặc phân khu lân cận còn khả dụng. Khách hàng lựa chọn thời điểm/khu vực khác hoặc kết thúc phiên đặt bàn.",
            "3a. Thông tin liên hệ hoặc yêu cầu đặc biệt không hợp lệ: Khi khách hàng để trống các trường dữ liệu bắt buộc hoặc nhập sai định dạng số điện thoại/email, hệ thống hiển thị cảnh báo lỗi trực quan tại trường tương ứng và chặn thao tác chuyển cổng thanh toán cho đến khi thông tin được hoàn thiện.",
            "5a. Khách hàng chủ động hủy thanh toán hoặc giao dịch qua VNPAY thất bại: Khi khách hàng chủ động hủy thao tác thanh toán hoặc giao dịch qua VNPAY thất bại, hệ thống ghi nhận trạng thái chưa hoàn tất, giữ nguyên phiên khóa bàn (nếu chưa hết hạn 17 phút) và hiển thị thông báo mời khách hàng thao tác lại.",
            "5b. Hết thời hạn 17 phút khóa bàn mà chưa hoàn tất thanh toán (Timeout): Khi vượt quá thời hạn 17 phút (bao gồm 15 phút hiệu lực mã VietQR cộng thêm 2 phút ân hạn xử lý mạng) mà chưa nhận được tín hiệu thanh toán, hệ thống tự động giải phóng vị trí bàn về trạng thái sẵn sàng đón khách (Available) và hủy phiên đặt chỗ.",
            "6a. Phản hồi thanh toán thành công trễ sau khi bàn đã bị giải phóng (Late IPN > 17 phút): Khi phát sinh phản hồi thanh toán thành công trễ từ cổng VNPAY sau khi bàn đã được giải phóng do vượt quá 17 phút, hệ thống tự động quét tìm bàn ăn trống có vị trí và sức chứa tương đương để bố trí cho khách. Nếu nhà hàng đã kín chỗ, hệ thống chuyển giao dịch sang trạng thái ngoại lệ chờ xử lý và kích hoạt cảnh báo tới Quản lý để trực tiếp liên hệ hỗ trợ đổi ngày hoặc hoàn lại 100% tiền cọc.",
            "7a. Sự cố kết nối dịch vụ gửi tin nhắn SMS / Email xác nhận: Khi hệ thống đã cập nhật trạng thái bàn sang Đã đặt chỗ (Reserved) nhưng kết nối dịch vụ SMS/Email bên thứ ba gặp gián đoạn, hệ thống ghi nhận đặt bàn thành công, đẩy thông báo vào hàng đợi gửi bù (Retry Queue) và hiển thị mã BookingCode trực tiếp trên giao diện trình duyệt để khách hàng lưu giữ.",
            "7b. Khách hàng yêu cầu hủy bàn trước giờ hẹn từ 4 tiếng trở lên (Xem chi tiết tại UC-U3): Sau khi đặt bàn thành công, nếu khách hàng thực hiện hủy đặt bàn trước giờ hẹn từ 4 tiếng trở lên, hệ thống tự động kích hoạt thủ tục hoàn lại 100% tiền cọc qua cổng VNPAY và đưa vị trí bàn về trạng thái sẵn sàng phục vụ.",
            "7c. Khách hàng yêu cầu hủy bàn trong vòng dưới 4 tiếng trước giờ hẹn (Xem chi tiết tại UC-U3): Sau khi đặt bàn thành công, nếu khách hàng yêu cầu hủy đặt bàn trong vòng dưới 4 tiếng trước giờ hẹn, hệ thống ghi nhận việc hủy bàn, giải phóng bàn ăn nhưng giữ lại toàn bộ số tiền cọc theo đúng cam kết chính sách."
        ]
    },
    {
        "id": "UC-U2",
        "name": "Xem E-Menu tại bàn (Table E-Menu)",
        "subsystem": "Khách hàng",
        "actors": "Khách hàng (Chính)",
        "priority": "Trọng yếu (Must Have - Bắt buộc hoàn thành)",
        "relations": "Độc lập (Chức năng hiển thị dữ liệu danh mục thực đơn và cảnh báo dị ứng)",
        "objective": "Cho phép khách hàng tại bàn chiêm ngưỡng hình ảnh thực đơn chất lượng cao, thành phần món ăn và cảnh báo dị ứng qua Web E-Menu trên Smartphone cá nhân (quét mã QR tại bàn) hoặc mượn Tablet dùng chung; hỗ trợ gửi yêu cầu phục vụ hoặc thanh toán kín đáo.",
        "preconditions": "Khách hàng đã ngồi tại bàn ăn thực tế tại nhà hàng.",
        "postconditions": "Khách hàng nắm bắt toàn diện thông tin món ăn và sẵn sàng trao đổi trực tiếp với nhân viên phục vụ để gọi món.",
        "basic_flow": [
            "Khách hàng ngồi vào vị trí bàn ăn, dùng Smartphone quét mã QR định danh bàn (hoặc mượn Tablet dùng chung từ nhân viên phục vụ) để mở trang Web E-Menu.",
            "Khách hàng thực hiện thao tác lướt xem các danh mục món ăn như Khai vị, Món chính, Tráng miệng, Đồ uống và khám phá câu chuyện ẩm thực cùng hình ảnh chất lượng cao.",
            "Khách hàng tham khảo kỹ lưỡng các thông tin cảnh báo dị ứng thực phẩm và bảng thành phần đính kèm cho từng món ăn.",
            "Khách hàng thảo luận cùng những người đi cùng và đưa ra quyết định lựa chọn món ăn.",
            "Khách hàng trao đổi trực tiếp nguyện vọng gọi món với nhân viên phục vụ đang túc trực tại phân khu để nhân viên tạo đơn; trong bữa ăn, khách có thể nhấn nút gửi yêu cầu phục vụ hoặc yêu cầu thanh toán trên E-Menu."
        ],
        "alt_flow": [
            "1a. Khách hàng không mang theo điện thoại thông minh hoặc điện thoại hết pin: Nhân viên phục vụ chủ động cung cấp Tablet từ kho dùng chung (Floating Pool) hoặc cuốn thực đơn bìa da truyền thống cho khách."
        ]
    },
    {
        "id": "UC-U3",
        "name": "Hủy đặt bàn trực tuyến & Hoàn cọc tự động (Cancel Reservation & Refund)",
        "subsystem": "Khách hàng",
        "actors": "Khách hàng (Chính), Cổng thanh toán VNPAY (Phụ), Hệ thống tự động (Phụ)",
        "priority": "Trọng yếu (Must Have - Bắt buộc hoàn thành)",
        "relations": "Bao gồm (include) tương tác cổng VNPAY để xử lý lệnh hoàn tiền cọc tự động qua API",
        "objective": "Cho phép khách hàng chủ động hủy lịch đặt bàn trực tuyến trên hệ thống website; hệ thống tự động kiểm tra mốc thời gian đối chiếu chính sách để thực hiện hoàn tiền hoặc phạt cọc hoàn toàn tự động.",
        "preconditions": "Khách hàng sở hữu một mã đặt bàn BookingCode đang ở trạng thái hợp lệ Đã đặt chỗ (Reserved).",
        "postconditions": "Trạng thái lịch đặt bàn chuyển sang Đã hủy (Cancelled); vị trí bàn ăn được giải phóng về trạng thái Sẵn sàng (Available); giao dịch hoàn tiền hoặc giữ cọc được ghi nhận minh bạch vào hệ thống.",
        "basic_flow": [
            "Khách hàng truy cập trang Tra cứu đặt bàn trên website, điền Số điện thoại và mã đặt bàn BookingCode đã được cấp.",
            "Hệ thống truy xuất dữ liệu, hiển thị chi tiết lịch hẹn cùng nút chức năng Hủy đặt bàn.",
            "Khách hàng nhấn nút Hủy đặt bàn và xác nhận đồng ý với các điều khoản xử lý.",
            "Hệ thống thực hiện kiểm tra chênh lệch thời gian giữa thời điểm hiện tại và giờ hẹn dùng bữa thực tế.",
            "Xác nhận thời gian còn cách giờ hẹn từ 4 tiếng trở lên, hệ thống tự động gửi yêu cầu gọi API hoàn tiền sang cổng VNPAY để hoàn lại 100% khoản cọc cho khách hàng.",
            "Hệ thống cập nhật trạng thái đặt bàn sang Đã hủy (Cancelled) và đưa trạng thái bàn ăn về Sẵn sàng đón khách (Available).",
            "Hệ thống gửi thư điện tử và tin nhắn thông báo xác nhận hủy đặt bàn cùng chứng từ hoàn tiền thành công tới khách hàng."
        ],
        "alt_flow": [
            "4a. Hủy đặt bàn khi thời gian cách giờ hẹn dưới 4 tiếng: Khi khách hàng thực hiện hủy lịch đặt bàn khi thời gian còn cách giờ hẹn dưới 4 tiếng, hệ thống hiển thị thông báo cảnh báo khách hàng sẽ bị giữ lại 100% tiền cọc do vi phạm chính sách cam kết thời gian chuẩn bị nguyên liệu. Sau khi khách hàng xác nhận đồng ý, hệ thống ghi nhận trạng thái hủy bàn, giải phóng vị trí bàn về trạng thái sẵn sàng đón khách và giữ lại khoản cọc theo đúng quy định."
        ]
    },
    {
        "id": "UC-U4",
        "name": "Gửi đánh giá và phản hồi chất lượng dịch vụ (Submit Guest Feedback & Review)",
        "subsystem": "Khách hàng",
        "actors": "Khách hàng (Chính), Hệ thống quản trị (Phụ)",
        "priority": "Bổ sung (Could Have - Giá trị gia tăng)",
        "relations": "Độc lập (Kênh thu thập khảo sát mức độ hài lòng khách hàng sau trải nghiệm ẩm thực)",
        "objective": "Thu thập ý kiến đánh giá định lượng và đóng góp chất lượng từ khách hàng sau bữa ăn nhằm nâng cao tiêu chuẩn phục vụ của nhà hàng.",
        "preconditions": "Khách hàng đã dùng bữa xong và hoàn tất thủ tục thanh toán hóa đơn.",
        "postconditions": "Dữ liệu khảo sát và chấm điểm được lưu trữ an toàn vào cơ sở dữ liệu và hiển thị trên bảng điều khiển thống kê của Quản lý.",
        "basic_flow": [
            "Khách hàng nhận thư điện tử cảm ơn kèm đường dẫn đánh giá hoặc quét mã QR khảo sát được in trên phiếu hóa đơn thanh toán.",
            "Khách hàng truy cập biểu mẫu khảo sát trực tuyến, lựa chọn mức độ hài lòng theo thang điểm từ 1 đến 5 sao cho từng hạng mục gồm chất lượng món ăn, không gian và thái độ phục vụ.",
            "Khách hàng nhập các ý kiến phản hồi chi tiết hoặc đề xuất cải tiến và nhấn nút Gửi đánh giá.",
            "Hệ thống xác thực tính hợp lệ, lưu trữ dữ liệu khảo sát vào cơ sở dữ liệu và cập nhật chỉ số đo lường mức độ hài lòng khách hàng (CSAT) trên bảng điều khiển quản trị."
        ],
        "alt_flow": [
            "3a. Khách hàng phản ánh mức độ hài lòng dưới 3 sao: Khi khách hàng gửi đánh giá kèm phản ánh mức độ hài lòng dưới 3 sao, hệ thống tự động gắn nhãn cảnh báo ưu tiên và chuyển tiếp thông báo đến hộp thư của Quản lý nhà hàng để kịp thời tiếp thu và xử lý."
        ]
    },

    # 2.3.2 Nhóm Nhân viên Nội bộ
    {
        "id": "UC-E1",
        "name": "Nhân viên tạo Order trực tiếp & Điều phối KDS Bếp (Waitstaff Order Creation & KDS Dispatching)",
        "subsystem": "Nhân viên Nội bộ",
        "actors": "Nhân viên Phục vụ (Chính), Màn hình KDS Bếp (Phụ), Hệ thống tự động (Phụ)",
        "priority": "Trọng yếu (Must Have - Bắt buộc hoàn thành)",
        "relations": "Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5; Bao gồm (include) tương tác Màn hình KDS Bếp (Đẩy vé điện tử qua SignalR)",
        "objective": "Cho phép nhân viên phục vụ đứng tại bàn tiếp nhận yêu cầu gọi món từ thực khách, ghi nhận cảnh báo dị ứng và nhập đơn hàng trên thiết bị di động, kích hoạt tự động việc điều phối vé điện tử lên màn hình KDS Bếp theo phân khu rảnh tay.",
        "preconditions": "Vị trí bàn ăn đã được check-in ở trạng thái Đang phục vụ (Occupied) và khách hàng đã hoàn thành việc chọn món.",
        "postconditions": "Đơn hàng mới được tạo thành công ở trạng thái Đang chế biến (Processing); màn hình KDS tại các phân trạm Bếp nóng, Bếp lạnh và Quầy bar tự động hiển thị vé món mới kèm đồng hồ đếm ngược SLA và cảnh báo dị ứng bôi đậm.",
        "basic_flow": [
            "Khách hàng trao đổi trực tiếp danh sách các món ăn và đồ uống mong muốn gọi với nhân viên phục vụ.",
            "Nhân viên phục vụ mở ứng dụng Web POS trên thiết bị di động, chọn đúng vị trí bàn ăn đang túc trực.",
            "Nhân viên tìm kiếm và thêm các món ăn vào giỏ hàng, đồng thời nhập chi tiết các ghi chú đặc biệt và cảnh báo dị ứng thực phẩm theo yêu cầu của khách hàng.",
            "Nhân viên kiểm tra lại toàn bộ danh mục đơn hàng và nhấn nút Tạo đơn & Gửi Bếp.",
            "Hệ thống khởi tạo thực thể đơn hàng mới với trạng thái Đang chế biến (Processing) và ghi nhận mốc thời gian bắt đầu.",
            "Hệ thống tự động kích hoạt tiến trình phát sự kiện SignalR thời gian thực đẩy vé điện tử ra màn hình KDS tại các trạm Bếp tương ứng với thông tin số bàn, tên món, đồng hồ đếm ngược SLA và bôi đậm nội dung cảnh báo dị ứng thực phẩm."
        ],
        "alt_flow": [
            "6a. Khách hàng gọi bổ sung món ăn trong bữa ăn: Khi khách hàng có nhu cầu gọi bổ sung món ăn trong quá trình dùng bữa, nhân viên phục vụ thực hiện mở lại bàn ăn trên ứng dụng và tạo một lượt gọi món mới; hệ thống sẽ gom chung các món mới vào đơn hàng hiện hữu của bàn và chỉ đẩy vé điện tử lên màn hình KDS cho những món vừa bổ sung."
        ]
    },
    {
        "id": "UC-E2",
        "name": "Phục vụ món & Xác nhận hoàn thành tại quầy Pass (Expediter Serving Confirmation)",
        "subsystem": "Nhân viên Nội bộ",
        "actors": "Nhân viên Điều phối / Checkfood (Chính), Nhân viên Phục vụ (Phụ), Hệ thống tự động (Phụ)",
        "priority": "Trọng yếu (Must Have - Bắt buộc hoàn thành)",
        "relations": "Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5",
        "objective": "Nhân viên Checkfood tại quầy Pass tiếp nhận món ăn hoàn thành từ đầu bếp, kiểm tra tiêu chuẩn chất lượng và lưu ý dị ứng, bấm xác nhận hoàn thành trên thiết bị để kích hoạt thông báo điều phối nhân viên bưng món ra bàn.",
        "preconditions": "Món ăn đã được nhà bếp hoàn thành chế biến và chuyển ra đặt tại quầy Pass có đèn sưởi nhiệt.",
        "postconditions": "Trạng thái món ăn chuyển sang Đã phục vụ (Served); hệ thống lưu mốc thời gian hoàn thành thực tế và gửi tín hiệu thông báo tức thời đến điện thoại của nhân viên phục vụ.",
        "basic_flow": [
            "Đầu bếp nấu xong đĩa món chuẩn mực theo thông tin hiển thị trên màn hình KDS Bếp, đặt ra quầy chuyển món Pass bên dưới đèn giữ nhiệt để nhân viên đối chiếu.",
            "Nhân viên Điều phối (Expediter) tại quầy Pass kiểm tra đối chiếu đĩa món với thông tin hiển thị trên máy tính bảng điều phối, rà soát cẩn thận độ chuẩn xác của các yêu cầu loại trừ dị ứng.",
            "Nhân viên Điều phối nhấn nút Xác nhận hoàn thành món (Served) trên giao diện thiết bị tại quầy Pass.",
            "Hệ thống cập nhật trạng thái món ăn thành Đã phục vụ (Served), ghi nhận mốc thời gian hoàn thành và phát sự kiện thông báo qua SignalR làm rung nhẹ thiết bị di động của nhân viên phục vụ phụ trách bàn.",
            "Nhân viên Điều phối bàn giao đĩa món cho nhân viên phục vụ mang ra bàn đặt cho khách bằng hai tay."
        ],
        "alt_flow": [
            "2a. Đĩa món chế biến sai yêu cầu hoặc bỏ quên ghi chú dị ứng: Khi nhân viên Điều phối phát hiện đĩa món chế biến sai yêu cầu hoặc quên loại bỏ thành phần dị ứng đã ghi chú, nhân viên từ chối bấm xác nhận và yêu cầu đầu bếp lập tức chế biến lại đĩa mới."
        ]
    },
    {
        "id": "UC-E3",
        "name": "Thanh toán, Cấn trừ tiền cọc & Đóng bàn (Checkout, Deposit Deduction & Turnover)",
        "subsystem": "Nhân viên Nội bộ",
        "actors": "Nhân viên Phục vụ (Chính), Khách hàng (Chính), Hệ thống tự động (Phụ)",
        "priority": "Trọng yếu (Must Have - Bắt buộc hoàn thành)",
        "relations": "Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5; Áp dụng công thức cấn trừ tiền cọc theo quy tắc tài chính BR-03",
        "objective": "Tự động tổng hợp chi phí toàn bộ món ăn thực tế đã dùng, tính toán 5% phí phục vụ, 10% thuế VAT, tự động cấn trừ chính xác số tiền cọc đã thu trước đó, xuất hóa đơn tạm tính và đóng bàn phục vụ.",
        "preconditions": "Vị trí bàn ăn đang ở trạng thái Đang phục vụ (Occupied) và toàn bộ các món ăn đã được nhân viên điều phối xác nhận hoàn thành (Served).",
        "postconditions": "Hóa đơn được thanh toán thành công; đơn hàng được đóng lại; trạng thái bàn ăn chuyển sang Chờ dọn dẹp (Cleaning) và sau đó về Sẵn sàng (Available).",
        "basic_flow": [
            "Khách hàng thông báo yêu cầu tính tiền trực tiếp với nhân viên phục vụ hoặc nhấn nút yêu cầu thanh toán trên màn hình E-Menu.",
            "Nhân viên phục vụ mở chức năng Thanh toán bàn ăn tương ứng trên ứng dụng di động.",
            "Hệ thống tự động thực hiện tính toán tài chính tuần tự: Tổng tiền món dùng thực tế, Phí phục vụ bằng 5% tổng tiền món, Thuế VAT bằng 10% của tổng tiền món cộng phí phục vụ, và Số tiền phải thu bằng tổng chi phí trừ đi số tiền cọc đã nộp với cận dưới tối thiểu bằng 0 đồng.",
            "Hệ thống gửi lệnh in phiếu Hóa đơn tạm tính ra máy in nhiệt tại quầy thu ngân; nhân viên kẹp phiếu vào sổ da trang trọng mang ra bàn cho khách kiểm tra đối chiếu.",
            "Khách hàng kiểm tra các mục tiền và thực hiện thanh toán phần chênh lệch còn lại qua tiền mặt, thẻ POS hoặc quét mã VietQR in sẵn trên phiếu.",
            "Nhân viên phục vụ bấm nút Xác nhận hoàn tất thanh toán trên ứng dụng di động.",
            "Hệ thống lưu trữ hóa đơn tài chính cuối cùng và tự động chuyển trạng thái bàn ăn sang Chờ dọn dẹp (Cleaning) để chuẩn bị đón đợt khách kế tiếp."
        ],
        "alt_flow": [
            "3a. Tổng chi phí bữa ăn thấp hơn số tiền cọc đã thanh toán: Khi tổng chi phí bữa ăn thấp hơn số tiền cọc đã thanh toán, hệ thống tự động áp dụng chính sách tiền cọc là mức chi tiêu tối thiểu (Minimum Spend) và thiết lập số tiền phải thu bằng 0 đồng, đồng thời hiển thị thông báo để nhân viên gợi ý khách gọi thêm đồ uống hoặc món tráng miệng mang về.",
            "5a. Khách hàng có thắc mắc về số tiền cọc được khấu trừ: Khi khách hàng có thắc mắc về số tiền cọc được khấu trừ, nhân viên tra cứu trực tiếp lịch sử giao dịch cọc gắn với mã BookingCode trên ứng dụng để giải thích minh bạch cho khách."
        ]
    },
    {
        "id": "UC-E4",
        "name": "Đổi bàn / Chuyển bàn phục vụ (Change & Merge Tables)",
        "subsystem": "Nhân viên Nội bộ",
        "actors": "Nhân viên Phục vụ (Chính), Quản lý (Phụ)",
        "priority": "Quan trọng (Should Have - Rất cần thiết)",
        "relations": "Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5",
        "objective": "Cho phép nhân viên phục vụ chuyển toàn bộ đơn hàng và khoản tiền cọc liên kết từ bàn hiện tại sang một bàn ăn trống khác khi khách hàng có nhu cầu thay đổi chỗ ngồi.",
        "preconditions": "Bàn ăn ban đầu đang ở trạng thái Đang phục vụ (Occupied); vị trí bàn mới mong muốn chuyển đến phải đang ở trạng thái Sẵn sàng (Available).",
        "postconditions": "Toàn bộ dữ liệu đơn hàng và tiền cọc được di chuyển trọn vẹn sang bàn mới; bàn ăn cũ chuyển trạng thái sang Chờ dọn dẹp (Cleaning); bàn ăn mới chuyển sang Đang phục vụ (Occupied).",
        "basic_flow": [
            "Khách hàng đề đạt nguyện vọng chuyển sang vị trí bàn khác thuận tiện hơn.",
            "Nhân viên phục vụ chọn chức năng Đổi bàn trên ứng dụng di động đối với bàn ăn hiện tại.",
            "Hệ thống hiển thị sơ đồ mặt bằng các bàn ăn đang trống khả dụng trong cùng ca phục vụ.",
            "Nhân viên chọn vị trí bàn mới mục tiêu và nhấn nút Xác nhận chuyển bàn.",
            "Hệ thống thực thi giao dịch cơ sở dữ liệu chuyển toàn bộ đơn hàng, các món ăn và giá trị đặt cọc sang mã bàn mới.",
            "Hệ thống chuyển trạng thái bàn cũ sang Chờ dọn dẹp (Cleaning), chuyển bàn mới sang Đang phục vụ (Occupied) và gửi thông báo cập nhật sơ đồ bàn đến quầy Điều phối Pass."
        ],
        "alt_flow": [
            "1a. Khách hàng có nhu cầu ghép thêm bạn và gộp bàn (Merge Tables): Khi khách hàng có nhu cầu ghép thêm bạn và gộp hai bàn ăn lại với nhau, nhân viên sử dụng chức năng Ghép bàn để liên kết hai mã bàn thành một nhóm phục vụ chung và hợp nhất hóa đơn."
        ]
    },
    {
        "id": "UC-E5",
        "name": "Đăng nhập & Xác thực hệ thống nội bộ (Staff Authentication & Authorization)",
        "subsystem": "Nhân viên Nội bộ",
        "actors": "Nhân viên Phục vụ, Điều phối viên, Quản lý, Quản trị viên (Chính)",
        "priority": "Trọng yếu (Must Have - Bắt buộc hoàn thành)",
        "relations": "Use Case nền tảng cơ sở (Base Use Case) được bao gồm bởi toàn bộ các Use Case nghiệp vụ nội bộ của hệ thống",
        "objective": "Cung cấp cơ chế xác thực danh tính an toàn và phân quyền truy cập dựa trên vai trò cho toàn bộ cán bộ nhân viên nhà hàng.",
        "preconditions": "Tài khoản nhân sự đã được Quản trị viên khởi tạo và cấp quyền trên hệ thống.",
        "postconditions": "Người dùng được cấp mã thông báo JWT Bearer Token hợp lệ và được điều hướng tới giao diện màn hình làm việc tương ứng với quyền hạn.",
        "basic_flow": [
            "Nhân viên truy cập trang Đăng nhập hệ thống trên trình duyệt máy tính hoặc thiết bị di động.",
            "Nhân viên nhập Tên đăng nhập hoặc Email và Mật khẩu cá nhân đã được cấp.",
            "Nhân viên nhấn nút Đăng nhập.",
            "Hệ thống thực hiện kiểm tra tính hợp lệ của thông tin tài khoản và kiểm tra trạng thái kích hoạt.",
            "Hệ thống sinh mã thông báo JWT chứa thông tin định danh và danh mục quyền (Roles), sau đó điều hướng người dùng tới giao diện làm việc phù hợp."
        ],
        "alt_flow": [
            "4a. Người dùng nhập sai mật khẩu quá 5 lần liên tiếp: Khi người dùng nhập sai mật khẩu quá 5 lần liên tiếp, hệ thống tự động tạm khóa tài khoản trong 15 phút nhằm phòng chống các cuộc tấn công dò quét mật khẩu tự động.",
            "5a. Mã thông báo JWT hết hạn trong phiên làm việc: Khi mã thông báo JWT hết hạn trong phiên làm việc, hệ thống tự động yêu cầu làm mới phiên hoặc chuyển hướng người dùng về trang đăng nhập để bảo mật dữ liệu."
        ]
    },

    # 2.3.3 Nhóm Quản lý & Quản trị
    {
        "id": "UC-A1",
        "name": "Quản trị Danh mục & Thực đơn món ăn (Menu & Category Management)",
        "subsystem": "Quản lý & Quản trị",
        "actors": "Quản lý Nhà hàng (Chính), Quản trị viên (Phụ)",
        "priority": "Quan trọng (Should Have - Rất cần thiết)",
        "relations": "Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5",
        "objective": "Cung cấp công cụ cho Quản lý thêm mới, chỉnh sửa, cập nhật giá bán, hình ảnh và quản lý trạng thái Còn món hoặc Hết món cho toàn bộ thực đơn ẩm thực.",
        "preconditions": "Quản lý đã đăng nhập thành công vào hệ thống với quyền hạn phù hợp.",
        "postconditions": "Thông tin thực đơn được cập nhật đồng bộ trong cơ sở dữ liệu và hiển thị tức thời trên các thiết bị E-Menu và ứng dụng phục vụ.",
        "basic_flow": [
            "Quản lý truy cập phân hệ Quản lý Thực đơn trên cổng thông tin quản trị.",
            "Hệ thống hiển thị danh sách toàn bộ các món ăn được phân loại theo danh mục ẩm thực.",
            "Quản lý lựa chọn thao tác Thêm món mới hoặc chọn một món hiện có để Chỉnh sửa.",
            "Quản lý nhập hoặc điều chỉnh Tên món, Mô tả câu chuyện ẩm thực, Đơn giá, Phân loại món, Đính kèm hình ảnh và khai báo chi tiết các thành phần gây dị ứng.",
            "Quản lý nhấn nút Lưu thay đổi.",
            "Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào, lưu vào cơ sở dữ liệu và phát sự kiện cập nhật thời gian thực xuống toàn bộ thiết bị hiển thị tại nhà hàng."
        ],
        "alt_flow": [
            "3a. Nhà bếp thông báo hết nguyên liệu đột xuất trong ca phục vụ: Khi nhà bếp thông báo hết nguyên liệu đột xuất trong ca phục vụ, Quản lý sử dụng chức năng Bật/Tắt trạng thái Còn hàng nhanh trên ứng dụng để ngay lập tức ẩn món ăn đó trên E-Menu của khách."
        ]
    },
    {
        "id": "UC-A2",
        "name": "Quản trị & Cấu hình Sơ đồ bàn ăn (Floor Plan Configuration & Canvas)",
        "subsystem": "Quản lý & Quản trị",
        "actors": "Quản lý Nhà hàng (Chính), Quản trị viên (Phụ)",
        "priority": "Quan trọng (Should Have - Rất cần thiết)",
        "relations": "Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5",
        "objective": "Quản lý thiết lập bố cục không gian bàn ăn trực quan theo từng phân khu, định vị tọa độ hiển thị 2D và quản lý mã QR định danh bàn ăn.",
        "preconditions": "Quản lý đã đăng nhập thành công với quyền quản trị sơ đồ mặt bằng.",
        "postconditions": "Bố cục sơ đồ mặt bằng bàn ăn được lưu trữ an toàn và đồng bộ hóa tức thời qua SignalR tới ứng dụng di động của toàn bộ nhân viên.",
        "basic_flow": [
            "Quản lý mở giao diện Quản trị Sơ đồ bàn trên cổng quản trị.",
            "Hệ thống hiển thị màn hình thiết kế mặt bằng trực quan dạng 2D Canvas.",
            "Quản lý lựa chọn phân khu cần thao tác hoặc tạo phân khu mới, sau đó thực hiện kéo thả vị trí bàn, điều chỉnh tên bàn, sức chứa tối đa và hướng hiển thị khớp với thực tế nhà hàng.",
            "Hệ thống tự động khởi tạo mã định danh và mã QR tương ứng với vị trí bàn ăn để phục vụ in đặt tại bàn.",
            "Quản lý kiểm tra tính hợp lý của không gian và nhấn nút Lưu cấu hình sơ đồ bàn.",
            "Hệ thống xác thực tính hợp lệ, lưu trữ các thay đổi vào cơ sở dữ liệu và tự động phát tín hiệu đồng bộ sơ đồ mới tới toàn bộ nhân viên phục vụ đang trong ca trực."
        ],
        "alt_flow": [
            "3a. Thay đổi thông số của bàn đang trong trạng thái phục vụ: Khi Quản lý thực hiện thay đổi thông số sức chứa của một bàn ăn đang trong trạng thái Đang phục vụ, hệ thống sẽ đưa ra cảnh báo ngăn chặn để tránh gây sai lệch dữ liệu phục vụ hiện hành."
        ]
    },
    {
        "id": "UC-A3",
        "name": "Duyệt hoàn tiền cọc thủ công ngoại lệ (Manager Manual Refund Override)",
        "subsystem": "Quản lý & Quản trị",
        "actors": "Quản lý Nhà hàng (Chính), Cổng thanh toán VNPAY (Phụ), Hệ thống tự động (Phụ)",
        "priority": "Quan trọng (Should Have - Rất cần thiết)",
        "relations": "Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5; Tương tác API hoàn tiền cổng VNPAY",
        "objective": "Cung cấp thẩm quyền cho Quản lý xử lý hoàn lại tiền cọc cho khách hàng trong các tình huống phát sinh ngoại lệ hoặc sự cố bất khả kháng ngoài quy tắc hoàn tiền tự động.",
        "preconditions": "Lịch đặt bàn đang ở trạng thái Đã hủy nhưng chưa được hoàn tiền cọc, hoặc có đơn khiếu nại chính đáng từ phía khách hàng.",
        "postconditions": "Khoản tiền cọc được hoàn trả về tài khoản khách hàng thông qua cổng VNPAY; hệ thống lưu vết nhật ký kiểm toán danh tính người phê duyệt.",
        "basic_flow": [
            "Quản lý tiếp nhận khiếu nại từ khách hàng và tra cứu mã đặt bàn BookingCode trên cổng quản trị.",
            "Hệ thống hiển thị chi tiết lịch sử giao dịch đặt cọc và lý do chưa được hoàn tiền tự động.",
            "Quản lý kiểm tra xác minh sự việc và bấm chọn chức năng Hoàn cọc thủ công (Override Refund).",
            "Quản lý nhập bắt buộc nội dung lý do giải trình phê duyệt hoàn tiền vào hệ thống.",
            "Hệ thống gọi API hoàn tiền sang cổng thanh toán VNPAY để thực hiện chuyển khoản lại cho khách hàng.",
            "Hệ thống cập nhật trạng thái đơn đặt cọc thành Đã hoàn cọc ngoại lệ và tự động ghi nhật ký kiểm toán (Audit Log) lưu vết mã định danh của Quản lý đã ký duyệt."
        ],
        "alt_flow": [
            "5a. Kết nối API hoàn tiền sang cổng VNPAY gặp trục trặc gián đoạn: Khi kết nối API hoàn tiền sang cổng VNPAY gặp trục trặc mạng gián đoạn, hệ thống ghi nhận trạng thái Chờ xử lý hoàn cọc và tự động thử lại định kỳ, đồng thời thông báo cho Quản lý nắm bắt tiến độ."
        ]
    },
    {
        "id": "UC-A4",
        "name": "Quản trị Tài khoản & Phân quyền nhân viên (Account & RBAC Administration)",
        "subsystem": "Quản lý & Quản trị",
        "actors": "Quản trị viên - Admin (Chính)",
        "priority": "Quan trọng (Should Have - Rất cần thiết)",
        "relations": "Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5",
        "objective": "Quản trị viên quản lý danh sách nhân sự, khởi tạo tài khoản, phân bổ vai trò nghiệp vụ và khóa tài khoản khi nhân viên nghỉ việc.",
        "preconditions": "Quản trị viên đăng nhập với quyền hạn cao nhất trong hệ thống.",
        "postconditions": "Thông tin nhân sự và quyền hạn truy cập được cập nhật chính xác và có hiệu lực ngay lập tức.",
        "basic_flow": [
            "Quản trị viên truy cập phân hệ Quản lý Nhân sự trên cổng quản trị.",
            "Hệ thống hiển thị danh sách toàn bộ cán bộ nhân viên cùng vai trò được phân công.",
            "Quản trị viên nhấn nút Tạo tài khoản mới hoặc chọn tài khoản hiện có để điều chỉnh.",
            "Quản trị viên nhập thông tin nhân sự gồm Họ tên, Số điện thoại, Email và gán vai trò tương ứng gồm Phục vụ, Điều phối viên, Quản lý hoặc Quản trị viên.",
            "Quản trị viên nhấn nút Lưu tài khoản.",
            "Hệ thống tạo mã định danh, lưu trữ thông tin an toàn và tự động gửi thư điện tử kích hoạt kèm mật khẩu mặc định tới nhân viên."
        ],
        "alt_flow": [
            "3a. Nhân viên nghỉ việc hoặc điều chuyển công tác: Khi nhân viên nghỉ việc, Quản trị viên thực hiện kích hoạt chức năng Khóa tài khoản; hệ thống ngay lập tức vô hiệu hóa phiên làm việc hiện hành của tài khoản đó trên toàn bộ các thiết bị."
        ]
    },
    {
        "id": "UC-A5",
        "name": "Xem Báo cáo Thống kê & Dashboard doanh thu (Analytics & Executive Reporting)",
        "subsystem": "Quản lý & Quản trị",
        "actors": "Quản lý Nhà hàng, Quản trị viên (Chính)",
        "priority": "Bổ sung (Could Have - Giá trị gia tăng)",
        "relations": "Bao gồm (include) Use Case cơ sở Đăng nhập UC-E5",
        "objective": "Cung cấp bảng điều khiển trực quan tổng hợp doanh thu, tỷ lệ lấp đầy bàn ăn, số lượng hủy cọc và xếp hạng các món ăn bán chạy nhất theo thời gian thực.",
        "preconditions": "Quản lý hoặc Quản trị viên đã đăng nhập thành công vào cổng thông tin quản trị.",
        "postconditions": "Các biểu đồ phân tích và bảng số liệu thống kê được hiển thị trực quan và hỗ trợ xuất báo cáo định dạng chuẩn.",
        "basic_flow": [
            "Quản lý chọn phân hệ Báo cáo Thống kê trên thanh điều hướng.",
            "Quản lý chọn khung thời gian cần phân tích theo Ngày, Tuần, Tháng hoặc khoảng thời gian tùy chỉnh.",
            "Hệ thống tổng hợp dữ liệu từ các phân hệ Hóa đơn, Đặt bàn và Đơn hàng trong cơ sở dữ liệu.",
            "Hệ thống hiển thị bảng điều khiển trực quan gồm biểu đồ đường biến động doanh thu, biểu đồ tròn phân bổ món ăn bán chạy và các chỉ số vận hành trọng yếu.",
            "Quản lý có thể nhấn nút Xuất báo cáo để tải tệp dữ liệu chi tiết phục vụ công tác đối soát."
        ],
        "alt_flow": [
            "4a. Tỷ lệ hủy bàn hoặc vắng mặt tăng cao bất thường: Khi hệ thống phát hiện tỷ lệ hủy bàn hoặc không đến dùng bữa tăng cao bất thường trong một ca phục vụ, bảng điều khiển tự động hiển thị biểu tượng cảnh báo để Quản lý kịp thời rà soát nguyên nhân."
        ]
    },

    # 2.3.4 Nhóm Hệ thống Tự động
    {
        "id": "UC-S1",
        "name": "Tự động giải phóng bàn hết hạn giữ cọc (Auto-Release Expired Reservation Lock)",
        "subsystem": "Hệ thống Tự động",
        "actors": "Hệ thống tự động / Background Worker (Chính)",
        "priority": "Trọng yếu (Must Have - Bắt buộc hoàn thành)",
        "relations": "Mở rộng (extend) cho Use Case Đặt bàn UC-U1 khi phát sinh quá hạn thời gian",
        "objective": "Tiến trình chạy ngầm định kỳ quét cơ sở dữ liệu mỗi 60 giây, tự động phát hiện và hủy các phiên đặt bàn quá 17 phút mà chưa nhận được thanh toán cọc, giải phóng bàn về trạng thái sẵn sàng và đồng bộ sơ đồ qua SignalR.",
        "preconditions": "Tồn tại các bản ghi đặt bàn ở trạng thái Chờ thanh toán (PendingPayment) có thời gian khởi tạo vượt quá 17 phút.",
        "postconditions": "Vị trí bàn ăn được giải phóng về trạng thái Sẵn sàng (Available); phiên đặt bàn chuyển sang Hết hạn (Expired); sơ đồ bàn trên thiết bị của nhân viên được cập nhật màu sắc thời gian thực.",
        "basic_flow": [
            "Tiến trình dịch vụ nền (Background Worker) được kích hoạt tự động theo chu kỳ mỗi 60 giây một lần.",
            "Hệ thống thực hiện truy vấn cơ sở dữ liệu để tìm kiếm tất cả các đơn đặt chỗ đang ở trạng thái Chờ thanh toán có mốc thời gian tạo đã vượt quá 17 phút.",
            "Hệ thống cập nhật trạng thái các đơn đặt chỗ thỏa mãn điều kiện sang Đã hết hạn giữ chỗ (Expired_Cancelled).",
            "Hệ thống cập nhật trạng thái các vị trí bàn ăn tương ứng từ trạng thái Khóa giữ chỗ (Locked) trở về trạng thái Sẵn sàng đón khách (Available).",
            "Hệ thống phát thông điệp sự kiện qua kênh SignalR Hub để lập tức đổi màu trạng thái bàn ăn thành màu xanh lá cây trên màn hình làm việc của toàn bộ nhân viên và quản lý.",
            "Hệ thống ghi nhận thông tin chi tiết vào nhật ký kiểm toán hệ thống để lưu vết lịch sử giải phóng bàn tự động."
        ],
        "alt_flow": [
            "4a. Cổng VNPAY phản hồi tín hiệu thanh toán thành công trễ sau 17 phút: Khi cổng VNPAY phản hồi tín hiệu thanh toán thành công nhưng bị trễ sau 17 phút và vị trí bàn cũ đã được cấp cho khách hàng khác, hệ thống tự động kích hoạt tiến trình tìm kiếm bàn trống tương đương để bố trí cho khách; trường hợp nhà hàng đã kín chỗ, hệ thống chuyển giao dịch sang trạng thái ngoại lệ và kích hoạt cảnh báo ưu tiên cao tới Quản lý để gọi điện hỗ trợ."
        ]
    }
]

# =============================================================================
# CHƯƠNG 3: DIỄN GIẢI 12 QUY TRÌNH HOẠT ĐỘNG (ACTIVITY DIAGRAMS)
# =============================================================================

ACTIVITY_DIAGRAMS_DATA = [
    {
        "id": "AD-01",
        "title": "Quy trình Đặt bàn trực tuyến & Đặt cọc VNPAY",
        "img": "ad01_reservation_deposit.png",
        "lanes": "Khách hàng | Hệ thống VinDining | Cổng thanh toán VNPAY",
        "desc": [
            "Khách hàng chủ động truy cập hệ thống website đặt chỗ, lựa chọn thời gian dùng bữa, ca phục vụ, số lượng người tham dự và phân khu bàn ăn mong muốn.",
            "Hệ thống tiếp nhận thông số, thực hiện tra cứu trạng thái khả dụng trên sơ đồ mặt bằng thời gian thực và phản hồi danh sách các vị trí bàn ăn phù hợp.",
            "Khách hàng điền đầy đủ thông tin định danh cá nhân, nhập các ghi chú đặc biệt hoặc lưu ý dị ứng thực phẩm và bấm chọn phương thức thanh toán tiền cọc.",
            "Hệ thống thiết lập trạng thái khóa giữ chỗ tạm thời cho vị trí bàn ăn trong thời gian tối đa 17 phút và khởi tạo phiên giao dịch chuyển tiếp sang cổng VNPAY.",
            "Khách hàng thực hiện thao tác quét mã VietQR hoặc nhập thông tin thanh toán trên giao diện bảo mật của cổng VNPAY trong vòng 15 phút.",
            "Cổng VNPAY xử lý trừ tiền và phát tín hiệu thông báo tức thời (IPN callback) về máy chủ hệ thống VinDining.",
            "Hệ thống cập nhật trạng thái bàn ăn sang Đã đặt chỗ (Reserved), lưu trữ thông tin cọc và phát thông báo xác nhận thành công tới khách hàng."
        ]
    },
    {
        "id": "AD-02",
        "title": "Quy trình Nhân viên Order trực tiếp & Điều phối KDS Bếp",
        "img": "ad02_waitstaff_ordering.png",
        "lanes": "Khách hàng | Nhân viên Phục vụ (Waitstaff) | Hệ thống VinDining & Màn hình KDS Bếp",
        "desc": [
            "Khách hàng xem hình ảnh và chi tiết món ăn qua Web E-Menu trên điện thoại cá nhân (quét mã QR tại bàn) hoặc mượn Tablet dùng chung, sau đó trao đổi trực tiếp nguyện vọng gọi món với nhân viên phục vụ.",
            "Nhân viên phục vụ mở ứng dụng di động Web POS, lựa chọn đúng số bàn đang phục vụ và thực hiện thêm các món ăn vào đơn gọi món.",
            "Nhân viên ghi nhận kỹ lưỡng các cảnh báo dị ứng thực phẩm và ghi chú khẩu vị riêng biệt của từng vị khách theo từng món ăn cụ thể.",
            "Nhân viên phục vụ rà soát lại toàn bộ đơn hàng và bấm chọn xác nhận Tạo đơn & Gửi Bếp trên thiết bị di động.",
            "Hệ thống ghi nhận đơn hàng mới vào cơ sở dữ liệu với trạng thái Đang chế biến và tự động phát sự kiện SignalR điều phối vé điện tử ra các phân trạm Bếp tương ứng.",
            "Màn hình KDS Bếp tại các phân khu Bếp nóng, Bếp lạnh và Quầy bar tự động hiển thị vé gọi món điện tử với đầy đủ thông tin số bàn, danh mục món, đồng hồ đếm ngược SLA và nội dung cảnh báo dị ứng được bôi đậm rõ nét."
        ]
    },
    {
        "id": "AD-03",
        "title": "Quy trình Kiểm đồ (Checkfood) & Xác nhận hoàn thành món tại quầy Pass",
        "img": "ad03_serving_confirmation.png",
        "lanes": "Nhà bếp (Kitchen/Chef) | Điều phối viên (Expediter / Checkfood) | Hệ thống VinDining",
        "desc": [
            "Đầu bếp căn cứ theo thông tin vé điện tử hiển thị trên màn hình KDS Bếp để tiến hành chế biến món ăn chuẩn mực và đặt đĩa món hoàn chỉnh ra quầy chuyển món Pass dưới hệ thống đèn sưởi nhiệt.",
            "Nhân viên Điều phối tại quầy Pass tiếp nhận đĩa món, đối chiếu cẩn thận hình thức trình bày và thành phần chế biến với thông tin trên máy tính bảng điều phối Pass.",
            "Nhân viên Điều phối kiểm tra nghiêm ngặt tính tuân thủ đối với các cảnh báo dị ứng thực phẩm của thực khách.",
            "Nhân viên Điều phối nhấn nút Xác nhận hoàn thành món trên giao diện máy tính bảng tại quầy Pass theo đúng thẩm quyền được phân công.",
            "Hệ thống ghi nhận trạng thái món ăn thành Đã phục vụ (Served), lưu mốc thời gian thực hiện và phát tín hiệu thông báo tức thời qua SignalR tới điện thoại của nhân viên phục vụ phụ trách bàn.",
            "Nhân viên phục vụ tiếp nhận món ăn từ quầy Pass và bưng ra phục vụ tại bàn cho khách hàng bằng hai tay trang trọng."
        ]
    },
    {
        "id": "AD-04",
        "title": "Quy trình Thanh toán, Cấn trừ tiền cọc & Đóng bàn",
        "img": "ad04_invoice_settlement.png",
        "lanes": "Khách hàng | Nhân viên Phục vụ / Thu ngân | Hệ thống VinDining",
        "desc": [
            "Khách hàng đưa ra yêu cầu tính tiền bữa ăn trực tiếp với nhân viên phục vụ hoặc qua thao tác trên màn hình hiển thị tại bàn.",
            "Nhân viên phục vụ mở chức năng Thanh toán bàn ăn tương ứng trên thiết bị di động cá nhân.",
            "Hệ thống tự động tính toán tổng tiền món thực tế, cộng thêm 5% phí phục vụ và 10% thuế VAT, sau đó tự động cấn trừ chính xác số tiền cọc đã thanh toán từ trước.",
            "Hệ thống in phiếu Hóa đơn tạm tính hiển thị minh bạch toàn bộ các dòng tiền cấn trừ ra máy in thu ngân; nhân viên kẹp phiếu vào sổ da mang ra bàn cho khách đối chiếu.",
            "Khách hàng kiểm tra chứng từ và thực hiện thanh toán phần chênh lệch còn lại qua tiền mặt, thẻ POS hoặc quét mã VietQR in trên phiếu.",
            "Nhân viên phục vụ bấm nút xác nhận Hoàn tất thanh toán trên ứng dụng di động.",
            "Hệ thống lưu trữ hóa đơn thanh toán hoàn tất và tự động chuyển trạng thái bàn ăn sang Chờ dọn dẹp (Cleaning) để chuẩn bị đón đợt khách tiếp theo."
        ]
    },
    {
        "id": "AD-05",
        "title": "Quy trình Hủy đặt bàn & Hoàn phạt tiền cọc VNPAY",
        "img": "ad05_cancellation_refund.png",
        "lanes": "Khách hàng / Quản lý | Hệ thống VinDining | Cổng thanh toán VNPAY",
        "desc": [
            "Khách hàng hoặc Quản lý gửi yêu cầu hủy lịch đặt bàn qua trang tra cứu trực tuyến hoặc cổng thông tin quản trị.",
            "Hệ thống tiếp nhận yêu cầu và tự động tính toán khoảng chênh lệch thời gian từ thời điểm hiện tại đến giờ hẹn dùng bữa thực tế.",
            "Trường hợp thời gian hủy trước giờ hẹn từ 4 tiếng trở lên, hệ thống tự động gửi lệnh gọi API hoàn tiền 100% sang cổng thanh toán VNPAY.",
            "Cổng VNPAY tiếp nhận lệnh, hoàn trả tiền cọc về tài khoản của khách và phản hồi xác nhận cho hệ thống.",
            "Hệ thống cập nhật trạng thái lịch đặt bàn sang Đã hủy và giải phóng vị trí bàn ăn về trạng thái Sẵn sàng đón khách.",
            "Trường hợp thời gian hủy dưới 4 tiếng trước giờ hẹn, hệ thống ghi nhận hủy lịch, đưa bàn về trạng thái sẵn sàng nhưng giữ lại toàn bộ tiền cọc làm phí phạt bồi hoàn chi phí chuẩn bị nguyên liệu."
        ]
    },
    {
        "id": "AD-06",
        "title": "Quy trình Đăng nhập & Xác thực nhân viên nội bộ",
        "img": "ad06_staff_login.png",
        "lanes": "Nhân viên nội bộ | Ứng dụng Web POS / Portal | Backend API & Cơ sở dữ liệu",
        "desc": [
            "Nhân viên nhập Tên đăng nhập hoặc Email và Mật khẩu cá nhân vào biểu mẫu đăng nhập hệ thống.",
            "Ứng dụng thực hiện kiểm tra tính hợp lệ cơ bản của dữ liệu và gửi yêu cầu xác thực bảo mật tới máy chủ Backend API.",
            "Hệ thống Backend truy vấn cơ sở dữ liệu, kiểm tra tính khớp của mật khẩu đã được mã hóa bảo mật và trạng thái hoạt động của tài khoản.",
            "Hệ thống xác thực thành công, đóng gói thông tin vai trò người dùng và sinh mã thông báo JWT Bearer Token có thời hạn.",
            "Ứng dụng lưu trữ token bảo mật và tự động điều hướng nhân viên tới giao diện màn hình chức năng tương ứng với vai trò được giao."
        ]
    },
    {
        "id": "AD-07",
        "title": "Quy trình Chuyển bàn / Đổi bàn phục vụ",
        "img": "ad07_change_table.png",
        "lanes": "Nhân viên Phục vụ | Hệ thống VinDining & CSDL | Màn hình Khách & Bếp",
        "desc": [
            "Khách hàng đề đạt nguyện vọng chuyển đổi chỗ ngồi sang một khu vực hoặc vị trí bàn khác trong nhà hàng.",
            "Nhân viên phục vụ mở chức năng Đổi bàn trên thiết bị di động và tra cứu danh sách các bàn ăn đang trống khả dụng.",
            "Nhân viên chọn vị trí bàn mới mục tiêu và xác nhận thực hiện thao tác chuyển đổi.",
            "Hệ thống thực thi giao dịch cơ sở dữ liệu chuyển toàn bộ đơn hàng, danh mục món ăn và khoản tiền cọc liên kết sang mã bàn mới.",
            "Hệ thống chuyển trạng thái bàn cũ sang Chờ dọn dẹp và chuyển bàn mới sang trạng thái Đang phục vụ.",
            "Hệ thống tự động phát thông báo qua SignalR cập nhật số bàn mới tới quầy điều phối Pass để nhân viên giao đúng vị trí."
        ]
    },
    {
        "id": "AD-08",
        "title": "Quy trình Quản trị & Cấu hình Sơ đồ bàn ăn",
        "img": "ad08_floor_plan.png",
        "lanes": "Quản lý Nhà hàng | Hệ thống API & CSDL | Ứng dụng Nhân viên phục vụ",
        "desc": [
            "Quản lý truy cập giao diện Quản trị Sơ đồ bàn ăn trên cổng thông tin quản trị.",
            "Hệ thống hiển thị không gian thiết kế mặt bằng trực quan dạng 2D Canvas tương ứng với từng phân khu nhà hàng.",
            "Quản lý thực hiện thêm mới phân khu, kéo thả định vị tọa độ các bàn ăn, cập nhật sức chứa tối đa và cấu hình mã kết nối thiết bị hiển thị.",
            "Quản lý nhấn nút Lưu thay đổi sơ đồ mặt bằng.",
            "Hệ thống kiểm tra tính hợp lệ của cấu hình, lưu trữ dữ liệu vào cơ sở dữ liệu và phát sự kiện đồng bộ qua SignalR Hub.",
            "Ứng dụng của toàn bộ nhân viên phục vụ tự động cập nhật và hiển thị giao diện sơ đồ mặt bằng mới theo thời gian thực."
        ]
    },
    {
        "id": "AD-09",
        "title": "Quy trình Duyệt hoàn cọc thủ công ngoại lệ",
        "img": "ad09_manual_refund.png",
        "lanes": "Quản lý Nhà hàng | Hệ thống API & Audit Log | Cổng thanh toán VNPAY",
        "desc": [
            "Quản lý tiếp nhận khiếu nại hoặc thông tin sự cố bất khả kháng từ khách hàng và tra cứu mã đặt bàn BookingCode trên hệ thống.",
            "Hệ thống hiển thị chi tiết lịch sử giao dịch và lý do khoản tiền cọc chưa được xử lý hoàn trả tự động.",
            "Quản lý chọn chức năng Phê duyệt hoàn cọc thủ công ngoại lệ và nhập bắt buộc lý do giải trình phê duyệt.",
            "Hệ thống gửi yêu cầu gọi API hoàn trả tiền cọc sang cổng thanh toán VNPAY.",
            "Cổng VNPAY xử lý giao dịch hoàn tiền về tài khoản của khách hàng và phản hồi kết quả thành công.",
            "Hệ thống cập nhật trạng thái đơn đặt cọc và tự động ghi nhật ký kiểm toán lưu vết mã định danh Quản lý đã ký duyệt."
        ]
    },
    {
        "id": "AD-10",
        "title": "Quy trình Tự động quét & Giải phóng bàn hết hạn giữ cọc",
        "img": "ad10_auto_release_timeout.png",
        "lanes": "Tiến trình chạy ngầm (Hangfire) | Cơ sở dữ liệu SQL Server | Kênh SignalR Hub",
        "desc": [
            "Tiến trình dịch vụ nền tự động kích hoạt chu kỳ quét định kỳ mỗi 60 giây một lần.",
            "Hệ thống thực hiện truy vấn cơ sở dữ liệu để tìm kiếm các bản ghi đặt chỗ ở trạng thái Chờ thanh toán đã vượt quá thời hạn 17 phút.",
            "Hệ thống cập nhật trạng thái các đơn đặt chỗ thỏa mãn sang Đã hết hạn giữ cọc.",
            "Hệ thống đưa trạng thái vị trí bàn ăn tương ứng từ trạng thái Khóa giữ chỗ trở về trạng thái Sẵn sàng đón khách.",
            "Hệ thống phát thông điệp sự kiện qua SignalR Hub để cập nhật tức thời màu sắc trạng thái bàn trên màn hình của nhân viên phục vụ.",
            "Trường hợp phát sinh phản hồi thanh toán thành công trễ sau khi bàn đã được giải phóng, hệ thống tự động quét tìm bàn ăn trống tương đương hoặc gửi cảnh báo ưu tiên tới Quản lý để xử lý ngoại lệ."
        ]
    },
    {
        "id": "AD-11",
        "title": "Quy trình Quản trị Thực đơn & Trạng thái món",
        "img": "ad11_menu_management.png",
        "lanes": "Quản lý Ẩm thực / Bếp | Hệ thống Web API | Màn hình Khách & POS Phục vụ",
        "desc": [
            "Quản lý mở giao diện Quản trị Thực đơn trên cổng thông tin quản trị.",
            "Quản lý thực hiện thêm món mới hoặc điều chỉnh giá bán, hình ảnh, mô tả thành phần và các thông tin cảnh báo dị ứng thực phẩm.",
            "Khi xảy ra tình trạng hết nguyên liệu chế biến đột xuất, Quản lý thao tác bật/tắt nhanh trạng thái Còn món hoặc Hết món.",
            "Quản lý bấm nút Lưu thay đổi dữ liệu thực đơn.",
            "Hệ thống xác thực dữ liệu, cập nhật cơ sở dữ liệu và phát tín hiệu đồng bộ thời gian thực.",
            "Trang Web E-Menu và ứng dụng di động của nhân viên phục vụ tự động cập nhật danh mục món ăn mới ngay lập tức qua SignalR."
        ]
    },
    {
        "id": "AD-12",
        "title": "Quy trình Khách hàng đánh giá & Phản hồi dịch vụ CSAT",
        "img": "ad12_guest_feedback.png",
        "lanes": "Khách hàng | Hệ thống Backend API | Bảng điều khiển Quản trị",
        "desc": [
            "Sau khi hoàn tất thanh toán hóa đơn, khách hàng nhận đường dẫn khảo sát qua thư điện tử hoặc quét mã QR trên phiếu tính tiền.",
            "Khách hàng truy cập biểu mẫu khảo sát, thực hiện chấm điểm hài lòng theo thang điểm từ 1 đến 5 sao và đóng góp ý kiến nhận xét.",
            "Khách hàng nhấn nút Gửi đánh giá dịch vụ.",
            "Hệ thống Backend tiếp nhận dữ liệu, kiểm tra tính hợp lệ và lưu trữ phản hồi vào cơ sở dữ liệu.",
            "Hệ thống tự động tính toán chỉ số đo lường mức độ hài lòng khách hàng (CSAT) và cập nhật số liệu lên bảng điều khiển quản trị.",
            "Trường hợp phản hồi có mức đánh giá thấp dưới chuẩn, hệ thống tự động phát cảnh báo ưu tiên tới Quản lý để kịp thời liên hệ giải quyết."
        ]
    }
]

# =============================================================================
# CHƯƠNG 4: DIỄN GIẢI 12 TƯƠNG TÁC TUẦN TỰ (SEQUENCE DIAGRAMS)
# =============================================================================

SEQUENCE_DIAGRAMS_DATA = [
    {
        "id": "SD-01",
        "title": "Đặt bàn trực tuyến & Thanh toán cọc qua VNPAY",
        "img": "sd01_reservation_vnpay.png",
        "lifelines": "Guest | WebBookingSPA | ReservationAPI | VNPAYGateway | Database | SignalRHub",
        "desc": [
            "Khách hàng thực hiện gửi yêu cầu tra cứu bàn trống và chọn vị trí bàn trên giao diện WebBookingSPA.",
            "Giao diện SPA gửi lệnh HTTP POST khởi tạo phiên đặt cọc tới ReservationAPI.",
            "API kiểm tra trạng thái khả dụng, thực hiện khóa giữ chỗ tạm thời bàn ăn trong 17 phút và gọi dịch vụ cổng VNPAY tạo liên kết thanh toán.",
            "Khách hàng được chuyển hướng sang giao diện VNPAY và tiến hành quét mã VietQR hoàn tất trừ tiền trong thời hạn 15 phút.",
            "Cổng VNPAY phát tín hiệu IPN callback bất đồng bộ về ReservationAPI để xác nhận kết quả thanh toán thành công.",
            "API cập nhật trạng thái bàn sang Reserved trong Database, sinh mã BookingCode và phát sự kiện qua SignalRHub để đồng bộ giao diện sơ đồ bàn."
        ]
    },
    {
        "id": "SD-02",
        "title": "Nhân viên tạo Order trực tiếp & Điều phối KDS Bếp",
        "img": "sd02_waitstaff_ordering.png",
        "lanes": "Waitstaff | POSClient | OrderAPI | Database | KitchenHub (SignalR) | KitchenKDS",
        "desc": [
            "Nhân viên phục vụ nhập danh sách món ăn cùng các ghi chú cảnh báo dị ứng trên ứng dụng di động POSClient và nhấn nút Gửi đơn.",
            "Ứng dụng POSClient gửi yêu cầu HTTP POST đóng gói đơn hàng tới OrderAPI.",
            "OrderAPI thực hiện kiểm tra tính hợp lệ của dữ liệu đầu vào qua FluentValidation Pipeline.",
            "API lưu trữ đơn hàng mới với trạng thái Processing vào Database thông qua Unit of Work Pattern.",
            "API gửi thông điệp sự kiện thời gian thực tới KitchenHub thông qua kết nối SignalR WebSocket để phân luồng vé điện tử theo phân khu Bếp tương ứng.",
            "KitchenHub đẩy vé gọi món trực tiếp lên màn hình KitchenKDS tại các trạm Bếp rảnh tay, kích hoạt đồng hồ đếm ngược SLA và làm nổi bật cảnh báo dị ứng thực phẩm."
        ]
    },
    {
        "id": "SD-03",
        "title": "Kiểm đồ (Checkfood) & Xác nhận hoàn thành món tại quầy Pass",
        "img": "sd03_serving_confirmation.png",
        "lanes": "Chef | Expediter | PassTablet | KitchenHub | Database | WaitstaffDevice",
        "desc": [
            "Đầu bếp đặt đĩa món hoàn chỉnh ra quầy chuyển món Pass bên dưới hệ thống đèn giữ nhiệt.",
            "Nhân viên Điều phối kiểm tra đối chiếu đĩa món trên PassTablet và nhấn nút Xác nhận hoàn thành (Served).",
            "Thiết bị PassTablet gửi yêu cầu cập nhật trạng thái món ăn kèm mốc thời gian hoàn thành tới Backend API.",
            "Backend API cập nhật trạng thái món ăn thành Served trong Database.",
            "Backend API kích hoạt sự kiện thời gian thực thông qua KitchenHub gửi tới WaitstaffDevice của nhân viên phụ trách bàn.",
            "Thiết bị di động của nhân viên phục vụ phát tín hiệu rung thông báo đĩa món đã sẵn sàng để bưng ra bàn cho thực khách."
        ]
    },
    {
        "id": "SD-04",
        "title": "Thanh toán hóa đơn, Cấn trừ cọc & Đóng bàn",
        "img": "sd04_invoice_settlement.png",
        "lanes": "Guest | Waitstaff | BillingAPI | CashierPrinter | Database | TableHub",
        "desc": [
            "Khách hàng thông báo yêu cầu tính tiền bữa ăn với nhân viên phục vụ.",
            "Nhân viên phục vụ chọn chức năng Thanh toán trên ứng dụng di động gửi yêu cầu tới BillingAPI.",
            "BillingAPI truy vấn toàn bộ các món ăn đã dùng, tự động tính 5% phí phục vụ, 10% thuế VAT và cấn trừ chính xác số tiền cọc đã thu trước đó.",
            "BillingAPI phát lệnh in phiếu Hóa đơn tạm tính kèm mã VietQR động ra thiết bị CashierPrinter để nhân viên kẹp sổ da mang ra bàn.",
            "Khách hàng hoàn tất thanh toán phần tiền chênh lệch còn lại và nhân viên phục vụ bấm xác nhận trên ứng dụng.",
            "BillingAPI lưu trữ giao dịch hóa đơn thành công vào Database và gửi sự kiện qua TableHub chuyển trạng thái bàn sang Cleaning."
        ]
    },
    {
        "id": "SD-05",
        "title": "Hủy đặt bàn & Hoàn tiền cọc VNPAY",
        "img": "sd05_cancellation_refund.png",
        "lanes": "Guest | BookingPortal | CancelAPI | VNPAYRefundService | Database | NotificationService",
        "desc": [
            "Khách hàng nhập mã BookingCode và gửi yêu cầu hủy đặt chỗ trên giao diện BookingPortal.",
            "Giao diện gửi yêu cầu HTTP POST hủy đặt bàn tới CancelAPI.",
            "CancelAPI tính toán khoảng cách thời gian giữa thời điểm hiện tại và giờ hẹn dùng bữa.",
            "Xác nhận thời gian hủy trước giờ hẹn từ 4 tiếng trở lên, CancelAPI gọi dịch vụ VNPAYRefundService thực hiện lệnh hoàn tiền 100%.",
            "VNPAYRefundService chuyển tiền cọc về tài khoản khách hàng và phản hồi kết quả thành công cho hệ thống.",
            "CancelAPI cập nhật trạng thái đặt bàn sang Cancelled, giải phóng bàn về Available trong Database và kích hoạt NotificationService gửi thông báo xác nhận."
        ]
    },
    {
        "id": "SD-06",
        "title": "Đăng nhập & Xác thực JWT Token nhân viên nội bộ",
        "img": "sd06_staff_login.png",
        "lanes": "StaffUser | AuthClient | IdentityAPI | SecurityService | Database | SessionStorage",
        "desc": [
            "Nhân viên nhập thông tin định danh gồm Tên đăng nhập và Mật khẩu trên giao diện AuthClient.",
            "AuthClient gửi yêu cầu xác thực bảo mật tới IdentityAPI.",
            "IdentityAPI truy vấn thông tin tài khoản và đối chiếu mật khẩu băm bảo mật trong Database.",
            "Hệ thống xác thực thành công, SecurityService khởi tạo mã thông báo JWT Bearer Token chứa thông tin vai trò và danh mục quyền hạn.",
            "IdentityAPI phản hồi token về cho AuthClient lưu trữ an toàn trong SessionStorage để đính kèm vào các yêu cầu tiếp theo."
        ]
    },
    {
        "id": "SD-07",
        "title": "Chuyển bàn / Đổi bàn trực tiếp tại nhà hàng",
        "img": "sd07_change_table.png",
        "lanes": "Guest | Waitstaff | TableAPI | UnitOfWork | Database | FloorPlanHub",
        "desc": [
            "Khách hàng đề đạt nguyện vọng chuyển đổi chỗ ngồi sang vị trí bàn ăn khác thuận tiện hơn.",
            "Nhân viên phục vụ chọn bàn mới trên ứng dụng di động và gửi yêu cầu đổi bàn tới TableAPI.",
            "TableAPI kiểm tra trạng thái bàn mới mục tiêu đảm bảo đang ở trạng thái Available.",
            "API thực thi giao dịch UnitOfWork chuyển giao toàn bộ đơn hàng, danh mục món ăn và tiền cọc sang mã bàn mới trong Database.",
            "Hệ thống cập nhật trạng thái bàn cũ sang Cleaning và bàn mới sang Occupied.",
            "TableAPI phát sự kiện qua FloorPlanHub để đồng bộ tức thời trạng thái bàn mới tới toàn bộ nhân viên và quầy Pass."
        ]
    },
    {
        "id": "SD-08",
        "title": "Quản trị & Cấu hình Sơ đồ bàn ăn",
        "img": "sd08_floor_plan.png",
        "lanes": "Manager | AdminPortal | FloorPlanAPI | Database | FloorPlanHub | StaffClients",
        "desc": [
            "Quản lý điều chỉnh tọa độ bố trí bàn ăn và cấu hình mã định danh bàn trên giao diện 2D Canvas của AdminPortal.",
            "AdminPortal gửi dữ liệu cấu hình mặt bằng mới tới FloorPlanAPI.",
            "FloorPlanAPI kiểm tra các ràng buộc nghiệp vụ đảm bảo không có sự trùng lặp mã bàn hoặc thay đổi bàn đang phục vụ.",
            "API lưu trữ toàn bộ cấu hình sơ đồ mặt bằng mới vào Database.",
            "FloorPlanAPI phát sự kiện cập nhật cấu hình qua FloorPlanHub.",
            "Tất cả các ứng dụng StaffClients của nhân viên phục vụ nhận sự kiện và tự động vẽ lại sơ đồ mặt bằng theo thời gian thực."
        ]
    },
    {
        "id": "SD-09",
        "title": "Quản lý duyệt hoàn tiền cọc thủ công ngoại lệ",
        "img": "sd09_manual_refund.png",
        "lanes": "Manager | AdminPortal | RefundAPI | VNPAYGateway | AuditLogService | Database",
        "desc": [
            "Quản lý tra cứu đơn đặt bàn phát sinh khiếu nại và nhập nội dung giải trình phê duyệt trên AdminPortal.",
            "AdminPortal gửi yêu cầu phê duyệt hoàn tiền thủ công ngoại lệ tới RefundAPI.",
            "RefundAPI xác thực thẩm quyền Quản lý và kích hoạt lệnh gọi API sang cổng VNPAYGateway.",
            "Cổng VNPAY tiếp nhận và hoàn trả khoản tiền cọc về tài khoản của khách hàng thành công.",
            "RefundAPI cập nhật trạng thái giao dịch đặt cọc thành công trong Database.",
            "AuditLogService tự động ghi nhận nhật ký kiểm toán lưu vết mã định danh Quản lý, mốc thời gian và lý do phê duyệt hoàn cọc."
        ]
    },
    {
        "id": "SD-10",
        "title": "Tự động giải phóng bàn hết hạn giữ cọc & Xử lý Late IPN",
        "img": "sd10_auto_release_late_ipn.png",
        "lanes": "HangfireWorker | Database | TableStateService | SignalRHub | LateIPNHandler | ManagerAlertQueue",
        "desc": [
            "Tiến trình HangfireWorker định kỳ mỗi 60 giây gửi lệnh quét Database tìm các đơn đặt cọc PendingPayment quá 17 phút.",
            "TableStateService cập nhật trạng thái các đơn quá hạn sang Expired và đưa vị trí bàn ăn về Available trong Database.",
            "Hệ thống phát sự kiện qua SignalRHub đồng bộ màu sắc bàn ăn xanh lá cây trên sơ đồ của nhân viên phục vụ.",
            "Trường hợp cổng thanh toán gửi tín hiệu IPN thành công trễ sau khi bàn đã bị giải phóng, LateIPNHandler tiếp nhận xử lý.",
            "LateIPNHandler quét tìm bàn ăn trống tương đương trong cùng phân khu để tự động gán cho khách hàng.",
            "Trường hợp nhà hàng đã kín chỗ, LateIPNHandler đẩy bản ghi vào ManagerAlertQueue để Quản lý chủ động gọi điện xử lý ngoại lệ."
        ]
    },
    {
        "id": "SD-11",
        "title": "Quản trị Thực đơn & Cập nhật trạng thái Còn/Hết món",
        "img": "sd11_menu_management.png",
        "lanes": "Manager | AdminPortal | MenuAPI | Database | MenuHub | EMenuClients",
        "desc": [
            "Quản lý cập nhật giá bán, hình ảnh hoặc thao tác bật/tắt trạng thái Còn món hoặc Hết món trên AdminPortal.",
            "AdminPortal gửi yêu cầu cập nhật thông tin thực đơn tới MenuAPI.",
            "MenuAPI thực hiện xác thực tính hợp lệ của dữ liệu đầu vào và lưu trữ các thay đổi vào Database.",
            "MenuAPI phát sự kiện cập nhật thực đơn thời gian thực thông qua MenuHub.",
            "Toàn bộ các thiết bị hiển thị EMenuClients tại các bàn ăn và ứng dụng POS của nhân viên phục vụ tự động làm mới danh mục thực đơn."
        ]
    },
    {
        "id": "SD-12",
        "title": "Khách hàng đánh giá dịch vụ & Tự động gửi Email CSAT",
        "img": "sd12_guest_feedback.png",
        "lanes": "Guest | FeedbackSPA | FeedbackAPI | AnalyticsEngine | Database | ManagerDashboard",
        "desc": [
            "Khách hàng truy cập liên kết khảo sát trên FeedbackSPA, lựa chọn thang điểm đánh giá và nhập nhận xét chất lượng phục vụ.",
            "Giao diện FeedbackSPA gửi dữ liệu khảo sát tới FeedbackAPI.",
            "FeedbackAPI kiểm tra tính hợp lệ và lưu trữ bản ghi đánh giá vào Database.",
            "AnalyticsEngine tự động tính toán lại chỉ số mức độ hài lòng khách hàng (CSAT) theo thời gian thực.",
            "Hệ thống phát thông báo cập nhật chỉ số CSAT trực tiếp lên giao diện theo dõi của ManagerDashboard.",
            "Trường hợp phản hồi có điểm đánh giá thấp dưới 3 sao, hệ thống tự động gửi thư điện tử cảnh báo ưu tiên cao tới Quản lý nhà hàng."
        ]
    }
]

# =============================================================================
# CHƯƠNG 5: MA TRẬN QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES)
# =============================================================================

BUSINESS_RULES_DATA = [
    [
        "BR-01",
        "Thời hạn giữ cọc tạm thời\n(Reservation Lock Timeout)",
        "Khi khách hàng lựa chọn vị trí bàn và nhấn nút đặt cọc, hệ thống kích hoạt cơ chế khóa giữ chỗ tạm thời trên sơ đồ mặt bằng trong thời gian tối đa 17 phút (bao gồm 15 phút thời hạn thanh toán mã QR VNPAY cộng thêm 02 phút ân hạn trễ mạng). Quá thời hạn 17 phút nếu không nhận được tín hiệu xác nhận thanh toán thành công (IPN) từ cổng VNPAY, hệ thống dịch vụ nền sẽ tự động giải phóng vị trí bàn ăn về trạng thái Sẵn sàng đón khách.",
        "Dịch vụ nền chạy ngầm\n(Hangfire Background Worker)"
    ],
    [
        "BR-02",
        "Trải nghiệm E-Menu chỉ xem & Mã QR tại bàn\n(View-Only E-Menu & Table QR)",
        "Thực khách xem thực đơn qua mã QR định danh bàn trên Smartphone cá nhân (BYOD) hoặc mượn Tablet từ kho dùng chung (Floating Pool). Giao diện E-Menu ở chế độ chỉ xem (View-only), hỗ trợ nút bấm gửi yêu cầu phục vụ hoặc thanh toán kín đáo. Mọi thao tác chọn món và gửi đơn vào hệ thống bắt buộc phải do Nhân viên phục vụ (Waitstaff) trực tiếp thực hiện trên ứng dụng di động sau khi tư vấn khẩu vị và rà soát dị ứng.",
        "Tầng API Middleware &\nBộ định tuyến Frontend Router"
    ],
    [
        "BR-03",
        "Công thức tính Hóa đơn chuẩn\n(Financial Calculation Formula)",
        "Hệ thống áp dụng công thức tính toán tài chính bắt buộc theo trình tự tuần tự:\n1. Tổng tiền món dùng thực tế (Subtotal) bằng tổng giá trị các món ăn đã phục vụ.\n2. Phí phục vụ (5%) bằng Subtotal nhân với 0.05.\n3. Thuế VAT (10%) bằng tổng của Subtotal và Phí phục vụ nhân với 0.10.\n4. Số tiền phải thu bằng tổng chi phí bữa ăn trừ đi số tiền cọc đã nộp, với điều kiện giá trị tối thiểu bằng 0 đồng (không hoàn lại phần chênh lệch khi tổng chi phí thấp hơn tiền cọc tối thiểu).",
        "Tầng Dịch vụ Ứng dụng &\nThực thể Nghiệp vụ Miền (Domain)"
    ],
    [
        "BR-04",
        "Thẩm quyền xác nhận phục vụ\n(Service Confirmation Privilege)",
        "Chỉ có tài khoản thuộc vai trò Nhân viên Điều phối (Expediter / Checkfood) tại quầy Pass hoặc Quản lý nhà hàng (Manager) mới có quyền bấm nút xác nhận hoàn thành món ăn trên thiết bị điều phối. Đầu bếp và Khách hàng hoàn toàn không được phân quyền thực hiện thao tác này nhằm bảo đảm quy trình kiểm soát chất lượng độc lập và ngăn chặn tình trạng báo khống tiến độ phục vụ.",
        "Tầng Phân quyền Xác thực Token\n(Backend JWT Role Authorization)"
    ],
    [
        "BR-05",
        "Chính sách hủy bàn & Hoàn cọc\n(Cancellation & Refund Policy)",
        "Khách hàng được hoàn trả tự động 100% số tiền cọc qua cổng thanh toán VNPAY nếu thực hiện thao tác hủy đặt bàn trước giờ hẹn dùng bữa tối thiểu từ 04 tiếng trở lên. Mọi giao dịch hủy lịch hẹn trong vòng dưới 04 tiếng sẽ bị giữ lại toàn bộ số tiền cọc làm phí bồi hoàn chuẩn bị nguyên liệu tươi sống. Quản lý có thẩm quyền đặc cách sử dụng tính năng duyệt hoàn cọc thủ công trong các tình huống bất khả kháng.",
        "Tầng Dịch vụ Ứng dụng &\nTích hợp Cổng thanh toán VNPAY"
    ]
]

# =============================================================================
# CHƯƠNG 6: MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU (RTM)
# =============================================================================

RTM_DATA = [
    ["REQ-01", "Đặt bàn trực tuyến & Đặt cọc VNPAY", "UC-U1", "AD-01", "SD-01", "BR-01, BR-05", "TC-RES-01, TC-RES-02"],
    ["REQ-02", "Xem E-Menu tại bàn (Mã QR & Tablet mượn)", "UC-U2", "AD-02", "SD-02", "BR-02", "TC-ORD-01, TC-ORD-02"],
    ["REQ-03", "Hủy đặt bàn trực tuyến & Hoàn cọc tự động", "UC-U3", "AD-05", "SD-05", "BR-05", "TC-RES-03"],
    ["REQ-04", "Khách hàng đánh giá chất lượng dịch vụ", "UC-U4", "AD-12", "SD-12", "BR-03", "TC-FB-01"],
    ["REQ-05", "Nhân viên tạo Order trực tiếp & Điều phối KDS Bếp", "UC-E1", "AD-02", "SD-02", "BR-04", "TC-KIT-01, TC-KIT-02"],
    ["REQ-06", "Phục vụ món & Xác nhận hoàn thành tại Pass", "UC-E2", "AD-03", "SD-03", "BR-04", "TC-SER-01"],
    ["REQ-07", "Xuất hóa đơn, Cấn trừ tiền cọc & Đóng bàn", "UC-E3", "AD-04", "SD-04", "BR-03", "TC-INV-01, TC-INV-02"],
    ["REQ-08", "Chuyển bàn / Đổi bàn phục vụ", "UC-E4", "AD-07", "SD-07", "BR-02", "TC-TBL-03"],
    ["REQ-09", "Đăng nhập & Xác thực tài khoản nội bộ", "UC-E5", "AD-06", "SD-06", "BR-04", "TC-SEC-01, TC-SEC-02"],
    ["REQ-10", "Quản trị Danh mục & Thực đơn món ăn", "UC-A1", "AD-11", "SD-11", "BR-04", "TC-MNU-01"],
    ["REQ-11", "Quản trị & Cấu hình Sơ đồ bàn ăn", "UC-A2", "AD-08", "SD-08", "BR-02", "TC-TBL-01, TC-TBL-02"],
    ["REQ-12", "Duyệt hoàn tiền cọc thủ công ngoại lệ", "UC-A3", "AD-09", "SD-09", "BR-05", "TC-REF-01"],
    ["REQ-13", "Quản trị Tài khoản nhân viên & Phân quyền", "UC-A4", "AD-06", "SD-06", "BR-04", "TC-SEC-03"],
    ["REQ-14", "Báo cáo Thống kê Doanh thu & Dashboard", "UC-A5", "AD-12", "SD-12", "BR-03", "TC-REP-01"],
    ["REQ-15", "Tự động quét & Giải phóng bàn hết hạn cọc", "UC-S1", "AD-10", "SD-10", "BR-01", "TC-SYS-01"]
]

# =============================================================================
# CHƯƠNG 7: TÀI LIỆU THAM KHẢO
# =============================================================================

REFERENCES_DATA = [
    ("Microsoft Corporation (2026)", "ASP.NET Core Web API & SignalR Real-time Communication Architecture Documentation, Nền tảng tài liệu kỹ thuật Microsoft Learn."),
    ("Martin Fowler (2002)", "Patterns of Enterprise Application Architecture, Nhà xuất bản Addison-Wesley Professional, Boston."),
    ("Robert C. Martin (2017)", "Clean Architecture: A Craftsman's Guide to Software Structure and Design, Nhà xuất bản Prentice Hall, New Jersey."),
    ("VNPAY Payment Gateway (2025)", "VNPAY E-Commerce Merchant Technical Integration Specifications (Version 2.1.0), Công ty Cổ phần Giải pháp Thanh toán Việt Nam."),
    ("Seiko Epson Corporation (2024)", "ESC/POS Application Programming & Command Reference Guide for POS Thermal Printers (Tài liệu chuẩn lệnh in áp dụng cho máy in nhiệt 80mm tại quầy Thu ngân phục vụ in phiếu tạm tính cấn trừ cọc kẹp sổ da theo ADR 0004).")
]

print("Report dataset initialized successfully.")
