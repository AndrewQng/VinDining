# Project Proposal Findings & Extracted Content

 PROJECT PROPOSAL v1

1. Thông tin chung

Tên đề tài: Dự án quản lý nhà hàng

Nhóm sinh viên:

Nguyễn Mạnh Quyền – 0023168

Đặng Quốc Khánh – MSSV

Nguyễn Thành Đạt – MSSV

Giảng viên hướng dẫn: Phạm Hữu Tùng

2. Problem Statement (Bài toán)

Khảo sát các hệ thống đã có và mô tả vấn đề thực tế mà hệ thống giải quyết:

Vấn đề hiện tại:

Quản lý thực đơn và bàn ăn thủ công bằng giấy/ghi nhớ miệng, dễ dẫn đến nhầm lẫn món, sót đơn hoặc ghi sai yêu cầu đặc biệt của khách (như dị ứng, mức độ cay).

Tốc độ truyền thông tin giữa bộ phận phục vụ và bếp chậm, gây kéo dài thời gian chờ đợi của khách hàng trong giờ cao điểm.

Quy trình đặt bàn trước còn rời rạc, chưa tối ưu được sơ đồ bàn trống, dễ xảy ra tình trạng trùng lịch hoặc bỏ trống bàn trong khung giờ vàng.

Khách hàng thiếu công cụ xem menu trực quan, tra cứu trạng thái món ăn hoặc thực hiện thanh toán nhanh tại bàn.

Việc tổng hợp doanh thu, báo cáo bán hàng và theo dõi hiệu suất nhân viên tốn nhiều thời gian, dễ xuất hiện sai sót trong tính toán.

Nhà hàng phụ thuộc nhiều vào các ứng dụng giao đồ ăn bên thứ ba (GrabFood, ShopeeFood...), chịu chi phí chiết khấu cao (20% – 30%) làm giảm biên lợi nhuận.

Khó chủ động quản lý thông tin khách hàng thân thiết, dữ liệu giao hàng và các chương trình khuyến mãi riêng của nhà hàng.

Đơn hàng online qua điện thoại/tin nhắn dễ bị sót, ghi sai địa chỉ giao hàng hoặc không cập nhật kịp thời trạng thái giao hàng cho khách.

Khó đồng bộ lượng đơn hàng từ kênh online và kênh ăn tại chỗ, dễ gây quá tải cho bộ phận bếp.

Giải pháp đề xuất:

Xây dựng hệ thống website quản lý nhà hàng toàn diện, tích hợp cả hai mô hình: Phục vụ tại chỗ (In-house dining) và Đặt hàng giao tận nơi (Online Delivery).

Dành cho Khách hàng:

Ăn tại chỗ: Xem menu trực quan trên website, đặt bàn trước. Khi ở tại nhà hàng có thể quét QR để xem menu và order trực tiếp trên website.

Đặt hàng giao tận nơi:

Tìm kiếm, chọn món và tùy chỉnh suất ăn (size, mức độ cay, topping...).

Nhập địa chỉ giao hàng, hệ thống tự động tính phí vận chuyển dựa trên khoảng cách.

Theo dõi trạng thái đơn hàng theo thời gian thực (Đã nhận đơn -> Đang chế biến -> Đang giao hàng -> Hoàn thành).

Thanh toán trực tuyến linh hoạt (QR Code, Ví điện tử, Thẻ) hoặc COD khi nhận hàng.

Dành cho Nhân viên & Bếp:

Tiếp nhận và phân loại rõ ràng giữa đơn ăn tại bàn và đơn giao tận nơi trên cùng một màn hình điều khiển.

Đồng bộ đơn hàng online trực tiếp xuống bộ phận Bếp/Pha chế để chuẩn bị và đóng gói kịp thời.

Cập nhật sơ đồ bàn ăn và trạng thái xử lý đơn hàng liên tục.

Hệ thống Quản trị (Admin):

Quản lý bán hàng đa kênh: Quản lý tập trung đơn hàng online, đơn đặt bàn và đơn ăn tại chỗ trên một nền tảng duy nhất.

Cấu hình giao hàng: Thiết lập bán kính giao hàng, phí ship theo khu vực hoặc tích hợp đơn vị vận chuyển ngoài.

