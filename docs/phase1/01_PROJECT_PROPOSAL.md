# ĐỀ ÁN PHÁT TRIỂN HỆ THỐNG (PROJECT PROPOSAL)
## Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (VinDining)

---

### THÔNG TIN CHUNG DỰ ÁN
* **Tên đề tài**: Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (**VinDining**)
* **Loại hình**: Đồ án Chuyên ngành / Đồ án Tốt nghiệp Kỹ thuật Phần mềm
* **Giảng viên hướng dẫn**: ThS. Phạm Hữu Tùng
* **Nhóm sinh viên thực hiện**:
  1. **Nguyễn Mạnh Quyền** — MSSV: `0023168` *(Trưởng nhóm)*
  2. **Đặng Quốc Khánh** — MSSV: `0023145` *(Thành viên)*
  3. **Nguyễn Hoàng Đạt** — MSSV: `0023120` *(Thành viên)*
* **Thời gian thực hiện**: 10 Tuần (Kỳ học 2026)

---

## CHƯƠNG 1: TỔNG QUAN & BỐI CẢNH DỰ ÁN

### 1.1 Bài toán thực tế của nhà hàng Fine Dining
Mô hình ẩm thực cao cấp (**Fine Dining**) là phân khúc nhà hàng đặc thù hướng tới sự sang trọng, đẳng cấp và tính cá nhân hóa tối đa cho thực khách. Thực đơn của nhà hàng Fine Dining thường được thiết kế theo dạng các set ăn cố định, công phu (**Tasting Menu**, phân chia theo các **Course**: Khai vị, Món chính, Tráng miệng) kết hợp với các dòng đồ uống/rượu vang tuyển chọn (**Wine Pairing**).

Tuy nhiên, việc vận hành thủ công thông thường đang kìm hãm hiệu suất và làm suy giảm sự đẳng cấp mà phân khúc này hướng tới. Sự ngắt quãng thông tin giữa Khách hàng, Phục vụ, Nhà bếp và Quản lý tạo ra những rào cản nghiêm trọng trong hoạt động vận hành thời gian thực.

### 1.2 Các "Nỗi đau" vận hành cốt lõi (Core Pain Points)
1. **Rủi ro bùng bàn (No-show)**: Khách hàng đặt trước các vị trí đẹp (bàn VIP, ban công) hoặc yêu cầu chuẩn bị các set Tasting Menu đắt tiền nhưng không xuất hiện, gây tổn thất lớn về chi phí chuẩn bị nguyên vật liệu cao cấp nhập khẩu của nhà hàng.
2. **Sai sót thông tin đặc biệt & Cảnh báo dị ứng**: Các yêu cầu về dị ứng thực phẩm nhạy cảm (hải sản, đậu phộng, gluten) hoặc sở thích vị giác của thực khách dễ bị thất lạc hoặc chuyển đạt sai sót từ phục vụ xuống nhà bếp do quy trình ghi chép giấy tờ thủ công.
3. **Trễ điều phối ra món giữa Phục vụ và Bếp**: Mỗi món ăn trong Course cần được bưng ra bàn ở nhiệt độ và trạng thái hoàn hảo nhất ngay khi bếp nấu xong. Quy trình thủ công làm chậm trễ truyền tin, dẫn đến đĩa ăn bị giảm chất lượng tại quầy ra món (Pass).
4. **Cấn trừ tiền cọc (Deposit) phức tạp**: Việc quản lý, đối chiếu thủ công các khoản tiền đặt cọc đã thu trực tuyến khi xuất hóa đơn thanh toán cuối bữa ăn thường xuyên xảy ra nhầm lẫn, gây mất thời gian của bộ phận thu ngân và giảm sự hài lòng của khách.

