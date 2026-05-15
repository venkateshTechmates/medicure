using MedCure.Api.Auth;
using MedCure.Api.Data;
using MedCure.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace MedCure.Api.Endpoints;

/// <summary>
/// PRD §14.C — favorite orders &amp; multi-order panels per clinician.
/// </summary>
public static class FavoritesEndpoints
{
    public static IEndpointRouteBuilder MapFavoritesEndpoints(this IEndpointRouteBuilder app)
    {
        var orders = app.MapGroup("/api/favorites/orders").RequireAuthorization();
        orders.MapGet   ("/",           ListOrders);
        orders.MapPost  ("/",           SaveOrder);
        orders.MapDelete("/{id:int}",   DeleteOrder);

        var panels = app.MapGroup("/api/favorites/panels").RequireAuthorization();
        panels.MapGet   ("/",                ListPanels);
        panels.MapPost  ("/",                CreatePanel);
        panels.MapDelete("/{id:int}",        DeletePanel);
        panels.MapPost  ("/{id:int}/apply",  ApplyPanel);

        return app;
    }

    public record FavoriteOrderInput(string Name, string OrderType, string? Dose, string? Route,
        string? Frequency, string? Indication, string? Notes);

    public record FavoritePanelItemInput(string Name, string OrderType, string? Dose, string? Route,
        string? Frequency, string? Indication);

    public record FavoritePanelInput(string Name, string? Description, List<FavoritePanelItemInput>? Items);

    public record ApplyPanelInput(int PatientId);

    private static async Task<IResult> ListOrders(IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var rows = await uow.FavoriteOrders.Query()
            .Where(f => f.UserId == uid)
            .OrderByDescending(f => f.UpdatedAt)
            .ToListAsync();
        return Results.Ok(rows);
    }

    private static async Task<IResult> SaveOrder(FavoriteOrderInput input, IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        if (string.IsNullOrWhiteSpace(input.Name) || string.IsNullOrWhiteSpace(input.OrderType))
            return Results.BadRequest(new { error = "Name and orderType are required." });

        // Idempotent on (UserId, Name, OrderType) per-tenant — repo Query() already scopes tenant.
        var existing = await uow.FavoriteOrders.Query()
            .FirstOrDefaultAsync(f => f.UserId == uid && f.Name == input.Name && f.OrderType == input.OrderType);

        if (existing is not null)
        {
            existing.Dose       = input.Dose       ?? existing.Dose;
            existing.Route      = input.Route      ?? existing.Route;
            existing.Frequency  = input.Frequency  ?? existing.Frequency;
            existing.Indication = input.Indication ?? existing.Indication;
            existing.Notes      = input.Notes      ?? existing.Notes;
            uow.FavoriteOrders.Update(existing);
            await uow.SaveAsync();
            return Results.Ok(existing);
        }

        var fav = new FavoriteOrder
        {
            UserId     = uid,
            Name       = input.Name,
            OrderType  = input.OrderType,
            Dose       = input.Dose       ?? "",
            Route      = input.Route      ?? "",
            Frequency  = input.Frequency  ?? "",
            Indication = input.Indication ?? "",
            Notes      = input.Notes      ?? ""
        };
        await uow.FavoriteOrders.AddAsync(fav);
        await uow.SaveAsync();
        return Results.Created($"/api/favorites/orders/{fav.Id}", fav);
    }

