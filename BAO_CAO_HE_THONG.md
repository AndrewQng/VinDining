# THÔNG TIN BÁO CÁO DỰ ÁN
**Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (Fine Dining Restaurant Management & Reservation System)**

---

## 3. Các bên liên quan (Stakeholders)

| Đối tượng (Actor) | Thiết bị / Nền tảng sử dụng | Mô tả vai trò | Mục tiêu trong hệ thống |
| :--- | :--- | :--- | :--- |
| **Khách hàng (Customer / Guest)** | **Mobile Web & Tablet EMenuTablet dùng chung** *(Không cần cài app, không cần tài khoản)* | Khách hàng tìm hiểu nhà hàng, đặt bàn trước trực tuyến kèm cọc VNPAY; khi đến nhà hàng, chiêm ngưỡng thực đơn qua EMenuTablet (100% chỉ xem) và đối chiếu hóa đơn cấn trừ cọc kẹp sổ da sang trọng. | Xem trải nghiệm ẩm thực (Tasting Menu, Wine Pairing); đặt bàn trước theo khung giờ/khu vực; khám phá thực đơn qua EMenuTablet 100% view-only (không nút tương tác); đối chiếu bảng kê hóa đơn kèm mã VietQR in trên phiếu kẹp sổ da; trao đổi trực tiếp với Waitstaff. |
| **Nhân viên Phục vụ (Waitstaff / Server)** | **Mobile / Tablet Web (Tablet POS)** *(Tablet cầm tay)* | Nhân viên phục vụ trực tiếp tại bàn: tư vấn ẩm thực, tạo Order điều phối KDS Bếp, nhận món từ quầy Pass và bưng phục vụ tại bàn bằng 2 tay (Zero-touch tại bàn), xuất hóa đơn cấn trừ cọc (BR-03). | Theo dõi tình trạng bàn trống/đang phục vụ trên sơ đồ bàn; tư vấn món và ghi chú dị ứng (SpecialNotes); kích hoạt lệnh lên món (**Course Firing**) cho Bếp; nhận món từ Pass, bưng phục vụ tại bàn; xuất lệnh in phiếu tạm tính cấn trừ cọc ra máy in quầy thu ngân (80mm), kẹp sổ da mang ra bàn và đóng bàn. |
| **Nhân viên Điều phối (Expediter / Checkfood)** | **Tablet cố định tại quầy Pass** | Nhân viên kiểm soát chất lượng (QC) đĩa món tại quầy Pass trước khi bàn giao cho phục vụ bưng ra bàn. | Đối chiếu chất lượng đĩa món theo tiêu chuẩn, kiểm tra ghi chú dị ứng; bấm "Xác nhận ra món" (Served) theo quy tắc BR-04 kích hoạt thông báo tức thời / rung chuông tới Smartphone cá nhân của Waitstaff phụ trách bàn. |
| **Đầu bếp / Bếp trưởng (Chef / Kitchen)** | **Màn hình KDS Bếp (Hands-free)** *(Gắn tường tại các trạm Bếp/Bar)* | Bếp trưởng và phụ bếp tiếp nhận vé điện tử điều phối qua SignalR, quan sát rảnh tay (chống nhiễm bẩn dầu mỡ) và thực hiện nấu nướng theo nhịp Course. | Nhận vé điện tử điều phối tức thời (Real-time qua SignalR); theo dõi đồng hồ đếm ngược SLA chuẩn bị; ghi nhận cảnh báo dị ứng bôi đậm theo từng món; chế biến món ăn và đặt món ra quầy chuyển món (Pass). |
| **Quản lý Nhà hàng (Manager)** | **Desktop / Laptop Web** *(Màn hình lớn)* | Người giám sát và điều hành toàn bộ hoạt động vận hành, phục vụ và kinh doanh của nhà hàng. | Theo dõi tình hình kinh doanh, doanh thu theo ca/ngày/tháng; quản lý danh mục thực đơn, giá bán; cấu hình sơ đồ bàn ăn; duyệt hoàn tiền cọc thủ công ngoại lệ (BR-05); giám sát tỷ lệ lấp đầy bàn và chất lượng phục vụ thực tế. |
| **Quản trị hệ thống (Admin)** | **Desktop / Laptop Web** | Người phụ trách mặt kỹ thuật, quản lý tài khoản, phân quyền và cấu hình toàn bộ hệ thống website. | Đảm bảo hệ thống hoạt động ổn định, bảo mật dữ liệu người dùng, phân quyền truy cập chính xác (Role-Based Access Control) và cấu hình các danh mục hệ thống. |

