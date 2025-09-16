import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantController } from '../../src/controllers/participant.controller';
import { ParticipantService } from '../../src/services/participant.service';
import { ConflictException } from '@nestjs/common';

describe('ParticipantController', () => {
  let controller: ParticipantController;
  let service: ParticipantService;

  const mockParticipantService = {
    findByRetroId: jest.fn(),
    join: jest.fn(),
    updateRoleFacilitator: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipantController],
      providers: [
        {
          provide: ParticipantService,
          useValue: mockParticipantService,
        },
      ],
    }).compile();

    controller = module.get<ParticipantController>(ParticipantController);
    service = module.get<ParticipantService>(ParticipantService);

    jest.clearAllMocks(); // reset mocks setiap test
  });

  describe('findByRetroId', () => {
    it('should return participants for a given retro_id', async () => {
      const retroId = 'retro123';
      const mockParticipants = [{ id: '1', name: 'User1' }];
      mockParticipantService.findByRetroId.mockResolvedValue(mockParticipants);

      const result = await controller.findByRetroId(retroId);

      expect(service.findByRetroId).toHaveBeenCalledWith(retroId);
      expect(result).toEqual(mockParticipants);
    });
  });


  describe('updateFacilitator', () => {
    it('should update role to facilitator', async () => {
      const retroId = 'retro123';
      const participantId = 1;
      const updatedParticipant = { id: participantId, retroId, role: 'facilitator' };

      mockParticipantService.updateRoleFacilitator.mockResolvedValue(updatedParticipant);

      const result = await controller.updateFacilitator(retroId, participantId);

      expect(service.updateRoleFacilitator).toHaveBeenCalledWith(retroId, participantId);
      expect(result).toEqual(updatedParticipant);
    });
  });
});
