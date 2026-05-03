using System.Security.Claims;

namespace MedCure.Api.Auth;

public class CurrentUserService(IHttpContextAccessor http) : ICurrentUser
{
    private ClaimsPrincipal? P => http.HttpContext?.User;

    public int? UserId =>
        int.TryParse(P?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public int? TenantId =>
        int.TryParse(P?.FindFirstValue("tid"), out var t) ? t : null;

    public string? Email => P?.FindFirstValue(ClaimTypes.Email);

    public string? FullName => P?.FindFirstValue("name");

    public IReadOnlyList<string> Roles =>
        P?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToArray() ?? Array.Empty<string>();

    public bool IsAuthenticated => P?.Identity?.IsAuthenticated ?? false;
}
