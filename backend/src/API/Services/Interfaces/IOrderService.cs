namespace API.Services.Interfaces;

public interface IOrderService
{
    Task<Guid> CreateOrderWithCoursesAsync(CreateOrderDto dto, CancellationToken ct = default);
    Task<int> FireNextCourseAsync(Guid id, FireCourseDto dto, CancellationToken ct = default);
    Task<int> AddOrderItemsAsync(Guid id, AddItemsDto itemsDto, CancellationToken ct = default);
    Task<bool> ConfirmServedAsync(Guid id, Guid itemId, CancellationToken ct = default);
    Task<OrderDetailDto?> GetActiveOrderByTableAsync(Guid tableId, CancellationToken ct = default);
    Task<OrderDetailDto> GetOrderDetailsAsync(Guid id, CancellationToken ct = default);
    Task<bool> CancelOrderItemAsync(Guid id, Guid itemId, CancellationToken ct = default);
    Task<List<OrderItemDetailDto>> GetKitchenPendingOrdersAsync(CancellationToken ct = default);
}
