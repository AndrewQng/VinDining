# ĐỀ ÁN PHÁT TRIỂN HỆ THỐNG (PROJECT PROPOSAL)
## Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (VinDining)

---

### THÔNG TIN CHUNG DỰ ÁN
* **Tên đề tài**: Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (**VinDining**)
* **Loại hình**: Đồ án Chuyên ngành / Đồ án Tốt nghiệp Kỹ thuật Phần mềm
* **Giảng viên hướng dẫn**: ThS. Phạm Hữu Tùng
* **Nhóm sinh viên thực hiện**:
  1. **Nguyễn Mạnh Quyền** — MSSV: `0023168` *(Trưởng nhóm)*
  2. **Đặng Quốc Khánh** — MSSV: `0023145` *(Thành viên)*
  3. **Nguyễn Hoàng Đạt** — MSSV: `0023120` *(Thành viên)*
* **Thời gian thực hiện**: 10 Tuần (Kỳ học 2026)

---

## CHƯƠNG 1: TỔNG QUAN & BỐI CẢNH DỰ ÁN

### 1.1 Bài toán thực tế của nhà hàng Fine Dining
Mô hình ẩm thực cao cấp (**Fine Dining**) là phân khúc nhà hàng đặc thù hướng tới sự sang trọng, đẳng cấp và tính cá nhân hóa tối đa cho thực khách. Thực đơn của nhà hàng Fine Dining được thiết kế theo hình thức gọi món lẻ cao cấp (**A La Carte**), phân chia theo các danh mục món ăn (**Category**: Khai vị, Món chính, Tráng miệng, Đồ uống/Rượu vang) với các tiêu chuẩn khắt khe về định lượng và cảnh báo dị ứng thực phẩm.

Tuy nhiên, việc vận hành thủ công thông thường đang kìm hãm hiệu suất và làm suy giảm sự đẳng cấp mà phân khúc này hướng tới. Sự ngắt quãng thông tin giữa Khách hàng, Phục vụ, Nhà bếp và Quản lý tạo ra những rào cản nghiêm trọng trong hoạt động vận hành thời gian thực.

### 1.2 Các "Nỗi đau" vận hành cốt lõi (Core Pain Points)
1. **Rủi ro bùng bàn (No-show)**: Khách hàng đặt trước các vị trí đẹp (bàn VIP, ban công) hoặc yêu cầu chuẩn bị các nguyên liệu món ăn đắt tiền nhưng không xuất hiện, gây tổn thất lớn về chi phí chuẩn bị nguyên vật liệu cao cấp nhập khẩu của nhà hàng.
2. **Sai sót thông tin đặc biệt & Cảnh báo dị ứng**: Các yêu cầu về dị ứng thực phẩm nhạy cảm (hải sản, đậu phộng, gluten) hoặc sở thích vị giác của thực khách dễ bị thất lạc hoặc chuyển đạt sai sót từ phục vụ xuống nhà bếp do quy trình ghi chép giấy tờ thủ công.
3. **Trễ điều phối ra món giữa Phục vụ và Bếp**: Mỗi món ăn cần được bưng ra bàn ở nhiệt độ và trạng thái hoàn hảo nhất ngay khi bếp nấu xong. Quy trình thủ công làm chậm trễ truyền tin, dẫn đến đĩa ăn bị giảm chất lượng tại quầy ra món (Pass).
4. **Cấn trừ tiền cọc (Deposit) phức tạp**: Việc quản lý, đối chiếu thủ công các khoản tiền đặt cọc đã thu trực tuyến khi xuất hóa đơn thanh toán cuối bữa ăn thường xuyên xảy ra nhầm lẫn, gây mất thời gian của bộ phận thu ngân và giảm sự hài lòng của khách.

