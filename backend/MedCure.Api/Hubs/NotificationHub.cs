using MedCure.Api.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MedCure.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var http = Context.GetHttpContext();
        var current = http?.RequestServices.GetService<ICurrentUser>();
        if (current?.UserId is int uid)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"u:{uid}");
        if (current?.TenantId is int tid)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"t:{tid}");
        await base.OnConnectedAsync();
    }
}
