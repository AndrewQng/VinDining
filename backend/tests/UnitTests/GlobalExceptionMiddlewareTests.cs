using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using API.Controllers;
using API.Data;
using API.DTOs;
using API.Middlewares;
using API.Models.Common;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

namespace UnitTests;

public class GlobalExceptionMiddlewareTests
{
    private sealed class FakeHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "VinDining.API";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }

    private sealed class TestResponseController : ApiControllerBase
    {
        public IActionResult CallOk<T>(T data, string? message = null) =>
            message is null ? OkResponse(data) : OkResponse(data, message);

        public IActionResult CallCreated<T>(T data, string? message = null) =>
            message is null ? CreatedResponse(data) : CreatedResponse(data, message);
    }

    private sealed class JwtErrorApiFactory : WebApplicationFactory<Program>
    {
        private readonly string _dbName = $"VinDiningJwtErr_{Guid.NewGuid():N}";

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.UseSetting("Jwt:Secret", "MiddlewareTestJwtSecretKey_Minimum32CharsLong2026!");
            builder.ConfigureServices(services =>
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase(_dbName));
            });
        }
    }

    private static async Task<(HttpContext Context, JsonElement Body)> InvokeMiddlewareAsync(
        Exception? exceptionToThrow,
        string traceId = "trace-test-001",
        string? environmentName = null)
    {
        var context = new DefaultHttpContext
        {
            TraceIdentifier = traceId
        };
        context.Request.Method = HttpMethods.Get;
        context.Request.Path = "/api/test";
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ =>
            exceptionToThrow is null
                ? Task.CompletedTask
                : Task.FromException(exceptionToThrow);

        var env = environmentName is null
            ? null
            : new FakeHostEnvironment { EnvironmentName = environmentName };

        var middleware = new GlobalExceptionMiddleware(
            next,
            NullLogger<GlobalExceptionMiddleware>.Instance,
            env);

        await middleware.InvokeAsync(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        if (context.Response.Body.Length == 0)
        {
            return (context, default);
        }

        using var doc = await JsonDocument.ParseAsync(context.Response.Body);
        return (context, doc.RootElement.Clone());
    }

    private static void AssertStandardErrorEnvelope(
        HttpContext context,
        JsonElement body,
        int expectedStatusCode,
        string expectedMessage,
        string expectedTraceId,
        bool expectErrorsProperty)
    {
        Assert.Equal(expectedStatusCode, context.Response.StatusCode);
        Assert.Equal("application/json", context.Response.ContentType);

        Assert.False(body.GetProperty("success").GetBoolean());
        Assert.Equal(expectedStatusCode, body.GetProperty("statusCode").GetInt32());
        Assert.Equal(expectedMessage, body.GetProperty("message").GetString());
        Assert.Equal(expectedTraceId, body.GetProperty("traceId").GetString());
        Assert.True(body.TryGetProperty("timestamp", out var tsProp));
        Assert.True(DateTime.TryParse(tsProp.GetString(), out _));
        Assert.Equal(expectErrorsProperty, body.TryGetProperty("errors", out _));
    }

    [Fact]
    public async Task InvokeAsync_WhenNoExceptionThrown_PassesThroughWithoutWritingError()
    {
        var (context, _) = await InvokeMiddlewareAsync(exceptionToThrow: null);

        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
        Assert.Equal(0, context.Response.Body.Length);
    }

    [Fact]
    public async Task InvokeAsync_ValidationException_Returns400WithFieldErrors()
    {
        var errors = new Dictionary<string, string[]>
        {
            ["partySize"] = new[] { "Số khách phải lớn hơn 0." }
        };

        var (context, body) = await InvokeMiddlewareAsync(
            new ValidationException(errors),
            traceId: "trace-val-400");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status400BadRequest,
            "Dữ liệu đầu vào không hợp lệ.",
            "trace-val-400",
            expectErrorsProperty: true);

        var partySizeErrors = body.GetProperty("errors").GetProperty("partySize");
        Assert.Equal("Số khách phải lớn hơn 0.", partySizeErrors[0].GetString());
    }

    [Fact]
    public async Task InvokeAsync_ArgumentException_Returns400AndOmitsNullErrors()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new ArgumentException("Tham số không hợp lệ."),
            traceId: "trace-arg-400");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status400BadRequest,
            "Tham số không hợp lệ.",
            "trace-arg-400",
            expectErrorsProperty: false);
    }

    [Fact]
    public async Task InvokeAsync_InvalidOperationException_Returns400()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new InvalidOperationException("Thao tác không hợp lệ với trạng thái hiện tại."),
            traceId: "trace-invop-400");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status400BadRequest,
            "Thao tác không hợp lệ với trạng thái hiện tại.",
            "trace-invop-400",
            expectErrorsProperty: false);
    }

    [Fact]
    public async Task InvokeAsync_BadHttpRequestException_Returns400()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new BadHttpRequestException("Nội dung HTTP request không hợp lệ."),
            traceId: "trace-badreq-400");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status400BadRequest,
            "Nội dung HTTP request không hợp lệ.",
            "trace-badreq-400",
            expectErrorsProperty: false);
    }

    [Fact]
    public async Task InvokeAsync_UnauthorizedAccessException_Returns401()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new UnauthorizedAccessException("Tài khoản hoặc mật khẩu không chính xác."),
            traceId: "trace-unauth-401");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status401Unauthorized,
            "Tài khoản hoặc mật khẩu không chính xác.",
            "trace-unauth-401",
            expectErrorsProperty: false);
    }

    [Fact]
    public async Task InvokeAsync_ForbiddenAccessException_Returns403()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new ForbiddenAccessException("Không có quyền thao tác."),
            traceId: "trace-forbid-403");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status403Forbidden,
            "Không có quyền thao tác.",
            "trace-forbid-403",
            expectErrorsProperty: false);
    }

    [Fact]
    public async Task InvokeAsync_KeyNotFoundException_Returns404()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new KeyNotFoundException("Không tìm thấy bàn ăn."),
            traceId: "trace-notfound-404");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status404NotFound,
            "Không tìm thấy bàn ăn.",
            "trace-notfound-404",
            expectErrorsProperty: false);
    }

    [Fact]
    public async Task InvokeAsync_ConflictException_Returns409()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new ConflictException("Bàn đã được đặt trong khung giờ này."),
            traceId: "trace-conflict-409");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status409Conflict,
            "Bàn đã được đặt trong khung giờ này.",
            "trace-conflict-409",
            expectErrorsProperty: false);
    }

    [Fact]
    public async Task InvokeAsync_DbUpdateConcurrencyException_Returns409WithStandardMessage()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new DbUpdateConcurrencyException("Concurrency violation"),
            traceId: "trace-dbconc-409");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status409Conflict,
            "Dữ liệu vừa được cập nhật bởi người dùng khác. Vui lòng tải lại và thử lại.",
            "trace-dbconc-409",
            expectErrorsProperty: false);
    }

    [Fact]
    public async Task InvokeAsync_AccountLockedException_WithLockedUntil_Returns423WithIsoUtcLockedUntil()
    {
        var lockedUntil = new DateTimeOffset(2026, 11, 15, 19, 30, 0, TimeSpan.FromHours(7));
        var expectedIsoUtc = lockedUntil.UtcDateTime.ToString("O");

        var (context, body) = await InvokeMiddlewareAsync(
            new AccountLockedException("Tài khoản tạm thời bị khóa.", lockedUntil),
            traceId: "trace-lock-423");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status423Locked,
            "Tài khoản tạm thời bị khóa.",
            "trace-lock-423",
            expectErrorsProperty: true);

        var lockedUntilErrors = body.GetProperty("errors").GetProperty("lockedUntil");
        Assert.Equal(1, lockedUntilErrors.GetArrayLength());
        Assert.Equal(expectedIsoUtc, lockedUntilErrors[0].GetString());
    }

    [Fact]
    public async Task InvokeAsync_AccountLockedException_WithoutLockedUntil_Returns423AndOmitsErrors()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new AccountLockedException("Tài khoản bị khóa."),
            traceId: "trace-lock-null-423");

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status423Locked,
            "Tài khoản bị khóa.",
            "trace-lock-null-423",
            expectErrorsProperty: false);
    }

    [Fact]
    public async Task InvokeAsync_GenericException_InProduction_HidesExceptionDetails()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new Exception("Sensitive SQL connection error"),
            traceId: "trace-prod-500",
            environmentName: Environments.Production);

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status500InternalServerError,
            "Đã xảy ra lỗi hệ thống nội bộ. Vui lòng thử lại sau.",
            "trace-prod-500",
            expectErrorsProperty: false);
    }

    [Fact]
    public async Task InvokeAsync_GenericException_InDevelopment_ExposesExceptionMessage()
    {
        var (context, body) = await InvokeMiddlewareAsync(
            new Exception("Detailed developer stack context"),
            traceId: "trace-dev-500",
            environmentName: Environments.Development);

        AssertStandardErrorEnvelope(
            context,
            body,
            StatusCodes.Status500InternalServerError,
            "Detailed developer stack context",
            "trace-dev-500",
            expectErrorsProperty: false);
    }

    [Fact]
    public void ApiResponse_OkAndCreated_PopulateFieldsAndDefaultTimestamp()
    {
        var before = DateTime.UtcNow.AddSeconds(-1);
        var okResponse = ApiResponse<string>.Ok("payload-ok", traceId: "trace-ok");
        var createdResponse = ApiResponse<int>.Created(42, "Tạo mới thành công.", "trace-created");
        var explicitTime = new DateTime(2026, 11, 14, 8, 0, 0, DateTimeKind.Utc);
        var explicitResponse = new ApiResponse<string>(true, 200, "Custom", "data", "trace-custom", explicitTime);
        var after = DateTime.UtcNow.AddSeconds(1);

        Assert.True(okResponse.Success);
        Assert.Equal(StatusCodes.Status200OK, okResponse.StatusCode);
        Assert.Equal("Thành công.", okResponse.Message);
        Assert.Equal("payload-ok", okResponse.Data);
        Assert.Equal("trace-ok", okResponse.TraceId);
        Assert.InRange(okResponse.Timestamp, before, after);

        Assert.True(createdResponse.Success);
        Assert.Equal(StatusCodes.Status201Created, createdResponse.StatusCode);
        Assert.Equal("Tạo mới thành công.", createdResponse.Message);
        Assert.Equal(42, createdResponse.Data);
        Assert.Equal("trace-created", createdResponse.TraceId);
        Assert.InRange(createdResponse.Timestamp, before, after);

        Assert.Equal(explicitTime, explicitResponse.Timestamp);
    }

    [Fact]
    public void ApiControllerBase_OkResponseAndCreatedResponse_WrapDataWithTraceIdentifier()
    {
        var controller = new TestResponseController
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    TraceIdentifier = "trace-controller-999"
                }
            }
        };

        var okResult = Assert.IsType<OkObjectResult>(controller.CallOk("ok-payload"));
        Assert.Equal(StatusCodes.Status200OK, okResult.StatusCode);
        var okPayload = Assert.IsType<ApiResponse<string>>(okResult.Value);
        Assert.True(okPayload.Success);
        Assert.Equal(StatusCodes.Status200OK, okPayload.StatusCode);
        Assert.Equal("Thành công.", okPayload.Message);
        Assert.Equal("ok-payload", okPayload.Data);
        Assert.Equal("trace-controller-999", okPayload.TraceId);

        var createdResult = Assert.IsType<ObjectResult>(controller.CallCreated("item-123", "Đã tạo."));
        Assert.Equal(StatusCodes.Status201Created, createdResult.StatusCode);
        var createdPayload = Assert.IsType<ApiResponse<string>>(createdResult.Value);
        Assert.True(createdPayload.Success);
        Assert.Equal(StatusCodes.Status201Created, createdPayload.StatusCode);
        Assert.Equal("Đã tạo.", createdPayload.Message);
        Assert.Equal("item-123", createdPayload.Data);
        Assert.Equal("trace-controller-999", createdPayload.TraceId);

        var controllerWithoutHttpContext = new TestResponseController();
        var noContextResult = Assert.IsType<OkObjectResult>(controllerWithoutHttpContext.CallOk("no-ctx"));
        var noContextPayload = Assert.IsType<ApiResponse<string>>(noContextResult.Value);
        Assert.Null(noContextPayload.TraceId);
    }

    [Fact]
    public async Task JwtBearerEvents_UnauthenticatedAndForbiddenRequests_ReturnStandardApiErrorJson()
    {
        await using var factory = new JwtErrorApiFactory();
        using var client = factory.CreateClient();

        var seedResponse = await client.PostAsync("/api/testing/seed", null);
        Assert.Equal(HttpStatusCode.OK, seedResponse.StatusCode);

        // 401 Challenge
        var unauthResponse = await client.GetAsync("/api/admin/staff");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthResponse.StatusCode);
        Assert.Equal("application/json", unauthResponse.Content.Headers.ContentType?.MediaType);

        var unauthJson = await unauthResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(unauthJson.GetProperty("success").GetBoolean());
        Assert.Equal(401, unauthJson.GetProperty("statusCode").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(unauthJson.GetProperty("message").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(unauthJson.GetProperty("traceId").GetString()));
        Assert.True(unauthJson.TryGetProperty("timestamp", out _));
        Assert.False(unauthJson.TryGetProperty("errors", out _));

        // 403 Forbidden
        var loginRes = await client.PostAsJsonAsync("/api/auth/login", new LoginDto("waitstaff_test", "hash123"));
        Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
        var authPayload = await loginRes.Content.ReadFromJsonAsync<AuthResponseDto>(new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        Assert.NotNull(authPayload);

        using var forbiddenRequest = new HttpRequestMessage(HttpMethod.Get, "/api/admin/staff");
        forbiddenRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", authPayload!.Token);
        var forbiddenResponse = await client.SendAsync(forbiddenRequest);

        Assert.Equal(HttpStatusCode.Forbidden, forbiddenResponse.StatusCode);
        Assert.Equal("application/json", forbiddenResponse.Content.Headers.ContentType?.MediaType);

        var forbiddenJson = await forbiddenResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.False(forbiddenJson.GetProperty("success").GetBoolean());
        Assert.Equal(403, forbiddenJson.GetProperty("statusCode").GetInt32());
        Assert.False(string.IsNullOrWhiteSpace(forbiddenJson.GetProperty("message").GetString()));
        Assert.False(string.IsNullOrWhiteSpace(forbiddenJson.GetProperty("traceId").GetString()));
        Assert.True(forbiddenJson.TryGetProperty("timestamp", out _));
        Assert.False(forbiddenJson.TryGetProperty("errors", out _));
    }
}