Quản lý thực đơn & Kho: Tự động ẩn/hiện món ăn khi hết nguyên liệu trên kênh online để tránh tình trạng khách đặt món không có.

Báo cáo & Marketing: Thống kê tỷ trọng doanh thu giữa bán tại chỗ và bán giao đi; quản lý dữ liệu khách hàng để triển khai chính sách tích điểm, mã giảm giá.

Giải pháp giúp:

Tối ưu hóa lợi nhuận nhờ giảm chi phí chiết khấu cho các bên trung gian giao hàng.

Mở rộng đối tượng khách hàng, gia tăng doanh thu từ kênh bán hàng online mà không làm gián đoạn quy trình phục vụ tại chỗ.

Giảm thiểu tối đa sai sót khi chốt đơn, tính phí ship và giao hàng.

Nâng cao thương hiệu nhà hàng nhờ trải nghiệm đặt món trực tuyến chuyên nghiệp và liền mạch.

3. Stakeholders

Actor

Mô tả

Mục tiêu

Khách hàng (Customer)

Người truy cập website để đặt bàn, xem thực đơn, gọi món tại bàn hoặc đặt đồ ăn giao tận nơi.

Tìm kiếm món ăn nhanh chóng, đặt hàng/đặt bàn dễ dàng, theo dõi đơn hàng minh bạch và thanh toán tiện lợi.

Nhân viên Phục vụ (Waitstaff)

Nhân viên làm việc trực tiếp tại nhà hàng, chịu trách nhiệm nhận đơn, sắp xếp bàn và hỗ trợ khách.

Tiếp nhận yêu cầu gọi món/đặt bàn chính xác. Theo dõi tình trạng bàn trống trên hệ thống. Chuyển yêu cầu đơn món sang Bếp nhanh chóng. Xác nhận trạng thái món ăn,

Quản lý Nhà hàng (Manager)

Người điều hành hoạt động hàng ngày của nhà hàng 

Theo dõi tình hình kinh doanh, doanh thu theo ca/ngày/tháng; quản lý danh mục thực đơn, giá bán và trạng thái món; giám sát tỷ lệ lấp đầy bàn thực tế.

Quản trị hệ thống (Admin)

Người phụ trách mặt kỹ thuật, phân quyền và cấu hình toàn bộ hệ thống website.

Đảm bảo hệ thống hoạt động ổn định, bảo mật dữ liệu, quản lý tài khoản người dùng và cấu hình các chính sách bán hàng.

4. Mục tiêu hệ thống (Objectives)

Quản lý toàn diện: Số hóa quy trình đặt bàn, gọi món tại chỗ, bán hàng giao tận nơi và danh mục thực đơn trên một nền tảng.

Tự động hóa vận hành: Đồng bộ đơn hàng tức thì đến bếp, tự động tính phí ship và cập nhật trạng thái bàn ăn/đơn hàng theo thời gian thực.

Tăng hiệu quả & trải nghiệm: Rút ngắn thời gian phục vụ, loại bỏ sai sót nhầm đơn, giảm chi phí chiết khấu ứng dụng ngoài và cung cấp báo cáo doanh thu trực quan.

5. Phạm vi hệ thống (Scope)

In-Scope

Quản lý tài khoản & Phân quyền: Đăng ký, đăng nhập, phân quyền truy cập (Khách hàng, Nhân viên, Bếp, Shipper, Admin).

Quản lý thực đơn (CRUD): Quản lý danh mục món ăn, giá cả, hình ảnh, tùy chọn món (size, topping) và trạng thái món (còn/hết).

Quản lý đặt bàn & sơ đồ bàn: Đặt bàn trước trực tuyến, hiển thị sơ đồ và cập nhật trạng thái bàn ăn theo thời gian thực.

Quản lý đặt hàng & gọi món: Tạo đơn hàng gọi món tại bàn và đơn đặt hàng giao tận nơi (tự động tính phí ship theo khoảng cách).

Điều phối & xử lý đơn hàng (KDS): Đồng bộ và hiển thị danh sách đơn hàng cho bộ phận Bếp/Pha chế và Shipper cập nhật trạng thái xử lý.

