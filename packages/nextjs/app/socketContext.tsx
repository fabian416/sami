"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

const NODE_ENV = process.env.NODE_ENV;

// Define el tipo del contexto
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  playerId: string | null;
  setPlayerId: (id: string) => void;
  playerIndex: number | null;
  setPlayerIndex: (id: number) => void;
  roomId?: string | null;
  setRoomId: (id: string) => void;
  isPlayerEliminated?: boolean;
  setIsPlayerEliminated: (id: boolean) => void;
}

// Crea el contexto
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// URL del servidor WebSocket
const SERVER_URL = NODE_ENV === "test" ? "http://backend:5001" : "http://localhost:5001";
//const SERVER_URL = NODE_ENV === "test" ? "http://backend:5001" : "https://8lh8dmll-5001.brs.devtunnels.ms";

// Proveedor del contexto
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isPlayerEliminated, setIsPlayerEliminated] = useState<boolean | undefined>(false);

  useEffect(() => {
    console.log("Intentando conectar a:", SERVER_URL);
    // Inicializar el socket
    const socketInstance = io(SERVER_URL, {
      transports: ["websocket", "polling"],
    });

    // Eventos de conexión y desconexión
    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
    });

    // Manejar errores de conexión
    socketInstance.on("connect_error", err => {
      console.error("WebSocket connection error:", err);
    });

    // Configurar el socket en el estado
    setSocket(socketInstance);

    // Limpiar el socket al desmontar el componente
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        playerId,
        isPlayerEliminated,
        setIsPlayerEliminated,
        playerIndex,
        roomId,
        setPlayerId,
        setPlayerIndex,
        setRoomId,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Hook para usar el contexto fácilmente
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
