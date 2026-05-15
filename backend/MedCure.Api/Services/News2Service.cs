using MedCure.Api.Domain.Entities;

namespace MedCure.Api.Services;

public class News2Service : INews2Service
{
    // Standard NEWS2 (Royal College of Physicians) — clinical early-warning score.
    public int Score(Vital v)
    {
        int s = 0;
        s += BandRR(v.Rr);
        s += BandSpo2(v.Spo2);
        s += BandTemp(v.TempC);
        s += BandSbp(v.Sbp);
        s += BandHr(v.Hr);
        return s;
    }

    public string Risk(int score) => score switch
    {
        >= 7 => "high",
        >= 5 => "medium",
        _    => "low"
    };

    private static int BandRR(int rr) =>
        rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3;
    private static int BandSpo2(int spo2) =>
        spo2 <= 91 ? 3 : spo2 <= 93 ? 2 : spo2 <= 95 ? 1 : 0;
    private static int BandTemp(double t) =>
        t <= 35.0 ? 3 : t <= 36.0 ? 1 : t <= 38.0 ? 0 : t <= 39.0 ? 1 : 2;
    private static int BandSbp(int sbp) =>
        sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : sbp <= 219 ? 0 : 3;
    private static int BandHr(int hr) =>
        hr <= 40 ? 3 : hr <= 50 ? 1 : hr <= 90 ? 0 : hr <= 110 ? 1 : hr <= 130 ? 2 : 3;
}
