using Microsoft.AspNetCore.Authorization;

namespace MedCure.Api.Auth;

/// <summary>
/// Centralized authorization policy names and the extension that registers them.
/// Roles align with the <see cref="UserTenant.Role"/> string and are also emitted as
/// <c>ClaimTypes.Role</c> claims by <c>JwtService</c>.
/// </summary>
public static class AuthPolicies
{
    // Single-role policies
    public const string RequireMd          = "RequireMd";
    public const string RequireRPh         = "RequireRPh";
    public const string RequireRN          = "RequireRN";
    public const string RequireRnEd        = "RequireRnEd";
    public const string RequireTech        = "RequireTech";
    public const string RequireReg         = "RequireReg";
    public const string RequireBill        = "RequireBill";
    public const string RequireAdmin       = "RequireAdmin";
    public const string RequireResident    = "RequireResident";
    public const string RequireChargeNurse = "RequireChargeNurse";
    public const string RequireCaseMgr     = "RequireCaseMgr";
    public const string RequirePrivacy     = "RequirePrivacy";

    // Combo policies
    public const string RequireMdOrResident = "RequireMdOrResident";
    public const string RequireAnyRN        = "RequireAnyRN"; // RN | RnEd | ChargeNurse

    /// <summary>Registers every MedCure policy onto the supplied options bag.</summary>
    public static AuthorizationOptions AddMedCureAuthPolicies(this AuthorizationOptions o)
    {
        o.AddPolicy(RequireMd,          p => p.RequireRole("MD"));
        o.AddPolicy(RequireRPh,         p => p.RequireRole("RPh"));
        o.AddPolicy(RequireRN,          p => p.RequireRole("RN"));
        o.AddPolicy(RequireRnEd,        p => p.RequireRole("RnEd"));
        o.AddPolicy(RequireTech,        p => p.RequireRole("Tech"));
        o.AddPolicy(RequireReg,         p => p.RequireRole("Reg"));
        o.AddPolicy(RequireBill,        p => p.RequireRole("Bill"));
        o.AddPolicy(RequireAdmin,       p => p.RequireRole("Admin"));
        o.AddPolicy(RequireResident,    p => p.RequireRole("Resident"));
        o.AddPolicy(RequireChargeNurse, p => p.RequireRole("ChargeNurse"));
        o.AddPolicy(RequireCaseMgr,     p => p.RequireRole("CaseMgr"));
        o.AddPolicy(RequirePrivacy,     p => p.RequireRole("Privacy"));

        o.AddPolicy(RequireMdOrResident, p => p.RequireAssertion(ctx =>
            ctx.User.IsInRole("MD") || ctx.User.IsInRole("Resident")));

        o.AddPolicy(RequireAnyRN, p => p.RequireAssertion(ctx =>
            ctx.User.IsInRole("RN") || ctx.User.IsInRole("RnEd") || ctx.User.IsInRole("ChargeNurse")));

        return o;
    }
}