---

## 6. Mô tả hệ thống đề xuất (Solution Overview)

### Hệ thống sẽ:
* **Xây dựng dưới dạng**: **Responsive Web Application & RESTful Web API**
  * Mô hình Client-Server hiện đại: Giao diện web đơn trang (**React + TypeScript + Tailwind CSS**) giao tiếp với **Backend Web API (.NET 9)**.
  * **Khả năng tương thích đa thiết bị (Cross-platform Web)**: Tự động tối ưu giao diện theo kích thước màn hình mà không cần cài đặt App native:
    * *Giao diện Mobile Web*: Dành cho Khách hàng đặt bàn trực tuyến & đặt cọc VNPAY từ xa.
    * *Giao diện Tablet E-Menu (EMenuTablet)*: Dành cho khách tại bàn thưởng lãm hình ảnh thực đơn (100% thụ động chỉ xem, không nút bấm tương tác).
    * *Mô hình Bàn ăn chuẩn Fine Dining*: Bàn ăn hoàn toàn sạch bóng thiết bị cố định; phiếu thanh toán tạm tính cấn trừ cọc kèm mã VietQR động được in nhiệt từ quầy thu ngân và kẹp sổ da mang ra bàn.
    * *Giao diện Tablet POS Waitstaff*: Dành cho Nhân viên phục vụ tạo đơn gọi món tại bàn và xuất hóa đơn.
    * *Giao diện Pass Tablet*: Dành cho Nhân viên Điều phối kiểm tra QC và xác nhận Served.
    * *Giao diện KDS Bếp (Hands-free)*: Dành cho Bếp trưởng theo dõi vé điều phối rảnh tay tại quầy Bếp.
    * *Giao diện Desktop*: Dành cho Quản lý và Admin quản trị dữ liệu.

* **Quy trình vận hành Đặt món & Đi đơn phục vụ (Order & Serving Workflow)**:
  1. **Khách chiêm ngưỡng thực đơn**: Khách dùng Tablet E-Menu (`EMenuTablet` - 100% chỉ xem, không nút tương tác) tại bàn để xem hình ảnh chất lượng cao và câu chuyện món ăn.
  2. **Waitstaff tư vấn & Tạo Order**: Khách trao đổi trực tiếp với Waitstaff; Waitstaff tư vấn khẩu vị, ghi nhận dị ứng (`SpecialNotes`) và nhập đơn trên Tablet POS -> Bấm "Tạo đơn & Gửi Bếp".
  3. **Hệ thống điều phối KDS Bếp (Real-time qua SignalR)**:
     * Hệ thống đẩy vé điện tử lên màn hình KDS của Bếp (rảnh tay, đếm ngược SLA, bôi đậm dị ứng).
       4. **Bếp chế biến & Chuyển món ra quầy Pass**: Đầu bếp xem màn hình KDS để nấu món. Khi món hoàn tất, chuyển đĩa ăn ra quầy ra món (Pass).
  5. **Expediter kiểm tra QC & Xác nhận Served**: Expediter tại quầy Pass kiểm tra độ chuẩn xác và bấm "Xác nhận ra món" (`Served`) trên Pass Tablet (`BR-04`). SignalR gửi thông báo đẩy / rung chuông tới Smartphone Waitstaff (*"Bàn [Số bàn]: Món [Tên món] đã sẵn sàng tại quầy Pass!"*); Waitstaff nhận món tại Pass và bưng ra bàn phục vụ khách bằng hai tay rảnh tay, trực tiếp giới thiệu món ăn bằng lời.
  6. **Thanh toán & Đóng bàn (UC-E3)**: Khách yêu cầu thanh toán trực tiếp với Waitstaff (lời nói / cử chỉ) -> Waitstaff mở Mobile Web trên smartphone cá nhân bấm "Xuất phiếu tạm tính" cấn trừ tiền cọc theo `BR-03` -> Máy in nhiệt quầy Thu ngân (80mm) nhả phiếu chi tiết kèm mã VietQR động -> Waitstaff kẹp phiếu vào sổ da mang ra bàn -> Khách kiểm tra và thanh toán (quét VietQR trên giấy / thẻ POS / tiền mặt) -> Waitstaff xác nhận trên smartphone -> Bàn chuyển sang trạng thái `Cleaning`.

