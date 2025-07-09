import React, { createContext, useContext, useRef, useCallback, useEffect, ReactNode, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: (retroId: string) => void;
  disconnect: () => void;
  joinRoom: (retroId: string) => void;
  leaveRoom: (retroId: string) => void;
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

  const connect = useCallback((retroId: string) => {
    if (socketRef.current?.connected || isConnectingRef.current) {
      console.log('Socket already connected or connecting, skipping...');
      return;
    }

    console.log('🔌 Connecting to WebSocket server...');
    isConnectingRef.current = true;

    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setIsConnected(true);
      isConnectingRef.current = false;
      // Join the retro room if we have a retroId
      if (currentRetroIdRef.current) {
        socketRef.current?.emit('join-retro-room', currentRetroIdRef.current);
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
      setIsConnected(false);
      isConnectingRef.current = false;
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to WebSocket server, attempt:', attemptNumber);
      setIsConnected(true);
      // Re-join the retro room after reconnection
      if (currentRetroIdRef.current) {
        socketRef.current?.emit('join-retro-room', currentRetroIdRef.current);
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting from WebSocket server...');
      if (currentRetroIdRef.current) {
        socketRef.current.emit('leave-retro-room', currentRetroIdRef.current);
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      currentRetroIdRef.current = null;
      isConnectingRef.current = false;
      setIsConnected(false);
    }
  }, []);

  const joinRoom = useCallback((retroId: string) => {
    console.log(`🏠 Attempting to join retro room: ${retroId}`);
    currentRetroIdRef.current = retroId;
    if (socketRef.current?.connected) {
      console.log(`🏠 Joining retro room: ${retroId}`);
      socketRef.current.emit('join-retro-room', retroId);
    } else {
      // Connect first, then join room
      console.log(`🔌 Connecting first, then joining room: ${retroId}`);
      connect(retroId);
    }
  }, [connect]);

  const leaveRoom = useCallback((retroId: string) => {
    if (socketRef.current?.connected) {
      console.log(`🚪 Leaving retro room: ${retroId}`);
      socketRef.current.emit('leave-retro-room', retroId);
    }
    currentRetroIdRef.current = null;
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
    joinRoom,
    leaveRoom,
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