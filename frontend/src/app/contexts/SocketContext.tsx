"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  deviceType: "host" | "client" | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  deviceType: null,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceType, setDeviceType] = useState<"host" | "client" | null>(null);
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketRef.current) {
      // Use the config file's serverIp
      const socketInstance = io(
        `http://${process.env.NEXT_PUBLIC_SERVER_IP || "192.168.1.10"}:3001`,
        {
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          autoConnect: true,
          query: {
            // Detect if this is the host (Mac) or client (iPad)
            deviceType: navigator.platform.toLowerCase().includes("mac")
              ? "host"
              : "client",
          },
        }
      );

      socketInstance.on("connect", () => {
        console.log("Connected to Socket.IO server");
        setIsConnected(true);
        // Set device type based on platform
        setDeviceType(
          navigator.platform.toLowerCase().includes("mac") ? "host" : "client"
        );
      });

      socketInstance.on("disconnect", () => {
        console.log("Disconnected from Socket.IO server");
        setIsConnected(false);
      });

      // Handle navigation events
      socketInstance.on("navigate", (path: string) => {
        router.push(path);
      });

      // Handle session state updates
      socketInstance.on("sessionState", (state: any) => {
        // Update the app state based on the session state
        if (state.page === "dashboard") {
          router.push(
            `/dashboard?${new URLSearchParams(state.params).toString()}`
          );
        } else if (state.page === "home") {
          router.push("/");
        }
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);
    }

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [router]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, deviceType }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