---

## 7. Kiến trúc dự kiến (Proposed Architecture)

* **Loại kiến trúc lựa chọn**: **Web API** (Mô hình phân tách Client-Server, kết hợp **Clean Architecture** và **3-Layer Architecture**).
* **Mô tả kiến trúc**:
  Hệ thống tách biệt hoàn toàn giữa Frontend (React SPA) và Backend (ASP.NET Core Web API), giao tiếp thông qua giao thức HTTP RESTful API và WebSocket (SignalR). Tầng Backend được tổ chức theo chuẩn **Clean Architecture / 3-layer** tuân thủ nguyên tắc **SOLID**:
  * **Tầng Controller (API / Presentation Layer)**:
    * Tiếp nhận các yêu cầu HTTP Request từ Frontend, định tuyến (Routing), kiểm tra xác thực và phân quyền (JWT Bearer Token / Role-based Authorization).
    * Cung cấp các SignalR Hubs để truyền phát tín hiệu thời gian thực (Real-time) cho sơ đồ bàn, thông báo đơn mới và màn hình Bếp.
  * **Tầng Service (Application / Business Logic Layer)**:
    * Đóng gói toàn bộ logic nghiệp vụ (Business Rules): kiểm tra trùng lặp lịch đặt bàn, logic tính tiền cọc, điều phối ra món theo từng Course (Course Firing), tính hóa đơn và VAT/phí dịch vụ.
    * Áp dụng mô hình **CQRS** với **MediatR** (Commands xử lý ghi/thay đổi dữ liệu, Queries xử lý truy vấn đọc).
    * Xác thực dữ liệu đầu vào chặt chẽ với **FluentValidation** và Pipeline Behaviors.
  * **Tầng Repository (Infrastructure / Data Access Layer)**:
    * Đảm nhận kết nối, truy xuất và lưu trữ dữ liệu vào hệ quản trị CSDL **SQL Server** thông qua **Entity Framework Core 9 (EF Core)**.
    * Triển khai Repository Pattern / Unit of Work, tích hợp dịch vụ bên ngoài (Cổng thanh toán điện tử, gửi Email thông báo, ASP.NET Core Identity).
  * **Tầng Core Domain (Domain Layer)**:
    * Chứa các thực thể cốt lõi (Entities: `Guest`, `Reservation`, `Table`, `TastingMenu`, `Course`, `Order`, `Deposit`, `Invoice`), Enums, Value Objects và Domain Events độc lập hoàn toàn.

---

## 🧱 8. Công nghệ dự kiến (Tech Stack)

| Phân tầng (Layer) | Công nghệ / Thư viện (Technology) | Chi tiết sử dụng |
| :--- | :--- | :--- |
| **Frontend (Giao diện)** | **React + TypeScript (Vite)** | Giao diện Single Page Application (SPA), Dark Gold Luxury Fine Dining, Tailwind CSS, Lucide Icons, Responsive Mobile/Tablet/Desktop |
| **Frontend State & Realtime**| **TanStack Query & Zustand, SignalR Client** | Quản lý Server State, Client Global State và đồng bộ trạng thái đơn/bàn thời gian thực |
| **Backend (Xử lý nghiệp vụ)**| **ASP.NET Core (.NET 9) Web API** | Xây dựng RESTful Web API, kiến trúc Clean Architecture, CQRS (MediatR), FluentValidation |
| **Database & ORM** | **Microsoft SQL Server + EF Core 9** | Hệ CSDL quan hệ lưu trữ dữ liệu, Code-First Migrations |
| **Authentication & Security** | **ASP.NET Core Identity + JWT Bearer** | Xác thực Token JWT, Refresh Token, phân quyền Role/Policy-based |
| **API & Realtime Protocol** | **RESTful API (JSON) + ASP.NET Core SignalR** | API chuẩn RESTful kết hợp WebSocket SignalR cho Floor Plan và Kitchen KDS |
| **In ấn & Tiện ích** | **ESC/POS Web Printing / Window Print** | Xuất phiếu order Bếp (K80/K57) và hóa đơn thanh toán |
| **Tools & Testing** | **Git, GitHub, Postman, Swagger / OpenAPI** | Quản lý phiên bản mã nguồn, tài liệu hóa API và kiểm thử Endpoint |