### 1.3 Giải pháp hệ thống đề xuất
Xây dựng **Hệ thống Quản lý và Đặt bàn Nhà hàng Fine Dining (VinDining)** dưới dạng một ứng dụng Web Responsive đa nền tảng kết hợp Backend RESTful Web API hiện đại, tập trung 100% vào mô hình **Phục vụ tại chỗ (In-House Dining)**:
* **Khách hàng (Guest)**: Truy cập Web đặt bàn trực tuyến, đặt cọc giữ chỗ qua cổng VNPAY (khóa bàn tạm 17 phút theo `BR-01`); khi đến nhà hàng, tự do khám phá thực đơn qua Tablet E-Menu cầm tay (`EMenuTablet` - 100% chế độ chỉ xem, không nút tương tác) và quan sát tiến trình lên món, kiểm tra hóa đơn tạm tính kèm mã VietQR động trực tiếp trên màn hình `EMenuTablet` cố định tại bàn (`BR-02`). Mọi yêu cầu gọi món hay thanh toán đều được thực khách trao đổi trực tiếp với nhân viên phục vụ (Waitstaff). Thực khách **hoàn toàn không cần đăng ký tài khoản**, chỉ lưu thông tin liên lạc nhận diện theo lượt đặt bàn.
* **Nhân viên Phục vụ (Waitstaff)**: Sử dụng thiết bị di động/tablet cầm tay để check-in bàn, tiếp nhận yêu cầu gọi món từ khách, tư vấn dị ứng, ghi nhận ghi chú món ăn (`SpecialNotes`) và tạo đơn trực tiếp trên phần mềm (kích hoạt điều phối KDS Bếp tự động qua SignalR), nhận đĩa món từ quầy Pass và bưng ra bàn phục vụ khách bằng hai tay rảnh tay (Zero-touch tại bàn, không cần thao tác tablet).
* **Nhân viên Điều phối (Expediter / Checkfood)**: Túc trực cố định tại quầy Pass, đối chiếu chất lượng đĩa món (nhiệt độ, thẩm mỹ, cảnh báo dị ứng / ghi chú món ăn `SpecialNotes`) và bấm "Xác nhận ra món" (`Served`) trực tiếp trên Pass Tablet kích hoạt thông báo tức thời / rung chuông tới Smartphone cá nhân của Waitstaff theo quy tắc `BR-04`.
* **Nhà bếp (Kitchen Operations)**: Tiếp nhận order điều phối điện tử qua màn hình **KDS Bếp** rảnh tay (Hands-free / View-only) tại các trạm phân khu (Bếp nóng, Bếp lạnh, Bar) tự động nhận vé ngay khi nhân viên gửi đơn, hiển thị bộ đếm thời gian SLA chế biến và làm nổi bật cảnh báo dị ứng / ghi chú món ăn (`SpecialNotes`) trên từng món, hoàn toàn không dùng phiếu in nhiệt hay chạm màn hình trong môi trường dầu mỡ.
* **Quản lý & Admin (Manager & Admin)**: Sử dụng máy tính quản trị toàn diện danh mục thực đơn, cấu hình sơ đồ bàn ăn trực quan (`BR-02`), gán quyền nhân sự RBAC, theo dõi doanh thu thời gian thực và xử lý duyệt hoàn cọc ngoại lệ (`BR-05`).

---

## CHƯƠNG 2: MỤC TIÊU DỰ ÁN & TIÊU CHÍ THÀNH CÔNG

### 2.1 Chỉ số đo lường hiệu quả (Success Metrics / KPIs)

| Phân loại | Mục tiêu & Chỉ số (KPIs) | Phương pháp kiểm chứng & Đo lường |
| :--- | :--- | :--- |
| **Mục tiêu định lượng** | **Giảm tỷ lệ bùng bàn (No-show)** | Dưới **2%** trong vòng 3 tháng áp dụng hệ thống nhờ cơ chế bắt buộc đặt cọc giữ chỗ (Deposit) qua cổng VNPAY. |
| **Mục tiêu định lượng** | **Thời gian truyền tải & hiển thị KDS Bếp** | Dưới **3 giây** kể từ khi nhân viên phục vụ bấm tạo đơn đến khi màn hình KDS các trạm Bếp/Bar hiển thị vé điện tử qua kết nối thời gian thực SignalR. |
| **Mục tiêu định lượng** | **Nâng cao hiệu suất xoay vòng bàn** | Tăng từ **15% đến 20%** vào các khung giờ cao điểm nhờ quy trình ra món nhịp nhàng và thông báo trạng thái bàn dọn dẹp tức thời. |
| **Mục tiêu định tính** | **Đạt tỷ lệ an toàn sai sót phục vụ** | Đạt tỷ lệ tuyệt đối **0%** sai sót liên quan đến dị ứng nguyên liệu của khách nhờ cơ chế hiển thị và bôi đậm cảnh báo dị ứng / ghi chú đặc biệt (`SpecialNotes`) trên từng món ăn qua màn hình KDS Bếp và Pass Tablet. |
| **Mục tiêu định tính** | **Chuẩn hóa trải nghiệm dịch vụ cao cấp** | Số hóa quy trình xem thực đơn qua EMenuTablet cầm tay, chuyên nghiệp hóa tương tác phục vụ và minh bạch 100% dòng tiền cấn trừ cọc trên hóa đơn kẹp sổ da. |

