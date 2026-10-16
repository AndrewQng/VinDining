using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Reservations.Queries.GetReservationByCode;

public class GetReservationByCodeQueryHandler : IRequestHandler<GetReservationByCodeQuery, ReservationDetailDto>
{
    private readonly IApplicationDbContext _dbContext;

    public GetReservationByCodeQueryHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ReservationDetailDto> Handle(GetReservationByCodeQuery request, CancellationToken cancellationToken)
    {
        var reservation = await _dbContext.Reservations
            .Include(r => r.Guest)
            .Include(r => r.Table)
            .Include(r => r.Deposit)
            .FirstOrDefaultAsync(r => r.BookingCode == request.BookingCode.Trim(), cancellationToken);

        if (reservation == null)
            throw new KeyNotFoundException($"Không tìm thấy lịch đặt bàn với mã {request.BookingCode}.");

        return new ReservationDetailDto
        {
            Id = reservation.Id,
            BookingCode = reservation.BookingCode,
            GuestName = reservation.Guest.FullName,
            GuestPhone = reservation.Guest.PhoneNumber,
            GuestEmail = reservation.Guest.Email,
            TableId = reservation.TableId,
            TableNumber = reservation.Table?.TableNumber ?? string.Empty,
            TableZone = reservation.Table?.Zone.ToString() ?? string.Empty,
            ReservationTime = reservation.ReservationTime,
            PartySize = reservation.PartySize,
            Status = reservation.Status.ToString(),
            Note = reservation.Note,
            DepositAmount = reservation.Deposit?.Amount,
            DepositStatus = reservation.Deposit?.Status.ToString(),
            CreatedAt = reservation.CreatedAt
        };
    }
}
