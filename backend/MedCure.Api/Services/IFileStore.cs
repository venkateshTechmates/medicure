namespace MedCure.Api.Services;

public interface IFileStore
{
    Task<(string RelativePath, long Size)> SaveAsync(Stream stream, string originalFileName, string contentType, CancellationToken ct = default);
    Stream? Open(string relativePath);
    bool Delete(string relativePath);
}
