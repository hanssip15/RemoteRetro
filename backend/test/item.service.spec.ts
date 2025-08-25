import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { RetroItemsService } from '../src/services/item.service';
import { RetroItem, RetroFormatTypes } from '../src/entities/retro-item.entity';
import { Retro } from '../src/entities/retro.entity';
import { Participant } from '../src/entities/participant.entity';
import { GroupItem } from '../src/entities/group-item.entity';
import { ParticipantGateway } from '../src/gateways/participant.gateways';

describe('RetroItemsService', () => {
  let service: RetroItemsService;
  let retroRepo: jest.Mocked<Repository<Retro>>;
  let retroItemRepo: jest.Mocked<Repository<RetroItem>>;
  let participantRepo: jest.Mocked<Repository<Participant>>;
  let groupItemRepo: jest.Mocked<Repository<GroupItem>>;
  let gateway: jest.Mocked<ParticipantGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetroItemsService,
        { provide: getRepositoryToken(RetroItem), useValue: createMockRepo() },
        { provide: getRepositoryToken(Retro), useValue: createMockRepo() },
        { provide: getRepositoryToken(Participant), useValue: createMockRepo() },
        { provide: getRepositoryToken(GroupItem), useValue: createMockRepo() },
        {
          provide: ParticipantGateway,
          useValue: {
            broadcastItemAdded: jest.fn(),
            broadcastItemUpdated: jest.fn(),
            broadcastItemDeleted: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(RetroItemsService);
    retroRepo = module.get(getRepositoryToken(Retro));
    retroItemRepo = module.get(getRepositoryToken(RetroItem));
    participantRepo = module.get(getRepositoryToken(Participant));
    groupItemRepo = module.get(getRepositoryToken(GroupItem));
    gateway = module.get(ParticipantGateway);
  });

  function createMockRepo() {
    return {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    };
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if retro not found', async () => {
      retroRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('r1', { content: 'test', format_type: 'type1', created_by: 'u1' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create and return transformed item', async () => {
      retroRepo.findOne.mockResolvedValue({ id: 'r1' } as any);
      retroItemRepo.create.mockReturnValue({ id: 'i1', retro_id: 'r1', content: 'test' } as any);
      retroItemRepo.save.mockResolvedValue({
        id: 'i1',
        retro_id: 'r1',
        format_type: 'type1',
        content: 'test',
        creator: { name: 'User' },
        created_by: 'u1',
        is_edited: false,
      } as any);

      const result = await service.create('r1', {
        content: 'test',
        format_type: 'type1',
        created_by: 'u1',
      } as any);

      expect(result).toEqual({
        id: 'i1',
        retroId: 'r1',
        category: 'type1',
        content: 'test',
        author: 'User',
        createdBy: 'u1',
        isEdited: false,
      });
      expect(gateway.broadcastItemAdded).toHaveBeenCalled();
    });
  });

  describe('insert', () => {
    it('should save a group item', async () => {
      groupItemRepo.create.mockReturnValue({ id: 1, item_id: 'i1', group_id: 2 } as any);
      groupItemRepo.save.mockResolvedValue({ id: 1, item_id: 'i1', group_id: 2 } as any);

      const result = await service.insert('i1', 2);

      expect(result).toEqual({ id: 1, item_id: 'i1', group_id: 2 });
    });
  });

  describe('findByRetroId', () => {
    it('should throw NotFoundException if retro not found', async () => {
      retroRepo.findOne.mockResolvedValue(null);

      await expect(service.findByRetroId('r1')).rejects.toThrow(NotFoundException);
    });

    it('should return transformed items', async () => {
      retroRepo.findOne.mockResolvedValue({ id: 'r1' } as any);
      retroItemRepo.find.mockResolvedValue([
        {
          id: 'i1',
          retro_id: 'r1',
          format_type: 'type1',
          content: 'test',
          creator: { email: 'u@mail.com' },
          created_by: 'u1',
          is_edited: false,
        },
      ] as any);

      const result = await service.findByRetroId('r1');

      expect(result).toEqual([
        {
          id: 'i1',
          retroId: 'r1',
          category: 'type1',
          content: 'test',
          author: 'u@mail.com',
          createdBy: 'u1',
          isEdited: false,
        },
      ]);
    });
  });

  describe('update', () => {
    it('should throw if item not found', async () => {
      retroItemRepo.findOne.mockResolvedValue(null);

      await expect(service.update('i1', { content: 'x' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should update and return transformed item', async () => {
      retroItemRepo.findOne
        .mockResolvedValueOnce({ id: 'i1', retro_id: 'r1', creator: { name: 'User' } } as any) // first findOne
        .mockResolvedValueOnce({
          id: 'i1',
          retro_id: 'r1',
          content: 'updated',
          format_type: 'type1',
          creator: { name: 'User' },
          created_by: 'u1',
          is_edited: true,
        } as any); // second findOne

      retroItemRepo.update.mockResolvedValue({} as any);

      const result = await service.update('i1', { content: 'updated', format_type: 'type1' } as any);

      expect(result).toEqual({
        id: 'i1',
        category: 'type1',
        content: 'updated',
        author: 'User',
        createdBy: 'u1',
        isEdited: true,
      });
      expect(gateway.broadcastItemUpdated).toHaveBeenCalledWith('r1', expect.any(Object));
    });
  });

  describe('remove', () => {
    it('should throw if item not found', async () => {
      retroItemRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('i1')).rejects.toThrow(NotFoundException);
    });

    it('should remove item and broadcast', async () => {
      retroItemRepo.findOne.mockResolvedValue({ id: 'i1', retro_id: 'r1' } as any);
      retroItemRepo.remove.mockResolvedValue(undefined as any);

      await service.remove('i1');

      expect(gateway.broadcastItemDeleted).toHaveBeenCalledWith('r1', 'i1');
    });
  });

  describe('getActionItemsStats', () => {
    it('should return total count', async () => {
      retroItemRepo.count.mockResolvedValue(5);

      const result = await service.getActionItemsStats();

      expect(result).toEqual({ total: 5 });
    });
  });
});
