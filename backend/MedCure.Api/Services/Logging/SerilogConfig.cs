using Serilog;
using Serilog.Events;
using Serilog.Formatting.Compact;

namespace MedCure.Api.Services.Logging;

public static class SerilogConfig
{
    public static void ConfigureSerilog(WebApplicationBuilder builder)
    {
        var logPath = builder.Configuration["Logging:Path"] ?? "logs/medcure-.json";
        var levelText = builder.Configuration["Logging:Level"] ?? "Information";
        if (!Enum.TryParse<LogEventLevel>(levelText, true, out var minLevel))
            minLevel = LogEventLevel.Information;

        builder.Host.UseSerilog((ctx, lc) =>
        {
            lc
                .MinimumLevel.Is(minLevel)
                .MinimumLevel.Override("Microsoft.AspNetCore.Hosting.Diagnostics", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.AspNetCore.Routing.Matching", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .Enrich.WithMachineName()
                .Enrich.WithThreadId()
                .Enrich.WithEnvironmentName()
                .Enrich.With(new PhiRedactionEnricher())
                .WriteTo.Console(new CompactJsonFormatter())
                .WriteTo.File(
                    new CompactJsonFormatter(),
                    logPath,
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 14,
                    shared: true);
        });
    }
}
