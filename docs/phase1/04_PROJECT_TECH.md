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
        1. **Tái sử dụng:** Backend API hiện tại có thể được dùng cho cả web quản lý, web khách hàng, và ứng dụng iPad của nhân viên (POS/KDS) mà không cần viết lại.
        2. **Bảo vệ Core Logic:** Clean Architecture tách biệt hoàn toàn Logic nghiệp vụ (Domain/Application) khỏi các yếu tố bên ngoài (Database, Framework UI). Trong MVC, Controller thường bị "nhồi nhét" quá nhiều logic (Fat Controller) và phụ thuộc trực tiếp vào Entity Framework.

---

## 2. Design Pattern: CQRS & MediatR, DI Lifetimes (Singleton, Scoped, Transient)

**Pattern 1: Command Query Responsibility Segregation (CQRS) + MediatR**
* **So sánh với CRUD Service:** CRUD truyền thống dùng chung một Model cho việc đọc và ghi dữ liệu. Với KDS (màn hình bếp), dữ liệu hiển thị cần Join từ nhiều bảng (rất nặng). CQRS tách luồng Ghi (Command) yêu cầu transaction khắt khe, và luồng Đọc (Query) cho phép truy vấn nhanh (như dùng Dapper). MediatR giúp API Controller trở nên "siêu mỏng", không chứa logic.

**Pattern 2: Dependency Injection (DI) & Vòng đời Service (Singleton vs Scoped vs Transient)**
Kiến trúc của dự án áp dụng triệt để Dependency Injection (DI) của .NET. Pattern DI quản lý việc khởi tạo các class thông qua 3 vòng đời (lifetimes). Sự khác biệt và lý do sử dụng của chúng như sau:

1. **Singleton (Tồn tại duy nhất 1 bản sao trong toàn ứng dụng):**
    * *Cách hoạt động:* Khởi tạo 1 lần duy nhất khi ứng dụng chạy và dùng chung cho tất cả các request.
    * *Khi nào dùng / Tại sao dùng:* Dùng cho các service có trạng thái cần chia sẻ toàn cục, chi phí khởi tạo lớn, và không liên quan đến database context. Ví dụ: `MemoryCache`, `SignalR HubContext`, `Logger`. Trong Frontend (React), store của `Zustand` cũng là một dạng Singleton để giữ state chung (giỏ hàng, user profile).

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
    * *Tại sao chọn SignalR:* Nó là bộ thư viện bao bọc WebSockets hoàn hảo của .NET. Rất thiết yếu cho các chức năng: **Màn hình Nhà Bếp (KDS)** (Bếp nấu xong bấm nút -> màn hình iPad của bồi bàn lập tức nổ thông báo) và **Sơ đồ bàn (Floor Plan)** (Khách đặt bàn -> Icon bàn lập tức chuyển sang màu đỏ "Đã đặt" trên tất cả thiết bị của nhân viên mà không cần F5). SignalR còn hỗ trợ tự động Fallback (nếu máy cũ không có WebSockets, nó tự lùi về Long-Polling).

---

## 5. Frontend Stack: React (Vite), Tailwind CSS, TanStack Query, Zustand

**Công nghệ sử dụng:** React 18/19 (TypeScript), Vite, Tailwind CSS, TanStack Query, Zustand.

**So sánh với các stack khác:**
* **Angular:** Quá cồng kềnh cho quy mô SPA này, learning curve cao.
* **Create React App (CRA) & Webpack:** Tốc độ khởi động server và HMR (Hot-reload) cực kỳ chậm so với Vite (sử dụng esbuild tốc độ cực cao).
* **Redux:** Cấu hình quá phức tạp, boilerplate code lớn, khiến việc maintain trở nên nặng nề.

**Tại sao chọn stack này:**
* Vite & TypeScript giúp dev cực nhanh và an toàn kiểu dữ liệu.
* TanStack Query tự động quản lý Server State (cache API, tự động gọi lại khi focus, quản lý trạng thái loading).
* Zustand xử lý Client State siêu nhẹ nhàng mà không cồng kềnh như Redux.
