// Lightweight Socket.IO client wrapper for realtime vote updates
// - Uses VITE_SOCKET_URL when provided
// - In dev, defaults to http://127.0.0.1:4000 (backend dev server)
// - In prod, defaults to window.location.origin
import { io } from 'socket.io-client';

let socket = null;

function resolveSocketUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit;
  const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;
  if (apiUrl) {
    try { return new URL(apiUrl).origin; } catch { return apiUrl; }
  }
  if (import.meta.env.DEV) return 'http://127.0.0.1:4000';
  return window.location.origin;
}

export function getSocket() {
  if (socket && socket.connected) return socket;
  const url = resolveSocketUrl();
  socket = io(url, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
  });
  return socket;
}

export function joinContestRoom(contestId) {
  const s = getSocket();
  if (!contestId) return;
  try {
    s.emit('join_contest', String(contestId));
  } catch {}
}

export function onVoteUpdate(handler) {
  const s = getSocket();
  s.on('vote_update', handler);
  return () => s.off('vote_update', handler);
}

export function disconnectSocket() {
  if (socket) {
    try { socket.disconnect(); } catch {}
  }
}
