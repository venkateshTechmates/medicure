using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Fhir;

/// <summary>
/// Static mapping helpers from MedCure domain entities to FHIR R4 anonymous records.
/// Returned objects are serialized via System.Text.Json — no external FHIR library.
/// </summary>
public static class FhirMappers
{
    private const string MrnSystem = "https://medcure.health/mrn";

    private static string Iso(DateTime dt) =>
        DateTime.SpecifyKind(dt, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ssZ");

    private static string IsoDate(DateTime dt) =>
        dt.ToString("yyyy-MM-dd");

    private static object Meta(DateTime updatedAt) =>
        new { lastUpdated = Iso(updatedAt) };

    private static object PatientRef(Patient p) =>
        new { reference = $"Patient/{p.Mrn}", display = $"{p.FirstName} {p.LastName}" };

    private static object Codeable(string system, string code, string display, string? text = null) =>
        new
        {
            coding = new[] { new { system, code, display } },
            text = text ?? display
        };

    public static object Bundle<T>(IEnumerable<T> resources)
    {
        var list = resources.ToList();
        return new
        {
            resourceType = "Bundle",
            type = "searchset",
            total = list.Count,
            entry = list.Select(r => new { resource = r! }).ToArray()
        };
    }

    // ---------- Patient ----------
    public static object ToFhirPatient(Patient p)
    {
        var genderCode = p.Sex?.ToLowerInvariant() switch
        {
            "m" or "male" => "male",
            "f" or "female" => "female",
            "o" or "other" => "other",
            _ => "unknown"
        };
        return new
        {
            resourceType = "Patient",
            id = p.Mrn,
            meta = Meta(p.UpdatedAt),
            identifier = new[]
            {
                new
                {
                    use = "usual",
                    system = MrnSystem,
                    value = p.Mrn
                }
            },
            active = !string.Equals(p.Status, "discharged", StringComparison.OrdinalIgnoreCase),
            name = new[]
            {
                new
                {
                    use = "official",
                    family = p.LastName,
                    given = new[] { p.FirstName },
                    text = $"{p.FirstName} {p.LastName}"
                }
            },
            telecom = string.IsNullOrWhiteSpace(p.Phone)
                ? Array.Empty<object>()
                : new object[]
                {
                    new { system = "phone", value = p.Phone, use = "home" }
                },
            gender = genderCode,
            birthDate = IsoDate(p.DateOfBirth),
            address = string.IsNullOrWhiteSpace(p.Address)
                ? Array.Empty<object>()
                : new object[] { new { use = "home", text = p.Address } }
        };
    }

    // ---------- Observation (Vital) ----------
    private static object Quantity(double value, string unit, string code) =>
        new { value, unit, system = "http://unitsofmeasure.org", code };

    private static object Component(string loincCode, string display, double value, string unit, string ucum) =>
        new
        {
            code = Codeable("http://loinc.org", loincCode, display),
            valueQuantity = Quantity(value, unit, ucum)
        };

    public static object ToFhirObservation(Vital v)
    {
        var components = new List<object>();
        if (v.Hr > 0) components.Add(Component("8867-4", "Heart rate", v.Hr, "beats/minute", "/min"));
        if (v.Sbp > 0) components.Add(Component("8480-6", "Systolic blood pressure", v.Sbp, "mm[Hg]", "mm[Hg]"));
        if (v.Dbp > 0) components.Add(Component("8462-4", "Diastolic blood pressure", v.Dbp, "mm[Hg]", "mm[Hg]"));
        if (v.Spo2 > 0) components.Add(Component("59408-5", "Oxygen saturation", v.Spo2, "%", "%"));
        if (v.Rr > 0) components.Add(Component("9279-1", "Respiratory rate", v.Rr, "breaths/minute", "/min"));
        if (v.TempC > 0) components.Add(Component("8310-5", "Body temperature", v.TempC, "Cel", "Cel"));
        if (v.Pain.HasValue) components.Add(Component("38208-5", "Pain severity", v.Pain.Value, "score", "{score}"));

        return new
        {
            resourceType = "Observation",
            id = $"vital-{v.Id}",
            meta = Meta(v.UpdatedAt),
            status = "final",
            category = new[]
            {
                Codeable("http://terminology.hl7.org/CodeSystem/observation-category", "vital-signs", "Vital Signs")
            },
            code = Codeable("http://loinc.org", "85353-1", "Vital signs panel"),
            subject = v.Patient is null
                ? new { reference = $"Patient/{v.PatientId}", display = (string?)null }
                : PatientRef(v.Patient),
            effectiveDateTime = Iso(v.RecordedAt),
            issued = Iso(v.RecordedAt),
            component = components.ToArray()
        };
    }

    // ---------- Observation (Lab) ----------
    public static object ToFhirObservation(LabResult l)
    {
        var status = l.Flag?.ToLowerInvariant() switch
        {
            "critical" => "amended",
            _ => "final"
        };
        var interpretationCode = l.Flag?.ToLowerInvariant() switch
        {
            "high" => "H",
            "low" => "L",
            "critical" => "HH",
            _ => "N"
        };

        var resource = new Dictionary<string, object?>
        {
            ["resourceType"] = "Observation",
            ["id"] = $"lab-{l.Id}",
            ["meta"] = Meta(l.UpdatedAt),
            ["status"] = status,
            ["category"] = new[]
            {
                Codeable("http://terminology.hl7.org/CodeSystem/observation-category", "laboratory", "Laboratory")
            },
            ["code"] = Codeable("https://medcure.health/lab", l.TestName, l.TestName),
            ["subject"] = l.Patient is null
                ? new { reference = $"Patient/{l.PatientId}", display = (string?)null }
                : PatientRef(l.Patient),
            ["effectiveDateTime"] = Iso(l.ResultedAt),
            ["issued"] = Iso(l.ResultedAt),
            ["interpretation"] = new[]
            {
                Codeable("http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                    interpretationCode, l.Flag ?? "normal")
            }
        };

        if (double.TryParse(l.Value, out var numeric))
        {
            resource["valueQuantity"] = new
            {
                value = numeric,
                unit = l.Units,
                system = "http://unitsofmeasure.org",
                code = l.Units
            };
        }
        else
        {
            resource["valueString"] = string.IsNullOrEmpty(l.Units) ? l.Value : $"{l.Value} {l.Units}";
        }

        if (!string.IsNullOrEmpty(l.RefRange))
        {
            resource["referenceRange"] = new[] { new { text = l.RefRange } };
        }

        return resource;
    }

    // ---------- MedicationRequest ----------
    public static object ToFhirMedicationRequest(Order o)
    {
        var fhirStatus = o.Status?.ToLowerInvariant() switch
        {
            "draft" => "draft",
            "cancelled" => "cancelled",
            "discontinued" => "stopped",
            _ => "active"
        };

        var dosage = new List<object>();
        if (!string.IsNullOrEmpty(o.Dose) || !string.IsNullOrEmpty(o.Route) || !string.IsNullOrEmpty(o.Frequency))
        {
            dosage.Add(new
            {
                text = $"{o.Dose} {o.Route} {o.Frequency}".Trim(),
                route = string.IsNullOrEmpty(o.Route) ? null : Codeable("https://medcure.health/route", o.Route, o.Route),
                timing = string.IsNullOrEmpty(o.Frequency) ? null : new { code = new { text = o.Frequency } }
            });
        }

        return new
        {
            resourceType = "MedicationRequest",
            id = $"med-{o.Id}",
            meta = Meta(o.UpdatedAt),
            status = fhirStatus,
            intent = "order",
            priority = (o.Priority ?? "routine").ToLowerInvariant(),
            medicationCodeableConcept = Codeable("https://medcure.health/medication", o.Name, o.Name),
            subject = o.Patient is null
                ? new { reference = $"Patient/{o.PatientId}", display = (string?)null }
                : PatientRef(o.Patient),
            authoredOn = Iso(o.SignedAt ?? o.CreatedAt),
            requester = string.IsNullOrEmpty(o.OrderedByName)
                ? null
                : new { display = o.OrderedByName },
            reasonCode = string.IsNullOrEmpty(o.Indication)
                ? Array.Empty<object>()
                : new object[] { new { text = o.Indication } },
            dosageInstruction = dosage.ToArray(),
            note = string.IsNullOrEmpty(o.Notes) ? Array.Empty<object>() : new object[] { new { text = o.Notes } }
        };
    }

    // ---------- AllergyIntolerance ----------
    public static object ToFhirAllergyIntolerance(Allergy a)
    {
        var criticality = a.Severity?.ToLowerInvariant() switch
        {
            "severe" => "high",
            "moderate" => "low",
            _ => "low"
        };
        return new
        {
            resourceType = "AllergyIntolerance",
            id = $"allergy-{a.Id}",
            meta = Meta(a.UpdatedAt),
            clinicalStatus = Codeable(
                "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "active", "Active"),
            verificationStatus = Codeable(
                "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", "confirmed", "Confirmed"),
            type = "allergy",
            criticality,
            code = Codeable("https://medcure.health/allergen", a.Substance, a.Substance),
            patient = a.Patient is null
                ? new { reference = $"Patient/{a.PatientId}", display = (string?)null }
                : PatientRef(a.Patient),
            recordedDate = Iso(a.CreatedAt),
            reaction = string.IsNullOrEmpty(a.Reaction)
                ? Array.Empty<object>()
                : new object[]
                {
                    new
                    {
                        manifestation = new[]
                        {
                            Codeable("https://medcure.health/reaction", a.Reaction, a.Reaction)
                        },
                        severity = (a.Severity ?? "moderate").ToLowerInvariant()
                    }
                }
        };
    }

    // ---------- Condition ----------
    public static object ToFhirCondition(Problem p)
    {
        var clinical = p.Type?.ToLowerInvariant() switch
        {
            "resolved" => ("resolved", "Resolved"),
            _ => ("active", "Active")
        };
        return new
        {
            resourceType = "Condition",
            id = $"problem-{p.Id}",
            meta = Meta(p.UpdatedAt),
            clinicalStatus = Codeable(
                "http://terminology.hl7.org/CodeSystem/condition-clinical", clinical.Item1, clinical.Item2),
            verificationStatus = Codeable(
                "http://terminology.hl7.org/CodeSystem/condition-ver-status", "confirmed", "Confirmed"),
            category = new[]
            {
                Codeable("http://terminology.hl7.org/CodeSystem/condition-category",
                    "problem-list-item", "Problem List Item")
            },
            code = string.IsNullOrEmpty(p.IcdCode)
                ? new { text = p.Description }
                : Codeable("http://hl7.org/fhir/sid/icd-10-cm", p.IcdCode, p.Description, p.Description),
            subject = p.Patient is null
                ? new { reference = $"Patient/{p.PatientId}", display = (string?)null }
                : PatientRef(p.Patient),
            onsetDateTime = Iso(p.Onset),
            recordedDate = Iso(p.CreatedAt)
        };
    }

    // ---------- Encounter ----------
    public static object ToFhirEncounter(Encounter e)
    {
        var classCode = e.Type?.ToLowerInvariant() switch
        {
            "inpatient" => ("IMP", "inpatient encounter"),
            "ed" => ("EMER", "emergency"),
            "clinic" => ("AMB", "ambulatory"),
            "or" => ("IMP", "inpatient encounter"),
            _ => ("AMB", "ambulatory")
        };
        var status = e.EndAt.HasValue ? "finished" : "in-progress";

        var period = e.EndAt.HasValue
            ? (object)new { start = Iso(e.StartAt), end = Iso(e.EndAt.Value) }
            : new { start = Iso(e.StartAt) };

        return new
        {
            resourceType = "Encounter",
            id = $"encounter-{e.Id}",
            meta = Meta(e.UpdatedAt),
            status,
            @class = new
            {
                system = "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                code = classCode.Item1,
                display = classCode.Item2
            },
            type = new[]
            {
                Codeable("https://medcure.health/encounter-type", e.Type ?? "Unknown", e.Type ?? "Unknown")
            },
            subject = e.Patient is null
                ? new { reference = $"Patient/{e.PatientId}", display = (string?)null }
                : PatientRef(e.Patient),
            period,
            reasonCode = string.IsNullOrEmpty(e.ChiefComplaint)
                ? Array.Empty<object>()
                : new object[] { new { text = e.ChiefComplaint } },
            hospitalization = string.IsNullOrEmpty(e.Disposition)
                ? null
                : new { dischargeDisposition = new { text = e.Disposition } }
        };
    }

    // ---------- DiagnosticReport (panel-grouped labs) ----------
    public static object ToFhirDiagnosticReport(Patient patient, string panel, IReadOnlyList<LabResult> labs)
    {
        var issued = labs.Max(l => l.ResultedAt);
        var lastUpdated = labs.Max(l => l.UpdatedAt);
        return new
        {
            resourceType = "DiagnosticReport",
            id = $"report-{patient.Mrn}-{panel.Replace(' ', '-')}",
            meta = Meta(lastUpdated),
            status = "final",
            category = new[]
            {
                Codeable("http://terminology.hl7.org/CodeSystem/v2-0074", "LAB", "Laboratory")
            },
            code = Codeable("https://medcure.health/lab-panel", panel, panel),
            subject = PatientRef(patient),
            effectiveDateTime = Iso(issued),
            issued = Iso(issued),
            result = labs.Select(l => new
            {
                reference = $"Observation/lab-{l.Id}",
                display = $"{l.TestName}: {l.Value} {l.Units}".Trim()
            }).ToArray()
        };
    }

    // ---------- CapabilityStatement ----------
    public static object CapabilityStatement()
    {
        var now = Iso(DateTime.UtcNow);
        string[] resources = { "Patient", "Observation", "MedicationRequest", "AllergyIntolerance", "Condition", "Encounter", "DiagnosticReport" };
        return new
        {
            resourceType = "CapabilityStatement",
            id = "medcure-fhir",
            status = "active",
            date = now,
            publisher = "MedCure",
            kind = "instance",
            software = new { name = "MedCure FHIR Adapter", version = "1.0.0" },
            implementation = new { description = "MedCure read-only FHIR R4 adapter" },
            fhirVersion = "4.0.1",
            format = new[] { "json" },
            rest = new[]
            {
                new
                {
                    mode = "server",
                    security = new
                    {
                        cors = true,
                        service = new[]
                        {
                            Codeable("http://terminology.hl7.org/CodeSystem/restful-security-service",
                                "OAuth", "OAuth")
                        }
                    },
                    resource = resources.Select(r => new
                    {
                        type = r,
                        interaction = r == "Patient"
                            ? new[] { new { code = "read" }, new { code = "search-type" } }
                            : new[] { new { code = "search-type" } }
                    }).ToArray()
                }
            }
        };
    }
}
