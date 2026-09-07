# API Endpoints (VinDining)

| Endpoint | Method | Tên API (Chức năng) | Quyền hạn (Auth/Role) |
| :--- | :--- | :--- | :--- |
| `/api/Tables` | **GET** | Truy xuất sơ đồ bàn (kèm trạng thái thực) | Waitstaff, Host, Manager |
| `/api/Tables/{id}` | **GET** | Lấy thông tin chi tiết của 1 bàn | Waitstaff, Host, Manager |
| `/api/Reservations` | **POST** | Tạo đơn đặt bàn mới | Guest, Host |
| `/api/Reservations/{id}` | **GET** | Lấy thông tin chi tiết đặt bàn | Host, Manager |
| `/api/Reservations/{id}/cancel` | **PATCH** | Hủy đặt bàn (Kiểm tra hoàn cọc) | Host, Manager |
| `/api/Orders` | **POST** | Tạo Order mới tại bàn (Check-in) | Waitstaff |
| `/api/Orders/{id}/items` | **POST** | Thêm món vào Order (Kích hoạt in Bếp) | Waitstaff |
| `/api/Orders/{id}/items/{itemId}/serve` | **PATCH** | Đánh dấu món đã ra quầy (Expediter check) | Expediter |
| `/api/Invoices` | **POST** | Xuất hóa đơn (Cấn trừ tiền cọc) | Waitstaff, Manager |
