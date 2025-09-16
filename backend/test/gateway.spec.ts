// participant.gateway.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantGateway } from '../src/gateways/participant.gateways';
import { ParticipantService } from '../src/services/participant.service';
import { retroState } from '../src/gateways/participant.gateways';

import { Server, Socket } from 'socket.io';

// Mock ParticipantService
const mockParticipantService = {
  findParticipantByUserIdAndRetroId: jest.fn(),
  join: jest.fn(),
  activated: jest.fn(),
  
  deactivate: jest.fn(),
};

describe('ParticipantGateway', () => {
  let gateway: ParticipantGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantGateway,
        { provide: ParticipantService, useValue: mockParticipantService },
      ],
    }).compile();

    gateway = module.get<ParticipantGateway>(ParticipantGateway);

    // mock server
    gateway.server = {
      sockets: {
        adapter: {
          rooms: new Map(),
        },
      },
      to: jest.fn().mockReturnThis(),
      in: jest.fn(),
      emit: jest.fn(),
    } as any as Server;

    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should join retro room and call participantService.join if participant not found', async () => {
      const client = {
        id: 'socket-1',
        join: jest.fn(),
        handshake: {
          query: { userId: 'user1', retroId: 'retro1' },
        },
      } as any as Socket;

      mockParticipantService.findParticipantByUserIdAndRetroId.mockResolvedValue(null);
      mockParticipantService.join.mockResolvedValue({});

      await gateway.handleConnection(client);

      expect(client.join).toHaveBeenCalledWith('retro:retro1');
      expect(mockParticipantService.findParticipantByUserIdAndRetroId).toHaveBeenCalledWith('user1', 'retro1');
      expect(mockParticipantService.join).toHaveBeenCalledWith('retro1', 'user1');
    });

    it('should call participantService.activated if participant exists', async () => {
      const client = {
        id: 'socket-2',
        join: jest.fn(),
        handshake: {
          query: { userId: 'user2', retroId: 'retro2' },
        },
      } as any as Socket;

      mockParticipantService.findParticipantByUserIdAndRetroId.mockResolvedValue({ id: 'p1' });
      mockParticipantService.activated.mockResolvedValue({});

      await gateway.handleConnection(client);

      expect(mockParticipantService.activated).toHaveBeenCalledWith('retro2', 'user2');
    });

    it('should ignore if query params missing', async () => {
      const client = {
        id: 'socket-3',
        join: jest.fn(),
        handshake: { query: {} },
      } as any as Socket;

      await gateway.handleConnection(client);

      expect(client.join).not.toHaveBeenCalled();
      expect(mockParticipantService.findParticipantByUserIdAndRetroId).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should call deactivate and cleanup state if no sockets left', async () => {
      // mock client info
      const client = {
        id: 'socket-4',
        handshake: { query: { userId: 'userX', retroId: 'retroX' } },
      } as any as Socket;

      // inject mapping
      (gateway as any).socketUserMap.set(client.id, { userId: 'userX', retroId: 'retroX' });

      // add room info
      gateway.server.sockets.adapter.rooms.set('retro:retroX', new Set());

      mockParticipantService.deactivate.mockResolvedValue({});

      await gateway.handleDisconnect(client);

      expect(mockParticipantService.deactivate).toHaveBeenCalledWith('retroX', 'userX');
      expect((gateway as any).socketUserMap.has(client.id)).toBe(false);
    });

    it('should skip if client not in socketUserMap', async () => {
      const client = { id: 'unknown' } as any as Socket;
      await gateway.handleDisconnect(client);
      expect(mockParticipantService.deactivate).not.toHaveBeenCalled();
    });
  });
  describe('ParticipantGateway (SubscribeMessage & Broadcasts)', () => {
  let client: Socket;

  beforeEach(() => {
    client = {
      id: 'c1',
      emit: jest.fn(),
    } as any as Socket;

    // reset retroState
    for (const key of Object.keys(require('../src/gateways/participant.gateways').retroState)) {
      delete require('../src/gateways/participant.gateways').retroState[key];
    }
  });

  describe('handleRequestItemPositions', () => {
    it('should emit item positions for retroId', async () => {
      const data = { retroId: 'retro1', userId: 'u1' };

      // ensure retro state ada
      (require('../src/gateways/participant.gateways').retroState['retro1'] = {
        itemPositions: { i1: { x: 1, y: 2 } },
        itemGroups: {},
        signatureColors: {},
        actionItems: [],
        allUserVotes: {},
      });

      await gateway.handleRequestItemPositions(client, data);

      expect(client.emit).toHaveBeenCalledWith(
        'initial-item-positions:retro1',
        expect.objectContaining({
          positions: { i1: { x: 1, y: 2 } },
        }),
      );
    });

    it('should ignore if retroId missing', async () => {
      await gateway.handleRequestItemPositions(client, { retroId: undefined, userId: 'u1' } as any);
      expect(client.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleRequestVotingGroup', () => {
    it('should emit voting result for user', () => {
      (require('../src/gateways/participant.gateways').retroState['retro1'] = {
        itemPositions: {},
        itemGroups: {},
        signatureColors: {},
        actionItems: [],
        allUserVotes: { u1: { 0: 3, 1: 2 } },
      });

      gateway.handleRequestVotingGroup(client, { retroId: 'retro1', userId: 'u1' });

      expect(client.emit).toHaveBeenCalledWith(
        'initial-voting-result:retro1',
        { allUserVotes: { 0: 3, 1: 2 } },
      );
    });

    it('should emit empty votes if user has none', () => {
      (require('../src/gateways/participant.gateways').retroState['retro1'] = {
        itemPositions: {},
        itemGroups: {},
        signatureColors: {},
        actionItems: [],
        allUserVotes: {},
      });

      gateway.handleRequestVotingGroup(client, { retroId: 'retro1', userId: 'uX' });

      expect(client.emit).toHaveBeenCalledWith(
        'initial-voting-result:retro1',
        { allUserVotes: {} },
      );
    });
  });

  describe('broadcast methods', () => {
    beforeEach(() => {
      (gateway.server.to as jest.Mock).mockReturnValue({
        emit: jest.fn(),
      });
    });


    it('broadcastParticipantUpdate should emit participants-update', () => {
      gateway.broadcastParticipantUpdate('retroB');
      expect(gateway.server.to('retro:retroB').emit).toHaveBeenCalledWith(
        'participants-update:retroB',
      );
    });



    it('broadcastPhaseChange should emit phase-change with phase and timestamp', () => {
      gateway.broadcastPhaseChange('retroE', 'grouping');
      const call = (gateway.server.to('retro:retroE').emit as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('phase-change:retroE');
      expect(call[1]).toEqual(expect.objectContaining({ phase: 'grouping' }));
    });

    it('broadcastItemAdded should emit item-added', async () => {
      const fakeSockets = [{ id: 's1' }];
      (gateway.server.in as jest.Mock).mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue(fakeSockets),
      });

      const item = { id: 'i1', text: 'Hello' };
      await gateway.broadcastItemAdded('retroF', item);

      expect(gateway.server.to('retro:retroF').emit).toHaveBeenCalledWith(
        'item-added:retroF',
        item,
      );
    });


    it('broadcastItemUpdated should emit item-updated', () => {
      const item = { id: 'i2', text: 'Updated' };
      gateway.broadcastItemUpdated('retroG', item);
      expect(gateway.server.to('retro:retroG').emit).toHaveBeenCalledWith(
        'item-updated:retroG',
        item,
      );
    });

    it('broadcastItemDeleted should emit item-deleted', () => {
      gateway.broadcastItemDeleted('retroH', 'item123');
      expect(gateway.server.to('retro:retroH').emit).toHaveBeenCalledWith(
        'item-deleted:retroH',
        'item123',
      );
    });



    it('broadcastActionItemsUpdate should emit action-items-update', () => {
      const actions = [{ id: 'a1' }];
      gateway.broadcastActionItemsUpdate('retroJ', actions);
      expect(gateway.server.to('retro:retroJ').emit).toHaveBeenCalledWith(
        'action-items-update:retroJ',
        actions,
      );
    });
  });
});
describe('ParticipantGateway (Item & Grouping Updates)', () => {
  let client: Socket;

  beforeEach(() => {
    client = {
      id: 'cX',
      emit: jest.fn(),
    } as any as Socket;

    // reset retroState
    for (const key of Object.keys(require('../src/gateways/participant.gateways').retroState)) {
      delete require('../src/gateways/participant.gateways').retroState[key];
    }

    (gateway.server.to as jest.Mock).mockReturnValue({
      emit: jest.fn(),
    });
  });

  describe('handleItemPositionUpdate', () => {
    it('should ignore if retroId missing', async () => {
      await gateway.handleItemPositionUpdate(client, {
        retroId: undefined as any,
        userId: 'u1',
        source: 'drag',
      });
      expect(gateway.server.to).not.toHaveBeenCalled();
    });

    it('should accept bulk init when state empty', async () => {
      const data = {
        retroId: 'retro1',
        userId: 'u1',
        source: 'init-layout',
        itemPositions: { i1: { x: 10, y: 20 } },
      };
      await gateway.handleItemPositionUpdate(client, data);

      const emitCall = (gateway.server.to('retro:retro1').emit as jest.Mock).mock.calls[0];
      expect(emitCall[0]).toBe('item-position-update:retro1');
      expect(emitCall[1]).toEqual(
        expect.objectContaining({
          itemPositions: { i1: { x: 10, y: 20 } },
          userId: 'u1',
        }),
      );
    });

    it('should ignore bulk init if positions already exist', async () => {
      const state = require('../src/gateways/participant.gateways').retroState;
      state['retro2'] = {
        itemPositions: { i1: { x: 5, y: 5 } },
        itemGroups: {},
        signatureColors: {},
        actionItems: [],
        allUserVotes: {},
      };

      const data = {
        retroId: 'retro2',
        userId: 'u2',
        source: 'init-layout',
        itemPositions: { i2: { x: 100, y: 200 } },
      };

      await gateway.handleItemPositionUpdate(client, data);
      expect(gateway.server.to).not.toHaveBeenCalled();
    });

    it('should update missing positions on bulk update', async () => {
      const state = require('../src/gateways/participant.gateways').retroState;
      state['retro3'] = {
        itemPositions: { i1: { x: 5, y: 5 } },
        itemGroups: {},
        signatureColors: {},
        actionItems: [],
        allUserVotes: {},
      };

      const data = {
        retroId: 'retro3',
        userId: 'u3',
        source: 'bulk',
        itemPositions: {
          i1: { x: 5, y: 5 }, // unchanged
          i2: { x: 7, y: 8 }, // new
        },
      };

      await gateway.handleItemPositionUpdate(client, data);

      const emitCall = (gateway.server.to('retro:retro3').emit as jest.Mock).mock.calls[0];
      expect(emitCall[0]).toBe('item-position-update:retro3');
      expect(emitCall[1].itemPositions).toEqual({ i2: { x: 7, y: 8 } });
    });

    it('should handle single item position update', async () => {
      const data = {
        retroId: 'retro4',
        userId: 'u4',
        source: 'drag',
        itemId: 'iX',
        position: { x: 50, y: 60 },
      };

      await gateway.handleItemPositionUpdate(client, data);

      const emitCall = (gateway.server.to('retro:retro4').emit as jest.Mock).mock.calls[0];
      expect(emitCall[0]).toBe('item-position-update:retro4');
      expect(emitCall[1]).toEqual(
        expect.objectContaining({
          itemId: 'iX',
          position: { x: 50, y: 60 },
          userId: 'u4',
          source: 'drag',
        }),
      );
    });
  });

  describe('handleGroupingUpdate', () => {
    it('should ignore if retroId missing', async () => {
      await gateway.handleGroupingUpdate(client, {
        retroId: undefined as any,
        itemGroups: {},
        signatureColors: {},
        userId: 'u1',
      });
      expect(gateway.server.to).not.toHaveBeenCalled();
    });

    it('should update grouping if newer timestamp', async () => {
      const data = {
        retroId: 'retro5',
        itemGroups: { i1: 'g1' },
        signatureColors: { sig1: 'red' },
        userId: 'u5',
        timestamp: new Date().toISOString(),
        version: 1,
      };

      await gateway.handleGroupingUpdate(client, data);

      const emitCall = (gateway.server.to('retro:retro5').emit as jest.Mock).mock.calls[0];
      expect(emitCall[0]).toBe('grouping-update:retro5');
      expect(emitCall[1]).toEqual(
        expect.objectContaining({
          itemGroups: { i1: 'g1' },
          signatureColors: { sig1: 'red' },
          userId: 'u5',
          version: 1,
        }),
      );
    });

    it('should not update grouping if timestamp older', async () => {
      const state = require('../src/gateways/participant.gateways').retroState;
      state['retro6'] = {
        itemPositions: {},
        itemGroups: { iX: 'gOld' },
        signatureColors: { sigX: 'blue' },
        actionItems: [],
        allUserVotes: {},
        lastGroupingUpdate: Date.now() + 10000, // future
      };

      const data = {
        retroId: 'retro6',
        itemGroups: { iX: 'gNew' },
        signatureColors: { sigX: 'green' },
        userId: 'u6',
        timestamp: new Date(Date.now() - 5000).toISOString(), // older
      };

      await gateway.handleGroupingUpdate(client, data);

      expect(gateway.server.to).not.toHaveBeenCalled();
      expect(state['retro6'].itemGroups).toEqual({ iX: 'gOld' });
    });
  });
});
describe('Additional SubscribeMessage Handlers', () => {
  let gateway: ParticipantGateway;
  let mockClient: any;

 // di atas describe()
const mockParticipantService = {
  someMethod: jest.fn(), 
};

beforeEach(() => {
  gateway = new ParticipantGateway(mockParticipantService as any);
  gateway.server = {
    to: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as any;

  mockClient = {
    emit: jest.fn(),
  };
});


  describe('handleRequestRetroState', () => {
    it('should emit default state if retro does not exist', () => {
      const data = { retroId: 'r1' };
      gateway.handleRequestRetroState(mockClient, data);

      expect(mockClient.emit).toHaveBeenCalledWith(
        `retro-state:${data.retroId}`,
        {
          itemPositions: {},
          itemGroups: {},
          signatureColors: {},
          actionItems: [],
          allUserVotes: {},
        },
      );
    });

    it('should emit existing state if retro exists', () => {
      retroState['r1'] = {
        itemPositions: { i1: { x: 1, y: 2 } },
        itemGroups: {},
        signatureColors: {},
        actionItems: [],
        allUserVotes: {},
      };

      gateway.handleRequestRetroState(mockClient, { retroId: 'r1' });

      expect(mockClient.emit).toHaveBeenCalledWith(
        `retro-state:r1`,
        retroState['r1'],
      );
    });
  });

  describe('handleTyping', () => {
    it('should broadcast typing event', () => {
      const data = { retroId: 'r1', userId: 'u1' };
      gateway.handleTyping(mockClient, data);

      expect(gateway.server.to).toHaveBeenCalledWith('retro:r1');
      expect(gateway.server.emit).toHaveBeenCalledWith('typing', { userId: 'u1' });
    });
  });

  describe('handleLabelUpdate', () => {
    it('should broadcast label update event', () => {
      const data = { retroId: 'r1', groupId: 1, label: 'Test Label', userId: 'u1' };
      gateway.handleLabelUpdate(mockClient, data);

      expect(gateway.server.to).toHaveBeenCalledWith('retro:r1');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'label-update:r1',
        expect.objectContaining({
          groupId: 1,
          label: 'Test Label',
          userId: 'u1',
        }),
      );
    });
  });

  describe('handleVoteUpdate', () => {
    it('should initialize state if retro does not exist', () => {
      const data = { retroId: 'rX', groupId: 1, votes: 2, userId: 'u1', userVotes: { 1: 2 } };
      gateway.handleVoteUpdate(mockClient, data);

      expect(retroState['rX']).toBeDefined();
      expect(retroState['rX'].allUserVotes['u1']).toEqual({ 1: 2 });
      expect(gateway.server.to).toHaveBeenCalledWith('retro:rX');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'vote-update:rX',
        expect.objectContaining({
          groupId: 1,
          votes: 2,
          userId: 'u1',
          userVotes: { 1: 2 },
        }),
      );
    });

    it('should not broadcast if totalVotes > 3', () => {
      const data = { retroId: 'r1', groupId: 1, votes: 4, userId: 'u1', userVotes: { 1: 4 } };
      gateway.handleVoteUpdate(mockClient, data);

      expect(gateway.server.emit).not.toHaveBeenCalled();
    });

    it('should update state and broadcast valid vote update', () => {
      retroState['r1'] = {
        itemPositions: {},
        itemGroups: {},
        signatureColors: {},
        actionItems: [],
        allUserVotes: {},
      };

      const data = { retroId: 'r1', groupId: 2, votes: 1, userId: 'u2', userVotes: { 2: 1 } };
      gateway.handleVoteUpdate(mockClient, data);

      expect(retroState['r1'].allUserVotes['u2']).toEqual({ 2: 1 });
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'vote-update:r1',
        expect.objectContaining({
          groupId: 2,
          votes: 1,
          userId: 'u2',
        }),
      );
    });
  });
});

