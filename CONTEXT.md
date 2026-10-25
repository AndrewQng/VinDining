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
Món ăn hoặc thức uống riêng lẻ kèm đơn giá và cảnh báo dị ứng, có thể gọi lẻ trong thực đơn A La Carte hoặc đóng vai trò là món thành phần trong TastingMenu.
_Tránh dùng_: Đĩa, Món con

**TastingMenu**:
Gói thực đơn trải nghiệm trọn gói gồm danh sách nhiều Course cố định do Bếp trưởng thiết kế với giá trọn gói.
_Tránh dùng_: Combo, Set meal, Suất ăn

**Course**:
Phân đoạn món ăn trong trình tự phục vụ bữa ăn Fine Dining (như Khai vị, Món chính, Tráng miệng).
_Tránh dùng_: Phần ăn, Mâm, Đợt món

**CourseFiring**:
Lệnh kích hoạt chế biến phân đoạn món kế tiếp do Nhân viên phục vụ phát đi từ thiết bị cầm tay dựa trên quan sát nhịp dùng bữa thực tế của Thực khách.
_Tránh dùng_: Hối bếp, Báo nấu, Next dish

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
Giao diện Web hiển thị trực quan thực đơn món ăn, nguồn gốc nguyên liệu, bộ sưu tập vang, cảnh báo dị ứng thực phẩm, và cho phép Thực khách gửi yêu cầu phục vụ (gọi nước, đổi dụng cụ, yêu cầu thanh toán) qua Smartphone cá nhân (BYOD) sau khi quét mã QR tại bàn, hoặc mượn Tablet dùng chung từ nhân viên phục vụ để thưởng lãm. EMenu hoàn toàn ở chế độ chỉ xem (View-Only), không hỗ trợ Guest tự gửi Order trực tiếp vào Bếp.
_Tránh dùng_: Digital Display cố định tại bàn, Màn hình ghép nối tại bàn, Tablet gắn chết tại bàn

**NoShow**:
Trạng thái Reservation bị hủy khi Guest không có mặt sau 15 phút ân hạn tính từ giờ hẹn, do Quản lý hoặc Nhân viên phục vụ chủ động xác nhận hủy thủ công trên hệ thống, dẫn đến việc nhà hàng tịch thu toàn bộ khoản Deposit và giải phóng Table về `Available` (hệ thống không tự động quét hủy để bảo toàn tính linh hoạt cho khách liên hệ báo trễ).
_Tránh dùng_: Bùng bàn, Hủy muộn, Quá giờ

**Cancellation**:
Yêu cầu hủy Reservation do Guest khởi tạo trước giờ hẹn; tự động hoàn 100% Deposit nếu hủy trước tối thiểu 04 tiếng, hoặc giữ lại toàn bộ Deposit nếu hủy dưới 04 tiếng (trừ ngoại lệ do Manager phê duyệt).
_Tránh dùng_: Xóa lịch, Rút cọc

**Waitstaff**:
Nhân viên phục vụ trực tiếp tại bàn, tư vấn thực đơn, độc quyền ghi nhận Order trên Mobile POS, kích hoạt CourseFiring và nhận thông báo rung thời gian thực từ quầy Pass.
_Tránh dùng_: Bồi bàn, Chạy bàn, Server, Waiter

**Expediter**:
Nhân viên điều phối và kiểm soát chất lượng tại quầy Pass, có thẩm quyền duy nhất xác nhận đĩa món hoàn thiện để phát thông báo ra món đến Waitstaff phụ trách bàn.
_Tránh dùng_: Checkfood, Tiếp thực, Điều phối viên

**Remake**:
Lệnh yêu cầu chế biến lại món ăn do Expediter kích hoạt tại quầy Pass khi đĩa món không đạt tiêu chuẩn chất lượng hoặc vi phạm ghi chú dị ứng thực phẩm.
_Tránh dùng_: Nấu lại, Sửa món, Trả đĩa

## Relationships

