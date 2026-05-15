namespace MedCure.Api.Endpoints;

public static class PaletteEndpoints
{
    public static IEndpointRouteBuilder MapPaletteEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/palette/actions", GetActions).RequireAuthorization();
        return app;
    }

    public record PaletteAction(string Id, string Label, string Kind, string? Url, string? Hint);

    private static IResult GetActions()
    {
        var items = new[]
        {
            new PaletteAction("nav.overview",     "Go to Overview",        "nav",    "/",              "g o"),
            new PaletteAction("nav.inbasket",     "Go to Inbasket",        "nav",    "/inbasket",      "g i"),
            new PaletteAction("nav.documents",    "Go to Documents",       "nav",    "/documents",     null),
            new PaletteAction("nav.messages",     "Go to Messages",        "nav",    "/messages",      null),
            new PaletteAction("nav.labs",         "Go to Labs",            "nav",    "/labs",          null),
            new PaletteAction("nav.patients",     "Go to Patients",        "nav",    "/patients",      "g p"),
            new PaletteAction("nav.appointments", "Go to Appointments",    "nav",    "/appointments",  null),
            new PaletteAction("nav.pharmacy",     "Go to Pharmacy",        "nav",    "/pharmacy",      null),
            new PaletteAction("nav.billing",      "Go to Billing",         "nav",    "/billing",       null),
            new PaletteAction("nav.inventory",    "Go to Stock / Inventory","nav",   "/inventory",     null),
            new PaletteAction("nav.staff",        "Go to Staff",           "nav",    "/staff",         null),
            new PaletteAction("nav.ed",           "Go to ED",              "nav",    "/ed",            null),
            new PaletteAction("nav.telemetry",    "Go to Telemetry",       "nav",    "/telemetry",     null),
            new PaletteAction("nav.settings",     "Go to Settings",        "nav",    "/settings",      null),
            new PaletteAction("nav.sitemap",      "Go to Sitemap",         "nav",    "/sitemap",       null),

            new PaletteAction("action.new-note",       "New note",                "action", "/note-composer",      "n"),
            new PaletteAction("action.new-order",      "New order",               "action", "/order-builder",      null),
            new PaletteAction("action.open-emar",      "Open eMAR",               "action", "/emar",               null),
            new PaletteAction("action.new-patient",    "Admit new patient",       "action", "/admit",              null),
            new PaletteAction("action.new-appointment","Schedule new appointment","action", "/appointments/new",   null),
            new PaletteAction("action.new-message",    "Compose message",         "action", "/messages?compose=1", null),
            new PaletteAction("action.med-rec",        "Medication reconciliation","action","/med-rec",            null),
            new PaletteAction("action.new-consult",    "Request consult",         "action", "/consults/new",       null),
            new PaletteAction("action.code-team",      "Activate code team",      "action", "/code-events/new",    null),
            new PaletteAction("action.transfer",       "Transfer patient",        "action", "/transfers/new",      null),
            new PaletteAction("action.discharge",      "Discharge patient",       "action", "/patients?discharge=1",null),
            new PaletteAction("action.break-glass",    "Break-the-glass access",  "action", "/break-glass",        null),
            new PaletteAction("action.assessments",    "New assessment",          "action", "/assessments/new",    null),
            new PaletteAction("action.specimen-collect","Collect specimen",       "action", "/specimens/collect",  null),
            new PaletteAction("action.help",           "Show keyboard shortcuts", "action", null,                  "?"),
        };
        return Results.Ok(items);
    }
}