### 2.2 Phân loại mức độ ưu tiên yêu cầu (MoSCoW Prioritization)


#### M - Must Have (Bắt buộc phải có trong phiên bản hiện tại):
* **REQ-01**: Đặt bàn trực tuyến, lựa chọn ngày/ca/vị trí bàn và thực hiện thanh toán đặt cọc giữ chỗ (Deposit) qua cổng VNPAY (khóa giữ chỗ tạm 17 phút theo `BR-01`).
* **REQ-02**: Quản lý sơ đồ bàn trực quan, quản lý vòng đời trạng thái bàn (`Available` $\rightarrow$ `LockedForPayment` $\rightarrow$ `Reserved` $\rightarrow$ `Occupied` $\rightarrow$ `Cleaning`) theo từng khu vực (`BR-02`).
* **REQ-03**: Khách xem thực đơn qua Tablet E-Menu cầm tay (`EMenuTablet` - chỉ xem) do nhân viên cung cấp tại bàn.
* **REQ-04**: Nhân viên phục vụ tiếp nhận yêu cầu, tạo đơn trực tiếp trên thiết bị di động và kích hoạt điều phối KDS Bếp qua SignalR; Expediter tại quầy Pass đối chiếu món và xác nhận `Served` trực tiếp trên Pass Tablet, Waitstaff bưng đĩa món ra bàn bằng hai tay rảnh tay không cần chạm tablet (`BR-04`).
* **REQ-05**: Lập hóa đơn thanh toán tự động cấn trừ tiền cọc đặt trước, tính phí dịch vụ 5%, VAT 10% theo công thức `BR-03` và đóng bàn chuyển sang `Cleaning`.

#### S - Should Have (Quan trọng cần có để tối ưu vận hành):
* **REQ-06**: Quản trị danh mục thực đơn động tùy biến cao (A La Carte, Category món ăn, cảnh báo dị ứng thực phẩm).
* **REQ-07**: Cơ chế phân quyền tài khoản nội bộ Role-Based Access Control (Admin, Manager, Waitstaff, Expediter) xác thực bằng JWT Bearer Token. Khách hàng không duy trì tài khoản.
* **REQ-08**: Cơ chế duyệt hoàn tiền cọc thủ công ngoại lệ (Manual Refund Override) dành riêng cho cấp Quản lý khi khách gặp sự cố bất khả kháng (`BR-05`).

#### C - Could Have (Khuyến khích có nếu đủ thời gian):
* **REQ-09**: Khách hàng gửi đánh giá sao (1–5 sao) và phản hồi trực tiếp về chất lượng dịch vụ trên Web sau bữa ăn.
* **REQ-10**: Dashboard báo cáo thống kê trực quan doanh thu theo ca/ngày/tháng và các món ăn bán chạy nhất.

#### W - Won't Have (Không phát triển trong khuôn khổ đồ án hiện tại):
* **REQ-11**: Module Giao hàng tận nơi (Online Delivery) và tính phí vận chuyển theo khoảng cách (không phù hợp với định vị Fine Dining).
* **REQ-12**: Tích hợp API với các hãng giao nhận thức ăn bên thứ ba (GrabFood, ShopeeFood).

### 2.3 Các quy tắc nghiệp vụ bất biến (Core Business Rules)

