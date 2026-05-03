using MedCure.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class StaffEndpoints
{
    public static IEndpointRouteBuilder MapStaffEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/staff").RequireAuthorization();
        g.MapGet("/", List);
        return app;
    }

    private static async Task<IResult> List(IUnitOfWork uow, AppDbContext db, MedCure.Api.Auth.ICurrentUser current)
    {
        if (current.TenantId is not int tid) return Results.Unauthorized();
        var rows = await db.UserTenants
            .Where(ut => ut.TenantId == tid)
            .Include(ut => ut.User)
            .ToListAsync();
        return Results.Ok(rows.Select(ut => new
        {
            ut.UserId, ut.Role, ut.Status, ut.PatientsCount, ut.InboxCount, ut.OnCallHours,
            ut.User?.FullName, ut.User?.Email, ut.User?.Title, ut.User?.Specialty, ut.User?.AvatarUrl
        }));
    }
}
