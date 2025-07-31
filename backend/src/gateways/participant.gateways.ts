// src/gateways/participant.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { ParticipantService } from 'src/services/participant.service';
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
    private socketUserMap: Map<string, { userId: string; retroId: string }> = new Map();

    constructor(private readonly participantService: ParticipantService) {}

    async handleConnection(client: Socket) {
       const { userId, retroId } = client.handshake.query;

    if (typeof userId === 'string' && typeof retroId === 'string') {
      console.log(`🔗 User ${userId} connecting to retro ${retroId}`);
      client.join(`retro:${retroId}`);
      this.socketUserMap.set(client.id, { userId, retroId });
      const participant = await this.participantService.findParticipantByUserIdAndRetroId(userId, retroId);
      if (!participant) {
        const isFacilitator = await this.participantService.isFacilitator(retroId, userId);
        console.log(`👤 User ${userId} joining retro ${retroId} as ${isFacilitator ? 'facilitator' : 'participant'}`);
        await this.participantService.join(retroId, { userId, role: isFacilitator, isActive: true  });    
      } else {
        console.log(`👤 User ${userId} activating in retro ${retroId}`);
        await this.participantService.activated(retroId, userId);
      }
      
      // Broadcast participant update setelah user berhasil join/activate
      this.broadcastParticipantUpdate(retroId);
    }
  }
  
    async handleDisconnect(client: Socket) {
    const info = this.socketUserMap.get(client.id);
    if (info) {
      const { userId, retroId } = info;
      console.log(`👋 User ${userId} disconnecting from retro ${retroId}`);
      await this.participantService.leave(retroId, userId);
      this.socketUserMap.delete(client.id);
      
      // Broadcast participant update setelah user leave
      this.broadcastParticipantUpdate(retroId);
    }
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

    @SubscribeMessage('request-item-positions')
    handleRequestItemPositions(client: Socket, data: { retroId: string; userId: string }) {
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
      
      const itemPositions = retroState[data.retroId]?.itemPositions || {};
      client.emit(`initial-item-positions:${data.retroId}`, {
        positions: itemPositions
      });
    }

    @SubscribeMessage('request-voting-result')
    handleRequestVotingGroup(client: Socket, data: { retroId: string; userId: string }) {
      const userVotes = retroState[data.retroId]?.allUserVotes[data.userId] || {};
      client.emit(`initial-voting-result:${data.retroId}`, {
        allUserVotes: userVotes
      });
    }


  
    broadcastParticipantUpdate(retroId: string) {
      console.log(`📢 Broadcasting participant update for retro: ${retroId}`);
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
    handleItemPositionUpdate(client: Socket, data: { 
      retroId: string; 
      itemId?: string; 
      position?: { x: number; y: number }; 
      itemPositions?: { [itemId: string]: { x: number; y: number } };
      userId: string,
      source: string
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

      // Handle multiple item positions (for initialization)
      if (data.itemPositions) {
        if (data.source === "initial") {
        // Hanya update jika positions yang baru lebih lengkap atau berbeda
        const currentPositions = retroState[data.retroId].itemPositions;
        const newPositions = data.itemPositions;
        
        // Update jika positions baru lebih lengkap atau berbeda
        if (Object.keys(newPositions).length > Object.keys(currentPositions).length ||
            JSON.stringify(newPositions) !== JSON.stringify(currentPositions)) {
          retroState[data.retroId].itemPositions = { 
            ...currentPositions, 
            ...newPositions 
          };
          
          // Broadcast to all participants
          this.server.to(`retro:${data.retroId}`).emit(`item-position-update:${data.retroId}`, {
            itemPositions: newPositions,
            userId: data.userId,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
      // Handle single item position (for dragging)
      else if (data.itemId && data.position) {
        retroState[data.retroId].itemPositions[data.itemId] = data.position;
        
        // Broadcast position update to all participants in the retro
        this.server.to(`retro:${data.retroId}`).emit(`item-position-update:${data.retroId}`, {
          itemId: data.itemId,
          position: data.position,
          userId: data.userId,
          timestamp: new Date().toISOString()
        });
      }
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
      if (!retroState[data.retroId]) {
        retroState[data.retroId] = {
          itemPositions: {},
          itemGroups: {},
          signatureColors: {},
          actionItems: [],
          allUserVotes: {}
        };
      }
      const totalVotes = Object.values(data.userVotes).reduce((sum: number, votes: number) => sum + votes, 0);
      
      if (totalVotes < 0 || totalVotes > 3) {
        return;
      }      
      retroState[data.retroId].allUserVotes[data.userId] = { ...data.userVotes };
      
      Object.entries(retroState[data.retroId].allUserVotes).forEach(([userId, userVotes]) => {
        const userTotalVotes = Object.values(userVotes).reduce((sum: number, votes: number) => sum + votes, 0);
      });
        const broadcastData = {
        groupId: data.groupId,
        votes: data.votes,
        userId: data.userId,
        userVotes: data.userVotes,
        allUserVotes: retroState[data.retroId].allUserVotes,
        timestamp: new Date().toISOString()
      };
      
      this.server.to(`retro:${data.retroId}`).emit(`vote-update:${data.retroId}`, broadcastData);
      
    }
    @SubscribeMessage('request-user-votes')
handleRequestUserVotes(
  client: Socket,
  data: { retroId: string; userId: string }
) {
  const { retroId, userId } = data;

  if (
    retroState[retroId] &&
    retroState[retroId].allUserVotes &&
    retroState[retroId].allUserVotes[userId]
  ) {
    const userVotes = retroState[retroId].allUserVotes[userId];

    client.emit(`user-votes:${retroId}:${userId}`, { userVotes });
  } else {
    client.emit(`user-votes:${retroId}:${userId}`, { userVotes: {} }); // kosong jika belum ada
  }
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
    // retro.gateway.ts
   @SubscribeMessage('leave-room')
async handleLeaveRoom(
  @MessageBody() data: { retroId: string; userId: string },
  @ConnectedSocket() client: Socket,
): Promise<void> {
  const { retroId, userId } = data;

  try {


    // Hapus partisipan
    await this.participantService.removeParticipant(retroId, userId);

    // Emit event ke semua partisipan tentang keluar
    this.server.to(retroId).emit('participant-left', { userId });
  } catch (err) {
    console.error('Error removing participant:', err);
  }
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
        
        this.broadcastActionItemsUpdate(data.retroId, retroState[data.retroId].actionItems);
      }
    }

  }
  