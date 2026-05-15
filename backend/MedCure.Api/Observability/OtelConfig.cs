using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace MedCure.Api.Observability;

/// <summary>
/// Extension methods that register OpenTelemetry tracing and metrics for the MedCure API.
/// </summary>
public static class OtelConfig
{
    /// <summary>
    /// Environment variable read by the OTLP exporter. When set, the OTLP exporter is enabled
    /// in addition to (or instead of) the console exporter.
    /// </summary>
    private const string OtlpEndpointEnvVar = "OTEL_EXPORTER_OTLP_ENDPOINT";

    /// <summary>
    /// Registers MedCure observability with the host builder. Call once from
    /// <c>Program.cs</c> as <c>builder.AddMedCureObservability();</c>.
    /// </summary>
    public static WebApplicationBuilder AddMedCureObservability(this WebApplicationBuilder builder)
    {
        var environmentName = builder.Environment.EnvironmentName;
        var otlpEndpoint = Environment.GetEnvironmentVariable(OtlpEndpointEnvVar);
        var otlpEnabled = !string.IsNullOrWhiteSpace(otlpEndpoint);
        var isDevelopment = builder.Environment.IsDevelopment();

        var resourceBuilder = ResourceBuilder.CreateDefault()
            .AddService(
                serviceName: MedCureActivitySources.ServiceName,
                serviceVersion: MedCureActivitySources.ServiceVersion)
            .AddAttributes(new KeyValuePair<string, object>[]
            {
                new("deployment.environment", environmentName),
                new("service.namespace", "medcure"),
            });

        builder.Services
            .AddOpenTelemetry()
            .ConfigureResource(r => r
                .AddService(
                    serviceName: MedCureActivitySources.ServiceName,
                    serviceVersion: MedCureActivitySources.ServiceVersion)
                .AddAttributes(new KeyValuePair<string, object>[]
                {
                    new("deployment.environment", environmentName),
                    new("service.namespace", "medcure"),
                }))
            .WithTracing(tracing =>
            {
                tracing
                    .SetResourceBuilder(resourceBuilder)
                    .AddSource("medcure.*")
                    .AddAspNetCoreInstrumentation(o =>
                    {
                        o.RecordException = true;
                        // Skip noisy health/metrics endpoints if present.
                        o.Filter = ctx =>
                        {
                            var path = ctx.Request.Path.Value ?? string.Empty;
                            return !path.StartsWith("/health", StringComparison.OrdinalIgnoreCase)
                                && !path.StartsWith("/metrics", StringComparison.OrdinalIgnoreCase);
                        };
                    })
                    .AddHttpClientInstrumentation(o =>
                    {
                        o.RecordException = true;
                    })
                    .AddEntityFrameworkCoreInstrumentation(o =>
                    {
                        o.SetDbStatementForText = isDevelopment;
                    });

                if (isDevelopment)
                {
                    tracing.AddConsoleExporter();
                }

                if (otlpEnabled)
                {
                    tracing.AddOtlpExporter(o =>
                    {
                        o.Endpoint = new Uri(otlpEndpoint!);
                    });
                }
            })
            .WithMetrics(metrics =>
            {
                metrics
                    .SetResourceBuilder(resourceBuilder)
                    .AddMeter(MedCureActivitySources.Meter.Name)
                    .AddMeter("medcure.*")
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation()
                    .AddProcessInstrumentation();

                if (isDevelopment)
                {
                    metrics.AddConsoleExporter();
                }

                if (otlpEnabled)
                {
                    metrics.AddOtlpExporter(o =>
                    {
                        o.Endpoint = new Uri(otlpEndpoint!);
                    });
                }
            });

        return builder;
    }
}
