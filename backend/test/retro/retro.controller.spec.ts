import { Test, TestingModule } from '@nestjs/testing';
import { RetroController } from '../../src/controllers/retro.controller';
import { RetroService } from '../../src/services/retro.service';
import { CreateRetroDto, UpdateStatusDto, UpdatePhaseDto } from '../../src/dto/retro.dto';

describe('RetroController', () => {
  let controller: RetroController;
  let service: RetroService;

  const mockRetroService = {
    findOne: jest.fn(),
    create: jest.fn(),
    updateRetroStatus: jest.fn(),
    updateRetroPhase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetroController],
      providers: [
        { provide: RetroService, useValue: mockRetroService },
      ],
    }).compile();

    controller = module.get<RetroController>(RetroController);
    service = module.get<RetroService>(RetroService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return retro and participants', async () => {
      const retroId = '123';
      const result = { retro: { id: retroId, title: 'Test' }, participants: ['u1'] };
      mockRetroService.findOne.mockResolvedValue(result);

      const response = await controller.findOne(retroId);

      expect(response).toEqual(result);
      expect(service.findOne).toHaveBeenCalledWith(retroId);
    });
  });

  describe('create', () => {
    it('should create a new retro', async () => {
      const dto: CreateRetroDto = {
        title: 'Sprint Retro',
        format: 'happy_sad_confused',
        createdBy: 'user123',
        facilitator: 'facilitator123',
      };
      const created = { id: '1', ...dto };
      mockRetroService.create.mockResolvedValue(created);

      const response = await controller.create(dto);

      expect(response).toEqual(created);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateRetroStatus', () => {
    it('should update retro status', async () => {
      const dto: UpdateStatusDto = { status: 'ongoing' };
      const updated = { id: '1', status: 'ongoing' };
      mockRetroService.updateRetroStatus.mockResolvedValue(updated);

      const response = await controller.updateRetroStatus('1', dto);

      expect(response).toEqual(updated);
      expect(service.updateRetroStatus).toHaveBeenCalledWith('1', dto.status);
    });
  });

  describe('updateRetroPhase', () => {
    it('should update retro phase', async () => {
      const dto: UpdatePhaseDto = { phase: 'grouping' };
      const updated = { id: '1', phase: 'grouping' };
      mockRetroService.updateRetroPhase.mockResolvedValue(updated);

      const response = await controller.updateRetroPhase('1', dto);

      expect(response).toEqual(updated);
      expect(service.updateRetroPhase).toHaveBeenCalledWith('1', dto.phase);
    });
  });
});
