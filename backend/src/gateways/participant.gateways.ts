import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ParticipantService } from '../services/participant.service';
import { Participant } from 'src/entities/participant.entity';

// Shared in-memory state (still exported if digunakan di luar)
export const retroState: {
  [retroId: string]: {
    itemPositions: { [itemId: string]: { x: number; y: number } };
    itemGroups: { [itemId: string]: string };
    signatureColors: { [signature: string]: string };
    actionItems: Array<{
      id: string;
      task: string;
      assigneeId: string;
      assigneeName: string;
      createdBy: string;
      createdAt: string;
      edited?: boolean;
    }>;
    allUserVotes: { [userId: string]: { [groupIdx: number]: number } };
    lastGroupingUpdate?: number;
  };
} = {};

/**
 * Simple async mutex (queue-based). Use runExclusive() to run critical sections.
 */
class Mutex {
  private _locked = false;
  private _waiters: Array<() => void> = [];

  private _acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this._locked) {
        this._locked = true;
        resolve();
      } else {
        this._waiters.push(resolve);
      }
    });
  }

  private _release() {
    const next = this._waiters.shift();
    if (next) {
      // wake next
      next();
    } else {
      this._locked = false;
    }
  }

  async runExclusive<T>(fn: () => Promise<T> | T): Promise<T> {
    await this._acquire();
    try {
      return await fn();
    } finally {
      this._release();
    }
  }
}

const retroMutexes: Map<string, Mutex> = new Map();

function getRetroMutex(retroId: string) {
  let m = retroMutexes.get(retroId);
  if (!m) {
    m = new Mutex();
    retroMutexes.set(retroId, m);
  }
  return m;
}

