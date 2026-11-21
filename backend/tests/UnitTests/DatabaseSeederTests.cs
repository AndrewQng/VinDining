using API.Data;
using API.Models.Entities;
using API.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace UnitTests;

public class DatabaseSeederTests
{
    private sealed class StubHostEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "API";
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }

    private sealed class RecordingLoggerProvider : ILoggerProvider
    {
        public List<string> Messages { get; } = new();

        public ILogger CreateLogger(string categoryName) => new RecordingLogger(Messages);

        public void Dispose() { }

        private sealed class RecordingLogger(List<string> messages) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(
                LogLevel logLevel,
                EventId eventId,
                TState state,
                Exception? exception,
                Func<TState, Exception?, string> formatter)
            {
                messages.Add(formatter(state, exception));
            }
        }
    }

    private static ServiceProvider BuildProvider(string dbName, string environmentName, RecordingLoggerProvider loggerProvider)
    {
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(dbName));
        services.AddScoped<IPasswordHasher<Staff>, PasswordHasher<Staff>>();
        services.AddSingleton<IHostEnvironment>(new StubHostEnvironment(environmentName));
        services.AddLogging(builder => builder.AddProvider(loggerProvider));
        return services.BuildServiceProvider();
    }

    [Fact]
    public async Task SeedAsync_SeedsOnlySection10Guest_AndSyncsStaleDemoDataInDevelopmentOnly()
    {
        var dbName = $"SeederTest_{Guid.NewGuid():N}";
        var prodLogs = new RecordingLoggerProvider();

        // 1. Initial seed
        using (var initProvider = BuildProvider(dbName, Environments.Development, prodLogs))
        {
            await DatabaseSeeder.SeedAsync(initProvider);

            await using var scope = initProvider.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var guests = await db.Guests.AsNoTracking().ToListAsync();
            var guest = Assert.Single(guests);
            Assert.Equal("Nguyễn Văn An", guest.FullName);
            Assert.Equal("0901234567", guest.PhoneNumber);
            Assert.Equal("an.nguyen@email.com", guest.Email);

            var reservations = await db.Reservations.AsNoTracking().ToListAsync();
            Assert.All(reservations, r => Assert.Equal(guest.Id, r.GuestId));

            // Mutate demo rows to simulate a pre-20/11 database
            var b01 = await db.Tables.FirstAsync(t => t.TableNumber == "B01");
            b01.Capacity = 10;
            b01.Zone = TableZone.VIP;
            b01.PosX = 999;
            b01.PosY = 999;

            var soup = await db.MenuItems.FirstAsync(m => m.Name == "Súp bào ngư thượng hạng");
            soup.Price = 111_000m;
            soup.PrepTimeMinutes = 99;

            var panna = await db.MenuItems.FirstAsync(m => m.Name == "Panna cotta chanh dây");
            var setThuongHang = await db.TastingMenus
                .Include(tm => tm.TastingMenuItems)
                .FirstAsync(tm => tm.Name == "Set Menu Thượng Hạng");
            setThuongHang.Price = 999_000m;
            setThuongHang.Description = "Old description";
            setThuongHang.ImageUrl = "old.jpg";
            var dessertCourse = setThuongHang.TastingMenuItems.First(i => i.CourseOrder == 3);
            dessertCourse.MenuItemId = panna.Id;

            await db.SaveChangesAsync();
        }

        // 2. Non-Development does NOT overwrite existing rows
        using (var prodProvider = BuildProvider(dbName, Environments.Production, prodLogs))
        {
            await DatabaseSeeder.SeedAsync(prodProvider);

            await using var scope = prodProvider.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var b01 = await db.Tables.AsNoTracking().FirstAsync(t => t.TableNumber == "B01");
            var soup = await db.MenuItems.AsNoTracking().FirstAsync(m => m.Name == "Súp bào ngư thượng hạng");
            var setThuongHang = await db.TastingMenus.AsNoTracking().FirstAsync(tm => tm.Name == "Set Menu Thượng Hạng");

            Assert.Equal(10, b01.Capacity);
            Assert.Equal(111_000m, soup.Price);
            Assert.Equal(999_000m, setThuongHang.Price);
        }

        // 3. Development brings existing demo rows back to seed values, logs changes, and deletes nothing
        var devLogs = new RecordingLoggerProvider();
        using (var devProvider = BuildProvider(dbName, Environments.Development, devLogs))
        {
            await DatabaseSeeder.SeedAsync(devProvider);

            await using var scope = devProvider.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var b01 = await db.Tables.AsNoTracking().FirstAsync(t => t.TableNumber == "B01");
            Assert.Equal(2, b01.Capacity);
            Assert.Equal(TableZone.MainHall, b01.Zone);
            Assert.Equal(51, b01.PosX);
            Assert.Equal(66, b01.PosY);

            var soup = await db.MenuItems.AsNoTracking().FirstAsync(m => m.Name == "Súp bào ngư thượng hạng");
            Assert.Equal(350_000m, soup.Price);
            Assert.Equal(12, soup.PrepTimeMinutes);

            var souffle = await db.MenuItems.AsNoTracking().FirstAsync(m => m.Name == "Bánh Soufflé sô-cô-la");
            var setThuongHang = await db.TastingMenus
                .Include(tm => tm.TastingMenuItems)
                .AsNoTracking()
                .FirstAsync(tm => tm.Name == "Set Menu Thượng Hạng");
            Assert.Equal(1_800_000m, setThuongHang.Price);
            Assert.Equal("Thực đơn nếm thử 3 Course tinh tuyển.", setThuongHang.Description);
            Assert.Equal("set_thuong_hang.jpg", setThuongHang.ImageUrl);
            Assert.Equal(3, setThuongHang.TastingMenuItems.Count);
            Assert.Equal(souffle.Id, setThuongHang.TastingMenuItems.Single(i => i.CourseOrder == 3).MenuItemId);

            Assert.Equal(15, await db.Tables.CountAsync());
            Assert.Equal(9, await db.MenuItems.CountAsync());
            Assert.Equal(4, await db.TastingMenus.CountAsync());
            Assert.Contains(devLogs.Messages, m => m.Contains("B01"));
            Assert.Contains(devLogs.Messages, m => m.Contains("Súp bào ngư thượng hạng"));
            Assert.Contains(devLogs.Messages, m => m.Contains("Set Menu Thượng Hạng"));
        }
    }
}
