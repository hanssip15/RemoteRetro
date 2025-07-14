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
      joinRoom(retroId);
    }

    return () => {
      if (retroId) {
        leaveRoom(retroId);
      }
    };
  }, [retroId, joinRoom, leaveRoom]);

  // Set up event listeners
  useEffect(() => {
    if (!socket || !retroId) {
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

    // Cleanup function - ensure all listeners are removed
    return () => {  
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
      socket.off(`action-items-update:${retroId}`, handleActionItemsUpdate);
      socket.off(`retro-state:${retroId}`, handleRetroState);
    };
  }, [socket, retroId, callbacks]);

  return {
    isConnected,
    socket,
  };
};