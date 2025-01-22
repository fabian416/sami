"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

// Define el tipo del contexto
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

// Crea el contexto
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// URL del servidor WebSocket
const SERVER_URL = "http://localhost:5001"; // Cambiar según tu configuración

// Proveedor del contexto
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Inicializar el socket
    const socketInstance = io(SERVER_URL);

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

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};

// Hook para usar el contexto fácilmente
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
