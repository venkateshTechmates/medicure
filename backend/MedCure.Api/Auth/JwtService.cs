using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MedCure.Api.Domain.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using JwtClaim = System.Security.Claims.Claim;

namespace MedCure.Api.Auth;

public class JwtService(IOptions<JwtOptions> opts)
{
    private readonly JwtOptions _o = opts.Value;

    public string Issue(User user, int tenantId, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_o.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<JwtClaim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new("name", user.FullName),
            new("tid", tenantId.ToString()),
            new(ClaimTypes.Role, role),
        };

        var token = new JwtSecurityToken(
            issuer: _o.Issuer,
            audience: _o.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_o.ExpiresHours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
