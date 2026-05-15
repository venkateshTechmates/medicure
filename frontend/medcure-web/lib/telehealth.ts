"use client";
import * as signalR from "@microsoft/signalr";
import { getToken } from "./auth";

export const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function connectTelehealth(roomId: string): signalR.HubConnection {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5050";
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(`${base}/hubs/telehealth`, { accessTokenFactory: () => getToken() ?? "" })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
  // roomId is intentionally not joined here — caller invokes Join after wiring handlers.
  void roomId;
  return conn;
}

export interface TelehealthSession {
  connection: signalR.HubConnection;
  pc: RTCPeerConnection;
  localStream: MediaStream;
  remoteStream: MediaStream;
  isInitiator: boolean;
  hangup: () => Promise<void>;
  setMicEnabled: (on: boolean) => void;
  setCamEnabled: (on: boolean) => void;
}

export interface TelehealthCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onPeerJoined?: () => void;
  onPeerLeft?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Orchestrates a 1:1 WebRTC call over the telehealth hub.
 * The first peer to join waits; the second peer becomes the initiator and sends an offer.
 */
export async function startVideoCall(
  roomId: string,
  localVideo: HTMLVideoElement,
  callbacks: TelehealthCallbacks = {}
): Promise<TelehealthSession> {
  const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
  localVideo.muted = true;
  try { await localVideo.play(); } catch { /* autoplay quirks */ }

  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const remoteStream = new MediaStream();
  for (const track of localStream.getTracks()) pc.addTrack(track, localStream);

  const connection = connectTelehealth(roomId);
  let isInitiator = false;
  let closed = false;

  pc.ontrack = (e) => {
    const tracks: MediaStreamTrack[] = e.streams[0] ? e.streams[0].getTracks() : (e.track ? [e.track] : []);
    for (const t of tracks) {
      if (!remoteStream.getTracks().includes(t)) remoteStream.addTrack(t);
    }
    callbacks.onRemoteStream?.(remoteStream);
  };

  pc.onicecandidate = (e) => {
    if (e.candidate && connection.state === signalR.HubConnectionState.Connected) {
      connection.invoke("SendIce", roomId, e.candidate.toJSON()).catch((err) => callbacks.onError?.(err));
    }
  };

  connection.on("peer-joined", async () => {
    // We were already in the room; the newcomer triggers us to send an offer.
    try {
      isInitiator = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await connection.invoke("SendOffer", roomId, { type: offer.type, sdp: offer.sdp });
      callbacks.onPeerJoined?.();
    } catch (err) {
      callbacks.onError?.(err);
    }
  });

  connection.on("offer", async (payload: { sdp: RTCSessionDescriptionInit }) => {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await connection.invoke("SendAnswer", roomId, { type: answer.type, sdp: answer.sdp });
      callbacks.onPeerJoined?.();
    } catch (err) {
      callbacks.onError?.(err);
    }
  });

  connection.on("answer", async (payload: { sdp: RTCSessionDescriptionInit }) => {
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    } catch (err) {
      callbacks.onError?.(err);
    }
  });

  connection.on("ice-candidate", async (payload: { candidate: RTCIceCandidateInit }) => {
    try {
      if (payload?.candidate) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    } catch (err) {
      callbacks.onError?.(err);
    }
  });

  connection.on("peer-left", () => {
    for (const t of remoteStream.getTracks()) {
      remoteStream.removeTrack(t);
      t.stop();
    }
    callbacks.onPeerLeft?.();
  });

  await connection.start();
  await connection.invoke("Join", roomId);

  const hangup = async () => {
    if (closed) return;
    closed = true;
    try { await connection.invoke("Leave", roomId); } catch { /* ignore */ }
    try { await connection.stop(); } catch { /* ignore */ }
    for (const t of localStream.getTracks()) t.stop();
    for (const t of remoteStream.getTracks()) t.stop();
    try { pc.close(); } catch { /* ignore */ }
  };

  const setMicEnabled = (on: boolean) => {
    for (const t of localStream.getAudioTracks()) t.enabled = on;
  };
  const setCamEnabled = (on: boolean) => {
    for (const t of localStream.getVideoTracks()) t.enabled = on;
  };

  return {
    connection,
    pc,
    localStream,
    remoteStream,
    get isInitiator() { return isInitiator; },
    hangup,
    setMicEnabled,
    setCamEnabled,
  } as TelehealthSession;
}
