using System.Text.Json;
using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class TwoFactorEndpoints
{
    private const string Issuer = "MedCure";

    public record VerifyRequest(string Code);

    public static IEndpointRouteBuilder MapTwoFactorEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/auth/2fa").RequireAuthorization();
        g.MapPost("/enroll",  Enroll);
        g.MapPost("/confirm", Confirm);
        g.MapPost("/verify",  Verify);
        g.MapPost("/disable", Disable);
        g.MapGet ("/status",  Status);
        return app;
    }

    private static async Task<IResult> Enroll(IUnitOfWork uow, ICurrentUser current, TotpService totp)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var user = await uow.Users.GetAsync(uid);
        if (user is null) return Results.Unauthorized();

        // Replace any pending unconfirmed enrollment so a user can restart the flow.
        var existing = await uow.TwoFactorSecrets.QueryAll()
            .FirstOrDefaultAsync(x => x.UserId == uid);
        if (existing is not null)
        {
            uow.TwoFactorSecrets.Remove(existing);
            await uow.SaveAsync();
        }

        var secret = totp.GenerateSecret();
        var codes = BackupCodes.Generate();
        var entity = new TwoFactorSecret
        {
            UserId = uid,
            EncryptedSecret = secret,
            BackupCodes = JsonSerializer.Serialize(codes),
            EnrolledAt = DateTime.UtcNow,
            Enabled = false
        };
        await uow.TwoFactorSecrets.AddAsync(entity);
        await uow.SaveAsync();

        var uri = totp.GenerateUri(secret, user.Email, Issuer);
        return Results.Ok(new
        {
            secret,
            otpAuthUri = uri,
            backupCodes = codes
        });
    }

    private static async Task<IResult> Confirm(VerifyRequest req, IUnitOfWork uow, ICurrentUser current, TotpService totp)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var secret = await uow.TwoFactorSecrets.QueryAll()
            .FirstOrDefaultAsync(x => x.UserId == uid);
        if (secret is null) return Results.BadRequest(new { error = "not enrolled" });
        if (!totp.Verify(secret.EncryptedSecret, req.Code))
            return Results.BadRequest(new { error = "invalid code" });

        secret.Enabled = true;
        secret.LastUsedAt = DateTime.UtcNow;
        uow.TwoFactorSecrets.Update(secret);

        var user = await uow.Users.GetAsync(uid);
        if (user is not null)
        {
            user.TotpEnabled = true;
            user.TwoFactorEnabled = true;
            uow.Users.Update(user);
        }
        await uow.SaveAsync();
        return Results.Ok(new { enabled = true });
    }

    private static async Task<IResult> Verify(VerifyRequest req, IUnitOfWork uow, ICurrentUser current, TotpService totp)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var secret = await uow.TwoFactorSecrets.QueryAll()
            .FirstOrDefaultAsync(x => x.UserId == uid && x.Enabled);
        if (secret is null) return Results.BadRequest(new { error = "2fa not enabled" });
        if (!totp.Verify(secret.EncryptedSecret, req.Code))
            return Results.BadRequest(new { valid = false });

        secret.LastUsedAt = DateTime.UtcNow;
        uow.TwoFactorSecrets.Update(secret);
        await uow.SaveAsync();
        return Results.Ok(new { valid = true });
    }

    private static async Task<IResult> Disable(IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var secret = await uow.TwoFactorSecrets.QueryAll()
            .FirstOrDefaultAsync(x => x.UserId == uid);
        if (secret is not null)
        {
            uow.TwoFactorSecrets.Remove(secret);
        }
        var user = await uow.Users.GetAsync(uid);
        if (user is not null)
        {
            user.TotpEnabled = false;
            user.TwoFactorEnabled = false;
            uow.Users.Update(user);
        }
        await uow.SaveAsync();
        return Results.Ok(new { enabled = false });
    }

    private static async Task<IResult> Status(IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var secret = await uow.TwoFactorSecrets.QueryAll()
            .Where(x => x.UserId == uid)
            .Select(x => new { x.Enabled, x.EnrolledAt })
            .FirstOrDefaultAsync();
        return Results.Ok(new
        {
            enabled = secret?.Enabled ?? false,
            enrolledAt = secret?.EnrolledAt
        });
    }
}
