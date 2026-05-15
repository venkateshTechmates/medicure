using MedCure.Api.Data;
using MedCure.Api.Domain.Common;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Services;

/// <summary>
/// PRD §14.X — implementation. Bulk-deletes via raw DbContext (skipping the UoW per-row API for speed),
/// then writes a small synthetic seed using the UoW so tenant scoping + auto timestamps still apply.
/// </summary>
public class DemoService(AppDbContext db, IUnitOfWork uow) : IDemoService
{
    // Order matters — child tables first so FK references resolve cleanly.
    private static readonly (string Label, Func<AppDbContext, IQueryable<TenantEntity>> Query)[] Wipeable =
    {
        ("auditEntries",        d => d.AuditEntries),
        ("notifications",       d => d.Notifications),
        ("cdsAlerts",           d => d.CdsAlerts),
        ("cdsOverrides",        d => d.CdsOverrides),
        ("medAdmins",           d => d.MedAdmins),
        ("messages",            d => d.Messages),
        ("messageThreads",      d => d.MessageThreads),
        ("notes",               d => d.Notes),
        ("documents",           d => d.Documents),
        ("labResults",          d => d.LabResults),
        ("specimens",           d => d.Specimens),
        ("vitals",              d => d.Vitals),
        ("appointments",        d => d.Appointments),
        ("encounters",          d => d.Encounters),
        ("orders",              d => d.Orders),
        ("favoritePanelItems",  d => d.Set<FavoritePanelItem>()),
        ("favoritePanels",      d => d.Set<FavoritePanel>()),
        ("favoriteOrders",      d => d.Set<FavoriteOrder>()),
        ("allergies",           d => d.Allergies),
        ("problems",            d => d.Problems),
        ("immunizations",       d => d.Immunizations),
        ("consultRequests",     d => d.ConsultRequests),
        ("transferRequests",    d => d.TransferRequests),
        ("codeEvents",          d => d.CodeEvents),
        ("medReconciliationLines", d => d.MedReconciliationLines),
        ("medReconciliations",     d => d.MedReconciliations),
        ("assessments",         d => d.Assessments),
        ("inbasketDelegations", d => d.InbasketDelegations),
        ("edArrivals",          d => d.EDArrivals),
        ("claims",              d => d.Claims),
        ("inventoryItems",      d => d.InventoryItems),
        ("cdsRules",            d => d.CdsRules),
        ("beds",                d => d.Beds),
        ("wards",               d => d.Wards),
        ("patients",            d => d.Patients),
    };

    public async Task<Dictionary<string, int>> ResetAsync(int tenantId, CancellationToken ct = default)
    {
        var deleted = new Dictionary<string, int>();

        // NOTE: ExecuteDeleteAsync respects EF query filters, which include the soft-delete one.
        // We deliberately keep that — undeleted rows are the only "live" data anyway.
        foreach (var (label, set) in Wipeable)
        {
            var rows = set(db).Where(e => e.TenantId == tenantId);
            var n = await rows.ExecuteDeleteAsync(ct);
            deleted[label] = n;
        }

        // Re-seed a minimal demo set so the tenant isn't empty.
        var reseeded = await ReseedMinimalAsync(tenantId, ct);
        foreach (var (k, v) in reseeded) deleted[$"reseeded.{k}"] = v;

        return deleted;
    }

