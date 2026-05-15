using System.Security.Cryptography;

namespace MedCure.Api.Auth;

/// <summary>Generates and matches one-time backup codes for 2FA recovery.</summary>
public static class BackupCodes
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ambiguous chars removed
    private const int CodeLength = 8;
    private const int CodeCount = 10;

    public static List<string> Generate(int count = CodeCount)
    {
        var list = new List<string>(count);
        var buf = new byte[CodeLength];
        for (var i = 0; i < count; i++)
        {
            RandomNumberGenerator.Fill(buf);
            var chars = new char[CodeLength];
            for (var j = 0; j < CodeLength; j++) chars[j] = Alphabet[buf[j] % Alphabet.Length];
            list.Add(new string(chars));
        }
        return list;
    }

    public static string Normalize(string s) => (s ?? "").Trim().ToUpperInvariant().Replace("-", "").Replace(" ", "");
}
