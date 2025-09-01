import { Test, TestingModule } from '@nestjs/testing';
import { RetroService } from '../../src/services/retro.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Retro } from '../../src/entities/retro.entity';
import { RetroItem } from '../../src/entities/retro-item.entity';
import { Participant } from '../../src/entities/participant.entity';
import { ParticipantGateway } from '../../src/gateways/participant.gateways';
import { NotFoundException } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';   // ✅ tambahin DataSource
import { format } from 'path';

const queryBuilderMock = {
  innerJoin: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  getCount: jest.fn(),
};

const mockRetroRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => queryBuilderMock)

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
const mockEntityManager = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockDataSource = {
  transaction: jest.fn().mockImplementation(async (cb) => {
    return cb(mockEntityManager);
  }),
};

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
          { provide: DataSource, useValue: mockDataSource }, // penting ini

        {
          // ✅ DataSource dummy biar dependency RetroService terpenuhi
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(),
            getRepository: jest.fn(),
            manager: {},
          },
        },
      ],
    }).compile();

    service = module.get<RetroService>(RetroService);
    retroRepository = module.get(getRepositoryToken(Retro));
    participantRepository = module.get(getRepositoryToken(Participant));
    gateway = module.get(ParticipantGateway);
  });

  // ... semua test case kamu tetap sama
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
  const dto = {
    title: 'Sprint 1',
    createdBy: 'user1',
    facilitator: 'user1',
    format: 'happy_sad_confused',
  };

  // mock manager di dalam transaction
  const mockEntityManager = {
    create: jest.fn().mockImplementation((Entity, data) => ({ ...data })),
    save: jest.fn().mockImplementation(async (entity) => entity),
  };

  // mock transaction di DataSource
  (service['dataSource'] as any).transaction = jest
    .fn()
    .mockImplementation(async (cb) => cb(mockEntityManager));

  const result = await service.create(dto);

  // cek hasil create
  expect(result).toEqual({
    id: expect.any(String),
    title: dto.title,
    format: dto.format,
    createdBy: dto.createdBy,
    facilitator: dto.facilitator,
    status: 'draft',
    currentPhase: 'lobby',
  });

  // cek create & save di manager terpanggil
  expect(mockEntityManager.create).toHaveBeenCalledTimes(2); // Retro + Participant
  expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
});

