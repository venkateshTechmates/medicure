namespace MedCure.Api.Auth;

/// <summary>
/// Lightweight imperative role check for minimal-API endpoints. Use when policy-based
/// <c>RequireAuthorization</c> would be too coarse (e.g. only one verb on a group needs the gate).
/// </summary>
/// <example>
/// <code>
/// if (RoleGuard.Require(current, "MD") is { } forbid) return forbid;
/// </code>
/// </example>
public static class RoleGuard
{
    /// <summary>
    /// Returns <see cref="Results.Forbid"/> when <paramref name="current"/> has none of the
    /// supplied <paramref name="roles"/>. Returns <c>null</c> when the user is allowed —
    /// callers should treat <c>null</c> as "continue".
    /// </summary>
    public static IResult? Require(ICurrentUser current, params string[] roles)
    {
        if (roles is null || roles.Length == 0) return null;
        if (!current.IsAuthenticated) return Results.Forbid();
        var user = current.Roles;
        for (int i = 0; i < roles.Length; i++)
            if (user.Contains(roles[i])) return null;
        return Results.Forbid();
    }
}
