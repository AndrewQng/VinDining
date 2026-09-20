# 04_PROJECT_TECH: Báo Cáo Phân Tích Công Nghệ & Kiến Trúc Hệ Thống (VinDining)

Tài liệu này trình bày chi tiết về các công nghệ, design pattern, và mô hình kiến trúc được áp dụng trong dự án hệ thống quản lý nhà hàng VinDining. Đồng thời, tài liệu cung cấp sự so sánh với các lựa chọn thay thế (alternatives) để lý giải tại sao stack công nghệ hiện tại lại là lựa chọn tối ưu nhất.

---

## 1. Mô Hình Kiến Trúc: Clean Architecture vs MVC

**Công nghệ / Mô hình sử dụng:** Clean Architecture (chia làm 4 lớp: Domain, Application, Infrastructure, Web API) đóng vai trò làm Backend cung cấp RESTful API, kết hợp với Frontend (React) đóng vai trò Client độc lập (Mô hình Client-Server / SPA).

**So sánh với mô hình MVC (Model-View-Controller) truyền thống:**
* **Mô hình MVC (ví dụ ASP.NET Core MVC):** Trong MVC truyền thống, Server xử lý cả logic nghiệp vụ lẫn việc render giao diện (View - HTML/CSS) trả về cho trình duyệt.
    * *Nhược điểm:* Khó chia tách công việc giữa team Frontend và Backend. View bị dính chặt với Backend, không thể tái sử dụng API cho các nền tảng khác (Mobile App, iPad POS). Trải nghiệm người dùng (UX) thường chậm hơn do phải tải lại trang mỗi khi click (Full page reload).
* **Mô hình Clean Architecture + SPA (Lựa chọn hiện tại):** Backend (Clean Architecture) hoàn toàn không biết gì về giao diện, chỉ trả về dữ liệu chuẩn JSON. Frontend (React) là một ứng dụng độc lập (Single Page Application).
    * *Ưu điểm:* 
        1. **Tái sử dụng:** Backend API hiện tại có thể được dùng cho cả web quản lý, web đặt bàn của khách, ứng dụng tablet của bồi bàn (Waitstaff POS) và màn hình quầy điều phối (Expediter Pass) mà không cần viết lại.
        2. **Bảo vệ Core Logic:** Clean Architecture tách biệt hoàn toàn Logic nghiệp vụ (Domain/Application) khỏi các yếu tố bên ngoài (Database, Framework UI). Trong MVC, Controller thường bị "nhồi nhét" quá nhiều logic (Fat Controller) và phụ thuộc trực tiếp vào Entity Framework.

---

## 2. Design Pattern: CQRS & MediatR, DI Lifetimes (Singleton, Scoped, Transient)

### 2.1. Thư viện MediatR & Pattern CQRS (Command Query Responsibility Segregation)

#### A. MediatR là gì?
**MediatR** là một thư viện mã nguồn mở phổ biến trong hệ sinh thái .NET, hiện thực hóa **Mediator Pattern** (Mô hình điều phối trung gian) theo cơ chế **In-process Messaging** (truyền thông điệp nội bộ bên trong cùng một tiến trình ứng dụng). 

Thay vì các thành phần trong hệ thống (như Controller, Services, Repositories) gọi trực tiếp lẫn nhau tạo thành một mạng lưới phụ thuộc chằng chịt (tight coupling), MediatR đóng vai trò làm "trạm trung chuyển trung tâm". Các bên giao tiếp với nhau gián tiếp thông qua việc gửi các đối tượng thông điệp (Request / Notification) đến MediatR, và MediatR sẽ tự động tìm đúng Handler chịu trách nhiệm xử lý.

#### B. Cơ chế hoạt động của MediatR
MediatR hoạt động dựa trên 3 cơ chế chính:
1. **Request / Response (1-to-1 Dispatcher):**
   * Được dùng cho cả **Command** (thao tác ghi dữ liệu) và **Query** (thao tác đọc dữ liệu).
   * Một Request kế thừa từ `IRequest<TResponse>`. Khi Controller gọi `_mediator.Send(request)`, MediatR sử dụng Dependency Injection container để định vị và kích hoạt đúng duy nhất một `IRequestHandler<TRequest, TResponse>` tương ứng để xử lý và trả về kết quả.