it('✅ should remove participant and broadcast when retro & participant exist', async () => {
    const retroId = 'retro-1';
    const userId = 'user-1';

    const fakeRetro = { id: retroId } as Retro;
    const fakeParticipant: Partial<Participant> = {
      id: 1,
      retroId,
      userId,
    };
    (retroRepository.findOne as jest.Mock).mockResolvedValueOnce(fakeRetro);
    (participantRepository.findOne as jest.Mock).mockResolvedValueOnce(fakeParticipant);
    (participantRepository.remove as jest.Mock).mockResolvedValueOnce(undefined);

    await expect(service.leave(retroId, userId)).resolves.toBeUndefined();

    expect(retroRepository.findOne).toHaveBeenCalledWith({ where: { id: retroId } });
    expect(participantRepository.findOne).toHaveBeenCalledWith({
      where: { retroId, userId },
    });
    expect(participantRepository.remove).toHaveBeenCalledWith(fakeParticipant);
    expect(gateway.broadcastParticipantUpdate).toHaveBeenCalledWith(retroId);
  });

  it('🚫 should throw NotFoundException when retro does not exist', async () => {
    const retroId = 'retro-missing';
    const userId = 'user-1';

    (retroRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

    await expect(service.leave(retroId, userId)).rejects.toBeInstanceOf(NotFoundException);

    expect(retroRepository.findOne).toHaveBeenCalledWith({ where: { id: retroId } });
    // tidak lanjut cek participant / remove / broadcast
    expect(participantRepository.findOne).not.toHaveBeenCalled();
    expect(participantRepository.remove).not.toHaveBeenCalled();
    expect(gateway.broadcastParticipantUpdate).not.toHaveBeenCalled();
  });

  it('🧍 should do nothing (no remove, no broadcast) when participant not found', async () => {
    const retroId = 'retro-1';
    const userId = 'user-2';

    const fakeRetro = { id: retroId } as Retro;

    (retroRepository.findOne as jest.Mock).mockResolvedValueOnce(fakeRetro);
    (participantRepository.findOne as jest.Mock).mockResolvedValueOnce(null);

    await expect(service.leave(retroId, userId)).resolves.toBeUndefined();

    expect(retroRepository.findOne).toHaveBeenCalledWith({ where: { id: retroId } });
    expect(participantRepository.findOne).toHaveBeenCalledWith({
      where: { retroId, userId },
    });
    expect(participantRepository.remove).not.toHaveBeenCalled();
    expect(gateway.broadcastParticipantUpdate).not.toHaveBeenCalled();
  });

  it('💥 should propagate error if remove fails and not broadcast', async () => {
    const retroId = 'retro-1';
    const userId = 'user-3';

    const fakeRetro = { id: retroId } as Retro;
    const fakeParticipant: Partial<Participant> = {
      id: 1,
      retroId,
      userId,
    };
    (retroRepository.findOne as jest.Mock).mockResolvedValueOnce(fakeRetro);
    (participantRepository.findOne as jest.Mock).mockResolvedValueOnce(fakeParticipant);
    (participantRepository.remove as jest.Mock).mockRejectedValueOnce(new Error('DB remove failed'));

    await expect(service.leave(retroId, userId)).rejects.toThrow('DB remove failed');

    expect(participantRepository.remove).toHaveBeenCalledWith(fakeParticipant);
    // karena remove gagal, tidak boleh broadcast
    expect(gateway.broadcastParticipantUpdate).not.toHaveBeenCalled();
  });

  it('should update status and broadcast event', async () => {
    const retro = { id: '1', status: 'draft' };
    (retroRepository.findOne as jest.Mock).mockResolvedValue(retro);
    (retroRepository.save as jest.Mock).mockResolvedValue({ ...retro, status: 'ongoing' });

    const result = await service.updateRetroStatus('1', 'ongoing');
    expect(result.status).toBe('ongoing');
    expect(gateway.broadcastRetroStarted).toHaveBeenCalledWith('1');
  });

  it('should update status and broadcast event', async () => {
    const retro = { id: '1', status: 'draft' };
    (retroRepository.findOne as jest.Mock).mockResolvedValue(retro);
    (retroRepository.save as jest.Mock).mockResolvedValue({ ...retro, status: 'completed' });

    const result = await service.updateRetroStatus('1', 'completed');
    expect(result.status).toBe('completed');
    expect(gateway.broadcastRetroCompleted).toHaveBeenCalledWith('1');
  });

    it('error update status because retro id not found', async () => {
    (retroRepository.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.updateRetroStatus('1', 'completed')).rejects.toThrow(NotFoundException);
  });

  it('should update phase and broadcast event', async () => {
    const retro = { id: '1', currentPhase: 'lobby' };
    (retroRepository.findOne as jest.Mock).mockResolvedValue(retro);
    (retroRepository.save as jest.Mock).mockResolvedValue({ ...retro, currentPhase: 'prime-directive' });

    const result = await service.updateRetroPhase('1', 'prime-directive');
    expect(result.currentPhase).toBe('prime-directive');
    expect(gateway.broadcastPhaseChange).toHaveBeenCalledWith('1', 'prime-directive');
  });

  it('error update phase because retro id not found', async () => {
    (retroRepository.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.updateRetroPhase('1', 'completed')).rejects.toThrow(NotFoundException);
  });

it('should return retros with pagination', async () => {
  // Arrange
  const fakeRetros = [{ id: '1', title: 'Retro 1' }] as Retro[];
  const queryBuilder = retroRepository.createQueryBuilder();

  // 👉 kasih nilai balik
  (queryBuilder.getManyAndCount as jest.Mock).mockResolvedValue([fakeRetros, 1]);

  // Act
  const result = await service.findWithPagination('user-123', 10, 0);

  // Assert
  expect(retroRepository.createQueryBuilder).toHaveBeenCalledWith('retro');
  expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
    'retro.participants',
    'participant',
  );

  expect(queryBuilder.where).toHaveBeenCalledWith(
      'participant.userId = :userId',
      { userId: 'user-123' },
    );
  expect(result).toEqual([fakeRetros, 1]);
});

  it('should return count of retros for a user', async () => {
    
    const queryBuilder = retroRepository.createQueryBuilder();
    (queryBuilder.getCount as jest.Mock).mockResolvedValue(3);

    const result = await service.count('user-123');

    // Assert
    expect(retroRepository.createQueryBuilder).toHaveBeenCalledWith('retro');
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'retro.participants',
      'participant',
    );
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'participant.userId = :userId',
      { userId: 'user-123' },
    );
    expect(result).toBe(3);
  });
  it('should return count of retros by status for a user', async () => {
    // Arrange
      const queryBuilder = retroRepository.createQueryBuilder();

    (queryBuilder.getCount as jest.Mock).mockResolvedValue(5);

    // Act
    const result = await service.countByStatus('active', 'user-123');

    // Assert
    expect(retroRepository.createQueryBuilder).toHaveBeenCalledWith('retro');
    expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
      'retro.participants',
      'participant',
    );
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'participant.userId = :userId',
      { userId: 'user-123' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'retro.status = :status',
      { status: 'active' },
    );
    expect(result).toBe(5);
  });

});
