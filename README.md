# VinDining - Fine Dining Restaurant Management & Reservation System

VinDining là hệ thống quản lý và đặt bàn nhà hàng Fine Dining cao cấp, được xây dựng theo chuẩn **Clean Architecture** trên nền tảng **.NET 9** (Backend) kết hợp với **React + TypeScript + Tailwind CSS** (Frontend). Dự án phục vụ cho môn **Chuyên đề Tổng Hợp (CDTH)** với độ phức tạp cao, tích hợp quản lý phân quyền, thanh toán cọc, sơ đồ bàn trực quan theo thời gian thực (Real-time Floor Plan) và quy trình gọi món/phục vụ Course Firing.

---

## 🏛️ Kiến trúc Hệ thống (System Architecture)

Dự án áp dụng mô hình **Clean Architecture** (phân tách 4 tầng độc lập) kết hợp **CQRS Pattern** nhằm đảm bảo tính phân tách trách nhiệm (Separation of Concerns), dễ bảo trì và mở rộng:

- `VinDining.Domain`: Core Entities, Enums, Value Objects, Domain Exceptions. Độc lập hoàn toàn với framework và CSDL bên ngoài.
- `VinDining.Application`: Xử lý Logic nghiệp vụ với MediatR (Commands/Queries), FluentValidation, Pipeline Behaviors (Validation, Logging, Transaction).
- `VinDining.Infrastructure`: Triển khai CSDL (EF Core 9, SQL Server), ASP.NET Core Identity, JWT Service, SignalR Hubs, Cổng thanh toán VNPAY.
- `VinDining.API`: RESTful Controllers, SignalR Endpoints, Global Exception Handling Middleware, Swagger/OpenAPI.

---

## 🚀 Công nghệ sử dụng (Technology Stack)

### Backend (.NET 9)
- **Framework**: ASP.NET Core Web API (.NET 9)
- **Architecture**: Clean Architecture + CQRS Pattern (MediatR)
- **Database & ORM**: Microsoft SQL Server + Entity Framework Core 9 (Code-First Migrations)
- **Authentication & Authorization**: ASP.NET Core Identity + JWT Bearer + Refresh Token + Role/Policy-based Access Control
- **Validation**: FluentValidation
- **Real-time**: ASP.NET Core SignalR (Sơ đồ bàn, thông báo trạng thái bếp/phục vụ)
- **Documentation**: Swagger / OpenAPI with JWT Authorization Support
- **Object Mapping**: Mapster / AutoMapper

### Frontend (React + TypeScript)
- **Core**: React 18/19, TypeScript, Vite
- **Styling**: Tailwind CSS (Thiết kế phong cách Dark Gold Luxury Fine Dining), Lucide Icons
- **State Management**:
  - **TanStack Query (React Query)**: Quản lý server state, caching, background refetching.
  - **Zustand**: Quản lý client global state (Auth, giỏ hàng, bộ lọc, trạng thái bàn).
- **Routing**: React Router v6+
- **HTTP Client**: Axios (với Request/Response Interceptors tự động refresh JWT token).
- **Real-time Client**: `@microsoft/signalr`

---

## 📂 Cấu trúc Thư mục (Directory Structure)

```
VinDining/
├── backend/
│   ├── VinDining.sln
│   └── src/
│       ├── VinDining.Domain/
│       ├── VinDining.Application/
│       ├── VinDining.Infrastructure/
│       └── VinDining.API/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docs/
│   ├── adr/
│   └── agents/
├── CONTEXT.md
└── README.md
```

---

## 📋 Phân hệ Nghiệp vụ Cốt lõi (Core Business Modules)

1. **Xác thực & Phân quyền nhân sự nội bộ (Staff RBAC)**:
   - Phân quyền 4 vai trò nhân sự: Phục vụ bàn (Waitstaff), Điều phối viên (Expediter), Quản lý (Manager), Quản trị viên (Admin) bằng JWT Bearer Token.
   - Khách hàng sử dụng dịch vụ trực tiếp, không cần đăng ký tài khoản (Zero Onboarding).
2. **Quản lý Đặt bàn & Cọc trực tuyến (Reservation & Deposit)**:
   - Khách đặt bàn trực tuyến, chọn khu vực (MainHall, VIP, Balcony), tiệc và ca dùng bữa.
   - Tích hợp thanh toán cọc giữ chỗ qua VNPAY, quét tự động hủy đơn quá 15 phút không thanh toán và giải phóng bàn (BR-01).
3. **Sơ đồ bàn Real-time & Gọi món tại bàn (Floor Plan & Ordering)**:
   - Sơ đồ bàn trực quan cập nhật trạng thái Real-time qua SignalR: Available, LockedForPayment, Reserved, Occupied, Cleaning.
   - Phục vụ (Waitstaff) tạo đơn gọi món trên tablet, tự động bắn lệnh in nhiệt ESC/POS xuống các trạm bếp.
   - Điều phối viên (Expediter) kiểm tra tiêu chuẩn và cảnh báo dị ứng tại quầy Pass trước khi bấm xác nhận "Đã phục vụ" (Served - BR-04).
4. **Hóa đơn, Cấn trừ cọc & Thống kê (Billing & Settlement)**:
   - Tự động áp dụng phí dịch vụ (5%), VAT (10%) và cấn trừ chính xác khoản tiền cọc đã trả (BR-03).
   - Quản lý (Manager) xử lý các trường hợp ngoại lệ hoàn cọc/tịch thu cọc có lưu vết phê duyệt (BR-05).
   - Dashboard báo cáo doanh thu, tần suất lấp đầy bàn và hiệu suất phục vụ.
