import { useEffect, useCallback, useMemo } from 'react';
import { useSocketContext } from '@/contexts/SocketContext';

interface UseRetroSocketOptions {
  retroId: string;
  onItemAdded?: (item: any) => void;
  onItemUpdated?: (item: any) => void;
  onItemDeleted?: (itemId: string) => void;
  onItemsUpdate?: (items: any[]) => void;
  onParticipantUpdate?: () => void;
  onRetroStarted?: () => void;
}

export const useRetroSocket = ({
  retroId,
  onItemAdded,
  onItemUpdated,
  onItemDeleted,
  onItemsUpdate,
  onParticipantUpdate,
  onRetroStarted,
}: UseRetroSocketOptions) => {
  const { socket, isConnected, joinRoom, leaveRoom } = useSocketContext();

  // Memoize callbacks to prevent unnecessary re-renders
  const callbacks = useMemo(() => ({
    onItemAdded,
    onItemUpdated,
    onItemDeleted,
    onItemsUpdate,
    onParticipantUpdate,
    onRetroStarted,
  }), [onItemAdded, onItemUpdated, onItemDeleted, onItemsUpdate, onParticipantUpdate, onRetroStarted]);

  // Join room when component mounts or retroId changes
  useEffect(() => {
    if (retroId) {
      console.log(`🏠 Joining retro room: ${retroId}`);
      joinRoom(retroId);
    }

    return () => {
      if (retroId) {
        console.log(`🚪 Leaving retro room: ${retroId}`);
        leaveRoom(retroId);
      }
    };
  }, [retroId, joinRoom, leaveRoom]);

  // Set up event listeners
  useEffect(() => {
    if (!socket || !retroId) {
      console.log('⚠️ Socket or retroId not available for event listeners');
      return;
    }

    console.log('🎧 Setting up retro event listeners for:', retroId);
    console.log('🔌 Socket connected:', socket.connected);

    const handleItemAdded = (item: any) => {
      console.log('📝 Item added via WebSocket:', item);
      callbacks.onItemAdded?.(item);
    };

    const handleItemUpdated = (item: any) => {
      console.log('✏️ Item updated via WebSocket:', item);
      callbacks.onItemUpdated?.(item);
    };

    const handleItemDeleted = (data: { itemId: string }) => {
      console.log('🗑️ Item deleted via WebSocket:', data.itemId);
      callbacks.onItemDeleted?.(data.itemId);
    };

    const handleItemsUpdate = (items: any[]) => {
      console.log('📋 Items updated via WebSocket:', items);
      callbacks.onItemsUpdate?.(items);
    };

    const handleParticipantUpdate = () => {
      console.log('👥 Participants updated via WebSocket');
      callbacks.onParticipantUpdate?.();
    };

    const handleRetroStarted = () => {
      console.log('🚀 Retro started via WebSocket');
      callbacks.onRetroStarted?.();
    };

    // Add event listeners
    socket.on(`item-added:${retroId}`, handleItemAdded);
    socket.on(`item-updated:${retroId}`, handleItemUpdated);
    socket.on(`item-deleted:${retroId}`, handleItemDeleted);
    socket.on(`items-update:${retroId}`, handleItemsUpdate);
    socket.on(`participants-update:${retroId}`, handleParticipantUpdate);
    socket.on(`retro-started:${retroId}`, handleRetroStarted);

    // Test event to verify listeners are working
    console.log('✅ Event listeners set up for retro:', retroId);

    // Cleanup event listeners
    return () => {
      console.log('🧹 Cleaning up retro event listeners for:', retroId);
      socket.off(`item-added:${retroId}`, handleItemAdded);
      socket.off(`item-updated:${retroId}`, handleItemUpdated);
      socket.off(`item-deleted:${retroId}`, handleItemDeleted);
      socket.off(`items-update:${retroId}`, handleItemsUpdate);
      socket.off(`participants-update:${retroId}`, handleParticipantUpdate);
      socket.off(`retro-started:${retroId}`, handleRetroStarted);
    };
  }, [socket, retroId, callbacks]);

  return {
    isConnected,
    socket,
  };
}; 