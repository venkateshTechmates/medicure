using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using MedCure.Api.Dtos;

namespace MedCure.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/auth");
        g.MapPost("/login",    Login).RequireRateLimiting("auth");
        g.MapPost("/register", Register).RequireRateLimiting("auth");
        g.MapGet ("/me",       Me).RequireAuthorization();
        g.MapPatch("/me",      UpdateMe).RequireAuthorization();
        g.MapPost("/me/password", ChangePassword).RequireAuthorization();
        g.MapPost("/forgot-password", ForgotPassword).RequireRateLimiting("auth");
        g.MapPost("/reset-password",  ResetPassword).RequireRateLimiting("auth");
        g.MapPost("/switch-tenant/{tenantId:int}", SwitchTenant).RequireAuthorization();
        return app;
    }

    private static async Task<IResult> Login(LoginRequest req, IUnitOfWork uow, JwtService jwt)
    {
        var user = await uow.Users.GetByEmailAsync(req.Email);
        if (user is null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
            return Results.Unauthorized();

        var tenants = await uow.Users.GetTenantsForUserAsync(user.Id);
        if (tenants.Count == 0) return Results.Forbid();

        var ut = req.TenantId is int tid
            ? tenants.FirstOrDefault(x => x.TenantId == tid) ?? tenants.First()
            : tenants.First();

        var token = jwt.Issue(user, ut.TenantId, ut.Role);
        return Results.Ok(BuildAuthResponse(token, user, ut, tenants));
    }

    private static async Task<IResult> Register(RegisterRequest req, IUnitOfWork uow, JwtService jwt)
    {
        var existing = await uow.Users.GetByEmailAsync(req.Email);
        if (existing is not null) return Results.Conflict("email in use");

        var user = new User
        {
            Email = req.Email,
            PasswordHash = PasswordHasher.Hash(req.Password),
            FullName = req.FullName,
            Title = req.Title,
            Specialty = req.Specialty,
            Npi = req.Npi ?? "",
            LicenseState = req.LicenseState ?? "",
            AvatarUrl = $"https://i.pravatar.cc/120?u={Uri.EscapeDataString(req.Email)}"
        };
        await uow.Users.AddAsync(user);

        var tenant = new Tenant
        {
            Name = req.OrgName, Location = req.OrgLocation,
            Initial = string.IsNullOrEmpty(req.OrgName) ? "?" : req.OrgName[..1].ToUpper(),
            ColorHex = "#0e1116", Tier = "Main"
        };
        await uow.Tenants.AddAsync(tenant);
        await uow.SaveAsync();

        var ut = new UserTenant { UserId = user.Id, TenantId = tenant.Id, Role = req.Role };
        await uow.UserTenants.AddAsync(ut);
        await uow.SaveAsync();

        var tenants = await uow.Users.GetTenantsForUserAsync(user.Id);
        var token = jwt.Issue(user, tenant.Id, req.Role);
        return Results.Ok(BuildAuthResponse(token, user, ut, tenants));
    }

    private static async Task<IResult> Me(IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid || current.TenantId is not int tid) return Results.Unauthorized();
        var user = await uow.Users.GetAsync(uid);
        if (user is null) return Results.Unauthorized();
        var tenants = await uow.Users.GetTenantsForUserAsync(uid);
        var ut = tenants.FirstOrDefault(x => x.TenantId == tid) ?? tenants.First();
        return Results.Ok(new
        {
            User = new UserDto(user.Id, user.Email, user.FullName, user.Title, user.Specialty, user.AvatarUrl),
            ActiveTenant = ToTenantDto(ut),
            Tenants = tenants.Select(ToTenantDto).ToList()
        });
    }

    public record UpdateMeRequest(string? FullName, string? Title, string? Specialty, string? Npi, string? LicenseState, string? AvatarUrl);

    private static async Task<IResult> UpdateMe(UpdateMeRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var user = await uow.Users.GetAsync(uid);
        if (user is null) return Results.Unauthorized();
        if (!string.IsNullOrEmpty(req.FullName))     user.FullName = req.FullName;
        if (!string.IsNullOrEmpty(req.Title))        user.Title = req.Title;
        if (!string.IsNullOrEmpty(req.Specialty))    user.Specialty = req.Specialty;
        if (!string.IsNullOrEmpty(req.Npi))          user.Npi = req.Npi;
        if (!string.IsNullOrEmpty(req.LicenseState)) user.LicenseState = req.LicenseState;
        if (!string.IsNullOrEmpty(req.AvatarUrl))    user.AvatarUrl = req.AvatarUrl;
        uow.Users.Update(user);
        await uow.SaveAsync();
        return Results.Ok(new UserDto(user.Id, user.Email, user.FullName, user.Title, user.Specialty, user.AvatarUrl));
    }

    public record ChangePasswordRequest(string Current, string New);

    private static async Task<IResult> ChangePassword(ChangePasswordRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var user = await uow.Users.GetAsync(uid);
        if (user is null) return Results.Unauthorized();
        if (!PasswordHasher.Verify(req.Current, user.PasswordHash)) return Results.BadRequest(new { error = "current password incorrect" });
        if (string.IsNullOrEmpty(req.New) || req.New.Length < 6) return Results.BadRequest(new { error = "new password too short" });
        user.PasswordHash = PasswordHasher.Hash(req.New);
        uow.Users.Update(user);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    public record ForgotPasswordRequest(string Email);

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (int UserId, DateTime ExpiresAt)> _resetTokens = new();

    private static async Task<IResult> ForgotPassword(ForgotPasswordRequest req, IUnitOfWork uow)
    {
        var user = await uow.Users.GetByEmailAsync(req.Email);
        string? token = null;
        if (user is not null)
        {
            token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()).TrimEnd('=');
            _resetTokens[token] = (user.Id, DateTime.UtcNow.AddMinutes(30));
        }
        return Results.Ok(new {
            sent = true,
            email = req.Email,
            expiresInMinutes = 30,
            demoToken = token
        });
    }

    public record ResetPasswordRequest(string Token, string NewPassword);

    private static async Task<IResult> ResetPassword(ResetPasswordRequest req, IUnitOfWork uow)
    {
        if (string.IsNullOrEmpty(req.Token) || string.IsNullOrEmpty(req.NewPassword) || req.NewPassword.Length < 6)
            return Results.BadRequest(new { error = "token and 6+ char password required" });
        if (!_resetTokens.TryRemove(req.Token, out var entry) || entry.ExpiresAt < DateTime.UtcNow)
            return Results.BadRequest(new { error = "invalid or expired token" });
        var user = await uow.Users.GetAsync(entry.UserId);
        if (user is null) return Results.BadRequest(new { error = "user not found" });
        user.PasswordHash = PasswordHasher.Hash(req.NewPassword);
        uow.Users.Update(user);
        await uow.SaveAsync();
        return Results.Ok(new { reset = true, email = user.Email });
    }

    private static async Task<IResult> SwitchTenant(int tenantId, IUnitOfWork uow, ICurrentUser current, JwtService jwt)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var user = await uow.Users.GetAsync(uid);
        if (user is null) return Results.Unauthorized();
        var tenants = await uow.Users.GetTenantsForUserAsync(uid);
        var ut = tenants.FirstOrDefault(x => x.TenantId == tenantId);
        if (ut is null) return Results.Forbid();
        var token = jwt.Issue(user, ut.TenantId, ut.Role);
        return Results.Ok(BuildAuthResponse(token, user, ut, tenants));
    }

    private static AuthResponse BuildAuthResponse(string token, User user, UserTenant active, IEnumerable<UserTenant> all) => new(
        token,
        new UserDto(user.Id, user.Email, user.FullName, user.Title, user.Specialty, user.AvatarUrl),
        ToTenantDto(active),
        all.Select(ToTenantDto).ToList()
    );

    private static TenantDto ToTenantDto(UserTenant ut) => new(
        ut.TenantId, ut.Tenant?.Name ?? "", ut.Tenant?.Location ?? "",
        ut.Tenant?.Tier ?? "Main", ut.Tenant?.Initial ?? "?", ut.Tenant?.ColorHex ?? "#0e1116", ut.Role);
}