Thanh toán & Hóa đơn: Hỗ trợ thanh toán COD, mô phỏng/tích hợp gateway thanh toán qua QR Code và xuất hóa đơn bán hàng.

Báo cáo & Thống kê: Thống kê doanh thu, số lượng đơn hàng và danh sách món ăn bán chạy theo thời gian.

Out-of-Scope

Quản lý kho & Định lượng nguyên liệu: Không theo dõi lượng nhập/xấp/tồn kho nguyên liệu thô theo công thức món ăn.

Thanh toán trực tuyến thực tế với tiền thật: Chỉ dừng ở mức mô phỏng (Sandbox/Mockup API) hoặc quét mã QR tĩnh.

Ứng dụng di động riêng biệt (Mobile App Native): Hệ thống chỉ phát triển trên nền tảng Web (chạy giao diện Responsive trên trình duyệt di động).

Gợi ý món ăn bằng AI (AI Recommendation): Không sử dụng thuật toán trí tuệ nhân tạo để phân tích hành vi và gợi ý món ăn.

Tích hợp ứng dụng giao hàng bên thứ 3: Không kết nối API trực tiếp với GrabExpress, Ahamove hay Gojek (việc giao hàng do Shipper nội bộ xử lý).

6. Mô tả hệ thống đề xuất (Solution Overview)

Xây dựng dưới dạng: Responsive Web Application & RESTful Web API

Mô hình Client-Server hiện đại: Giao diện web đơn trang (React + TypeScript + Tailwind CSS) giao tiếp với Backend Web API (.NET 9).

Khả năng tương thích đa thiết bị (Cross-platform Web): Tự động tối ưu giao diện theo kích thước màn hình mà không cần cài đặt App native:

Giao diện Mobile: Dành cho Khách hàng quét mã QR đặt món và Nhân viên phục vụ cầm tay thao tác đi đơn.

Giao diện Tablet (KDS) / Máy in: Dành cho Bếp trưởng theo dõi danh sách món cần làm tại quầy Bếp.

Giao diện Desktop: Dành cho Quản lý và Admin quản trị dữ liệu.

Quy trình vận hành Đặt món & Đi đơn phục vụ (Order & Serving Workflow):

Khách quét mã QR: Khách dùng camera điện thoại quét mã QR dán tại bàn ăn -> Trình duyệt mở ngay E-Menu kèm mã bàn tương ứng (TableId).

Khách gửi Order: Khách chọn Tasting Menu, các Course món ăn và đồ uống -> Nhấn "Gửi Order".

Hệ thống nhận đơn & In phiếu Bếp (Real-time qua SignalR):

Hệ thống tự động in phiếu Bếp (phiếu order ghi rõ: Số bàn, Tên món, Giờ đặt, Ghi chú dị ứng) và hiển thị lên màn hình KDS của Bếp.

Điện thoại/Tablet của Nhân viên phục vụ nhận thông báo có đơn gọi món mới tại bàn.

Bếp chế biến & Chuyển món ra quầy: Bếp trưởng xem phiếu in order/màn hình để điều phối nấu món. Khi món chín, Bếp đặt món ra quầy ra món (Pass).

Nhân viên nhận món & Xác nhận hoàn thành trên hệ thống: Nhân viên phục vụ lấy món từ quầy Bếp mang ra bàn cho khách, sau đó thao tác bấm "Xác nhận món đã hoàn thành / Đã phục vụ" trên điện thoại/tablet để hệ thống cập nhật tiến độ bàn ăn.

Thanh toán & Đóng bàn: Khách dùng bữa xong -> Nhân viên xuất hóa đơn điện tử (tự động cấn trừ tiền cọc trước đó nếu có) -> Khách thanh toán tiền mặt/chuyển khoản/VNPAY -> Bàn chuyển trạng thái chờ dọn dẹp.

7. Kiến trúc dự kiến (Proposed Architecture)

Loại kiến trúc lựa chọn: Web API (Mô hình phân tách Client-Server, kết hợp Clean Architecture và 3-Layer Architecture).

