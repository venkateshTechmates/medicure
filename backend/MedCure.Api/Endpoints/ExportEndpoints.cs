using System.Text;
using MedCure.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class ExportEndpoints
{
    public static IEndpointRouteBuilder MapExportEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/exports").RequireAuthorization();
        g.MapGet("/claims.csv",   ClaimsCsv);
        g.MapGet("/labs.csv",     LabsCsv);
        g.MapGet("/patients.csv", PatientsCsv);
        return app;
    }

    private static async Task<IResult> ClaimsCsv(IUnitOfWork uow, string? status)
    {
        var q = uow.Claims.Query().Include(c => c.Patient).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(c => c.Status == status);
        var rows = await q.OrderByDescending(c => c.DateOfService).Take(5000).ToListAsync();
        var sb = new StringBuilder();
        sb.AppendLine("ClaimNumber,Patient,MRN,Payer,CptCode,Description,DateOfService,Amount,Status,DenialReason");
        foreach (var c in rows)
            sb.AppendLine(string.Join(",",
                Csv(c.ClaimNumber),
                Csv($"{c.Patient?.FirstName} {c.Patient?.LastName}".Trim()),
                Csv(c.Patient?.Mrn ?? ""),
                Csv(c.Payer),
                Csv(c.CptCode),
                Csv(c.ServiceDescription),
                c.DateOfService.ToString("yyyy-MM-dd"),
                c.Amount.ToString("0.00"),
                Csv(c.Status),
                Csv(c.DenialReason)));
        return Results.Text(sb.ToString(), "text/csv");
    }

    private static async Task<IResult> LabsCsv(IUnitOfWork uow, string? flag)
    {
        var q = uow.LabResults.Query();
        if (!string.IsNullOrWhiteSpace(flag)) q = q.Where(l => l.Flag == flag);
        var rows = await q.OrderByDescending(l => l.ResultedAt).Take(5000).ToListAsync();
        var sb = new StringBuilder();
        sb.AppendLine("PatientId,Panel,Test,Value,Units,Reference,Flag,ResultedAt,Acknowledged");
        foreach (var l in rows)
            sb.AppendLine(string.Join(",",
                l.PatientId,
                Csv(l.Panel),
                Csv(l.TestName),
                Csv(l.Value),
                Csv(l.Units),
                Csv(l.RefRange),
                Csv(l.Flag),
                l.ResultedAt.ToString("s"),
                l.Acknowledged ? "true" : "false"));
        return Results.Text(sb.ToString(), "text/csv");
    }

    private static async Task<IResult> PatientsCsv(IUnitOfWork uow)
    {
        var rows = await uow.Patients.Query().Take(5000).ToListAsync();
        var sb = new StringBuilder();
        sb.AppendLine("MRN,FirstName,LastName,DOB,Sex,Ward,Bed,Status,Attending,Insurance,AdmittedAt");
        foreach (var p in rows)
            sb.AppendLine(string.Join(",",
                Csv(p.Mrn),
                Csv(p.FirstName),
                Csv(p.LastName),
                p.DateOfBirth.ToString("yyyy-MM-dd"),
                Csv(p.Sex),
                Csv(p.Ward),
                Csv(p.Bed),
                Csv(p.Status),
                Csv(p.AttendingName),
                Csv(p.Insurance),
                p.AdmittedAt.ToString("s")));
        return Results.Text(sb.ToString(), "text/csv");
    }

    private static string Csv(string s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        if (s.Contains(',') || s.Contains('"') || s.Contains('\n'))
            return "\"" + s.Replace("\"", "\"\"") + "\"";
        return s;
    }
}
