import { Test, TestingModule } from '@nestjs/testing';
import { ActionController } from '../../src/controllers/action.controller';
import { ActionService } from '../../src/services/action.service';
import { CreateActionDto } from '../../src/dto/create-action.dto';

describe('ActionController', () => {
  let controller: ActionController;
  let service: ActionService;

  const mockActionService = {
    bulkCreate: jest.fn(),
    findByRetroId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActionController],
      providers: [{ provide: ActionService, useValue: mockActionService }],
    }).compile();

    controller = module.get<ActionController>(ActionController);
    service = module.get<ActionService>(ActionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('bulkCreate', () => {
    it('should call service.bulkCreate and return created actions', async () => {
      const retroId = '123';
      const dtos: CreateActionDto[] = [
        { action_item: 'Fix bug #1', assign_to: 'user1' },
        { action_item: 'Refactor login', assign_to: 'user2' },
      ];
      const mockResult = [
        { id: 'a1', ...dtos[0] },
        { id: 'a2', ...dtos[1] },
      ];

      mockActionService.bulkCreate.mockResolvedValue(mockResult);

      const result = await controller.bulkCreate(retroId, dtos);

      expect(mockActionService.bulkCreate).toHaveBeenCalledWith(retroId, dtos);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getActionsByRetro', () => {
    it('should call service.findByRetroId and return actions', async () => {
      const retroId = '123';
      const mockResult = [
        { id: 'a1', action_item: 'Do X', assign_to: 'user1' },
        { id: 'a2', action_item: 'Do Y', assign_to: 'user2' },
      ];

      mockActionService.findByRetroId.mockResolvedValue(mockResult);

      const result = await controller.getActionsByRetro(retroId);

      expect(mockActionService.findByRetroId).toHaveBeenCalledWith(retroId);
      expect(result).toEqual(mockResult);
    });
  });
});
