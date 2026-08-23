# THÔNG TIN BÁO CÁO DỰ ÁN
**Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (Fine Dining Restaurant Management & Reservation System)**

---

## 3. Các bên liên quan (Stakeholders)

| Đối tượng (Actor) | Thiết bị / Nền tảng sử dụng | Mô tả vai trò | Mục tiêu trong hệ thống |
| :--- | :--- | :--- | :--- |
| **Khách hàng (Customer / Guest)** | **Mobile Web (Smartphone)** *(Trình duyệt Safari/Chrome, không cần cài app)* | Khách hàng tìm hiểu nhà hàng, đặt bàn trước trực tuyến hoặc **quét mã QR tại bàn ăn** để tự gọi món. | Xem trải nghiệm ẩm thực (Tasting Menu, Wine Pairing); đặt bàn trước theo khung giờ/khu vực; **quét mã QR tại bàn để xem E-Menu và tự đặt món (Self-ordering)**; thanh toán cọc (Deposit) nhanh chóng; theo dõi lịch sử đơn và hóa đơn. |
| **Nhân viên Phục vụ (Waitstaff / Server)** | **Mobile / Tablet Web** *(Điện thoại hoặc Tablet cầm tay)* | Nhân viên hỗ trợ khách tại bàn, tiếp nhận Order từ mã QR của khách, nhận món từ Bếp, bưng ra bàn và **xác nhận hoàn thành món trên hệ thống**. | Theo dõi tình trạng bàn trống/đang phục vụ trên sơ đồ bàn; nhận thông báo khi có đơn QR mới; bắn lệnh lên món (**Course Firing**) cho Bếp; nhận món từ quầy ra món, bưng phục vụ tại bàn và **bấm xác nhận "Đã hoàn thành / Đã phục vụ" trên thiết bị**; hỗ trợ xuất hóa đơn. |
| **Đầu bếp / Bếp trưởng (Chef / Kitchen)** | **Tablet Web / Màn hình KDS / Máy in Bếp** *(Thiết bị tại khu vực Bếp)* | Bếp trưởng và phụ bếp tiếp nhận yêu cầu chế biến món ăn từ đơn đặt/phiếu in và thực hiện nấu nướng theo thứ tự. | Nhận thông báo đơn món tức thời (Real-time qua SignalR); nhận phiếu in order (số bàn, tên món, ghi chú dị ứng); chuẩn bị nguyên liệu, chế biến món ăn và đặt món ra quầy chuyển món (Pass) để nhân viên phục vụ tiếp nhận. |
| **Quản lý Nhà hàng (Manager)** | **Desktop / Laptop Web** *(Màn hình lớn)* | Người giám sát và điều hành toàn bộ hoạt động vận hành, phục vụ và kinh doanh của nhà hàng. | Theo dõi tình hình kinh doanh, doanh thu theo ca/ngày/tháng; quản lý danh mục thực đơn, giá bán; **tạo và in mã QR cho từng bàn ăn**; giám sát tỷ lệ lấp đầy bàn và chất lượng phục vụ thực tế. |
| **Quản trị hệ thống (Admin)** | **Desktop / Laptop Web** | Người phụ trách mặt kỹ thuật, quản lý tài khoản, phân quyền và cấu hình toàn bộ hệ thống website. | Đảm bảo hệ thống hoạt động ổn định, bảo mật dữ liệu người dùng, phân quyền truy cập chính xác (Role-Based Access Control) và cấu hình các danh mục hệ thống. |

---

## 6. Mô tả hệ thống đề xuất (Solution Overview)

### Hệ thống sẽ:
* **Xây dựng dưới dạng**: **Responsive Web Application & RESTful Web API**
  * Mô hình Client-Server hiện đại: Giao diện web đơn trang (**React + TypeScript + Tailwind CSS**) giao tiếp với **Backend Web API (.NET 9)**.
  * **Khả năng tương thích đa thiết bị (Cross-platform Web)**: Tự động tối ưu giao diện theo kích thước màn hình mà không cần cài đặt App native:
    * *Giao diện Mobile*: Dành cho Khách hàng quét mã QR đặt món và Nhân viên phục vụ cầm tay thao tác đi đơn.
    * *Giao diện Tablet (KDS) / Máy in*: Dành cho Bếp trưởng theo dõi danh sách món cần làm tại quầy Bếp.
    * *Giao diện Desktop*: Dành cho Quản lý và Admin quản trị dữ liệu.

