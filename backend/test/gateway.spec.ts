import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantGateway } from '../src/gateways/participant.gateways';
import { ParticipantService } from '../src/services/participant.service';
import { retroState } from '../src/gateways/participant.gateways';
import { Socket } from 'socket.io';
import { mock } from 'node:test';

describe('ParticipantGateway', () => {
  let gateway: ParticipantGateway;
  let mockParticipantService: jest.Mocked<ParticipantService>;
  let mockClient: Socket;


  beforeEach(async () => {
    mockParticipantService = {
      findParticipantByUserIdAndRetroId: jest.fn(),
      isFacilitator: jest.fn(),
      join: jest.fn(),
      activated: jest.fn(),
      leave: jest.fn(),
    } as any;

     for (const key of Object.keys(retroState)) {
    delete retroState[key];
  }
  

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantGateway,
        { provide: ParticipantService, useValue: mockParticipantService },
      ],
    }).compile();

    gateway = module.get(ParticipantGateway);
    

    mockClient = {
      leave: jest.fn(),
      emit: jest.fn(),
    } as any;

    // mock server socket.io
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      in: jest.fn().mockReturnThis(),
      fetchSockets: jest.fn().mockResolvedValue([]),
    } as any;
  });
  
  
  beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {}); // biar silent
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

  describe('handleConnection', () => {
    it('should join new participant if not exists', async () => {
      const client = {
        id: 'socket1',
        handshake: { query: { userId: 'u1', retroId: 'r1' } },
        join: jest.fn(),
      } as any as Socket;

      mockParticipantService.findParticipantByUserIdAndRetroId.mockResolvedValue(null);
      mockParticipantService.isFacilitator.mockResolvedValue(true);

      await gateway.handleConnection(client);

      expect(client.join).toHaveBeenCalledWith('retro:r1');
      expect(mockParticipantService.join).toHaveBeenCalledWith('r1', 'u1', { role: true, isActive: true });
      expect(gateway.server.to).toHaveBeenCalledWith('retro:r1');
      expect(gateway.server.emit).toHaveBeenCalledWith(expect.stringContaining('participants-update:r1'));
    });

    it('should activate participant if already exists', async () => {
      const client = {
        id: 'socket2',
        handshake: { query: { userId: 'u2', retroId: 'r2' } },
        join: jest.fn(),
      } as any as Socket;

      mockParticipantService.findParticipantByUserIdAndRetroId.mockResolvedValue({ id: 'p1' } as any);

      await gateway.handleConnection(client);

      expect(mockParticipantService.activated).toHaveBeenCalledWith('r2', 'u2');
    });
  });

  describe('handleDisconnect', () => {
    it('should call leave and broadcast update', async () => {
      const client = { id: 'socket3' } as any as Socket;
      (gateway as any).socketUserMap.set('socket3', { userId: 'u3', retroId: 'r3' });

      await gateway.handleDisconnect(client);

      expect(mockParticipantService.leave).toHaveBeenCalledWith('r3', 'u3');
      expect(gateway.server.to).toHaveBeenCalledWith('retro:r3');
      expect(gateway.server.emit).toHaveBeenCalledWith(expect.stringContaining('participants-update:r3'));
    });
  });

  describe('handleJoinRetroRoom', () => {
    it('should emit retro state when joining', () => {
      const client = { join: jest.fn(), emit: jest.fn() } as any as Socket;
      gateway.handleJoinRetroRoom(client, 'retroX');

      expect(client.join).toHaveBeenCalledWith('retro:retroX');
      expect(client.emit).toHaveBeenCalledWith('retro-state:retroX', expect.any(Object));
    });
  });

  describe('broadcastParticipantAdded', () => {
    it('should emit participants-added event', () => {
      const participant = { id: 'p1' } as any;
      gateway.broadcastParticipantAdded('r5', participant);

      expect(gateway.server.to).toHaveBeenCalledWith('retro:r5');
      expect(gateway.server.emit).toHaveBeenCalledWith(`participants-added:r5`, participant);
    });
  });

  describe('handleVoteUpdate', () => {
    it('should emit vote-update event if valid votes', () => {
      const client = {} as Socket;
      const data = {
        retroId: 'r6',
        groupId: 1,
        votes: 2,
        userId: 'u6',
        userVotes: { 1: 2 },
      };

      gateway.handleVoteUpdate(client, data);

      expect(gateway.server.to).toHaveBeenCalledWith('retro:r6');
      expect(gateway.server.emit).toHaveBeenCalledWith(
        `vote-update:r6`,
        expect.objectContaining({ userId: 'u6', groupId: 1 }),
      );
    });
  });

  describe('handleLeaveRetroRoom', () => {
    it('should call client.leave with correct room id', () => {
      const retroId = 'retro123';

      gateway.handleLeaveRetroRoom(mockClient, retroId);

      expect(mockClient.leave).toHaveBeenCalledWith(`retro:${retroId}`);
    });
  });

  describe('handleRequestItemPositions', () => {
    it('should initialize retroState if not exists', () => {
      const retroId = 'retro456';
      const userId = 'user789';

      gateway.handleRequestItemPositions(mockClient, { retroId, userId });

      expect(retroState[retroId]).toBeDefined();
      expect(retroState[retroId].itemPositions).toEqual({});
    });

    it('should emit initial-item-positions event with positions', () => {
      const retroId = 'retro999';
      const userId = 'user123';

      // siapkan state
      retroState[retroId] = {
        itemPositions: { item1: { x: 100, y: 200 } },
        itemGroups: {},
        signatureColors: {},
        actionItems: [],
        allUserVotes: {}
      };

      gateway.handleRequestItemPositions(mockClient, { retroId, userId });

      expect(mockClient.emit).toHaveBeenCalledWith(
        `initial-item-positions:${retroId}`,
        { positions: retroState[retroId].itemPositions }
      );
    });
    
  });
  it('should emit empty votes if user has no votes', () => {
    const retroId = 'retro1';
    const userId = 'user1';

    // retroState kosong, jadi userVotes harus {}
    gateway.handleRequestVotingGroup(mockClient, { retroId, userId });

    expect(mockClient.emit).toHaveBeenCalledWith(
      `initial-voting-result:${retroId}`,
      { allUserVotes: {} }
    );
  });

    it('should emit existing votes if user has votes', () => {
    const retroId = 'retro2';
    const userId = 'user2';

    // siapkan state dengan votes
    retroState[retroId] = {
      itemPositions: {},
      itemGroups: {},
      signatureColors: {},
      actionItems: [],
      allUserVotes: {
        [userId]: { 1: 3, 2: 1 }, // user2 vote group1=3, group2=1
      },
    };

    gateway.handleRequestVotingGroup(mockClient, { retroId, userId });

    expect(mockClient.emit).toHaveBeenCalledWith(
      `initial-voting-result:${retroId}`,
      { allUserVotes: { 1: 3, 2: 1 } }
    );
  });

  it('should broadcast retro-started event', () => {
    const retroId = 'retro123';

    gateway.broadcastRetroStarted(retroId);

    expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(
      `retro-started:${retroId}`
    );
  });

  it('should broadcast retro-completed event with status and timestamp', () => {
    const retroId = 'retro456';

    gateway.broadcastRetroCompleted(retroId);

    expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(
      `retro-completed:${retroId}`,
      expect.objectContaining({
        status: 'completed',
        timestamp: expect.any(String), // timestamp harus string ISO
      }),
    );
  });

  it('should broadcast phase-change event with phase and timestamp', () => {
    const retroId = 'retro789';
    const phase = 'voting';

    gateway.broadcastPhaseChange(retroId, phase);

    expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(
      `phase-change:${retroId}`,
      expect.objectContaining({
        phase: 'voting',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should broadcast item-added event and call fetchSockets', async () => {
    const retroId = 'retro123';
    const item = { id: 'item1', text: 'New item' };

    await gateway.broadcastItemAdded(retroId, item);

    // cek emit dipanggil dengan benar
    expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(`item-added:${retroId}`, item);

    // cek fetchSockets juga dipanggil
    expect(gateway.server.in).toHaveBeenCalledWith(`retro:${retroId}`);
    const inCall = gateway.server.in(`retro:${retroId}`);
    expect(inCall.fetchSockets).toHaveBeenCalled();
  });

  it('should broadcast item-updated event', () => {
    const retroId = 'retro456';
    const item = { id: 'item2', text: 'Updated item' };

    gateway.broadcastItemUpdated(retroId, item);

    expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(`item-updated:${retroId}`, item);
  });

  it('should broadcast item-deleted event', () => {
    const retroId = 'retro789';
    const itemId = 'item3';

    gateway.broadcastItemDeleted(retroId, itemId);

    expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(`item-deleted:${retroId}`, itemId);
  });
  
   it('should broadcast items-update event', () => {
    const retroId = 'retro123';
    const items = [{ id: 'i1', text: 'Item 1' }, { id: 'i2', text: 'Item 2' }];

    gateway.broadcastItemsUpdate(retroId, items);

    // expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(`items-update:${retroId}`, items);
  });

  it('should broadcast action-items-update event', () => {
    const retroId = 'retro456';
    const actionItems = [{ id: 'a1', task: 'Fix bug' }];

    gateway.broadcastActionItemsUpdate(retroId, actionItems);

    // expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(
      `action-items-update:${retroId}`,
      actionItems,
    );
  });

  it('should broadcast updated positions when multiple itemPositions change', () => {
    const retroId = 'retro1';
    const userId = 'user1';

    gateway.handleItemPositionUpdate({} as Socket, {
      retroId,
      userId,
      source: 'init',
      itemPositions: {
        itemA: { x: 10, y: 20 },
        itemB: { x: 30, y: 40 },
      },
    });

    expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(
      `item-position-update:${retroId}`,
      expect.objectContaining({
        itemPositions: {
          itemA: { x: 10, y: 20 },
          itemB: { x: 30, y: 40 },
        },
        userId,
        timestamp: expect.any(String),
      }),
    );
  });

  it('should not broadcast if itemPositions have no actual change', () => {
    const retroId = 'retro2';
    const userId = 'user2';

    // Set state awal
    retroState[retroId] = {
      itemPositions: { itemX: { x: 50, y: 60 } },
      itemGroups: {},
      signatureColors: {},
      actionItems: [],
      allUserVotes: {},
    };

    gateway.handleItemPositionUpdate({} as Socket, {
      retroId,
      userId,
      source: 'init',
      itemPositions: {
        itemX: { x: 50, y: 60 }, // posisi sama dengan existing
      },
    });

    expect(gateway.server.to(`retro:${retroId}`).emit).not.toHaveBeenCalled();
  });

  it('should broadcast when single item position is updated', () => {
    const retroId = 'retro3';
    const userId = 'user3';

    gateway.handleItemPositionUpdate({} as Socket, {
      retroId,
      userId,
      source: 'drag',
      itemId: 'itemY',
      position: { x: 100, y: 200 },
    });

    expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(
      `item-position-update:${retroId}`,
      expect.objectContaining({
        itemId: 'itemY',
        position: { x: 100, y: 200 },
        userId,
        timestamp: expect.any(String),
      }),
    );
  });
  describe('handleGroupingUpdate', () => {


  it('should initialize retroState if not exists and broadcast grouping update', () => {
    const retroId = 'retro1';
    const data = {
      retroId,
      itemGroups: { item1: 'group1' },
      signatureColors: { sig1: 'red' },
      userId: 'user1',
    };

    gateway.handleGroupingUpdate({} as Socket, data);

    // state harus terbuat
    expect(retroState[retroId]).toBeDefined();
    expect(retroState[retroId].itemGroups).toEqual(data.itemGroups);
    expect(retroState[retroId].signatureColors).toEqual(data.signatureColors);

    // broadcast harus terjadi
    expect(gateway.server.to).toHaveBeenCalledWith(`retro:${retroId}`);
    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(
      `grouping-update:${retroId}`,
      expect.objectContaining({
        itemGroups: data.itemGroups,
        signatureColors: data.signatureColors,
        userId: data.userId,
        timestamp: expect.any(String),
        version: 0,
      }),
    );
  });

  it('should update and broadcast if timestamp is newer', () => {
    const retroId = 'retro2';
    retroState[retroId] = {
      itemPositions: {},
      itemGroups: { oldItem: 'oldGroup' },
      signatureColors: { oldSig: 'blue' },
      actionItems: [],
      allUserVotes: {},
      lastGroupingUpdate: new Date('2023-01-01T00:00:00Z').getTime(),
    };

    const data = {
      retroId,
      itemGroups: { newItem: 'newGroup' },
      signatureColors: { newSig: 'green' },
      userId: 'user2',
      timestamp: '2023-01-02T00:00:00Z', // lebih baru
      version: 5,
    };

    gateway.handleGroupingUpdate({} as Socket, data);

    expect(retroState[retroId].itemGroups).toEqual(data.itemGroups);
    expect(retroState[retroId].signatureColors).toEqual(data.signatureColors);

    expect(gateway.server.to(`retro:${retroId}`).emit).toHaveBeenCalledWith(
      `grouping-update:${retroId}`,
      expect.objectContaining({
        itemGroups: data.itemGroups,
        signatureColors: data.signatureColors,
        userId: 'user2',
        timestamp: data.timestamp,
        version: 5,
      }),
    );
  });

  it('should ignore update if timestamp is older', () => {
    const retroId = 'retro3';
    retroState[retroId] = {
      itemPositions: {},
      itemGroups: { keepItem: 'keepGroup' },
      signatureColors: { keepSig: 'yellow' },
      actionItems: [],
      allUserVotes: {},
      lastGroupingUpdate: new Date('2023-05-01T00:00:00Z').getTime(),
    };

    const data = {
      retroId,
      itemGroups: { outdated: 'oldGroup' },
      signatureColors: { outdatedSig: 'gray' },
      userId: 'user3',
      timestamp: '2023-04-01T00:00:00Z', // lebih lama
    };

    gateway.handleGroupingUpdate({} as Socket, data);

    // state harus tetap
    expect(retroState[retroId].itemGroups).toEqual({ keepItem: 'keepGroup' });
    expect(retroState[retroId].signatureColors).toEqual({ keepSig: 'yellow' });

    // broadcast tidak terjadi
    expect(gateway.server.to(`retro:${retroId}`).emit).not.toHaveBeenCalled();
  });
});
 describe('handleRequestRetroState', () => {
    it('should emit default state if retroId not in retroState', () => {
      const retroId = 'retro1';

      gateway.handleRequestRetroState(mockClient, { retroId });

      expect(mockClient.emit).toHaveBeenCalledWith(
        `retro-state:${retroId}`,
        {
          itemPositions: {},
          itemGroups: {},
          signatureColors: {},
          actionItems: [],
          allUserVotes: {},
        },
      );
    });

    it('should emit existing retro state if available', () => {
      const retroId = 'retro2';
      retroState[retroId] = {
        itemPositions: { i1: { x: 1, y: 2 } },
        itemGroups: { i1: 'g1' },
        signatureColors: { sig1: 'blue' },
        actionItems: [{ id: 'a1', task: 'Do something' } as any],
        allUserVotes: { u1: { 1: 2 } },
      };

      gateway.handleRequestRetroState(mockClient, { retroId });

      expect(mockClient.emit).toHaveBeenCalledWith(
        `retro-state:${retroId}`,
        retroState[retroId],
      );
    });
  });

  describe('handleTyping', () => {
    it('should broadcast typing event with userId', () => {
      const data = { retroId: 'retro3', userId: 'user123' };

      gateway.handleTyping({} as Socket, data);

      expect(gateway.server.to).toHaveBeenCalledWith(`retro:${data.retroId}`);
      expect(gateway.server.to(`retro:${data.retroId}`).emit).toHaveBeenCalledWith('typing', { userId: data.userId });
    });
  });

  describe('handleLabelUpdate', () => {
    it('should broadcast label-update event with correct payload', () => {
      const data = {
        retroId: 'retro4',
        groupId: 5,
        label: 'Bug Fixes',
        userId: 'facilitator1',
      };

      gateway.handleLabelUpdate({} as Socket, data);

      expect(gateway.server.to).toHaveBeenCalledWith(`retro:${data.retroId}`);
      expect(gateway.server.to(`retro:${data.retroId}`).emit).toHaveBeenCalledWith(
        `label-update:${data.retroId}`,
        expect.objectContaining({
          groupId: data.groupId,
          label: data.label,
          userId: data.userId,
          timestamp: expect.any(String),
        }),
      );
    });
  });
  describe('request-user-votes', () => {
     it('should emit existing userVotes if available', () => {
    const retroId = 'retro1';
    const userId = 'user123';

    // Simulasi retroState sudah ada data votes
    retroState[retroId] = {
      allUserVotes: {
        [userId]: { 1: 2, 2: 1 },
      },
    } as any;

    gateway.handleRequestUserVotes(mockClient, { retroId, userId });

    expect(mockClient.emit).toHaveBeenCalledWith(
      `user-votes:${retroId}:${userId}`,
      { userVotes: { 1: 2, 2: 1 } },
    );
  });

  it('should emit empty object if userVotes not found', () => {
    const retroId = 'retro2';
    const userId = 'user456';

    // Tidak isi retroState, biar kosong
    gateway.handleRequestUserVotes(mockClient, { retroId, userId });

    expect(mockClient.emit).toHaveBeenCalledWith(
      `user-votes:${retroId}:${userId}`,
      { userVotes: {} },
    );
  });
  });

  describe('ParticipantGateway - handleActionItemAdded', () => {
    beforeEach(() => {
      jest.spyOn(gateway, 'broadcastActionItemsUpdate').mockImplementation(() => {});
      for (const key of Object.keys(retroState)) delete retroState[key];


    });

    beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {}); // biar silent
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

  it('should initialize state if retroId not exists', () => {
  const data = {
    retroId: 'retro1',
    task: 'Do homework',
    assigneeId: 'u1',
    assigneeName: 'Alice',
    createdBy: 'Bob'
  };

  gateway.handleActionItemAdded({} as any, data);

  expect(retroState['retro1']).toBeDefined();
  expect(retroState['retro1'].actionItems.length).toBe(1);
  expect(gateway.broadcastActionItemsUpdate).toHaveBeenCalledWith(
    'retro1',
    expect.any(Array),
  );
});

it('should not add duplicate action item within 5 seconds', () => {
  const retroId = 'retro2';
  const now = Date.now();

  retroState[retroId] = {
    itemPositions: {},
    itemGroups: {},
    signatureColors: {},
    allUserVotes: {},
    actionItems: [
      {
        id: 'action_1',
        task: 'Same task',
        assigneeId: 'u1',
        assigneeName: 'Alice',
        createdBy: 'Bob',
        createdAt: new Date(now).toISOString(),
        edited: false,
      },
    ],
  };

  const data = {
    retroId,
    task: 'Same task',
    assigneeId: 'u1',
    assigneeName: 'Alice',
    createdBy: 'Bob',
  };

  gateway.handleActionItemAdded({} as any, data);

  expect(retroState[retroId].actionItems.length).toBe(1); // tidak nambah
  expect(gateway.broadcastActionItemsUpdate).not.toHaveBeenCalled();
});

});

it('should remove participant and emit event', async () => {
    const data = { retroId: 'retro-1', userId: 'user-1' };
    const mockClient = {} as Socket;

    await gateway.handleLeaveRoom(data, mockClient);

    // memastikan leave() terpanggil dengan benar
    expect(mockParticipantService.leave).toHaveBeenCalledWith('retro-1', 'user-1');

    // memastikan event dikirim ke room
    expect(gateway.server.to).toHaveBeenCalledWith('retro-1');
    expect(gateway.server.emit).toHaveBeenCalledWith('participant-left', { userId: 'user-1' });
  });

  it('should catch errors and not throw', async () => {
    const data = { retroId: 'retro-1', userId: 'user-1' };
    const mockClient = {} as Socket;

    // buat leave() error
    (mockParticipantService.leave as jest.Mock).mockRejectedValueOnce(new Error('DB error'));

    await gateway.handleLeaveRoom(data, mockClient);

    // event tidak dipanggil karena error
    expect(gateway.server.emit).not.toHaveBeenCalled();
  });

  describe('ParticipantGateway - handleActionItemUpdated', () => {
    beforeEach(() => {
      jest.spyOn(gateway, 'broadcastActionItemsUpdate').mockImplementation(() => {});
      for (const key of Object.keys(retroState)) delete retroState[key];
      retroState['retro-1'] = {
        itemPositions: {},
        itemGroups: {},
        signatureColors: {},
        actionItems: [
        { id: 'item-1', task: 'Old Task', assigneeId: 'a1', assigneeName: 'Alice', createdBy: 'user-x', createdAt: new Date().toISOString(), edited: false },
      ],
      allUserVotes: {},
    };
    });

    beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {}); // blokir error log biar test lebih bersih
});



    it('should update the action item and broadcast update', () => {
    const mockClient = {} as Socket;
    const data = {
      retroId: 'retro-1',
      actionItemId: 'item-1',
      task: 'New Task',
      assigneeId: 'a2',
      assigneeName: 'Bob',
      updatedBy: 'user-1',
    };

    gateway.handleActionItemUpdated(mockClient, data);

    // Cek item sudah terupdate
    expect(retroState['retro-1'].actionItems[0]).toMatchObject({
      id: 'item-1',
      task: 'New Task',
      assigneeId: 'a2',
      assigneeName: 'Bob',
      edited: true,
    });

    // Cek broadcast dipanggil dengan actionItems terbaru
    expect(gateway.broadcastActionItemsUpdate).toHaveBeenCalledWith(
      'retro-1',
      retroState['retro-1'].actionItems
    );
  });

  it('should not broadcast if actionItem not found', () => {
    const mockClient = {} as Socket;
    const data = {
      retroId: 'retro-1',
      actionItemId: 'item-999',
      task: 'Does not exist',
      assigneeId: 'a2',
      assigneeName: 'Bob',
      updatedBy: 'user-1',
    };

    gateway.handleActionItemUpdated(mockClient, data);

    // Tidak ada perubahan pada actionItems
    expect(retroState['retro-1'].actionItems[0].task).toBe('Old Task'); // ✅ benar
    expect(gateway.broadcastActionItemsUpdate).not.toHaveBeenCalled();
  });

  it('should not broadcast if retroId not found', () => {
    const mockClient = {} as Socket;
    const data = {
      retroId: 'retro-999',
      actionItemId: 'item-1',
      task: 'Another Task',
      assigneeId: 'a3',
      assigneeName: 'Charlie',
      updatedBy: 'user-1',
    };

    gateway.handleActionItemUpdated(mockClient, data);

    expect(gateway.broadcastActionItemsUpdate).not.toHaveBeenCalled();
  });
  });
