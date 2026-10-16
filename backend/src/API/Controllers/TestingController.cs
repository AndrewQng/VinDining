using Application.Common.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[Route("api/[controller]")]
public class TestingController : ApiControllerBase
{
    private readonly IApplicationDbContext _dbContext;

    public TestingController(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Khởi tạo dữ liệu mẫu kiểm thử (Bàn ăn, Món ăn các Course, Nhân viên, Lịch đặt bàn có cọc)
    /// </summary>
    [HttpPost("seed")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SeedSampleData()
    {
        // 1. Nhân viên
        var staffWait = await _dbContext.Staffs.FirstOrDefaultAsync(s => s.Username == "waitstaff_test");
        if (staffWait == null)
        {
            staffWait = new Staff
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                FullName = "Nguyễn Văn Phục Vụ",
                PhoneNumber = "0901234567",
                Username = "waitstaff_test",
                Email = "waitstaff@vindining.vn",
                PasswordHash = "hash123",
                Role = StaffRole.Waitstaff,
                IsActive = true
            };
            await _dbContext.Staffs.AddAsync(staffWait);
        }

        var staffExpediter = await _dbContext.Staffs.FirstOrDefaultAsync(s => s.Username == "expediter_test");
        if (staffExpediter == null)
        {
            staffExpediter = new Staff
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                FullName = "Trần Thị Điều Phối",
                PhoneNumber = "0907654321",
                Username = "expediter_test",
                Email = "expediter@vindining.vn",
                PasswordHash = "hash123",
                Role = StaffRole.Expediter,
                IsActive = true
            };
            await _dbContext.Staffs.AddAsync(staffExpediter);
        }

        // 2. Phân loại & Món ăn
        var catApp = await _dbContext.Categories.FirstOrDefaultAsync(c => c.Name == "Khai Vị");
        if (catApp == null)
        {
            catApp = new Category { Name = "Khai Vị", Description = "Món khai vị chuẩn vị Fine Dining" };
            await _dbContext.Categories.AddAsync(catApp);
        }

        var catMain = await _dbContext.Categories.FirstOrDefaultAsync(c => c.Name == "Món Chính");
        if (catMain == null)
        {
            catMain = new Category { Name = "Món Chính", Description = "Món chính tinh hoa" };
            await _dbContext.Categories.AddAsync(catMain);
        }

        var catDes = await _dbContext.Categories.FirstOrDefaultAsync(c => c.Name == "Tráng Miệng");
        if (catDes == null)
        {
            catDes = new Category { Name = "Tráng Miệng", Description = "Tráng miệng nghệ thuật" };
            await _dbContext.Categories.AddAsync(catDes);
        }

        var catBev = await _dbContext.Categories.FirstOrDefaultAsync(c => c.Name == "Đồ Uống");
        if (catBev == null)
        {
            catBev = new Category { Name = "Đồ Uống", Description = "Vang và thức uống cao cấp" };
            await _dbContext.Categories.AddAsync(catBev);
        }

        await _dbContext.SaveChangesAsync();

        var appetizer = await _dbContext.MenuItems.FirstOrDefaultAsync(m => m.Name == "Súp Bào Ngư Hải Sâm");
        if (appetizer == null)
        {
            appetizer = new MenuItem
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Name = "Súp Bào Ngư Hải Sâm",
                Price = 350000m,
                CourseType = CourseType.Appetizer,
                CategoryId = catApp.Id,
                PrepTimeMinutes = 10,
                Status = "Available"
            };
            await _dbContext.MenuItems.AddAsync(appetizer);
        }