* **Quy trình vận hành Đặt món & Đi đơn phục vụ (Order & Serving Workflow)**:
  1. **Khách quét mã QR**: Khách dùng camera điện thoại quét mã QR dán tại bàn ăn -> Trình duyệt mở ngay E-Menu kèm mã bàn tương ứng (`TableId`).
  2. **Khách gửi Order**: Khách chọn Tasting Menu, các Course món ăn và đồ uống -> Nhấn "Gửi Order".
  3. **Hệ thống nhận đơn & In phiếu Bếp (Real-time qua SignalR)**:
     * Hệ thống tự động in phiếu Bếp (phiếu order ghi rõ: Số bàn, Tên món, Giờ đặt, Ghi chú dị ứng) và hiển thị lên màn hình KDS của Bếp.
     * Điện thoại/Tablet của Nhân viên phục vụ nhận thông báo có đơn gọi món mới tại bàn.
  4. **Bếp chế biến & Chuyển món ra quầy**: Bếp trưởng xem phiếu in order/màn hình để điều phối nấu món. Khi món chín, Bếp đặt món ra quầy ra món (Pass).
  5. **Nhân viên nhận món & Xác nhận hoàn thành trên hệ thống**: Nhân viên phục vụ lấy món từ quầy Bếp mang ra bàn cho khách, sau đó **thao tác bấm "Xác nhận món đã hoàn thành / Đã phục vụ" trên điện thoại/tablet** để hệ thống cập nhật tiến độ bàn ăn.
  6. **Thanh toán & Đóng bàn**: Khách dùng bữa xong -> Nhân viên xuất hóa đơn điện tử (tự động cấn trừ tiền cọc trước đó nếu có) -> Khách thanh toán tiền mặt/chuyển khoản/VNPAY -> Bàn chuyển trạng thái chờ dọn dẹp.

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
   * **Đặt cọc giữ bàn (Deposit)**: Tính toán và yêu cầu đặt cọc trực tuyến để xác nhận giữ chỗ cho các bàn tiệc cao cấp.
   * **Sơ đồ bàn trực quan Real-time**: Hiển thị trạng thái bàn tức thời (Trống - *Available*, Đã đặt - *Reserved*, Đang dùng bữa - *Occupied*, Chờ dọn - *Cleaning*) qua SignalR.
   * **Quản lý mã QR bàn ăn (Table QR Management)**: Hệ thống sinh mã QR tự động cho từng bàn ăn để in và dán tại bàn thực tế.
   * **Check-in / Gán bàn**: Tiếp nhận khách đến, chuyển trạng thái bàn sang Đang dùng bữa.

4. **Quét mã QR gọi món & Điều phối Bếp (Table QR Self-Ordering & Serving Management)**:
   * **Quét mã QR đặt món tại bàn (Self-ordering)**: Khách hàng tại bàn dùng điện thoại quét mã QR để mở E-Menu, chọn Tasting Menu, các Course món ăn kèm đồ uống và gửi đơn Order trực tiếp vào hệ thống.
   * **In phiếu Bếp tự động**: Hệ thống xuất/in phiếu Bếp (số bàn, tên món, ghi chú dị ứng) và gửi thông báo real-time qua SignalR cho Bếp trưởng và Phục vụ.
   * **Điều phối chế biến & Bưng món**: Bếp chế biến xong và chuyển món ra quầy ra món (Pass).
   * **Nhân viên phục vụ xác nhận hoàn thành**: Nhân viên phục vụ nhận món, bưng ra bàn cho khách và **bấm nút "Xác nhận món đã hoàn thành / Đã phục vụ" trên điện thoại/tablet** để cập nhật trạng thái đơn món trên toàn hệ thống.

5. **Thanh toán, Hóa đơn & Báo cáo thống kê (Billing, Payment & Analytics)**:
   * **Tính tiền & Xuất hóa đơn (Invoice)**: Tự động tổng hợp các món/menu đã gọi qua QR hoặc nhân viên mở, áp dụng phí dịch vụ (Service Charge 5%), thuế VAT (10%), và tự động cấn trừ số tiền đặt cọc (Deposit) đã thanh toán trước đó.
   * **Hỗ trợ thanh toán linh hoạt**: Tiền mặt, thẻ ngân hàng, chuyển khoản hoặc tích hợp cổng thanh toán trực tuyến (VNPAY/MoMo).
   * **Dashboard Báo cáo & Thống kê**: Biểu đồ doanh thu theo thời gian, tỷ lệ lấp đầy bàn, số lượt đặt bàn thành công/hủy, thống kê các món ăn và Tasting Menu bán chạy nhất.

---

## 📅 10. Kế hoạch phát triển dự án (10 tuần)

### **Tuần 1–2: Proposal + Analysis (Phân tích yêu cầu)**
* **Mục tiêu:**
  * Hiểu rõ bài toán quản lý nhà hàng Fine Dining, quy trình đặt bàn tiệc và đặt món qua mã QR tại bàn.
  * Xác định phạm vi và toàn bộ danh mục chức năng của hệ thống.
* **Công việc:**
  * Xác định Stakeholders (Khách hàng, Phục vụ, Bếp trưởng, Quản lý, Admin).
  * Viết tài liệu nghiệp vụ:
    * User Story cho từng nhóm đối tượng
    * Use Case Diagram tổng quát và chi tiết
  * Phân tích chức năng hệ thống:
    * Đăng ký / Đăng nhập & Phân quyền
    * Quản lý thực đơn Fine Dining (Tasting Menu, Course, Wine Pairing)
    * Đặt bàn trực tuyến & Đặt cọc giữ chỗ (Deposit)
    * Quét mã QR tại bàn & Tự đặt món (Self-ordering)
    * In phiếu Bếp & Điều phối món
    * Thanh toán hóa đơn (cấn trừ cọc, VAT, phí dịch vụ)
  * Viết tài liệu:
    * BRS (Business Requirement Specification)
    * SRS (Software Requirement Specification - bản draft)