2. **Notifications / In-memory Events (1-to-many Publisher):**
   * Được dùng cho các sự kiện miền nội bộ (Domain Events).
   * Kế thừa từ `INotification`. Khi gọi `_mediator.Publish(notification)`, MediatR sẽ phát thông điệp này tới nhiều `INotificationHandler<TNotification>` cùng lúc mà đối tượng gửi không cần biết có bao nhiêu bên đang lắng nghe.
3. **Pipeline Behaviors (AOP - Aspect-Oriented Programming):**
   * Hoạt động tương tự như Middleware của ASP.NET Core nhưng nằm ở tầng **Application**.
   * Cho phép chèn các xử lý xuyên suốt (Cross-cutting concerns) như: Tự động Validate dữ liệu đầu vào (FluentValidation), Logging thời gian thực thi, Xử lý Transaction (Unit of Work), Bắt ngoại lệ trước và sau khi Request chạm tới Handler thực sự.

#### C. Tác dụng & Lợi ích vượt trội so với Service thông thường (CRUD Service)
* **Triệt tiêu "Fat Controller" & giải quyết triệt để Constructor Over-injection:** Trong kiến trúc truyền thống, một Controller quản lý nghiệp vụ thường phải inject 5 - 10 Service/Repository khác nhau (`IOrderService`, `ITableService`, `IBillService`, `ILogger`, `IMapper`...). Với MediatR, Controller chỉ cần inject **duy nhất một abstraction** là `ISender` (hoặc `IMediator`). Controller trở nên siêu mỏng (Thin Controller), chỉ làm nhiệm vụ nhận HTTP Request, đóng gói thành Command/Query rồi bàn giao cho MediatR.
* **Tuân thủ triệt để nguyên lý Single Responsibility Principle (SRP):** Thay vì tạo các class Service khổng lồ (God Service) chứa hàng chục hàm xử lý đan xen, mỗi Use Case trong hệ thống được đóng gói thành một cặp độc lập gồm: **Request (Command/Query)** và **Handler**. Mỗi class chỉ có một trách nhiệm duy nhất, sửa đổi nghiệp vụ này hoàn toàn không thể làm hỏng nghiệp vụ khác.
* **Tách bạch tối ưu luồng Đọc và Ghi (CQRS):**
   * *Luồng Ghi (Command):* Đòi hỏi kiểm tra ràng buộc nghiệp vụ khắt khe, tính toán trạng thái, đảm bảo tính toàn vẹn dữ liệu (Transaction) qua Entity Framework Core.
   * *Luồng Đọc (Query):* Không cần nạp thực thể đầy đủ hay kiểm tra logic phức tạp. MediatR định tuyến trực tiếp truy vấn ra DTO (có thể tối ưu bằng Dapper hoặc EF Core `AsNoTracking()`), giúp màn hình sơ đồ bàn và quầy điều phối Expediter phản hồi dữ liệu cực nhanh mà không gây quá tải database.
* **Dễ dàng viết Unit Test:** Mỗi Handler là một đơn vị độc lập, không phụ thuộc vào `HttpContext`, Router, hay Controller. Tester có thể dễ dàng test riêng từng luồng nghiệp vụ bằng cách cung cấp dữ liệu giả lập (Mock).