    private static async Task<IResult> DeleteOrder(int id, IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var fav = await uow.FavoriteOrders.GetAsync(id);
        if (fav is null || fav.UserId != uid) return Results.NotFound();
        uow.FavoriteOrders.Remove(fav);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> ListPanels(IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var panels = await uow.FavoritePanels.Query()
            .Where(p => p.UserId == uid)
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();

        var ids = panels.Select(p => p.Id).ToList();
        var items = await uow.FavoritePanelItems.Query()
            .Where(i => ids.Contains(i.PanelId))
            .ToListAsync();

        var grouped = items.GroupBy(i => i.PanelId).ToDictionary(g => g.Key, g => g.ToList());
        var result = panels.Select(p => new
        {
            p.Id, p.UserId, p.Name, p.Description, p.TenantId, p.CreatedAt, p.UpdatedAt,
            Items = grouped.TryGetValue(p.Id, out var its) ? its : new List<FavoritePanelItem>()
        });
        return Results.Ok(result);
    }

    private static async Task<IResult> CreatePanel(FavoritePanelInput input, IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        if (string.IsNullOrWhiteSpace(input.Name))
            return Results.BadRequest(new { error = "Panel name is required." });

        var panel = new FavoritePanel
        {
            UserId      = uid,
            Name        = input.Name,
            Description = input.Description ?? ""
        };
        await uow.FavoritePanels.AddAsync(panel);
        await uow.SaveAsync();

        var items = (input.Items ?? new List<FavoritePanelItemInput>())
            .Where(i => !string.IsNullOrWhiteSpace(i.Name) && !string.IsNullOrWhiteSpace(i.OrderType))
            .Select(i => new FavoritePanelItem
            {
                PanelId    = panel.Id,
                Name       = i.Name,
                OrderType  = i.OrderType,
                Dose       = i.Dose       ?? "",
                Route      = i.Route      ?? "",
                Frequency  = i.Frequency  ?? "",
                Indication = i.Indication ?? ""
            }).ToList();
        foreach (var it in items) await uow.FavoritePanelItems.AddAsync(it);
        if (items.Count > 0) await uow.SaveAsync();

        return Results.Created($"/api/favorites/panels/{panel.Id}", new
        {
            panel.Id, panel.UserId, panel.Name, panel.Description, panel.TenantId,
            panel.CreatedAt, panel.UpdatedAt, Items = items
        });
    }

    private static async Task<IResult> DeletePanel(int id, IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var panel = await uow.FavoritePanels.GetAsync(id);
        if (panel is null || panel.UserId != uid) return Results.NotFound();

        var items = await uow.FavoritePanelItems.Query()
            .Where(i => i.PanelId == id)
            .ToListAsync();
        foreach (var it in items) uow.FavoritePanelItems.Remove(it);
        uow.FavoritePanels.Remove(panel);
        await uow.SaveAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> ApplyPanel(int id, ApplyPanelInput input, IUnitOfWork uow, ICurrentUser current)
    {
        if (current.UserId is not int uid) return Results.Unauthorized();
        var panel = await uow.FavoritePanels.GetAsync(id);
        if (panel is null || panel.UserId != uid) return Results.NotFound();

        var patient = await uow.Patients.GetAsync(input.PatientId);
        if (patient is null) return Results.NotFound(new { error = "Patient not found." });

        var items = await uow.FavoritePanelItems.Query()
            .Where(i => i.PanelId == id)
            .ToListAsync();
        if (items.Count == 0)
            return Results.BadRequest(new { error = "Panel has no items." });

        var createdIds = new List<int>();
        foreach (var item in items)
        {
            var order = new Order
            {
                PatientId    = input.PatientId,
                OrderType    = item.OrderType,
                Name         = item.Name,
                Dose         = item.Dose,
                Route        = item.Route,
                Frequency    = item.Frequency,
                Indication   = item.Indication,
                Priority     = "Routine",
                Status       = "signed",
                OrderedByName = current.FullName ?? "",
                SignedAt     = DateTime.UtcNow
            };
            await uow.Orders.AddAsync(order);
            await uow.SaveAsync(); // get id
            createdIds.Add(order.Id);
        }

        await uow.AuditEntries.AddAsync(new AuditEntry
        {
            UserId = current.UserId,
            Kind = "favorite_panel_applied",
            Action = "apply",
            Resource = $"favorite_panel:{id}",
            TargetPatientId = input.PatientId,
            Detail = $"panel={panel.Name}; orders=[{string.Join(",", createdIds)}]",
            At = DateTime.UtcNow
        });
        await uow.SaveAsync();

        return Results.Ok(new { panelId = id, patientId = input.PatientId, createdOrderIds = createdIds });
    }
}
