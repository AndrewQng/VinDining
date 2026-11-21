using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace API.Data;

public static class DatabaseSeeder
{
    private const string DemoPasswordPlain = "VinDining@2026";

    public static async Task SeedAsync(IServiceProvider services, CancellationToken ct = default)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Staff>>();
        var hostEnvironment = scope.ServiceProvider.GetService<IHostEnvironment>();
        var logger = scope.ServiceProvider.GetService<ILoggerFactory>()?.CreateLogger(typeof(DatabaseSeeder));
        var isDevelopment = hostEnvironment?.IsDevelopment() == true;

        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync(ct);
        }

        var now = DateTime.UtcNow;
        var vnToday = now.AddHours(7).Date;
        var vnTodayStartUtc = vnToday.AddHours(-7);
        DateTime TodayMinsAgo(int minutes)
        {
            var target = now.AddMinutes(-minutes);
            return target >= vnTodayStartUtc.AddMinutes(5) ? target : vnTodayStartUtc.AddMinutes(5);
        }

        DateTime VnSlotUtc(int daysOffset, int hour, int minute)
            => vnToday.AddDays(daysOffset).AddHours(hour - 7).AddMinutes(minute);

        // 1. Staff Accounts (all share DemoPasswordPlain)
        var staffSpecs = new[]
        {
            ("mai.tt", "Trần Thị Mai", "0901000001", "mai.tt@vindining.vn", StaffRole.Waitstaff),
            ("quan.lm", "Lê Minh Quân", "0901000002", "quan.lm@vindining.vn", StaffRole.Expediter),
            ("ha.pt", "Phạm Thu Hà", "0901000003", "ha.pt@vindining.vn", StaffRole.Cashier),
            ("long.dh", "Đỗ Hoàng Long", "0901000004", "long.dh@vindining.vn", StaffRole.Admin),
        };

        var staffsByUsername = new Dictionary<string, Staff>(StringComparer.OrdinalIgnoreCase);
        foreach (var (username, fullName, phone, email, role) in staffSpecs)
        {
            var staff = await context.Staffs.FirstOrDefaultAsync(s => s.Username == username, ct);
            if (staff == null)
            {
                staff = new Staff
                {
                    Id = Guid.NewGuid(),
                    FullName = fullName,
                    PhoneNumber = phone,
                    Username = username,
                    Email = email,
                    Role = role,
                    IsActive = true,
                    CreatedAt = now
                };
                staff.PasswordHash = passwordHasher.HashPassword(staff, DemoPasswordPlain);
                await context.Staffs.AddAsync(staff, ct);
            }
            else if (username == "ha.pt" && staff.Role != StaffRole.Cashier)
            {
                staff.Role = StaffRole.Cashier;
            }
            staffsByUsername[username] = staff;
        }
        await context.SaveChangesAsync(ct);

        var mai = staffsByUsername["mai.tt"];
        var quan = staffsByUsername["quan.lm"];
        var ha = staffsByUsername["ha.pt"];

        // 2. Categories
        var categorySpecs = new[]
        {
            ("Khai vị", "Các món khai vị mở đầu bữa tối"),
            ("Món chính", "Món chính chế biến tinh tuyển"),
            ("Tráng miệng", "Món tráng miệng khép lại thực đơn"),
            ("Đồ uống", "Đồ uống phục vụ cùng Khai vị"),
        };

        var categoriesByName = new Dictionary<string, Category>(StringComparer.OrdinalIgnoreCase);
        foreach (var (name, description) in categorySpecs)
        {
            var category = await context.Categories.FirstOrDefaultAsync(c => c.Name == name, ct);
            if (category == null)
            {
                category = new Category
                {
                    Id = Guid.NewGuid(),
                    Name = name,
                    Description = description,
                    IsActive = true,
                    CreatedAt = now
                };
                await context.Categories.AddAsync(category, ct);
            }
            categoriesByName[name] = category;
        }
        await context.SaveChangesAsync(ct);

        // 3. MenuItems
        var menuItemSpecs = new[]
        {
            ("Súp bào ngư thượng hạng", "Khai vị", 350_000m, "Bào ngư hầm nước dùng thanh trong, phục vụ nóng.", "dish_sup_bao_ngu.jpg", "Available", 12, CourseType.Appetizer),
            ("Gỏi tôm hùm sốt chanh leo", "Khai vị", 420_000m, "Thịt tôm hùm chần vừa chín tới cùng sốt chanh leo.", "dish_goi_tom_hum.jpg", "Available", 10, CourseType.Appetizer),
            ("Sò điệp Hokkaido áp chảo", "Khai vị", 390_000m, "Sò điệp áp chảo vàng mặt kèm xốt thảo mộc.", "dish_so_diep.jpg", "SoldOut", 12, CourseType.Appetizer),
            ("Bò Wagyu A5 sốt nấm Truffle", "Món chính", 1_250_000m, "Thăn bò Wagyu A5 áp chảo vừa chín tới, dùng kèm sốt nấm Truffle.", "dish_wagyu.jpg", "Available", 25, CourseType.MainCourse),
            ("Cá tuyết nướng Miso mật ong", "Món chính", 680_000m, "Phi lê cá tuyết nướng sốt Miso mật ong.", "dish_ca_tuyet.jpg", "Available", 20, CourseType.MainCourse),
            ("Bánh Soufflé sô-cô-la", "Tráng miệng", 220_000m, "Bánh Soufflé nướng nóng phủ đường bột.", "dish_souffle.jpg", "Available", 15, CourseType.Dessert),
            ("Panna cotta chanh dây", "Tráng miệng", 180_000m, "Panna cotta vani mịn cùng sốt chanh dây tươi.", "dish_panna_cotta.jpg", "Available", 8, CourseType.Dessert),
            ("Nước khoáng có ga", "Đồ uống", 120_000m, "Nước khoáng có ga phục vụ lạnh tại bàn.", (string?)null, "Available", 0, CourseType.Beverage),
            ("Vang đỏ (ly)", "Đồ uống", 450_000m, "Vang đỏ phục vụ theo ly.", (string?)null, "Available", 0, CourseType.Beverage),
        };

        var itemsByName = new Dictionary<string, MenuItem>(StringComparer.OrdinalIgnoreCase);
        foreach (var (name, catName, price, desc, img, status, prepMins, course) in menuItemSpecs)
        {
            var item = await context.MenuItems.FirstOrDefaultAsync(m => m.Name == name, ct);
            if (item == null)
            {
                item = new MenuItem
                {
                    Id = Guid.NewGuid(),
                    CategoryId = categoriesByName[catName].Id,
                    Name = name,
                    Description = desc,
                    Price = price,
                    ImageUrl = img,
                    Status = status,
                    PrepTimeMinutes = prepMins,
                    CourseType = course,
                    CreatedAt = now
                };
                await context.MenuItems.AddAsync(item, ct);
            }
            else if (isDevelopment)
            {
                if (item.Price != price || item.PrepTimeMinutes != prepMins)
                {
                    logger?.LogInformation(
                        "DatabaseSeeder: syncing MenuItem '{Name}' ({Id}) Price {OldPrice}->{NewPrice}, PrepTimeMinutes {OldPrep}->{NewPrep}.",
                        item.Name,
                        item.Id,
                        item.Price,
                        price,
                        item.PrepTimeMinutes,
                        prepMins);
                    item.Price = price;
                    item.PrepTimeMinutes = prepMins;
                }
            }
            else if (course == CourseType.Beverage && item.PrepTimeMinutes != prepMins)
            {
                item.PrepTimeMinutes = prepMins;
            }
            itemsByName[name] = item;
        }
        await context.SaveChangesAsync(ct);

        // 4. TastingMenus & TastingMenuItems
        var setSpecs = new[]
        {
            (
                Name: "Set Menu Thượng Hạng",
                Price: 1_800_000m,
                Description: "Thực đơn nếm thử 3 Course tinh tuyển.",
                ImageUrl: "set_thuong_hang.jpg",
                Items: new[]
                {
                    ("Súp bào ngư thượng hạng", 1, CourseType.Appetizer),
                    ("Bò Wagyu A5 sốt nấm Truffle", 2, CourseType.MainCourse),
                    ("Bánh Soufflé sô-cô-la", 3, CourseType.Dessert),
                }
            ),
            (
                Name: "Set Menu Hải Sản",
                Price: 1_250_000m,
                Description: "Thực đơn nếm thử 3 Course hải sản.",
                ImageUrl: "set_hai_san.jpg",
                Items: new[]
                {
                    ("Gỏi tôm hùm sốt chanh leo", 1, CourseType.Appetizer),
                    ("Cá tuyết nướng Miso mật ong", 2, CourseType.MainCourse),
                    ("Panna cotta chanh dây", 3, CourseType.Dessert),
                }
            ),
            (
                Name: "Set Menu Tinh Hoa",
                Price: 1_190_000m,
                Description: "Thực đơn nếm thử 3 Course cân bằng tinh tế.",
                ImageUrl: "dish_sup_bao_ngu.jpg",
                Items: new[]
                {
                    ("Súp bào ngư thượng hạng", 1, CourseType.Appetizer),
                    ("Cá tuyết nướng Miso mật ong", 2, CourseType.MainCourse),
                    ("Panna cotta chanh dây", 3, CourseType.Dessert),
                }
            ),
            (
                Name: "Set Menu Đặc Tuyển",
                Price: 1_850_000m,
                Description: "Thực đơn nếm thử 3 Course đặc sắc từ hải sản đến Wagyu.",
                ImageUrl: "dish_wagyu.jpg",
                Items: new[]
                {
                    ("Gỏi tôm hùm sốt chanh leo", 1, CourseType.Appetizer),
                    ("Bò Wagyu A5 sốt nấm Truffle", 2, CourseType.MainCourse),
                    ("Bánh Soufflé sô-cô-la", 3, CourseType.Dessert),
                }
            ),
        };

        var setsByName = new Dictionary<string, TastingMenu>(StringComparer.OrdinalIgnoreCase);
        foreach (var spec in setSpecs)
        {
            var tastingMenu = await context.TastingMenus
                .Include(tm => tm.TastingMenuItems)
                .FirstOrDefaultAsync(tm => tm.Name == spec.Name, ct);

            if (tastingMenu == null)
            {
                tastingMenu = new TastingMenu
                {
                    Id = Guid.NewGuid(),
                    Name = spec.Name,
                    Price = spec.Price,
                    Description = spec.Description,
                    ImageUrl = spec.ImageUrl,
                    IsActive = true,
                    CreatedAt = now
                };
                await context.TastingMenus.AddAsync(tastingMenu, ct);

                foreach (var (dishName, order, course) in spec.Items)
                {
                    await context.TastingMenuItems.AddAsync(new TastingMenuItem
                    {
                        Id = Guid.NewGuid(),
                        TastingMenuId = tastingMenu.Id,
                        MenuItemId = itemsByName[dishName].Id,
                        CourseOrder = order,
                        CourseType = course
                    }, ct);
                }
            }
            else if (isDevelopment)
            {
                var changed = false;
                if (tastingMenu.Price != spec.Price ||
                    !string.Equals(tastingMenu.Description, spec.Description, StringComparison.Ordinal) ||
                    !string.Equals(tastingMenu.ImageUrl, spec.ImageUrl, StringComparison.Ordinal))
                {
                    logger?.LogInformation(
                        "DatabaseSeeder: syncing TastingMenu '{Name}' ({Id}) Price {OldPrice}->{NewPrice}, Description/ImageUrl.",
                        tastingMenu.Name,
                        tastingMenu.Id,
                        tastingMenu.Price,
                        spec.Price);
                    tastingMenu.Price = spec.Price;
                    tastingMenu.Description = spec.Description;
                    tastingMenu.ImageUrl = spec.ImageUrl;
                    changed = true;
                }

                var existingDishes = tastingMenu.TastingMenuItems
                    .OrderBy(d => d.CourseOrder)
                    .ToList();
                var matchedIds = new HashSet<Guid>();
                var missingSpecs = new List<(string DishName, int Order, CourseType Course)>();

                foreach (var (dishName, order, course) in spec.Items)
                {
                    var expectedMenuItemId = itemsByName[dishName].Id;
                    var byOrder = existingDishes.FirstOrDefault(d => d.CourseOrder == order && !matchedIds.Contains(d.Id));
                    if (byOrder != null)
                    {
                        matchedIds.Add(byOrder.Id);
                        if (byOrder.MenuItemId != expectedMenuItemId || byOrder.CourseType != course)
                        {
                            byOrder.MenuItemId = expectedMenuItemId;
                            byOrder.CourseType = course;
                            changed = true;
                        }
                    }
                    else
                    {
                        missingSpecs.Add((dishName, order, course));
                    }
                }

                var reusableDishes = existingDishes.Where(d => !matchedIds.Contains(d.Id)).ToList();
                for (var i = 0; i < missingSpecs.Count; i++)
                {
                    var (dishName, order, course) = missingSpecs[i];
                    var expectedMenuItemId = itemsByName[dishName].Id;
                    if (i < reusableDishes.Count)
                    {
                        var row = reusableDishes[i];
                        row.MenuItemId = expectedMenuItemId;
                        row.CourseOrder = order;
                        row.CourseType = course;
                    }
                    else
                    {
                        await context.TastingMenuItems.AddAsync(new TastingMenuItem
                        {
                            Id = Guid.NewGuid(),
                            TastingMenuId = tastingMenu.Id,
                            MenuItemId = expectedMenuItemId,
                            CourseOrder = order,
                            CourseType = course
                        }, ct);
                    }
                    changed = true;
                }

                if (changed)
                {
                    logger?.LogInformation(
                        "DatabaseSeeder: synced TastingMenu '{Name}' ({Id}) dishes to seed values.",
                        tastingMenu.Name,
                        tastingMenu.Id);
                }
            }
            setsByName[spec.Name] = tastingMenu;
        }
        await context.SaveChangesAsync(ct);

        // 5. Tables (4x2 MainHall + 3 VIP + 4 Balcony matching FE floor plan coordinates)
        var tableSpecs = new[]
        {
            ("B01", 2, TableZone.MainHall, TableStatus.Available, 51, 66, (int?)null, (DateTime?)null),
            ("B02", 2, TableZone.MainHall, TableStatus.Cleaning, 211, 66, (int?)null, (DateTime?)null),
            ("B03", 4, TableZone.MainHall, TableStatus.Occupied, 363, 63, (int?)2, (DateTime?)null),
            ("B04", 4, TableZone.MainHall, TableStatus.PaymentPending, 523, 63, (int?)2, (DateTime?)TodayMinsAgo(7)),
            ("B05", 4, TableZone.MainHall, TableStatus.Reserved, 43, 283, (int?)4, (DateTime?)null),
            ("B06", 6, TableZone.MainHall, TableStatus.Available, 195, 280, (int?)null, (DateTime?)null),
            ("B07", 6, TableZone.MainHall, TableStatus.LockedForPayment, 355, 280, (int?)6, (DateTime?)null),
            ("B08", 8, TableZone.MainHall, TableStatus.Occupied, 511, 277, (int?)8, (DateTime?)null),
            ("V01", 6, TableZone.VIP, TableStatus.Available, 80, 80, (int?)null, (DateTime?)null),
            ("V02", 8, TableZone.VIP, TableStatus.Available, 240, 80, (int?)null, (DateTime?)null),
            ("V03", 10, TableZone.VIP, TableStatus.Available, 160, 220, (int?)null, (DateTime?)null),
            ("C01", 2, TableZone.Balcony, TableStatus.Available, 80, 80, (int?)null, (DateTime?)null),
            ("C02", 2, TableZone.Balcony, TableStatus.Available, 220, 80, (int?)null, (DateTime?)null),
            ("C03", 4, TableZone.Balcony, TableStatus.Available, 80, 200, (int?)null, (DateTime?)null),
            ("C04", 4, TableZone.Balcony, TableStatus.Available, 220, 200, (int?)null, (DateTime?)null),
        };

        var tablesByNumber = new Dictionary<string, Table>(StringComparer.OrdinalIgnoreCase);
        foreach (var (num, cap, zone, status, posX, posY, guestCount, checkoutAt) in tableSpecs)
        {
            var table = await context.Tables.FirstOrDefaultAsync(t => t.TableNumber == num, ct);
            if (table == null)
            {
                table = new Table
                {
                    Id = Guid.NewGuid(),
                    TableNumber = num,
                    Capacity = cap,
                    Zone = zone,
                    Status = status,
                    PosX = posX,
                    PosY = posY,
                    CurrentGuestCount = guestCount,
                    CheckoutRequestedAt = checkoutAt,
                    IsActive = true,
                    CreatedAt = now
                };
                await context.Tables.AddAsync(table, ct);
            }
            else
            {
                if (isDevelopment &&
                    (table.Capacity != cap || table.Zone != zone || table.PosX != posX || table.PosY != posY))
                {
                    logger?.LogInformation(
                        "DatabaseSeeder: syncing Table '{TableNumber}' ({Id}) Capacity {OldCap}->{NewCap}, Zone {OldZone}->{NewZone}, Pos ({OldX},{OldY})->({NewX},{NewY}).",
                        table.TableNumber,
                        table.Id,
                        table.Capacity,
                        cap,
                        table.Zone,
                        zone,
                        table.PosX,
                        table.PosY,
                        posX,
                        posY);
                    table.Capacity = cap;
                    table.Zone = zone;
                    table.PosX = posX;
                    table.PosY = posY;
                }
                if (guestCount.HasValue && !table.CurrentGuestCount.HasValue)
                {
                    table.CurrentGuestCount = guestCount;
                }
            }
            tablesByNumber[num] = table;
        }
        await context.SaveChangesAsync(ct);

        // 6. Guests (§10 guest only)
        var guestSpecs = new[]
        {
            ("Nguyễn Văn An", "0901234567", "an.nguyen@email.com"),
        };

        var guestsByPhone = new Dictionary<string, Guest>(StringComparer.Ordinal);
        foreach (var (fullName, phone, email) in guestSpecs)
        {
            var guest = await context.Guests.FirstOrDefaultAsync(g => g.PhoneNumber == phone, ct);
            if (guest == null)
            {
                guest = new Guest
                {
                    Id = Guid.NewGuid(),
                    FullName = fullName,
                    PhoneNumber = phone,
                    Email = email,
                    CreatedAt = now
                };
                await context.Guests.AddAsync(guest, ct);
            }
            guestsByPhone[phone] = guest;
        }
        await context.SaveChangesAsync(ct);

        var guestAn = guestsByPhone["0901234567"];

        if (isDevelopment)
        {
            var legacyDemoGuests = await context.Guests
                .Where(g => g.Id != guestAn.Id && (g.PhoneNumber == "0912345678" || g.PhoneNumber == "0987654321"))
                .Select(g => g.Id)
                .ToListAsync(ct);

            if (legacyDemoGuests.Count > 0)
            {
                var legacyReservations = await context.Reservations
                    .Where(r => legacyDemoGuests.Contains(r.GuestId))
                    .ToListAsync(ct);
                foreach (var res in legacyReservations)
                {
                    logger?.LogInformation(
                        "DatabaseSeeder: re-attaching Reservation '{BookingCode}' ({Id}) to §10 guest Nguyễn Văn An.",
                        res.BookingCode,
                        res.Id);
                    res.GuestId = guestAn.Id;
                }
                if (legacyReservations.Count > 0)
                {
                    await context.SaveChangesAsync(ct);
                }
            }
        }

        var setThuongHang = setsByName["Set Menu Thượng Hạng"];
        var setHaiSan = setsByName["Set Menu Hải Sản"];

        // 7. Reservations & Deposits
        async Task<Reservation> EnsureReservationAsync(
            string bookingCode,
            Guest guest,
            Table table,
            DateTime reservationTime,
            int partySize,
            ReservationStatus status,
            string? note,
            decimal depositAmount,
            string txId,
            PaymentMethod paymentMethod,
            DepositStatus depositStatus,
            DateTime createdAt,
            DateTime? paidAt = null,
            DateTime? cancelledAt = null,
            string? cancelledReason = null,
            decimal? refundAmount = null)
        {
            var existing = await context.Reservations
                .Include(r => r.Deposit)
                .FirstOrDefaultAsync(r => r.BookingCode == bookingCode, ct);
            if (existing != null)
                return existing;

            var reservation = new Reservation
            {
                Id = Guid.NewGuid(),
                BookingCode = bookingCode,
                GuestId = guest.Id,
                TableId = table.Id,
                ReservationTime = reservationTime,
                PartySize = partySize,
                DurationMinutes = 120,
                Status = status,
                Note = note,
                CancelledAt = cancelledAt,
                CancelledReason = cancelledReason,
                CreatedAt = createdAt
            };
            await context.Reservations.AddAsync(reservation, ct);

            await context.Deposits.AddAsync(new Deposit
            {
                Id = Guid.NewGuid(),
                ReservationId = reservation.Id,
                Amount = depositAmount,
                TransactionId = txId,
                PaymentMethod = paymentMethod,
                Status = depositStatus,
                PaidAt = paidAt,
                RefundAmount = refundAmount,
                CreatedAt = createdAt
            }, ct);

            return reservation;
        }

        // VD-7K3Q: confirmed reservation on B05 (< 4h ahead so forfeit warning demo works anytime)
        await EnsureReservationAsync(
            "VD-7K3Q",
            guestAn,
            tablesByNumber["B05"],
            now.AddHours(2),
            4,
            ReservationStatus.Confirmed,
            ReservationService.FormatNoteWithPreOrderedSetMenu("Bàn gần cửa sổ nếu có thể", setThuongHang),
            2_160_000m,
            "VNP-7K3Q-001",
            PaymentMethod.BankTransfer,
            DepositStatus.Paid,
            now.AddMinutes(-180),
            paidAt: now.AddMinutes(-178));

        // VD-4M2P: checked-in reservation on B04
        var resVd4m2p = await EnsureReservationAsync(
            "VD-4M2P",
            guestAn,
            tablesByNumber["B04"],
            now.AddMinutes(-35),
            2,
            ReservationStatus.Completed,
            null,
            400_000m,
            "VNP-4M2P-001",
            PaymentMethod.Card,
            DepositStatus.Paid,
            now.AddMinutes(-300),
            paidAt: now.AddMinutes(-298));

        // VD-9H1L: active 17-minute payment hold on B07
        await EnsureReservationAsync(
            "VD-9H1L",
            guestAn,
            tablesByNumber["B07"],
            VnSlotUtc(1, 19, 30),
            6,
            ReservationStatus.Pending,
            null,
            1_200_000m,
            "VNP-9H1L-001",
            PaymentMethod.BankTransfer,
            DepositStatus.Pending,
            now.AddMinutes(-3));

        // VD-2C8N: pending exception refund on V01
        await EnsureReservationAsync(
            "VD-2C8N",
            guestAn,
            tablesByNumber["V01"],
            now.AddHours(2),
            4,
            ReservationStatus.Cancelled,
            ReservationService.FormatNoteWithPreOrderedSetMenu(null, setHaiSan),
            1_500_000m,
            "VNP-2C8N-001",
            PaymentMethod.BankTransfer,
            DepositStatus.Forfeited,
            now.AddMinutes(-400),
            paidAt: now.AddMinutes(-398),
            cancelledAt: now.AddMinutes(-30),
            cancelledReason: "Khách báo thay đổi lịch công tác đột xuất");

        // VD-8P4K: second pending exception refund on B06
        await EnsureReservationAsync(
            "VD-8P4K",
            guestAn,
            tablesByNumber["B06"],
            now.AddHours(3),
            2,
            ReservationStatus.Cancelled,
            null,
            400_000m,
            "VNP-8P4K-001",
            PaymentMethod.Card,
            DepositStatus.Forfeited,
            now.AddMinutes(-320),
            paidAt: now.AddMinutes(-318),
            cancelledAt: now.AddMinutes(-25),
            cancelledReason: "Thay đổi lịch hẹn công việc ngoài dự kiến");

        // VD-5E1M: approved exception refund (shows in M3 Đã xử lý)
        await EnsureReservationAsync(
            "VD-5E1M",
            guestAn,
            tablesByNumber["V01"],
            VnSlotUtc(-2, 19, 0),
            4,
            ReservationStatus.Cancelled,
            ReservationService.FormatNoteWithPreOrderedSetMenu(null, setThuongHang),
            2_160_000m,
            "VNP-5E1M-001",
            PaymentMethod.BankTransfer,
            DepositStatus.Refunded,
            now.AddMinutes(-3_200),
            paidAt: now.AddMinutes(-3_198),
            cancelledAt: now.AddMinutes(-2_940),
            cancelledReason: $"Khách báo nhập viện đột xuất trước giờ hẹn | {ReservationGuestStatus.RefundApprovedPrefix} Xác nhận giấy nhập viện cấp cứu, chấp thuận hoàn ngoại lệ",
            refundAmount: 2_160_000m);

        // VD-6R2T: rejected exception refund (shows in M3 Đã xử lý)
        await EnsureReservationAsync(
            "VD-6R2T",
            guestAn,
            tablesByNumber["B06"],
            VnSlotUtc(-1, 20, 0),
            2,
            ReservationStatus.Cancelled,
            null,
            400_000m,
            "VNP-6R2T-001",
            PaymentMethod.Card,
            DepositStatus.Forfeited,
            now.AddMinutes(-1_700),
            paidAt: now.AddMinutes(-1_698),
            cancelledAt: now.AddMinutes(-1_500),
            cancelledReason: ReservationGuestStatus.BuildRefundRejectedReason(
                "Khách báo hủy sát giờ 30 phút do đổi địa điểm",
                "Hủy sát giờ vì lý do cá nhân, không thuộc diện bất khả kháng"),
            refundAmount: 0m);

        // Past completed reservations for historical invoices & feedbacks
        var resV02Today = await EnsureReservationAsync(
            "VD-H1V2",
            guestAn,
            tablesByNumber["V02"],
            TodayMinsAgo(135),
            4,
            ReservationStatus.Completed,
            null,
            1_500_000m,
            "VNP-H1V2-001",
            PaymentMethod.Card,
            DepositStatus.Paid,
            TodayMinsAgo(300),
            paidAt: TodayMinsAgo(298));

        var resC01Past = await EnsureReservationAsync(
            "VD-H2C1",
            guestAn,
            tablesByNumber["C01"],
            VnSlotUtc(-2, 18, 30),
            2,
            ReservationStatus.Completed,
            null,
            400_000m,
            "VNP-H2C1-001",
            PaymentMethod.BankTransfer,
            DepositStatus.Paid,
            VnSlotUtc(-3, 10, 0),
            paidAt: VnSlotUtc(-3, 10, 2));

        var resC03Past = await EnsureReservationAsync(
            "VD-H3C3",
            guestAn,
            tablesByNumber["C03"],
            VnSlotUtc(-4, 19, 30),
            4,
            ReservationStatus.Completed,
            null,
            800_000m,
            "VNP-H3C3-001",
            PaymentMethod.Card,
            DepositStatus.Paid,
            VnSlotUtc(-5, 14, 0),
            paidAt: VnSlotUtc(-5, 14, 2));

        var resV03Past = await EnsureReservationAsync(
            "VD-H4V3",
            guestAn,
            tablesByNumber["V03"],
            VnSlotUtc(-6, 12, 0),
            6,
            ReservationStatus.Completed,
            null,
            2_000_000m,
            "VNP-H4V3-001",
            PaymentMethod.BankTransfer,
            DepositStatus.Paid,
            VnSlotUtc(-7, 9, 0),
            paidAt: VnSlotUtc(-7, 9, 2));

        await context.SaveChangesAsync(ct);

        // 8. Orders, OrderItems, Invoices & Feedbacks (seed once if Orders is empty)
        if (!await context.Orders.AnyAsync(ct))
        {
            var supBaoNgu = itemsByName["Súp bào ngư thượng hạng"];
            var goiTomHum = itemsByName["Gỏi tôm hùm sốt chanh leo"];
            var wagyu = itemsByName["Bò Wagyu A5 sốt nấm Truffle"];
            var caTuyet = itemsByName["Cá tuyết nướng Miso mật ong"];
            var souffle = itemsByName["Bánh Soufflé sô-cô-la"];
            var pannaCotta = itemsByName["Panna cotta chanh dây"];
            var nuocKhoang = itemsByName["Nước khoáng có ga"];
            var vangDo = itemsByName["Vang đỏ (ly)"];

            // Active Order B03 (walk-in: Served appetizer/beverage, Warning SLA MainCourse, Hold Dessert)
            var ordB03 = new Order
            {
                Id = Guid.NewGuid(),
                TableId = tablesByNumber["B03"].Id,
                CreateById = mai.Id,
                Status = OrderStatus.Processing,
                OpenedAt = TodayMinsAgo(25)
            };
            await context.Orders.AddAsync(ordB03, ct);
            await context.OrderItems.AddRangeAsync(new[]
            {
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = ordB03.Id,
                    MenuItemId = goiTomHum.Id,
                    Quantity = 2,
                    UnitPrice = goiTomHum.Price,
                    Status = OrderItemStatus.Served,
                    FiredAt = TodayMinsAgo(24),
                    ServedAt = TodayMinsAgo(15),
                    ServedById = quan.Id
                },
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = ordB03.Id,
                    MenuItemId = nuocKhoang.Id,
                    Quantity = 2,
                    UnitPrice = nuocKhoang.Price,
                    Status = OrderItemStatus.Served,
                    FiredAt = TodayMinsAgo(24),
                    ServedAt = TodayMinsAgo(22),
                    ServedById = quan.Id
                },
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = ordB03.Id,
                    MenuItemId = caTuyet.Id,
                    Quantity = 2,
                    UnitPrice = caTuyet.Price,
                    Status = OrderItemStatus.Preparing,
                    FiredAt = now.AddMinutes(-17)
                },
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = ordB03.Id,
                    MenuItemId = pannaCotta.Id,
                    Quantity = 2,
                    UnitPrice = pannaCotta.Price,
                    Status = OrderItemStatus.Hold
                }
            }, ct);

            // Active Order B04 (checked-in reservation VD-4M2P with 400k deposit > 240k subtotal -> 0d settle demo)
            var ordB04 = new Order
            {
                Id = Guid.NewGuid(),
                TableId = tablesByNumber["B04"].Id,
                ReservationId = resVd4m2p.Id,
                CreateById = mai.Id,
                Status = OrderStatus.Processing,
                OpenedAt = TodayMinsAgo(35)
            };
            await context.Orders.AddAsync(ordB04, ct);
            await context.OrderItems.AddAsync(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = ordB04.Id,
                MenuItemId = nuocKhoang.Id,
                Quantity = 2,
                UnitPrice = nuocKhoang.Price,
                Status = OrderItemStatus.Served,
                FiredAt = TodayMinsAgo(34),
                ServedAt = TodayMinsAgo(30),
                ServedById = quan.Id
            }, ct);

            // Active Order B08 (includes a Remake item in KDS Làm lại lane + Wagyu preparing)
            var ordB08 = new Order
            {
                Id = Guid.NewGuid(),
                TableId = tablesByNumber["B08"].Id,
                CreateById = mai.Id,
                Status = OrderStatus.Processing,
                OpenedAt = TodayMinsAgo(40)
            };
            await context.Orders.AddAsync(ordB08, ct);
            await context.OrderItems.AddRangeAsync(new[]
            {
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = ordB08.Id,
                    MenuItemId = caTuyet.Id,
                    Quantity = 2,
                    UnitPrice = caTuyet.Price,
                    Status = OrderItemStatus.Preparing,
                    Note = "Chín đều mặt da | [LÀM LẠI: Chưa đạt độ giòn da]",
                    IsRush = true,
                    FiredAt = now.AddMinutes(-18)
                },
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = ordB08.Id,
                    MenuItemId = wagyu.Id,
                    Quantity = 4,
                    UnitPrice = wagyu.Price,
                    Status = OrderItemStatus.Preparing,
                    Note = "Medium rare",
                    FiredAt = now.AddMinutes(-12)
                }
            }, ct);

            async Task<Invoice> CreateSettledOrderAsync(
                Table table,
                Reservation? reservation,
                DateTime openedAt,
                DateTime closedAt,
                PaymentMethod paymentMethod,
                decimal deductedDeposit,
                params (MenuItem Item, int Qty, string? Note)[] lines)
            {
                var order = new Order
                {
                    Id = Guid.NewGuid(),
                    TableId = table.Id,
                    ReservationId = reservation?.Id,
                    CreateById = mai.Id,
                    Status = OrderStatus.Completed,
                    OpenedAt = openedAt,
                    ClosedAt = closedAt
                };
                await context.Orders.AddAsync(order, ct);

                decimal subtotal = 0m;
                foreach (var (menuItem, qty, lineNote) in lines)
                {
                    subtotal += menuItem.Price * qty;
                    await context.OrderItems.AddAsync(new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order.Id,
                        MenuItemId = menuItem.Id,
                        Quantity = qty,
                        UnitPrice = menuItem.Price,
                        Status = OrderItemStatus.Served,
                        Note = lineNote,
                        FiredAt = openedAt.AddMinutes(5),
                        ServedAt = closedAt.AddMinutes(-5),
                        ServedById = quan.Id
                    }, ct);
                }

                var serviceCharge = Math.Round(subtotal * 0.05m, 2);
                var vatAmount = Math.Round((subtotal + serviceCharge) * 0.10m, 2);
                var invoice = new Invoice
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    SettleById = ha.Id,
                    Subtotal = subtotal,
                    ServiceCharge = serviceCharge,
                    VatAmount = vatAmount,
                    DeductedDeposit = deductedDeposit,
                    PaymentMethod = paymentMethod,
                    IsPaid = true,
                    CreatedAt = closedAt
                };
                await context.Invoices.AddAsync(invoice, ct);
                return invoice;
            }

            // Completed #1 (Today, MainHall B01, walk-in, paid) -> shows in Hóa đơn hôm nay & Pass history
            await CreateSettledOrderAsync(
                tablesByNumber["B01"],
                null,
                TodayMinsAgo(75),
                TodayMinsAgo(30),
                PaymentMethod.BankTransfer,
                0m,
                (supBaoNgu, 2, null),
                (caTuyet, 2, "Da giòn"),
                (souffle, 2, null));

            // Completed #2 (Today, VIP V02, VD-H1V2, paid)
            await CreateSettledOrderAsync(
                tablesByNumber["V02"],
                resV02Today,
                TodayMinsAgo(130),
                TodayMinsAgo(65),
                PaymentMethod.Card,
                1_500_000m,
                (wagyu, 4, "Medium"),
                (vangDo, 2, null));

            // Completed #3 (2 days ago, Balcony C01, VD-H2C1)
            await CreateSettledOrderAsync(
                tablesByNumber["C01"],
                resC01Past,
                VnSlotUtc(-2, 18, 35),
                VnSlotUtc(-2, 20, 10),
                PaymentMethod.BankTransfer,
                400_000m,
                (goiTomHum, 2, null),
                (caTuyet, 2, null),
                (pannaCotta, 2, null));

            // Completed #4 (4 days ago, Balcony C03, VD-H3C3)
            await CreateSettledOrderAsync(
                tablesByNumber["C03"],
                resC03Past,
                VnSlotUtc(-4, 19, 35),
                VnSlotUtc(-4, 21, 15),
                PaymentMethod.Card,
                800_000m,
                (supBaoNgu, 4, null),
                (wagyu, 2, null),
                (nuocKhoang, 4, null));

            // Completed #5 (6 days ago lunch, VIP V03, VD-H4V3)
            await CreateSettledOrderAsync(
                tablesByNumber["V03"],
                resV03Past,
                VnSlotUtc(-6, 12, 5),
                VnSlotUtc(-6, 13, 50),
                PaymentMethod.Cash,
                2_000_000m,
                (goiTomHum, 4, null),
                (wagyu, 4, null),
                (souffle, 4, null),
                (vangDo, 4, null));

            await context.SaveChangesAsync(ct);

            // 9. Feedbacks (3 feedbacks attached to completed reservations)
            if (!await context.Feedbacks.AnyAsync(ct))
            {
                await context.Feedbacks.AddRangeAsync(new[]
                {
                    new Feedback
                    {
                        Id = Guid.NewGuid(),
                        ReservationId = resV02Today.Id,
                        Rating = 5,
                        Comment = "Món ăn lên đúng nhịp và phục vụ chu đáo.",
                        CreatedAt = TodayMinsAgo(45)
                    },
                    new Feedback
                    {
                        Id = Guid.NewGuid(),
                        ReservationId = resC01Past.Id,
                        Rating = 5,
                        Comment = "Không gian ban công lãng mạn, cá tuyết nướng rất ngon.",
                        CreatedAt = VnSlotUtc(-2, 21, 0)
                    },
                    new Feedback
                    {
                        Id = Guid.NewGuid(),
                        ReservationId = resC03Past.Id,
                        Rating = 4,
                        Comment = "Phục vụ nhanh nhẹn, món khai vị tròn vị.",
                        CreatedAt = VnSlotUtc(-4, 22, 0)
                    }
                }, ct);
                await context.SaveChangesAsync(ct);
            }
        }

        // Ensure seeded demo table B04 is in PaymentPending when its active VD-4M2P order is fully served
        var b04Table = tablesByNumber["B04"];
        if (b04Table.Status == TableStatus.Occupied && !b04Table.CheckoutRequestedAt.HasValue)
        {
            var b04ActiveOrder = await context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o =>
                    o.TableId == b04Table.Id &&
                    o.ReservationId == resVd4m2p.Id &&
                    o.Status == OrderStatus.Processing, ct);

            if (b04ActiveOrder != null &&
                b04ActiveOrder.OrderItems.Any() &&
                b04ActiveOrder.OrderItems.All(oi => oi.Status == OrderItemStatus.Served || oi.Status == OrderItemStatus.Cancelled))
            {
                b04Table.Status = TableStatus.PaymentPending;
                b04Table.CheckoutRequestedAt = TodayMinsAgo(7);
                await context.SaveChangesAsync(ct);
            }
        }
    }
}
