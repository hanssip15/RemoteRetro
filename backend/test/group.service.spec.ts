// src/group/group.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from '../src/services/group.service';
import { GroupEntity } from '../src/entities/group.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('GroupService', () => {
  let service: GroupService;
  let repo: jest.Mocked<Repository<GroupEntity>>;

  const mockGroup = new GroupEntity({
    id: 1,
    label: 'unlabeled',
    votes: 0,
    retro_id: 'retro123',
    group_items: [],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: getRepositoryToken(GroupEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    repo = module.get(getRepositoryToken(GroupEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save a new group', async () => {
      repo.create.mockReturnValue(mockGroup);
      repo.save.mockResolvedValue(mockGroup);

      const result = await service.create('retro123');

      expect(repo.create).toHaveBeenCalledWith({
        label: 'unlabeled',
        votes: 0,
        retro_id: 'retro123',
      });
      expect(repo.save).toHaveBeenCalledWith(mockGroup);
      expect(result).toEqual(mockGroup);
    });
  });

  describe('updateLabel', () => {
    it('should update label and return updated group', async () => {
      const updatedGroup = new GroupEntity({ ...mockGroup, label: 'new label' });
      repo.update.mockResolvedValue({} as any);
      repo.findOne.mockResolvedValue(updatedGroup);

      const result = await service.updateLabel(1, 'new label');

      expect(repo.update).toHaveBeenCalledWith(1, { label: 'new label' });
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['group_items', 'group_items.item'],
      });
      expect(result).toEqual(updatedGroup);
    });

    it('should return null if group not found after update', async () => {
      repo.update.mockResolvedValue({} as any);
      repo.findOne.mockResolvedValue(null);

      const result = await service.updateLabel(99, 'label');

      expect(result).toBeNull();
    });
  });

  describe('updateVotes', () => {
    it('should update votes and return updated group', async () => {
      const updatedGroup = new GroupEntity({ ...mockGroup, votes: 5 });
      repo.update.mockResolvedValue({} as any);
      repo.findOne.mockResolvedValue(updatedGroup);

      const result = await service.updateVotes(1, 5);

      expect(repo.update).toHaveBeenCalledWith(1, { votes: 5 });
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['group_items', 'group_items.item'],
      });
      expect(result).toEqual(updatedGroup);
    });
  });

  describe('findByRetroId', () => {
    it('should find all groups by retro_id', async () => {
      const groups = [mockGroup];
      repo.find.mockResolvedValue(groups);

      const result = await service.findByRetroId('retro123');

      expect(repo.find).toHaveBeenCalledWith({
        where: { retro_id: 'retro123' },
        relations: ['group_items', 'group_items.item'],
      });
      expect(result).toEqual(groups);
    });
  });
});