    private async Task<Dictionary<string, int>> ReseedMinimalAsync(int tenantId, CancellationToken ct)
    {
        var counts = new Dictionary<string, int>();
        var rng = new Random(42);

        // Wards + beds
        var ward = new Ward { TenantId = tenantId, Name = "Med-Surg", Code = "MS", BedCount = 8, AvgLos = 4.2, NurseRatio = "1:5" };
        var icu  = new Ward { TenantId = tenantId, Name = "ICU",      Code = "ICU", BedCount = 4, AvgLos = 6.1, NurseRatio = "1:2" };
        await uow.Wards.AddAsync(ward, ct);
        await uow.Wards.AddAsync(icu, ct);
        await uow.SaveAsync(ct);

        for (int i = 1; i <= ward.BedCount; i++)
            await uow.Beds.AddAsync(new Bed { TenantId = tenantId, WardId = ward.Id, BedNumber = $"MS-{i:00}", Status = "empty" }, ct);
        for (int i = 1; i <= icu.BedCount; i++)
            await uow.Beds.AddAsync(new Bed { TenantId = tenantId, WardId = icu.Id, BedNumber = $"ICU-{i:00}", Status = "empty" }, ct);

        // Patients
        var firsts = new[] { "Olivia", "Liam", "Emma", "Noah", "Ava", "Ethan" };
        var lasts  = new[] { "Smith", "Johnson", "Brown", "Davis", "Lopez", "Wilson" };
        for (int i = 0; i < 6; i++)
        {
            await uow.Patients.AddAsync(new Patient
            {
                TenantId = tenantId,
                Mrn = $"DR{DateTime.UtcNow:HHmmss}{i}",
                FirstName = firsts[i % firsts.Length],
                LastName  = lasts[i % lasts.Length],
                DateOfBirth = DateTime.UtcNow.AddYears(-(30 + i * 5)),
                Sex = i % 2 == 0 ? "M" : "F",
                Status = "good",
                Ward = ward.Name,
                Bed = $"MS-{i + 1:00}",
                AttendingName = "Dr. Drobo",
                PrimaryRn = "RN Wilson",
                AdmittedAt = DateTime.UtcNow.AddHours(-rng.Next(1, 24)),
                AvatarUrl = $"https://i.pravatar.cc/120?img={i + 1}"
            }, ct);
        }
        await uow.SaveAsync(ct);

        counts["wards"] = 2;
        counts["beds"]  = ward.BedCount + icu.BedCount;
        counts["patients"] = 6;
        return counts;
    }

    public async Task<DemoScenarioResult> RunScenarioAsync(int tenantId, string name, CancellationToken ct = default)
    {
        switch (name.ToLowerInvariant())
        {
            case "sepsis":         return await SeedSepsisAsync(tenantId, ct);
            case "chest-pain-ed":  return await SeedChestPainEdAsync(tenantId, ct);
            default:
                throw new ArgumentException($"Unknown demo scenario '{name}'. Known: sepsis, chest-pain-ed.");
        }
    }

    private async Task<DemoScenarioResult> SeedSepsisAsync(int tenantId, CancellationToken ct)
    {
        var patient = new Patient
        {
            TenantId = tenantId,
            Mrn = $"SEP{DateTime.UtcNow:HHmmss}",
            FirstName = "Sepsis", LastName = "Demo",
            DateOfBirth = DateTime.UtcNow.AddYears(-67),
            Sex = "F",
            WeightKg = 72, HeightCm = 165,
            CodeStatus = "Full Code", Insurance = "Medicare",
            Status = "bad", Ward = "ICU", Bed = "ICU-01",
            AttendingName = "Dr. Drobo", PrimaryRn = "RN Tamara Jones",
            AdmittedAt = DateTime.UtcNow.AddHours(-2),
            AvatarUrl = "https://i.pravatar.cc/120?img=47"
        };
        await uow.Patients.AddAsync(patient, ct);
        await uow.SaveAsync(ct);

        // Elevated NEWS2: tachycardic, hypotensive, tachypneic, febrile, hypoxic.
        await uow.Vitals.AddAsync(new Vital
        {
            TenantId = tenantId, PatientId = patient.Id,
            RecordedAt = DateTime.UtcNow,
            Hr = 124, Sbp = 88, Dbp = 52, Spo2 = 91, Rr = 28, TempC = 39.1, Pain = 5,
            RecordedBy = "RN Tamara Jones",
            News2Score = 11, News2Risk = "high"
        }, ct);

        await uow.Problems.AddAsync(new Problem
        {
            TenantId = tenantId, PatientId = patient.Id,
            Description = "Sepsis", IcdCode = "A41.9", Onset = DateTime.UtcNow.AddHours(-3), Type = "active"
        }, ct);

        // Sepsis-bundle order set.
        var bundle = new (string Type, string Name, string Dose, string Route, string Freq, string Ind)[]
        {
            ("Lab",        "Blood Culture x2",          "—",      "—",   "Stat",    "Sepsis r/o"),
            ("Lab",        "Lactate",                   "—",      "—",   "Stat",    "Sepsis r/o"),
            ("Medication", "Vancomycin",                "1 g",    "IV",  "q12h",    "Sepsis"),
            ("Medication", "Piperacillin-Tazobactam",   "4.5 g",  "IV",  "q6h",     "Sepsis"),
            ("Medication", "Normal Saline bolus",       "30 mL/kg","IV", "once",    "Hypotension"),
            ("Nursing",    "Continuous pulse oximetry","—",       "—",   "Ongoing", ""),
            ("Nursing",    "Strict I&O",                "—",      "—",   "Ongoing", ""),
        };
        var orderIds = new List<int>();
        foreach (var b in bundle)
        {
            var o = new Order
            {
                TenantId = tenantId, PatientId = patient.Id,
                OrderType = b.Type, Name = b.Name,
                Dose = b.Dose, Route = b.Route, Frequency = b.Freq, Indication = b.Ind,
                Priority = "Stat", Status = "signed",
                OrderedByName = "Dr. Drobo",
                SignedAt = DateTime.UtcNow
            };
            await uow.Orders.AddAsync(o, ct);
            await uow.SaveAsync(ct);
            orderIds.Add(o.Id);
        }

        return new DemoScenarioResult(
            Scenario: "sepsis",
            PatientId: patient.Id,
            EdArrivalId: null,
            OrderIds: orderIds,
            Url: $"/patients/{patient.Mrn}");
    }

