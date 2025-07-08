// src/gateways/participant.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server } from 'socket.io';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
    },
  })
  export class ParticipantGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    handleConnection(client: any) {
      console.log('Client connected:', client.id);
    }
  
    handleDisconnect(client: any) {
      console.log('Client disconnected:', client.id);
    }
  
    broadcastParticipantUpdate(retroId: string) {
      this.server.emit(`participants-update:${retroId}`);
    }
  }
  