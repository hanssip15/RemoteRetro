// test/services/participant.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantService } from '../src/services/participant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Participant } from '../src/entities/participant.entity';
import { Retro } from '../src/entities/retro.entity';
import { Repository } from 'typeorm';
import { ParticipantGateway } from '../src/gateways/participant.gateways';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ParticipantService', () => {
  let service: ParticipantService;
  let participantRepo: jest.Mocked<Repository<Participant>>;
  let retroRepo: jest.Mocked<Repository<Retro>>;
  let gateway: jest.Mocked<ParticipantGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantService,
        {
          provide: getRepositoryToken(Participant),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoin: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              getRawOne: jest.fn().mockResolvedValue({ count: '5' })
            })),
          },
        },
        {
          provide: getRepositoryToken(Retro),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: ParticipantGateway,
          useValue: {
            broadcastParticipantUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ParticipantService>(ParticipantService);
    participantRepo = module.get(getRepositoryToken(Participant));
    retroRepo = module.get(getRepositoryToken(Retro));
    gateway = module.get(ParticipantGateway);
  });

  it('should return participants by retroId', async () => {
    const expected = [{ id: '1', userId: 'u1', retroId: 'r1' }];
    participantRepo.find.mockResolvedValue(expected as any);

    const result = await service.findByRetroId('r1');
    expect(result).toEqual(expected);
    expect(participantRepo.find).toHaveBeenCalledWith({
      where: { retroId: 'r1' },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  });

  it('should throw if retro not found when joining', async () => {
    retroRepo.findOne.mockResolvedValue(null);

    await expect(
      service.join('r1', { userId: 'u1', role: false, isActive: true })
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw if retro is completed when joining', async () => {
    retroRepo.findOne.mockResolvedValue({ status: 'completed' } as any);

    await expect(
      service.join('r1', { userId: 'u1', role: false, isActive: true })
    ).rejects.toThrow(BadRequestException);
  });

  it('should return existing participant if already joined', async () => {
    retroRepo.findOne.mockResolvedValue({ status: 'ongoing' } as any);
    participantRepo.findOne.mockResolvedValue({ id: 'p1' } as any);

    const result = await service.join('r1', { userId: 'u1', role: false, isActive: true });
    expect(result).toEqual({ id: 'p1' });
  });

  it('should save and return new participant if not exists', async () => {
    retroRepo.findOne.mockResolvedValue({ status: 'ongoing' } as any);
    participantRepo.findOne.mockResolvedValueOnce(null);
    participantRepo.create.mockReturnValue({ id: 'new' } as any);
    participantRepo.save.mockResolvedValue({ id: 'new' } as any);

    const result = await service.join('r1', { userId: 'u1', role: false, isActive: true });
    expect(result).toEqual({ id: 'new' });
    expect(gateway.broadcastParticipantUpdate).toHaveBeenCalledWith('r1');
  });

  it('should update participant to inactive on leave', async () => {
    retroRepo.findOne.mockResolvedValue({ id: 'r1' } as any);
    participantRepo.findOne.mockResolvedValue({ isActive: true } as any);
    participantRepo.save.mockResolvedValue({ isActive: false } as any);

    await service.leave('r1', 'u1');
    expect(gateway.broadcastParticipantUpdate).toHaveBeenCalled();
  });

  it('should throw if participant not found on activated', async () => {
    participantRepo.findOne.mockResolvedValue(null);
    await expect(service.activated('r1', 'u1')).rejects.toThrow(NotFoundException);
  });

  it('should activate participant and broadcast', async () => {
    const participant = { isActive: false };
    participantRepo.findOne.mockResolvedValue(participant as any);
    await service.activated('r1', 'u1');
    expect(participant.isActive).toBe(true);
    expect(participantRepo.save).toHaveBeenCalledWith(participant);
    expect(gateway.broadcastParticipantUpdate).toHaveBeenCalledWith('r1');
  });

  it('should return unique member count', async () => {
    const result = await service.countUniqueMembers();
    expect(result).toBe(5);
  });
});