| Mã quy tắc | Tên quy tắc nghiệp vụ | Công thức & Nội dung áp dụng chi tiết |
| :---: | :--- | :--- |
| **BR-01** | **Khóa bàn giữ chỗ tạm (17 Phút)** | Khi khách bấm chuyển hướng sang VNPAY, bàn chuyển sang `LockedForPayment` trong 17 phút. Quá 17 phút chưa thanh toán thành công, Worker tự động giải phóng về `Available`. |
| **BR-02** | **Thực đơn Điện tử EMenuTablet (100% Chỉ xem) & Bàn ăn sạch bóng thiết bị cố định** | 1. **Bàn ăn chuẩn mực Fine Dining**: Bàn ăn hoàn toàn sạch bóng thiết bị điện tử cố định, giữ trọn không gian sang trọng và riêng tư.<br>2. **Tablet E-Menu cầm tay (EMenuTablet)**: 100% thụ động chỉ xem (Passive View-only), tuyệt đối KHÔNG có nút bấm tương tác (không nút 'Gọi phục vụ', không nút 'Yêu cầu tính tiền', không giỏ hàng, không tự đặt món). Quản lý theo dạng Pool thiết bị dùng chung tại Service Station; phục vụ mang ra khi khách có nhu cầu. Mọi yêu cầu gọi món đều trao đổi trực tiếp với Waitstaff. |
| **BR-03** | **Tính toán Hóa đơn & Cấn trừ cọc** | $\text{Tổng hóa đơn} = \text{Tiền món} + (\text{Tiền món} \times 5\% \text{ Service Charge}) + (\text{Tiền món} \times 10\% \text{ VAT}) - \text{Tiền cọc}$. |
| **BR-04** | **Quyền xác nhận món ra bàn (Quầy Pass)** | Chỉ duy nhất Nhân viên Điều phối (Expediter / Checkfood) tại quầy Pass mới có quyền bấm xác nhận "Đã phục vụ" (`Served`) trên hệ thống sau khi đối chiếu chất lượng đĩa món. |
| **BR-05** | **Chính sách hủy bàn & Hoàn cọc** | Hủy trước giờ hẹn $\ge$ 4 tiếng: Tự động hoàn 100% tiền cọc qua cổng VNPAY. Hủy dưới 4 tiếng hoặc No-show: Mất 100% cọc. Quản lý có quyền duyệt hoàn ngoại lệ (Manual Refund Override). |

---

## CHƯƠNG 3: MÔ TẢ GIẢI PHÁP & KIẾN TRÚC KỸ THUẬT

### 3.1 Kiến trúc tổng thể hệ thống (Clean Architecture & 3-Layer)
Hệ thống được thiết kế theo mô hình **Client-Server phân tách hoàn toàn**, tầng Backend áp dụng chuẩn **Clean Architecture** kết hợp mô hình **CQRS** với **MediatR** nhằm đảm bảo nguyên tắc **SOLID**, khả năng mở rộng và kiểm thử độc lập:

> 📐 **Tệp thiết kế Draw.io**: [`architecture_clean_arch.drawio`](./drawio/architecture_clean_arch.drawio)

![Sơ đồ Kiến trúc Tổng thể Hệ thống Clean Architecture & 3-Layer](./drawio/architecture_clean_arch.png)


### 3.2 Bảng công nghệ sử dụng (Technology Stack)

| Phân tầng (Layer) | Công nghệ / Thư viện | Vai trò & Lý do lựa chọn |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + TypeScript (Vite)** | Đảm bảo tốc độ render nhanh, type-safe, Single Page Application tối ưu trải nghiệm người dùng. |
| **UI & Styling** | **Tailwind CSS + Lucide Icons** | Thiết kế giao diện sang trọng chuẩn Fine Dining, Responsive mượt mà trên Mobile/Tablet/Desktop. |
| **Frontend State & Cache** | **TanStack Query + Zustand** | Quản lý Server Cache và Client State nhẹ nhàng, hạn chế tối đa re-render thừa. |
| **Backend Framework** | **ASP.NET Core (.NET 9) Web API** | Hiệu năng xử lý cao, kiến trúc chuẩn Enterprise, hỗ trợ DI và async/await mạnh mẽ. |
| **Architectural Pattern** | **Clean Architecture + CQRS (MediatR)** | Tách biệt nghiệp vụ đọc/ghi, tuân thủ nguyên tắc SOLID, dễ mở rộng và bảo trì. |
| **Database & ORM** | **Microsoft SQL Server + EF Core 9** | Hệ CSDL quan hệ vững chắc, hỗ trợ Transaction ACID, Code-First Migrations chuẩn hóa. |
| **Real-time Protocol** | **ASP.NET Core SignalR Client/Server** | Truyền phát lệnh điều phối KDS Bếp, thông báo EMenuTablet, đồng bộ sơ đồ bàn tức thời với độ trễ < 100ms. |
| **Thanh toán trực tuyến** | **Cổng thanh toán VNPAY (Sandbox API)** | Xử lý thanh toán cọc trực tuyến an toàn với cơ chế IPN xác thực giao dịch thời gian thực. |
| **Thiết bị Bếp & In hóa đơn** | **KDS Bếp & Máy in nhiệt Quầy Thu ngân (80mm)** | Điều phối điện tử rảnh tay tới các trạm Bếp; cập nhật tiến độ dọn món trực tiếp tới bàn ăn qua SignalR WebSocket. |

---

## CHƯƠNG 4: DANH MỤC PHÂN HỆ CHỨC NĂNG CỐT LÕI

