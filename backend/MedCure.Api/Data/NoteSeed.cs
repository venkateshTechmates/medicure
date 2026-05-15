using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Data;

public static class NoteSeed
{
    public static async Task SeedSystemNoteTemplatesAsync(AppDbContext db)
    {
        if (await db.Set<NoteTemplate>().AnyAsync(t => t.Scope == "system")) return;

        var soap = new NoteTemplate
        {
            TenantId = 0,
            Scope = "system",
            Code = "soap",
            Title = "SOAP Note",
            Specialty = "General",
            Type = "SOAP",
            Body =
@"Patient: @name@ (MRN @mrn@) · @age@ y/o @sex@
Author: @author@ · Date: @today@

Subjective:


Objective:
Vitals: @lastvitals@
Active problems: @problems@
Active meds: @meds@
Allergies: @allergies@

Assessment:


Plan:
",
        };

        var hp = new NoteTemplate
        {
            TenantId = 0,
            Scope = "system",
            Code = "hp",
            Title = "History & Physical (H&P)",
            Specialty = "General",
            Type = "H&P",
            Body =
@"Patient: @name@ (MRN @mrn@) · @age@ y/o @sex@
Author: @author@ · Date: @today@

Chief Complaint:

History of Present Illness:

Past Medical History:
@problems@

Medications:
@meds@

Allergies:
@allergies@

Family History:

Social History:

Review of Systems:

Physical Exam:
Vitals: @lastvitals@
General:
HEENT:
Cardiovascular:
Respiratory:
Abdomen:
Extremities:
Neurologic:

Assessment & Plan:
",
        };

        var progress = new NoteTemplate
        {
            TenantId = 0,
            Scope = "system",
            Code = "progress",
            Title = "Progress Note",
            Specialty = "General",
            Type = "Progress",
            Body =
@"Patient: @name@ (MRN @mrn@) · @age@ y/o @sex@
Author: @author@ · Date: @today@

Interval History:

Exam:
Vitals: @lastvitals@

Problems:
@problems@

Current Meds:
@meds@

Assessment / Plan:
",
        };

        var procedure = new NoteTemplate
        {
            TenantId = 0,
            Scope = "system",
            Code = "procedure",
            Title = "Procedure Note",
            Specialty = "General",
            Type = "Procedure",
            Body =
@"Patient: @name@ (MRN @mrn@) · @age@ y/o @sex@
Operator: @author@ · Date: @today@
Allergies: @allergies@

Procedure:
Indication:
Consent: Verbal/written consent obtained, risks discussed.
Time-out performed: yes
Pre-procedure vitals: @lastvitals@

Anesthesia / Sedation:

Technique:

Findings:

Complications: none

Estimated blood loss:

Specimens sent:

Disposition:
",
        };

        var discharge = new NoteTemplate
        {
            TenantId = 0,
            Scope = "system",
            Code = "discharge",
            Title = "Discharge Summary",
            Specialty = "General",
            Type = "Discharge",
            Body =
@"Patient: @name@ (MRN @mrn@) · @age@ y/o @sex@
Attending: @author@ · Discharge date: @today@

Admission Diagnosis:

Discharge Diagnosis:

Hospital Course:

Procedures Performed:

Discharge Medications:
@meds@

Allergies:
@allergies@

Problem List at Discharge:
@problems@

Discharge Vitals: @lastvitals@

Follow-up:

Patient Education / Instructions:

Code Status:
",
        };

        db.Set<NoteTemplate>().AddRange(soap, hp, progress, procedure, discharge);
        await db.SaveChangesAsync();
    }
}
