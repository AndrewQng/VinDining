using API.Models.Common;

namespace API.Services;

public class FeedbackService : IFeedbackService
{
    private readonly IApplicationDbContext _context;

    public FeedbackService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<FeedbackTokenValidationDto> ValidateSurveyTokenAsync(string token, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(token))
            throw new ArgumentException("Liên kết đánh giá không hợp lệ.");

        var tokenTrimmed = token.Trim();
        if (tokenTrimmed.StartsWith("survey-", StringComparison.OrdinalIgnoreCase))
        {
            tokenTrimmed = tokenTrimmed[7..].Trim();
        }

        if (!Guid.TryParse(tokenTrimmed, out var tokenGuid) || tokenGuid == Guid.Empty)
            throw new ArgumentException("Liên kết đánh giá không hợp lệ.");

        var invoice = await _context.Invoices
            .Include(i => i.Order)
                .ThenInclude(o => o.Table)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == tokenGuid, ct);

        if (invoice != null)
        {
            if (!invoice.IsPaid || invoice.Order == null || invoice.Order.Status != OrderStatus.Completed)
                throw new InvalidOperationException("Hóa đơn chưa hoàn tất thanh toán, chưa thể gửi đánh giá dịch vụ.");

            if (invoice.Order.ReservationId.HasValue && invoice.Order.ReservationId.Value != Guid.Empty)
            {
                var duplicate = await _context.Feedbacks
                    .AnyAsync(f => f.ReservationId == invoice.Order.ReservationId.Value, ct);
                if (duplicate)
                    throw new ConflictException("Phiên dùng bữa này đã được gửi đánh giá trước đó.");
            }

            return new FeedbackTokenValidationDto(true, invoice.Id, invoice.Order.Table?.TableNumber);
        }

        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .Include(r => r.Orders)
                .ThenInclude(o => o.Invoice)
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == tokenGuid, ct);

        if (reservation == null)
            throw new KeyNotFoundException("Liên kết đánh giá không hợp lệ hoặc đã hết hạn.");

        var settledInvoice = reservation.Orders
            .FirstOrDefault(o => o.Status == OrderStatus.Completed && o.Invoice != null && o.Invoice.IsPaid)
            ?.Invoice;

        if (reservation.Status != ReservationStatus.Completed || settledInvoice == null)
            throw new InvalidOperationException("Bàn ăn chưa hoàn tất thanh toán hóa đơn, không thể gửi đánh giá dịch vụ.");

        var reservationDuplicate = await _context.Feedbacks
            .AnyAsync(f => f.ReservationId == reservation.Id, ct);
        if (reservationDuplicate)
            throw new ConflictException("Phiên dùng bữa này đã được gửi đánh giá trước đó.");

        return new FeedbackTokenValidationDto(true, settledInvoice.Id, reservation.Table?.TableNumber);
    }

    public async Task<Guid> SubmitFeedbackAsync(SubmitFeedbackDto dto, CancellationToken ct = default)
    {
        int effectiveRating = dto.Rating;
        if (effectiveRating == 0 && dto.FoodRating.HasValue && dto.AmbienceRating.HasValue && dto.ServiceRating.HasValue)
        {
            if (dto.FoodRating.Value < 1 || dto.FoodRating.Value > 5 ||
                dto.AmbienceRating.Value < 1 || dto.AmbienceRating.Value > 5 ||
                dto.ServiceRating.Value < 1 || dto.ServiceRating.Value > 5)
            {
                throw new ArgumentException("Điểm đánh giá dịch vụ phải nằm trong khoảng từ 1 đến 5 sao.");
            }
            effectiveRating = (int)Math.Round((dto.FoodRating.Value + dto.AmbienceRating.Value + dto.ServiceRating.Value) / 3.0);
        }

        if (effectiveRating < 1 || effectiveRating > 5)
            throw new ArgumentException("Điểm đánh giá dịch vụ phải nằm trong khoảng từ 1 đến 5 sao.");

        var resolvedInvoiceId = dto.InvoiceId;
        if (resolvedInvoiceId == Guid.Empty && !string.IsNullOrWhiteSpace(dto.Token))
        {
            var tokenTrimmed = dto.Token.Trim();
            if (tokenTrimmed.StartsWith("survey-", StringComparison.OrdinalIgnoreCase))
            {
                tokenTrimmed = tokenTrimmed[7..].Trim();
            }
            if (Guid.TryParse(tokenTrimmed, out var tokenGuid))
            {
                resolvedInvoiceId = tokenGuid;
            }
        }

        Guid reservationId;

        var invoice = resolvedInvoiceId != Guid.Empty
            ? await _context.Invoices
                .Include(i => i.Order)
                .FirstOrDefaultAsync(i => i.Id == resolvedInvoiceId, ct)
            : null;

        if (invoice != null)
        {
            if (!invoice.IsPaid || invoice.Order == null || invoice.Order.Status != OrderStatus.Completed)
                throw new InvalidOperationException("Hóa đơn chưa hoàn tất thanh toán, chưa thể gửi đánh giá dịch vụ.");

            if (!invoice.Order.ReservationId.HasValue || invoice.Order.ReservationId.Value == Guid.Empty)
            {
                var now = DateTime.UtcNow;
                var walkInGuest = new Guest
                {
                    Id = Guid.NewGuid(),
                    FullName = "Thực khách",
                    PhoneNumber = string.Empty,
                    Email = string.Empty,
                    CreatedAt = now
                };
                await _context.Guests.AddAsync(walkInGuest, ct);

                var bookingCode = $"WALKIN-{invoice.Id.ToString("N")[..8].ToUpperInvariant()}";
                if (await _context.Reservations.AnyAsync(r => r.BookingCode == bookingCode, ct))
                {
                    bookingCode = $"WALKIN-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
                }

                var walkInAnchor = new Reservation
                {
                    Id = Guid.NewGuid(),
                    BookingCode = bookingCode,
                    GuestId = walkInGuest.Id,
                    TableId = invoice.Order.TableId,
                    ReservationTime = invoice.Order.OpenedAt,
                    PartySize = 1,
                    DurationMinutes = 120,
                    Status = ReservationStatus.Completed,
                    CreatedAt = invoice.Order.OpenedAt
                };
                await _context.Reservations.AddAsync(walkInAnchor, ct);

                invoice.Order.ReservationId = walkInAnchor.Id;
                reservationId = walkInAnchor.Id;
            }
            else
            {
                if (dto.ReservationId.HasValue &&
                    dto.ReservationId.Value != Guid.Empty &&
                    dto.ReservationId.Value != invoice.Order.ReservationId.Value)
                {
                    throw new InvalidOperationException("Mã đặt bàn không khớp với hóa đơn thanh toán.");
                }

                var linkedReservation = await _context.Reservations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(r => r.Id == invoice.Order.ReservationId.Value, ct);

                if (linkedReservation == null)
                    throw new KeyNotFoundException($"Không tìm thấy đơn đặt bàn {invoice.Order.ReservationId.Value}.");

                if (linkedReservation.Status == ReservationStatus.Pending || linkedReservation.Status == ReservationStatus.Cancelled)
                    throw new InvalidOperationException("Đơn đặt bàn chưa hoàn tất phục vụ hoặc đã bị hủy, không thể gửi đánh giá.");

                reservationId = linkedReservation.Id;
            }
        }
        else
        {
            var candidateReservationId = dto.ReservationId.HasValue && dto.ReservationId.Value != Guid.Empty
                ? dto.ReservationId.Value
                : resolvedInvoiceId;

            if (candidateReservationId == Guid.Empty)
                throw new InvalidOperationException("Vui lòng cung cấp mã hóa đơn hoặc mã đặt bàn hợp lệ để gửi đánh giá.");

            var reservation = await _context.Reservations
                .Include(r => r.Orders)
                    .ThenInclude(o => o.Invoice)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == candidateReservationId, ct);

            if (reservation == null)
                throw new KeyNotFoundException($"Không tìm thấy hóa đơn hoặc đơn đặt bàn hợp lệ ({candidateReservationId}).");

            var hasSettledPaidInvoice = reservation.Orders.Any(o =>
                o.Status == OrderStatus.Completed &&
                o.Invoice != null &&
                o.Invoice.IsPaid);

            if (reservation.Status != ReservationStatus.Completed || !hasSettledPaidInvoice)
                throw new InvalidOperationException("Bàn ăn chưa hoàn tất thanh toán hóa đơn, không thể gửi đánh giá dịch vụ.");

            reservationId = reservation.Id;
        }

        var duplicate = await _context.Feedbacks.AnyAsync(f => f.ReservationId == reservationId, ct);
        if (duplicate)
            throw new ConflictException("Phiên dùng bữa này đã được gửi đánh giá trước đó.");

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            ReservationId = reservationId,
            Rating = effectiveRating,
            FoodRating = dto.FoodRating ?? effectiveRating,
            AmbienceRating = dto.AmbienceRating ?? effectiveRating,
            ServiceRating = dto.ServiceRating ?? effectiveRating,
            Comment = dto.Comment?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await _context.Feedbacks.AddAsync(feedback, ct);
        await _context.SaveChangesAsync(ct);
        return feedback.Id;
    }

    public async Task<List<FeedbackDto>> GetFeedbacksAsync(CancellationToken ct = default)
    {
        var list = await _context.Feedbacks
            .Include(f => f.Reservation)
                .ThenInclude(r => r.Guest)
            .Include(f => f.Reservation)
                .ThenInclude(r => r.Table)
            .Include(f => f.Reservation)
                .ThenInclude(r => r.Orders)
                    .ThenInclude(o => o.Invoice)
            .AsNoTracking()
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(ct);

        return list.Select(f =>
        {
            var settledInvoiceId = f.Reservation?.Orders?
                .FirstOrDefault(o => o.Invoice != null && o.Invoice.IsPaid)?
                .Invoice?.Id ?? f.ReservationId;
            var rounded = (int)Math.Round(f.Rating);

            return new FeedbackDto(
                f.Id,
                settledInvoiceId,
                rounded,
                f.Comment,
                f.CreatedAt,
                f.ReservationId,
                f.Reservation?.Guest?.FullName,
                f.Reservation?.Table?.TableNumber,
                f.FoodRating ?? rounded,
                f.AmbienceRating ?? rounded,
                f.ServiceRating ?? rounded,
                f.Reservation?.Table?.Zone.ToString()
            );
        }).ToList();
    }
}