Mô tả kiến trúc: Hệ thống tách biệt hoàn toàn giữa Frontend (React SPA) và Backend (ASP.NET Core Web API), giao tiếp thông qua giao thức HTTP RESTful API và WebSocket (SignalR). Tầng Backend được tổ chức theo chuẩn Clean Architecture / 3-layer tuân thủ nguyên tắc SOLID:

Tầng Controller (API / Presentation Layer):

Tiếp nhận các yêu cầu HTTP Request từ Frontend, định tuyến (Routing), kiểm tra xác thực và phân quyền (JWT Bearer Token / Role-based Authorization).

Cung cấp các SignalR Hubs để truyền phát tín hiệu thời gian thực (Real-time) cho sơ đồ bàn, thông báo đơn mới và màn hình Bếp.

Tầng Service (Application / Business Logic Layer):

Đóng gói toàn bộ logic nghiệp vụ (Business Rules): kiểm tra trùng lặp lịch đặt bàn, logic tính tiền cọc, điều phối ra món theo từng Course (Course Firing), tính hóa đơn và VAT/phí dịch vụ.

Áp dụng mô hình CQRS với MediatR (Commands xử lý ghi/thay đổi dữ liệu, Queries xử lý truy vấn đọc).

Xác thực dữ liệu đầu vào chặt chẽ với FluentValidation và Pipeline Behaviors.

Tầng Repository (Infrastructure / Data Access Layer):

Đảm nhận kết nối, truy xuất và lưu trữ dữ liệu vào hệ quản trị CSDL SQL Server thông qua Entity Framework Core 9 (EF Core).

Triển khai Repository Pattern / Unit of Work, tích hợp dịch vụ bên ngoài (Cổng thanh toán điện tử, gửi Email thông báo, ASP.NET Core Identity).

Tầng Core Domain (Domain Layer):

Chứa các thực thể cốt lõi: (Entities: Guest, Reservation, Table, TastingMenu, Course, Order, Deposit, Invoice), Enums, Value Objects và Domain Events độc lập hoàn toàn.

8. Công nghệ dự kiến (Tech Stack)

Layer

Technology

Frontend

React + TypeScript (Vite)

Frontend State & Realtime

TanStack Query & Zustand, SignalR Client

Backend

ASP.NET Core (.NET 9) Web API

Database & ORM

Microsoft SQL Server + EF Core 9

Authentication & Security

ASP.NET Core Identity + JWT Bearer

API & Realtime Protocol

RESTful API (JSON) + ASP.NET Core SignalR

Tools & Testing

Git, GitHub, Postman, Swagger / OpenAPI

Utilities

ESC/POS Web Printing / Window Print

9. Danh sách chức năng chính (Core Features)

Đăng ký / Đăng nhập & Phân quyền người dùng (Authentication & User Management):

Đăng ký tài khoản khách hàng, đăng nhập hệ thống bảo mật bằng JWT và Refresh Token.

Phân quyền đa vai trò: Khách hàng (Guest), Lễ tân (Host), Phục vụ (Server), Đầu bếp (Chef), Quản lý (Manager), Quản trị viên (Admin).

Cập nhật thông tin cá nhân, lưu trữ lịch sử đặt bàn và sở thích ẩm thực.

Quản lý Thực đơn Fine Dining & Món ăn (Menu & Tasting Menu Management):

Quản lý danh mục món ăn, thức uống (Wine Pairing) và các Set Tasting Menu cao cấp.

Cấu hình cấu trúc các Course (Khai vị - Appetizer, Món chính - Main Course, Tráng miệng - Dessert,...) theo thứ tự phục vụ.

Quản lý thông tin chi tiết: Tên món, đơn giá, hình ảnh món ăn, mô tả hương vị, cảnh báo dị ứng thực phẩm và trạng thái phục vụ (Đang phục vụ / Tạm ngưng).

Quản lý Đặt bàn & Sơ đồ bàn Thời gian thực (Reservation & Floor Plan Management):

Đặt bàn trực tuyến: Khách hàng chọn ngày, ca phục vụ (Shift), số lượng khách, khu vực bàn (Sảnh chính, VIP, Ban công) và ghi chú đặc biệt.