* **Phân công (Gợi ý):**
  * Thành viên 1: Leader + viết BRS, quản lý tiến độ dự án
  * Thành viên 2: Viết User Story + Thiết kế Use Case Diagram
  * Thành viên 3: Phân tích quy trình nghiệp vụ (Flow đặt bàn & Flow quét QR gọi món)
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
    * Thiết kế cơ chế Real-time qua SignalR Hub cho Bếp và Phục vụ
  * Thiết kế Cơ sở dữ liệu (Database Design):
    * Thiết kế Sơ đồ quan hệ thực thể (ERD trên SQL Server)
    * Thiết kế chi tiết các bảng: Users, Roles, Tables, Reservations, TastingMenus, Courses, Orders, OrderItems, Deposits, Invoices
  * Thiết kế giao diện UI/UX (Figma / Wireframes):
    * Giao diện Mobile Web: Khách hàng quét mã QR xem E-menu và tự đặt món
    * Giao diện Mobile/Tablet: Nhân viên phục vụ theo dõi sơ đồ bàn và xác nhận hoàn thành món
    * Giao diện Tablet/Desktop: Bếp trưởng theo dõi đơn món & màn hình KDS
    * Giao diện Desktop: Quản trị viên/Quản lý xem Dashboard thống kê và quản lý thực đơn
* **Phân công (Gợi ý):**
  * Thành viên 1: Thiết kế Kiến trúc Clean Architecture + Thiết kế Database ERD
  * Thành viên 2: Thiết kế giao diện UI/UX Khách hàng (Đặt bàn + E-Menu QR trên Mobile)
  * Thành viên 3: Thiết kế giao diện UI/UX Sơ đồ bàn (Floor Plan) & Màn hình Bếp (KDS)
  * Thành viên 4: Thiết kế giao diện UI/UX Dashboard Quản lý (Admin Portal)
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
    * Cấu hình State Management: Zustand (Auth/Cart Store) và TanStack Query (API Cache)
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
    * Quản lý sơ đồ bàn và tính năng sinh mã QR tự động cho từng bàn ăn
  * Phát triển Module Đặt bàn & Đặt cọc (Reservation & Deposit):
    * Khách hàng đặt bàn trực tuyến theo khung giờ/khu vực
    * Tính tiền cọc và tích hợp thanh toán cọc trực tuyến (VNPAY/MoMo)
    * Quản lý sơ đồ bàn thời gian thực (Floor Plan Real-time)
  * Phát triển Module Quét QR gọi món & Điều phối Bếp:
    * Khách hàng quét mã QR tại bàn để xem E-Menu và tự gửi Order vào hệ thống
    * Xuất/in phiếu Bếp tự động (in order ghi số bàn, tên món, ghi chú dị ứng)
    * Bếp điều phối nấu và chuyển món ra quầy
    * Nhân viên phục vụ bấm xác nhận "Đã hoàn thành món" trên điện thoại/tablet
  * Phát triển Module Hóa đơn & Thanh toán:
    * Tính tiền hóa đơn (Invoice), tự động cấn trừ tiền cọc trước đó, tính VAT và phí dịch vụ
    * Hỗ trợ xuất hóa đơn và đóng bàn
* **Phân công (Gợi ý):**
  * Thành viên 1: Lập trình Module Thực đơn (Tasting Menu, Course) + Sinh mã QR bàn
  * Thành viên 2: Lập trình Module Đặt bàn trực tuyến + Tích hợp cổng thanh toán cọc (VNPAY)
  * Thành viên 3: Lập trình Module Quét mã QR tại bàn + Giao diện E-Menu Self-Ordering
  * Thành viên 4: Lập trình Module In phiếu Bếp + Phục vụ xác nhận hoàn thành món (SignalR)
  * Thành viên 5: Lập trình Module Quản lý Sơ đồ bàn (Floor Plan) + Tính hóa đơn thanh toán

---

### **Tuần 9–10: Hoàn thiện (Kiểm thử, Tối ưu & Báo cáo)**
* **Mục tiêu:**
  * Kiểm thử toàn diện hệ thống, sửa lỗi và tối ưu hóa hiệu năng.
  * Hoàn thiện Dashboard thống kê, viết báo cáo tổng kết đồ án và slide thuyết trình.
* **Công việc:**
  * Kiểm thử hệ thống (Testing & Bug Fixing):
    * Kiểm thử chức năng (Functional Testing) và kiểm thử API với Postman
    * Kiểm thử luồng Real-time SignalR khi nhiều bàn cùng quét QR gọi món đồng thời
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
  * Thành viên 3: Kiểm thử luồng Quét QR đặt món trên thiết bị di động thật + Viết tài liệu HDSD
  * Thành viên 4: Kiểm thử luồng In phiếu Bếp & Phục vụ xác nhận món + Chuẩn bị kịch bản Demo
  * Thành viên 5: Thiết kế Slide thuyết trình bảo vệ + Hoàn thiện các biểu đồ và hình ảnh trong báo cáo


