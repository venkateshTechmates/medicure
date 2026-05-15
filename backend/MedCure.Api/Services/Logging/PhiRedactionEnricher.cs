using System.Text.RegularExpressions;
using Serilog.Core;
using Serilog.Events;

namespace MedCure.Api.Services.Logging;

public class PhiRedactionEnricher : ILogEventEnricher
{
    private const string RedactedToken = "[REDACTED:phi]";

    private static readonly HashSet<string> SensitiveProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        "Mrn",
        "Ssn",
        "Dob",
        "Email",
        "Phone",
        "Address",
        "Password",
    };

    private static readonly Regex SsnPattern = new(@"\b\d{3}-\d{2}-\d{4}\b", RegexOptions.Compiled);
    private static readonly Regex PhonePattern = new(
        @"\b(?:\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4})\b",
        RegexOptions.Compiled);

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        var keys = logEvent.Properties.Keys.ToList();
        foreach (var key in keys)
        {
            if (SensitiveProperties.Contains(key))
            {
                logEvent.AddOrUpdateProperty(propertyFactory.CreateProperty(key, RedactedToken));
                continue;
            }

            if (logEvent.Properties.TryGetValue(key, out var value))
            {
                var rewritten = RedactValue(value, propertyFactory);
                if (!ReferenceEquals(rewritten, value))
                {
                    logEvent.AddOrUpdateProperty(propertyFactory.CreateProperty(key, GetUnderlyingValue(rewritten)));
                }
            }
        }
    }

    private static LogEventPropertyValue RedactValue(LogEventPropertyValue value, ILogEventPropertyFactory propertyFactory)
    {
        switch (value)
        {
            case ScalarValue scalar when scalar.Value is string s:
                var redacted = RedactString(s);
                return ReferenceEquals(redacted, s) ? scalar : new ScalarValue(redacted);

            case StructureValue structure:
                var changed = false;
                var newProps = new List<LogEventProperty>(structure.Properties.Count);
                foreach (var p in structure.Properties)
                {
                    if (SensitiveProperties.Contains(p.Name))
                    {
                        newProps.Add(new LogEventProperty(p.Name, new ScalarValue(RedactedToken)));
                        changed = true;
                    }
                    else
                    {
                        var inner = RedactValue(p.Value, propertyFactory);
                        if (!ReferenceEquals(inner, p.Value))
                        {
                            newProps.Add(new LogEventProperty(p.Name, inner));
                            changed = true;
                        }
                        else
                        {
                            newProps.Add(p);
                        }
                    }
                }
                return changed ? new StructureValue(newProps, structure.TypeTag) : structure;

            case DictionaryValue dict:
                var dictChanged = false;
                var newDict = new List<KeyValuePair<ScalarValue, LogEventPropertyValue>>(dict.Elements.Count);
                foreach (var kv in dict.Elements)
                {
                    var inner = RedactValue(kv.Value, propertyFactory);
                    if (!ReferenceEquals(inner, kv.Value))
                    {
                        newDict.Add(new KeyValuePair<ScalarValue, LogEventPropertyValue>(kv.Key, inner));
                        dictChanged = true;
                    }
                    else
                    {
                        newDict.Add(kv);
                    }
                }
                return dictChanged ? new DictionaryValue(newDict) : dict;

            case SequenceValue seq:
                var seqChanged = false;
                var newElems = new List<LogEventPropertyValue>(seq.Elements.Count);
                foreach (var e in seq.Elements)
                {
                    var inner = RedactValue(e, propertyFactory);
                    if (!ReferenceEquals(inner, e))
                    {
                        newElems.Add(inner);
                        seqChanged = true;
                    }
                    else
                    {
                        newElems.Add(e);
                    }
                }
                return seqChanged ? new SequenceValue(newElems) : seq;
        }

        return value;
    }

    private static object? GetUnderlyingValue(LogEventPropertyValue value)
    {
        return value switch
        {
            ScalarValue s => s.Value,
            _ => value,
        };
    }

    public static string RedactString(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        var result = SsnPattern.Replace(input, RedactedToken);
        result = PhonePattern.Replace(result, RedactedToken);
        return result;
    }
}