#### D. Vai trò của MediatR trong hệ thống VinDining
Trong kiến trúc Clean Architecture của VinDining, MediatR giữ vị trí "xương sống" điều phối luồng thực thi:
1. **Cầu nối ranh giới giữa Presentation (Web API) và Application:** Giữ cho tầng API hoàn toàn tách biệt với logic nghiệp vụ. Khi chuyển đổi từ Web API sang Worker Service hoặc gRPC, tầng Application giữ nguyên 100%.
2. **Thực thi Pipeline Validation tự động:** Kết hợp với `FluentValidation`, MediatR tự động kiểm tra tính hợp lệ của mọi yêu cầu (ví dụ: số lượng khách đặt bàn phải > 0, giờ đặt phải trong khung giờ hoạt động, tiền cọc phải khớp với quy định) trước khi use case được kích hoạt. Handler chỉ tập trung xử lý nghiệp vụ thuần túy mà không cần viết lặp lại các lệnh `if (request.Guests <= 0)`.
3. **Điều phối Sự kiện đa kênh (KDS Bếp, Quầy Pass, Smartphone Waitstaff qua SignalR):**
   * Khi `CreateOrderCommandHandler` tạo đơn hàng thành công, nó gửi một `OrderCreatedNotification` qua `Publish()`.
   * MediatR kích hoạt song song các Handler: 
     - Một Handler phát sự kiện SignalR (`OrderDispatchedToKds`) đẩy vé điện tử tới **Màn hình KDS Bếp** tại các trạm chế biến (Bếp nóng, Bếp lạnh, Bar) rảnh tay (Hands-free) kèm đồng hồ đếm ngược SLA và nhãn cảnh báo dị ứng / ghi chú đặc biệt (`SpecialNotes`) bôi đậm theo từng món ăn.
     - Một Handler phát tín hiệu qua **SignalR** tới quầy điều phối Pass (Expediter) để theo dõi tiến độ chuẩn bị món và tới **Smartphone cá nhân của Waitstaff** hiển thị thông báo rung khi món ăn hoàn tất tại quầy Pass (`BR-04`).
     - Toàn bộ logic tạo đơn hàng hoàn toàn độc lập, tuân thủ Clean Architecture, không bị ràng buộc cứng với giao diện hay kết nối socket.

### 2.2. Dependency Injection (DI) & Vòng đời Service (Singleton vs Scoped vs Transient)
Kiến trúc của dự án áp dụng triệt để Dependency Injection (DI) của .NET. Pattern DI quản lý việc khởi tạo các class thông qua 3 vòng đời (lifetimes). Sự khác biệt và lý do sử dụng của chúng như sau:

1. **Singleton (Tồn tại duy nhất 1 bản sao trong toàn ứng dụng):**
    * *Cách hoạt động:* Khởi tạo 1 lần duy nhất khi ứng dụng chạy và dùng chung cho tất cả các request.
    * *Khi nào dùng / Tại sao dùng:* Dùng cho các service có trạng thái cần chia sẻ toàn cục, chi phí khởi tạo lớn, và không liên quan đến database context. Ví dụ: `MemoryCache`, `SignalR HubContext`, `Logger`. Trong Frontend (React), store của `Zustand` cũng là một dạng Singleton để giữ state chung (đơn món Order, user profile).

2. **Scoped (Tạo mới ở mỗi HTTP Request):**
    * *Cách hoạt động:* Mỗi khi có một user gọi API (1 Request), hệ thống tạo ra 1 instance. Instance này được dùng chung trong suốt quá trình xử lý request đó (đi qua nhiều class khác nhau), nhưng độc lập hoàn toàn với các Request của user khác. Khi Request kết thúc, nó bị huỷ đi.
    * *Khi nào dùng / Tại sao dùng:* Dùng đặc biệt cho **`DbContext` (Entity Framework)**, **Repository** và **Unit of Work**. 
    * *Lý do:* Nếu dùng Singleton cho DbContext, các truy vấn song song của nhiều user sẽ giẫm đạp lên nhau gây lỗi đa luồng (Concurrency) hoặc lộ dữ liệu (Data Leak). Nếu dùng Transient, trong cùng 1 request ta lưu dữ liệu 2 lần sẽ sinh ra 2 DbContext khác nhau, mất đi tính Transaction (không thể Commit trọn vẹn). Do đó, Scoped là lựa chọn bắt buộc và tối ưu nhất cho truy xuất CSDL.

