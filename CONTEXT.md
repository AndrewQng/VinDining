# VinDining — Domain Context & Ubiquitous Language

Tài liệu định nghĩa ngôn ngữ chung (Ubiquitous Language) và các thuật ngữ chuẩn của toàn hệ thống Quản lý nhà hàng Fine Dining VinDining.

## Language

**Guest**:
Thực khách đặt bàn hoặc dùng bữa tại nhà hàng.
_Tránh dùng_: Client, User, Account, Khách vãng lai

**Reservation**:
Lịch đặt bàn trước của Thực khách cho một ca phục vụ, phân khu và số lượng khách cụ thể.
_Tránh dùng_: Booking, Appointment, Lịch hẹn

**Deposit**:
Khoản tiền cọc cố định bắt buộc phải thanh toán trước qua cổng thanh toán để xác nhận giữ chỗ bàn ăn.
_Tránh dùng_: Pre-auth, Down-payment, Tiền ứng

**Table**:
Vị trí bàn ăn vật lý trong nhà hàng với sức chứa, phân khu và trạng thái thời gian thực (`Available`, `Reserved`, `Occupied`, `Cleaning`).
_Tránh dùng_: Seat, Spot, Chỗ ngồi

**MenuItem**:
Món ăn hoặc thức uống trong thực đơn A La Carte, kèm đơn giá, danh mục món và cảnh báo dị ứng.
_Tránh dùng_: Combo, Set meal, Đĩa

**Order**:
Đơn gọi món đang hoạt động gắn liền với một Bàn ăn đang phục vụ (`Occupied`).
_Tránh dùng_: Cart, Purchase, Giỏ hàng

**KitchenKDS**:
Màn hình điều phối chế biến tại bếp gắn tường, hoạt động rảnh tay (Hands-free) nhận vé qua SignalR.
_Tránh dùng_: Kitchen Printer, Máy in bếp, Màn hình chạm bếp

**CashierPrinter**:
Máy in nhiệt khổ 80mm đặt tại quầy Thu ngân dùng để in phiếu thanh toán tạm tính kèm mã VietQR kẹp vào sổ da.
_Tránh dùng_: Máy in hóa đơn tại bàn, POS printer tại bàn

**EMenu**:
Giao diện Web hiển thị trực quan thực đơn món ăn, nguồn gốc nguyên liệu, bộ sưu tập vang và cảnh báo dị ứng thực phẩm (chế độ chỉ xem, không đặt món trực tiếp). Thực khách tiếp cận linh hoạt bằng cách quét mã QR tại bàn trên Smartphone cá nhân (BYOD) hoặc mượn Máy tính bảng dùng chung (Floating Pool Tablet) từ nhân viên phục vụ.
_Tránh dùng_: Digital Display cố định tại bàn, Màn hình ghép nối tại bàn, Tablet gắn chết tại bàn

## Flagged Ambiguities

- **Màn hình Digital Display ghép nối tại bàn**: Đã loại bỏ hoàn toàn theo ADR 0004. Bàn ăn không gắn cố định bất kỳ thiết bị điện tử, dây cáp hay giá đỡ nào. Trải nghiệm xem thực đơn điện tử (E-Menu) được thực hiện qua hình thức Hybrid: Thực khách quét mã QR trên bàn bằng Smartphone cá nhân (BYOD) hoặc mượn Tablet từ kho dùng chung (Floating Pool) tại quầy phục vụ.
- **Máy in Bếp**: Đã loại bỏ hoàn toàn theo ADR 0003 & ADR 0004; thay thế bằng Màn hình KDS Bếp qua SignalR. Máy in nhiệt 80mm duy nhất đặt tại quầy Thu ngân.
