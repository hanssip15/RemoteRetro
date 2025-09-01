import { Test, TestingModule } from '@nestjs/testing';
import { RetroItemsController } from '../../src/controllers/item.controller';
import { RetroItemsService } from '../../src/services/item.service';
import { CreateRetroItemDto, UpdateItemDto,  } from '../../src/dto/item.dto';
import { RetroFormatTypes } from '../../src/entities/retro-item.entity';
describe('RetroItemsController', () => {
  let controller: RetroItemsController;
  let service: RetroItemsService;

  const mockService = {
    create: jest.fn(),
    insert: jest.fn(),
    findByRetroId: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetroItemsController],
      providers: [
        { provide: RetroItemsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<RetroItemsController>(RetroItemsController);
    service = module.get<RetroItemsService>(RetroItemsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new retro item', async () => {
      const dto = {
        content: 'Item content',
        created_by: 'user-uuid',
        format_type: 'format_1',
      };
      mockService.create.mockResolvedValue({ id: '1', ...dto });

      const response = await controller.create('retro-1', {
        content: dto.content,
        created_by: dto.created_by,
        category: 'format_1',
      });

      expect(response).toEqual({ id: '1', ...dto });
      expect(service.create).toHaveBeenCalledWith('retro-1', dto);
    });
  });

  describe('insert', () => {
    it('should insert item into group', async () => {
      mockService.insert.mockResolvedValue({ success: true });
      const response = await controller.insert(5, 'item-1');

      expect(response).toEqual({ success: true });
      expect(service.insert).toHaveBeenCalledWith('item-1', 5);
    });
  });

  describe('findAll', () => {
    it('should return all items from a retro', async () => {
      const items = [{ id: '1', content: 'Item 1' }];
      mockService.findByRetroId.mockResolvedValue(items);

      const response = await controller.findAll('retro-1');

      expect(response).toEqual(items);
      expect(service.findByRetroId).toHaveBeenCalledWith('retro-1');
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const dto: UpdateItemDto = { content: 'Updated', format_type: RetroFormatTypes.format_2 };
      mockService.update.mockResolvedValue({ id: 'item-1', ...dto });

      const response = await controller.update('item-1', dto, {} as any);

      expect(response).toEqual({ id: 'item-1', ...dto });
      expect(service.update).toHaveBeenCalledWith('item-1', dto);
    });
  });

  describe('remove', () => {
    it('should remove an item and return success', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const response = await controller.remove('item-1');

      expect(response).toEqual({
        success: true,
        message: 'Item deleted successfully',
        itemId: 'item-1',
      });
      expect(service.remove).toHaveBeenCalledWith('item-1');
    });
  });
});
