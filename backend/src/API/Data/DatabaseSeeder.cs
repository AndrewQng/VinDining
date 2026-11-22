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
            ("B01", 2, TableZone.MainHall, 51, 66),
            ("B02", 2, TableZone.MainHall, 211, 66),
            ("B03", 4, TableZone.MainHall, 363, 63),
            ("B04", 4, TableZone.MainHall, 523, 63),
            ("B05", 4, TableZone.MainHall, 43, 283),
            ("B06", 6, TableZone.MainHall, 195, 280),
            ("B07", 6, TableZone.MainHall, 355, 280),
            ("B08", 8, TableZone.MainHall, 511, 277),
            ("V01", 6, TableZone.VIP, 80, 80),
            ("V02", 8, TableZone.VIP, 240, 80),
            ("V03", 10, TableZone.VIP, 160, 220),
            ("C01", 2, TableZone.Balcony, 80, 80),
            ("C02", 2, TableZone.Balcony, 220, 80),
            ("C03", 4, TableZone.Balcony, 80, 200),
            ("C04", 4, TableZone.Balcony, 220, 200),
        };

        foreach (var (num, cap, zone, posX, posY) in tableSpecs)
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
                    Status = TableStatus.Available,
                    PosX = posX,
                    PosY = posY,
                    IsActive = true,
                    CreatedAt = now
                };
                await context.Tables.AddAsync(table, ct);
            }
            else if (isDevelopment &&
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
        }
        await context.SaveChangesAsync(ct);
    }
}
