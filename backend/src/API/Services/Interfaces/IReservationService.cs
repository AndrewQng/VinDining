namespace API.Services.Interfaces;

public interface IReservationService
{
    Task<CreateReservationResultDto> CreateReservationAsync(CreateReservationDto dto, CancellationToken ct = default);
    Task<bool> ProcessVnPayIpnAsync(VnPayIpnDto paramsDto, CancellationToken ct = default);
    Task<bool> CancelReservationAsync(CancelReservationDto dto, CancellationToken ct = default);
    Task<List<ReservationDetailDto>> GetReservationsAsync(DateTime? date = null, ReservationStatus? status = null, CancellationToken ct = default);
    Task<ReservationDetailDto> GetReservationByCodeAsync(string bookingCode, CancellationToken ct = default);
    Task<List<AvailableTableDto>> GetAvailableTimeSlotsAsync(DateTime reservationTime, int partySize, TableZone? zone = null, CancellationToken ct = default);
}
