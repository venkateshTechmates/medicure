namespace MedCure.Api.Services;

public interface IBarcodeRenderer
{
    string RenderSvg(string value, int width = 280, int height = 70);
}
