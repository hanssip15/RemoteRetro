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
      }>
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
      console.log('🔌 Client connected:', client.id);
    }
  
    handleDisconnect(client: Socket) {
      console.log('🔌 Client disconnected:', client.id);
    }
  
    @SubscribeMessage('join-retro-room')
    handleJoinRetroRoom(client: Socket, retroId: string) {
      console.log(`🏠 Client ${client.id} joining retro room: ${retroId}`);
      client.join(`retro:${retroId}`);
      
      // Initialize retro state if it doesn't exist
      if (!retroState[retroId]) {
        retroState[retroId] = {
          itemPositions: {},
          itemGroups: {},
          signatureColors: {},
          actionItems: []
        };
      }
      
      // Send current retro state to the joining client
      const state = retroState[retroId];
      client.emit(`retro-state:${retroId}`, state);
      console.log(`📦 Sent retro state to client ${client.id} for retro ${retroId}`);
    }
  
    @SubscribeMessage('leave-retro-room')
    handleLeaveRetroRoom(client: Socket, retroId: string) {
      console.log(`🚪 Client ${client.id} leaving retro room: ${retroId}`);
      client.leave(`retro:${retroId}`);
    }
  
    broadcastParticipantUpdate(retroId: string) {
      console.log(`👥 Broadcasting participant update to room: ${retroId}`);
      this.server.to(`retro:${retroId}`).emit(`participants-update:${retroId}`);
    }

    broadcastRetroStarted(retroId: string) {
      console.log(`🚀 Broadcasting retro started to room: ${retroId}`);
      this.server.to(`retro:${retroId}`).emit(`retro-started:${retroId}`);
    }

    broadcastPhaseChange(retroId: string, phase: string) {
      console.log(`🔄 Broadcasting phase change to room: ${retroId}`, phase);
      this.server.to(`retro:${retroId}`).emit(`phase-change:${retroId}`, {
        phase: phase,
        timestamp: new Date().toISOString()
      });
    }

    broadcastItemAdded(retroId: string, item: any) {
      console.log(`📝 Broadcasting item added to room: ${retroId}`, item);
      this.server.to(`retro:${retroId}`).emit(`item-added:${retroId}`, item);
      
      // Log room members for debugging
      this.server.in(`retro:${retroId}`).fetchSockets().then(sockets => {
        console.log(`📝 Broadcasting to ${sockets.length} clients in room ${retroId}`);
      });
    }

    broadcastItemUpdated(retroId: string, item: any) {
      console.log(`✏️ Broadcasting item updated to room: ${retroId}`, item);
      this.server.to(`retro:${retroId}`).emit(`item-updated:${retroId}`, item);
    }

    broadcastItemDeleted(retroId: string, itemId: string) {
      console.log(`🗑️ Broadcasting item deleted to room: ${retroId}`, itemId);
      this.server.to(`retro:${retroId}`).emit(`item-deleted:${retroId}`, { itemId });
    }

    // Broadcast all items for a retro
    broadcastItemsUpdate(retroId: string, items: any[]) {
      console.log(`📋 Broadcasting items update to room: ${retroId}`, items.length, 'items');
      this.server.to(`retro:${retroId}`).emit(`items-update:${retroId}`, items);
    }

    // Broadcast action items for a retro
    broadcastActionItemsUpdate(retroId: string, actionItems: any[]) {
      console.log(`🚀 Broadcasting action items update to room: ${retroId}`, actionItems.length, 'action items');
      this.server.to(`retro:${retroId}`).emit(`action-items-update:${retroId}`, actionItems);
    }

    // Handle phase change from facilitator
    @SubscribeMessage('phase-change')
    handlePhaseChange(client: Socket, data: { retroId: string; phase: string; facilitatorId: string }) {
      console.log(`🔄 Phase change request from facilitator:`, data);
      
      // Broadcast phase change to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`phase-change:${data.retroId}`, {
        phase: data.phase,
        facilitatorId: data.facilitatorId,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Phase change broadcasted to room: ${data.retroId}`);
    }

    // Handle item position updates during dragging
    @SubscribeMessage('item-position-update')
    handleItemPositionUpdate(client: Socket, data: { retroId: string; itemId: string; position: { x: number; y: number }; userId: string }) {
      // Update in-memory state
      if (!retroState[data.retroId]) retroState[data.retroId] = { itemPositions: {}, itemGroups: {}, signatureColors: {}, actionItems: [] };
      retroState[data.retroId].itemPositions[data.itemId] = data.position;
      // Broadcast position update to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`item-position-update:${data.retroId}`, {
        itemId: data.itemId,
        position: data.position,
        userId: data.userId,
        timestamp: new Date().toISOString()
      });
      console.log(`📡 Item position broadcasted to room: ${data.retroId}`);
    }

    // Handle grouping updates
    @SubscribeMessage('grouping-update')
    handleGroupingUpdate(client: Socket, data: { 
      retroId: string; 
      itemGroups: { [itemId: string]: string }; 
      signatureColors: { [signature: string]: string };
      userId: string 
    }) {
      if (!retroState[data.retroId]) retroState[data.retroId] = { itemPositions: {}, itemGroups: {}, signatureColors: {}, actionItems: [] };
      retroState[data.retroId].itemGroups = data.itemGroups;
      retroState[data.retroId].signatureColors = data.signatureColors;
      // Broadcast grouping update to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`grouping-update:${data.retroId}`, {
        itemGroups: data.itemGroups,
        signatureColors: data.signatureColors,
        userId: data.userId,
        timestamp: new Date().toISOString()
      });
      // console.log(`🎨 Grouping update broadcasted to room: ${data.retroId}`);
    }

    // Handler baru: user minta state terkini
    @SubscribeMessage('request-retro-state')
    handleRequestRetroState(client: Socket, data: { retroId: string }) {
      const state = retroState[data.retroId] || { itemPositions: {}, itemGroups: {}, signatureColors: {}, actionItems: [] };
      client.emit(`retro-state:${data.retroId}`, state);
      console.log(`📦 Sent retro state to client ${client.id} for retro ${data.retroId}`);
    }

    @SubscribeMessage('typing')
    handleTyping(client: Socket, data: { retroId: string; userId: string }) {
      // Broadcast ke semua client di room retro
      this.server.to(`retro:${data.retroId}`).emit('typing', { userId: data.userId });
      // Opsional: log
      console.log(`✏️ Typing event from user ${data.userId} in retro ${data.retroId}`);
    }

    // Handle label updates from facilitator
    @SubscribeMessage('label-update')
    handleLabelUpdate(client: Socket, data: { 
      retroId: string; 
      groupId: number; 
      label: string; 
      userId: string 
    }) {
      console.log(`🏷️ Label update from facilitator:`, data);
      
      // Broadcast label update to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`label-update:${data.retroId}`, {
        groupId: data.groupId,
        label: data.label,
        userId: data.userId,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Label update broadcasted to room: ${data.retroId}`);
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
      console.log(`🗳️ Vote update from participant:`, data);
      
      // Broadcast vote update to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`vote-update:${data.retroId}`, {
        groupId: data.groupId,
        votes: data.votes,
        userId: data.userId,
        userVotes: data.userVotes,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Vote update broadcasted to room: ${data.retroId}`);
    }

    // Handle vote submission from facilitator
    @SubscribeMessage('vote-submission')
    handleVoteSubmission(client: Socket, data: { 
      retroId: string; 
      facilitatorId: string;
      groupVotes: { [groupId: number]: number };
    }) {
      console.log(`📊 Vote submission from facilitator:`, data);
      
      // Broadcast vote submission to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`vote-submission:${data.retroId}`, {
        facilitatorId: data.facilitatorId,
        groupVotes: data.groupVotes,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Vote submission broadcasted to room: ${data.retroId}`);
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
      console.log('🚀 Action item added:', data);
      
      // Initialize retro state if it doesn't exist
      if (!retroState[data.retroId]) {
        retroState[data.retroId] = {
          itemPositions: {},
          itemGroups: {},
          signatureColors: {},
          actionItems: []
        };
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
      console.log('✏️ Action item updated:', data);
      
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
      console.log('🗑️ Action item deleted:', data);
      
      if (retroState[data.retroId]) {
        retroState[data.retroId].actionItems = retroState[data.retroId].actionItems.filter(
          item => item.id !== data.actionItemId
        );
        
        // Broadcast to all clients in the retro room
        this.broadcastActionItemsUpdate(data.retroId, retroState[data.retroId].actionItems);
      }
    }

  }
  