Đặt cọc giữ bàn (Deposit): Tính toán và yêu cầu đặt cọc trực tuyến để xác nhận giữ chỗ cho các bàn tiệc cao cấp.

Sơ đồ bàn trực quan Real-time: Hiển thị trạng thái bàn tức thời (Trống - Available, Đã đặt - Reserved, Đang dùng bữa - Occupied, Chờ dọn - Cleaning) qua SignalR.

Quản lý mã QR bàn ăn (Table QR Management): Hệ thống sinh mã QR tự động cho từng bàn ăn để in và dán tại bàn thực tế.

Check-in / Gán bàn: Tiếp nhận khách đến, chuyển trạng thái bàn sang Đang dùng bữa.

Quét mã QR gọi món & Điều phối Bếp (Table QR Self-Ordering & Serving Management):

Quét mã QR đặt món tại bàn (Self-ordering): Khách hàng tại bàn dùng điện thoại quét mã QR để mở E-Menu, chọn Tasting Menu, các Course món ăn kèm đồ uống và gửi đơn Order trực tiếp vào hệ thống.

In phiếu Bếp tự động: Hệ thống xuất/in phiếu Bếp (số bàn, tên món, ghi chú dị ứng) và gửi thông báo real-time qua SignalR cho Bếp trưởng và Phục vụ.

Điều phối chế biến & Bưng món: Bếp chế biến xong và chuyển món ra quầy ra món (Pass).

Nhân viên phục vụ xác nhận hoàn thành: Nhân viên phục vụ nhận món, bưng ra bàn cho khách và bấm nút "Xác nhận món đã hoàn thành / Đã phục vụ" trên điện thoại/tablet để cập nhật trạng thái đơn món trên toàn hệ thống.

Thanh toán, Hóa đơn & Báo cáo thống kê (Billing, Payment & Analytics):

Tính tiền & Xuất hóa đơn (Invoice): Tự động tổng hợp các món/menu đã gọi qua QR hoặc nhân viên mở, áp dụng phí dịch vụ (Service Charge 5%), thuế VAT (10%), và tự động cấn trừ số tiền đặt cọc (Deposit) đã thanh toán trước đó.

Hỗ trợ thanh toán linh hoạt: Tiền mặt, thẻ ngân hàng, chuyển khoản hoặc tích hợp cổng thanh toán trực tuyến (VNPAY/MoMo).

Dashboard Báo cáo & Thống kê: Biểu đồ doanh thu theo thời gian, tỷ lệ lấp đầy bàn, số lượt đặt bàn thành công/hủy, thống kê các món ăn và Tasting Menu bán chạy nhất.

10. Kế hoạch phát triển (10 tuần)

Tuần

Nội dung

1–2

Proposal + Analysis

3–4

Design

5–6

Setup

7–8

Coding

9–10

Hoàn thiện

Tuần 1–2: Proposal + Analysis (Phân tích yêu cầu)

Mục tiêu:

Hiểu rõ bài toán

Xác định chức năng hệ thống

Công việc:

Xác định stakeholder (Admin, Khách hàng)

Viết:

User Story

Use Case Diagram

Phân tích chức năng:

Đăng ký / đăng nhập & phân quyền

Quản lý thực đơn Fine Dining (Tasting Menu, Course)

Đặt bàn & đặt cọc giữ chỗ (Deposit)

Quản lý bàn & sinh mã QR bàn ăn

Quét mã QR tại bàn & tự đặt món (Self-ordering)

In phiếu Bếp & nhân viên xác nhận hoàn thành món

Xuất hóa đơn & thanh toán (cấn trừ cọc, VAT, phí dịch vụ)

Báo cáo thống kê doanh thu

Viết tài liệu:

BRS

SRS (bản draft)

Phân công:

Nguyễn Mạnh Quyền:

→ Leader + viết BRS, quản lý tiến độ

Đặng Quốc Khánh:

Hỗ trợ SRS + vẽ flowchart

Research hệ thống

Nguyễn Thành Đạt:

Viết BRS, User Story + Use Case

 Phân tích nghiệp vụ

📊 12. Kết quả dự kiến

Hệ thống chạy được:

API

CRUD đầy đủ

Có:

UML

Code

Demo