---

## 🧩 9. Danh sách chức năng chính (Core Features)

1. **Đăng ký / Đăng nhập & Phân quyền người dùng (Authentication & User Management)**:
   * Đăng ký tài khoản khách hàng, đăng nhập hệ thống bảo mật bằng JWT và Refresh Token.
   * Phân quyền đa vai trò: Khách hàng (Guest), Lễ tân (Host), Phục vụ (Server), Đầu bếp (Chef), Quản lý (Manager), Quản trị viên (Admin).
   * Cập nhật thông tin cá nhân, lưu trữ lịch sử đặt bàn và sở thích ẩm thực.

2. **Quản lý Thực đơn Fine Dining & Món ăn (Menu & Tasting Menu Management)**:
   * Quản lý danh mục món ăn, thức uống (Wine Pairing) và các Set Tasting Menu cao cấp.
   * Cấu hình cấu trúc các Course (Khai vị - Appetizer, Món chính - Main Course, Tráng miệng - Dessert,...) theo thứ tự phục vụ.
   * Quản lý thông tin chi tiết: Tên món, đơn giá, hình ảnh món ăn, mô tả hương vị, cảnh báo dị ứng thực phẩm và trạng thái phục vụ (*Đang phục vụ / Tạm ngưng*).

3. **Quản lý Đặt bàn & Sơ đồ bàn Thời gian thực (Reservation & Floor Plan Management)**:
   * **Đặt bàn trực tuyến**: Khách hàng chọn ngày, ca phục vụ (Shift), số lượng khách, khu vực bàn (Sảnh chính, VIP, Ban công) và ghi chú đặc biệt.
   * **Đặt cọc giữ bàn (Deposit)**: Tính toán và yêu cầu đặt cọc trực tuyến qua VNPAY để xác nhận giữ chỗ, tự động khóa giữ bàn 17 phút (`BR-01`).
   * **Sơ đồ bàn trực quan Real-time**: Hiển thị trạng thái bàn tức thời (Trống - *Available*, Đã đặt - *Reserved*, Đang dùng bữa - *Occupied*, Chờ dọn - *Cleaning*) qua SignalR.
   * **Kiến trúc thiết bị kép tại bàn (Dual Display)**: Tablet EMenuTablet 100% chỉ xem và Màn hình EMenuTablet gắn cố định tại bàn (`BR-02`).
   * **Check-in bàn**: Waitstaff check-in khách đến bàn trên Tablet POS, chuyển trạng thái bàn sang `Occupied`.

4. **Trình diễn E-Menu, Gọi món tại bàn & Điều phối Bếp (Table E-Menu, Waitstaff Ordering & KDS)**:
   * **Tablet E-Menu cầm tay (EMenuTablet)**: Chế độ thụ động 100% chỉ xem (Passive View-only, ZERO nút bấm tương tác: không nút "Gọi phục vụ", không nút "Yêu cầu tính tiền", không giỏ hàng, không tự đặt món). Khách chiêm ngưỡng hình ảnh độ phân giải cao và câu chuyện ẩm thực.
   * **Nhân viên Phục vụ tư vấn & Tạo Order**: Waitstaff tư vấn ẩm thực, ghi nhận lưu ý dị ứng (`SpecialNotes`) và tạo Order trực tiếp trên Tablet POS gửi Bếp.
   * **Điều phối KDS Bếp (Hands-free)**: Hệ thống điều phối vé điện tử thời gian thực qua SignalR tới các trạm Bếp rảnh tay, đếm ngược SLA chuẩn bị và bôi đậm cảnh báo dị ứng.
   * **Kiểm soát quầy Pass & Expediter xác nhận Served**: Expediter tại quầy Pass kiểm tra QC đĩa món và bấm "Xác nhận ra món" (`Served`) trên Pass Tablet (`BR-04`). SignalR gửi thông báo tức thời / rung chuông tới Smartphone Waitstaff, Waitstaff nhận đĩa món và bưng phục vụ ra bàn bằng 2 tay, trực tiếp giới thiệu món ăn bằng lời.

