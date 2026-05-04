using System.Text;
using System.Text.Json.Serialization;
using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Endpoints;
using MedCure.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// JWT options
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (string.IsNullOrEmpty(jwt.Secret)) jwt.Secret = "dev-secret-change-in-production-1234567890abcdef";

// EF Core SQLite
builder.Services.AddDbContext<AppDbContext>(o =>
    o.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=medcure.db")
     .EnableSensitiveDataLogging());

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
    });
builder.Services.AddAuthorization();

// Repository / UoW
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUserService>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddSingleton<JwtService>();

// Knowledge Graph ingest (fire-and-forget push to Python KG service)
builder.Services.AddHttpClient<IKgIngestService, KgIngestService>(c =>
{
    var kgUrl = builder.Configuration["KnowledgeGraph:BaseUrl"] ?? "http://localhost:8000";
    c.BaseAddress = new Uri(kgUrl);
    c.Timeout = TimeSpan.FromSeconds(5);
});

// CORS for Next.js dev
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:3000")
     .AllowAnyHeader()
     .AllowAnyMethod()));

// JSON
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    o.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbInitializer.RunAsync(db);
}

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow }));

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

app.Run();
