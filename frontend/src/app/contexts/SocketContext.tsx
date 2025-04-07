'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      const socketInstance = io('http://localhost:3001', {
    //   this is for the team
    //   const socketInstance = io('http://150.209.41.210:3001', { 
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true
      });

      socketInstance.on('connect', () => {
        console.log('Connected to Socket.IO server');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
        setIsConnected(false);
      });

      // Handle navigation events
      socketInstance.on('navigate', (path: string) => {
        router.push(path);
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
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext); 