using System.Net;
using System.Text;

namespace MedCure.Api.Services;

/// HTML-print renderer: returns a standalone HTML document tuned for browser print.
/// We chose HTML over QuestPDF to avoid adding a NuGet dependency; the browser handles
/// pagination via @page CSS.
public class DischargePdfRenderer(IBarcodeRenderer barcodes) : IDischargePdfRenderer
{
    private readonly IBarcodeRenderer _barcodes = barcodes;

    public string RenderHtml(DischargePacketData d)
    {
        var p = d.Patient;
        var name = WebUtility.HtmlEncode($"{p.FirstName} {p.LastName}");
        var mrn = WebUtility.HtmlEncode(p.Mrn);
        var dob = p.DateOfBirth.ToString("yyyy-MM-dd");
        var sex = WebUtility.HtmlEncode(p.Sex);
        var attending = WebUtility.HtmlEncode(p.AttendingName);
        var admitted = p.AdmittedAt == default ? "" : p.AdmittedAt.ToString("yyyy-MM-dd HH:mm");
        var barcode = _barcodes.RenderSvg(p.Mrn, 220, 50);
        var generated = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm 'UTC'");

        var meds = new StringBuilder();
        if (d.Medications.Count == 0)
        {
            meds.Append("<tr><td colspan=\"4\" class=\"empty\">No active medications</td></tr>");
        }
        else
        {
            foreach (var m in d.Medications)
            {
                meds.Append("<tr>")
                    .Append($"<td><b>{WebUtility.HtmlEncode(m.Name)}</b></td>")
                    .Append($"<td>{WebUtility.HtmlEncode(m.Dose)} {WebUtility.HtmlEncode(m.Route)}</td>")
                    .Append($"<td>{WebUtility.HtmlEncode(m.Frequency)}</td>")
                    .Append($"<td>{WebUtility.HtmlEncode(m.Indication)}</td>")
                    .Append("</tr>");
            }
        }

        var followUps = new StringBuilder();
        if (d.FollowUps.Count == 0)
        {
            followUps.Append("<tr><td colspan=\"4\" class=\"empty\">No follow-ups scheduled</td></tr>");
        }
        else
        {
            foreach (var a in d.FollowUps)
            {
                followUps.Append("<tr>")
                    .Append($"<td>{a.ScheduledAt:yyyy-MM-dd HH:mm}</td>")
                    .Append($"<td><b>{WebUtility.HtmlEncode(a.ProviderName)}</b></td>")
                    .Append($"<td>{WebUtility.HtmlEncode(a.Specialty)}</td>")
                    .Append($"<td>{WebUtility.HtmlEncode(a.Type)} · {WebUtility.HtmlEncode(a.Room)}</td>")
                    .Append("</tr>");
            }
        }

        var allergies = new StringBuilder();
        if (d.Allergies.Count == 0)
        {
            allergies.Append("<li class=\"empty\">No known allergies</li>");
        }
        else
        {
            foreach (var a in d.Allergies)
            {
                allergies.Append($"<li><b>{WebUtility.HtmlEncode(a.Substance)}</b> — {WebUtility.HtmlEncode(a.Reaction)} ({WebUtility.HtmlEncode(a.Severity)})</li>");
            }
        }

        string summaryBody;
        string signedBy;
        string signedAt;
        if (d.DischargeNote is { } n)
        {
            summaryBody = WebUtility.HtmlEncode(n.Content).Replace("\n", "<br/>");
            signedBy = WebUtility.HtmlEncode(n.AuthorName);
            signedAt = (n.SignedAt ?? n.CreatedAt).ToString("yyyy-MM-dd HH:mm 'UTC'");
        }
        else
        {
            summaryBody = "<i>No discharge note on file.</i>";
            signedBy = "—";
            signedAt = "—";
        }

        return $$"""
<!doctype html>
<html><head><meta charset="utf-8"><title>Discharge packet · {{name}} · {{mrn}}</title>
<style>
  @page { size: Letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: Inter, system-ui, sans-serif; color: #111; background: #fff; font-size: 10pt; line-height: 1.4; }
  h1 { font-size: 18pt; margin: 0 0 4pt; }
  h2 { font-size: 12pt; margin: 18pt 0 6pt; border-bottom: 1px solid #999; padding-bottom: 3pt; }
  .hdr { display: grid; grid-template-columns: 1fr auto; gap: 16pt; align-items: start; padding-bottom: 8pt; border-bottom: 2px solid #000; }
  .ident { font-size: 9pt; }
  .ident b { display: inline-block; min-width: 64pt; }
  .bc svg { height: 50pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 4pt; }
  th, td { text-align: left; padding: 4pt 6pt; border-bottom: 1px solid #ddd; font-size: 9pt; vertical-align: top; }
  th { background: #f3f3f3; font-weight: 700; }
  .empty { color: #777; font-style: italic; }
  ul { margin: 4pt 0; padding-left: 18pt; }
  ul li { font-size: 9pt; }
  .sig { margin-top: 24pt; padding-top: 8pt; border-top: 1px solid #000; display: grid; grid-template-columns: 1fr 1fr; gap: 24pt; font-size: 9pt; }
  .footer { margin-top: 24pt; font-size: 8pt; color: #666; text-align: center; }
  .summary { white-space: pre-wrap; font-size: 10pt; padding: 6pt 8pt; background: #fafafa; border: 1px solid #ddd; border-radius: 4pt; }
  .toolbar { position: fixed; top: 8pt; right: 8pt; }
  @media print { .toolbar { display: none; } }
</style></head>
<body onload="window.print()">
<div class="toolbar"><button onclick="window.print()">Print</button></div>

<div class="hdr">
  <div>
    <h1>Discharge packet</h1>
    <div class="ident"><b>Patient</b> {{name}}</div>
    <div class="ident"><b>MRN</b> {{mrn}}</div>
    <div class="ident"><b>DOB / Sex</b> {{dob}} · {{sex}}</div>
    <div class="ident"><b>Admitted</b> {{admitted}}</div>
    <div class="ident"><b>Attending</b> {{attending}}</div>
  </div>
  <div class="bc">{{barcode}}</div>
</div>

<h2>Discharge summary</h2>
<div class="summary">{{summaryBody}}</div>

<h2>Discharge medications</h2>
<table>
  <thead><tr><th>Medication</th><th>Dose / Route</th><th>Frequency</th><th>Indication</th></tr></thead>
  <tbody>{{meds}}</tbody>
</table>

<h2>Follow-up appointments</h2>
<table>
  <thead><tr><th>When</th><th>Provider</th><th>Specialty</th><th>Type</th></tr></thead>
  <tbody>{{followUps}}</tbody>
</table>

<h2>Allergies</h2>
<ul>{{allergies}}</ul>

<div class="sig">
  <div>
    <div><b>Signed by</b></div>
    <div>{{signedBy}}</div>
    <div>{{signedAt}}</div>
  </div>
  <div>
    <div><b>Patient acknowledgement</b></div>
    <div style="margin-top:18pt; border-bottom:1px solid #000;">&nbsp;</div>
    <div style="margin-top:4pt;">Signature / Date</div>
  </div>
</div>

<div class="footer">Generated {{generated}} · MedCure Health</div>
</body></html>
""";
    }
}
