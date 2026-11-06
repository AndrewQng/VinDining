namespace API.Services.Interfaces;

public interface IReservationService
{
    Task<CreateReservationResultDto> CreateReservationAsync(CreateReservationDto dto, CancellationToken ct = default);
    Task<bool> ProcessVnPayIpnAsync(VnPayIpnDto paramsDto, IDictionary<string, string>? rawParams = null, CancellationToken ct = default);
    Task<bool> ConfirmDepositAsync(ConfirmDepositDto dto, CancellationToken ct = default);
    Task<CancelReservationResultDto> CancelReservationAsync(CancelReservationDto dto, CancellationToken ct = default);
    Task<CancelReservationResultDto> MarkNoShowAsync(string bookingCode, string? reason = null, CancellationToken ct = default);
    Task<List<ReservationDetailDto>> GetReservationsAsync(DateTime? date = null, ReservationStatus? status = null, CancellationToken ct = default);
    Task<ReservationDetailDto> GetReservationByCodeAsync(string bookingCode, CancellationToken ct = default);
    Task<List<AvailableTableDto>> GetAvailableTimeSlotsAsync(DateTime reservationTime, int partySize, TableZone? zone = null, CancellationToken ct = default);
}
