namespace MedCure.Api.Auth;

public class JwtOptions
{
    public string Issuer { get; set; } = "medcure";
    public string Audience { get; set; } = "medcure-web";
    public string Secret { get; set; } = "";
    public int ExpiresHours { get; set; } = 8;
}
