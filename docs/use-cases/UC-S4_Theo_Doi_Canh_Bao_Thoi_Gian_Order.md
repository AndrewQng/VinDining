# ĐẶC TẢ USE CASE: THEO DÕI & CẢNH BÁO THỜI GIAN ORDER

## 1. Thông tin chung
* **Mã Use Case:** UC-S4
* **Tên Use Case:** Theo dõi & cảnh báo thời gian order
* **Tác nhân:** Background Worker
* **Mức độ ưu tiên:** Quan trọng (Should Have)
* **Điều kiện tiên quyết:** Bếp đang chế biến các món ăn thuộc đơn hàng đang phục vụ (Cooking).
* **Điều kiện kết thúc:** Trạng thái trễ hạn SLA của các món ăn được phát hiện và cảnh báo kịp thời lên màn hình Bếp và Trạm Pass.

---

## 2. Luồng sự kiện chính
1. Background Worker kích hoạt tiến trình kiểm soát SLA định kỳ mỗi 15 giây.
2. Hệ thống truy vấn danh sách các món ăn đang trong trạng thái Chế biến (Cooking).
3. Hệ thống tính toán thời gian chế biến thực tế so với định mức thời gian Prep SLA của từng món.
4. Khi thời gian chế biến vượt ngưỡng 80% hoặc quá hạn định mức, hệ thống phát tín hiệu đổi màu cảnh báo (vàng/đỏ) lên màn hình KDS Bếp và màn hình trạm Pass.
5. Hệ thống hoàn tất chu kỳ kiểm soát.

---

## 3. Luồng ngoại lệ
* **2a. Không có món nào đang nấu:** Hệ thống kết thúc chu kỳ quét bình thường.

---

## 4. Sơ đồ tuần tự (Sequence Diagram)
```plantuml
!include ../puml/sequences/SD_UC_S4_Theo_Doi_Canh_Bao_Thoi_Gian_Order.puml
```

