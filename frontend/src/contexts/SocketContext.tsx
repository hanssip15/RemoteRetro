import React, { createContext, useContext, useRef, useCallback, useEffect, ReactNode, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: (retroId: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const currentRetroIdRef = useRef<string | null>(null);
  const isConnectingRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const connect = useCallback(() => {
    if (socketRef.current?.connected || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    socketRef.current = io(import.meta.env.VITE_API_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      isConnectingRef.current = false;
  
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      isConnectingRef.current = false;
    });

    socketRef.current.on('reconnect', () => {
      setIsConnected(true);
    });
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      currentRetroIdRef.current = null;
      isConnectingRef.current = false;
      setIsConnected(false);
    }
  }, []);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value: SocketContextType = {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}; 