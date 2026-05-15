"use client";
import * as signalR from "@microsoft/signalr";
import { getToken } from "./auth";

export interface NotificationPayload {
  id: number;
  kind: string;
  title: string;
  body: string;
  severity: "info" | "warn" | "bad" | "good";
  url: string;
  createdAt: string;
  patientId?: number | null;
}

let connection: signalR.HubConnection | null = null;
const subs = new Set<(n: NotificationPayload) => void>();

export function startRealtime(): signalR.HubConnection | null {
  if (typeof window === "undefined") return null;
  if (connection && connection.state === signalR.HubConnectionState.Connected) return connection;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${base}/hubs/notifications`, { accessTokenFactory: () => getToken() ?? "" })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
  connection.on("notification", (n: NotificationPayload) => subs.forEach(fn => fn(n)));
  connection.start().catch(() => { /* will retry */ });
  return connection;
}

export function onNotification(fn: (n: NotificationPayload) => void) {
  subs.add(fn);
  return () => { subs.delete(fn); };
}

export function stopRealtime() {
  connection?.stop();
  connection = null;
  subs.clear();
}