5. **Thanh toán, Hóa đơn & Báo cáo thống kê (Billing, Payment & Analytics)**:
   * **Yêu cầu thanh toán & Xuất hóa đơn (UC-E3)**: Khách yêu cầu thanh toán trực tiếp với Waitstaff (lời nói / cử chỉ). Waitstaff mở Tablet POS xuất hóa đơn tạm tính tự động cấn trừ tiền cọc theo công thức tài chính bắt buộc `BR-03`: $\max(0, \text{Subtotal} + 5\% \text{ SVC} + 10\% \text{ VAT} - \text{Deposit Paid})$.
   * **Hiển thị hóa đơn & VietQR động lên EMenuTablet**: SignalR đẩy bảng kê chi tiết và mã VietQR động lên màn hình `EMenuTablet` tại bàn để khách kiểm tra minh bạch và thanh toán không chạm (hoặc thanh toán tiền mặt / quẹt thẻ POS qua Waitstaff).
   * **Xác nhận thanh toán & Đóng bàn**: Waitstaff bấm "Hoàn tất thanh toán" trên smartphone cá nhân và bàn chuyển sang trạng thái `Cleaning`.
   * **Dashboard Báo cáo & Thống kê**: Biểu đồ doanh thu theo thời gian, tỷ lệ lấp đầy bàn, số lượt đặt bàn thành công/hủy, thống kê các món ăn và Tasting Menu bán chạy nhất.

---

## 📅 10. Kế hoạch phát triển dự án (10 tuần)

### **Tuần 1–2: Proposal + Analysis (Phân tích yêu cầu)**
* **Mục tiêu:**
  * Hiểu rõ bài toán quản lý nhà hàng Fine Dining, quy trình đặt bàn tiệc có đặt cọc VNPAY, thực đơn EMenuTablet view-only và quy trình phục vụ Zero-touch tại bàn.
  * Xác định phạm vi và toàn bộ danh mục chức năng của hệ thống.
* **Công việc:**
  * Xác định Stakeholders (Khách hàng, Phục vụ, Điều phối Expediter, Bếp trưởng, Quản lý, Admin).
  * Viết tài liệu nghiệp vụ:
    * User Story cho từng nhóm đối tượng
    * Use Case Diagram tổng quát và chi tiết
  * Phân tích chức năng hệ thống:
    * Đăng ký / Đăng nhập & Phân quyền
    * Quản lý thực đơn Fine Dining (Tasting Menu, Course, Wine Pairing)
    * Đặt bàn trực tuyến & Đặt cọc giữ chỗ (Deposit) qua VNPAY
    * Tablet E-Menu cầm tay (EMenuTablet 100% view-only)
    * Tạo Order tại bàn qua Tablet POS & Điều phối KDS Bếp
    * Thanh toán hóa đơn (cấn trừ cọc BR-03, VAT, phí dịch vụ)
  * Viết tài liệu:
    * BRS (Business Requirement Specification)
    * SRS (Software Requirement Specification - bản draft)
* **Phân công (Gợi ý):**
  * Thành viên 1: Leader + viết BRS, quản lý tiến độ dự án
  * Thành viên 2: Viết User Story + Thiết kế Use Case Diagram
  * Thành viên 3: Phân tích quy trình nghiệp vụ (Flow đặt bàn & Flow gọi món tại bàn)
  * Thành viên 4: Khảo sát các hệ thống nhà hàng thực tế & đặc tả tính năng thanh toán cọc
  * Thành viên 5: Soạn thảo tài liệu SRS draft + vẽ Flowchart / Activity Diagram

---

### **Tuần 3–4: Design (Thiết kế Hệ thống & Giao diện)**
* **Mục tiêu:**
  * Thiết kế kiến trúc tổng thể phần mềm theo chuẩn Clean Architecture & 3-Layer.
  * Thiết kế cơ sở dữ liệu quan hệ (Database Schema) và giao diện người dùng (UI/UX).
