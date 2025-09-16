import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantService } from '../../src/services/participant.service';
import { Participant } from '../../src/entities/participant.entity';
import { Retro } from '../../src/entities/retro.entity';
import { ParticipantGateway } from '../../src/gateways/participant.gateways';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('ParticipantService', () => {
  let service: ParticipantService;
  let participantRepo: jest.Mocked<any>;
  let retroRepo: jest.Mocked<any>;
  let gateway: jest.Mocked<any>;
  let dataSource: jest.Mocked<any>;

  beforeEach(async () => {
    participantRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };
    retroRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    gateway = {
      broadcastParticipantAdded: jest.fn(),
      broadcastParticipantUpdate: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantService,
        { provide: getRepositoryToken(Participant), useValue: participantRepo },
        { provide: getRepositoryToken(Retro), useValue: retroRepo },
        { provide: ParticipantGateway, useValue: gateway },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ParticipantService>(ParticipantService);
  });

  describe('findByRetroId', () => {
    it('should return participants', async () => {
      const mockParticipants = [{ id: 1 }, { id: 2 }];
      participantRepo.find.mockResolvedValue(mockParticipants);

      const result = await service.findByRetroId('retro1');

      expect(participantRepo.find).toHaveBeenCalledWith({
        where: { retroId: 'retro1' },
        relations: ['user'],
        order: { joinedAt: 'ASC' },
      });
      expect(result).toEqual(mockParticipants);
    });
  });

  describe('isFacilitator', () => {
    it('should return true if participant is facilitator', async () => {
      participantRepo.findOne.mockResolvedValue({ role: true });
      const result = await service.isFacilitator('retro1', 'u1');
      expect(result).toBe(true);
    });

    it('should return false if participant is not facilitator', async () => {
      participantRepo.findOne.mockResolvedValue({ role: false });
      const result = await service.isFacilitator('retro1', 'u1');
      expect(result).toBe(false);
    });

    it('should throw if participant not found', async () => {
      participantRepo.findOne.mockResolvedValue(null);
      await expect(service.isFacilitator('retro1', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('join', () => {
    it('should return undefined if retro not found', async () => {
      retroRepo.findOne.mockResolvedValue(null);
      const result = await service.join('retro404', 'u1');
      expect(result).toBeUndefined();
    });

    it('should create and save participant', async () => {
      retroRepo.findOne.mockResolvedValue({ id: 'retro1' });
      const mockParticipant = { retroId: 'retro1', userId: 'u1' };
      participantRepo.create.mockReturnValue(mockParticipant);
      participantRepo.save.mockResolvedValue({ id: 1, ...mockParticipant });

      const result = await service.join('retro1', 'u1');
      expect(participantRepo.create).toHaveBeenCalled();
      expect(participantRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, ...mockParticipant });
    });

    it('should return existing participant if duplicate error', async () => {
      retroRepo.findOne.mockResolvedValue({ id: 'retro1' });
      participantRepo.create.mockReturnValue({});
      participantRepo.save.mockRejectedValue({ code: '23505' });
      participantRepo.findOne.mockResolvedValue({ id: 99, retroId: 'retro1', userId: 'u1' });

      const result = await service.join('retro1', 'u1');
      expect(result).toEqual({ id: 99, retroId: 'retro1', userId: 'u1' });
    });
  });

  describe('deactivate', () => {
    it('should set isActive to false if participant exists', async () => {
      const mockParticipant = { id: 1, isActive: true };
      participantRepo.findOne.mockResolvedValue(mockParticipant);
      participantRepo.save.mockResolvedValue({ ...mockParticipant, isActive: false });

      await service.deactivate('retro1', 'u1');
      expect(mockParticipant.isActive).toBe(false);
      expect(participantRepo.save).toHaveBeenCalledWith(mockParticipant);
    });

    it('should do nothing if participant not found', async () => {
      participantRepo.findOne.mockResolvedValue(null);
      await service.deactivate('retro1', 'u404');
      expect(participantRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('activated', () => {
    it('should activate participant and broadcast', async () => {
      const mockParticipant = { id: 1, isActive: false };
      participantRepo.findOne.mockResolvedValue(mockParticipant);
      participantRepo.save.mockResolvedValue({ ...mockParticipant, isActive: true });

      await service.activated('retro1', 'u1');
      expect(mockParticipant.isActive).toBe(true);
      expect(participantRepo.save).toHaveBeenCalledWith(mockParticipant);
      expect(gateway.broadcastParticipantUpdate).toHaveBeenCalledWith('retro1');
    });

    it('should throw if participant not found', async () => {
      participantRepo.findOne.mockResolvedValue(null);
      await expect(service.activated('retro1', 'u404')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRoleFacilitator', () => {
    it('should update facilitator and broadcast', async () => {
      const retro = { id: 'retro1' };
      const oldFacilitator = { id: 1, retroId: 'retro1', role: true };
      const participant = { id: 2, retroId: 'retro1', role: false };

      dataSource.transaction.mockImplementation(async (cb: any) => {
        return cb({
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === Retro) return { findOne: jest.fn().mockResolvedValue(retro) };
            if (entity === Participant) {
              return {
                findOne: jest
                  .fn()
                  .mockImplementation(({ where }) => {
                    if (where.id === 2) return Promise.resolve(participant);
                    if (where.role === true) return Promise.resolve(oldFacilitator);
                    return Promise.resolve(null);
                  }),
                save: jest.fn().mockImplementation((p) => Promise.resolve(p)),
              };
            }
          }),
        });
      });

      const result = await service.updateRoleFacilitator('retro1', 2);
      expect(result.role).toBe(true);
      expect(gateway.broadcastParticipantUpdate).toHaveBeenCalledWith('retro1');
    });

    it('should throw if retro not found', async () => {
      dataSource.transaction.mockImplementation(async (cb: any) => {
        return cb({
          getRepository: jest.fn().mockImplementation((entity) => {
            if (entity === Retro) return { findOne: jest.fn().mockResolvedValue(null) };
            return {};
          }),
        });
      });

      await expect(service.updateRoleFacilitator('retro404', 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findParticipantByUserIdAndRetroId', () => {
    it('should return participant if found', async () => {
      const mockP = { id: 1, retroId: 'retro1', userId: 'u1' };
      participantRepo.findOne.mockResolvedValue(mockP);

      const result = await service.findParticipantByUserIdAndRetroId('u1', 'retro1');
      expect(result).toEqual(mockP);
    });

    it('should return null if not found', async () => {
      participantRepo.findOne.mockResolvedValue(null);
      const result = await service.findParticipantByUserIdAndRetroId('uX', 'retroX');
      expect(result).toBeNull();
    });
  });
});