### 1.3 Giải pháp hệ thống đề xuất
Xây dựng **Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (VinDining)** dưới dạng một ứng dụng Web Responsive đa nền tảng kết hợp Backend RESTful Web API hiện đại, tập trung 100% vào mô hình **Phục vụ tại chỗ (In-House Dining)**:
* **Khách hàng (Guest)**: Truy cập Web đặt bàn trực tuyến, đặt cọc giữ chỗ qua cổng VNPAY; khi đến nhà hàng, xem thực đơn qua thiết bị Digital Display (màn hình hiển thị) tại bàn để lựa chọn Tasting Menu và Course.
* **Nhân viên Phục vụ (Waitstaff)**: Sử dụng thiết bị di động/tablet cầm tay để check-in bàn, tiếp nhận yêu cầu gọi món từ khách, tư vấn dị ứng và đặt món trực tiếp trên phần mềm (kích hoạt in phiếu bếp tự động), nhận món từ quầy Pass bưng ra bàn. **Nhân viên Điều phối (Expediter/Checkfood)** tại quầy Pass chịu trách nhiệm kiểm tra món và bấm xác nhận hoàn thành trên hệ thống.
* **Nhà bếp (Kitchen)**: Tiếp nhận order thông qua hệ thống máy in nhiệt phân khu (Hot kitchen, Cold kitchen, Bar) tự động nhả phiếu ngay khi nhân viên duyệt đơn, phiếu in làm nổi bật các lưu ý dị ứng và phân nhóm món rõ ràng.
* **Quản lý & Admin (Manager & Admin)**: Sử dụng máy tính quản trị toàn diện danh mục thực đơn, sơ đồ bàn, gán ca, cấu hình mã QR bàn, theo dõi doanh thu thời gian thực và xử lý hoàn cọc ngoại lệ.

---

## CHƯƠNG 2: MỤC TIÊU DỰ ÁN & TIÊU CHÍ THÀNH CÔNG

### 2.1 Chỉ số đo lường hiệu quả (Success Metrics / KPIs)

| Phân loại | Mục tiêu & Chỉ số (KPIs) | Phương pháp kiểm chứng & Đo lường |
| :--- | :--- | :--- |
| **Mục tiêu định lượng** | **Giảm tỷ lệ bùng bàn (No-show)** | Dưới **2%** trong vòng 3 tháng áp dụng hệ thống nhờ cơ chế bắt buộc đặt cọc giữ chỗ (Deposit) qua cổng VNPAY. |
| **Mục tiêu định lượng** | **Thời gian truyền tải & in phiếu order** | Dưới **30 giây** kể từ khi nhân viên phục vụ bấm duyệt đơn trên tablet đến khi máy in bếp nhả phiếu order tự động qua kết nối thời gian thực. |
| **Mục tiêu định lượng** | **Nâng cao hiệu suất xoay vòng bàn** | Tăng từ **15% đến 20%** vào các khung giờ cao điểm nhờ quy trình ra món nhịp nhàng và thông báo trạng thái bàn dọn dẹp tức thời. |
| **Mục tiêu định tính** | **Đạt tỷ lệ an toàn sai sót phục vụ** | Đạt tỷ lệ tuyệt đối **0%** sai sót liên quan đến dị ứng nguyên liệu của khách nhờ cơ chế hiển thị và in đậm cảnh báo dị ứng trên phiếu bếp. |
| **Mục tiêu định tính** | **Chuẩn hóa trải nghiệm dịch vụ cao cấp** | Số hóa quy trình xem thực đơn qua Digital Display, chuyên nghiệp hóa tương tác phục vụ và minh bạch 100% dòng tiền cấn trừ cọc trên hóa đơn. |

### 2.2 Phân loại mức độ ưu tiên yêu cầu (MoSCoW Prioritization)

```mermaid
pie title Phân bổ mức độ ưu tiên yêu cầu (MoSCoW)
    "Must Have (Bắt buộc)" : 5
    "Should Have (Quan trọng)" : 3
    "Could Have (Mở rộng)" : 2
    "Won't Have (Ngoài phạm vi)" : 2
```

