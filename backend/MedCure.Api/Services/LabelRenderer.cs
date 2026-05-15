using System.Net;
using System.Text;
using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Services;

public class LabelRenderer(IBarcodeRenderer barcodes) : ILabelRenderer
{
    private readonly IBarcodeRenderer _barcodes = barcodes;

    public string Wristband_Zpl(Patient p)
    {
        // 2x1" wristband at 203 dpi => 406x203 dots
        var name = $"{p.LastName}, {p.FirstName}".ToUpperInvariant();
        var dob = p.DateOfBirth.ToString("yyyy-MM-dd");
        var sb = new StringBuilder();
        sb.AppendLine("^XA");
        sb.AppendLine("^PW406");
        sb.AppendLine("^LL203");
        sb.AppendLine("^CF0,28");
        sb.AppendLine($"^FO12,12^FD{ZplEscape(name)}^FS");
        sb.AppendLine("^CF0,22");
        sb.AppendLine($"^FO12,46^FDDOB {ZplEscape(dob)}  SEX {ZplEscape(p.Sex)}^FS");
        sb.AppendLine($"^FO12,72^FDMRN {ZplEscape(p.Mrn)}^FS");
        sb.AppendLine("^BY2,3,60");
        sb.AppendLine($"^FO12,102^BCN,60,Y,N,N^FD{ZplEscape(p.Mrn)}^FS");
        sb.AppendLine("^XZ");
        return sb.ToString();
    }

    public string Wristband_Html(Patient p)
    {
        var name = WebUtility.HtmlEncode($"{p.LastName}, {p.FirstName}");
        var dob = p.DateOfBirth.ToString("yyyy-MM-dd");
        var mrn = WebUtility.HtmlEncode(p.Mrn);
        var sex = WebUtility.HtmlEncode(p.Sex);
        var ward = WebUtility.HtmlEncode(string.IsNullOrEmpty(p.Ward) ? "" : $"{p.Ward} {p.Bed}".Trim());
        var barcode = _barcodes.RenderSvg(p.Mrn, 360, 70);
        var title = $"Wristband {mrn}";
        return $$"""
<!doctype html>
<html><head><meta charset="utf-8"><title>{{title}}</title>
<style>
  @page { size: 4in 1in; margin: 0; }
  html, body { margin: 0; padding: 0; font-family: Inter, system-ui, sans-serif; color: #000; background: #fff; }
  .wb { width: 4in; height: 1in; padding: 6pt 8pt; box-sizing: border-box; display: grid; grid-template-columns: 1fr 1.5in; gap: 6pt; align-items: center; }
  .nm { font-size: 12pt; font-weight: 800; line-height: 1.05; letter-spacing: 0.2pt; }
  .meta { font-size: 8pt; line-height: 1.25; margin-top: 2pt; }
  .mrn { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 9pt; font-weight: 700; }
  .bc { display: flex; align-items: center; justify-content: center; }
  .bc svg { max-width: 100%; height: 60pt; }
  .toolbar { text-align: center; padding: 8pt; }
  @media print { .toolbar { display: none; } }
</style></head>
<body onload="window.print()">
<div class="wb">
  <div>
    <div class="nm">{{name}}</div>
    <div class="meta">DOB {{dob}} · SEX {{sex}}</div>
    <div class="meta mrn">MRN {{mrn}}</div>
    <div class="meta">{{ward}}</div>
  </div>
  <div class="bc">{{barcode}}</div>
</div>
<div class="toolbar"><button onclick="window.print()">Print</button></div>
</body></html>
""";
    }

    public string Specimen_Zpl(Specimen s, Patient p)
    {
        var accession = $"S-{s.Id:D7}";
        var name = $"{p.LastName}, {p.FirstName}".ToUpperInvariant();
        var collected = (s.CollectedAt ?? DateTime.UtcNow).ToString("yyyy-MM-dd HH:mm");
        var sb = new StringBuilder();
        sb.AppendLine("^XA");
        sb.AppendLine("^PW406");
        sb.AppendLine("^LL203");
        sb.AppendLine("^CF0,26");
        sb.AppendLine($"^FO12,10^FD{ZplEscape(name)}^FS");
        sb.AppendLine("^CF0,20");
        sb.AppendLine($"^FO12,40^FDMRN {ZplEscape(p.Mrn)}  DOB {ZplEscape(p.DateOfBirth.ToString("yyyy-MM-dd"))}^FS");
        sb.AppendLine($"^FO12,62^FD{ZplEscape(s.Type)} · {ZplEscape(s.Priority)}^FS");
        sb.AppendLine($"^FO12,82^FDColl {ZplEscape(collected)}^FS");
        sb.AppendLine("^BY2,3,55");
        sb.AppendLine($"^FO12,108^BCN,55,Y,N,N^FD{ZplEscape(accession)}^FS");
        sb.AppendLine("^XZ");
        return sb.ToString();
    }

    public string Specimen_Html(Specimen s, Patient p)
    {
        var accession = $"S-{s.Id:D7}";
        var name = WebUtility.HtmlEncode($"{p.LastName}, {p.FirstName}");
        var mrn = WebUtility.HtmlEncode(p.Mrn);
        var dob = p.DateOfBirth.ToString("yyyy-MM-dd");
        var type = WebUtility.HtmlEncode(s.Type);
        var priority = WebUtility.HtmlEncode(s.Priority);
        var collected = (s.CollectedAt ?? DateTime.UtcNow).ToString("yyyy-MM-dd HH:mm");
        var collectedBy = WebUtility.HtmlEncode(s.CollectedBy);
        var barcode = _barcodes.RenderSvg(accession, 360, 70);
        return $$"""
<!doctype html>
<html><head><meta charset="utf-8"><title>Specimen {{accession}}</title>
<style>
  @page { size: 4in 1in; margin: 0; }
  html, body { margin: 0; padding: 0; font-family: Inter, system-ui, sans-serif; color: #000; background: #fff; }
  .lb { width: 4in; height: 1in; padding: 4pt 6pt; box-sizing: border-box; display: grid; grid-template-columns: 1fr 1.5in; gap: 4pt; align-items: center; }
  .nm { font-size: 10pt; font-weight: 800; line-height: 1.05; }
  .meta { font-size: 7.5pt; line-height: 1.25; }
  .acc { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 9pt; font-weight: 700; }
  .bc svg { max-width: 100%; height: 60pt; }
  .toolbar { text-align: center; padding: 8pt; }
  @media print { .toolbar { display: none; } }
</style></head>
<body onload="window.print()">
<div class="lb">
  <div>
    <div class="nm">{{name}}</div>
    <div class="meta">MRN {{mrn}} · DOB {{dob}}</div>
    <div class="meta"><b>{{type}}</b> · {{priority}}</div>
    <div class="meta">Coll {{collected}} {{collectedBy}}</div>
    <div class="meta acc">{{accession}}</div>
  </div>
  <div class="bc">{{barcode}}</div>
</div>
<div class="toolbar"><button onclick="window.print()">Print</button></div>
</body></html>
""";
    }

    private static string ZplEscape(string s) => (s ?? "").Replace("^", " ").Replace("~", " ");
}
