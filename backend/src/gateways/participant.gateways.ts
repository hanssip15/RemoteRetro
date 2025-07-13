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
      signatureColors: { [signature: string]: string }
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
      client.join(`retro:${retroId}`);
      console.log(`🏠 Client ${client.id} joined retro room: ${retroId}`);
      
      // Log room members
      this.server.in(`retro:${retroId}`).fetchSockets().then(sockets => {
        console.log(`👥 Room ${retroId} now has ${sockets.length} members`);
      });
    }

    @SubscribeMessage('leave-retro-room')
    handleLeaveRetroRoom(client: Socket, retroId: string) {
      client.leave(`retro:${retroId}`);
      console.log(`🚪 Client ${client.id} left retro room: ${retroId}`);
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
      if (!retroState[data.retroId]) retroState[data.retroId] = { itemPositions: {}, itemGroups: {}, signatureColors: {} };
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
      if (!retroState[data.retroId]) retroState[data.retroId] = { itemPositions: {}, itemGroups: {}, signatureColors: {} };
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
      const state = retroState[data.retroId] || { itemPositions: {}, itemGroups: {}, signatureColors: {} };
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

  }
  