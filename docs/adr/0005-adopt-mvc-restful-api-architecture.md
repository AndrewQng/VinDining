# ADR 0005: Chuyển đổi sang Mô hình MVC kết hợp RESTful API giữa ASP.NET Core và React SPA

## Status
Accepted (Kế thừa và tối ưu hóa từ ADR 0001)

## Context
Trong giai đoạn đầu của dự án, thiết kế kỹ thuật hướng tới mô hình Clean Architecture đa tầng kết hợp CQRS (MediatR). Tuy nhiên, sau khi đánh giá thực tế tiến độ và nguồn lực phát triển của nhóm 3 thành viên với hạn chót hoàn thành ngày **25/12/2026** (7.5 tuần):
1. **Độ phức tạp và phân mảnh (Over-engineering)**: Việc tách quá nhiều tầng dự án và áp dụng mẫu CQRS với MediatR cho mọi tác vụ nghiệp vụ nhà hàng tạo ra sự cồng kềnh, phân tán logic xử lý (mỗi thao tác CRUD nhỏ cần tạo Command, Query, Handler, Validator, DTO riêng biệt), làm chậm đáng kể tốc độ phát triển và khó debug.
2. **Nhu cầu đồng bộ nhanh với Frontend React**: Giao diện người dùng React (SPA) cần các điểm cuối RESTful API trực quan, phản hồi nhanh và dễ dự đoán để tiêu thụ thông qua Axios và Zustand.
3. **Phù hợp chuẩn mực thực tế**: Mô hình **MVC kết hợp RESTful API** (Controllers tiếp nhận và điều hướng request $\rightarrow$ Services xử lý nghiệp vụ $\rightarrow$ Models/Entities tương tác CSDL EF Core 9) là kiến trúc chuẩn mực công nghiệp, đảm bảo tính phân tách trách nhiệm (Separation of Concerns), dễ bảo trì và tối ưu hiệu suất cho nhóm làm đồ án.

## Decision
Chuyển đổi toàn diện mô hình kiến trúc Backend và giao tiếp Frontend sang **Mô hình MVC kết hợp RESTful API**:

1. **Phân bổ trách nhiệm theo mô hình MVC phân tán (Distributed MVC)**:
   * **View (Frontend React SPA)**:
     - Xây dựng bằng React + TypeScript + Vite + Tailwind CSS.
     - Quản lý trạng thái client bằng Zustand và TanStack Query.
     - Đóng vai trò Presentation View hoàn chỉnh, gửi/nhận dữ liệu với Backend qua các HTTP methods chuẩn (`GET`, `POST`, `PUT`, `DELETE`) và nhận thông báo thời gian thực qua SignalR Client.
   * **Controller (ASP.NET Core Web API Controllers)**:
     - Tiếp nhận HTTP requests, kiểm tra tính hợp lệ của DTOs / ViewModels.
     - Điều phối luồng và gọi các Service nghiệp vụ tương ứng.
     - Trả về JSON response chuẩn mực theo các mã trạng thái HTTP (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Error).
   * **Service (Tầng Xử lý Nghiệp vụ - Business Logic Layer)**:
     - Đảm nhận toàn bộ nghiệp vụ domain: logic đặt bàn, giải thuật cấn trừ tiền cọc, tính toán hóa đơn (5% Service Charge, 10% VAT), điều chuyển bàn và xử lý giao dịch CSDL.
     - Tách biệt rõ ràng thành các interface chuyên biệt (`IReservationService`, `IOrderService`, `IBillingService`, `ITableService`).
   * **Model (Tầng Dữ liệu & Hợp đồng)**:
     - **Domain Entities**: Các thực thể cơ sở dữ liệu ánh xạ qua Entity Framework Core 9 (SQL Server).
     - **DTOs / ViewModels**: Định hình cấu trúc dữ liệu truyền tải giữa Client và Server, ngăn chặn rò rỉ cấu trúc CSDL nội bộ.
2. **Kênh Thời gian thực SignalR Hubs**:
   - Duy trì các Hubs độc lập (`FloorPlanHub`, `KitchenHub`, `ServingHub`) để đồng bộ trạng thái bàn, vé bếp KDS và thông báo quầy Pass tức thời mà không phá vỡ cấu trúc RESTful.

## Consequences

### Tích cực
* **Tăng tốc độ phát triển**: Loại bỏ boilerplate code của MediatR CQRS, giúp 3 thành viên tập trung code trực tiếp vào Service và Controller.
* **Dễ bảo trì và kiểm thử**: Ranh giới giữa Controller (HTTP/Routing) và Service (Business logic) rất rõ ràng, dễ viết Unit Test cho Service bằng xUnit và Moq.
* **Tương thích hoàn hảo với React**: Các RESTful API endpoints có cấu trúc rõ ràng, chuẩn REST giúp Frontend dễ dàng sinh kiểu TypeScript và viết API Client.

### Tiêu cực
* **Cần chú trọng kỷ luật phân tầng**: Phải tuân thủ nghiêm ngặt việc không viết trực tiếp logic nghiệp vụ trong Controller mà phải đẩy toàn bộ vào Service.
