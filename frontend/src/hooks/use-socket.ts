import { useEffect, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiService } from '@/services/api';

interface UseSocketOptions {
  retroId: string;
  participantId?: number;
  onItemAdded?: (item: any) => void;
  onItemUpdated?: (item: any) => void;
  onItemDeleted?: (itemId: string) => void;
  onItemsUpdate?: (items: any[]) => void;
  onParticipantUpdate?: () => void;
  onRetroStarted?: () => void;
}

export const useSocket = ({
  retroId,
  participantId,
  onItemAdded,
  onItemUpdated,
  onItemDeleted,
  onItemsUpdate,
  onParticipantUpdate,
  onRetroStarted,
}: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);
  const isConnectingRef = useRef(false);

  // Memoize callback functions to prevent unnecessary re-renders
  const callbacks = useMemo(() => ({
    onItemAdded,
    onItemUpdated,
    onItemDeleted,
    onItemsUpdate,
    onParticipantUpdate,
    onRetroStarted,
  }), [onItemAdded, onItemUpdated, onItemDeleted, onItemsUpdate, onParticipantUpdate, onRetroStarted]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected || isConnectingRef.current) {
      console.log('Socket already connected or connecting, skipping...');
      return;
    }

    console.log('🔌 Connecting to WebSocket server...');
    isConnectingRef.current = true;

    // Connect to WebSocket server
    socketRef.current = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      isConnectingRef.current = false;
      // Join the retro room
      socketRef.current?.emit('join-retro-room', retroId);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      isConnectingRef.current = false;
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
      isConnectingRef.current = false;
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to WebSocket server, attempt:', attemptNumber);
      // Re-join the retro room after reconnection
      socketRef.current?.emit('join-retro-room', retroId);
    });

    // Listen for real-time updates
    socketRef.current.on(`item-added:${retroId}`, (item: any) => {
      console.log('📝 Item added via WebSocket:', item);
      callbacks.onItemAdded?.(item);
    });

    socketRef.current.on(`item-updated:${retroId}`, (item: any) => {
      console.log('✏️ Item updated via WebSocket:', item);
      callbacks.onItemUpdated?.(item);
    });

    socketRef.current.on(`item-deleted:${retroId}`, (data: { itemId: string }) => {
      console.log('🗑️ Item deleted via WebSocket:', data.itemId);
      callbacks.onItemDeleted?.(data.itemId);
    });

    socketRef.current.on(`items-update:${retroId}`, (items: any[]) => {
      console.log('📋 Items updated via WebSocket:', items);
      callbacks.onItemsUpdate?.(items);
    });

    socketRef.current.on(`participants-update:${retroId}`, () => {
      console.log('👥 Participants updated via WebSocket');
      callbacks.onParticipantUpdate?.();
    });

    socketRef.current.on(`retro-started:${retroId}`, () => {
      console.log('🚀 Retro started via WebSocket');
      callbacks.onRetroStarted?.();
    });
  }, [retroId, callbacks]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting from WebSocket server...haha');
      socketRef.current.emit('leave-retro-room', retroId, participantId);
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectingRef.current = false;
    }
  }, [retroId]);

  // Only connect/disconnect when retroId changes, not when callbacks change
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [retroId]); // Remove callbacks from dependency array

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
  };
}; 