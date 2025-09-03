import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../src/controllers/dashboard.controller';
import { RetroService } from '../src/services/retro.service';
import { ParticipantService } from '../src/services/participant.service';
import { RetroItemsService } from '../src/services/item.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let retroService: RetroService;

  const mockRetroService = {
    findWithPagination: jest.fn(),
    count: jest.fn(),
    countByStatus: jest.fn(),
  };

  const mockParticipantService = {};
  const mockItemService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: RetroService, useValue: mockRetroService },
        { provide: ParticipantService, useValue: mockParticipantService },
        { provide: RetroItemsService, useValue: mockItemService },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    retroService = module.get<RetroService>(RetroService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRetros', () => {
    it('should return paginated retros', async () => {
      const userId = 'user1';
      const page = 2;
      const limit = 3;
      const offset = (page - 1) * limit;

      const mockRetros = [
        { id: 1, title: 'Retro 1' },
        { id: 2, title: 'Retro 2' },
      ];
      const mockTotal = 5;

      mockRetroService.findWithPagination.mockResolvedValue([mockRetros, mockTotal]);

      const result = await controller.getRetros(userId, page);

      expect(mockRetroService.findWithPagination).toHaveBeenCalledWith(userId, limit, offset);
      expect(result).toEqual({
        retros: mockRetros,
        pagination: {
          page,
          limit,
          total: mockTotal,
          totalPages: Math.ceil(mockTotal / limit),
          hasNext: page < Math.ceil(mockTotal / limit),
          hasPrev: page > 1,
        },
      });
    });

    it('should default to page 1 if not provided', async () => {
      const userId = 'user1';
      const mockRetros = [{ id: 1, title: 'Retro 1' }];
      const mockTotal = 1;

      mockRetroService.findWithPagination.mockResolvedValue([mockRetros, mockTotal]);

      const result = await controller.getRetros(userId);

      expect(mockRetroService.findWithPagination).toHaveBeenCalledWith(userId, 3, 0);
      expect(result.retros).toEqual(mockRetros);
    });
  });

  describe('getStats', () => {
    it('should return user statistics', async () => {
      const userId = 'user1';

      mockRetroService.count.mockResolvedValue(10);
      mockRetroService.countByStatus.mockImplementation((status: string) => {
        if (status === 'ongoing') return Promise.resolve(4);
        if (status === 'completed') return Promise.resolve(6);
      });

      const result = await controller.getStats(userId);

      expect(mockRetroService.count).toHaveBeenCalledWith(userId);
      expect(mockRetroService.countByStatus).toHaveBeenCalledWith('ongoing', userId);
      expect(mockRetroService.countByStatus).toHaveBeenCalledWith('completed', userId);

      expect(result).toEqual({
        totalRetros: 10,
        activeRetros: 4,
        completedRetros: 6,
      });
    });
  });
});
