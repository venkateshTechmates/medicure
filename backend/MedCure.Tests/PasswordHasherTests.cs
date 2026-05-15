using FluentAssertions;
using MedCure.Api.Auth;
using Xunit;

namespace MedCure.Tests;

public class PasswordHasherTests
{
    [Fact]
    public void Hash_then_verify_round_trips()
    {
        var hash = PasswordHasher.Hash("demo123!");
        PasswordHasher.Verify("demo123!", hash).Should().BeTrue();
    }

    [Fact]
    public void Verify_rejects_wrong_password()
    {
        var hash = PasswordHasher.Hash("right-password");
        PasswordHasher.Verify("wrong-password", hash).Should().BeFalse();
    }

    [Fact]
    public void Hash_produces_different_hashes_for_same_password()
    {
        var a = PasswordHasher.Hash("same");
        var b = PasswordHasher.Hash("same");
        a.Should().NotBe(b);  // salt differs each time
        PasswordHasher.Verify("same", a).Should().BeTrue();
        PasswordHasher.Verify("same", b).Should().BeTrue();
    }
}
