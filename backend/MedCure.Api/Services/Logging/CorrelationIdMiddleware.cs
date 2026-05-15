using Serilog.Context;

namespace MedCure.Api.Services.Logging;

public class CorrelationIdMiddleware
{
    private const string HeaderName = "X-Correlation-ID";
    private const string ItemKey = "CorrelationId";

    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        string correlationId;
        if (context.Request.Headers.TryGetValue(HeaderName, out var existing)
            && !string.IsNullOrWhiteSpace(existing.ToString()))
        {
            correlationId = existing.ToString();
        }
        else
        {
            correlationId = Guid.NewGuid().ToString("N")[..16];
        }

        context.Items[ItemKey] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await _next(context);
        }
    }
}
