# Cơ Chế Khóa Đồng Thời (Concurrency & Locking) — VinDining

Tài liệu tóm tắt cơ chế xử lý xung đột khi nhiều khách đặt cùng 1 bàn hoặc nhiều nhân viên thao tác đồng thời trên cùng 1 bàn / 1 đơn trong mã nguồn Backend (.NET 9).

---

## 1. Nhiều khách đặt cùng 1 bàn

Hệ thống kết hợp 3 lớp bảo vệ:

1. **Application-level Pessimistic Lock (Per-Table Mutex)** — `backend/src/API/Services/TableConcurrencyLock.cs` (đăng ký Singleton trong `Program.cs`):
   - Mỗi `TableId` có 1 `SemaphoreSlim(1, 1)` riêng trong `ConcurrentDictionary<Guid, SemaphoreSlim>`, timeout 5 giây.
   - `ReservationService.CreateReservationAsync` gọi `_tableLock.AcquireAsync(dto.TableId)` để tuần tự hóa các request đặt cùng 1 bàn. Request vào sau phải chờ, kiểm tra lại khung giờ (120 phút) và nhận `409 Conflict` (`ConflictException`).
   - Với thao tác nhiều bàn (đổi bàn, gộp bàn, quét khóa hết hạn), `AcquireManyAsync` sắp xếp `tableIds` tăng dần (`OrderBy(id => id)`) trước khi chiếm khóa để chống **Deadlock**.
2. **Soft Business Lock có TTL (17 phút)** — `ReservationService.cs`, `ExpiredReservationLockService.cs`:
   - Người đầu tiên tạo đơn giữ chỗ ở trạng thái `Pending` và chuyển bàn sang `LockedForPayment` trong 17 phút (15 phút thanh toán VNPAY + 2 phút đệm).
   - Quá 17 phút không thanh toán, background worker và bước quét lười lúc tạo đơn tự hủy đơn và trả bàn về `Available`.
3. **Database-level Optimistic Concurrency**:
   - EF Core kiểm tra `.IsConcurrencyToken()` và `GlobalExceptionMiddleware.cs` bắt `DbUpdateConcurrencyException` trả về lỗi xung đột cho client.

---

## 2. Nhiều nhân viên thao tác trên cùng 1 bàn / 1 đơn

| Nhóm thao tác | Service & Method | Cơ chế xử lý đồng thời |
| :--- | :--- | :--- |
| Tạo đơn mới trên bàn | `OrderService.CreateOrderWithCoursesAsync` | Khóa `_tableLock.AcquireAsync(dto.TableId)`, chặn tạo trùng 2 đơn đang mở (`409 Conflict`) |
| Check-in, xếp khách walk-in, đổi bàn, gộp bàn, đổi trạng thái bàn | `TableService` (`CheckIn`, `WalkIn`, `TransferTable`, `MergeTables`, `UpdateStatus`) | Khóa `_tableLock.AcquireAsync` / `AcquireManyAsync` (sắp xếp ID chống deadlock) |
| Tạm tính & quyết toán hóa đơn | `InvoiceService` (Preview & Checkout) | Khóa `_tableLock.AcquireAsync(tableId)`, chặn 2 thu ngân thanh toán trùng 1 đơn (`409 Conflict`) |
| Gọi thêm món vào đơn đang mở | `OrderService.AddOrderItemsAsync` | Thêm bản ghi `OrderItem` mới (append-only) nên 2 phục vụ gọi thêm cùng lúc không ghi đè lẫn nhau + phát SignalR đồng bộ |
| Bắn lượt món, xác nhận ra món, làm lại, hủy món | `OrderService` (`FireNextCourseAsync`, `ConfirmServedAsync`, `RemakeOrderItemAsync`, `CancelOrderItemAsync`) | Kiểm tra **State-Machine Guard** trên `Order.Status` và `OrderItem.Status` (ví dụ chỉ bắn món đang `Hold`, không hủy món đã `Served`, không xác nhận lại món đã `Served`/`Cancelled`) + phát SignalR (`KitchenHub`/`TableHub`) cập nhật tức thời các máy khác |

### Giới hạn hiện tại & hướng mở rộng (ghi chú trả lời phản biện)
- **Chỉnh sửa cùng 1 `OrderItem` trong cùng mili-giây**: 5 hàm chỉnh sửa trên đơn đã mở (`AddOrderItemsAsync`, `FireNextCourseAsync`, `ConfirmServedAsync`, `RemakeOrderItemAsync`, `CancelOrderItemAsync`) hiện chưa bọc `_tableLock.AcquireAsync(order.TableId)` và entity `Order`/`OrderItem` chưa khai báo cột `RowVersion` (`[Timestamp]`). Khi cần bảo vệ tuyệt đối mức mili-giây (ví dụ 1 phục vụ hủy món đúng lúc Expediter bấm xác nhận ra món), chỉ cần bọc thêm `_tableLock.AcquireAsync(order.TableId)` hoặc thêm `byte[] RowVersion` với `[Timestamp]` trên `OrderItem`.
- **Scale nhiều instance Backend**: Vì đã tách interface `ITableConcurrencyLock`, khi triển khai đa server chỉ cần thay `TableConcurrencyLock` (in-memory `SemaphoreSlim`) sang **Distributed Lock** (Redis Redlock hoặc SQL Server `UPDLOCK/HOLDLOCK`) mà không phải sửa logic trong các Service.
