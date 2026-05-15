using System.Text;

namespace MedCure.Api.Services;

/// Placeholder barcode renderer: emits an SVG with a deterministic striped pattern
/// derived from the value plus the human-readable text below. This is intentionally
/// a stand-in for a real Code128 encoder — clearly OK for the demo, machine readable
/// only via the human-readable text line.
public class BarcodeRenderer : IBarcodeRenderer
{
    public string RenderSvg(string value, int width = 280, int height = 70)
    {
        var bars = BuildBars(value, width);
        var sb = new StringBuilder();
        sb.Append($"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 {width} {height}\" width=\"{width}\" height=\"{height}\">");
        sb.Append($"<rect width=\"{width}\" height=\"{height}\" fill=\"#fff\"/>");
        int x = 4;
        foreach (var bar in bars)
        {
            if (bar.Filled)
                sb.Append($"<rect x=\"{x}\" y=\"4\" width=\"{bar.Width}\" height=\"{height - 22}\" fill=\"#000\"/>");
            x += bar.Width;
            if (x >= width - 4) break;
        }
        var safe = System.Net.WebUtility.HtmlEncode(value);
        sb.Append($"<text x=\"{width / 2}\" y=\"{height - 4}\" text-anchor=\"middle\" font-family=\"JetBrains Mono, monospace\" font-size=\"11\" fill=\"#000\">*{safe}*</text>");
        sb.Append("</svg>");
        return sb.ToString();
    }

    private static List<(int Width, bool Filled)> BuildBars(string value, int totalWidth)
    {
        var seed = 0;
        foreach (var c in value) seed = unchecked(seed * 31 + c);
        var rng = new Random(seed);
        var bars = new List<(int, bool)>();
        var budget = totalWidth - 8;
        bool filled = true;
        while (budget > 0)
        {
            var w = rng.Next(1, 4);
            if (w > budget) w = budget;
            bars.Add((w, filled));
            filled = !filled;
            budget -= w;
        }
        return bars;
    }
}
