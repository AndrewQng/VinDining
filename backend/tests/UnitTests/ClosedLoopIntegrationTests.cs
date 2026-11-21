using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using API.Data;
using API.DTOs;
using API.Models.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace UnitTests;

public class ClosedLoopIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private sealed class VinDiningApiFactory : WebApplicationFactory<Program>
    {
        private readonly string _dbName = $"VinDiningE2E_{Guid.NewGuid():N}";

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("Jwt:Secret", "IntegrationTestJwtSecretKey_Minimum32CharsLong2026!");
            builder.ConfigureServices(services =>
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase(_dbName));
            });
        }
    }

    [Fact]
    public async Task EndToEnd_ClosedLoopHttpFlow_AndRbacAndMiddlewareErrorCodes_Succeed()
    {
        await using var factory = new VinDiningApiFactory();
        using var client = factory.CreateClient();

        // 0. Health check & Seed sample restaurant data
        var healthRes = await client.GetAsync("/api/health");
        Assert.Equal(HttpStatusCode.OK, healthRes.StatusCode);

        var seedRes = await client.PostAsync("/api/testing/seed", null);
        Assert.Equal(HttpStatusCode.OK, seedRes.StatusCode);

        // 1. Verify 401 Unauthorized on Admin endpoint without JWT
        var unauthAdmin = await client.GetAsync("/api/admin/staff");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthAdmin.StatusCode);

        // 2. Login as Waitstaff, Expediter, and Admin
        var waitLogin = await (await client.PostAsJsonAsync("/api/auth/login", new LoginDto("waitstaff_test", "hash123")))
            .Content.ReadFromJsonAsync<AuthResponseDto>(JsonOpts);
        var expLogin = await (await client.PostAsJsonAsync("/api/auth/login", new LoginDto("expediter_test", "hash123")))
            .Content.ReadFromJsonAsync<AuthResponseDto>(JsonOpts);
        var adminLogin = await (await client.PostAsJsonAsync("/api/auth/login", new LoginDto("admin_test", "hash123")))
            .Content.ReadFromJsonAsync<AuthResponseDto>(JsonOpts);

        Assert.NotNull(waitLogin);
        Assert.NotNull(expLogin);
        Assert.NotNull(adminLogin);

        // 3. Verify 403 Forbidden when Waitstaff accesses Admin endpoint
        using var waitReq = new HttpRequestMessage(HttpMethod.Get, "/api/admin/staff");
        waitReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin!.Token);
        var forbiddenAdmin = await client.SendAsync(waitReq);
        Assert.Equal(HttpStatusCode.Forbidden, forbiddenAdmin.StatusCode);

        // 4. Admin creates a new table on Floor Plan & updates layout coordinates (VIN-19)
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminLogin!.Token);
        var createTableRes = await client.PostAsJsonAsync("/api/admin/tables", new CreateTableDto("VIP-88", 6, TableZone.VIP, 120, 240));
        Assert.Equal(HttpStatusCode.Created, createTableRes.StatusCode);
        var createTableJson = await createTableRes.Content.ReadFromJsonAsync<JsonElement>();
        var vipTableId = createTableJson.GetProperty("tableId").GetGuid();

        var layoutRes = await client.PutAsJsonAsync("/api/admin/tables/layout", new UpdateFloorPlanDto(new List<TablePositionDto>
        {
            new(vipTableId, 300, 450)
        }));
        Assert.Equal(HttpStatusCode.OK, layoutRes.StatusCode);

        var floorPlan = await client.GetFromJsonAsync<List<TableDto>>("/api/tables", JsonOpts);
        var persistedTable = floorPlan!.Single(t => t.Id == vipTableId);
        Assert.Equal(300, persistedTable.PosX);
        Assert.Equal(450, persistedTable.PosY);

        // 5. Guest books VIP-88 online -> 409 Conflict on duplicate booking -> VNPAY IPN confirms deposit (VIN-17)
        client.DefaultRequestHeaders.Authorization = null;
        var diningTime = DateTime.UtcNow.AddHours(6);
        var createBookingDto = new CreateReservationDto("Đặng Quốc Khánh", "0903334444", "khanh@vn.vn", vipTableId, diningTime, 2, "Bàn cạnh cửa sổ");

        var bookingHttp = await client.PostAsJsonAsync("/api/reservations", createBookingDto);
        Assert.Equal(HttpStatusCode.Created, bookingHttp.StatusCode);
        var booking = await bookingHttp.Content.ReadFromJsonAsync<CreateReservationResultDto>(JsonOpts);
        Assert.NotNull(booking);
        Assert.Equal(1_000_000m, booking!.DepositAmount);

        // Second concurrent booking for same table & time -> 409 Conflict via GlobalExceptionMiddleware!
        var conflictHttp = await client.PostAsJsonAsync("/api/reservations", createBookingDto with { PhoneNumber = "0909990000" });
        Assert.Equal(HttpStatusCode.Conflict, conflictHttp.StatusCode);
        var conflictErr = await conflictHttp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(conflictErr.GetProperty("success").GetBoolean());
        Assert.Equal(409, conflictErr.GetProperty("statusCode").GetInt32());

        // VNPAY IPN callback confirms deposit
        var ipnForm = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["vnp_TxnRef"] = booking.BookingCode,
            ["vnp_Amount"] = "100000000",
            ["vnp_ResponseCode"] = "00",
            ["vnp_TransactionNo"] = "VNP12345678"
        });
        var ipnRes = await client.PostAsync("/api/payments/vnpay-ipn", ipnForm);
        Assert.Equal(HttpStatusCode.OK, ipnRes.StatusCode);

        // QR E-Menu & Service Call BEFORE check-in must be rejected with 400 BadRequest (UC-U2 1a)
        var preCheckInQrRes = await client.GetAsync($"/api/menu/table/{vipTableId}");
        Assert.Equal(HttpStatusCode.BadRequest, preCheckInQrRes.StatusCode);
        var preCheckInCallRes = await client.PostAsJsonAsync($"/api/tables/{vipTableId}/call-service", new ServiceCallDto(vipTableId, "Gọi phục vụ"));
        Assert.Equal(HttpStatusCode.BadRequest, preCheckInCallRes.StatusCode);

        // 6. Waitstaff checks in guest -> Guest views QR E-Menu & sends Service Call (VIN-34)
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin.Token);
        var checkInRes = await client.PostAsJsonAsync($"/api/tables/{vipTableId}/check-in", new CheckInDto(BookingCode: booking.BookingCode));
        Assert.Equal(HttpStatusCode.OK, checkInRes.StatusCode);

        client.DefaultRequestHeaders.Authorization = null;
        var qrMenuRes = await client.GetAsync($"/api/menu/table/{vipTableId}");
        Assert.Equal(HttpStatusCode.OK, qrMenuRes.StatusCode);

        var callRes = await client.PostAsJsonAsync($"/api/tables/{vipTableId}/call-service", new ServiceCallDto(vipTableId, "Châm nước", "Thêm đá viên"));
        Assert.Equal(HttpStatusCode.OK, callRes.StatusCode);

        // Anonymous cannot read active staff service calls (401), Waitstaff can (200)
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/service-calls/active")).StatusCode);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin.Token);
        var activeCalls = await client.GetFromJsonAsync<List<ServiceCallResponseDto>>("/api/service-calls/active", JsonOpts);
        Assert.Contains(activeCalls!, c => c.TableId == vipTableId);

        // 7. Waitstaff creates order via singular `/api/order` alias & adds item (VIN-20, VIN-35)
        var appetizerId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"); // 350,000
        var mainCourseId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"); // 1,200,000
        var dessertId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"); // 250,000

        var createOrderHttp = await client.PostAsJsonAsync("/api/order", new CreateOrderDto(
            vipTableId,
            Items: new List<OrderItemRequestDto>
            {
                new(appetizerId, 2, "Không hành"),
                new(mainCourseId, 2, "Medium rare")
            }));
        Assert.Equal(HttpStatusCode.Created, createOrderHttp.StatusCode);
        var createdOrderJson = await createOrderHttp.Content.ReadFromJsonAsync<JsonElement>();
        var orderId = createdOrderJson.GetProperty("orderId").GetGuid();

        // Hands-free wall KDS endpoint works without JWT
        client.DefaultRequestHeaders.Authorization = null;
        var kdsPendingRes = await client.GetAsync("/api/orders/kitchen/pending");
        Assert.Equal(HttpStatusCode.OK, kdsPendingRes.StatusCode);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin.Token);
        var addDessertRes = await client.PostAsJsonAsync($"/api/orders/{orderId}/items", new AddItemsDto(new List<OrderItemRequestDto>
        {
            new(dessertId, 2)
        }));
        Assert.Equal(HttpStatusCode.OK, addDessertRes.StatusCode);

        var orderDetail = await client.GetFromJsonAsync<OrderDetailDto>($"/api/order/{orderId}", JsonOpts);
        var appItemId = orderDetail!.Items.Single(i => i.MenuItemId == appetizerId).Id;
        var mainItemId = orderDetail.Items.Single(i => i.MenuItemId == mainCourseId).Id;
        var desItemId = orderDetail.Items.Single(i => i.MenuItemId == dessertId).Id;

        // Waitstaff trying to ConfirmServed or POST Remake gets 403 Forbidden!
        var waitServeRes = await client.PatchAsync($"/api/order/{orderId}/items/{appItemId}/serve", null);
        Assert.Equal(HttpStatusCode.Forbidden, waitServeRes.StatusCode);
        var waitRemakeRes = await client.PostAsync($"/api/orders/{orderId}/items/{appItemId}/remake", null);
        Assert.Equal(HttpStatusCode.Forbidden, waitRemakeRes.StatusCode);

        // 8. Expediter serves Appetizer; Waitstaff fires MainCourse & cancels Dessert; Expediter tests POST remake then serves MainCourse
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expLogin!.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsync($"/api/order/{orderId}/items/{appItemId}/serve", null)).StatusCode);

        // Expediter cannot fire courses (Waitstaff/Manager only -> 403)
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync($"/api/order/{orderId}/fire-course", new FireCourseDto(CourseType.MainCourse))).StatusCode);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/order/{orderId}/fire-course", new FireCourseDto(CourseType.MainCourse))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsJsonAsync($"/api/order/{orderId}/items/{desItemId}/cancel", new CancelItemDto("Khách no"))).StatusCode);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expLogin.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/orders/{orderId}/items/{mainItemId}/remake", new RemakeItemDto("Trình bày lại đĩa"))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsync($"/api/order/{orderId}/items/{mainItemId}/serve", null)).StatusCode);

        // 9. Waitstaff requests Checkout -> Cashier/Admin Previews & Settles Invoice -> Clean Table -> Guest Feedback -> Manager Aliases
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync($"/api/tables/{vipTableId}/request-checkout", null)).StatusCode);

        // Expediter cannot settle invoice (403 Forbidden)
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expLogin.Token);
        Assert.Equal(HttpStatusCode.Forbidden, (await client.PostAsJsonAsync("/api/invoice/settle", new SettleInvoiceDto(orderId, PaymentMethod.BankTransfer))).StatusCode);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminLogin.Token);
        var preview = await client.GetFromJsonAsync<InvoicePreviewDto>($"/api/invoice/preview/{vipTableId}", JsonOpts);
        // Subtotal = 2*350k + 2*1,200k = 3,100,000 | SC 5% = 155,000 | VAT 10% = 325,500 | Gross = 3,580,500 | Deposit = 1,000,000 -> Final = 2,580,500
        Assert.Equal(3_100_000m, preview!.Subtotal);
        Assert.Equal(2_580_500m, preview.FinalAmount);

        var settleRes = await client.PostAsJsonAsync("/api/invoice/settle", new SettleInvoiceDto(orderId, PaymentMethod.BankTransfer));
        Assert.Equal(HttpStatusCode.OK, settleRes.StatusCode);
        var settleJson = await settleRes.Content.ReadFromJsonAsync<JsonElement>();
        var invoiceId = settleJson.GetProperty("invoiceId").GetGuid();

        // Clean table back to Available
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsJsonAsync($"/api/tables/{vipTableId}/status", new UpdateTableStatusDto(TableStatus.Available))).StatusCode);

        // Guest submits 5-star feedback, while anonymous GET /api/feedbacks is blocked (401)
        client.DefaultRequestHeaders.Authorization = null;
        var fbRes = await client.PostAsJsonAsync("/api/feedbacks", new SubmitFeedbackDto(invoiceId, 5, "Dịch vụ xuất sắc!"));
        Assert.Equal(HttpStatusCode.Created, fbRes.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/feedbacks")).StatusCode);

        // Admin/Manager reads Dashboard, Export CSV & `/api/manager/*` spec route aliases
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminLogin.Token);
        var dashboardRes = await client.GetAsync("/api/admin/reports/dashboard");
        Assert.Equal(HttpStatusCode.OK, dashboardRes.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/manager/reports/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/manager/menu-items")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/manager/tasting-menus")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/manager/staff")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/manager/feedbacks")).StatusCode);

        var exportRes = await client.GetAsync("/api/admin/reports/export");
        Assert.Equal(HttpStatusCode.OK, exportRes.StatusCode);
        var exportBytes = await exportRes.Content.ReadAsByteArrayAsync();
        Assert.True(exportBytes.Length > 100);

        // 10. Verify 404 NotFound & 423 Locked status mappings in GlobalExceptionMiddleware (VIN-10)
        var notFoundRes = await client.GetAsync($"/api/orders/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, notFoundRes.StatusCode);

        // Create disposable staff & trigger 5 failed logins -> 423 Locked
        await client.PostAsJsonAsync("/api/admin/staff", new CreateStaffDto("Temp Staff", "lock_http_test", "Secret123", "lock_http@vn.vn", StaffRole.Waitstaff));
        client.DefaultRequestHeaders.Authorization = null;
        for (int i = 0; i < 5; i++)
        {
            var failRes = await client.PostAsJsonAsync("/api/auth/login", new LoginDto("lock_http_test", "WrongPass"));
            Assert.Equal(HttpStatusCode.Unauthorized, failRes.StatusCode);
        }
        var lockedRes = await client.PostAsJsonAsync("/api/auth/login", new LoginDto("lock_http_test", "Secret123"));
        Assert.Equal((HttpStatusCode)423, lockedRes.StatusCode);
    }

    [Fact]
    public async Task PreOrderedSetMenuAutoOrderOnCheckIn_AndWalkInPaidReceiptFeedback_SucceedOverHttp()
    {
        await using var factory = new VinDiningApiFactory();
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/api/testing/seed", null)).StatusCode);

        var waitLogin = await (await client.PostAsJsonAsync("/api/auth/login", new LoginDto("waitstaff_test", "hash123")))
            .Content.ReadFromJsonAsync<AuthResponseDto>(JsonOpts);
        var expLogin = await (await client.PostAsJsonAsync("/api/auth/login", new LoginDto("expediter_test", "hash123")))
            .Content.ReadFromJsonAsync<AuthResponseDto>(JsonOpts);
        var adminLogin = await (await client.PostAsJsonAsync("/api/auth/login", new LoginDto("admin_test", "hash123")))
            .Content.ReadFromJsonAsync<AuthResponseDto>(JsonOpts);

        var appetizerId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var mainCourseId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var dessertId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        var walkInTableId = Guid.Parse("88888888-8888-8888-8888-888888888888"); // M-01 (Capacity 2)

        // 1. Manager creates Set Menu & a fresh B-05 table
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminLogin!.Token);
        var createTmRes = await client.PostAsJsonAsync("/api/manager/tasting-menus", new CreateTastingMenuDto(
            "Set Menu Thượng Hạng",
            1_800_000m,
            "Thực đơn 3 course",
            new List<CreateTastingMenuItemDto>
            {
                new(appetizerId, CourseType.Appetizer, 1),
                new(mainCourseId, CourseType.MainCourse, 2),
                new(dessertId, CourseType.Dessert, 3)
            }));
        Assert.Equal(HttpStatusCode.Created, createTmRes.StatusCode);
        var tastingMenuId = (await createTmRes.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var createB05Res = await client.PostAsJsonAsync("/api/manager/tables", new CreateTableDto("B-05", 4, TableZone.MainHall, 200, 200));
        var tableB05Id = (await createB05Res.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("tableId").GetGuid();

        // 2. Guest books B-05 for 4 guests with pre-ordered Set Menu -> 30% * 1.8M * 4 = 2,160,000 VND deposit
        client.DefaultRequestHeaders.Authorization = null;
        var bookingRes = await client.PostAsJsonAsync("/api/reservations", new CreateReservationDto(
            "Nguyễn Văn An",
            "0901234567",
            "an.nguyen@email.com",
            tableB05Id,
            DateTime.UtcNow.AddHours(3),
            4,
            "Không tiêu đen",
            tastingMenuId));
        Assert.Equal(HttpStatusCode.Created, bookingRes.StatusCode);
        var booking = await bookingRes.Content.ReadFromJsonAsync<CreateReservationResultDto>(JsonOpts);
        Assert.Equal(2_160_000m, booking!.DepositAmount);

        var ipnForm = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["vnp_TxnRef"] = booking.BookingCode,
            ["vnp_Amount"] = "216000000",
            ["vnp_ResponseCode"] = "00",
            ["vnp_TransactionNo"] = "VNP7K3Q"
        });
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/api/payments/vnpay-ipn", ipnForm)).StatusCode);

        // 3. Waitstaff checks in B-05 -> Order is auto-created & Course 1 is immediately on Wall KDS!
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin!.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/tables/{tableB05Id}/check-in", new CheckInDto(BookingCode: booking.BookingCode))).StatusCode);

        var activeOrder = await client.GetFromJsonAsync<OrderDetailDto>($"/api/orders/table/{tableB05Id}", JsonOpts);
        Assert.NotNull(activeOrder);
        Assert.Equal(4, activeOrder!.Items.Count);

        client.DefaultRequestHeaders.Authorization = null;
        var kdsQueue = await client.GetFromJsonAsync<List<OrderItemDetailDto>>("/api/orders/kitchen/pending", JsonOpts);
        Assert.Contains(kdsQueue!, k => k.OrderId == activeOrder.Id && k.MenuItemId == appetizerId && k.Quantity == 4);

        // 4. Walk-in guest on M-01 dines, settles receipt, and submits Feedback via `/api/feedbacks`
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/tables/{walkInTableId}/walk-in", new WalkInDto("", "", 2))).StatusCode);

        var walkOrderRes = await client.PostAsJsonAsync("/api/orders", new CreateOrderDto(
            walkInTableId,
            Items: new List<OrderItemRequestDto> { new(appetizerId, 2) }));
        var walkOrderId = (await walkOrderRes.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("orderId").GetGuid();
        var walkOrderDetail = await client.GetFromJsonAsync<OrderDetailDto>($"/api/orders/{walkOrderId}", JsonOpts);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expLogin!.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsync($"/api/orders/{walkOrderId}/items/{walkOrderDetail!.Items.Single().Id}/serve", null)).StatusCode);

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminLogin.Token);
        var settleWalkRes = await client.PostAsJsonAsync($"/api/invoices/{walkInTableId}/settle", new SettleInvoiceDto(walkOrderId, PaymentMethod.Cash));
        Assert.Equal(HttpStatusCode.OK, settleWalkRes.StatusCode);
        var walkInvoiceId = (await settleWalkRes.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("invoiceId").GetGuid();

        // Guest scans paid receipt QR and posts feedback -> 201 Created; duplicate -> 409 Conflict!
        client.DefaultRequestHeaders.Authorization = null;
        var walkFbRes = await client.PostAsJsonAsync("/api/feedbacks", new SubmitFeedbackDto(walkInvoiceId, 5, "Món khai vị tuyệt vời"));
        Assert.Equal(HttpStatusCode.Created, walkFbRes.StatusCode);
        var dupWalkFbRes = await client.PostAsJsonAsync("/api/feedbacks", new SubmitFeedbackDto(walkInvoiceId, 5, "Gửi trùng"));
        Assert.Equal(HttpStatusCode.Conflict, dupWalkFbRes.StatusCode);

        // Verify Manager reservation list & dashboard TotalReservations are NOT inflated by WALKIN- anchor!
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminLogin.Token);
        var reservationsList = await client.GetFromJsonAsync<List<ReservationDetailDto>>("/api/reservations", JsonOpts);
        Assert.DoesNotContain(reservationsList!, r => r.BookingCode.StartsWith("WALKIN-"));

        var metrics = await client.GetFromJsonAsync<DashboardMetricsDto>("/api/manager/reports/dashboard", JsonOpts);
        Assert.Equal(2, metrics!.TotalReservations); // Seeded BOOK-VIP01 + Nguyễn Văn An B-05 only!
        Assert.Equal(5.0, metrics.AverageRating);

        // Verify zone & shift query filtering on /api/manager/reports/dashboard and /api/manager/reports/export
        var mainHallMetrics = await client.GetFromJsonAsync<DashboardMetricsDto>("/api/manager/reports/dashboard?zone=MainHall", JsonOpts);
        Assert.NotNull(mainHallMetrics);
        Assert.Equal(1, mainHallMetrics!.TotalReservations); // Only B-05 (MainHall), excludes BOOK-VIP01 (VIP)

        var balconyMetrics = await client.GetFromJsonAsync<DashboardMetricsDto>("/api/manager/reports/dashboard?zone=Balcony", JsonOpts);
        Assert.NotNull(balconyMetrics);
        Assert.Equal(0m, balconyMetrics!.TotalRevenue);
        Assert.Equal(0, balconyMetrics.TotalOrders);

        var invalidShiftRes = await client.GetAsync("/api/manager/reports/dashboard?shift=InvalidShift");
        Assert.Equal(HttpStatusCode.BadRequest, invalidShiftRes.StatusCode);

        var filteredExportRes = await client.GetAsync("/api/manager/reports/export?zone=MainHall&shift=Lunch");
        Assert.Equal(HttpStatusCode.OK, filteredExportRes.StatusCode);
    }

    [Fact]
    public async Task FrontendContractAlignment_OpenQuestions10To15_AndJsonPayloads_SucceedOverHttp()
    {
        await using var factory = new VinDiningApiFactory();
        using var client = factory.CreateClient();

        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync("/api/testing/seed", null)).StatusCode);

        // Verify residual-safe Set Menu unit price allocation (#13)
        var allocated = API.Services.InvoiceService.AllocateSetMenuUnitPrices(1_800_000m, new decimal[] { 350_000m, 1_250_000m, 220_000m });
        Assert.Equal(3, allocated.Count);
        Assert.Equal(1_800_000m, allocated.Sum());

        // Login with email or username and verify nested user profile
        var waitAuthRes = await client.PostAsJsonAsync("/api/auth/login", new LoginDto("waitstaff_test", "hash123"));
        var waitAuthJson = await waitAuthRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Waitstaff", waitAuthJson.GetProperty("user").GetProperty("role").GetString());
        var waitToken = waitAuthJson.GetProperty("token").GetString()!;

        var expAuth = await (await client.PostAsJsonAsync("/api/auth/login", new LoginDto("expediter_test", "hash123")))
            .Content.ReadFromJsonAsync<AuthResponseDto>(JsonOpts);
        var adminAuthJson = await (await client.PostAsJsonAsync("/api/auth/login", new LoginDto("admin_test", "hash123")))
            .Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Manager", adminAuthJson.GetProperty("user").GetProperty("role").GetString());
        var adminToken = adminAuthJson.GetProperty("token").GetString()!;

        var appetizerId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var mainCourseId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        var dessertId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        // #10: Create TastingMenu with CourseOrder + ImageUrl and verify public GET /api/menu/tasting-menus contract
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var createTmRes = await client.PostAsJsonAsync("/api/manager/tasting-menus", new
        {
            name = "Set Menu Hải Sản",
            price = 1_250_000m,
            description = "Hải sản tươi sống",
            imageUrl = "set_hai_san.jpg",
            isActive = true,
            items = new[]
            {
                new { menuItemId = appetizerId, courseOrder = 1, courseType = "Appetizer" },
                new { menuItemId = mainCourseId, courseOrder = 2, courseType = "MainCourse" },
                new { menuItemId = dessertId, courseOrder = 3, courseType = "Dessert" }
            }
        });
        Assert.Equal(HttpStatusCode.Created, createTmRes.StatusCode);
        var tmCreatedJson = await createTmRes.Content.ReadFromJsonAsync<JsonElement>();
        var tastingMenuId = tmCreatedJson.GetProperty("id").GetGuid();

        client.DefaultRequestHeaders.Authorization = null;
        var publicTmsJson = await client.GetFromJsonAsync<JsonElement>("/api/menu/tasting-menus");
        var tmElem = publicTmsJson.EnumerateArray().Single(x => x.GetProperty("id").GetGuid() == tastingMenuId);
        Assert.Equal("set_hai_san.jpg", tmElem.GetProperty("imageUrl").GetString());
        var tmFirstItem = tmElem.GetProperty("items")[0];
        Assert.Equal(1, tmFirstItem.GetProperty("courseOrder").GetInt32());
        Assert.True(tmFirstItem.GetProperty("prepTimeMinutes").GetInt32() > 0);
        Assert.Equal(tastingMenuId, tmFirstItem.GetProperty("tastingMenuId").GetGuid());

        // Verify date-based GET /api/reservations/available-slots?date=...&partySize=2 returns 5 evening slot groups
        var dateParam = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd");
        var slotGroups = await client.GetFromJsonAsync<JsonElement>($"/api/reservations/available-slots?date={dateParam}&partySize=2");
        Assert.Equal(5, slotGroups.GetArrayLength());
        Assert.Equal("18:00", slotGroups[0].GetProperty("time").GetString());
        var bookTableId = slotGroups[0].GetProperty("availableTables")[0].GetProperty("id").GetGuid();
        var bookTableNumber = slotGroups[0].GetProperty("availableTables")[0].GetProperty("tableNumber").GetString()!;

        // Create reservation using Frontend preOrderedTastingMenuId field and confirm via JSON POST /api/payments/vnpay-ipn
        var createBookingRes = await client.PostAsJsonAsync("/api/reservations", new
        {
            tableId = bookTableId,
            reservationTime = DateTime.UtcNow.AddHours(2),
            partySize = 2,
            preOrderedTastingMenuId = tastingMenuId,
            fullName = "Lê Hoàng Nam",
            phoneNumber = "0909 555 666",
            email = "nam@vn.vn",
            paymentMethod = "VietQR"
        });
        Assert.Equal(HttpStatusCode.Created, createBookingRes.StatusCode);
        var createBookingJson = await createBookingRes.Content.ReadFromJsonAsync<JsonElement>();
        var bookingCode = createBookingJson.GetProperty("reservation").GetProperty("bookingCode").GetString()!;

        var jsonIpnRes = await client.PostAsJsonAsync("/api/payments/vnpay-ipn", new
        {
            bookingCode,
            transactionId = "VNP-JSON-001",
            paymentMethod = "VietQR",
            responseCode = "00"
        });
        Assert.Equal(HttpStatusCode.OK, jsonIpnRes.StatusCode);
        var jsonIpnBody = await jsonIpnRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(jsonIpnBody.GetProperty("success").GetBoolean());
        Assert.Equal("Confirmed", jsonIpnBody.GetProperty("reservation").GetProperty("status").GetString());

        // #11: Waitstaff searches GET /api/reservations?search=... by phone number and checks in by phone number
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitToken);
        var searchByPhone = await client.GetFromJsonAsync<JsonElement>("/api/reservations?search=0909555666&status=Reserved");
        Assert.Single(searchByPhone.EnumerateArray());
        Assert.Equal(bookingCode, searchByPhone[0].GetProperty("bookingCode").GetString());

        var checkInByPhone = await client.PostAsJsonAsync($"/api/tables/{bookTableId}/check-in", new
        {
            reservationCode = "0909 555 666"
        });
        Assert.Equal(HttpStatusCode.OK, checkInByPhone.StatusCode);
        var checkInBody = await checkInByPhone.Content.ReadFromJsonAsync<JsonElement>();
        var orderId = checkInBody.GetProperty("order").GetProperty("id").GetGuid();

        // Guest QR E-Menu works by VD-QR-{tableNumber} code and returns TableMenuResponse
        client.DefaultRequestHeaders.Authorization = null;
        var qrMenu = await client.GetFromJsonAsync<JsonElement>($"/api/menu/table/VD-QR-{bookTableNumber}");
        Assert.Equal(bookTableId, qrMenu.GetProperty("tableId").GetGuid());
        Assert.True(qrMenu.GetProperty("isCheckedIn").GetBoolean());
        Assert.True(qrMenu.GetProperty("tastingMenus").GetArrayLength() >= 1);

        // #12: GET /api/orders/kitchen/pending returns both Preparing (Course 1) and Hold (Course 2/3) items with KDS fields
        var kdsItems = await client.GetFromJsonAsync<JsonElement>("/api/orders/kitchen/pending");
        var orderTickets = kdsItems.EnumerateArray().Where(x => x.GetProperty("orderId").GetGuid() == orderId).ToList();
        Assert.Equal(3, orderTickets.Count);
        Assert.All(orderTickets, t =>
        {
            Assert.Equal(bookTableId, t.GetProperty("tableId").GetGuid());
            Assert.False(string.IsNullOrWhiteSpace(t.GetProperty("itemName").GetString()));
            Assert.True(t.GetProperty("prepTimeMinutes").GetInt32() > 0);
        });

        // Fire & serve all 3 courses, then settle with paymentMethod = "VietQR" (without orderId in body)
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitToken);
        await client.PostAsJsonAsync($"/api/orders/{orderId}/fire-course", new { courseType = "MainCourse" });
        await client.PostAsJsonAsync($"/api/orders/{orderId}/fire-course", new { courseType = "Dessert" });

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expAuth!.Token);
        foreach (var ticket in orderTickets)
        {
            var itemId = ticket.GetProperty("orderItemId").GetGuid();
            Assert.Equal(HttpStatusCode.OK, (await client.PatchAsync($"/api/orders/{orderId}/items/{itemId}/serve", null)).StatusCode);
        }

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var settleRes = await client.PostAsJsonAsync($"/api/invoices/{bookTableId}/settle", new { paymentMethod = "VietQR" });
        Assert.Equal(HttpStatusCode.OK, settleRes.StatusCode);
        var settledJson = await settleRes.Content.ReadFromJsonAsync<JsonElement>();
        var surveyToken = settledJson.GetProperty("surveyToken").GetString()!;
        Assert.StartsWith("survey-", surveyToken);

        // Guest submits feedback using surveyToken + foodRating / ambienceRating / serviceRating
        client.DefaultRequestHeaders.Authorization = null;
        var fbRes = await client.PostAsJsonAsync("/api/feedbacks", new
        {
            token = surveyToken,
            foodRating = 5,
            ambienceRating = 4,
            serviceRating = 5,
            comment = "Thực đơn Hải Sản tuyệt hảo"
        });
        Assert.Equal(HttpStatusCode.Created, fbRes.StatusCode);

        // #15: Manager queries dashboard with period/from/to/label and export with format=excel
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);
        var dashJson = await client.GetFromJsonAsync<JsonElement>(
            $"/api/manager/reports/dashboard?period=month&from={Uri.EscapeDataString(DateTime.UtcNow.AddDays(-7).ToString("O"))}&to={Uri.EscapeDataString(DateTime.UtcNow.AddDays(1).ToString("O"))}&label=Thang11");
        Assert.Equal("month", dashJson.GetProperty("period").GetString());
        Assert.Equal("Thang11", dashJson.GetProperty("periodLabel").GetString());
        Assert.True(dashJson.GetProperty("hasData").GetBoolean());
        Assert.True(dashJson.GetProperty("totalGuests").GetInt32() >= 2);
        Assert.True(dashJson.GetProperty("revenueSeries").GetArrayLength() >= 1);
        Assert.True(dashJson.GetProperty("bestSellers").GetArrayLength() >= 1);
        Assert.Equal(3, dashJson.GetProperty("revenueByZone").GetArrayLength());
        Assert.Equal(1, dashJson.GetProperty("feedbackSummary").GetProperty("count").GetInt32());

        var exportMeta = await client.GetFromJsonAsync<JsonElement>("/api/manager/reports/export?period=month&format=excel");
        Assert.Equal("excel", exportMeta.GetProperty("format").GetString());
        Assert.EndsWith(".xlsx", exportMeta.GetProperty("fileName").GetString());
    }
}
