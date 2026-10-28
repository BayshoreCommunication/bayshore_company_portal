"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { getRealtimeTicketAction } from "@/app/actions/realtime";

// Live updates from the backend (its Socket.io server — backend/realtime): one connection per
// tab, shared by every part of the page that listens, opened when the first one does. Each
// time it connects it asks for a fresh ticket, so it reconnects by itself after a drop.

let socket: Socket | null = null;
let opening: Promise<Socket | null> | null = null;

const connect = () => {
  if (socket) return Promise.resolve(socket);
  if (opening) return opening;
  opening = getRealtimeTicketAction().then((first) => {
    if (!first) {
      opening = null;
      return null;
    }
    let ticket: string | null = first.ticket;
    socket = io(first.url, {
      path: "/socket.io",
      withCredentials: true,
      // The first ticket once, then a new one for every reconnection.
      auth: (send) => {
        if (ticket) {
          send({ ticket });
          ticket = null;
          return;
        }
        void getRealtimeTicketAction().then((next) => send({ ticket: next?.ticket ?? "" }));
      },
    });
    return socket;
  });
  return opening;
};

// Calls `handler` each time `event` comes in, for as long as the component is on the page.
export const useRealtime = <Payload,>(event: string, handler: (payload: Payload) => void) => {
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  useEffect(() => {
    let live = true;
    let joined: Socket | null = null;
    const listener = (payload: Payload) => latest.current(payload);
    void connect().then((connected) => {
      if (!live || !connected) return;
      joined = connected;
      connected.on(event, listener);
    });
    return () => {
      live = false;
      joined?.off(event, listener);
    };
  }, [event]);
};
