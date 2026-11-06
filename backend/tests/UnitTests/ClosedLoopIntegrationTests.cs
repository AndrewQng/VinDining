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

        // 6. Waitstaff checks in guest -> Guest views QR E-Menu & sends Service Call (VIN-34)
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin.Token);
        var checkInRes = await client.PostAsJsonAsync($"/api/tables/{vipTableId}/check-in", new CheckInDto(BookingCode: booking.BookingCode));
        Assert.Equal(HttpStatusCode.OK, checkInRes.StatusCode);

        client.DefaultRequestHeaders.Authorization = null;
        var qrMenuRes = await client.GetAsync($"/api/menu/table/{vipTableId}");
        Assert.Equal(HttpStatusCode.OK, qrMenuRes.StatusCode);

        var callRes = await client.PostAsJsonAsync($"/api/tables/{vipTableId}/call-service", new ServiceCallDto(vipTableId, "Châm nước", "Thêm đá viên"));
        Assert.Equal(HttpStatusCode.OK, callRes.StatusCode);
        var activeCalls = await client.GetFromJsonAsync<List<ServiceCallResponseDto>>("/api/service-calls/active", JsonOpts);
        Assert.Contains(activeCalls!, c => c.TableId == vipTableId);

        // 7. Waitstaff creates order via singular `/api/order` alias & adds item (VIN-20, VIN-35)
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", waitLogin.Token);
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

        var addDessertRes = await client.PostAsJsonAsync($"/api/orders/{orderId}/items", new AddItemsDto(new List<OrderItemRequestDto>
        {
            new(dessertId, 2)
        }));
        Assert.Equal(HttpStatusCode.OK, addDessertRes.StatusCode);

        var orderDetail = await client.GetFromJsonAsync<OrderDetailDto>($"/api/order/{orderId}", JsonOpts);
        var appItemId = orderDetail!.Items.Single(i => i.MenuItemId == appetizerId).Id;
        var mainItemId = orderDetail.Items.Single(i => i.MenuItemId == mainCourseId).Id;
        var desItemId = orderDetail.Items.Single(i => i.MenuItemId == dessertId).Id;

        // Waitstaff trying to ConfirmServed gets 403 Forbidden from GlobalExceptionMiddleware!
        var waitServeRes = await client.PatchAsync($"/api/order/{orderId}/items/{appItemId}/serve", null);
        Assert.Equal(HttpStatusCode.Forbidden, waitServeRes.StatusCode);

        // 8. Expediter serves Appetizer, fires MainCourse, cancels Dessert, serves MainCourse (VIN-21, VIN-36)
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expLogin!.Token);
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsync($"/api/order/{orderId}/items/{appItemId}/serve", null)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsJsonAsync($"/api/order/{orderId}/fire-course", new FireCourseDto(CourseType.MainCourse))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsJsonAsync($"/api/order/{orderId}/items/{desItemId}/cancel", new CancelItemDto("Khách no"))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsync($"/api/order/{orderId}/items/{mainItemId}/serve", null)).StatusCode);

        // 9. Request Checkout -> Preview & Settle Invoice via `/api/invoice/settle` -> Submit Feedback -> Admin Dashboard (VIN-38, VIN-23, VIN-42)
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync($"/api/tables/{vipTableId}/request-checkout", null)).StatusCode);

        var preview = await client.GetFromJsonAsync<InvoicePreviewDto>($"/api/invoice/preview/{vipTableId}", JsonOpts);
        // Subtotal = 2*350k + 2*1,200k = 3,100,000 | SC 5% = 155,000 | VAT 10% = 325,500 | Gross = 3,580,500 | Deposit = 1,000,000 -> Final = 2,580,500
        Assert.Equal(3_100_000m, preview!.Subtotal);
        Assert.Equal(2_580_500m, preview.FinalAmount);

        var settleRes = await client.PostAsJsonAsync("/api/invoice/settle", new SettleInvoiceDto(orderId, PaymentMethod.BankTransfer));
        Assert.Equal(HttpStatusCode.OK, settleRes.StatusCode);
        var settleJson = await settleRes.Content.ReadFromJsonAsync<JsonElement>();
        var invoiceId = settleJson.GetProperty("invoiceId").GetGuid();

        // Clean table back to Available
        Assert.Equal(HttpStatusCode.OK, (await client.PatchAsJsonAsync($"/api/tables/{vipTableId}/status", new UpdateTableStatusDto(TableStatus.Available))).StatusCode);

        // Guest submits 5-star feedback
        client.DefaultRequestHeaders.Authorization = null;
        var fbRes = await client.PostAsJsonAsync("/api/feedbacks", new SubmitFeedbackDto(invoiceId, 5, "Dịch vụ xuất sắc!"));
        Assert.Equal(HttpStatusCode.Created, fbRes.StatusCode);

        // Admin reads Dashboard & Export CSV
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminLogin.Token);
        var dashboardRes = await client.GetAsync("/api/admin/reports/dashboard");
        Assert.Equal(HttpStatusCode.OK, dashboardRes.StatusCode);

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
}