describe('RetroGateway - handleActionItemDeleted', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // suppress error log
  });

  beforeEach(() => {
    jest.spyOn(gateway, 'broadcastActionItemsUpdate').mockImplementation(() => {});
    jest.spyOn(gateway['participantService'], 'leave').mockResolvedValue(undefined); // mock DB call

    for (const key of Object.keys(retroState)) delete retroState[key];
    retroState['retro-1'] = {
      itemPositions: {},
      itemGroups: {},
      signatureColors: {},
      actionItems: [
        { id: 'item-1', task: 'Old Task', assigneeId: 'a1', assigneeName: 'Alice', createdBy: 'user-x', createdAt: new Date().toISOString(), edited: false },
        { id: 'item-2', task: 'Task 2', assigneeId: 'a2', assigneeName: 'Bob', createdBy: 'user-y', createdAt: new Date().toISOString(), edited: false },
      ],
      allUserVotes: {},
    };
  });

  it('should delete the action item and broadcast updated items', () => {
    const client = {} as Socket;
    const data = { retroId: 'retro-1', actionItemId: 'item-1' };

    gateway.handleActionItemDeleted(client, data);

    expect(retroState['retro-1'].actionItems).toEqual([
      {
        id: 'item-2',
        task: 'Task 2',
        assigneeId: 'a2',
        assigneeName: 'Bob',
        createdBy: 'user-y',
        createdAt: expect.any(String),
        edited: false,
      },
    ]);

    expect(gateway.broadcastActionItemsUpdate).toHaveBeenCalledWith(
      'retro-1',
      retroState['retro-1'].actionItems,
    );
  });

  it('should not crash if retroId does not exist', () => {
    const client = {} as Socket;
    const data = { retroId: 'retro-999', actionItemId: 'item-1' };

    expect(() => gateway.handleActionItemDeleted(client, data)).not.toThrow();
    expect(gateway.broadcastActionItemsUpdate).not.toHaveBeenCalled();
  });
});

});
