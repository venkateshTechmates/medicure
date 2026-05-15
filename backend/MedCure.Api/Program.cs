using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Endpoints;
using MedCure.Api.Hubs;
using MedCure.Api.Observability;
using MedCure.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// JWT — secret MUST come from MEDCURE_JWT_SECRET in non-Development environments
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
var envSecret = builder.Configuration["MEDCURE_JWT_SECRET"] ?? Environment.GetEnvironmentVariable("MEDCURE_JWT_SECRET");
if (!string.IsNullOrEmpty(envSecret)) jwt.Secret = envSecret;
if (string.IsNullOrEmpty(jwt.Secret))
{
    if (builder.Environment.IsDevelopment())
        jwt.Secret = "dev-secret-change-in-production-1234567890abcdef0987654321xyzabc";
    else
        throw new InvalidOperationException("MEDCURE_JWT_SECRET environment variable is required in non-Development environments.");
}
if (jwt.Secret.Length < 32)
    throw new InvalidOperationException($"JWT secret must be at least 32 characters (got {jwt.Secret.Length}).");
builder.Services.Configure<JwtOptions>(o =>
{
    o.Secret = jwt.Secret;
    o.Issuer = jwt.Issuer;
    o.Audience = jwt.Audience;
    o.ExpiresHours = jwt.ExpiresHours;
});

// EF Core SQLite
builder.Services.AddDbContext<AppDbContext>(o =>
{
    o.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=medcure.db");
    if (builder.Environment.IsDevelopment()) o.EnableSensitiveDataLogging();
});

// Auth — disable inbound claim mapping so custom claims like "tid" pass through unchanged
System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Secret)),
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(2),
            NameClaimType = "name",
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
        };
        // Allow SignalR to receive token from access_token query (browser EventSource limitation)
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                var path = ctx.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(token) && path.StartsWithSegments("/hubs"))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization(o => o.AddMedCureAuthPolicies());

// Repository / UoW + clinical services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUserService>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddSingleton<INews2Service, News2Service>();
builder.Services.AddScoped<ICdsEngine, CdsEngine>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddSingleton<IFileStore, LocalFileStore>();

// SignalR
builder.Services.AddSignalR();

// Knowledge Graph ingest (fire-and-forget push to Python KG service)
builder.Services.AddHttpClient<IKgIngestService, KgIngestService>(c =>
{
    var kgUrl = builder.Configuration["KnowledgeGraph:BaseUrl"] ?? "http://localhost:8000";
    c.BaseAddress = new Uri(kgUrl);
    c.Timeout = TimeSpan.FromSeconds(5);
});

// Rate limiting — strict on auth, fair on the rest
builder.Services.AddRateLimiter(opts =>
{
    opts.RejectionStatusCode = 429;
    opts.AddPolicy("auth", ctx => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        }));
    opts.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 600,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            }));
});

// CORS for Next.js dev + production domain (configurable)
var corsOrigins = builder.Configuration["Cors:AllowedOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? new[] { "http://localhost:3000" };
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

// JSON
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    o.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// Health checks
builder.Services.AddHealthChecks();

builder.Services.AddOpenApi();

// OpenTelemetry tracing + metrics
builder.AddMedCureObservability();

var app = builder.Build();

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Migration is guarded — only auto-runs in Development or when MedCure:AutoMigrate=true
var autoMigrate = builder.Environment.IsDevelopment()
    || builder.Configuration.GetValue<bool>("MedCure:AutoMigrate");
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbInitializer.RunAsync(db, autoMigrate);
}

// Health endpoints
app.MapGet("/api/health",       () => Results.Ok(new { status = "ok", time = DateTime.UtcNow })).AllowAnonymous();
app.MapHealthChecks("/api/health/ready");
app.MapGet("/api/health/live",  () => Results.Ok(new { status = "alive" })).AllowAnonymous();

// Hubs
app.MapHub<NotificationHub>("/hubs/notifications").RequireAuthorization();
app.MapHub<TelehealthHub>("/hubs/telehealth").RequireAuthorization();

// Endpoints
app.MapAuthEndpoints();
app.MapPatientEndpoints();
app.MapAppointmentEndpoints();
app.MapOrderEndpoints();
app.MapLabEndpoints();
app.MapPharmacyEndpoints();
app.MapBedBoardEndpoints();
app.MapEDEndpoints();
app.MapBillingEndpoints();
app.MapInventoryEndpoints();
app.MapStaffEndpoints();
app.MapMessageEndpoints();
app.MapDocumentEndpoints();
app.MapDashboardEndpoints();
app.MapNoteEndpoints();
app.MapTelemetryEndpoints();
app.MapSpecimenEndpoints();
app.MapAllergyEndpoints();
app.MapProblemEndpoints();
app.MapImmunizationEndpoints();
app.MapConsultEndpoints();
app.MapTransferEndpoints();
app.MapVitalEndpoints();
app.MapCodeEventEndpoints();
app.MapNotificationEndpoints();
app.MapAuditEndpoints();
app.MapSearchEndpoints();
app.MapExportEndpoints();
app.MapCdsEndpoints();
app.MapMedReconciliationEndpoints();
app.MapAssessmentEndpoints();
app.MapBreakGlassEndpoints();
app.MapFhirEndpoints();
app.MapTwoFactorEndpoints();

app.Run();

public partial class Program { } // exposed for integration tests
