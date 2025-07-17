// src/gateways/participant.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
  // Tambahkan di luar class (atau static property jika ingin lebih rapi)
  const retroState: {
    [retroId: string]: {
      itemPositions: { [itemId: string]: { x: number; y: number } },
      itemGroups: { [itemId: string]: string },
      signatureColors: { [signature: string]: string },
      actionItems: Array<{
        id: string;
        task: string;
        assigneeId: string;
        assigneeName: string;
        createdBy: string;
        createdAt: string;
        edited?: boolean;
      }>,
      allUserVotes: { [userId: string]: { [groupIdx: number]: number } }
    }
  } = {};
  
  @WebSocketGateway({
    cors: {
      origin: '*',
    },
  })
  export class ParticipantGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    handleConnection(client: Socket) {
    }
  
    handleDisconnect(client: Socket) {
    }
  
    @SubscribeMessage('join-retro-room')
    handleJoinRetroRoom(client: Socket, retroId: string) {
      client.join(`retro:${retroId}`);
      
      // Initialize retro state if it doesn't exist
      if (!retroState[retroId]) {
        retroState[retroId] = {
          itemPositions: {},
          itemGroups: {},
          signatureColors: {},
          actionItems: [],
          allUserVotes: {}
        };
      }
      
      // Send current retro state to the joining client
      const state = retroState[retroId];
      client.emit(`retro-state:${retroId}`, state);
    }
  
    @SubscribeMessage('leave-retro-room')
    handleLeaveRetroRoom(client: Socket, retroId: string) {
      client.leave(`retro:${retroId}`);
    }
  
    broadcastParticipantUpdate(retroId: string) {
      this.server.to(`retro:${retroId}`).emit(`participants-update:${retroId}`);
    }

    broadcastRetroStarted(retroId: string) {
      this.server.to(`retro:${retroId}`).emit(`retro-started:${retroId}`);
    }

    broadcastRetroCompleted(retroId: string) {
      this.server.to(`retro:${retroId}`).emit(`retro-completed:${retroId}`, {
        status: 'completed',
        timestamp: new Date().toISOString()
      });
    }

    broadcastPhaseChange(retroId: string, phase: string) {
      this.server.to(`retro:${retroId}`).emit(`phase-change:${retroId}`, {
        phase: phase,
        timestamp: new Date().toISOString()
      });
    }

    broadcastItemAdded(retroId: string, item: any) {
      this.server.to(`retro:${retroId}`).emit(`item-added:${retroId}`, item);
      
      // Log room members for debugging
      this.server.in(`retro:${retroId}`).fetchSockets().then(sockets => {
      });
    }

    broadcastItemUpdated(retroId: string, item: any) {  
      this.server.to(`retro:${retroId}`).emit(`item-updated:${retroId}`, item);
    }

    broadcastItemDeleted(retroId: string, itemId: string) {
      this.server.to(`retro:${retroId}`).emit(`item-deleted:${retroId}`, { itemId });
    }

    // Broadcast all items for a retro
    broadcastItemsUpdate(retroId: string, items: any[]) {
      this.server.to(`retro:${retroId}`).emit(`items-update:${retroId}`, items);
    }

    // Broadcast action items for a retro
    broadcastActionItemsUpdate(retroId: string, actionItems: any[]) {
      this.server.to(`retro:${retroId}`).emit(`action-items-update:${retroId}`, actionItems);
    }

    // Handle phase change from facilitator
    @SubscribeMessage('phase-change')
    handlePhaseChange(client: Socket, data: { retroId: string; phase: string; facilitatorId: string }) {
      
      // Broadcast phase change to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`phase-change:${data.retroId}`, {
        phase: data.phase,
        facilitatorId: data.facilitatorId,
        timestamp: new Date().toISOString()
      });
      
    }

    // Handle item position updates during dragging
    @SubscribeMessage('item-position-update')
    handleItemPositionUpdate(client: Socket, data: { retroId: string; itemId: string; position: { x: number; y: number }; userId: string }) {
      // Update in-memory state
      if (!retroState[data.retroId]) retroState[data.retroId] = { itemPositions: {}, itemGroups: {}, signatureColors: {}, actionItems: [], allUserVotes: {} };
      retroState[data.retroId].itemPositions[data.itemId] = data.position;
      // Broadcast position update to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`item-position-update:${data.retroId}`, {
        itemId: data.itemId,
        position: data.position,
        userId: data.userId,
        timestamp: new Date().toISOString()
      });
    }

    // Handle grouping updates
    @SubscribeMessage('grouping-update')
    handleGroupingUpdate(client: Socket, data: { 
      retroId: string; 
      itemGroups: { [itemId: string]: string }; 
      signatureColors: { [signature: string]: string };
      userId: string 
    }) {
      if (!retroState[data.retroId]) retroState[data.retroId] = { itemPositions: {}, itemGroups: {}, signatureColors: {}, actionItems: [], allUserVotes: {} };
      retroState[data.retroId].itemGroups = data.itemGroups;
      retroState[data.retroId].signatureColors = data.signatureColors;
      // Broadcast grouping update to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`grouping-update:${data.retroId}`, {
        itemGroups: data.itemGroups,
        signatureColors: data.signatureColors,
        userId: data.userId,
        timestamp: new Date().toISOString()
      });
    }

    // Handler baru: user minta state terkini
    @SubscribeMessage('request-retro-state')
    handleRequestRetroState(client: Socket, data: { retroId: string }) {
      const state = retroState[data.retroId] || { itemPositions: {}, itemGroups: {}, signatureColors: {}, actionItems: [], allUserVotes: {} };
      client.emit(`retro-state:${data.retroId}`, state);
    }

    @SubscribeMessage('typing')
    handleTyping(client: Socket, data: { retroId: string; userId: string }) {
      // Broadcast ke semua client di room retro
      this.server.to(`retro:${data.retroId}`).emit('typing', { userId: data.userId });
      // Opsional: log
    }

    // Handle label updates from facilitator
    @SubscribeMessage('label-update')
    handleLabelUpdate(client: Socket, data: { 
      retroId: string; 
      groupId: number; 
      label: string; 
      userId: string 
    }) {
      
      // Broadcast label update to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`label-update:${data.retroId}`, {
        groupId: data.groupId,
        label: data.label,
        userId: data.userId,
        timestamp: new Date().toISOString()
      });
      
    }

    // Handle vote updates from participants
    @SubscribeMessage('vote-update')
    handleVoteUpdate(client: Socket, data: { 
      retroId: string; 
      groupId: number; 
      votes: number; 
      userId: string;
      userVotes: { [groupId: number]: number };
    }) {
      console.log(`🔧 Backend: ===== VOTE UPDATE RECEIVED =====`);
      console.log(`🔧 Backend: Received vote-update from user ${data.userId}`);
      console.log(`🔧 Backend: Full data received:`, data);
      
      // Initialize retro state if it doesn't exist
      if (!retroState[data.retroId]) {
        retroState[data.retroId] = {
          itemPositions: {},
          itemGroups: {},
          signatureColors: {},
          actionItems: [],
          allUserVotes: {}
        };
        console.log(`🔧 Backend: Initialized new retro state for ${data.retroId}`);
      }
      
      console.log(`🔧 Backend: userVotes received:`, data.userVotes);
      console.log(`🔧 Backend: userVotes type:`, typeof data.userVotes);
      console.log(`🔧 Backend: userVotes keys:`, Object.keys(data.userVotes));
      console.log(`🔧 Backend: userVotes values:`, Object.values(data.userVotes));
      
      // Log setiap key-value pair untuk debugging
      Object.entries(data.userVotes).forEach(([key, value]) => {
        console.log(`🔧 Backend: Key: ${key}, Value: ${value}, Type: ${typeof value}`);
      });
      
      // Calculate total votes
      const totalVotes = Object.values(data.userVotes).reduce((sum: number, votes: number) => sum + votes, 0);
      console.log(`🔧 Backend: Total votes for user ${data.userId}: ${totalVotes}`);
      
      // Validate vote count (should be 0-3)
      if (totalVotes < 0 || totalVotes > 3) {
        console.log(`🔧 Backend: Invalid vote count ${totalVotes} for user ${data.userId}, ignoring update`);
        return;
      }
      
      // Log previous state
      console.log(`🔧 Backend: Previous allUserVotes for user ${data.userId}:`, retroState[data.retroId].allUserVotes[data.userId]);
      
      // Update allUserVotes for this user
      retroState[data.retroId].allUserVotes[data.userId] = { ...data.userVotes };
      
      console.log(`🔧 Backend: Updated allUserVotes for user ${data.userId}:`, data.userVotes);
      console.log(`🔧 Backend: Current allUserVotes state:`, retroState[data.retroId].allUserVotes);
      
      // Log all users' vote counts
      Object.entries(retroState[data.retroId].allUserVotes).forEach(([userId, userVotes]) => {
        const userTotalVotes = Object.values(userVotes).reduce((sum: number, votes: number) => sum + votes, 0);
        console.log(`🔧 Backend: User ${userId} total votes: ${userTotalVotes}`);
      });
      
      // Broadcast vote update to all participants in the retro
      const broadcastData = {
        groupId: data.groupId,
        votes: data.votes,
        userId: data.userId,
        userVotes: data.userVotes,
        allUserVotes: retroState[data.retroId].allUserVotes,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🔧 Backend: Broadcasting vote update:`, broadcastData);
      this.server.to(`retro:${data.retroId}`).emit(`vote-update:${data.retroId}`, broadcastData);
      console.log(`🔧 Backend: ===== VOTE UPDATE COMPLETED =====`);
      
    }

    // Handle vote submission from facilitator
    @SubscribeMessage('vote-submission')
    handleVoteSubmission(client: Socket, data: { 
      retroId: string; 
      facilitatorId: string;
      groupVotes: { [groupId: number]: number };
    }) {
      
      // Broadcast vote submission to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`vote-submission:${data.retroId}`, {
        facilitatorId: data.facilitatorId,
        groupVotes: data.groupVotes,
        timestamp: new Date().toISOString()
      });
      
    }

    // Handle action item added
    @SubscribeMessage('action-item-added')
    handleActionItemAdded(client: Socket, data: {
      retroId: string;
      task: string;
      assigneeId: string;
      assigneeName: string;
      createdBy: string;
    }) {
      
      // Initialize retro state if it doesn't exist
      if (!retroState[data.retroId]) {
        retroState[data.retroId] = {
          itemPositions: {},
          itemGroups: {},
          signatureColors: {},
          actionItems: [],
          allUserVotes: {}
        };
      }
      
      // Check for duplicate action items (same task and assignee within last 5 seconds)
      const now = Date.now();
      const recentDuplicate = retroState[data.retroId].actionItems.find(item => 
        item.task === data.task && 
        item.assigneeId === data.assigneeId &&
        (now - new Date(item.createdAt).getTime()) < 5000
      );
      
      if (recentDuplicate) {
        return;
      }
      
      // Create new action item
      const newActionItem = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        task: data.task,
        assigneeId: data.assigneeId,
        assigneeName: data.assigneeName,
        createdBy: data.createdBy,
        createdAt: new Date().toISOString(),
        edited: false
      };
      
      
      // Add to state
      retroState[data.retroId].actionItems.push(newActionItem);
      
      
      // Broadcast to all clients in the retro room
      this.broadcastActionItemsUpdate(data.retroId, retroState[data.retroId].actionItems);
    }

    // Handle action item updated
    @SubscribeMessage('action-item-updated')
    handleActionItemUpdated(client: Socket, data: {
      retroId: string;
      actionItemId: string;
      task: string;
      assigneeId: string;
      assigneeName: string;
      updatedBy: string;
    }) {
      
      if (retroState[data.retroId]) {
        const actionItemIndex = retroState[data.retroId].actionItems.findIndex(
          item => item.id === data.actionItemId
        );
        
        if (actionItemIndex !== -1) {
          retroState[data.retroId].actionItems[actionItemIndex] = {
            ...retroState[data.retroId].actionItems[actionItemIndex],
            task: data.task,
            assigneeId: data.assigneeId,
            assigneeName: data.assigneeName,
            edited: true
          };
          
          // Broadcast to all clients in the retro room
          this.broadcastActionItemsUpdate(data.retroId, retroState[data.retroId].actionItems);
        }
      }
    }

    // Handle action item deleted
    @SubscribeMessage('action-item-deleted')
    handleActionItemDeleted(client: Socket, data: {
      retroId: string;
      actionItemId: string;
    }) {
      
      if (retroState[data.retroId]) {
        retroState[data.retroId].actionItems = retroState[data.retroId].actionItems.filter(
          item => item.id !== data.actionItemId
        );
        
        // Broadcast to all clients in the retro room
        this.broadcastActionItemsUpdate(data.retroId, retroState[data.retroId].actionItems);
      }
    }

  }
  