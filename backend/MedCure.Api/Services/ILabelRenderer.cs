using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Services;

public interface ILabelRenderer
{
    string Wristband_Zpl(Patient p);
    string Wristband_Html(Patient p);
    string Specimen_Zpl(Specimen s, Patient p);
    string Specimen_Html(Specimen s, Patient p);
}
