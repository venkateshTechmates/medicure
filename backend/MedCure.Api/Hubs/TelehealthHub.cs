using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MedCure.Api.Hubs;

[Authorize]
public class TelehealthHub : Hub
{
    private const string RoomsKey = "rooms";

    private HashSet<string> GetRooms()
    {
        if (Context.Items.TryGetValue(RoomsKey, out var existing) && existing is HashSet<string> set)
            return set;
        var created = new HashSet<string>();
        Context.Items[RoomsKey] = created;
        return created;
    }

    public async Task Join(string roomId)
    {
        if (string.IsNullOrWhiteSpace(roomId)) return;
        GetRooms().Add(roomId);
        await Groups.AddToGroupAsync(Context.ConnectionId, RoomGroup(roomId));
        await Clients.OthersInGroup(RoomGroup(roomId)).SendAsync("peer-joined", new { roomId, connectionId = Context.ConnectionId });
    }

    public async Task Leave(string roomId)
    {
        if (string.IsNullOrWhiteSpace(roomId)) return;
        GetRooms().Remove(roomId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, RoomGroup(roomId));
        await Clients.OthersInGroup(RoomGroup(roomId)).SendAsync("peer-left", new { roomId, connectionId = Context.ConnectionId });
    }

    public Task SendOffer(string roomId, object sdp) =>
        Clients.OthersInGroup(RoomGroup(roomId)).SendAsync("offer", new { roomId, sdp, from = Context.ConnectionId });

    public Task SendAnswer(string roomId, object sdp) =>
        Clients.OthersInGroup(RoomGroup(roomId)).SendAsync("answer", new { roomId, sdp, from = Context.ConnectionId });

    public Task SendIce(string roomId, object candidate) =>
        Clients.OthersInGroup(RoomGroup(roomId)).SendAsync("ice-candidate", new { roomId, candidate, from = Context.ConnectionId });

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (Context.Items.TryGetValue(RoomsKey, out var existing) && existing is HashSet<string> set)
        {
            foreach (var roomId in set)
            {
                await Clients.OthersInGroup(RoomGroup(roomId)).SendAsync("peer-left", new { roomId, connectionId = Context.ConnectionId });
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, RoomGroup(roomId));
            }
            set.Clear();
        }
        await base.OnDisconnectedAsync(exception);
    }

    private static string RoomGroup(string roomId) => $"telehealth:{roomId}";
}
