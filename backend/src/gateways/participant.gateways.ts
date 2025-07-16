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
      participantsOnline: { [userId: string]: boolean },
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
  const socketMetaMap: Record<string, { retroId: string; participantId: number }> = {};

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
      const meta = socketMetaMap[client.id];
      if (meta) {
        const { retroId, participantId } = meta;

        // Set participant offline
        if (retroState[retroId]?.participantsOnline) {
          retroState[retroId].participantsOnline[participantId] = false;
        }
        

        // Broadcast ke peserta lain
        this.broadcastParticipantUpdate(retroId,participantId);

        // Cleanup
        delete socketMetaMap[client.id];
      }
    }
  
    @SubscribeMessage('join-retro-room')
    handleJoinRetroRoom(client: Socket, retroId: string, participantId: number) {
      client.join(`retro:${retroId}`);
      
      // Initialize retro state if it doesn't exist
      if (!retroState[retroId]) {
        retroState[retroId] = {
          participantsOnline: {},
          itemPositions: {},
          itemGroups: {},
          signatureColors: {},
          actionItems: []
        };
      }
      if (!retroState[retroId].participantsOnline) retroState[retroId].participantsOnline = {};
      retroState[retroId].participantsOnline[participantId] = true;
      this.broadcastParticipantUpdate(retroId,participantId);
      
      // Send current retro state to the joining client
      const state = retroState[retroId];
      const socketMeta = {
        retroId,
        participantId,
      };
      socketMetaMap[client.id] = socketMeta; // Tambahkan ini
      client.emit(`retro-state:${retroId}`, state);
    }
  
    @SubscribeMessage('leave-retro-room')
    handleLeaveRetroRoom(client: Socket, retroId: string, participantId:number) {
      console.log("participan yang keluar :", participantId, "dari retro", retroId)
      client.leave(`retro:${retroId}`);

      // if (retroState[retroId]?.participantsOnline) {
      // retroState[retroId].participantsOnline[participantId] = false;
      // this.broadcastParticipantUpdate(retroId,participantId);
      // }
    }
  
    broadcastParticipantUpdate(retroId: string,participantId:number) {
      // this.server.to(`retro:${retroId}`).emit(`participants-update:${retroId}`);
      this.server.to(`retro:${retroId}`).emit(`participants-update:${retroId}`, {
        participantsOnline: retroState[retroId]?.participantsOnline || {}
      });
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
      if (!retroState[data.retroId]) retroState[data.retroId] = {participantsOnline: {},
      itemPositions: {}, itemGroups: {}, signatureColors: {}, actionItems: [] };
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
      if (!retroState[data.retroId]) retroState[data.retroId] = { participantsOnline: {}, itemPositions: {}, itemGroups: {}, signatureColors: {}, actionItems: [] };
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
      const state = retroState[data.retroId] || { itemPositions: {}, itemGroups: {}, signatureColors: {}, actionItems: [] };
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
      
      // Broadcast vote update to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`vote-update:${data.retroId}`, {
        groupId: data.groupId,
        votes: data.votes,
        userId: data.userId,
        userVotes: data.userVotes,
        timestamp: new Date().toISOString()
      });
      
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
          participantsOnline: {},
          itemPositions: {},
          itemGroups: {},
          signatureColors: {},
          actionItems: []
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
  