    private async Task<DemoScenarioResult> SeedChestPainEdAsync(int tenantId, CancellationToken ct)
    {
        var patient = new Patient
        {
            TenantId = tenantId,
            Mrn = $"CP{DateTime.UtcNow:HHmmss}",
            FirstName = "Chest", LastName = "PainDemo",
            DateOfBirth = DateTime.UtcNow.AddYears(-58),
            Sex = "M",
            WeightKg = 84, HeightCm = 178,
            CodeStatus = "Full Code", Insurance = "BCBS",
            Status = "warn", Ward = "ED", Bed = "ED-7",
            AttendingName = "Dr. Patel", PrimaryRn = "RN Carter",
            AdmittedAt = DateTime.UtcNow.AddMinutes(-15),
            AvatarUrl = "https://i.pravatar.cc/120?img=15"
        };
        await uow.Patients.AddAsync(patient, ct);
        await uow.SaveAsync(ct);

        var arrival = new EDArrival
        {
            TenantId = tenantId,
            PatientId = patient.Id,
            PatientName = $"{patient.FirstName} {patient.LastName}",
            Age = 58, Sex = "M",
            ChiefComplaint = "Chest pain",
            EsiLevel = 2,
            ArrivalMode = "EMS",
            ArrivedAt = DateTime.UtcNow.AddMinutes(-15),
            Status = "in-bed",
            Bay = "ED-7",
            Hr = 102, Sbp = 148, Spo2 = 96
        };
        await uow.EDArrivals.AddAsync(arrival, ct);
        await uow.SaveAsync(ct);

        // Troponin pending.
        var trop = new Order
        {
            TenantId = tenantId, PatientId = patient.Id,
            OrderType = "Lab", Name = "High-sens Troponin I",
            Dose = "—", Route = "—", Frequency = "now",
            Indication = "Chest pain · ACS r/o",
            Priority = "Stat", Status = "signed",
            OrderedByName = "Dr. Patel",
            SignedAt = DateTime.UtcNow
        };
        await uow.Orders.AddAsync(trop, ct);
        await uow.SaveAsync(ct);

        return new DemoScenarioResult(
            Scenario: "chest-pain-ed",
            PatientId: patient.Id,
            EdArrivalId: arrival.Id,
            OrderIds: new() { trop.Id },
            Url: "/ed");
    }
}