* **Công việc:**
  * Thiết kế Kiến trúc Hệ thống:
    * Mô hình Web API phân tầng (API, Application, Infrastructure, Domain)
    * Thiết kế luồng xử lý CQRS với MediatR
    * Thiết kế RESTful API Specification (Swagger/OpenAPI draft)
    * Thiết kế cơ chế Real-time qua SignalR Hub cho Sơ đồ bàn, KDS Bếp và Smartphone Phục vụ
  * Thiết kế Cơ sở dữ liệu (Database Design):
    * Thiết kế Sơ đồ quan hệ thực thể (ERD trên SQL Server)
    * Thiết kế chi tiết các bảng: Users, Roles, Tables, Reservations, TastingMenus, Courses, Orders, OrderItems, Deposits, Invoices
  * Thiết kế giao diện UI/UX (Figma / Wireframes):
    * Giao diện Mobile Web: Khách hàng đặt bàn trực tuyến & cọc VNPAY
    * Giao diện Tablet E-Menu (EMenuTablet): 100% view-only (chỉ xem, không nút tương tác)
    * Giao diện EMenuTablet Catalog & Mẫu in phiếu tạm tính VietQR quầy thu ngân
    * Giao diện Tablet POS Waitstaff: Tạo order tại bàn, ghi chú dị ứng, xuất hóa đơn
    * Giao diện Pass Tablet & Màn hình KDS Bếp: Expediter QC xác nhận Served & Trạm bếp rảnh tay
    * Giao diện Desktop: Quản trị viên/Quản lý xem Dashboard thống kê và quản lý thực đơn, sơ đồ bàn
* **Phân công (Gợi ý):**
  * Thành viên 1: Thiết kế Kiến trúc Clean Architecture + Thiết kế Database ERD
  * Thành viên 2: Thiết kế giao diện UI/UX Khách hàng (Đặt bàn Mobile + EMenuTablet view-only)
  * Thành viên 3: Thiết kế giao diện UI/UX Sơ đồ bàn (Floor Plan) & Màn hình Bếp (KDS)
  * Thành viên 4: Thiết kế giao diện UI/UX Tablet POS Waitstaff & Dashboard Quản lý (Admin Portal)
  * Thành viên 5: Viết tài liệu Thiết kế Kiến trúc (SDD) + Thiết kế API Contracts

---

### **Tuần 5–6: Setup (Khởi tạo dự án & Xây dựng hạ tầng)**
* **Mục tiêu:**
  * Xây dựng bộ khung dự án (Boilerplate) cho cả Backend và Frontend.
  * Thiết lập cơ sở dữ liệu, phân quyền bảo mật JWT và kênh kết nối thời gian thực SignalR.
* **Công việc:**
  * Khởi tạo và thiết lập Backend (.NET 9):
    * Cấu hình Solution ASP.NET Core theo chuẩn Clean Architecture
    * Cài đặt Entity Framework Core 9, cấu hình DbContext và tạo Code-First Migrations
    * Cấu hình ASP.NET Core Identity, JWT Bearer Token, Refresh Token
    * Cấu hình Global Exception Handling Middleware và FluentValidation
    * Xây dựng SignalR Hub phục vụ truyền nhận dữ liệu thời gian thực
  * Khởi tạo và thiết lập Frontend (React + Vite):
    * Cấu hình React + TypeScript + Vite + Tailwind CSS
    * Cấu hình React Router v6 điều hướng đa trang và bảo vệ route (Protected Routes)
    * Cấu hình State Management: Zustand (Auth/Order Store) và TanStack Query (API Cache)
    * Cấu hình Axios Interceptors tự động đính kèm Token và xử lý Refresh Token
    * Kết nối SignalR Client (`@microsoft/signalr`)
* **Phân công (Gợi ý):**
  * Thành viên 1: Setup Solution Backend Clean Architecture, DbContext, Migrations CSDL
  * Thành viên 2: Xây dựng Module Authentication & Phân quyền JWT trên Backend
  * Thành viên 3: Setup dự án Frontend React + Vite + Tailwind CSS, cấu hình Router
  * Thành viên 4: Xây dựng Axios Client, Zustand Stores và TanStack Query setup
  * Thành viên 5: Cấu hình SignalR Hub trên Backend & SignalR Client trên Frontend

---

### **Tuần 7–8: Coding (Lập trình chức năng cốt lõi)**
* **Mục tiêu:**
  * Hoàn thiện toàn bộ các phân hệ nghiệp vụ chính của hệ thống.
  * Kết nối dữ liệu End-to-End giữa giao diện Frontend và Backend Web API.
