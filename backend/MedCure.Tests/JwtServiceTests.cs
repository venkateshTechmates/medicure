using System.IdentityModel.Tokens.Jwt;
using FluentAssertions;
using MedCure.Api.Auth;
using MedCure.Api.Domain.Entities;
using Microsoft.Extensions.Options;
using Xunit;

namespace MedCure.Tests;

public class JwtServiceTests
{
    private static JwtService Make() => new(Options.Create(new JwtOptions
    {
        Issuer = "medcure-test",
        Audience = "medcure-test",
        Secret = "test-secret-32chars-minimum-length-aaaaaaaaa",
        ExpiresHours = 1
    }));

    [Fact]
    public void Issue_returns_a_signed_token_with_expected_claims()
    {
        var jwt = Make();
        var user = new User { Id = 42, Email = "x@y.com", FullName = "Test User" };
        var raw = jwt.Issue(user, tenantId: 7, role: "MD");
        raw.Should().NotBeNullOrEmpty();

        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(raw);
        parsed.Claims.Should().Contain(c => c.Type == "tid" && c.Value == "7");
        parsed.Claims.Should().Contain(c => c.Type == "name" && c.Value == "Test User");
        parsed.Issuer.Should().Be("medcure-test");
    }
}
