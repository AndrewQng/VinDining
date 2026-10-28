# ĐẶC TẢ USE CASE: GỬI BIỂU MẪU ĐÁNH GIÁ CHẤT LƯỢNG SAU PHỤC VỤ

## 1. Thông tin chung
* **Mã Use Case:** UC-S2
* **Tên Use Case:** Gửi biểu mẫu đánh giá chất lượng sau phục vụ
* **Tác nhân:** Background Worker
* **Mức độ ưu tiên:** Bổ sung (Could Have)
* **Điều kiện tiên quyết:** Bàn ăn đã hoàn tất thanh toán hóa đơn (Paid).
* **Điều kiện kết thúc:** Lời mời khảo sát chất lượng dịch vụ được gửi đến thông tin liên hệ của khách hàng.

---

## 2. Luồng sự kiện chính
1. Background Worker kích hoạt tiến trình quét định kỳ mỗi 5 phút.
2. Hệ thống kiểm tra các hóa đơn đã thanh toán thành công nhưng chưa được gửi link đánh giá.
3. Hệ thống tạo mã khảo sát bảo mật gắn liền với đơn dùng bữa.
4. Hệ thống gửi tin nhắn/email chứa liên kết đánh giá đến khách hàng.
5. Hệ thống đánh dấu hóa đơn đã gửi khảo sát để tránh gửi lặp lại.

---

## 3. Luồng ngoại lệ
* **2a. Đơn không có thông tin email hoặc số điện thoại khách:** Hệ thống bỏ qua và đánh dấu không đủ điều kiện gửi khảo sát.

---

## 4. Sơ đồ tuần tự (Sequence Diagram)
```plantuml
!include ../puml/sequences/SD_UC_S2_Gui_Bieu_Mau_Danh_Gia_Chat_Luong.puml
```

