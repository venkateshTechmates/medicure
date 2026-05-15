using System.Security.Cryptography;
using System.Text;

namespace MedCure.Api.Auth;

/// <summary>
/// Pure C# RFC 6238 TOTP implementation (HMAC-SHA1, 30s step, 6 digits).
/// No external libraries; secrets are base32-encoded.
/// </summary>
public class TotpService
{
    private const int Digits = 6;
    private const int StepSeconds = 30;
    private const string Base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    /// <summary>Generates a fresh 160-bit base32 secret.</summary>
    public string GenerateSecret()
    {
        var bytes = new byte[20];
        RandomNumberGenerator.Fill(bytes);
        return ToBase32(bytes);
    }

    /// <summary>Builds an otpauth:// URI usable by Google Authenticator etc.</summary>
    public string GenerateUri(string secret, string account, string issuer)
    {
        static string enc(string s) => Uri.EscapeDataString(s);
        var label = $"{enc(issuer)}:{enc(account)}";
        return $"otpauth://totp/{label}?secret={secret}&issuer={enc(issuer)}&algorithm=SHA1&digits={Digits}&period={StepSeconds}";
    }

    /// <summary>Verifies a TOTP code against the secret, accepting ±window steps for clock drift.</summary>
    public bool Verify(string secret, string code, int window = 1)
    {
        if (string.IsNullOrWhiteSpace(secret) || string.IsNullOrWhiteSpace(code)) return false;
        if (code.Length != Digits) return false;
        if (!int.TryParse(code, out var _)) return false;

        byte[] key;
        try { key = FromBase32(secret); }
        catch { return false; }

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var counter = now / StepSeconds;

        for (var w = -window; w <= window; w++)
        {
            var computed = ComputeHotp(key, counter + w);
            if (FixedTimeEquals(computed, code)) return true;
        }
        return false;
    }

    private static string ComputeHotp(byte[] key, long counter)
    {
        var counterBytes = BitConverter.GetBytes(counter);
        if (BitConverter.IsLittleEndian) Array.Reverse(counterBytes);

        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(counterBytes);

        var offset = hash[^1] & 0x0F;
        var binary =
            ((hash[offset] & 0x7F) << 24) |
            ((hash[offset + 1] & 0xFF) << 16) |
            ((hash[offset + 2] & 0xFF) << 8)  |
             (hash[offset + 3] & 0xFF);

        var otp = binary % (int)Math.Pow(10, Digits);
        return otp.ToString().PadLeft(Digits, '0');
    }

    private static bool FixedTimeEquals(string a, string b)
    {
        if (a.Length != b.Length) return false;
        var diff = 0;
        for (var i = 0; i < a.Length; i++) diff |= a[i] ^ b[i];
        return diff == 0;
    }

    internal static string ToBase32(byte[] data)
    {
        if (data.Length == 0) return string.Empty;
        var sb = new StringBuilder((data.Length * 8 + 4) / 5);
        int buffer = data[0];
        int next = 1;
        int bitsLeft = 8;
        while (bitsLeft > 0 || next < data.Length)
        {
            if (bitsLeft < 5)
            {
                if (next < data.Length)
                {
                    buffer <<= 8;
                    buffer |= data[next++] & 0xFF;
                    bitsLeft += 8;
                }
                else
                {
                    var pad = 5 - bitsLeft;
                    buffer <<= pad;
                    bitsLeft = 5;
                }
            }
            var index = 0x1F & (buffer >> (bitsLeft - 5));
            bitsLeft -= 5;
            sb.Append(Base32Alphabet[index]);
        }
        return sb.ToString();
    }

    internal static byte[] FromBase32(string s)
    {
        s = s.Trim().TrimEnd('=').ToUpperInvariant().Replace(" ", "");
        if (s.Length == 0) return Array.Empty<byte>();
        var output = new List<byte>(s.Length * 5 / 8);
        int buffer = 0;
        int bitsLeft = 0;
        foreach (var c in s)
        {
            var idx = Base32Alphabet.IndexOf(c);
            if (idx < 0) throw new FormatException("Invalid base32 character.");
            buffer = (buffer << 5) | idx;
            bitsLeft += 5;
            if (bitsLeft >= 8)
            {
                bitsLeft -= 8;
                output.Add((byte)((buffer >> bitsLeft) & 0xFF));
            }
        }
        return output.ToArray();
    }
}