> 📐 **Tệp thiết kế Draw.io**: [`use_case_overall.drawio`](./drawio/use_case_overall.drawio)

![Sơ đồ Use Case Tổng thể Hệ thống VinDining](./drawio/use_case_overall.png)

Hệ thống được tổ chức nhất quán thành **4 Phân hệ chức năng** bám sát 15 Use Case chuẩn hóa:

1. **Phân hệ 1: Khách hàng (Guest / Public Subsystem — `UC-U1` $\rightarrow$ `UC-U4`)**:
   - Đặt bàn trực tuyến, chọn khu vực bàn, ca hẹn và thanh toán tiền cọc giữ chỗ cố định qua cổng VNPAY (khóa bàn tạm 17 phút theo `BR-01`). Khách không cần tài khoản.
   - Khám phá thực đơn qua Tablet E-Menu cầm tay (`EMenuTablet` - 100% chế độ chỉ xem, tuyệt đối không có nút tương tác) đối chiếu bảng kê hóa đơn cấn trừ cọc kèm mã VietQR động trên phiếu in kẹp sổ da sang trọng (`BR-02`, `BR-03`).
   - Tự động hoàn cọc 100% khi khách hủy bàn trước giờ hẹn $\ge$ 4 tiếng (`BR-05`).
   - Gửi đánh giá sao và phản hồi chất lượng dịch vụ sau khi dùng bữa.

2. **Phân hệ 2: Nghiệp vụ Nhân viên Nội bộ (Employee Subsystem — `UC-E1` $\rightarrow$ `UC-E5`)**:
   - Đăng nhập an toàn bằng tài khoản nhân sự với JWT Bearer Token (`UC-E5`).
   - Nhân viên phục vụ (Waitstaff) theo dõi sơ đồ bàn real-time, check-in khách vào bàn (`Occupied`), tạo đơn gọi món trực tiếp tại bàn và tự động điều phối vé điện tử lên KDS Bếp qua SignalR (`UC-E1`).
   - Nhân viên Điều phối (Expediter) tại quầy Pass kiểm tra món và bấm xác nhận "Xác nhận ra món" (`Served`) trực tiếp trên Pass Tablet; Waitstaff bưng đĩa món ra bàn phục vụ cho khách bằng hai tay rảnh tay không cần chạm tablet (`UC-E2`, `BR-04`).
   - Tiếp nhận yêu cầu thanh toán trực tiếp từ khách (lời nói / cử chỉ), xuất hóa đơn tạm tính tự động cấn trừ tiền cọc theo `BR-03`, xuất lệnh in phiếu tạm tính kèm mã VietQR động ra máy in nhiệt quầy Thu ngân (80mm), kẹp sổ da mang ra bàn cho khách, xác nhận hoàn tất thanh toán trên điện thoại cá nhân và chuyển trạng thái bàn sang `Cleaning` (`UC-E3`).
   - Hỗ trợ đổi bàn hoặc ghép nhiều bàn ăn theo yêu cầu thực tế của khách (`UC-E4`).

3. **Phân hệ 3: Quản lý & Quản trị (Admin & Manager Subsystem — `UC-A1` $\rightarrow$ `UC-A5`)**:
   - Quản trị danh mục thực đơn, cập nhật giá, quản lý trạng thái còn/hết món và thông tin dị ứng (`UC-A1`).
   - Quản trị & Cấu hình sơ đồ bàn ăn trực quan theo khu vực (`UC-A2`, `BR-02`).
   - Quản lý duyệt hoàn tiền cọc thủ công (Manual Refund Override) khi có sự cố bất khả kháng (`UC-A3`, `BR-05`).
   - Quản trị tài khoản nhân viên nội bộ và phân quyền RBAC (`UC-A4`).
   - Báo cáo thống kê trực quan doanh thu, tỷ lệ lấp đầy bàn và món ăn bán chạy (`UC-A5`).

4. **Phân hệ 4: Tự động Hệ thống (System Background Subsystem — `UC-S1`)**:
   - Tác vụ nền ngầm (Background Worker) định kỳ mỗi 60 giây quét và tự động giải phóng các vị trí bàn giữ cọc quá 17 phút (`BR-01`) mà chưa nhận được xác nhận IPN thanh toán, đưa bàn về trạng thái `Available` và bắn thông báo SignalR Hub. Xử lý kịch bản Late IPN (> 17 phút) bằng cơ chế tự động hoàn cọc 100% qua API VNPAY sang trạng thái `Expired_AutoRefunded`.

---