#### M - Must Have (Bắt buộc phải có trong phiên bản hiện tại):
* **REQ-01**: Đặt bàn trực tuyến, lựa chọn ngày/ca/vị trí bàn và thực hiện thanh toán đặt cọc giữ chỗ (Deposit) qua cổng VNPAY (giữ chỗ tạm 15 phút).
* **REQ-02**: Quản lý sơ đồ bàn trực quan, quản lý vòng đời trạng thái bàn (`Available` $\rightarrow$ `Reserved` $\rightarrow$ `Occupied` $\rightarrow$ `Cleaning`) và liên kết thiết bị Digital Display theo từng bàn.
* **REQ-03**: Khách xem thực đơn qua màn hình Digital Display tại bàn (chỉ xem, không cho phép đặt món trực tiếp).
* **REQ-04**: Nhân viên phục vụ tiếp nhận yêu cầu, tạo đơn trực tiếp trên thiết bị di động và kích hoạt in Bếp; Nhân viên Checkfood tại quầy Pass đối chiếu món và xác nhận hoàn thành.
* **REQ-05**: Lập hóa đơn thanh toán tự động cấn trừ tiền cọc đặt trước, tính phí dịch vụ 5%, VAT 10% và đóng bàn giải phóng trạng thái dọn dẹp.

#### S - Should Have (Quan trọng cần có để tối ưu vận hành):
* **REQ-06**: Quản trị danh mục thực đơn động tùy biến cao (Tasting Menu, các Course phân loại món, gợi ý đồ uống Wine Pairing).
* **REQ-07**: Cơ chế phân quyền chi tiết Role-Based Access Control (Admin, Manager, Waitstaff, Guest).
* **REQ-08**: Cơ chế duyệt hoàn tiền cọc thủ công (Manual Refund Override) dành riêng cho cấp Quản lý khi khách gặp sự cố bất khả kháng.

#### C - Could Have (Khuyến khích có nếu đủ thời gian):
* **REQ-09**: Khách hàng gửi đánh giá, phản hồi trực tiếp về chất lượng món ăn và dịch vụ trên Web sau bữa ăn.
* **REQ-10**: Dashboard báo cáo thống kê trực quan doanh thu theo ca/ngày/tháng và các món ăn bán chạy nhất.

#### W - Won't Have (Không phát triển trong khuôn khổ đồ án hiện tại):
* **REQ-11**: Module Giao hàng tận nơi (Online Delivery) và tính phí vận chuyển theo khoảng cách (không phù hợp với định vị Fine Dining).
* **REQ-12**: Tích hợp API với các hãng giao nhận thức ăn bên thứ ba (GrabFood, ShopeeFood).

---

## CHƯƠNG 3: MÔ TẢ GIẢI PHÁP & KIẾN TRÚC KỸ THUẬT

### 3.1 Kiến trúc tổng thể hệ thống (Clean Architecture & 3-Layer)
Hệ thống được thiết kế theo mô hình **Client-Server phân tách hoàn toàn**, tầng Backend áp dụng chuẩn **Clean Architecture** kết hợp mô hình **CQRS** với **MediatR** nhằm đảm bảo nguyên tắc **SOLID**, khả năng mở rộng và kiểm thử độc lập:

