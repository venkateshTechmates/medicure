using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

public static class MessageEndpoints
{
    public static IEndpointRouteBuilder MapMessageEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/messages").RequireAuthorization();
        g.MapGet ("/threads",                 Threads);
        g.MapGet ("/threads/{id:int}",        Thread);
        g.MapPost("/threads",                 Compose);
        g.MapPost("/threads/{id:int}/send",   Send);
        g.MapPost("/threads/{id:int}/read",   MarkRead);
        return app;
    }

    private static async Task<IResult> Threads(IUnitOfWork uow) =>
        Results.Ok(await uow.MessageThreads.Query().OrderByDescending(t => t.LastMessageAt).Take(50).ToListAsync());

    private static async Task<IResult> Thread(int id, IUnitOfWork uow, AppDbContext db)
    {
        var t = await uow.MessageThreads.GetAsync(id);
        if (t is null) return Results.NotFound();
        var msgs = await db.Messages.Where(m => m.ThreadId == id).OrderBy(m => m.SentAt).ToListAsync();
        return Results.Ok(new { Thread = t, Messages = msgs });
    }

    private static async Task<IResult> Send(int id, SendMessage req, IUnitOfWork uow, ICurrentUser current)
    {
        var t = await uow.MessageThreads.GetAsync(id);
        if (t is null) return Results.NotFound();
        var msg = new Message { ThreadId = id, Body = req.Body, SenderName = current.FullName ?? "Unknown", SentAt = DateTime.UtcNow, Read = false };
        await uow.Messages.AddAsync(msg);
        t.LastMessageAt = msg.SentAt;
        uow.MessageThreads.Update(t);
        await uow.SaveAsync();
        return Results.Created($"/api/messages/threads/{id}", msg);
    }

    public record SendMessage(string Body);

    public record ComposeRequest(string Subject, string Participants, string Body, bool Urgent);

    private static async Task<IResult> Compose(ComposeRequest req, IUnitOfWork uow, ICurrentUser current)
    {
        var thread = new MessageThread {
            Subject = req.Subject,
            Participants = req.Participants,
            Urgent = req.Urgent,
            LastMessageAt = DateTime.UtcNow
        };
        await uow.MessageThreads.AddAsync(thread);
        await uow.SaveAsync();
        await uow.Messages.AddAsync(new Message {
            ThreadId = thread.Id,
            Body = req.Body,
            SenderName = current.FullName ?? "Unknown",
            SentAt = DateTime.UtcNow,
            Read = false
        });
        await uow.SaveAsync();
        return Results.Created($"/api/messages/threads/{thread.Id}", thread);
    }

    private static async Task<IResult> MarkRead(int id, IUnitOfWork uow, AppDbContext db)
    {
        var msgs = await db.Messages.Where(m => m.ThreadId == id && !m.Read).ToListAsync();
        foreach (var m in msgs) m.Read = true;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
}
