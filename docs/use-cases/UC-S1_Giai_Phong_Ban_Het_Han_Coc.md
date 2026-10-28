# ĐẶC TẢ USE CASE: GIẢI PHÓNG BÀN HẾT HẠN CỌC

## 1. Thông tin chung
* **Mã Use Case:** UC-S1
* **Tên Use Case:** Giải phóng bàn hết hạn cọc
* **Tác nhân:** Background Worker
* **Mức độ ưu tiên:** Bắt buộc (Must Have)
* **Điều kiện tiên quyết:** Bàn ăn ở trạng thái Khóa tạm thời (Locked) trong quá trình thanh toán cọc.
* **Điều kiện kết thúc:** Bàn hết hạn thanh toán được giải phóng về trạng thái Trống (Available); đơn cọc bị hủy.

---

## 2. Luồng sự kiện chính
1. Background Worker kích hoạt tiến trình quét định kỳ mỗi 60 giây.
2. Hệ thống kiểm tra các đơn đặt bàn ở trạng thái Chờ thanh toán đã vượt quá thời hạn giữ chỗ (17 phút).
3. Hệ thống cập nhật trạng thái đơn sang Hết hạn hủy (Expired_Cancelled).
4. Hệ thống mở khóa bàn ăn, chuyển trạng thái bàn từ Locked về Available.
5. Hệ thống hoàn tất lượt quét và ghi nhận lịch sử xử lý.

---

## 3. Luồng ngoại lệ
* **2a. Không có đơn quá hạn:** Hệ thống kết thúc lượt quét bình thường mà không cần cập nhật dữ liệu.

---

## 4. Sơ đồ tuần tự (Sequence Diagram)
```plantuml
!include ../puml/sequences/SD_UC_S1_Giai_Phong_Ban_Het_Han_Coc.puml
```

