using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace MedCure.Api.Observability;

/// <summary>
/// Central registry for MedCure custom <see cref="ActivitySource"/> and <see cref="Meter"/> instances.
/// All custom source names start with the prefix <c>medcure.</c> so that OpenTelemetry can pick
/// them up via the wildcard subscription <c>AddSource("medcure.*")</c>.
/// </summary>
public static class MedCureActivitySources
{
    /// <summary>
    /// Common prefix for all MedCure-emitted activity sources and meters.
    /// </summary>
    public const string Prefix = "medcure";

    /// <summary>
    /// Service name reported as the <c>service.name</c> resource attribute.
    /// </summary>
    public const string ServiceName = "medcure-api";

    /// <summary>
    /// Service version reported as the <c>service.version</c> resource attribute.
    /// </summary>
    public const string ServiceVersion = "1.0.0";

    /// <summary>
    /// ActivitySource for clinical-domain spans (encounters, orders, results, vitals, meds).
    /// </summary>
    public static readonly ActivitySource Clinical = new("medcure.clinical", ServiceVersion);

    /// <summary>
    /// ActivitySource for authentication / authorization spans.
    /// </summary>
    public static readonly ActivitySource Auth = new("medcure.auth", ServiceVersion);

    /// <summary>
    /// ActivitySource for cross-cutting infrastructure spans (jobs, integrations).
    /// </summary>
    public static readonly ActivitySource Infrastructure = new("medcure.infrastructure", ServiceVersion);

    /// <summary>
    /// Default Meter for MedCure-emitted custom metrics.
    /// </summary>
    public static readonly Meter Meter = new("medcure.metrics", ServiceVersion);
}
