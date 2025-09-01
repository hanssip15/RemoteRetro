// test/services/participant.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantService } from '../../src/services/participant.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Participant } from '../../src/entities/participant.entity';
import { Retro } from '../../src/entities/retro.entity';
import { Repository } from 'typeorm';
import { ParticipantGateway } from '../../src/gateways/participant.gateways';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { title } from 'process';
import passport from 'passport';

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
            broadcastParticipantAdded: jest.fn(),
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

it('should set joinedAt when participant is saved', async () => {
  const participant = { id: '1', userId: 'u1', retroId: 'r1' } as any;

  const now = new Date();
  participantRepo.save.mockResolvedValueOnce({
    ...participant,
    joinedAt: now,
  });

  const saved = await participantRepo.save(participant);

  expect(saved.joinedAt).toBeDefined();
  expect(saved.joinedAt).toBeInstanceOf(Date);
});

  it('should return true if user is facilitator', async () => {
    const retroId = 'retro-1';
    const userId = 'user-123';

    participantRepo.findOne.mockResolvedValue({ retroId: retroId, userId: userId, role: true } as Partial<Participant> as any);
    retroRepo.findOne.mockResolvedValue({ id: retroId, facilitator: userId } as Partial<Retro> as any);
    const result = await service.isFacilitator(retroId, userId);
    expect(result).toBe(true);
    expect(retroRepo.findOne).toHaveBeenCalledWith({ where: { id: retroId } });
  });

  it('should return false if user is not facilitator', async () => {
    const retroId = 'retro-2';
    const userId = 'user-123';

    participantRepo.findOne.mockResolvedValue({ retroId: retroId, userId: userId, role: false } as Partial<Participant> as any);
    retroRepo.findOne.mockResolvedValue({ id: retroId, facilitator: "user-234" } as Partial<Retro> as any);
    const result = await service.isFacilitator(retroId, userId);

    expect(result).toBe(false);
  });



  it('should throw if retro not found when joining', async () => {
    retroRepo.findOne.mockResolvedValue(null);

    await expect(
      service.join('r1', 'u1', { role: false, isActive: true })
    ).rejects.toThrow(NotFoundException);
  });

  it('should return existing participant if already joined', async () => {
    retroRepo.findOne.mockResolvedValue({ status: 'ongoing' } as any);
    participantRepo.findOne.mockResolvedValue({ id: 'p1' } as any);

    const result = await service.join('r1', 'u1', { role: false, isActive: true });
    expect(result).toEqual({ id: 'p1' });
  });

