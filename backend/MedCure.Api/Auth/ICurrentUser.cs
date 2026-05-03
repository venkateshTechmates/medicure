namespace MedCure.Api.Auth;

public interface ICurrentUser
{
    int? UserId { get; }
    int? TenantId { get; }
    string? Email { get; }
    string? FullName { get; }
    IReadOnlyList<string> Roles { get; }
    bool IsAuthenticated { get; }
}
