# Đặc tả UC-A1: Quản trị thực đơn

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-A1 |
| **Tên Use Case** | Quản trị thực đơn *(Menu Management)* |
| **Tác nhân** | Quản lý Nhà hàng |
| **Mục tiêu** | Thiết lập, cập nhật danh mục món lẻ và Set Menu, định mức thời gian chế biến (Prep SLA) và trạng thái phục vụ. |
| **Điều kiện tiên quyết** | Quản lý đã đăng nhập vào hệ thống với quyền hạn quản trị. |
| **Điều kiện kết thúc** | Dữ liệu thực đơn được lưu vào cơ sở dữ liệu và đồng bộ tức thời tới E-Menu, POS, KDS Bếp. |

## Luồng sự kiện chính

1. Quản lý mở màn hình quản trị thực đơn trên giao diện Web.
2. Quản lý chọn thao tác thêm mới hoặc chỉnh sửa món lẻ: nhập tên món, đơn giá, nhóm Course, định mức Prep SLA và bấm lưu.
3. Quản lý chọn thao tác thiết lập hoặc cập nhật Set Menu: nhập tên set, đơn giá trọn gói, chọn danh sách món con theo thứ tự Course và bấm lưu.
4. Quản lý gạt công tắc để chuyển nhanh trạng thái phục vụ (Còn món hoặc Tạm hết hàng) khi ca bếp thay đổi nguyên liệu.
5. Quản lý chọn xóa món khỏi thực đơn; hệ thống kiểm tra món không nằm trong Order đang phục vụ và thực hiện xóa mềm (Soft Delete).
6. Hệ thống kiểm tra tính hợp lệ của dữ liệu, lưu vào cơ sở dữ liệu và gửi thông báo cập nhật qua SignalR.

## Luồng ngoại lệ

* 5a. Khi món ăn đang nằm trong Order chưa hoàn tất, hệ thống từ chối xóa và hiển thị thông báo món đang được phục vụ.
* 6a. Khi thông tin nhập vào không hợp lệ hoặc trùng lặp, hệ thống thông báo lỗi chi tiết để Quản lý điều chỉnh.

## Danh sách Sơ đồ tuần tự

### 1. Thêm mới món ăn
```plantuml
!include ../puml/sequences/SD_UC_A1_1_Create_MenuItem.puml
```

### 2. Chỉnh sửa thông tin món ăn
```plantuml
!include ../puml/sequences/SD_UC_A1_2_Update_MenuItem.puml
```

### 3. Bật / Tắt trạng thái phục vụ
```plantuml
!include ../puml/sequences/SD_UC_A1_3_Toggle_Availability.puml
```

### 4. Xóa món ăn
```plantuml
!include ../puml/sequences/SD_UC_A1_4_Delete_MenuItem.puml
```

### 5. Thiết lập Set Menu
```plantuml
!include ../puml/sequences/SD_UC_A1_5_Create_SetMenu.puml
```

### 6. Cập nhật cấu trúc Set Menu
```plantuml
!include ../puml/sequences/SD_UC_A1_6_Update_SetMenu.puml
```

### 7. Xóa Set Menu
```plantuml
!include ../puml/sequences/SD_UC_A1_7_Delete_SetMenu.puml
```

