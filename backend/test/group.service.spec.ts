// test/services/group.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from '../src/services/group.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupEntity } from '../src/entities/group.entity';
import { Repository } from 'typeorm';
import { CreateGroupDto } from '../src/dto/create-group.dto';

describe('GroupService', () => {
  let service: GroupService;
  let repo: Repository<GroupEntity>;

  const mockGroupRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        {
          provide: getRepositoryToken(GroupEntity),
          useValue: mockGroupRepository,
        },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
    repo = module.get<Repository<GroupEntity>>(getRepositoryToken(GroupEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a group', async () => {
    const dto: CreateGroupDto = { label: 'Test Group', retro_id: 'retro123' } as any;
    const createdGroup = { id: 1, ...dto };
    mockGroupRepository.create.mockReturnValue(createdGroup);
    mockGroupRepository.save.mockResolvedValue(createdGroup);

    const result = await service.create(dto);
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(createdGroup);
    expect(result).toEqual(createdGroup);
  });

  it('should update label of a group and return updated group with relations', async () => {
    const updatedGroup = { id: 1, label: 'Updated', group_items: [{ id: 1, item: {} }] };
    mockGroupRepository.update.mockResolvedValue(undefined);
    mockGroupRepository.findOne.mockResolvedValue(updatedGroup);

    const result = await service.updateLabel(1, 'Updated');
    expect(repo.update).toHaveBeenCalledWith(1, { label: 'Updated' });
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['group_items', 'group_items.item'],
    });
    expect(result).toEqual(updatedGroup);
  });

  it('should update votes of a group and return updated group with relations', async () => {
    const updatedGroup = { id: 1, votes: 5, group_items: [{ id: 1, item: {} }] };
    mockGroupRepository.update.mockResolvedValue(undefined);
    mockGroupRepository.findOne.mockResolvedValue(updatedGroup);

    const result = await service.updateVotes(1, 5);
    expect(repo.update).toHaveBeenCalledWith(1, { votes: 5 });
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['group_items', 'group_items.item'],
    });
    expect(result).toEqual(updatedGroup);
  });

  it('should find groups by retroId', async () => {
    const retroId = 'retro123';
    const groups = [
      { id: 1, retro_id: retroId, group_items: [{ item: {} }] },
      { id: 2, retro_id: retroId, group_items: [{ item: {} }] },
    ];
    mockGroupRepository.find.mockResolvedValue(groups);

    const result = await service.findByRetroId(retroId);
    expect(repo.find).toHaveBeenCalledWith({
      where: { retro_id: retroId },
      relations: ['group_items', 'group_items.item'],
    });
    expect(result).toEqual(groups);
  });
});
