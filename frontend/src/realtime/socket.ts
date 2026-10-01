import { io, type Socket } from "socket.io-client";
import { orderService } from "../constants/app";

let socket: Socket | null = null;

export const connectRealtime = (accessToken: string): Socket => {
  if (!socket) {
    socket = io(orderService, {
      autoConnect: false,
      reconnection: true,
      auth: { accessToken },
    });
  }
  socket.auth = { accessToken };
  if (!socket.connected) socket.connect();
  return socket;
};

export const disconnectRealtime = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};