describe('User Votes & Facilitator Vote Submission', () => {
  let gateway: ParticipantGateway;
  let mockClient: any;

  beforeEach(() => {
    gateway = new ParticipantGateway({} as any); // dummy service
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    mockClient = { emit: jest.fn() };

    // Reset retroState tiap test
    for (const key in retroState) {
      delete retroState[key];
    }
  });

  describe('handleRequestUserVotes', () => {
    it('should emit existing user votes if available', () => {
      retroState['r1'] = {
        itemPositions: {},
        itemGroups: {},
        signatureColors: {},
        actionItems: [],
        allUserVotes: { u1: { 1: 2 } },
      };

      gateway.handleRequestUserVotes(mockClient, { retroId: 'r1', userId: 'u1' });

      expect(mockClient.emit).toHaveBeenCalledWith(
        'user-votes:r1:u1',
        { userVotes: { 1: 2 } }
      );
    });

    it('should emit empty votes if none exist', () => {
      retroState['r1'] = {
        itemPositions: {},
        itemGroups: {},
        signatureColors: {},
        actionItems: [],
        allUserVotes: {},
      };

      gateway.handleRequestUserVotes(mockClient, { retroId: 'r1', userId: 'uX' });

      expect(mockClient.emit).toHaveBeenCalledWith(
        'user-votes:r1:uX',
        { userVotes: {} }
      );
    });

    it('should emit empty votes if retroId not found', () => {
      gateway.handleRequestUserVotes(mockClient, { retroId: 'unknown', userId: 'u1' });

      expect(mockClient.emit).toHaveBeenCalledWith(
        'user-votes:unknown:u1',
        { userVotes: {} }
      );
    });
  });

  describe('handleVoteSubmission', () => {
    it('should broadcast facilitator vote submission', () => {
      const data = {
        retroId: 'r2',
        facilitatorId: 'fac1',
        groupVotes: { 1: 3, 2: 1 },
      };

      gateway.handleVoteSubmission(mockClient, data);

      expect(gateway.server.to).toHaveBeenCalledWith('retro:r2');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'vote-submission:r2',
        expect.objectContaining({
          facilitatorId: 'fac1',
          groupVotes: { 1: 3, 2: 1 },
        })
      );
    });
  });
});

