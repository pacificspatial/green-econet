// src/context/SocketContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";

type SocketContextValue = Socket | null;

const SocketContext = createContext<SocketContextValue>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);

  // create the socket once
  if (!socketRef.current) {
    socketRef.current = io(import.meta.env.VITE_EP_SOCKET_PORT, {
      transports: ["websocket"],
    });
  }

  useEffect(() => {
    const socket = socketRef.current!;
    // console.log("[SOCKET] Connecting to:", import.meta.env.VITE_EP_SOCKET_PORT);

    const handleConnect = () => {
      // console.log("[SOCKET] connected:", socket.id);
    };
    const handleDisconnect = () => {
      // console.log("[SOCKET] disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      // console.log("[SOCKET] cleanup listeners (provider still keeps socket)");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      // we don't disconnect here so the SPA keeps one live connection
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): Socket | null => useContext(SocketContext);