* **Công việc:**
  * Phát triển Module Thực đơn & Bàn ăn:
    * Quản lý Tasting Menu, Course món ăn, Wine Pairing, cảnh báo dị ứng
    * Quản lý sơ đồ bàn và quy trình phục vụ bàn ăn (EMenuTablet view-only & In hóa đơn sổ da)
  * Phát triển Module Đặt bàn & Đặt cọc (Reservation & Deposit):
    * Khách hàng đặt bàn trực tuyến theo khung giờ/khu vực
    * Tính tiền cọc và tích hợp thanh toán cọc trực tuyến VNPAY với khóa bàn 17p (BR-01)
    * Quản lý sơ đồ bàn thời gian thực (Floor Plan Real-time)
  * Phát triển Module Phục vụ, KDS Bếp & Quầy Pass:
    * EMenuTablet chỉ xem cho khách thưởng lãm tại bàn (không nút tương tác)
    * Waitstaff tạo Order trên Tablet POS & điều phối KDS Bếp tự động qua SignalR
    * Expediter kiểm tra QC tại quầy Pass và bấm xác nhận Served (BR-04)
      * Phát triển Module Hóa đơn & Thanh toán (UC-E3):
    * Tính tiền hóa đơn (Invoice), tự động cấn trừ tiền cọc theo BR-03, tính VAT và phí dịch vụ
    * Xuất lệnh in phiếu tạm tính cấn trừ cọc kèm mã VietQR động ra máy in nhiệt quầy Thu ngân (80mm)
    * Xác nhận thanh toán trên Tablet POS và chuyển bàn sang Cleaning
* **Phân công (Gợi ý):**
  * Thành viên 1: Lập trình Module Thực đơn (Tasting Menu, Course) + Quản trị sơ đồ bàn
  * Thành viên 2: Lập trình Module Đặt bàn trực tuyến + Tích hợp cổng thanh toán cọc (VNPAY IPN)
  * Thành viên 3: Lập trình Giao diện EMenuTablet (100% view-only Digital Catalog)
  * Thành viên 4: Lập trình Module KDS Bếp + Pass Tablet xác nhận Served + Tablet POS Waitstaff
  * Thành viên 5: Lập trình Module Tính toán Hóa đơn cấn cọc BR-03 + VietQR + Dashboard Quản lý

---

### **Tuần 9–10: Hoàn thiện (Kiểm thử, Tối ưu & Báo cáo)**
* **Mục tiêu:**
  * Kiểm thử toàn diện hệ thống, sửa lỗi và tối ưu hóa hiệu năng.
  * Hoàn thiện Dashboard thống kê, viết báo cáo tổng kết đồ án và slide thuyết trình.
* **Công việc:**
  * Kiểm thử hệ thống (Testing & Bug Fixing):
    * Kiểm thử chức năng (Functional Testing) và kiểm thử API với Postman
    * Kiểm thử luồng Real-time SignalR giữa Smartphone Phục vụ, KDS Bếp, Pass Tablet và Máy in quầy
    * Kiểm thử giao diện Responsive trên Smartphone, Tablet và Desktop
  * Tối ưu hiệu năng:
    * Đánh Index CSDL SQL Server để tăng tốc truy vấn
    * Tối ưu Caching dữ liệu với TanStack Query trên Frontend
  * Phát triển Dashboard Báo cáo & Thống kê:
    * Biểu đồ doanh thu theo ca/ngày/tháng
    * Thống kê tỷ lệ lấp đầy bàn và các món ăn / Tasting Menu bán chạy
  * Hoàn thiện tài liệu và chuẩn bị bảo vệ:
    * Viết tài liệu Hướng dẫn sử dụng (User Manual)
    * Hoàn thiện cuốn Báo cáo đồ án tốt nghiệp / đồ án CDTH
    * Chuẩn bị Slide thuyết trình và kịch bản Demo hệ thống
* **Phân công (Gợi ý):**
  * Thành viên 1: Kiểm thử API, tối ưu Index SQL Server + Tổng hợp cuốn Báo cáo
  * Thành viên 2: Lập trình Dashboard Báo cáo thống kê doanh thu + Sửa lỗi UI
  * Thành viên 3: Kiểm thử luồng Đặt bàn cọc VNPAY + EMenuTablet trên thiết bị thật
  * Thành viên 4: Kiểm thử luồng KDS Bếp, Pass QC & Waitstaff Tablet POS + Chuẩn bị kịch bản Demo
  * Thành viên 5: Thiết kế Slide thuyết trình bảo vệ + Hoàn thiện các biểu đồ và hình ảnh trong báo cáo