function ensureRetroState(retroId: string) {
  if (!retroState[retroId]) {
    retroState[retroId] = {
      itemPositions: {},
      itemGroups: {},
      signatureColors: {},
      actionItems: [],
      allUserVotes: {},
    };
  }
  return retroState[retroId];
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
})
  export class ParticipantGateway implements OnGatewayConnection, OnGatewayDisconnect {
    
     // Utility: deep copy before emit so later mutations don't change what's already emitted
  private safeEmit(socket: Socket | Server, event: string, payload: any) {
    const copy = JSON.parse(JSON.stringify(payload));
    if ((socket as any).emit) {
      (socket as any).emit(event, copy);
    }
  }

  // Optionally call this to remove state and mutex when room empty.
  private async cleanupRetroIfEmpty(retroId: string) {
    // Check number of sockets in the room
    const roomName = `retro:${retroId}`;
    const room = this.server.sockets.adapter.rooms.get(roomName);
    const size = room ? room.size : 0;
    if (size === 0) {
      // remove state and mutex to prevent memory leak
      delete retroState[retroId];
      retroMutexes.delete(retroId);
    }
  }
    
    @WebSocketServer()
    server: Server;
    private socketUserMap: Map<string, { userId: string; retroId: string }> = new Map();
    constructor(private readonly participantService: ParticipantService) {}
     async handleConnection(client: Socket) {
    const { userId, retroId } = client.handshake.query as { userId?: string; retroId?: string };

    if (typeof userId === 'string' && typeof retroId === 'string') {
      client.join(`retro:${retroId}`);
      this.socketUserMap.set(client.id, { userId, retroId });
      const mutex = getRetroMutex(retroId);
      await mutex.runExclusive(async () => {
        // init in-memory state if absent
        ensureRetroState(retroId);

        // Participant DB operations (these are awaited so safe within lock)
        const participant = await this.participantService.findParticipantByUserIdAndRetroId(userId, retroId);
        if (!participant) {
          try {
            await this.participantService.join(retroId, userId);
          } catch (err) {
            console.warn('Error on join (might be duplicate):', err?.message ?? err);
          }
        } else {
          try {
            await this.participantService.activated(retroId, userId);
          } catch (err) {
            console.warn('Error activating participant:', err?.message ?? err);
          }
        }

        // broadcast inside the lock so broadcast order matches DB+state
        this.broadcastParticipantUpdate(retroId);
      });
    } else {
      // If query params are missing, optionally disconnect or ignore
      // client.disconnect(true); // uncomment if you want to enforce params
    }
  }
  
 async handleDisconnect(client: Socket) {
    const info = this.socketUserMap.get(client.id);
    if (!info) return;

    const { userId, retroId } = info;

    // remove mapping early
    this.socketUserMap.delete(client.id);

    const mutex = getRetroMutex(retroId);
    await mutex.runExclusive(async () => {
      try {
        await this.participantService.deactivate(retroId, userId);
      } catch (error) {
        console.warn(`Failed to deactivate retro ${retroId} for user ${userId}:`, error?.message ?? error);
      } finally {
        // broadcast update inside lock so listeners see consistent state
        this.broadcastParticipantUpdate(retroId);
      }
    });

    // cleanup state/mutex when nobody left in the room
    await this.cleanupRetroIfEmpty(retroId);
  }

      @SubscribeMessage('request-item-positions')
      async handleRequestItemPositions(client: Socket, data: { retroId: string; userId: string }) {
        if (!data?.retroId) return;

        const mutex = getRetroMutex(data.retroId);
        await mutex.runExclusive(async () => {
          const state = ensureRetroState(data.retroId);
          this.safeEmit(client, `initial-item-positions:${data.retroId}`, {
            positions: state.itemPositions ?? {},
          });
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
      this.server.to(`retro:${retroId}`).emit(`participants-update:${retroId}`);
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
      this.server.to(`retro:${retroId}`).emit(`item-deleted:${retroId}`,itemId);
    }


    // Broadcast action items for a retro
    broadcastActionItemsUpdate(retroId: string, actionItems: any[]) {
      this.server.to(`retro:${retroId}`).emit(`action-items-update:${retroId}`, actionItems);
    }



// Handle item position updates during dragging
@SubscribeMessage('item-position-update')
async handleItemPositionUpdate(client: Socket, data: { 
  retroId: string; 
  itemId?: string; 
  position?: { x: number; y: number }; 
  itemPositions?: { [itemId: string]: { x: number; y: number } };
  userId: string;
  source: string;
}) {
  if (!data?.retroId) return;

  const mutex = getRetroMutex(data.retroId);
  await mutex.runExclusive(async () => {
    // Ensure state exists
    ensureRetroState(data.retroId);
    const currentPositions = retroState[data.retroId].itemPositions;

    // === Handle multiple item positions (for initialization) ===
    if (data.itemPositions) {
      const isInit = data.source === 'init-layout';
      const hasExisting = Object.keys(currentPositions).length > 0;

      // Only accept bulk init if the server doesn't have positions yet.
      if (isInit && hasExisting) {
        return;
      }

      const updatedPositions: { [itemId: string]: { x: number; y: number } } = {};

      for (const itemId in data.itemPositions) {
        const newPos = data.itemPositions[itemId];
        const existingPos = currentPositions[itemId];

        // If server has some positions already, only fill the missing ones.
        if (hasExisting && existingPos) {
          continue;
        }

        if (
          !existingPos || 
          existingPos.x !== newPos.x || 
          existingPos.y !== newPos.y
        ) {
          currentPositions[itemId] = newPos;
          updatedPositions[itemId] = newPos;
        }
      }

      // Hanya broadcast jika ada perubahan nyata
      if (Object.keys(updatedPositions).length > 0) {
        // gunakan safeEmit agar payload tidak berubah karena mutation setelah emit
        this.server.to(`retro:${data.retroId}`).emit(`item-position-update:${data.retroId}`, {
          itemPositions: updatedPositions,
          userId: data.userId,
          timestamp: new Date().toISOString()
        });
      }
    }

    // === Handle single item position (dragging) ===
    else if (data.itemId && data.position) {
      currentPositions[data.itemId] = data.position;

        this.server.to(`retro:${data.retroId}`).emit(`item-position-update:${data.retroId}`, {
        itemId: data.itemId,
        position: data.position,
        userId: data.userId,
        source: data.source,
        timestamp: new Date().toISOString()
      });
    }
  });
}


// Handle grouping updates
@SubscribeMessage('grouping-update')
async handleGroupingUpdate(client: Socket, data: { 
  retroId: string; 
  itemGroups: { [itemId: string]: string }; 
  signatureColors: { [signature: string]: string };
  userId: string;
  timestamp?: string;
  version?: number;
}) {
  if (!data?.retroId) return;

  const mutex = getRetroMutex(data.retroId);
  await mutex.runExclusive(async () => {
    ensureRetroState(data.retroId);
    // Timestamp-based conflict resolution on server side
    const updateTime = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
    const currentStateTime = retroState[data.retroId].lastGroupingUpdate || 0;

    // Only update if this is a newer update
    if (updateTime >= currentStateTime) {
      retroState[data.retroId].itemGroups = data.itemGroups;
      retroState[data.retroId].signatureColors = data.signatureColors;
      retroState[data.retroId].lastGroupingUpdate = updateTime;

      this.server.to(`retro:${data.retroId}`).emit(`grouping-update:${data.retroId}`, {
        itemGroups: data.itemGroups,
        signatureColors: data.signatureColors,
        userId: data.userId,
        timestamp: data.timestamp || new Date().toISOString(),
        version: data.version || 0
      });
    }
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
// helper method (letakkan di dalam class gateway Anda)
private async emitActionItemsUpdate(retroId: string, items: any[]) {
  const room = this.server.to(`retro:${retroId}`) as any;

  if (typeof (this as any).broadcastActionItemsUpdate === 'function') {
    try {
      // coba gunakan broadcastActionItemsUpdate jika tersedia
      await (this as any).broadcastActionItemsUpdate(retroId, items);
      return;
    } catch (err) {
      // fallback ke safeEmit jika gagal
      console.warn('broadcastActionItemsUpdate failed, falling back to safeEmit', err);
    }
  }

  // default fallback
  this.safeEmit(room, 'action-items:update', items);
}

// Handle action item added
@SubscribeMessage('action-item-added')
async handleActionItemAdded(client: Socket, data: {
  retroId: string;
  task: string;
  assigneeId: string;
  assigneeName: string;
  createdBy: string;
}) {
  if (!data?.retroId) return;

  const mutex = getRetroMutex(data.retroId);
  await mutex.runExclusive(async () => {
    // Ensure state exists
    ensureRetroState(data.retroId);
    const now = Date.now();
    const recentDuplicate = retroState[data.retroId].actionItems.find(item =>
      item.task === data.task &&
      item.assigneeId === data.assigneeId &&
      (now - new Date(item.createdAt).getTime()) < 500
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

    retroState[data.retroId].actionItems.push(newActionItem);

    // use centralized emitter
    await this.emitActionItemsUpdate(data.retroId, retroState[data.retroId].actionItems);
  });
}

// Handle action item updated
@SubscribeMessage('action-item-updated')
async handleActionItemUpdated(client: Socket, data: {
  retroId: string;
  actionItemId: string;
  task: string;
  assigneeId: string;
  assigneeName: string;
  updatedBy: string;
}) {
  if (!data?.retroId) return;

  const mutex = getRetroMutex(data.retroId);
  await mutex.runExclusive(async () => {
    ensureRetroState(data.retroId);

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

      // use centralized emitter
      await this.emitActionItemsUpdate(data.retroId, retroState[data.retroId].actionItems);
    }
  });
}

// Handle action item deleted
@SubscribeMessage('action-item-deleted')
async handleActionItemDeleted(client: Socket, data: {
  retroId: string;
  actionItemId: string;
}) {
  if (!data?.retroId) return;

  const mutex = getRetroMutex(data.retroId);
  await mutex.runExclusive(async () => {
    if (!retroState[data.retroId]) return;

    retroState[data.retroId].actionItems = retroState[data.retroId].actionItems.filter(
      item => item.id !== data.actionItemId
    );

    const items = retroState[data.retroId]?.actionItems ?? [];
    // use centralized emitter
    await this.emitActionItemsUpdate(data.retroId, items);
  });
}


  }
  