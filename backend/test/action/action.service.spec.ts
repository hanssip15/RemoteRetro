import { Test, TestingModule } from '@nestjs/testing';
import { ActionService } from '../../src/services/action.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Action } from '../../src/entities/action.entity';
import { Retro } from '../../src/entities/retro.entity';
import { Repository } from 'typeorm';
import { CreateActionDto } from '../../src/dto/create-action.dto';

// Mock factory untuk repository
const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('ActionService', () => {
  let service: ActionService;
  let actionRepository: jest.Mocked<Repository<Action>>;
  let retroRepository: jest.Mocked<Repository<Retro>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionService,
        { provide: getRepositoryToken(Action), useFactory: mockRepository },
        { provide: getRepositoryToken(Retro), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<ActionService>(ActionService);
    actionRepository = module.get(getRepositoryToken(Action));
    retroRepository = module.get(getRepositoryToken(Retro));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and save an action', async () => {
      const dto: CreateActionDto = { action_item: 'Do testing', assign_to: 'user1' };
      const actionEntity = { id: '1', ...dto };

      actionRepository.create.mockReturnValue(actionEntity as any);
      actionRepository.save.mockResolvedValue(actionEntity as any);

      const result = await service.create(dto);

      expect(actionRepository.create).toHaveBeenCalledWith({
        action_item: dto.action_item,
        assign_to: dto.assign_to,
      });
      expect(actionRepository.save).toHaveBeenCalledWith(actionEntity);
      expect(result).toEqual(actionEntity);
    });
  });

  describe('bulkCreate', () => {
    it('should create and save multiple actions', async () => {
      const retro_id = 'retro123';
      const dtos: CreateActionDto[] = [
        { action_item: 'Action 1', assign_to: 'user1' },
        { action_item: 'Action 2', assign_to: 'user2' },
      ];
      const actions = dtos.map((dto, idx) => ({ id: idx + 1, ...dto, retro_id }));

      actionRepository.create.mockImplementation((data) => data as any);
      actionRepository.save.mockResolvedValue(actions as any);

      const result = await service.bulkCreate(retro_id, dtos);

      expect(actionRepository.create).toHaveBeenCalledTimes(2);
      expect(actionRepository.save).toHaveBeenCalledWith([
        { action_item: 'Action 1', assign_to: 'user1', retro_id },
        { action_item: 'Action 2', assign_to: 'user2', retro_id },
      ]);
      expect(result).toEqual(actions);
    });

    it('should return empty array if no dtos provided', async () => {
      const result = await service.bulkCreate('retro123', []);
      expect(result).toEqual([]);
      expect(actionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all actions', async () => {
      const actions = [
        { id: 1, action_item: 'Test 1', assign_to: 'user1' },
        { id: 2, action_item: 'Test 2', assign_to: 'user2' },
      ];
      actionRepository.find.mockResolvedValue(actions as any);

      const result = await service.findAll();

      expect(actionRepository.find).toHaveBeenCalled();
      expect(result).toEqual(actions);
    });
  });

  describe('findByRetroId', () => {
    it('should return actions filtered by retro_id', async () => {
      const retro_id = 'retro123';
      const actions = [
        { id: 1, action_item: 'Test retro', assign_to: 'user1', retro_id },
      ];
      actionRepository.find.mockResolvedValue(actions as any);

      const result = await service.findByRetroId(retro_id);

      expect(actionRepository.find).toHaveBeenCalledWith({
        where: { retro_id },
      });
      expect(result).toEqual(actions);
    });
  });
});
