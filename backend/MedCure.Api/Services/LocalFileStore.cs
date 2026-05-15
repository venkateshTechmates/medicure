namespace MedCure.Api.Services;

public class LocalFileStore : IFileStore
{
    private readonly string _root;

    public LocalFileStore(IWebHostEnvironment env, IConfiguration cfg)
    {
        _root = cfg["Files:UploadRoot"]
            ?? Path.Combine(env.ContentRootPath, "wwwroot", "uploads");
        Directory.CreateDirectory(_root);
    }

    public async Task<(string RelativePath, long Size)> SaveAsync(Stream stream, string originalFileName, string contentType, CancellationToken ct = default)
    {
        var safeName = SanitizeFileName(originalFileName);
        var bucket = DateTime.UtcNow.ToString("yyyy/MM");
        var dir = Path.Combine(_root, bucket);
        Directory.CreateDirectory(dir);

        var unique = $"{Guid.NewGuid():N}-{safeName}";
        var full   = Path.Combine(dir, unique);
        await using (var fs = new FileStream(full, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
        {
            await stream.CopyToAsync(fs, ct);
        }
        var size = new FileInfo(full).Length;
        var rel  = Path.Combine(bucket, unique).Replace('\\', '/');
        return (rel, size);
    }

    public Stream? Open(string relativePath)
    {
        var full = Path.Combine(_root, relativePath);
        return File.Exists(full) ? File.OpenRead(full) : null;
    }

    public bool Delete(string relativePath)
    {
        var full = Path.Combine(_root, relativePath);
        if (!File.Exists(full)) return false;
        File.Delete(full);
        return true;
    }

    private static string SanitizeFileName(string name)
    {
        var bad = Path.GetInvalidFileNameChars();
        var clean = string.Concat(name.Where(c => !bad.Contains(c) && c != ' ').Take(80));
        return string.IsNullOrEmpty(clean) ? "file" : clean;
    }
}
