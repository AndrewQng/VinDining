# ĐẶC TẢ USE CASE: GỬI THÔNG BÁO NHẮC HẸN ĐẶT BÀN

## 1. Thông tin chung
* **Mã Use Case:** UC-S3
* **Tên Use Case:** Gửi thông báo nhắc hẹn đặt bàn
* **Tác nhân:** Background Worker
* **Mức độ ưu tiên:** Quan trọng (Should Have)
* **Điều kiện tiên quyết:** Đơn đặt bàn đã xác nhận đặt cọc (Reserved) và sắp đến giờ dùng bữa.
* **Điều kiện kết thúc:** Thông báo nhắc lịch được gửi tới khách hàng; ghi nhận trạng thái đã nhắc.

---

## 2. Luồng sự kiện chính
1. Background Worker kích hoạt tiến trình quét định kỳ mỗi 15 phút.
2. Hệ thống kiểm tra các đơn đặt bàn có giờ hẹn trong khoảng 2 tiếng sắp tới và chưa được gửi thông báo nhắc.
3. Hệ thống tạo nội dung tin nhắn nhắc hẹn kèm thông tin bàn, thời gian và địa chỉ nhà hàng.
4. Hệ thống gửi tin nhắn/email nhắc hẹn đến khách hàng.
5. Hệ thống đánh dấu đơn đặt bàn đã được gửi thông báo nhắc.

---

## 3. Luồng ngoại lệ
* **2a. Không có đơn đặt bàn nào sắp đến giờ hẹn:** Hệ thống kết thúc lượt quét bình thường.

---

## 4. Sơ đồ tuần tự (Sequence Diagram)
```plantuml
!include ../puml/sequences/SD_UC_S3_Gui_Thong_Bao_Nhac_Hen_Dat_Ban.puml
```

