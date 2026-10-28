# DANH MỤC CÁC USE CASE HỆ THỐNG VINDINING
**Đề tài:** Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (VinDining)  
**Phân loại:** Mỗi tệp tài liệu đại diện cho một Use Case độc lập, bao gồm bảng thuộc tính, luồng nghiệp vụ chi tiết và sơ đồ tuần tự PlantUML tương ứng.

---

## 1. Phân hệ Khách hàng (Guest Subsystem)
* [UC-U1: Đặt bàn trực tuyến & Đặt cọc giữ chỗ](UC-U1_Dat_Ban_Va_Dat_Coc.md)
* [UC-U2: Yêu cầu phục vụ thông qua QR menu](UC-U2_Xem_EMenu_Tai_Ban.md)
* [UC-U3: Hủy đặt bàn trực tuyến & Hoàn cọc tự động](UC-U3_Huy_Dat_Ban_Va_Hoan_Coc.md)
* [UC-U4: Gửi đánh giá và phản hồi chất lượng dịch vụ](UC-U4_Danh_Gia_Va_Phan_Hoi.md)
* [UC-U5: Khách gọi trợ giúp qua QR tại bàn](UC-U5_Goi_Tro_Giup_Qua_QR.md)

---

## 2. Phân hệ Nhân viên Nội bộ (Staff Subsystem)
* [UC-E1: Quản lý Order & Điều phối lượt món (Course Firing & Priority)](UC-E1_Quan_Ly_Order_Va_Dieu_Phoi_Course_Firing.md)
* [UC-E2: Kiểm đồ tại quầy Pass, Phục vụ món & Pacing Course](UC-E2_Kiem_Do_Pass_Va_Ra_Mon.md)
* [UC-E3: Yêu cầu thanh toán](UC-E3_Yeu_Cau_Thanh_Toan.md)
* [UC-E4: Đổi bàn / Chuyển bàn phục vụ](UC-E4_Doi_Ban_Chuyen_Ban.md)
* [UC-E5: Đăng nhập & Xác thực hệ thống nội bộ](UC-E5_Dang_Nhap_Va_Xac_Thuc.md)
* [UC-E6: Check-in nhận bàn & Hoàn tất dọn bàn](UC-E6_CheckIn_Nhan_Ban_Va_Don_Ban.md)
* [UC-E8: Thanh toán hóa đơn & Cấn trừ cọc](UC-E8_Thanh_Toan_Hoa_Don.md)

---

## 3. Phân hệ Quản lý & Quản trị (Manager & Admin Subsystem)
* [UC-A1: Quản trị thực đơn](UC-A1_Quan_Tri_Thuc_Don_Va_SLA.md)
* [UC-A2: Quản trị & Cấu hình Sơ đồ bàn ăn](UC-A2_Quan_Tri_So_Do_Ban.md)
* [UC-A3: Duyệt hoàn tiền cọc thủ công ngoại lệ](UC-A3_Duyet_Hoan_Coc_Ngoai_Le.md)
* [UC-A4: Quản trị Tài khoản & Phân quyền nhân viên](UC-A4_Quan_Tri_Tai_Khoan_Nhan_Vien.md)
* [UC-A5: Xem Báo cáo Thống kê & Dashboard doanh thu](UC-A5_Bao_Cao_Thong_Ke_Dashboard.md)

---

## 4. Phân hệ Hệ thống Tự động (Background Worker)
* [UC-S1: Giải phóng bàn hết hạn cọc](UC-S1_Giai_Phong_Ban_Het_Han_Coc.md)
* [UC-S2: Gửi biểu mẫu đánh giá chất lượng sau phục vụ](UC-S2_Gui_Bieu_Mau_Danh_Gia_Chat_Luong.md)
* [UC-S3: Gửi thông báo nhắc hẹn đặt bàn](UC-S3_Gui_Thong_Bao_Nhac_Hen_Dat_Ban.md)
* [UC-S4: Theo dõi & cảnh báo thời gian order](UC-S4_Theo_Doi_Canh_Bao_Thoi_Gian_Order.md)