> 📐 **Tệp thiết kế Draw.io**: [`architecture_clean_arch.drawio`](file:///c:/Users/Admin/Documents/antigravity/blissful-hertz/docs/phase1/drawio/architecture_clean_arch.drawio)

```mermaid
graph TD
    subgraph Presentation Layer [Tầng Trình Diễn / Client]
        FE_Guest["Khách hàng (Mobile Web E-Menu & Booking)"]
        FE_Staff["Nhân viên Phục vụ (Mobile/Tablet Web)"]
        FE_Admin["Quản lý & Admin (Desktop Portal)"]
    end

    subgraph API Layer [API & Gateway Layer]
        API_Controller["ASP.NET Core Web API 9 Controllers"]
        SignalR_Hub["SignalR Real-time Hubs (Floor Plan & Order Hub)"]
        Middleware["JWT Auth & Global Exception Middleware"]
    end

    subgraph Application Layer [Application Business Logic - CQRS]
        MediatR_Cmd["Commands & Handlers (Ghi/Xử lý dữ liệu)"]
        MediatR_Query["Queries & Handlers (Đọc dữ liệu)"]
        FluentVal["FluentValidation Pipeline Behaviors"]
    end

    subgraph Domain Layer [Core Domain Layer]
        Entities["Domain Entities (Guest, Table, Reservation, Order, Invoice)"]
        Enums["Enums (TableStatus, OrderStatus)"]
        BusinessRules["Domain Rules & Calculations"]
    end

    subgraph Infrastructure Layer [Infrastructure & Persistence Layer]
        EFCore["Entity Framework Core 9 (IApplicationDbContext)"]
        SQLServer[("Microsoft SQL Server")]
        VNPAY["VNPAY Payment Gateway Service"]
        PrinterService["ESC/POS Thermal Printing Service"]
    end

    FE_Guest -->|HTTPS / REST API| API_Controller
    FE_Staff -->|HTTPS & WebSocket| API_Controller
    FE_Staff -->|WebSocket SignalR| SignalR_Hub
    FE_Admin -->|HTTPS / REST API| API_Controller

    API_Controller --> Middleware --> MediatR_Cmd & MediatR_Query
    MediatR_Cmd & MediatR_Query --> FluentVal
    MediatR_Cmd & MediatR_Query --> Entities
    MediatR_Cmd & MediatR_Query --> EFCore
    EFCore --> SQLServer
    MediatR_Cmd --> VNPAY & PrinterService
```

### 3.2 Bảng công nghệ sử dụng (Technology Stack)

| Phân tầng (Layer) | Công nghệ / Thư viện | Vai trò & Lý do lựa chọn |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + TypeScript (Vite)** | Đảm bảo tốc độ render nhanh, type-safe, Single Page Application tối ưu trải nghiệm người dùng. |
| **UI & Styling** | **Tailwind CSS + Lucide Icons** | Thiết kế giao diện sang trọng chuẩn Fine Dining, Responsive mượt mà trên Mobile/Tablet/Desktop. |
| **Frontend State & Cache** | **TanStack Query + Zustand** | Quản lý Server Cache và Client State nhẹ nhàng, hạn chế tối đa re-render thừa. |
| **Backend Framework** | **ASP.NET Core (.NET 9) Web API** | Hiệu năng xử lý cao, kiến trúc chuẩn Enterprise, hỗ trợ DI và async/await mạnh mẽ. |
| **Architectural Pattern** | **Clean Architecture + CQRS (MediatR)** | Tách biệt nghiệp vụ đọc/ghi, tuân thủ nguyên tắc SOLID, dễ mở rộng và bảo trì. |
| **Database & ORM** | **Microsoft SQL Server + EF Core 9** | Hệ CSDL quan hệ vững chắc, hỗ trợ Transaction ACID, Code-First Migrations chuẩn hóa. |
| **Real-time Protocol** | **ASP.NET Core SignalR Client/Server** | Truyền phát thông báo đơn mới, đồng bộ trạng thái sơ đồ bàn tức thời với độ trễ < 100ms. |
| **Thanh toán trực tuyến** | **Cổng thanh toán VNPAY (Sandbox API)** | Xử lý thanh toán cọc trực tuyến an toàn với cơ chế IPN xác thực giao dịch thời gian thực. |
| **In ấn hóa đơn & Bếp** | **ESC/POS Web Printing / LAN Printer** | Gửi lệnh in trực tiếp ra máy in nhiệt tại các phân khu bếp và quầy thu ngân. |

---

## CHƯƠNG 4: DANH MỤC PHÂN HỆ CHỨC NĂNG CỐT LÕI

1. **Phân hệ 1: Xác thực & Quản trị tài khoản (Authentication & RBAC)**:
   - Đăng ký tài khoản khách hàng, đăng nhập an toàn với JWT Bearer Token và Refresh Token.
   - Phân quyền theo vai trò (Guest, Waitstaff, Manager, Admin).
2. **Phân hệ 2: Đặt bàn trực tuyến & Thu tiền cọc (Reservation & Deposit)**:
   - Chọn ngày, ca phục vụ, số lượng khách, khu vực bàn ăn.
   - Khóa giữ bàn tạm thời 15 phút, thanh toán cọc cố định theo loại bàn qua VNPAY, tự động sinh mã `BookingCode`.
   - Cơ chế tự động giải phóng bàn nếu quá 15 phút không hoàn tất thanh toán.
3. **Phân hệ 3: Quản lý Thực đơn & Sơ đồ bàn (Menu & Floor Plan Management)**:
   - Quản lý các món ăn, Tasting Menu, phân loại Course và cảnh báo dị ứng.
   - Quản lý sơ đồ bàn trực quan, quản lý thiết bị Digital Display tại bàn thực tế.
4. **Phân hệ 4: Gọi món & In phiếu Bếp (Waitstaff Ordering & Kitchen Dispatch)**:
   - Khách xem E-Menu qua Digital Display khi bàn ở trạng thái `Occupied`.
   - Nhân viên phục vụ tạo đơn hàng trực tiếp trên thiết bị cầm tay; hệ thống tự động in phiếu Bếp ngay khi tạo đơn.
   - Nhân viên phục vụ lấy món từ quầy Pass bưng ra bàn và bấm xác nhận "Đã phục vụ".
5. **Phân hệ 5: Thanh toán & Xuất hóa đơn cấn trừ cọc (Billing & Invoice Settlement)**:
   - Tự động cộng dồn tiền món, tính 5% phí dịch vụ, 10% VAT và tự động cấn trừ số tiền cọc (Deposit) đã thanh toán.
   - In hóa đơn tạm tính và hóa đơn tài chính cuối cùng, đóng bàn và chuyển trạng thái sang `Cleaning`.

---

## CHƯƠNG 5: KẾ HOẠCH PHÁT TRIỂN & PHÂN CÔNG 10 TUẦN

```mermaid
gantt
    title Lộ trình 10 Tuần Phát triển Dự án VinDining
    dateFormat  YYYY-MM-DD
    section Phase 1: Proposal & Analysis
    Khảo sát & Đề xuất dự án (Tuần 1)    :a1, 2026-08-25, 7d
    Phân tích BRS, Use Case, Activity (Tuần 2) :a2, after a1, 7d
    section Phase 2: Design & Architecture
    Thiết kế Kiến trúc, SDD, ADRs (Tuần 3) :b1, after a2, 7d
    Thiết kế Database ERD, OpenAPI (Tuần 4) :b2, after b1, 7d
    section Phase 3: Setup & Boilerplate
    Khởi tạo Backend Clean Arch, EF Core (Tuần 5) :c1, after b2, 7d
    Khởi tạo Frontend Vite, Tailwind, SignalR (Tuần 6) :c2, after c1, 7d
    section Phase 4: Feature Implementation
    Phát triển Đặt bàn, VNPAY, Sơ đồ bàn (Tuần 7) :d1, after c2, 7d
    Phát triển Quét QR, In Bếp, Hóa đơn (Tuần 8) :d2, after d1, 7d
    section Phase 5: Verification & Delivery
    Kiểm thử Tích hợp, Tối ưu Index SQL (Tuần 9) :e1, after d2, 7d
    Viết báo cáo tổng kết & Chuẩn bị Demo (Tuần 10) :e2, after e1, 7d
```

### Bảng phân công nhiệm vụ chi tiết:

| Tuần          | Giai đoạn                       | Công việc trọng tâm                                                                                                    | Deliverables chính                                                                | Phân công phụ trách                                                                                                                                           |
| :-------------:| :--------------------------------| :-----------------------------------------------------------------------------------------------------------------------| :----------------------------------------------------------------------------------| :--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Tuần 1–2**  | **Proposal + Analysis**         | Khảo sát hiện trạng, phân tích bài toán Fine Dining, xây dựng Use Case, Activity & Sequence Diagrams                   | `01_PROJECT_PROPOSAL.md`<br>`02_BAO_CAO_KHAO_SAT.md`<br>`03_BAO_CAO_PHAN_TICH.md` | **Nguyễn Mạnh Quyền**: Quản lý tiến độ, BRS<br>**Đặng Quốc Khánh**: Khảo sát & Flowchart<br>**Nguyễn Hoàng Đạt**: Use Case & Activity Diagrams                |
| **Tuần 3–4**  | **System Design**               | Thiết kế Clean Architecture, Database ERD (SQL Server), OpenAPI contracts, UI/UX Wireframes                            | Sơ đồ ERD, Báo cáo Thiết kế Kiến trúc (SDD), OpenAPI Specs                        | **Nguyễn Mạnh Quyền**: Database ERD & Clean Arch<br>**Đặng Quốc Khánh**: UI/UX Digital Display & Tablet<br>**Nguyễn Hoàng Đạt**: SDD & API Contracts          |
| **Tuần 5–6**  | **Setup & Infrastructure**      | Thiết lập Backend .NET 9 Clean Arch, EF Core Migrations, Identity JWT, SignalR Hub; Setup Frontend React Vite Tailwind | Solution Backend & Frontend chạy được Skeleton, kết nối CSDL                      | **Nguyễn Mạnh Quyền**: Backend Solution & DbContext<br>**Đặng Quốc Khánh**: Frontend Scaffold & Zustand<br>**Nguyễn Hoàng Đạt**: Auth JWT & SignalR Hub setup |
| **Tuần 7–8**  | **Core Coding**                 | Lập trình module Đặt bàn + cọc VNPAY, Hiển thị Digital Menu, Order trực tiếp, In Bếp, Thanh toán cấn trừ cọc           | Hệ thống chạy thông luồng End-to-End từ đặt bàn đến thanh toán                    | **Nguyễn Mạnh Quyền**: Đặt bàn & VNPAY API<br>**Đặng Quốc Khánh**: Digital E-Menu & Order Flow<br>**Nguyễn Hoàng Đạt**: In phiếu Bếp & Hóa đơn cấn cọc        |
| **Tuần 9–10** | **Verification & Final Report** | Kiểm thử End-to-End, tối ưu Index CSDL, đóng gói báo cáo đồ án hoàn chỉnh, chuẩn bị Slide và kịch bản Demo             | Báo cáo Đồ án Tốt nghiệp hoàn chỉnh, Video/Slide Demo, Code Repository            | **Cả nhóm**: Kiểm thử hệ thống, hoàn thiện cuốn Báo cáo và bảo vệ đồ án trước Hội đồng                                                                        |

---

## CHƯƠNG 6: KẾT QUẢ DỰ KIẾN & TIÊU CHÍ ĐÁNH GIÁ

1. **Sản phẩm Phần mềm**:
   - Backend ASP.NET Core Web API .NET 9 hoàn chỉnh, bảo mật JWT, kết nối SQL Server và tích hợp cổng VNPAY Sandbox.
   - Frontend React SPA chuẩn Responsive chạy mượt mà trên Mobile/Tablet (E-Menu Digital Display), Tablet (Nhân viên phục vụ) và Desktop (Quản trị viên).
   - Tín hiệu Real-time qua SignalR đồng bộ tức thời trạng thái bàn và đơn gọi món mới.
2. **Bộ Tài liệu Đồ án**:
   - Bộ hồ sơ phân tích và thiết kế phần mềm hoàn chỉnh: BRS, Báo cáo khảo sát, Báo cáo phân tích hệ thống (Use Case, Activity, Sequence Diagrams), Thiết kế CSDL (ERD) và Tài liệu thiết kế kiến trúc (SDD).
   - Mã nguồn chuẩn Clean Architecture được quản lý phiên bản rõ ràng trên Git/GitHub.
