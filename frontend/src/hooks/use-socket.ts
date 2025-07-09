import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  retroId: string;
  onItemAdded?: (item: any) => void;
  onItemUpdated?: (item: any) => void;
  onItemDeleted?: (itemId: string) => void;
  onItemsUpdate?: (items: any[]) => void;
  onParticipantUpdate?: () => void;
  onRetroStarted?: () => void;
}

export const useSocket = ({
  retroId,
  onItemAdded,
  onItemUpdated,
  onItemDeleted,
  onItemsUpdate,
  onParticipantUpdate,
  onRetroStarted,
}: UseSocketOptions) => {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!socketRef.current) {
      // Connect to WebSocket server
      socketRef.current = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
      });

      // Connection events
      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket server');
        // Join the retro room
        socketRef.current?.emit('join-retro-room', retroId);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      // Listen for real-time updates
      socketRef.current.on(`item-added:${retroId}`, (item: any) => {
        console.log('Item added via WebSocket:', item);
        onItemAdded?.(item);
      });

      socketRef.current.on(`item-updated:${retroId}`, (item: any) => {
        console.log('Item updated via WebSocket:', item);
        onItemUpdated?.(item);
      });

      socketRef.current.on(`item-deleted:${retroId}`, (data: { itemId: string }) => {
        console.log('Item deleted via WebSocket:', data.itemId);
        onItemDeleted?.(data.itemId);
      });

      socketRef.current.on(`items-update:${retroId}`, (items: any[]) => {
        console.log('Items updated via WebSocket:', items);
        onItemsUpdate?.(items);
      });

      socketRef.current.on(`participants-update:${retroId}`, () => {
        console.log('Participants updated via WebSocket');
        onParticipantUpdate?.();
      });

      socketRef.current.on(`retro-started:${retroId}`, () => {
        console.log('Retro started via WebSocket');
        onRetroStarted?.();
      });
    }
  }, [retroId, onItemAdded, onItemUpdated, onItemDeleted, onItemsUpdate, onParticipantUpdate, onRetroStarted]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave-retro-room', retroId);
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [retroId]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
  };
}; 