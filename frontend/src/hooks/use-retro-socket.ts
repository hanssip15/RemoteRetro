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
  const { socket, isConnected, joinRoom, leaveRoom } = useSocketContext();

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

    const handlePhaseChange = (data: { phase: 'prime-directive' | 'ideation' | 'grouping' | 'labelling' | 'voting' | 'final' | 'ActionItems' }) => {
      console.log('🔄 Phase change via WebSocket:', data.phase);
      callbacks.onPhaseChange?.(data.phase);
    };

    const handleItemPositionUpdate = (data: { itemId: string; position: { x: number; y: number }; userId: string }) => {
      callbacks.onItemPositionUpdate?.(data);
    };

    const handleGroupingUpdate = (data: { itemGroups: { [itemId: string]: string }; signatureColors: { [signature: string]: string }; userId: string }) => {
      // console.log('🎨 Grouping update via WebSocket:', data);
      callbacks.onGroupingUpdate?.(data);
    };

    const handleVoteUpdate = (data: { groupId: number; votes: number; userId: string; userVotes: { [groupId: number]: number } }) => {
      console.log('🗳️ Vote update via WebSocket:', data);
      callbacks.onVoteUpdate?.(data);
    };

    const handleVoteSubmission = (data: { facilitatorId: string; groupVotes: { [groupId: number]: number } }) => {
      console.log('📊 Vote submission via WebSocket:', data);
      callbacks.onVoteSubmission?.(data);
    };

    const handleLabelUpdate = (data: { groupId: number; label: string; userId: string }) => {
      console.log('🏷️ Label update via WebSocket:', data);
      callbacks.onLabelUpdate?.(data);
    };

    const handleActionItemsUpdate = (actionItems: any[]) => {
      console.log('🚀 Action items update via WebSocket:', actionItems);
      callbacks.onActionItemsUpdate?.(actionItems);
    };

    const handleRetroState = (state: any) => {
      console.log('📦 Retro state via WebSocket:', state);
      callbacks.onRetroState?.(state);
    };

    // Add event listeners
    socket.on(`item-added:${retroId}`, handleItemAdded);
    socket.on(`item-updated:${retroId}`, handleItemUpdated);
    socket.on(`item-deleted:${retroId}`, handleItemDeleted);
    socket.on(`items-update:${retroId}`, handleItemsUpdate);
    socket.on(`participants-update:${retroId}`, handleParticipantUpdate);
    socket.on(`retro-started:${retroId}`, handleRetroStarted);
    socket.on(`phase-change:${retroId}`, handlePhaseChange);
    socket.on(`item-position-update:${retroId}`, handleItemPositionUpdate);
    socket.on(`grouping-update:${retroId}`, handleGroupingUpdate);
    socket.on(`vote-update:${retroId}`, handleVoteUpdate);
    socket.on(`vote-submission:${retroId}`, handleVoteSubmission);
    socket.on(`label-update:${retroId}`, handleLabelUpdate);
    socket.on(`action-items-update:${retroId}`, handleActionItemsUpdate);
    socket.on(`retro-state:${retroId}`, handleRetroState);

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
      socket.off(`phase-change:${retroId}`, handlePhaseChange);
      socket.off(`item-position-update:${retroId}`, handleItemPositionUpdate);
      socket.off(`grouping-update:${retroId}`, handleGroupingUpdate);
      socket.off(`vote-update:${retroId}`, handleVoteUpdate);
      socket.off(`vote-submission:${retroId}`, handleVoteSubmission);
      socket.off(`label-update:${retroId}`, handleLabelUpdate);
      // socket.off(`action-items-update:${retroId}`, handleActionItemsUpdate);
      // socket.off(`retro-state:${retroId}`, handleRetroState);
    };
  }, [socket, retroId, callbacks]);

  return {
    isConnected,
    socket,
  };
};