- Một **Reservation** thuộc về một **Guest** và giữ chỗ cho một **Table**.
- Một **Reservation** chỉ được xác nhận sau khi **Deposit** được thanh toán thành công.
- Một **Reservation** chuyển sang trạng thái **NoShow** sẽ giải phóng **Table** về `Available` và tịch thu toàn bộ **Deposit**.
- Một **Reservation** tiếp nhận **Cancellation** trước 04 tiếng sẽ tự động hoàn 100% **Deposit** và giải phóng **Table** về `Available`.
- Một **Reservation** tiếp nhận **Cancellation** dưới 04 tiếng sẽ giữ lại 100% **Deposit** làm phí bù hoàn chuẩn bị (trừ khi Manager duyệt hoàn cọc ngoại lệ).
- Một **Table** khi chuyển sang trạng thái `Occupied` được tự động gán cho **Waitstaff** thực hiện thao tác check-in hoặc tạo **Order** đầu tiên; nhân viên này là đầu mối nhận thông báo rung thời gian thực từ quầy Pass khi **Expediter** xác nhận ra món.
- Một **Table** ở trạng thái `Occupied` gắn liền với đúng một **Order** đang hoạt động.
- Một **Order** chỉ được khởi tạo và cập nhật bởi **Waitstaff** trên ứng dụng Mobile POS sau khi tư vấn thực đơn cho Guest.
- Một **Order** bao gồm một hoặc nhiều **Course** theo trình tự phục vụ, được cấu thành từ gói **TastingMenu** trọn gói hoặc các **MenuItem** riêng lẻ (A La Carte). Toàn bộ thức uống (Rượu vang, nước suối, đồ uống đóng chai) được hệ thống tự động gom vào **Course 1 (Khai vị)** để điều phối chế biến và phục vụ đồng thời cùng lượt món đầu tiên.
- Một **Course** tiếp theo chỉ chuyển sang trạng thái chế biến tại **KitchenKDS** khi nhận được tín hiệu **CourseFiring** từ nhân viên phục vụ phát đi từ thiết bị cầm tay. Lệnh này được kích hoạt linh hoạt khi khách dùng khoảng 60-70% Course hiện tại và không bị chặn cứng bởi trạng thái chế biến của các món thuộc Course trước đó để đón đầu thời gian nấu món chính.
- Khi **Expediter** kích hoạt lệnh **Remake**, món ăn lập tức được đẩy về đầu hàng đợi **KitchenKDS** với trạng thái ưu tiên khẩn cấp (`Rush`), đồng thời gửi thông báo kín tới điện thoại **Waitstaff** phụ trách bàn để chủ động chăm sóc thực khách.
- Một **Order** kết thúc bằng một **Invoice** tự động cấn trừ khoản **Deposit** đã nộp. Phí dịch vụ tính bằng 5% Subtotal, thuế VAT 10% tính trên tổng (Subtotal + Phí dịch vụ), và tổng tiền phải trả bằng (Subtotal + Phí dịch vụ + VAT - Deposit). Hệ thống yêu cầu toàn bộ món trong đơn phải được phân định rõ ràng (hoàn tất `Served` hoặc hủy `Cancelled`), tuyệt đối chặn xuất hóa đơn khi còn món dở dang ở trạng thái `Hold` hoặc `Preparing`.

## Example Dialogue

> **Dev:** "Khách hàng có thể tự bấm gọi món trên QR EMenu để gửi thẳng vào bếp không?"
> **Domain Expert:** "Không. Chuẩn Fine Dining yêu cầu Waitstaff tư vấn trực tiếp khẩu vị, dị ứng và sở thích của khách. QR EMenu chỉ là View-Only để khách xem hình ảnh, câu chuyện món ăn và gọi phục vụ. Toàn bộ Order đều do Waitstaff nhập trên Mobile POS."

## Flagged Ambiguities

- **Màn hình Digital Display ghép nối tại bàn**: Đã loại bỏ hoàn toàn theo ADR 0004. Bàn ăn không gắn cố định bất kỳ thiết bị điện tử, dây cáp hay giá đỡ nào. Bàn ăn trang bị mã QR định danh bàn: Thực khách quét mã QR bằng Smartphone cá nhân (BYOD) để xem thực đơn và gọi phục vụ (View-Only), hoặc mượn Tablet từ kho dùng chung (Floating Pool) để thưởng lãm. Quyền tạo Order thuộc độc quyền của Waitstaff trên Mobile POS.
- **Khách đến trực tiếp (Walk-in)**: Được quy về cùng một thực thể **Guest** (không dùng từ "Khách vãng lai"). Khi có bàn trống (`Available`), Host được quyền tạo nhanh lượt phục vụ tại quầy tiếp đón và mở bàn sang trạng thái `Occupied` ngay lập tức mà không cần qua quy trình tạo **Reservation** trước hay thanh toán **Deposit** trực tuyến.
- **Định mức cọc và Giá trị hóa đơn**: Định mức **Deposit** được cấu hình luôn thấp hơn chi phí bữa ăn tiêu chuẩn của một **Guest**. Trong toàn bộ vòng đời thanh toán, tổng giá trị **Invoice** luôn lớn hơn số tiền **Deposit** đã thanh toán (`Invoice > Deposit`), không tồn tại trường hợp tiền ăn thấp hơn tiền cọc hay phát sinh hoàn tiền cọc thừa tại bàn.
- **Phân biệt TastingMenu và Combo**: Loại bỏ hoàn toàn các từ "Combo" hay "Set meal" mang tính phổ thông công nghiệp. Hệ thống sử dụng chuẩn thuật ngữ **TastingMenu** cho thực đơn nếm thử đa Course cao cấp và **MenuItem** cho các món lẻ trong thực đơn A La Carte.
