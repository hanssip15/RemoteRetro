import { Test, TestingModule } from '@nestjs/testing';
import { RetroService } from '../src/services/retro.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Retro } from '../src/entities/retro.entity';
import { RetroItem } from '../src/entities/retro-item.entity';
import { Participant } from '../src/entities/participant.entity';
import { ParticipantGateway } from '../src/gateways/participant.gateways';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

const mockRetroRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
  })),
});

const mockParticipantRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockRetroItemRepository = () => ({});

const mockGateway = () => ({
  broadcastParticipantUpdate: jest.fn(),
  broadcastRetroStarted: jest.fn(),
  broadcastRetroCompleted: jest.fn(),
  broadcastPhaseChange: jest.fn(),
});

describe('RetroService', () => {
  let service: RetroService;
  let retroRepository: Repository<Retro>;
  let participantRepository: Repository<Participant>;
  let gateway: ParticipantGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetroService,
        { provide: getRepositoryToken(Retro), useFactory: mockRetroRepository },
        { provide: getRepositoryToken(RetroItem), useFactory: mockRetroItemRepository },
        { provide: getRepositoryToken(Participant), useFactory: mockParticipantRepository },
        { provide: ParticipantGateway, useFactory: mockGateway },
      ],
    }).compile();

    service = module.get<RetroService>(RetroService);
    retroRepository = module.get(getRepositoryToken(Retro));
    participantRepository = module.get(getRepositoryToken(Participant));
    gateway = module.get(ParticipantGateway);
  });

  it('should return all retros', async () => {
    const retros = [{ id: '1' }, { id: '2' }];
    (retroRepository.find as jest.Mock).mockResolvedValue(retros);  
    const result = await service.findAll();
    expect(result).toEqual(retros);
    expect(retroRepository.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
  });

  it('should throw if retro not found in findOne', async () => {
    (retroRepository.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.findOne('123')).rejects.toThrow(NotFoundException);
  });

  it('should return retro and participants in findOne', async () => {
    const retro = { id: '1' };
    const participants = [{ id: 'p1' }];
    (retroRepository.findOne as jest.Mock).mockResolvedValue(retro);
    (participantRepository.find as jest.Mock).mockResolvedValue(participants);

    const result = await service.findOne('1');
    expect(result).toEqual({ retro, participants });
  });

  it('should create and save a retro', async () => {
    const dto = { title: 'Sprint 1', createdBy: 'user1', facilitator: 'user1' };
    const mockRetro = { id: 'uuid', ...dto };
    (retroRepository.create as jest.Mock).mockReturnValue(mockRetro);
    (retroRepository.save as jest.Mock).mockResolvedValue(mockRetro);

    const result = await service.create(dto);
    expect(result).toEqual(mockRetro);
    expect(retroRepository.create).toHaveBeenCalled();
    expect(retroRepository.save).toHaveBeenCalledWith(mockRetro);
  });

  it('should update status and broadcast event', async () => {
    const retro = { id: '1', status: 'draft' };
    (retroRepository.findOne as jest.Mock).mockResolvedValue(retro);
    (retroRepository.save as jest.Mock).mockResolvedValue({ ...retro, status: 'completed' });
    const dto = { status: 'completed' };

    const result = await service.updateStatus('1', dto);
    expect(result.status).toBe('completed');
    expect(gateway.broadcastRetroCompleted).toHaveBeenCalledWith('1');
  });

  it('should remove retro if found', async () => {
    (retroRepository.delete as jest.Mock).mockResolvedValue({ affected: 1 });
    await service.remove('1');
    expect(retroRepository.delete).toHaveBeenCalledWith('1');
  });

  it('should throw if retro not found in remove', async () => {
    (retroRepository.delete as jest.Mock).mockResolvedValue({ affected: 0 });
    await expect(service.remove('not-found')).rejects.toThrow(NotFoundException);
  });
});