describe('emitActionItemsUpdate', () => {
  let fakeRoom: any;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    fakeRoom = { emit: jest.fn() };
    gateway.server.to = jest.fn().mockReturnValue(fakeRoom);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); // mute warn
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('should use broadcastActionItemsUpdate if available', async () => {
    const mockBroadcast = jest.fn().mockResolvedValue(undefined);
    (gateway as any).broadcastActionItemsUpdate = mockBroadcast;

    await (gateway as any).emitActionItemsUpdate('retro1', [{ id: 'a1' }]);

    expect(mockBroadcast).toHaveBeenCalledWith('retro1', [{ id: 'a1' }]);
    expect(fakeRoom.emit).not.toHaveBeenCalled(); // fallback tidak dipakai
  });

  it('should fallback to safeEmit if broadcastActionItemsUpdate throws', async () => {
    const mockBroadcast = jest.fn().mockRejectedValue(new Error('fail'));
    (gateway as any).broadcastActionItemsUpdate = mockBroadcast;

    await (gateway as any).emitActionItemsUpdate('retro1', [{ id: 'a1' }]);

expect(fakeRoom.emit).toHaveBeenCalledWith('action-items:update', [{ id: 'a1' }]);
    expect(warnSpy).toHaveBeenCalled(); // pastikan warning dicatat
  });

  it('should fallback to safeEmit if broadcastActionItemsUpdate not defined', async () => {
    delete (gateway as any).broadcastActionItemsUpdate;

    await (gateway as any).emitActionItemsUpdate('retro1', [{ id: 'a1' }]);

    expect(fakeRoom.emit).toHaveBeenCalledWith('action-items-update:retro1', [{ id: 'a1' }]);
  });
});
describe('Action Item Handlers', () => {
  let client: any;
  let fakeRoom: any;

  beforeEach(() => {
    client = { emit: jest.fn() };
    fakeRoom = { emit: jest.fn() };
    gateway.server.to = jest.fn().mockReturnValue(fakeRoom);

    // reset state
    retroState['retro1'] = { itemPositions: {}, itemGroups: {}, signatureColors: {}, actionItems: [], allUserVotes: {} };
  });

  describe('handleActionItemAdded', () => {
    it('should add a new action item and emit update', async () => {
      const data = {
        retroId: 'retro1',
        task: 'Do something',
        assigneeId: 'u1',
        assigneeName: 'User 1',
        createdBy: 'facilitator'
      };

      await gateway.handleActionItemAdded(client, data);

      expect(retroState['retro1'].actionItems.length).toBe(1);
      expect(fakeRoom.emit).toHaveBeenCalledWith('action-items-update:retro1', retroState['retro1'].actionItems);
    });

    it('should not add duplicate action item within 500ms', async () => {
      const now = new Date().toISOString();
      retroState['retro1'].actionItems.push({
        id: 'a1',
        task: 'Duplicate Task',
        assigneeId: 'u1',
        assigneeName: 'User 1',
        createdBy: 'f1',
        createdAt: now,
        edited: false
      });

      const data = {
        retroId: 'retro1',
        task: 'Duplicate Task',
        assigneeId: 'u1',
        assigneeName: 'User 1',
        createdBy: 'f1'
      };

      await gateway.handleActionItemAdded(client, data);

      // tetap 1 item karena dianggap duplikat
      expect(retroState['retro1'].actionItems.length).toBe(1);
      expect(fakeRoom.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleActionItemUpdated', () => {
    it('should update existing action item and emit update', async () => {
      retroState['retro1'].actionItems.push({
        id: 'a1',
        task: 'Old Task',
        assigneeId: 'u1',
        assigneeName: 'User 1',
        createdBy: 'f1',
        createdAt: new Date().toISOString(),
        edited: false
      });

      const data = {
        retroId: 'retro1',
        actionItemId: 'a1',
        task: 'Updated Task',
        assigneeId: 'u2',
        assigneeName: 'User 2',
        updatedBy: 'f2'
      };

      await gateway.handleActionItemUpdated(client, data);

      expect(retroState['retro1'].actionItems[0].task).toBe('Updated Task');
      expect(retroState['retro1'].actionItems[0].edited).toBe(true);
      expect(fakeRoom.emit).toHaveBeenCalledWith('action-items-update:retro1', retroState['retro1'].actionItems);
    });

    it('should do nothing if action item does not exist', async () => {
      const data = {
        retroId: 'retro1',
        actionItemId: 'not-exist',
        task: 'Updated Task',
        assigneeId: 'u2',
        assigneeName: 'User 2',
        updatedBy: 'f2'
      };

      await gateway.handleActionItemUpdated(client, data);

      expect(fakeRoom.emit).not.toHaveBeenCalled();
    });
  });

  describe('handleActionItemDeleted', () => {
    it('should delete action item and emit update', async () => {
      retroState['retro1'].actionItems.push({ id: 'a1', task: 'T', assigneeId: 'u1', assigneeName: 'U1', createdBy: 'f1', createdAt: new Date().toISOString(), edited: false });

      const data = { retroId: 'retro1', actionItemId: 'a1' };

      await gateway.handleActionItemDeleted(client, data);

      expect(retroState['retro1'].actionItems.length).toBe(0);
      expect(fakeRoom.emit).toHaveBeenCalledWith('action-items-update:retro1', []);
    });

    it('should do nothing if retro state not exists', async () => {
      delete retroState['retroX']; // pastikan tidak ada state

      const data = { retroId: 'retroX', actionItemId: 'a1' };

      await gateway.handleActionItemDeleted(client, data);

      expect(fakeRoom.emit).not.toHaveBeenCalled();
    });
  });
});


});