it('should save and return new participant if not exists', async () => {
  retroRepo.findOne.mockResolvedValue({ status: 'ongoing' } as any);
  participantRepo.findOne.mockResolvedValueOnce(null);
  participantRepo.create.mockReturnValue({ id: 'new' } as any);
  participantRepo.save.mockResolvedValue({ id: 'new' } as any);
  participantRepo.findOne.mockResolvedValueOnce({ id: 'new', user: {} } as any); // untuk relasi user

  const result = await service.join('r1', 'u1', { role: false, isActive: true });
  expect(result).toEqual({ id: 'new' });

  expect(gateway.broadcastParticipantAdded).toHaveBeenCalledWith('r1', { id: 'new', user: {} });
});

  it('should update participant to inactive on leave', async () => {
    retroRepo.findOne.mockResolvedValue({ id: 'r1' } as any);
    participantRepo.findOne.mockResolvedValue({ isActive: true } as any);
    participantRepo.save.mockResolvedValue({ isActive: false } as any);

    await service.leave('r1', 'u1');
    expect(gateway.broadcastParticipantUpdate).toHaveBeenCalled();
  });

  it('should throw if retro not found when activating participant', async () => {
    participantRepo.findOne.mockResolvedValue(null);
    await expect(service.leave('r1', 'u1')).rejects.toThrow(NotFoundException);
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

  it('should throw NotFoundException if retro not found', async () => {
    retroRepo.findOne.mockResolvedValue(null);

    await expect(service.updateRoleFacilitator('retro-1', '1')).rejects.toThrow(
      new NotFoundException('Retro not found'),
    );
  });

  it('should throw NotFoundException if participant not found', async () => {
    retroRepo.findOne.mockResolvedValue({ id: 'retro-1'} as any);
    participantRepo.findOne.mockResolvedValue(null);

    await expect(service.updateRoleFacilitator('retro-1', '1')).rejects.toThrow(
      new NotFoundException('Participant not found in this retro'),
    );
  });

  it('should throw NotFoundException if participant retroId does not match', async () => {
    retroRepo.findOne.mockResolvedValue({ id: 'retro-1'} as any);
    participantRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.updateRoleFacilitator('retro-1', '1')).rejects.toThrow(
      new NotFoundException('Participant not found in this retro'),
    );
  });

  it('should update facilitator role correctly when old facilitator exists', async () => {
    const retro = { id: 'retro-1', title: 'Retro 1', facilitator: 'old-user' as Partial<Retro> };
    const oldFacilitator = { id: 2, userId: 'old-user', retroId: 'retro-1', role: true };
    const newFacilitator = { id: 3, userId: 'new-user', retroId: 'retro-1', role: false };

    retroRepo.findOne.mockResolvedValueOnce(retro as Retro); // retro check
    participantRepo.findOne
      .mockResolvedValueOnce(newFacilitator as Participant) // new facilitator by id
      .mockResolvedValueOnce(oldFacilitator as Participant); // old facilitator

    participantRepo.save.mockResolvedValueOnce({ ...oldFacilitator, role: false } as Participant);
    retroRepo.save.mockResolvedValueOnce({ ...retro, facilitator: 'new-user' } as Retro);
    participantRepo.save.mockResolvedValueOnce({ ...newFacilitator, role: true } as Participant);

    const result = await service.updateRoleFacilitator('retro-1', 'new-user');
    expect(retro.facilitator).toBe('new-user');
    expect(result.role).toBe(true);
    expect(gateway.broadcastParticipantUpdate).toHaveBeenCalledWith('retro-1');
  });

  it('should update facilitator role when no old facilitator exists', async () => {
    const retro: Partial<Retro> = { id: 'retro-2', facilitator: undefined };
    const newFacilitator = { id: 4, userId: 'fresh-user', retroId: 'retro-2', role: false } as Partial<Participant>;

    retroRepo.findOne.mockResolvedValueOnce(retro as Retro); // retro check
    participantRepo.findOne
      .mockResolvedValueOnce(newFacilitator as Participant) // new facilitator by id
      .mockResolvedValueOnce(null); // old facilitator not found

    retroRepo.save.mockResolvedValueOnce({ ...retro, facilitator: 'fresh-user' } as Retro);
    participantRepo.save.mockResolvedValueOnce({ ...newFacilitator, role: true } as Participant);

    const result = await service.updateRoleFacilitator('retro-2', '4');

    expect(retro.facilitator).toBe('fresh-user');
    expect(result.role).toBe(true);
    expect(gateway.broadcastParticipantUpdate).toHaveBeenCalledWith('retro-2');
  });
  
    it('should return participant when found', async () => {
    const userId = 'user-1';
    const retroId = 'retro-1';
    const participant: Partial<Participant> = { id: 1, userId, retroId };

    participantRepo.findOne.mockResolvedValueOnce(participant as Participant);

    const result = await service.findParticipantByUserIdAndRetroId(userId, retroId);

    expect(participantRepo.findOne).toHaveBeenCalledWith({
      where: { userId, retroId },
    });
    expect(result).toEqual(participant);
  });

  it('should return null when not found', async () => {
    const userId = 'user-1';
    const retroId = 'retro-1';

    participantRepo.findOne.mockResolvedValueOnce(null);

    const result = await service.findParticipantByUserIdAndRetroId(userId, retroId);

    expect(participantRepo.findOne).toHaveBeenCalledWith({
      where: { userId, retroId },
    });
    expect(result).toBeNull();
  });
});