        var mainCourse = await _dbContext.MenuItems.FirstOrDefaultAsync(m => m.Name == "Bò Wagyu A5 Nướng Đá");
        if (mainCourse == null)
        {
            mainCourse = new MenuItem
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                Name = "Bò Wagyu A5 Nướng Đá",
                Price = 1200000m,
                CourseType = CourseType.MainCourse,
                CategoryId = catMain.Id,
                PrepTimeMinutes = 25,
                Status = "Available"
            };
            await _dbContext.MenuItems.AddAsync(mainCourse);
        }

        var dessert = await _dbContext.MenuItems.FirstOrDefaultAsync(m => m.Name == "Bánh Souffle Socola Valrhona");
        if (dessert == null)
        {
            dessert = new MenuItem
            {
                Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                Name = "Bánh Souffle Socola Valrhona",
                Price = 250000m,
                CourseType = CourseType.Dessert,
                CategoryId = catDes.Id,
                PrepTimeMinutes = 15,
                Status = "Available"
            };
            await _dbContext.MenuItems.AddAsync(dessert);
        }

        var beverage = await _dbContext.MenuItems.FirstOrDefaultAsync(m => m.Name == "Vang Đỏ Bordeaux Grand Cru");
        if (beverage == null)
        {
            beverage = new MenuItem
            {
                Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Name = "Vang Đỏ Bordeaux Grand Cru",
                Price = 900000m,
                CourseType = CourseType.Beverage,
                CategoryId = catBev.Id,
                PrepTimeMinutes = 5,
                Status = "Available"
            };
            await _dbContext.MenuItems.AddAsync(beverage);
        }

        // 3. Bàn ăn
        var tableVip = await _dbContext.Tables.FirstOrDefaultAsync(t => t.TableNumber == "VIP-01");
        if (tableVip == null)
        {
            tableVip = new Table
            {
                Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                TableNumber = "VIP-01",
                Capacity = 4,
                Zone = TableZone.VIP,
                Status = TableStatus.Available
            };
            await _dbContext.Tables.AddAsync(tableVip);
        }

        var tableMain = await _dbContext.Tables.FirstOrDefaultAsync(t => t.TableNumber == "M-01");
        if (tableMain == null)
        {
            tableMain = new Table
            {
                Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                TableNumber = "M-01",
                Capacity = 2,
                Zone = TableZone.MainHall,
                Status = TableStatus.Available
            };
            await _dbContext.Tables.AddAsync(tableMain);
        }

        // 4. Khách hàng, Đặt bàn và Cọc mẫu
        var guest = await _dbContext.Guests.FirstOrDefaultAsync(g => g.PhoneNumber == "0909999888");
        if (guest == null)
        {
            guest = new Guest
            {
                FullName = "Lê Hoàng Thực Khách",
                PhoneNumber = "0909999888",
                Email = "guest.test@vindining.vn"
            };
            await _dbContext.Guests.AddAsync(guest);
        }

        await _dbContext.SaveChangesAsync();

        var reservation = await _dbContext.Reservations.FirstOrDefaultAsync(r => r.BookingCode == "BOOK-VIP01");
        if (reservation == null)
        {
            reservation = new Reservation
            {
                Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                GuestId = guest.Id,
                TableId = tableVip.Id,
                PartySize = 4,
                BookingCode = "BOOK-VIP01",
                ReservationTime = DateTime.UtcNow.AddHours(1),
                Status = ReservationStatus.Confirmed
            };

            var deposit = new Deposit
            {
                Id = Guid.NewGuid(),
                ReservationId = reservation.Id,
                Amount = 500000m,
                TransactionId = "VNPAY-TEST-999",
                PaymentMethod = PaymentMethod.BankTransfer,
                Status = DepositStatus.Paid,
                PaidAt = DateTime.UtcNow
            };

            reservation.Deposit = deposit;
            await _dbContext.Reservations.AddAsync(reservation);
            await _dbContext.Deposits.AddAsync(deposit);
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            Message = "Đã khởi tạo thành công dữ liệu mẫu cho kiểm thử.",
            Staff = new
            {
                WaitstaffId = staffWait.Id,
                ExpediterId = staffExpediter.Id
            },
            Tables = new
            {
                TableVipId = tableVip.Id,
                TableVipNumber = tableVip.TableNumber,
                TableMainId = tableMain.Id,
                TableMainNumber = tableMain.TableNumber
            },
            MenuItems = new
            {
                AppetizerId = appetizer.Id,
                MainCourseId = mainCourse.Id,
                DessertId = dessert.Id,
                BeverageId = beverage.Id
            },
            Reservation = new
            {
                ReservationId = reservation.Id,
                DepositAmount = 500000m
            }
        });
    }

    /// <summary>
    /// Lấy danh sách trạng thái hiện tại của bàn và đơn hàng để quan sát kết quả test
    /// </summary>
    [HttpGet("overview")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTestingOverview()
    {
        var tables = await _dbContext.Tables
            .Select(t => new
            {
                t.Id,
                t.TableNumber,
                Zone = t.Zone.ToString(),
                Status = t.Status.ToString()
            })
            .ToListAsync();

        var orders = await _dbContext.Orders
            .Include(o => o.Table)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
            .Include(o => o.Invoice)
            .OrderByDescending(o => o.OpenedAt)
            .Take(5)
            .Select(o => new
            {
                o.Id,
                TableNumber = o.Table.TableNumber,
                Status = o.Status.ToString(),
                o.OpenedAt,
                o.ClosedAt,
                Items = o.OrderItems.Select(oi => new
                {
                    oi.Id,
                    ItemName = oi.MenuItem != null ? oi.MenuItem.Name : "Tasting Menu",
                    oi.Quantity,
                    oi.UnitPrice,
                    Status = oi.Status.ToString(),
                    oi.IsRush,
                    oi.Note
                }),
                HasInvoice = o.Invoice != null,
                InvoiceTotal = o.Invoice != null ? o.Invoice.TotalAmount : 0m
            })
            .ToListAsync();

        return Ok(new { Tables = tables, RecentOrders = orders });
    }
}
