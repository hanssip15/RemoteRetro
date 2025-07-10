// src/gateways/participant.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  
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
      
      // Broadcast position update to all participants in the retro
      this.server.to(`retro:${data.retroId}`).emit(`item-position-update:${data.retroId}`, {
        itemId: data.itemId,
        position: data.position,
        userId: data.userId,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📡 Item position broadcasted to room: ${data.retroId}`);
    }
  }
  