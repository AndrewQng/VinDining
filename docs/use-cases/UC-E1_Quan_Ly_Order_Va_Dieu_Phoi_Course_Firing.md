# Đặc tả UC-E1: Quản lý Order & Điều phối lượt món (Course Firing & Priority)

| Thuộc tính | Chi tiết đặc tả |
| :--- | :--- |
| **Mã Use Case** | UC-E1 |
| **Tên Use Case** | Quản lý Order & Điều phối lượt món (Course Firing & Priority) *(Waitstaff Order Management & Course Firing Orchestration)* |
| **Tác nhân tham gia** | Nhân viên Phục vụ *(Chính)*, Nhà bếp *(Phụ)* |
| **Mức độ ưu tiên** | Trọng yếu *(Must Have)* |
| **Mối quan hệ** | Bao gồm Use Case cơ sở Đăng nhập UC-E5; Lưu trữ và truy xuất trạng thái qua CSDL SQL Server |
| **Mục tiêu chức năng** | Cho phép nhân viên phục vụ ghi nhận gọi món theo cấu trúc Fine Dining (phân chia Course 1 Khai vị, Course 2 Món chính, Course 3 Tráng miệng), gắn nhãn ưu tiên (VIP, Rush, Dị ứng), kích hoạt nấu đợt đầu và chủ động bấm Course Firing để kích hoạt nấu các lượt món tiếp theo nhịp nhàng theo tốc độ dùng bữa của khách. |
| **Điều kiện tiên quyết** | Bàn ăn đã được check-in ở trạng thái Đang phục vụ *(Occupied)*. Nếu bàn đã có Pre-order Set Menu lúc đặt bàn thì Order và Course 1 đã được tự động tạo lúc Check-in (UC-E6), nhân viên chỉ thực hiện điều phối Fire Course (SD_UC_E1_2) cho các lượt món tiếp theo hoặc thêm món phát sinh. |
| **Điều kiện kết thúc** | Đơn hàng mới được lưu vào CSDL SQL Server ở trạng thái Đang chế biến *(Processing)*; Course 1 chuyển sang Đang nấu *(Cooking)* trong CSDL để nhà bếp theo dõi; các Course tiếp theo giữ ở trạng thái Chờ điều phối *(On Hold)* cho đến khi nhân viên bấm Course Firing. |

## Luồng sự kiện chính (Main Flow)
1. Khách hàng gọi món trực tiếp tại bàn (áp dụng khi khách không đặt trước món; nếu khách đã đặt trước Set Menu thì Order và Course 1 đã được kích hoạt tự động lúc Check-in).
2. Nhân viên phục vụ mở ứng dụng Web POS, chọn bàn tương ứng và thêm các món lẻ hoặc Set Menu vào đơn theo từng đợt món (Course 1: Khai vị, Course 2: Món chính, Course 3: Tráng miệng).
3. Nhân viên thiết lập nhãn ưu tiên nếu có (Priority: VIP, Rush, Allergy Alert) cùng ghi chú chế biến chi tiết (mức độ chín Steak, thành phần kiêng).
4. Nhân viên rà soát toàn bộ thực đơn và nhấn nút Gửi Bếp *(Send to Kitchen)*.
5. Hệ thống lưu đơn hàng ở trạng thái Đang chế biến *(Processing)*, tự động kích hoạt Course 1 sang trạng thái Đang nấu *(Cooking)* trong CSDL SQL Server và đặt các Course tiếp theo ở trạng thái Chờ điều phối *(On Hold)*.
6. Nhà bếp truy vấn và cập nhật danh sách món cần nấu từ CSDL theo trạng thái Cooking và nhãn ưu tiên.
7. Trong quá trình dùng bữa, khi quan sát thấy khách dùng được 60%–70% Course hiện tại, nhân viên phục vụ bấm nút Course Firing trên POS di động (kèm nút gạt Rush Priority nếu khách cần gấp) để hệ thống cập nhật Course kế tiếp từ Chờ *(On Hold)* sang Đang nấu *(Cooking)* trong CSDL.

## Luồng ngoại lệ (Alternative / Exception Flows)
* 4a. Khi khách gọi thêm món hoặc rượu vang bổ sung giữa bữa ăn, nhân viên mở đơn hiện hành trên POS, chọn món, gán vào Course tương ứng và bấm Cập nhật Order; hệ thống ghi nhận thêm món mới vào CSDL để bếp chuẩn bị.
* 7a. Khi khách yêu cầu tạm hoãn lên món chính (Hold Course), nhân viên giữ nguyên trạng thái On Hold trên POS cho đến khi khách sẵn sàng.

## Danh sách Sơ đồ tuần tự (Sequence Diagrams)

### 1. Tạo Order & Khởi chạy Course đầu tiên
```plantuml
!include ../puml/sequences/SD_UC_E1_1_Create_Order.puml
```

### 2. Kích hoạt lượt món tiếp theo (Fire Course)
```plantuml
!include ../puml/sequences/SD_UC_E1_2_Fire_Next_Course.puml
```

### 3. Khách gọi thêm món
```plantuml
!include ../puml/sequences/SD_UC_E1_3_Add_Order_Items.puml
```