## CHƯƠNG 5: KẾ HOẠCH PHÁT TRIỂN & PHÂN CÔNG 10 TUẦN


### Bảng phân công nhiệm vụ chi tiết:

| Tuần          | Giai đoạn                       | Công việc trọng tâm                                                                                                    | Deliverables chính                                                                | Phân công phụ trách                                                                                                                                           |
| :-------------:| :--------------------------------| :-----------------------------------------------------------------------------------------------------------------------| :----------------------------------------------------------------------------------| :--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Tuần 1–2**  | **Proposal + Analysis**         | Khảo sát hiện trạng, phân tích bài toán Fine Dining, xây dựng Use Case, Activity & Sequence Diagrams                   | `01_PROJECT_PROPOSAL.md`<br>`02_BAO_CAO_KHAO_SAT.md`<br>`03_BAO_CAO_PHAN_TICH.md` | **Nguyễn Mạnh Quyền**: Quản lý tiến độ, BRS<br>**Đặng Quốc Khánh**: Khảo sát & Flowchart<br>**Nguyễn Hoàng Đạt**: Use Case & Activity Diagrams                |
| **Tuần 3–4**  | **System Design**               | Thiết kế Clean Architecture, Database ERD (SQL Server), OpenAPI contracts, UI/UX Wireframes                            | Sơ đồ ERD, Báo cáo Thiết kế Kiến trúc (SDD), OpenAPI Specs                        | **Nguyễn Mạnh Quyền**: Database ERD & Clean Arch<br>**Đặng Quốc Khánh**: UI/UX EMenuTablet & Tablet<br>**Nguyễn Hoàng Đạt**: SDD & API Contracts          |
| **Tuần 5–6**  | **Setup & Infrastructure**      | Thiết lập Backend .NET 9 Clean Arch, EF Core Migrations, Identity JWT, SignalR Hub; Setup Frontend React Vite Tailwind | Solution Backend & Frontend chạy được Skeleton, kết nối CSDL                      | **Nguyễn Mạnh Quyền**: Backend Solution & DbContext<br>**Đặng Quốc Khánh**: Frontend Scaffold & Zustand<br>**Nguyễn Hoàng Đạt**: Auth JWT & SignalR Hub setup |
| **Tuần 7–8**  | **Core Coding**                 | Lập trình module Đặt bàn + cọc VNPAY, EMenuTablet, Order trực tiếp, KDS Bếp & Quầy Pass, Thanh toán HĐ   | Hệ thống chạy thông luồng End-to-End từ đặt bàn đến thanh toán                    | **Nguyễn Mạnh Quyền**: Đặt bàn & VNPAY API<br>**Đặng Quốc Khánh**: E-Menu & EMenuTablet<br>**Nguyễn Hoàng Đạt**: Điều phối KDS Bếp & Hóa đơn cấn cọc         |
| **Tuần 9–10** | **Verification & Final Report** | Kiểm thử End-to-End, tối ưu Index CSDL, đóng gói báo cáo đồ án hoàn chỉnh, chuẩn bị Slide và kịch bản Demo             | Báo cáo Đồ án Tốt nghiệp hoàn chỉnh, Video/Slide Demo, Code Repository            | **Cả nhóm**: Kiểm thử hệ thống, hoàn thiện cuốn Báo cáo và bảo vệ đồ án trước Hội đồng                                                                        |

---

## CHƯƠNG 6: KẾT QUẢ DỰ KIẾN & TIÊU CHÍ ĐÁNH GIÁ

1. **Sản phẩm Phần mềm**:
   - Backend ASP.NET Core Web API .NET 9 hoàn chỉnh, bảo mật JWT, kết nối SQL Server và tích hợp cổng VNPAY Sandbox.
   - Frontend React SPA chuẩn Responsive chạy mượt mà trên Mobile/Tablet (E-Menu Digital Display), Tablet (Nhân viên phục vụ) và Desktop (Quản trị viên).
   - Tín hiệu Real-time qua SignalR đồng bộ tức thời trạng thái bàn và đơn gọi món mới.
2. **Bộ Tài liệu Đồ án**:
   - Bộ hồ sơ phân tích và thiết kế phần mềm hoàn chỉnh: BRS, Báo cáo khảo sát, Báo cáo phân tích hệ thống (Use Case, Activity, Sequence Diagrams), Thiết kế CSDL (ERD) và Tài liệu thiết kế kiến trúc (SDD).
   - Mã nguồn chuẩn Clean Architecture được quản lý phiên bản rõ ràng trên Git/GitHub.
