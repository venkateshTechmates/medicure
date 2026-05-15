namespace MedCure.Api.Endpoints;

public static class CalculatorEndpoints
{
    public static IEndpointRouteBuilder MapCalculatorEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/calc").RequireAuthorization();
        g.MapPost("/bmi",      Bmi);
        g.MapPost("/egfr",     Egfr);
        g.MapPost("/crcl",     Crcl);
        g.MapPost("/dose",     Dose);
        g.MapPost("/drip",     Drip);
        g.MapPost("/map",      Map);
        g.MapPost("/aniongap", AnionGap);
        g.MapPost("/calc-ca",  CorrectedCa);
        g.MapPost("/calc-na",  CorrectedNa);
        return app;
    }

    public record BmiReq(double HeightCm, double WeightKg);
    public record BmiRes(double Bmi, double Bsa, string Category);
    public record EgfrReq(double ScrMgDl, int AgeYears, string Sex);
    public record EgfrRes(double Egfr, string CkdStage);
    public record CrclReq(int Age, double WeightKg, double ScrMgDl, string Sex);
    public record CrclRes(double Crcl);
    public record DoseReq(double MgPerKg, double WeightKg, double? MaxMg);
    public record DoseRes(double TotalMg);
    public record DripReq(double McgPerKgPerMin, double WeightKg, double ConcentrationMgPerMl);
    public record DripRes(double MlPerHr);
    public record MapReq(double Sbp, double Dbp);
    public record MapRes(double Map);
    public record AnionGapReq(double Na, double Cl, double Hco3, double? K);
    public record AnionGapRes(double AnionGap);
    public record CorrectedCaReq(double TotalCaMgDl, double AlbuminGdL);
    public record CorrectedCaRes(double CorrectedCa);
    public record CorrectedNaReq(double MeasuredNa, double GlucoseMgDl);
    public record CorrectedNaRes(double CorrectedNa);

    private static IResult Bmi(BmiReq b)
    {
        if (b.HeightCm <= 0 || b.WeightKg <= 0) return Results.BadRequest(new { error = "height and weight required" });
        var hM = b.HeightCm / 100.0;
        var bmi = b.WeightKg / (hM * hM);
        var bsa = 0.007184 * Math.Pow(b.WeightKg, 0.425) * Math.Pow(b.HeightCm, 0.725);
        string cat = bmi < 18.5 ? "underweight" : bmi < 25 ? "normal" : bmi < 30 ? "overweight" : bmi < 35 ? "obese-i" : bmi < 40 ? "obese-ii" : "obese-iii";
        return Results.Ok(new BmiRes(Math.Round(bmi, 1), Math.Round(bsa, 2), cat));
    }

    private static IResult Egfr(EgfrReq b)
    {
        if (b.ScrMgDl <= 0 || b.AgeYears <= 0) return Results.BadRequest(new { error = "scr and age required" });
        var female = string.Equals(b.Sex, "F", StringComparison.OrdinalIgnoreCase) || string.Equals(b.Sex, "female", StringComparison.OrdinalIgnoreCase);
        var kappa = female ? 0.7 : 0.9;
        var alpha = female ? -0.241 : -0.302;
        var ratio = b.ScrMgDl / kappa;
        var egfr = 142.0 * Math.Pow(Math.Min(ratio, 1), alpha) * Math.Pow(Math.Max(ratio, 1), -1.200) * Math.Pow(0.9938, b.AgeYears) * (female ? 1.012 : 1.0);
        string stage = egfr >= 90 ? "G1" : egfr >= 60 ? "G2" : egfr >= 45 ? "G3a" : egfr >= 30 ? "G3b" : egfr >= 15 ? "G4" : "G5";
        return Results.Ok(new EgfrRes(Math.Round(egfr, 1), stage));
    }

    private static IResult Crcl(CrclReq b)
    {
        if (b.Age <= 0 || b.WeightKg <= 0 || b.ScrMgDl <= 0) return Results.BadRequest(new { error = "age, weight, scr required" });
        var female = string.Equals(b.Sex, "F", StringComparison.OrdinalIgnoreCase) || string.Equals(b.Sex, "female", StringComparison.OrdinalIgnoreCase);
        var crcl = ((140 - b.Age) * b.WeightKg) / (72.0 * b.ScrMgDl) * (female ? 0.85 : 1.0);
        return Results.Ok(new CrclRes(Math.Round(crcl, 1)));
    }

    private static IResult Dose(DoseReq b)
    {
        if (b.MgPerKg <= 0 || b.WeightKg <= 0) return Results.BadRequest(new { error = "mgPerKg and weight required" });
        var total = b.MgPerKg * b.WeightKg;
        if (b.MaxMg is double cap && total > cap) total = cap;
        return Results.Ok(new DoseRes(Math.Round(total, 2)));
    }

    private static IResult Drip(DripReq b)
    {
        if (b.WeightKg <= 0 || b.ConcentrationMgPerMl <= 0) return Results.BadRequest(new { error = "weight and concentration required" });
        var mlPerHr = (b.McgPerKgPerMin * b.WeightKg * 60.0) / (b.ConcentrationMgPerMl * 1000.0);
        return Results.Ok(new DripRes(Math.Round(mlPerHr, 2)));
    }

    private static IResult Map(MapReq b)
    {
        if (b.Sbp <= 0 || b.Dbp <= 0) return Results.BadRequest(new { error = "sbp and dbp required" });
        return Results.Ok(new MapRes(Math.Round((b.Sbp + 2 * b.Dbp) / 3.0, 1)));
    }

    private static IResult AnionGap(AnionGapReq b)
    {
        var ag = b.Na - (b.Cl + b.Hco3) + (b.K ?? 0);
        return Results.Ok(new AnionGapRes(Math.Round(ag, 1)));
    }

    private static IResult CorrectedCa(CorrectedCaReq b)
    {
        var c = b.TotalCaMgDl + 0.8 * (4.0 - b.AlbuminGdL);
        return Results.Ok(new CorrectedCaRes(Math.Round(c, 2)));
    }

    private static IResult CorrectedNa(CorrectedNaReq b)
    {
        var factor = b.GlucoseMgDl > 400 ? 0.024 : 0.016;
        var c = b.MeasuredNa + factor * (b.GlucoseMgDl - 100);
        return Results.Ok(new CorrectedNaRes(Math.Round(c, 1)));
    }
}
