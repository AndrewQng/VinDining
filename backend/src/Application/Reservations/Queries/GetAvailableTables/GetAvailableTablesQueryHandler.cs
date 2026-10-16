using Application.Common.Interfaces;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Reservations.Queries.GetAvailableTables;

public class GetAvailableTablesQueryHandler : IRequestHandler<GetAvailableTablesQuery, List<AvailableTableDto>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetAvailableTablesQueryHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<AvailableTableDto>> Handle(GetAvailableTablesQuery request, CancellationToken cancellationToken)
    {
        // Khung thời gian phục vụ dự kiến mặc định là 120 phút (2 giờ)
        var requestedStart = request.ReservationTime;
        var requestedEnd = request.ReservationTime.AddMinutes(120);

        // Lấy danh sách các bàn bị trùng lịch đặt (đang Pending hoặc Confirmed trong khung giờ này)
        var conflictedTableIds = await _dbContext.Reservations
            .Where(r => (r.Status == ReservationStatus.Confirmed || r.Status == ReservationStatus.Pending) &&
                        r.ReservationTime < requestedEnd &&
                        r.ReservationTime.AddMinutes(r.DurationMinutes) > requestedStart)
            .Select(r => r.TableId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var query = _dbContext.Tables
            .Where(t => t.Capacity >= request.PartySize &&
                        !conflictedTableIds.Contains(t.Id) &&
                        t.Status != TableStatus.Cleaning);

        if (request.Zone.HasValue)
        {
            query = query.Where(t => t.Zone == request.Zone.Value);
        }

        var availableTables = await query
            .OrderBy(t => t.Capacity)
            .ThenBy(t => t.TableNumber)
            .Select(t => new AvailableTableDto
            {
                Id = t.Id,
                TableNumber = t.TableNumber,
                Capacity = t.Capacity,
                Zone = t.Zone,
                Status = t.Status
            })
            .ToListAsync(cancellationToken);

        return availableTables;
    }
}