3. **Transient (Tạo mới mỗi khi được yêu cầu):**
    * *Cách hoạt động:* Bất cứ khi nào 1 class khác cần dùng, hệ thống sẽ new() ra một instance hoàn toàn mới.
    * *Khi nào dùng / Tại sao dùng:* Phù hợp với các service siêu nhẹ, không lưu trữ trạng thái (stateless), và cần tính độc lập cực cao. Ví dụ: Dịch vụ mã hoá mật khẩu (PasswordHasher), dịch vụ tạo chuỗi Random OTP, dịch vụ format chuỗi.

---

## 3. Backend & Cơ Sở Dữ Liệu: .NET 9, SQL Server, EF Core

**Công nghệ sử dụng:** ASP.NET Core 9 Web API, Microsoft SQL Server, Entity Framework Core 9.

**So sánh với các stack khác:**
* **Node.js/Express + MongoDB (NoSQL):** Phát triển nhanh nhưng dễ dẫn đến dữ liệu thiếu nhất quán do tính "Schema-less" của NoSQL. VinDining là hệ thống có giao dịch tài chính (hóa đơn, tiền cọc) và tính quan hệ dữ liệu rất cao (Bàn -> Đơn hàng -> Món ăn). 
* **Spring Boot (Java) + MySQL:** Tương đương với .NET, nhưng hệ sinh thái .NET hiện nay (đặc biệt với C# 12/13 và .NET 9) cho hiệu năng vượt trội và trải nghiệm developer mượt mà hơn.

**Tại sao chọn stack này:** SQL Server đảm bảo tính toàn vẹn (ACID) cho giao dịch. EF Core 9 hỗ trợ LINQ mạnh mẽ, quản lý Migration an toàn. .NET 9 quản lý đa luồng (async/await) xuất sắc giúp API phản hồi cực nhanh.

---

## 4. Công Nghệ Kết Nối Real-time: ASP.NET Core SignalR

**Công nghệ sử dụng:** SignalR (tự động sử dụng giao thức WebSockets làm mặc định).

**Mô tả chi tiết và so sánh:**
* **HTTP Polling (Client tự động gọi API mỗi 3 giây):** 
    * *Cơ chế:* Frontend dùng `setInterval` để liên tục hỏi Server "có món ăn nào mới không?".
    * *Nhược điểm:* Gây quá tải server kinh khủng (giống như tự DDoS chính mình), lãng phí băng thông và độ trễ cao. Không phù hợp với nhà hàng có hàng trăm bàn.
* **Server-Sent Events (SSE):** 
    * *Cơ chế:* Kết nối 1 chiều từ Server -> Client.
    * *Nhược điểm:* Khi Waiter cần gửi tín hiệu "Đã nhận món" ngược lại Server thì SSE không hỗ trợ (phải gọi API HTTP riêng, làm đứt đoạn flow real-time).
* **WebSockets (SignalR):**
    * *Cơ chế:* Tạo một "đường ống" (persistent connection) kết nối hai chiều liên tục giữa Server và Client.
    * *Tại sao chọn SignalR:* Nó là bộ thư viện bao bọc WebSockets hoàn hảo của .NET. Rất thiết yếu cho các chức năng: 
      1. **Sơ đồ bàn (Floor Plan):** Khách đặt bàn hoặc nhân viên đổi trạng thái -> Icon bàn lập tức chuyển sang màu đỏ "Đã đặt" hoặc vàng "Đang dùng" trên tất cả thiết bị của Hostess, Quản lý, Thu ngân mà không cần F5.
      2. **Điều phối KDS Bếp (Kitchen Display System):** Ngay khi Waitstaff tạo Order, các trạm Bếp nóng, Bếp lạnh, Bar nhận lệnh chế biến tức thời trên màn hình KDS rảnh tay (Hands-free) với bộ đếm ngược thời gian SLA chuẩn xác và cảnh báo dị ứng / ghi chú đặc biệt (`SpecialNotes`) bôi đậm theo từng món ăn.
      3. **Điều phối quầy Pass & Thông báo Rung Smartphone Phục vụ (Pass QC & Smartphone Alert):** Khi đĩa món hoàn tất tại Pass, Expediter kiểm tra QC và bấm "Served" (`Xác nhận ra món / Phục vụ`) trực tiếp trên Pass Tablet -> SignalR gửi thông báo đẩy / rung chuông tức thời tới Smartphone cá nhân của Waitstaff phụ trách (*"Bàn [Số bàn]: Món [Tên món] đã sẵn sàng tại quầy Pass!"*), đồng thời hiển thị tiến độ bàn và gợi ý kích hoạt Course tiếp theo khi món cuối của Course hoàn tất (Course Pacing & Delayed SLA warning - `BR-06`). Waitstaff đón nhận đĩa món từ Pass và bưng ra bàn phục vụ khách bằng hai tay rảnh tay (Zero-touch tại bàn, không cần thao tác màn hình tại bàn).
      4. **In Hóa đơn tạm tính cấn trừ cọc & Mã VietQR động (Cashier Receipt Printing & VietQR):** Khi khách yêu cầu thanh toán trực tiếp với Waitstaff (giao tiếp trực tiếp truyền thống, Tablet EMenuTablet 100% view-only không có nút yêu cầu tính tiền), Waitstaff mở Web App trên smartphone cá nhân bấm "Xuất phiếu tạm tính" cấn trừ tiền cọc theo `BR-03`. Thao tác này kích hoạt Web API gửi lệnh in mạng (ESC/POS) ra máy in nhiệt khổ 80mm tại Quầy Thu ngân nhả phiếu tạm tính chi tiết kèm mã VietQR động ở chân phiếu. Waitstaff kẹp phiếu vào sổ da sang trọng (Leather Bill Folder) mang ra bàn cho khách kiểm tra minh bạch và thanh toán (quét VietQR trên giấy hoặc thanh toán tiền mặt / thẻ POS với Waitstaff). Khi Waitstaff xác nhận thanh toán trên điện thoại cá nhân, bàn chuyển sang `Cleaning`.
      5. **Tự động Fallback:** Nếu thiết bị cũ hoặc mạng không hỗ trợ WebSockets, SignalR tự động lùi về Server-Sent Events hoặc Long-Polling.

---

## 5. Frontend Stack: React (Vite), Tailwind CSS, TanStack Query, Zustand

**Công nghệ sử dụng:** React 18/19 (TypeScript), Vite, Tailwind CSS, TanStack Query, Zustand.
* **EMenuTablet Component (100% Passive View-Only):** Thiết kế giao diện trình diễn thị giác sang trọng, chuyên biệt cho khách chiêm ngưỡng hình ảnh độ phân giải cao, câu chuyện món ăn, thành phần nguyên liệu và gợi ý rượu vang. Hệ thống thiết lập chế độ thụ động 100% (Strictly Read-Only), tuyệt đối KHÔNG có nút bấm tương tác (không nút 'Gọi phục vụ', không nút 'Yêu cầu tính tiền', không giỏ hàng, không nút tự đặt món) nhằm bảo tồn trọn vẹn văn hóa phục vụ ân cần chuẩn Fine Dining. Mọi tương tác của khách đều do Waitstaff trực tiếp tiếp nhận.

**So sánh với các stack khác:**
* **Angular:** Quá cồng kềnh cho quy mô SPA này, learning curve cao.
* **Create React App (CRA) & Webpack:** Tốc độ khởi động server và HMR (Hot-reload) cực kỳ chậm so với Vite (sử dụng esbuild tốc độ cực cao).
* **Redux:** Cấu hình quá phức tạp, boilerplate code lớn, khiến việc maintain trở nên nặng nề.

**Tại sao chọn stack này:**
* Vite & TypeScript giúp dev cực nhanh và an toàn kiểu dữ liệu.
* TanStack Query tự động quản lý Server State (cache API, tự động gọi lại khi focus, quản lý trạng thái loading).
* Zustand xử lý Client State siêu nhẹ nhàng mà không cồng kềnh như Redux.
