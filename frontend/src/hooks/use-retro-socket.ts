import { useEffect, useMemo, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseRetroSocketOptions {
  retroId: string;
  userId: string;
  onItemAdded?: (item: any) => void;
  onItemUpdated?: (item: any) => void;
  onItemDeleted?: (itemId: string) => void;
  onItemsUpdate?: (items: any[]) => void;
  onParticipantUpdate?: () => void;
  onRetroStarted?: () => void;
  onPhaseChange?: (phase: 'prime-directive' | 'ideation' | 'grouping' | 'labelling' | 'voting' | 'final' | 'ActionItems') => void;
  onItemPositionUpdate?: (data: { itemId: string; position: { x: number; y: number }; userId: string }) => void;
  onGroupingUpdate?: (data: { itemGroups: { [itemId: string]: string }; signatureColors: { [signature: string]: string }; userId: string }) => void;
  onVoteUpdate?: (data: { groupId: number; votes: number; userId: string; userVotes: { [groupId: number]: number } }) => void;
  onVoteSubmission?: (data: { facilitatorId: string; groupVotes: { [groupId: number]: number } }) => void;
  onLabelUpdate?: (data: { groupId: number; label: string; userId: string }) => void;
  onActionItemsUpdate?: (actionItems: any[]) => void;
  onRetroState?: (state: any) => void;
}

export const useRetroSocket = ({
  retroId,
  userId,
  onItemAdded,
  onItemUpdated,
  onItemDeleted,
  onItemsUpdate,
  onParticipantUpdate,
  onRetroStarted,
  onPhaseChange,
  onItemPositionUpdate,
  onGroupingUpdate,
  onVoteUpdate,
  onVoteSubmission,
  onLabelUpdate,
  onActionItemsUpdate,
  onRetroState,
}: UseRetroSocketOptions) => {
  // const { socket} = useRetroSocket();
    const socketRef = useRef<Socket>();
    const isConnectingRef = useRef(false);
  // Memoize callbacks to prevent unnecessary re-renders
  const callbacks = useMemo(() => ({
    onItemAdded,
    onItemUpdated,
    onItemDeleted,
    onItemsUpdate,
    onParticipantUpdate,
    onRetroStarted,
    onPhaseChange,
    onItemPositionUpdate,
    onGroupingUpdate,
    onVoteUpdate,
    onVoteSubmission,
    onLabelUpdate,
    onActionItemsUpdate,
    onRetroState,
  }), [onItemAdded, onItemUpdated, onItemDeleted, onItemsUpdate, onParticipantUpdate, onRetroStarted, onPhaseChange, onItemPositionUpdate, onGroupingUpdate, onVoteUpdate, onVoteSubmission, onLabelUpdate, onActionItemsUpdate, onRetroState]);
    const connect = useCallback(() => {
      if (socketRef.current?.connected || isConnectingRef.current) {
        return;
      }
  
      isConnectingRef.current = true;
  
      // Connect to WebSocket server
      socketRef.current = io(import.meta.env.VITE_API_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        query: {
          retroId : retroId,
          userId : userId
        },
      });
  
      // Connection events
      socketRef.current.on('connect', () => {
        isConnectingRef.current = false;
        // Join the retro room
        socketRef.current?.emit('join-retro-room', retroId);
      });
  
      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        isConnectingRef.current = false;
      });
  
      socketRef.current.on('disconnect', () => {
        isConnectingRef.current = false;
      });
  
      socketRef.current.on('reconnect', () => {
        // Re-join the retro room after reconnection
        socketRef.current?.emit('join-retro-room', retroId);
      });
  
      socketRef.current.on(`participants-update:${retroId}`, () => {
        callbacks.onParticipantUpdate?.();
      });
  
      socketRef.current.on(`retro-started:${retroId}`, () => {
        callbacks.onRetroStarted?.();
      });
    }, [retroId, callbacks]);
  
    const disconnect = useCallback(() => {
      if (socketRef.current) {
        socketRef.current.emit('leave-retro-room', retroId);
        socketRef.current.disconnect();
        socketRef.current = undefined;
        isConnectingRef.current = false;
      }
    }, [retroId]);


  // Join room when component mounts or retroId changes
    useEffect(() => {
    if (!retroId || !userId) {
      console.warn('Retro ID or User ID is not provided, skipping socket connection.');
      return;
    }
    connect();

    return () => {
      disconnect();
    };
  }, [retroId, userId]); // Remove callbacks from dependency array

  useEffect(() => {
    if (!socketRef || !retroId) {
      return;
    }

    const handleItemAdded = (item: any) => {
      callbacks.onItemAdded?.(item);
    };

    const handleItemUpdated = (item: any) => {
      callbacks.onItemUpdated?.(item);
    };

    const handleItemDeleted = (data: { itemId: string }) => { 
      callbacks.onItemDeleted?.(data.itemId);
    };

    const handleItemsUpdate = (items: any[]) => {
      callbacks.onItemsUpdate?.(items);
    };

    const handleParticipantUpdate = () => {
      callbacks.onParticipantUpdate?.();
    };

    const handleRetroStarted = () => {
      callbacks.onRetroStarted?.();
    };

    const handlePhaseChange = (data: { phase: 'prime-directive' | 'ideation' | 'grouping' | 'labelling' | 'voting' | 'final' | 'ActionItems'}) => {
      callbacks.onPhaseChange?.(data.phase);
    };

    const handleItemPositionUpdate = (data: { itemId: string; position: { x: number; y: number }; userId: string }) => {
      callbacks.onItemPositionUpdate?.(data);
    };

    const handleGroupingUpdate = (data: { itemGroups: { [itemId: string]: string }; signatureColors: { [signature: string]: string }; userId: string }) => {
      callbacks.onGroupingUpdate?.(data);
    };

    const handleVoteUpdate = (data: { groupId: number; votes: number; userId: string; userVotes: { [groupId: number]: number } }) => {
      callbacks.onVoteUpdate?.(data);
    };

    const handleVoteSubmission = (data: { facilitatorId: string; groupVotes: { [groupId: number]: number } }) => {
      callbacks.onVoteSubmission?.(data);
    };

    const handleLabelUpdate = (data: { groupId: number; label: string; userId: string }) => {
      callbacks.onLabelUpdate?.(data);
    };

    const handleActionItemsUpdate = (actionItems: any[]) => {
      callbacks.onActionItemsUpdate?.(actionItems);
    };

    const handleRetroState = (state: any) => {
      callbacks.onRetroState?.(state);
    };

    // Add event listeners - ensure each is added only once
    if (socketRef.current) {
      socketRef.current.on(`item-added:${retroId}`, handleItemAdded);
      socketRef.current.on(`item-updated:${retroId}`, handleItemUpdated);
      socketRef.current.on(`item-deleted:${retroId}`, handleItemDeleted);
      socketRef.current.on(`items-update:${retroId}`, handleItemsUpdate);
      socketRef.current.on(`participants-update:${retroId}`, handleParticipantUpdate);
      socketRef.current.on(`retro-started:${retroId}`, handleRetroStarted);
      socketRef.current.on(`phase-change:${retroId}`, handlePhaseChange);
      socketRef.current.on(`item-position-update:${retroId}`, handleItemPositionUpdate);
      socketRef.current.on(`grouping-update:${retroId}`, handleGroupingUpdate);
      socketRef.current.on(`vote-update:${retroId}`, handleVoteUpdate);
      socketRef.current.on(`vote-submission:${retroId}`, handleVoteSubmission);
      socketRef.current.on(`label-update:${retroId}`, handleLabelUpdate);
      socketRef.current.on(`action-items-update:${retroId}`, handleActionItemsUpdate);
      socketRef.current.on(`retro-state:${retroId}`, handleRetroState);
    }

    // Cleanup function - ensure all listeners are removed
    return () => {
      if (socketRef.current) {
        socketRef.current.off(`item-added:${retroId}`, handleItemAdded);
        socketRef.current.off(`item-updated:${retroId}`, handleItemUpdated);
        socketRef.current.off(`item-deleted:${retroId}`, handleItemDeleted);
        socketRef.current.off(`items-update:${retroId}`, handleItemsUpdate);
        socketRef.current.off(`participants-update:${retroId}`, handleParticipantUpdate);
        socketRef.current.off(`retro-started:${retroId}`, handleRetroStarted);
        socketRef.current.off(`phase-change:${retroId}`, handlePhaseChange);
        socketRef.current.off(`item-position-update:${retroId}`, handleItemPositionUpdate);
        socketRef.current.off(`grouping-update:${retroId}`, handleGroupingUpdate);
        socketRef.current.off(`vote-update:${retroId}`, handleVoteUpdate);
        socketRef.current.off(`vote-submission:${retroId}`, handleVoteSubmission);
        socketRef.current.off(`label-update:${retroId}`, handleLabelUpdate);
        socketRef.current.off(`action-items-update:${retroId}`, handleActionItemsUpdate);
        socketRef.current.off(`retro-state:${retroId}`, handleRetroState);
      }
    };
  }, [socketRef, retroId, callbacks]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
  };
};