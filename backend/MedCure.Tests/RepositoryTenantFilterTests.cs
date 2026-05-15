using FluentAssertions;
using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Data.Repositories;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MedCure.Tests;

public class RepositoryTenantFilterTests
{
    private class FakeCurrent : ICurrentUser
    {
        public int? UserId { get; set; }
        public int? TenantId { get; set; }
        public string? Email => "demo@medcure.health";
        public string? FullName => "Demo";
        public IReadOnlyList<string> Roles => new[] { "MD" };
        public bool IsAuthenticated => true;
    }

    private static AppDbContext NewDb(string name) =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(name).Options);

    [Fact]
    public async Task Query_only_returns_current_tenants_records()
    {
        using var db = NewDb(nameof(Query_only_returns_current_tenants_records));
        db.Patients.AddRange(
            new Patient { TenantId = 1, Mrn = "T1-A", FirstName = "Alice", LastName = "T1" },
            new Patient { TenantId = 1, Mrn = "T1-B", FirstName = "Bob",   LastName = "T1" },
            new Patient { TenantId = 2, Mrn = "T2-A", FirstName = "Carl",  LastName = "T2" });
        await db.SaveChangesAsync();

        var current = new FakeCurrent { TenantId = 1 };
        var repo = new Repository<Patient>(db, current);

        var rows = await repo.Query().ToListAsync();
        rows.Should().HaveCount(2);
        rows.Should().OnlyContain(p => p.TenantId == 1);
    }

    [Fact]
    public async Task QueryAll_bypasses_the_tenant_filter()
    {
        using var db = NewDb(nameof(QueryAll_bypasses_the_tenant_filter));
        db.Patients.AddRange(
            new Patient { TenantId = 1, Mrn = "Q1", FirstName = "x", LastName = "y" },
            new Patient { TenantId = 2, Mrn = "Q2", FirstName = "x", LastName = "y" });
        await db.SaveChangesAsync();

        var repo = new Repository<Patient>(db, new FakeCurrent { TenantId = 1 });
        (await repo.QueryAll().CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task AddAsync_auto_assigns_tenant_id_from_current_user()
    {
        using var db = NewDb(nameof(AddAsync_auto_assigns_tenant_id_from_current_user));
        var repo = new Repository<Patient>(db, new FakeCurrent { TenantId = 9 });

        await repo.AddAsync(new Patient { Mrn = "NEW", FirstName = "n", LastName = "ew" });
        await db.SaveChangesAsync();

        var saved = await db.Patients.FirstAsync();
        saved.TenantId.Should().Be(9);
    }

    [Fact]
    public async Task GetAsync_hides_entities_owned_by_other_tenants()
    {
        using var db = NewDb(nameof(GetAsync_hides_entities_owned_by_other_tenants));
        var p = new Patient { TenantId = 2, Mrn = "X", FirstName = "f", LastName = "l" };
        db.Patients.Add(p);
        await db.SaveChangesAsync();

        var repo = new Repository<Patient>(db, new FakeCurrent { TenantId = 1 });
        (await repo.GetAsync(p.Id)).Should().BeNull();
    }
}
